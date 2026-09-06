import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Search, History, Users, 
  LogOut, ArrowDown, ArrowUp,
  Sun, Moon, X, HelpCircle
} from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useMovementStore } from '../../store/useMovementStore';
import { useTutorialStore } from '../../store/useTutorialStore';

const NavItem = ({ icon, label, onClick, className = "", isActive = false }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group relative
      ${isActive 
        ? 'bg-accent-blue/10 text-accent-blue font-bold shadow-sm' 
        : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium'}
      ${className}
    `}
  >
    {/* Active state vertical indicator bar */}
    {isActive && (
      <motion.div 
        layoutId="activeNavIndicator"
        className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-accent-blue rounded-r-full"
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      />
    )}
    <div className={`${isActive ? 'text-accent-blue' : 'text-slate-500 group-hover:text-accent-blue'} transition-colors`}>
      {icon}
    </div>
    <span className="text-sm tracking-wide">{label}</span>
  </button>
);

const SidebarContent = ({ 
  setView, fetchHistory, setShowAddModal, onOpenSearch, onClose, view
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const currentUser = useAuthStore(state => state.currentUser);
  const logout = useAuthStore(state => state.logout);
  const setOpType = useMovementStore(state => state.setOpType);
  const startTutorial = useTutorialStore(state => state.startTutorial);

  return (
    <div className="w-full h-full flex flex-col bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-r border-slate-200/50 dark:border-white/10 shadow-2xl overflow-hidden relative">
      {/* Header / Logo */}
      <div className="pb-4 px-6 pt-[max(1rem,env(safe-area-inset-top))] flex flex-col border-b border-slate-200/50 dark:border-white/5 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-accent-blue/20 to-accent-blue/5 flex items-center justify-center border border-accent-blue/20 shadow-inner shrink-0">
              <Database size={18} className="text-accent-blue drop-shadow-sm" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="app-overline text-slate-400 dark:text-slate-500 leading-none">
                Magazzino
              </span>
              <h1 className="app-h2 text-sm text-slate-800 dark:text-slate-100 leading-none mt-1">
                Bercella
              </h1>
            </div>
          </div>

          {/* Mobile Close Button inline next to the logo header */}
          {onClose && (
            <button 
              onClick={onClose} 
              className="md:hidden p-2 rounded-xl glass-button text-slate-500 hover:text-slate-800 dark:hover:text-white shrink-0 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <span className="app-caption text-slate-500 dark:text-slate-400 uppercase mt-1 block truncate">
          Gestione Utensili CNC
        </span>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">
        
        {/* Search Input Box with Shortcut Badge */}
        <div className="flex flex-col gap-2" data-tour="search-tools">
           <button 
              onClick={() => { onOpenSearch(); if(onClose) onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-slate-900/50 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-500 transition-all border border-slate-200/50 dark:border-white/5 group shadow-sm"
           >
              <div className="flex items-center gap-3 min-w-0">
                 <Search size={16} className="group-hover:text-accent-blue transition-colors shrink-0" />
                 <span className="text-sm font-medium group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors truncate">Cerca utensile...</span>
              </div>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-1.5 font-mono text-[10px] font-bold text-slate-400 shadow-sm">
                <span>⌘</span>K
              </kbd>
           </button>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col gap-2" data-tour="quick-actions">
          <span className="app-overline text-slate-400 dark:text-slate-500 ml-2 mb-1">Azioni Rapide</span>
          
          <button 
            onClick={() => { setOpType('carico'); setView('scanner'); if(onClose) onClose(); }} 
            className="action-btn-carica w-full py-3 px-4 rounded-[16px] flex items-center justify-center gap-2 group shadow-sm hover:shadow-emerald-500/20"
          >
            <ArrowDown size={16} className="group-hover:translate-y-1 transition-transform animate-pulse" />
            <span className="text-sm font-black tracking-wider">DEPOSITA</span>
          </button>
          
          <button 
            onClick={() => { setOpType('scarico'); setView('scanner'); if(onClose) onClose(); }} 
            className="action-btn-scarica w-full py-3 px-4 rounded-[16px] flex items-center justify-center gap-2 group shadow-sm hover:shadow-rose-500/20"
          >
            <ArrowUp size={16} className="group-hover:-translate-y-1 transition-transform animate-pulse" />
            <span className="text-sm font-black tracking-wider">PRELEVA</span>
          </button>

          {currentUser?.ruolo === 'Admin' && (
             <button 
               onClick={() => { setShowAddModal(true); if(onClose) onClose(); }} 
               className="mt-2 w-full py-3 px-4 rounded-[16px] text-accent-blue border border-accent-blue/30 hover:bg-accent-blue/10 flex items-center justify-center gap-2 group shadow-sm transition-all hover:scale-[1.02] duration-300"
             >
               <span className="text-base font-black leading-none group-hover:rotate-90 transition-transform duration-300">+</span>
               <span className="text-sm font-bold tracking-wider">NUOVO UTENSILE</span>
             </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-1 mt-2" data-tour="menu-history">
          <span className="app-overline text-slate-400 dark:text-slate-500 ml-2 mb-1">Menu Navigazione</span>
          
          <NavItem 
            icon={<Database size={16} />} 
            label="Inventario" 
            onClick={() => { setView('home'); if(onClose) onClose(); }} 
            isActive={view === 'home'}
          />

          <NavItem 
            icon={<History size={16} />} 
            label="Storico Log" 
            onClick={() => { setView('history'); fetchHistory(); if(onClose) onClose(); }} 
            isActive={view === 'history'}
          />

          {currentUser?.ruolo === 'Admin' && (
            <NavItem 
              icon={<Users size={16} />} 
              label="Gestione Operatori" 
              onClick={() => { setView('operators'); if(onClose) onClose(); }} 
              isActive={view === 'operators'}
            />
          )}

          <NavItem 
            icon={<HelpCircle size={16} />} 
            label="Guida & Tutorial" 
            onClick={() => { 
              startTutorial(); 
              if(onClose) onClose(); 
            }} 
          />
        </div>
      </div>

      {/* Footer / User Profile Card */}
      <div className="p-3 sm:p-4 border-t border-slate-200/50 dark:border-white/5 flex flex-col gap-2 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-4" data-tour="user-profile">
         <div className="flex items-center justify-between px-2 py-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/30 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-accent-blue to-blue-600 flex items-center justify-center text-white shadow-inner shrink-0">
                <span className="font-bold text-sm uppercase">{currentUser?.nome?.charAt(0) || 'U'}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="app-overline text-slate-500 dark:text-slate-400 leading-none">{currentUser?.ruolo || 'Guest'}</span>
                  {/* Status Indicator Dot */}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="app-body font-bold text-slate-800 dark:text-slate-100 truncate max-w-[110px] leading-none mt-1">{currentUser?.nome || 'Utente'}</span>
              </div>
            </div>
            
            <motion.button 
              whileHover={{ rotate: 15, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-accent-orange transition-colors"
              title="Cambia Tema"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </motion.button>
         </div>

         <button 
           data-tour="user-logout"
           onClick={() => { logout(); if(onClose) onClose(); }}
           className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-colors mt-1"
         >
           <LogOut size={16} />
           <span className="app-overline tracking-wider">Logout</span>
         </button>
      </div>
    </div>
  );
};

export default function Sidebar(props) {
  const { isMobile, isOpen, onClose } = props;

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
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] h-[100dvh] min-h-[100dvh] z-[2001] shadow-2xl"
            >
              <SidebarContent {...props} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <aside className="w-64 lg:w-72 h-full shrink-0 hidden md:block z-[40]">
       <SidebarContent {...props} />
    </aside>
  );
}
