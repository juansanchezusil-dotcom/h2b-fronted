'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles, Copy, Download, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useBackToClose } from '@/hooks/useBackToClose';

interface CVBuilderModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  // Se llama cuando el CV queda guardado con éxito, para refrescar el estado del checklist
  onSaved?: () => void;
}

interface CVResult {
  summary: string;
  experience_bullets: string[];
  skills: string[];
  full_text: string;
  notes_es?: string;
}

const MIN_CV_LENGTH = 30;

export default function CVBuilderModal({ isOpen, userId, onClose, onSaved }: CVBuilderModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [targetRole, setTargetRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [englishLevel, setEnglishLevel] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [baseCvText, setBaseCvText] = useState('');
  const [result, setResult] = useState<CVResult | null>(null);

  // Carga lo que ya haya guardado, y precarga desde el perfil inicial si es la primera vez
  useEffect(() => {
    if (!isOpen || !userId) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('target_role, industry, experience_level, english_level, skills, base_cv_text, experiencia_industria, nivel_ingles, anos_experiencia')
        .eq('id', userId)
        .maybeSingle();
      if (!data) return;
      setTargetRole(data.target_role || '');
      setIndustry(data.industry || data.experiencia_industria || '');
      setExperienceLevel(data.experience_level || (data.anos_experiencia != null ? `${data.anos_experiencia} años` : ''));
      setEnglishLevel(data.english_level || data.nivel_ingles || '');
      setSkillsText((data.skills || []).join(', '));
      setBaseCvText(data.base_cv_text || '');
    })();
  }, [isOpen, userId]);

  useBackToClose(isOpen, onClose);
  if (!isOpen) return null;

  const skills = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
  const canGenerate = baseCvText.trim().length >= MIN_CV_LENGTH;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cv/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseCvText, skills, targetRole, industry, experienceLevel, englishLevel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el CV.');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo generar el CV. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error: dbError } = await supabase.from('profiles').upsert({
      id: userId,
      target_role: targetRole,
      industry,
      experience_level: experienceLevel,
      english_level: englishLevel,
      skills,
      base_cv_text: baseCvText,
    });
    setSaving(false);
    if (dbError) {
      setError('No se pudo guardar tu CV. Intenta de nuevo.');
      return;
    }
    onSaved?.();
    onClose();
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.full_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copia tu CV manualmente:', result.full_text);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.full_text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CV_H2B.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08131F]/80 backdrop-blur-md p-4">
      {/* Shell fijo (no scrollea): así el botón cerrar no se va con el contenido */}
      <div className="relative w-full max-w-2xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-20 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 text-lg font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="max-h-[92vh] overflow-y-auto p-6 md:p-8">

        <div className="mb-5">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#C89B3C] bg-[#C89B3C]/10 rounded-full mb-3">
            Adaptador de CV
          </span>
          <h2 className="text-2xl font-extrabold text-[#08131F] dark:text-white">Tu currículum en inglés</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cuéntanos tu experiencia real, en tus propias palabras. La IA solo la reescribe y ordena en formato
            americano — nunca agrega experiencia que no diste. Este CV también se usa para personalizar tus correos
            de postulación.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cv-target-role" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Puesto al que apuntas</label>
              <input
                id="cv-target-role"
                type="text"
                placeholder="Ej: Housekeeper"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white p-2.5 text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/20"
              />
            </div>
            <div>
              <label htmlFor="cv-english-level" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nivel de inglés</label>
              <select
                id="cv-english-level"
                value={englishLevel}
                onChange={(e) => setEnglishLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white p-2.5 text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/20"
              >
                <option value="">Selecciona</option>
                <option value="Ninguno">Ninguno / Muy básico</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado / Fluido</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="cv-skills" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Habilidades (separadas por coma)</label>
            <input
              id="cv-skills"
              type="text"
              placeholder="Ej: housekeeping, trabajo en equipo, manejo de maquinaria"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white p-2.5 text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/20"
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label htmlFor="cv-base-text" className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Tu experiencia laboral, en tus palabras</label>
              <span className={`text-[10px] ${baseCvText.trim().length < MIN_CV_LENGTH ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {baseCvText.trim().length} / {MIN_CV_LENGTH} mínimo
              </span>
            </div>
            <textarea
              id="cv-base-text"
              rows={6}
              placeholder="Ej: Trabajé 3 años en el hotel X limpiando habitaciones, también ayudé a entrenar a compañeros nuevos. Antes trabajé un año en un restaurante como ayudante de cocina..."
              value={baseCvText}
              onChange={(e) => setBaseCvText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white p-3 text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/20"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              No hace falta que suene perfecto ni en inglés. Mientras más detalle real des (empresas, tiempo, tareas), mejor sale tu CV.
            </p>
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#08131F] py-3 text-sm font-bold text-white shadow-md hover:bg-[#08131F]/90 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#C89B3C]" />}
            {loading ? 'Generando tu CV...' : 'Generar mi CV en inglés con IA'}
          </button>

          {result && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Vista previa</h3>
              <pre className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 max-h-64 overflow-y-auto font-sans">
                {result.full_text}
              </pre>
              {result.notes_es && (
                <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2">
                  💡 {result.notes_es}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 dark:text-slate-200 rounded-xl py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 dark:text-slate-200 rounded-xl py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar .txt
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 rounded-xl border border-slate-300 dark:border-slate-700 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canGenerate}
              className="w-2/3 rounded-xl bg-[#C89B3C] py-3 text-sm font-bold text-[#08131F] shadow-md hover:bg-[#b08833] disabled:opacity-50 transition"
            >
              {saving ? 'Guardando...' : 'Guardar mi CV'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
