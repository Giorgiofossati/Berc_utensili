import React from 'react';
import { cn } from '@/lib/utils';
import { ETICHETTE_STATO, ORDINE_STATI } from './lifecycleSelectors';

// Scelta Usato / Riaffilato / Nuovo. Con `conteggi` mostra i disponibili, blocca gli stati a zero
// e segna il consigliato; senza `conteggi` (deposito) è una scelta libera.
export function StatoPicker({ value, onChange, conteggi, consigliato, ordine = ORDINE_STATI, className }) {
  return (
    <div
      role="radiogroup"
      aria-label="Stato del pezzo"
      className={cn('grid grid-cols-3 gap-1 p-1 rounded-[var(--radius-card,16px)] border border-border bg-black/[0.03] dark:bg-white/[0.04]', className)}
    >
      {ordine.map(stato => {
        const n = conteggi ? conteggi[stato] : null;
        const vuoto = conteggi && n === 0;
        const selected = value === stato;
        return (
          <button
            key={stato}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={vuoto}
            onClick={() => onChange(stato)}
            className={cn(
              'min-h-14 px-2 rounded-[var(--radius-control,12px)] flex flex-col items-center justify-center gap-0.5 text-sm font-extrabold transition-colors outline-none cursor-pointer',
              'focus-visible:ring-2 focus-visible:ring-accent-blue/50',
              vuoto && 'text-muted-foreground opacity-60 cursor-not-allowed',
              !vuoto && !selected && 'text-foreground hover:bg-accent-blue/[0.06]',
              selected && 'text-foreground bg-accent-blue/10 ring-[1.5px] ring-inset ring-accent-blue'
            )}
          >
            <span>{ETICHETTE_STATO[stato]}</span>
            {conteggi && (
              <span className="text-xs font-semibold text-muted-foreground">
                {vuoto ? 'nessuno' : `${n} disp${stato === consigliato ? ' · consigliato' : ''}`}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
