import React, { useState, useEffect, useMemo, memo } from 'react';
import { PageContent, PageFooter } from '@/components/layout/PageTemplate';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Plus, Minus, Trash2, ArrowDown, ArrowUp, 
  AlertTriangle, RotateCcw, Briefcase, ChevronDown
} from 'lucide-react';
import { ToolIcon, buildDesc } from '../../lib/toolUtils';
import { useMultiMovementStore } from '../../store/useMultiMovementStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useCommesseStore } from '../../store/useCommesseStore';
import AddToolToMultiModal from './AddToolToMultiModal';

const MultiMovementView = memo(({ showToastNotification }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const items = useMultiMovementStore(state => state.items);
  const batchOpType = useMultiMovementStore(state => state.batchOpType);
  const setBatchOpType = useMultiMovementStore(state => state.setBatchOpType);
  const removeItem = useMultiMovementStore(state => state.removeItem);
  const updateQuantity = useMultiMovementStore(state => state.updateQuantity);
  const clearItems = useMultiMovementStore(state => state.clearItems);
  const executeMultiMovement = useMultiMovementStore(state => state.executeMultiMovement);
  const isExecuting = useMultiMovementStore(state => state.isExecuting);
  const selectedCommessaId = useMultiMovementStore(state => state.selectedCommessaId);
  const setSelectedCommessaId = useMultiMovementStore(state => state.setSelectedCommessaId);

  const commesse = useCommesseStore(state => state.commesse);
  const isLoadingCommesse = useCommesseStore(state => state.isLoading);
  const fetchCommesse = useCommesseStore(state => state.fetchCommesse);

  const tools = useInventoryStore(state => state.tools);

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

  const selectedCommessa = useMemo(
    () => commesse.find(c => c.id === selectedCommessaId),
    [commesse, selectedCommessaId]
  );

  // Mappa live per avere giacenze sempre sincronizzate
  const liveToolsMap = useMemo(() => {
    const map = new Map();
    tools.forEach(t => map.set(t.id, t));
    return map;
  }, [tools]);

  // Calcolo pezzi totali e validazione giacenze
  const { totalPieces, hasInsufficientStock } = useMemo(() => {
    let pieces = 0;
    let insufficient = false;

    items.forEach(item => {
      pieces += item.quantity;
      if (batchOpType === 'scarico') {
        const liveTool = liveToolsMap.get(item.tool.id) || item.tool;
        const available = Number(liveTool['Quantità'] || 0);
        if (available < item.quantity) {
          insufficient = true;
        }
      }
    });

    return { totalPieces: pieces, hasInsufficientStock: insufficient };
  }, [items, batchOpType, liveToolsMap]);

  const handleConfirm = () => {
    if (items.length === 0) return;
    executeMultiMovement(showToastNotification, undefined, selectedCommessaId);
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 relative max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
      {/* 1. Header Superiore */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 pt-1 border-b border-slate-200/60 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center text-accent-blue shadow-inner shrink-0">
            <ClipboardList size={24} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="app-overline text-accent-blue leading-none">Distinta Operativa</span>
            <h1 className="app-h1 text-lg sm:text-xl md:text-2xl text-slate-900 dark:text-slate-100 leading-tight mt-0.5">
              Movimento Multiplo
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Assegna Commessa Globale */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <div className="relative flex items-center">
              <div className="absolute left-3 pointer-events-none text-accent-blue">
                <Briefcase size={16} />
              </div>
              <select
                value={selectedCommessaId || ''}
                onChange={(e) => setSelectedCommessaId(e.target.value || null)}
                disabled={isLoadingCommesse}
                className="glass-input w-full border border-slate-300/60 dark:border-white/10 rounded-xl sm:rounded-2xl py-2 pl-9 pr-9 text-xs sm:text-sm font-medium dark:text-white text-slate-900 outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50 transition-all appearance-none cursor-pointer dark:bg-slate-900 bg-white"
                aria-label="Assegna commessa a tutto il lotto"
              >
                <option value="" className="dark:bg-slate-900 dark:text-white bg-white text-slate-900">
                  {isLoadingCommesse ? 'Caricamento commesse...' : 'Nessuna commessa (Generale)'}
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
              <div className="absolute right-3 pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* Toggle Prelievo / Deposito */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-900/50 border border-slate-300/50 dark:border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setBatchOpType('scarico')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                batchOpType === 'scarico'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <ArrowUp size={14} />
              <span>Prelievo</span>
            </button>
            <button
              type="button"
              onClick={() => setBatchOpType('carico')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                batchOpType === 'carico'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <ArrowDown size={14} />
              <span>Deposito</span>
            </button>
          </div>

          {/* Pulsante Aggiungi Utensile in testata */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="action-btn-primary px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95 transition-transform"
          >
            <Plus size={16} />
            <span>Aggiungi Utensile</span>
          </button>
        </div>
      </div>

      {/* 2. Griglia Tabellare della Distinta (Sempre Visibile fin dall'apertura) */}
      <PageContent className="flex flex-col">
        <div className="glass-panel rounded-3xl md:rounded-3xl overflow-hidden flex flex-col flex-1 min-h-0 border dark:border-white/10 border-slate-900/10 shadow-xl">
          
          {/* Barra Info & Azioni Tabella */}
          <div className="px-4 md:px-6 py-2.5 md:py-3 border-b dark:border-white/5 border-slate-900/10 flex items-center justify-between bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-2">
              <span className="app-overline text-accent-orange">
                DISTINTA ARTICOLI
              </span>
              <span className="text-slate-400">•</span>
              <span className="app-caption text-xs text-slate-500">
                {items.length} {items.length === 1 ? 'riga compilata' : 'righe compilate'}
              </span>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearItems}
                className="app-overline text-xs text-rose-400 hover:text-rose-500 transition-colors flex items-center gap-1"
              >
                <RotateCcw size={14} /> Svuota Distinta
              </button>
            )}
          </div>

          {/* Intestazione Colonne Tabella */}
          <div className="hidden md:flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2.5 bg-slate-100/70 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-white/5 text-xs sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
            <div className="w-8 sm:w-10 text-center shrink-0">#</div>
            <div className="flex-1 min-w-0">Descrizione Articolo</div>
            <div className="w-28 text-center hidden sm:block shrink-0">Codice</div>
            <div className="w-28 text-center hidden md:block shrink-0">Ubicazione</div>
            <div className="w-20 text-center shrink-0">Giacenza</div>
            <div className="w-32 sm:w-36 text-center shrink-0">Quantità</div>
            <div className="w-10 text-center shrink-0">Azioni</div>
          </div>

          {/* Corpo Tabella Scrollabile */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-200/50 dark:divide-white/5 min-h-0">
            {items.length === 0 ? (
              /* CASO 1: DISTINTA VUOTA -> La griglia mostra la prima riga attiva con [+] */
              <div className="flex flex-col">
                {/* Riga 1: Cliccabile con [+] prominente */}
                <div
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 md:px-6 py-4 hover:bg-accent-blue/10 cursor-pointer transition-all group select-none border-b border-dashed border-accent-blue/30 bg-accent-blue/[0.04]"
                >
                  <div className="w-8 sm:w-10 flex items-center justify-center shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-accent-blue/20 border border-accent-blue/40 flex items-center justify-center text-accent-blue group-hover:scale-110 group-hover:bg-accent-blue group-hover:text-white transition-all shadow-sm">
                      <Plus size={20} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="app-h3 text-accent-blue group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      + Clicca per selezionare il 1° utensile...
                    </p>
                    <p className="app-body text-xs text-slate-500 dark:text-slate-400">
                      Scegli dal catalogo completo con visualizzazione tabella
                    </p>
                  </div>
                  <div className="w-28 text-center hidden sm:block shrink-0">
                    <span className="text-slate-400 opacity-40 font-mono text-xs">------</span>
                  </div>
                  <div className="w-28 text-center hidden md:block shrink-0">
                    <span className="text-slate-400 opacity-40 font-mono text-xs">------</span>
                  </div>
                  <div className="w-20 text-center shrink-0">
                    <span className="text-slate-400 opacity-40 font-mono text-xs">--</span>
                  </div>
                  <div className="w-32 sm:w-36 text-center shrink-0">
                    <span className="badge app-caption text-xs text-slate-400 opacity-60">Riga 1</span>
                  </div>
                  <div className="w-10 text-center shrink-0" />
                </div>

                {/* Righe Faint Segnaposto per dare l'effetto di foglio tabellare pronto da compilare */}
                {[2, 3, 4].map((rowNum) => (
                  <div
                    key={rowNum}
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 md:px-6 py-3.5 opacity-30 hover:opacity-60 cursor-pointer transition-opacity select-none border-b border-dashed border-slate-300 dark:border-white/10"
                  >
                    <div className="w-8 sm:w-10 text-center shrink-0">
                      <span className="app-caption text-xs text-slate-400">{rowNum}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-slate-400 font-mono text-xs">
                      [ In attesa di selezione ]
                    </div>
                    <div className="w-28 text-center hidden sm:block shrink-0 text-slate-400 font-mono text-xs">---</div>
                    <div className="w-28 text-center hidden md:block shrink-0 text-slate-400 font-mono text-xs">---</div>
                    <div className="w-20 text-center shrink-0 text-slate-400 font-mono text-xs">---</div>
                    <div className="w-32 sm:w-36 text-center shrink-0 text-slate-400 font-mono text-xs">---</div>
                    <div className="w-10 text-center shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              /* CASO 2: DISTINTA COMPILATA CON ARTICOLI */
              <div>
                <AnimatePresence initial={false}>
                  {items.map((item, index) => {
                    const liveTool = liveToolsMap.get(item.tool.id) || item.tool;
                    const liveStock = Number(liveTool['Quantità'] || 0);
                    const isInsufficient = batchOpType === 'scarico' && liveStock < item.quantity;

                    return (
                      <motion.div
                        key={item.tool.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`flex items-center gap-2 px-3 sm:px-4 md:px-6 py-3 transition-colors ${
                          isInsufficient
                            ? 'bg-rose-500/[0.06] border-l-4 border-l-accent-rose'
                            : 'hover:bg-slate-100/50 dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        {/* Colonna Indice */}
                        <div className="w-8 sm:w-10 text-center shrink-0">
                          <span className="app-caption text-xs font-black text-slate-400">
                            {index + 1}
                          </span>
                        </div>

                        {/* Colonna Utensile e Descrizione */}
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center shrink-0 overflow-hidden">
                            <ToolIcon type={item.tool['Tipologia']} size={32} className="opacity-80" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="app-h3 truncate text-slate-900 dark:text-slate-100">
                              {buildDesc(item.tool)}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              {item.tool['Codice'] && (
                                <span className="sm:hidden badge badge-blue app-caption text-xs px-1.5 py-0.2">
                                  {item.tool['Codice']}
                                </span>
                              )}
                              {item.tool['Ubicazione'] && (
                                <span className="md:hidden badge badge-orange app-caption text-xs px-1.5 py-0.2">
                                  {item.tool['Ubicazione']}
                                </span>
                              )}
                              {item.tool['Fornitore'] && (
                                <span className="app-caption text-xs text-slate-400 hidden xl:inline">
                                  {item.tool['Fornitore']}
                                </span>
                              )}
                            </div>
                            {isInsufficient && (
                              <div className="flex items-center gap-1 text-accent-rose mt-1">
                                <AlertTriangle size={14} className="shrink-0" />
                                <span className="app-body text-xs font-bold">
                                  Richiesti: {item.quantity} | Max disp: {liveStock}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Colonna Codice Aziendale */}
                        <div className="w-28 text-center hidden sm:block shrink-0">
                          {item.tool['Codice'] ? (
                            <span className="badge badge-blue app-caption text-xs font-bold px-2 py-0.5">
                              {item.tool['Codice']}
                            </span>
                          ) : (
                            <span className="text-slate-400 opacity-40 font-mono text-xs">—</span>
                          )}
                        </div>

                        {/* Colonna Ubicazione */}
                        <div className="w-28 text-center hidden md:block shrink-0">
                          {item.tool['Ubicazione'] ? (
                            <span className="badge badge-orange app-caption text-xs font-bold px-2 py-0.5">
                              {item.tool['Ubicazione']}
                            </span>
                          ) : (
                            <span className="text-slate-400 opacity-40 font-mono text-xs">—</span>
                          )}
                        </div>

                        {/* Colonna Giacenza */}
                        <div className="w-20 text-center shrink-0">
                          <span className={`app-qty-sm ${liveStock > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                            {liveStock} pz
                          </span>
                        </div>

                        {/* Colonna Quantità con Stepper */}
                        <div className="w-32 sm:w-36 flex items-center justify-center shrink-0">
                          <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.tool.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-800 transition-colors"
                              title="Diminuisci quantità"
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.tool.id, e.target.value)}
                              className="w-11 text-center font-black text-xs sm:text-sm bg-transparent border-none focus:outline-none dark:text-white text-slate-900 tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.tool.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-colors"
                              title="Aumenta quantità"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Colonna Azioni: Rimuovi */}
                        <div className="w-10 text-center shrink-0">
                          <button
                            type="button"
                            onClick={() => removeItem(item.tool.id)}
                            className="p-2 rounded-xl text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Rimuovi riga"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Riga Finale '+ Aggiungi un altro utensile' */}
                <div
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-3 px-3 sm:px-4 md:px-6 py-3.5 hover:bg-accent-blue/10 cursor-pointer transition-all select-none text-accent-blue border-t border-dashed border-accent-blue/20 group"
                >
                  <div className="w-8 sm:w-10 flex items-center justify-center shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus size={14} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="app-body text-xs sm:text-sm font-bold text-accent-blue group-hover:underline">
                      + Aggiungi riga {items.length + 1} (seleziona un altro utensile)...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageContent>

      {/* 3. Barra Azione Inferiore (Riepilogo & Conferma Atomica) */}
      <PageFooter className="justify-between">
        <div className="flex items-center w-full justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="app-overline text-accent-blue leading-none">Riepilogo Distinta</span>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="app-h2 text-sm sm:text-base dark:text-white text-slate-900">
              {items.length} {items.length === 1 ? 'articolo' : 'articoli'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="app-qty-sm text-sm sm:text-base text-accent-blue">
              {totalPieces} pezzi totali
            </span>
            {selectedCommessa && (
              <>
                <span className="text-slate-400">•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-bold">
                  <Briefcase size={14} />
                  <span>Commessa: {selectedCommessa.codice}</span>
                </span>
              </>
            )}
          </div>
          {hasInsufficientStock && (
            <span className="text-xs font-bold text-accent-rose flex items-center gap-1 mt-0.5">
              <AlertTriangle size={14} /> Riduci le quantità segnalate prima di confermare il prelievo
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearItems}
              className="glass-button px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-rose-500 transition-colors"
            >
              Annulla
            </button>
          )}

          <button
            type="button"
            disabled={items.length === 0 || isExecuting || hasInsufficientStock}
            onClick={handleConfirm}
            className={`flex-1 sm:flex-initial px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              batchOpType === 'scarico' ? 'action-btn-scarica' : 'action-btn-carica'
            }`}
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Elaborazione...</span>
              </>
            ) : (
              <>
                {batchOpType === 'scarico' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                <span>
                  Conferma {batchOpType === 'scarico' ? 'Prelievo' : 'Deposito'} ({totalPieces} pz)
                </span>
              </>
            )}
          </button>
        </div>
        </div>
      </PageFooter>

      {/* Modale Ricerca Rapida Utensili (con TanStack Table completa) */}
      <AddToolToMultiModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        showToastNotification={showToastNotification}
      />
    </div>
  );
});

export default MultiMovementView;
