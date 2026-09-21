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
            "data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm",
            opt.className
          )}
        >
          {opt.icon && <span className="mr-2">{opt.icon}</span>}
          {opt.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
