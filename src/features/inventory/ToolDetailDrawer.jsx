import React, { memo, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft,
  SlidersHorizontal, 
  Archive, 
  MapPin, 
  Printer, 
  ShoppingCart, 
  AlertTriangle, 
  Briefcase, 
  ChevronDown,
  Layers
} from 'lucide-react';
import { buildDesc } from '../../lib/toolUtils';
import { useCommesseStore } from '../../store/useCommesseStore';
import { useMovementStore } from '../../store/useMovementStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useFilterStore } from '../../store/useFilterStore';
import { lifecycleUiEnabled } from '../../lib/lifecycleApi';
import { useProduzioneStore } from '../../store/useProduzioneStore';
import { PrelievoGuidato } from '../produzione/PrelievoGuidato';
import { DepositoGuidato } from '../produzione/DepositoGuidato';

/**
 * ToolDetailDrawer - Drawer Laterale Dettaglio Utensile
 * Conforme al prototipo Stitch "Inventario — Dettaglio Utensile (Drawer Laterale)".
 * Si apre a scorrimento da destra sovrapponendosi alla tabella inventario senza ridimensionarla.
 */
export const ToolDetailDrawer = memo(({ 
  setShowMoveModal, 
  onOpenOrder, 
  onConfirm, 
  notify, 
  onLifecycleDone 
}) => {
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

  // Gestione tasto Escape per chiudere il drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        useProduzioneStore.getState().setContestoPrelievo(null);
        setShowMoveModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowMoveModal]);

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

  // Identifica lo stato: Step 1 (Dettaglio) o Step 2 (Operazione Movimento)
  const isDetailsStep = !opType;
  const isGuidedStep = !isDetailsStep && lifecycleUiEnabled && !isBulkMode && selectedTool && typeof selectedTool === 'object';

  const handleClose = useCallback(() => {
    useProduzioneStore.getState().setContestoPrelievo(null);
    setShowMoveModal(false);
  }, [setShowMoveModal]);

  // Generatore e stampa etichetta barcode/QR termica da officina
  const handlePrintBarcode = useCallback(() => {
    if (!selectedTool) return;
    const desc = buildDesc(selectedTool);
    const code = selectedTool.Codice || selectedTool['Codice Aziendale'] || 'N/A';
    const serial = selectedTool['Serial Number'] || selectedTool.SerialNumber || selectedTool['Codice Fornitore'] || '';
    const loc = selectedTool.Ubicazione || 'Magazzino Centrale';
    const printWindow = window.open('', '_blank', 'width=450,height=300');
    if (!printWindow) {
      if (notify) notify('Consenti l\'apertura dei pop-up per stampare l\'etichetta barcode.', 'warning');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="it">
        <head>
          <meta charset="utf-8" />
          <title>Etichetta Barcode - ${code}</title>
          <style>
            @page { size: 60mm 40mm; margin: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 10px; box-sizing: border-box; width: 60mm; height: 40mm; display: flex; flex-direction: column; justify-content: space-between; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 3px; }
            .logo { font-size: 10px; font-weight: 900; letter-spacing: 0.1em; }
            .code { font-family: monospace; font-size: 12px; font-weight: 800; }
            .desc { font-size: 11px; font-weight: 700; line-height: 1.2; margin-top: 4px; }
            .meta { font-size: 8px; color: #333; margin-top: 2px; }
            .barcode-area { text-align: center; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #666; }
            .barcode { font-family: monospace; font-size: 15px; font-weight: 900; letter-spacing: 3px; }
          </style>
        </head>
        <body>
          <div>
            <div class="header">
              <span class="logo">BERCELLA CNC</span>
              <span class="code">${code}</span>
            </div>
            <div class="desc">${desc}</div>
            <div class="meta">Ubicazione: <strong>${loc}</strong> ${serial ? '· Matr: ' + serial : ''}</div>
          </div>
          <div class="barcode-area">
            <div class="barcode">||| | |||| | ||| ||||</div>
            <div style="font-family: monospace; font-size: 9px; margin-top: 2px;">${code}</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    if (notify) notify(`Etichetta inviata alla stampa per ${code}`, 'success');
  }, [selectedTool, notify]);

  // Titoli ed estrazione dati utensile
  const toolTitle = useMemo(() => {
    if (isBulkMode) return `Movimento Massivo (${targets.length} Articoli)`;
    if (selectedTool && typeof selectedTool === 'object') return buildDesc(selectedTool);
    return 'Dettaglio Utensile';
  }, [isBulkMode, targets.length, selectedTool]);

  const toolSubtitle = useMemo(() => {
    if (isBulkMode) return 'Operazione cumulativa su selezione multipla';
    if (!selectedTool) return '';
    return selectedTool.Descrizione || selectedTool.Lavorazione || selectedTool.Forma || 'Alesatore / Fresa a macchina con codolo cilindrico';
  }, [isBulkMode, selectedTool]);

  const toolCode = selectedTool?.Codice || selectedTool?.['Codice Aziendale'] || null;
  const toolState = selectedTool?.Stato || 'NUOVO';
  const stockQty = selectedTool ? (Number(selectedTool['Quantità']) || 0) : 0;

  // Dati tecnici accessori filtrati
  const extraSpecs = useMemo(() => {
    if (!selectedTool || typeof selectedTool !== 'object') return [];
    const standardKeys = [
      'id', 'Codice', 'Descrizione', 'Quantità', 'Tipologia', 'Diametro', 
      'Tolleranza', 'Materiale', 'Forma', 'Attacco / Codolo', 'Ubicazione', 
      'Stato', 'Norma', 'Check', 'Alias', '_searchIndex'
    ];
    return Object.entries(selectedTool).filter(([k, v]) => {
      if (k.startsWith('_') || standardKeys.includes(k)) return false;
      return v !== null && v !== undefined && v !== '' && v !== '-';
    });
  }, [selectedTool]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Sfondo / Backdrop trasparente: lascia la tabella perfettamente visibile al di sotto */}
      <motion.div
        key="drawer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleClose}
        className="fixed inset-0 bg-slate-950/20 dark:bg-black/40 backdrop-blur-[0.5px] pointer-events-auto cursor-pointer"
        aria-hidden="true"
      />

      {/* Pannello Drawer laterale destro: si sovrappone alla tabella senza ridimensionarla */}
      <motion.aside
        key="tool-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Dettaglio Utensile"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] max-w-full bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
      >
        {/* HEADER DEL DRAWER */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <div className="flex flex-col gap-1 min-w-0 pr-2">
            {isDetailsStep ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  {stockQty > 0 ? (
                    <span className="badge badge-emerald gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {toolState === 'USATO' ? 'USATO / DISPONIBILE' : 'NUOVO / DISPONIBILE'}
                    </span>
                  ) : (
                    <span className="badge badge-rose gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      ESAURITO (0 PZ)
                    </span>
                  )}
                  {toolCode && (
                    <span className="app-caption text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-1.5 py-0.5 rounded">
                      {toolCode}
                    </span>
                  )}
                </div>
                <h2 className="app-h2 mt-1 truncate" title={toolTitle}>
                  {toolTitle}
                </h2>
                <p className="app-body line-clamp-1">
                  {toolSubtitle}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {!isBulkMode && (
                  <button
                    type="button"
                    onClick={() => setOpType(null)}
                    className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Torna ai dettagli"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    opType === 'scarico' ? 'text-accent-rose' : 'text-accent-emerald'
                  }`}>
                    {opType === 'scarico' ? 'Conferma Prelievo' : 'Conferma Deposito'}
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                    {toolTitle}
                  </h2>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Chiudi pannello"
            className="w-8 h-8 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        {/* CORPO DEL DRAWER CON TRANSIZIONI */}
        <AnimatePresence mode="wait">
          {isDetailsStep ? (
            /* VISTA DETTAGLIO UTENSILE (PROTO PROTOCOL TOOL CRIB PRECISION) */
            <motion.div
              key="details-view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 text-xs custom-scrollbar">
                {/* Scheda 1: Specifiche Tecniche */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3.5 shadow-2xs flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-sky-600 dark:text-sky-400" />
                      Specifiche Tecniche
                    </span>
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-semibold">
                      {[selectedTool?.Tolleranza, selectedTool?.Norma || 'DIN 212'].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Diametro Nominale</span>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                        {selectedTool?.Diametro ? `Ø ${selectedTool.Diametro} mm` : '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tolleranza Foro</span>
                      <span className="font-mono font-bold text-sm text-sky-700 dark:text-sky-400 mt-0.5">
                        {selectedTool?.Tolleranza || 'ISO H7'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Materiale Costruttivo</span>
                      <span className="font-semibold text-xs text-slate-900 dark:text-white mt-0.5 truncate" title={selectedTool?.Materiale || 'Metallo duro integrale'}>
                        {selectedTool?.Materiale || 'Metallo duro integrale'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Attacco / Codolo</span>
                      <span className="font-mono font-semibold text-xs text-slate-900 dark:text-white mt-0.5 truncate">
                        {selectedTool?.Forma || selectedTool?.['Attacco / Codolo'] || 'Cilindrico h6'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scheda 2: Ubicazione e Stock */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3.5 shadow-2xs flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Archive size={14} className="text-sky-600 dark:text-sky-400" />
                      Ubicazione &amp; Giacenza
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold ${
                      stockQty > 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {stockQty > 0 ? 'In Stock' : 'Esaurito'}
                    </span>
                  </div>

                  {/* Ubicazione fisica dettagliata */}
                  <div className="p-2.5 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Ubicazione Fisica</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {selectedTool?.Ubicazione || 'Magazzino Centrale'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Giacenza Disponibile in grande Geist Mono */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Giacenza Disponibile</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">Non impegnato in produzione</span>
                    </div>
                    <div className="text-right flex items-baseline gap-1">
                      <span className={`app-qty-lg ${stockQty > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {stockQty}
                      </span>
                      <span className="app-caption text-slate-500 ml-1">PZ</span>
                    </div>
                  </div>

                  {/* Stato Tagliente */}
                  <div className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Stato Tagliente:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                      <span className={`w-2 h-2 rounded-full ${stockQty > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {selectedTool?.Stato || 'Integro (0 cicli / Nuovo)'}
                    </span>
                  </div>
                </div>

                {/* Scheda 3: Parametri Aggiuntivi (se disponibili) */}
                {extraSpecs.length > 0 && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 shadow-2xs flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Layers size={13} className="text-sky-600 dark:text-sky-400" />
                      Dati Aggiuntivi
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {extraSpecs.map(([label, val]) => (
                        <div key={label} className="p-2 rounded bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 flex flex-col">
                          <span className="text-xs text-slate-400 uppercase font-semibold truncate">{label}</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER DEL DRAWER: AZIONI RAPIDE */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex flex-col gap-2 shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOpType('scarico')}
                    disabled={stockQty <= 0 && currentUser?.ruolo !== 'Admin'}
                    className="h-11 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-150 active:scale-[0.98] group cursor-pointer action-btn-scarica"
                    title="Preleva questo utensile"
                  >
                    <ArrowUp size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                    <span className="font-extrabold tracking-widest">PRELEVA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpType('carico')}
                    className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-150 active:scale-[0.98] group cursor-pointer action-btn-carica"
                    title="Deposita questo utensile"
                  >
                    <ArrowDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
                    <span className="font-extrabold tracking-widest">DEPOSITA</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintBarcode}
                    className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                    title="Stampa etichetta barcode con matricola"
                  >
                    <Printer size={15} className="text-slate-500 dark:text-slate-400" />
                    <span>Stampa Etichetta Barcode / QR</span>
                  </button>
                  {onOpenOrder && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onOpenOrder();
                      }}
                      className="h-9 px-3 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                      title="Crea ordine per questo utensile"
                    >
                      <ShoppingCart size={15} />
                      <span className="hidden sm:inline">Ordine</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : isGuidedStep ? (
            /* VISTA GUIDATA: PRELIEVO / DEPOSITO */
            <motion.div
              key={`guided-${opType}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {opType === 'scarico' ? (
                <PrelievoGuidato
                  tool={selectedTool}
                  onBack={() => setOpType(null)}
                  onDone={onLifecycleDone}
                  onOpenOrder={onOpenOrder ? () => { handleClose(); onOpenOrder(); } : undefined}
                  notify={notify}
                />
              ) : (
                <DepositoGuidato 
                  tool={selectedTool} 
                  onBack={() => setOpType(null)} 
                  onDone={onLifecycleDone} 
                  notify={notify} 
                />
              )}
            </motion.div>
          ) : (
            /* VISTA OPERAZIONE STANDARD CON STEPPER */
            <motion.div
              key="operation-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center gap-5">
                {/* Indicatore visivo disponibilità */}
                <div className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {opType === 'scarico' ? 'Disponibili:' : 'Giacenza:'}
                    </span>
                    <span className={`text-xs font-black tabular-nums ${minAvailableStock > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                      {minAvailableStock} pz
                    </span>
                    {opType === 'carico' && (
                      <span className="text-xs font-bold text-slate-400">
                        → <strong className="text-accent-emerald font-black">{minAvailableStock + (Number(modalQty) || 0)} pz</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Stepper Quantità */}
                <div className="flex items-center gap-4 justify-center">
                  <button 
                    type="button"
                    onClick={() => setModalQty(Math.max(1, (Number(modalQty) || 1) - 1))} 
                    className="w-12 h-12 glass-button rounded-full text-xl font-black shrink-0 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    aria-label="Riduci quantità"
                  >
                    -
                  </button>
                  <div className="flex flex-col items-center">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${opType === 'scarico' ? 'text-accent-rose' : 'text-accent-emerald'}`}>
                      Quantità {opType === 'carico' ? 'da caricare' : 'da prelevare'}
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
                      className={`w-28 bg-transparent text-center text-4xl font-black outline-none tabular-nums border-b-2 pb-1 transition-all ${
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
                    className={`w-12 h-12 glass-button rounded-full text-xl font-black shrink-0 transition-all flex items-center justify-center ${
                      opType === 'scarico' && currentQtyNum >= minAvailableStock
                        ? 'opacity-30 cursor-not-allowed pointer-events-none'
                        : 'hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer'
                    }`}
                    aria-label="Aumenta quantità"
                  >
                    +
                  </button>
                </div>

                {/* Alert superamento scorte */}
                {isExceedingStock && (
                  <div className="flex items-center justify-center gap-1.5 text-accent-rose text-xs font-bold text-center px-3 py-1.5 bg-rose-500/10 rounded-xl border border-rose-500/20 max-w-xs mx-auto">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>Supera la giacenza ({minAvailableStock} pz)</span>
                  </div>
                )}

                {/* Preset rapidi di quantità */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-xs mx-auto">
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
                    [1, 5, 10, 20].map(preset => (
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
                    ))
                  )}
                </div>

                {/* Selezione Commessa */}
                <div className="w-full max-w-xs mx-auto flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label 
                      htmlFor="movement-commessa-select"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5"
                    >
                      <Briefcase size={13} className="text-accent-blue shrink-0" />
                      <span>Commessa</span>
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
                      className="glass-input w-full border dark:border-white/10 border-slate-900/10 rounded-xl py-2 pl-3 pr-8 dark:text-white text-slate-900 outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50 transition-all font-medium appearance-none text-xs cursor-pointer dark:bg-slate-900 bg-white"
                    >
                      <option value="" className="dark:bg-slate-900 dark:text-white bg-white text-slate-900">
                        {isLoadingCommesse ? 'Caricamento commesse...' : 'Nessuna (Magazzino centrale)'}
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
                        <optgroup label="Commesse Chiuse" className="dark:bg-slate-900 dark:text-slate-400 bg-white text-slate-400 font-bold">
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
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer di conferma operazione */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center gap-2 shrink-0">
                {!isBulkMode && (
                  <button 
                    type="button"
                    onClick={() => setOpType(null)} 
                    className="glass-button px-3.5 py-3 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer"
                  >
                    Indietro
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (onConfirm) onConfirm(selectedCommessaId);
                  }}
                  disabled={isConfirmDisabled}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all ${
                    isConfirmDisabled
                      ? 'opacity-40 cursor-not-allowed pointer-events-none bg-slate-300 dark:bg-slate-800 text-slate-500'
                      : `hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${opType === 'carico' ? 'action-btn-carica' : 'action-btn-scarica'}`
                  }`}
                >
                  CONFERMA {opType === 'carico' ? 'DEPOSITO' : 'PRELIEVO'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
});

export default ToolDetailDrawer;
