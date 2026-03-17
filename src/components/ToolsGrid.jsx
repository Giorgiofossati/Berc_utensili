import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, X, CheckCircle2, List, Activity, AlertTriangle, ChevronRight } from 'lucide-react';
import { ToolIcon } from '../lib/toolUtils';

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
];

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

const ToolsGrid = memo(({ tools: toolsList, onSelectTool, isMobile, selectedIds = [], onToggleSelect, isSelectionMode, setIsSelectionMode }) => {
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
    if (isMobile) {
      return ALL_DETAIL_KEYS.filter(d => ['Ubicazione', 'Quantità'].includes(d.key));
    }
    // For desktop, show columns if at least one tool in the filtered set has a value for it
    return ALL_DETAIL_KEYS.filter(detail => 
      filtered.some(t => t[detail.key] !== null && t[detail.key] !== undefined && t[detail.key] !== '')
    );
  }, [isMobile, filtered]);

  const setFilter = useCallback((key, value) => {
    setExtraFilters(prev => ({ ...prev, [key]: value || '' }));
  }, []);

  const buildDesc = (t) => {
    // Only primary identification in the description now
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
      className="w-full max-w-7xl flex flex-col gap-4"
    >
      {availableFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {availableFilters.map(({ key, label }) => (
            <div key={key} className="relative">
              <select
                value={extraFilters[key] || ''}
                onChange={(e) => setFilter(key, e.target.value)}
                className="glass-button rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider appearance-none cursor-pointer pr-8 bg-transparent text-slate-300 border-white/10 focus:border-accent-blue/40 outline-none transition-all min-w-[120px]"
              >
                <option value="">{label}</option>
                {(filterOptions[key] || []).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
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
            className={`glass-button rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isSelectionMode ? 'text-accent-blue bg-accent-blue/10 border-accent-blue/30' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
          >
            {isSelectionMode ? <CheckCircle2 size={12} /> : <List size={12} />}
            {isSelectionMode ? 'Esci Selezione' : 'Seleziona'}
          </button>
        </div>
      )}

      <div className="glass-panel rounded-[32px] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-orange">
            Utensili — {filtered.length} risultat{filtered.length === 1 ? 'o' : 'i'}
          </p>
        </div>

        {/* Header Row for Desktop */}
        {!isMobile && filtered.length > 0 && (
          <div className="px-6 py-2 border-b border-white/5 bg-white/[0.01] flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
            <div className="w-10 flex-shrink-0" /> {/* Icon spacer */}
            {isSelectionMode && <div className="w-6 flex-shrink-0" />} {/* Checkbox spacer */}
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

        <div className={`overflow-y-auto custom-scrollbar overflow-x-auto ${isMobile ? 'max-h-[45vh]' : 'max-h-[60vh]'}`}>
          <div className="min-w-max md:min-w-full">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <AlertTriangle size={32} className="mb-4 text-slate-700" />
                <p className="font-bold text-sm uppercase tracking-widest">Nessun utensile trovato</p>
              </div>
            ) : (
              filtered.map((tool, i) => (
                <motion.div
                  key={tool.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.04] cursor-pointer transition-all border-b border-white/[0.03] last:border-b-0 group ${selectedIds.includes(tool.id) ? 'bg-accent-blue/5' : ''}`}
                >
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {isSelectionMode && (
                      <div 
                        onClick={(e) => { e.stopPropagation(); onToggleSelect(tool.id); }}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${selectedIds.includes(tool.id) ? 'bg-accent-blue border-accent-blue' : 'border-white/20 hover:border-accent-blue/50'}`}
                      >
                        {selectedIds.includes(tool.id) && <CheckCircle2 size={14} className="text-slate-950" />}
                      </div>
                    )}
                    <div onClick={() => onSelectTool(tool)} className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-blue/20 transition-colors overflow-hidden">
                      <ToolIcon type={tool['Tipologia']} size={40} className="opacity-80 group-hover:opacity-100 transition-opacity" />
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

export default ToolsGrid;
