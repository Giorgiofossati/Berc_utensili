import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Lock, ArrowRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);
  const [users, setUsers] = useState(() => {
    try {
      const cached = localStorage.getItem('berc_cached_users');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('berc_cached_users');
      return !(cached && JSON.parse(cached).length > 0);
    } catch (e) {
      return true;
    }
  });
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const { data, error: sbError } = await supabase.from('utenti').select('*').order('nome');
      if (!sbError && data && data.length > 0) {
        setUsers(data);
        localStorage.setItem('berc_cached_users', JSON.stringify(data));
      } else if (sbError) {
        console.warn('Supabase fetch users warning:', sbError);
        const cached = localStorage.getItem('berc_cached_users');
        if (cached) {
          try { setUsers(JSON.parse(cached)); } catch (e) {}
        } else {
          setFetchError(true);
        }
      }
    } catch (e) {
      console.error('Error fetching users:', e);
      const cached = localStorage.getItem('berc_cached_users');
      if (cached) {
        try { setUsers(JSON.parse(cached)); } catch (err) {}
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

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === selectedUser.password || password === '1234') { // Fallback 1234 from old PLANNING
      setCurrentUser(selectedUser);
    } else {
      setError('Password errata. Riprova.');
    }
  };

  return (
    <div className="fixed inset-0 min-h-[100dvh] h-[100dvh] w-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:bg-slate-950 bg-slate-50 z-[9999] dark:text-slate-200 text-slate-800 custom-scrollbar">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-blue/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-orange/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.25 }}
        className="relative z-10 w-full max-w-md my-auto glass-panel p-5 sm:p-8 rounded-[28px] sm:rounded-[36px] border-accent-blue/20 shadow-2xl"
      >
        <div className="flex justify-center mb-3 sm:mb-4">
           <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-accent-blue/20 flex items-center justify-center text-accent-blue shadow-inner">
             <User size={24} className="sm:w-8 sm:h-8" />
           </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-center uppercase tracking-widest dark:text-white text-slate-900 mb-1 leading-none">Login</h2>
        <p className="text-center text-[10px] sm:text-xs font-black uppercase text-accent-orange tracking-[0.2em] mb-4 sm:mb-6 opacity-80">Identificati per continuare</p>

        <AnimatePresence mode="wait">
        {!selectedUser ? (
           <motion.div key="user-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 dark:text-slate-400 text-slate-600" size={18} />
                <Input 
                  type="text" 
                  autoFocus
                  placeholder="Cerca per Nome o ID..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl sm:rounded-2xl h-11 sm:h-12 pl-10 sm:pl-11 pr-4 bg-slate-200/50 dark:bg-slate-900/50 border-slate-900/10 dark:border-white/10 text-sm font-medium"
                />
             </div>
             
             <div className="flex flex-col gap-2 max-h-[38vh] sm:max-h-[280px] overflow-y-auto p-1 pb-3 pr-1.5 custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-6 gap-2">
                    <div className="w-8 h-8 border-3 border-accent-blue border-t-transparent rounded-full animate-spin" />
                    <p className="text-center text-xs dark:text-slate-400 text-slate-600 font-bold">Caricamento operatori...</p>
                  </div>
                ) : fetchError && filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 gap-3 text-center">
                    <p className="text-xs text-accent-orange font-bold">Impossibile caricare gli utenti.</p>
                    <button 
                      onClick={fetchUsers}
                      className="glass-button px-4 py-2 rounded-xl text-xs font-bold text-accent-blue hover:scale-105 transition-all"
                    >
                      Riprova
                    </button>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-xs dark:text-slate-400 text-slate-600 font-bold p-6">Nessun utente trovato</p>
                ) : (
                  filteredUsers.map(u => (
                    <Button 
                      key={u.id}
                      variant="ghost"
                      onClick={() => handleSelectUser(u)}
                      className="flex items-center justify-between p-3 sm:p-4 h-auto rounded-xl sm:rounded-2xl border border-white/5 hover:border-accent-blue/40 dark:bg-white/5 bg-slate-900/5 hover:bg-accent-blue/10 transition-all text-left group shrink-0 active:scale-[0.99]"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold dark:text-white text-slate-900 text-base sm:text-lg group-hover:text-accent-blue transition-colors truncate">{u.nome} {u.cognome}</p>
                        <p className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase dark:text-slate-400 text-slate-600 mt-0.5">ID: {u.codice_id || 'N/A'}</p>
                      </div>
                      <div className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase dark:bg-slate-900/70 bg-slate-200/70 px-2.5 py-1 rounded-full text-accent-blue shrink-0 shadow-xs">
                         {u.ruolo}
                      </div>
                    </Button>
                  ))
                )}
             </div>
           </motion.div>
        ) : (
           <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
             <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl dark:bg-white/5 bg-slate-900/5 border dark:border-white/10 border-slate-900/10">
                <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue font-black uppercase text-sm shrink-0">
                   {selectedUser.nome?.[0]}{selectedUser.cognome?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                   <p className="font-bold dark:text-white text-slate-900 text-base sm:text-lg truncate">{selectedUser.nome} {selectedUser.cognome}</p>
                   <p className="text-[9px] sm:text-[10px] dark:text-slate-400 text-slate-600 font-black uppercase tracking-widest">{selectedUser.ruolo}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="ml-auto text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-accent-orange hover:text-accent-orange/80 hover:bg-transparent shrink-0">
                  Cambia
                </Button>
             </div>

             <form onSubmit={handlePasswordSubmit}>
                <div className="relative mb-4">
                   <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 dark:text-slate-400 text-slate-600" size={18} />
                   <Input
                     type="password"
                     autoFocus
                     placeholder="Inserisci password admin"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full rounded-xl sm:rounded-2xl h-11 sm:h-12 pl-10 sm:pl-11 pr-4 bg-slate-200/50 dark:bg-slate-900/50 border-slate-900/10 dark:border-white/10 text-sm font-medium"
                   />
                </div>
                {error && <p className="text-rose-400 text-xs font-bold text-center mb-3 uppercase tracking-wider">{error}</p>}
                
                <Button type="submit" className="w-full h-11 sm:h-12 text-slate-950 bg-accent-blue hover:bg-sky-400 font-black uppercase tracking-widest rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]">
                   Accedi <ArrowRight size={18} />
                </Button>
             </form>
           </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
