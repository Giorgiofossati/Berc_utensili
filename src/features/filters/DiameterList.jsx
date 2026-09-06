import React, { memo, useState, useMemo } from 'react';
import { Search, X, SearchX } from 'lucide-react';
import { formatDiameter, isNumericDiameter } from '../../lib/toolUtils';

const DiameterList = memo(({ diameters = [], tools = [], onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Build a fast lookup map for cumulative inventory stock and tool count
  const statsMap = useMemo(() => {
    const map = new Map();
    if (!tools || !Array.isArray(tools)) return map;
    for (const tool of tools) {
      const dKey = String(tool['Diametro'] ?? '').trim();
      if (!dKey) continue;
      const existing = map.get(dKey) || { totalQty: 0, count: 0 };
      existing.totalQty += Number(tool['Quantità']) || 0;
      existing.count += 1;
      map.set(dKey, existing);
    }
    return map;
  }, [tools]);

  // Aggregate diameter cards with formatted label, numeric detection, and stock
  const items = useMemo(() => {
    if (!diameters || !Array.isArray(diameters)) return [];
    return diameters.map((d) => {
      const dKey = String(d ?? '').trim();
      const stat = statsMap.get(dKey) || { totalQty: 0, count: 0 };
      const isNum = isNumericDiameter(d);
      const formatted = formatDiameter(d);
      return {
        rawDiameter: d,
        formattedLabel: formatted,
        isNumeric: isNum,
        totalQty: stat.totalQty,
        count: stat.count,
      };
    });
  }, [diameters, statsMap]);

  // Filter items in real time via micro-search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const raw = String(item.rawDiameter).toLowerCase();
      const formatted = item.formattedLabel.toLowerCase();
      return raw.includes(q) || formatted.includes(q);
    });
  }, [items, searchQuery]);

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl max-h-[75vh] sm:max-h-[78vh] flex flex-col glass-panel rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl transition-all duration-300">
      {/* Header bar: Titles, Count chip and Micro-Search input */}
      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b dark:border-white/5 border-slate-900/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0 bg-slate-100/40 dark:bg-slate-900/40">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <p className="app-overline text-accent-blue">Livello 2 · Seleziona Diametro / Sigla</p>
            <span className="app-caption px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20 font-bold">
              {filteredItems.length} {filteredItems.length === 1 ? 'misura' : 'misure'}
            </span>
          </div>
          <h2 className="app-h3 text-slate-800 dark:text-slate-100 hidden sm:block mt-0.5">
            Scegli la misura o il codice inserto desiderato
          </h2>
        </div>

        {/* Micro-Search Bar */}
        <div className="relative flex items-center w-full sm:w-auto">
          <div className="flex items-center w-full sm:w-60 md:w-72 px-3 py-1.5 rounded-xl glass-input bg-slate-100/80 dark:bg-slate-900/60 border border-slate-900/10 dark:border-white/10 focus-within:border-accent-blue/60 focus-within:ring-1 focus-within:ring-accent-blue/60 transition-all">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca misura o sigla..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              aria-label="Cerca diametro o codice inserto"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors ml-1 cursor-pointer"
                aria-label="Cancella ricerca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fluid Intelligent Card Grid with safe scroll padding */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-5 pb-8">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-3 shadow-inner">
              <SearchX className="w-6 h-6 text-slate-400" />
            </div>
            <p className="app-h3 text-slate-700 dark:text-slate-300">Nessuna misura trovata</p>
            <p className="app-body text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm">
              Nessun diametro o codice corrisponde a &ldquo;<span className="font-semibold text-slate-700 dark:text-slate-200">{searchQuery}</span>&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-1.5 rounded-xl text-xs font-semibold text-accent-blue bg-accent-blue/10 border border-accent-blue/20 hover:bg-accent-blue/20 active:scale-95 transition-all cursor-pointer"
            >
              Azzera ricerca
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(145px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5 sm:gap-3">
            {filteredItems.map((item) => (
              <button
                key={item.rawDiameter}
                type="button"
                onClick={() => onSelect(item.rawDiameter)}
                className="glass-button group flex flex-col justify-between p-3 sm:p-3.5 rounded-[16px] sm:rounded-[18px] border dark:border-white/10 border-slate-900/10 hover:border-accent-blue/50 dark:hover:border-accent-blue/50 hover:bg-accent-blue/5 dark:hover:bg-accent-blue/10 hover:shadow-[0_8px_24px_rgba(14,165,233,0.15)] active:scale-[0.97] transition-all duration-200 text-left focus-visible:ring-2 focus-visible:ring-accent-blue outline-none select-none min-h-[82px] sm:min-h-[88px] cursor-pointer"
              >
                {/* Top: Measure / Code Label */}
                <div className="w-full flex items-start justify-between gap-1">
                  <span
                    className="app-h3 font-black text-slate-900 dark:text-white group-hover:text-accent-blue transition-colors truncate max-w-full leading-tight"
                    title={item.formattedLabel}
                  >
                    {item.formattedLabel}
                  </span>
                  {!item.isNumeric && (
                    <span className="app-overline text-[8px] text-accent-orange bg-accent-orange/10 px-1 py-0.5 rounded border border-accent-orange/20 shrink-0 ml-1">
                      SIGLA
                    </span>
                  )}
                </div>

                {/* Bottom: Inventory Stock & Variant Count */}
                <div className="w-full flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-900/5 dark:border-white/5">
                  <span className="app-caption text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {item.count > 1 ? `${item.count} art.` : 'Giacenza'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black tabular-nums border shrink-0 ${
                      item.totalQty > 0
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {item.totalQty > 0 ? `${item.totalQty} pz` : '0 pz'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom informational footer bar */}
      <div className="px-4 sm:px-6 py-2 border-t dark:border-white/5 border-slate-900/5 flex items-center justify-between text-slate-500 dark:text-slate-400 shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
        <span className="app-caption text-[10px]">
          💡 Clicca su una tessera per visualizzare l&apos;elenco utensili corrispondente
        </span>
        {searchQuery && (
          <span className="app-caption text-[10px] text-accent-blue font-semibold">
            Filtro attivo: &ldquo;{searchQuery}&rdquo;
          </span>
        )}
      </div>
    </div>
  );
});

DiameterList.displayName = 'DiameterList';

export default DiameterList;
