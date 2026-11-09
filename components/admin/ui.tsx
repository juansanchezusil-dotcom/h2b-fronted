'use client'

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import InfoTooltip from '@/components/InfoTooltip'
import { fmtValor, type Kpi } from '@/lib/adminPanel'

export const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4'
export const subtle = 'text-slate-500 dark:text-slate-400'

export function Skeleton({ className = 'h-24' }: { className?: string }) {
  return <div className={`${className} rounded-2xl bg-slate-100 dark:bg-slate-800 motion-safe:animate-pulse`} aria-hidden="true" />
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className={`text-sm ${subtle} py-3`}>{children}</p>
}

// Aviso de muestra chica: los porcentajes con pocas personas cambian mucho con una sola
export function SmallSample({ n, min = 10 }: { n: number; min?: number }) {
  if (n >= min) return null
  return (
    <span className="inline-block text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-full px-2 py-0.5">
      n = {n}: muestra chica, úsalo como guía
    </span>
  )
}

export function HowTo({ text }: { text: string }) {
  return (
    <InfoTooltip text={text}>
      <span className="sr-only">¿Cómo se calcula?</span>
    </InfoTooltip>
  )
}

export function Avatar({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-full bg-[#0B4079] text-white text-[11px] font-bold dark:bg-[#C89B3C] dark:text-slate-900"
    >
      {label}
    </span>
  )
}

const TONE: Record<string, string> = {
  good: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
  warn: 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-300',
  bad: 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300',
  info: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}
// El estado va siempre con texto, nunca solo con color
export function Pill({ tone = 'info', children }: { tone?: keyof typeof TONE; children: React.ReactNode }) {
  return <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${TONE[tone]}`}>{children}</span>
}

// Mini gráfica de línea con relleno y punto final
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return <div className="h-7" aria-hidden="true" />
  const w = 100
  const h = 28
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)] as const)
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]!
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7 overflow-visible" role="img" aria-label={label}>
      <polygon points={`0,${h} ${line} ${w},${h}`} className="fill-[#C89B3C]/15" />
      <polyline points={line} fill="none" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" className="stroke-[#C89B3C]" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.2" className="fill-[#C89B3C]" />
    </svg>
  )
}

export function Delta({ pct, invert = false }: { pct: number | null; invert?: boolean }) {
  if (pct === null) return <span className={`text-[11px] ${subtle}`}>sin base de comparación</span>
  if (pct === 0) return <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${subtle}`}><Minus className="w-3 h-3" aria-hidden="true" /> igual</span>
  const up = pct > 0
  // Para errores o costo, subir es malo
  const good = invert ? !up : up
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${good ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
      {up ? <ArrowUpRight className="w-3 h-3" aria-hidden="true" /> : <ArrowDownRight className="w-3 h-3" aria-hidden="true" />}
      {up ? '+' : ''}
      {pct}% <span className="sr-only">{good ? 'mejora' : 'empeora'}</span>
    </span>
  )
}

export function KpiCard({ kpi, invert = false, hint, onClick }: { kpi: Kpi; invert?: boolean; hint?: string; onClick?: () => void }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{kpi.titulo}</p>
        <HowTo text={kpi.definicion} />
      </div>
      <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">{fmtValor(kpi.valor, kpi.formato)}</p>
      <div className="mt-1.5 min-h-[1.1rem]">
        <Delta pct={kpi.variacionPct} invert={invert} />
      </div>
      <div className="mt-1">
        <Sparkline values={kpi.spark} label={`Tendencia de ${kpi.titulo}`} />
      </div>
      {kpi.n !== undefined && kpi.n < 10 && <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-0.5">n = {kpi.n}</p>}
      {hint && <p className={`text-[11px] ${subtle} mt-0.5`}>{hint}</p>}
    </>
  )
  return onClick ? (
    <div className={`${card} relative hover:border-[#C89B3C] transition-colors`}>
      <button type="button" onClick={onClick} className="absolute inset-0 rounded-2xl" aria-label={`Ver ${kpi.titulo}`} />
      <div className="relative pointer-events-none [&_button]:pointer-events-auto [&_[role=tooltip]]:pointer-events-auto">{body}</div>
    </div>
  ) : (
    <div className={card}>{body}</div>
  )
}

// Indicador circular. valor 0-100
export function Ring({ value, label, size = 96 }: { value: number | null; label: string; size?: number }) {
  const r = 38
  const c = 2 * Math.PI * r
  const v = value === null ? 0 : Math.max(0, Math.min(100, value))
  const tone = value === null ? 'stroke-slate-300' : v >= 70 ? 'stroke-emerald-500' : v >= 40 ? 'stroke-[#C89B3C]' : 'stroke-rose-500'
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} role="img" aria-label={`${label}: ${value === null ? 'sin datos' : `${v} de 100`}`} className="shrink-0">
      <circle cx="48" cy="48" r={r} fill="none" strokeWidth="10" className="stroke-slate-200 dark:stroke-slate-800" />
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${(v / 100) * c} ${c}`}
        transform="rotate(-90 48 48)"
        className={`${tone} motion-safe:transition-[stroke-dasharray] motion-safe:duration-700`}
      />
      <text x="48" y="55" textAnchor="middle" className="fill-slate-900 dark:fill-white" style={{ font: '800 22px system-ui' }}>
        {value === null ? '—' : v}
      </text>
    </svg>
  )
}

// Barras horizontales. Con onSelect cada barra es un botón que filtra el resto del panel.
export function HBars({
  rows,
  onSelect,
  selected,
  format = (n: number) => n.toLocaleString('es'),
}: {
  rows: { key: string; label: string; value: number; sub?: string }[]
  onSelect?: (key: string) => void
  selected?: string | null
  format?: (n: number) => string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const inner = (
          <>
            <span className="flex justify-between gap-2 text-xs text-slate-700 dark:text-slate-300">
              <span className="truncate">{r.label}</span>
              <span className="font-bold tabular-nums shrink-0">
                {format(r.value)}
                {r.sub && <span className={`font-normal ${subtle}`}> · {r.sub}</span>}
              </span>
            </span>
            <span className="block h-2 mt-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <span
                className={`block h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 ${selected === r.key ? 'bg-[#C89B3C]' : 'bg-[#0B4079] dark:bg-[#6ea3e6]'}`}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </span>
          </>
        )
        return (
          <li key={r.key}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(r.key)}
                aria-pressed={selected === r.key}
                className="w-full text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 px-1 -mx-1 py-0.5 focus-visible:outline-2 focus-visible:outline-[#C89B3C]"
              >
                {inner}
              </button>
            ) : (
              inner
            )}
          </li>
        )
      })}
    </ul>
  )
}

// Columnas por día con promedio móvil (línea). Cada columna lleva su etiqueta para el lector de pantalla y el título.
export function DayBars({
  values,
  endDate = new Date(),
  movingAvg = 7,
  stepDays = 1,
  format = (n: number) => String(n),
  label,
}: {
  values: number[]
  endDate?: Date
  movingAvg?: number
  stepDays?: number // 1 = una barra por día; 7 = una por semana
  format?: (n: number) => string
  label: string
}) {
  if (!values.length) return null
  const max = Math.max(...values, 0.0001)
  const dayLabel = (i: number) => {
    const d = new Date(endDate.getTime() - (values.length - 1 - i) * stepDays * 86_400_000)
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  }
  const avg = values.map((_, i) => {
    const from = Math.max(0, i - movingAvg + 1)
    const slice = values.slice(from, i + 1)
    return slice.reduce((s, v) => s + v, 0) / slice.length
  })
  const w = 100
  const h = 100
  const line = avg.map((v, i) => `${((i + 0.5) / values.length) * w},${h - (v / max) * h * 0.92}`).join(' ')
  const total = values.reduce((s, v) => s + v, 0)
  return (
    <div>
      <div className="relative h-28" role="img" aria-label={`${label}. Total ${format(total)} en ${values.length * stepDays} días.`}>
        <div className="absolute inset-0 flex items-end gap-px">
          {values.map((v, i) => (
            <div key={i} className="flex-1 h-full flex items-end" title={`${dayLabel(i)}: ${format(v)}`}>
              <div className="w-full rounded-t-sm bg-[#C89B3C]/80" style={{ height: `${Math.max(v > 0 ? 3 : 0.5, (v / max) * 100)}%`, opacity: v > 0 ? 1 : 0.25 }} />
            </div>
          ))}
        </div>
        {values.length > movingAvg && (
          <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            <polyline points={line} fill="none" strokeWidth="1.6" vectorEffect="non-scaling-stroke" className="stroke-[#0B4079] dark:stroke-[#6ea3e6]" />
          </svg>
        )}
      </div>
      <div className={`flex justify-between text-[10px] ${subtle} mt-1`}>
        <span>{dayLabel(0)}</span>
        {values.length > movingAvg && <span>— promedio de {movingAvg} días</span>}
        <span>{dayLabel(values.length - 1)}</span>
      </div>
    </div>
  )
}

export function SectionTitle({ children, help }: { children: React.ReactNode; help?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <h2 className="text-sm font-bold text-slate-800 dark:text-white">{children}</h2>
      {help && <HowTo text={help} />}
    </div>
  )
}

export const ago = (iso: string) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`
}

export const ESTADO_LABEL: Record<string, string> = {
  activo: 'Activo',
  enfriandose: 'Enfriándose',
  en_riesgo: 'En riesgo',
  inactivo: 'Inactivo',
  nunca_entro: 'Nunca entró',
}
export const ESTADO_TONE: Record<string, 'good' | 'warn' | 'bad' | 'info'> = {
  activo: 'good',
  enfriandose: 'warn',
  en_riesgo: 'bad',
  inactivo: 'bad',
  nunca_entro: 'bad',
}
export const STATUS_LABEL: Record<string, string> = {
  guardadas: 'Guardadas',
  postulado: 'Postulado',
  seguimiento: 'Follow-up',
  entrevista: 'Entrevista',
  aceptado: 'Aceptado',
  rechazada: 'Rechazada',
  no_respondido: 'Sin respuesta',
}
