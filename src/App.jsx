import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import {
  Wrench, History, ScanLine, User,
  Plus, X, ArrowLeft, ChevronRight,
  ChevronLeft, Calendar, Camera, Box,
  ArrowUp, ArrowDown, LogOut, CheckCircle2,
  AlertTriangle, Warehouse, Activity, Database,
  List, LayoutGrid, Filter, Search, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

// Helper for date
const getTodayString = () => new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

// --- SUB-COMPONENTS ---

const NavSubItem = memo(({ icon, label, onClick, className = "" }) => (
  <button onClick={onClick} className={`flex items-center justify-between p-4 rounded-[20px] glass-button w-full group ${className}`}>
    <div className="flex items-center gap-3">
      <div className="text-slate-500 group-hover:text-accent-indigo transition-colors">{icon}</div>
      <span className="font-bold uppercase text-[11px] tracking-widest">{label}</span>
    </div>
    <ChevronRight size={14} className="text-slate-600" />
  </button>
));

const Header = memo(({ showUserMenu, setShowUserMenu, setView, fetchHistory, setShowAddModal, today }) => (
  <header className="header-bar flex justify-between items-start z-50">
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="glass-panel px-8 py-4 rounded-[28px] flex items-center gap-4 hover:scale-[1.02] transition-all group"
      >
        <div className="w-10 h-10 bg-accent-indigo/10 rounded-full flex items-center justify-center border border-accent-indigo/20 group-hover:bg-accent-indigo/20 transition-all">
          <User size={18} className="text-accent-indigo" />
        </div>
        <div className="text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">Operatore</p>
          <p className="font-extrabold text-sm tracking-widest text-slate-200">BERC _ADMIN</p>
        </div>
      </button>

      <AnimatePresence>
        {showUserMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="glass-panel absolute top-24 left-0 w-72 p-6 rounded-[32px] z-[100] gap-2 flex flex-col"
          >
            <NavSubItem icon={<History size={16} />} label="Storico Log" onClick={() => { setView('history'); fetchHistory(); setShowUserMenu(false); }} />
            <NavSubItem icon={<Database size={16} />} label="Nuovo Materiale" onClick={() => { setShowAddModal(true); setShowUserMenu(false); }} />
            <div className="h-[1px] bg-white/5 my-3" />
            <NavSubItem icon={<LogOut size={16} />} label="Logout Sistema" onClick={() => { }} className="text-rose-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    <div className="flex flex-col items-end gap-2">
      <div className="glass-panel px-8 py-4 rounded-[28px] border-accent-indigo/10">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-accent-indigo/60" />
          <span className="font-black tracking-[0.3em] text-sm tabular-nums text-slate-300">{today}</span>
        </div>
      </div>
      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 px-4">Warehouse Internal v2.0</p>
    </div>
  </header>
));

const CarouselCard = memo(({ opt, idx, activeIndex, handleSelectOption, setActiveIndex, total }) => {
  let offset = idx - activeIndex;

  if (total > 2) {
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;
  }

  const absOffset = Math.abs(offset);
  if (absOffset > 2) return null;

  const x = offset * 450;
  const scale = 1 - absOffset * 0.25;
  const opacity = 1 - absOffset * 0.45;
  const zIndex = 50 - absOffset;
  const rotateY = offset * 40;
  const blur = absOffset > 0 ? `blur(${absOffset * 1.5}px)` : 'none';

  return (
    <motion.div
      key={`${opt.label}-${idx}`}
      initial={false}
      animate={{
        x, scale,
        opacity: Math.max(0, opacity),
        zIndex, rotateY,
        filter: blur
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 220, mass: 0.6 }}
      onClick={() => absOffset === 0 ? handleSelectOption(opt) : setActiveIndex(idx)}
      className={`carousel-card absolute flex flex-col items-center justify-center select-none ${absOffset === 0 ? 'active' : ''}`}
    >
      <div className={`p-8 rounded-[32px] mb-8 transition-colors ${absOffset === 0 ? 'bg-accent-indigo/15 border border-accent-indigo/30' : 'bg-white/5'}`}>
        <Warehouse size={56} className={absOffset === 0 ? 'text-accent-indigo' : 'text-slate-700'} />
      </div>

      <p className={`text-[10px] font-black tracking-[0.3em] uppercase mb-3 ${absOffset === 0 ? 'text-accent-indigo/70' : 'text-slate-600'}`}>{opt.category}</p>
      <h3 className={`text-3xl font-black uppercase tracking-tighter text-center leading-tight ${absOffset === 0 ? 'text-white' : 'text-slate-500'}`}>
        {opt.label}
      </h3>
    </motion.div>
  );
});

const HistoryView = memo(({ history, setView }) => (
  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-6xl flex flex-col items-center gap-10">
    <div className="flex w-full justify-between items-end px-4">
      <div>
        <p className="text-[10px] font-black tracking-[0.5em] text-accent-indigo uppercase mb-2">Tracciamento Log</p>
        <h2 className="text-5xl font-black uppercase italic tracking-tighter">Storico Movimenti</h2>
      </div>
      <button onClick={() => setView('home')} className="glass-panel px-8 py-4 rounded-[24px] font-bold text-accent-indigo flex items-center gap-3">
        <ArrowLeft size={18} /> Home
      </button>
    </div>

    <div className="glass-panel w-full rounded-[48px] p-2 overflow-hidden max-h-[60vh] flex flex-col">
      <div className="overflow-y-auto scrollbar-hide flex-1 px-4">
        <table className="w-full premium-table border-separate border-spacing-y-4">
          <thead className="sticky top-0 z-10 glass-panel bg-bg-main/95">
            <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">
              <th className="py-6 px-10 rounded-l-[24px]">Data / Ora Operazione</th>
              <th className="py-6 px-6">Identificativo Utensile</th>
              <th className="py-6 px-6">Flusso</th>
              <th className="py-6 px-6">QTY</th>
              <th className="py-6 px-10 rounded-r-[24px]">Operatore</th>
            </tr>
          </thead>
          <tbody>
            {(history || []).map(item => (
              <tr key={item.id} className="glass-panel hover:bg-white/[0.04]">
                <td className="px-10 rounded-l-[24px] text-slate-400 text-sm font-mono">{new Date(item.created_at).toLocaleString('it-IT')}</td>
                <td className="px-6 font-bold text-lg">{item.Utensili_B1?.Tipologia} Ø{item.Utensili_B1?.Diametro} <span className="text-[10px] text-slate-600 block">ID: {item.Utensili_B1?.Codice}</span></td>
                <td className="px-6">
                  <span className={`badge ${item.tipo_operazione === 'carico' ? 'badge-emerald' : 'badge-rose'}`}>{item.tipo_operazione}</span>
                </td>
                <td className={`px-6 font-black text-2xl tabular-nums ${item.tipo_operazione === 'carico' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                  {item.tipo_operazione === 'carico' ? '+' : '-'}{item.quantita}
                </td>
                <td className="px-10 rounded-r-[24px] text-slate-500 font-bold uppercase text-xs tracking-widest">{item.operatore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </motion.div>
));

// --- SCANNER VIEW with live manual search ---
const ScannerView = memo(({ setView, tools, setSelectedTool, setModalQty, setShowMoveModal, setOpType }) => {
  const [manualCode, setManualCode] = useState('');
  const inputRef = useRef(null);

  const filteredTools = useMemo(() => {
    if (!manualCode || manualCode.length < 1) return [];
    const q = manualCode.toLowerCase();
    return (tools || []).filter(t => {
      const codice = (t['Codice'] || '').toLowerCase();
      const desc = (t['Descrizione'] || '').toLowerCase();
      const tipologia = (t['Tipologia'] || '').toLowerCase();
      const serialnumber = (t['SerialNumber'] || '').toLowerCase();
      return codice.includes(q) || desc.includes(q) || tipologia.includes(q) || serialnumber.includes(q);
    }).slice(0, 20);
  }, [manualCode, tools]);

  const isSearchMode = manualCode.length > 0;

  const handleSelectResult = useCallback((tool) => {
    setSelectedTool(tool);
    setModalQty(1);
    setShowMoveModal(true);
  }, [setSelectedTool, setModalQty, setShowMoveModal]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl w-full flex flex-col items-center gap-6">
      <div className="w-full flex justify-between items-center">
        <button onClick={() => setView('home')} className="glass-button p-4 rounded-full text-accent-indigo"><ArrowLeft /></button>
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-accent-cyan mb-2">Laser Recognition</p>
          <h2 className="text-4xl font-extrabold uppercase italic tracking-tighter">Optical Scanner</h2>
        </div>
        <div className="w-12 h-12" />
      </div>

      {/* Scanner area - si riduce in search mode */}
      <AnimatePresence mode="wait">
        {!isSearchMode ? (
          <motion.div
            key="scanner-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel w-full rounded-[48px] overflow-hidden relative border-accent-cyan/20"
            style={{ aspectRatio: '16/9' }}
          >
            <div className="absolute inset-x-0 top-8 flex justify-center z-10">
              <div className="glass-panel px-6 py-2 rounded-full border-accent-cyan/40 bg-accent-cyan/5">
                <p className="text-[10px] font-black text-accent-cyan tracking-widest uppercase flex items-center gap-2">
                  <Activity size={12} className="animate-pulse" /> Scanner Status: Active
                </p>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-accent-cyan/20 rounded-[48px] relative overflow-hidden">
                <div className="scan-line"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent-cyan rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent-cyan rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent-cyan rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent-cyan rounded-br-2xl" />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Input ricerca manuale */}
      <div className="w-full relative">
        <div className="relative flex items-center">
          <Search size={20} className="absolute left-6 text-slate-500 pointer-events-none z-10" />
          <input
            ref={inputRef}
            autoFocus
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="DIGITA CODICE O DESCRIZIONE..."
            className="w-full glass-panel py-5 pl-14 pr-14 rounded-[24px] font-bold text-lg outline-none border-accent-indigo/20 focus:border-accent-indigo/60 transition-all placeholder:text-slate-700 tracking-wider"
          />
          {manualCode && (
            <button onClick={() => setManualCode('')} className="absolute right-5 text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Live search results */}
      <AnimatePresence>
        {isSearchMode && (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full glass-panel rounded-[32px] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-cyan">
                <Search size={12} className="inline mr-2" />
                Ricerca Manuale — {filteredTools.length} risultat{filteredTools.length === 1 ? 'o' : 'i'}
              </p>
            </div>
            <div className="max-h-[45vh] overflow-y-auto custom-scrollbar">
              {filteredTools.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                  <AlertTriangle size={32} className="mb-4 text-slate-700" />
                  <p className="font-bold text-sm uppercase tracking-widest">Nessun risultato trovato</p>
                  <p className="text-xs text-slate-700 mt-2">Prova con un altro codice o descrizione</p>
                </div>
              ) : (
                filteredTools.map((tool, i) => (
                  <motion.div
                    key={tool.id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleSelectResult(tool)}
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.04] cursor-pointer transition-all border-b border-white/[0.03] last:border-b-0 group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 border border-accent-indigo/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-indigo/20 transition-colors">
                        <Activity size={16} className="text-accent-indigo" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">
                          {tool['Tipologia']} {tool['Forma'] ? `— ${tool['Forma']}` : ''} Ø{tool['Diametro']}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {tool['Descrizione'] || `${tool['Tipologia']} ${tool['Forma'] || ''} ${tool['Materiale'] || ''}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="badge badge-indigo text-[9px]">{tool['Codice']}</span>
                      <span className={`badge text-[9px] ${(tool['Quantità'] || 0) > 0 ? 'badge-emerald' : 'badge-rose'}`}>
                        QTY: {tool['Quantità'] || 0}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">{tool['Ubicazione']}</span>
                      <ChevronRight size={14} className="text-slate-700 group-hover:text-accent-indigo transition-colors" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

const MovementModal = memo(({ opType, selectedTool, modalQty, setModalQty, setShowMoveModal, handleMovement }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMoveModal(false)} className="absolute inset-0 bg-black/95 backdrop-blur-3xl"></motion.div>
    <motion.div initial={{ opacity: 0, y: 100, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel w-full max-w-2xl p-16 rounded-[64px] z-[1001] relative flex flex-col gap-10 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-indigo/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="flex justify-between items-center relative z-10">
        <div className="flex flex-col">
          <p className="text-[11px] font-black text-accent-indigo tracking-[0.4em] uppercase mb-1">Operazione</p>
          <h3 className={`text-6xl font-black uppercase tracking-tighter italic ${opType === 'carico' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
            {opType}
          </h3>
        </div>
        <button onClick={() => setShowMoveModal(false)} className="glass-button p-4 rounded-full"><X size={28} /></button>
      </div>

      <div className="glass-panel p-10 rounded-[48px] border-white/5 relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Dettaglio Utensile</p>
            <h4 className="text-4xl font-black text-white leading-tight underline decoration-accent-indigo/30 decoration-4 underline-offset-8">
              {selectedTool?.Tipologia?.toUpperCase()} Ø{selectedTool?.Diametro}
            </h4>
          </div>
          <div className="badge badge-indigo text-[12px] px-6 py-2">MOD. {selectedTool?.Codice}</div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-10 border-t border-white/5 pt-8">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Giacenza Attuale</p>
            <p className="text-5xl font-black text-white tabular-nums">{selectedTool?.['Quantità'] || 0}</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ubicazione</p>
            <p className="text-4xl font-black text-accent-indigo">{selectedTool?.Ubicazione}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-10 relative z-10">
        <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="w-24 h-24 glass-button rounded-full text-4xl font-black">-</button>
        <div className="flex-1 flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Seleziona Quantità</p>
          <input type="number" value={modalQty} onChange={(e) => setModalQty(parseInt(e.target.value) || 1)} className="w-full bg-transparent text-center text-7xl font-black outline-none text-white tabular-nums" />
        </div>
        <button onClick={() => setModalQty(modalQty + 1)} className="w-24 h-24 glass-button rounded-full text-4xl font-black">+</button>
      </div>

      <button
        onClick={handleMovement}
        className={`w-full py-10 rounded-[32px] font-black text-2xl uppercase tracking-[0.3em] shadow-2xl transition-all relative z-10 ${opType === 'carico' ? 'bg-accent-emerald text-slate-950 hover:bg-emerald-400' : 'bg-accent-rose text-white hover:bg-rose-600'}`}
      >
        Confirm _Transaction
      </button>
    </motion.div>
  </div>
));

// --- LEVEL 2: Diametro list (compact) ---
const DiameterList = memo(({ diameters, onSelect }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-3xl glass-panel rounded-[32px] overflow-hidden"
  >
    <div className="px-6 py-4 border-b border-white/5">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-indigo">Seleziona Diametro</p>
    </div>
    <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {diameters.map((d, i) => (
        <motion.button
          key={d}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.02 }}
          onClick={() => onSelect(d)}
          className="glass-button rounded-[16px] px-4 py-4 font-black text-lg text-center hover:bg-accent-indigo/10 hover:border-accent-indigo/30 hover:text-accent-indigo transition-all"
        >
          Ø{d}
        </motion.button>
      ))}
    </div>
  </motion.div>
));

// --- LEVEL 3: Tools grid with filters ---
const EXTRA_FILTER_KEYS = [
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

const ToolsGrid = memo(({ tools: toolsList, onSelectTool }) => {
  const [extraFilters, setExtraFilters] = useState({});

  // Determine which extra filter keys have non-null values in the data
  const availableFilters = useMemo(() => {
    return EXTRA_FILTER_KEYS.filter(({ key }) =>
      toolsList.some(t => t[key] !== null && t[key] !== undefined && t[key] !== '')
    );
  }, [toolsList]);

  // Get unique values for each available filter
  const filterOptions = useMemo(() => {
    const result = {};
    availableFilters.forEach(({ key }) => {
      const vals = [...new Set(toolsList.map(t => t[key]).filter(v => v !== null && v !== undefined && v !== ''))];
      vals.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
      result[key] = vals;
    });
    return result;
  }, [toolsList, availableFilters]);

  // Apply extra filters
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

  const buildDesc = (t) => {
    const parts = [t['Tipologia'], t['Forma'], t['Diametro'] ? `Ø${t['Diametro']}` : null, t['Passo'], t['Tolleranza'], t['Materiale'], t['Rivestimento'], t['Sistema di misura']];
    return parts.filter(Boolean).join(' · ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl flex flex-col gap-4"
    >
      {/* Extra filter dropdowns */}
      {availableFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {availableFilters.map(({ key, label }) => (
            <div key={key} className="relative">
              <select
                value={extraFilters[key] || ''}
                onChange={(e) => setFilter(key, e.target.value)}
                className="glass-button rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider appearance-none cursor-pointer pr-8 bg-transparent text-slate-300 border-white/10 focus:border-accent-indigo/40 outline-none transition-all min-w-[120px]"
              >
                <option value="">{label}</option>
                {(filterOptions[key] || []).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          ))}
          {Object.values(extraFilters).some(v => v) && (
            <button
              onClick={() => setExtraFilters({})}
              className="glass-button rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-accent-rose hover:bg-accent-rose/10 transition-all flex items-center gap-1"
            >
              <X size={12} /> Reset
            </button>
          )}
        </div>
      )}

      {/* Tools list */}
      <div className="glass-panel rounded-[32px] overflow-hidden">
        <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-indigo">
            Utensili — {filtered.length} risultat{filtered.length === 1 ? 'o' : 'i'}
          </p>
        </div>
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600">
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
                onClick={() => onSelectTool(tool)}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.04] cursor-pointer transition-all border-b border-white/[0.03] last:border-b-0 group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-accent-indigo/10 border border-accent-indigo/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-indigo/20 transition-colors">
                    <Activity size={14} className="text-accent-indigo" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-white truncate">{buildDesc(tool)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-[10px] text-slate-500 font-mono min-w-[70px]">{tool['Ubicazione']}</span>
                  <span className={`badge text-[9px] min-w-[50px] text-center ${tool['Stato'] === 'Disponibile' ? 'badge-emerald' : 'badge-rose'}`}>
                    {tool['Stato'] || '—'}
                  </span>
                  <span className={`font-black text-sm tabular-nums min-w-[40px] text-center ${(tool['Quantità'] || 0) > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                    {tool['Quantità'] || 0}
                  </span>
                  <span className="badge badge-indigo text-[9px] min-w-[60px] text-center">{tool['Codice']}</span>
                  <span className="text-[10px] text-slate-600 font-mono min-w-[60px]">{tool['SerialNumber'] || '—'}</span>
                  <ChevronRight size={14} className="text-slate-700 group-hover:text-accent-indigo transition-colors" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
});

// --- DROPDOWN VIEW: compact grid showing tools with dropdown filters ---
const DropdownFilterView = memo(({ tools: allTools, onSelectTool }) => {
  const [filters, setFilters] = useState({});

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
      // Apply other filters to narrow down options
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
    const parts = [t['Tipologia'], t['Forma'], t['Diametro'] ? `Ø${t['Diametro']}` : null, t['Passo'], t['Tolleranza'], t['Materiale'], t['Rivestimento'], t['Sistema di misura']];
    return parts.filter(Boolean).join(' · ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl flex flex-col gap-4"
    >
      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-2 px-2">
        {filterKeys.map(key => (
          <div key={key} className="relative">
            <select
              value={filters[key] || ''}
              onChange={(e) => setFilter(key, e.target.value)}
              className={`glass-button rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider appearance-none cursor-pointer pr-8 bg-transparent border-white/10 focus:border-accent-indigo/40 outline-none transition-all min-w-[120px] ${filters[key] ? 'text-accent-indigo border-accent-indigo/30' : 'text-slate-400'}`}
            >
              <option value="">{LABELS[key] || key}</option>
              {(filterOptions[key] || []).map(val => (
                <option key={val} value={val}>{key === 'Diametro' ? `Ø${val}` : val}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        ))}
        {Object.values(filters).some(v => v) && (
          <button
            onClick={() => setFilters({})}
            className="glass-button rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-accent-rose hover:bg-accent-rose/10 transition-all flex items-center gap-1"
          >
            <X size={12} /> Reset Filtri
          </button>
        )}
      </div>

      {/* Results */}
      <div className="glass-panel rounded-[32px] overflow-hidden">
        <div className="px-6 py-3 border-b border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-indigo">
            {filtered.length} utensil{filtered.length === 1 ? 'e' : 'i'} trovati
          </p>
        </div>
        <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600">
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
                onClick={() => onSelectTool(tool)}
                className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.04] cursor-pointer transition-all border-b border-white/[0.03] last:border-b-0 group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-accent-indigo/10 border border-accent-indigo/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-indigo/20 transition-colors">
                    <Activity size={12} className="text-accent-indigo" />
                  </div>
                  <p className="font-bold text-xs text-white truncate">{buildDesc(tool)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-[10px] text-slate-500 font-mono">{tool['Ubicazione']}</span>
                  <span className={`badge text-[9px] ${tool['Stato'] === 'Disponibile' ? 'badge-emerald' : 'badge-rose'}`}>
                    {tool['Stato'] || '—'}
                  </span>
                  <span className={`font-black text-sm tabular-nums ${(tool['Quantità'] || 0) > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                    {tool['Quantità'] || 0}
                  </span>
                  <span className="badge badge-indigo text-[9px]">{tool['Codice']}</span>
                  <ChevronRight size={14} className="text-slate-700 group-hover:text-accent-indigo transition-colors" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
});


// --- MAIN APP ---

function App() {
  const [view, setView] = useState('home');
  const [tools, setTools] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

  // Cascading navigation state
  const [filterStack, setFilterStack] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  // View mode: 'carousel' or 'dropdown'
  const [viewMode, setViewMode] = useState('carousel');

  const [selectedTool, setSelectedTool] = useState(null);
  const [opType, setOpType] = useState('scarico');
  const [modalQty, setModalQty] = useState(1);

  const today = useMemo(() => getTodayString(), []);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('Utensili_B1').select('*').order('Tipologia', { ascending: true });
    if (!error) setTools(data || []);
    setIsLoading(false);
  };

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('movements_history')
      .select('*, Utensili_B1("Tipologia", "Diametro", "Codice")')
      .order('created_at', { ascending: false });
    if (!error) setHistory(data || []);
  }, []);

  // Filtered tools by current filterStack
  const filteredByStack = useMemo(() => {
    let result = tools;
    filterStack.forEach(f => {
      result = result.filter(t => String(t[f.type]) === String(f.value));
    });
    return result;
  }, [tools, filterStack]);

  // Options for current cascade level
  const options = useMemo(() => {
    if (filterStack.length === 0) {
      // Level 0: Tipologia
      const types = [...new Set(tools.map(t => t['Tipologia']))].filter(Boolean);
      types.sort((a, b) => {
        if (a.toUpperCase().includes('FRESA')) return -1;
        if (b.toUpperCase().includes('FRESA')) return 1;
        return a.localeCompare(b);
      });
      return types.map(v => ({ label: v, type: 'Tipologia', category: 'TIPOLOGIA' }));
    }
    if (filterStack.length === 1) {
      // Level 1: Forma
      const shapes = [...new Set(filteredByStack.map(t => t['Forma']))].filter(Boolean);
      if (shapes.length === 0) {
        // If no Forma, skip directly to Diametro level
        return null;
      }
      shapes.sort((a, b) => a.localeCompare(b));
      return shapes.map(v => ({ label: v, type: 'Forma', category: 'FORMA' }));
    }
    // Level 2+: return null to trigger diameter/tools view
    return null;
  }, [tools, filterStack, filteredByStack]);

  // Level 2: Diameters
  const diameters = useMemo(() => {
    if (filterStack.length < 2) return [];
    const diam = [...new Set(filteredByStack.map(t => t['Diametro']))].filter(Boolean);
    diam.sort((a, b) => {
      const na = parseFloat(a);
      const nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b), undefined, { numeric: true });
    });
    return diam;
  }, [filteredByStack, filterStack]);

  // Level 3: Final tools
  const finalTools = useMemo(() => {
    if (filterStack.length < 3) return [];
    return filteredByStack;
  }, [filteredByStack, filterStack]);

  // Current cascade level
  const currentLevel = filterStack.length;

  const handleSelectOption = useCallback((opt) => {
    setFilterStack(prev => [...prev, { type: opt.type, value: opt.label }]);
    setActiveIndex(0);
  }, []);

  const handleSelectDiameter = useCallback((d) => {
    setFilterStack(prev => [...prev, { type: 'Diametro', value: d }]);
    setActiveIndex(0);
  }, []);

  const handleSelectToolFromGrid = useCallback((tool) => {
    setSelectedTool(tool);
    setOpType('scarico');
    setModalQty(1);
    setShowMoveModal(true);
  }, []);

  const showToastNotification = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleMovement = useCallback(async () => {
    const change = parseInt(modalQty);
    let newQty = (selectedTool['Quantità'] || 0);

    if (opType === 'carico') newQty += change;
    else {
      if (newQty < change) return alert("Quantità insufficiente nel magazzino!");
      newQty -= change;
    }

    const { error: toolErr } = await supabase.from('Utensili_B1').update({ 'Quantità': newQty }).eq('id', selectedTool.id);

    if (!toolErr) {
      setTools(prev => prev.map(t => t.id === selectedTool.id ? { ...t, 'Quantità': newQty } : t));

      await supabase.from('movements_history').insert([{
        tool_id: selectedTool.id,
        tipo_operazione: opType,
        quantita: change,
        operatore: 'Admin'
      }]);
      showToastNotification(`MAGAZZINO AGGIORNATO: ${opType.toUpperCase()}`);
      setShowMoveModal(false);
    }
  }, [modalQty, selectedTool, opType, showToastNotification]);

  // Breadcrumb text
  const breadcrumbText = filterStack.map(f => f.value).join(' / ');

  const renderCarouselHome = () => {
    // Level 2: Diameter selection (compact list)
    if (currentLevel >= 2 && currentLevel < 3) {
      return (
        <DiameterList diameters={diameters} onSelect={handleSelectDiameter} />
      );
    }

    // Level 3: Tools grid
    if (currentLevel >= 3) {
      return (
        <ToolsGrid tools={finalTools} onSelectTool={handleSelectToolFromGrid} />
      );
    }

    // Level 0 or 1: Carousel
    if (!options || options.length === 0) return null;

    return (
      <div className="relative w-full flex flex-col items-center">
        <div className="flex items-center justify-center w-full max-w-7xl h-[380px] relative">
          <button
            onClick={() => setActiveIndex(prev => (prev > 0 ? prev - 1 : (options?.length || 1) - 1))}
            className="absolute left-0 lg:left-10 z-[100] p-6 glass-button rounded-full hover:scale-110 shadow-2xl transition-all"
          ><ChevronLeft size={32} /></button>

          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              const swipeThreshold = 50;
              if (info.offset.x < -swipeThreshold) {
                setActiveIndex(prev => (prev < (options?.length || 0) - 1 ? prev + 1 : 0));
              } else if (info.offset.x > swipeThreshold) {
                setActiveIndex(prev => (prev > 0 ? prev - 1 : (options?.length || 1) - 1));
              }
            }}
            className="relative w-full h-full flex items-center justify-center overflow-visible"
            style={{ perspective: '1200px', cursor: 'grab' }}
            whileTap={{ cursor: 'grabbing' }}
          >
            {options.map((opt, idx) => (
              <CarouselCard
                key={`${opt.label}-${idx}`}
                opt={opt}
                idx={idx}
                activeIndex={activeIndex}
                handleSelectOption={handleSelectOption}
                setActiveIndex={setActiveIndex}
                total={options.length}
              />
            ))}
          </motion.div>

          <button
            onClick={() => setActiveIndex(prev => (prev < (options?.length || 0) - 1 ? prev + 1 : 0))}
            className="absolute right-0 lg:right-10 z-[100] p-6 glass-button rounded-full hover:scale-110 shadow-2xl transition-all"
          ><ChevronRight size={32} /></button>
        </div>

        <div className="flex gap-4 mt-6">
          {options.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all duration-500 ${i === activeIndex ? 'w-12 bg-accent-indigo' : 'w-2 bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col p-8 lg:p-12 relative overflow-hidden text-slate-200">

      <Header
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        setView={setView}
        fetchHistory={fetchHistory}
        setShowAddModal={setShowAddModal}
        today={today}
      />

      <main className="flex-1 flex flex-col items-center justify-center relative mt-4">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full flex flex-col items-center"
            >
              {/* Navigation header + toggle */}
              <div className="flex items-center justify-between w-full max-w-7xl mb-6 px-4">
                <div className="flex items-center gap-4">
                  {filterStack.length > 0 && (
                    <button onClick={() => { setFilterStack(prev => prev.slice(0, -1)); setActiveIndex(0); }} className="p-3 glass-button rounded-full text-accent-indigo hover:scale-110 transition-all">
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-accent-indigo/60 mb-1">Sfoglia Catalogo</p>
                    <h2 className="text-3xl font-extrabold uppercase italic tracking-tighter text-white">
                      {filterStack.length === 0 ? "Categorie" : breadcrumbText}
                    </h2>
                  </div>
                </div>
                {/* Toggle carousel / dropdown */}
                <button
                  onClick={() => setViewMode(prev => prev === 'carousel' ? 'dropdown' : 'carousel')}
                  className="glass-button px-5 py-3 rounded-[18px] flex items-center gap-2 hover:scale-105 transition-all"
                  title={viewMode === 'carousel' ? 'Passa a filtri a tendina' : 'Passa a carosello'}
                >
                  {viewMode === 'carousel' ? <List size={18} className="text-accent-indigo" /> : <LayoutGrid size={18} className="text-accent-indigo" />}
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {viewMode === 'carousel' ? 'Filtri' : 'Carosello'}
                  </span>
                </button>
              </div>

              {/* Content area */}
              <AnimatePresence mode="wait">
                {viewMode === 'carousel' ? (
                  <motion.div key="carousel-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
                    {renderCarouselHome()}
                  </motion.div>
                ) : (
                  <motion.div key="dropdown-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
                    <DropdownFilterView tools={tools} onSelectTool={handleSelectToolFromGrid} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'history' && <HistoryView history={history} setView={setView} />}
          {view === 'scanner' && (
            <ScannerView
              setView={setView}
              tools={tools}
              setSelectedTool={setSelectedTool}
              setModalQty={setModalQty}
              setShowMoveModal={setShowMoveModal}
              setOpType={setOpType}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="action-btn-container">
        <button onClick={() => { setOpType('carico'); setView('scanner'); }} className="action-btn action-btn-carica group">
          <div className="p-4 rounded-2xl bg-accent-emerald/10 border border-accent-emerald/20 group-hover:bg-accent-emerald/20 transition-all mb-1"><ArrowUp size={28} /></div>
          <span className="text-[12px] font-black tracking-widest">CARICO</span>
        </button>

        <button onClick={() => setView('scanner')} className="action-btn action-btn-barcode"><ScanLine size={32} /><span className="text-[10px] font-black tracking-[0.4em]">SCANNER</span></button>

        <button onClick={() => { setOpType('scarico'); setView('scanner'); }} className="action-btn action-btn-scarica group">
          <div className="p-4 rounded-2xl bg-accent-rose/10 border border-accent-rose/20 group-hover:bg-accent-rose/20 transition-all mb-1"><ArrowDown size={28} /></div>
          <span className="text-[12px] font-black tracking-widest">SCARICO</span>
        </button>
      </footer>

      <AnimatePresence>
        {showMoveModal && (
          <MovementModal
            opType={opType}
            selectedTool={selectedTool}
            modalQty={modalQty}
            setModalQty={setModalQty}
            setShowMoveModal={setShowMoveModal}
            handleMovement={handleMovement}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed bottom-32 right-12 z-[2000]">
            <div className="glass-panel p-8 rounded-[32px] border-l-[12px] border-accent-indigo flex items-center gap-6 shadow-2xl">
              <div className="w-12 h-12 bg-accent-indigo/20 rounded-2xl flex items-center justify-center"><CheckCircle2 className="text-accent-indigo" size={32} /></div>
              <div>
                <p className="text-[10px] font-black text-accent-indigo uppercase tracking-[0.5em] mb-1">System Notice</p>
                <p className="font-black text-2xl uppercase tracking-widest text-white">{toast}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
