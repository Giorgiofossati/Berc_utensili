import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowUp, ArrowDown } from 'lucide-react';

const MovementModal = memo(({ opType, setOpType, selectedTool, modalQty, setModalQty, setShowMoveModal, handleMovement, isBulkMode }) => {
  const isCarico = opType === 'carico';
  
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={() => setShowMoveModal(false)} 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
      ></motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }} 
        className="glass-panel w-full max-w-2xl p-6 md:p-10 rounded-[40px] md:rounded-[56px] z-[1001] relative flex flex-col gap-6 md:gap-8 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/10"
      >
        {/* Animated Glow Background */}
        <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] transition-colors duration-700 ${isCarico ? 'bg-accent-emerald/20' : 'bg-accent-rose/20'}`} />
        <div className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[100px] transition-colors duration-700 ${isCarico ? 'bg-accent-emerald/10' : 'bg-accent-rose/10'}`} />

        <div className="flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-accent-orange tracking-[0.4em] uppercase mb-1 drop-shadow-sm">Configura Operazione</p>
            <div className="flex items-center gap-4">
              <h3 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter italic transition-colors duration-500 ${isCarico ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                {isBulkMode ? `BULK ${opType}` : opType}
              </h3>
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setOpType('carico')}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${isCarico ? 'bg-accent-emerald text-slate-950 shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                >
                  Carico
                </button>
                <button 
                  onClick={() => setOpType('scarico')}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${!isCarico ? 'bg-accent-rose text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                >
                  Scarico
                </button>
              </div>
            </div>
          </div>
          <button onClick={() => setShowMoveModal(false)} className="glass-button w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center hover:rotate-90 transition-transform duration-300 border-white/10">
            <X size={24} />
          </button>
        </div>

        <div className="glass-panel p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-white/5 relative z-10 bg-white/[0.02]">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
              <p className="text-[9px] font-black text-accent-orange uppercase tracking-widest mb-1 opacity-70">Dettaglio Selezione</p>
              <h4 className="text-xl md:text-3xl font-black text-white leading-tight">
                {typeof selectedTool === 'object' ? (
                  <>
                    <span className="text-accent-blue">{selectedTool?.Tipologia?.toUpperCase()}</span>
                    <span className="mx-2 opacity-30">|</span>
                    <span>Ø{selectedTool?.Diametro}</span>
                  </>
                ) : (
                  <span className="text-accent-blue">{selectedTool} ARTICOLI SELEZIONATI</span>
                )}
              </h4>
            </div>
            {typeof selectedTool === 'object' && (
              <div className="bg-accent-blue/10 text-accent-blue text-[10px] font-black px-4 py-2 rounded-xl border border-accent-blue/20 tracking-wider">
                {selectedTool?.Codice}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/5 pt-6">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-accent-orange uppercase tracking-widest mb-1 opacity-70">{isBulkMode ? "Selezionati" : "Giacenza"}</p>
              <p className="text-2xl md:text-4xl font-black text-white tabular-nums">{isBulkMode ? selectedTool : (selectedTool?.['Quantità'] || 0)}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-right">
              <p className="text-[9px] font-black text-accent-orange uppercase tracking-widest mb-1 opacity-70">Ubicazione</p>
              <p className="text-lg md:text-2xl font-black text-accent-blue truncate">{selectedTool?.Ubicazione || 'MAGAZZINO'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 md:gap-10 relative z-10 py-2">
          <button 
            onClick={() => setModalQty(Math.max(1, modalQty - 1))} 
            className="w-16 h-16 md:w-20 md:h-20 glass-button rounded-3xl text-3xl font-black hover:scale-105 active:scale-95 transition-all text-accent-orange"
          >
            -
          </button>
          
          <div className="flex-1 flex flex-col items-center">
            <p className="text-[9px] font-black text-accent-orange uppercase tracking-[.3em] mb-2 opacity-80">Quantità Operazione</p>
            <div className="relative group">
              <input 
                type="number" 
                value={modalQty} 
                onChange={(e) => setModalQty(Math.max(1, parseInt(e.target.value) || 1))} 
                className="w-full bg-transparent text-center text-6xl md:text-8xl font-black outline-none text-white tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r from-transparent via-accent-orange to-transparent transition-all duration-500 w-12 group-focus-within:w-full opacity-50`} />
            </div>
          </div>
          
          <button 
            onClick={() => setModalQty(modalQty + 1)} 
            className="w-16 h-16 md:w-20 md:h-20 glass-button rounded-3xl text-3xl font-black hover:scale-105 active:scale-95 transition-all text-accent-orange"
          >
            +
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-6 mt-2 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMovement('carico')}
            className="flex flex-col items-center justify-center py-5 md:py-8 rounded-[24px] md:rounded-[32px] font-black uppercase tracking-widest shadow-xl transition-all bg-accent-emerald text-slate-950 hover:bg-emerald-400 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1"
          >
            <ArrowUp size={24} className="mb-2" />
            <span className="text-sm md:text-lg">Carica</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMovement('scarico')}
            className="flex flex-col items-center justify-center py-5 md:py-8 rounded-[24px] md:rounded-[32px] font-black uppercase tracking-widest shadow-xl transition-all bg-accent-rose text-white hover:bg-rose-600 border-b-4 border-rose-800 active:border-b-0 active:translate-y-1"
          >
            <ArrowDown size={24} className="mb-2" />
            <span className="text-sm md:text-lg">Scarica</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
});

export default MovementModal;
