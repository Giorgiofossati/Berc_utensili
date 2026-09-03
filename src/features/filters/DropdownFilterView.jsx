import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, X, CheckCircle2, List, LayoutGrid, Activity, Filter, ChevronRight } from 'lucide-react';
import { ToolIcon, buildDesc } from '../../lib/toolUtils';
import { EXTRA_FILTER_KEYS } from '../inventory/ToolsGrid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilterStore } from '../../store/useFilterStore';

const ALL_DETAIL_KEYS = [
  { key: 'Quantità', label: 'QTY', minWidth: '48px', align: 'center', className: 'w-12 sm:w-16 shrink-0' },
  { key: 'Ubicazione', label: 'Ubicazione', minWidth: '110px', align: 'center', className: 'hidden md:flex' },
  { key: 'Stato', label: 'Stato', minWidth: '110px', align: 'center', className: 'hidden md:flex' },
  { key: 'Fornitore', label: 'Fornitore', minWidth: '120px', align: 'center', className: 'hidden md:flex' },
  { key: 'Codice', label: 'Codice Aziendale', minWidth: '140px', align: 'center', className: 'hidden md:flex' },
];

const DropdownFilterView = memo(({ tools: allTools, onSelectTool, isMobile, initialFilters = {}, onFilterChange, viewMode, setViewMode }) => {
  const selectedIds = useFilterStore(state => state.selectedToolsIds);
  const onToggleSelect = useFilterStore(state => state.toggleToolSelection);
  const isSelectionMode = useFilterStore(state => state.isSelectionMode);
  const setIsSelectionMode = useFilterStore(state => state.handleSetIsSelectionMode);
  const [filters, setFilters] = useState(initialFilters);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(!isMobile);

  // Synchronize internal filters state with changes to the parent's initialFilters prop
  const serializedInitialFilters = JSON.stringify(initialFilters);
  useEffect(() => {
    setFilters(JSON.parse(serializedInitialFilters));
  }, [serializedInitialFilters]);

  // Keep a ref of the callback to prevent unnecessary execution of the effect on inline function changes
  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  useEffect(() => {
    if (onFilterChangeRef.current) {
      onFilterChangeRef.current(filters);
    }
  }, [filters]);

  const activeFiltersCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]); // Test comment

  const filterKeys = useMemo(() => {
    const keys = ['Tipologia', 'Forma', 'Diametro', ...EXTRA_FILTER_KEYS.map(e => e.key)];
    return keys.filter(key =>
      allTools.some(t => t[key] !== null && t[key] !== undefined && t[key] !== '')
    );
  }, [allTools]);

  const filterOptions = useMemo(() => {
    const result = {};
    filterKeys.forEach(key => {
      let available = allTools;
      
      const applied = {};
      if (key === 'Tipologia') {
        // Level 1: no filtering
      } else if (key === 'Forma') {
        // Level 2: filtered only by Tipologia
        if (filters['Tipologia']) applied['Tipologia'] = filters['Tipologia'];
      } else if (key === 'Diametro') {
        // Level 3: filtered by Tipologia and Forma
        if (filters['Tipologia']) applied['Tipologia'] = filters['Tipologia'];
        if (filters['Forma']) applied['Forma'] = filters['Forma'];
      } else {
        // Level 4: filtered by Tipologia, Forma, Diametro, and other Level 4 filters (except itself)
        Object.entries(filters).forEach(([fk, fv]) => {
          if (fk !== key && fv) {
            applied[fk] = fv;
          }
        });
      }

      Object.entries(applied).forEach(([fk, fv]) => {
        available = available.filter(t => String(t[fk]) === String(fv));
      });

      const vals = [...new Set(available.map(t => t[key]).filter(v => v !== null && v !== undefined && v !== ''))];
      vals.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
      result[key] = vals;
    });
    return result;
  }, [allTools, filters, filterKeys]);

  const filtered = useMemo(() => {
    let result = allTools;
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(t => String(t[key]) === String(value));
      }
    });
    return result;
  }, [allTools, filters]);

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

  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: sortedFiltered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  const visibleDetailKeys = useMemo(() => {
    return ALL_DETAIL_KEYS;
  }, []);

  const cleanFilters = useCallback((newFilters, toolsList) => {
    const cleaned = { ...newFilters };
    
    const getOptionsForKey = (key, currentFilters) => {
      let available = toolsList;
      
      const applied = {};
      if (key === 'Tipologia') {
        // Level 1: no filtering
      } else if (key === 'Forma') {
        // Level 2: filtered only by Tipologia
        if (currentFilters['Tipologia']) applied['Tipologia'] = currentFilters['Tipologia'];
      } else if (key === 'Diametro') {
        // Level 3: filtered by Tipologia and Forma
        if (currentFilters['Tipologia']) applied['Tipologia'] = currentFilters['Tipologia'];
        if (currentFilters['Forma']) applied['Forma'] = currentFilters['Forma'];
      } else {
        // Level 4: filtered by Tipologia, Forma, Diametro, and other Level 4 filters
        Object.entries(currentFilters).forEach(([fk, fv]) => {
          if (fk !== key && fv) {
            applied[fk] = fv;
          }
        });
      }

      Object.entries(applied).forEach(([fk, fv]) => {
        available = available.filter(t => String(t[fk]) === String(fv));
      });
      
      return [...new Set(available.map(t => t[key]).filter(v => v !== null && v !== undefined && v !== ''))].map(String);
    };

    // Validate and clean selected filters sequentially
    if (cleaned['Forma']) {
      const opts = getOptionsForKey('Forma', cleaned);
      if (!opts.includes(String(cleaned['Forma']))) {
        cleaned['Forma'] = '';
      }
    }
    
    if (cleaned['Diametro']) {
      const opts = getOptionsForKey('Diametro', cleaned);
      if (!opts.includes(String(cleaned['Diametro']))) {
        cleaned['Diametro'] = '';
      }
    }

    Object.keys(cleaned).forEach(k => {
      if (k !== 'Tipologia' && k !== 'Forma' && k !== 'Diametro' && cleaned[k]) {
        const opts = getOptionsForKey(k, cleaned);
        if (!opts.includes(String(cleaned[k]))) {
          cleaned[k] = '';
        }
      }
    });

    return cleaned;
  }, []);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value || '' };
      return cleanFilters(next, allTools);
    });
  }, [allTools, cleanFilters]);

  const LABELS = {
    'Tipologia': 'Tipologia',
    'Forma': 'Forma',
    'Diametro': 'Diametro',
    ...Object.fromEntries(EXTRA_FILTER_KEYS.map(e => [e.key, e.label]))
  };

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

    if (detail.key === 'SerialNumber') {
      return <span className="app-caption font-bold whitespace-nowrap">{val}</span>;
    }

    return <span className="app-caption font-bold whitespace-nowrap">{val}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl flex flex-col gap-3 md:gap-4 flex-1 min-h-0"
    >
      <div className="flex items-center justify-between gap-2 px-2 md:hidden">
        <button 
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="flex-1 flex items-center justify-center gap-1.5 glass-button px-2 py-1.5 rounded-xl app-overline text-accent-blue"
        >
          <Filter size={14} className="shrink-0" />
          <span className="truncate">{isFiltersExpanded ? 'Nascondi' : 'Mostra'}</span>
          {activeFiltersCount > 0 && <span className="bg-accent-blue text-slate-950 w-4 h-4 rounded-full flex items-center justify-center text-[8px] shrink-0 font-black">{activeFiltersCount}</span>}
        </button>
        
        {setViewMode && (
          <div className="shrink-0 flex items-center bg-slate-900/5 dark:bg-white/5 p-1 rounded-2xl relative shadow-inner border border-slate-900/5 dark:border-white/5">
            <motion.div 
              className="absolute top-1 bottom-1 w-[32px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-accent-blue/30 dark:border-accent-blue/30 overflow-hidden"
              initial={false}
              animate={{ x: viewMode === 'grid' ? 32 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="absolute inset-0 bg-accent-blue/10 animate-pulse" />
            </motion.div>
            <button 
              type="button" 
              onClick={() => setViewMode('dropdown')} 
              className={`relative z-10 w-8 h-7 flex items-center justify-center transition-colors ${viewMode === 'dropdown' ? 'text-accent-blue drop-shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <List size={15} />
            </button>
            <button 
              type="button" 
              onClick={() => setViewMode('grid')} 
              className={`relative z-10 w-8 h-7 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'text-accent-blue drop-shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        )}

        <button
          onClick={() => setIsSelectionMode(!isSelectionMode)}
          className={`flex-1 glass-button rounded-xl px-2 py-1.5 app-overline transition-all flex items-center justify-center gap-1.5 ${isSelectionMode ? 'text-accent-orange bg-accent-orange/10 border-accent-orange/30' : 'dark:text-slate-400 text-slate-600'}`}
        >
          {isSelectionMode ? <X size={14} className="shrink-0" /> : <CheckCircle2 size={14} className="shrink-0" />}
          <span className="truncate">{isSelectionMode ? 'Cancella' : 'Seleziona'}</span>
        </button>
      </div>

      <AnimatePresence>
        {(isFiltersExpanded || !isMobile) && (
          <motion.div 
            initial={isMobile ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={isMobile ? { height: 0, opacity: 0 } : false}
            className="overflow-hidden shrink-0"
          >
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 px-2 pb-2">
              <AnimatePresence mode="popLayout">
                {filterKeys.map(key => {
                  const isVisible = !!filters[key] || (filterOptions[key] && filterOptions[key].length > 0);
                  if (!isVisible) return null;
                  return (
                    <motion.div
                      layout
                      key={key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="relative flex-1 min-w-[130px] md:min-w-[140px] md:max-w-[200px]"
                    >
                      <Select
                        value={filters[key] ? String(filters[key]) : undefined}
                        onValueChange={(val) => setFilter(key, val === 'all' ? '' : val)}
                      >
                        <SelectTrigger className={`glass-button rounded-[12px] md:rounded-[14px] px-3 py-1.5 md:px-4 md:py-2 app-overline bg-transparent dark:border-white/10 border-slate-900/10 focus:ring-accent-blue/40 outline-none transition-all w-full ${filters[key] ? 'text-accent-blue border-accent-blue/30' : 'dark:text-slate-300 text-slate-700'}`}>
                          <span className="truncate"><SelectValue placeholder={LABELS[key] || key} /></span>
                        </SelectTrigger>
                        <SelectContent className="glass-panel z-[2000] border-white/10 dark:bg-slate-950/90 bg-white/90 backdrop-blur-xl">
                          <SelectItem value="all" className="cursor-pointer font-bold opacity-60 italic">{LABELS[key] || key} (Tutti)</SelectItem>
                          {(filterOptions[key] || []).map(val => (
                            <SelectItem key={val} value={String(val)} className="cursor-pointer font-bold">
                              {key === 'Diametro' ? `Ø${val}` : val}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  );
                })}
                {Object.values(filters).some(v => v) && (
                  <motion.button
                    layout
                    key="reset"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setFilters({})}
                    className="col-span-full md:col-auto w-full md:w-auto glass-button rounded-[12px] md:rounded-[14px] px-3 py-1.5 md:px-4 md:py-2 app-overline text-accent-rose hover:bg-accent-rose/10 transition-all flex items-center justify-center gap-1"
                  >
                    <X size={12} /> Reset
                  </motion.button>
                )}
                <motion.div layout key="selection-mode" className="hidden md:block">
                  <button
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`glass-button rounded-[14px] px-4 py-2 app-overline transition-all flex items-center gap-2 ${isSelectionMode ? 'text-accent-orange bg-accent-orange/10 border-accent-orange/30' : 'dark:text-slate-400 text-slate-600 opacity-60 hover:opacity-100'}`}
                  >
                    {isSelectionMode ? <X size={12} /> : <List size={12} />}
                    {isSelectionMode ? 'Cancella' : 'Seleziona'}
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel rounded-[20px] md:rounded-[24px] overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-4 md:px-6 py-2.5 md:py-3 border-b dark:border-white/5 border-slate-900/10 bg-white/[0.02]">
          <p className="app-overline text-accent-orange">
            {sortedFiltered.length} utensil{sortedFiltered.length === 1 ? 'e' : 'i'} trovati
          </p>
        </div>

        {/* Header Row for Desktop */}
        {!isMobile && sortedFiltered.length > 0 && (
          <div className="px-3 sm:px-4 md:px-6 py-2 border-b dark:border-white/5 border-slate-900/10 bg-white/[0.01] flex items-center gap-2 sm:gap-3 md:gap-4 app-overline dark:text-slate-400 text-slate-600 shrink-0">
            {isSelectionMode && <div className="w-5 sm:w-6 flex-shrink-0" />} {/* Checkbox spacer */}
            <div className="w-8 sm:w-9 md:w-10 flex-shrink-0" /> {/* Icon spacer */}
            <div 
              className="flex-1 min-w-0 cursor-pointer hover:text-accent-blue transition-colors flex items-center gap-1 text-left"
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

        <div ref={parentRef} className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden md:overflow-x-auto relative w-full">
          <div className="w-full min-w-0 md:min-w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {sortedFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 dark:text-slate-400 text-slate-600 absolute w-full top-0 left-0">
              <Filter size={32} className="mb-3 text-slate-600" />
              <p className="app-overline">Seleziona almeno un filtro</p>
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
                  <ToolIcon type={tool['Tipologia']} size={36} className="opacity-80 group-hover:opacity-100" />
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

export default DropdownFilterView;
