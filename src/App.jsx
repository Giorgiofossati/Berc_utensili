import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import {
  ArrowLeft, ChevronRight,
  ChevronLeft, ArrowUp, ArrowDown, X,
  List, LayoutGrid, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './lib/AuthContext';

// Lazy load components
const SelectionDrawer = lazy(() => import('./components/SelectionDrawer'));
const Header = lazy(() => import('./components/Header'));
const CarouselCard = lazy(() => import('./components/CarouselCard'));
const HistoryView = lazy(() => import('./components/HistoryView'));
const ScannerView = lazy(() => import('./components/ScannerView'));
const MovementModal = lazy(() => import('./components/MovementModal'));
const DiameterList = lazy(() => import('./components/DiameterList'));
const ToolsGrid = lazy(() => import('./components/ToolsGrid'));
const DropdownFilterView = lazy(() => import('./components/DropdownFilterView'));
const SearchOverlay = lazy(() => import('./components/SearchOverlay'));
const UserSelectionModal = lazy(() => import('./components/UserSelectionModal'));
const ToolDetailCard = lazy(() => import('./components/ToolDetailCard'));

// Helper for date
const getTodayString = () => new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

function AppContent() {
  const { currentUser, logout } = useAuth();
  const [view, setView] = useState('home');
  const [tools, setTools] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDetailCard, setShowDetailCard] = useState(false);

  const [filterStack, setFilterStack] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState('carousel');

  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedToolsIds, setSelectedToolsIds] = useState([]);
  const [opType, setOpType] = useState('scarico');
  const [modalQty, setModalQty] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showSelectionDrawer, setShowSelectionDrawer] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  // IDLE TIMEOUT: 120 secondi
  useEffect(() => {
    if (!currentUser) return;

    let timeoutId;
    const IDLE_TIME = 120000; // 120 secondi

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Sessione scaduta per inattività");
        logout();
        setView('home');
        resetFilters();
      }, IDLE_TIME);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [currentUser, logout]);

  useEffect(() => {
    if (!currentUser) {
      setShowUserModal(true);
    } else {
      setShowUserModal(false);
    }
  }, [currentUser]);

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
      if (shapes.length === 0) return []; // Return empty array instead of null
      shapes.sort((a, b) => a.localeCompare(b));
      return shapes.map(v => ({ label: v, type: 'Forma', category: 'FORMA' }));
    }
    return [];
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

    // Auto-skip levels if no options are available
    if (currentLevel === 1) {
      const shapes = [...new Set(filteredByStack.map(t => t['Forma']))].filter(Boolean);
      if (shapes.length === 0) {
        setFilterStack(prev => [...prev, { type: 'Forma', value: 'N/A', skipped: true }]);
      }
    } else if (currentLevel === 2) {
      const diams = [...new Set(filteredByStack.map(t => t['Diametro']))].filter(Boolean);
      if (diams.length === 0) {
        setFilterStack(prev => [...prev, { type: 'Diametro', value: 'N/A', skipped: true }]);
      }
    }
  }, [currentLevel, filteredByStack]);

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
    setActiveIndex(0);
  }, [tools]);

  const handleSelectDiameter = useCallback((d) => {
    setFilterStack(prev => [...prev, { type: 'Diametro', value: d }]);
    setActiveIndex(0);
  }, []);

  const resetFilters = useCallback(() => {
    setFilterStack([]);
    setActiveIndex(0);
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
    setOpType('scarico');
    setModalQty(1);
    setShowDetailCard(true);
  }, []);

  const showToastNotification = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleMovement = useCallback(async (forcedType) => {
    const activeType = forcedType || opType;
    const change = parseInt(modalQty) || 1;
    const targets = isBulkMode 
      ? tools.filter(t => selectedToolsIds.includes(t.id)) 
      : (selectedTool ? [selectedTool] : []);
    
    if (targets.length === 0) {
      console.warn("Nessun articolo selezionato per il movimento");
      return;
    }

    if (activeType === 'scarico') {
      const insufficient = targets.filter(t => (t ? (t['Quantità'] || 0) : 0) < change);
      if (insufficient.length > 0) {
        alert(`Quantità insufficiente per: ${insufficient.map(t => t?.Tipologia || 'Articolo').join(', ')}`);
        return;
      }
    }

    // --- OPTIMISTIC UPDATE ---
    const previousTools = [...tools];
    setTools(prev => prev.map(t => {
      if (targets.some(target => target.id === t.id)) {
        return { ...t, 'Quantità': activeType === 'carico' ? (t['Quantità'] || 0) + change : (t['Quantità'] || 0) - change };
      }
      return t;
    }));

    setIsLoading(true);
    try {
      const { error: rpcErr } = await supabase.rpc('handle_bulk_movement', {
        p_tool_ids: targets.map(t => t.id),
        p_op_type: activeType,
        p_change: change,
        p_operator: currentUser ? `${currentUser.nome} ${currentUser.cognome}` : 'System'
      });

      if (rpcErr) throw rpcErr;

      showToastNotification(`MAGAZZINO AGGIORNATO: ${activeType.toUpperCase()} (${targets.length} articoli)`);
      setShowMoveModal(false);
      setShowDetailCard(false);
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
  }, [modalQty, selectedTool, opType, showToastNotification, isBulkMode, selectedToolsIds, tools, fetchTools, currentUser]);

  const breadcrumbText = filterStack.filter(f => !f.skipped).map(f => f.value).join(' / ');

  const renderCarouselHome = () => {
    if (currentLevel === 2) return <DiameterList diameters={diameters} onSelect={handleSelectDiameter} />;
    if (currentLevel >= 3) return (
      <ToolsGrid tools={finalTools} onSelectTool={handleSelectToolFromGrid} isMobile={isMobile} 
        selectedIds={selectedToolsIds} onToggleSelect={toggleToolSelection} isSelectionMode={isSelectionMode} setIsSelectionMode={setIsSelectionMode} />
    );
    
    if (!options || options.length === 0) {
      if (isLoading) return <div className="h-40 flex items-center justify-center"><div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>;
      return (
        <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-4">
          <AlertTriangle size={32} className="opacity-20" />
          <p className="text-xs font-black uppercase tracking-widest">Nessuna opzione disponibile</p>
          <button onClick={resetFilters} className="text-[10px] text-accent-orange underline uppercase">Torna alle Categorie</button>
        </div>
      );
    }

    return (
      <div className="relative w-full flex flex-col items-center my-auto">
        <div className={`flex items-center justify-center w-full max-w-7xl relative overflow-visible ${isMobile ? 'h-[300px]' : 'h-[380px]'}`}>
          <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.1}
            onDragEnd={(_, info) => {
              const swipeThreshold = 50;
              if (info.offset.x < -swipeThreshold) setActiveIndex(prev => (prev < (options?.length || 0) - 1 ? prev + 1 : 0));
              else if (info.offset.x > swipeThreshold) setActiveIndex(prev => (prev > 0 ? prev - 1 : (options?.length || 1) - 1));
            }}
            className="relative w-full h-full flex items-center justify-center overflow-visible"
            style={{ perspective: '1200px', cursor: 'grab' }} whileTap={{ cursor: 'grabbing' }}
          >
            {options.map((opt, idx) => (
              <CarouselCard key={`${opt.label}-${idx}`} opt={opt} idx={idx} activeIndex={activeIndex} handleSelectOption={handleSelectOption} 
                setActiveIndex={setActiveIndex} total={options.length} isMobile={isMobile} />
            ))}
          </motion.div>
        </div>
        <div className="flex items-center gap-10 mt-8 md:mt-12">
          <button onClick={() => setActiveIndex(prev => (prev > 0 ? prev - 1 : (options?.length || 1) - 1))} className="absolute left-0 lg:left-10 z-[100] p-6 glass-button rounded-full text-accent-orange"><ChevronLeft size={32} /></button>
          <div className="flex gap-3">
            {options.map((_, i) => (
              <button key={i} onClick={() => setActiveIndex(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeIndex ? 'w-10 bg-accent-orange' : 'w-1.5 bg-white/10 hover:bg-white/30'}`} />
            ))}
          </div>
          <button onClick={() => setActiveIndex(prev => (prev < (options?.length || 0) - 1 ? prev + 1 : 0))} className="absolute right-0 lg:right-10 z-[100] p-6 glass-button rounded-full text-accent-orange"><ChevronRight size={32} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col p-3 md:p-5 lg:p-6 relative overflow-y-auto overflow-x-hidden text-slate-200 custom-scrollbar">
      <Suspense fallback={<div className="h-10 animate-pulse bg-white/5 rounded-xl" />}>
        <Header 
          showUserMenu={showUserMenu} 
          setShowUserMenu={setShowUserMenu} 
          setView={setView} 
          fetchHistory={fetchHistory} 
          setShowAddModal={setShowAddModal} 
          today={today}
          onOpenSearch={() => setShowSearchOverlay(true)}
        />
      </Suspense>

      <main className="flex-1 flex flex-col items-center justify-start relative mt-2 md:mt-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full h-full flex flex-col items-center">
              <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl mb-4 md:mb-12 px-4 gap-4 md:gap-6 shrink-0">
                <div className="flex items-center justify-between w-full md:w-auto">
                  {filterStack.length > 0 ? (
                    <button onClick={() => { setFilterStack(prev => {
                        let nextStack = prev.slice(0, -1);
                        if (nextStack.length > 0 && nextStack[nextStack.length - 1].skipped) nextStack = nextStack.slice(0, -1);
                        return nextStack;
                      }); setActiveIndex(0); 
                    }} className="p-2.5 md:p-3 glass-button rounded-full text-accent-orange hover:scale-110 transition-all flex-shrink-0"
                    ><ArrowLeft size={isMobile ? 18 : 20} /></button>
                  ) : <div className="w-10 h-10 md:w-11 md:h-11" />}
                  <div className="md:hidden">
                    <button onClick={() => setViewMode(prev => prev === 'carousel' ? 'dropdown' : 'carousel')} className="glass-button p-3 md:p-4 rounded-xl flex items-center justify-center">
                      {viewMode === 'carousel' ? <List size={isMobile ? 18 : 22} className="text-accent-blue" /> : <LayoutGrid size={isMobile ? 18 : 22} className="text-accent-blue" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center flex-1 min-w-0">
                  <p className="text-[8px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.6em] text-accent-orange mb-0.5 md:mb-1 opacity-80">Sfoglia Catalogo</p>
                  <h2 className="text-base md:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter text-white px-2 leading-tight truncate w-full">
                    {filterStack.length === 0 ? "Categorie" : breadcrumbText}
                  </h2>
                </div>
                <div className="hidden md:flex items-center justify-end shrink-0 gap-4">
                  {filterStack.length > 0 && (
                    <button onClick={resetFilters} className="glass-button px-6 py-4 rounded-[24px] flex items-center gap-3 text-accent-orange border-accent-orange/20"><X size={18} /><span className="text-xs font-black uppercase tracking-widest">Cancella Filtri</span></button>
                  )}
                  {currentLevel < 3 && (
                    <button onClick={() => setViewMode(prev => prev === 'carousel' ? 'dropdown' : 'carousel')} className="glass-button px-8 py-4 rounded-[24px] flex items-center gap-3" title={viewMode === 'carousel' ? 'Passa a filtri a tendina' : 'Passa a carosello'}>
                      {viewMode === 'carousel' ? <List size={22} className="text-accent-blue" /> : <LayoutGrid size={22} className="text-accent-blue" />}
                      <span className="text-xs font-black uppercase tracking-widest text-slate-200">{viewMode === 'carousel' ? 'Filtri' : 'Carosello'}</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full flex flex-col items-center justify-center">
                <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                  <AnimatePresence mode="wait">
                    {viewMode === 'carousel' ? (
                      <motion.div key="carousel-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">{renderCarouselHome()}</motion.div>
                    ) : (
                      <motion.div key="dropdown-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center py-4">
                        <DropdownFilterView tools={tools} onSelectTool={handleSelectToolFromGrid} isMobile={isMobile} initialFilters={Object.fromEntries(filterStack.map(f => [f.type, f.value]))}
                          onFilterChange={(newFilters) => {
                            const newStack = Object.entries(newFilters).filter(([_, v]) => v).map(([k, v]) => ({ type: k, value: v }));
                            setFilterStack(newStack);
                          }}
                          selectedIds={selectedToolsIds} onToggleSelect={toggleToolSelection} isSelectionMode={isSelectionMode} setIsSelectionMode={setIsSelectionMode} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Suspense>
              </div>
              <AnimatePresence>
                {selectedToolsIds.length > 0 && (
                  <motion.button initial={{ opacity: 0, scale: 0.8, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    onClick={() => setShowSelectionDrawer(true)} className="fixed right-6 bottom-32 md:bottom-36 z-[100] glass-panel bg-accent-blue/20 border-accent-blue/40 px-6 py-4 rounded-full flex items-center gap-4 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-accent-blue/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <div className="relative flex items-center gap-3"><div className="bg-accent-blue text-slate-950 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center">{selectedToolsIds.length}</div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Utensili Selezionati</span></div>
                  </motion.button>
                )}
              </AnimatePresence>
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 mt-auto pt-4 pb-6 w-full max-w-7xl px-4 z-50">
                <div className="flex items-center justify-center gap-3 w-full md:w-auto">
                  {selectedToolsIds.length > 0 ? (
                    <>
                      <button onClick={() => handleBulkAction('carico')} className="action-btn action-btn-carica group whitespace-nowrap flex-1 md:min-w-[180px] py-3.5 md:py-6 animate-pulse"><ArrowUp size={20} /><span className="text-xs md:text-base font-black tracking-widest">BULK CARICO ({selectedToolsIds.length})</span></button>
                      <button onClick={() => handleBulkAction('scarico')} className="action-btn action-btn-scarica group whitespace-nowrap flex-1 md:min-w-[180px] py-3.5 md:py-6 animate-pulse"><ArrowDown size={20} /><span className="text-xs md:text-base font-black tracking-widest">BULK SCARICO ({selectedToolsIds.length})</span></button>
                      <button onClick={() => setSelectedToolsIds([])} className="glass-button p-4 rounded-xl text-rose-400 hover:bg-rose-400/10"><X size={20} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setOpType('carico'); setView('scanner'); }} className="action-btn action-btn-carica group whitespace-nowrap flex-1 md:min-w-[180px] py-3.5 md:py-6"><ArrowUp size={20} /><span className="text-xs md:text-base font-black tracking-widest">CARICO</span></button>
                      <button onClick={() => { setOpType('scarico'); setView('scanner'); }} className="action-btn action-btn-scarica group whitespace-nowrap flex-1 md:min-w-[180px] py-3.5 md:py-6"><ArrowDown size={20} /><span className="text-xs md:text-base font-black tracking-widest">SCARICO</span></button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <Suspense key="other-views" fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
              {view === 'history' && <HistoryView history={history} setView={setView} />}
              {view === 'scanner' && <ScannerView setView={setView} tools={tools} setSelectedTool={setSelectedTool} setModalQty={setModalQty} setShowMoveModal={setShowMoveModal} setOpType={setOpType} isMobile={isMobile} />}
            </Suspense>
          )}
        </AnimatePresence>
      </main>

      <Suspense fallback={null}>
        <AnimatePresence>
          {showDetailCard && (
            <ToolDetailCard 
              tool={selectedTool} 
              onClose={() => setShowDetailCard(false)} 
              modalQty={modalQty} 
              setModalQty={setModalQty} 
              handleMovement={handleMovement}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showSelectionDrawer && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSelectionDrawer(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1999]" />
              <SelectionDrawer selectedIds={selectedToolsIds} tools={tools} onToggleSelect={toggleToolSelection} onBulkAction={(type) => { setShowSelectionDrawer(false); handleBulkAction(type); }} onClose={() => setShowSelectionDrawer(false)} setSelectedToolsIds={setSelectedToolsIds} />
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showMoveModal && <MovementModal opType={opType} setOpType={setOpType} selectedTool={isBulkMode ? selectedToolsIds.length : selectedTool} modalQty={modalQty} setModalQty={setModalQty} setShowMoveModal={(val) => { setShowMoveModal(val); if (!val) setIsBulkMode(false); }} handleMovement={handleMovement} isBulkMode={isBulkMode} />}
        </AnimatePresence>
      </Suspense>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed bottom-40 md:bottom-32 right-6 md:right-12 z-[2000]">
            <div className="glass-panel p-8 rounded-[32px] border-l-[12px] border-accent-blue flex items-center gap-6 shadow-2xl">
              <div className="w-12 h-12 bg-accent-blue/20 rounded-2xl flex items-center justify-center"><CheckCircle2 className="text-accent-blue" size={32} /></div>
              <div><p className="text-[10px] font-black text-accent-orange uppercase drop-shadow-md tracking-[0.5em] mb-1">System Notice</p><p className="font-black text-2xl uppercase tracking-widest text-white">{toast}</p></div>
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

      <Suspense fallback={null}>
        <UserSelectionModal 
          isOpen={showUserModal} 
          onClose={() => currentUser && setShowUserModal(false)} 
        />
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
