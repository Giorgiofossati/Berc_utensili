import React, { memo } from 'react';
import { motion } from 'framer-motion';

const DiameterList = memo(({ diameters, onSelect }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-3xl glass-panel rounded-[24px] sm:rounded-[32px] overflow-hidden"
  >
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b dark:border-white/5 border-slate-900/5">
      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-accent-blue">Seleziona Diametro</p>
    </div>
    <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2.5 sm:p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {diameters.map((d, i) => (
        <motion.button
          key={d}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.02 }}
          onClick={() => onSelect(d)}
          className="glass-button rounded-[12px] sm:rounded-[16px] px-2 py-3 sm:px-4 sm:py-4 font-black text-base sm:text-lg text-center hover:bg-accent-blue/10 hover:border-accent-blue/30 hover:text-accent-blue active:scale-95 transition-all"
        >
          Ø{d}
        </motion.button>
      ))}
    </div>
  </motion.div>
));

export default DiameterList;
