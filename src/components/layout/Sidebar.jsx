import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, History, Users, 
  LogOut, ArrowDown, ArrowUp,
  Sun, Moon, X, HelpCircle, ClipboardList, Settings,
  FolderKanban, Factory, Recycle, ChevronsLeft, ChevronsRight, Plus
} from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useMovementStore } from '../../store/useMovementStore';
import { useMultiMovementStore } from '../../store/useMultiMovementStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useTutorialStore } from '../../store/useTutorialStore';
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
  isCollapsed = false 
}) => {
  if (isCollapsed) {
    return (
      <button 
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors group relative cursor-pointer
          ${isActive 
            ? 'bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 shadow-xs' 
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}
          ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
          ${className}
        `}
      >
        <div className={`${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'} transition-colors`}>
          {icon}
        </div>
        {isActive && (
          <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-sky-600" />
        )}
        {badge !== null && badge !== undefined && !isActive && (
          <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-xs font-bold px-1 rounded-full shadow-xs">
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button 
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={label}
      className={`w-full h-10 px-2.5 rounded-lg flex items-center gap-3 font-semibold text-xs tracking-wide transition-colors group relative cursor-pointer
        ${isActive 
          ? 'bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800 text-sky-700 dark:text-sky-300' 
          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium'}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `}
    >
      <div className={`shrink-0 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'} transition-colors`}>
        {icon}
      </div>
      <span className="truncate">{label}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" />
      )}
      {badge !== null && badge !== undefined && (
        <span className="ml-auto bg-sky-600 text-white text-xs font-bold px-1.5 py-0.2 rounded-full shadow-xs">
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
  toggleCollapse 
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const currentUser = useAuthStore(state => state.currentUser);
  const logout = useAuthStore(state => state.logout);
  const setOpType = useMovementStore(state => state.setOpType);
  const startTutorial = useTutorialStore(state => state.startTutorial);
  const multiMovementCount = useMultiMovementStore(state => state.items.length);
  const pezziCestello = useProduzioneStore(state => state.riaffilature.cestello.reduce((a, c) => a + c.quantita, 0));

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      {/* Header / Brand & Toggle */}
      <div className="h-16 px-3 sm:px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
        {isCollapsed ? (
          <div className="w-full flex items-center justify-center">
            <button 
              type="button"
              aria-label="Espandi barra laterale"
              onClick={toggleCollapse}
              title="Espandi Sidebar"
              className="w-9 h-9 rounded-lg border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0 transition-opacity duration-200">
              <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200/80 dark:border-sky-800 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400">
                <Database size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 leading-none">
                  Magazzino
                </span>
                <h1 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-none mt-1 truncate">
                  Bercella CNC
                </h1>
              </div>
            </div>

            {/* Toggle Collapse Button or Mobile Close */}
            {isMobile && onClose ? (
              <button 
                type="button"
                onClick={onClose} 
                aria-label="Chiudi barra laterale"
                className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shrink-0 transition-colors"
              >
                <X size={18} />
              </button>
            ) : toggleCollapse ? (
              <button 
                type="button"
                aria-label="Collassa barra laterale"
                onClick={toggleCollapse}
                title="Riduci Sidebar"
                className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-all ml-auto cursor-pointer"
              >
                <ChevronsLeft size={18} />
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className={`p-3 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2 shrink-0 ${isCollapsed ? 'items-center' : ''}`}>
        {!isCollapsed && (
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Azioni Rapide
          </span>
        )}

        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 w-full">
            <button 
              type="button"
              onClick={() => { setOpType('carico'); setView('scanner'); if(onClose) onClose(); }} 
              title="Deposita utensile"
              aria-label="Deposita"
              className="w-10 h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-sm transition-all duration-150 active:scale-[0.98] group cursor-pointer"
            >
              <ArrowDown size={20} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
            <button 
              type="button"
              onClick={() => { setOpType('scarico'); setView('scanner'); if(onClose) onClose(); }} 
              title="Preleva utensile"
              aria-label="Preleva"
              className="w-10 h-10 bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-sm transition-all duration-150 active:scale-[0.98] group cursor-pointer"
            >
              <ArrowUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
            {currentUser?.ruolo === 'Admin' && (
              <button 
                type="button"
                onClick={() => { setShowAddModal(true); if(onClose) onClose(); }} 
                title="Nuovo Utensile"
                aria-label="Nuovo Utensile"
                className="w-10 h-10 border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/40 hover:bg-sky-50 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button 
              type="button"
              onClick={() => { setOpType('carico'); setView('scanner'); if(onClose) onClose(); }} 
              title="Deposita utensile"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2.5 font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-150 active:scale-[0.98] group cursor-pointer"
            >
              <ArrowDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
              <span className="tracking-widest font-extrabold">DEPOSITA</span>
            </button>
            
            <button 
              type="button"
              onClick={() => { setOpType('scarico'); setView('scanner'); if(onClose) onClose(); }} 
              title="Preleva utensile"
              className="w-full h-11 bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center justify-center gap-2.5 font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-150 active:scale-[0.98] group cursor-pointer"
            >
              <ArrowUp size={18} className="group-hover:-translate-y-0.5 transition-transform" />
              <span className="tracking-widest font-extrabold">PRELEVA</span>
            </button>

            {currentUser?.ruolo === 'Admin' && (
              <button 
                type="button"
                onClick={() => { setShowAddModal(true); if(onClose) onClose(); }} 
                title="Nuovo Utensile"
                className="w-full h-10 border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-50 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer"
              >
                <Plus size={18} />
                <span className="tracking-wider">NUOVO UTENSILE</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3 flex flex-col gap-1">
        {!isCollapsed && (
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
            Menu Navigazione
          </span>
        )}

        <div className={`flex flex-col ${isCollapsed ? 'items-center gap-1.5' : 'gap-1'} w-full`}>
          <NavItem 
            icon={<Database size={isCollapsed ? 20 : 18} />} 
            label="Inventario" 
            onClick={() => { setView('home'); if(onClose) onClose(); }} 
            isActive={view === 'home'}
            isCollapsed={isCollapsed}
          />

          {lifecycleUiEnabled && (
            <NavItem 
              icon={<Factory size={isCollapsed ? 20 : 18} />} 
              label="In produzione" 
              onClick={() => { setView('produzione'); if(onClose) onClose(); }} 
              isActive={view === 'produzione'}
              isCollapsed={isCollapsed}
            />
          )}

          {lifecycleUiEnabled && (
            <NavItem 
              icon={<Recycle size={isCollapsed ? 20 : 18} />} 
              label="Riaffilature" 
              badge={pezziCestello > 0 ? pezziCestello : null}
              onClick={() => { setView('riaffilature'); if(onClose) onClose(); }} 
              isActive={view === 'riaffilature'}
              isCollapsed={isCollapsed}
            />
          )}

          <NavItem 
            icon={<ClipboardList size={isCollapsed ? 20 : 18} />} 
            label="Movimento Multiplo" 
            badge={multiMovementCount > 99 ? '99+' : (multiMovementCount > 0 ? multiMovementCount : null)}
            onClick={() => { setView('multimovement'); if(onClose) onClose(); }} 
            isActive={view === 'multimovement'}
            isCollapsed={isCollapsed}
          />

          <NavItem 
            icon={<FolderKanban size={isCollapsed ? 20 : 18} />} 
            label="Commesse" 
            onClick={() => { setView('commesse'); if(onClose) onClose(); }} 
            isActive={view === 'commesse'}
            isCollapsed={isCollapsed}
          />

          <NavItem 
            icon={<History size={isCollapsed ? 20 : 18} />} 
            label="Storico movimenti" 
            onClick={() => { setView('history'); fetchHistory(); if(onClose) onClose(); }} 
            isActive={view === 'history'}
            isCollapsed={isCollapsed}
          />

          {currentUser?.ruolo === 'Admin' && (
            <NavItem 
              icon={<Users size={isCollapsed ? 20 : 18} />} 
              label="Gestione Operatori" 
              onClick={() => { setView('operators'); if(onClose) onClose(); }} 
              isActive={view === 'operators'}
              isCollapsed={isCollapsed}
            />
          )}

          <NavItem 
            icon={<HelpCircle size={isCollapsed ? 20 : 18} />} 
            label="Guida" 
            onClick={() => { 
              startTutorial(); 
              if(onClose) onClose(); 
            }} 
            isCollapsed={isCollapsed}
          />
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className={`p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/50 ${isCollapsed ? 'items-center' : ''}`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (setShowSettingsModal) setShowSettingsModal(true);
                if (onClose) onClose();
              }}
              title={`${currentUser?.nome || 'Utente'} (${currentUser?.ruolo || 'Operatore'})`}
              className="relative flex items-center justify-center cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
                {currentUser?.nome?.charAt(0) || 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={() => {
                if (setShowSettingsModal) setShowSettingsModal(true);
                if (onClose) onClose();
              }}
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer group/user"
              title="Apri Impostazioni Utente"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0 group-hover/user:scale-105 transition-transform">
                {currentUser?.nome?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase text-slate-400 leading-none">
                    {currentUser?.ruolo || 'Guest'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                  {currentUser?.nome || 'Mario'}
                </span>
              </div>
            </button>

            <div className="flex items-center gap-0.5 shrink-0">
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
                <Settings size={16} />
              </button>
              <button 
                type="button"
                onClick={toggleTheme}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
                title="Cambia Tema"
                aria-label="Cambia Tema"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button 
                type="button"
                onClick={() => { logout(); if(onClose) onClose(); }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Sidebar(props) {
  const { isMobile, isOpen, onClose } = props;
  const isSidebarCollapsed = useNavigationStore(state => state.isSidebarCollapsed);
  const toggleSidebarCollapsed = useNavigationStore(state => state.toggleSidebarCollapsed);

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

  return (
    <aside 
      id="sidebar"
      className={`transition-all duration-300 ease-in-out shrink-0 hidden md:flex flex-col h-full z-30 select-none ${
        isSidebarCollapsed ? 'w-[68px]' : 'w-64 lg:w-72'
      }`}
    >
      <SidebarContent 
        {...props} 
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={toggleSidebarCollapsed} 
      />
    </aside>
  );
}
