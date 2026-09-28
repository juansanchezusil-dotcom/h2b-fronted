'use client';

import { useEffect, useRef } from 'react';

// Hace que el botón "Atrás" del celular cierre el modal en vez de salir de la
// app (o mandar al login). Al abrir, mete una entrada falsa en el historial;
// "Atrás" la consume y solo cierra el modal.
export function useBackToClose(isOpen: boolean, onClose?: () => void) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!isOpen || !onClose) return;

    window.history.pushState({ modal: true }, '');
    pushed.current = true;

    const onPopState = () => {
      pushed.current = false;
      onClose();
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
      // Se cerró por otro medio (botón X, guardar...): limpia la entrada falsa
      if (pushed.current) {
        pushed.current = false;
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}
