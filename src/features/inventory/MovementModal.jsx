import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUp, ArrowDown, ShoppingCart } from 'lucide-react';
import { buildDesc } from '../../lib/toolUtils';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const MovementModal = memo(({ opType, setOpType, selectedTool, modalQty, setModalQty, setShowMoveModal, handleMovement, isBulkMode, onOpenOrder, currentUser }) => {
  // Fields to exclude from the details view
  const excludedKeys = ['id', 'Check', 'Alias'];

  // Identify if we are in Step 1 (Details) or Step 2 (Movement Operation)
  const isDetailsStep = !opType;

  // Formatting tool details for Step 1
  const renderDetails = () => {
    if (isBulkMode || typeof selectedTool !== 'object') {
      return (
        <div className="text-center p-6 dark:bg-white/5 bg-slate-900/5 rounded-2xl mt-4">
          <p className="dark:text-slate-400 text-slate-600 font-bold uppercase tracking-widest">Modalità Massiva</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {details.map(([key, value]) => (
          <div key={key} className="dark:bg-white/5 bg-slate-900/5 border border-white/5 p-4 rounded-3xl flex flex-col hover:bg-white/[0.08] transition-colors border-white/5 group">
            <span className="text-[9px] font-black uppercase tracking-widest text-accent-orange mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
              {displayLabelMap[key] || key}
            </span>
            <span className="text-[13px] font-bold dark:text-white text-slate-900 leading-tight">{value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) setShowMoveModal(false); }}>
      <DialogContent showCloseButton={false} className="glass-panel w-[95vw] sm:w-full max-w-3xl max-h-[95vh] overflow-hidden p-6 md:p-8 rounded-[48px] md:rounded-[48px] z-[1001] bg-transparent border-none shadow-none flex flex-col gap-4 md:gap-6 !max-w-3xl focus:outline-none">
        <DialogTitle className="sr-only">Dettaglio Utensile</DialogTitle>
        
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-all duration-700" 
          style={{ backgroundColor: opType === 'carico' ? 'rgba(16, 185, 129, 0.15)' : opType === 'scarico' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(14, 165, 233, 0.15)' }} 
        />

        {/* Header Block */}
        <div className="flex justify-between items-start relative z-10">
          <div className="flex flex-col flex-1 pr-4">
            <p className={`text-[10px] md:text-[11px] font-black tracking-[0.4em] drop-shadow-md uppercase mb-2 ${isDetailsStep ? 'text-accent-orange' : opType === 'carico' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
              {isDetailsStep ? "Dettaglio Utensile" : opType === 'carico' ? "Conferma Deposito" : "Conferma Prelievo"}
            </p>
            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-2 italic dark:text-white text-slate-900">
              {typeof selectedTool === 'object' ? buildDesc(selectedTool) : `${selectedTool} Articoli`}
            </h3>
            {typeof selectedTool === 'object' && selectedTool?.Codice && (
              <p className="text-[10px] md:text-xs font-black uppercase tracking-widest dark:text-slate-400 text-slate-600 dark:bg-white/5 bg-slate-900/5 py-2 px-4 rounded-full self-start border border-white/5 mt-3">
                CODICE AZIENDALE: <span className="dark:text-white text-slate-900 ml-2">{selectedTool.Codice}</span>
              </p>
            )}
          </div>
          <button onClick={() => setShowMoveModal(false)} className="glass-button p-4 rounded-full flex-shrink-0 text-slate-400 hover:text-white hover:bg-rose-500/20 transition-all"><X size={24} /></button>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 w-full min-h-[300px]">
          <AnimatePresence mode="wait">
            {isDetailsStep ? (
              <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5">
                
                <div className="mt-1">
                  <div className="flex items-end justify-between mb-4 border-b dark:border-white/10 border-slate-900/10 pb-4">
                     <div>
                       <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent-orange drop-shadow-md mb-2">Giacenza Magazzino</p>
                       <p className="text-5xl md:text-6xl font-black dark:text-white text-slate-900 tabular-nums leading-none">
                         {isBulkMode ? selectedTool : (selectedTool?.['Quantità'] || 0)}
                         <span className="text-sm text-slate-500 ml-4 font-black tracking-widest uppercase">Pezzi</span>
                       </p>
                     </div>
                  </div>
                  {renderDetails()}
                </div>

                <div className={`grid ${(!isBulkMode && (selectedTool?.['Quantità'] <= 0) && currentUser?.ruolo !== 'Admin') ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-3 mt-2`}>
                  {(!(!isBulkMode && (selectedTool?.['Quantità'] <= 0) && currentUser?.ruolo !== 'Admin')) && (
                    <>
                      <button onClick={() => setOpType('carico')} className="action-btn action-btn-carica py-4 md:py-5 w-full flex flex-col gap-2 group border border-accent-emerald/30 shadow-xl relative overflow-hidden rounded-3xl">
                        <div className="absolute inset-0 bg-accent-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <ArrowUp size={22} className="group-hover:-translate-y-1 transition-transform relative z-10" />
                        <span className="text-sm font-black relative z-10 tracking-widest">DEPOSITA</span>
                      </button>
                      <button onClick={() => setOpType('scarico')} className="action-btn action-btn-scarica py-4 md:py-5 w-full flex flex-col gap-2 group border border-accent-rose/30 shadow-xl relative overflow-hidden rounded-3xl">
                        <div className="absolute inset-0 bg-accent-rose/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <ArrowDown size={22} className="group-hover:translate-y-1 transition-transform relative z-10" />
                        <span className="text-sm font-black relative z-10 tracking-widest">PRELEVA</span>
                      </button>
                    </>
                  )}
                  {!isBulkMode && (
                    <button onClick={() => { setShowMoveModal(false); if(onOpenOrder) onOpenOrder(); }} className={`action-btn py-4 md:py-5 w-full flex flex-col gap-2 group border border-accent-orange/30 shadow-xl relative overflow-hidden rounded-3xl ${(!(!isBulkMode && (selectedTool?.['Quantità'] <= 0) && currentUser?.ruolo !== 'Admin')) ? 'col-span-2 lg:col-span-1' : ''}`} style={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}>
                      <div className="absolute inset-0 bg-accent-orange/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <ShoppingCart size={22} className="text-accent-orange group-hover:scale-110 transition-transform relative z-10 mx-auto" />
                      <span className="text-sm font-black relative z-10 tracking-widest text-accent-orange text-center">CREA ORDINE</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="operation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full justify-center gap-12 mt-8 md:mt-12">
                
                <div className="flex items-center gap-6 md:gap-12 justify-center">
                  <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="w-14 h-14 md:w-20 md:h-20 glass-button rounded-full text-3xl font-black shrink-0 hover:bg-white/10 hover:scale-110 transition-all">-</button>
                  <div className="flex flex-col items-center">
                    <p className="text-xs md:text-sm font-black text-accent-orange uppercase tracking-[0.15em] mb-2">Quantità {opType === 'carico' ? 'da Depositare' : 'da Prelevare'}</p>
                    <input type="number" value={modalQty} onChange={(e) => setModalQty(parseInt(e.target.value) || 1)} className="w-24 bg-transparent text-center text-5xl md:text-7xl font-black outline-none dark:text-white text-slate-900 tabular-nums border-b-2 dark:border-white/10 border-slate-900/10 pb-2 focus:border-accent-blue transition-all" />
                  </div>
                  <button onClick={() => setModalQty(modalQty + 1)} className="w-14 h-14 md:w-20 md:h-20 glass-button rounded-full text-3xl font-black shrink-0 hover:bg-white/10 hover:scale-110 transition-all">+</button>
                </div>

                <div className="flex items-center gap-4 w-full mt-2">
                  {!isBulkMode && (
                    <button onClick={() => setOpType(null)} className="glass-button px-6 py-4 md:py-6 rounded-[24px] md:rounded-[32px] dark:text-slate-400 text-slate-600 hover:dark:text-white text-slate-900 w-auto shrink-0 flex items-center justify-center transition-all group">
                       <span className="text-[10px] font-black uppercase tracking-widest group-hover:-translate-x-1 transition-transform">Indietro</span>
                    </button>
                  )}
                  <button
                    onClick={handleMovement}
                    className={`flex-1 py-4 md:py-6 rounded-[24px] md:rounded-[32px] font-black text-lg md:text-xl uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.03] active:scale-[0.97] transition-all ${opType === 'carico' ? 'bg-accent-emerald text-slate-950 border-emerald-400/50 hover:bg-emerald-400' : 'bg-accent-rose text-white border-rose-500/50 hover:bg-rose-500'}`}
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
