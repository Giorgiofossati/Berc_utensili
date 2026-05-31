import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, useRef } from 'react';
import {
  ArrowLeft, ChevronRight,
  ChevronLeft, ArrowUp, ArrowDown, X, Search,
  List, LayoutGrid, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

import { useAuthStore } from './store/useAuthStore';
import { useInventoryStore } from './store/useInventoryStore';
import { useFilterStore } from './store/useFilterStore';
import { useMovementStore } from './store/useMovementStore';
import { useFilters } from './hooks/useFilters';

// Lazy load only major separate views
const Sidebar = lazy(() => import('./components/layout/Sidebar'));
const HistoryView = lazy(() => import('./features/admin/HistoryView'));
const ScannerView = lazy(() => import('./features/scanner/ScannerView'));
const OperatorsView = lazy(() => import('./features/admin/OperatorsView'));
const LoginScreen = lazy(() => import('./features/auth/LoginScreen'));

// Standard imports for critical UI to avoid Suspense flickering/double renders
import SelectionDrawer from './components/layout/SelectionDrawer';
import Header from './components/layout/Header';
import CategoryGridCard from './features/filters/CategoryGridCard';
import MovementModal from './features/inventory/MovementModal';
import DiameterList from './features/filters/DiameterList';
import ToolsGrid from './features/inventory/ToolsGrid';
import DropdownFilterView from './features/filters/DropdownFilterView';
import SearchOverlay from './features/filters/SearchOverlay';
import AddToolModal from './features/inventory/AddToolModal';
import OrderModal from './features/inventory/OrderModal';

// Helper for date
const getTodayString = () => new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

function App() {
  const currentUser = useAuthStore(state => state.currentUser);
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);
  
  const tools = useInventoryStore(state => state.tools);
  const fetchTools = useInventoryStore(state => state.fetchTools);
  
  const {
    filterStack, setFilterStack,
    viewMode, setViewMode,
    isSelectionMode, handleSetIsSelectionMode, setIsSelectionMode,
    selectedToolsIds, setSelectedToolsIds, toggleToolSelection,
    filteredByStack, options, diameters, finalTools, currentLevel,
    handleSelectOption, handleSelectDiameter, resetFilters, breadcrumbText
  } = useFilters();

  const [toast, setToast] = useState(null);
  const showToastNotification = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const opType = useMovementStore(state => state.opType);
  const setOpType = useMovementStore(state => state.setOpType);
  const modalQty = useMovementStore(state => state.modalQty);
  const setModalQty = useMovementStore(state => state.setModalQty);
  const isBulkMode = useMovementStore(state => state.isBulkMode);
  const setIsBulkMode = useMovementStore(state => state.setIsBulkMode);
  const selectedTool = useMovementStore(state => state.selectedTool);
  const setSelectedTool = useMovementStore(state => state.setSelectedTool);
  const handleMovement = useMovementStore(state => state.handleMovement);

  const [view, setView] = useState('home');
  const [history, setHistory] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSelectionDrawer, setShowSelectionDrawer] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  const mainRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const today = useMemo(() => getTodayString(), []);

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('movements_history')
      .select('*, Utensili_B1("Tipologia", "Diametro", "Codice", "Forma", "Fornitore")')
      .order('created_at', { ascending: false });
    if (!error) setHistory(data || []);
  }, []);

  const handleBulkAction = useCallback((type) => {
    setOpType(type);
    setModalQty(1);
    setShowMoveModal(true);
    setIsBulkMode(true);
  }, [setOpType, setModalQty, setIsBulkMode]);

  const handleSelectToolFromGrid = useCallback((tool) => {
    setSelectedTool(tool);
    setOpType(null);
    setModalQty(1);
    setShowMoveModal(true);
  }, [setSelectedTool, setOpType, setModalQty]);

  const onConfirmMovement = () => {
    handleMovement(selectedToolsIds, () => {
      setShowMoveModal(false);
      setSelectedToolsIds([]);
      setIsBulkMode(false);
    });
  };

  const renderGridHome = () => {
    if (currentLevel >= 2 && currentLevel < 3) return <DiameterList diameters={diameters} onSelect={handleSelectDiameter} />;
    if (currentLevel >= 3) return (
      <ToolsGrid tools={finalTools} onSelectTool={handleSelectToolFromGrid} isMobile={isMobile} />
    );
    if (!options || options.length === 0) return null;

    return (
      <div className="w-full max-w-7xl xl:max-w-[1600px] px-2 md:px-4 py-1 mx-auto flex flex-col justify-start">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-fit mx-auto justify-center justify-items-center items-center">
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
      <Suspense fallback={<div className="h-[100dvh] w-screen dark:bg-slate-950 bg-slate-50 flex items-center justify-center text-accent-blue"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
        <LoginScreen />
      </Suspense>
    );
  }

  return (
    <div ref={mainRef} className="h-[100dvh] w-screen flex flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <Suspense fallback={null}>
        <Sidebar 
          isMobile={isMobile} 
          isOpen={showSidebarMobile} 
          onClose={() => setShowSidebarMobile(false)}
          setView={setView}
          fetchHistory={fetchHistory}
          setShowAddModal={setShowAddModal}
          onOpenSearch={() => setShowSearchOverlay(true)}
          view={view}
        />
      </Suspense>

      <div className="flex-1 flex flex-col gap-3 md:gap-4 relative overflow-hidden app-container custom-scrollbar min-w-0">
        <Header onOpenSidebar={() => setShowSidebarMobile(true)} />

        {/* Top Controls: Breadcrumbs & Filters */}
        <AnimatePresence>
          {view === 'home' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full flex items-center justify-between z-[60] gap-2">
              {filterStack.length > 0 ? (
                <div className="flex items-center gap-2 min-w-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-[16px] border border-slate-200/50 dark:border-white/10 shadow-sm flex-1">
                  <button onClick={() => { setFilterStack(prev => {
                      let nextStack = [...prev];
                      while (nextStack.length > 0) {
                        const popped = nextStack.pop();
                        if (!popped.skipped) break;
                      }
                      return nextStack;
                    }); 
                  }} className="p-1.5 glass-button rounded-full text-accent-orange hover:scale-110 flex-shrink-0"
                  ><ArrowLeft size={isMobile ? 14 : 16} /></button>
                  <div className="flex flex-col min-w-0 ml-1">
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-accent-orange opacity-80">Filtro Corrente</span>
                    <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-wide dark:text-white text-slate-900 truncate">
                       {breadcrumbText}
                    </h2>
                  </div>
                </div>
              ) : (
                <div className="flex-1" />
              )}
              
              <div className="flex items-center gap-2 ml-2">
                {filterStack.length > 0 && (
                  <button onClick={resetFilters} className="glass-button px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-accent-orange flex items-center gap-1.5 shadow-sm hover:shadow-accent-orange/20 border border-accent-orange/20">
                    <X size={12} /> <span className="hidden sm:inline">Resetta Tutto</span>
                  </button>
                )}
                <div className={`shrink-0 items-center bg-slate-900/5 dark:bg-white/5 p-1.5 rounded-2xl relative shadow-inner border border-slate-900/5 dark:border-white/5 ${viewMode === 'dropdown' ? 'hidden md:flex' : 'flex'}`}>
                  <motion.div 
                    className="absolute top-1.5 bottom-1.5 w-[36px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-accent-blue/30 dark:border-accent-blue/30 overflow-hidden"
                    initial={false}
                    animate={{ x: viewMode === 'grid' ? 36 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <div className="absolute inset-0 bg-accent-blue/10 animate-pulse" />
                  </motion.div>
                  <button 
                    type="button" 
                    onClick={() => setViewMode('dropdown')} 
                    title="Vista ad Elenco"
                    className={`relative z-10 w-9 h-8 flex items-center justify-center transition-colors ${viewMode === 'dropdown' ? 'text-accent-blue drop-shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    <List size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setViewMode('grid')} 
                    title="Vista a Griglia"
                    className={`relative z-10 w-9 h-8 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'text-accent-blue drop-shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 w-full flex flex-col items-center justify-start relative min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {view === 'home' && (
                <motion.div key="home" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="w-full h-full flex flex-col items-center relative">
                  <div className="flex-1 w-full flex flex-col items-center justify-start min-h-0 px-2 mt-1 md:mt-1.5">
                    <AnimatePresence mode="wait">
                      {viewMode === 'grid' ? (
                        <motion.div key="grid-mode" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className={`w-full flex-1 flex flex-col items-center min-h-0 ${currentLevel < 3 ? 'overflow-y-auto custom-scrollbar pt-4 pb-6' : ''}`}>
                          {renderGridHome()}
                        </motion.div>
                      ) : (
                        <motion.div key="dropdown-mode" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className="w-full flex-1 flex flex-col items-center min-h-0">
                          <DropdownFilterView tools={tools} onSelectTool={handleSelectToolFromGrid} isMobile={isMobile} initialFilters={Object.fromEntries(filterStack.map(f => [f.type, f.value]))}
                            onFilterChange={(newFilters) => {
                              const newStack = Object.entries(newFilters).filter(([_, v]) => v).map(([k, v]) => ({ type: k, value: v }));
                              setFilterStack(newStack);
                            }}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
              {view === 'history' && (
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                  <HistoryView key="history" history={history} setView={setView} />
                </Suspense>
              )}
              {view === 'scanner' && (
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                  <ScannerView key="scanner" setView={setView} setShowMoveModal={setShowMoveModal} isMobile={isMobile} />
                </Suspense>
              )}
              {view === 'operators' && (
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                  <OperatorsView key="operators" setView={setView} />
                </Suspense>
              )}
            </AnimatePresence>
        </main>

        {/* Contextual Bulk Action Bar */}
        <AnimatePresence>
          {selectedToolsIds.length > 0 && view === 'home' && (
            <motion.div key="global-command-bar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full flex flex-col items-center px-2 md:px-4 z-[100] shrink-0 pt-2 pb-2 relative" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
                  <div className="w-full max-w-2xl flex flex-col shrink-0 pointer-events-auto">
                    <div className="pointer-events-auto flex items-center justify-between w-full bg-white/80 dark:bg-slate-900/80 rounded-[20px] md:rounded-[24px] p-2 md:p-3 md:px-4 border border-accent-blue/30 dark:border-accent-blue/30 gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-xl transition-all duration-300 backdrop-blur-3xl backdrop-saturate-150">
                       <div className="flex items-center gap-2">
                          <div className="bg-accent-blue text-white font-black text-xs md:text-sm w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-inner">{selectedToolsIds.length}</div>
                          <span className="hidden sm:inline text-[10px] md:text-xs font-black uppercase tracking-[0.1em] dark:text-white text-slate-900">Selezionati</span>
                       </div>
                       <div className="flex flex-1 justify-center gap-2 px-2">
                          <button onClick={() => handleBulkAction('carico')} className="action-btn action-btn-carica py-1.5 px-3 md:py-2.5 md:px-5 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-1.5 group shadow-sm hover:shadow-emerald-500/20 text-[10px] md:text-sm flex-1">
                            <ArrowDown size={isMobile ? 14 : 16} className="group-hover:translate-y-1 transition-transform" />
                            <span className="font-black tracking-wider">DEPOSITA</span>
                          </button>
                          <button onClick={() => handleBulkAction('scarico')} className="action-btn action-btn-scarica py-1.5 px-3 md:py-2.5 md:px-5 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-1.5 group shadow-sm hover:shadow-rose-500/20 text-[10px] md:text-sm flex-1">
                            <ArrowUp size={isMobile ? 14 : 16} className="group-hover:-translate-y-1 transition-transform" />
                            <span className="font-black tracking-wider">PRELEVA</span>
                          </button>
                       </div>
                       <button onClick={() => setSelectedToolsIds([])} className="glass-button p-2 rounded-[12px] md:rounded-[16px] text-rose-400 hover:bg-rose-400/10 flex items-center justify-center shrink-0" title="Annulla Selezione">
                         <X size={16} />
                       </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {selectedToolsIds.length > 0 && (
                      <motion.button initial={{ opacity: 0, scale: 0.8, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        onClick={() => setShowSelectionDrawer(true)} className="absolute right-6 -top-20 floating-badge-container z-[100] glass-panel bg-accent-blue/20 border-accent-blue/40 px-6 py-4 rounded-full flex items-center gap-4 group overflow-hidden shadow-lg hidden md:flex"
                      >
                        <div className="absolute inset-0 bg-accent-blue/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <div className="relative flex items-center gap-3"><span className="text-[10px] font-black uppercase tracking-[0.2em] dark:text-white text-slate-900">Gestisci Selezione Multipla</span></div>
                      </motion.button>
                    )}
                  </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
            {showSelectionDrawer && (
              <>
                <motion.div key="drawer-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSelectionDrawer(false)} className="fixed inset-0 dark:bg-slate-950/60 bg-slate-50/60 backdrop-blur-sm z-[1999]" />
                <SelectionDrawer key="drawer" selectedIds={selectedToolsIds} tools={tools} onToggleSelect={toggleToolSelection} onBulkAction={(type) => { setShowSelectionDrawer(false); handleBulkAction(type); }} onClose={() => setShowSelectionDrawer(false)} setSelectedToolsIds={setSelectedToolsIds} />
              </>
            )}
        </AnimatePresence>
        
        <AnimatePresence>
            {showMoveModal && <MovementModal key="move-modal" setShowMoveModal={(val) => { setShowMoveModal(val); if (!val) setIsBulkMode(false); }} onConfirm={() => {
              handleMovement(showToastNotification, () => {
                setShowMoveModal(false);
                setSelectedToolsIds([]);
                setIsBulkMode(false);
              });
            }} onOpenOrder={() => setShowOrderModal(true)} />}
            {showAddModal && <AddToolModal key="add-modal" tools={tools} onClose={() => setShowAddModal(false)} onToolAdded={fetchTools} currentUser={currentUser} />}
            {showOrderModal && <OrderModal key="order-modal" tool={selectedTool} onClose={() => setShowOrderModal(false)} currentUser={currentUser} />}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed left-4 right-4 md:left-auto md:right-12 z-[9999] pointer-events-auto" style={{ top: 'max(16px, env(safe-area-inset-top))' }}>
              <div className="glass-panel p-4 md:p-6 rounded-[24px] border-l-[8px] border-accent-blue flex items-center gap-4 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-accent-blue/20 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0"><CheckCircle2 className="text-accent-blue" size={24} /></div>
                <div className="flex flex-col min-w-0">
                  <p className="text-[9px] md:text-[10px] font-black text-accent-orange uppercase drop-shadow-md tracking-[0.3em] md:tracking-[0.5em] mb-0.5 md:mb-1">Notifica Sistema</p>
                  <p className="font-black text-sm md:text-xl uppercase tracking-wider md:tracking-widest dark:text-white text-slate-900 truncate">{toast}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <SearchOverlay 
          isOpen={showSearchOverlay} 
          onClose={() => setShowSearchOverlay(false)} 
          tools={tools} 
          onSelectTool={handleSelectToolFromGrid}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

export default App;
