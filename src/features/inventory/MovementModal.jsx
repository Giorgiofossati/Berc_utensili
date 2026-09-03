import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUp, ArrowDown, ShoppingCart } from 'lucide-react';
import { buildDesc } from '../../lib/toolUtils';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { useMovementStore } from '../../store/useMovementStore';
import { useAuthStore } from '../../store/useAuthStore';

const MovementModal = memo(({ setShowMoveModal, onOpenOrder, onConfirm }) => {
  const opType = useMovementStore(state => state.opType);
  const setOpType = useMovementStore(state => state.setOpType);
  const selectedTool = useMovementStore(state => state.selectedTool);
  const modalQty = useMovementStore(state => state.modalQty);
  const setModalQty = useMovementStore(state => state.setModalQty);
  const isBulkMode = useMovementStore(state => state.isBulkMode);
  
  const currentUser = useAuthStore(state => state.currentUser);

  // Fields to exclude from the details view
  const excludedKeys = ['id', 'Check', 'Alias'];

  // Identify if we are in Step 1 (Details) or Step 2 (Movement Operation)
  const isDetailsStep = !opType;

  // Formatting tool details for Step 1
  const renderDetails = () => {
    if (isBulkMode || !selectedTool || typeof selectedTool !== 'object') {
      return (
        <div className="text-center p-6 dark:bg-white/5 bg-slate-900/5 rounded-2xl mt-4">
          <p className="dark:text-slate-400 text-slate-600 font-bold uppercase tracking-widest">
            {isBulkMode ? "Modalità Massiva" : "Dettagli non disponibili"}
          </p>
        </div>
      );
    }

    const displayLabelMap = {
      Codice: 'Codice Aziendale',
      SerialNumber: 'Codice Produttore',
      'Serial Number': 'Codice Produttore',
      Tipologia: 'Tipologia',
      Forma: 'Forma',
      Diametro: 'Diametro',
      Lunghezza: 'Lunghezza',
      Passo: 'Passo',
      Tolleranza: 'Tolleranza',
      Raggio: 'Raggio',
      Angolo: 'Angolo',
      Materiale: 'Materiale',
      Rivestimento: 'Rivestimento',
      Fornitore: 'Fornitore',
      Lavorazione: 'Lavorazione',
      Ubicazione: 'Ubicazione',
      Stato: 'Stato',
      sistema_misura: 'Sistema di Misura'
    };

    const details = Object.entries(selectedTool).filter(([k, v]) => {
      if (excludedKeys.includes(k)) return false;
      if (v === null || v === undefined || v === '') return false;
      // Filter out only Quantità which is shown as the big number at the top
      if (k === 'Quantità') return false;
      return true;
    });

    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
        {details.map(([key, value]) => (
          <div key={key} className="dark:bg-white/5 bg-slate-900/5 border border-white/5 p-2.5 md:p-3 rounded-2xl flex flex-col hover:bg-white/[0.08] transition-colors group">
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-accent-orange mb-1 opacity-60 group-hover:opacity-100 transition-opacity truncate">
              {displayLabelMap[key] || key}
            </span>
            <span className="text-xs md:text-[13px] font-bold dark:text-white text-slate-900 leading-tight truncate">{value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) setShowMoveModal(false); }}>
      <DialogContent showCloseButton={false} className="glass-panel w-[94vw] sm:w-full max-w-3xl max-h-[92dvh] overflow-hidden p-4 sm:p-6 md:p-8 rounded-[28px] sm:rounded-[36px] md:rounded-[40px] z-[1001] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border dark:border-white/10 border-slate-900/10 shadow-2xl flex flex-col gap-3 md:gap-5 !max-w-3xl focus:outline-none">
        <DialogTitle className="sr-only">Dettaglio Utensile</DialogTitle>
        
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-all duration-700 pointer-events-none" 
          style={{ backgroundColor: opType === 'carico' ? 'rgba(16, 185, 129, 0.15)' : opType === 'scarico' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(14, 165, 233, 0.15)' }} 
        />

        {/* Header Block */}
        <div className="flex justify-between items-start relative z-10 shrink-0">
          <div className="flex flex-col flex-1 pr-3 overflow-hidden">
            <p className={`text-[8px] sm:text-[9px] md:text-[10px] font-black tracking-[0.3em] md:tracking-[0.4em] drop-shadow-md uppercase mb-1 ${isDetailsStep ? 'text-accent-orange' : opType === 'carico' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
              {isDetailsStep ? "Dettaglio Utensile" : opType === 'carico' ? "Conferma Deposito" : "Conferma Prelievo"}
            </p>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mb-1 italic dark:text-white text-slate-900 truncate">
              {typeof selectedTool === 'object' && selectedTool !== null ? buildDesc(selectedTool) : `${selectedTool || 0} Articoli`}
            </h3>
            {typeof selectedTool === 'object' && selectedTool !== null && selectedTool?.Codice && (
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest dark:text-slate-400 text-slate-600 dark:bg-white/5 bg-slate-900/5 py-1 px-2.5 rounded-full self-start border border-white/5 mt-0.5 truncate max-w-full">
                CODICE AZIENDALE: <span className="dark:text-white text-slate-900 ml-1">{selectedTool.Codice}</span>
              </p>
            )}
          </div>
          <button onClick={() => setShowMoveModal(false)} className="glass-button p-2.5 sm:p-3 md:p-4 rounded-full flex-shrink-0 text-slate-400 hover:text-white hover:bg-rose-500/20 transition-all"><X size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" /></button>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 w-full flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 md:pr-3">
          <AnimatePresence mode="wait">
            {isDetailsStep ? (
              <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-3 md:gap-4 pb-2">
                
                <div>
                  <div className="flex items-end justify-between mb-2 sm:mb-3 border-b dark:border-white/10 border-slate-900/10 pb-2">
                     <div>
                       <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] text-accent-orange drop-shadow-md mb-0.5">Giacenza Magazzino</p>
                       <p className="text-3xl sm:text-4xl md:text-5xl font-black dark:text-white text-slate-900 tabular-nums leading-none">
                         {isBulkMode ? selectedTool : (selectedTool?.['Quantità'] || 0)}
                         <span className="text-xs md:text-sm text-slate-500 ml-2 font-black tracking-widest uppercase">Pezzi</span>
                       </p>
                     </div>
                  </div>
                  {renderDetails()}
                </div>

                <div className={`grid ${(!isBulkMode && selectedTool && (selectedTool?.['Quantità'] || 0) <= 0 && currentUser?.ruolo !== 'Admin') ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-2 sm:gap-3 mt-1`}>
                  {(!(!isBulkMode && selectedTool && (selectedTool?.['Quantità'] || 0) <= 0 && currentUser?.ruolo !== 'Admin')) && (
                    <>
                      <button onClick={() => setOpType('carico')} className="action-btn action-btn-carica py-3 sm:py-3.5 md:py-4 w-full flex flex-col items-center justify-center gap-1 group border border-accent-emerald/30 shadow-lg relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl active:scale-95">
                        <div className="absolute inset-0 bg-accent-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <ArrowUp size={18} className="group-hover:-translate-y-1 transition-transform relative z-10" />
                        <span className="text-[10px] sm:text-xs font-black relative z-10 tracking-widest">DEPOSITA</span>
                      </button>
                      <button onClick={() => setOpType('scarico')} className="action-btn action-btn-scarica py-3 sm:py-3.5 md:py-4 w-full flex flex-col items-center justify-center gap-1 group border border-accent-rose/30 shadow-lg relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl active:scale-95">
                        <div className="absolute inset-0 bg-accent-rose/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <ArrowDown size={18} className="group-hover:translate-y-1 transition-transform relative z-10" />
                        <span className="text-[10px] sm:text-xs font-black relative z-10 tracking-widest">PRELEVA</span>
                      </button>
                    </>
                  )}
                  {!isBulkMode && (
                    <button onClick={() => { setShowMoveModal(false); if(onOpenOrder) onOpenOrder(); }} className={`action-btn py-3 sm:py-3.5 md:py-4 w-full flex flex-col items-center justify-center gap-1 group border border-accent-orange/30 shadow-lg relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl active:scale-95 ${(!(!isBulkMode && selectedTool && (selectedTool?.['Quantità'] || 0) <= 0 && currentUser?.ruolo !== 'Admin')) ? 'col-span-2 lg:col-span-1' : ''}`} style={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}>
                      <div className="absolute inset-0 bg-accent-orange/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <ShoppingCart size={18} className="text-accent-orange group-hover:scale-110 transition-transform relative z-10 mx-auto" />
                      <span className="text-[10px] sm:text-xs font-black relative z-10 tracking-widest text-accent-orange text-center">CREA ORDINE</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="operation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full justify-center gap-6 sm:gap-8 md:gap-12 my-auto py-4">
                
                <div className="flex items-center gap-3 sm:gap-8 md:gap-12 justify-center">
                  <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 glass-button rounded-full text-xl sm:text-2xl md:text-3xl font-black shrink-0 hover:bg-white/10 hover:scale-110 active:scale-95 transition-all">-</button>
                  <div className="flex flex-col items-center">
                    <p className="text-[9px] sm:text-xs md:text-sm font-black text-accent-orange uppercase tracking-[0.15em] mb-1 text-center">Quantità {opType === 'carico' ? 'da Depositare' : 'da Prelevare'}</p>
                    <input type="number" inputMode="numeric" value={modalQty} onChange={(e) => setModalQty(parseInt(e.target.value) || 1)} className="w-20 sm:w-24 md:w-28 bg-transparent text-center text-4xl sm:text-6xl md:text-7xl font-black outline-none dark:text-white text-slate-900 tabular-nums border-b-2 dark:border-white/10 border-slate-900/10 pb-1 focus:border-accent-blue transition-all" />
                  </div>
                  <button onClick={() => setModalQty(modalQty + 1)} className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 glass-button rounded-full text-xl sm:text-2xl md:text-3xl font-black shrink-0 hover:bg-white/10 hover:scale-110 active:scale-95 transition-all">+</button>
                </div>

                <div className="flex items-center gap-3 md:gap-4 w-full mt-2">
                  {!isBulkMode && (
                    <button onClick={() => setOpType(null)} className="glass-button px-4 sm:px-6 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl md:rounded-[32px] dark:text-slate-400 text-slate-600 hover:dark:text-white text-slate-900 w-auto shrink-0 flex items-center justify-center transition-all group">
                       <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest group-hover:-translate-x-1 transition-transform">Indietro</span>
                    </button>
                  )}
                  <button
                    onClick={onConfirm}
                    className={`flex-1 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl md:rounded-[32px] font-black text-sm sm:text-base md:text-xl uppercase tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all ${opType === 'carico' ? 'bg-accent-emerald text-slate-950 border-emerald-400/50 hover:bg-emerald-400' : 'bg-accent-rose text-white border-rose-500/50 hover:bg-rose-500'}`}
                  >
                    CONFERMA
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default MovementModal;
