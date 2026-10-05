'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Sparkles, Copy, Download, Loader2, Check, Send, Upload, FileText, RotateCcw, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useBackToClose } from '@/hooks/useBackToClose';
import { aiFetch } from '@/lib/aiFetch';
import { buildCvDocx, buildLetterDocx, docxFileName, downloadBlob, type BuiltCv } from '@/lib/cvDocx';

interface CVBuilderModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  // Se llama cuando el CV queda guardado con éxito, para refrescar el estado del checklist
  onSaved?: () => void;
  // Oferta a la que se adapta el CV (null/undefined = CV general)
  job?: JobTarget | null;
}

interface JobTarget {
  title: string;
  employerName: string;
  location?: string;
  duties?: string;
}

interface Requirement {
  requirement_es: string;
  status: 'MATCH' | 'TRANSFERABLE' | 'MISSING' | 'UNKNOWN';
}

interface Experience {
  id: string;
  kind: string;
  title: string;
  company: string;
  location: string;
  dates: string;
  duration: string;
  tasks: string[];
  tools: string[];
  results: string[];
}

// Mismo perfil estructurado que arma el backend durante la entrevista
interface CandidateProfile {
  fullName: string;
  city: string;
  phone: string;
  email: string;
  targetRole: string;
  industry: string;
  englishLevel: string;
  route: '' | 'A' | 'B' | 'C';
  experiences: Experience[];
  education: string[];
  certifications: string[];
  languages: string[];
  skills: string[];
}

interface Gap {
  key: string;
  level: 'critical' | 'important';
  label: string;
}

interface Turn {
  role: 'user' | 'assistant';
  text: string;
}

interface InterviewReply {
  reply_es: string;
  profile: CandidateProfile;
  gaps: Gap[];
  ready: boolean;
}

interface Draft {
  profile: CandidateProfile;
  turns: Turn[];
  gaps?: Gap[];
  ready?: boolean;
}

interface CVResult {
  ruta: '' | 'A' | 'B' | 'C';
  diagnostico_es: string;
  estrategia_es: string;
  recomendaciones_es: string[];
  cv: BuiltCv;
  full_text: string;
  base_cv_text: string;
  removed: number;
  requirements?: Requirement[];
}

interface Letter {
  letter: string;
  notes_es: string;
}

type Stage = 'start' | 'chat' | 'result';

const ROUTE_LABELS: Record<string, string> = {
  A: 'Experiencia directa',
  B: 'Experiencia transferible',
  C: 'Experiencia práctica',
};

const REQUIREMENT_STYLES: Record<Requirement['status'], { label: string; style: string }> = {
  MATCH: { label: 'Coincide', style: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  TRANSFERABLE: { label: 'Transferible', style: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
  MISSING: { label: 'Te falta', style: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' },
  UNKNOWN: { label: 'Por confirmar', style: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

const CRITICAL_TOTAL = 4; // nombre, puesto, una experiencia completa y la ruta
const MAX_FILE_BYTES = 3 * 1024 * 1024;

const emptyProfile = (): CandidateProfile => ({
  fullName: '', city: '', phone: '', email: '', targetRole: '', industry: '', englishLevel: '',
  route: '', experiences: [], education: [], certifications: [], languages: [], skills: [],
});

const inputClass =
  'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white p-2.5 text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/20';

const errorClass =
  'text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2';

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export default function CVBuilderModal({ isOpen, userId, onClose, onSaved, job }: CVBuilderModalProps) {
  const [stage, setStage] = useState<Stage>('start');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pantalla de inicio
  const [targetRole, setTargetRole] = useState('');
  const [englishLevel, setEnglishLevel] = useState('');
  const [startMode, setStartMode] = useState<'scratch' | 'existing'>('scratch');
  const [file, setFile] = useState<File | null>(null);
  const [pastedCv, setPastedCv] = useState('');
  const [seedProfile, setSeedProfile] = useState<CandidateProfile>(emptyProfile());
  const [savedDraft, setSavedDraft] = useState<Draft | null>(null);

  // Entrevista
  const [profile, setProfile] = useState<CandidateProfile>(emptyProfile());
  const [turns, setTurns] = useState<Turn[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState<CVResult | null>(null);
  const [letter, setLetter] = useState<Letter | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [downloading, setDownloading] = useState<'cv' | 'letter' | null>(null);

  // Cada vez que se abre: vuelve al inicio y precarga lo que ya haya guardado
  useEffect(() => {
    if (!isOpen || !userId) return;
    setStage('start');
    setError(null);
    setResult(null);
    setLetter(null);
    setFile(null);
    setPastedCv('');
    (async () => {
      const [{ data }, { data: auth }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, target_role, industry, english_level, nivel_ingles, experiencia_industria, skills, cv_draft')
          .eq('id', userId)
          .maybeSingle(),
        supabase.auth.getUser(),
      ]);
      const seed = emptyProfile();
      seed.fullName = data?.full_name || '';
      seed.email = auth.user?.email || '';
      seed.targetRole = data?.target_role || '';
      seed.industry = data?.industry || data?.experiencia_industria || '';
      seed.englishLevel = data?.english_level || data?.nivel_ingles || '';
      seed.skills = Array.isArray(data?.skills) ? data.skills : [];
      setSeedProfile(seed);
      setTargetRole(seed.targetRole);
      setEnglishLevel(seed.englishLevel);
      const draft = data?.cv_draft;
      setSavedDraft(draft?.profile && Array.isArray(draft?.turns) ? draft : null);
    })();
  }, [isOpen, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, loading]);

  useBackToClose(isOpen, onClose);
  if (!isOpen) return null;

  const criticalGaps = gaps.filter((g) => g.level === 'critical');
  const done = Math.max(0, CRITICAL_TOTAL - criticalGaps.length);

  const saveDraft = (draft: Draft) => {
    // Sin await a propósito: si falla el guardado del borrador la entrevista sigue igual
    supabase
      .from('profiles')
      .upsert({ id: userId, cv_draft: { ...draft, turns: draft.turns.slice(-30) } })
      .then((r: { error: { message: string } | null }) => r.error && console.error('No se pudo guardar el borrador del CV:', r.error.message));
  };

  const callInterview = async (payload: Record<string, unknown>): Promise<InterviewReply> => {
    const res = await aiFetch('/api/cv/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'No se pudo procesar tu respuesta. Intenta de nuevo.');
    return data;
  };

  const applyReply = (data: InterviewReply, base: Turn[]) => {
    const nextTurns: Turn[] = [...base, { role: 'assistant', text: data.reply_es }];
    setTurns(nextTurns);
    setProfile(data.profile);
    setGaps(data.gaps);
    setReady(data.ready);
    saveDraft({ profile: data.profile, turns: nextTurns, gaps: data.gaps, ready: data.ready });
  };

  const handleStart = async () => {
    setError(null);
    const base: CandidateProfile = { ...seedProfile, targetRole: targetRole.trim(), englishLevel };
    if (!base.targetRole) {
      setError('Dinos a qué puesto apuntas para empezar.');
      return;
    }
    let doc: { base64: string; mediaType: string } | undefined;
    if (startMode === 'existing') {
      if (file) {
        if (file.size > MAX_FILE_BYTES) {
          setError('El archivo pesa más de 3 MB. Sube uno más liviano o pega el texto.');
          return;
        }
        doc = { base64: await readAsBase64(file), mediaType: file.type };
      } else if (pastedCv.trim().length < 30) {
        setError('Sube tu CV (PDF o foto) o pega su texto.');
        return;
      }
    }
    setLoading(true);
    try {
      const data = await callInterview({
        profile: base,
        turns: [],
        document: doc,
        pastedCv: startMode === 'existing' && !file ? pastedCv : undefined,
      });
      setStage('chat');
      applyReply(data, []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resumeDraft = () => {
    if (!savedDraft) return;
    setProfile(savedDraft.profile);
    setTurns(savedDraft.turns);
    setGaps(savedDraft.gaps || []);
    setReady(!!savedDraft.ready);
    setStage('chat');
  };

  // Con una oferta y un perfil ya guardado no hace falta entrevistar de nuevo: se genera directo.
  // Si el perfil no alcanza, el servidor lo dice y la persona puede seguir la conversación.
  const adaptFromDraft = async () => {
    if (!savedDraft) return;
    setProfile(savedDraft.profile);
    setTurns(savedDraft.turns);
    setGaps(savedDraft.gaps || []);
    setReady(!!savedDraft.ready);
    await handleGenerate(savedDraft.profile);
  };

  const handleLetter = async () => {
    setError(null);
    setLetterLoading(true);
    try {
      const res = await aiFetch('/api/cv/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, job: jobPayload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo generar la carta.');
      setLetter(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo generar la carta. Intenta de nuevo.');
    } finally {
      setLetterLoading(false);
    }
  };

  const handleCopyLetter = async () => {
    if (!letter) return;
    try {
      await navigator.clipboard.writeText(letter.letter);
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
    } catch {
      window.prompt('Copia tu carta manualmente:', letter.letter);
    }
  };

  const handleDownloadLetter = async () => {
    if (!letter) return;
    setDownloading('letter');
    setError(null);
    try {
      downloadBlob(await buildLetterDocx(letter.letter, profile.fullName), docxFileName(profile.fullName, 'Cover_Letter'));
    } catch (err) {
      console.error('No se pudo crear el Word de la carta:', err);
      setError('No se pudo crear el archivo Word. Usa Copiar y pégala en Word.');
    } finally {
      setDownloading(null);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const base: Turn[] = [...turns, { role: 'user', text }];
    setTurns(base);
    setInput('');
    setLoading(true);
    try {
      applyReply(await callInterview({ profile, turns: base }), base);
    } catch (err: any) {
      // Devuelve el mensaje al cuadro para que no se pierda lo que escribió
      setTurns(turns);
      setInput(text);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const jobPayload = job ? { title: job.title, employer_name: job.employerName, job_duties: job.duties } : undefined;

  const handleGenerate = async (profileArg?: CandidateProfile) => {
    setError(null);
    setLoading(true);
    try {
      const res = await aiFetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileArg || profile, job: jobPayload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el CV.');
      setResult(data);
      setLetter(null);
      setStage('result');
    } catch (err: any) {
      setError(err.message || 'No se pudo generar el CV. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);
    const { error: dbError } = await supabase.from('profiles').upsert({
      id: userId,
      target_role: profile.targetRole,
      industry: profile.industry,
      english_level: profile.englishLevel,
      skills: result.cv.skills,
      base_cv_text: result.base_cv_text,
      cv_route: result.ruta || null,
      cv_en: { cv: result.cv, full_text: result.full_text },
      cv_draft: { profile, turns: turns.slice(-30), gaps, ready },
      ...(letter ? { cover_letter_en: letter.letter } : {}),
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

  // El Word se arma en el navegador: la librería se descarga solo la primera vez que se pide
  const handleDownload = async () => {
    if (!result) return;
    setDownloading('cv');
    setError(null);
    try {
      downloadBlob(await buildCvDocx(result.cv), docxFileName(result.cv.header.fullName, 'CV'));
    } catch (err) {
      console.error('No se pudo crear el Word del CV:', err);
      setError('No se pudo crear el archivo Word. Usa Copiar y pégalo en Word.');
    } finally {
      setDownloading(null);
    }
  };

  const restart = () => {
    setProfile(emptyProfile());
    setTurns([]);
    setGaps([]);
    setReady(false);
    setSavedDraft(null);
    setStage('start');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08131F]/80 backdrop-blur-md p-4">
      {/* Shell fijo (no scrollea): así el botón cerrar no se va con el contenido */}
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-3 pr-14 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-2xl font-extrabold text-[#08131F] dark:text-white">
            {stage === 'result' ? 'Tu currículum en inglés' : job ? 'Adapta tu CV a esta oferta' : 'Arma tu CV'}
          </h2>
          {stage === 'chat' && (
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" aria-hidden="true">
                <div className="h-full bg-[#C89B3C] transition-all duration-500" style={{ width: `${(done / CRITICAL_TOTAL) * 100}%` }} />
              </div>
              <span>Datos clave: {done} de {CRITICAL_TOTAL}</span>
            </div>
          )}
        </div>

        {/* ---------- INICIO ---------- */}
        {stage === 'start' && (
          <div className="p-6 space-y-4 overflow-y-auto">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Te hago unas preguntas sobre tu experiencia real y armo tu CV en inglés. Nada se inventa: solo usamos lo que tú nos cuentes.
            </p>

            {job && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Vas a adaptar tu CV a: <strong>{job.title}</strong>
                  {job.employerName ? ` — ${job.employerName}` : ''}
                </p>
                {savedDraft && (
                  <button
                    type="button"
                    onClick={adaptFromDraft}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2.5"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? 'Adaptando...' : 'Usar mi perfil guardado y adaptar el CV'}
                  </button>
                )}
              </div>
            )}

            {savedDraft && (
              <div className="rounded-xl border border-[#C89B3C]/40 bg-amber-50 dark:bg-amber-500/10 p-3 flex items-center justify-between gap-3">
                <p className="text-xs text-amber-900 dark:text-amber-300">Tienes una conversación guardada. ¿Quieres seguir donde la dejaste?</p>
                <button
                  type="button"
                  onClick={resumeDraft}
                  className="shrink-0 text-xs font-bold bg-[#C89B3C] text-[#08131F] rounded-lg px-3 py-1.5 hover:bg-[#b08833]"
                >
                  Continuar
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cv-target-role" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Puesto al que apuntas</label>
                <input id="cv-target-role" type="text" placeholder="Ej: Housekeeper" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="cv-english-level" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nivel de inglés</label>
                <select id="cv-english-level" value={englishLevel} onChange={(e) => setEnglishLevel(e.target.value)} className={inputClass}>
                  <option value="">Prefiero decirlo después</option>
                  <option value="Básico">Básico</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado / Fluido</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Cómo quieres empezar">
              {([
                ['scratch', 'Empezar de cero', Sparkles],
                ['existing', 'Ya tengo un CV', FileText],
              ] as const).map(([mode, label, Icon]) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={startMode === mode}
                  onClick={() => setStartMode(mode)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition ${
                    startMode === mode
                      ? 'border-[#C89B3C] bg-amber-50 dark:bg-amber-500/10 text-[#08131F] dark:text-amber-300'
                      : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {startMode === 'existing' && (
              <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Upload className="w-4 h-4" />
                  {file ? file.name : 'Subir mi CV (PDF o foto, máx. 3 MB)'}
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                {!file && (
                  <>
                    <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">o pega el texto de tu CV</p>
                    <textarea
                      rows={4}
                      aria-label="Texto de tu CV"
                      value={pastedCv}
                      onChange={(e) => setPastedCv(e.target.value)}
                      placeholder="Pega aquí el contenido de tu CV..."
                      className={inputClass}
                    />
                  </>
                )}
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Leemos tu CV, resumimos lo que entendimos y solo te preguntamos lo que falte. No lo reemplazamos.
                </p>
              </div>
            )}

            {error && <p className={errorClass}>{error}</p>}

            <button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#08131F] py-3 text-sm font-bold text-white shadow-md hover:bg-[#08131F]/90 disabled:opacity-50 transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#C89B3C]" />}
              {loading ? 'Preparando...' : savedDraft ? 'Empezar de nuevo' : 'Comenzar'}
            </button>
          </div>
        )}

        {/* ---------- ENTREVISTA ---------- */}
        {stage === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-[16rem]" role="log" aria-live="polite" aria-label="Conversación">
              {turns.map((t, i) => (
                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <p
                    className={`max-w-[85%] whitespace-pre-wrap text-sm rounded-2xl px-3.5 py-2.5 ${
                      t.role === 'user'
                        ? 'bg-[#0B4079] text-white rounded-br-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md'
                    }`}
                  >
                    {t.text}
                  </p>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl px-3.5 py-2.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Pensando...
                  </p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {ready && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-2">
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">Ya tengo lo necesario. Puedes generar tu CV o seguir agregando detalle.</p>
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={loading}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-3 py-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generar mi CV
                  </button>
                </div>
              )}
              {!ready && criticalGaps.length > 0 && turns.length > 0 && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Todavía falta: {criticalGaps.map((g) => g.label.toLowerCase()).join(' · ')}</p>
              )}
              {error && <p className={errorClass}>{error}</p>}
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  aria-label="Tu respuesta"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Escribe tu respuesta con tus palabras..."
                  className={`${inputClass} resize-none`}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  aria-label="Enviar"
                  className="shrink-0 rounded-xl bg-[#C89B3C] hover:bg-[#b08833] disabled:opacity-50 text-[#08131F] p-3 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <button type="button" onClick={restart} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <RotateCcw className="w-3 h-3" /> Empezar de nuevo
              </button>
            </div>
          </>
        )}

        {/* ---------- RESULTADO ---------- */}
        {stage === 'result' && result && (
          <div className="p-6 space-y-4 overflow-y-auto">
            {(result.diagnostico_es || result.ruta) && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 space-y-1.5">
                {result.ruta && (
                  <span className="inline-block text-[11px] font-bold bg-[#0B4079] text-white rounded-full px-2.5 py-0.5">
                    Ruta {result.ruta}: {ROUTE_LABELS[result.ruta]}
                  </span>
                )}
                {result.diagnostico_es && <p className="text-xs text-slate-700 dark:text-slate-300">{result.diagnostico_es}</p>}
                {result.estrategia_es && <p className="text-xs text-slate-500 dark:text-slate-400">{result.estrategia_es}</p>}
              </div>
            )}

            {result.requirements && result.requirements.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tu perfil frente a la oferta</h3>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {result.requirements.map((r, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-xs text-slate-700 dark:text-slate-300">{r.requirement_es}</span>
                      <span className={`shrink-0 text-[11px] font-bold rounded-full px-2 py-0.5 ${REQUIREMENT_STYLES[r.status].style}`}>
                        {REQUIREMENT_STYLES[r.status].label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Vista previa</h3>
              <pre className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 max-h-72 overflow-y-auto font-sans">
                {result.full_text}
              </pre>
              {result.removed > 0 && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Quitamos {result.removed} {result.removed === 1 ? 'frase' : 'frases'} que no tenían respaldo en lo que nos contaste.
                </p>
              )}
            </div>

            {result.recomendaciones_es.length > 0 && (
              <div className="text-xs text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-3.5 py-3 space-y-1">
                <p className="font-bold">Para fortalecerlo:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {result.recomendaciones_es.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
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
                disabled={downloading === 'cv'}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 dark:text-slate-200 rounded-xl py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {downloading === 'cv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Descargar Word
              </button>
            </div>

            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Carta de presentación</h3>
              {!letter ? (
                <button
                  type="button"
                  onClick={handleLetter}
                  disabled={letterLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  {letterLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {letterLoading ? 'Escribiendo tu carta...' : 'Crear mi carta de presentación'}
                </button>
              ) : (
                <>
                  <pre className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 max-h-64 overflow-y-auto font-sans">
                    {letter.letter}
                  </pre>
                  {letter.notes_es && (
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2">
                      💡 {letter.notes_es}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLetter}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 dark:text-slate-200 rounded-xl py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLetter ? 'Copiada' : 'Copiar carta'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadLetter}
                      disabled={downloading === 'letter'}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 dark:text-slate-200 rounded-xl py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {downloading === 'letter' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Descargar Word
                    </button>
                  </div>
                </>
              )}
            </div>

            {error && <p className={errorClass}>{error}</p>}

            {job && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Esta versión es solo para esta oferta: cópiala o descárgala. No reemplaza tu CV guardado.
              </p>
            )}

            <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStage('chat')}
                className="w-1/3 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Seguir editando
              </button>
              {job ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-2/3 rounded-xl bg-[#C89B3C] py-3 text-sm font-bold text-[#08131F] shadow-md hover:bg-[#b08833] transition"
                >
                  Listo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-2/3 rounded-xl bg-[#C89B3C] py-3 text-sm font-bold text-[#08131F] shadow-md hover:bg-[#b08833] disabled:opacity-50 transition"
                >
                  {saving ? 'Guardando...' : 'Guardar mi CV'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
