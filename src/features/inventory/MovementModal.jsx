import React, { memo, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUp, ArrowDown, ShoppingCart, AlertTriangle, Briefcase, ChevronDown } from 'lucide-react';
import { buildDesc } from '../../lib/toolUtils';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { useCommesseStore } from '../../store/useCommesseStore';

import { useMovementStore } from '../../store/useMovementStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useFilterStore } from '../../store/useFilterStore';

const MovementModal = memo(({ setShowMoveModal, onOpenOrder, onConfirm }) => {
  const opType = useMovementStore(state => state.opType);
  const setOpType = useMovementStore(state => state.setOpType);
  const selectedTool = useMovementStore(state => state.selectedTool);
  const modalQty = useMovementStore(state => state.modalQty);
  const setModalQty = useMovementStore(state => state.setModalQty);
  const isBulkMode = useMovementStore(state => state.isBulkMode);
  const selectedCommessaId = useMovementStore(state => state.selectedCommessaId);
  const setSelectedCommessaId = useMovementStore(state => state.setSelectedCommessaId);

  const commesse = useCommesseStore(state => state.commesse);
  const isLoadingCommesse = useCommesseStore(state => state.isLoading);
  const fetchCommesse = useCommesseStore(state => state.fetchCommesse);

  useEffect(() => {
    fetchCommesse();
  }, [fetchCommesse]);

  const activeCommesse = useMemo(
    () => commesse.filter(c => c.stato === 'Attiva'),
    [commesse]
  );
  const closedCommesse = useMemo(
    () => commesse.filter(c => c.stato === 'Chiusa'),
    [commesse]
  );
  
  const currentUser = useAuthStore(state => state.currentUser);
  const tools = useInventoryStore(state => state.tools);
  const selectedToolsIds = useFilterStore(state => state.selectedToolsIds);

  const targets = isBulkMode 
    ? tools.filter(t => selectedToolsIds.includes(t.id)) 
    : (selectedTool && typeof selectedTool === 'object' ? [selectedTool] : []);

  const minAvailableStock = targets.length > 0 
    ? Math.min(...targets.map(t => Number(t['Quantità']) || 0)) 
    : (selectedTool && typeof selectedTool === 'object' ? (Number(selectedTool['Quantità']) || 0) : 0);

  const currentQtyNum = Number(modalQty) || 0;
  const isExceedingStock = opType === 'scarico' && currentQtyNum > minAvailableStock;
  const isZeroStock = opType === 'scarico' && minAvailableStock <= 0;
  const isConfirmDisabled = currentQtyNum <= 0 || isExceedingStock || (opType === 'scarico' && isZeroStock);

  // Fields to exclude from the details view
  const excludedKeys = ['id', 'Check', 'Alias', '_searchIndex'];

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
      if (k.startsWith('_') || excludedKeys.includes(k)) return false;
      if (v === null || v === undefined || v === '') return false;
      // Filter out only Quantità which is shown as the big number at the top
      if (k === 'Quantità') return false;
      return true;
    });

    return (
      <div className="@container">
        <div className="grid grid-cols-2 @md:grid-cols-3 gap-2 md:gap-3">
          {details.map(([key, value]) => (
            <div key={key} className="dark:bg-white/5 bg-slate-900/5 border border-white/5 p-2.5 md:p-3 rounded-2xl flex flex-col hover:bg-white/[0.08] transition-colors group">
              <span className="text-xs md:text-xs font-black uppercase tracking-widest text-accent-orange mb-1 opacity-60 group-hover:opacity-100 transition-opacity truncate">
                {displayLabelMap[key] || key}
              </span>
              <span className="text-xs md:text-xs font-bold dark:text-white text-slate-900 leading-tight truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) setShowMoveModal(false); }}>
      <DialogContent size="lg" showCloseButton={false} className="p-0 gap-0 overflow-hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl">
        <ModalHeader
          icon={isDetailsStep ? <Briefcase size={24} /> : (opType === 'carico' ? <ArrowDown size={24} className="text-accent-emerald" /> : <ArrowUp size={24} className="text-accent-rose" />)}
          overline={isDetailsStep ? "Dettaglio Utensile" : opType === 'carico' ? "Conferma Deposito" : "Conferma Prelievo"}
          title={typeof selectedTool === 'object' && selectedTool !== null ? buildDesc(selectedTool) : `${selectedTool || 0} Articoli`}
          badge={typeof selectedTool === 'object' && selectedTool !== null && selectedTool?.Codice ? (
            <div className="app-caption uppercase tracking-widest dark:bg-white/5 bg-slate-900/5 py-0.5 px-2 rounded-full border border-white/5">
              CODICE AZIENDALE: <span className="dark:text-white text-slate-900 ml-1 font-bold">{selectedTool.Codice}</span>
            </div>
          ) : null}
        />
        
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-all duration-700 pointer-events-none" 
          style={{ backgroundColor: opType === 'carico' ? 'rgba(16, 185, 129, 0.15)' : opType === 'scarico' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(14, 165, 233, 0.15)' }} 
        />

        <AnimatePresence mode="wait">
          {isDetailsStep ? (
            <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col flex-1 min-h-0">
              <ModalBody>
                <div>
                  <div className="flex items-end justify-between mb-2 sm:mb-3 border-b dark:border-white/10 border-slate-900/10 pb-2">
                     <div>
                       <p className="app-overline text-accent-orange drop-shadow-md mb-0.5">Giacenza Magazzino</p>
                       <p className="app-qty-lg dark:text-white text-slate-900">
                         {isBulkMode ? selectedTool : (selectedTool?.['Quantità'] || 0)}
                         <span className="text-xs md:text-sm text-slate-500 ml-2 font-black tracking-widest uppercase">Pezzi</span>
                       </p>
                     </div>
                  </div>
                  {renderDetails()}
                </div>
              </ModalBody>
              <ModalFooter>
                {(() => {
                  const showPrimaryActions = !(!isBulkMode && selectedTool && (selectedTool?.['Quantità'] || 0) <= 0 && currentUser?.ruolo !== 'Admin');
                  return (
                    <div className="flex flex-col gap-2 sm:gap-3 w-full">
                      {showPrimaryActions && (
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <button onClick={() => setOpType('carico')} className="action-btn action-btn-carica py-3 sm:py-3.5 md:py-4 w-full flex flex-col items-center justify-center gap-1.5 group border border-accent-emerald/30 shadow-lg relative overflow-hidden rounded-xl sm:rounded-2xl active:scale-95 cursor-pointer">
                            <div className="absolute inset-0 bg-accent-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <ArrowDown size={20} className="group-hover:translate-y-1 transition-transform relative z-10" />
                            <span className="text-xs sm:text-sm font-black uppercase tracking-wider relative z-10">DEPOSITA</span>
                          </button>
                          <button onClick={() => setOpType('scarico')} className="action-btn action-btn-scarica py-3 sm:py-3.5 md:py-4 w-full flex flex-col items-center justify-center gap-1.5 group border border-accent-rose/30 shadow-lg relative overflow-hidden rounded-xl sm:rounded-2xl active:scale-95 cursor-pointer">
                            <div className="absolute inset-0 bg-accent-rose/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <ArrowUp size={20} className="group-hover:-translate-y-1 transition-transform relative z-10" />
                            <span className="text-xs sm:text-sm font-black uppercase tracking-wider relative z-10">PRELEVA</span>
                          </button>
                        </div>
                      )}
                      {!isBulkMode && (
                        showPrimaryActions ? (
                          <button onClick={() => { setShowMoveModal(false); if(onOpenOrder) onOpenOrder(); }} className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-accent-orange/80 hover:text-accent-orange hover:bg-accent-orange/5 font-black text-xs sm:text-sm uppercase tracking-wider transition-all group cursor-pointer">
                            <ShoppingCart size={16} className="group-hover:scale-110 transition-transform" />
                            <span>Crea Ordine</span>
                          </button>
                        ) : (
                          <button onClick={() => { setShowMoveModal(false); if(onOpenOrder) onOpenOrder(); }} className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-accent-orange/40 text-accent-orange font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-accent-orange/10 transition-all cursor-pointer">
                            <ShoppingCart size={20} />
                            <span>Crea Ordine</span>
                          </button>
                        )
                      )}
                    </div>
                  );
                })()}
              </ModalFooter>
            </motion.div>
          ) : (
            <motion.div key="operation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col flex-1 min-h-0">
              <ModalBody>
                <div className="flex flex-col justify-center gap-3 sm:gap-6 py-2">
                  {/* Feedforward: Visual Stock Indicator */}
                  <div className="flex flex-col items-center justify-center gap-1 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs">
                      <span className="text-xs sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {opType === 'scarico' ? 'Disponibili a magazzino:' : 'Giacenza attuale:'}
                      </span>
                      <span className={`text-xs sm:text-sm font-black tabular-nums ${minAvailableStock > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                        {minAvailableStock} pz
                      </span>
                      {opType === 'carico' && (
                        <span className="text-xs sm:text-xs font-bold text-slate-400">
                          → <strong className="text-accent-emerald font-black">{minAvailableStock + (Number(modalQty) || 0)} pz</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Stepper */}
                  <div className="flex items-center gap-3 sm:gap-6 md:gap-8 justify-center">
                    <button 
                      type="button"
                      onClick={() => setModalQty(Math.max(1, (Number(modalQty) || 1) - 1))} 
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 glass-button rounded-full text-lg sm:text-xl md:text-2xl font-black shrink-0 hover:bg-white/10 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      aria-label="Riduci quantità"
                    >
                      -
                    </button>
                    <div className="flex flex-col items-center">
                      <p className={`app-overline mb-1 text-center ${opType === 'scarico' ? 'text-accent-rose' : 'text-accent-emerald'}`}>
                        Quantità {opType === 'carico' ? 'da Depositare' : 'da Prelevare'}
                      </p>
                      <input 
                        type="number" 
                        inputMode="numeric" 
                        min="1"
                        max={opType === 'scarico' ? Math.max(1, minAvailableStock) : undefined}
                        value={modalQty} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setModalQty(isNaN(val) ? '' : val);
                        }} 
                        className={`w-24 sm:w-28 md:w-32 bg-transparent text-center text-3xl sm:text-4xl md:text-5xl font-black outline-none tabular-nums border-b-2 pb-1 transition-all ${
                          isExceedingStock 
                            ? 'text-accent-rose border-accent-rose focus:border-accent-rose' 
                            : 'dark:text-white text-slate-900 dark:border-white/10 border-slate-900/10 focus:border-accent-blue'
                        }`} 
                      />
                    </div>
                    <button 
                      type="button"
                      disabled={opType === 'scarico' && currentQtyNum >= minAvailableStock}
                      onClick={() => setModalQty((Number(modalQty) || 0) + 1)} 
                      className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 glass-button rounded-full text-lg sm:text-xl md:text-2xl font-black shrink-0 transition-all ${
                        opType === 'scarico' && currentQtyNum >= minAvailableStock
                          ? 'opacity-30 cursor-not-allowed pointer-events-none'
                          : 'hover:bg-white/10 hover:scale-110 active:scale-95 cursor-pointer'
                      }`}
                      aria-label="Aumenta quantità"
                    >
                      +
                    </button>
                  </div>

                  {/* Exceeding alert */}
                  {isExceedingStock && (
                    <div className="flex items-center justify-center gap-1.5 text-accent-rose text-xs font-bold text-center px-3 py-1.5 bg-rose-500/10 rounded-xl border border-rose-500/20 max-w-sm mx-auto">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>Quantità superiore alla giacenza ({minAvailableStock} pz)</span>
                    </div>
                  )}

                  {/* Quick Presets (Fitts's Law) */}
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm mx-auto">
                    {opType === 'scarico' ? (
                      <>
                        {[1, 2, 5].filter(q => q <= minAvailableStock && q !== minAvailableStock).map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setModalQty(preset)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all glass-button cursor-pointer ${
                              modalQty === preset ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/40 shadow-xs' : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {preset} pz
                          </button>
                        ))}
                        {minAvailableStock > 0 && (
                          <button
                            type="button"
                            onClick={() => setModalQty(minAvailableStock)}
                            className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                              modalQty === minAvailableStock 
                                ? 'bg-accent-rose text-white border-accent-rose shadow-sm' 
                                : 'bg-rose-500/10 text-accent-rose border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                          >
                            MAX ({minAvailableStock} pz)
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {[1, 5, 10, 20].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setModalQty(preset)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all glass-button cursor-pointer ${
                              modalQty === preset ? 'bg-emerald-500/20 text-accent-emerald border-emerald-500/40 shadow-xs' : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            +{preset} pz
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Selezione Commessa (Mobile-First Native Form) */}
                  <div className="w-full max-w-sm mx-auto flex flex-col gap-1 px-1">
                    <div className="flex items-center justify-between">
                      <label 
                        htmlFor="movement-commessa-select"
                        className="app-overline text-slate-500 dark:text-slate-400 flex items-center gap-1.5"
                      >
                        <Briefcase size={14} className="text-accent-blue shrink-0" />
                        <span>Commessa di riferimento</span>
                      </label>
                      {selectedCommessaId && (
                        <button
                          type="button"
                          onClick={() => setSelectedCommessaId(null)}
                          className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          Resetta
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <select
                        id="movement-commessa-select"
                        value={selectedCommessaId || ''}
                        onChange={(e) => setSelectedCommessaId(e.target.value || null)}
                        disabled={isLoadingCommesse}
                        className="glass-input w-full border dark:border-white/10 border-slate-900/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-3 pl-3.5 pr-10 dark:text-white text-slate-900 outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50 transition-all font-medium appearance-none text-xs sm:text-sm cursor-pointer dark:bg-slate-900 bg-white"
                      >
                        <option value="" className="dark:bg-slate-900 dark:text-white bg-white text-slate-900">
                          {isLoadingCommesse ? 'Caricamento commesse...' : 'Nessuna commessa (Magazzino centrale)'}
                        </option>
                        {activeCommesse.length > 0 && (
                          <optgroup label="Commesse Attive" className="dark:bg-slate-900 dark:text-white bg-white text-slate-900 font-bold">
                            {activeCommesse.map((c) => (
                              <option
                                key={c.id}
                                value={c.id}
                                className="dark:bg-slate-900 dark:text-white bg-white text-slate-900 font-normal"
                              >
                                {c.codice}{c.ubicazione ? ` — ${c.ubicazione}` : ''}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {closedCommesse.length > 0 && (
                          <optgroup label="Commesse Chiuse (riattivare per selezionare)" className="dark:bg-slate-900 dark:text-slate-400 bg-white text-slate-400 font-bold">
                            {closedCommesse.map((c) => (
                              <option
                                key={c.id}
                                value={c.id}
                                disabled
                                className="dark:bg-slate-900 dark:text-slate-500 bg-white text-slate-400 font-normal italic"
                              >
                                {c.codice} (Chiusa)
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex items-center gap-3 md:gap-4 w-full">
                  {!isBulkMode && (
                    <button onClick={() => setOpType(null)} className="glass-button px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl dark:text-slate-400 text-slate-600 hover:dark:text-white text-slate-900 w-auto shrink-0 flex items-center justify-center transition-all group cursor-pointer">
                       <span className="text-xs sm:text-sm font-bold uppercase tracking-wider group-hover:-translate-x-0.5 transition-transform">Indietro</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (onConfirm) onConfirm(selectedCommessaId);
                    }}
                    disabled={isConfirmDisabled}
                    className={`flex-1 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl transition-all ${
                      isConfirmDisabled
                        ? 'opacity-40 cursor-not-allowed pointer-events-none bg-slate-300 dark:bg-slate-800 text-slate-500'
                        : `hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${opType === 'carico' ? 'action-btn-carica' : 'action-btn-scarica'}`
                    }`}
                  >
                    CONFERMA {opType === 'carico' ? 'DEPOSITO' : 'PRELIEVO'}
                  </button>
                </div>
              </ModalFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
});

export default MovementModal;
