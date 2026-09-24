import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, ArrowRight, ArrowLeft, Search, Info, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);
  const [showInfo, setShowInfo] = useState(false);
  const [users, setUsers] = useState(() => {
    try {
      const cached = localStorage.getItem('berc_cached_users');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('berc_cached_users');
      const parsed = cached ? JSON.parse(cached) : [];
      return !(Array.isArray(parsed) && parsed.length > 0);
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
      let { data, error: sbError } = await supabase
        .from('utenti')
        .select('id, nome, cognome, codice_id, ruolo, has_completed_tutorial')
        .order('nome');

      // Fallback resiliente se la colonna has_completed_tutorial non è ancora presente sul database
      if (sbError && (sbError.code === '42703' || sbError.code === 'PGRST204' || sbError.message?.includes('has_completed_tutorial'))) {
        const fallbackRes = await supabase
          .from('utenti')
          .select('id, nome, cognome, codice_id, ruolo')
          .order('nome');
        data = fallbackRes.data?.map(u => ({ ...u, has_completed_tutorial: false }));
        sbError = fallbackRes.error;
      }

      if (!sbError && data && Array.isArray(data) && data.length > 0) {
        const validUsers = data.filter(Boolean);
        setUsers(validUsers);
        try {
          localStorage.setItem('berc_cached_users', JSON.stringify(validUsers));
        } catch { /* ignore storage error */ }
      } else if (sbError) {
        console.warn('Supabase fetch users warning:', sbError);
        const cached = localStorage.getItem('berc_cached_users');
        if (cached) {
          try { 
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) setUsers(parsed.filter(Boolean));
          } catch { /* ignore parse error */ }
        } else {
          setFetchError(true);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      const cached = localStorage.getItem('berc_cached_users');
      if (cached) {
        try { 
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) setUsers(parsed.filter(Boolean));
        } catch { /* ignore parse error */ }
      } else {
        setFetchError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const userList = Array.isArray(users) ? users : [];
  const filteredUsers = userList.filter(u => 
    u && (
      `${u.nome || ''} ${u.cognome || ''}`.toLowerCase().includes(search.toLowerCase()) || 
      (u.codice_id && String(u.codice_id).toLowerCase().includes(search.toLowerCase()))
    )
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
      // Verifica della password su Supabase per il singolo account selezionato
      let { data, error: sbError } = await supabase
        .from('utenti')
        .select('id, nome, cognome, codice_id, ruolo, has_completed_tutorial')
        .eq('id', selectedUser.id)
        .eq('password', password)
        .maybeSingle();

      // Fallback resiliente se la colonna has_completed_tutorial non è ancora presente sul database
      if (sbError && (sbError.code === '42703' || sbError.code === 'PGRST204' || sbError.message?.includes('has_completed_tutorial'))) {
        const fallbackRes = await supabase
          .from('utenti')
          .select('id, nome, cognome, codice_id, ruolo')
          .eq('id', selectedUser.id)
          .eq('password', password)
          .maybeSingle();
        data = fallbackRes.data ? { ...fallbackRes.data, has_completed_tutorial: false } : null;
        sbError = fallbackRes.error;
      }

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

  const initials = (u) => `${u.nome?.[0] || ''}${u.cognome?.[0] || ''}`.toUpperCase() || '?';

  return (
    // Schermata bloccata: la pagina non scorre mai, scorre solo la griglia operatori se non ci sta
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden flex flex-col px-3 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:bg-slate-950 bg-slate-50 z-50 dark:text-slate-200 text-slate-800">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-blue/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-orange/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 min-h-0 flex flex-col gap-3 sm:gap-4">
        {/* Intestazione: marchio + info sul sistema */}
        <header className="shrink-0 flex items-center justify-between gap-3 pt-1 sm:pt-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-accent-blue/15 border border-accent-blue/25 flex items-center justify-center text-accent-blue shrink-0">
              <Package size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="app-overline text-accent-orange">Bercella S.r.l.</span>
              <span className="app-h3 uppercase truncate text-slate-900 dark:text-white">Gestione Utensili CNC</span>
            </div>
          </div>
          <div className="relative shrink-0">
            <IconButton
              icon={showInfo ? <X size={16} /> : <Info size={16} />}
              onClick={() => setShowInfo(v => !v)}
              aria-label="Cos'è questo sistema?"
              aria-expanded={showInfo}
              variant="glass"
              className="text-accent-blue"
            />
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-[52px] w-[min(320px,calc(100vw-24px))] p-4 rounded-2xl glass-panel bg-white/95 dark:bg-slate-900/95 border border-accent-blue/20 shadow-[var(--shadow-2)] z-[var(--z-drawer)]"
                >
                  <p className="app-body text-slate-700 dark:text-slate-200">
                    Tracciamento digitale in tempo reale di prelievi e depositi: giacenze sempre sincronizzate, ogni utensile trovato subito, zero fermi macchina.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Card di accesso: alta quanto il contenuto, centrata, mai più alta dello schermo */}
        <div className="flex-1 min-h-0 flex flex-col justify-center pb-2">
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-h-full min-h-0 flex flex-col glass-panel rounded-[var(--radius-modal,32px)] border-accent-blue/20 shadow-2xl p-4 sm:p-6 md:p-8 gap-4"
        >
          <AnimatePresence mode="wait">
            {!selectedUser ? (
              <motion.div key="user-grid" className="min-h-0 flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="shrink-0 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                  <div>
                    <span className="app-overline text-accent-orange">Accesso</span>
                    <h1 className="app-h2 text-slate-900 dark:text-white">Chi sei?</h1>
                  </div>
                  <div className="relative w-full sm:w-[320px]">
                    <label htmlFor="search-user" className="sr-only">Cerca operatore</label>
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <Input
                      id="search-user"
                      type="text"
                      placeholder="Cerca nome o ID…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="glass-input w-full rounded-xl h-11 pl-10 pr-4 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="min-h-0 overflow-y-auto custom-scrollbar -mx-1 px-1 py-1">
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3" aria-busy="true" aria-label="Caricamento operatori">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-[68px] rounded-2xl bg-slate-900/5 dark:bg-white/5 animate-pulse motion-reduce:animate-none" />
                      ))}
                    </div>
                  ) : fetchError && filteredUsers.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                      <p className="app-body font-bold text-slate-700 dark:text-slate-200">Impossibile caricare gli operatori.</p>
                      <p className="app-body text-slate-500 max-w-[36ch]">Controlla la connessione e riprova.</p>
                      <Button onClick={fetchUsers} variant="outline" className="h-11 px-5 rounded-xl font-bold">Riprova</Button>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                      <p className="app-body font-bold text-slate-700 dark:text-slate-200">Nessun risultato per «{search}»</p>
                      <Button onClick={() => setSearch('')} variant="outline" className="h-11 px-5 rounded-xl font-bold">Modifica la ricerca</Button>
                    </div>
                  ) : (
                    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                      {filteredUsers.map(u => {
                        const isAdmin = u.ruolo === 'Admin';
                        return (
                          <li key={u.id} className="min-w-0">
                            <button
                              type="button"
                              onClick={() => handleSelectUser(u)}
                              aria-label={`${u.nome} ${u.cognome}${isAdmin ? ', amministratore, richiede password' : ''}`}
                              className="w-full h-full min-h-[68px] flex items-center gap-3 p-3 rounded-2xl text-left border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 hover:bg-accent-blue/[0.06] hover:border-accent-blue/40 active:bg-accent-blue/[0.14] transition-colors duration-[var(--motion-fast,150ms)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 cursor-pointer group"
                            >
                              <span className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-black text-sm bg-accent-blue/10 text-accent-blue">
                                {initials(u)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="app-h3 block line-clamp-2 break-words text-slate-900 dark:text-white group-hover:text-accent-blue transition-colors">{u.nome} {u.cognome}</span>
                                <span className="app-caption block truncate text-slate-500 mt-0.5">ID {u.codice_id || 'N/A'}</span>
                              </span>
                              {isAdmin && <Lock size={14} className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="min-h-0 py-6 sm:py-10 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10">
                    <span className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-black text-sm bg-accent-blue/10 text-accent-blue">
                      {initials(selectedUser)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="app-h3 truncate text-slate-900 dark:text-white">{selectedUser.nome} {selectedUser.cognome}</p>
                      <p className="app-caption text-slate-500 mt-0.5 flex items-center gap-1"><Lock size={14} aria-hidden="true" /> Amministratore</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                    <div>
                      <label htmlFor="password-input" className="app-label text-slate-600 dark:text-slate-300 mb-1.5 block">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        <Input
                          id="password-input"
                          type="password"
                          autoFocus
                          placeholder="Password amministratore"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? 'password-error' : undefined}
                          className="glass-input w-full rounded-xl h-12 pl-10 pr-4 text-sm font-medium"
                        />
                      </div>
                      {error && <p id="password-error" className="app-body text-accent-rose font-semibold mt-1.5">{error}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setSelectedUser(null)} className="h-12 px-4 rounded-xl font-bold gap-1.5">
                        <ArrowLeft size={16} /> Indietro
                      </Button>
                      <Button
                        type="submit"
                        disabled={verifyingPassword}
                        className="action-btn-primary flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider whitespace-nowrap"
                      >
                        {verifyingPassword ? 'Verifica…' : <>Accedi <ArrowRight size={16} /></>}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="shrink-0 pt-3 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between gap-3 app-caption text-slate-400">
            <span>OFFICINA 4.0</span>
            <span className="flex items-center gap-1.5"><Lock size={14} aria-hidden="true" /> = richiede password</span>
          </footer>
        </motion.main>
        </div>
      </div>
    </div>
  );
}
