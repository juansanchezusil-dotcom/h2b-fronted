'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, Copy, ExternalLink, Sparkles, Check, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface SavedOffer {
  company: string;
  role: string;
  state?: string;
}

interface EmailAssistantProps {
  userId: string;
  initialJobTitle?: string;
  initialCompanyName?: string;
  initialContactEmail?: string;
  initialLocation?: string;
  // Ofertas ya guardadas en el CRM, para elegir en vez de escribir a mano
  // (solo tiene sentido cuando se abre el redactor "en blanco", sin una
  // oferta específica ya precargada).
  savedOffers?: SavedOffer[];
  // Se llama cuando falta el CV, para que quien lo use abra el constructor de CV
  onOpenCvBuilder?: () => void;
}

type EmailType = 'initial' | 'followup_7d' | 'followup_14d';
type Lang = 'en' | 'es';

interface GeneratedEmail {
  subject_en: string;
  body_en: string;
  subject_es: string;
  body_es: string;
}

interface CandidateData {
  fullName: string;
  baseCvText: string;
  skills: string[];
  englishLevel: string;
}

export function EmailAssistantTab({
  userId,
  initialJobTitle = '',
  initialCompanyName = '',
  initialContactEmail = '',
  initialLocation = '',
  savedOffers = [],
  onOpenCvBuilder,
}: EmailAssistantProps) {
  const [emailType, setEmailType] = useState<EmailType>('initial');
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [location, setLocation] = useState(initialLocation);
  const [contactEmail, setContactEmail] = useState(initialContactEmail);
  const [selectedOfferIdx, setSelectedOfferIdx] = useState<string>('-1');

  const handlePickOffer = (value: string) => {
    setSelectedOfferIdx(value);
    const idx = Number(value);
    if (idx < 0) return;
    const offer = savedOffers[idx];
    if (!offer) return;
    setCompanyName(offer.company);
    setJobTitle(offer.role);
    setLocation(offer.state || '');
  };
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<Lang>('en');

  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Un correo generado por cada tipo, para no volver a llamar a la IA al solo cambiar de pestaña
  const [emails, setEmails] = useState<Partial<Record<EmailType, GeneratedEmail>>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, base_cv_text, skills, english_level, nivel_ingles')
        .eq('id', userId)
        .maybeSingle();
      setCandidate({
        fullName: data?.full_name || '',
        baseCvText: data?.base_cv_text || '',
        skills: data?.skills || [],
        englishLevel: data?.english_level || data?.nivel_ingles || '',
      });
      setLoadingProfile(false);
    })();
  }, [userId]);

  const hasCv = (candidate?.baseCvText || '').trim().length >= 30;
  const current = emails[emailType];

  const generate = async (type: EmailType) => {
    if (!candidate || !hasCv) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType: type,
          jobTitle: jobTitle || 'the H-2B position',
          companyName: companyName || 'your company',
          location,
          candidateName: candidate.fullName || '[Tu nombre]',
          baseCvText: candidate.baseCvText,
          skills: candidate.skills,
          englishLevel: candidate.englishLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el correo.');
      setEmails((prev) => ({ ...prev, [type]: data }));
    } catch (err: any) {
      setError(err.message || 'No se pudo generar el correo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Genera el correo del tipo activo si aún no existe (o cambiaron empresa/puesto)
  useEffect(() => {
    if (hasCv && !current && !loading) generate(emailType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailType, hasCv, companyName, jobTitle, location]);

  const subject = lang === 'en' ? current?.subject_en : current?.subject_es;
  const body = lang === 'en' ? current?.body_en : current?.body_es;

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
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMailto = () => {
    if (!subject || !body) return;
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleOpenWebmail = (provider: 'gmail' | 'outlook') => {
    if (!subject || !body) return;
    const url =
      provider === 'gmail'
        ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        : `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(contactEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const emailTypeOptions = useMemo(
    () => [
      { id: 'initial' as const, label: 'Contacto Inicial / Postulación' },
      { id: 'followup_7d' as const, label: 'Primer Seguimiento (7 días)' },
      { id: 'followup_14d' as const, label: 'Último Seguimiento (14 días)' },
    ],
    []
  );

  if (loadingProfile) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando tu perfil...
      </div>
    );
  }

  if (!hasCv) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Completa tu CV primero</h2>
          <p className="text-sm text-slate-500">
            El redactor de correos usa tu experiencia real para escribir un correo personalizado y creíble, en vez
            de una plantilla genérica. Cuéntanos tu experiencia una vez y la usaremos aquí y en tu CV.
          </p>
          <button
            onClick={onOpenCvBuilder}
            className="bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all"
          >
            Completar mi CV
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Asistente de Correo IA</h2>
          <p className="text-sm text-slate-500">Genera correos personalizados con tu experiencia real, listos para enviar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-700 text-sm">1. Tipo de Correo</h3>
          <div className="space-y-2">
            {emailTypeOptions.map((type) => (
              <button
                key={type.id}
                onClick={() => setEmailType(type.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  emailType === type.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <hr className="border-slate-200 my-4" />

          <h3 className="font-semibold text-slate-700 text-sm">2. Datos de la Oferta</h3>
          <div className="space-y-3">
            {savedOffers.length > 0 && (
              <div>
                <label className="text-xs text-slate-500 font-medium">Elegir de tus ofertas guardadas</label>
                <select
                  value={selectedOfferIdx}
                  onChange={(e) => handlePickOffer(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="-1">Escribir manualmente...</option>
                  {savedOffers.map((o, i) => (
                    <option key={i} value={i}>{o.company} — {o.role}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 font-medium">Empresa Patrocinadora</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Puesto / Vacante</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Correo del Reclutador</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => generate(emailType)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg py-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Volver a generar
          </button>
        </div>

        <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Previsualización</span>
              <div className="flex items-center gap-3">
                {/* Toggle EN/ES: EN es lo que se recomienda enviar; ES es solo para entenderlo */}
                <div className="flex text-[11px] font-bold rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setLang('en')}
                    className={`px-2.5 py-1 ${lang === 'en' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLang('es')}
                    className={`px-2.5 py-1 ${lang === 'es' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    ES
                  </button>
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!body}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
            )}

            {lang === 'es' && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                Esta es la traducción, solo para que entiendas lo que dice. Recomendamos enviarlo en inglés (EN).
              </p>
            )}

            {loading && !current ? (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 min-h-[220px]">
                <Loader2 className="w-4 h-4 animate-spin" /> Escribiendo tu correo...
              </div>
            ) : (
              <>
                <div className="text-xs text-slate-500">
                  <strong className="text-slate-700">Asunto:</strong> {subject || '—'}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed border border-slate-100 min-h-[220px]">
                  {body || 'Genera el correo para verlo aquí.'}
                </div>
              </>
            )}
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
            <span className="text-xs font-medium text-slate-300 block">Enviar mensaje directamente con:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleOpenWebmail('gmail')}
                disabled={!body}
                className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
              >
                <Mail className="w-4 h-4" />
                <span>Abrir Gmail</span>
              </button>

              <button
                onClick={() => handleOpenWebmail('outlook')}
                disabled={!body}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
              >
                <Mail className="w-4 h-4" />
                <span>Abrir Outlook</span>
              </button>

              <button
                onClick={handleMailto}
                disabled={!body}
                className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-3 rounded-xl text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-40"
              >
                <ExternalLink className="w-4 h-4" />
                <span>App Predeterminada</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
