import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  createColumnHelper
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { X, AlertTriangle, ChevronRight, AlignJustify, Plus, MapPin, Factory } from 'lucide-react';
import { ToolIcon, buildDesc } from '../../lib/toolUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilterStore } from '../../store/useFilterStore';
import { useMovementStore } from '../../store/useMovementStore';
import { VirtualizedTable } from '../../components/common/DataTable';
import { EXTRA_FILTER_KEYS } from './constants';
import { MobileFiltersToggle } from '../../components/layout/PageTemplate';

const columnHelper = createColumnHelper();

const ToolsGrid = memo(({ 
  tools: toolsList, 
  onSelectTool, 
  hideExtraFilters = false,
  emptyTitle = "Nessun utensile trovato",
  emptyDescription = null,
  selectionMode = 'none',
  showDensityToggle = false,
  density: propDensity = 'compact',
  renderRowTrailing,
  mobileFiltersAccessory
}) => {
  const selectedIds = useFilterStore(state => state.selectedToolsIds);
  const onToggleSelect = useFilterStore(state => state.toggleToolSelection);
  const isStoreSelectionMode = useFilterStore(state => state.isSelectionMode);
  
  const activeDrawerTool = useMovementStore(state => state.selectedTool);
  const isDrawerOpen = useMovementStore(state => state.showMoveModal);
  
  // Normalizzazione selectionMode: 'none' | 'toggle' | 'pick' (con fallback retrocompatibile per legacy 'multiple' / 'single')
  const normalizedSelectionMode = useMemo(() => {
    if (selectionMode === 'multiple') return 'toggle';
    if (selectionMode === 'single') return 'none';
    if (selectionMode === 'pick' || selectionMode === 'toggle' || selectionMode === 'none') {
      return selectionMode;
    }
    return 'none';
  }, [selectionMode]);

  // La modalità selezione a checkbox è attiva SOLO quando selectionMode è 'toggle' (o 'multiple') E isStoreSelectionMode è true.
  // In modalità 'pick' o 'none', le checkbox sono sempre disabilitate/nascoste.
  const isSelectionActive = useMemo(() => {
    if (normalizedSelectionMode === 'toggle') {
      return isStoreSelectionMode;
    }
    return false;
  }, [normalizedSelectionMode, isStoreSelectionMode]);
  
  const [extraFilters, setExtraFilters] = useState({});
  // Mobile (§4.4): i filtri non si impilano mai prima dei dati, stanno dietro "Mostra filtri"
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const activeExtraCount = Object.values(extraFilters).filter(v => v && v !== 'all').length;
  const [sorting, setSorting] = useState([]);
  const [density, setDensity] = useState(propDensity);

  useEffect(() => {
    setDensity(propDensity);
  }, [propDensity]);

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

  const setFilter = useCallback((key, value) => {
    setExtraFilters(prev => ({ ...prev, [key]: value || '' }));
  }, []);

  const columns = useMemo(() => {
    const renderCodeBadge = (val, tooltip) => {
      const clean = (val && val !== '-') ? String(val).trim() : '';
      if (!clean) {
        return (
          <div className="w-full truncate text-center">
            <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">—</span>
          </div>
        );
      }
      return (
        <div className="w-full truncate text-center px-1">
          <span 
            className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 tracking-tight whitespace-nowrap inline-block shadow-2xs"
            title={tooltip || clean}
          >
            {clean}
          </span>
        </div>
      );
    };

    return [
      columnHelper.accessor(row => buildDesc(row), {
        id: 'Descrizione',
        header: () => (
          <div className="flex items-center gap-2 sm:gap-3 h-full pl-3 sm:pl-4 md:pl-6 min-w-0 overflow-hidden">
            {isSelectionActive && <div className="w-5 sm:w-6 flex-shrink-0" />}
            <div className="w-8 sm:w-9 md:w-10 flex-shrink-0" />
            <span className="ml-1 truncate">Descrizione</span>
          </div>
        ),
        meta: { isFlex: true, flex: '2.5 1 0%', minWidth: 160 },
        size: 0,
        sortingFn: (rowA, rowB, columnId) => {
          return String(rowA.getValue(columnId) || '').localeCompare(
            String(rowB.getValue(columnId) || ''), 
            undefined, 
            { numeric: true }
          );
        },
        cell: info => {
          const tool = info.row.original;
          const isRowSelectedInDrawer = isDrawerOpen && activeDrawerTool && activeDrawerTool.id === tool.id;
          const isMachine = tool['Ubicazione'] && (
            tool['Ubicazione'].toLowerCase().includes('belotti') || 
            tool['Ubicazione'].toLowerCase().includes('extrema') || 
            tool['Ubicazione'].toLowerCase().includes('cnc')
          );
          return (
            <div className="flex items-center gap-3 flex-1 min-w-0 h-full pl-3 sm:pl-4 md:pl-6 overflow-hidden">
              {isSelectionActive && (
                <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center shrink-0 w-5">
                  <Checkbox
                    checked={selectedIds.includes(tool.id)}
                    onCheckedChange={() => onToggleSelect(tool.id)}
                    className={`w-4 h-4 rounded-md transition-all ${selectedIds.includes(tool.id) ? 'data-[state=checked]:bg-sky-600 data-[state=checked]:text-white border-sky-600' : 'dark:border-white/30 border-slate-400'}`}
                  />
                </div>
              )}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors overflow-hidden ${
                isRowSelectedInDrawer
                  ? 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:border-sky-400 shadow-xs'
                  : isMachine 
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300/80 dark:border-amber-800 text-amber-900 dark:text-amber-300' 
                  : 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300'
              }`}>
                <ToolIcon type={tool['Tipologia']} size={22} className={`opacity-95 group-hover:scale-105 transition-transform ${isRowSelectedInDrawer ? 'text-white' : ''}`} />
              </div>
              <div className="min-w-0 flex-1 ml-1 flex items-center">
                <span className={`app-h3 transition-colors truncate ${
                  isRowSelectedInDrawer
                    ? 'text-sky-950 dark:text-sky-100 font-black'
                    : 'text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400'
                }`}>
                  {info.getValue()}
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('Codice', {
        header: 'Codice Aziendale',
        sortingFn: (rowA, rowB, columnId) => {
          return String(rowA.getValue(columnId) || '').localeCompare(
            String(rowB.getValue(columnId) || ''),
            undefined,
            { numeric: true }
          );
        },
        meta: { 
          className: 'hidden xl:flex justify-center', 
          isFlex: true, 
          flex: '1 1 0%', 
          minWidth: 110 
        },
        cell: info => renderCodeBadge(info.getValue())
      }),
      columnHelper.accessor(row => {
        const raw = row['Serial Number'] || row['Codice Fornitore'] || row['SerialNumber'] || '';
        return (raw && raw !== '-') ? String(raw).trim() : '';
      }, {
        id: 'Codice Fornitore',
        header: 'Codice Fornitore',
        sortingFn: (rowA, rowB, columnId) => {
          return String(rowA.getValue(columnId) || '').localeCompare(
            String(rowB.getValue(columnId) || ''),
            undefined,
            { numeric: true }
          );
        },
        meta: { 
          className: 'hidden xl:flex justify-center', 
          isFlex: true, 
          flex: '1 1 0%', 
          minWidth: 110 
        },
        cell: info => {
          const val = info.getValue();
          const tool = info.row.original;
          const supplier = tool['Fornitore'] && tool['Fornitore'] !== '-' ? String(tool['Fornitore']).trim() : '';
          return renderCodeBadge(val, supplier ? `${val} (${supplier})` : undefined);
        }
      }),
      columnHelper.accessor('Ubicazione', {
        header: 'Ubicazione',
        sortingFn: (rowA, rowB, columnId) => {
          return String(rowA.getValue(columnId) || '').localeCompare(
            String(rowB.getValue(columnId) || ''), 
            undefined, 
            { numeric: true }
          );
        },
        meta: { 
          className: 'hidden md:flex justify-center', 
          isFlex: true, 
          flex: '0.8 1 0%', 
          minWidth: 90, 
          maxWidth: 150 
        },
        cell: info => {
          const val = info.getValue();
          if (!val) return <div className="w-full flex items-center justify-center"><span className="text-slate-400 dark:text-slate-500 font-mono text-xs">—</span></div>;
          const isMachine = val.toLowerCase().includes('belotti') || 
            val.toLowerCase().includes('extrema') || 
            val.toLowerCase().includes('cnc');
          return (
            <div className="w-full flex items-center justify-center px-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border max-w-full tracking-tight whitespace-nowrap shadow-2xs ${
                isMachine
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-800'
                  : 'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              }`}>
                {isMachine ? <Factory size={12} className="shrink-0" /> : <MapPin size={12} className="shrink-0" />}
                <span className="truncate">{val}</span>
              </span>
            </div>
          );
        }
      }),
      columnHelper.accessor('Stato', {
        header: 'Stato',
        size: 90,
        sortingFn: (rowA, rowB, columnId) => {
          return String(rowA.getValue(columnId) || '').localeCompare(
            String(rowB.getValue(columnId) || '')
          );
        },
        meta: { 
          className: 'hidden lg:flex justify-center', 
          minWidth: 80 
        },
        cell: info => {
          const val = info.getValue();
          if (!val) return <div className="w-full flex items-center justify-center"><span className="text-slate-400 dark:text-slate-500 font-mono text-xs">—</span></div>;
          const isOk = val === 'Disponibile' || val === 'NUOVO';
          return (
            <div className="w-full flex items-center justify-center px-1">
              <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold border tracking-tight whitespace-nowrap shadow-2xs ${
                isOk 
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
              }`}>
                {val}
              </span>
            </div>
          );
        }
      }),
      columnHelper.accessor('Quantità', {
        header: 'Giacenza',
        size: 70,
        sortingFn: (rowA, rowB, columnId) => {
          const a = Number(rowA.getValue(columnId)) || 0;
          const b = Number(rowB.getValue(columnId)) || 0;
          return a - b;
        },
        meta: { className: 'shrink-0 justify-center', minWidth: 56 },
        cell: info => {
          const qty = Number(info.getValue()) || 0;
          return (
            <div className="w-full truncate text-center pr-1 sm:pr-2">
              <span className={`app-qty-sm font-mono font-black ${
                qty > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'
              }`}>
                {qty}
              </span>
            </div>
          );
        }
      })
    ];
  }, [isSelectionActive, selectedIds, onToggleSelect, isDrawerOpen, activeDrawerTool]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="w-full flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      {((!hideExtraFilters && availableFilters.length > 0) || showDensityToggle || (!hideExtraFilters && normalizedSelectionMode === 'toggle')) && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-2">
          {!hideExtraFilters && availableFilters.length > 0 && (
            <div className="md:hidden basis-full flex items-center gap-2">
              <MobileFiltersToggle open={showFiltersMobile} onToggle={() => setShowFiltersMobile(v => !v)} count={activeExtraCount} className="flex-1 w-auto min-w-0" />
              {mobileFiltersAccessory}
            </div>
          )}
          {!hideExtraFilters && availableFilters.length > 0 && (
            <>
              {availableFilters.map(({ key, label }) => (
                <div key={key} className={`relative ${showFiltersMobile ? '' : 'max-md:hidden'}`}>
                  <Select
                    value={extraFilters[key] && extraFilters[key] !== 'all' ? String(extraFilters[key]) : null}
                    onValueChange={(val) => setFilter(key, val === 'all' ? '' : val)}
                  >
                    <SelectTrigger className={`max-md:h-11! glass-button rounded-xl md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 app-overline bg-transparent dark:border-white/10 border-slate-900/10 focus:ring-accent-blue/40 outline-none transition-all min-w-[95px] md:min-w-[120px] ${extraFilters[key] && extraFilters[key] !== 'all' ? 'text-accent-blue border-accent-blue/30' : 'dark:text-slate-300 text-slate-700'}`}>
                      <SelectValue placeholder={label} />
                    </SelectTrigger>
                    <SelectContent className="glass-panel z-50 border-white/10 dark:bg-slate-950/90 bg-white/90 backdrop-blur-xl">
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
                  type="button"
                  onClick={() => setExtraFilters({})}
                  className="max-md:h-11 glass-button rounded-xl md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 app-overline text-accent-orange hover:bg-accent-orange/10 transition-all flex items-center gap-1 shrink-0"
                >
                  <X size={14} /> Reset
                </button>
              )}
            </>
          )}
          {showDensityToggle && (
            <button
              type="button"
              onClick={() => setDensity(d => (d === 'compact' ? 'comfortable' : 'compact'))}
              className={`glass-button rounded-xl md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 app-overline transition-all flex items-center gap-1.5 shrink-0 ${density === 'compact' ? 'text-accent-blue bg-accent-blue/10 border-accent-blue/30' : 'dark:text-slate-400 text-slate-600 opacity-70 hover:opacity-100 hover:bg-accent-blue/[0.06]'}`}
              title="Alterna visualizzazione densità tabella (Comoda / Compatta)"
              aria-label={`Densità tabella: ${density === 'compact' ? 'Compatta' : 'Comoda'}`}
            >
              <AlignJustify size={14} className="shrink-0" />
              <span>{density === 'compact' ? 'Compatta' : 'Comoda'}</span>
            </button>
          )}
        </div>
      )}

      <div className="w-full flex-1 min-h-0 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col w-full">
          <VirtualizedTable
            table={table}
            density={density}
            selectionMode={normalizedSelectionMode}
            estimateRowSize={density === 'compact' ? 44 : 56}
            onRowClick={(tool) => {
              if (isSelectionActive) {
                onToggleSelect(tool.id);
              } else if (onSelectTool) {
                onSelectTool(tool);
              }
            }}
            getRowClassName={(tool) => {
              if (isSelectionActive && selectedIds.includes(tool.id)) {
                return 'bg-sky-50 dark:bg-sky-950/40 shadow-[inset_3px_0_0_#0284c7]';
              }
              if (isDrawerOpen && activeDrawerTool && activeDrawerTool.id === tool.id) {
                return 'bg-sky-50/90 dark:bg-sky-950/70 shadow-[inset_4px_0_0_#0284c7] font-semibold';
              }
              if (tool['Stato'] === 'USATO') {
                return 'bg-slate-50/40 dark:bg-slate-950/20';
              }
              return '';
            }}
            renderRowTrailing={renderRowTrailing ? renderRowTrailing : (tool) => {
              const isSelectedInDrawer = isDrawerOpen && activeDrawerTool && tool && activeDrawerTool.id === tool.id;
              return normalizedSelectionMode === 'pick' ? (
                <Plus
                  size={16}
                  className="text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform"
                />
              ) : (
                <ChevronRight
                  size={18}
                  className={`transition-colors ${
                    isSelectedInDrawer
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400'
                  }`}
                />
              );
            }}
            emptyIcon={AlertTriangle}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            bottomSpacerClassName=""
          />
        </div>

        {/* Footer Status Bar con conteggio utensili */}
        <div className="px-4 md:px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {rows.length.toLocaleString('it-IT')}
            </span>
            <span>utensili a catalogo</span>
          </div>
          {isDrawerOpen && activeDrawerTool && (
            <div className="flex items-center gap-2 ml-auto text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span className="text-xs font-semibold">1 riga selezionata</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default ToolsGrid;
