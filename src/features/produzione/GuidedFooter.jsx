import React from 'react';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { ModalFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Footer comune dei flussi guidati: riepilogo, errore, [Indietro] + conferma.
// Su smartphone "Indietro" diventa un'icona da 48px così la conferma ha tutto lo spazio.
export function GuidedFooter({ onBack, onConfirm, confirmLabel, tone = 'scarica', disabled, isSubmitting, riepilogo, errore, children }) {
  return (
    <ModalFooter className="sm:flex-col sm:items-stretch gap-3">
      {errore && (
        <p role="alert" className="app-body text-accent-rose flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-px" />
          {errore}
        </p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {riepilogo && <p className="flex-1 min-w-0 app-body text-muted-foreground max-sm:text-center">{riepilogo}</p>}
        <div className={cn('flex items-center gap-3', !riepilogo && 'sm:ml-auto')}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Indietro"
            className="glass-button min-h-12 max-sm:w-12 sm:px-5 rounded-[var(--radius-control,12px)] flex items-center justify-center text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
          >
            <ArrowLeft size={20} className="sm:hidden" />
            <span className="max-sm:hidden">Indietro</span>
          </button>
          {children}
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={disabled}
              className={cn(
                tone === 'carica' ? 'action-btn-carica' : 'action-btn-scarica',
                'flex-1 sm:flex-none min-w-0 min-h-12 px-4 sm:px-6 rounded-[var(--radius-control,12px)] text-sm font-black uppercase tracking-wide sm:tracking-wider whitespace-nowrap flex items-center justify-center gap-2',
                disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              )}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {confirmLabel}
              <kbd className="max-sm:hidden font-mono text-xs font-semibold px-1.5 py-0.5 rounded-[var(--radius-tag,6px)] bg-white/20">Invio</kbd>
            </button>
          )}
        </div>
      </div>
    </ModalFooter>
  );
}
