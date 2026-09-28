import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, X, Sparkles, CheckCircle2 
} from 'lucide-react';
import { useTutorialStore } from '../../store/useTutorialStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useFilterStore } from '../../store/useFilterStore';
import { useTheme } from '../../lib/ThemeContext';

export default function AppTutorial({ onRequireSidebar }) {
  const isOpen = useTutorialStore(state => state.isOpen);
  const currentStep = useTutorialStore(state => state.currentStep);
  const steps = useTutorialStore(state => state.steps);
  const nextStep = useTutorialStore(state => state.nextStep);
  const prevStep = useTutorialStore(state => state.prevStep);
  const closeTutorial = useTutorialStore(state => state.closeTutorial);
  const completeTutorial = useTutorialStore(state => state.completeTutorial);

  const currentUser = useAuthStore(state => state.currentUser);
  const { isDarkMode } = useTheme();

  const [targetRect, setTargetRect] = useState(null);
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const cardRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(240);

  const step = steps[currentStep] || steps[0];

  // 1. Coordinamento della vista, filtri e sidebar per lo step attivo
  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.targetView && useNavigationStore.getState().currentView !== step.targetView) {
      useNavigationStore.getState().setCurrentView(step.targetView);
    }

    if (step.resetFilters && useFilterStore.getState().filterStack.length > 0) {
      useFilterStore.getState().resetFilters();
    }

    if (step.viewMode && useFilterStore.getState().viewMode !== step.viewMode) {
      useFilterStore.getState().setViewMode(step.viewMode);
    }

    if (onRequireSidebar) {
      const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;
      if (isMobileScreen) {
        if (step.requireSidebar !== undefined) {
          onRequireSidebar(step.requireSidebar);
        }
      }
    }
  }, [isOpen, currentStep, step, onRequireSidebar]);

  // 2. Misura l'altezza effettiva della card
  useEffect(() => {
    if (!isOpen || !cardRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setCardHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isOpen, currentStep]);

  // 3. Misura l'elemento target dinamicamente
  const updateTargetRect = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return false;
    }

    const selectors = step.target.split(',').map(s => s.trim());
    let el = null;
    for (const selector of selectors) {
      el = document.querySelector(selector);
      if (el) break;
    }

    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
        return true;
      }
    }
    setTargetRect(null);
    return false;
  }, [step]);

  // 4. Polling attivo per transizioni Framer Motion + ResizeObserver sul target
  useEffect(() => {
    if (!isOpen) return;

    let frameId;
    let startTime = performance.now();
    const trackLoop = (time) => {
      updateTargetRect();
      if (time - startTime < 600) {
        frameId = requestAnimationFrame(trackLoop);
      }
    };
    frameId = requestAnimationFrame(trackLoop);

    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
      updateTargetRect();
    };
    const handleScroll = () => updateTargetRect();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, currentStep, updateTargetRect]);

  // 5. Gestione tastiera
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentStep < steps.length - 1) nextStep();
        else completeTutorial(currentUser);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStep > 0) prevStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (onRequireSidebar) onRequireSidebar(false);
        closeTutorial();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, steps.length, nextStep, prevStep, closeTutorial, completeTutorial, currentUser, onRequireSidebar]);

  const handleFinish = useCallback(() => {
    if (onRequireSidebar) onRequireSidebar(false);
    completeTutorial(currentUser);
  }, [completeTutorial, currentUser, onRequireSidebar]);

  const handleCloseOnly = useCallback(() => {
    if (onRequireSidebar) onRequireSidebar(false);
    closeTutorial();
  }, [closeTutorial, onRequireSidebar]);

  if (!isOpen) return null;

  const isLastStep = currentStep === steps.length - 1;
  const isMobile = viewportSize.width < 768;
  const CARD_WIDTH = 440;
  const margin = 20;
  const padding = 12;

  // Calcolo esatto delle coordinate pixel su Desktop (ZERO conflitti con Framer Motion transform)
  const getDesktopCardPosition = () => {
    const cardW = Math.min(CARD_WIDTH, viewportSize.width - 32);
    const cardH = cardHeight || 240;
    const centerX = Math.round((viewportSize.width - cardW) / 2);

    if (!targetRect) {
      return {
        top: Math.round((viewportSize.height - cardH) / 2),
        left: centerX
      };
    }

    // Se l'elemento target copre una porzione estesa dello schermo (es. categorie catalogo)
    if (targetRect.height > viewportSize.height * 0.45) {
      return {
        bottom: 28,
        left: centerX
      };
    }

    const placement = step.placement || 'bottom';

    // 1. Posizionamento a DESTRA (es. per elementi Sidebar)
    if (placement === 'right') {
      const idealLeft = targetRect.right + margin;
      if (idealLeft + cardW <= viewportSize.width - margin) {
        const idealTop = Math.max(
          margin,
          Math.min(
            targetRect.top + targetRect.height / 2 - cardH / 2,
            viewportSize.height - cardH - margin
          )
        );
        return { top: Math.round(idealTop), left: Math.round(idealLeft) };
      }
    }

    // 2. Posizionamento in ALTO (es. per elementi Footer / Profilo)
    if (placement === 'top') {
      const idealTop = targetRect.top - cardH - margin;
      if (idealTop >= margin) {
        const idealLeft = Math.max(
          margin,
          Math.min(
            targetRect.left + targetRect.width / 2 - cardW / 2,
            viewportSize.width - cardW - margin
          )
        );
        return { top: Math.round(idealTop), left: Math.round(idealLeft) };
      }
    }

    // 3. Posizionamento in BASSO (Default per Search, Toggle, Header)
    const idealTop = targetRect.bottom + margin;
    const clampedTop = Math.min(idealTop, viewportSize.height - cardH - margin);
    const idealLeft = Math.max(
      margin,
      Math.min(
        targetRect.left + targetRect.width / 2 - cardW / 2,
        viewportSize.width - cardW - margin
      )
    );

    return { top: Math.round(Math.max(margin, clampedTop)), left: Math.round(idealLeft) };
  };

  const desktopPos = !isMobile ? getDesktopCardPosition() : null;

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Guida Operativa"
        className="fixed inset-0 z-[var(--z-tour,9990)] overflow-hidden pointer-events-auto select-none"
      >
        {/* Scrim Overlay SVG con Maschera Spotlight */}
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
                  rx="18"
                  fill="black"
                  className="transition-all duration-300 ease-out"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill={isDarkMode ? 'rgba(2, 6, 23, 0.82)' : 'rgba(15, 23, 42, 0.48)'}
            mask="url(#tutorial-spotlight-mask)"
            className="backdrop-blur-[2px] transition-colors duration-300"
          />
        </svg>

        {/* Cornice Luminosa Spotlight */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: targetRect.top - padding,
              left: targetRect.left - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2
            }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="fixed pointer-events-none z-50 rounded-2xl border-2 border-sky-400 dark:border-sky-400 shadow-[0_0_35px_rgba(14,165,233,0.45)] ring-4 ring-sky-400/20"
          >
            <div className="absolute inset-0 rounded-2xl bg-sky-400/5 animate-pulse" />
          </motion.div>
        )}

        {/* Scheda Guida Interattiva */}
        <motion.div
          ref={cardRef}
          key={currentStep}
          initial={{ opacity: 0, y: 15, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          style={
            isMobile
              ? {
                  position: 'fixed',
                  bottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
                  left: '16px',
                  right: '16px',
                  maxWidth: '440px',
                  margin: '0 auto'
                }
              : {
                  position: 'fixed',
                  width: `${Math.min(CARD_WIDTH, viewportSize.width - 32)}px`,
                  ...desktopPos
                }
          }
          className="z-[var(--z-tour,9990)] glass-panel bg-white/95 dark:bg-slate-950/95 border border-slate-200/90 dark:border-sky-500/30 text-slate-900 dark:text-white p-5 rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.25)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col gap-3.5 pointer-events-auto box-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Card */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={16} className="text-amber-500 animate-pulse shrink-0" />
              <span className="text-xs font-black tracking-wider uppercase text-slate-500 dark:text-slate-400 truncate">
                Guida Bercella CNC
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 tabular-nums">
                {currentStep + 1} <span className="opacity-40">/</span> {steps.length}
              </span>

              <button
                type="button"
                onClick={handleCloseOnly}
                title="Chiudi guida"
                aria-label="Chiudi guida"
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Body Card */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              {step.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
              {step.content}
            </p>
          </div>

          {/* Footer Card */}
          <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-slate-200/70 dark:border-white/10">
            <button
              type="button"
              onClick={handleFinish}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
            >
              Salta
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <ChevronLeft size={16} />
                  <span>Indietro</span>
                </button>
              )}

              <button
                type="button"
                onClick={isLastStep ? handleFinish : nextStep}
                className="min-h-[40px] px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black tracking-wider shadow-sm transition-all flex items-center gap-1.5 group cursor-pointer active:scale-95"
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
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}