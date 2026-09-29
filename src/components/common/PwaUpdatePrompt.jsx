import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { usePwaStore } from '../../store/usePwaStore';

export default function PwaUpdatePrompt() {
  const needRefresh = usePwaStore(state => state.needRefresh);
  const promptDismissed = usePwaStore(state => state.promptDismissed);
  const isUpdating = usePwaStore(state => state.isUpdating);
  const updateApp = usePwaStore(state => state.updateApp);
  const dismissPrompt = usePwaStore(state => state.dismissPrompt);

  const isVisible = needRefresh && !promptDismissed;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="alert"
          aria-live="polite"
          className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-[var(--z-toast)] sm:max-w-md w-auto"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="glass-panel p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-accent-blue/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl flex items-center gap-3 sm:gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/15 text-accent-blue flex items-center justify-center shrink-0">
              <Sparkles size={20} className="animate-pulse" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="app-overline leading-none">PWA Update</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h4 className="app-h3 text-slate-900 dark:text-white leading-tight">
                Nuova versione disponibile
              </h4>
              <p className="app-body text-slate-500 dark:text-slate-400 text-xs mt-0.5 truncate">
                Ricarica per applicare le ultime modifiche.
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={updateApp}
                disabled={isUpdating}
                className="action-btn action-btn-primary py-2 px-3 sm:px-4 rounded-xl text-xs font-black tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <RefreshCw size={14} className={isUpdating ? 'animate-spin' : ''} />
                <span>{isUpdating ? 'Aggiorno…' : 'Aggiorna'}</span>
              </button>

              <button
                type="button"
                onClick={dismissPrompt}
                aria-label="Ignora aggiornamento per ora"
                title="Ignora per ora"
                className="glass-button p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
