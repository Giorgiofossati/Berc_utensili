import React from 'react';
import { cn } from '@/lib/utils';
import { X, Filter } from 'lucide-react';
import { Drawer } from '@base-ui/react';

export function FilterChip({ label, active, onRemove, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-[36px] px-3 rounded-[var(--radius-control,12px)] text-sm font-medium transition-colors border outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50",
        active 
          ? "bg-accent-blue/10 text-accent-blue border-accent-blue/20" 
          : "bg-black/5 dark:bg-white/5 border-transparent text-foreground hover:bg-black/10 dark:hover:bg-white/10",
        className
      )}
    >
      <span className="truncate max-w-[120px]">{label}</span>
      {active && onRemove && (
        <span 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-accent-blue/20 rounded-full p-0.5 -mr-1"
        >
          <X className="w-4 h-4" />
        </span>
      )}
    </button>
  );
}

export function MobileFiltersDrawer({ 
  open, 
  onOpenChange, 
  children,
  triggerLabel = "Altri filtri",
  triggerIcon = <Filter className="w-4 h-4" />,
  activeCount = 0
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger className="inline-flex items-center gap-2 h-[36px] px-4 rounded-[var(--radius-control,12px)] bg-black/5 dark:bg-white/5 border-transparent text-sm font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
        {triggerIcon}
        <span className="hidden sm:inline">{triggerLabel}</span>
        {activeCount > 0 && (
          <span className="flex items-center justify-center bg-accent-blue text-white text-xs w-5 h-5 rounded-full font-bold">
            {activeCount}
          </span>
        )}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[var(--z-drawer)] transition-opacity" />
        <Drawer.Positioner className="fixed inset-0 z-[var(--z-drawer)] outline-none flex items-end">
          <Drawer.Popup className="w-full bg-background border-t border-border rounded-t-[var(--radius-panel,24px)] p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] shadow-2xl outline-none transform transition-transform">
            <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mb-6" />
            {children}
          </Drawer.Popup>
        </Drawer.Positioner>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
