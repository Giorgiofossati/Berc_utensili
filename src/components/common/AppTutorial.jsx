import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, X, Sparkles, CheckCircle2, 
  LayoutGrid, List 
} from 'lucide-react';
import { useTutorialStore } from '../../store/useTutorialStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useFilterStore } from '../../store/useFilterStore';
import { useTheme } from '../../lib/ThemeContext';
import { Popover } from '@base-ui/react/popover';

export default function AppTutorial({ onRequireSidebar, viewMode, setViewMode }) {
  const isOpen = useTutorialStore(state => state.isOpen);
  const currentStep = useTutorialStore(state => state.currentStep);
  const steps = useTutorialStore(state => state.steps);
  const nextStep = useTutorialStore(state => state.nextStep);
  const prevStep = useTutorialStore(state => state.prevStep);
  const completeTutorial = useTutorialStore(state => state.completeTutorial);


  const currentUser = useAuthStore(state => state.currentUser);
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);
  const { isDarkMode } = useTheme();

  const [targetRect, setTargetRect] = useState(null);
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const step = steps[currentStep] || steps[0];

  // Coordinamento della vista, filtri e sidebar per lo step attivo del tutorial
  useEffect(() => {
    if (!isOpen || !step) return;

    // 1. Sposta l'utente sulla vista richiesta dallo step (es. 'home', 'scanner', 'history', etc.)
    if (step.targetView && useNavigationStore.getState().currentView !== step.targetView) {
      useNavigationStore.getState().setCurrentView(step.targetView);
    }

    // 2. Resetta i filtri se richiesto per far comparire il catalogo principale
    if (step.resetFilters && useFilterStore.getState().filterStack.length > 0) {
      useFilterStore.getState().resetFilters();
    }

    // 3. Imposta la viewMode richiesta (es. 'grid')
    if (step.viewMode && useFilterStore.getState().viewMode !== step.viewMode) {
      useFilterStore.getState().setViewMode(step.viewMode);
      if (setViewMode) setViewMode(step.viewMode);
    }

    // 4. Gestione apertura automatica sidebar su mobile se lo step la richiede
    if (onRequireSidebar) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (isMobile) {
        if (step.requireSidebar !== undefined) {
          onRequireSidebar(step.requireSidebar);
        } else {
          const sidebarSteps = ['quick-actions', 'menu-history', 'user-profile', 'user-logout'];
          onRequireSidebar(sidebarSteps.includes(step.id));
        }
      }
    }
  }, [isOpen, currentStep, step, onRequireSidebar, setViewMode]);

  // Misura e traccia l'elemento target dinamicamente con retry polling per gestire transizioni Framer Motion
  const updateRect = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return false;
    }

    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(prev => {
          if (
            prev &&
            Math.abs(prev.top - rect.top) < 1 &&
            Math.abs(prev.left - rect.left) < 1 &&
            Math.abs(prev.width - rect.width) < 1 &&
            Math.abs(prev.height - rect.height) < 1
          ) {
            return prev;
          }
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          };
        });
        return true;
      }
    }
    setTargetRect(prev => (prev === null ? null : null));
    return false;
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    let retries = 0;
    const maxRetries = 25; // 25 * 40ms = 1000ms

    // Prova immediata
    const found = updateRect();
    
    // Se non trovato subito (es. pagina o filtro in transizione), ritenta ogni 40ms
    let interval = null;
    if (!found) {
      interval = setInterval(() => {
        if (cancelled) return;
        retries++;
        if (updateRect() || retries >= maxRetries) {
          clearInterval(interval);
        }
      }, 40);
    }

    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
      updateRect();
    };
    const handleScroll = () => updateRect();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, currentStep, updateRect]);

  // Gestione tastiera
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentStep < steps.length - 1) nextStep();
        else completeTutorial(currentUser, setCurrentUser);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStep > 0) prevStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (onRequireSidebar) onRequireSidebar(false);
        completeTutorial(currentUser, setCurrentUser);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, steps.length, nextStep, prevStep, completeTutorial, currentUser, setCurrentUser, onRequireSidebar]);

  const handleFinish = useCallback(() => {
    if (onRequireSidebar) onRequireSidebar(false);
    completeTutorial(currentUser, setCurrentUser);
  }, [completeTutorial, currentUser, setCurrentUser, onRequireSidebar]);

  // Più respiro: padding generoso e margini confortevoli
  const padding = 16;
  // const cardWidth = Math.min(400, viewportSize.width - 32);
// const cardEstimatedHeight = step.interactive ? 270 : 225;
  const margin = 24;

  if (!isOpen) return null;

  const isLastStep = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[var(--z-tour,9990)] overflow-hidden pointer-events-auto">
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-50">
          <defs>
            <mask id="tutorial-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - padding}
                  y={targetRect.top - padding}
                  width={targetRect.width + padding * 2}
                  height={targetRect.height + padding * 2}
                  rx="22"
                  fill="black"
                  className="transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill={isDarkMode ? 'rgba(2, 6, 23, 0.78)' : 'rgba(15, 23, 42, 0.42)'}
            mask="url(#tutorial-spotlight-mask)"
            className="backdrop-blur-[3px] transition-colors duration-300"
          />
        </svg>

        {!step?.interactive && (
          <div
            onClick={handleFinish}
            className="fixed inset-0 z-50 pointer-events-auto opacity-0"
            title="Clicca per chiudere tutorial"
          />
        )}

        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: targetRect.top - padding,
              left: targetRect.left - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2
            }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className={`fixed pointer-events-none z-50 rounded-3xl border-2 border-accent-blue shadow-[0_0_35px_rgba(14,165,233,0.5)] ring-4 ring-accent-blue/20`}
          >
            <div className="absolute inset-0 rounded-3xl bg-accent-blue/5 animate-pulse" />
          </motion.div>
        )}

        <Popover.Root open={true}>
          <Popover.Trigger
            className="fixed pointer-events-none opacity-0 -z-10"
            style={{
              top: targetRect ? targetRect.top : viewportSize.height / 2,
              left: targetRect ? targetRect.left : viewportSize.width / 2,
              width: targetRect ? targetRect.width : 0,
              height: targetRect ? targetRect.height : 0,
            }}
          />
          <Popover.Portal>
            <Popover.Positioner side="bottom" sideOffset={margin + padding} align="center" collisionPadding={16}>
              <Popover.Popup className="z-[var(--z-tour,9995)] outline-none">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                  className="w-[90vw] max-w-[400px] glass-panel bg-white/95 dark:bg-slate-950/92 border border-slate-200/90 dark:border-accent-blue/30 text-slate-900 dark:text-white p-4 sm:p-6 rounded-4xl shadow-[0_20px_60px_rgba(15,23,42,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl pointer-events-auto flex flex-col gap-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header Card */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={16} className="text-accent-orange animate-pulse shrink-0" />
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-accent-orange">
                        Guida
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-2 py-1 shadow-inner">
                      <button
                        type="button"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        title="Passaggio precedente"
                        className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:text-accent-blue hover:bg-slate-200/60 dark:hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-90"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-black tracking-widest text-accent-blue px-1.5 tabular-nums select-none">
                        {currentStep + 1} <span className="opacity-40">/</span> {steps.length}
                      </span>
                      <button
                        type="button"
                        onClick={isLastStep ? handleFinish : nextStep}
                        title={isLastStep ? "Completa tutorial" : "Passaggio successivo"}
                        className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:text-accent-blue hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all active:scale-90"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleFinish}
                      title="Chiudi tutorial"
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Body Card */}
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {step.content}
                    </p>
                  </div>

                  {step.id === 'view-mode-toggle' && setViewMode && (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 mt-0.5">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Prova la vista:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewMode('grid')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'grid'
                              ? 'bg-accent-blue text-slate-950 font-black shadow-sm'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-accent-blue/10'
                          }`}
                        >
                          <LayoutGrid size={14} />
                          <span>Griglia</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('dropdown')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'dropdown'
                              ? 'bg-accent-blue text-slate-950 font-black shadow-sm'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-accent-blue/10'
                          }`}
                        >
                          <List size={14} />
                          <span>Elenco</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer Card */}
                  <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-slate-200/60 dark:border-white/10">
                    <button
                      type="button"
                      onClick={handleFinish}
                      className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      Salta
                    </button>
                    <button
                      type="button"
                      onClick={isLastStep ? handleFinish : nextStep}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 bg-accent-blue hover:bg-sky-400 shadow-md transition-all active:scale-95 group"
                    >
                      {isLastStep ? (
                        <>
                          <span>Ho Capito!</span>
                          <CheckCircle2 size={16} />
                        </>
                      ) : (
                        <>
                          <span>Avanti</span>
                          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </AnimatePresence>
  );
}