import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, X, Sparkles, CheckCircle2, 
  LayoutGrid, List 
} from 'lucide-react';
import { useTutorialStore } from '../../store/useTutorialStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../lib/ThemeContext';

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

  // Gestione apertura automatica sidebar su mobile se lo step la richiede
  useEffect(() => {
    if (!isOpen || !onRequireSidebar) return;
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const sidebarSteps = ['search-tools', 'quick-actions', 'menu-history', 'user-profile', 'user-logout'];
    if (sidebarSteps.includes(step.id)) {
      onRequireSidebar(true);
    } else {
      onRequireSidebar(false);
    }
  }, [isOpen, step.id, onRequireSidebar]);

  // Misura e traccia l'elemento target dinamicamente
  const updateRect = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
        return;
      }
    }
    setTargetRect(null);
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;

    const rafId = requestAnimationFrame(updateRect);
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
      updateRect();
    };
    const handleScroll = () => updateRect();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    const timer = setTimeout(updateRect, 180);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      clearTimeout(timer);
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
  const cardWidth = Math.min(400, viewportSize.width - 32);
  const cardEstimatedHeight = step.interactive ? 270 : 225;
  const margin = 24;

  // Calcolo posizione della card rispetto al target
  const cardPosition = useMemo(() => {
    if (!targetRect) {
      return {
        top: Math.max(margin, (viewportSize.height - cardEstimatedHeight) / 2),
        left: Math.max(margin, (viewportSize.width - cardWidth) / 2),
        width: cardWidth,
        placement: 'center'
      };
    }

    const targetCenterY = targetRect.top + targetRect.height / 2;
    const isTargetBottom = targetCenterY > viewportSize.height * 0.52;

    let top = isTargetBottom
      ? targetRect.top - padding - cardEstimatedHeight - margin
      : targetRect.top + targetRect.height + padding + margin;

    let placement = isTargetBottom ? 'top' : 'bottom';

    // Se sfora lo schermo verticalmente
    if (top < margin) {
      top = targetRect.top + targetRect.height + padding + margin;
      placement = 'bottom';
    }
    if (top + cardEstimatedHeight > viewportSize.height - margin) {
      top = Math.max(margin, viewportSize.height - cardEstimatedHeight - margin);
    }

    // Centratura orizzontale
    let left = targetRect.left + (targetRect.width - cardWidth) / 2;
    if (left < margin) left = margin;
    if (left + cardWidth > viewportSize.width - margin) {
      left = viewportSize.width - cardWidth - margin;
    }

    return { top, left, width: cardWidth, placement };
  }, [targetRect, viewportSize, cardWidth, cardEstimatedHeight, margin, padding]);

  // Calcolo delle coordinate per la linea sottile di precisione (freccia minimale)
  const lineCoords = useMemo(() => {
    if (!targetRect) return null;

    let x1, y1, x2, y2;
    if (cardPosition.placement === 'top') {
      x1 = targetRect.left + targetRect.width / 2;
      y1 = targetRect.top - padding;
      x2 = Math.max(cardPosition.left + 30, Math.min(cardPosition.left + cardPosition.width - 30, x1));
      y2 = cardPosition.top + cardEstimatedHeight;
    } else {
      x1 = targetRect.left + targetRect.width / 2;
      y1 = targetRect.top + targetRect.height + padding;
      x2 = Math.max(cardPosition.left + 30, Math.min(cardPosition.left + cardPosition.width - 30, x1));
      y2 = cardPosition.top;
    }

    return { x1, y1, x2, y2 };
  }, [targetRect, cardPosition, padding, cardEstimatedHeight]);

  if (!isOpen) return null;

  const isLastStep = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] overflow-hidden pointer-events-auto">
        {/* SVG Mask Spotlight Cutout con Backdrop Blur dinamico chiaro/scuro */}
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-[9991]">
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

        {/* Click sull'overlay esterno chiude il tutorial (disattivato su elementi interattivi per consentire click diretti) */}
        {!step?.interactive && (
          <div
            onClick={handleFinish}
            className="fixed inset-0 z-[9992] pointer-events-auto opacity-0"
            title="Clicca per chiudere tutorial"
          />
        )}

        {/* Cornice luminosa pulsante attorno alla zona evidenziata */}
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
            className={`fixed pointer-events-none z-[9993] rounded-[24px] border-2 border-accent-blue shadow-[0_0_35px_rgba(14,165,233,0.5)] ring-4 ring-accent-blue/20`}
          >
            <div className="absolute inset-0 rounded-[22px] bg-accent-blue/5 animate-pulse" />
          </motion.div>
        )}

        {/* Linea sottile di precisione (stile CAD minimale) che collega la card al target */}
        {lineCoords && (
          <svg className="fixed inset-0 w-full h-full pointer-events-none z-[9994] overflow-visible">
            <defs>
              <linearGradient id="tourLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <line
              x1={lineCoords.x1}
              y1={lineCoords.y1}
              x2={lineCoords.x2}
              y2={lineCoords.y2}
              stroke="url(#tourLineGradient)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            {/* Punto luminoso di ancoraggio sulla zona indicata */}
            <circle
              cx={lineCoords.x1}
              cy={lineCoords.y1}
              r="3.5"
              className="fill-accent-blue drop-shadow-[0_0_6px_#0ea5e9]"
            />
            {/* Micro cerchietto di arrivo sulla card */}
            <circle
              cx={lineCoords.x2}
              cy={lineCoords.y2}
              r="2.5"
              className="fill-accent-blue/80"
            />
          </svg>
        )}

        {/* Card Tutorial Numerata con pieno supporto Dark & Light Mode */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 15, scale: 0.96 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            top: cardPosition.top,
            left: cardPosition.left,
            width: cardPosition.width
          }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="fixed z-[9995] glass-panel bg-white/95 dark:bg-slate-950/92 border border-slate-200/90 dark:border-accent-blue/30 text-slate-900 dark:text-white p-4 sm:p-5 rounded-[26px] shadow-[0_20px_60px_rgba(15,23,42,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl pointer-events-auto flex flex-col gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Card: Navigazione con Freccie e Numero Passaggio */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/10 pb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} className="text-accent-orange animate-pulse shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-orange">
                Guida Pratica
              </span>
            </div>

            {/* Stepper numerato con DUE FRECCE per andare avanti e indietro */}
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

            {/* Tasto Chiudi / Salta rapido */}
            <button
              type="button"
              onClick={handleFinish}
              title="Chiudi tutorial"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Titolo e Spiegazione */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2 leading-tight">
              {step.title}
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* Sezione Interattiva: Prova Cambio Vista (Step 2) */}
          {step.id === 'view-mode-toggle' && setViewMode && (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 mt-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                  <LayoutGrid size={13} />
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
                  <List size={13} />
                  <span>Elenco</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Card: Azioni */}
          <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={handleFinish}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
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
      </div>
    </AnimatePresence>
  );
}
