'use client';

import { useRef, useState } from 'react';
import { ShieldAlert, Upload, X, Loader2, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { aiFetch } from '@/lib/aiFetch';

const MAX_IMAGES = 5;
const REPORT_URL = 'https://travel.state.gov/en/report-visa-fraud.html';

interface ScamImage {
  file: File;
  previewUrl: string;
  base64: string;
}

interface ScamResult {
  nivel: 'alto' | 'moderado' | 'bajo';
  resumen: string;
  senales: string[];
  recomendacion: string;
}

const NIVEL_STYLES: Record<ScamResult['nivel'], { badge: string; icon: typeof AlertTriangle; label: string }> = {
  alto: {
    badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
    icon: AlertTriangle,
    label: 'Riesgo alto de estafa',
  },
  moderado: {
    badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    icon: AlertTriangle,
    label: 'Señales que revisar',
  },
  bajo: {
    badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    icon: CheckCircle2,
    label: 'Riesgo bajo',
  },
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ScamDetectorTab() {
  const [images, setImages] = useState<ScamImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScamResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    setError(null);
    const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length);
    if (files.length === 0) return;
    const next: ScamImage[] = [];
    for (const file of files) {
      const base64 = await fileToBase64(file);
      next.push({ file, previewUrl: URL.createObjectURL(file), base64 });
    }
    setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
    setResult(null);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await aiFetch('/api/analyze-scam-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((img) => ({ base64: img.base64, mediaType: img.file.type })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo analizar la imagen.');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo analizar la imagen. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const nivelStyle = result ? NIVEL_STYLES[result.nivel] : null;
  const NivelIcon = nivelStyle?.icon;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="p-2.5 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Detector de Estafas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sube capturas de pantalla o fotos del documento/chat sospechoso. La IA revisa si hay señales reales de fraude H-2B.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-8 text-slate-500 dark:text-slate-400 hover:border-[#C89B3C] hover:text-[#C89B3C] transition-colors"
          >
            <Upload className="w-6 h-6" />
            <span className="text-xs font-semibold">Subir imagen o captura (hasta {MAX_IMAGES})</span>
          </button>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  aria-label={`Quitar imagen ${idx + 1}`}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={images.length === 0 || loading}
          className="w-full flex items-center justify-center gap-2 bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
          {loading ? 'Analizando...' : 'Analizar con IA'}
        </button>
      </div>

      {result && nivelStyle && NivelIcon && (
        <div className={`rounded-2xl border p-5 space-y-4 ${nivelStyle.badge}`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            <NivelIcon className="w-5 h-5" />
            {nivelStyle.label}
          </div>

          <p className="text-sm leading-relaxed">{result.resumen}</p>

          {result.senales.length > 0 && (
            <ul className="text-xs space-y-1 list-disc list-inside">
              {result.senales.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}

          <p className="text-xs font-semibold leading-relaxed">{result.recomendacion}</p>

          {result.nivel !== 'bajo' && (
            <div className="pt-3 border-t border-current/20">
              <a
                href={REPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold underline hover:no-underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Reportar fraude de visa al Departamento de Estado (travel.state.gov)
              </a>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
        ¿Ya perdiste dinero o datos personales con una oferta falsa? Repórtalo directamente en{' '}
        <a href={REPORT_URL} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
          travel.state.gov
        </a>
        , el sitio oficial del Departamento de Estado de EE. UU. para fraude de visas.
      </p>
    </div>
  );
}
