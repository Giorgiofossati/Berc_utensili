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
  { key: 'Quantità', label: 'QTY', minWidth: '48px', align: 'center', className: 'w-12 sm:w-16 shrink-0' },
  { key: 'Ubicazione', label: 'Ubicazione', minWidth: '110px', align: 'center', className: 'hidden md:flex' },
  { key: 'Stato', label: 'Stato', minWidth: '110px', align: 'center', className: 'hidden md:flex' },
  { key: 'Fornitore', label: 'Fornitore', minWidth: '120px', align: 'center', className: 'hidden md:flex' },
  { key: 'Codice', label: 'Codice Aziendale', minWidth: '140px', align: 'center', className: 'hidden md:flex' },
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
    estimateSize: () => 56, // Approssimazione altezza riga
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
      return <span className="badge badge-blue app-caption font-bold px-2.5 py-0.5">{val}</span>;
    }

    // Generic null/empty early return (for all other fields)
    if (val === null || val === undefined || val === '') return <span className="text-slate-700 opacity-20">—</span>;

    if (detail.key === 'Stato') {
      return (
        <span className={`badge text-[10px] font-black px-2.5 py-0.5 ${val === 'Disponibile' ? 'badge-emerald' : 'badge-rose'}`}>
          {val}
        </span>
      );
    }

    if (detail.key === 'Quantità') {
      return (
        <span className={`app-qty-sm ${val > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
          {val}
        </span>
      );
    }

    if (detail.key === 'Ubicazione') {
      return <span className="badge badge-orange app-caption font-bold px-2.5 py-0.5">{val}</span>;
    }

    if (detail.key === 'SerialNumber' || detail.key === 'Serial Number') {
      return <span className="app-caption font-bold whitespace-nowrap">{val}</span>;
    }

    return <span className="app-caption font-bold whitespace-nowrap">{val}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="w-full max-w-[1600px] flex flex-col flex-1 gap-2 md:gap-4 min-h-0"
    >
      {availableFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 px-2">
          {availableFilters.map(({ key, label }) => (
            <div key={key} className="relative">
              <Select
                value={extraFilters[key] ? String(extraFilters[key]) : undefined}
                onValueChange={(val) => setFilter(key, val === 'all' ? '' : val)}
              >
                <SelectTrigger className={`glass-button rounded-[12px] md:rounded-[14px] px-3 py-1.5 md:px-4 md:py-2 app-overline bg-transparent dark:border-white/10 border-slate-900/10 focus:ring-accent-blue/40 outline-none transition-all min-w-[95px] md:min-w-[120px] ${extraFilters[key] && extraFilters[key] !== 'all' ? 'text-accent-blue border-accent-blue/30' : 'dark:text-slate-300 text-slate-700'}`}>
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
              className="glass-button rounded-[12px] md:rounded-[14px] px-3 py-1.5 md:px-4 md:py-2 app-overline text-accent-orange hover:bg-accent-orange/10 transition-all flex items-center gap-1"
            >
              <X size={12} /> Reset
            </button>
          )}
          <button
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`glass-button rounded-[12px] md:rounded-[14px] px-3 py-1.5 md:px-4 md:py-2 app-overline transition-all flex items-center gap-1.5 ${isSelectionMode ? 'text-accent-orange bg-accent-orange/10 border-accent-orange/30' : 'dark:text-slate-400 text-slate-600 opacity-60 hover:opacity-100'}`}
          >
            {isSelectionMode ? <X size={12} /> : <List size={12} />}
            {isSelectionMode ? 'Cancella' : 'Seleziona'}
          </button>
        </div>
      )}

      <div className="glass-panel rounded-[20px] md:rounded-[24px] overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-4 md:px-6 py-2.5 md:py-3 border-b dark:border-white/5 border-slate-900/10 flex items-center justify-between bg-white/[0.02]">
          <p className="app-overline text-accent-orange">
            Utensili — {sortedFiltered.length} risultat{sortedFiltered.length === 1 ? 'o' : 'i'}
          </p>
        </div>

        {/* Header Row for All Screens */}
        {sortedFiltered.length > 0 && (
          <div className="px-3 sm:px-4 md:px-6 py-2 border-b dark:border-white/5 border-slate-900/10 bg-white/[0.01] flex items-center gap-2 sm:gap-3 md:gap-4 app-overline dark:text-slate-400 text-slate-600 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {isSelectionMode && <div className="w-5 sm:w-6 flex-shrink-0" />}
              <div className="w-8 sm:w-9 md:w-10 flex-shrink-0" />
            </div>
            <div 
              className="flex-1 min-w-0 text-left cursor-pointer hover:text-accent-blue transition-colors flex items-center gap-1"
              onClick={() => handleSort('Descrizione')}
            >
              <span>Descrizione</span>
              {sortConfig.key === 'Descrizione' && (
                <span className="text-accent-blue">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            {visibleDetailKeys.map(detail => (
              <div 
                key={detail.key} 
                className={`flex-shrink-0 flex items-center justify-center cursor-pointer hover:text-accent-blue transition-colors gap-1 ${detail.className || ''}`}
                style={{ minWidth: detail.minWidth }}
                onClick={() => handleSort(detail.key)}
              >
                <span>{detail.label}</span>
                {sortConfig.key === detail.key && (
                  <span className="text-accent-blue">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            ))}
            <div className="w-6 flex-shrink-0" /> {/* Chevron spacer */}
          </div>
        )}

        <div ref={parentRef} className="overflow-y-auto custom-scrollbar overflow-x-hidden md:overflow-x-auto flex-1 min-h-0 relative w-full">
          <div className="w-full min-w-0 md:min-w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {sortedFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 dark:text-slate-400 text-slate-600 absolute w-full top-0 left-0">
                <AlertTriangle size={32} className="mb-3 text-slate-600" />
                <p className="app-overline">Nessun utensile trovato</p>
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
                    className={`flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 py-2 hover:bg-white/[0.04] cursor-pointer transition-all border-b dark:border-white/[0.03] border-slate-900/5 group ${selectedIds.includes(tool.id) ? 'bg-accent-blue/5' : ''}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      {isSelectionMode && (
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center flex-shrink-0 w-5 sm:w-6">
                          <Checkbox
                            checked={selectedIds.includes(tool.id)}
                            onCheckedChange={(checked) => onToggleSelect(tool.id)}
                            className={`w-5 h-5 rounded-md transition-all ${selectedIds.includes(tool.id) ? 'data-[state=checked]:bg-accent-blue data-[state=checked]:text-slate-950 border-accent-blue' : 'dark:border-white/30 border-slate-400'}`}
                          />
                        </div>
                      )}
                      <div onClick={() => onSelectTool(tool)} className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-blue/20 transition-colors overflow-hidden">
                        <ToolIcon type={tool['Tipologia']} size={36} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0" onClick={() => onSelectTool(tool)}>
                      <p className="app-h3 truncate">{buildDesc(tool)}</p>
                    </div>

                    {visibleDetailKeys.map(detail => (
                      <div 
                        key={detail.key} 
                        onClick={() => onSelectTool(tool)}
                        className={`flex-shrink-0 flex items-center justify-center ${detail.className || ''}`}
                        style={{ minWidth: detail.minWidth }}
                      >
                        {renderDetailValue(tool, detail)}
                      </div>
                    ))}

                    <div className="w-6 flex-shrink-0 flex items-center justify-center" onClick={() => onSelectTool(tool)}>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-accent-blue transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Spacer esplicito per scroll container */}
          <div className="h-20 md:h-10 shrink-0 w-full pointer-events-none" />
        </div>
      </div>
    </motion.div>
  );
});

export default ToolsGrid;
