import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Plus, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AddToolModal = ({ onClose, onToolAdded, currentUser }) => {
  const [isLoading, setIsLoading] = useState(false);
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
    SerialNumber: ''
  });

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
    if (!formData.Tipologia || !formData.Codice) {
      alert("Tipologia e Codice sono campi obbligatori.");
      return;
    }

    setIsLoading(true);
    try {
      // Pulisci i dati per evitare stringhe vuote al posto di null se necessario, o lasciale stringhe vuote
      // Pulisci i dati per evitare stringhe vuote al posto di null se invisibili
      const dataToInsert = { ...formData };
      
      const fieldsToCheck = ['Forma', 'Raggio', 'Passo', 'Tolleranza', 'Angolo'];
      fieldsToCheck.forEach(field => {
        if (!isFieldVisible(field)) {
          dataToInsert[field] = null;
        }
      });

      dataToInsert['Quantità'] = Number(formData['Quantità']) || 0;

      const { data, error } = await supabase
        .from('Utensili_B1')
        .insert([dataToInsert])
        .select();

      if (error) throw error;

      alert("Articolo aggiunto con successo!");
      
      if (onToolAdded) {
        onToolAdded();
      }
      onClose();
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
        className="glass-panel w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[32px] md:rounded-[48px] z-[2501] relative shadow-[0_0_100px_rgba(0,0,0,0.3)] dark:border-white/10 border-slate-900/10 overflow-hidden"
      >
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
            {/* Sezione Base Obbligatoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Tipologia *</label>
                <input required type="text" name="Tipologia" value={formData.Tipologia} onChange={handleChange} className="glass-input w-full p-4 rounded-2xl font-black text-lg focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all" placeholder="es. FRESA, PUNTA, INSERTO..." />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Codice *</label>
                <input required type="text" name="Codice" value={formData.Codice} onChange={handleChange} className="glass-input w-full p-4 rounded-2xl font-black text-lg focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all" placeholder="Codice Univoco / Barcode" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Quantità Iniziale</label>
                <input type="number" min="0" name="Quantità" value={formData['Quantità']} onChange={handleNumberChange} className="glass-input w-full p-4 rounded-2xl font-black text-lg focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Stato</label>
                <select name="Stato" value={formData.Stato} onChange={handleChange} className="glass-input w-full p-4 rounded-2xl font-black text-lg focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all appearance-none">
                  <option value="Disponibile">Disponibile</option>
                  <option value="Esaurito">Esaurito</option>
                  <option value="Da Ordinare">Da Ordinare</option>
                </select>
              </div>
            </div>

            <hr className="dark:border-white/5 border-slate-900/5" />

            {/* Sezione Dettagli Tecnici */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Diametro *</label>
                <input required type="text" name="Diametro" value={formData.Diametro} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" placeholder="es. D10 o M6" />
              </div>
              
              {isFieldVisible('Forma') && (
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Forma *</label>
                  <select required name="Forma" value={formData.Forma} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold appearance-none">
                    <option value="">Seleziona forma...</option>
                    <option value="Candela">Candela</option>
                    <option value="Torica">Torica</option>
                    <option value="Sferica">Sferica</option>
                    <option value="Disco">Disco</option>
                    <option value="Pettine">Pettine</option>
                    <option value="Inserti">Inserti</option>
                    <option value="Karnasch">Karnasch</option>
                  </select>
                </div>
              )}

              {isFieldVisible('Raggio') && (
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Raggio *</label>
                  <input required type="text" name="Raggio" value={formData.Raggio} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" placeholder="es. R0.5" />
                </div>
              )}

              {isFieldVisible('Passo') && (
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Passo *</label>
                  <input required type="text" name="Passo" value={formData.Passo} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" placeholder="es. 1.5" />
                </div>
              )}

              {isFieldVisible('Tolleranza') && (
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Tolleranza *</label>
                  <input required type="text" name="Tolleranza" value={formData.Tolleranza} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" placeholder="es. H7" />
                </div>
              )}

              {isFieldVisible('Angolo') && (
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Angolo *</label>
                  <input required type="text" name="Angolo" value={formData.Angolo} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" placeholder="es. 90°" />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Ubicazione *</label>
                <input required type="text" name="Ubicazione" value={formData.Ubicazione} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" placeholder="es. Cassetto A1" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Materiale *</label>
                <input required type="text" name="Materiale" value={formData.Materiale} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" placeholder="es. HSS, HSSE, Metallo Duro, VHM" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Lunghezza (Opzionale)</label>
                <input type="text" name="Lunghezza" value={formData.Lunghezza} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" placeholder="es. 150mm" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Rivestimento *</label>
                <input required type="text" name="Rivestimento" value={formData.Rivestimento} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" placeholder="es. Nuda, Diamante, TiN" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Fornitore *</label>
                <input required type="text" name="Fornitore" value={formData.Fornitore} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Lavorazione *</label>
                <input required type="text" name="Lavorazione" value={formData.Lavorazione} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-70">Serial Number *</label>
                <input required type="text" name="SerialNumber" value={formData.SerialNumber} onChange={handleChange} className="glass-input w-full p-3 rounded-xl font-bold" />
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
      </motion.div>
    </div>
  );
};

export default AddToolModal;
