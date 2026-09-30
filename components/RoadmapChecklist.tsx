'use client';

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  FileText, 
  Briefcase, 
  Send, 
  Award, 
  Sparkles,
  ChevronRight,
  Edit3
} from 'lucide-react';

interface RoadmapChecklistProps {
  userId?: string;
  hasCompletedQuiz?: boolean;
  hasCv?: boolean;
  onEditProfile?: () => void;
  onOpenCvBuilder?: () => void;
  onNavigateToTab?: (tabName: string) => void;
}

// Perfil + CV (automáticos) + las 3 tareas manuales
export const CHECKLIST_TOTAL_TASKS = 5;

const EMPTY_STEPS: Record<string, boolean> = {
  passport: false,
  saved_jobs: false,
  ds160: false,
};

// Se guarda en el navegador, separado por usuario, para que el avance
// sobreviva al cambiar de pestaña o recargar.
const storageKey = (userId: string) => `h2b-checklist-${userId}`;

export function readChecklistSteps(userId?: string): Record<string, boolean> {
  if (!userId || typeof window === 'undefined') return { ...EMPTY_STEPS };
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? { ...EMPTY_STEPS, ...JSON.parse(raw) } : { ...EMPTY_STEPS };
  } catch {
    return { ...EMPTY_STEPS };
  }
}

export default function RoadmapChecklist({
  userId,
  hasCompletedQuiz = false,
  hasCv = false,
  onEditProfile,
  onOpenCvBuilder,
  onNavigateToTab
}: RoadmapChecklistProps) {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(EMPTY_STEPS);

  useEffect(() => {
    setCompletedSteps(readChecklistSteps(userId));
  }, [userId]);

  const toggleStep = (key: string) => {
    setCompletedSteps(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (userId) {
        try {
          window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
        } catch {
          // Sin almacenamiento (modo privado): el avance dura solo esta visita
        }
      }
      return next;
    });
  };

  // Progreso global (perfil y CV cuentan solos, sin necesidad de marcarlos a mano)
  const totalTasks = CHECKLIST_TOTAL_TASKS;
  const completedCount =
    (hasCompletedQuiz ? 1 : 0) + (hasCv ? 1 : 0) + Object.values(completedSteps).filter(Boolean).length;
  const progressPercentage = Math.round((completedCount / totalTasks) * 100);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 font-sans">
      
      {/* HEADER & BARRA DE PROGRESO GLOBAL */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#C89B3C]/20 text-[#C89B3C] text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-[#C89B3C]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acompañamiento H-2B Paso a Paso</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
              Hoja de Ruta de Postulación
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Sigue estas 4 etapas clave para asegurar tu vacante laboral y preparar tu visado consular.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center min-w-[160px]">
            <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">Tu Progreso</span>
            <span className="text-3xl font-extrabold text-[#C89B3C]">{progressPercentage}%</span>
            <span className="text-xs text-slate-400 block mt-0.5">{completedCount} de {totalTasks} completados</span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="bg-gradient-to-r from-[#C89B3C] to-emerald-400 h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* FASES Y ETAPAS */}
      <div className="grid gap-6">

        {/* ETAPA 1: DIAGNÓSTICO E IDONEIDAD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${hasCompletedQuiz ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#C89B3C] uppercase tracking-wider">Etapa 1</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Perfilamiento e Idoneidad H-2B</h3>
              </div>
            </div>
            {hasCompletedQuiz && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Completado
              </span>
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                {hasCompletedQuiz ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Evaluación de Perfil Inicial</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {hasCompletedQuiz 
                      ? 'Tu diagnóstico inicial fue realizado con éxito para determinar tu Match Score en las vacantes.' 
                      : 'Define tu experiencia, nivel de inglés y país elegible para calcular el Match Score de las ofertas.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onEditProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{hasCompletedQuiz ? 'Editar Perfil' : 'Completar Perfil'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ETAPA 2: PREPARACIÓN DE DOCUMENTOS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#C89B3C] uppercase tracking-wider">Etapa 2</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Documentación de Candidato</h3>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            {/* Pasaporte */}
            <div
              onClick={() => toggleStep('passport')}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStep('passport') }
              }}
              role="checkbox"
              aria-checked={completedSteps.passport}
              tabIndex={0}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-3">
                {completedSteps.passport ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Pasaporte Vigente</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mínimo 6 meses de vigencia contados a partir del inicio de la temporada laboral.</p>
                </div>
              </div>
            </div>

            {/* CV en Inglés */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                {hasCv ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Curriculum Vitae Estilo EE. UU. (US Resume)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {hasCv
                      ? 'Tu CV ya está listo. También se usa para personalizar tus correos de postulación.'
                      : 'Cuéntanos tu experiencia real y la IA la adapta al formato sin foto que esperan los empleadores. También alimenta el redactor de correos.'}
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenCvBuilder}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#C89B3C] hover:text-[#b08732] bg-[#C89B3C]/10 hover:bg-[#C89B3C]/20 rounded-lg transition-colors border border-[#C89B3C]/20 shrink-0"
              >
                <span>{hasCv ? 'Editar CV' : 'Generar con IA'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ETAPA 3: BÚSQUEDA Y POSTULACIÓN ACTIVA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#C89B3C] uppercase tracking-wider">Etapa 3</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Postulación Estratégica en el Portal</h3>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <div
              onClick={() => toggleStep('saved_jobs')}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStep('saved_jobs') }
              }}
              role="checkbox"
              aria-checked={completedSteps.saved_jobs}
              tabIndex={0}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-3">
                {completedSteps.saved_jobs ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Guardar al menos 5 Ofertas con Match &gt; 80%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Prioriza vacantes acordes a tu rubro en la pestaña Ofertas para organizarlas en Tu CRM.</p>
                </div>
              </div>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onNavigateToTab?.('jobs'); 
                }}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
              >
                Ver Ofertas
              </button>
            </div>
          </div>
        </div>

        {/* ETAPA 4: PROCESO CONSULAR Y APROBACIÓN */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#C89B3C] uppercase tracking-wider">Etapa 4</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contratación y Trámite Consular</h3>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <div
              onClick={() => toggleStep('ds160')}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStep('ds160') }
              }}
              role="checkbox"
              aria-checked={completedSteps.ds160}
              tabIndex={0}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-3">
                {completedSteps.ds160 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Llenado de Formulario Consular DS-160</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Se completa una vez que el empleador te envíe la petición aprobada I-797 / ETA-9142B.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}