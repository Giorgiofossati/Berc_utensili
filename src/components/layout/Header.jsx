import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Camera, Menu, ScanLine } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { useFilterStore } from '../../store/useFilterStore';
import BarcodeScanner from '../../features/scanner/BarcodeScanner';

import { useNavigationStore } from '../../store/useNavigationStore';

const Header = memo(({ onOpenSidebar }) => {
  const searchQuery = useFilterStore(state => state.searchQuery);
  const setSearchQuery = useFilterStore(state => state.setSearchQuery);
  const clearSearchQuery = useFilterStore(state => state.clearSearchQuery);
  
  const currentView = useNavigationStore(state => state.currentView);
  const setCurrentView = useNavigationStore(state => state.setCurrentView);
  const viewMode = useFilterStore(state => state.viewMode);
  const setViewMode = useFilterStore(state => state.setViewMode);

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Sync from external changes (e.g. clearSearchQuery)
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    
    // Instant switch to list view on first character
    const hadQuery = localQuery.trim().length > 0;
    const hasQuery = val.trim().length > 0;
    if (!hadQuery && hasQuery) {
      if (currentView !== 'home') setCurrentView('home');
      if (viewMode === 'grid') setViewMode('dropdown');
    }

    setLocalQuery(val);
    
    // Debounce the global state update
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchQuery(val);
    }, 250);
  };

  const handleClear = () => {
    setLocalQuery('');
    clearSearchQuery();
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleInputFocus = () => {
    // No side-effects on focus
  };

  const handleScanBarcode = useCallback((decodedText) => {
    setLocalQuery(decodedText);
    setSearchQuery(decodedText);
    setShowCamera(false);
  }, [setSearchQuery]);

  // Scorciatoia globale da tastiera: ⌘K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col w-full z-50 shrink-0">
      <header className="flex items-center justify-between gap-2 md:gap-4 py-1.5 px-2 md:px-4 bg-transparent border-0 shadow-none w-full">
        {/* Mobile Menu Button (Sinistra su schermi piccoli) */}
        <div className="md:hidden flex items-center shrink-0">
          <Button 
            variant="glass" 
            size="icon" 
            onClick={onOpenSidebar} 
            className="w-10 h-10 rounded-xl bg-white/60 dark:bg-slate-900/60 shadow-sm border-slate-200/50 dark:border-white/10 text-accent-blue hover:text-accent-cyan"
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
          <div className="relative flex items-center w-full glass-panel rounded-2xl md:rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-white/10 shadow-sm focus-within:border-orange-500/60 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all px-3 sm:px-4 py-1.5 md:py-2">
            <Search size={16} className="text-slate-400 dark:text-slate-500 mr-2.5 shrink-0 pointer-events-none" />
            
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Cerca codice, misura (es. D16), tipo..."
              className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 tracking-wide min-w-0"
            />

            {localQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0 mr-1 cursor-pointer"
                title="Cancella ricerca"
                aria-label="Cancella ricerca"
              >
                <X size={16} />
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
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-1.5 font-mono text-xs font-bold text-slate-400 shadow-sm shrink-0">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Modale Scanner Fotocamera */}
        <Dialog open={showCamera} onOpenChange={setShowCamera}>
          <DialogContent size="md" className="p-0 gap-0 overflow-hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border dark:border-white/10 border-slate-900/10 shadow-2xl focus:outline-none">
            <ModalHeader 
              icon={<ScanLine size={24} className="text-accent-blue" />}
              title="Scanner Barcode"
              subtitle="Inquadra il codice a barre o QR code dell'utensile"
              badge={
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider leading-none shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              }
              className="bg-accent-blue/5"
            />

            <ModalBody className="flex flex-col gap-4">
              {/* Finestra Mirino Fotocamera */}
              <div className="w-full aspect-[4/3] max-h-[300px] sm:max-h-[330px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl relative bg-black">
                {showCamera && <BarcodeScanner onScan={handleScanBarcode} />}
              </div>
            </ModalBody>

            <ModalFooter className="justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 self-center">
                Code 128 · Code 39 · EAN · QR
              </span>
              <button
                type="button"
                onClick={() => setShowCamera(false)}
                className="glass-button px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Chiudi
              </button>
            </ModalFooter>
          </DialogContent>
        </Dialog>
      </header>
    </div>
  );
});

export default Header;
