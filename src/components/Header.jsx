import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, History, Database, LogOut, ChevronRight, Search, Sun, Moon, Users, Wrench, Sparkles } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { Button } from "@/components/ui/button";

const NavSubItem = memo(({ icon, label, onClick, className = "" }) => (
  <Button variant="glass" onClick={onClick} className={`flex items-center justify-between p-4 h-auto w-full group ${className}`}>
    <div className="flex items-center gap-3">
      <div className="dark:text-slate-300 text-slate-700 group-hover:text-accent-orange transition-colors">{icon}</div>
      <span className="font-bold uppercase text-[11px] tracking-widest">{label}</span>
    </div>
    <ChevronRight size={14} className="dark:text-slate-400 text-slate-600" />
  </Button>
));

const TAGLINES = [
  'Fresa, Alesatore... cosa ti serve oggi?',
  'Attento al truciolo, morde più del capo!',
  'Se non misura giusto, pulisci il calibro!',
  'Un buon operatore non dà la colpa alla macchina',
  'Chi ha perso la chiave del mandrino?',
  'Misura due volte, taglia una sola!',
  'Siamo sicuri che il diametro sia quello giusto?',
  'Preleva, Lavora, Deposita... e non dimenticare il caffè!',
  'Tolleranza H7... o almeno ci proviamo!',
  'Il CNC non aspetta! Su i giri e dai gas!'
];

const RotatingTagline = memo(() => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % TAGLINES.length);
        setVisible(true);
      }, 400);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden md:flex flex-1 justify-center items-center px-2 md:px-4">
      <div className="glass-panel rounded-full px-4 py-1.5 md:px-5 md:py-2 flex items-center gap-2 md:gap-2.5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-md">
        <Sparkles size={14} className="text-accent-orange animate-pulse shrink-0" />
        <AnimatePresence mode="wait">
          {visible && (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="text-[10px] md:text-sm font-black tracking-[0.15em] text-slate-800 dark:text-slate-100 uppercase truncate">
                {TAGLINES[index]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

const Header = memo(({ currentUser, onLogout, showUserMenu, setShowUserMenu, setView, fetchHistory, setShowAddModal, today, onOpenSearch }) => {

  const { isDarkMode, toggleTheme } = useTheme();

  const [isHeaderMobile, setIsHeaderMobile] = useState(false);
  const [showTaglineMobile, setShowTaglineMobile] = useState(false);
  const [mobileTaglineIndex, setMobileTaglineIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsHeaderMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isHeaderMobile) return;
    
    const triggerInterval = setInterval(() => {
      setMobileTaglineIndex(prev => (prev + 1) % TAGLINES.length);
      setShowTaglineMobile(true);
      
      setTimeout(() => {
        setShowTaglineMobile(false);
      }, 6000);
      
    }, 20000);

    return () => clearInterval(triggerInterval);
  }, [isHeaderMobile]);

  return (
    <div className="flex flex-col w-full z-50">
      {/* Premium Header Bar */}
      <header className="header-bar flex justify-between items-center py-2 px-4 md:py-3 md:px-6 rounded-[20px] md:rounded-[24px] glass-panel border-accent-blue/15 dark:border-white/10 hover:border-accent-blue/35 dark:hover:border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-xl">
        
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <div className="hidden md:flex w-10 h-10 rounded-[14px] bg-gradient-to-br from-accent-blue/20 to-accent-blue/5 items-center justify-center border border-accent-blue/20 shadow-inner">
            <Database size={18} className="text-accent-blue drop-shadow-sm" />
          </div>
          <div className="relative overflow-hidden h-9 md:h-10 flex items-center min-w-0">
            <AnimatePresence mode="wait">
              {isHeaderMobile && showTaglineMobile ? (
                <motion.div
                  key="tagline"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-1.5 min-w-0"
                >
                  <Sparkles size={12} className="text-accent-orange animate-pulse shrink-0" />
                  <p className="text-[10px] font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase truncate">
                    {TAGLINES[mobileTaglineIndex]}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col min-w-0"
                >
                  <h1 className="text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-100 leading-tight truncate">
                    Magazzino <span className="text-accent-blue">Bercella</span>
                  </h1>
                  <span className="text-[8px] md:text-[9px] font-bold tracking-[0.3em] text-slate-500 dark:text-slate-400 uppercase mt-0.5 truncate">
                    Gestione Utensili CNC
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center: Desktop Tagline */}
        <RotatingTagline />

        {/* Right: Controls */}
        <div className="flex items-center gap-2 md:gap-4 relative z-10 shrink-0">
          <Button variant="glass" size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 md:w-11 md:h-11 rounded-[12px] md:rounded-[16px] hover:scale-105 group border-slate-200/50 dark:border-slate-700/50 shadow-sm bg-white/50 dark:bg-slate-800/50"
            title="Cambia Tema"
          >
            {isDarkMode ? (
              <Sun size={16} className="text-accent-orange group-hover:text-white transition-colors" />
            ) : (
              <Moon size={16} className="text-accent-orange group-hover:text-slate-900 transition-colors" />
            )}
          </Button>

          <Button variant="glass"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="px-3 py-1.5 md:px-4 md:py-2 h-auto rounded-[12px] md:rounded-[16px] flex items-center gap-2 md:gap-3 hover:scale-105 group border-slate-200/50 dark:border-slate-700/50 shadow-sm bg-white/50 dark:bg-slate-800/50"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 leading-none mb-1">{currentUser?.ruolo || 'Guest'}</p>
                <p className="font-black text-[10px] tracking-widest text-slate-800 dark:text-slate-100 uppercase leading-none">{currentUser?.nome || 'User'}</p>
              </div>
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-[10px] bg-gradient-to-br from-accent-blue to-blue-600 flex items-center justify-center text-white shadow-inner">
                 <User size={14} className="drop-shadow-sm" />
              </div>
            </div>
          </Button>
        </div>

        <AnimatePresence>
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="glass-panel absolute top-14 md:top-16 right-3 md:right-6 w-56 md:w-64 p-3 md:p-4 rounded-[20px] md:rounded-[24px] z-[100] gap-1 flex flex-col shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
            >
              <NavSubItem icon={<History size={16} />} label="Storico Log" onClick={() => { setView('history'); fetchHistory(); setShowUserMenu(false); }} />
              {currentUser?.ruolo === 'Admin' && (
                 <>
                   <NavSubItem icon={<Users size={16} />} label="Gestione Operatori" onClick={() => { setView('operators'); setShowUserMenu(false); }} />
                   <NavSubItem icon={<Database size={16} />} label="Nuovi Utensili" onClick={() => { setShowAddModal(true); setShowUserMenu(false); }} />
                 </>
              )}
              <div className="h-[1px] bg-slate-200/50 dark:bg-slate-700/50 my-2" />
              <NavSubItem icon={<LogOut size={16} />} label="Logout Sistema" onClick={() => { onLogout(); setShowUserMenu(false); }} className="text-rose-500 group-hover:text-rose-600 dark:text-rose-400 dark:group-hover:text-rose-300" />
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
});

export default Header;
