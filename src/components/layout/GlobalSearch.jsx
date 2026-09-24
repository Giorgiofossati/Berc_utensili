import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Camera, ScanLine } from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { useFilterStore } from '../../store/useFilterStore';
import BarcodeScanner from '../../features/scanner/BarcodeScanner';
import { cn } from '@/lib/utils';

/**
 * Casella di ricerca dell'AppBar (§2.1) — identica in ogni vista, cambia solo cosa cerca.
 * Larghezza minima 50px: sotto quella soglia resta visibile solo la lente, e a cedere spazio
 * è il percorso. `×`, fotocamera e ⌘K compaiono solo quando la casella ha spazio (@container).
 */
export const SearchField = memo(({
  value,
  onChange,
  onClear,
  placeholder = 'Cerca…',
  label = 'Cerca',
  onCamera,
  cameraActive = false,
  autoFocus = false,
  onActiveChange,
  className,
}) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const isActive = isFocused || value.length > 0;
  useEffect(() => {
    onActiveChange?.(isActive);
  }, [isActive, onActiveChange]);

  // ⌘K / Ctrl+K porta il focus nella ricerca della vista corrente, Esc la lascia
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
    <div
      data-tour="search-tools"
      className={cn(
        "@container flex-1 basis-0 min-w-[50px] h-11 flex items-center rounded-[var(--radius-control,12px)] border border-slate-900/10 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 shadow-sm focus-within:border-accent-blue/60 focus-within:ring-2 focus-within:ring-accent-blue/20 transition-[border-color,box-shadow] duration-[var(--motion-fast,150ms)]",
        className
      )}
    >
      <label className="flex items-center flex-1 h-full min-w-0 cursor-text">
        <Search size={16} className="shrink-0 mx-[16px] text-slate-400 dark:text-slate-500 pointer-events-none" />
        <span className="sr-only">{label}</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 w-0 min-w-0 h-full bg-transparent border-0 outline-none text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium"
        />
      </label>

      {value && (
        <button
          type="button"
          onClick={() => { (onClear ?? (() => onChange('')))(); inputRef.current?.focus(); }}
          className="hidden @min-[150px]:flex w-11 h-11 rounded-xl items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-accent-blue/[0.06] transition-colors shrink-0"
          aria-label="Cancella ricerca"
        >
          <X size={16} />
        </button>
      )}

      {onCamera && (
        <button
          type="button"
          onClick={onCamera}
          aria-pressed={cameraActive}
          className={cn(
            "hidden @min-[100px]:flex w-11 h-11 rounded-xl items-center justify-center transition-colors shrink-0 hover:bg-accent-blue/[0.06]",
            cameraActive ? "text-accent-orange" : "text-accent-blue hover:text-accent-cyan"
          )}
          aria-label="Scansiona barcode con la fotocamera"
        >
          <Camera size={16} />
        </button>
      )}

      <kbd className="hidden @min-[260px]:inline-flex h-5 mr-3 select-none items-center gap-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-1.5 font-mono text-xs font-bold text-slate-400 shrink-0">
        <span>⌘</span>K
      </kbd>
    </div>
  );
});
SearchField.displayName = 'SearchField';

/**
 * Ricerca utensili dell'Inventario: filtra il catalogo dentro il percorso corrente.
 * Stato nel filter store (debounce 250ms); la prima lettera in vista griglia passa alla vista elenco.
 */
const GlobalSearch = memo(({ placeholder = 'Cerca codice, misura (es. D16)…', onActiveChange }) => {
  const searchQuery = useFilterStore(state => state.searchQuery);
  const setSearchQuery = useFilterStore(state => state.setSearchQuery);
  const clearSearchQuery = useFilterStore(state => state.clearSearchQuery);
  const viewMode = useFilterStore(state => state.viewMode);
  const setViewMode = useFilterStore(state => state.setViewMode);

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showCamera, setShowCamera] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleChange = (val) => {
    setLocalQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    const startsQuery = localQuery.trim().length === 0 && val.trim().length > 0;
    if (startsQuery && viewMode === 'grid') {
      setSearchQuery(val);
      setViewMode('dropdown');
      return;
    }
    timerRef.current = setTimeout(() => setSearchQuery(val), 250);
  };

  const handleClear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLocalQuery('');
    clearSearchQuery();
  };

  const handleScanBarcode = useCallback((decodedText) => {
    setLocalQuery(decodedText);
    setSearchQuery(decodedText);
    if (viewMode === 'grid') setViewMode('dropdown');
    setShowCamera(false);
  }, [setSearchQuery, viewMode, setViewMode]);

  return (
    <>
      <SearchField
        value={localQuery}
        onChange={handleChange}
        onClear={handleClear}
        placeholder={placeholder}
        label="Cerca utensili"
        onCamera={() => setShowCamera(true)}
        onActiveChange={onActiveChange}
      />

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
            <div className="w-full aspect-[4/3] max-h-[300px] sm:max-h-[330px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl relative bg-black">
              {showCamera && <BarcodeScanner onScan={handleScanBarcode} />}
            </div>
          </ModalBody>
          <ModalFooter className="justify-between">
            <span className="app-caption uppercase text-slate-400 dark:text-slate-500 self-center">
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
    </>
  );
});

GlobalSearch.displayName = 'GlobalSearch';

export default GlobalSearch;
