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
      className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 flex items-center gap-2 pointer-events-auto"
      data-tour="help-button"
    >
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
            className="hidden sm:flex items-center px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-xs font-black uppercase tracking-wider border border-accent-blue/30 shadow-lg backdrop-blur-md pointer-events-none whitespace-nowrap"
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
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full glass-panel bg-white/70 dark:bg-slate-900/80 border border-slate-300/60 dark:border-accent-blue/30 text-accent-blue hover:text-white hover:bg-accent-blue shadow-md hover:shadow-accent-blue/20 flex items-center justify-center transition-all duration-200"
      >
        <HelpCircle size={20} className="drop-shadow-sm" />
      </motion.button>
    </div>
  );
}
