import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, CheckCircle2, List, Activity, Filter, ChevronRight } from 'lucide-react';
import { ToolIcon } from '../lib/toolUtils';
import { EXTRA_FILTER_KEYS } from './ToolsGrid';

const ALL_DETAIL_KEYS = [
  { key: 'Ubicazione', label: 'Ubicazione', minWidth: '100px' },
  { key: 'Quantità', label: 'Quantità', minWidth: '70px', align: 'center' },
  { key: 'Stato', label: 'Stato', minWidth: '100px' },
  { key: 'Codice', label: 'Codice', minWidth: '100px' },
  { key: 'SerialNumber', label: 'S/N', minWidth: '90px' },
  { key: 'Materiale', label: 'Materiale', minWidth: '100px' },
  { key: 'Lunghezza', label: 'Lunghezza', minWidth: '100px' },
  { key: 'Passo', label: 'Passo', minWidth: '80px' },
  { key: 'Tolleranza', label: 'Tolleranza', minWidth: '90px' },
  { key: 'Angolo', label: 'Angolo', minWidth: '80px' },
  { key: 'Rivestimento', label: 'Rivestimento', minWidth: '110px' },
  { key: 'Fornitore', label: 'Fornitore', minWidth: '110px' },
  { key: 'Lavorazione', label: 'Lavorazione', minWidth: '110px' },
  { key: 'Sistema di misura', label: 'Sis. Misura', minWidth: '90px' },
];

const DropdownFilterView = memo(({ tools: allTools, onSelectTool, isMobile, initialFilters = {}, onFilterChange, selectedIds = [], onToggleSelect, isSelectionMode, setIsSelectionMode }) => {
  const [filters, setFilters] = useState(initialFilters);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(!isMobile);

  useEffect(() => {
    onFilterChange && onFilterChange(filters);
  }, [filters, onFilterChange]);

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
      Object.entries(filters).forEach(([fk, fv]) => {
        if (fk !== key && fv) {
          available = available.filter(t => String(t[fk]) === String(fv));
        }
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
    if (isMobile) {
      return ALL_DETAIL_KEYS.filter(d => ['Ubicazione', 'Quantità'].includes(d.key));
    }
    return ALL_DETAIL_KEYS.filter(detail => 
      filtered.some(t => t[detail.key] !== null && t[detail.key] !== undefined && t[detail.key] !== '')
    );
  }, [isMobile, filtered]);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value || '' }));
  }, []);

  const LABELS = {
    'Tipologia': 'Tipologia',
    'Forma': 'Forma',
    'Diametro': 'Diametro',
    ...Object.fromEntries(EXTRA_FILTER_KEYS.map(e => [e.key, e.label]))
  };

  const buildDesc = (t) => {
    const parts = [
      t['Tipologia'], 
      t['Forma'], 
      t['Diametro'] ? `Ø${t['Diametro']}` : null
    ];
    return parts.filter(Boolean).join(' · ');
  };

  const renderDetailValue = (tool, detail) => {
    const val = tool[detail.key];
    if (val === null || val === undefined || val === '') return <span className="text-slate-700 opacity-20">—</span>;

    if (detail.key === 'Stato') {
      return (
        <span className={`badge text-[9px] min-w-[70px] text-center ${val === 'Disponibile' ? 'badge-emerald' : 'badge-rose'}`}>
          {val}
        </span>
      );
    }

    if (detail.key === 'Quantità') {
      return (
        <span className={`font-black text-sm tabular-nums min-w-[40px] text-center ${val > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
          {val}
        </span>
      );
    }

    if (detail.key === 'Codice') {
      return <span className="badge badge-blue text-[9px] min-w-[60px] text-center">{val}</span>;
    }

    if (detail.key === 'SerialNumber' || detail.key === 'Ubicazione') {
      return <span className="text-[10px] text-slate-300 font-mono whitespace-nowrap">{val}</span>;
    }

    return <span className="text-[10px] text-slate-400 whitespace-nowrap">{val}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl flex flex-col gap-3 md:gap-4"
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
          className={`glass-button rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isSelectionMode ? 'text-accent-blue bg-accent-blue/10 border-accent-blue/30' : 'text-slate-400'}`}
        >
          {isSelectionMode ? <CheckCircle2 size={14} /> : <List size={14} />}
          {isSelectionMode ? 'Esci' : 'Seleziona'}
        </button>
      </div>

      <AnimatePresence>
        {(isFiltersExpanded || !isMobile) && (
          <motion.div 
            initial={isMobile ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={isMobile ? { height: 0, opacity: 0 } : false}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 px-2 pb-2">
              {filterKeys.map(key => (
                <div key={key} className="relative">
                  <select
                    value={filters[key] || ''}
                    onChange={(e) => setFilter(key, e.target.value)}
                    className={`glass-button rounded-[12px] md:rounded-[14px] px-3 py-2 md:px-4 md:py-2.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider appearance-none cursor-pointer pr-7 md:pr-8 bg-transparent border-white/10 focus:border-accent-blue/40 outline-none transition-all min-w-[100px] md:min-w-[120px] ${filters[key] ? 'text-accent-blue border-accent-blue/30' : 'text-slate-400'}`}
                  >
                    <option value="">{LABELS[key] || key}</option>
                    {(filterOptions[key] || []).map(val => (
                      <option key={val} value={val}>{key === 'Diametro' ? `Ø${val}` : val}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
              ))}
              {Object.values(filters).some(v => v) && (
                <button
                  onClick={() => setFilters({})}
                  className="glass-button rounded-[12px] md:rounded-[14px] px-3 py-2 md:px-4 md:py-2.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-accent-rose hover:bg-accent-rose/10 transition-all flex items-center gap-1"
                >
                  <X size={12} /> Reset
                </button>
              )}
              <div className="hidden md:block">
                <button
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                  className={`glass-button rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isSelectionMode ? 'text-accent-blue bg-accent-blue/10 border-accent-blue/30' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
                >
                  {isSelectionMode ? <CheckCircle2 size={12} /> : <List size={12} />}
                  {isSelectionMode ? 'Esci Selezione' : 'Seleziona'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel rounded-[32px] overflow-hidden flex flex-col">
        <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02]">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-orange">
            {filtered.length} utensil{filtered.length === 1 ? 'e' : 'i'} trovati
          </p>
        </div>

        {/* Header Row for Desktop */}
        {!isMobile && filtered.length > 0 && (
          <div className="px-6 py-2 border-b border-white/5 bg-white/[0.01] flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
            <div className="w-9 flex-shrink-0" /> {/* Icon spacer */}
            {isSelectionMode && <div className="w-5 flex-shrink-0" />} {/* Checkbox spacer */}
            <div className="flex-1 min-w-[150px]">Descrizione</div>
            {visibleDetailKeys.map(detail => (
              <div 
                key={detail.key} 
                className={`flex-shrink-0 text-${detail.align || 'left'}`}
                style={{ width: detail.minWidth }}
              >
                {detail.label}
              </div>
            ))}
            <div className="w-4 flex-shrink-0" /> {/* Chevron spacer */}
          </div>
        )}

        <div className="max-h-[55vh] overflow-y-auto custom-scrollbar overflow-x-auto">
          <div className="min-w-max md:min-w-full">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
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
                className={`flex items-center gap-4 px-6 py-3 hover:bg-white/[0.04] cursor-pointer transition-all border-b border-white/[0.03] last:border-b-0 group ${selectedIds.includes(tool.id) ? 'bg-accent-blue/5' : ''}`}
              >
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {isSelectionMode && (
                    <div 
                      onClick={(e) => { e.stopPropagation(); onToggleSelect(tool.id); }}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${selectedIds.includes(tool.id) ? 'bg-accent-blue border-accent-blue' : 'border-white/20 hover:border-accent-blue/50'}`}
                    >
                      {selectedIds.includes(tool.id) && <CheckCircle2 size={12} className="text-slate-950" />}
                    </div>
                  )}
                  <div onClick={() => onSelectTool(tool)} className="w-9 h-9 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-blue/20 transition-colors overflow-hidden">
                    <ToolIcon type={tool['Tipologia']} size={36} className="opacity-80 group-hover:opacity-100" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-[150px]" onClick={() => onSelectTool(tool)}>
                  <p className="font-bold text-xs text-white truncate">{buildDesc(tool)}</p>
                </div>

                {visibleDetailKeys.map(detail => (
                  <div 
                    key={detail.key} 
                    onClick={() => onSelectTool(tool)}
                    className={`flex-shrink-0 flex items-center justify-${detail.align === 'center' ? 'center' : 'start'}`}
                    style={{ width: detail.minWidth }}
                  >
                    {renderDetailValue(tool, detail)}
                  </div>
                ))}

                <div className="flex-shrink-0 px-2" onClick={() => onSelectTool(tool)}>
                  <ChevronRight size={14} className="text-slate-700 group-hover:text-accent-blue transition-colors" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  </motion.div>
  );
});

export default DropdownFilterView;
