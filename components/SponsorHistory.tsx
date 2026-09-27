'use client';

import InfoTooltip from '@/components/InfoTooltip';

// Historial de la empresa en USCIS (año fiscal 2026), vinculado a la oferta por el backend
// (columnas jobs.sponsor_company_id y jobs.sponsor_match).
export interface SponsorData {
  employer_name: string;
  consular_processed: string | null;
  total_approved: number | null;
  cap_type: string | null;
}

export type SponsorMatch = 'exacta' | 'probable' | 'ambigua' | 'otro_estado' | 'sin_historial' | null;

// Qué significa cada tipo de cupo, en palabras de quien postula
const CAP_LABELS: Record<string, { label: string; detail: string }> = {
  '1st Half': { label: 'Invierno', detail: 'temporadas que empiezan entre octubre y marzo' },
  '2nd Half': { label: 'Verano', detail: 'temporadas que empiezan entre abril y septiembre' },
  Supplemental: { label: 'Visas suplementarias', detail: 'visas adicionales que el gobierno libera cuando se agota el cupo' },
  Exempt: { label: 'Exenta del cupo', detail: 'peticiones que no cuentan para el límite anual, como extensiones o cambios de empleador' },
};

const capList = (capType: string | null) =>
  (capType || '')
    .split(',')
    .map((c) => c.trim())
    .filter((c) => CAP_LABELS[c]);

const hiresAbroad = (s: SponsorData) => (s.consular_processed || '').toLowerCase() === 'yes';

interface Props {
  sponsor: SponsorData | null | undefined;
  match: SponsorMatch;
  variant?: 'compact' | 'full';
}

export default function SponsorHistory({ sponsor, match, variant = 'compact' }: Props) {
  const visible = sponsor && (match === 'exacta' || match === 'probable' || match === 'otro_estado');

  if (!visible) {
    // Sin historial: aviso neutral, no acusa a la empresa
    if (match !== 'sin_historial') return null;
    const text =
      'Esta empresa no tiene peticiones H-2B aprobadas por USCIS en el año fiscal 2026. Puede ser nueva en el programa o usar otro nombre legal. No es algo malo, pero revisa la oferta con más cuidado.';
    return variant === 'compact' ? (
      <InfoTooltip text={text}>
        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
          Sin historial en USCIS 2026
        </span>
      </InfoTooltip>
    ) : (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600">
        <strong className="text-slate-800">Historial en USCIS:</strong> {text}
      </div>
    );
  }

  const abroad = hiresAbroad(sponsor);
  const approved = sponsor.total_approved ?? 0;
  const caps = capList(sponsor.cap_type);
  const otherStates = match === 'otro_estado';

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <InfoTooltip
          text={
            abroad
              ? 'En 2026 esta empresa trajo trabajadores con visa tramitada en un consulado fuera de EE. UU. Es la mejor señal de que contrata a personas que postulan desde su país.'
              : 'En 2026 esta empresa solo usó visas para trabajadores que ya estaban en EE. UU. (extensiones o cambios de empleador). Postular desde fuera puede ser más difícil.'
          }
        >
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              abroad ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {abroad ? '🌎 Contrata desde el extranjero' : 'Solo contrató dentro de EE. UU.'}
          </span>
        </InfoTooltip>
        <span className="text-[10px] font-semibold text-slate-600">
          {approved} {approved === 1 ? 'visa aprobada' : 'visas aprobadas'} en 2026
          {otherStates && ' · en otros estados'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2 border-t border-slate-100 pt-3 text-left">
      <h3 className="font-bold text-blue-900 text-xs">Historial de la empresa en USCIS (año fiscal 2026)</h3>
      {otherStates && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          Historial de la empresa en otros estados: sus visas de 2026 fueron para otros lugares de trabajo, no para el estado de esta oferta.
        </p>
      )}
      <ul className="text-[11px] text-slate-700 space-y-1">
        <li>
          <strong>{abroad ? '🌎 Contrata desde el extranjero:' : 'Solo contrató dentro de EE. UU.:'}</strong>{' '}
          {abroad
            ? 'trajo trabajadores con visa tramitada en un consulado fuera de EE. UU.'
            : 'sus visas fueron para personas que ya estaban en EE. UU.; postular desde fuera puede ser más difícil.'}
        </li>
        <li>
          <strong>Visas aprobadas:</strong> {approved}
        </li>
        {caps.length > 0 && (
          <li>
            <strong>Tipo de cupo:</strong>{' '}
            {caps.map((c) => `${CAP_LABELS[c].label} (${CAP_LABELS[c].detail})`).join('; ')}
          </li>
        )}
      </ul>
      <p className="text-[10px] text-slate-400">
        Registrada en USCIS como {sponsor.employer_name}. Datos públicos del H-2B Employer Data Hub.
      </p>
    </div>
  );
}
