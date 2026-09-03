import React, { memo } from 'react';
import { motion } from 'framer-motion';

const DiameterList = memo(({ diameters, onSelect }) => (
  <div className="w-full max-w-3xl glass-panel rounded-[24px] sm:rounded-[32px] overflow-hidden">
    <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b dark:border-white/5 border-slate-900/5">
      <p className="app-overline text-accent-blue">Seleziona Diametro</p>
    </div>
    <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2.5 sm:p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {diameters.map((d) => (
        <button
          key={d}
          onClick={() => onSelect(d)}
          className="glass-button rounded-[12px] sm:rounded-[16px] px-2 py-2.5 sm:px-4 sm:py-3.5 app-qty-sm text-center hover:bg-accent-blue/10 hover:border-accent-blue/30 hover:text-accent-blue active:scale-95 transition-all select-none"
        >
          Ø{d}
        </button>
      ))}
    </div>
  </div>
));

export default DiameterList;
