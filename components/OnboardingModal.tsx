'use client';

import { useState } from "react";
import { supabase } from '@/lib/supabaseClient';

interface OnboardingModalProps {
  isOpen: boolean;
  userId: string;
  onComplete: () => void;
}

export default function OnboardingModal({ isOpen, userId, onComplete }: OnboardingModalProps) {
  // Todos los Hooks van PRIMERO, antes de cualquier "return" condicional.
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    experiencia_industria: '',
    anos_experiencia: 0,
    nivel_ingles: '',
    pais_origen: '',
  });

  // El "return null" va DESPUÉS de todos los Hooks, nunca antes.
  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);

    // Guardado en la tabla profiles de Supabase
   const { error } = await supabase
  .from('profiles')
  .upsert({
    id: userId,
    experiencia_industria: formData.experiencia_industria,
    anos_experiencia: Number(formData.anos_experiencia),
    nivel_ingles: formData.nivel_ingles,
    pais_origen: formData.pais_origen,
    perfil_completado: true,
  });

    setLoading(false);

    if (!error) {
      onComplete();
    } else {
      alert('Error al guardar el perfil: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08131F]/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100">

        {/* Encabezado y Progreso */}
        <div className="mb-6 text-center">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#C89B3C] bg-[#C89B3C]/10 rounded-full mb-3">
            Paso {step} de 2 • Diagnóstico Inicial H2B
          </span>
          <h2 className="text-2xl font-extrabold text-[#08131F]">
            {step === 1 ? 'Tu Experiencia Laboral' : 'Detalles de Postulación'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configuramos tu perfil para priorizar las vacantes con mayor compatibilidad.
          </p>

          {/* Indicador de pasos */}
          <div className="flex gap-2 mt-4">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-[#C89B3C]' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-[#C89B3C]' : 'bg-slate-200'}`} />
          </div>
        </div>

        {/* PASO 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                ¿En qué industria tienes mayor experiencia?
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:border-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/20 transition"
                value={formData.experiencia_industria}
                onChange={(e) => setFormData({ ...formData, experiencia_industria: e.target.value })}
              >
                <option value="">Selecciona una opción</option>
                <option value="Hotelería / Limpieza">Hotelería / Limpieza (Housekeeping)</option>
                <option value="Cocina / Restaurantes">Cocina / Restaurantes (Cook / Line Cook)</option>
                <option value="Paisajismo / Jardinería">Paisajismo / Jardinería (Landscaping)</option>
                <option value="Construcción">Construcción</option>
                <option value="Mantenimiento / General">Mantenimiento / General</option>
                <option value="Sin Experiencia">Sin experiencia previa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Años totales de experiencia laboral:
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:border-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/20 transition"
                value={formData.anos_experiencia}
                onChange={(e) => setFormData({ ...formData, anos_experiencia: Number(e.target.value) })}
              >
                <option value={0}>Menos de 1 año</option>
                <option value={1}>1 a 2 años</option>
                <option value={3}>3 a 5 años</option>
                <option value={5}>Más de 5 años</option>
              </select>
            </div>

            <button
              disabled={!formData.experiencia_industria}
              onClick={() => setStep(2)}
              className="w-full mt-6 rounded-xl bg-[#08131F] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#08131F]/90 disabled:opacity-50 transition"
            >
              Siguiente Paso →
            </button>
          </div>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nivel de Inglés:
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:border-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/20 transition"
                value={formData.nivel_ingles}
                onChange={(e) => setFormData({ ...formData, nivel_ingles: e.target.value })}
              >
                <option value="">Selecciona tu nivel</option>
                <option value="Ninguno">Ninguno / Muy Básico</option>
                <option value="Intermedio">Intermedio (Puedo conversar)</option>
                <option value="Avanzado">Avanzado / Fluido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                País de Ciudadanía / Pasaporte:
              </label>
              <input
                type="text"
                placeholder="Ej. México, Colombia, Guatemala, etc."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:border-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/20 transition"
                value={formData.pais_origen}
                onChange={(e) => setFormData({ ...formData, pais_origen: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 rounded-xl border border-slate-300 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={loading || !formData.nivel_ingles || !formData.pais_origen}
                onClick={handleSubmit}
                className="w-2/3 rounded-xl bg-[#C89B3C] py-3.5 text-sm font-bold text-[#08131F] shadow-md hover:bg-[#b08833] disabled:opacity-50 transition"
              >
                {loading ? 'Guardando...' : 'Generar Mi Hoja de Ruta ✨'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}