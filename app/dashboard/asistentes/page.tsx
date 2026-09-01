'use client';

import { useState } from 'react';
import { 
  FileText, 
  Mail, 
  ShieldAlert, 
  UserCheck, 
  MessageSquareCode, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

// Definimos la estructura de nuestras mini-apps
interface Assistant {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'not_started' | 'in_progress' | 'completed';
  route: string;
}

export default function AssistantsHub() {
  // Aquí más adelante puedes cargar el estado real desde Supabase por cada usuario
  const [assistants] = useState<Assistant[]>([
    {
      id: 'evaluator',
      title: 'Evaluador de Perfil',
      description: 'Analiza tu experiencia, industria y nivel de inglés para configurar tu perfil global.',
      icon: UserCheck,
      status: 'completed', // Ejemplo de estado
      route: '/dashboard/asistentes/evaluador',
    },
    {
      id: 'cv_builder',
      title: 'Asistente de CV',
      description: 'Adapta tu currículum de forma inteligente según la oferta de trabajo objetivo.',
      icon: FileText,
      status: 'in_progress',
      route: '/dashboard/asistentes/cv',
    },
    {
      id: 'cover_letter',
      title: 'Cover Letter IA',
      description: 'Genera cartas de presentación persuasivas alineadas a la vacante y tu experiencia.',
      icon: Mail,
      status: 'not_started',
      route: '/dashboard/asistentes/cover-letter',
    },
    {
      id: 'scam_detector',
      title: 'Detector de Estafas',
      description: 'Evalúa ofertas laborales sospechosas para protegerte de fraudes en postulaciones.',
      icon: ShieldAlert,
      status: 'not_started',
      route: '/dashboard/asistentes/detector',
    },
    {
      id: 'interview_sim',
      title: 'Simulador de Entrevista',
      description: 'Practica preguntas y respuestas basadas en tu industria y nivel de inglés.',
      icon: MessageSquareCode,
      status: 'not_started',
      route: '/dashboard/asistentes/entrevista',
    },
  ]);

  // Función auxiliar para renderizar los badges de estado visualmente
  const renderStatusBadge = (status: Assistant['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completado
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> En progreso
          </span>
        );
      case 'not_started':
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5" /> No iniciado
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hub de Asistentes IA</h1>
        <p className="text-slate-500 mt-1">
          Herramientas inteligentes conectadas a tu perfil y tablero de postulaciones.
        </p>
      </div>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assistants.map((assistant) => {
          const IconComponent = assistant.icon;
          return (
            <div 
              key={assistant.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Decoración sutil superior */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent group-hover:via-indigo-500 transition-all duration-300" />

              <div className="space-y-4">
                {/* Cabecera de la tarjeta: Icono y Estado */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  {renderStatusBadge(assistant.status)}
                </div>

                {/* Títulos y Descripción */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {assistant.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {assistant.description}
                  </p>
                </div>
              </div>

              {/* Botón de acción */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Mini App
                </span>
                <a
                  href={assistant.route}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 group-hover:text-indigo-700 transition-colors"
                >
                  Abrir asistente
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}