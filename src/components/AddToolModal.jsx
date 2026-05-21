import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Plus, Database, List, ChevronDown, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { buildDesc } from '../lib/toolUtils';

const AddToolModal = ({ onClose, onToolAdded, currentUser }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dbOptions, setDbOptions] = useState({
    Tipologia: [],
    Forma: [],
    Diametro: [],
    Ubicazione: [],
    Materiale: [],
    Rivestimento: [],
    Fornitore: [],
    Lavorazione: [],
    Passo: [],
    Tolleranza: [],
    Raggio: [],
    Angolo: []
  });

  const [customInputFields, setCustomInputFields] = useState({
    Tipologia: false,
    Forma: false,
    Diametro: false,
    Ubicazione: false,
    Materiale: false,
    Rivestimento: false,
    Fornitore: false,
    Lavorazione: false,
    Passo: false,
    Tolleranza: false,
    Raggio: false,
    Angolo: false
  });

  const [formData, setFormData] = useState({
    Tipologia: '',
    Forma: '',
    Diametro: '',
    Raggio: '',
    Codice: '',
    Ubicazione: '',
    'Quantità': 0,
    Materiale: '',
    Stato: 'Disponibile',
    Lunghezza: '',
    Passo: '',
    Tolleranza: '',
    Angolo: '',
    Rivestimento: '',
    Fornitore: '',
    Lavorazione: '',
    'Serial Number': ''
  });

  useEffect(() => {
    const fetchExistingOptions = async () => {
      try {
        const { data, error } = await supabase
          .from('Utensili_B1')
          .select('Tipologia, Forma, Diametro, Ubicazione, Materiale, Rivestimento, Fornitore, Lavorazione, Passo, Tolleranza, Raggio, Angolo');
        
        if (error) throw error;
        
        if (data) {
          const processed = {};
          const keys = ['Tipologia', 'Forma', 'Diametro', 'Ubicazione', 'Materiale', 'Rivestimento', 'Fornitore', 'Lavorazione', 'Passo', 'Tolleranza', 'Raggio', 'Angolo'];
          keys.forEach(key => {
            const values = data
              .map(row => row[key])
              .filter(val => val !== null && val !== undefined && val !== '');
            // Ottieni valori unici e ordinali in modo naturale
            processed[key] = [...new Set(values)].sort((a, b) => 
              a.toString().localeCompare(b.toString(), undefined, { numeric: true, sensitivity: 'base' })
            );
          });
          setDbOptions(processed);
        }
      } catch (err) {
        console.error('Error fetching database categories:', err);
      }
    };

    fetchExistingOptions();
  }, []);

  const isFieldVisible = (fieldName) => {
    const type = (formData.Tipologia || '').toUpperCase();
    const forma = (formData.Forma || '').toUpperCase();

    switch (fieldName) {
      case 'Forma':
        return type.includes('FRESA');
      case 'Raggio':
        return type.includes('FRESA') && (forma.includes('TORICA') || forma.includes('SFERICA'));
      case 'Passo':
        return type.includes('MASCHIO') || type.includes('SPACCAMASCHIO') || (type.includes('FRESA') && forma.includes('PETTINE'));
      case 'Tolleranza':
        return type.includes('ALESATORE') || type.includes('MASCHIO') || (type.includes('FRESA') && !forma.includes('CANDELA'));
      case 'Angolo':
        return type.includes('SVASATORE') || type.includes('SMUSSATORE') || type.includes('TRACCIATORE') || type.includes('PUNTA');
      case 'Lunghezza':
        return true;
      default:
        return true;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-precompilazione Lavorazione in base a Tipologia
      if (name === 'Tipologia') {
        const t = value.toUpperCase();
        if (t.includes('FRESA')) updated.Lavorazione = 'Fresatura';
        else if (t.includes('PUNTA')) updated.Lavorazione = 'Foratura';
        else if (t.includes('MASCHIO') || t.includes('SPACCAMASCHIO')) updated.Lavorazione = 'Filettatura';
        else if (t.includes('TASTATORE')) updated.Lavorazione = 'Tastatura';
        else if (t.includes('LAMATORE')) updated.Lavorazione = 'Lamatura';
      }
      return updated;
    });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? Number(value) : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazione base
    if (!formData.Tipologia || !formData.Codice || !formData['Serial Number']) {
      alert("Tipologia, Codice Aziendale e Codice Produttore sono campi obbligatori.");
      return;
    }

    setIsLoading(true);
    try {
      // Pulisci i dati per evitare stringhe vuote al posto di null se necessario, o lasciale stringhe vuote
      // Pulisci i dati per evitare stringhe vuote al posto di null se invisibili
      const dataToInsert = { ...formData };
      
      // Converte tutte le stringhe vuote in null per evitare errori di sintassi su colonne numeriche (es. double precision)
      Object.keys(dataToInsert).forEach(key => {
        if (dataToInsert[key] === '') {
          dataToInsert[key] = null;
        }
      });
      
      const fieldsToCheck = ['Forma', 'Raggio', 'Passo', 'Tolleranza', 'Angolo'];
      fieldsToCheck.forEach(field => {
        if (!isFieldVisible(field)) {
          dataToInsert[field] = null;
        }
      });

      dataToInsert['Quantità'] = Number(formData['Quantità']) || 0;

      // Auto-genera la "Descrizione Originale" richiesta dal database usando il sistema condiviso
      dataToInsert['Descrizione Originale'] = buildDesc(formData);

      const { data, error } = await supabase
        .from('Utensili_B1')
        .insert([dataToInsert])
        .select();

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => {
        if (onToolAdded) {
          onToolAdded();
        }
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Errore durante l'inserimento: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 dark:bg-slate-950/90 bg-slate-50/90 backdrop-blur-2xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        className="glass-panel w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl max-h-[90vh] flex flex-col rounded-[32px] md:rounded-[48px] z-[2501] relative shadow-[0_0_100px_rgba(0,0,0,0.3)] dark:border-white/10 border-slate-900/10 overflow-hidden"
      >
        {showSuccess ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center p-16 min-h-[50vh]"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-24 h-24 rounded-full bg-accent-emerald/20 border-4 border-accent-emerald/30 flex items-center justify-center mb-8"
            >
              <CheckCircle2 size={48} className="text-accent-emerald drop-shadow-lg" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic dark:text-white text-slate-900 mb-3 text-center"
            >
              Operazione Completata
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm md:text-base font-bold uppercase tracking-widest dark:text-slate-400 text-slate-600 text-center"
            >
              L'articolo è stato registrato nel sistema
            </motion.p>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 md:p-8 shrink-0 border-b dark:border-white/10 border-slate-900/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 flex items-center justify-center">
              <Database className="text-accent-blue" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-blue">Nuovo Inserimento</p>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter dark:text-white text-slate-900">Aggiungi Articolo</h2>
            </div>
          </div>
          <button onClick={onClose} className="glass-button w-12 h-12 rounded-full flex items-center justify-center hover:rotate-90 transition-transform">
            <X size={24} />
          </button>
        </div>

        {/* Form Body - Scrollabile */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <form id="add-tool-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
            {/* BOX 1: INFORMAZIONI PRINCIPALI E GEOMETRICHE */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-950/5 dark:bg-white/5 border dark:border-white/5 border-slate-900/5 flex flex-col gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 border-b dark:border-white/5 border-slate-900/5 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-accent-blue bg-accent-blue/10 px-2.5 py-1 rounded-md">1</span>
                <h3 className="text-xs font-black uppercase tracking-wider dark:text-white text-slate-800">Informazioni Principali e Geometriche</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Tipologia */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Tipologia *</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                  {customInputFields.Tipologia ? (
                    <div className="flex items-center gap-2">
                      <input required type="text" name="Tipologia" value={formData.Tipologia} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Tipologia ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Inserisci nuova tipologia..." />
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomInputFields(prev => ({ ...prev, Tipologia: false }));
                          setFormData(prev => ({ ...prev, Tipologia: '' }));
                        }}
                        className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                        title="Torna alla lista"
                      >
                        <List size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        required 
                        name="Tipologia" 
                        value={formData.Tipologia} 
                        onChange={(e) => {
                          if (e.target.value === 'NEW_CUSTOM_VALUE') {
                            setCustomInputFields(prev => ({ ...prev, Tipologia: true }));
                            setFormData(prev => ({ ...prev, Tipologia: '' }));
                          } else {
                            handleChange(e);
                          }
                        }} 
                        className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Tipologia ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                      >
                        <option value="" className="text-text-main/40 font-normal">Seleziona tipologia...</option>
                        {dbOptions.Tipologia.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuova...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Forma */}
                {isFieldVisible('Forma') && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Forma *</label>
                    <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                    {customInputFields.Forma ? (
                      <div className="flex items-center gap-2">
                        <input required type="text" name="Forma" value={formData.Forma} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Forma ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Inserisci nuova forma..." />
                        <button 
                          type="button" 
                          onClick={() => {
                            setCustomInputFields(prev => ({ ...prev, Forma: false }));
                            setFormData(prev => ({ ...prev, Forma: '' }));
                          }}
                          className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                          title="Torna alla lista"
                        >
                          <List size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select 
                          required 
                          name="Forma" 
                          value={formData.Forma} 
                          onChange={(e) => {
                            if (e.target.value === 'NEW_CUSTOM_VALUE') {
                              setCustomInputFields(prev => ({ ...prev, Forma: true }));
                              setFormData(prev => ({ ...prev, Forma: '' }));
                            } else {
                              handleChange(e);
                            }
                          }} 
                          className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Forma ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                        >
                          <option value="" className="text-text-main/40 font-normal">Seleziona forma...</option>
                          {dbOptions.Forma.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuova...</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Diametro */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Diametro *</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                  {customInputFields.Diametro ? (
                    <div className="flex items-center gap-2">
                      <input required type="text" name="Diametro" value={formData.Diametro} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Diametro ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Inserisci nuovo diametro..." />
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomInputFields(prev => ({ ...prev, Diametro: false }));
                          setFormData(prev => ({ ...prev, Diametro: '' }));
                        }}
                        className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                        title="Torna alla lista"
                      >
                        <List size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        required 
                        name="Diametro" 
                        value={formData.Diametro} 
                        onChange={(e) => {
                          if (e.target.value === 'NEW_CUSTOM_VALUE') {
                            setCustomInputFields(prev => ({ ...prev, Diametro: true }));
                            setFormData(prev => ({ ...prev, Diametro: '' }));
                          } else {
                            handleChange(e);
                          }
                        }} 
                        className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Diametro ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                      >
                        <option value="" className="text-text-main/40 font-normal">Seleziona diametro...</option>
                        {dbOptions.Diametro.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuovo...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tolleranza */}
                {isFieldVisible('Tolleranza') && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Tolleranza *</label>
                    <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                    {customInputFields.Tolleranza ? (
                      <div className="flex items-center gap-2">
                        <input required type="text" name="Tolleranza" value={formData.Tolleranza} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Tolleranza ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="es. H7" />
                        <button 
                          type="button" 
                          onClick={() => {
                            setCustomInputFields(prev => ({ ...prev, Tolleranza: false }));
                            setFormData(prev => ({ ...prev, Tolleranza: '' }));
                          }}
                          className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                          title="Torna alla lista"
                        >
                          <List size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select 
                          required 
                          name="Tolleranza" 
                          value={formData.Tolleranza} 
                          onChange={(e) => {
                            if (e.target.value === 'NEW_CUSTOM_VALUE') {
                              setCustomInputFields(prev => ({ ...prev, Tolleranza: true }));
                              setFormData(prev => ({ ...prev, Tolleranza: '' }));
                            } else {
                              handleChange(e);
                            }
                          }} 
                          className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Tolleranza ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                        >
                          <option value="" className="text-text-main/40 font-normal">Seleziona tolleranza...</option>
                          {dbOptions.Tolleranza.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuova...</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lunghezza */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Lunghezza (Opzionale)</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                    <input type="text" name="Lunghezza" value={formData.Lunghezza} onChange={handleChange} className={`glass-input w-full p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Lunghezza ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="es. 150mm" />
                  </div>
                </div>

                {/* Ubicazione */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Ubicazione *</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                  {customInputFields.Ubicazione ? (
                    <div className="flex items-center gap-2">
                      <input required type="text" name="Ubicazione" value={formData.Ubicazione} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Ubicazione ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Inserisci nuova ubicazione..." />
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomInputFields(prev => ({ ...prev, Ubicazione: false }));
                          setFormData(prev => ({ ...prev, Ubicazione: '' }));
                        }}
                        className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                        title="Torna alla lista"
                      >
                        <List size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        required 
                        name="Ubicazione" 
                        value={formData.Ubicazione} 
                        onChange={(e) => {
                          if (e.target.value === 'NEW_CUSTOM_VALUE') {
                            setCustomInputFields(prev => ({ ...prev, Ubicazione: true }));
                            setFormData(prev => ({ ...prev, Ubicazione: '' }));
                          } else {
                            handleChange(e);
                          }
                        }} 
                        className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Ubicazione ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                      >
                        <option value="" className="text-text-main/40 font-normal">Seleziona ubicazione...</option>
                        {dbOptions.Ubicazione.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuova...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Materiale */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Materiale *</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                  {customInputFields.Materiale ? (
                    <div className="flex items-center gap-2">
                      <input required type="text" name="Materiale" value={formData.Materiale} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Materiale ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Inserisci nuovo materiale..." />
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomInputFields(prev => ({ ...prev, Materiale: false }));
                          setFormData(prev => ({ ...prev, Materiale: '' }));
                        }}
                        className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                        title="Torna alla lista"
                      >
                        <List size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        required 
                        name="Materiale" 
                        value={formData.Materiale} 
                        onChange={(e) => {
                          if (e.target.value === 'NEW_CUSTOM_VALUE') {
                            setCustomInputFields(prev => ({ ...prev, Materiale: true }));
                            setFormData(prev => ({ ...prev, Materiale: '' }));
                          } else {
                            handleChange(e);
                          }
                        }} 
                        className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Materiale ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                      >
                        <option value="" className="text-text-main/40 font-normal">Seleziona materiale...</option>
                        {dbOptions.Materiale.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuovo...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rivestimento */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Rivestimento *</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                  {customInputFields.Rivestimento ? (
                    <div className="flex items-center gap-2">
                      <input required type="text" name="Rivestimento" value={formData.Rivestimento} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Rivestimento ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Inserisci nuovo rivestimento..." />
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomInputFields(prev => ({ ...prev, Rivestimento: false }));
                          setFormData(prev => ({ ...prev, Rivestimento: '' }));
                        }}
                        className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                        title="Torna alla lista"
                      >
                        <List size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        required 
                        name="Rivestimento" 
                        value={formData.Rivestimento} 
                        onChange={(e) => {
                          if (e.target.value === 'NEW_CUSTOM_VALUE') {
                            setCustomInputFields(prev => ({ ...prev, Rivestimento: true }));
                            setFormData(prev => ({ ...prev, Rivestimento: '' }));
                          } else {
                            handleChange(e);
                          }
                        }} 
                        className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Rivestimento ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                      >
                        <option value="" className="text-text-main/40 font-normal">Seleziona rivestimento...</option>
                        {dbOptions.Rivestimento.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuovo...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fornitore */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Fornitore *</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                  {customInputFields.Fornitore ? (
                    <div className="flex items-center gap-2">
                      <input required type="text" name="Fornitore" value={formData.Fornitore} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Fornitore ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Inserisci nuovo fornitore..." />
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomInputFields(prev => ({ ...prev, Fornitore: false }));
                          setFormData(prev => ({ ...prev, Fornitore: '' }));
                        }}
                        className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                        title="Torna alla lista"
                      >
                        <List size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        required 
                        name="Fornitore" 
                        value={formData.Fornitore} 
                        onChange={(e) => {
                          if (e.target.value === 'NEW_CUSTOM_VALUE') {
                            setCustomInputFields(prev => ({ ...prev, Fornitore: true }));
                            setFormData(prev => ({ ...prev, Fornitore: '' }));
                          } else {
                            handleChange(e);
                          }
                        }} 
                        className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Fornitore ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                      >
                        <option value="" className="text-text-main/40 font-normal">Seleziona fornitore...</option>
                        {dbOptions.Fornitore.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuovo...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lavorazione */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Lavorazione *</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                  {customInputFields.Lavorazione ? (
                    <div className="flex items-center gap-2">
                      <input required type="text" name="Lavorazione" value={formData.Lavorazione} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Lavorazione ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Inserisci nuova lavorazione..." />
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomInputFields(prev => ({ ...prev, Lavorazione: false }));
                          setFormData(prev => ({ ...prev, Lavorazione: '' }));
                        }}
                        className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                        title="Torna alla lista"
                      >
                        <List size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        required 
                        name="Lavorazione" 
                        value={formData.Lavorazione} 
                        onChange={(e) => {
                          if (e.target.value === 'NEW_CUSTOM_VALUE') {
                            setCustomInputFields(prev => ({ ...prev, Lavorazione: true }));
                            setFormData(prev => ({ ...prev, Lavorazione: '' }));
                          } else {
                            handleChange(e);
                          }
                        }} 
                        className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Lavorazione ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                      >
                        <option value="" className="text-text-main/40 font-normal">Seleziona lavorazione...</option>
                        {dbOptions.Lavorazione.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuova...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Passo */}
                {isFieldVisible('Passo') && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Passo *</label>
                    <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                    {customInputFields.Passo ? (
                      <div className="flex items-center gap-2">
                        <input required type="text" name="Passo" value={formData.Passo} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Passo ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="es. 1.5" />
                        <button 
                          type="button" 
                          onClick={() => {
                            setCustomInputFields(prev => ({ ...prev, Passo: false }));
                            setFormData(prev => ({ ...prev, Passo: '' }));
                          }}
                          className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                          title="Torna alla lista"
                        >
                          <List size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select 
                          required 
                          name="Passo" 
                          value={formData.Passo} 
                          onChange={(e) => {
                            if (e.target.value === 'NEW_CUSTOM_VALUE') {
                              setCustomInputFields(prev => ({ ...prev, Passo: true }));
                              setFormData(prev => ({ ...prev, Passo: '' }));
                            } else {
                              handleChange(e);
                            }
                          }} 
                          className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Passo ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                        >
                          <option value="" className="text-text-main/40 font-normal">Seleziona passo...</option>
                          {dbOptions.Passo.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuovo...</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raggio */}
                {isFieldVisible('Raggio') && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Raggio *</label>
                    <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                    {customInputFields.Raggio ? (
                      <div className="flex items-center gap-2">
                        <input required type="text" name="Raggio" value={formData.Raggio} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Raggio ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="es. R0.5" />
                        <button 
                          type="button" 
                          onClick={() => {
                            setCustomInputFields(prev => ({ ...prev, Raggio: false }));
                            setFormData(prev => ({ ...prev, Raggio: '' }));
                          }}
                          className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                          title="Torna alla lista"
                        >
                          <List size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select 
                          required 
                          name="Raggio" 
                          value={formData.Raggio} 
                          onChange={(e) => {
                            if (e.target.value === 'NEW_CUSTOM_VALUE') {
                              setCustomInputFields(prev => ({ ...prev, Raggio: true }));
                              setFormData(prev => ({ ...prev, Raggio: '' }));
                            } else {
                              handleChange(e);
                            }
                          }} 
                          className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Raggio ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                        >
                          <option value="" className="text-text-main/40 font-normal">Seleziona raggio...</option>
                          {dbOptions.Raggio.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuovo...</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Angolo */}
                {isFieldVisible('Angolo') && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Angolo *</label>
                    <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                    {customInputFields.Angolo ? (
                      <div className="flex items-center gap-2">
                        <input required type="text" name="Angolo" value={formData.Angolo} onChange={handleChange} className={`glass-input flex-1 p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Angolo ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="es. 90°" />
                        <button 
                          type="button" 
                          onClick={() => {
                            setCustomInputFields(prev => ({ ...prev, Angolo: false }));
                            setFormData(prev => ({ ...prev, Angolo: '' }));
                          }}
                          className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
                          title="Torna alla lista"
                        >
                          <List size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select 
                          required 
                          name="Angolo" 
                          value={formData.Angolo} 
                          onChange={(e) => {
                            if (e.target.value === 'NEW_CUSTOM_VALUE') {
                              setCustomInputFields(prev => ({ ...prev, Angolo: true }));
                              setFormData(prev => ({ ...prev, Angolo: '' }));
                            } else {
                              handleChange(e);
                            }
                          }} 
                          className={`glass-input w-full p-3.5 rounded-xl appearance-none pr-10 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Angolo ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}
                        >
                          <option value="" className="text-text-main/40 font-normal">Seleziona angolo...</option>
                          {dbOptions.Angolo.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          <option value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold">+ Aggiungi nuovo...</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

            {/* BOX 2: DATI INVENTARIO E GESTIONALI */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-950/5 dark:bg-white/5 border dark:border-white/5 border-slate-900/5 flex flex-col gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 border-b dark:border-white/5 border-slate-900/5 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-accent-blue bg-accent-blue/10 px-2.5 py-1 rounded-md">2</span>
                <h3 className="text-xs font-black uppercase tracking-wider dark:text-white text-slate-800">Dati Inventario e Gestionali</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Codice Aziendale */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Codice Aziendale *</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                    <input required type="text" name="Codice" value={formData.Codice} onChange={handleChange} className={`glass-input w-full p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Codice ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Codice Aziendale / Barcode" />
                  </div>
                </div>

                {/* Codice Produttore */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Codice Produttore *</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                    <input required type="text" name="Serial Number" value={formData['Serial Number']} onChange={handleChange} className={`glass-input w-full p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData['Serial Number'] ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Codice Produttore / Serial Number" />
                  </div>
                </div>

                {/* Quantità Iniziale */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Quantità Iniziale</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                    <input type="number" min="0" name="Quantità" value={formData['Quantità']} onChange={handleNumberChange} className={`glass-input w-full p-3.5 rounded-xl focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData['Quantità'] !== '' && formData['Quantità'] !== undefined && formData['Quantità'] !== 0 ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} />
                  </div>
                </div>

                {/* Stato */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider dark:text-slate-300 text-slate-700 px-1">Stato</label>
                  <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-4 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                    <div className="relative">
                      <select name="Stato" value={formData.Stato} onChange={handleChange} className={`glass-input w-full p-3.5 pr-10 rounded-xl appearance-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all ${formData.Stato ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}>
                        <option value="Disponibile">Disponibile</option>
                        <option value="Esaurito">Esaurito</option>
                        <option value="Da Ordinare">Da Ordinare</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-main opacity-50">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 shrink-0 bg-black/5 dark:bg-white/5 flex justify-end">
          <button 
            type="submit" 
            form="add-tool-form"
            disabled={isLoading}
            className="action-btn action-btn-carica px-8 py-4 flex items-center gap-2 rounded-2xl shadow-xl disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} />
                <span className="font-black uppercase tracking-widest text-sm text-slate-900">Salva Articolo</span>
              </>
            )}
          </button>
        </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AddToolModal;
