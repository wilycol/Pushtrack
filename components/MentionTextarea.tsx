import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Mention } from '../types';

interface MentionTextareaProps {
    users: User[];
    initialValue: string;
    onSave: (data: { raw_text: string; mentions: { email: string; full_name: string }[] }) => void;
    placeholder?: string;
}

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): void => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };
}

const MentionTextarea: React.FC<MentionTextareaProps> = ({ users, initialValue, onSave, placeholder }) => {
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const inputRef = useRef<HTMLDivElement>(null);
    const lastMentionRef = useRef<{ term: string, position: number } | null>(null);
    const isInternallyUpdating = useRef(false);

    // Converts raw text like "Hello @{email|Name}" to HTML with styled spans for mentions
    const renderTextWithMentions = (rawText: string): string => {
        if (!rawText) return '';
        // Basic escaping to prevent HTML injection from raw text parts
        const escapedText = rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const mentionRegex = /@\{([^|}]+)\|([^}]+)\}/g;
        return escapedText.replace(mentionRegex, (match, email, name) => 
            `<span class="bg-indigo-500/30 text-indigo-300 font-semibold px-1 rounded-sm mx-0.5" contenteditable="false" data-mention-email="${email}" data-mention-name="${name}">@${name}</span>`
        );
    };

    // Parses the editor's innerHTML back into the raw text format
    const parseHtmlToRaw = (element: HTMLElement): string => {
        let rawText = '';
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                rawText += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.tagName === 'SPAN' && el.dataset.mentionEmail) {
                    rawText += `@{${el.dataset.mentionEmail}|${el.dataset.mentionName}}`;
                } else if (el.tagName === 'DIV') {
                    if (rawText.length > 0 && !rawText.endsWith('\n')) rawText += '\n';
                    rawText += parseHtmlToRaw(el);
                } else if (el.tagName === 'BR') {
                    rawText += '\n';
                } else {
                    rawText += el.textContent;
                }
            }
        });
        return rawText.replace(/\u00A0/g, ' '); // Replace non-breaking spaces with regular spaces
    };
    
    // Extracts mentions from the raw text for the onSave callback
    const parseTextForSave = (currentText: string): { raw_text: string; mentions: Mention[] } => {
        const mentionRegex = /@\{([^|}]+)\|([^}]+)\}/g;
        const mentions: Mention[] = [];
        let match;
        while ((match = mentionRegex.exec(currentText)) !== null) {
            const mention = { email: match[1], full_name: match[2] };
            if (!mentions.some(m => m.email === mention.email)) {
                mentions.push(mention);
            }
        }
        return { raw_text: currentText, mentions };
    };

    const debouncedSave = useCallback(
        debounce((newText: string) => {
            isInternallyUpdating.current = true;
            onSave(parseTextForSave(newText));
        }, 300),
        [onSave]
    );

    // Effect to sync the editor when the initialValue prop changes from the parent
    useEffect(() => {
        if (isInternallyUpdating.current) {
            isInternallyUpdating.current = false;
            return;
        }
        if (inputRef.current) {
            const currentRawText = parseHtmlToRaw(inputRef.current);
            if(initialValue !== currentRawText) {
                inputRef.current.innerHTML = renderTextWithMentions(initialValue);
            }
        }
    }, [initialValue]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const root = e.currentTarget;
        const rawText = parseHtmlToRaw(root);
        
        debouncedSave(rawText);

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            setShowSuggestions(false);
            return;
        }

        const range = selection.getRangeAt(0);
        // Ensure we are working with a text node
        if (range.startContainer.nodeType !== Node.TEXT_NODE) {
             setShowSuggestions(false);
             return;
        }

        const textBeforeCursor = range.startContainer.textContent?.substring(0, range.startOffset) || '';
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            const term = mentionMatch[1].toLowerCase();
            lastMentionRef.current = { term, position: range.startOffset };
            
            const filteredUsers = users
                .filter(u => u.full_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
                .slice(0, 5);
            
            setSuggestions(filteredUsers);
            setShowSuggestions(filteredUsers.length > 0);
            setActiveSuggestionIndex(0);
        } else {
            setShowSuggestions(false);
            lastMentionRef.current = null;
        }
    };
    
    // Inserts the selected user mention into the editor
    const handleSelectSuggestion = (user: User) => {
        const editor = inputRef.current;
        const selection = window.getSelection();
        if (!editor || !selection || selection.rangeCount === 0 || !lastMentionRef.current) return;

        const { term } = lastMentionRef.current;
        const range = selection.getRangeAt(0);
        
        // Replace the @term with the mention span
        range.setStart(range.startContainer, range.startOffset - term.length - 1);
        range.deleteContents();

        const mentionNode = document.createElement('span');
        mentionNode.className = "bg-indigo-500/30 text-indigo-300 font-semibold px-1 rounded-sm mx-0.5";
        mentionNode.setAttribute('contenteditable', 'false');
        mentionNode.dataset.mentionEmail = user.email;
        mentionNode.dataset.mentionName = user.full_name;
        mentionNode.textContent = `@${user.full_name}`;
        range.insertNode(mentionNode);

        // Add a non-breaking space after the mention and move cursor
        const spaceNode = document.createTextNode('\u00A0'); 
        range.setStartAfter(mentionNode);
        range.collapse(true);
        range.insertNode(spaceNode);
        
        // Reset selection to be after the space
        selection.removeAllRanges();
        range.setStartAfter(spaceNode);
        range.collapse(true);
        selection.addRange(range);
        
        setShowSuggestions(false);
        lastMentionRef.current = null;
        editor.focus();
        
        // Trigger an update with the new raw text
        const rawText = parseHtmlToRaw(editor);
        onSave(parseTextForSave(rawText));
    };


    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                handleSelectSuggestion(suggestions[activeSuggestionIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowSuggestions(false);
            }
        }
    };

    return (
        <div className="relative">
            <div
                ref={inputRef}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                className="block w-full min-h-[40px] rounded-md border-0 bg-[#121A2B] text-slate-200 shadow-sm ring-1 ring-inset ring-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 p-2 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-500"
                data-placeholder={placeholder}
            ></div>
            {showSuggestions && (
                <ul className="absolute z-10 mt-1 w-full bg-[#1B2437] shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm max-h-60">
                    {suggestions.map((user, index) => (
                        <li
                            key={user.email}
                            onClick={() => handleSelectSuggestion(user)}
                            onMouseOver={() => setActiveSuggestionIndex(index)}
                            className={`cursor-pointer select-none relative py-2 px-3 ${index === activeSuggestionIndex ? 'text-white bg-indigo-600' : 'text-slate-200'}`}
                        >
                            <span className="font-semibold block truncate">{user.full_name}</span>
                            <span className={`text-xs ${index === activeSuggestionIndex ? 'text-indigo-200' : 'text-slate-500'}`}>{user.email}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MentionTextarea;
