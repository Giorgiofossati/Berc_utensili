import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, useRef } from 'react';
import {
  ArrowLeft, ChevronRight,
  ChevronLeft, ArrowUp, ArrowDown, X, Search,
  List, LayoutGrid, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

// Custom Hooks
import { useAuth } from './hooks/useAuth';
import { useTools } from './hooks/useTools';
import { useFilters } from './hooks/useFilters';
import { useMovements } from './hooks/useMovements';

// Lazy load components
const SelectionDrawer = lazy(() => import('./components/layout/SelectionDrawer'));
const Header = lazy(() => import('./components/layout/Header'));
const CategoryGridCard = lazy(() => import('./features/filters/CategoryGridCard'));
const HistoryView = lazy(() => import('./features/admin/HistoryView'));
const ScannerView = lazy(() => import('./features/scanner/ScannerView'));
const MovementModal = lazy(() => import('./features/inventory/MovementModal'));
const DiameterList = lazy(() => import('./features/filters/DiameterList'));
const ToolsGrid = lazy(() => import('./features/inventory/ToolsGrid'));
const DropdownFilterView = lazy(() => import('./features/filters/DropdownFilterView'));
const SearchOverlay = lazy(() => import('./features/filters/SearchOverlay'));
const LoginScreen = lazy(() => import('./features/auth/LoginScreen'));
const AddToolModal = lazy(() => import('./features/inventory/AddToolModal'));
const OrderModal = lazy(() => import('./features/inventory/OrderModal'));
const OperatorsView = lazy(() => import('./features/admin/OperatorsView'));

// Helper for date
const getTodayString = () => new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

function App() {
  const { currentUser, setCurrentUser } = useAuth();
  const { tools, setTools, fetchTools } = useTools();
  
  const {
    filterStack, setFilterStack,
    viewMode, setViewMode,
    isSelectionMode, handleSetIsSelectionMode, setIsSelectionMode,
    selectedToolsIds, setSelectedToolsIds, toggleToolSelection,
    filteredByStack, options, diameters, finalTools, currentLevel,
    handleSelectOption, handleSelectDiameter, resetFilters, breadcrumbText
  } = useFilters(tools);

  const [toast, setToast] = useState(null);
  const showToastNotification = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const {
    opType, setOpType,
    modalQty, setModalQty,
    isBulkMode, setIsBulkMode,
    selectedTool, setSelectedTool,
    handleMovement
  } = useMovements({ tools, setTools, fetchTools, currentUser, showToastNotification });

  const [view, setView] = useState('home');
  const [history, setHistory] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
      <ToolsGrid tools={finalTools} onSelectTool={handleSelectToolFromGrid} isMobile={isMobile} 
        selectedIds={selectedToolsIds} onToggleSelect={toggleToolSelection} isSelectionMode={isSelectionMode} setIsSelectionMode={handleSetIsSelectionMode} />
    );
    if (!options || options.length === 0) return null;

    return (
      <div className="w-full max-w-7xl xl:max-w-[1600px] px-2 md:px-4 py-2 md:py-3 mx-auto flex flex-col justify-start">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5 w-fit mx-auto justify-center justify-items-center items-center">
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
        <LoginScreen onLogin={setCurrentUser} />
      </Suspense>
    );
  }

  return (
    <div ref={mainRef} className="h-[100dvh] w-screen flex flex-col app-container relative overflow-hidden dark:text-slate-200 text-slate-800 custom-scrollbar">
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

      <main className="flex-1 w-full flex flex-col items-center justify-start relative mt-1 md:mt-1.5 min-h-0 overflow-hidden">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full h-full flex flex-col items-center relative">
                <div className="flex-1 w-full flex flex-col items-center justify-start min-h-0 px-2 mt-1 md:mt-1.5">
                  <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                      {viewMode === 'grid' ? (
                        <div key="grid-mode" className={`w-full flex-1 flex flex-col items-center min-h-0 ${currentLevel < 3 ? 'overflow-y-auto custom-scrollbar md:justify-center pb-24 md:pb-32' : ''}`}>
                          {renderGridHome()}
                        </div>
                      ) : (
                        <div key="dropdown-mode" className="w-full flex-1 flex flex-col items-center min-h-0">
                          <DropdownFilterView tools={tools} onSelectTool={handleSelectToolFromGrid} isMobile={isMobile} initialFilters={Object.fromEntries(filterStack.map(f => [f.type, f.value]))}
                            onFilterChange={(newFilters) => {
                              const newStack = Object.entries(newFilters).filter(([_, v]) => v).map(([k, v]) => ({ type: k, value: v }));
                              setFilterStack(newStack);
                            }}
                            selectedIds={selectedToolsIds} onToggleSelect={toggleToolSelection} isSelectionMode={isSelectionMode} setIsSelectionMode={handleSetIsSelectionMode} />
                        </div>
                      )}
                  </Suspense>
                </div>

              </motion.div>
            )}
            {view === 'history' && <HistoryView key="history" history={history} setView={setView} />}
            {view === 'scanner' && <ScannerView key="scanner" setView={setView} tools={tools} setSelectedTool={setSelectedTool} setModalQty={setModalQty} setShowMoveModal={setShowMoveModal} setOpType={setOpType} isMobile={isMobile} />}
            {view === 'operators' && <OperatorsView key="operators" setView={setView} currentUser={currentUser} setCurrentUser={setCurrentUser} />}
          </AnimatePresence>
        </Suspense>
      </main>

      <AnimatePresence>
          <motion.div key="global-command-bar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full flex flex-col items-center px-2 md:px-4 z-[100] shrink-0 pt-2 pb-2 relative" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
                <div className="w-full max-w-5xl flex flex-col shrink-0 pointer-events-auto">
                  {/* COMMAND BAR: Breadcrumbs, Centered Actions, Search */}
                  <div className="pointer-events-auto flex flex-col md:flex-row items-center justify-between w-full bg-white/30 dark:bg-slate-950/50 rounded-[20px] md:rounded-[24px] p-2 md:p-3 md:px-4 border border-white/30 dark:border-white/10 gap-3 md:gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-xl transition-all duration-300 backdrop-blur-3xl backdrop-saturate-150">
                    
                    {/* Top Row on Mobile, Left Column on Desktop */}
                    <div className="flex items-center justify-between md:justify-start w-full md:w-auto md:flex-1 min-w-0">
                      {/* Left: Breadcrumb */}
                      <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                        {filterStack.length > 0 && (
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
                        )}
                        <div className="flex flex-col min-w-0">
                          {filterStack.length > 0 && (
                            <div className="flex flex-col">
                              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-accent-orange opacity-80">Filtro</span>
                              <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-wide dark:text-white text-slate-900 truncate">
                                 {breadcrumbText}
                              </h2>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Grouped Action Buttons - DESKTOP VIEW ONLY */}
                    <div className="hidden md:flex flex-[2] justify-center items-center gap-2 md:gap-3 w-auto shrink-0">
                       {selectedToolsIds.length > 0 ? (
                          <>
                            <button onClick={() => handleBulkAction('carico')} className="action-btn action-btn-carica py-1.5 px-3 md:py-2.5 md:px-5 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-1.5 group shadow-sm hover:shadow-emerald-500/20 text-[10px] md:text-sm flex-1 md:flex-none">
                              <ArrowDown size={isMobile ? 14 : 16} className="group-hover:translate-y-1 transition-transform" />
                              <span className="font-black tracking-wider">DEPOSITA ({selectedToolsIds.length})</span>
                            </button>
                            <button onClick={() => handleBulkAction('scarico')} className="action-btn action-btn-scarica py-1.5 px-3 md:py-2.5 md:px-5 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-1.5 group shadow-sm hover:shadow-rose-500/20 text-[10px] md:text-sm flex-1 md:flex-none">
                              <ArrowUp size={isMobile ? 14 : 16} className="group-hover:-translate-y-1 transition-transform" />
                              <span className="font-black tracking-wider">PRELEVA ({selectedToolsIds.length})</span>
                            </button>
                            <button onClick={() => setSelectedToolsIds([])} className="glass-button p-1.5 md:p-2 rounded-[12px] md:rounded-[16px] text-rose-400 hover:bg-rose-400/10 flex items-center justify-center shrink-0" title="Annulla Selezione">
                               <X size={14} />
                            </button>
                          </>
                       ) : (
                          <>
                            <button onClick={() => { setOpType('carico'); setView('scanner'); }} className="action-btn action-btn-carica py-2 px-3 md:py-2.5 md:px-6 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-1.5 group shadow-sm hover:shadow-emerald-500/20 text-[10px] md:text-sm flex-1 md:flex-none">
                              <ArrowDown size={isMobile ? 14 : 16} className="group-hover:translate-y-1 transition-transform" />
                              <span className="font-black tracking-wider">DEPOSITA</span>
                            </button>
                            <button onClick={() => { setOpType('scarico'); setView('scanner'); }} className="action-btn action-btn-scarica py-2 px-3 md:py-2.5 md:px-6 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-1.5 group shadow-sm hover:shadow-rose-500/20 text-[10px] md:text-sm flex-1 md:flex-none">
                              <ArrowUp size={isMobile ? 14 : 16} className="group-hover:-translate-y-1 transition-transform" />
                              <span className="font-black tracking-wider">PRELEVA</span>
                            </button>
                            {currentUser?.ruolo === 'Admin' && (
                              <button onClick={() => setShowAddModal(true)} className="glass-button py-2 px-2 md:py-2.5 md:px-3.5 rounded-[12px] md:rounded-[16px] text-accent-blue border border-accent-blue/30 hover:bg-accent-blue/10 flex items-center justify-center gap-1 group shadow-sm text-[10px] md:text-sm shrink-0">
                                 <span className="text-sm md:text-base font-black group-hover:scale-110 transition-transform">+</span>
                              </button>
                            )}
                          </>
                       )}
                    </div>

                    {/* Right: Search & View Modes - DESKTOP VIEW ONLY */}
                    <div className="hidden md:flex items-center justify-end gap-1.5 md:gap-2 md:flex-1 shrink-0">
                       {/* Search Shortcut */}
                       <div className="group relative flex items-center justify-end">
                          <input 
                            type="text"
                            readOnly
                            onClick={() => setShowSearchOverlay(true)}
                            placeholder="Cerca..."
                            className="w-0 opacity-0 group-hover:w-20 md:group-hover:w-32 group-hover:opacity-100 transition-all duration-300 ease-out bg-white/50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-full py-1 px-2 text-[10px] md:text-xs font-semibold outline-none cursor-pointer absolute right-4 focus:w-20 md:focus:w-32 focus:opacity-100"
                          />
                          <button onClick={() => setShowSearchOverlay(true)} className="glass-button p-1.5 rounded-full text-accent-blue hover:scale-110 relative z-10 shadow-sm" title="Ricerca veloce">
                            <Search size={16} />
                          </button>
                       </div>

                       {filterStack.length > 0 && (
                         <button onClick={resetFilters} className="glass-button px-2 py-1 md:px-2.5 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-accent-orange flex items-center gap-1 shadow-sm hover:shadow-accent-orange/20">
                           <X size={10} /> <span>Reset</span>
                         </button>
                       )}
                       
                       {currentLevel < 3 && (
                         <div className="flex bg-slate-200/50 dark:bg-slate-800/50 rounded-full p-0.5 md:p-1 border border-slate-300/30 dark:border-slate-700/30 shadow-inner relative z-50">
                           <button type="button" onClick={() => setViewMode('grid')} className={`cursor-pointer p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-accent-blue' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'}`} title="Vista a Griglia">
                             <LayoutGrid size={14} />
                           </button>
                           <button type="button" onClick={() => setViewMode('dropdown')} className={`cursor-pointer p-1.5 rounded-full transition-all ${viewMode === 'dropdown' ? 'bg-white dark:bg-slate-700 shadow-sm text-accent-blue' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'}`} title="Vista ad Elenco">
                             <List size={14} />
                           </button>
                         </div>
                       )}
                    </div>

                    {/* MOBILE VIEW ACTIONS & CONTROLS */}
                    <div className={`flex md:hidden w-full items-center justify-between gap-2.5 ${filterStack.length > 0 ? 'pt-2 border-t border-slate-200/10 dark:border-slate-700/10' : ''}`}>
                      {/* Search Button (Always Leftmost) */}
                      <button onClick={() => setShowSearchOverlay(true)} className="glass-button w-10 h-10 rounded-full text-accent-blue flex items-center justify-center shrink-0 shadow-sm" title="Cerca">
                        <Search size={16} />
                      </button>

                      {/* Reset Filters Button (Appears next to Search) */}
                      {filterStack.length > 0 && (
                        <button
                          onClick={resetFilters}
                          className="glass-button w-10 h-10 rounded-full text-accent-orange flex items-center justify-center shadow-sm shrink-0"
                          title="Reset Filtri"
                        >
                          <X size={16} />
                        </button>
                      )}

                      {/* Center Main Actions (Deposita & Preleva) */}
                      <div className="flex flex-1 gap-2 min-w-0">
                        {selectedToolsIds.length > 0 ? (
                          <>
                            <button onClick={() => handleBulkAction('carico')} className="action-btn-carica h-10 rounded-full flex items-center justify-center gap-1 shadow-sm text-[9px] min-[375px]:text-[10px] font-black tracking-wider flex-1 px-1.5 min-w-0">
                              <ArrowDown size={14} className="animate-bounce shrink-0" />
                              <span className="truncate">DEPOSITA ({selectedToolsIds.length})</span>
                            </button>
                            <button onClick={() => handleBulkAction('scarico')} className="action-btn-scarica h-10 rounded-full flex items-center justify-center gap-1 shadow-sm text-[9px] min-[375px]:text-[10px] font-black tracking-wider flex-1 px-1.5 min-w-0">
                              <ArrowUp size={14} className="animate-bounce shrink-0" />
                              <span className="truncate">PRELEVA ({selectedToolsIds.length})</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setOpType('carico'); setView('scanner'); }} className="action-btn-carica h-10 rounded-full flex items-center justify-center gap-1 shadow-sm text-[9px] min-[375px]:text-[10px] font-black tracking-wider flex-1 px-1.5 min-w-0">
                              <ArrowDown size={14} className="shrink-0" />
                              <span className="truncate">DEPOSITA</span>
                            </button>
                            <button onClick={() => { setOpType('scarico'); setView('scanner'); }} className="action-btn-scarica h-10 rounded-full flex items-center justify-center gap-1 shadow-sm text-[9px] min-[375px]:text-[10px] font-black tracking-wider flex-1 px-1.5 min-w-0">
                              <ArrowUp size={14} className="shrink-0" />
                              <span className="truncate">PRELEVA</span>
                            </button>
                          </>
                        )}
                      </div>

                      {/* View Mode Toggle (Appears on the right side) */}
                      {currentLevel < 3 && (
                        <button
                          type="button"
                          onClick={() => setViewMode(prev => prev === 'grid' ? 'dropdown' : 'grid')}
                          className="glass-button w-10 h-10 rounded-full flex items-center justify-center text-accent-blue shadow-sm shrink-0"
                          title={viewMode === 'grid' ? 'Vista ad Elenco' : 'Vista a Griglia'}
                        >
                          {viewMode === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}
                        </button>
                      )}

                      {/* Add Tool Button (Admin Only, Rightmost) */}
                      {currentUser?.ruolo === 'Admin' && selectedToolsIds.length === 0 && (
                        <button onClick={() => setShowAddModal(true)} className="glass-button w-10 h-10 rounded-full text-accent-blue border border-accent-blue/30 hover:bg-accent-blue/10 flex items-center justify-center shrink-0 shadow-sm" title="Nuovo Utensile">
                          <span className="text-lg font-black leading-none">+</span>
                        </button>
                      )}

                      {/* Cancel Selection Button (Bulk Mode Only, Rightmost) */}
                      {selectedToolsIds.length > 0 && (
                        <button onClick={() => setSelectedToolsIds([])} className="glass-button w-10 h-10 rounded-full text-rose-400 hover:bg-rose-400/10 flex items-center justify-center shrink-0 shadow-sm" title="Annulla Selezione">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {selectedToolsIds.length > 0 && (
                    <motion.button initial={{ opacity: 0, scale: 0.8, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 20 }}
                      onClick={() => setShowSelectionDrawer(true)} className="absolute right-6 -top-20 floating-badge-container z-[100] glass-panel bg-accent-blue/20 border-accent-blue/40 px-6 py-4 rounded-full flex items-center gap-4 group overflow-hidden shadow-lg"
                    >
                      <div className="absolute inset-0 bg-accent-blue/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                      <div className="relative flex items-center gap-3"><div className="bg-accent-blue text-slate-950 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center">{selectedToolsIds.length}</div><span className="text-[10px] font-black uppercase tracking-[0.2em] dark:text-white text-slate-900">Utensili Selezionati</span></div>
                    </motion.button>
                  )}
                </AnimatePresence>

              </motion.div>
          </AnimatePresence>

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
          {showMoveModal && <MovementModal key="move-modal" opType={opType} setOpType={setOpType} selectedTool={isBulkMode ? selectedToolsIds.length : selectedTool} modalQty={modalQty} setModalQty={setModalQty} setShowMoveModal={(val) => { setShowMoveModal(val); if (!val) setIsBulkMode(false); }} handleMovement={onConfirmMovement} isBulkMode={isBulkMode} onOpenOrder={() => setShowOrderModal(true)} currentUser={currentUser} />}
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
