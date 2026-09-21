import React, { useState, useMemo, useRef, useEffect, memo } from 'react';
import { Search, X, Layers } from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody } from "@/components/ui/dialog";
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <DialogContent size="xl" showCloseButton={false}>
        <ModalHeader
          icon={<Layers />}
          overline="Catalogo Magazzino"
          title="Seleziona Utensile per la Distinta"
        />
        <ModalBody className="flex-1 overflow-hidden flex flex-col p-0 sm:p-0">
<div className="py-2.5 shrink-0">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 text-slate-400 pointer-events-none" size={20} />
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
            <span className="app-overline text-xs sm:text-xs text-slate-400">
              {filteredTools.length} utensil{filteredTools.length === 1 ? 'e' : 'i'} trovat{filteredTools.length === 1 ? 'o' : 'i'}
            </span>
            <span className="app-body text-xs sm:text-xs text-accent-blue font-semibold">
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
            selectionMode="pick"
            emptyTitle="Nessun utensile trovato"
            emptyDescription={query ? `Nessun risultato corrispondente a "${query}". Prova a modificare i termini di ricerca.` : "Nessun articolo a catalogo."}
          />
        </div>
        </ModalBody>
      </DialogContent>
    </Dialog>
  );
});

export default AddToolToMultiModal;
