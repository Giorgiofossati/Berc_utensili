import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, Inbox, FilterX, SearchX } from 'lucide-react';

export function StateBlock({ 
  state = 'success', 
  emptyVariant = 'generic',
  variant,
  loadingMode = 'spinner',
  loading,
  skeletonShape = 'row',
  title, 
  description, 
  action, 
  className, 
  children 
}) {
  const actualEmptyVariant = variant || emptyVariant;
  const actualLoadingMode = loading || loadingMode;

  if (state === 'success') {
    return <>{children}</>;
  }

  if (state === 'loading' && actualLoadingMode === 'skeleton') {
    return (
      <div className={cn("w-full", className)}>
        {skeletonShape === 'row' && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => <div key={i} className="w-full h-14 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl animate-shimmer" />)}
          </div>
        )}
        {skeletonShape === 'card' && (
          <div className="grid grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-4 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="w-full h-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-shimmer" />)}
          </div>
        )}
        {skeletonShape === 'grid' && (
          <div className="grid grid-cols-2 @sm:grid-cols-3 @xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="w-full aspect-square bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-shimmer" />)}
          </div>
        )}
      </div>
    );
  }

  const isTechnicalError = (msg) => 
    typeof msg === 'string' && 
    (msg.toLowerCase().includes('supabase') || 
     msg.toLowerCase().includes('duplicate key') || 
     msg.toLowerCase().includes('relation') || 
     msg.toLowerCase().includes('syntax error') ||
     msg.toLowerCase().includes('jwt') ||
     msg.toLowerCase().includes('postgresql'));

  const safeErrorDescription = (description && !isTechnicalError(description)) 
    ? description 
    : "Non è stato possibile caricare i dati. Riprova più tardi.";

  const emptyContents = {
    generic: {
      icon: <Inbox size={32} className="text-slate-400" />,
      title: title || "Nessun risultato",
      description: description || "Non ci sono dati da mostrare in questa sezione.",
    },
    filtered: {
      icon: <FilterX size={32} className="text-slate-400" />,
      title: title || "Nessun risultato per questi filtri",
      description: description || "Prova a modificare o rimuovere i filtri attivi.",
    },
    search: {
      icon: <SearchX size={32} className="text-slate-400" />,
      title: title || "Nessun risultato trovato",
      description: description || "Non abbiamo trovato corrispondenze per la tua ricerca.",
    }
  };

  const content = {
    loading: {
      icon: <Loader2 size={32} className="animate-spin text-accent-blue" />,
      title: title || "Caricamento in corso...",
      description: description || "Attendere prego, stiamo recuperando i dati.",
    },
    error: {
      icon: <AlertCircle size={32} className="text-accent-rose" />,
      title: title || "Si è verificato un errore",
      description: safeErrorDescription,
    },
    empty: emptyContents[actualEmptyVariant] || emptyContents.generic
  };

  const current = content[state];
  if (!current) return null;

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[300px] p-8 text-center w-full h-full", className)}>
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-border/50">
        {current.icon}
      </div>
      <h3 className="app-h3 mb-2">{current.title}</h3>
      <p className="app-body text-slate-500 mb-6 max-w-md">{current.description}</p>
      {action && (
        <div className="mt-2">{action}</div>
      )}
    </div>
  );
}
