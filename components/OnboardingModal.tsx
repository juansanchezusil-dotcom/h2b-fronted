'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useBackToClose } from '@/hooks/useBackToClose';

interface OnboardingModalProps {
  isOpen: boolean;
  userId: string;
  onComplete: () => void;
  // Cerrar sin guardar (saltar ahora o cancelar la edición del perfil)
  onClose?: () => void;
}

export default function OnboardingModal({ isOpen, userId, onComplete, onClose }: OnboardingModalProps) {
  // Todos los Hooks van PRIMERO, antes de cualquier "return" condicional.
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({  
  experiencia_industria: '',
  anos_experiencia: 0,
  nivel_ingles: '',
  pais_origen: '',
  has_previous_h2b: null as boolean | null,
});
  useEffect(() => {
    async function loadExistingProfile() {
      if (!isOpen || !userId) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setFormData({
          experiencia_industria: data.experiencia_industria || '',
          anos_experiencia: data.anos_experiencia || 0,
          nivel_ingles: data.nivel_ingles || '',
          pais_origen: data.pais_origen || '',
          has_previous_h2b: data.has_previous_h2b ?? null,
        });
      }
    }
    loadExistingProfile();
  }, [isOpen, userId]);
  useBackToClose(isOpen, onClose);
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
    has_previous_h2b: formData.has_previous_h2b,
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
      {/* Shell fijo (no scrollea): así el botón cerrar no se va con el contenido */}
      <div className="relative w-full max-w-lg max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
          >
            ✕
          </button>
        )}

        <div className="max-h-[90vh] overflow-y-auto p-6 md:p-8">

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
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full text-xs font-semibold text-slate-500 hover:text-slate-700 py-2"
              >
                Completar después
              </button>
            )}
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

            <div>
  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
    ¿Ya has viajado antes con visa H-2B?
  </label>
  <div className="flex gap-3">
    <button
      type="button"
      onClick={() => setFormData({ ...formData, has_previous_h2b: true })}
      className={`flex-1 rounded-xl border py-3 text-sm font-bold transition ${
        formData.has_previous_h2b === true
          ? 'border-[#C89B3C] bg-[#C89B3C]/10 text-[#08131F]'
          : 'border-slate-300 text-slate-600'
      }`}
    >
      Sí
    </button>
    <button
      type="button"
      onClick={() => setFormData({ ...formData, has_previous_h2b: false })}
      className={`flex-1 rounded-xl border py-3 text-sm font-bold transition ${
        formData.has_previous_h2b === false
          ? 'border-[#C89B3C] bg-[#C89B3C]/10 text-[#08131F]'
          : 'border-slate-300 text-slate-600'
      }`}
    >
      No
    </button>
  </div>
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
                disabled={loading || !formData.nivel_ingles || !formData.pais_origen || formData.has_previous_h2b === null}
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
    </div>
  );
}