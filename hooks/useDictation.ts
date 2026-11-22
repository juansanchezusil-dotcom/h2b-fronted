'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { reportError } from '@/lib/reportError';

// Tipos mínimos de la API de dictado del navegador (no viene en los tipos de TypeScript)
interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionCtor = new () => RecognitionLike;

// Mensaje para la persona según el código de error del navegador
const DICTATION_ERRORS: Record<string, string> = {
  'not-allowed': 'Permite el micrófono en tu navegador para dictar.',
  'service-not-allowed': 'Tu navegador no permite el dictado. Prueba en Chrome o Edge.',
  'audio-capture': 'No encontramos un micrófono. Revisa que esté conectado.',
  network: 'El dictado necesita internet. Revisa tu conexión e intenta de nuevo.',
  'language-not-supported': 'Tu navegador no tiene dictado en español. Prueba en Chrome o Edge.',
};

function getCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// Dictado por voz: cada frase terminada se entrega a onText. Si el navegador no lo soporta, supported es false.
export function useDictation(onText: (text: string) => void, lang = 'es-419') {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<RecognitionLike | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);
  const [supported] = useState(() => getCtor() !== null);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    setError(null);
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onTextRef.current(r[0].transcript.trim());
      }
    };
    rec.onerror = (e) => {
      // Silencio o la persona lo detuvo: no es una falla
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setError(DICTATION_ERRORS[e.error] || 'No se pudo usar el dictado. Intenta de nuevo o escribe.');
      // Llega al panel de errores del admin: así un bloqueo general (como el del 21-nov) se ve sin que nadie avise
      reportError('error', `Dictado: ${e.error}`);
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (err) {
      // Antes este error se perdía y el botón quedaba sin hacer nada
      setListening(false);
      recRef.current = null;
      setError('No se pudo iniciar el dictado. Recarga la página o escribe tu respuesta.');
      reportError('error', err instanceof Error ? new Error(`Dictado al iniciar: ${err.message}`) : 'Dictado al iniciar');
    }
  }, [lang]);

  useEffect(() => () => recRef.current?.stop(), []);

  return { supported, listening, error, start, stop };
}
