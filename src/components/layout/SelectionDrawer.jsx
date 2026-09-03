import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Box, Activity } from 'lucide-react';

const SelectionDrawer = memo(({ selectedIds, tools, onToggleSelect, onBulkAction, onClose, setSelectedToolsIds }) => {
  const selectedTools = tools.filter(t => selectedIds.includes(t.id));

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 h-[100dvh] min-h-[100dvh] w-full md:w-[450px] glass-panel dark:bg-slate-950/95 bg-slate-50/95 backdrop-blur-2xl z-[2000] flex flex-col shadow-2xl border-l dark:border-white/10 border-slate-900/10"
    >
      <div className="p-4 sm:p-6 md:p-8 pt-[max(1rem,env(safe-area-inset-top))] border-b dark:border-white/5 border-slate-900/5 flex items-center justify-between shrink-0">
        <div>
          <p className="app-overline text-accent-cyan mb-0.5">Queue Manager</p>
          <h3 className="app-h2">Selezione Bulk</h3>
        </div>
        <button onClick={onClose} className="glass-button p-2.5 sm:p-3.5 rounded-full dark:text-slate-400 text-slate-600 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar">
        {selectedTools.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
            <Box size={40} className="mb-3" />
            <p className="font-bold uppercase tracking-widest text-xs">Coda Vuota</p>
          </div>
        ) : (
          selectedTools.map(tool => (
            <motion.div 
              layout
              key={tool.id} 
              className="glass-panel p-3.5 sm:p-4 rounded-[20px] sm:rounded-[24px] border-white/5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                  <Activity size={16} className="text-accent-blue" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs sm:text-sm dark:text-white text-slate-900 truncate">{tool['Tipologia']} Ø{tool['Diametro']}</p>
                  <p className="text-[9px] sm:text-[10px] dark:text-slate-400 text-slate-600 font-mono truncate">{tool['Codice']}</p>
                </div>
              </div>
              <button 
                onClick={() => onToggleSelect(tool.id)}
                className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-full transition-all shrink-0"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))
        )}
      </div>

      <div className="p-4 sm:p-6 md:p-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-white/[0.02] border-t dark:border-white/5 border-slate-900/5 space-y-3 shrink-0">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button 
            disabled={selectedTools.length === 0}
            onClick={() => onBulkAction('carico')}
            className="flex-1 py-3.5 sm:py-4 rounded-[16px] sm:rounded-[20px] bg-accent-emerald text-slate-950 font-black uppercase tracking-widest text-xs hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-emerald-500/20"
          >
            Bulk Deposita
          </button>
          <button 
            disabled={selectedTools.length === 0}
            onClick={() => onBulkAction('scarico')}
            className="flex-1 py-3.5 sm:py-4 rounded-[16px] sm:rounded-[20px] bg-accent-rose text-white font-black uppercase tracking-widest text-xs hover:bg-rose-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-rose-500/20"
          >
            Bulk Preleva
          </button>
        </div>
        <button 
          onClick={() => { setSelectedToolsIds([]); onClose(); }}
          className="w-full py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-rose-400 transition-colors"
        >
          Svuota Tutto
        </button>
      </div>
    </motion.div>
  );
});

export default SelectionDrawer;
