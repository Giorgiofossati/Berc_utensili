import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, useRef } from 'react';
import {
  ArrowLeft, ChevronRight,
  ChevronLeft, ArrowUp, ArrowDown, X,
  List, LayoutGrid, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

// Lazy load components
const SelectionDrawer = lazy(() => import('./components/SelectionDrawer'));
const Header = lazy(() => import('./components/Header'));
const CategoryGridCard = lazy(() => import('./components/CategoryGridCard'));
const HistoryView = lazy(() => import('./components/HistoryView'));
const ScannerView = lazy(() => import('./components/ScannerView'));
const MovementModal = lazy(() => import('./components/MovementModal'));
const DiameterList = lazy(() => import('./components/DiameterList'));
const ToolsGrid = lazy(() => import('./components/ToolsGrid'));
const DropdownFilterView = lazy(() => import('./components/DropdownFilterView'));
const SearchOverlay = lazy(() => import('./components/SearchOverlay'));
const LoginScreen = lazy(() => import('./components/LoginScreen'));
const AddToolModal = lazy(() => import('./components/AddToolModal'));
const OrderModal = lazy(() => import('./components/OrderModal'));
const OperatorsView = lazy(() => import('./components/OperatorsView'));

// Helper for date
const getTodayString = () => new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

function App() {
  const [view, setView] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [tools, setTools] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [filterStack, setFilterStack] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedToolsIds, setSelectedToolsIds] = useState([]);
  const [opType, setOpType] = useState('scarico');
  const [modalQty, setModalQty] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const handleSetIsSelectionMode = (val) => {
    setIsSelectionMode(val);
    if (!val) {
      setSelectedToolsIds([]);
    }
  };
  const [showSelectionDrawer, setShowSelectionDrawer] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const filteredByStack = useMemo(() => {
    let result = tools;
    filterStack.forEach(f => {
      if (!f.skipped) {
        result = result.filter(t => String(t[f.type]) === String(f.value));
      }
    });
    return result;
  }, [tools, filterStack]);

  const options = useMemo(() => {
    if (filterStack.length === 0) {
      const types = [...new Set(tools.map(t => t['Tipologia']))].filter(Boolean);
      types.sort((a, b) => {
        if (a.toUpperCase().includes('FRESA')) return -1;
        if (b.toUpperCase().includes('FRESA')) return 1;
        return a.localeCompare(b);
      });
      return types.map(v => ({ label: v, type: 'Tipologia', category: 'TIPOLOGIA' }));
    }
    if (filterStack.length === 1) {
      const shapes = [...new Set(filteredByStack.map(t => t['Forma']))].filter(Boolean);
      if (shapes.length === 0) return null;
      shapes.sort((a, b) => a.localeCompare(b));
      return shapes.map(v => ({ label: v, type: 'Forma', category: 'FORMA' }));
    }
    return null;
  }, [tools, filterStack, filteredByStack]);

  const diameters = useMemo(() => {
    if (filterStack.length < 2) return [];
    const diam = [...new Set(filteredByStack.map(t => t['Diametro']))].filter(Boolean);
    diam.sort((a, b) => {
      const na = parseFloat(a);
      const nb = parseFloat(b);
      return (!isNaN(na) && !isNaN(nb)) ? na - nb : String(a).localeCompare(String(b), undefined, { numeric: true });
    });
    return diam;
  }, [filteredByStack, filterStack]);

  const finalTools = useMemo(() => (filterStack.length < 3 ? [] : filteredByStack), [filteredByStack, filterStack]);
  const currentLevel = filterStack.length;

  useEffect(() => {
    if (currentLevel < 3) setIsSelectionMode(false);
  }, [currentLevel]);

  const handleSelectOption = useCallback((opt) => {
    setFilterStack(prev => {
      let nextStack = [...prev, { type: opt.type, value: opt.label }];
      const getFiltered = (stack) => {
        let res = tools;
        stack.forEach(f => { if (!f.skipped) res = res.filter(t => String(t[f.type]) === String(f.value)); });
        return res;
      };
      if (opt.type === 'Tipologia') {
        const shapes = [...new Set(getFiltered(nextStack).map(t => t['Forma']))].filter(Boolean);
        if (shapes.length === 0) nextStack.push({ type: 'Forma', value: 'N/A', skipped: true });
      }
      const lastFilter = nextStack[nextStack.length - 1];
      if (lastFilter.type === 'Forma') {
        const diameters = [...new Set(getFiltered(nextStack).map(t => t['Diametro']))].filter(Boolean);
        if (diameters.length === 0) nextStack.push({ type: 'Diametro', value: 'N/A', skipped: true });
      }
      return nextStack;
    });
  }, [tools]);

  const handleSelectDiameter = useCallback((d) => {
    setFilterStack(prev => [...prev, { type: 'Diametro', value: d }]);
  }, []);

  const resetFilters = useCallback(() => {
    setFilterStack([]);
  }, []);

  const toggleToolSelection = useCallback((id) => {
    setSelectedToolsIds(prev => prev.includes(id) ? prev.filter(toolId => toolId !== id) : [...prev, id]);
  }, []);

  const handleBulkAction = useCallback((type) => {
    setOpType(type);
    setModalQty(1);
    setShowMoveModal(true);
    setIsBulkMode(true);
  }, []);

  const handleSelectToolFromGrid = useCallback((tool) => {
    setSelectedTool(tool);
    setOpType(null); // Wait for user to decide Carico/Scarico in Modal
    setModalQty(1);
    setShowMoveModal(true);
  }, []);

  const showToastNotification = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleMovement = useCallback(async () => {
    const change = parseInt(modalQty);
    const targets = isBulkMode ? tools.filter(t => selectedToolsIds.includes(t.id)) : [selectedTool];
    
    if (opType === 'scarico') {
      const insufficient = targets.filter(t => (t['Quantità'] || 0) < change);
      if (insufficient.length > 0) return alert(`Quantità insufficiente per: ${insufficient.map(t => t.Tipologia).join(', ')}`);
    }

    // --- OPTIMISTIC UPDATE ---
    const previousTools = [...tools];
    setTools(prev => prev.map(t => {
      if (targets.some(target => target.id === t.id)) {
        return { ...t, 'Quantità': opType === 'carico' ? (t['Quantità'] || 0) + change : (t['Quantità'] || 0) - change };
      }
      return t;
    }));

    setIsLoading(true);
    try {
      const { error: rpcErr } = await supabase.rpc('handle_bulk_movement', {
        p_tool_ids: targets.map(t => t.id),
        p_op_type: opType,
        p_change: change,
        p_operator: currentUser ? `${currentUser.nome} ${currentUser.cognome}` : 'Admin'
      });

      if (rpcErr) throw rpcErr;

      showToastNotification(`MAGAZZINO AGGIORNATO: ${opType.toUpperCase()} (${targets.length} articoli)`);
      setShowMoveModal(false);
      setSelectedToolsIds([]);
      setIsBulkMode(false);
    } catch (err) { 
      console.error(err);
      // ROLLBACK on error
      setTools(previousTools);
      alert('Errore durante l\'aggiornamento: ' + (err.message || err));
    } finally { 
      setIsLoading(false); 
      fetchTools(); // Final sync
    }
  }, [modalQty, selectedTool, opType, showToastNotification, isBulkMode, selectedToolsIds, tools, fetchTools]);

  const breadcrumbText = filterStack.filter(f => !f.skipped).map(f => f.value).join(' / ');

  const renderGridHome = () => {
    if (currentLevel >= 2 && currentLevel < 3) return <DiameterList diameters={diameters} onSelect={handleSelectDiameter} />;
    if (currentLevel >= 3) return (
      <ToolsGrid tools={finalTools} onSelectTool={handleSelectToolFromGrid} isMobile={isMobile} 
        selectedIds={selectedToolsIds} onToggleSelect={toggleToolSelection} isSelectionMode={isSelectionMode} setIsSelectionMode={handleSetIsSelectionMode} />
    );
    if (!options || options.length === 0) return null;

    const getGridColsClass = (count, isMobileScreen) => {
      if (count <= 1) return 'grid-cols-1';
      if (isMobileScreen) {
        if (count % 2 === 0) return 'grid-cols-2';
        if (count % 3 === 0) return 'grid-cols-3';
        return 'grid-cols-2';
      } else {
        if (count % 4 === 0) return 'grid-cols-4';
        if (count % 3 === 0) return 'grid-cols-3';
        if (count % 5 === 0) return 'grid-cols-5';
        if (count % 2 === 0) return 'grid-cols-2';
        return 'grid-cols-3';
      }
    };

    const colsClass = getGridColsClass(options.length, isMobile);

    return (
      <div className="w-full max-w-7xl px-4 my-auto pb-10 md:pb-12">
        <div className={`grid ${colsClass} gap-4 md:gap-6 w-full justify-center`}>
          {options.map((opt, idx) => (
            <CategoryGridCard 
              key={`${opt.label}-${idx}`} 
              opt={opt} 
              idx={idx} 
              handleSelectOption={handleSelectOption} 
              isMobile={isMobile} 
            />
          ))}
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return (
      <Suspense fallback={<div className="h-screen w-screen dark:bg-slate-950 bg-slate-50 flex items-center justify-center text-accent-blue"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
        <LoginScreen onLogin={setCurrentUser} />
      </Suspense>
    );
  }

  return (
    <div ref={mainRef} className="h-screen w-screen flex flex-col p-3 md:p-5 lg:p-6 relative overflow-y-auto overflow-x-hidden dark:text-slate-200 text-slate-800 custom-scrollbar">
      <Suspense fallback={<div className="h-10 animate-pulse dark:bg-white/5 bg-slate-900/5 rounded-xl" />}>
        <Header 
          currentUser={currentUser}
          onLogout={() => setCurrentUser(null)}
          showUserMenu={showUserMenu} 
          setShowUserMenu={setShowUserMenu} 
          setView={setView} 
          fetchHistory={fetchHistory} 
          setShowAddModal={setShowAddModal} 
          today={today}
          onOpenSearch={() => setShowSearchOverlay(true)}
        />
      </Suspense>

      <main className="flex-1 w-full flex flex-col items-center justify-start relative mt-2 md:mt-4">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full flex flex-col items-center">
                <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-[1600px] mb-2 md:mb-6 px-4 gap-4 md:gap-6 shrink-0">
                  <div className="flex items-center w-10 md:w-12 shrink-0">
                    {filterStack.length > 0 && (
                      <button onClick={() => { setFilterStack(prev => {
                          let nextStack = [...prev];
                          while (nextStack.length > 0) {
                            const popped = nextStack.pop();
                            if (!popped.skipped) break;
                          }
                          return nextStack;
                        }); 
                      }} className="p-2.5 md:p-3 glass-button rounded-full text-accent-orange hover:scale-110 transition-all flex-shrink-0"
                      ><ArrowLeft size={isMobile ? 18 : 20} /></button>
                    )}
                  </div>
                  <div className="flex flex-col items-center text-center flex-1 min-w-0">
                    <p className="text-[8px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.6em] text-accent-orange mb-0.5 md:mb-1 opacity-80">Sfoglia Catalogo</p>
                    <h2 className="text-base sm:text-lg md:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter dark:text-white text-slate-900 px-2 leading-tight truncate w-full">
                      {filterStack.length === 0 ? "Categorie" : breadcrumbText}
                    </h2>
                  </div>
                  <div className="hidden md:flex items-center justify-end shrink-0 gap-4">
                    {/* Desktop action toolbar */}
                    <div className="flex items-center gap-2.5">
                      {selectedToolsIds.length > 0 ? (
                        <>
                          <button onClick={() => handleBulkAction('carico')} className="action-btn action-btn-carica py-2.5 px-4 flex items-center gap-2">
                            <ArrowUp size={16} />
                            <span className="text-xs font-black tracking-wider">BULK DEPOSITA ({selectedToolsIds.length})</span>
                          </button>
                          <button onClick={() => handleBulkAction('scarico')} className="action-btn action-btn-scarica py-2.5 px-4 flex items-center gap-2">
                            <ArrowDown size={16} />
                            <span className="text-xs font-black tracking-wider">BULK PRELEVA ({selectedToolsIds.length})</span>
                          </button>
                          <button onClick={() => setSelectedToolsIds([])} className="glass-button p-2.5 rounded-xl text-rose-400 hover:bg-rose-400/10" title="Deseleziona tutto">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setOpType('carico'); setView('scanner'); }} className="action-btn action-btn-carica py-2.5 px-4 flex items-center gap-2">
                            <ArrowUp size={16} />
                            <span className="text-xs font-black tracking-wider">DEPOSITA</span>
                          </button>
                          <button onClick={() => { setOpType('scarico'); setView('scanner'); }} className="action-btn action-btn-scarica py-2.5 px-4 flex items-center gap-2">
                            <ArrowDown size={16} />
                            <span className="text-xs font-black tracking-wider">PRELEVA</span>
                          </button>
                          {currentUser?.ruolo === 'Admin' && (
                            <button onClick={() => setShowAddModal(true)} className="glass-button px-4 py-2.5 rounded-xl text-accent-blue hover:bg-accent-blue/10 flex items-center gap-2 border border-accent-blue/20">
                              <span className="text-xs font-black uppercase tracking-widest">+ Nuovo Articolo</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {filterStack.length > 0 && (
                      <button onClick={resetFilters} className="glass-button px-6 py-4 rounded-[24px] flex items-center gap-3 text-accent-orange border-accent-orange/20"><X size={18} /><span className="text-xs font-black uppercase tracking-widest">Cancella Filtri</span></button>
                    )}
                    {currentLevel < 3 && (
                      <button onClick={() => setViewMode(prev => prev === 'grid' ? 'dropdown' : 'grid')} className="glass-button px-8 py-4 rounded-[24px] flex items-center gap-3" title={viewMode === 'grid' ? 'Passa a elenco' : 'Passa a griglia'}>
                        {viewMode === 'grid' ? <List size={22} className="text-accent-blue" /> : <LayoutGrid size={22} className="text-accent-blue" />}
                        <span className="text-xs font-black uppercase tracking-widest dark:text-slate-200 text-slate-800">{viewMode === 'grid' ? 'Elenco' : 'Griglia'}</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full flex flex-col items-center justify-start min-h-0">
                  {/* Mobile action toolbar */}
                  <div className="md:hidden flex items-center justify-center gap-2 mb-4 px-4 w-full flex-wrap">
                    {selectedToolsIds.length > 0 ? (
                      <>
                        <button onClick={() => handleBulkAction('carico')} className="action-btn action-btn-carica py-2 px-3.5 flex items-center gap-1.5 text-[10px]">
                          <ArrowUp size={14} />
                          <span className="font-black">BULK DEPOSITA ({selectedToolsIds.length})</span>
                        </button>
                        <button onClick={() => handleBulkAction('scarico')} className="action-btn action-btn-scarica py-2 px-3.5 flex items-center gap-1.5 text-[10px]">
                          <ArrowDown size={14} />
                          <span className="font-black">BULK PRELEVA ({selectedToolsIds.length})</span>
                        </button>
                        <button onClick={() => setSelectedToolsIds([])} className="glass-button p-2 rounded-xl text-rose-400 hover:bg-rose-400/10">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setOpType('carico'); setView('scanner'); }} className="action-btn action-btn-carica py-2 px-3.5 flex items-center gap-1.5 text-[10px]">
                          <ArrowUp size={14} />
                          <span className="font-black">DEPOSITA</span>
                        </button>
                        <button onClick={() => { setOpType('scarico'); setView('scanner'); }} className="action-btn action-btn-scarica py-2 px-3.5 flex items-center gap-1.5 text-[10px]">
                          <ArrowDown size={14} />
                          <span className="font-black">PRELEVA</span>
                        </button>
                        {currentUser?.ruolo === 'Admin' && (
                          <button onClick={() => setShowAddModal(true)} className="glass-button py-2 px-3.5 rounded-xl text-accent-blue flex items-center gap-1.5 text-[10px] border border-accent-blue/20">
                            <span className="font-black">+ NUOVO ART.</span>
                          </button>
                        )}
                      </>
                    )}

                    {filterStack.length > 0 && (
                      <button onClick={resetFilters} className="glass-button px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-accent-orange border-accent-orange/20 text-[10px]">
                        <X size={14} />
                        <span className="font-black uppercase tracking-wider">RESET FILTRI</span>
                      </button>
                    )}

                    {currentLevel < 3 && (
                      <button onClick={() => setViewMode(prev => prev === 'grid' ? 'dropdown' : 'grid')} className="glass-button px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-[10px]">
                        {viewMode === 'grid' ? <List size={14} className="text-accent-blue" /> : <LayoutGrid size={14} className="text-accent-blue" />}
                        <span className="font-black uppercase tracking-wider">{viewMode === 'grid' ? 'Elenco' : 'Griglia'}</span>
                      </button>
                    )}
                  </div>
                  <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                    <AnimatePresence mode="wait">
                      {viewMode === 'grid' ? (
                        <motion.div key="grid-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">{renderGridHome()}</motion.div>
                      ) : (
                        <motion.div key="dropdown-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center py-4">
                          <DropdownFilterView tools={tools} onSelectTool={handleSelectToolFromGrid} isMobile={isMobile} initialFilters={Object.fromEntries(filterStack.map(f => [f.type, f.value]))}
                            onFilterChange={(newFilters) => {
                              const newStack = Object.entries(newFilters).filter(([_, v]) => v).map(([k, v]) => ({ type: k, value: v }));
                              setFilterStack(newStack);
                            }}
                            selectedIds={selectedToolsIds} onToggleSelect={toggleToolSelection} isSelectionMode={isSelectionMode} setIsSelectionMode={handleSetIsSelectionMode} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Suspense>
                </div>
                <AnimatePresence>
                  {selectedToolsIds.length > 0 && (
                    <motion.button initial={{ opacity: 0, scale: 0.8, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 20 }}
                      onClick={() => setShowSelectionDrawer(true)} className="fixed right-6 bottom-8 md:bottom-10 z-[100] glass-panel bg-accent-blue/20 border-accent-blue/40 px-6 py-4 rounded-full flex items-center gap-4 group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-accent-blue/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                      <div className="relative flex items-center gap-3"><div className="bg-accent-blue text-slate-950 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center">{selectedToolsIds.length}</div><span className="text-[10px] font-black uppercase tracking-[0.2em] dark:text-white text-slate-900">Utensili Selezionati</span></div>
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
            {view === 'history' && <HistoryView key="history" history={history} setView={setView} />}
            {view === 'scanner' && <ScannerView key="scanner" setView={setView} tools={tools} setSelectedTool={setSelectedTool} setModalQty={setModalQty} setShowMoveModal={setShowMoveModal} setOpType={setOpType} isMobile={isMobile} />}
            {view === 'operators' && <OperatorsView key="operators" setView={setView} currentUser={currentUser} setCurrentUser={setCurrentUser} />}
          </AnimatePresence>
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <AnimatePresence>
          {showSelectionDrawer && (
            <>
              <motion.div key="drawer-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSelectionDrawer(false)} className="fixed inset-0 dark:bg-slate-950/60 bg-slate-50/60 backdrop-blur-sm z-[1999]" />
              <SelectionDrawer key="drawer" selectedIds={selectedToolsIds} tools={tools} onToggleSelect={toggleToolSelection} onBulkAction={(type) => { setShowSelectionDrawer(false); handleBulkAction(type); }} onClose={() => setShowSelectionDrawer(false)} setSelectedToolsIds={setSelectedToolsIds} />
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showMoveModal && <MovementModal key="move-modal" opType={opType} setOpType={setOpType} selectedTool={isBulkMode ? selectedToolsIds.length : selectedTool} modalQty={modalQty} setModalQty={setModalQty} setShowMoveModal={(val) => { setShowMoveModal(val); if (!val) setIsBulkMode(false); }} handleMovement={handleMovement} isBulkMode={isBulkMode} onOpenOrder={() => setShowOrderModal(true)} currentUser={currentUser} />}
          {showAddModal && <AddToolModal key="add-modal" onClose={() => setShowAddModal(false)} onToolAdded={fetchTools} currentUser={currentUser} />}
          {showOrderModal && <OrderModal key="order-modal" tool={selectedTool} onClose={() => setShowOrderModal(false)} currentUser={currentUser} />}
        </AnimatePresence>
      </Suspense>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed bottom-40 md:bottom-32 right-6 md:right-12 z-[2000]">
            <div className="glass-panel p-8 rounded-[32px] border-l-[12px] border-accent-blue flex items-center gap-6 shadow-2xl">
              <div className="w-12 h-12 bg-accent-blue/20 rounded-2xl flex items-center justify-center"><CheckCircle2 className="text-accent-blue" size={32} /></div>
              <div><p className="text-[10px] font-black text-accent-orange uppercase drop-shadow-md tracking-[0.5em] mb-1">System Notice</p><p className="font-black text-2xl uppercase tracking-widest dark:text-white text-slate-900">{toast}</p></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <SearchOverlay 
          isOpen={showSearchOverlay} 
          onClose={() => setShowSearchOverlay(false)} 
          tools={tools} 
          onSelectTool={handleSelectToolFromGrid}
          isMobile={isMobile}
        />
      </Suspense>
    </div>
  );
}

export default App;
