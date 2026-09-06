import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { X, Box } from 'lucide-react';
import { ToolIcon, buildDesc } from '../../lib/toolUtils';

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
          <p className="app-overline text-accent-blue mb-0.5">Queue Manager</p>
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
            <p className="app-overline text-xs">Coda Vuota</p>
          </div>
        ) : (
          selectedTools.map(tool => (
            <motion.div 
              layout
              key={tool.id} 
              className="glass-panel p-3.5 sm:p-4 rounded-[20px] sm:rounded-[24px] border-white/5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-2">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center shrink-0 overflow-hidden">
                  <ToolIcon type={tool['Tipologia']} size={36} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="app-h3 truncate">{buildDesc(tool)}</p>
                  <p className="app-caption text-accent-blue truncate mt-0.5">{tool['Codice'] || 'N/A'}</p>
                </div>
              </div>
              <button 
                onClick={() => onToggleSelect(tool.id)}
                className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-full transition-all shrink-0"
                title="Rimuovi dalla selezione"
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
            className="action-btn-carica flex-1 py-3.5 sm:py-4 rounded-[16px] sm:rounded-[20px] text-xs uppercase tracking-wider font-black shadow-lg"
          >
            Bulk Deposita
          </button>
          <button 
            disabled={selectedTools.length === 0}
            onClick={() => onBulkAction('scarico')}
            className="action-btn-scarica flex-1 py-3.5 sm:py-4 rounded-[16px] sm:rounded-[20px] text-xs uppercase tracking-wider font-black shadow-lg"
          >
            Bulk Preleva
          </button>
        </div>
        <button 
          onClick={() => { setSelectedToolsIds([]); onClose(); }}
          className="app-overline w-full py-2.5 text-slate-500 hover:text-rose-400 transition-colors"
        >
          Svuota Tutto
        </button>
      </div>
    </motion.div>
  );
});

export default SelectionDrawer;
