'use client';

import { useEffect, useRef, useState } from 'react';

interface InfoTooltipProps {
  text: string;
  children: React.ReactNode;
}

// Explicación corta sobre un sello. En computadora aparece al pasar el mouse;
// en el celular (donde no hay "hover") se abre y cierra con un toque.
export default function InfoTooltip({ text, children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Cierra al tocar en cualquier otra parte
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex group">
      <button
        type="button"
        aria-label={text}
        onClick={(e) => {
          // No abre el detalle de la oferta al tocar el sello
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1 cursor-help"
      >
        {children}
        <span className="text-[9px] opacity-60">ⓘ</span>
      </button>
      <span
        role="tooltip"
        className={`${open ? 'block' : 'hidden'} group-hover:block absolute right-0 top-full mt-1.5 z-30 w-56 rounded-lg bg-slate-900 text-white text-[11px] font-medium leading-snug p-2.5 shadow-lg normal-case tracking-normal text-left`}
      >
        {text}
      </span>
    </span>
  );
}
