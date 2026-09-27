'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  itemLabel: string; // "ofertas", "empresas", "agencias"
  disabled?: boolean;
  onChange: (page: number) => void;
}

// Números a mostrar: siempre la primera y la última, y las vecinas de la actual.
// Ej. en la página 7 de 56: 1 … 6 7 8 … 56
function pageList(page: number, totalPages: number): (number | '…')[] {
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0) {
      const gap = p - sorted[i - 1];
      if (gap === 2) result.push(p - 1); // un solo número escondido: mejor mostrarlo
      else if (gap > 2) result.push('…');
    }
    result.push(p);
  });
  return result;
}

export default function Pagination({ page, totalPages, totalItems, itemLabel, disabled, onChange }: PaginationProps) {
  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    onChange(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const arrow = 'h-9 px-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
      <p className="text-xs text-slate-500">
        Página <strong className="text-slate-900">{page}</strong> de <strong className="text-slate-900">{totalPages}</strong> ({totalItems} {itemLabel})
      </p>

      <nav aria-label="Paginación" className="flex items-center gap-1 flex-wrap justify-center">
        <button onClick={() => go(page - 1)} disabled={page === 1 || disabled} className={arrow} aria-label="Página anterior">
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {pageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="w-6 text-center text-xs text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => go(p)}
              disabled={disabled}
              aria-current={p === page ? 'page' : undefined}
              className={`h-9 min-w-9 px-2 rounded-xl text-xs font-bold transition-colors ${
                p === page
                  ? 'bg-[#0B4079] text-white'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button onClick={() => go(page + 1)} disabled={page === totalPages || disabled} className={arrow} aria-label="Página siguiente">
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
