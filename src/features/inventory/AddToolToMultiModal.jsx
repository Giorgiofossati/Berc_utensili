import React, { useState, useMemo, useRef, useEffect, memo } from 'react';
import { Search, X, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { buildDesc } from '../../lib/toolUtils';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useMultiMovementStore } from '../../store/useMultiMovementStore';
import ToolsGrid from './ToolsGrid';

const AddToolToMultiModal = memo(({ isOpen, onClose, showToastNotification }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const tools = useInventoryStore(state => state.tools);
  const addItem = useMultiMovementStore(state => state.addItem);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 80);
    }
  }, [isOpen]);

  const filteredTools = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return tools;

    const tokens = cleanQuery.split(/\s+/).filter(Boolean);

    return tools.filter(tool => {
      const desc = buildDesc(tool).toLowerCase();
      const code = String(tool['Codice'] || '').toLowerCase();
      const tipologia = String(tool['Tipologia'] || '').toLowerCase();
      const forma = String(tool['Forma'] || '').toLowerCase();
      const diametro = String(tool['Diametro'] || '').toLowerCase();
      const fornitore = String(tool['Fornitore'] || '').toLowerCase();
      const ubicazione = String(tool['Ubicazione'] || '').toLowerCase();
      const serial = String(tool['SerialNumber'] || tool['Serial Number'] || '').toLowerCase();

      const fullText = `${desc} ${code} ${tipologia} ${forma} ${diametro} ${fornitore} ${ubicazione} ${serial}`;
      return tokens.every(token => fullText.includes(token));
    });
  }, [tools, query]);

  const handleSelectTool = (tool) => {
    addItem(tool, 1);
    if (showToastNotification) {
      showToastNotification(`${buildDesc(tool)} aggiunto alla distinta`, 'success');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="glass-panel w-[96vw] max-w-6xl xl:max-w-7xl h-[88dvh] max-h-[90dvh] overflow-hidden p-3 sm:p-5 md:p-6 rounded-[24px] sm:rounded-[32px] z-[1100] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border dark:border-white/10 border-slate-900/10 shadow-2xl flex flex-col focus:outline-none"
      >
        <DialogTitle className="sr-only">Seleziona Utensile per Movimento Multiplo</DialogTitle>

        {/* Header Modale */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[14px] bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center shrink-0 text-accent-blue shadow-inner">
              <Layers size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="app-overline text-accent-blue leading-none">Catalogo Magazzino</span>
              <h3 className="app-h2 text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-none mt-1 truncate">
                Seleziona Utensile per la Distinta
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="glass-button p-2.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra di Ricerca Ufficiale */}
        <div className="py-2.5 shrink-0">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 text-slate-400 pointer-events-none" size={18} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per descrizione, codice aziendale, diametro, fornitore, ubicazione..."
              className="glass-input w-full pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl font-medium focus:ring-2 focus:ring-accent-blue/40 border border-slate-200 dark:border-white/10"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className="app-overline text-[9px] sm:text-[10px] text-slate-400">
              {filteredTools.length} utensil{filteredTools.length === 1 ? 'e' : 'i'} trovat{filteredTools.length === 1 ? 'o' : 'i'}
            </span>
            <span className="app-body text-[10px] sm:text-xs text-accent-blue font-semibold">
              Clicca su una riga per inserire l'utensile nella distinta
            </span>
          </div>
        </div>

        {/* Tabella Utensili Ufficiale TanStack Virtualized */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <ToolsGrid
            tools={filteredTools}
            onSelectTool={handleSelectTool}
            hideExtraFilters={true}
            emptyTitle="Nessun utensile trovato"
            emptyDescription={query ? `Nessun risultato corrispondente a "${query}". Prova a modificare i termini di ricerca.` : "Nessun articolo a catalogo."}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default AddToolToMultiModal;
