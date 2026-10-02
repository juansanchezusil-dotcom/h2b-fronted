'use client';

import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icons: [LucideIcon, LucideIcon, LucideIcon];
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

const tile =
  'w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-500 dark:text-slate-400';

export default function EmptyState({ icons: [Left, Center, Right], title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-14 px-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
      <div className="flex items-end" aria-hidden="true">
        <div className={`${tile} -rotate-6 translate-x-2 translate-y-1`}>
          <Left className="w-5 h-5" />
        </div>
        <div className={`${tile} relative z-10 text-[#0B4079] dark:text-[#C89B3C]`}>
          <Center className="w-5 h-5" />
        </div>
        <div className={`${tile} rotate-6 -translate-x-2 translate-y-1`}>
          <Right className="w-5 h-5" />
        </div>
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
