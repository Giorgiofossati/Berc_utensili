import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Lock, ArrowRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[9999] p-4 text-slate-200">
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
        <h2 className="text-3xl font-black text-center uppercase tracking-widest text-white mb-2">Login</h2>
        <p className="text-center text-xs font-black uppercase text-accent-orange tracking-[0.2em] mb-8 opacity-80">Identificati per continuare</p>

        <AnimatePresence mode="wait">
        {!selectedUser ? (
           <motion.div key="user-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Cerca per Nome o ID..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent-blue/50 transition-colors"
                />
             </div>
             
             <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {loading ? (
                  <p className="text-center text-sm text-slate-400 font-bold p-4">Caricamento...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 font-bold p-4">Nessun utente trovato</p>
                ) : (
                  filteredUsers.map(u => (
                    <button 
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/5 hover:border-accent-blue/40 bg-white/5 hover:bg-accent-blue/10 transition-all text-left group"
                    >
                      <div>
                        <p className="font-bold text-white text-lg group-hover:text-accent-blue transition-colors">{u.nome} {u.cognome}</p>
                        <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mt-1">ID: {u.codice_id || 'N/A'}</p>
                      </div>
                      <div className="text-[9px] font-black tracking-widest uppercase bg-slate-900/50 px-3 py-1.5 rounded-full text-accent-blue">
                         {u.ruolo}
                      </div>
                    </button>
                  ))
                )}
             </div>
           </motion.div>
        ) : (
           <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
             <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue font-black uppercase">
                   {selectedUser.nome?.[0]}{selectedUser.cognome?.[0]}
                </div>
                <div>
                   <p className="font-bold text-white text-lg">{selectedUser.nome} {selectedUser.cognome}</p>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{selectedUser.ruolo}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="ml-auto text-[10px] font-black uppercase tracking-widest text-accent-orange hover:text-white transition-colors">
                  Cambia
                </button>
             </div>

             <form onSubmit={handlePasswordSubmit}>
                <div className="relative mb-6">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                   <input
                     type="password"
                     autoFocus
                     placeholder="Inserisci la password admin"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent-blue/50 transition-colors"
                   />
                </div>
                {error && <p className="text-rose-400 text-xs font-bold text-center mb-4 uppercase tracking-wider">{error}</p>}
                
                <button type="submit" className="w-full py-4 bg-accent-blue text-slate-950 font-black uppercase tracking-widest rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-3">
                   Accedi <ArrowRight size={20} />
                </button>
             </form>
           </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
