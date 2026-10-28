'use client'

import { Sparkles, FileText, Mail, ShieldAlert } from 'lucide-react'

interface AiToolsTabProps {
  hasCv: boolean
  setShowCvBuilder: (open: boolean) => void
  setShowEmailAssistant: (open: boolean) => void
  setShowInterviewSimulator: (open: boolean) => void
  setShowScamDetector: (open: boolean) => void
}

export default function AiToolsTab({
  hasCv,
  setShowCvBuilder,
  setShowEmailAssistant,
  setShowInterviewSimulator,
  setShowScamDetector,
}: AiToolsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-2">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Asistentes Virtuales IA</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Herramientas inteligentes para acelerar tu proceso de postulación laboral H2B.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Adaptador de CV H2B</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {hasCv
                  ? 'Tu CV ya está listo y alimenta el redactor de correos.'
                  : 'Cuéntanos tu experiencia real y la IA la adapta al formato que esperan los empleadores.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCvBuilder(true)}
            className="w-full bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs py-2.5 rounded-xl transition-all"
          >
            {hasCv ? 'Editar mi CV' : 'Generar mi CV con IA'}
          </button>
        </div>

        {/* Tarjeta 3: Asistente de Correo IA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start space-x-4 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Redactor de Correos H2B</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Crea emails de postulación y seguimiento profesionales para enviar por Gmail u Outlook.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowEmailAssistant(true)}
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
          >
            Abrir Redactor
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Simulador de Entrevista</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Práctica preguntas habituales de los patrocinadores laborales.</p>
            </div>
          </div>
          <button
            onClick={() => setShowInterviewSimulator(true)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
          >
            Practicar Entrevista
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Detector de Estafas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sube una captura o foto sospechosa y revisa si hay señales de fraude H-2B.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowScamDetector(true)}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
          >
            Abrir Detector
          </button>
        </div>
      </div>
    </div>
  )
}
