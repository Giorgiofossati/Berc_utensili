import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { PageToolbar, MobileFiltersToggle } from '@/components/layout/PageTemplate';

import { motion, AnimatePresence } from 'framer-motion';
import ToolsGrid from '../inventory/ToolsGrid';
import { EXTRA_FILTER_KEYS } from '../inventory/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilterStore } from '../../store/useFilterStore';
import { toolMatchesQuery } from '../../lib/searchUtils';

const DropdownFilterView = memo(({ 
  tools: allTools, 
  onSelectTool, 
  isMobile, 
  initialFilters = {}, 
  onFilterChange,
  mobileFiltersAccessory
}) => {
  const isSelectionMode = useFilterStore(state => state.isSelectionMode);
  const searchQuery = useFilterStore(state => state.searchQuery);
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

    if (searchQuery && searchQuery.trim().length > 0) {
      result = result.filter(t => toolMatchesQuery(t, searchQuery));
    }

    return result;
  }, [allTools, filters, searchQuery]);

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
      {/* Mobile: i filtri stanno in una fascia richiudibile; ricerca, vista, reset e selezione sono nell'AppBar */}
      <div className="flex items-center gap-2 px-2 md:hidden">
        <MobileFiltersToggle open={isFiltersExpanded} onToggle={() => setIsFiltersExpanded(!isFiltersExpanded)} count={activeFiltersCount} className="flex-1 w-auto min-w-0" />
        {mobileFiltersAccessory}
      </div>

      <PageToolbar className={`flex-wrap h-auto min-h-[44px] pt-3 pb-1 border-b-0 px-2 md:px-4 lg:px-8 ${isMobile && !isFiltersExpanded ? "hidden" : ""}`}>
      <AnimatePresence>
        {(isFiltersExpanded || !isMobile) && (
          <motion.div 
            initial={isMobile ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={isMobile ? { height: 0, opacity: 0 } : false}
            className="overflow-hidden min-w-0 w-full"
          >
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 pb-2">
              {filterKeys.map(key => {
                const isDisabled = !filters[key] && (!filterOptions[key] || filterOptions[key].length === 0);
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="relative flex-1 min-w-[130px] md:min-w-[160px] md:max-w-[200px]"
                  >
                    <Select
                      // null (non undefined): il Select resta controllato e torna al placeholder col nome del filtro
                      value={filters[key] ? String(filters[key]) : null}
                      onValueChange={(val) => setFilter(key, val === 'all' ? '' : val)}
                      disabled={isDisabled}
                    >
                      <SelectTrigger 
                        disabled={isDisabled}
                        className={`max-md:h-11! glass-button rounded-xl md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 app-overline bg-transparent dark:border-white/10 border-slate-900/10 focus:ring-accent-blue/40 outline-none transition-all w-full ${filters[key] ? 'text-accent-blue border-accent-blue/30' : 'dark:text-slate-300 text-slate-700'} ${isDisabled ? 'opacity-40 disabled:opacity-40 pointer-events-none hover:bg-transparent shadow-none' : ''}`}
                      >
                        <span className="truncate"><SelectValue placeholder={LABELS[key] || key} /></span>
                      </SelectTrigger>
                      <SelectContent className="glass-panel z-50 border-white/10 dark:bg-slate-950/90 bg-white/90 backdrop-blur-xl">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </PageToolbar>

      <div className="flex-1 min-h-0 flex flex-col w-full pb-2 md:pb-4">
      {/* Deleghiamo il rendering della griglia a ToolsGrid con TanStack Table */}
      <ToolsGrid 
        tools={filtered} 
        onSelectTool={onSelectTool} 
        isMobile={isMobile} 
        hideExtraFilters={true} 
        selectionMode={isSelectionMode ? "toggle" : "none"} 
        emptyTitle={searchQuery ? "Nessun utensile trovato" : "Nessun utensile presente"}
        emptyDescription={
          searchQuery
            ? `Nessun risultato corrispondente a "${searchQuery.trim()}". Controlla i caratteri inseriti o prova con un altro parametro.`
            : null
        }
      />
      </div>
    </motion.div>

  );
});

export default DropdownFilterView;
