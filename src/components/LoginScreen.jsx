import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Lock, ArrowRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginScreen({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('utenti').select('*').order('nome');
    if (!error) setUsers(data || []);
    setLoading(false);
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
      onLogin(user);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === selectedUser.password || password === '1234') { // Fallback 1234 from old PLANNING
      onLogin(selectedUser);
    } else {
      setError('Password errata. Riprova.');
    }
  };

  return (
    <div className="fixed inset-0 dark:bg-slate-950 bg-slate-50 flex flex-col items-center justify-center z-[9999] p-4 dark:text-slate-200 text-slate-800">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-blue/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-orange/10 blur-[120px] rounded-full" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md glass-panel p-6 md:p-8 rounded-[32px] border-accent-blue/20">
        <div className="flex justify-center mb-6">
           <div className="w-16 h-16 rounded-2xl bg-accent-blue/20 flex items-center justify-center text-accent-blue">
             <User size={32} />
           </div>
        </div>
        <h2 className="text-3xl font-black text-center uppercase tracking-widest dark:text-white text-slate-900 mb-2">Login</h2>
        <p className="text-center text-xs font-black uppercase text-accent-orange tracking-[0.2em] mb-8 opacity-80">Identificati per continuare</p>

        <AnimatePresence mode="wait">
        {!selectedUser ? (
           <motion.div key="user-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-slate-400 text-slate-600" size={20} />
                <Input 
                  type="text" 
                  autoFocus
                  placeholder="Cerca per Nome o ID..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl h-12 pl-12 pr-4 bg-slate-200/50 dark:bg-slate-900/50 border-slate-900/10 dark:border-white/10"
                />
             </div>
             
             <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto p-1 pb-4 pr-2 custom-scrollbar">
                {loading ? (
                  <p className="text-center text-sm dark:text-slate-400 text-slate-600 font-bold p-4">Caricamento...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-sm dark:text-slate-400 text-slate-600 font-bold p-4">Nessun utente trovato</p>
                ) : (
                  filteredUsers.map(u => (
                    <Button 
                      key={u.id}
                      variant="ghost"
                      onClick={() => handleSelectUser(u)}
                      className="flex items-center justify-between p-4 h-auto rounded-xl border border-white/5 hover:border-accent-blue/40 dark:bg-white/5 bg-slate-900/5 hover:bg-accent-blue/10 transition-all text-left group shrink-0"
                    >
                      <div>
                        <p className="font-bold dark:text-white text-slate-900 text-lg group-hover:text-accent-blue transition-colors">{u.nome} {u.cognome}</p>
                        <p className="text-[10px] font-black tracking-widest uppercase dark:text-slate-400 text-slate-600 mt-1">ID: {u.codice_id || 'N/A'}</p>
                      </div>
                      <div className="text-[9px] font-black tracking-widest uppercase dark:bg-slate-900/50 bg-slate-200/50 px-3 py-1.5 rounded-full text-accent-blue">
                         {u.ruolo}
                      </div>
                    </Button>
                  ))
                )}
             </div>
           </motion.div>
        ) : (
           <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
             <div className="flex items-center gap-4 mb-6 p-4 rounded-xl dark:bg-white/5 bg-slate-900/5 border dark:border-white/10 border-slate-900/10">
                <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue font-black uppercase">
                   {selectedUser.nome?.[0]}{selectedUser.cognome?.[0]}
                </div>
                <div>
                   <p className="font-bold dark:text-white text-slate-900 text-lg">{selectedUser.nome} {selectedUser.cognome}</p>
                   <p className="text-[10px] dark:text-slate-400 text-slate-600 font-black uppercase tracking-widest">{selectedUser.ruolo}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="ml-auto text-[10px] font-black uppercase tracking-widest text-accent-orange hover:text-accent-orange/80 hover:bg-transparent">
                  Cambia
                </Button>
             </div>

             <form onSubmit={handlePasswordSubmit}>
                <div className="relative mb-6">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-slate-400 text-slate-600" size={20} />
                   <Input
                     type="password"
                     autoFocus
                     placeholder="Inserisci la password admin"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full rounded-2xl h-12 pl-12 pr-4 bg-slate-200/50 dark:bg-slate-900/50 border-slate-900/10 dark:border-white/10"
                   />
                </div>
                {error && <p className="text-rose-400 text-xs font-bold text-center mb-4 uppercase tracking-wider">{error}</p>}
                
                <Button type="submit" className="w-full h-12 text-slate-950 font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3">
                   Accedi <ArrowRight size={20} />
                </Button>
             </form>
           </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
