'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Loader2, FileText, ChevronRight, RotateCcw, Sparkles, HelpCircle, Briefcase, Landmark } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { aiFetch } from '@/lib/aiFetch';

// Simulador de entrevistas H-2B: entrevista adaptativa, una pregunta por turno, sin correcciones durante la
// práctica (solo si se pausa para pedir ayuda) y un informe final con puntuación y plan de mejora.

interface SavedOffer {
  company: string;
  role: string;
  status?: string;
}

interface InterviewSimulatorProps {
  userId: string;
  onOpenCvBuilder?: () => void;
  // Postulaciones del CRM, para elegir la oferta de la que te van a entrevistar
  savedOffers?: SavedOffer[];
  // Entrevista que se quiere practicar ya cargada (desde una tarjeta en "Entrevista" del CRM)
  initialJob?: { company: string; role: string } | null;
}

type Module = 'employer' | 'consular';
type Stage = 'intro' | 'interview' | 'report';

interface Turn {
  q: string;
  a: string;
}

interface Question {
  question_en: string;
  question_es: string;
  level: number;
  ask_english: boolean;
}

interface Help {
  meaning_es: string;
  structure_es: string[];
  vocabulary: string[];
}

interface Report {
  level_reached: number;
  score: { total: number; parts: { key: string; label: string; score: number | null; max: number }[]; adapted: boolean; note_es: string };
  strengths_es: string[];
  improve: { question_en: string; question_es: string; original: string; mejorar_es: string; improved_en: string; improved_es: string; consejo_es: string }[];
  english_errors_es: string[];
  not_understood_es: string[];
  inconsistencias_es: string[];
  priorities_es: string[];
  plan_es: string[];
  practice_questions: { en: string; es: string }[];
  closing_es: string;
  has_docs: boolean;
  encaje_tiene_es?: string[];
  encaje_falta_es?: string[];
  job_title?: string;
}

interface CandidateProfile {
  targetRole: string;
  industry: string;
  englishLevel: string;
  baseCvText: string;
}

const TOTAL = 10;
const LEVEL_LABEL: Record<number, string> = { 1: 'Básico', 2: 'Intermedio', 3: 'Realista' };
const MODULE_LABEL: Record<Module, string> = { employer: 'Entrevista con el empleador', consular: 'Entrevista consular' };

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm';
const errBox = 'text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2';

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export default function InterviewSimulatorTab({ userId, onOpenCvBuilder, savedOffers = [], initialJob = null }: InterviewSimulatorProps) {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);

  const [stage, setStage] = useState<Stage>('intro');
  const [module, setModule] = useState<Module>('employer');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [help, setHelp] = useState<Help | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  // Puesto de la entrevista: el principal, una oferta del CRM o uno escrito a mano
  const [jobChoice, setJobChoice] = useState<string>(initialJob ? 'manual' : 'main'); // 'main' | 'manual' | índice de savedOffers
  const [manualTitle, setManualTitle] = useState(initialJob?.role || '');
  const [manualCompany, setManualCompany] = useState(initialJob?.company || '');
  const [duties, setDuties] = useState('');

  // Dictado por voz (transcripción en el navegador; no se guarda audio)
  const [listening, setListening] = useState(false);
  const [canDictate, setCanDictate] = useState(false);
  const recognitionRef = useRef<any>(null);

  const storageKey = `jta-sim-v2-${userId}`;

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('target_role, industry, english_level, nivel_ingles, base_cv_text, experiencia_industria')
        .eq('id', userId)
        .maybeSingle();
      setProfile({
        targetRole: data?.target_role || '',
        industry: data?.industry || data?.experiencia_industria || '',
        englishLevel: data?.english_level || data?.nivel_ingles || '',
        baseCvText: data?.base_cv_text || '',
      });
      setLoadingProfile(false);
    })();
  }, [userId]);

  useEffect(() => {
    setCanDictate(typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    // Retoma una práctica a medias de esta misma persona
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.question && Array.isArray(s.turns)) {
          setModule(s.module === 'consular' ? 'consular' : 'employer');
          setTurns(s.turns);
          setQuestion(s.question);
          if (s.job?.title) {
            // El puesto elegido se recupera como "otro puesto" con sus datos
            setJobChoice('manual');
            setManualTitle(String(s.job.title));
            setManualCompany(String(s.job.company || ''));
            setDuties(String(s.job.duties || ''));
          }
          setStage('interview');
        }
      }
    } catch {
      // Sin almacenamiento: la práctica dura solo esta visita
    }
    return () => recognitionRef.current?.stop?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (s: { module: Module; turns: Turn[]; question: Question | null } | null) => {
    try {
      if (!s) window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, JSON.stringify({ ...s, job: jobPayload() }));
    } catch {
      // idem
    }
  };

  const hasCv = (profile?.baseCvText || '').trim().length >= 30;

  // Ofertas en entrevista primero: son las más probables
  const offerOptions = [...savedOffers].sort((a, b) => Number(b.status === 'entrevista') - Number(a.status === 'entrevista')).slice(0, 40);
  const jobPayload = () => {
    if (jobChoice === 'main') return profile?.targetRole ? { title: profile.targetRole, company: '', duties } : null;
    if (jobChoice === 'manual') return manualTitle.trim() ? { title: manualTitle.trim(), company: manualCompany.trim(), duties } : null;
    const o = offerOptions[Number(jobChoice)];
    return o ? { title: o.role, company: o.company, duties } : null;
  };
  const candidatePayload = () => ({
    role: profile?.targetRole || '',
    industry: profile?.industry || '',
    englishLevel: profile?.englishLevel || '',
    cvText: profile?.baseCvText || '',
  });

  const call = async (payload: Record<string, unknown>) => {
    const res = await aiFetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, candidate: candidatePayload(), job: jobPayload(), ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'No se pudo procesar tu práctica. Intenta de nuevo.');
    return data;
  };

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const q: Question = await call({ mode: 'next', turns: [] });
      setTurns([]);
      setQuestion(q);
      setAnswer('');
      setHelp(null);
      setReport(null);
      setStage('interview');
      persist({ module, turns: [], question: q });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const finish = async (finalTurns: Turn[]): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const r: Report = await call({ mode: 'report', turns: finalTurns });
      setReport(r);
      setStage('report');
      persist(null);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!question || answer.trim().length < 2 || busy) return;
    recognitionRef.current?.stop?.();
    const next = [...turns, { q: question.question_en, a: answer.trim() }];
    setBusy(true);
    setError(null);
    setHelp(null);
    try {
      setTurns(next);
      if (next.length >= TOTAL) {
        if (await finish(next)) setAnswer('');
        else setTurns(turns);
        return;
      }
      const q: Question = await call({ mode: 'next', turns: next });
      setQuestion(q);
      setAnswer('');
      persist({ module, turns: next, question: q });
    } catch (err: any) {
      // La respuesta no se pierde: vuelve al cuadro para reenviarla
      setTurns(turns);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const askHelp = async () => {
    if (!question) return;
    setBusy(true);
    setError(null);
    try {
      setHelp(await call({ mode: 'help', questionEn: question.question_en }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleDictation = () => {
    if (listening) {
      recognitionRef.current?.stop?.();
      return;
    }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results as ArrayLike<any>)
        .slice(e.resultIndex)
        .map((r: any) => r[0]?.transcript || '')
        .join(' ')
        .trim();
      if (text) setAnswer((prev) => (prev ? `${prev} ${text}` : text));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const restart = () => {
    recognitionRef.current?.stop?.();
    persist(null);
    setStage('intro');
    setTurns([]);
    setQuestion(null);
    setAnswer('');
    setHelp(null);
    setReport(null);
    setError(null);
  };

  if (loadingProfile) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando tu perfil...
      </div>
    );
  }

  /* ---------- INTRO ---------- */
  if (stage === 'intro') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <div className={`${card} space-y-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Mic className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Simulador de Entrevista</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Vamos a practicar una entrevista realista. Cada pregunta aparecerá en inglés con su traducción al español debajo. Responde en inglés con tus propias palabras.
            Al final recibirás una evaluación, correcciones y un plan de mejora. Esta práctica no garantiza una contratación ni la aprobación de una visa.
          </p>

          <div role="group" aria-label="Tipo de entrevista" className="grid gap-2 sm:grid-cols-2">
            {([
              ['employer', 'A. Entrevista con el empleador', 'Experiencia, tareas y habilidades de tu puesto.', Briefcase],
              ['consular', 'B. Entrevista consular', 'Claridad, honestidad y coherencia con tus datos.', Landmark],
            ] as const).map(([id, title, desc, Icon]) => (
              <button
                key={id}
                type="button"
                aria-pressed={module === id}
                onClick={() => setModule(id)}
                className={`text-left rounded-xl border p-3.5 transition ${
                  module === id
                    ? 'border-[#C89B3C] bg-amber-50 dark:bg-amber-500/10'
                    : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Icon className="w-4 h-4" /> {title}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</span>
              </button>
            ))}
          </div>

          <div className="text-xs text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg px-3 py-2.5 space-y-1">
            <p className="font-semibold">Recomendación para que la práctica se parezca a tu entrevista real</p>
            <p>
              Elige abajo la oferta de la que te van a entrevistar y pega sus funciones. Si no las pegas, el simulador solo conoce el puesto y la empresa, y las preguntas serán más generales.
            </p>
            <p>Si cierras a mitad de la práctica, al volver continúas donde la dejaste, con el mismo puesto.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="sim-job" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              ¿Para qué puesto es tu entrevista?
            </label>
            <select
              id="sim-job"
              value={jobChoice}
              onChange={(e) => setJobChoice(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2.5 text-sm"
            >
              <option value="main">{profile?.targetRole ? `Mi puesto principal (${profile.targetRole})` : 'Práctica general'}</option>
              {offerOptions.map((o, i) => (
                <option key={`${o.company}-${o.role}-${i}`} value={String(i)}>
                  {`${o.role} — ${o.company}${o.status === 'entrevista' ? ' (en entrevista)' : ''}`}
                </option>
              ))}
              <option value="manual">Otro puesto (lo escribo)</option>
            </select>
            {jobChoice === 'manual' && (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  maxLength={120}
                  placeholder="Puesto (ej.: Housekeeper)"
                  aria-label="Puesto"
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  maxLength={120}
                  placeholder="Empresa (opcional)"
                  aria-label="Empresa"
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm"
                />
              </div>
            )}
            {jobChoice !== 'main' && (
              <>
                <textarea
                  value={duties}
                  onChange={(e) => setDuties(e.target.value)}
                  rows={3}
                  maxLength={1800}
                  placeholder="Pega aquí las funciones de la oferta (opcional, mejora las preguntas)"
                  aria-label="Funciones de la oferta"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-xs"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Si el puesto es distinto al tuyo, la práctica explora lo que sí has hecho y qué es transferible, sin darlo como experiencia directa. Al final verás qué tienes y qué te falta para ese puesto.
                </p>
              </>
            )}
          </div>

          {module === 'consular' && (
            <p className="text-[11px] text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2">
              Es una simulación educativa: las preguntas reales pueden variar y no es una lista oficial. Para dudas legales sobre requisitos, consulta fuentes oficiales o un abogado de inmigración.
            </p>
          )}

          {hasCv ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Usaremos tu CV guardado para personalizar las preguntas y revisar la coherencia de tus respuestas.</p>
          ) : (
            <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 space-y-1.5">
              <p>
                Todavía no tienes un CV guardado. Puedes practicar igual, pero las preguntas serán menos personalizadas y la coherencia con tus documentos aparecerá como "No evaluable".
              </p>
              {onOpenCvBuilder && (
                <button type="button" onClick={onOpenCvBuilder} className="inline-flex items-center gap-1 font-semibold text-[#0B4079] dark:text-[#C89B3C] underline">
                  <FileText className="w-3.5 h-3.5" /> Completar mi CV
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {canDictate
              ? 'Puedes escribir tus respuestas o dictarlas con el micrófono: se convierten en texto en tu navegador y no se guarda ningún audio.'
              : 'Escribe tus respuestas en inglés. (Tu navegador no admite dictado por voz.)'}
          </p>

          {error && <p className={errBox}>{error}</p>}
          <button
            onClick={start}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
            {busy ? 'Preparando tu entrevista...' : 'Comenzar la entrevista'}
          </button>
        </div>
      </div>
    );
  }

  /* ---------- INFORME ---------- */
  if (stage === 'report' && report) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tu informe de práctica</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {MODULE_LABEL[module]} · Nivel alcanzado: {LEVEL_LABEL[report.level_reached] || 'Básico'}
            </p>
          </div>
          <button onClick={restart} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <RotateCcw className="w-3.5 h-3.5" /> Practicar de nuevo
          </button>
        </div>

        <section className={`${card} space-y-3`}>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {report.score.total}
            <span className="text-base font-semibold text-slate-500 dark:text-slate-400"> / 100</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Es tu desempeño en esta práctica. No es una probabilidad de contratación ni de aprobación de visa.
          </p>
          <ul className="space-y-2">
            {report.score.parts.map((p) => (
              <li key={p.key} className="text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between gap-2">
                  <span>{p.label}</span>
                  <span className="font-semibold tabular-nums">{p.score === null ? 'No evaluable' : `${p.score} / ${p.max}`}</span>
                </div>
                {p.score !== null && (
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#C89B3C]" style={{ width: `${Math.round((p.score / p.max) * 100)}%` }} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          {report.score.note_es && <p className="text-[11px] text-slate-500 dark:text-slate-400">{report.score.note_es}</p>}
        </section>

        {((report.encaje_tiene_es?.length || 0) > 0 || (report.encaje_falta_es?.length || 0) > 0) && (
          <section className={`${card} space-y-3 text-sm text-slate-700 dark:text-slate-300`}>
            <h3 className="font-bold text-slate-900 dark:text-white">{report.job_title ? `Cómo encajas con "${report.job_title}"` : 'Cómo encajas con este puesto'}</h3>
            {(report.encaje_tiene_es?.length || 0) > 0 && (
              <div>
                <p className="font-semibold">Lo que ya tienes</p>
                <List items={report.encaje_tiene_es || []} />
              </div>
            )}
            {(report.encaje_falta_es?.length || 0) > 0 && (
              <div>
                <p className="font-semibold">Lo que te falta o no demostraste</p>
                <List items={report.encaje_falta_es || []} />
              </div>
            )}
          </section>
        )}

        {report.strengths_es.length > 0 && (
          <section className={`${card} space-y-2 text-sm text-slate-700 dark:text-slate-300`}>
            <h3 className="font-bold text-slate-900 dark:text-white">Tus fortalezas</h3>
            <List items={report.strengths_es} />
          </section>
        )}

        {report.improve.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white">Respuestas para mejorar</h3>
            {report.improve.map((i, idx) => (
              <div key={`${i.question_en}-${idx}`} className={`${card} space-y-2 text-xs text-slate-700 dark:text-slate-300`}>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{i.question_en}</p>
                <p className="italic text-slate-500 dark:text-slate-400">{i.question_es}</p>
                <p><strong>Tu respuesta:</strong> {i.original}</p>
                <p><strong>Qué mejorar:</strong> {i.mejorar_es}</p>
                {i.improved_en && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-3 space-y-1">
                    <p><strong>Versión mejorada:</strong> {i.improved_en}</p>
                    <p className="italic text-slate-500 dark:text-slate-400">{i.improved_es}</p>
                  </div>
                )}
                {i.consejo_es && <p className="text-amber-800 dark:text-amber-300">💡 {i.consejo_es}</p>}
              </div>
            ))}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Son ejemplos de comunicación, no guiones para memorizar. Usa solo lo que sea cierto en tu caso.
            </p>
          </section>
        )}

        {(report.english_errors_es.length > 0 || report.not_understood_es.length > 0 || report.inconsistencias_es.length > 0) && (
          <section className={`${card} space-y-3 text-sm text-slate-700 dark:text-slate-300`}>
            {report.english_errors_es.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Errores de inglés más importantes</h3>
                <List items={report.english_errors_es} />
              </div>
            )}
            {report.not_understood_es.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Preguntas que no entendiste o respondiste incompleto</h3>
                <List items={report.not_understood_es} />
              </div>
            )}
            {report.inconsistencias_es.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Posibles diferencias con tu CV</h3>
                <List items={report.inconsistencias_es} />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Verifica cada dato con su fuente; no asumas cuál es el correcto.</p>
              </div>
            )}
          </section>
        )}

        <section className={`${card} space-y-3 text-sm text-slate-700 dark:text-slate-300`}>
          {report.priorities_es.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Tus 3 prioridades</h3>
              <ol className="list-decimal pl-5 space-y-1">
                {report.priorities_es.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            </div>
          )}
          {report.plan_es.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Plan de práctica</h3>
              <List items={report.plan_es} />
            </div>
          )}
          {report.practice_questions.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Preguntas para volver a practicar</h3>
              <ul className="space-y-1.5">
                {report.practice_questions.map((q) => (
                  <li key={q.en}>
                    <span className="font-semibold">{q.en}</span>
                    <span className="block text-xs italic text-slate-500 dark:text-slate-400">{q.es}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {report.closing_es && <p className="text-sm text-slate-600 dark:text-slate-300">{report.closing_es}</p>}
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          No se guardó ningún audio. Este informe es una práctica educativa y no garantiza una contratación ni la aprobación de una visa.
        </p>
        <button onClick={restart} className="w-full bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all">
          Practicar de nuevo
        </button>
      </div>
    );
  }

  /* ---------- ENTREVISTA ---------- */
  const number = turns.length + 1;
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{MODULE_LABEL[module]}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{`Pregunta ${Math.min(number, TOTAL)} de ${TOTAL}`}</p>
          </div>
        </div>
        <button onClick={restart} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
        </button>
      </div>

      {question && (
        <div className="space-y-4">
          <div className={`${card} space-y-2`}>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{`Question ${Math.min(number, TOTAL)} — English`}</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{question.question_en}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">Traducción al español</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 italic">{question.question_es}</p>
          </div>

          <div className={`${card} space-y-3`}>
            <label htmlFor="interview-answer" className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Tu respuesta, en inglés y con tus propias palabras
            </label>
            <textarea
              id="interview-answer"
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white p-3 text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/20"
            />
            {error && <p className={errBox}>{error}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={submit}
                disabled={answer.trim().length < 2 || busy}
                className="flex-1 min-w-[10rem] flex items-center justify-center gap-2 bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                {busy ? 'Un momento...' : number >= TOTAL ? 'Enviar y ver mi informe' : 'Enviar respuesta'}
              </button>
              {canDictate && (
                <button
                  type="button"
                  onClick={toggleDictation}
                  disabled={busy}
                  aria-pressed={listening}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50"
                >
                  {listening ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4" />}
                  {listening ? 'Detener' : 'Dictar'}
                </button>
              )}
              <button
                type="button"
                onClick={askHelp}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50"
              >
                <HelpCircle className="w-4 h-4" /> Pausar y pedir ayuda
              </button>
            </div>

            {help && (
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-3 text-xs text-blue-900 dark:text-blue-300 space-y-2">
                <p>{help.meaning_es}</p>
                {help.structure_es.length > 0 && (
                  <ol className="list-decimal pl-5 space-y-0.5">
                    {help.structure_es.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                )}
                {help.vocabulary.length > 0 && (
                  <p>
                    <strong>Vocabulario:</strong> {help.vocabulary.join(' · ')}
                  </p>
                )}
                <p className="text-[11px] opacity-80">La respuesta la armas tú, con tu experiencia real.</p>
              </div>
            )}

            {turns.length >= 3 && (
              <button
                type="button"
                onClick={() => finish(turns)}
                disabled={busy}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 underline disabled:opacity-50"
              >
                Terminar ahora y ver mi informe
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
