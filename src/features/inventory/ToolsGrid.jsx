import React, { useState, useMemo, useCallback, memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { ChevronDown, X, CheckCircle2, List, Activity, AlertTriangle, ChevronRight } from 'lucide-react';
import { ToolIcon, buildDesc } from '../../lib/toolUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilterStore } from '../../store/useFilterStore';

export const EXTRA_FILTER_KEYS = [
  { key: 'Lunghezza', label: 'Lunghezza' },
  { key: 'Materiale', label: 'Materiale' },
  { key: 'Tolleranza', label: 'Tolleranza' },
  { key: 'Passo', label: 'Passo' },
  { key: 'Angolo', label: 'Angolo' },
  { key: 'Rivestimento', label: 'Rivestimento' },
  { key: 'Stato', label: 'Stato' },
  { key: 'Fornitore', label: 'Fornitore' },
  { key: 'Lavorazione', label: 'Lavorazione' },
  { key: 'Sistema di misura', label: 'Sistema Misura' },
  { key: 'Ubicazione', label: 'Ubicazione' },
];

const ALL_DETAIL_KEYS = [
  { key: 'Quantità', label: 'Quantità', minWidth: '95px', align: 'center' },
  { key: 'Ubicazione', label: 'Ubicazione', minWidth: '130px', align: 'center', className: 'hidden md:flex' },
  { key: 'Stato', label: 'Stato', minWidth: '120px', align: 'center', className: 'hidden md:flex' },
  { key: 'Fornitore', label: 'Fornitore', minWidth: '130px', align: 'center', className: 'hidden md:flex' },
  { key: 'Codice', label: 'Codice Aziendale', minWidth: '180px', align: 'center', className: 'hidden md:flex' },
];

const ToolsGrid = memo(({ tools: toolsList, onSelectTool, isMobile }) => {
  const selectedIds = useFilterStore(state => state.selectedToolsIds);
  const onToggleSelect = useFilterStore(state => state.toggleToolSelection);
  const isSelectionMode = useFilterStore(state => state.isSelectionMode);
  const setIsSelectionMode = useFilterStore(state => state.handleSetIsSelectionMode);
  
  const [extraFilters, setExtraFilters] = useState({});

  const availableFilters = useMemo(() => {
    return EXTRA_FILTER_KEYS.filter(({ key }) =>
      toolsList.some(t => t[key] !== null && t[key] !== undefined && t[key] !== '')
    );
  }, [toolsList]);

  const filterOptions = useMemo(() => {
    const result = {};
    availableFilters.forEach(({ key }) => {
      const vals = [...new Set(toolsList.map(t => t[key]).filter(v => v !== null && v !== undefined && v !== ''))];
      vals.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
      result[key] = vals;
    });
    return result;
  }, [toolsList, availableFilters]);

  const filtered = useMemo(() => {
    let result = toolsList;
    Object.entries(extraFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(t => String(t[key]) === String(value));
      }
    });
    return result;
  }, [toolsList, extraFilters]);

  const visibleDetailKeys = useMemo(() => {
    // Only essential columns to avoid horizontal scroll and ensure Codice is visible
    return ALL_DETAIL_KEYS.filter(d => ['Quantità', 'Ubicazione', 'Stato', 'Codice'].includes(d.key));
  }, []);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      key = null;
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedFiltered = useMemo(() => {
    let result = filtered;
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aVal = sortConfig.key === 'Descrizione' ? buildDesc(a) : a[sortConfig.key];
        let bVal = sortConfig.key === 'Descrizione' ? buildDesc(b) : b[sortConfig.key];
        
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        if (sortConfig.key === 'Quantità') {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        } else {
          aVal = String(aVal).toLowerCase();
          bVal = String(bVal).toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [filtered, sortConfig]);

  const setFilter = useCallback((key, value) => {
    setExtraFilters(prev => ({ ...prev, [key]: value || '' }));
  }, []);

  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: sortedFiltered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Approssimazione altezza riga
    overscan: 5,
  });



  const renderDetailValue = (tool, detail) => {
    let val = tool[detail.key];
    if (val === null || val === undefined || val === '') {
      const lowerKey = detail.key.toLowerCase();
      val = tool[lowerKey];
    }

    // Handle Codice BEFORE the generic null check — show actual code or dash
    if (detail.key === 'Codice') {
      if (!val) return <span className="text-slate-700 opacity-20">—</span>;
      return <span className="badge badge-blue text-xs font-mono font-bold px-3.5 py-1">{val}</span>;
    }

    // Generic null/empty early return (for all other fields)
    if (val === null || val === undefined || val === '') return <span className="text-slate-700 opacity-20">—</span>;

    if (detail.key === 'Stato') {
      return (
        <span className={`badge text-xs font-black px-3.5 py-1 ${val === 'Disponibile' ? 'badge-emerald' : 'badge-rose'}`}>
          {val}
        </span>
      );
    }

    if (detail.key === 'Quantità') {
      return (
        <span className={`font-black text-base md:text-lg tabular-nums ${val > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
          {val}
        </span>
      );
    }

    if (detail.key === 'Ubicazione') {
      return <span className="badge badge-orange text-xs font-mono font-bold px-3.5 py-1">{val}</span>;
    }

    if (detail.key === 'SerialNumber' || detail.key === 'Serial Number') {
      return <span className="text-xs md:text-sm font-extrabold dark:text-slate-200 text-slate-800 font-mono whitespace-nowrap">{val}</span>;
    }

    return <span className="text-xs md:text-sm font-extrabold dark:text-slate-300 text-slate-700 whitespace-nowrap">{val}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="w-full max-w-[1600px] flex flex-col flex-1 gap-2 md:gap-4 min-h-0"
    >
      {availableFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {availableFilters.map(({ key, label }) => (
            <div key={key} className="relative">
              <Select
                value={extraFilters[key] ? String(extraFilters[key]) : undefined}
                onValueChange={(val) => setFilter(key, val === 'all' ? '' : val)}
              >
                <SelectTrigger className={`glass-button rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider bg-transparent dark:border-white/10 border-slate-900/10 focus:ring-accent-blue/40 outline-none transition-all min-w-[120px] ${extraFilters[key] && extraFilters[key] !== 'all' ? 'text-accent-blue border-accent-blue/30' : 'dark:text-slate-300 text-slate-700'}`}>
                  <SelectValue placeholder={label} />
                </SelectTrigger>
                <SelectContent className="glass-panel z-[2000] border-white/10 dark:bg-slate-950/90 bg-white/90 backdrop-blur-xl">
                  <SelectItem value="all" className="cursor-pointer font-bold opacity-60">Tutti</SelectItem>
                  {(filterOptions[key] || []).map(val => (
                    <SelectItem key={val} value={String(val)} className="cursor-pointer font-bold">{val}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {Object.values(extraFilters).some(v => v) && (
            <button
              onClick={() => setExtraFilters({})}
              className="glass-button rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-accent-orange hover:bg-accent-orange/10 transition-all flex items-center gap-1"
            >
              <X size={12} /> Reset
            </button>
          )}
          <button
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`glass-button rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isSelectionMode ? 'text-accent-orange bg-accent-orange/10 border-accent-orange/30' : 'dark:text-slate-400 text-slate-600 opacity-60 hover:opacity-100'}`}
          >
            {isSelectionMode ? <X size={12} /> : <List size={12} />}
            {isSelectionMode ? 'Cancella Selezione' : 'Seleziona'}
          </button>
        </div>
      )}

      <div className="glass-panel rounded-[20px] md:rounded-[24px] overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-6 py-4 border-b dark:border-white/5 border-slate-900/10 flex items-center justify-between bg-white/[0.02]">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-orange">
            Utensili — {sortedFiltered.length} risultat{sortedFiltered.length === 1 ? 'o' : 'i'}
          </p>
        </div>

        {/* Header Row for All Screens */}
        {sortedFiltered.length > 0 && (
          <div className="px-6 py-3 border-b dark:border-white/5 border-slate-900/10 bg-white/[0.01] flex items-center gap-4 text-xs font-black uppercase tracking-wider dark:text-slate-400 text-slate-600">
            <div className="flex items-center gap-3 flex-shrink-0">
              {isSelectionMode && <div className="w-6 flex-shrink-0" />}
              <div className="w-10 flex-shrink-0" />
            </div>
            <div 
              className="flex-1 min-w-[150px] text-center cursor-pointer hover:text-accent-blue transition-colors flex items-center justify-center gap-1"
              onClick={() => handleSort('Descrizione')}
            >
              Descrizione
              {sortConfig.key === 'Descrizione' && (
                <span className="text-accent-blue">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            {visibleDetailKeys.map(detail => (
              <div 
                key={detail.key} 
                className={`flex-shrink-0 flex items-center justify-center cursor-pointer hover:text-accent-blue transition-colors gap-1 ${detail.className || ''}`}
                style={{ width: detail.minWidth }}
                onClick={() => handleSort(detail.key)}
              >
                {detail.label}
                {sortConfig.key === detail.key && (
                  <span className="text-accent-blue">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            ))}
            <div className="w-8 flex-shrink-0" /> {/* Chevron spacer */}
          </div>
        )}

        <div ref={parentRef} className={`overflow-y-auto custom-scrollbar overflow-x-auto flex-1 min-h-0 relative`}>
          <div className="min-w-max md:min-w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {sortedFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 dark:text-slate-400 text-slate-600 absolute w-full top-0 left-0">
                <AlertTriangle size={32} className="mb-4 text-slate-700" />
                <p className="font-bold text-sm uppercase tracking-widest">Nessun utensile trovato</p>
              </div>
            ) : (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const tool = sortedFiltered[virtualRow.index];
                return (
                  <div
                    key={tool.id || virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`
                    }}
                    className={`flex items-center gap-4 px-6 py-2.5 md:py-2 hover:bg-white/[0.04] cursor-pointer transition-all border-b dark:border-white/[0.03] border-slate-900/5 group ${selectedIds.includes(tool.id) ? 'bg-accent-blue/5' : ''}`}
                  >
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isSelectionMode && (
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center flex-shrink-0 w-6">
                          <Checkbox
                            checked={selectedIds.includes(tool.id)}
                            onCheckedChange={(checked) => onToggleSelect(tool.id)}
                            className={`w-6 h-6 rounded-md transition-all ${selectedIds.includes(tool.id) ? 'data-[state=checked]:bg-accent-blue data-[state=checked]:text-slate-950 border-accent-blue' : 'dark:border-white/30 border-slate-400'}`}
                          />
                        </div>
                      )}
                      <div onClick={() => onSelectTool(tool)} className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-blue/20 transition-colors overflow-hidden">
                        <ToolIcon type={tool['Tipologia']} size={40} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-[150px] text-center" onClick={() => onSelectTool(tool)}>
                      <p className="font-extrabold text-sm md:text-base dark:text-white text-slate-900 truncate">{buildDesc(tool)}</p>
                    </div>

                    {visibleDetailKeys.map(detail => (
                      <div 
                        key={detail.key} 
                        onClick={() => onSelectTool(tool)}
                        className={`flex-shrink-0 flex items-center justify-center ${detail.className || ''}`}
                        style={{ width: detail.minWidth }}
                      >
                        {renderDetailValue(tool, detail)}
                      </div>
                    ))}

                    <div className="w-8 flex-shrink-0 flex items-center justify-center" onClick={() => onSelectTool(tool)}>
                      <ChevronRight size={14} className="text-slate-700 group-hover:text-accent-blue transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Spacer esplicito per risolvere il bug di iOS/Safari col padding-bottom nei contenitori scrollabili */}
          <div className="h-24 md:h-12 shrink-0 w-full pointer-events-none" />
        </div>
      </div>
    </motion.div>
  );
});

export default ToolsGrid;
