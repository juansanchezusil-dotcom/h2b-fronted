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
      // Ojo: NO se llama history.back() aquí. Si dos modales con este hook se
      // turnan en el mismo render (uno se oculta, otro se muestra — ej. abrir
      // el CV desde dentro de Postular), un history.back() en la limpieza del
      // que se oculta consume la entrada que el OTRO acaba de empujar y lo
      // cierra por accidente. Costo: si se cierra por la X (no por "Atrás"),
      // queda una entrada de sobra — a lo mucho una pulsación extra de "Atrás"
      // más tarde, sin efecto visible. Mejor eso que un modal que no abre.
      pushed.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}
