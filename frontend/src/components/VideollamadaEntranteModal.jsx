// Modal global para videollamadas entrantes
import { useEffect, useRef, useCallback } from "react";
import { useChat } from "@/context/ChatContext";

export default function VideollamadaEntranteModal() {
  const { llamadaEntrante, aceptarLlamada, rechazarLlamada } = useChat();
  const ringtoneRef = useRef(null);
  const ringtoneIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const webAudioIntervalRef = useRef(null);

  // Reproducir tono con Web Audio API
  const reproducirTonoWebAudio = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;

      // Reanudar si está suspendido
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Crear dos osciladores para el sonido de teléfono clásico
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      osc1.type = "sine";
      osc2.type = "sine";
      gain.gain.value = 0.4;

      osc1.start();
      osc2.start();

      // Patrón: 400ms on, 200ms off, 400ms on
      setTimeout(() => {
        gain.gain.setValueAtTime(0, ctx.currentTime);
      }, 400);
      setTimeout(() => {
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
      }, 600);
      setTimeout(() => {
        osc1.stop();
        osc2.stop();
      }, 1000);
    } catch (e) {
    }
  }, []);

  // Reproducir ringtone cuando hay llamada entrante
  useEffect(() => {
    if (llamadaEntrante) {
      // Variables locales para cleanup
      let ringtoneAudio = null;
      let webAudioIntId = null;
      let vibracionInterval = null;

      // Mostrar notificación del sistema (puede tener sonido propio)
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("📞 Videollamada entrante", {
            body: `${llamadaEntrante.nombreLlamante || "Usuario"} te está llamando`,
            icon: "/favicon.ico",
            tag: "videollamada-entrante",
            requireInteraction: true,
            vibrate: [400, 200, 400, 500],
          });
        } catch (e) {
        }
      }

      // Intentar reproducir audio HTML primero
      const playRingtone = async () => {
        try {
          if (ringtoneRef.current) {
            ringtoneRef.current.pause();
          }

          const audio = new Audio("/ringtone.wav");
          audio.volume = 1.0;
          audio.loop = true;
          ringtoneRef.current = audio;
          ringtoneAudio = audio;

          // Intentar reproducir
          await audio.play();
        } catch (e) {
          // Usar Web Audio API como fallback
          reproducirTonoWebAudio();
          webAudioIntId = setInterval(reproducirTonoWebAudio, 1500);
          webAudioIntervalRef.current = webAudioIntId;
        }
      };

      // Vibrar en móviles
      const vibrarTelefono = () => {
        if (navigator.vibrate) {
          navigator.vibrate([400, 200, 400, 500]);
        }
      };

      playRingtone();
      vibrarTelefono();

      // Repetir vibración cada 1.5s
      vibracionInterval = setInterval(vibrarTelefono, 1500);

      return () => {
        // Limpiar al cerrar
        if (ringtoneAudio) {
          ringtoneAudio.pause();
        }
        if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current = null;
        }
        if (webAudioIntId) {
          clearInterval(webAudioIntId);
        }
        if (vibracionInterval) {
          clearInterval(vibracionInterval);
        }
        navigator.vibrate?.(0);
      };
    }
  }, [llamadaEntrante, reproducirTonoWebAudio]);

  const handleAceptar = () => {
    // Detener ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
    }
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
    }
    if (webAudioIntervalRef.current) {
      clearInterval(webAudioIntervalRef.current);
    }
    navigator.vibrate?.(0);
    aceptarLlamada();
  };

  const handleRechazar = () => {
    // Detener ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
    }
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
    }
    if (webAudioIntervalRef.current) {
      clearInterval(webAudioIntervalRef.current);
    }
    navigator.vibrate?.(0);
    rechazarLlamada();
  };

  if (!llamadaEntrante) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-pulse-slow">
        {/* Avatar animado */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-4xl font-bold animate-bounce">
              {llamadaEntrante.nombreLlamante?.charAt(0)?.toUpperCase() || "?"}
            </div>
            {/* Anillos animados */}
            <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
            <div
              className="absolute inset-[-8px] rounded-full border-2 border-green-300 animate-ping opacity-50"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>
        </div>

        {/* Información de la llamada */}
        <div className="text-center mb-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            📞 Videollamada entrante
          </p>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {llamadaEntrante.nombreLlamante || "Usuario"}
          </h2>
          <p className="text-green-500 animate-pulse mt-2">Llamando...</p>
        </div>

        {/* Botones */}
        <div className="flex justify-center gap-6">
          {/* Rechazar */}
          <button
            onClick={handleRechazar}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition-all hover:scale-110 active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Aceptar */}
          <button
            onClick={handleAceptar}
            className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition-all hover:scale-110 active:scale-95 animate-pulse"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </button>
        </div>

        {/* Texto de ayuda */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Toca el botón verde para contestar
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
