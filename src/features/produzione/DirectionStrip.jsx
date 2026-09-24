import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// "Prendi da → Porta a": rende esplicita la direzione del movimento (nota del 2026-09-24 sul prototipo).
export function DirectionStrip({ from, to, pending = false, tone = 'rose' }) {
  // Sempre affiancati (anche su smartphone): la direzione si legge da sinistra a destra.
  const box = 'flex flex-col gap-0.5 min-w-0 px-3 py-2.5 sm:px-4 sm:py-3 rounded-[var(--radius-card,16px)] border';
  return (
    <div aria-label="Direzione del movimento" className="grid grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] items-stretch gap-1 sm:gap-2">
      <div className={cn(box, 'border-border bg-black/[0.03] dark:bg-white/[0.04]')}>
        <span className="app-label text-muted-foreground">{from.label}</span>
        <span className="app-h3 truncate">{from.titolo}</span>
        {from.dettaglio && <span className="app-body text-muted-foreground truncate">{from.dettaglio}</span>}
      </div>
      <div className={cn('flex items-center justify-center', tone === 'rose' ? 'text-accent-rose' : 'text-accent-emerald')} aria-hidden="true">
        <ArrowRight className="size-5 sm:size-6" />
      </div>
      <div className={cn(box, pending ? 'border-dashed border-accent-orange/60 bg-accent-orange/[0.05]' : 'border-accent-blue/35 bg-accent-blue/[0.06]')}>
        <span className="app-label text-muted-foreground">{to.label}</span>
        <span className="app-h3 truncate">{to.titolo}</span>
        {to.dettaglio && <span className="app-body text-muted-foreground truncate">{to.dettaglio}</span>}
      </div>
    </div>
  );
}
