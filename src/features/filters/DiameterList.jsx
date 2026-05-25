import React, { memo } from 'react';
import { motion } from 'framer-motion';

const DiameterList = memo(({ diameters, onSelect }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-3xl glass-panel rounded-[32px] overflow-hidden"
  >
    <div className="px-6 py-4 border-b border-white/5">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-blue">Seleziona Diametro</p>
    </div>
    <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {diameters.map((d, i) => (
        <motion.button
          key={d}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.02 }}
          onClick={() => onSelect(d)}
          className="glass-button rounded-[16px] px-4 py-4 font-black text-lg text-center hover:bg-accent-blue/10 hover:border-accent-blue/30 hover:text-accent-blue transition-all"
        >
          Ø{d}
        </motion.button>
      ))}
    </div>
  </motion.div>
));

export default DiameterList;
