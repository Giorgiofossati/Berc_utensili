import React from 'react';
import { cn } from '@/lib/utils';

// Chip di scelta rapida (DESIGN_SYSTEM §4.7): una risposta a una domanda guidata.
// Si usano in un ChoiceChipGroup, che si comporta come un gruppo radio.
export function ChoiceChipGroup({ label, className, children }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {children}
    </div>
  );
}

export function ChoiceChip({ selected = false, disabled = false, variant = 'default', onClick, className, children, ...props }) {
  const isAction = variant === 'action';
  return (
    <button
      type="button"
      role={isAction ? undefined : 'radio'}
      aria-checked={isAction ? undefined : selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 min-h-11 px-4 rounded-[var(--radius-control,12px)] text-sm font-bold transition-colors outline-none select-none cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-accent-blue/50',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isAction
          ? 'border border-dashed border-border text-muted-foreground hover:bg-accent-blue/[0.06] hover:text-foreground'
          : selected
            ? 'border-[1.5px] border-accent-blue bg-accent-blue/10 text-foreground'
            : 'border border-border bg-black/[0.03] dark:bg-white/[0.04] text-foreground hover:bg-accent-blue/[0.06]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
