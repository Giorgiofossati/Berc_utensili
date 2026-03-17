import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Search, Key, X, Check } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const UserSelectionModal = ({ isOpen, onClose }) => {
  const { users, login, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users.slice(0, 10);
    return users.filter(u => 
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.codice_id.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [users, searchTerm]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setError('');
    setPassword('');
    if (user.ruolo !== 'Admin') {
      handleLogin(user);
    }
  };

  const handleLogin = async (user, pwd = null) => {
    try {
      await login(user, pwd);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }} 
        className="glass-panel w-full max-w-lg p-6 md:p-10 rounded-[40px] z-[2001] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-[10px] font-black text-accent-orange uppercase tracking-[0.4em] mb-1">Accesso Sistema</p>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Identifica Utente</h3>
          </div>
          <button onClick={onClose} className="glass-button p-3 rounded-full"><X size={20} /></button>
        </div>

        {!selectedUser ? (
          <div className="flex flex-col gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
              <input 
                type="text" 
                placeholder="Cerca Nome o Codice ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-accent-blue/50 transition-all font-medium"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="py-10 text-center flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-white/40 text-sm">Caricamento operatori...</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <button 
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center justify-between p-4 rounded-2xl glass-button hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${user.ruolo === 'Admin' ? 'bg-accent-orange/20 text-accent-orange' : 'bg-accent-blue/20 text-accent-blue'}`}>
                        {user.ruolo === 'Admin' ? <Shield size={20} /> : <User size={20} />}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white uppercase tracking-tight">{user.nome} {user.cognome}</p>
                        <p className="text-xs text-white/40 font-mono tracking-widest">{user.codice_id}</p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check size={18} className="text-accent-blue" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-10 text-center flex flex-col items-center gap-4 bg-white/5 rounded-3xl p-8 border border-white/5">
                  <div className="p-4 bg-accent-orange/10 rounded-full text-accent-orange">
                    <X size={32} />
                  </div>
                  <div>
                    <p className="text-white font-bold mb-1">Nessun operatore trovato</p>
                    <p className="text-white/40 text-xs max-w-[250px]">
                      Assicurati di aver creato la tabella `utenti` su Supabase e aggiunto almeno un operatore.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className={`p-4 rounded-2xl ${selectedUser.ruolo === 'Admin' ? 'bg-accent-orange/20 text-accent-orange' : 'bg-accent-blue/20 text-accent-blue'}`}>
                {selectedUser.ruolo === 'Admin' ? <Shield size={28} /> : <User size={28} />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-accent-orange uppercase tracking-widest mb-0.5">{selectedUser.ruolo}</p>
                <h4 className="text-xl font-black text-white uppercase">{selectedUser.nome} {selectedUser.cognome}</h4>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-xs text-white/40 hover:text-white underline uppercase p-2">Cambia</button>
            </div>

            {selectedUser.ruolo === 'Admin' && (
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 ml-1">Richiesta Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-accent-orange/50 transition-all font-mono text-2xl tracking-[0.3em]"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin(selectedUser, password)}
                    />
                  </div>
                  {error && <p className="text-accent-rose text-xs font-bold mt-3 ml-1 animate-pulse">{error}</p>}
                </div>

                <button 
                  onClick={() => handleLogin(selectedUser, password)}
                  className="w-full py-5 bg-accent-orange text-slate-950 font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-orange-400 transition-all shadow-xl shadow-accent-orange/20"
                >
                  Confirm Login
                </button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default UserSelectionModal;
