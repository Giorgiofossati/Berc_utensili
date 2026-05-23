import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ToolIcon } from '../lib/toolUtils';

const CategoryGridCard = memo(({ opt, idx, handleSelectOption, isMobile }) => {
  return (
    <motion.div
      key={`${opt.label}-${idx}`}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: 'spring', 
        damping: 20, 
        stiffness: 150, 
        delay: Math.min(idx * 0.04, 0.4) 
      }}
      onClick={() => handleSelectOption(opt)}
      className="glass-panel group relative w-full max-w-[220px] aspect-square p-0 rounded-[16px] md:rounded-[20px] cursor-pointer bg-slate-100/50 dark:bg-slate-900/40 border dark:border-white/10 border-slate-900/10 dark:hover:border-accent-blue/50 hover:border-accent-blue/40 hover:shadow-[0_8px_30px_rgba(14,165,233,0.2)] transition-all duration-300 overflow-hidden"
    >
      {/* Full-bleed Image Container */}
      <ToolIcon 
        type={opt.label} 
        size="100%" 
        className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out group-hover:scale-110" 
        mode="image"
      />

      {/* Subtle overlay gradient to blend image and increase contrast slightly */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/25 transition-colors duration-300 pointer-events-none" />

      {/* Category Info Overlay - Floating Glassmorphic Panel for Maximum legibility and Premium UX */}
      <div className="absolute bottom-3 left-3 right-3 p-2.5 md:p-3 bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-[12px] flex flex-col items-center justify-center z-20 shadow-lg">
        <p className="text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase mb-0.5 text-accent-orange">
          {opt.category}
        </p>
        <h3 className="text-xs md:text-sm font-black uppercase tracking-tight text-center leading-tight text-white group-hover:text-accent-blue transition-colors duration-300">
          {opt.label}
        </h3>
      </div>
    </motion.div>
  );
});

CategoryGridCard.displayName = 'CategoryGridCard';

export default CategoryGridCard;
