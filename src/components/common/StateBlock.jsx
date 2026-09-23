import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, Inbox, FilterX, SearchX } from 'lucide-react';

export function StateBlock({ 
  state = 'success', 
  variant = 'generic',
  emptyVariant,
  skeletonShape,
  loadingMode = 'spinner',
  loading,
  title, 
  description, 
  error,
  action, 
  onAction,
  onRetry,
  cta,
  searchTerm,
  count,
  className, 
  children 
}) {
  const actualVariant = variant || emptyVariant || 'generic';
  const isSkeleton = Boolean(skeletonShape || loadingMode === 'skeleton' || loading === 'skeleton');
  const effectiveSkeletonShape = skeletonShape || (isSkeleton ? 'row' : null);

  if (state === 'success') {
    return children ? <>{children}</> : null;
  }

  if (state === 'loading' && isSkeleton && effectiveSkeletonShape) {
    const effectiveCount = count || (
      effectiveSkeletonShape === 'row' ? 5 :
      effectiveSkeletonShape === 'card' ? 6 : 8
    );
    const items = Array.from({ length: effectiveCount }, (_, i) => i);

    return (
      <div 
        role="status"
        aria-label={title || "Caricamento in corso..."}
        className={cn("w-full @container py-4", className)}
      >
        {effectiveSkeletonShape === 'row' && (
          <div className="flex flex-col gap-2.5">
            {items.map(i => (
              <div 
                key={i} 
                className="w-full h-14 bg-slate-200/50 dark:bg-slate-800/50 rounded-[var(--radius-panel,24px)] animate-shimmer" 
              />
            ))}
          </div>
        )}
        {effectiveSkeletonShape === 'card' && (
          <div className="grid grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-3 gap-4">
            {items.map(i => (
              <div 
                key={i} 
                className="w-full h-36 bg-slate-200/50 dark:bg-slate-800/50 rounded-[var(--radius-card,16px)] animate-shimmer" 
              />
            ))}
          </div>
        )}
        {effectiveSkeletonShape === 'grid' && (
          <div className="grid grid-cols-2 @sm:grid-cols-3 @md:grid-cols-4 @xl:grid-cols-6 gap-3 sm:gap-4">
            {items.map(i => (
              <div 
                key={i} 
                className="w-full aspect-square bg-slate-200/50 dark:bg-slate-800/50 rounded-[var(--radius-card,16px)] animate-shimmer" 
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const rawError = error || description;
  const rawMessage = typeof rawError === 'string'
    ? rawError
    : (rawError && typeof rawError === 'object' && typeof rawError.message === 'string' ? rawError.message : '');

  const isTechnicalError = (msg) => {
    if (!msg || typeof msg !== 'string') return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes('supabase') ||
      lower.includes('postgrest') ||
      lower.includes('postgres') ||
      lower.includes('pgrst') ||
      lower.includes('relation') ||
      lower.includes('duplicate key') ||
      lower.includes('syntax error') ||
      lower.includes('jwt') ||
      lower.includes('violates') ||
      lower.includes('constraint') ||
      lower.includes('foreign key') ||
      lower.includes('apikey') ||
      lower.includes('api key') ||
      lower.includes('token') ||
      lower.includes('failed to fetch') ||
      lower.includes('networkerror') ||
      lower.includes('permission denied') ||
      lower.includes('row-level security') ||
      lower.includes('column') ||
      lower.includes('schema') ||
      lower.includes('auth') ||
      lower.includes('upstream') ||
      lower.includes('[object object]') ||
      /\b(400|401|403|404|500|502|503|504)\b/.test(lower)
    );
  };

  let safeErrorDescription;
  if (rawMessage) {
    if (isTechnicalError(rawMessage)) {
      console.error('[StateBlock] Suppressed technical error from UI:', rawMessage);
      safeErrorDescription = "Non è stato possibile caricare i dati. Riprova più tardi.";
    } else {
      safeErrorDescription = rawMessage;
    }
  } else {
    safeErrorDescription = "Non è stato possibile caricare i dati. Riprova più tardi.";
  }

  const emptyContents = {
    generic: {
      icon: <Inbox size={32} className="text-slate-400" />,
      title: title || "Nessun dato registrato",
      description: description || "Non ci sono ancora dati da mostrare in questa sezione.",
      cta: cta || "Aggiungi nuovo",
    },
    filtered: {
      icon: <FilterX size={32} className="text-slate-400" />,
      title: title || "Nessun risultato per questi filtri",
      description: description || "Prova a modificare o reimpostare i filtri attivi.",
      cta: cta || "Reimposta filtri",
    },
    search: {
      icon: <SearchX size={32} className="text-slate-400" />,
      title: title || (searchTerm ? `Nessun risultato per «${searchTerm}»` : "Nessun risultato trovato"),
      description: description || (searchTerm ? `Non abbiamo trovato corrispondenze per «${searchTerm}». Prova con un altro termine.` : "Non abbiamo trovato corrispondenze per la tua ricerca."),
      cta: cta || "Modifica la ricerca",
    }
  };

  const content = {
    loading: {
      icon: <Loader2 size={32} className="animate-spin text-accent-blue" />,
      title: title || "Caricamento in corso...",
      description: description || "Attendere prego, stiamo recuperando i dati.",
      cta: null,
    },
    error: {
      icon: <AlertCircle size={32} className="text-accent-rose" />,
      title: title || "Si è verificato un errore",
      description: safeErrorDescription,
      cta: cta || "Riprova",
    },
    empty: emptyContents[actualVariant] || emptyContents.generic
  };

  const current = content[state];
  if (!current) return null;

  const renderAction = () => {
    if (action !== undefined && action !== null) {
      if (React.isValidElement(action)) {
        return action;
      }
      if (typeof action === 'function') {
        return (
          <button
            type="button"
            onClick={action}
            className="glass-button px-4 py-2 rounded-[var(--radius-control,12px)] font-bold text-sm text-foreground hover:bg-accent-blue/10 transition-colors"
          >
            {current.cta || "Continua"}
          </button>
        );
      }
      if (typeof action === 'string') {
        const handler = onAction || onRetry;
        return (
          <button
            type="button"
            onClick={handler}
            className="glass-button px-4 py-2 rounded-[var(--radius-control,12px)] font-bold text-sm text-foreground hover:bg-accent-blue/10 transition-colors"
          >
            {action}
          </button>
        );
      }
    }

    const handler = onAction || (state === 'error' ? onRetry : undefined);
    if (handler) {
      const isPrimary = state === 'error' || actualVariant === 'generic';
      return (
        <button
          type="button"
          onClick={handler}
          className={cn(
            "px-5 py-2 rounded-[var(--radius-control,12px)] font-bold text-sm transition-colors",
            isPrimary 
              ? "action-btn action-btn-primary" 
              : "glass-button text-foreground hover:bg-accent-blue/10"
          )}
        >
          {current.cta || (state === 'error' ? "Riprova" : "Continua")}
        </button>
      );
    }

    return null;
  };

  const renderedAction = renderAction();

  return (
    <div 
      role={state === 'loading' ? 'status' : undefined}
      aria-label={state === 'loading' ? current.title : undefined}
      className={cn("flex flex-col items-center justify-center min-h-[300px] p-8 text-center w-full h-full", className)}
    >
      <div className="w-14 h-14 rounded-[var(--radius-icon-box,18px)] bg-muted/50 flex items-center justify-center mb-4 border border-border/50 shrink-0">
        {current.icon}
      </div>
      <h3 className="app-h3 mb-2">{current.title}</h3>
      <p className="app-body text-slate-500 dark:text-slate-400 mb-6 max-w-sm line-clamp-2">
        {current.description}
      </p>
      {renderedAction && (
        <div className="mt-2">{renderedAction}</div>
      )}
    </div>
  );
}

StateBlock.propTypes = {
  state: PropTypes.oneOf(['success', 'loading', 'empty', 'error']),
  variant: PropTypes.oneOf(['generic', 'filtered', 'search']),
  emptyVariant: PropTypes.oneOf(['generic', 'filtered', 'search']),
  skeletonShape: PropTypes.oneOf(['row', 'card', 'grid']),
  loadingMode: PropTypes.oneOf(['spinner', 'skeleton']),
  loading: PropTypes.any,
  title: PropTypes.string,
  description: PropTypes.node,
  error: PropTypes.any,
  action: PropTypes.node,
  onAction: PropTypes.func,
  onRetry: PropTypes.func,
  cta: PropTypes.string,
  searchTerm: PropTypes.string,
  count: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node,
};
