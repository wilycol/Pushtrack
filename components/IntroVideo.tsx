import React, { useState, useEffect, useRef } from 'react';

interface IntroVideoConfig {
  introVideo: {
    enabled: boolean;
    url: string;
    title: string;
    description: string;
  };
  app: {
    name: string;
    version: string;
    description: string;
  };
}

interface IntroVideoProps {
  onComplete: () => void;
}

const IntroVideo: React.FC<IntroVideoProps> = ({ onComplete }) => {
  const [config, setConfig] = useState<IntroVideoConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/config.json');
        if (!response.ok) {
          throw new Error('No se pudo cargar la configuración');
        }
        const configData = await response.json();
        setConfig(configData);
        
        // Verificar si el vídeo ya fue visto en esta sesión
        const hasSeenVideo = sessionStorage.getItem('pushtrack_intro_video_seen');
        
        if (configData.introVideo.enabled && !hasSeenVideo) {
          setIsVisible(true);
        } else {
          onComplete();
        }
      } catch (err) {
        console.error('Error cargando configuración:', err);
        setError('Error cargando la configuración');
        onComplete();
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem('pushtrack_intro_video_seen', 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleVideoEnd = () => {
    sessionStorage.setItem('pushtrack_intro_video_seen', 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleVideoError = () => {
    console.error('Error reproduciendo el vídeo');
    setError('Error reproduciendo el vídeo');
    setTimeout(() => {
      handleSkip();
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0B0F1A] z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-300 text-sm">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0B0F1A] z-50">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <p className="text-slate-400 text-xs">Redirigiendo a la aplicación...</p>
        </div>
      </div>
    );
  }

  if (!isVisible || !config?.introVideo.enabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header con título y botón de omitir */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-6 bg-gradient-to-b from-black/60 to-transparent">
          <div className="text-white">
            <h1 className="text-2xl font-bold mb-1">{config.introVideo.title}</h1>
            <p className="text-slate-300 text-sm">{config.introVideo.description}</p>
          </div>
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
          >
            Omitir Introducción
          </button>
        </div>

        {/* Video */}
        {config.introVideo.url.includes('youtube.com/embed') ? (
          <iframe
            src={`${config.introVideo.url}?autoplay=1&mute=0&controls=1&rel=0`}
            className="w-full h-96"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => {
              // YouTube iframe no tiene eventos onEnded, así que usamos un timeout
              setTimeout(() => {
                handleVideoEnd();
              }, 30000); // 30 segundos como fallback
            }}
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-auto"
            autoPlay
            loop={false}
            onEnded={handleVideoEnd}
            onError={handleVideoError}
            playsInline
          >
            <source src={config.introVideo.url} type="video/mp4" />
            Tu navegador no soporta el elemento de vídeo.
          </video>
        )}

        {/* Overlay de información */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="text-white text-center">
            <p className="text-sm text-slate-300">
              Presiona "Omitir Introducción" para continuar directamente a la aplicación
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroVideo;
