import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  Search,
  Info,
  ChevronRight,
  Download,
  Boxes,
  Zap,
  ShieldAlert,
  Users,
  TrendingUp,
  Share,
  PlusSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, ModalHeader } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuthStore } from '../../store/useAuthStore';
import { usePwaStore } from '../../store/usePwaStore';
import PwaUpdatePrompt from '../../components/common/PwaUpdatePrompt';

const SYSTEM_FEATURES = [
  {
    icon: <Boxes className="w-5 h-5 text-accent-blue" />,
    title: "Inventario intelligente",
    desc: "ricerche rapide con filtri, giacenze live sincronizzate",
  },
  {
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    title: "Zero fermi Macchina",
    desc: "la ricerca utensili richiede un click, scopri dove si trova e i dati tecnici",
  },
  {
    icon: <ShieldAlert className="w-5 h-5 text-accent-orange" />,
    title: "Gestione scorte",
    desc: "Non rimarrai più senza frese",
  },
  {
    icon: <Users className="w-5 h-5 text-emerald-500" />,
    title: "Gestione Rapida",
    desc: "Gli operatori sanno cosa c'è e dove trovarlo, gli admin gestiscono il magazzino",
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-sky-500" />,
    title: "Gestione costi",
    desc: "I manager posso vedere costi e statisctiche tutto in tempo reale",
  },
];

export default function LoginScreen() {
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);
  const [showInfo, setShowInfo] = useState(false);

  // PWA install state
  const canInstall = usePwaStore(state => state.canInstall);
  const isStandalone = usePwaStore(state => state.isStandalone);
  const triggerInstall = usePwaStore(state => state.triggerInstall);
  const showIOSInstallGuide = usePwaStore(state => state.showIOSInstallGuide);
  const setShowIOSInstallGuide = usePwaStore(state => state.setShowIOSInstallGuide);

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

  const requiresPassword = (u) => {
    if (!u) return false;
    return u.ruolo === 'Admin' || u.ruolo === 'Manager';
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setPassword('');
    setError('');
    if (!requiresPassword(user)) {
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

      <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 min-h-0 flex flex-col gap-2.5 sm:gap-3.5">
        {/* Intestazione: marchio Bercella Hero + Officina 4.0 Gestione Utensili CNC (sempre visibili al 100%) */}
        <header className="shrink-0 flex items-center justify-between gap-3 pt-1 sm:pt-2">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <div className="shrink-0 flex items-center">
              <img
                src="/logo-bercella_orizzontale.png"
                alt="Bercella"
                className="dark:hidden h-16 sm:h-24 md:h-32 lg:h-36 w-auto object-contain select-none transition-all"
              />
              <img
                src="/logo-bercella_orizzontale_white.png"
                alt="Bercella"
                className="hidden dark:block h-16 sm:h-24 md:h-32 lg:h-36 w-auto object-contain select-none transition-all"
              />
            </div>
            <div className="h-10 sm:h-16 md:h-20 w-[2px] bg-slate-300 dark:bg-slate-700/80 shrink-0" />
            <div className="flex flex-col min-w-0 justify-center">
              <span className="app-overline text-accent-orange tracking-[0.22em] text-xs sm:text-sm">Officina 4.0</span>
              <span className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                Gestione Utensili CNC
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Install PWA Button (1-click non invasivo se disponibile e non standalone) */}
            {canInstall && !isStandalone && (
              <Button
                type="button"
                onClick={() => triggerInstall()}
                variant="outline"
                size="sm"
                className="h-10 px-3 rounded-xl border-accent-blue/30 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue dark:text-cyan-400 font-bold text-xs gap-1.5 shadow-xs font-sans shrink-0 transition-colors"
                title="Aggiungi come applicazione desktop o mobile"
              >
                <Download size={15} className="shrink-0" />
                <span className="hidden sm:inline">Installa WebApp</span>
              </Button>
            )}
          </div>
        </header>

        {/* Card di accesso: alta quanto il contenuto, centrata, mai più alta dello schermo */}
        <div className="flex-1 min-h-0 flex flex-col justify-center pb-2">
          <motion.main
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="max-h-full min-h-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-modal,32px)] shadow-xl dark:shadow-2xl p-4 sm:p-6 md:p-8 gap-3 sm:gap-4"
          >
            <AnimatePresence mode="wait">
              {!selectedUser ? (
                <motion.div key="user-grid" className="min-h-0 flex flex-col gap-3 sm:gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="shrink-0 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                    <div>
                      <span className="app-overline text-accent-orange">Accesso Sistema</span>
                      <h1 className="app-h2 text-slate-900 dark:text-white">Identificazione Operatore</h1>
                      <p className="app-body text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Tocca il tuo profilo per registrare prelievi, depositi o verificare la disponibilità delle frese a magazzino.
                      </p>
                    </div>
                    <div className="relative w-full sm:w-[320px] shrink-0">
                      <label htmlFor="search-user" className="sr-only">Cerca operatore per nome o ID</label>
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <Input
                        id="search-user"
                        type="text"
                        placeholder="Cerca nome o ID badge…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl h-11 pl-10 pr-4 text-base md:text-sm font-medium font-sans bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-colors"
                      />
                    </div>
                  </div>

                  {/* Micro Stepper Flusso Operativo 3 Fasi: Fisso, Tutto Visibile e Responsive */}
                  <div className="shrink-0 grid grid-cols-3 gap-1.5 sm:gap-3 py-2 px-2.5 sm:px-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-accent-blue text-white flex items-center justify-center text-xs shrink-0 font-mono font-bold shadow-xs">
                        1
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-accent-blue font-sans leading-tight">
                        Identificati
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs shrink-0 font-mono font-bold">
                        2
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 font-sans leading-tight">
                        Sfoglia catalogo
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs shrink-0 font-mono font-bold">
                        3
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 font-sans leading-tight">
                        Preleva, Deposita o Gestisci
                      </span>
                    </div>
                  </div>

                  {/* Griglia Operatori */}
                  <div className="min-h-0 overflow-y-auto custom-scrollbar -mx-1 px-1 py-1">
                    {loading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3" aria-busy="true" aria-label="Caricamento operatori">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-[68px] sm:h-[72px] rounded-2xl bg-slate-900/5 dark:bg-white/5 animate-pulse motion-reduce:animate-none" />
                        ))}
                      </div>
                    ) : fetchError && filteredUsers.length === 0 ? (
                      <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                        <p className="app-body font-bold text-slate-700 dark:text-slate-200">Impossibile caricare gli operatori.</p>
                        <p className="app-body text-slate-500 max-w-[36ch]">Controlla la connessione e riprova.</p>
                        <Button onClick={fetchUsers} variant="outline" className="h-11 px-5 rounded-xl font-bold font-sans">Riprova</Button>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                        <p className="app-body font-bold text-slate-700 dark:text-slate-200">Nessun risultato per «{search}»</p>
                        <Button onClick={() => setSearch('')} variant="outline" className="h-11 px-5 rounded-xl font-bold font-sans">Modifica la ricerca</Button>
                      </div>
                    ) : (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                        {filteredUsers.map(u => {
                          const needsPassword = requiresPassword(u);
                          const isAdmin = u.ruolo === 'Admin';
                          const isManager = u.ruolo === 'Manager';
                          return (
                            <li key={u.id} className="min-w-0">
                              <button
                                type="button"
                                onClick={() => handleSelectUser(u)}
                                aria-label={`${u.nome} ${u.cognome}${needsPassword ? `, ${isAdmin ? 'amministratore' : isManager ? 'manager' : u.ruolo}, richiede password` : ''}`}
                                className="w-full h-full min-h-[64px] sm:min-h-[68px] flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl text-left border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-accent-blue/[0.06] hover:border-accent-blue/40 active:bg-accent-blue/[0.14] transition-colors duration-[var(--motion-fast,150ms)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 cursor-pointer group"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <span className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm bg-accent-blue/10 text-accent-blue font-sans select-none">
                                    {initials(u)}
                                  </span>
                                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-accent-blue transition-colors font-sans whitespace-nowrap truncate leading-tight">
                                      {u.nome} {u.cognome}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 whitespace-nowrap truncate leading-tight">
                                      ID {u.codice_id || 'N/A'}
                                    </span>
                                  </div>
                                </div>

                                {needsPassword && (
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 font-sans shadow-xs transition-colors",
                                      isAdmin
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                                        : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25"
                                    )}
                                    title={`Richiede password (${isAdmin ? 'Amministratore' : isManager ? 'Manager' : u.ruolo})`}
                                  >
                                    <Lock size={12} aria-hidden="true" />
                                    <span className="text-xs font-bold font-sans">{isAdmin ? 'Admin' : isManager ? 'Manager' : u.ruolo}</span>
                                  </span>
                                )}
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
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                      <span className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm bg-accent-blue/10 text-accent-blue font-sans">
                        {initials(selectedUser)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="app-h3 truncate text-slate-900 dark:text-white font-sans">{selectedUser.nome} {selectedUser.cognome}</p>
                        <p className={cn(
                          "text-xs font-semibold mt-0.5 flex items-center gap-1.5 font-sans",
                          selectedUser.ruolo === 'Admin'
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-sky-600 dark:text-sky-400"
                        )}>
                          <Lock size={13} aria-hidden="true" />
                          {selectedUser.ruolo === 'Admin' ? 'Amministratore' : selectedUser.ruolo === 'Manager' ? 'Manager' : selectedUser.ruolo}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                      <div>
                        <label htmlFor="password-input" className="app-label text-slate-600 dark:text-slate-300 mb-1.5 block">
                          Password {selectedUser.ruolo === 'Admin' ? 'Amministratore' : selectedUser.ruolo === 'Manager' ? 'Manager' : 'di Accesso'}
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                          <Input
                            id="password-input"
                            type="password"
                            autoFocus
                            placeholder={`Inserisci password ${selectedUser.ruolo === 'Admin' ? 'amministratore' : selectedUser.ruolo === 'Manager' ? 'manager' : 'di accesso'}…`}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? 'password-error' : undefined}
                            className="w-full rounded-xl h-12 pl-10 pr-4 text-base md:text-sm font-medium font-sans bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-colors"
                          />
                        </div>
                        {error && <p id="password-error" className="app-body text-accent-rose font-semibold mt-1.5">{error}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setSelectedUser(null)} className="h-12 px-4 rounded-xl font-bold gap-1.5 font-sans">
                          <ArrowLeft size={16} /> Indietro
                        </Button>
                        <Button
                          type="submit"
                          disabled={verifyingPassword}
                          className="action-btn-primary flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-black tracking-wider whitespace-nowrap font-sans"
                        >
                          {verifyingPassword ? 'Verifica…' : <>Accedi <ArrowRight size={16} /></>}
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <footer className="shrink-0 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-400">
              <button
                type="button"
                onClick={() => setShowInfo(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-accent-blue/10 hover:bg-accent-blue/15 border border-accent-blue/25 text-accent-blue dark:text-cyan-400 text-xs font-bold transition-all shadow-xs cursor-pointer group font-sans"
                title="Scopri come funziona e quali vantaggi offre il gestionale"
              >
                <Info size={14} className="shrink-0 text-accent-blue group-hover:scale-110 transition-transform" />
                <span>Come funziona? Scopri funzionalità e vantaggi ✨</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="app-caption text-slate-400 tracking-wider hidden sm:inline">OFFICINA 4.0</span>
                <span className="app-body text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Lock size={13} className="text-slate-400" aria-hidden="true" /> = account protetto da password
                </span>
              </div>
            </footer>
          </motion.main>
        </div>
      </div>

      {/* Modal Guida e Valore del Sistema Bercella Utensili */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent size="lg" showCloseButton={false} className="p-0 overflow-hidden">
          <ModalHeader
            icon={<Boxes className="w-6 h-6 text-accent-blue" />}
            overline="PANORAMICA SISTEMA"
            title="Officina 4.0 Bercella Utensili"
            subtitle="Tracciamento digitale in tempo reale per la gestione del magazzino utensili CNC"
          />
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[60dvh] space-y-3">
            {SYSTEM_FEATURES.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center shrink-0">
                  {feat.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="app-h3 text-slate-900 dark:text-white font-sans">{feat.title}</h4>
                  <p className="app-body text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="app-caption text-slate-400">BERCELLA AEROSPACE & MOTORSPORT</span>
            <Button
              type="button"
              onClick={() => setShowInfo(false)}
              className="action-btn-primary px-5 h-10 rounded-xl text-xs font-black tracking-wider uppercase font-sans"
            >
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Istruzioni PWA per iOS Safari */}
      <Dialog open={showIOSInstallGuide} onOpenChange={setShowIOSInstallGuide}>
        <DialogContent size="sm" showCloseButton={false} className="p-0 overflow-hidden">
          <ModalHeader
            icon={<Download className="w-6 h-6 text-accent-blue" />}
            overline="INSTALLAZIONE PWA"
            title="Aggiungi alla Schermata Home"
            subtitle="Installa l'app su iPhone o iPad per l'accesso rapido a tutto schermo"
          />
          <div className="p-5 space-y-3 text-slate-700 dark:text-slate-300 font-sans">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="w-9 h-9 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0">
                <Share size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">1. Tocca il tasto Condividi</p>
                <p className="app-body text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nel menu in basso o in alto di Safari, tocca l'icona con il quadrato e la freccia verso l'alto.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="w-9 h-9 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0">
                <PlusSquare size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">2. Seleziona «Aggiungi a Home»</p>
                <p className="app-body text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Scorri la lista delle opzioni e premi su «Aggiungi alla schermata Home» per salvare l'icona.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <Button
              type="button"
              onClick={() => setShowIOSInstallGuide(false)}
              className="action-btn-primary px-5 h-10 rounded-xl text-xs font-black tracking-wider uppercase font-sans"
            >
              Ho capito
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PwaUpdatePrompt />
    </div>
  );
}
