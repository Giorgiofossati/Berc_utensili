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
      className="fixed top-0 right-0 h-screen w-full md:w-[450px] glass-panel bg-slate-950/90 backdrop-blur-2xl z-[2000] flex flex-col shadow-2xl border-l border-white/5"
    >
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-accent-cyan uppercase tracking-[0.4em] mb-1">Queue Manager</p>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Selezione Bulk</h3>
        </div>
        <button onClick={onClose} className="glass-button p-4 rounded-full text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {selectedTools.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
            <Box size={48} className="mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">Coda Vuota</p>
          </div>
        ) : (
          selectedTools.map(tool => (
            <motion.div 
              layout
              key={tool.id} 
              className="glass-panel p-5 rounded-[24px] border-white/5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                  <Activity size={16} className="text-accent-blue" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{tool['Tipologia']} Ø{tool['Diametro']}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{tool['Codice']}</p>
                </div>
              </div>
              <button 
                onClick={() => onToggleSelect(tool.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:bg-rose-400/10 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))
        )}
      </div>

      <div className="p-8 bg-white/[0.02] border-t border-white/5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button 
            disabled={selectedTools.length === 0}
            onClick={() => onBulkAction('carico')}
            className="flex-1 py-5 rounded-[20px] bg-accent-emerald text-slate-950 font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:grayscale"
          >
            Bulk Carico
          </button>
          <button 
            disabled={selectedTools.length === 0}
            onClick={() => onBulkAction('scarico')}
            className="flex-1 py-5 rounded-[20px] bg-accent-rose text-white font-black uppercase tracking-widest text-xs hover:bg-rose-400 transition-colors disabled:opacity-50 disabled:grayscale"
          >
            Bulk Scarico
          </button>
        </div>
        <button 
          onClick={() => { setSelectedToolsIds([]); onClose(); }}
          className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-rose-400 transition-colors"
        >
          Svuota Tutto
        </button>
      </div>
    </motion.div>
  );
});

export default SelectionDrawer;
