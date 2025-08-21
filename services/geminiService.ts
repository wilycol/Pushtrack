import { GoogleGenAI, Type } from "@google/genai";
import { PushtrackTask, AIQuestion } from "../types";

// --- Provider Selection & Orchestration ---
const PROVIDER_KEY = "ai.provider";
const OPENAI_KEY_NAME = 'OPENAI_API_KEY';
export type AIProvider = 'gemini' | 'openai';
export const FAILOVER_KEY_MISSING = 'FAILOVER_KEY_MISSING';


/**
 * Gets the currently selected AI provider from localStorage.
 * @returns The current provider, defaulting to 'gemini'.
 */
export function getProvider(): AIProvider {
    return (localStorage.getItem(PROVIDER_KEY) as AIProvider) || 'gemini';
}

/**
 * Sets the AI provider in localStorage and notifies other components.
 * @param provider The provider to set as the default.
 */
function setProvider(provider: AIProvider) {
    localStorage.setItem(PROVIDER_KEY, provider);
    window.dispatchEvent(new Event('storage'));
}

// --- Gemini Implementation ---
async function callGemini(contents: any, config?: any): Promise<string> {
    // Per guidelines, API key must be sourced directly from process.env.API_KEY
    if (!process.env.API_KEY) {
        throw new Error("Gemini API key is not available in process.env.API_KEY.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        ...(config && { config }),
    });

    if (response?.candidates?.[0]?.finishReason === 'SAFETY' || response?.candidates?.[0]?.finishReason === 'RECITATION') {
        throw new Error(`Gemini API call blocked due to: ${response.candidates[0].finishReason}`);
    }
    
    const text = response.text;
    if (!text && response?.candidates?.[0]?.finishReason !== 'STOP') {
        throw new Error("Gemini API returned an empty response or was blocked.");
    }
    return text || "";
}

// --- OpenAI Implementation ---
async function callOpenAI(messages: {role: string, content: string}[], params: { temperature?: number, max_tokens?: number, json_mode?: boolean } = {}): Promise<string> {
    const openAiApiKey = localStorage.getItem(OPENAI_KEY_NAME);
    if (!openAiApiKey) {
        // This will be caught by runAI and trigger failover logic which may prompt the UI.
        throw new Error("OpenAI API key is not configured in the session.");
    }
    
    const body: any = {
        model: "gpt-4o-mini",
        messages,
        temperature: params.temperature ?? 0.2,
        max_tokens: params.max_tokens ?? 1024,
    };

    if (params.json_mode) {
        body.response_format = { type: "json_object" };
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + openAiApiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`OpenAI API request failed: ${errorData?.error?.message}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
}

/**
 * Main AI orchestrator. Tries the preferred provider, then fails over to the other.
 * @param geminiPrompt The prompt for Gemini.
 * @param openAIMessages The prompt for OpenAI.
 * @param geminiConfig Optional config for Gemini.
 * @param openAIParams Optional params for OpenAI.
 * @returns The AI-generated text.
 */
async function runAI(geminiPrompt: any, openAIMessages: any[], geminiConfig?: any, openAIParams?: any): Promise<string> {
    const provider = getProvider();
    
    const tryProvider = async (p: AIProvider) => {
        console.log(`[AI] Attempting with ${p}...`);
        return p === 'gemini'
            ? await callGemini(geminiPrompt, geminiConfig)
            : await callOpenAI(openAIMessages, openAIParams);
    };

    try {
        return await tryProvider(provider);
    } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
        console.error(`[AI] Provider ${provider} failed:`, errorMessage);
        
        const failoverProvider: AIProvider = provider === 'gemini' ? 'openai' : 'gemini';
        
        // If failover is to OpenAI and key is missing, throw a specific error for the UI to handle.
        if (failoverProvider === 'openai' && !localStorage.getItem(OPENAI_KEY_NAME)) {
            console.warn('[AI] Failover to OpenAI requires API key. Prompting UI.');
            throw new Error(FAILOVER_KEY_MISSING);
        }

        console.log(`[AI] Failing over to ${failoverProvider}...`);

        try {
            const result = await tryProvider(failoverProvider);
            console.log(`[AI] Failover to ${failoverProvider} successful. Setting as new default.`);
            setProvider(failoverProvider); // Switch to the working provider
            return result;
        } catch (failoverError: any) {
             const failoverErrorMessage = failoverError instanceof Error ? failoverError.message : (typeof failoverError === 'string' ? failoverError : JSON.stringify(failoverError));
             console.error(`[AI] Failover provider ${failoverProvider} also failed:`, failoverErrorMessage);
             throw new Error("AI call failed: Both providers failed.");
        }
    }
}


// --- Specific Task Implementations ---

const languageMap: { [key: string]: string } = {
    en: 'English',
    es: 'Spanish',
    ar: 'Arabic',
};

export const translateText = async (textToTranslate: string, targetLanguageCode: string): Promise<string> => {
    if (!textToTranslate?.trim()) return "";
    const targetLanguage = languageMap[targetLanguageCode] || 'English';

    const geminiPrompt = `Translate the following text into ${targetLanguage}. The text is from a project management tool. Preserve the special mention format @{email|Name} exactly as it is. Only return the translated text. Text to translate:\n---\n${textToTranslate}`;
    
    const openAIMessages = [
        { role: "system", content: `You are a professional translator. Translate the user's text to ${targetLanguage}. Preserve the special mention format @{email|Name} exactly. Return only the translation.` },
        { role: "user", content: textToTranslate }
    ];

    return runAI(geminiPrompt, openAIMessages);
};

export const summarizeText = async (textToSummarize: string): Promise<string> => {
    if (!textToSummarize?.trim()) return "No hay descripción para resumir.";
    
    const geminiPrompt = `Resume el siguiente problema de cliente en una o dos frases concisas (máximo 40 palabras). El resumen debe ser neutral y directo, ideal para que un agente de soporte entienda el problema rápidamente. Texto a resumir:\n---\n${textToSummarize}\n---\nResumen:`;

    const openAIMessages = [
        { role: "system", content: "You are an expert assistant who summarizes customer issues into one or two concise sentences (max 40 words), in neutral Spanish. Extract only the core problem." },
        { role: "user", content: textToSummarize }
    ];

    return runAI(geminiPrompt, openAIMessages);
};

export const generateAIQuestions = async (ticket: PushtrackTask): Promise<AIQuestion[]> => {
    const context = `Título: ${ticket.titulo}\nDescripción: ${ticket.descripcion}\nEstado Actual: ${ticket.estado}`;
    const promptText = `Basado en el siguiente PQR en estado '${ticket.estado}', genera entre 1 y 3 preguntas contextuales y concisas para ayudar a clarificar o desbloquear el trabajo. Marca como 'crítica' cualquier pregunta que sea bloqueante para avanzar al siguiente estado. Contexto:\n---\n${context}\n---`;

    const geminiConfig = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { question: { type: Type.STRING }, is_critical: { type: Type.BOOLEAN } },
                        required: ['question', 'is_critical']
                    }
                }
            },
            required: ['questions']
        }
    };
    
    const openAIMessages = [
        { role: "system", content: `You analyze project tasks and generate 1-3 contextual questions to clarify or unblock work. Respond in this exact JSON format: { "questions": [{ "question": "string", "is_critical": boolean }] }. A question is 'critical' if it's a blocker. The user will provide the task context.` },
        { role: "user", content: promptText }
    ];

    try {
        const jsonStr = await runAI(promptText, openAIMessages, geminiConfig, { json_mode: true });
        const jsonResponse = JSON.parse(jsonStr);
        const generatedQuestions: { question: string, is_critical: boolean }[] = jsonResponse.questions || [];
        
        return generatedQuestions.map(q => ({
            id: `aiq-${crypto.randomUUID()}`,
            question: q.question,
            is_critical: q.is_critical,
            answer: null,
        }));
    } catch (error) {
        console.error(`Error processing AI Questions response:`, error);
        throw new Error("Failed to generate or parse AI questions.");
    }
};