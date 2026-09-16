import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import {
  ArrowLeft, ArrowUp, ArrowDown, X,
  List, LayoutGrid, CheckCircle2, AlertCircle, AlertTriangle, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

import { useAuthStore } from './store/useAuthStore';
import { useInventoryStore } from './store/useInventoryStore';
import { useMovementStore } from './store/useMovementStore';
import { useMultiMovementStore } from './store/useMultiMovementStore';
import { useNavigationStore } from './store/useNavigationStore';
import { useFilters } from './hooks/useFilters';

// Lazy load only secondary admin/separate views
const HistoryView = lazy(() => import('./features/admin/HistoryView'));
const ScannerView = lazy(() => import('./features/scanner/ScannerView'));
const OperatorsView = lazy(() => import('./features/admin/OperatorsView'));
const CommesseView = lazy(() => import('./features/admin/CommesseView'));

// Standard imports for critical core UI to guarantee instant rendering and eliminate PWA logout chunk failures
import Sidebar from './components/layout/Sidebar';
import LoginScreen from './features/auth/LoginScreen';
import MultiMovementView from './features/inventory/MultiMovementView';
import Header from './components/layout/Header';
import CategoryGridCard from './features/filters/CategoryGridCard';
import MovementModal from './features/inventory/MovementModal';
import DiameterList from './features/filters/DiameterList';
import ToolsGrid from './features/inventory/ToolsGrid';
import DropdownFilterView from './features/filters/DropdownFilterView';
import AddToolModal from './features/inventory/AddToolModal';
import OrderModal from './features/inventory/OrderModal';
import UserSettingsModal from './features/auth/UserSettingsModal';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppTutorial from './components/common/AppTutorial';
import HelpFloatingButton from './components/common/HelpFloatingButton';
import { useTutorialStore } from './store/useTutorialStore';
import { preloadToolImages } from './lib/toolUtils';

// Preload static tool images in memory immediately
preloadToolImages();

function App() {
  const currentUser = useAuthStore(state => state.currentUser);
  
  const tools = useInventoryStore(state => state.tools);
  const fetchTools = useInventoryStore(state => state.fetchTools);
  
  const {
    filterStack, setFilterStack,
    viewMode, setViewMode,
    selectedToolsIds, setSelectedToolsIds,
    filteredByStack, options, diameters, finalTools, currentLevel,
    handleSelectOption, handleSelectDiameter, resetFilters, breadcrumbText
  } = useFilters();

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const showToastNotification = useCallback((msg, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const toastObj = typeof msg === 'object' && msg !== null ? msg : { message: msg, type };
    setToast(toastObj);
    const duration = toastObj.onUndo ? 6000 : 4000;
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const setOpType = useMovementStore(state => state.setOpType);
  const setModalQty = useMovementStore(state => state.setModalQty);
  const showMoveModal = useMovementStore(state => state.showMoveModal);
  const setShowMoveModal = useMovementStore(state => state.setShowMoveModal);
  const selectedTool = useMovementStore(state => state.selectedTool);
  const setSelectedTool = useMovementStore(state => state.setSelectedTool);
  const setIsBulkMode = useMovementStore(state => state.setIsBulkMode);
  const handleMovement = useMovementStore(state => state.handleMovement);

  const view = useNavigationStore(state => state.currentView);
  const setView = useNavigationStore(state => state.setCurrentView);

  // Security Guard: Se un utente con ruolo non-Admin si trova sulla vista operatori, reindirizza a 'home'
  useEffect(() => {
    if (currentUser && currentUser.ruolo !== 'Admin' && view === 'operators') {
      setView('home');
    }
  }, [currentUser, view, setView]);

  // Sincronizzazione route '/commesse'
  useEffect(() => {
    if (window.location.pathname === '/commesse') {
      setView('commesse');
    }
    const handlePopState = () => {
      if (window.location.pathname === '/commesse') {
        setView('commesse');
      } else {
        setView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setView]);

  useEffect(() => {
    if (view === 'commesse') {
      if (window.location.pathname !== '/commesse') {
        window.history.pushState(null, '', '/commesse');
      }
    } else if (window.location.pathname === '/commesse') {
      window.history.pushState(null, '', '/');
    }
  }, [view]);

  const [history, setHistory] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleRequireSidebar = useCallback((needed) => {
    setShowSidebarMobile(prev => (prev === needed ? prev : needed));
  }, []);

  const mainRef = useRef(null);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startTutorial = useTutorialStore(state => state.startTutorial);

  // Avvio automatico pratico al primo ingresso dell'utente
  useEffect(() => {
    if (!currentUser) return;
    const hasCompletedLocal = localStorage.getItem(`berc_tutorial_completed_${currentUser.id}`) === 'true';
    const hasCompletedDb = currentUser.has_completed_tutorial === true;

    if (!hasCompletedLocal && !hasCompletedDb) {
      const timer = setTimeout(() => {
        startTutorial();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentUser, startTutorial]);

  const fetchHistory = async () => {
    try {
      const { data } = await supabase.from('movements_history').select('*, Utensili_B1(*), commesse(codice, ubicazione)').order('created_at', { ascending: false });
      setHistory(data || []);
    } catch(e) {
      console.error(e);
    }
  };

  const addMultiItem = useMultiMovementStore(state => state.addItem);

  const handleTransferToMultiMovement = useCallback(() => {
    if (selectedToolsIds.length === 0) return;
    const targets = tools.filter(t => selectedToolsIds.includes(t.id));
    targets.forEach(t => addMultiItem(t, 1));
    setSelectedToolsIds([]);
    setView('multimovement');
    showToastNotification(`${targets.length} articol${targets.length === 1 ? 'o' : 'i'} trasferit${targets.length === 1 ? 'o' : 'i'} in Movimento Multiplo`, 'success');
  }, [selectedToolsIds, tools, addMultiItem, setSelectedToolsIds, setView, showToastNotification]);

  const handleSelectToolFromGrid = useCallback((tool) => {
    setSelectedTool(tool);
    setOpType(null);
    setModalQty(1);
    setIsBulkMode(false);
    setShowMoveModal(true);
  }, [setSelectedTool, setOpType, setModalQty, setIsBulkMode, setShowMoveModal]);

  const renderGridHome = () => {
    if (currentLevel >= 2 && currentLevel < 3) return (
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto px-2 sm:px-4 md:px-6 py-2 overflow-hidden">
        <DiameterList 
          diameters={diameters} 
          tools={filteredByStack} 
          onSelect={handleSelectDiameter} 
        />
      </div>
    );
    if (currentLevel >= 3) return (
      <ToolsGrid tools={finalTools} onSelectTool={handleSelectToolFromGrid} isMobile={isMobile} />
    );
    if (!options || options.length === 0) return null;

    return (
      <div data-tour="catalog-categories" className="w-full max-w-6xl xl:max-w-7xl px-2 md:px-4 py-1 my-auto mx-auto flex flex-col justify-center items-center">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 w-fit mx-auto justify-center justify-items-center items-center">
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
    return <LoginScreen />;
  }

  return (
    <div ref={mainRef} className="min-h-[100dvh] h-[100dvh] w-full flex flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <Sidebar 
        isMobile={isMobile} 
        isOpen={showSidebarMobile} 
        onClose={() => setShowSidebarMobile(false)}
        setView={setView}
        fetchHistory={fetchHistory}
        setShowAddModal={setShowAddModal}
        setShowSettingsModal={setShowSettingsModal}
        view={view}
      />

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
                <div data-tour="view-mode-toggle" className={`shrink-0 items-center bg-slate-900/5 dark:bg-white/5 p-1.5 rounded-2xl relative shadow-inner border border-slate-900/5 dark:border-white/5 ${viewMode === 'dropdown' ? 'hidden md:flex' : 'flex'}`}>
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
                <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="w-full h-full flex flex-col items-center relative">
                  <div className="flex-1 w-full flex flex-col items-center justify-start min-h-0 px-2 mt-1 md:mt-1.5">
                    {viewMode === 'grid' ? (
                      <div className={`w-full flex-1 flex flex-col items-center justify-center min-h-0 ${currentLevel < 3 ? 'overflow-y-auto custom-scrollbar py-2 md:py-0' : ''}`}>
                        {renderGridHome()}
                      </div>
                    ) : (
                      <div className="w-full flex-1 flex flex-col items-center min-h-0">
                        <DropdownFilterView tools={tools} onSelectTool={handleSelectToolFromGrid} isMobile={isMobile} initialFilters={Object.fromEntries(filterStack.map(f => [f.type, f.value]))}
                          onFilterChange={(newFilters) => {
                            const newStack = Object.entries(newFilters).filter(([, v]) => v).map(([k, v]) => ({ type: k, value: v }));
                            setFilterStack(newStack);
                          }}
                          viewMode={viewMode}
                          setViewMode={setViewMode}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              {view === 'history' && (
                <ErrorBoundary>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                    <HistoryView key="history" history={history} setView={setView} fetchHistory={fetchHistory} />
                  </Suspense>
                </ErrorBoundary>
              )}
              {view === 'scanner' && (
                <ErrorBoundary>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                    <ScannerView key="scanner" setView={setView} setShowMoveModal={setShowMoveModal} isMobile={isMobile} />
                  </Suspense>
                </ErrorBoundary>
              )}
              {view === 'operators' && (
                <ErrorBoundary>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                    <OperatorsView key="operators" setView={setView} />
                  </Suspense>
                </ErrorBoundary>
              )}
              {view === 'commesse' && (
                <ErrorBoundary>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                    <CommesseView key="commesse" setView={setView} showToastNotification={showToastNotification} />
                  </Suspense>
                </ErrorBoundary>
              )}
              {view === 'multimovement' && (
                <ErrorBoundary>
                  <MultiMovementView showToastNotification={showToastNotification} />
                </ErrorBoundary>
              )}
            </AnimatePresence>
        </main>

        {/* Barra Contestuale: Trasferimento Selezione a Movimento Multiplo */}
        <AnimatePresence>
          {selectedToolsIds.length > 0 && view === 'home' && (
            <motion.div key="global-command-bar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full flex flex-col items-center px-2 md:px-4 z-[100] shrink-0 pt-2 pb-2 relative" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
              <div className="w-full max-w-xl flex flex-col shrink-0 pointer-events-auto">
                <div className="pointer-events-auto flex items-center justify-between w-full bg-white/90 dark:bg-slate-900/90 rounded-[20px] md:rounded-[24px] p-2 md:p-3 md:px-4 border border-accent-blue/30 dark:border-accent-blue/30 gap-3 shadow-2xl backdrop-blur-3xl">
                  <div className="flex items-center gap-2">
                    <div className="bg-accent-blue text-white font-black text-xs md:text-sm w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-inner">{selectedToolsIds.length}</div>
                    <span className="hidden sm:inline text-[10px] md:text-xs font-black uppercase tracking-[0.1em] dark:text-white text-slate-900">Selezionati</span>
                  </div>
                  <button 
                    onClick={handleTransferToMultiMovement} 
                    className="action-btn action-btn-primary py-2 sm:py-2.5 px-4 rounded-[14px] flex items-center justify-center gap-2 group shadow-sm text-xs md:text-sm flex-1 font-black tracking-wider"
                  >
                    <ClipboardList size={16} />
                    <span>APRI IN MOVIMENTO MULTIPLO</span>
                  </button>
                  <button onClick={() => setSelectedToolsIds([])} className="glass-button p-2 rounded-[12px] md:rounded-[14px] text-rose-400 hover:bg-rose-400/10 flex items-center justify-center shrink-0" title="Annulla Selezione">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
            {showMoveModal && <MovementModal key="move-modal" setShowMoveModal={(val) => { setShowMoveModal(val); if (!val) setIsBulkMode(false); }} onConfirm={(commessaId) => {
              handleMovement(showToastNotification, () => {
                setShowMoveModal(false);
                setSelectedToolsIds([]);
                setIsBulkMode(false);
              }, commessaId);
            }} onOpenOrder={() => setShowOrderModal(true)} />}
            {showAddModal && <AddToolModal key="add-modal" tools={tools} onClose={() => setShowAddModal(false)} onToolAdded={fetchTools} currentUser={currentUser} />}
            {showOrderModal && (
              <OrderModal 
                key="order-modal" 
                tool={selectedTool} 
                onClose={() => setShowOrderModal(false)} 
                currentUser={currentUser}
                onSuccess={(msg) => showToastNotification(msg, 'success')} 
              />
            )}
            {showSettingsModal && (
              <UserSettingsModal
                key="settings-modal"
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
              />
            )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed left-4 right-4 md:left-auto md:right-12 z-[9999] pointer-events-auto safe-toast-top">
              <div className={`glass-panel p-3.5 sm:p-4 md:p-5 rounded-[22px] border-l-[6px] flex items-center gap-3.5 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl max-w-lg ${
                toast.type === 'error' 
                  ? 'border-accent-rose' 
                  : toast.type === 'warning' 
                  ? 'border-accent-orange' 
                  : 'border-accent-emerald'
              }`}>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  toast.type === 'error'
                    ? 'bg-rose-500/15 text-accent-rose'
                    : toast.type === 'warning'
                    ? 'bg-orange-500/15 text-accent-orange'
                    : 'bg-emerald-500/15 text-accent-emerald'
                }`}>
                  {toast.type === 'error' ? (
                    <AlertCircle size={20} />
                  ) : toast.type === 'warning' ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                </div>
                <div className="flex flex-col min-w-0 pr-1 flex-1">
                  <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 ${
                    toast.type === 'error'
                      ? 'text-accent-rose'
                      : toast.type === 'warning'
                      ? 'text-accent-orange'
                      : 'text-accent-emerald'
                  }`}>
                    {toast.type === 'error' ? 'Errore Operativo' : toast.type === 'warning' ? 'Avviso' : 'Notifica Sistema'}
                  </p>
                  <p className="font-bold text-xs sm:text-sm tracking-wide dark:text-white text-slate-900 break-words leading-snug">
                    {toast.message || toast}
                  </p>
                </div>
                {toast.onUndo && (
                  <button
                    type="button"
                    onClick={() => {
                      const undoFn = toast.onUndo;
                      setToast(null);
                      undoFn();
                    }}
                    className="ml-auto px-3 py-1.5 rounded-xl bg-accent-orange/15 hover:bg-accent-orange/25 border border-accent-orange/30 text-accent-orange text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    Annulla
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsante discreto in basso per riavviare la guida/tutorial */}
        <HelpFloatingButton />

        {/* Tutorial interattivo guidato */}
        <AppTutorial 
          onRequireSidebar={handleRequireSidebar}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
    </div>
  );
}

export default App;
