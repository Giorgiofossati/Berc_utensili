import React, { useState, useMemo, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowDown, ArrowUp, Search, X, Camera } from 'lucide-react';
import { PageTemplate, PageHeader, PageToolbar, PageContent } from '@/components/layout/PageTemplate';
import BarcodeScanner from './BarcodeScanner';
import { toolMatchesQuery } from '../../lib/searchUtils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const inputRef = useRef(null);

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
        showBack={true}
        onBack={() => setView('home')}
        action={
          <div className="flex items-center p-1 rounded-2xl glass-panel border-white/5 shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setOpType(null)}
              className={`px-3 py-1 rounded-xl text-xs sm:text-xs font-bold uppercase transition-all ${
                !opType 
                  ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Dettaglio
            </button>
            <button
              type="button"
              onClick={() => setOpType('carico')}
              className={`px-3 py-1 rounded-xl text-xs sm:text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                opType === 'carico' 
                  ? 'bg-emerald-500/20 text-accent-emerald border border-emerald-500/30 shadow-xs' 
                  : 'text-slate-500 hover:text-accent-emerald'
              }`}
            >
              <ArrowDown size={14} />
              Deposita
            </button>
            <button
              type="button"
              onClick={() => setOpType('scarico')}
              className={`px-3 py-1 rounded-xl text-xs sm:text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                opType === 'scarico' 
                  ? 'bg-rose-500/20 text-accent-rose border border-rose-500/30 shadow-xs' 
                  : 'text-slate-500 hover:text-accent-rose'
              }`}
            >
              <ArrowUp size={14} />
              Preleva
            </button>
          </div>
        }
      />
      <div className="flex-1 min-h-0 flex flex-col w-full pb-24 p-2 sm:p-4 gap-4 items-center">
      {/* Search Input and Camera Bar */}
      <div className="w-full max-w-4xl relative shrink-0">
        <div className="relative flex items-center gap-2 sm:gap-4">
          <div className="relative flex-1 flex items-center">
            <Search size={20} className="absolute left-4 sm:left-6 dark:text-slate-300 text-slate-700 pointer-events-none z-10" />
            <Input
              ref={inputRef}
              autoFocus
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={
                opType === 'carico'
                  ? "Scansiona o cerca utensile da depositare..."
                  : opType === 'scarico'
                  ? "Scansiona o cerca utensile da prelevare..."
                  : "Digita codice, descrizione o misura..."
              }
              className="w-full h-auto glass-panel py-3.5 sm:py-4 pl-11 sm:pl-14 pr-10 sm:pr-14 rounded-3xl sm:rounded-3xl font-bold text-sm sm:text-lg outline-none border-accent-blue/20 focus:border-accent-blue/60 transition-all placeholder:text-slate-500 tracking-wide"
            />
            {manualCode && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setManualCode('')} 
                className="absolute right-2 sm:right-3 dark:text-slate-300 text-slate-700 hover:text-white transition-colors"
              >
                <X size={16} />
              </Button>
            )}
          </div>
          <Button 
            variant="glass"
            onClick={() => setShowCamera(prev => !prev)}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex-shrink-0 ${showCamera ? 'text-accent-orange border-accent-orange/40' : 'text-accent-blue border-accent-blue/20'}`}
          >
            <Camera size={20} className="sm:w-6 sm:h-6" />
          </Button>
        </div>
        
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
