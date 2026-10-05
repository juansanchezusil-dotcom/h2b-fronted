'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useBackToClose } from '@/hooks/useBackToClose';

interface AssistantModalProps {
  isOpen: boolean;
  // Nombre del asistente, para lectores de pantalla (el título visible lo pone el contenido)
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}

// Marco común de los asistentes de IA (redactor, simulador, detector): todos se abren como ventana
// emergente, igual que el CV y Postular. Se ve al instante (sin buscar el contenido debajo de las
// tarjetas), se abre uno a la vez, y "Atrás" o Escape lo cierran.
export default function AssistantModal({ isOpen, label, onClose, children }: AssistantModalProps) {
  useBackToClose(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // El fondo no se desplaza mientras la ventana está abierta
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#08131F]/80 backdrop-blur-md p-4"
    >
      <div className="relative w-full max-w-3xl max-h-[92dvh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-20 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="max-h-[92dvh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
