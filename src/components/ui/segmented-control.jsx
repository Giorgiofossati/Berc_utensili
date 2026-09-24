import React from 'react';
import { ToggleGroup, Toggle } from '@base-ui/react';
import { cn } from '@/lib/utils';

export function SegmentedControl({
  value,
  onValueChange,
  options,
  ariaLabel = "Seleziona opzione",
  className
}) {
  // opt.compact: sotto `lg` resta solo l'icona (etichetta sr-only) — per i controlli dentro l'AppBar (§2.2)
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(val) => {
        if (val[0] !== undefined) onValueChange(val[0]);
      }}
      aria-label={ariaLabel}
      className={cn("inline-flex items-center bg-muted/50 p-1 rounded-[var(--radius-control,12px)] border", className)}
    >
      {options.map((opt) => (
        <Toggle
          key={opt.value}
          value={opt.value}
          className={cn(
            "inline-flex items-center justify-center min-h-[36px] min-w-[44px] px-4 rounded-md text-sm font-bold uppercase tracking-wide transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50",
            "text-muted-foreground hover:text-foreground",
            "data-[pressed]:bg-background data-[pressed]:text-accent-blue data-[pressed]:shadow-sm data-[pressed]:ring-1 data-[pressed]:ring-accent-blue/30",
            opt.className
          )}
        >
          {opt.icon && <span className={opt.compact ? "lg:mr-2" : "mr-2"}>{opt.icon}</span>}
          {opt.compact ? <span className="max-lg:sr-only">{opt.label}</span> : opt.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
