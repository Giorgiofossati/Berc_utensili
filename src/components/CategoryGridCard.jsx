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
      className="glass-panel group relative flex flex-col items-center justify-center p-5 md:p-8 rounded-[24px] cursor-pointer dark:bg-white/[0.02] bg-slate-900/[0.02] border dark:border-white/5 border-slate-900/5 dark:hover:border-accent-blue/40 hover:border-accent-blue/30 dark:hover:bg-accent-blue/[0.04] hover:bg-accent-blue/[0.04] hover:shadow-[0_0_25px_rgba(14,165,233,0.15)] transition-all duration-300 overflow-hidden"
    >
      {/* Background glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Icon Container */}
      <div className="relative mb-4 md:mb-6 transition-all duration-500 rounded-[20px] overflow-hidden dark:bg-white/5 bg-slate-900/5 p-4 flex items-center justify-center group-hover:scale-105 group-hover:bg-accent-blue/10 dark:group-hover:bg-accent-blue/15 transition-transform duration-300">
        <ToolIcon 
          type={opt.label} 
          size={isMobile ? 80 : 110} 
          className="transition-transform duration-700 group-hover:scale-110" 
          mode="image"
        />
      </div>

      {/* Category Info */}
      <p className="text-[9px] font-black tracking-[0.2em] uppercase mb-1 dark:text-slate-400 text-slate-500 group-hover:text-accent-orange transition-colors">
        {opt.category}
      </p>
      <h3 className="text-base md:text-xl font-black uppercase tracking-tighter text-center leading-tight dark:text-slate-200 text-slate-800 dark:group-hover:text-white group-hover:text-slate-950 transition-colors">
        {opt.label}
      </h3>
    </motion.div>
  );
});

CategoryGridCard.displayName = 'CategoryGridCard';

export default CategoryGridCard;
