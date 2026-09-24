import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Contatore quantità compatto con −/+ da 44px e campo digitabile.
export function QuantityStepper({ value, onChange, min = 1, max, label = 'Quantità', className }) {
  const clamp = (n) => {
    let v = Number.isFinite(n) ? Math.round(n) : min;
    if (v < min) v = min;
    if (max != null && v > max) v = Math.max(min, max);
    return v;
  };
  const atMin = value <= min;
  const atMax = max != null && value >= max;
  const btn = 'w-11 h-12 rounded-[var(--radius-control,12px)] flex items-center justify-center text-foreground transition-colors hover:bg-accent-blue/[0.06] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50';

  return (
    <div className={cn('inline-flex items-center gap-1 p-1 rounded-[var(--radius-card,16px)] border border-border bg-black/[0.03] dark:bg-white/[0.04]', className)}>
      <button type="button" className={btn} onClick={() => onChange(clamp(value - 1))} disabled={atMin} aria-label={`Diminuisci ${label.toLowerCase()}`}>
        <Minus size={18} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max ?? undefined}
        value={value}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
        onFocus={(e) => e.target.select()}
        className="w-12 h-11 bg-transparent text-center text-xl font-black tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button type="button" className={btn} onClick={() => onChange(clamp(value + 1))} disabled={atMax} aria-label={`Aumenta ${label.toLowerCase()}`}>
        <Plus size={18} />
      </button>
    </div>
  );
}
