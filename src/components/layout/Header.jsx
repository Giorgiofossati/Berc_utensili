import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Camera, Menu, ScanLine } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useFilterStore } from '../../store/useFilterStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import BarcodeScanner from '../../features/scanner/BarcodeScanner';

const Header = memo(({ onOpenSidebar }) => {
  const searchQuery = useFilterStore(state => state.searchQuery);
  const setSearchQuery = useFilterStore(state => state.setSearchQuery);
  const clearSearchQuery = useFilterStore(state => state.clearSearchQuery);
  const viewMode = useFilterStore(state => state.viewMode);
  const setViewMode = useFilterStore(state => state.setViewMode);
  
  const currentView = useNavigationStore(state => state.currentView);
  const setCurrentView = useNavigationStore(state => state.setCurrentView);

  const resetFilters = useFilterStore(state => state.resetFilters);

  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);

  // Commuta alla vista a elenco e alla schermata home quando si interagisce con la barra di ricerca
  const handleActivateSearch = useCallback(() => {
    if (currentView !== 'home') {
      setCurrentView('home');
    }
    if (viewMode === 'grid') {
      resetFilters();
      setViewMode('dropdown');
    }
  }, [currentView, setCurrentView, viewMode, setViewMode, resetFilters]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    handleActivateSearch();
  };

  const handleInputFocus = () => {
    handleActivateSearch();
  };

  const handleScanBarcode = useCallback((decodedText) => {
    setSearchQuery(decodedText);
    setShowCamera(false);
    handleActivateSearch();
  }, [setSearchQuery, handleActivateSearch]);

  // Scorciatoia globale da tastiera: ⌘K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        handleActivateSearch();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleActivateSearch]);

  return (
    <div className="flex flex-col w-full z-50">
      <header className="flex items-center justify-between gap-2 md:gap-4 py-1.5 px-2 md:px-4 bg-transparent border-0 shadow-none w-full">
        {/* Mobile Menu Button (Sinistra su schermi piccoli) */}
        <div className="md:hidden flex items-center shrink-0">
          <Button 
            variant="glass" 
            size="icon" 
            onClick={onOpenSidebar} 
            className="w-10 h-10 rounded-[14px] bg-white/60 dark:bg-slate-900/60 shadow-sm border-slate-200/50 dark:border-white/10 text-accent-blue hover:text-accent-cyan"
            aria-label="Apri Menu"
          >
            <Menu size={20} />
          </Button>
        </div>

        {/* Barra di Ricerca Globale Integrata */}
        <div 
          data-tour="search-tools"
          className="flex-1 max-w-2xl md:mx-auto relative flex items-center min-w-0"
        >
          <div className="relative flex items-center w-full glass-panel rounded-[16px] md:rounded-[20px] bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-white/10 shadow-sm focus-within:border-accent-blue/60 focus-within:ring-2 focus-within:ring-accent-blue/20 transition-all px-3 sm:px-4 py-1.5 md:py-2">
            <Search size={17} className="text-slate-400 dark:text-slate-500 mr-2.5 shrink-0 pointer-events-none" />
            
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Cerca codice, misura (es. D16), tipo..."
              className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 tracking-wide min-w-0"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={clearSearchQuery}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0 mr-1.5"
                title="Cancella ricerca"
              >
                <X size={15} />
              </button>
            )}

            {/* Pulsante Fotocamera Scanner Barcode */}
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-accent-blue hover:text-accent-cyan transition-colors shrink-0 mr-1"
              title="Scansiona Barcode con Fotocamera"
              aria-label="Scanner Fotocamera"
            >
              <Camera size={16} />
            </button>

            {/* Badge Scorciatoia da tastiera ⌘K */}
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-1.5 font-mono text-[10px] font-bold text-slate-400 shadow-sm shrink-0">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Modale Scanner Fotocamera */}
        <Dialog open={showCamera} onOpenChange={setShowCamera}>
          <DialogContent 
            showCloseButton={false}
            className="sm:max-w-md w-[94vw] max-w-[460px] glass-panel border border-slate-200/80 dark:border-white/10 dark:bg-slate-950/95 bg-white/95 backdrop-blur-2xl rounded-[28px] p-5 sm:p-6 shadow-2xl flex flex-col gap-4"
          >
            {/* Header del Modale: Icona, Titolo, Badge Live e Tasto Chiudi perfettamente allineati */}
            <div className="flex items-center justify-between gap-3 w-full pb-3 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                {/* Icona Mirino Barcode */}
                <div className="w-10 h-10 rounded-[14px] bg-accent-blue/10 border border-accent-blue/25 flex items-center justify-center text-accent-blue shrink-0 shadow-sm">
                  <ScanLine size={20} />
                </div>
                
                {/* Titolo e Sottotitolo */}
                <div className="flex flex-col min-w-0 justify-center">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">
                      Scanner Barcode
                    </DialogTitle>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider leading-none shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal mt-1">
                    Inquadra il codice a barre o QR code dell'utensile
                  </p>
                </div>
              </div>

              {/* Pulsante Chiudi Integrato nell'Header */}
              <button
                type="button"
                onClick={() => setShowCamera(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors shrink-0"
                title="Chiudi scanner"
                aria-label="Chiudi"
              >
                <X size={18} />
              </button>
            </div>

            {/* Finestra Mirino Fotocamera */}
            <div className="w-full aspect-[4/3] max-h-[300px] sm:max-h-[330px] rounded-[18px] overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl relative bg-black">
              {showCamera && <BarcodeScanner onScan={handleScanBarcode} />}
            </div>

            {/* Footer Formati & Pulsante Chiudi */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-white/5">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Code 128 · Code 39 · EAN · QR
              </span>
              <button
                type="button"
                onClick={() => setShowCamera(false)}
                className="glass-button px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Chiudi
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </header>
    </div>
  );
});

export default Header;
