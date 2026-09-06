import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  createColumnHelper 
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ArrowDown, ArrowUp, Search, X, 
  RefreshCw, User, Calendar, FilterX, Info, Copy, Check 
} from 'lucide-react';
import { ToolIcon, buildDesc } from '../../lib/toolUtils';
import { VirtualizedTable } from '../../components/common/DataTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const formatDateLong = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  } catch {
    return dateStr;
  }
};

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const columnHelper = createColumnHelper();

const HistoryView = memo(({ history = [], setView, fetchHistory }) => {
  // Sorting State - default: data più recente per prima
  const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [opTypeFilter, setOpTypeFilter] = useState('all'); // 'all' | 'carico' | 'scarico'
  const [timeframeFilter, setTimeframeFilter] = useState('all'); // 'all' | 'today' | '7d' | '30d' | 'this_month' | 'custom'
  const [customDate, setCustomDate] = useState('');

  // UI State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Lista operatori unici presenti nello storico
  const uniqueOperators = useMemo(() => {
    const set = new Set();
    history.forEach(item => {
      if (item.operatore) set.add(item.operatore.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [history]);

  // Conteggio filtri attivi
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedOperator !== 'all') count++;
    if (opTypeFilter !== 'all') count++;
    if (timeframeFilter !== 'all') count++;
    if (customDate) count++;
    return count;
  }, [searchQuery, selectedOperator, opTypeFilter, timeframeFilter, customDate]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedOperator('all');
    setOpTypeFilter('all');
    setTimeframeFilter('all');
    setCustomDate('');
  }, []);

  const handleRefresh = async () => {
    if (!fetchHistory || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchHistory();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Filtraggio intelligente dello storico
  const filteredHistory = useMemo(() => {
    const now = new Date();
    const query = searchQuery.trim().toLowerCase();

    return history.filter(item => {
      // 1. Filtro Tipo Operazione (Flusso)
      if (opTypeFilter !== 'all' && item.tipo_operazione !== opTypeFilter) {
        return false;
      }

      // 2. Filtro Operatore
      if (selectedOperator !== 'all' && item.operatore !== selectedOperator) {
        return false;
      }

      // 3. Filtro Periodo / Giorni
      if (timeframeFilter !== 'all') {
        const itemDate = new Date(item.created_at);
        if (timeframeFilter === 'today') {
          if (!isSameDay(itemDate, now)) return false;
        } else if (timeframeFilter === '7d') {
          const limit7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < limit7d) return false;
        } else if (timeframeFilter === '30d') {
          const limit30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (itemDate < limit30d) return false;
        } else if (timeframeFilter === 'this_month') {
          if (itemDate.getFullYear() !== now.getFullYear() || itemDate.getMonth() !== now.getMonth()) {
            return false;
          }
        } else if (timeframeFilter === 'custom' && customDate) {
          const target = new Date(customDate + 'T00:00:00');
          if (!isSameDay(itemDate, target)) return false;
        }
      }

      // 4. Ricerca Testuale (Descrizione, Codice, Fornitore, Operatore)
      if (query) {
        const desc = buildDesc(item.Utensili_B1).toLowerCase();
        const code = (item.Utensili_B1?.Codice || '').toLowerCase();
        const operator = (item.operatore || '').toLowerCase();
        const supplier = (item.Utensili_B1?.Fornitore || '').toLowerCase();
        const tipologia = (item.Utensili_B1?.Tipologia || '').toLowerCase();

        const matches = 
          desc.includes(query) ||
          code.includes(query) ||
          operator.includes(query) ||
          supplier.includes(query) ||
          tipologia.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [history, searchQuery, selectedOperator, opTypeFilter, timeframeFilter, customDate]);

  // Calcolo KPI sui dati filtrati
  const { totalCarichiQty, totalScarichiQty } = useMemo(() => {
    let carichi = 0;
    let scarichi = 0;
    filteredHistory.forEach(item => {
      const q = Number(item.quantita) || 0;
      if (item.tipo_operazione === 'carico') carichi += q;
      else if (item.tipo_operazione === 'scarico') scarichi += q;
    });
    return { totalCarichiQty: carichi, totalScarichiQty: scarichi };
  }, [filteredHistory]);

  // Definizione Colonne TanStack Table
  const columns = useMemo(() => [
    columnHelper.accessor('created_at', {
      header: 'Data & Ora',
      size: 130,
      meta: { className: 'shrink-0' },
      sortingFn: (rowA, rowB, columnId) => {
        const timeA = new Date(rowA.getValue(columnId) || 0).getTime();
        const timeB = new Date(rowB.getValue(columnId) || 0).getTime();
        return timeA - timeB;
      },
      cell: info => {
        const val = info.getValue();
        return (
          <div className="w-full flex flex-col justify-center pl-3 sm:pl-4">
            <span className="app-caption font-bold text-slate-800 dark:text-slate-200 hidden sm:inline whitespace-nowrap">
              {formatDateLong(val)}
            </span>
            <span className="app-caption font-bold text-slate-800 dark:text-slate-200 inline sm:hidden whitespace-nowrap">
              {formatDateShort(val)}
            </span>
          </div>
        );
      },
    }),

    columnHelper.accessor(row => buildDesc(row.Utensili_B1), {
      id: 'Utensile',
      header: 'Utensile',
      size: 0,
      meta: { isFlex: true },
      sortingFn: (rowA, rowB, columnId) => {
        return String(rowA.getValue(columnId) || '').localeCompare(
          String(rowB.getValue(columnId) || ''),
          undefined,
          { numeric: true }
        );
      },
      cell: info => {
        const item = info.row.original;
        const tool = item.Utensili_B1;
        const desc = info.getValue() || tool?.Tipologia || 'Utensile non disponibile';
        const code = tool?.Codice;

        return (
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 h-full px-2 sm:px-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-blue/20 transition-colors overflow-hidden">
              <ToolIcon type={tool?.Tipologia} size={32} className="opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="min-w-0 flex-1 truncate">
              <p className="app-h3 truncate">{desc}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {code && (
                  <span className="app-caption font-mono text-accent-blue/90 dark:text-accent-blue font-bold truncate">
                    {code}
                  </span>
                )}
                {/* Visualizzazione operatore su mobile all'interno della cella */}
                <span className="app-caption text-slate-400 dark:text-slate-500 inline md:hidden truncate">
                  • {item.operatore}
                </span>
              </div>
            </div>
          </div>
        );
      },
    }),

    columnHelper.accessor('tipo_operazione', {
      header: 'Flusso',
      size: 95,
      meta: { className: 'shrink-0' },
      sortingFn: (rowA, rowB, columnId) => {
        return String(rowA.getValue(columnId) || '').localeCompare(
          String(rowB.getValue(columnId) || '')
        );
      },
      cell: info => {
        const isCarico = info.getValue() === 'carico';
        return (
          <div className="w-full truncate text-center">
            <span className={`badge text-[9px] font-black uppercase px-2.5 py-0.5 ${isCarico ? 'badge-emerald' : 'badge-rose'}`}>
              {isCarico ? 'Carico' : 'Scarico'}
            </span>
          </div>
        );
      },
    }),

    columnHelper.accessor('quantita', {
      header: 'QTY',
      size: 70,
      meta: { className: 'shrink-0' },
      sortingFn: (rowA, rowB, columnId) => {
        const a = Number(rowA.getValue(columnId)) || 0;
        const b = Number(rowB.getValue(columnId)) || 0;
        return a - b;
      },
      cell: info => {
        const isCarico = info.row.original.tipo_operazione === 'carico';
        const qty = info.getValue() || 0;
        return (
          <div className="w-full truncate text-center">
            <span className={`app-qty-sm ${isCarico ? 'text-accent-emerald' : 'text-accent-rose'}`}>
              {isCarico ? `+${qty}` : `-${qty}`}
            </span>
          </div>
        );
      },
    }),

    columnHelper.accessor('operatore', {
      header: 'Operatore',
      size: 140,
      meta: { className: 'hidden md:flex' },
      sortingFn: (rowA, rowB, columnId) => {
        return String(rowA.getValue(columnId) || '').localeCompare(
          String(rowB.getValue(columnId) || '')
        );
      },
      cell: info => {
        const val = info.getValue();
        return (
          <div className="w-full flex items-center justify-start gap-1.5 px-3 truncate">
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <User size={11} className="text-slate-500" />
            </div>
            <span className="app-caption font-bold uppercase truncate text-slate-700 dark:text-slate-300">
              {val || '—'}
            </span>
          </div>
        );
      },
    }),
  ], []);

  const table = useReactTable({
    data: filteredHistory,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const copyLogId = (id) => {
    if (!id) return;
    navigator.clipboard?.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.99 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.15 }}
      className="w-full max-w-[1600px] h-full flex flex-col flex-1 gap-2 md:gap-3 px-2 sm:px-4 min-h-0 pb-3"
    >
      {/* Header Bar */}
      <div className="flex w-full justify-between items-center px-1 shrink-0 pt-1">
        <div>
          <p className="app-overline text-accent-orange drop-shadow-md mb-0.5">Tracciamento Log</p>
          <h2 className="app-h1">Storico Movimenti</h2>
        </div>
        <div className="flex items-center gap-2">
          {fetchHistory && (
            <button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              title="Ricarica storico movimenti"
              className="glass-button p-2 sm:px-3 sm:py-2 rounded-[14px] sm:rounded-[18px] font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-accent-blue" : ""} />
              <span className="hidden sm:inline">Aggiorna</span>
            </button>
          )}
          <button 
            onClick={() => setView('home')} 
            className="glass-panel px-3.5 py-2 sm:px-5 sm:py-2 rounded-[14px] sm:rounded-[18px] font-bold text-xs sm:text-sm text-accent-blue flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft size={16} /> Home
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Omni Search Bar */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[280px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca utensile, codice o operatore..."
              className="w-full pl-8 pr-8 py-2 rounded-[12px] md:rounded-[14px] glass-panel bg-transparent text-xs sm:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-200 text-slate-800 border dark:border-white/10 border-slate-900/10 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Operatore Select */}
          <div className="relative min-w-[130px] sm:min-w-[160px]">
            <Select 
              value={selectedOperator} 
              onValueChange={setSelectedOperator}
            >
              <SelectTrigger className="glass-button rounded-[12px] md:rounded-[14px] px-3 py-1.5 md:py-2 app-overline bg-transparent dark:border-white/10 border-slate-900/10 focus:ring-accent-blue/40 outline-none transition-all w-full text-xs">
                <SelectValue placeholder="Operatore" />
              </SelectTrigger>
              <SelectContent className="glass-panel z-[2000] border-white/10 dark:bg-slate-950/95 bg-white/95 backdrop-blur-xl max-h-60">
                <SelectItem value="all" className="cursor-pointer font-bold opacity-75">Tutti gli Operatori</SelectItem>
                {uniqueOperators.map(op => (
                  <SelectItem key={op} value={op} className="cursor-pointer font-bold">{op}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flusso (Segmented Pills) */}
          <div className="flex items-center p-1 rounded-[12px] md:rounded-[14px] glass-panel dark:border-white/10 border-slate-900/10 shrink-0">
            <button
              onClick={() => setOpTypeFilter('all')}
              className={`px-2.5 py-1 rounded-[8px] md:rounded-[10px] app-overline transition-all text-[10px] sm:text-xs ${
                opTypeFilter === 'all'
                  ? 'bg-slate-200 dark:bg-white/15 text-slate-900 dark:text-slate-100 font-black shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 opacity-70 hover:opacity-100'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setOpTypeFilter('carico')}
              className={`px-2.5 py-1 rounded-[8px] md:rounded-[10px] app-overline transition-all text-[10px] sm:text-xs flex items-center gap-1 ${
                opTypeFilter === 'carico'
                  ? 'bg-emerald-500/20 text-accent-emerald border border-emerald-500/40 font-black shadow-xs'
                  : 'text-slate-500 hover:text-accent-emerald opacity-70 hover:opacity-100'
              }`}
            >
              <ArrowDown size={10} className="text-accent-emerald" /> Carichi
            </button>
            <button
              onClick={() => setOpTypeFilter('scarico')}
              className={`px-2.5 py-1 rounded-[8px] md:rounded-[10px] app-overline transition-all text-[10px] sm:text-xs flex items-center gap-1 ${
                opTypeFilter === 'scarico'
                  ? 'bg-rose-500/20 text-accent-rose border border-rose-500/40 font-black shadow-xs'
                  : 'text-slate-500 hover:text-accent-rose opacity-70 hover:opacity-100'
              }`}
            >
              <ArrowUp size={10} className="text-accent-rose" /> Scarichi
            </button>
          </div>

          {/* Periodo / Giorni Presets */}
          <div className="relative min-w-[130px] sm:min-w-[150px]">
            <Select 
              value={timeframeFilter} 
              onValueChange={(val) => {
                setTimeframeFilter(val);
                if (val !== 'custom') setCustomDate('');
              }}
            >
              <SelectTrigger className="glass-button rounded-[12px] md:rounded-[14px] px-3 py-1.5 md:py-2 app-overline bg-transparent dark:border-white/10 border-slate-900/10 focus:ring-accent-blue/40 outline-none transition-all w-full text-xs">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent className="glass-panel z-[2000] border-white/10 dark:bg-slate-950/95 bg-white/95 backdrop-blur-xl">
                <SelectItem value="all" className="cursor-pointer font-bold opacity-75">Tutti i periodi</SelectItem>
                <SelectItem value="today" className="cursor-pointer font-bold">Oggi</SelectItem>
                <SelectItem value="7d" className="cursor-pointer font-bold">Ultimi 7 giorni</SelectItem>
                <SelectItem value="30d" className="cursor-pointer font-bold">Ultimi 30 giorni</SelectItem>
                <SelectItem value="this_month" className="cursor-pointer font-bold">Questo mese</SelectItem>
                <SelectItem value="custom" className="cursor-pointer font-bold">Data specifica...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Input se selezionato */}
          {timeframeFilter === 'custom' && (
            <div className="relative flex items-center shrink-0">
              <Calendar size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-[12px] glass-panel bg-transparent text-xs font-mono dark:text-slate-200 text-slate-800 border dark:border-white/10 border-slate-900/10 focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
              />
            </div>
          )}

          {/* Reset Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="glass-button rounded-[12px] md:rounded-[14px] px-3 py-1.5 md:py-2 app-overline text-accent-orange bg-accent-orange/10 border border-accent-orange/30 hover:bg-accent-orange/20 transition-all flex items-center gap-1.5 shrink-0"
            >
              <X size={12} /> Reset filtri ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-panel rounded-[20px] md:rounded-[24px] overflow-hidden flex flex-col flex-1 min-h-0 shadow-xl">
        {/* KPI & Count Subheader */}
        <div className="px-4 md:px-6 py-2 border-b dark:border-white/5 border-slate-900/10 flex items-center justify-between bg-white/[0.02] shrink-0">
          <p className="app-overline text-accent-orange">
            {filteredHistory.length} moviment{filteredHistory.length === 1 ? 'o' : 'i'} trovat{filteredHistory.length === 1 ? 'o' : 'i'}
          </p>

          <div className="flex items-center gap-3">
            <span className="app-caption font-bold text-accent-emerald flex items-center gap-1">
              <ArrowDown size={12} /> +{totalCarichiQty} pz
            </span>
            <span className="app-caption font-bold text-accent-rose flex items-center gap-1">
              <ArrowUp size={12} /> -{totalScarichiQty} pz
            </span>
          </div>
        </div>

        {/* TanStack Virtualized Table */}
        <VirtualizedTable
          table={table}
          estimateRowSize={56}
          onRowClick={(item) => setSelectedLog(item)}
          renderRowTrailing={() => (
            <Info size={14} className="text-slate-400 group-hover:text-accent-blue transition-colors" />
          )}
          emptyIcon={FilterX}
          emptyTitle="Nessun movimento trovato"
          emptyDescription={
            activeFiltersCount > 0
              ? "Nessun record corrisponde ai filtri impostati. Prova a reimpostare i filtri."
              : "Non è ancora stato registrato alcun movimento nel magazzino."
          }
          emptyAction={
            activeFiltersCount > 0 ? (
              <button
                onClick={handleResetFilters}
                className="glass-button rounded-xl px-4 py-2 app-overline text-accent-orange bg-accent-orange/10 border border-accent-orange/30 hover:bg-accent-orange/20 transition-all flex items-center gap-1.5 mx-auto"
              >
                <X size={12} /> Resetta tutti i filtri
              </button>
            ) : null
          }
        />
      </div>

      {/* Log Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="glass-panel max-w-md border-white/10 dark:bg-slate-950/95 bg-white/95 backdrop-blur-2xl rounded-2xl p-5 sm:p-6 shadow-2xl">
          <DialogHeader className="flex flex-col gap-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className={`badge text-[10px] font-black uppercase px-2.5 py-0.5 ${selectedLog?.tipo_operazione === 'carico' ? 'badge-emerald' : 'badge-rose'}`}>
                {selectedLog?.tipo_operazione === 'carico' ? 'Movimento di Carico' : 'Movimento di Scarico'}
              </span>
              <span className="app-caption text-slate-400">
                {selectedLog && formatDateLong(selectedLog.created_at)}
              </span>
            </div>
            <DialogTitle className="app-h2 mt-1">Dettaglio Movimento</DialogTitle>
            <DialogDescription className="app-caption text-slate-400">
              Riepilogo completo della transazione registrata nel log di sistema.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="flex flex-col gap-3.5 my-2">
              {/* Tool Card */}
              <div className="flex items-center gap-3 p-3 rounded-xl glass-panel border dark:border-white/10 border-slate-900/10 bg-white/[0.02]">
                <div className="w-12 h-12 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center shrink-0">
                  <ToolIcon type={selectedLog.Utensili_B1?.Tipologia} size={42} className="opacity-90" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="app-h3 truncate">{buildDesc(selectedLog.Utensili_B1)}</p>
                  {selectedLog.Utensili_B1?.Codice && (
                    <span className="badge badge-blue app-caption font-bold px-2 py-0.5 mt-1 inline-block">
                      {selectedLog.Utensili_B1.Codice}
                    </span>
                  )}
                </div>
              </div>

              {/* Transaction Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl glass-panel dark:border-white/5 border-slate-900/10 flex flex-col">
                  <span className="app-overline text-slate-400 mb-1">Quantità</span>
                  <span className={`app-qty-lg ${selectedLog.tipo_operazione === 'carico' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                    {selectedLog.tipo_operazione === 'carico' ? `+${selectedLog.quantita}` : `-${selectedLog.quantita}`}
                  </span>
                </div>

                <div className="p-3 rounded-xl glass-panel dark:border-white/5 border-slate-900/10 flex flex-col">
                  <span className="app-overline text-slate-400 mb-1">Operatore</span>
                  <span className="app-body font-bold text-slate-800 dark:text-slate-200 truncate mt-1">
                    {selectedLog.operatore || 'Admin'}
                  </span>
                </div>

                {selectedLog.Utensili_B1?.Ubicazione && (
                  <div className="p-3 rounded-xl glass-panel dark:border-white/5 border-slate-900/10 flex flex-col">
                    <span className="app-overline text-slate-400 mb-1">Ubicazione</span>
                    <span className="app-body font-bold text-accent-orange truncate mt-1">
                      {selectedLog.Utensili_B1.Ubicazione}
                    </span>
                  </div>
                )}

                {selectedLog.Utensili_B1?.Fornitore && (
                  <div className="p-3 rounded-xl glass-panel dark:border-white/5 border-slate-900/10 flex flex-col">
                    <span className="app-overline text-slate-400 mb-1">Fornitore</span>
                    <span className="app-body font-bold truncate mt-1 text-slate-700 dark:text-slate-300">
                      {selectedLog.Utensili_B1.Fornitore}
                    </span>
                  </div>
                )}
              </div>

              {/* ID Transazione & Audit */}
              <div className="p-2.5 rounded-xl glass-panel dark:border-white/5 border-slate-900/10 flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="app-overline text-slate-500">ID Transazione</span>
                  <span className="app-caption font-mono text-[10px] text-slate-400 truncate">
                    {selectedLog.id}
                  </span>
                </div>
                <button
                  onClick={() => copyLogId(selectedLog.id)}
                  className="glass-button p-1.5 rounded-lg text-slate-400 hover:text-accent-blue transition-colors shrink-0"
                  title="Copia ID"
                >
                  {copiedId ? <Check size={14} className="text-accent-emerald" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
});

export default HistoryView;
