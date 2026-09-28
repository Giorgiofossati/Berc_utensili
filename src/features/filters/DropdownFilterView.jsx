import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { PageToolbar, MobileFiltersToggle } from '@/components/layout/PageTemplate';
import { Filter, Plus, X } from 'lucide-react';
import { Menu } from '@base-ui/react';

import { motion, AnimatePresence } from 'framer-motion';
import ToolsGrid from '../inventory/ToolsGrid';
import { EXTRA_FILTER_KEYS } from '../inventory/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilterStore } from '../../store/useFilterStore';
import { toolMatchesQuery } from '../../lib/searchUtils';

const PRIMARY_FILTER_KEYS = ['Tipologia', 'Forma', 'Diametro', 'Stato'];

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
    'Stato': 'Stato',
    ...Object.fromEntries(EXTRA_FILTER_KEYS.map(e => [e.key, e.label]))
  };

  const primaryKeys = useMemo(() => {
    return PRIMARY_FILTER_KEYS.filter(k => filterKeys.includes(k));
  }, [filterKeys]);

  const secondaryKeys = useMemo(() => {
    return filterKeys.filter(k => !PRIMARY_FILTER_KEYS.includes(k));
  }, [filterKeys]);

  const [addedSecondaryKeys, setAddedSecondaryKeys] = useState(() => new Set());

  const visibleSecondaryKeys = useMemo(() => {
    return secondaryKeys.filter(k => Boolean(filters[k]) || addedSecondaryKeys.has(k));
  }, [secondaryKeys, filters, addedSecondaryKeys]);

  const inactiveSecondaryKeys = useMemo(() => {
    return secondaryKeys.filter(k => !visibleSecondaryKeys.includes(k));
  }, [secondaryKeys, visibleSecondaryKeys]);

  const handleAddSecondaryFilter = useCallback((key) => {
    setAddedSecondaryKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const handleRemoveSecondaryFilter = useCallback((key) => {
    setFilter(key, '');
    setAddedSecondaryKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, [setFilter]);

  const handleResetAll = useCallback(() => {
    setFilters({});
    setAddedSecondaryKeys(new Set());
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="w-full flex flex-col flex-1 min-h-0"
    >
      {/* Mobile: i filtri stanno in una fascia richiudibile; ricerca, vista, reset e selezione sono nell'AppBar */}
      <div className="flex items-center gap-2 px-3 py-1.5 md:hidden shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <MobileFiltersToggle open={isFiltersExpanded} onToggle={() => setIsFiltersExpanded(!isFiltersExpanded)} count={activeFiltersCount} className="flex-1 w-auto min-w-0" />
        {mobileFiltersAccessory}
      </div>

      {/* Mobile Panel: a scomparsa sotto md con touch target minimi di 44px */}
      <AnimatePresence>
        {isMobile && isFiltersExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden w-full border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 p-2.5 overflow-hidden shrink-0"
          >
            <div className="grid grid-cols-2 gap-2">
              {/* Filtri Primari su mobile */}
              {primaryKeys.map(key => {
                const isDisabled = !filters[key] && (!filterOptions[key] || filterOptions[key].length === 0);
                return (
                  <div key={key} className="w-full">
                    <Select
                      value={filters[key] ? String(filters[key]) : null}
                      onValueChange={(val) => setFilter(key, val === 'all' ? '' : val)}
                      disabled={isDisabled}
                    >
                      <SelectTrigger 
                        disabled={isDisabled}
                        className={`w-full max-md:h-11! glass-button rounded-xl px-3 py-1.5 app-overline bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-accent-blue/40 outline-none transition-all ${
                          filters[key] ? 'text-accent-blue border-accent-blue/30 font-bold' : 'dark:text-slate-300 text-slate-700'
                        } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                      >
                        <span className="truncate flex items-center gap-1">
                          <span className="text-slate-500 dark:text-slate-400 font-normal">{LABELS[key] || key}:</span>
                          <strong>{filters[key] ? (key === 'Diametro' ? `Ø${filters[key]}` : filters[key]) : 'Tutti'}</strong>
                        </span>
                      </SelectTrigger>
                      <SelectContent className="glass-panel z-50 border-slate-200 dark:border-slate-800 dark:bg-slate-950/95 bg-white/95 backdrop-blur-xl">
                        <SelectItem value="all" className="cursor-pointer font-bold opacity-60 italic">{LABELS[key] || key} (Tutti)</SelectItem>
                        {(filterOptions[key] || []).map(val => (
                          <SelectItem key={val} value={String(val)} className="cursor-pointer font-bold">
                            {key === 'Diametro' ? `Ø${val}` : val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}

              {/* Filtri Secondari Visibili su mobile */}
              {visibleSecondaryKeys.map(key => {
                const isDisabled = !filters[key] && (!filterOptions[key] || filterOptions[key].length === 0);
                return (
                  <div key={key} className="w-full flex items-center gap-1">
                    <div className="flex-1 min-w-0">
                      <Select
                        value={filters[key] ? String(filters[key]) : null}
                        onValueChange={(val) => setFilter(key, val === 'all' ? '' : val)}
                        disabled={isDisabled}
                      >
                        <SelectTrigger 
                          disabled={isDisabled}
                          className={`w-full max-md:h-11! glass-button rounded-xl px-3 py-1.5 app-overline bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-accent-blue/40 outline-none transition-all ${
                            filters[key] ? 'text-accent-blue border-accent-blue/30 font-bold' : 'dark:text-slate-300 text-slate-700'
                          } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                        >
                          <span className="truncate flex items-center gap-1">
                            <span className="text-slate-500 dark:text-slate-400 font-normal">{LABELS[key] || key}:</span>
                            <strong>{filters[key] ? (key === 'Diametro' ? `Ø${filters[key]}` : filters[key]) : 'Tutti'}</strong>
                          </span>
                        </SelectTrigger>
                        <SelectContent className="glass-panel z-50 border-slate-200 dark:border-slate-800 dark:bg-slate-950/95 bg-white/95 backdrop-blur-xl">
                          <SelectItem value="all" className="cursor-pointer font-bold opacity-60 italic">{LABELS[key] || key} (Tutti)</SelectItem>
                          {(filterOptions[key] || []).map(val => (
                            <SelectItem key={val} value={String(val)} className="cursor-pointer font-bold">
                              {key === 'Diametro' ? `Ø${val}` : val}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondaryFilter(key)}
                      className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-500 cursor-pointer"
                      aria-label={`Rimuovi filtro ${LABELS[key] || key}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}

              {/* Pulsante "+ Altri filtri" su mobile */}
              {inactiveSecondaryKeys.length > 0 && (
                <div className="w-full">
                  <Menu.Root>
                    <Menu.Trigger
                      className="w-full max-md:h-11! glass-button rounded-xl px-3 py-1.5 app-overline border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1.5 cursor-pointer"
                      aria-label="Aggiungi altri filtri"
                    >
                      <Plus size={15} className="text-slate-400" />
                      <span>Altri filtri</span>
                      <span className="app-caption px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">
                        +{inactiveSecondaryKeys.length}
                      </span>
                    </Menu.Trigger>
                    <Menu.Portal>
                      <Menu.Positioner sideOffset={6} align="start" className="isolate z-50">
                        <Menu.Popup className="min-w-[240px] max-h-[min(340px,50dvh)] overflow-y-auto custom-scrollbar p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-200 outline-none">
                          <div className="px-2.5 py-1.5 text-xs font-bold tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                            Filtri disponibili
                          </div>
                          {inactiveSecondaryKeys.map(key => (
                            <Menu.Item
                              key={key}
                              onClick={() => handleAddSecondaryFilter(key)}
                              className="flex min-h-[44px] cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-semibold outline-none transition-colors hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-700 dark:hover:text-sky-300"
                            >
                              <span className="flex items-center gap-2">
                                <Plus size={14} className="text-sky-500" />
                                <span>{LABELS[key] || key}</span>
                              </span>
                              {(filterOptions[key]?.length || 0) > 0 && (
                                <span className="app-caption text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {filterOptions[key].length}
                                </span>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                </div>
              )}

              {/* Reset filtri su mobile */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="w-full max-md:h-11! glass-button rounded-xl px-3 py-1.5 app-overline text-accent-rose hover:bg-accent-rose/10 transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                >
                  <X size={15} />
                  <span>Azzera tutti i filtri</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Toolbar: compatto con respiro ed alto contrasto WCAG */}
      <PageToolbar className="min-h-[50px] h-[50px] py-2 px-3 sm:px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs hidden md:flex items-center shrink-0 min-w-0 w-full gap-2.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2.5 select-none text-xs w-full min-w-0">
          <span className="text-xs font-extrabold tracking-wider text-slate-600 dark:text-slate-300 shrink-0 flex items-center gap-1.5 mr-0.5">
            <Filter size={14} className="text-slate-500 dark:text-slate-400" />
            Filtri:
          </span>

          {/* Filtri Primari (Tipologia, Forma, Diametro, Stato) */}
          {primaryKeys.map(key => {
            const isDisabled = !filters[key] && (!filterOptions[key] || filterOptions[key].length === 0);
            return (
              <div key={key} className="relative shrink-0">
                <Select
                  value={filters[key] ? String(filters[key]) : null}
                  onValueChange={(val) => setFilter(key, val === 'all' ? '' : val)}
                  disabled={isDisabled}
                >
                  <SelectTrigger 
                    disabled={isDisabled}
                    className={`h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 text-xs shrink-0 whitespace-nowrap shadow-xs focus:ring-1 focus:ring-sky-500 w-auto min-w-[95px] ${
                      filters[key] ? 'border-sky-400 dark:border-sky-600 text-sky-800 dark:text-sky-200 bg-sky-50/80 dark:bg-sky-950/40 font-semibold ring-1 ring-sky-400/20' : ''
                    } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <span className="text-slate-600 dark:text-slate-400 font-normal">{LABELS[key] || key}:</span>
                      <strong className="font-bold text-slate-900 dark:text-slate-100">
                        {filters[key] ? (key === 'Diametro' ? `Ø${filters[key]}` : filters[key]) : 'Tutti'}
                      </strong>
                    </span>
                  </SelectTrigger>
                  <SelectContent className="glass-panel z-50 border-slate-200 dark:border-slate-800 dark:bg-slate-950/95 bg-white/95 backdrop-blur-xl">
                    <SelectItem value="all" className="cursor-pointer font-bold opacity-60 italic">{LABELS[key] || key} (Tutti)</SelectItem>
                    {(filterOptions[key] || []).map(val => (
                      <SelectItem key={val} value={String(val)} className="cursor-pointer font-bold">
                        {key === 'Diametro' ? `Ø${val}` : val}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}

          {/* Filtri Secondari Attivi o Selezionati */}
          {visibleSecondaryKeys.map(key => {
            const isDisabled = !filters[key] && (!filterOptions[key] || filterOptions[key].length === 0);
            return (
              <div key={key} className="relative shrink-0 flex items-center">
                <div className={`flex items-center rounded-lg border transition-all ${
                  filters[key]
                    ? 'border-sky-400 dark:border-sky-600 bg-sky-50/80 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-semibold ring-1 ring-sky-400/20'
                    : 'border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  <Select
                    value={filters[key] ? String(filters[key]) : null}
                    onValueChange={(val) => setFilter(key, val === 'all' ? '' : val)}
                    disabled={isDisabled}
                  >
                    <SelectTrigger 
                      disabled={isDisabled}
                      className="h-8 px-2.5 border-0 bg-transparent shadow-none hover:bg-transparent focus:ring-0 text-xs font-medium gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      <span className="truncate flex items-center gap-1.5">
                        <span className="text-slate-600 dark:text-slate-400 font-normal">{LABELS[key] || key}:</span>
                        <strong className="font-bold">
                          {filters[key] ? (key === 'Diametro' ? `Ø${filters[key]}` : filters[key]) : 'Tutti'}
                        </strong>
                      </span>
                    </SelectTrigger>
                    <SelectContent className="glass-panel z-50 border-slate-200 dark:border-slate-800 dark:bg-slate-950/95 bg-white/95 backdrop-blur-xl">
                      <SelectItem value="all" className="cursor-pointer font-bold opacity-60 italic">{LABELS[key] || key} (Tutti)</SelectItem>
                      {(filterOptions[key] || []).map(val => (
                        <SelectItem key={val} value={String(val)} className="cursor-pointer font-bold">
                          {key === 'Diametro' ? `Ø${val}` : val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => handleRemoveSecondaryFilter(key)}
                    className="h-8 pr-2 pl-0.5 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={`Rimuovi filtro ${LABELS[key] || key}`}
                    aria-label={`Rimuovi filtro ${LABELS[key] || key}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Menu "+ Altri filtri" */}
          {inactiveSecondaryKeys.length > 0 && (
            <Menu.Root>
              <Menu.Trigger
                className="h-8 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-600 bg-white/60 dark:bg-slate-800/60 hover:bg-sky-50/60 dark:hover:bg-sky-950/30 text-slate-700 dark:text-slate-300 hover:text-sky-800 dark:hover:text-sky-200 font-semibold flex items-center gap-1.5 text-xs shrink-0 cursor-pointer transition-colors outline-none focus-visible:ring-1 focus-visible:ring-sky-500 shadow-xs"
                aria-label="Aggiungi altri filtri"
              >
                <Plus size={13} className="text-slate-500 dark:text-slate-400" />
                <span>Altri filtri</span>
                <span className="app-caption px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  +{inactiveSecondaryKeys.length}
                </span>
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner sideOffset={6} align="start" className="isolate z-50">
                  <Menu.Popup className="min-w-[200px] max-h-[min(340px,50dvh)] overflow-y-auto custom-scrollbar p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-200 outline-none">
                    <div className="px-2.5 py-1.5 text-xs font-bold tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                      Filtri disponibili
                    </div>
                    {inactiveSecondaryKeys.map(key => {
                      const count = filterOptions[key]?.length || 0;
                      return (
                        <Menu.Item
                          key={key}
                          onClick={() => handleAddSecondaryFilter(key)}
                          className="flex min-h-[32px] cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none transition-colors hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-700 dark:hover:text-sky-300 data-[highlighted]:bg-sky-50 dark:data-[highlighted]:bg-sky-950/50 data-[highlighted]:text-sky-700 dark:data-[highlighted]:text-sky-300"
                        >
                          <span className="flex items-center gap-1.5">
                            <Plus size={12} className="text-sky-500" />
                            <span>{LABELS[key] || key}</span>
                          </span>
                          {count > 0 && (
                            <span className="app-caption text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {count} opzioni
                            </span>
                          )}
                        </Menu.Item>
                      );
                    })}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          )}

          {/* Reset filtri */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="ml-auto text-xs font-bold text-sky-700 dark:text-sky-400 hover:text-sky-800 hover:underline shrink-0 cursor-pointer pl-2 whitespace-nowrap"
            >
              Azzera filtri
            </button>
          )}
        </div>
      </PageToolbar>

      <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden">
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
