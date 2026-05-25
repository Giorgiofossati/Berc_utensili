import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, CheckCircle2, List, Activity, Filter, ChevronRight } from 'lucide-react';
import { ToolIcon, buildDesc } from '../lib/toolUtils';
import { EXTRA_FILTER_KEYS } from './ToolsGrid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_DETAIL_KEYS = [
  { key: 'Quantità', label: 'Quantità', minWidth: '95px', align: 'center' },
  { key: 'Ubicazione', label: 'Ubicazione', minWidth: '130px', align: 'center', className: 'hidden md:flex' },
  { key: 'Stato', label: 'Stato', minWidth: '120px', align: 'center', className: 'hidden md:flex' },
  { key: 'Fornitore', label: 'Fornitore', minWidth: '130px', align: 'center', className: 'hidden md:flex' },
  { key: 'Codice', label: 'Codice Aziendale', minWidth: '180px', align: 'center', className: 'hidden md:flex' },
];

const DropdownFilterView = memo(({ tools: allTools, onSelectTool, isMobile, initialFilters = {}, onFilterChange, selectedIds = [], onToggleSelect, isSelectionMode, setIsSelectionMode }) => {
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

    if (detail.key === 'SerialNumber') {
      return <span className="text-xs md:text-sm font-extrabold dark:text-slate-200 text-slate-800 font-mono whitespace-nowrap">{val}</span>;
    }

    return <span className="text-xs md:text-sm font-extrabold dark:text-slate-300 text-slate-700 whitespace-nowrap">{val}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl flex flex-col gap-3 md:gap-4 flex-1 min-h-0"
    >
      <div className="flex items-center justify-between px-2 md:hidden">
        <button 
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="flex items-center gap-2 glass-button px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-accent-blue"
        >
          <Filter size={14} />
          {isFiltersExpanded ? 'Nascondi Filtri' : 'Mostra Filtri'}
          {activeFiltersCount > 0 && <span className="bg-accent-blue text-slate-950 w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{activeFiltersCount}</span>}
        </button>
        
        <button
          onClick={() => setIsSelectionMode(!isSelectionMode)}
          className={`glass-button rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isSelectionMode ? 'text-accent-orange bg-accent-orange/10 border-accent-orange/30' : 'dark:text-slate-400 text-slate-600'}`}
        >
          {isSelectionMode ? <X size={14} /> : <List size={14} />}
          {isSelectionMode ? 'Cancella' : 'Seleziona'}
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
            <div className="flex flex-wrap gap-2 px-2 pb-2">
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
                      className="relative"
                    >
                      <Select
                        key={`select-${key}-${filters[key] || 'empty'}`}
                        value={filters[key] ? String(filters[key]) : undefined}
                        onValueChange={(val) => setFilter(key, val === 'all' ? '' : val)}
                      >
                        <SelectTrigger className={`glass-button rounded-[12px] md:rounded-[14px] px-3 py-2 md:px-4 md:py-2.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider bg-transparent dark:border-white/10 border-slate-900/10 focus:ring-accent-blue/40 outline-none transition-all min-w-[100px] md:min-w-[120px] ${filters[key] && filters[key] !== 'all' ? 'text-accent-blue border-accent-blue/30' : 'dark:text-slate-400 text-slate-600'}`}>
                          <SelectValue placeholder={LABELS[key] || key} />
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
                    className="glass-button rounded-[12px] md:rounded-[14px] px-3 py-2 md:px-4 md:py-2.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-accent-rose hover:bg-accent-rose/10 transition-all flex items-center gap-1"
                  >
                    <X size={12} /> Reset
                  </motion.button>
                )}
                <motion.div layout key="selection-mode" className="hidden md:block">
                  <button
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`glass-button rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isSelectionMode ? 'text-accent-orange bg-accent-orange/10 border-accent-orange/30' : 'dark:text-slate-400 text-slate-600 opacity-60 hover:opacity-100'}`}
                  >
                    {isSelectionMode ? <X size={12} /> : <List size={12} />}
                    {isSelectionMode ? 'Cancella Selezione' : 'Seleziona'}
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel rounded-[20px] md:rounded-[24px] overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-6 py-2 border-b dark:border-white/5 border-slate-900/10 bg-white/[0.02]">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-orange">
            {filtered.length} utensil{filtered.length === 1 ? 'e' : 'i'} trovati
          </p>
        </div>

        {/* Header Row for Desktop */}
        {!isMobile && filtered.length > 0 && (
          <div className="px-6 py-1.5 border-b dark:border-white/5 border-slate-900/10 bg-white/[0.01] flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500 shrink-0">
            {isSelectionMode && <div className="w-5 flex-shrink-0" />} {/* Checkbox spacer */}
            <div className="w-9 flex-shrink-0" /> {/* Icon spacer */}
            <div className="flex-1 min-w-[150px]">Descrizione</div>
            {visibleDetailKeys.map(detail => (
              <div 
                key={detail.key} 
                className={`flex-shrink-0 flex items-center justify-${detail.align === 'center' ? 'center' : 'start'} ${detail.className || ''}`}
                style={{ width: detail.minWidth }}
              >
                {detail.label}
              </div>
            ))}
            <div className="w-8 flex-shrink-0" /> {/* Chevron spacer */}
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-auto">
          <div className="min-w-max md:min-w-full">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 dark:text-slate-400 text-slate-600">
              <Filter size={32} className="mb-4 text-slate-700" />
              <p className="font-bold text-sm uppercase tracking-widest">Seleziona almeno un filtro</p>
            </div>
          ) : (
            filtered.map((tool, i) => (
              <motion.div
                key={tool.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.3) }}
                className={`flex items-center gap-4 px-6 py-2 md:py-1.5 hover:bg-white/[0.04] cursor-pointer transition-all border-b dark:border-white/[0.03] border-slate-900/5 last:border-b-0 group ${selectedIds.includes(tool.id) ? 'bg-accent-blue/5' : ''}`}
              >
                {isSelectionMode && (
                  <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center flex-shrink-0 w-5">
                    <Checkbox
                      checked={selectedIds.includes(tool.id)}
                      onCheckedChange={(checked) => onToggleSelect(tool.id)}
                      className={`w-5 h-5 rounded-md transition-all ${selectedIds.includes(tool.id) ? 'data-[state=checked]:bg-accent-blue data-[state=checked]:text-slate-950 border-accent-blue' : 'dark:border-white/30 border-slate-400'}`}
                    />
                  </div>
                )}
                <div onClick={() => onSelectTool(tool)} className="w-9 h-9 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-blue/20 transition-colors overflow-hidden">
                  <ToolIcon type={tool['Tipologia']} size={36} className="opacity-80 group-hover:opacity-100" />
                </div>
                
                <div className="flex-1 min-w-[150px]" onClick={() => onSelectTool(tool)}>
                  <p className="font-bold text-xs dark:text-white text-slate-900 truncate">{buildDesc(tool)}</p>
                </div>

                {visibleDetailKeys.map(detail => (
                  <div 
                    key={detail.key} 
                    onClick={() => onSelectTool(tool)}
                    className={`flex-shrink-0 flex items-center justify-${detail.align === 'center' ? 'center' : 'start'} ${detail.className || ''}`}
                    style={{ width: detail.minWidth }}
                  >
                    {renderDetailValue(tool, detail)}
                  </div>
                ))}

                <div className="w-8 flex-shrink-0 flex items-center justify-end" onClick={() => onSelectTool(tool)}>
                  <ChevronRight size={14} className="text-slate-700 group-hover:text-accent-blue transition-colors" />
                </div>
              </motion.div>
            ))
          )}
          </div>
          {/* Spacer esplicito per Safari/iOS */}
          <div className="h-24 md:h-12 shrink-0 w-full" />
        </div>
      </div>
    </motion.div>
  );
});

export default DropdownFilterView;
