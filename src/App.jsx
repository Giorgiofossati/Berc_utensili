import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy, useRef } from 'react';
import {
  X, List, LayoutGrid, CheckCircle2, AlertCircle, AlertTriangle, ClipboardList, Package, ListChecks, RotateCcw, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

import { useAuthStore } from './store/useAuthStore';
import { useInventoryStore } from './store/useInventoryStore';
import { useMovementStore } from './store/useMovementStore';
import { useMultiMovementStore } from './store/useMultiMovementStore';
import { useNavigationStore } from './store/useNavigationStore';
import { useCommesseStore } from './store/useCommesseStore';
import { useFilters } from './hooks/useFilters';

import { useMacchineStore } from './store/useMacchineStore';
import { useRichiesteStore } from './store/useRichiesteStore';

// Lazy load only secondary admin/separate views
const HistoryView = lazy(() => import('./features/admin/HistoryView'));
const ScannerView = lazy(() => import('./features/scanner/ScannerView'));
const OperatorsView = lazy(() => import('./features/admin/OperatorsView'));
const CommesseView = lazy(() => import('./features/admin/CommesseView'));
const MachinesView = lazy(() => import('./features/admin/MachinesView'));
const RichiesteView = lazy(() => import('./features/admin/RichiesteView'));
const ManagerDashboardView = lazy(() => import('./features/manager/ManagerDashboardView'));
const CostAnalysisView = lazy(() => import('./features/manager/CostAnalysisView'));
const CommessaAnalysisView = lazy(() => import('./features/manager/CommessaAnalysisView'));

// Standard imports for critical core UI to guarantee instant rendering and eliminate PWA logout chunk failures
import Sidebar from './components/layout/Sidebar';
import LoginScreen from './features/auth/LoginScreen';
import MultiMovementView from './features/inventory/MultiMovementView';
import CategoryGridCard from './features/filters/CategoryGridCard';
import ToolDetailDrawer from './features/inventory/ToolDetailDrawer';
import InProduzioneView from './features/produzione/InProduzioneView';
import RiaffilatureView from './features/produzione/RiaffilatureView';
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
import { PageTemplate, PageHeader, ResetFiltersButton } from './components/layout/PageTemplate';
import { IconMenu } from './components/ui/icon-button';
import { EXTRA_FILTER_KEYS } from './features/inventory/constants';

// Ordine canonico dei livelli del percorso: la cascata Tipologia → Forma → Diametro, poi gli attributi
const FILTER_ORDER = ['Tipologia', 'Forma', 'Diametro', ...EXTRA_FILTER_KEYS.map(e => e.key)];

// Preload static tool images in memory immediately
preloadToolImages();

// Toggle elenco/griglia (§2.2). Da md sta nella barra; su mobile sta accanto a "Mostra filtri"
function ViewModeToggle({ viewMode, setViewMode, className }) {
  return (
    <div
      data-tour="view-mode-toggle"
      role="group"
      aria-label="Tipo di vista"
      className={`shrink-0 flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 ${className || ''}`}
    >
      {[
        { mode: 'dropdown', label: 'Vista Tabella Dati', icon: <List size={17} /> },
        { mode: 'grid', label: 'Vista Griglia Schede', icon: <LayoutGrid size={17} /> },
      ].map(opt => (
        <button
          key={opt.mode}
          type="button"
          onClick={() => setViewMode(opt.mode)}
          aria-label={opt.label}
          aria-pressed={viewMode === opt.mode}
          title={opt.label}
          className={`w-8 h-8 rounded-md flex items-center justify-center font-bold transition-all cursor-pointer ${
            viewMode === opt.mode 
              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

function App() {
  const currentUser = useAuthStore(state => state.currentUser);
  
  const tools = useInventoryStore(state => state.tools);
  const fetchTools = useInventoryStore(state => state.fetchTools);
  const initInventoryRealtime = useInventoryStore(state => state.initRealtime);
  const cleanupInventoryRealtime = useInventoryStore(state => state.cleanupRealtime);
  const initCommesseRealtime = useCommesseStore(state => state.initRealtime);
  const cleanupCommesseRealtime = useCommesseStore(state => state.cleanupRealtime);
  const fetchMacchine = useMacchineStore(state => state.fetchMacchine);
  const initMacchineRealtime = useMacchineStore(state => state.initRealtime);
  const cleanupMacchineRealtime = useMacchineStore(state => state.cleanupRealtime);
  const fetchRichieste = useRichiesteStore(state => state.fetchRichieste);
  const initRichiesteRealtime = useRichiesteStore(state => state.initRealtime);
  const cleanupRichiesteRealtime = useRichiesteStore(state => state.cleanupRealtime);
  
  const {
    filterStack, setFilterStack,
    viewMode, setViewMode,
    selectedToolsIds, setSelectedToolsIds,
    filteredByStack, options, diameters, finalTools, currentLevel,
    handleSelectOption, handleSelectDiameter, resetFilters,
    isSelectionMode, handleSetIsSelectionMode, searchQuery, clearSearchQuery
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

  // Security Guard: Controllo accessi per ruolo e reindirizzamento preventivo
  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.ruolo || 'Operatore';
    if (role === 'Operatore') {
      const forbiddenForOperatore = [
        'operators', 'scanner', 'admin_requests', 
        'manager_dashboard', 'manager_costs', 'manager_commesse'
      ];
      if (forbiddenForOperatore.includes(view)) {
        setView('home');
      }
    } else if (role === 'Manager') {
      const forbiddenForManager = [
        'operators', 'scanner', 'admin_requests'
      ];
      if (forbiddenForManager.includes(view)) {
        setView('manager_dashboard');
      }
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
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const showSidebarMobile = useNavigationStore(state => state.isMobileSidebarOpen);
  const setShowSidebarMobile = useNavigationStore(state => state.setMobileSidebarOpen);
  const [isMobile, setIsMobile] = useState(false);

  const handleRequireSidebar = useCallback((needed) => {
    setShowSidebarMobile(needed);
  }, [setShowSidebarMobile]);

  const mainRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const { data, error } = await supabase.from('movements_history').select('*, Utensili_B1(*), commesse(codice, ubicazione)').order('created_at', { ascending: false });
      if (error) {
        setHistoryError(error.message);
      } else {
        setHistory(data || []);
      }
    } catch(e) {
      console.error(e);
      setHistoryError(e.message);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
    fetchMacchine();
    fetchRichieste();
    initInventoryRealtime();
    initCommesseRealtime();
    initMacchineRealtime();
    initRichiesteRealtime();

    const historyChannel = supabase
      .channel('realtime:movements_history')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'movements_history' },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      cleanupInventoryRealtime();
      cleanupCommesseRealtime();
      cleanupMacchineRealtime();
      cleanupRichiesteRealtime();
      supabase.removeChannel(historyChannel);
    };
  }, [
    fetchTools, fetchMacchine, fetchRichieste,
    initInventoryRealtime, cleanupInventoryRealtime, 
    initCommesseRealtime, cleanupCommesseRealtime,
    initMacchineRealtime, cleanupMacchineRealtime,
    initRichiesteRealtime, cleanupRichiesteRealtime,
    fetchHistory
  ]);

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

  // ── Percorso stile Esplora risorse (§2): ogni livello è cliccabile, ogni `›` apre gli altri elementi dello stesso livello
  const inventoryCrumbs = useMemo(() => {
    const filterTools = (stack) => stack.reduce(
      (res, f) => (f.skipped ? res : res.filter(t => String(t[f.type]) === String(f.value))),
      tools
    );
    const distinct = (list, key) => [...new Set(list.map(t => t[key]).filter(v => v !== null && v !== undefined && v !== ''))]
      .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

    // Figli del livello rappresentato da `prefix` (solo lungo la cascata Tipologia → Forma → Diametro)
    const childrenOf = (prefix) => {
      const lastType = prefix.length ? prefix[prefix.length - 1].type : null;
      const nextType = lastType === null ? 'Tipologia' : lastType === 'Tipologia' ? 'Forma' : lastType === 'Forma' ? 'Diametro' : null;
      if (!nextType) return null;
      const values = distinct(filterTools(prefix), nextType);
      return values.length ? { type: nextType, values } : null;
    };

    const goToSibling = (prefix, type, value) => {
      clearSearchQuery();
      setFilterStack(prefix);
      if (type === 'Diametro') handleSelectDiameter(value);
      else handleSelectOption({ type, label: value });
    };

    // prefisso = stack fino all'indice incluso, più eventuali livelli "saltati" subito dopo
    const prefixThrough = (idx) => {
      let end = idx + 1;
      while (end < filterStack.length && filterStack[end].skipped) end++;
      return filterStack.slice(0, end);
    };

    const siblingsFor = (prefix, current) => {
      const kids = childrenOf(prefix);
      if (!kids) return undefined;
      return {
        items: kids.values.map(v => ({
          label: String(v),
          value: v,
          active: current !== undefined && String(v) === String(current)
        })),
        onSelect: (v) => goToSibling(prefix, kids.type, v)
      };
    };

    const root = {
      label: 'Inventario',
      icon: <Package size={16} />,
      onClick: () => { clearSearchQuery(); resetFilters(); },
    };
    const crumbs = [root];
    filterStack.forEach((f, idx) => {
      if (f.skipped) return;
      // il genitore comprende anche gli eventuali livelli "saltati" che lo precedono (es. Forma N/A)
      const parentPrefix = filterStack.slice(0, idx);
      const siblings = siblingsFor(parentPrefix, f.value);
      crumbs.push({
        label: String(f.value),
        onClick: () => setFilterStack(prefixThrough(idx)),
        // solo se il livello del genitore è davvero questo tipo (in vista elenco l'ordine dei filtri è libero)
        siblings: siblings && childrenOf(parentPrefix)?.type === f.type ? siblings : undefined,
      });
    });
    return crumbs;
  }, [tools, filterStack, setFilterStack, resetFilters, clearSearchQuery, handleSelectOption, handleSelectDiameter]);

  const hasActiveFilters = filterStack.length > 0 || Boolean(searchQuery);
  const handleResetAll = useCallback(() => {
    clearSearchQuery();
    resetFilters();
  }, [clearSearchQuery, resetFilters]);

  const inventoryMenuItems = [
    ...(viewMode === 'dropdown' || currentLevel >= 3 ? [{
      label: isSelectionMode ? 'Annulla selezione' : 'Seleziona più utensili',
      icon: <ListChecks size={16} />,
      onClick: () => handleSetIsSelectionMode(!isSelectionMode),
    }] : []),
    ...(currentUser?.ruolo === 'Admin' ? [{ label: 'Nuovo utensile', icon: <Plus size={16} />, onClick: () => setShowAddModal(true) }] : []),
    { type: 'separator' },
    { label: 'Reset filtri', icon: <RotateCcw size={16} />, onClick: handleResetAll, disabled: !hasActiveFilters, destructive: true },
  ];

  const mobileViewToggle = <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} className="md:hidden" tour={isMobile} />;

  const renderGridHome = () => {
    if (currentLevel >= 2 && currentLevel < 3) return (
      <div className="@container w-full flex-1 flex flex-col items-center justify-center-safe my-auto px-2 sm:px-4 md:px-6 py-2 overflow-hidden">
        <DiameterList 
          diameters={diameters} 
          tools={filteredByStack} 
          onSelect={handleSelectDiameter} 
        />
      </div>
    );
    if (currentLevel >= 3) return (
      <ToolsGrid 
        tools={finalTools} 
        onSelectTool={handleSelectToolFromGrid} 
        isMobile={isMobile} 
        selectionMode="toggle"
        mobileFiltersAccessory={mobileViewToggle}
      />
    );
    if (!options || options.length === 0) return null;

    return (
      <div data-tour="catalog-categories" className="@container w-full max-w-6xl xl:max-w-7xl px-2 md:px-4 py-1 my-auto mx-auto flex flex-col justify-center items-center">
        <div className="grid grid-cols-2 @sm:grid-cols-3 @md:grid-cols-3 @xl:grid-cols-4 @3xl:grid-cols-5 gap-3 @sm:gap-4 @md:gap-6 w-fit mx-auto justify-center justify-items-center items-center">
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

      <div className="flex-1 flex flex-col relative overflow-hidden custom-scrollbar min-w-0 h-full isolate">

        <main className="flex-1 w-full flex flex-col items-center justify-start relative min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {view === 'home' && (
                <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="w-full h-full flex flex-col items-center relative">
                  <PageTemplate>
                    <PageHeader
                      title="Inventario"
                      crumbs={inventoryCrumbs}
                      searchPlaceholder={inventoryCrumbs.length > 1 ? `Cerca in ${inventoryCrumbs[inventoryCrumbs.length - 1].label}…` : 'Cerca codice, misura (es. D16)…'}
                      showBack={filterStack.length > 0}
                      crumbsTrailing={hasActiveFilters && <ResetFiltersButton placement="trailing" onClick={handleResetAll} />}
                      onBack={() => {
                        setFilterStack(prev => {
                          let nextStack = [...prev];
                          while (nextStack.length > 0) {
                            const popped = nextStack.pop();
                            if (!popped.skipped) break;
                          }
                          return nextStack;
                        });
                      }}
                      action={
                        <>
                          <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} className="max-md:hidden" tour={!isMobile} />
                          {hasActiveFilters && <ResetFiltersButton onClick={handleResetAll} />}
                          <IconMenu items={inventoryMenuItems} ariaLabel="Altre azioni inventario" className="glass-button border border-slate-900/10 dark:border-white/10" />
                        </>
                      }
                    />
                    {viewMode === 'grid' ? (
                      <>
                        {/* Mobile: il toggle vista sta dove starebbe accanto a "Mostra filtri" (dal 3° livello lo porta ToolsGrid) */}
                        {currentLevel < 3 && (
                          <div className="md:hidden flex justify-end px-2 pt-2 shrink-0">{mobileViewToggle}</div>
                        )}
                        <div className={`w-full flex-1 flex flex-col items-center justify-center-safe min-h-0 @container ${currentLevel < 3 ? 'overflow-y-auto custom-scrollbar py-2 md:py-0' : 'overflow-hidden'}`}>
                          {renderGridHome()}
                        </div>
                      </>
                    ) : (
                      <div className="w-full flex-1 flex flex-col items-center min-h-0">
                        <DropdownFilterView tools={tools} onSelectTool={handleSelectToolFromGrid} isMobile={isMobile} mobileFiltersAccessory={mobileViewToggle} initialFilters={Object.fromEntries(filterStack.map(f => [f.type, f.value]))}
                          onFilterChange={(newFilters) => {
                            const newStack = Object.entries(newFilters)
                              .filter(([, v]) => v)
                              .sort(([a], [b]) => FILTER_ORDER.indexOf(a) - FILTER_ORDER.indexOf(b))
                              .map(([k, v]) => ({ type: k, value: v }));
                            setFilterStack(prev => (JSON.stringify(prev.filter(f => !f.skipped)) === JSON.stringify(newStack) ? prev : newStack));
                          }}
                        />
                      </div>
                    )}
                  </PageTemplate>
                </motion.div>
              )}
              {view === 'history' && (
                <ErrorBoundary>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                    <HistoryView key="history" history={history} isLoading={isHistoryLoading} error={historyError} setView={setView} fetchHistory={fetchHistory} />
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
              {view === 'produzione' && (
                <ErrorBoundary>
                  <InProduzioneView key="produzione" setView={setView} showToastNotification={showToastNotification} />
                </ErrorBoundary>
              )}
              {view === 'riaffilature' && (
                <ErrorBoundary>
                  <RiaffilatureView key="riaffilature" setView={setView} showToastNotification={showToastNotification} />
                </ErrorBoundary>
              )}
              {view === 'multimovement' && (
                <ErrorBoundary>
                  <MultiMovementView showToastNotification={showToastNotification} />
                </ErrorBoundary>
              )}
              {view === 'machines' && (
                <ErrorBoundary>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                    <MachinesView key="machines" setView={setView} showToastNotification={showToastNotification} />
                  </Suspense>
                </ErrorBoundary>
              )}
              {(view === 'requests' || view === 'admin_requests') && (
                <ErrorBoundary>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                    <RichiesteView key="richieste" setView={setView} showToastNotification={showToastNotification} />
                  </Suspense>
                </ErrorBoundary>
              )}
              {view === 'manager_dashboard' && (
                <ErrorBoundary>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                    <ManagerDashboardView key="manager_dashboard" setView={setView} />
                  </Suspense>
                </ErrorBoundary>
              )}
              {view === 'manager_costs' && (
                <ErrorBoundary>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                    <CostAnalysisView key="manager_costs" setView={setView} />
                  </Suspense>
                </ErrorBoundary>
              )}
              {view === 'manager_commesse' && (
                <ErrorBoundary>
                  <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>}>
                    <CommessaAnalysisView key="manager_commesse" setView={setView} />
                  </Suspense>
                </ErrorBoundary>
              )}
            </AnimatePresence>
        </main>

        {/* Barra Contestuale: Trasferimento Selezione a Movimento Multiplo */}
        <AnimatePresence>
          {selectedToolsIds.length > 0 && view === 'home' && (
            <motion.div key="global-command-bar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full flex flex-col items-center px-2 md:px-4 z-50 shrink-0 pt-2 pb-2 relative" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
              <div className="w-full max-w-xl flex flex-col shrink-0 pointer-events-auto">
                <div className="pointer-events-auto flex items-center justify-between w-full bg-white/90 dark:bg-slate-900/90 rounded-3xl md:rounded-3xl p-2 md:p-3 md:px-4 border border-accent-blue/30 dark:border-accent-blue/30 gap-3 shadow-2xl backdrop-blur-3xl">
                  <div className="flex items-center gap-2">
                    <div className="bg-accent-blue text-slate-950 font-black text-xs md:text-sm w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-inner font-mono">{selectedToolsIds.length}</div>
                    <span className="hidden sm:inline app-label dark:text-white text-slate-900">Selezionati</span>
                  </div>
                  <button 
                    onClick={handleTransferToMultiMovement} 
                    className="action-btn action-btn-primary py-2 sm:py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 group shadow-sm text-xs md:text-sm flex-1 font-black tracking-wider"
                  >
                    <ClipboardList size={16} />
                    <span>Apri in Movimento Multiplo</span>
                  </button>
                  <button onClick={() => setSelectedToolsIds([])} className="glass-button p-2 rounded-xl md:rounded-xl text-rose-400 hover:bg-rose-400/10 flex items-center justify-center shrink-0" title="Annulla Selezione">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
            {showMoveModal && <ToolDetailDrawer key="tool-detail-drawer" setShowMoveModal={(val) => { setShowMoveModal(val); if (!val) setIsBulkMode(false); }} onConfirm={(commessaId) => {
              handleMovement(showToastNotification, () => {
                setShowMoveModal(false);
                setSelectedToolsIds([]);
                setIsBulkMode(false);
              }, commessaId);
            }} onOpenOrder={() => setShowOrderModal(true)} notify={showToastNotification} onLifecycleDone={() => {
              setShowMoveModal(false);
              setSelectedToolsIds([]);
              setIsBulkMode(false);
            }} />}
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
            <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed left-4 right-4 md:left-auto md:right-12 z-50 pointer-events-auto safe-toast-top">
              <div className={`glass-panel p-3.5 sm:p-4 md:p-6 rounded-3xl border-l-[6px] flex items-center gap-3.5 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl max-w-lg ${
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
                  <p className={`text-xs font-black tracking-[0.2em] mb-0.5 ${
                    toast.type === 'error'
                      ? 'text-accent-rose'
                      : toast.type === 'warning'
                      ? 'text-accent-orange'
                      : 'text-accent-emerald'
                  }`}>
                    {toast.type === 'error' ? 'Errore Operativo' : toast.type === 'warning' ? 'Avviso' : 'Notifica Sistema'}
                  </p>
                  <p className="app-h3 break-words">
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
                    className="ml-auto px-3 py-1.5 rounded-xl bg-accent-orange/15 hover:bg-accent-orange/25 border border-accent-orange/30 text-accent-orange text-xs sm:text-xs font-black tracking-wider transition-all active:scale-95 cursor-pointer shrink-0"
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
