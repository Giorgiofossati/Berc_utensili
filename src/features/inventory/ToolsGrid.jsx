import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  createColumnHelper
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { X, List, AlertTriangle, ChevronRight } from 'lucide-react';
import { ToolIcon, buildDesc } from '../../lib/toolUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilterStore } from '../../store/useFilterStore';
import { VirtualizedTable } from '../../components/common/DataTable';
import { EXTRA_FILTER_KEYS } from './constants';

const columnHelper = createColumnHelper();

const ToolsGrid = memo(({ tools: toolsList, onSelectTool, hideExtraFilters = false }) => {
  const selectedIds = useFilterStore(state => state.selectedToolsIds);
  const onToggleSelect = useFilterStore(state => state.toggleToolSelection);
  const isSelectionMode = useFilterStore(state => state.isSelectionMode);
  const setIsSelectionMode = useFilterStore(state => state.handleSetIsSelectionMode);
  
  const [extraFilters, setExtraFilters] = useState({});
  const [sorting, setSorting] = useState([]);

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
    return [
      columnHelper.accessor(row => buildDesc(row), {
        id: 'Descrizione',
        header: () => (
          <div className="flex items-center gap-2 sm:gap-3 h-full pl-3 sm:pl-4 md:pl-6">
            {isSelectionMode && <div className="w-5 sm:w-6 flex-shrink-0" />}
            <div className="w-8 sm:w-9 md:w-10 flex-shrink-0" />
            <span className="ml-1">Descrizione</span>
          </div>
        ),
        meta: { isFlex: true },
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
          return (
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 h-full pl-3 sm:pl-4 md:pl-6">
              {isSelectionMode && (
                <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center flex-shrink-0 w-5 sm:w-6">
                  <Checkbox
                    checked={selectedIds.includes(tool.id)}
                    onCheckedChange={() => onToggleSelect(tool.id)}
                    className={`w-5 h-5 rounded-md transition-all ${selectedIds.includes(tool.id) ? 'data-[state=checked]:bg-accent-blue data-[state=checked]:text-slate-950 border-accent-blue' : 'dark:border-white/30 border-slate-400'}`}
                  />
                </div>
              )}
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-blue/20 transition-colors overflow-hidden">
                <ToolIcon type={tool['Tipologia']} size={36} className="opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="min-w-0 flex-1 ml-1 truncate">
                <p className="app-h3 truncate">{info.getValue()}</p>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('Quantità', {
        header: 'QTY',
        size: 64,
        sortingFn: (rowA, rowB, columnId) => {
          const a = Number(rowA.getValue(columnId)) || 0;
          const b = Number(rowB.getValue(columnId)) || 0;
          return a - b;
        },
        meta: { className: 'shrink-0' },
        cell: info => (
          <div className="w-full truncate text-center">
             <span className={`app-qty-sm ${Number(info.getValue()) > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
              {info.getValue() || 0}
            </span>
          </div>
        )
      }),
      columnHelper.accessor('Ubicazione', {
        header: 'Ubicazione',
        size: 120,
        sortingFn: (rowA, rowB, columnId) => {
          return String(rowA.getValue(columnId) || '').localeCompare(
            String(rowB.getValue(columnId) || ''), 
            undefined, 
            { numeric: true }
          );
        },
        meta: { className: 'hidden md:flex' },
        cell: info => {
          const val = info.getValue();
          if (!val) return <div className="w-full truncate text-center"><span className="text-slate-700 opacity-20">—</span></div>;
          return <div className="w-full truncate text-center"><span className="badge badge-orange app-caption font-bold px-2.5 py-0.5">{val}</span></div>;
        }
      }),
      columnHelper.accessor('Stato', {
        header: 'Stato',
        size: 100,
        sortingFn: (rowA, rowB, columnId) => {
          return String(rowA.getValue(columnId) || '').localeCompare(
            String(rowB.getValue(columnId) || '')
          );
        },
        meta: { className: 'hidden md:flex' },
        cell: info => {
          const val = info.getValue();
          if (!val) return <div className="w-full truncate text-center"><span className="text-slate-700 opacity-20">—</span></div>;
          const isOk = val === 'Disponibile' || val === 'NUOVO';
          return (
            <div className="w-full truncate text-center">
              <span className={`badge text-[10px] font-black px-2.5 py-0.5 ${isOk ? 'badge-emerald' : 'badge-rose'}`}>
                {val}
              </span>
            </div>
          );
        }
      }),
      columnHelper.accessor('Fornitore', {
        header: 'Fornitore',
        size: 110,
        sortingFn: (rowA, rowB, columnId) => {
          return String(rowA.getValue(columnId) || '').localeCompare(
            String(rowB.getValue(columnId) || ''),
            undefined,
            { numeric: true }
          );
        },
        meta: { className: 'hidden md:flex' },
        cell: info => {
          const val = info.getValue();
          if (!val) return <div className="w-full truncate text-center"><span className="text-slate-700 opacity-20">—</span></div>;
          return <div className="w-full truncate text-center"><span className="app-caption font-bold">{val}</span></div>;
        }
      }),
      columnHelper.accessor('Codice', {
        header: 'Codice Aziendale',
        size: 140,
        sortingFn: (rowA, rowB, columnId) => {
          return String(rowA.getValue(columnId) || '').localeCompare(
            String(rowB.getValue(columnId) || ''),
            undefined,
            { numeric: true }
          );
        },
        meta: { className: 'hidden md:flex' },
        cell: info => {
          const val = info.getValue();
          if (!val) return <div className="w-full truncate text-center"><span className="text-slate-700 opacity-20">—</span></div>;
          return <div className="w-full truncate text-center"><span className="badge badge-blue app-caption font-bold px-2.5 py-0.5">{val}</span></div>;
        }
      })
    ];
  }, [isSelectionMode, selectedIds, onToggleSelect]);

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
      className="w-full max-w-[1600px] flex flex-col flex-1 gap-2 md:gap-4 min-h-0"
    >
      {!hideExtraFilters && availableFilters.length > 0 && (
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
            {rows.length} utensil{rows.length === 1 ? 'e' : 'i'} trovat{rows.length === 1 ? 'o' : 'i'}
          </p>
        </div>

        <VirtualizedTable
          table={table}
          estimateRowSize={56}
          onRowClick={(tool) => onSelectTool(tool)}
          getRowClassName={(tool) => (selectedIds.includes(tool.id) ? 'bg-accent-blue/5' : '')}
          renderRowTrailing={() => (
            <ChevronRight
              size={14}
              className="text-slate-500 group-hover:text-accent-blue transition-colors"
            />
          )}
          emptyIcon={AlertTriangle}
          emptyTitle="Nessun utensile trovato"
        />
      </div>
    </motion.div>
  );
});

export default ToolsGrid;
