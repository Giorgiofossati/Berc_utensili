import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const MovementModal = memo(({ opType, selectedTool, modalQty, setModalQty, setShowMoveModal, handleMovement, isBulkMode }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMoveModal(false)} className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl"></motion.div>
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel w-full max-w-2xl p-8 md:p-12 rounded-[48px] md:rounded-[64px] z-[1001] relative flex flex-col gap-6 md:gap-10 overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-accent-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="flex justify-between items-center relative z-10">
        <div className="flex flex-col">
          <p className="text-[11px] font-black text-accent-orange tracking-[0.4em] drop-shadow-md uppercase mb-1">Operazione</p>
          <h3 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter italic ${opType === 'carico' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
            {isBulkMode ? `BULK ${opType}` : opType}
          </h3>
        </div>
        <button onClick={() => setShowMoveModal(false)} className="glass-button p-4 rounded-full"><X size={28} /></button>
      </div>

      <div className="glass-panel p-10 rounded-[48px] border-white/5 relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-accent-orange uppercase drop-shadow-md tracking-widest mb-1">Dettaglio Utensile</p>
            <h4 className="text-2xl md:text-4xl font-black text-white leading-tight underline decoration-accent-blue/30 decoration-4 underline-offset-8">
              {typeof selectedTool === 'object' ? `${selectedTool?.Tipologia?.toUpperCase()} Ø${selectedTool?.Diametro}` : `${selectedTool} Articoli`}
            </h4>
          </div>
          {typeof selectedTool === 'object' && <div className="badge badge-blue text-[12px] px-6 py-2">MOD. {selectedTool?.Codice}</div>}
        </div>

        <div className="grid grid-cols-2 gap-6 mt-10 border-t border-white/5 pt-8">
          <div>
            <p className="text-[10px] font-black text-accent-orange uppercase drop-shadow-md tracking-widest mb-2">{isBulkMode ? "Articoli Selezionati" : "Giacenza Attuale"}</p>
            <p className="text-3xl md:text-5xl font-black text-white tabular-nums">{isBulkMode ? selectedTool : (selectedTool?.['Quantità'] || 0)}</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-black text-accent-orange uppercase drop-shadow-md tracking-widest mb-2">Operazione</p>
            <p className="text-2xl md:text-4xl font-black text-accent-blue">{opType.toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-10 relative z-10">
        <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="w-24 h-24 glass-button rounded-full text-4xl font-black">-</button>
        <div className="flex-1 flex flex-col items-center">
          <p className="text-[10px] font-black text-accent-orange uppercase drop-shadow-md tracking-widest mb-4">Seleziona Quantità</p>
          <input type="number" value={modalQty} onChange={(e) => setModalQty(parseInt(e.target.value) || 1)} className="w-full bg-transparent text-center text-5xl md:text-7xl font-black outline-none text-white tabular-nums" />
        </div>
        <button onClick={() => setModalQty(modalQty + 1)} className="w-24 h-24 glass-button rounded-full text-4xl font-black">+</button>
      </div>

      <button
        onClick={handleMovement}
        className={`w-full py-6 md:py-10 rounded-[28px] md:rounded-[32px] font-black text-xl md:text-2xl uppercase tracking-[0.3em] shadow-2xl transition-all relative z-10 ${opType === 'carico' ? 'bg-accent-emerald text-slate-950 hover:bg-emerald-400' : 'bg-accent-rose text-white hover:bg-rose-600'}`}
      >
        Confirm _Transaction
      </button>
    </motion.div>
  </div>
));

export default MovementModal;
