import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorialStore } from '../../store/useTutorialStore';

export default function HelpFloatingButton() {
  const startTutorial = useTutorialStore(state => state.startTutorial);
  const isOpen = useTutorialStore(state => state.isOpen);
  const [showTooltip, setShowTooltip] = useState(false);

  // Se il tutorial è già aperto, non mostriamo il pulsante flottante
  if (isOpen) return null;

  return (
    <div 
      className="fixed z-30 flex items-center gap-2 pointer-events-auto"
      style={{
        bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        right: 'calc(14px + env(safe-area-inset-right, 0px))'
      }}
      data-tour="help-button"
    >
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
            className="hidden sm:flex items-center px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-xs font-black tracking-wider border border-sky-500/30 shadow-lg backdrop-blur-md pointer-events-none whitespace-nowrap"
          >
            Guida
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={startTutorial}
        aria-label="Guida"
        title="Guida"
        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-300/70 dark:border-sky-500/30 text-sky-600 dark:text-sky-400 hover:text-white hover:bg-sky-600 shadow-md hover:shadow-sky-500/20 flex items-center justify-center transition-all duration-200 cursor-pointer"
      >
        <HelpCircle size={20} className="drop-shadow-xs" />
      </motion.button>
    </div>
  );
}
