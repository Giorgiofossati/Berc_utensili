import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, List, LayoutGrid, Filter } from 'lucide-react';
import ToolsGrid from '../inventory/ToolsGrid';
import { EXTRA_FILTER_KEYS } from '../inventory/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilterStore } from '../../store/useFilterStore';

const DropdownFilterView = memo(({ tools: allTools, onSelectTool, isMobile, initialFilters = {}, onFilterChange, viewMode, setViewMode }) => {
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

  const activeFiltersCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

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

      
      {/* Deleghiamo il rendering della griglia a ToolsGrid con TanStack Table */}
      <ToolsGrid 
        tools={filtered} 
        onSelectTool={onSelectTool} 
        isMobile={isMobile} 
        hideExtraFilters={true} 
      />
    </motion.div>

  );
});

export default DropdownFilterView;
