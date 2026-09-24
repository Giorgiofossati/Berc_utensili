import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Domanda numerata di un flusso guidato (DESIGN_SYSTEM §4.8).
// Il numero diventa una spunta verde quando la domanda ha una risposta.
export function GuidedStep({ number, done = false, title, hint, children, className }) {
  return (
    <section className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex items-center gap-2.5 min-h-6">
        <span
          aria-hidden="true"
          className={cn(
            'w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-black',
            done ? 'bg-accent-emerald text-white' : 'bg-accent-blue/15 text-accent-blue ring-[1.5px] ring-inset ring-accent-blue'
          )}
        >
          {done ? <Check size={14} strokeWidth={3} /> : number}
        </span>
        <h3 className="app-h3 text-sm sm:text-base">{title}</h3>
        {hint && <span className="ml-auto app-body text-muted-foreground text-right max-sm:hidden">{hint}</span>}
      </div>
      <div className="sm:pl-[34px]">{children}</div>
    </section>
  );
}
