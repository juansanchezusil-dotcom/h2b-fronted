'use client';

import { useEffect, useState } from 'react';
import { X, Mail, ExternalLink, Copy, Check, Loader2, FileText, Sparkles, Target } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useBackToClose } from '@/hooks/useBackToClose';
import { aiFetch } from '@/lib/aiFetch';

// Flujo único de postulación: genera el correo con el CV real del candidato,
// lo abre listo para enviar al contacto real de la oferta, y al confirmar que
// se envió, deja la postulación registrada en el CRM — sin pasos sueltos que
// se puedan olvidar.

interface ApplyJob {
  title: string;
  employerName: string;
  location?: string;
  contactEmail?: string;
  duties?: string;
}

interface ApplyFlowModalProps {
  isOpen: boolean;
  userId: string;
  job: ApplyJob | null;
  // true si ya hay una fila en el CRM para esta empresa+puesto en estado 'guardadas'
  alreadySavedStatus?: string | null;
  onClose: () => void;
  onOpenCvBuilder: () => void;
  // Abre el constructor de CV para ver cómo encaja la persona con esta oferta antes de enviar
  onAdaptCv?: () => void;
  onApplied: () => void;
}

type Lang = 'en' | 'es';

interface GeneratedEmail {
  subject_en: string;
  body_en: string;
  subject_es: string;
  body_es: string;
}

// Familias de puestos: sirve para saber si la oferta es del mismo tipo que el puesto principal de la persona
// (en español o en inglés). Si no se puede saber, se trata como un puesto distinto.
const ROLE_FAMILIES: [string, RegExp][] = [
  ['limpieza', /housekeep|room attend|maid|cleaner|janitor|camarer|limpie|aseo|laundry|lavander/],
  ['cocina', /cook|chef|kitchen|cocin|dishwash|lavaplat|prep|baker|panader|food/],
  ['jardin', /landscap|ground|garden|jardin|lawn|paisaj|nursery|farm|agricult|vivero/],
  ['construccion', /construct|laborer|carpent|mason|roof|concrete|drywall|paint|pintor|alba[nñ]il|obra|builder|rigger|electric|plumb|weld|maintenance|mantenim/],
  ['recepcion', /front desk|reception|recepci|concierge|bell|botones|hotel clerk/],
  ['servicio', /server|waiter|waitress|mesero|mesera|bartend|barman|host|busser/],
  ['conduccion', /driver|conduct|chofer|truck/],
  ['almacen', /warehouse|almac|packer|packing|stock|forklift|procesad|production|assembly/],
];
const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function sameRole(mainRole: string, jobTitle: string): boolean {
  const a = norm(mainRole);
  const b = norm(jobTitle);
  if (!a.trim() || !b.trim()) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  return ROLE_FAMILIES.some(([, re]) => re.test(a) && re.test(b));
}

export default function ApplyFlowModal({
  isOpen,
  userId,
  job,
  alreadySavedStatus,
  onClose,
  onOpenCvBuilder,
  onAdaptCv,
  onApplied,
}: ApplyFlowModalProps) {
  useBackToClose(isOpen, onClose);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [hasCv, setHasCv] = useState(false);
  const [candidate, setCandidate] = useState<{ fullName: string; baseCvText: string; skills: string[]; englishLevel: string; targetRole: string } | null>(null);

  // 'email': el redactor de correos (camino normal, usa tu CV y los datos de la empresa).
  // 'fit': la oferta es de un puesto distinto al principal; se ofrece ver el encaje primero.
  // 'afterFit': ya vio su encaje y vuelve para escribir el correo.
  const [step, setStep] = useState<'fit' | 'afterFit' | 'email'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<GeneratedEmail | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false); // ya tocó abrir Gmail/Outlook/mailto
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoadingProfile(true);
    setStep('email');
    setEmail(null);
    setSent(false);
    setMarked(false);
    setError(null);
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, base_cv_text, skills, english_level, nivel_ingles, target_role')
        .eq('id', userId)
        .maybeSingle();
      const cv = data?.base_cv_text || '';
      setCandidate({
        fullName: data?.full_name || '',
        baseCvText: cv,
        skills: data?.skills || [],
        englishLevel: data?.english_level || data?.nivel_ingles || '',
        targetRole: data?.target_role || '',
      });
      setHasCv(cv.trim().length >= 30);
      // Mismo puesto que el principal: directo al correo. Otro puesto: se ofrece ver el encaje antes.
      if (onAdaptCv && cv.trim().length >= 30 && !sameRole(data?.target_role || '', job?.title || '')) setStep('fit');
      setLoadingProfile(false);
    })();
  }, [isOpen, userId, job?.title]);

  useEffect(() => {
    if (!isOpen || !job || !candidate || !hasCv || step !== 'email' || email || loading) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await aiFetch('/api/email/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailType: 'initial',
            jobTitle: job.title || 'the H-2B position',
            jobDuties: job.duties || '',
            companyName: job.employerName || 'your company',
            location: job.location || '',
            candidateName: candidate.fullName || '[Tu nombre]',
            baseCvText: candidate.baseCvText,
            skills: candidate.skills,
            englishLevel: candidate.englishLevel,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo generar el correo.');
        setEmail(data);
      } catch (err: any) {
        setError(err.message || 'No se pudo generar el correo. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, job, candidate, hasCv, step, email, loading]);

  if (!isOpen || !job) return null;

  const subject = lang === 'en' ? email?.subject_en : email?.subject_es;
  const body = lang === 'en' ? email?.body_en : email?.body_es;
  const contactEmail = job.contactEmail || '';

  const handleCopy = async () => {
    if (!body) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(body);
      ok = true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = body;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      ok = document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    if (!ok) {
      window.prompt('Copia el correo manualmente:', body);
      return;
    }
    setCopied(true);
    setSent(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openCompose = (provider: 'gmail' | 'outlook' | 'mailto') => {
    if (!subject || !body) return;
    setSent(true);
    if (provider === 'mailto') {
      window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }
    const url =
      provider === 'gmail'
        ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        : `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(contactEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const handleConfirmSent = async () => {
    setMarking(true);
    await onApplied();
    setMarking(false);
    setMarked(true);
    setTimeout(onClose, 1200);
  };

  // Ya está más adelante que "guardadas" — no hay nada que marcar, solo mandar otro correo
  const alreadyBeyondSaved = alreadySavedStatus && alreadySavedStatus !== 'guardadas';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08131F]/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-20 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="max-h-[92vh] overflow-y-auto p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Postular a {job.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{job.employerName}</p>
            </div>
          </div>

          {loadingProfile ? (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-10">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando tu perfil...
            </div>
          ) : !hasCv ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Completa tu CV primero</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                El correo se escribe con tu experiencia real, no con una plantilla genérica. Cuéntanos tu experiencia
                una vez y la usamos aquí y en tu CV.
              </p>
              <button
                onClick={onOpenCvBuilder}
                className="bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
              >
                Completar mi CV
              </button>
            </div>
          ) : step === 'fit' ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-[#C89B3C] flex items-center justify-center mx-auto">
                <Target className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Esta oferta es de un puesto distinto al tuyo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {candidate?.targetRole
                    ? `Tu puesto principal es "${candidate.targetRole}" y esta oferta es de "${job.title}". Antes de enviar, mira cómo encajas y qué reforzar. Si prefieres, ve directo al correo.`
                    : 'Antes de enviar, mira cómo encajas con esta oferta y qué reforzar. Si prefieres, ve directo al correo.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('afterFit');
                    onAdaptCv?.();
                  }}
                  className="w-full sm:w-auto bg-[#C89B3C] hover:bg-[#b08833] text-[#08131F] font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  Ver mi encaje
                </button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full sm:w-auto text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2.5"
                >
                  Ir directo al correo
                </button>
              </div>
            </div>
          ) : step === 'afterFit' ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-4">
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">¿Seguimos con el correo?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cuando termines de revisar tu encaje, escribe el correo de postulación para esta oferta.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full sm:w-auto bg-[#C89B3C] hover:bg-[#b08833] text-[#08131F] font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  Escribir el correo
                </button>
                <button
                  type="button"
                  onClick={() => onAdaptCv?.()}
                  className="w-full sm:w-auto text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2.5"
                >
                  Ver mi encaje otra vez
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {onAdaptCv && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ¿Esta oferta es de otro puesto distinto al tuyo?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('afterFit');
                      onAdaptCv();
                    }}
                    className="font-semibold text-[#0B4079] dark:text-[#C89B3C] underline"
                  >
                    Ver mi encaje
                  </button>
                </p>
              )}
              {!contactEmail && (
                <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2">
                  Esta oferta no trae un correo de contacto directo. Copia el mensaje y úsalo por el medio que la
                  oferta indique.
                </p>
              )}

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tu correo de postulación</span>
                  <div className="flex items-center gap-3">
                    <div className="flex text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <button onClick={() => setLang('en')} className={`px-2.5 py-1 ${lang === 'en' ? 'bg-slate-900 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>EN</button>
                      <button onClick={() => setLang('es')} className={`px-2.5 py-1 ${lang === 'es' ? 'bg-slate-900 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>ES</button>
                    </div>
                    <button onClick={handleCopy} disabled={!body} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium disabled:opacity-40">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</p>}
                {lang === 'es' && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-2.5 py-1.5">
                    Traducción solo para tu referencia. Recomendamos enviarlo en inglés (EN).
                  </p>
                )}

                {loading || !email ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 min-h-[160px]">
                    <Loader2 className="w-4 h-4 animate-spin" /> Escribiendo tu correo...
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 dark:text-slate-400"><strong className="text-slate-700 dark:text-slate-200">Asunto:</strong> {subject}</p>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-700 max-h-56 overflow-y-auto">
                      {body}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button onClick={() => openCompose('gmail')} disabled={!email} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 px-3 rounded-xl text-xs font-semibold disabled:opacity-40">
                  <Mail className="w-4 h-4" /> Abrir Gmail
                </button>
                <button onClick={() => openCompose('outlook')} disabled={!email} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-xl text-xs font-semibold disabled:opacity-40">
                  <Mail className="w-4 h-4" /> Abrir Outlook
                </button>
                <button onClick={() => openCompose('mailto')} disabled={!email} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-3 rounded-xl text-xs font-semibold disabled:opacity-40">
                  <ExternalLink className="w-4 h-4" /> App predeterminada
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                {alreadyBeyondSaved ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Esta postulación ya está en tu CRM (estado: {alreadySavedStatus}). Envía el correo de arriba y listo.
                  </p>
                ) : marked ? (
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 text-center">✓ Marcada como postulada en tu CRM.</p>
                ) : (
                  <button
                    onClick={handleConfirmSent}
                    disabled={!sent || marking}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm py-3 rounded-xl transition-all"
                  >
                    {marking ? 'Guardando...' : sent ? 'Ya envié el correo — marcar como postulada' : 'Primero abre o copia el correo de arriba'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
