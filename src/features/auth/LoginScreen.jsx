import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Lock, ArrowRight, Search, Sparkles, CheckCircle2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [users, setUsers] = useState(() => {
    try {
      const cached = localStorage.getItem('berc_cached_users');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('berc_cached_users');
      return !(cached && JSON.parse(cached).length > 0);
    } catch {
      return true;
    }
  });
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      // Sicurezza: non selezioniamo mai il campo password nella lista pubblica
      const { data, error: sbError } = await supabase
        .from('utenti')
        .select('id, nome, cognome, codice_id, ruolo, has_completed_tutorial')
        .order('nome');

      if (!sbError && data && data.length > 0) {
        setUsers(data);
        localStorage.setItem('berc_cached_users', JSON.stringify(data));
      } else if (sbError) {
        console.warn('Supabase fetch users warning:', sbError);
        const cached = localStorage.getItem('berc_cached_users');
        if (cached) {
          try { setUsers(JSON.parse(cached)); } catch { /* ignore parse error */ }
        } else {
          setFetchError(true);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      const cached = localStorage.getItem('berc_cached_users');
      if (cached) {
        try { setUsers(JSON.parse(cached)); } catch { /* ignore parse error */ }
      } else {
        setFetchError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    `${u.nome} ${u.cognome}`.toLowerCase().includes(search.toLowerCase()) || 
    (u.codice_id && String(u.codice_id).toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setPassword('');
    setError('');
    if (user.ruolo === 'Operatore') {
      setCurrentUser(user);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Inserisci la password per continuare.');
      return;
    }

    setVerifyingPassword(true);
    setError('');

    try {
      // Verifica sicura della password su Supabase per il singolo account selezionato
      const { data, error: sbError } = await supabase
        .from('utenti')
        .select('id, nome, cognome, codice_id, ruolo, has_completed_tutorial')
        .eq('id', selectedUser.id)
        .eq('password', password)
        .maybeSingle();

      if (sbError) throw sbError;

      if (data) {
        setCurrentUser(data);
      } else {
        setError('Password errata. Riprova.');
      }
    } catch (err) {
      console.error('Errore durante la verifica della password:', err);
      setError('Errore di connessione durante la verifica. Riprova.');
    } finally {
      setVerifyingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 min-h-[100dvh] h-[100dvh] w-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:bg-slate-950 bg-slate-50 z-[9999] dark:text-slate-200 text-slate-800 custom-scrollbar">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-blue/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-orange/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-5xl my-auto grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Colonna Sinistra (Desktop): Presentazione & Scopo del Sistema */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.25 }}
          className="hidden md:flex md:col-span-5 flex-col justify-between glass-panel p-6 sm:p-8 rounded-[32px] border-accent-blue/20 shadow-2xl h-full"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-blue/20 flex items-center justify-center text-accent-blue border border-accent-blue/30 shadow-inner shrink-0">
                <Sparkles size={24} className="text-accent-blue animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="app-overline text-accent-orange">
                  Bercella S.r.l.
                </span>
                <h1 className="app-h2 text-slate-900 dark:text-white leading-tight">
                  Gestione Utensili CNC
                </h1>
              </div>
            </div>

            <p className="app-body text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Piattaforma digitale per il tracciamento istantaneo di frese, punte e inserti.
              Registra ogni prelievo e deposito in tempo reale per mantenere sincronizzate le giacenze ed eliminare i fermi macchina.
            </p>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/5 dark:border-white/5">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span className="app-body font-bold text-slate-800 dark:text-slate-200">Giacenze sincronizzate in tempo reale</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/5 dark:border-white/5">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span className="app-body font-bold text-slate-800 dark:text-slate-200">Reperibilità immediata per CNC</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/5 dark:border-white/5">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span className="app-body font-bold text-slate-800 dark:text-slate-200">Azzeramento dei fermi macchina</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between app-caption text-slate-400">
            <span>OFFICINA 4.0</span>
            <span className="text-accent-blue font-bold">ATTIVO</span>
          </div>
        </motion.div>

        {/* Colonna Destra: Card di Login Principale */}
        <div className="md:col-span-7 w-full max-w-md mx-auto md:max-w-none flex flex-col h-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.25 }}
            className="w-full h-full flex flex-col justify-between glass-panel p-6 sm:p-8 rounded-[32px] border-accent-blue/20 shadow-2xl"
          >
            <div>
              <div className="flex justify-center mb-3 sm:mb-4">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-accent-blue/20 flex items-center justify-center text-accent-blue shadow-inner">
                   <User size={24} className="sm:w-8 sm:h-8" />
                 </div>
              </div>
              <h2 className="app-h2 text-center uppercase tracking-widest mb-1 leading-none">Login</h2>
              <p className="app-overline text-accent-orange text-center mb-4 sm:mb-6 opacity-80">Identificati per continuare</p>

              <AnimatePresence mode="wait">
          {!selectedUser ? (
             <motion.div key="user-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <div className="relative mb-3">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 dark:text-slate-400 text-slate-600 pointer-events-none" size={18} />
                  <Input 
                    type="text" 
                    autoFocus
                    placeholder="Cerca per Nome o ID..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="glass-input w-full rounded-xl sm:rounded-2xl h-11 sm:h-12 pl-10 sm:pl-11 pr-4 text-sm font-medium"
                  />
               </div>
               
               <div className="flex flex-col gap-2 h-[260px] sm:h-[280px] overflow-y-auto p-1 pb-3 pr-1.5 custom-scrollbar">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center p-6 gap-2">
                      <div className="w-8 h-8 border-3 border-accent-blue border-t-transparent rounded-full animate-spin" />
                      <p className="text-center app-caption dark:text-slate-400 text-slate-600 font-bold">Caricamento operatori...</p>
                    </div>
                  ) : fetchError && filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 gap-3 text-center">
                      <p className="app-caption text-accent-orange font-bold">Impossibile caricare gli utenti.</p>
                      <button 
                        onClick={fetchUsers} 
                        className="glass-button px-4 py-2 rounded-xl app-caption font-bold text-accent-blue hover:scale-105 transition-all"
                      >
                        Riprova
                      </button>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-center app-caption dark:text-slate-400 text-slate-600 font-bold p-6">Nessun utente trovato</p>
                  ) : (
                    filteredUsers.map(u => (
                      <Button 
                        key={u.id}
                        variant="ghost"
                        onClick={() => handleSelectUser(u)}
                        className="flex items-center justify-between p-3 sm:p-4 h-auto rounded-xl sm:rounded-2xl border border-white/5 hover:border-accent-blue/40 dark:bg-white/5 bg-slate-900/5 hover:bg-accent-blue/10 transition-all text-left group shrink-0 active:scale-[0.99]"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="app-h3 group-hover:text-accent-blue transition-colors truncate">{u.nome} {u.cognome}</p>
                          <p className="app-caption mt-0.5">ID: {u.codice_id || 'N/A'}</p>
                        </div>
                        <div className="app-overline dark:bg-slate-900/70 bg-slate-200/70 px-2.5 py-1 rounded-full text-accent-blue shrink-0 shadow-xs">
                           {u.ruolo}
                        </div>
                      </Button>
                    ))
                  )}
               </div>
             </motion.div>
          ) : (
             <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="h-[310px] sm:h-[330px] flex flex-col justify-center">
               <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl dark:bg-white/5 bg-slate-900/5 border dark:border-white/10 border-slate-900/10">
                  <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue font-black uppercase text-sm shrink-0">
                     {selectedUser.nome?.[0]}{selectedUser.cognome?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="app-h3 dark:text-white text-slate-900 text-base sm:text-lg truncate">{selectedUser.nome} {selectedUser.cognome}</p>
                     <p className="app-overline dark:text-slate-400 text-slate-600 mt-0.5">{selectedUser.ruolo}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="ml-auto app-overline text-accent-orange hover:text-accent-orange/80 hover:bg-transparent shrink-0">
                    Cambia
                  </Button>
               </div>

               <form onSubmit={handlePasswordSubmit}>
                  <div className="relative mb-4">
                     <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 dark:text-slate-400 text-slate-600 pointer-events-none" size={18} />
                     <Input
                       type="password"
                       autoFocus
                       placeholder="Inserisci password admin"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="glass-input w-full rounded-xl sm:rounded-2xl h-11 sm:h-12 pl-10 sm:pl-11 pr-4 text-sm font-medium"
                     />
                  </div>
                  {error && <p className="text-rose-400 app-caption font-bold text-center mb-3 uppercase tracking-wider">{error}</p>}
                  
                  <Button 
                    type="submit" 
                    disabled={verifyingPassword}
                    className="action-btn-primary w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-lg text-xs sm:text-sm font-black uppercase tracking-wider"
                  >
                     {verifyingPassword ? 'Verifica...' : <>Accedi <ArrowRight size={18} /></>}
                  </Button>
               </form>
             </motion.div>
          )}
          </AnimatePresence>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between app-caption text-slate-400">
              <span>ACCESSO RAPIDO OPERATORE</span>
              <span className="text-emerald-500 font-bold">SENZA PIN</span>
            </div>
          </motion.div>

          {/* Su Mobile: pulsante discreto che non ruba spazio al login quotidiano */}
          <div className="md:hidden w-full max-w-md mt-3 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowMobileInfo(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full glass-panel border border-accent-blue/20 text-[11px] font-bold text-accent-blue shadow-sm active:scale-95 transition-all"
            >
              <Info size={13} />
              <span>Cos&apos;è questo sistema?</span>
              {showMobileInfo ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <AnimatePresence>
              {showMobileInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="overflow-hidden mt-2 w-full p-3.5 rounded-2xl glass-panel border border-accent-blue/20 text-center"
                >
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                    <strong className="text-accent-blue font-black uppercase tracking-wider block mb-1">
                      Bercella Utensili CNC
                    </strong>
                    Tracciamento digitale in tempo reale di carichi e scarichi per azzerare i fermi macchina e trovare subito ogni utensile a magazzino.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
