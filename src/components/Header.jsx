import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, History, Database, LogOut, ChevronRight, Search, Shield } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const NavSubItem = memo(({ icon, label, onClick, className = "" }) => (
  <button onClick={onClick} className={`flex items-center justify-between p-4 rounded-[20px] glass-button w-full group ${className}`}>
    <div className="flex items-center gap-3">
      <div className="text-slate-300 group-hover:text-accent-orange transition-colors">{icon}</div>
      <span className="font-bold uppercase text-[11px] tracking-widest">{label}</span>
    </div>
    <ChevronRight size={14} className="text-slate-400" />
  </button>
));

const Header = memo(({ showUserMenu, setShowUserMenu, setView, fetchHistory, setShowAddModal, today, onOpenSearch }) => {
  const { currentUser, logout } = useAuth();
  return (
    <header className="header-bar flex justify-between items-center z-50 py-1 px-1 md:py-0 md:px-0">
      <div className="flex flex-col gap-0.5">
        <div className="glass-panel px-3 py-1 md:px-4 md:py-1.5 rounded-[12px] md:rounded-[18px] border-accent-orange/10">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Calendar size={12} className="text-accent-orange" />
            <span className="font-black tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] tabular-nums text-slate-300">{today}</span>
          </div>
        </div>
        <p className="text-[6px] md:text-[7px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-slate-400 px-1">Warehouse Internal v2.0</p>
      </div>

      <div className="flex flex-col items-end gap-2 md:gap-4 relative">
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={onOpenSearch}
            className="glass-panel p-2 md:p-2.5 rounded-[12px] md:rounded-[18px] flex items-center justify-center hover:scale-[1.05] transition-all group border-accent-blue/30"
            title="Ricerca Rapida"
          >
            <Search size={18} className="text-accent-blue group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`glass-panel px-3 py-1 md:px-4 md:py-1.5 rounded-[12px] md:rounded-[18px] flex items-center gap-2 md:gap-3 hover:scale-[1.02] transition-all group border-2 ${currentUser?.ruolo === 'Admin' ? 'border-accent-orange/40 bg-accent-orange/10' : 'border-accent-blue/40 bg-accent-blue/10'}`}
          >
            <div className="flex items-center gap-1.5 md:gap-2.5">
              <div className="text-right">
                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-slate-300 leading-none mb-0.5 hidden sm:block">{currentUser?.ruolo || 'Utente'}</p>
                <p className="font-extrabold text-[9px] md:text-[10px] tracking-widest text-slate-200 uppercase">{currentUser ? (currentUser.nome + ' ' + currentUser.cognome[0] + '.') : 'N/A'}</p>
              </div>
              {currentUser?.ruolo === 'Admin' ? <Shield size={14} className="text-accent-orange" /> : <User size={14} className="text-accent-blue" />}
            </div>
          </button>
        </div>

        <AnimatePresence>
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="glass-panel absolute top-10 md:top-12 right-0 w-56 md:w-64 p-4 md:p-5 rounded-[24px] md:rounded-[28px] z-[100] gap-1.5 md:gap-2 flex flex-col"
            >
              <NavSubItem icon={<History size={16} />} label="Storico Log" onClick={() => { setView('history'); fetchHistory(); setShowUserMenu(false); }} />
              <NavSubItem icon={<Database size={16} />} label="Nuovo Materiale" onClick={() => { setShowAddModal(true); setShowUserMenu(false); }} />
              <div className="h-[1px] bg-white/5 my-2" />
              <NavSubItem icon={<LogOut size={16} />} label="Cambia Utente / Logout" onClick={() => { logout(); setShowUserMenu(false); }} className="text-rose-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
});

export default Header;
