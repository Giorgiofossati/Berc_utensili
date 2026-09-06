import React from 'react';
import { motion } from 'framer-motion';
import { X, Save, Database, List, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAddToolForm } from '../../hooks/useAddToolForm';

const CustomSelectField = ({ 
  name, label, required = true, isVisible = true, 
  value, options, isCustom, 
  onCustomToggle, onChange, placeholder, customPlaceholder 
}) => {
  if (!isVisible) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="app-overline text-slate-600 dark:text-slate-300 px-1">
        {label} {required && '*'}
      </label>
      <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-2 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
        {isCustom ? (
          <div className="flex items-center gap-2">
            <Input 
              required={required}
              type="text" 
              name={name} 
              value={value || ''} 
              onChange={onChange} 
              className={`glass-input flex-1 p-3.5 h-auto rounded-xl border-none shadow-none bg-transparent focus-visible:ring-1 focus-visible:ring-accent-blue transition-all ${value ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} 
              placeholder={customPlaceholder || `Inserisci ${label.toLowerCase()}...`} 
            />
            <button 
              type="button" 
              onClick={onCustomToggle}
              className="glass-button w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-accent-orange transition-all hover:scale-105 active:scale-95"
              title="Torna alla lista"
            >
              <List size={18} />
            </button>
          </div>
        ) : (
          <Select 
            required={required} 
            value={value ? String(value) : undefined} 
            onValueChange={(val) => {
              if (val === 'NEW_CUSTOM_VALUE') {
                onCustomToggle();
              } else {
                onChange({ target: { name, value: val } });
              }
            }}
          >
            <SelectTrigger className={`glass-input border-none shadow-none bg-transparent w-full p-3.5 rounded-xl focus:ring-1 focus:ring-accent-blue transition-all h-auto py-3.5 ${value ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}>
              <SelectValue placeholder={placeholder || `Seleziona ${label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent className="glass-panel z-[3000] border-white/10 dark:bg-slate-950/90 bg-white/90 backdrop-blur-xl max-h-[300px]">
              {options.map(opt => (
                <SelectItem key={opt} value={String(opt)} className="cursor-pointer font-bold">{opt}</SelectItem>
              ))}
              <SelectItem value="NEW_CUSTOM_VALUE" className="text-accent-orange font-bold cursor-pointer">+ Aggiungi {label.toLowerCase().includes('nuov') ? '' : 'nuovo'}...</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

const AddToolModal = ({ onClose, onToolAdded, tools = [] }) => {
  const {
    isLoading,
    showSuccess,
    dbOptions,
    customInputFields,
    formData,
    isFieldVisible,
    handleChange,
    handleNumberChange,
    toggleCustomField,
    handleSubmit
  } = useAddToolForm({ tools, onClose, onToolAdded });

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="glass-panel w-[96vw] sm:w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92dvh] overflow-hidden p-0 rounded-[28px] sm:rounded-[36px] md:rounded-[40px] z-[1001] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border dark:border-white/10 border-slate-900/10 shadow-2xl flex flex-col !max-w-6xl focus:outline-none">
        <DialogTitle className="sr-only">Aggiungi Articolo</DialogTitle>
        {showSuccess ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center p-8 sm:p-16 min-h-[40vh]"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent-emerald/20 border-4 border-accent-emerald/30 flex items-center justify-center mb-6 shadow-carica"
            >
              <CheckCircle2 size={40} className="text-accent-emerald drop-shadow-lg sm:w-12 sm:h-12" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="app-h1 text-center mb-2"
            >
              Operazione Completata
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="app-caption uppercase tracking-widest text-slate-500 text-center"
            >
              L'articolo è stato registrato nel sistema
            </motion.p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 sm:p-6 md:p-8 shrink-0 border-b dark:border-white/10 border-slate-900/10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                  <Database className="text-accent-blue" size={20} />
                </div>
                <div>
                  <p className="app-overline text-accent-blue">Nuovo Inserimento</p>
                  <h2 className="app-h2">Aggiungi Articolo</h2>
                </div>
              </div>
              <button onClick={onClose} className="glass-button w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:rotate-90 transition-transform shrink-0" title="Chiudi">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8">
              <form id="add-tool-form" onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8">
                <div className="p-5 sm:p-6 md:p-8 rounded-3xl bg-slate-950/5 dark:bg-white/5 border dark:border-white/5 border-slate-900/5 flex flex-col gap-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-2 border-b dark:border-white/5 border-slate-900/5 pb-3">
                    <span className="app-overline text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">1</span>
                    <h3 className="app-h3 uppercase tracking-wider dark:text-white text-slate-800">Informazioni Principali e Geometriche</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <CustomSelectField 
                      name="Tipologia" label="Tipologia"
                      value={formData.Tipologia} options={dbOptions.Tipologia}
                      isCustom={customInputFields.Tipologia} onCustomToggle={() => toggleCustomField('Tipologia')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Forma" label="Forma" isVisible={isFieldVisible('Forma')}
                      value={formData.Forma} options={dbOptions.Forma}
                      isCustom={customInputFields.Forma} onCustomToggle={() => toggleCustomField('Forma')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Diametro" label="Diametro"
                      value={formData.Diametro} options={dbOptions.Diametro}
                      isCustom={customInputFields.Diametro} onCustomToggle={() => toggleCustomField('Diametro')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Tolleranza" label="Tolleranza" isVisible={isFieldVisible('Tolleranza')} customPlaceholder="es. H7"
                      value={formData.Tolleranza} options={dbOptions.Tolleranza}
                      isCustom={customInputFields.Tolleranza} onCustomToggle={() => toggleCustomField('Tolleranza')}
                      onChange={handleChange}
                    />
                    
                    {isFieldVisible('Lunghezza') && (
                      <div className="flex flex-col gap-1.5">
                        <label className="app-overline text-slate-600 dark:text-slate-300 px-1">Lunghezza (Opzionale)</label>
                        <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-2 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                          <Input type="text" name="Lunghezza" value={formData.Lunghezza} onChange={handleChange} className={`glass-input w-full p-3.5 h-auto border-none shadow-none bg-transparent rounded-xl focus-visible:ring-1 focus-visible:ring-accent-blue transition-all ${formData.Lunghezza ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="es. 150mm" />
                        </div>
                      </div>
                    )}

                    <CustomSelectField 
                      name="Ubicazione" label="Ubicazione"
                      value={formData.Ubicazione} options={dbOptions.Ubicazione}
                      isCustom={customInputFields.Ubicazione} onCustomToggle={() => toggleCustomField('Ubicazione')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Materiale" label="Materiale"
                      value={formData.Materiale} options={dbOptions.Materiale}
                      isCustom={customInputFields.Materiale} onCustomToggle={() => toggleCustomField('Materiale')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Rivestimento" label="Rivestimento"
                      value={formData.Rivestimento} options={dbOptions.Rivestimento}
                      isCustom={customInputFields.Rivestimento} onCustomToggle={() => toggleCustomField('Rivestimento')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Fornitore" label="Fornitore"
                      value={formData.Fornitore} options={dbOptions.Fornitore}
                      isCustom={customInputFields.Fornitore} onCustomToggle={() => toggleCustomField('Fornitore')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Lavorazione" label="Lavorazione"
                      value={formData.Lavorazione} options={dbOptions.Lavorazione}
                      isCustom={customInputFields.Lavorazione} onCustomToggle={() => toggleCustomField('Lavorazione')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Passo" label="Passo" isVisible={isFieldVisible('Passo')} customPlaceholder="es. 1.5"
                      value={formData.Passo} options={dbOptions.Passo}
                      isCustom={customInputFields.Passo} onCustomToggle={() => toggleCustomField('Passo')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Raggio" label="Raggio" isVisible={isFieldVisible('Raggio')} customPlaceholder="es. R0.5"
                      value={formData.Raggio} options={dbOptions.Raggio}
                      isCustom={customInputFields.Raggio} onCustomToggle={() => toggleCustomField('Raggio')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Angolo" label="Angolo" isVisible={isFieldVisible('Angolo')} customPlaceholder="es. 90°"
                      value={formData.Angolo} options={dbOptions.Angolo}
                      isCustom={customInputFields.Angolo} onCustomToggle={() => toggleCustomField('Angolo')}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="p-6 md:p-8 rounded-3xl bg-slate-950/5 dark:bg-white/5 border dark:border-white/5 border-slate-900/5 flex flex-col gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-2 border-b dark:border-white/5 border-slate-900/5 pb-3">
                    <span className="app-overline text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">2</span>
                    <h3 className="app-h3 uppercase tracking-wider dark:text-white text-slate-800">Dati Inventario e Gestionali</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="app-overline text-slate-600 dark:text-slate-300 px-1">Codice Aziendale *</label>
                      <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-2 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                        <Input required type="text" name="Codice" value={formData.Codice} onChange={handleChange} className={`glass-input w-full p-3.5 h-auto border-none shadow-none bg-transparent rounded-xl focus-visible:ring-1 focus-visible:ring-accent-blue transition-all ${formData.Codice ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Codice Aziendale / Barcode" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="app-overline text-slate-600 dark:text-slate-300 px-1">Codice Produttore *</label>
                      <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-2 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                        <Input required type="text" name="Serial Number" value={formData['Serial Number']} onChange={handleChange} className={`glass-input w-full p-3.5 h-auto border-none shadow-none bg-transparent rounded-xl focus-visible:ring-1 focus-visible:ring-accent-blue transition-all ${formData['Serial Number'] ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="Codice Produttore / Serial Number" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="app-overline text-slate-600 dark:text-slate-300 px-1">Quantità Iniziale</label>
                      <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-2 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                        <Input type="number" min="0" name="Quantità" value={formData['Quantità']} onChange={handleNumberChange} className={`glass-input w-full p-3.5 h-auto border-none shadow-none bg-transparent rounded-xl focus-visible:ring-1 focus-visible:ring-accent-blue transition-all ${formData['Quantità'] !== '' && formData['Quantità'] !== undefined && formData['Quantità'] !== 0 ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="app-overline text-slate-600 dark:text-slate-300 px-1">Stato</label>
                      <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-2 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                        <Select name="Stato" value={formData.Stato} onValueChange={(val) => handleChange({ target: { name: 'Stato', value: val } })}>
                          <SelectTrigger className={`glass-input border-none shadow-none bg-transparent w-full p-3.5 h-auto rounded-xl focus:ring-1 focus:ring-accent-blue transition-all ${formData.Stato ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`}>
                            <SelectValue placeholder="Seleziona stato" />
                          </SelectTrigger>
                          <SelectContent className="glass-panel z-[3000] border-white/10 dark:bg-slate-950/90 bg-white/90 backdrop-blur-xl">
                            <SelectItem value="Disponibile" className="font-bold">Disponibile</SelectItem>
                            <SelectItem value="Esaurito" className="font-bold text-rose-500">Esaurito</SelectItem>
                            <SelectItem value="Da Ordinare" className="font-bold text-orange-500">Da Ordinare</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 sm:p-6 shrink-0 bg-black/5 dark:bg-white/5 flex justify-end border-t dark:border-white/5 border-slate-900/10">
              <button 
                type="submit" 
                form="add-tool-form"
                disabled={isLoading}
                className="action-btn action-btn-carica px-6 sm:px-8 py-3 sm:py-3.5 flex items-center gap-2 rounded-xl sm:rounded-2xl shadow-xl disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    <span>Salva Articolo</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToolModal;
