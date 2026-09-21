'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import OnboardingModal from '@/components/OnboardingModal';

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [loadingCheck, setLoadingCheck] = useState(true);

  useEffect(() => {
    async function checkUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);

          // Consultar el perfil en Supabase
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('perfil_completado')
            .eq('id', user.id)
            .maybeSingle(); // Usar maybeSingle() para evitar excepciones si no existe el registro

          // Muestra el modal si no hay perfil, hay error, o perfil_completado no es explícitamente true
          if (error || !profile || profile.perfil_completado !== true) {
            setShowModal(true);
          }
        }
      } catch (err) {
        console.error('Error al verificar perfil:', err);
        setShowModal(true); // En caso de duda, forzamos mostrar el modal
      } finally {
        setLoadingCheck(false);
      }
    }

    checkUserProfile();
  }, [supabase]);

  if (loadingCheck) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08131F]">
        <p className="text-sm font-medium text-slate-300">Cargando tu panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Vista principal del Dashboard */}
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#08131F]">Centro de Control H2B</h1>
      </div>

      {/* Modal Flotante Bloqueante */}
      <OnboardingModal
        isOpen={showModal}
        userId={userId}
        onComplete={() => {
          setShowModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
}