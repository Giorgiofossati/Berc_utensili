import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Database, List, CheckCircle2, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
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
              <List size={20} />
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
            <SelectContent className="glass-panel z-50 border-white/10 dark:bg-slate-950/90 bg-white/90 backdrop-blur-xl max-h-[300px]">
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
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const {
    isLoading,
    showSuccess,
    error,
    dbOptions,
    customInputFields,
    formData,
    handleChange,
    handleNumberChange,
    toggleCustomField,
    handleSubmit
  } = useAddToolForm({ tools, onClose, onToolAdded });

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent size="md" className="p-0 gap-0 overflow-hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl">
        {showSuccess ? (
          <ModalBody>
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
                className="app-body text-slate-500 dark:text-slate-400 text-center"
              >
                L'articolo è stato registrato nel sistema
              </motion.p>
            </motion.div>
          </ModalBody>
        ) : (
          <>
            <ModalHeader 
              icon={<Database size={24} />}
              overline="Nuovo Inserimento"
              title="Aggiungi Articolo"
            />

            <ModalBody>
              <form id="add-tool-form" onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8 @container">
                {/* 1. Codici e Identificazione (Top) */}
                <div className="p-6 md:p-8 rounded-3xl bg-slate-950/5 dark:bg-white/5 border dark:border-white/5 border-slate-900/5 flex flex-col gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-2 border-b dark:border-white/5 border-slate-900/5 pb-3">
                    <span className="app-overline text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">1</span>
                    <h3 className="app-h3 uppercase tracking-wider dark:text-white text-slate-800">Identificazione</h3>
                  </div>
                  <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
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
                  </div>
                </div>

                {/* 2. Informazioni Principali e Geometriche */}
                <div className="p-6 md:p-8 rounded-3xl bg-slate-950/5 dark:bg-white/5 border dark:border-white/5 border-slate-900/5 flex flex-col gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b dark:border-white/5 border-slate-900/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="app-overline text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">2</span>
                      <h3 className="app-h3 uppercase tracking-wider dark:text-white text-slate-800">Informazioni Principali</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
                    <CustomSelectField 
                      name="Tipologia" label="Tipologia" required={true}
                      value={formData.Tipologia} options={dbOptions.Tipologia}
                      isCustom={customInputFields.Tipologia} onCustomToggle={() => toggleCustomField('Tipologia')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Diametro" label="Diametro" required={false}
                      value={formData.Diametro} options={dbOptions.Diametro}
                      isCustom={customInputFields.Diametro} onCustomToggle={() => toggleCustomField('Diametro')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Ubicazione" label="Ubicazione" required={false}
                      value={formData.Ubicazione} options={dbOptions.Ubicazione}
                      isCustom={customInputFields.Ubicazione} onCustomToggle={() => toggleCustomField('Ubicazione')}
                      onChange={handleChange}
                    />
                    <CustomSelectField 
                      name="Fornitore" label="Fornitore" required={false}
                      value={formData.Fornitore} options={dbOptions.Fornitore}
                      isCustom={customInputFields.Fornitore} onCustomToggle={() => toggleCustomField('Fornitore')}
                      onChange={handleChange}
                    />
                  </div>
                  
                  {/* Accordion Attributi Avanzati */}
                  <div className="mt-2 border border-slate-900/10 dark:border-white/10 rounded-2xl overflow-hidden bg-slate-950/5 dark:bg-white/5">
                    <button
                      type="button"
                      onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                      className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="app-h3 uppercase tracking-wider dark:text-white text-slate-800">Attributi Avanzati</h3>
                        <span className="app-caption bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded-full font-bold">+9</span>
                      </div>
                      <ChevronDown 
                        size={20} 
                        className={`text-slate-500 transition-transform duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`} 
                      />
                    </button>
                    
                    {isAccordionOpen && (
                      <div className="p-4 border-t border-slate-900/10 dark:border-white/10">
                        <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
                          <CustomSelectField 
                            name="Forma" label="Forma" required={false}
                            value={formData.Forma} options={dbOptions.Forma}
                            isCustom={customInputFields.Forma} onCustomToggle={() => toggleCustomField('Forma')}
                            onChange={handleChange}
                          />
                          <CustomSelectField 
                            name="Tolleranza" label="Tolleranza" required={false}
                            customPlaceholder="es. H7"
                            value={formData.Tolleranza} options={dbOptions.Tolleranza}
                            isCustom={customInputFields.Tolleranza} onCustomToggle={() => toggleCustomField('Tolleranza')}
                            onChange={handleChange}
                          />
                          <div className="flex flex-col gap-1.5">
                            <label className="app-overline text-slate-600 dark:text-slate-300 px-1">Lunghezza (Opzionale)</label>
                            <div className="border border-slate-900/[0.08] dark:border-white/[0.08] bg-slate-950/[0.01] dark:bg-white/[0.01] p-2 rounded-2xl focus-within:border-accent-blue/30 focus-within:bg-white/[0.03] transition-all">
                              <Input type="text" name="Lunghezza" value={formData.Lunghezza} onChange={handleChange} className={`glass-input w-full p-3.5 h-auto border-none shadow-none bg-transparent rounded-xl focus-visible:ring-1 focus-visible:ring-accent-blue transition-all ${formData.Lunghezza ? 'font-bold text-text-main' : 'font-normal text-text-main/40'}`} placeholder="es. 150mm" />
                            </div>
                          </div>
                          <CustomSelectField 
                            name="Materiale" label="Materiale" required={false}
                            value={formData.Materiale} options={dbOptions.Materiale}
                            isCustom={customInputFields.Materiale} onCustomToggle={() => toggleCustomField('Materiale')}
                            onChange={handleChange}
                          />
                          <CustomSelectField 
                            name="Rivestimento" label="Rivestimento" required={false}
                            value={formData.Rivestimento} options={dbOptions.Rivestimento}
                            isCustom={customInputFields.Rivestimento} onCustomToggle={() => toggleCustomField('Rivestimento')}
                            onChange={handleChange}
                          />
                          <CustomSelectField 
                            name="Lavorazione" label="Lavorazione" required={false}
                            value={formData.Lavorazione} options={dbOptions.Lavorazione}
                            isCustom={customInputFields.Lavorazione} onCustomToggle={() => toggleCustomField('Lavorazione')}
                            onChange={handleChange}
                          />
                          <CustomSelectField 
                            name="Passo" label="Passo" required={false}
                            customPlaceholder="es. 1.5"
                            value={formData.Passo} options={dbOptions.Passo}
                            isCustom={customInputFields.Passo} onCustomToggle={() => toggleCustomField('Passo')}
                            onChange={handleChange}
                          />
                          <CustomSelectField 
                            name="Raggio" label="Raggio" required={false}
                            customPlaceholder="es. R0.5"
                            value={formData.Raggio} options={dbOptions.Raggio}
                            isCustom={customInputFields.Raggio} onCustomToggle={() => toggleCustomField('Raggio')}
                            onChange={handleChange}
                          />
                          <CustomSelectField 
                            name="Angolo" label="Angolo" required={false}
                            customPlaceholder="es. 90°"
                            value={formData.Angolo} options={dbOptions.Angolo}
                            isCustom={customInputFields.Angolo} onCustomToggle={() => toggleCustomField('Angolo')}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Dati Inventario (Giacenza/Stato) */}
                <div className="p-6 md:p-8 rounded-3xl bg-slate-950/5 dark:bg-white/5 border dark:border-white/5 border-slate-900/5 flex flex-col gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-2 border-b dark:border-white/5 border-slate-900/5 pb-3">
                    <span className="app-overline text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">3</span>
                    <h3 className="app-h3 uppercase tracking-wider dark:text-white text-slate-800">Dati Inventario</h3>
                  </div>
                  <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
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
                          <SelectContent className="glass-panel z-50 border-white/10 dark:bg-slate-950/90 bg-white/90 backdrop-blur-xl">
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
            </ModalBody>

            <ModalFooter>
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto text-left">
                  {error && <p className="text-rose-500 app-caption font-bold">{error}</p>}
                </div>
                <button 
                  type="submit" 
                  form="add-tool-form"
                  disabled={isLoading}
                  className="action-btn action-btn-carica px-6 sm:px-8 py-3 sm:py-3.5 flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl shadow-xl disabled:opacity-50 text-xs sm:text-sm cursor-pointer w-full sm:w-auto"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Salva Articolo</span>
                    </>
                  )}
                </button>
              </div>
            </ModalFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToolModal;
