import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, Search, Info, Camera } from 'lucide-react';
import { PageTemplate, PageHeader, PageToolbar, PageContent } from '@/components/layout/PageTemplate';
import BarcodeScanner from './BarcodeScanner';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { toolMatchesQuery } from '../../lib/searchUtils';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useMovementStore } from '../../store/useMovementStore';
import ToolsGrid from '../inventory/ToolsGrid';

const ScannerView = memo(({ setView, setShowMoveModal, isMobile }) => {
  const tools = useInventoryStore(state => state.tools);
  const setSelectedTool = useMovementStore(state => state.setSelectedTool);
  const setModalQty = useMovementStore(state => state.setModalQty);
  const opType = useMovementStore(state => state.opType);
  const setOpType = useMovementStore(state => state.setOpType);
  const setIsBulkMode = useMovementStore(state => state.setIsBulkMode);
  const [manualCode, setManualCode] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  const filteredTools = useMemo(() => {
    if (!manualCode || manualCode.trim().length < 1) return [];
    return (tools || []).filter(t => toolMatchesQuery(t, manualCode));
  }, [manualCode, tools]);

  const isSearchMode = manualCode.trim().length > 0;

  const handleSelectResult = useCallback((tool) => {
    setSelectedTool(tool);
    // Se l'operatore aveva scelto esplicitamente Carico o Scarico nella Sidebar, manteniamo l'intento!
    setModalQty(1);
    setIsBulkMode(false);
    setShowMoveModal(true);
  }, [setSelectedTool, setModalQty, setIsBulkMode, setShowMoveModal]);

  const handleScan = useCallback((decodedText) => {
    setManualCode(decodedText);
    setShowCamera(false);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.15 }}
      className="h-full w-full"
    >
      <PageTemplate>
      {/* Top Header Bar */}
      <PageHeader 
        title="Scanner"
        breadcrumb="Magazzino"
        showBack={true}
        onBack={() => setView('home')}
        search={{
          value: manualCode,
          onChange: setManualCode,
          autoFocus: !isMobile, // su mobile il focus aprirebbe la tastiera e nasconderebbe il selettore modalità
          label: 'Cerca o scansiona utensile',
          placeholder: opType === 'carico'
            ? 'Scansiona o cerca utensile da depositare…'
            : opType === 'scarico'
            ? 'Scansiona o cerca utensile da prelevare…'
            : 'Digita codice, descrizione o misura…',
          onCamera: () => setShowCamera(prev => !prev),
          cameraActive: showCamera,
        }}
        action={
          <SegmentedControl
            value={opType ?? 'dettaglio'}
            onValueChange={(val) => setOpType(val === 'dettaglio' ? null : val)}
            options={[
              { value: 'dettaglio', label: 'Dettaglio', icon: <Info size={14} />, compact: true },
              { value: 'carico', label: 'Deposita', icon: <ArrowDown size={14} />, compact: true, className: 'data-[pressed]:text-accent-emerald data-[pressed]:ring-accent-emerald/30' },
              { value: 'scarico', label: 'Preleva', icon: <ArrowUp size={14} />, compact: true, className: 'data-[pressed]:text-accent-rose data-[pressed]:ring-accent-rose/30' }
            ]}
            ariaLabel="Modalità scanner"
            className="h-11"
          />
        }
      />
      <div className="flex-1 min-h-0 flex flex-col w-full pb-24 p-2 sm:p-4 gap-4 items-center">
      {/* Fotocamera: si apre dal pulsante nella casella di ricerca della barra */}
      <div className="w-full max-w-4xl relative shrink-0">
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel w-full rounded-3xl overflow-hidden mt-4 shrink-0"
          >
            <BarcodeScanner onScan={handleScan} />
          </motion.div>
        )}
      </div>

      {/* Main Content Area: Prompt 'Cerca un utensile' or TanStack ToolsGrid */}
      <AnimatePresence mode="wait">
        {!isSearchMode && !showCamera ? (
          <motion.div
            key="search-idle-prompt"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full max-w-3xl flex flex-col items-center justify-center min-h-0 my-auto py-6 px-2"
          >
            <div className="glass-panel w-full rounded-3xl sm:rounded-full p-6 sm:p-10 flex flex-col items-center text-center border-accent-blue/20 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue mb-4 shadow-inner">
                <Search size={32} className={`sm:w-9 sm:h-9 ${opType === 'carico' ? 'text-accent-emerald' : opType === 'scarico' ? 'text-accent-rose' : 'text-accent-cyan'}`} />
              </div>
              <p className={`app-overline mb-1 ${opType === 'carico' ? 'text-accent-emerald' : opType === 'scarico' ? 'text-accent-rose' : 'text-accent-cyan'}`}>
                {opType === 'carico' ? 'Modalità Deposito' : opType === 'scarico' ? 'Modalità Prelievo' : 'Pronto alla ricerca'}
              </p>
              <h3 className="app-h2 mb-2">
                {opType === 'carico' ? 'Seleziona utensile da depositare' : opType === 'scarico' ? 'Seleziona utensile da prelevare' : 'Cerca un utensile'}
              </h3>
              <p className="app-body dark:text-slate-400 text-slate-600 max-w-md mb-6 leading-relaxed">
                {opType === 'carico' 
                  ? 'Digita codice, misura o descrizione oppure scansiona il barcode per caricare a magazzino.'
                  : opType === 'scarico'
                  ? 'Digita codice, misura o descrizione oppure scansiona il barcode per prelevare per la macchina CNC.'
                  : "Digita un codice aziendale, una misura (es. D16) o una descrizione per trovare gli utensili a magazzino, oppure premi l'icona fotocamera per scansionare il codice a barre."
                }
              </p>

              {/* Fotocamera: azione principale della pagina, grande e sempre raggiungibile (anche su mobile) */}
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="action-btn action-btn-primary h-12 px-6 mb-6 max-w-full rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider whitespace-nowrap"
              >
                <Camera size={20} /> Apri fotocamera
              </button>

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
                <span className="app-overline dark:text-slate-500 text-slate-400 mr-1">Ricerche rapide:</span>
                {['FRESA', 'PUNTA', 'MASCHIO', 'ALESATORE', 'D16', 'BURZONI'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setManualCode(chip)}
                    className="glass-button px-3 py-1.5 rounded-xl app-caption font-bold dark:text-slate-300 text-slate-700 hover:text-accent-blue hover:border-accent-blue/40 transition-all text-xs"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : isSearchMode ? (
          <motion.div
            key="search-table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="w-full flex-1 flex flex-col min-h-0"
          >
            <ToolsGrid 
              tools={filteredTools} 
              onSelectTool={handleSelectResult} 
              isMobile={isMobile} 
              hideExtraFilters={true}
              selectionMode="none"
              emptyTitle="Nessun utensile trovato"
              emptyDescription={`Nessun risultato corrispondente a "${manualCode.trim()}". Controlla i caratteri inseriti o prova con un altro parametro.`}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      </div>
    </PageTemplate>
    </motion.div>
  );
});

export default ScannerView;
