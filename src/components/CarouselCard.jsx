import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ToolIcon } from '../lib/toolUtils';

const CarouselCard = memo(({ opt, idx, activeIndex, handleSelectOption, setActiveIndex, total, isMobile }) => {
  let offset = idx - activeIndex;

  if (total > 2) {
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;
  }

  const absOffset = Math.abs(offset);
  if (absOffset > 3) return null;

  const stepX = isMobile ? 180 : 360;
  const gapFalloff = isMobile ? 15 : 25;
  
  const x = offset * (stepX - absOffset * gapFalloff);
  const scale = 1 - absOffset * (isMobile ? 0.2 : 0.16);
  const opacity = 1 - absOffset * 0.25;
  const zIndex = 50 - absOffset;
  const rotateY = offset * (isMobile ? 5 : 10);
  const blur = absOffset > 0 ? `blur(${absOffset * 0.4}px)` : 'none';

  return (
    <motion.div
      key={`${opt.label}-${idx}`}
      initial={false}
      animate={{
        x, scale,
        opacity: Math.max(0, opacity),
        zIndex, rotateY,
        filter: blur
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 220, mass: 0.6 }}
      onClick={() => absOffset === 0 ? handleSelectOption(opt) : setActiveIndex(idx)}
      className={`carousel-card absolute flex flex-col items-center justify-center select-none ${absOffset === 0 ? 'active' : ''}`}
    >
      <div className={`relative mb-8 transition-all duration-500 rounded-[32px] overflow-hidden group ${absOffset === 0 ? 'bg-accent-blue/20 border border-accent-blue/40 shadow-[0_0_50px_rgba(56,189,248,0.2)] scale-125' : 'bg-white/5 border border-white/5 opacity-60'}`}>
        <ToolIcon 
          type={opt.label} 
          size={isMobile ? (absOffset === 0 ? 100 : 70) : (absOffset === 0 ? 160 : 100)} 
          className="transition-transform duration-700 group-hover:scale-110" 
          mode="image"
        />
        {absOffset === 0 && (
          <div className="absolute inset-0 bg-gradient-to-t from-accent-blue/20 to-transparent pointer-events-none" />
        )}
      </div>

      <p className={`text-[10px] font-black tracking-[0.3em] uppercase mb-3 ${absOffset === 0 ? 'text-accent-orange' : 'text-slate-400'}`}>{opt.category}</p>
      <h3 className={`text-3xl font-black uppercase tracking-tighter text-center leading-tight ${absOffset === 0 ? 'text-white' : 'text-slate-300'}`}>
        {opt.label}
      </h3>
    </motion.div>
  );
});

export default CarouselCard;
