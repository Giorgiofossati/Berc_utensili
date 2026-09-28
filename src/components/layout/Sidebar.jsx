import React, { useMemo, useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, History, Users, 
  LogOut, ArrowDown, ArrowUp,
  Sun, Moon, X, HelpCircle, ClipboardList, Settings,
  FolderKanban, Factory, Recycle, Plus,
  Inbox, Cpu, LayoutDashboard, TrendingUp, BarChart3, ScanBarcode, Send,
  Pin, PinOff
} from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useMovementStore } from '../../store/useMovementStore';
import { useMultiMovementStore } from '../../store/useMultiMovementStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useTutorialStore } from '../../store/useTutorialStore';
import { useRichiesteStore } from '../../store/useRichiesteStore';
import { lifecycleUiEnabled } from '../../lib/lifecycleApi';
import { useProduzioneStore } from '../../store/useProduzioneStore';

const NavItem = ({ 
  icon, 
  label, 
  onClick, 
  className = "", 
  isActive = false, 
  badge = null, 
  disabled = false, 
  isCollapsed = false,
  dataTour = undefined
}) => {
  return (
    <button 
      type="button"
      data-tour={dataTour}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={label}
      title={isCollapsed ? label : undefined}
      className={`w-full h-10 rounded-xl flex items-center transition-all duration-200 group relative cursor-pointer select-none overflow-hidden
        ${isCollapsed ? 'px-0 justify-center' : 'px-2.5 gap-3'}
        ${isActive 
          ? 'bg-sky-50 dark:bg-sky-950/50 border border-sky-200/80 dark:border-sky-800 text-sky-700 dark:text-sky-300 shadow-xs' 
          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `}
    >
      <div className={`w-8 h-8 flex items-center justify-center shrink-0 transition-colors
        ${isActive 
          ? 'text-sky-600 dark:text-sky-400' 
          : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}
      `}>
        {icon}
      </div>

      <span className={`text-xs font-semibold tracking-wide truncate transition-all duration-[350ms] ease-out text-left whitespace-nowrap ${
        isCollapsed 
          ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none' 
          : 'opacity-100 max-w-[240px] translate-x-0'
      }`}>
        {label}
      </span>

      {badge !== null && badge !== undefined && (
        <span className={`bg-sky-600 text-white text-[11px] font-bold rounded-full shadow-xs transition-all duration-200 ${
          isCollapsed 
            ? 'absolute top-1.5 right-2 px-1 py-0.2 min-w-[16px] text-center text-[11px]' 
            : 'ml-auto px-1.5 py-0.2'
        }`}>
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

const SidebarContent = ({ 
  isMobile,
  setView, 
  fetchHistory, 
  setShowAddModal, 
  setShowSettingsModal, 
  onClose, 
  view, 
  isCollapsed = false, 
  isPinned = false,
  togglePin 
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const currentUser = useAuthStore(state => state.currentUser);
  const logout = useAuthStore(state => state.logout);
  const setOpType = useMovementStore(state => state.setOpType);
  const startTutorial = useTutorialStore(state => state.startTutorial);
  const multiMovementCount = useMultiMovementStore(state => state.items.length);
  const pezziCestello = useProduzioneStore(state => state.riaffilature.cestello.reduce((a, c) => a + c.quantita, 0));

  const ruolo = currentUser?.ruolo || 'Operatore';
  const isOperatore = ruolo === 'Operatore';
  const isAdmin = ruolo === 'Admin';
  const isManager = ruolo === 'Manager';

  const richieste = useRichiesteStore(state => state.richieste);
  const fetchRichieste = useRichiesteStore(state => state.fetchRichieste);

  useEffect(() => {
    fetchRichieste();
  }, [fetchRichieste]);

  const pendingRichiesteCount = useMemo(
    () => richieste.filter(r => r.stato === 'in_attesa').length,
    [richieste]
  );

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      {/* Header / Brand & Pin / Close Toggle */}
      <div className="h-16 px-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden shadow-xs p-1">
            <img src="/favicon.svg" alt="Bercella" className="w-full h-full object-contain" />
          </div>
          <div className={`flex flex-col min-w-0 transition-all duration-[350ms] ease-out whitespace-nowrap ${
            isCollapsed ? 'opacity-0 max-w-0 pointer-events-none -translate-x-2' : 'opacity-100 max-w-[160px] translate-x-0'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              Magazzino
            </span>
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight mt-0.5 truncate">
              Bercella CNC
            </h1>
          </div>
        </div>

        {/* Action button on right of header */}
        {isMobile && onClose ? (
          <button 
            type="button"
            onClick={onClose} 
            aria-label="Chiudi barra laterale"
            className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shrink-0 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        ) : togglePin ? (
          <button 
            type="button"
            onClick={togglePin}
            aria-label={isPinned ? "Sblocca menu (auto-collassa)" : "Blocca menu aperto"}
            title={isPinned ? "Sblocca menu (chiusura automatica all'allontanamento)" : "Blocca menu aperto (in affiancamento)"}
            className={`w-8 h-8 rounded-lg border transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer ${
              isCollapsed ? 'opacity-0 pointer-events-none w-0 p-0 border-0' : 'opacity-100'
            } ${
              isPinned
                ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400'
                : 'border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
          </button>
        ) : null}
      </div>

      {/* Quick Actions (Personalizzate per Ruolo) */}
      <div 
        data-tour="quick-actions"
        className={`p-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2 shrink-0 overflow-hidden ${
          isCollapsed ? 'items-center' : ''
        }`}
      >
        <span className={`text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 transition-all duration-200 whitespace-nowrap overflow-hidden ${
          isCollapsed ? 'opacity-0 h-0 my-0 py-0' : 'opacity-100 h-4'
        }`}>
          {isAdmin ? 'Operazioni Rapide' : isOperatore ? 'Richieste Rapide' : 'Panoramica'}
        </span>

        {/* 1. ADMIN QUICK ACTIONS */}
        {isAdmin && (
          <div className="flex flex-col gap-2 w-full">
            <button 
              type="button"
              onClick={() => { setOpType('carico'); setView('scanner'); if(onClose) onClose(); }} 
              title="Deposita utensile (Carico)"
              aria-label="Deposita"
              className={`w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center transition-all duration-150 active:scale-[0.98] group cursor-pointer overflow-hidden shadow-xs ${
                isCollapsed ? 'justify-center px-0' : 'px-3 gap-2.5'
              }`}
            >
              <ArrowDown size={18} className="shrink-0 group-hover:translate-y-0.5 transition-transform" />
              <span className={`tracking-widest font-extrabold text-xs transition-all duration-[350ms] ease-out whitespace-nowrap ${
                isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[240px]'
              }`}>
                Deposita
              </span>
            </button>
            
            <button 
              type="button"
              onClick={() => { setOpType('scarico'); setView('scanner'); if(onClose) onClose(); }} 
              title="Preleva utensile (Scarico)"
              aria-label="Preleva"
              className={`w-full h-10 bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center transition-all duration-150 active:scale-[0.98] group cursor-pointer overflow-hidden shadow-xs ${
                isCollapsed ? 'justify-center px-0' : 'px-3 gap-2.5'
              }`}
            >
              <ArrowUp size={18} className="shrink-0 group-hover:-translate-y-0.5 transition-transform" />
              <span className={`tracking-widest font-extrabold text-xs transition-all duration-[350ms] ease-out whitespace-nowrap ${
                isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[240px]'
              }`}>
                Preleva
              </span>
            </button>

            <button 
              type="button"
              onClick={() => { setShowAddModal(true); if(onClose) onClose(); }} 
              title="Nuovo Utensile"
              aria-label="Nuovo Utensile"
              className={`w-full h-10 border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-50 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-xl flex items-center transition-all duration-150 cursor-pointer overflow-hidden ${
                isCollapsed ? 'justify-center px-0' : 'px-3 gap-2'
              }`}
            >
              <Plus size={18} className="shrink-0" />
              <span className={`tracking-wider font-bold text-xs transition-all duration-[350ms] ease-out whitespace-nowrap ${
                isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[240px]'
              }`}>
                Nuovo Utensile
              </span>
            </button>
          </div>
        )}

        {/* 2. OPERATORE QUICK ACTIONS */}
        {isOperatore && (
          <div className="flex flex-col gap-2 w-full">
            <button 
              type="button"
              onClick={() => { setView('requests'); if(onClose) onClose(); }} 
              title="Invia Richiesta all'Amministratore"
              aria-label="Richiedi Utensile"
              className={`w-full h-10 bg-sky-600 hover:bg-sky-500 text-white rounded-xl flex items-center transition-all duration-150 active:scale-[0.98] group cursor-pointer overflow-hidden shadow-xs ${
                isCollapsed ? 'justify-center px-0' : 'px-3 gap-2.5'
              }`}
            >
              <Send size={16} className="shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              <span className={`tracking-wider font-extrabold text-xs transition-all duration-[350ms] ease-out whitespace-nowrap ${
                isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[240px]'
              }`}>
                Richiedi Utensile
              </span>
            </button>

            <button 
              type="button"
              onClick={() => { setView('multimovement'); if(onClose) onClose(); }} 
              title="Compila Distinta Multipla"
              aria-label="Distinta Multipla"
              className={`w-full h-9 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl flex items-center transition-all cursor-pointer overflow-hidden ${
                isCollapsed ? 'justify-center px-0' : 'px-3 gap-2'
              }`}
            >
              <ClipboardList size={16} className="shrink-0" />
              <span className={`font-semibold text-xs transition-all duration-[350ms] ease-out whitespace-nowrap ${
                isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[240px]'
              }`}>
                Distinta Multipla
              </span>
            </button>
          </div>
        )}

        {/* 3. MANAGER QUICK ACTIONS */}
        {isManager && (
          <div className="flex flex-col gap-2 w-full">
            <button 
              type="button"
              onClick={() => { setView('manager_dashboard'); if(onClose) onClose(); }} 
              title="Dashboard Direzionale"
              aria-label="Dashboard Direzionale"
              className={`w-full h-10 bg-sky-600 hover:bg-sky-500 text-white rounded-xl flex items-center transition-all duration-150 active:scale-[0.98] cursor-pointer overflow-hidden shadow-xs ${
                isCollapsed ? 'justify-center px-0' : 'px-3 gap-2.5'
              }`}
            >
              <LayoutDashboard size={16} className="shrink-0" />
              <span className={`tracking-wider font-extrabold text-xs transition-all duration-[350ms] ease-out whitespace-nowrap ${
                isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[240px]'
              }`}>
                Panoramica KPI
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu (Preset Specifici per Ruolo) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3 flex flex-col gap-1 overflow-x-hidden">
        <span className={`text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 transition-all duration-200 whitespace-nowrap overflow-hidden ${
          isCollapsed ? 'opacity-0 h-0 my-0 py-0' : 'opacity-100 h-4 mb-1'
        }`}>
          Menu Navigazione
        </span>

        <div className="flex flex-col gap-1 w-full">
          {/* ============================================================== */}
          {/* MENU OPERATORE                                                 */}
          {/* ============================================================== */}
          {isOperatore && (
            <>
              <NavItem 
                icon={<Database size={18} />} 
                label="Inventario" 
                dataTour="inventory-nav"
                onClick={() => { setView('home'); if(onClose) onClose(); }} 
                isActive={view === 'home'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<Send size={18} />} 
                label="Richiesta Deposito/Prelievo" 
                dataTour="requests-nav"
                onClick={() => { setView('requests'); if(onClose) onClose(); }} 
                isActive={view === 'requests'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<ClipboardList size={18} />} 
                label="Movimento Multiplo" 
                dataTour="multimovement-nav"
                badge={multiMovementCount > 99 ? '99+' : (multiMovementCount > 0 ? multiMovementCount : null)}
                onClick={() => { setView('multimovement'); if(onClose) onClose(); }} 
                isActive={view === 'multimovement'}
                isCollapsed={isCollapsed}
              />

              {lifecycleUiEnabled && (
                <NavItem 
                  icon={<Factory size={18} />} 
                  label="In produzione" 
                  dataTour="produzione-nav"
                  onClick={() => { setView('produzione'); if(onClose) onClose(); }} 
                  isActive={view === 'produzione'}
                  isCollapsed={isCollapsed}
                />
              )}

              <NavItem 
                icon={<History size={18} />} 
                label="Storico movimenti" 
                dataTour="history-nav"
                onClick={() => { setView('history'); fetchHistory(); if(onClose) onClose(); }} 
                isActive={view === 'history'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<HelpCircle size={18} />} 
                label="Guida" 
                dataTour="help-nav"
                onClick={() => { 
                  startTutorial(); 
                  if(onClose) onClose(); 
                }} 
                isCollapsed={isCollapsed}
              />
            </>
          )}

          {/* ============================================================== */}
          {/* MENU AMMINISTRATORI                                            */}
          {/* ============================================================== */}
          {isAdmin && (
            <>
              <NavItem 
                icon={<Inbox size={18} />} 
                label="Richieste" 
                dataTour="requests-nav"
                badge={pendingRichiesteCount > 0 ? pendingRichiesteCount : null}
                onClick={() => { setView('admin_requests'); if(onClose) onClose(); }} 
                isActive={view === 'admin_requests' || view === 'requests'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<Database size={18} />} 
                label="Inventario" 
                dataTour="inventory-nav"
                onClick={() => { setView('home'); if(onClose) onClose(); }} 
                isActive={view === 'home'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<ScanBarcode size={18} />} 
                label="Deposita / Preleva" 
                dataTour="scanner-nav"
                onClick={() => { setView('scanner'); if(onClose) onClose(); }} 
                isActive={view === 'scanner'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<FolderKanban size={18} />} 
                label="Gestione Commesse" 
                dataTour="commesse-nav"
                onClick={() => { setView('commesse'); if(onClose) onClose(); }} 
                isActive={view === 'commesse'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<Users size={18} />} 
                label="Gestione Operatori" 
                dataTour="operators-nav"
                onClick={() => { setView('operators'); if(onClose) onClose(); }} 
                isActive={view === 'operators'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<Cpu size={18} />} 
                label="Gestione Macchine" 
                dataTour="machines-nav"
                onClick={() => { setView('machines'); if(onClose) onClose(); }} 
                isActive={view === 'machines'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<ClipboardList size={18} />} 
                label="Movimento Multiplo" 
                dataTour="multimovement-nav"
                badge={multiMovementCount > 99 ? '99+' : (multiMovementCount > 0 ? multiMovementCount : null)}
                onClick={() => { setView('multimovement'); if(onClose) onClose(); }} 
                isActive={view === 'multimovement'}
                isCollapsed={isCollapsed}
              />

              {lifecycleUiEnabled && (
                <NavItem 
                  icon={<Factory size={18} />} 
                  label="In produzione" 
                  dataTour="produzione-nav"
                  onClick={() => { setView('produzione'); if(onClose) onClose(); }} 
                  isActive={view === 'produzione'}
                  isCollapsed={isCollapsed}
                />
              )}

              {lifecycleUiEnabled && (
                <NavItem 
                  icon={<Recycle size={18} />} 
                  label="Riaffilature" 
                  dataTour="riaffilature-nav"
                  badge={pezziCestello > 0 ? pezziCestello : null}
                  onClick={() => { setView('riaffilature'); if(onClose) onClose(); }} 
                  isActive={view === 'riaffilature'}
                  isCollapsed={isCollapsed}
                />
              )}

              <NavItem 
                icon={<History size={18} />} 
                label="Storico movimenti" 
                dataTour="history-nav"
                onClick={() => { setView('history'); fetchHistory(); if(onClose) onClose(); }} 
                isActive={view === 'history'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<HelpCircle size={18} />} 
                label="Guida" 
                dataTour="help-nav"
                onClick={() => { 
                  startTutorial(); 
                  if(onClose) onClose(); 
                }} 
                isCollapsed={isCollapsed}
              />
            </>
          )}

          {/* ============================================================== */}
          {/* MENU MANAGER                                                   */}
          {/* ============================================================== */}
          {isManager && (
            <>
              <NavItem 
                icon={<LayoutDashboard size={18} />} 
                label="Dashboard" 
                dataTour="dashboard-nav"
                onClick={() => { setView('manager_dashboard'); if(onClose) onClose(); }} 
                isActive={view === 'manager_dashboard'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<TrendingUp size={18} />} 
                label="Analisi Economica / Costi" 
                dataTour="costs-nav"
                onClick={() => { setView('manager_costs'); if(onClose) onClose(); }} 
                isActive={view === 'manager_costs'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<BarChart3 size={18} />} 
                label="Analisi per commessa" 
                dataTour="commesse-analysis-nav"
                onClick={() => { setView('manager_commesse'); if(onClose) onClose(); }} 
                isActive={view === 'manager_commesse'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<Database size={18} />} 
                label="Inventario" 
                dataTour="inventory-nav"
                onClick={() => { setView('home'); if(onClose) onClose(); }} 
                isActive={view === 'home'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<FolderKanban size={18} />} 
                label="Commesse" 
                dataTour="commesse-nav"
                onClick={() => { setView('commesse'); if(onClose) onClose(); }} 
                isActive={view === 'commesse'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<History size={18} />} 
                label="Storico movimenti" 
                dataTour="history-nav"
                onClick={() => { setView('history'); fetchHistory(); if(onClose) onClose(); }} 
                isActive={view === 'history'}
                isCollapsed={isCollapsed}
              />

              <NavItem 
                icon={<HelpCircle size={18} />} 
                label="Guida" 
                dataTour="help-nav"
                onClick={() => { 
                  startTutorial(); 
                  if(onClose) onClose(); 
                }} 
                isCollapsed={isCollapsed}
              />
            </>
          )}
        </div>
      </div>

      {/* Footer / User Profile */}
      <div 
        data-tour="user-profile"
        className="p-2.5 border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden"
      >
        <div className={`flex items-center rounded-xl transition-all duration-200 ${
          isCollapsed ? 'justify-center p-0' : 'justify-between p-1.5 border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
        }`}>
          {/* Avatar + Info */}
          <button
            type="button"
            onClick={() => {
              if (setShowSettingsModal) setShowSettingsModal(true);
              if (onClose) onClose();
            }}
            className="flex items-center gap-2 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer group/user"
            title={`${currentUser?.nome || 'Utente'} (${currentUser?.ruolo || 'Operatore'})`}
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover/user:scale-105 transition-transform">
                {currentUser?.nome?.charAt(0) || 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
            </div>
            
            <div data-fit-ignore className={`flex flex-col min-w-0 transition-all duration-[350ms] ease-out whitespace-nowrap ${
              isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[95px]'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 leading-none">
                {currentUser?.ruolo || 'Guest'}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight mt-0.5 truncate">
                {currentUser?.nome || 'Mario'}
              </span>
            </div>
          </button>

          {/* Quick buttons: Settings, Theme, Logout */}
          <div className={`flex items-center gap-0.5 shrink-0 transition-all duration-[350ms] ease-out ${
            isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[95px]'
          }`}>
            <button 
              type="button"
              onClick={() => {
                if (setShowSettingsModal) setShowSettingsModal(true);
                if (onClose) onClose();
              }}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Impostazioni"
              aria-label="Impostazioni"
            >
              <Settings size={15} />
            </button>
            <button 
              type="button"
              onClick={toggleTheme}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
              title="Cambia Tema"
              aria-label="Cambia Tema"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button 
              type="button"
              onClick={() => { logout(); if(onClose) onClose(); }}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Sidebar(props) {
  const { isMobile, isOpen, onClose } = props;
  
  // Navigation store
  const isSidebarPinned = useNavigationStore(state => state.isSidebarPinned);
  const toggleSidebarPinned = useNavigationStore(state => state.toggleSidebarPinned);
  
  // Tutorial store - keep sidebar expanded if tutorial is highlighting a sidebar element
  const isTutorialOpen = useTutorialStore(state => state.isOpen);
  const currentStep = useTutorialStore(state => state.currentStep);
  const tutorialSteps = useTutorialStore(state => state.steps);
  const isTourFocusingSidebar = isTutorialOpen && tutorialSteps[currentStep]?.requireSidebar;

  const [isHovered, setIsHovered] = useState(false);
  const leaveTimeoutRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    // Threshold di chiusura aumentato a 450ms per una risposta calma e tollerante
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 450);
  }, []);

  const handleFocusCapture = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleBlurCapture = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
      leaveTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 450);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  // Larghezza da espanso = la minima che contiene le etichette senza troncarle.
  // Misurata su un clone fuori schermo a max-content (il nome utente nel footer
  // è escluso: è un dato variabile e può troncarsi).
  const asideRef = useRef(null);
  const [expandedWidth, setExpandedWidth] = useState(null);
  const isExpanded = isSidebarPinned || isHovered || isTourFocusingSidebar;

  useLayoutEffect(() => {
    const aside = asideRef.current;
    if (!aside || !isExpanded) return;

    const measure = () => {
      const clone = aside.cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      clone.querySelectorAll('[data-tour]').forEach(el => el.removeAttribute('data-tour'));
      clone.querySelectorAll('[data-fit-ignore]').forEach(el => { el.style.maxWidth = '0px'; });
      clone.setAttribute('aria-hidden', 'true');
      Object.assign(clone.style, {
        width: 'max-content', visibility: 'hidden', pointerEvents: 'none',
        position: 'fixed', left: '-9999px', top: '0', transition: 'none',
      });
      document.body.appendChild(clone);
      const width = Math.ceil(clone.getBoundingClientRect().width);
      clone.remove();
      setExpandedWidth(prev => (prev === width ? prev : width));
    };

    measure();
    // Ricalcola quando cambiano le voci (ruolo, badge) o dopo il caricamento dei font
    const observer = new MutationObserver(measure);
    observer.observe(aside, { childList: true, subtree: true, characterData: true });
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [isExpanded]);

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[var(--z-drawer)]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] h-[100dvh] min-h-[100dvh] z-[var(--z-drawer)] shadow-2xl"
            >
              <SidebarContent {...props} isCollapsed={false} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  const widthStyle = expandedWidth ? { width: expandedWidth } : undefined;

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      className={`hidden md:block shrink-0 relative h-full select-none transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-40 ${
        isSidebarPinned ? 'w-56' : 'w-[68px]'
      }`}
      style={isSidebarPinned ? widthStyle : undefined}
    >
      {/* Buffer di tolleranza perimetrale solo quando espanso, per evitare chiusure accidentali */}
      {isExpanded && (
        <div 
          aria-hidden="true"
          className="absolute top-0 bottom-0 -right-6 w-6 pointer-events-auto z-40" 
        />
      )}

      <aside 
        id="sidebar"
        ref={asideRef}
        style={isExpanded ? widthStyle : undefined}
        className={`absolute top-0 left-0 bottom-0 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          isExpanded 
            ? 'w-56 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/5' 
            : 'w-[68px] shadow-none'
        }`}
      >
        <SidebarContent 
          {...props} 
          isCollapsed={!isExpanded} 
          isPinned={isSidebarPinned} 
          togglePin={toggleSidebarPinned} 
        />
      </aside>
    </div>
  );
}
