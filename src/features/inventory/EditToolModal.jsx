import React, { useState, useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  CheckCircle2, 
  ChevronDown, 
  Lock, 
  Package, 
  SlidersHorizontal, 
  MapPin, 
  Tag, 
  AlertTriangle,
  Minus,
  Plus
} from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useEditToolForm } from '../../hooks/useEditToolForm';
import { buildDesc } from '../../lib/toolUtils';
import { CreatableSelectField } from '@/components/common/CreatableSelectField';

const FormFieldWrapper = ({ label, required = false, error, helperText, children }) => {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="app-label text-foreground flex items-center justify-between">
        <span>
          {label} {required && <span className="text-accent-blue font-black">*</span>}
        </span>
        {helperText && <span className="app-caption text-muted-foreground font-normal lowercase">{helperText}</span>}
      </label>
      {children}
      {error && <span className="text-accent-rose text-xs font-bold mt-0.5">{error}</span>}
    </div>
  );
};

export const EditToolModal = ({ tool, isOpen = true, onClose, onToolUpdated }) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const formId = useId();

  const {
    isAdmin,
    isLoading,
    showSuccess,
    error,
    fieldErrors,
    dbOptions,
    formData,
    isFieldVisible,
    handleChange,
    handleNumberChange,
    addNewOption,
    handleSubmit
  } = useEditToolForm({ tool, onClose, onToolUpdated });

  const isFormaVisible = isFieldVisible('Forma');
  const isRaggioVisible = isFieldVisible('Raggio');
  const isPassoVisible = isFieldVisible('Passo');
  const isAngoloVisible = isFieldVisible('Angolo');
  const isTolleranzaVisible = isFieldVisible('Tolleranza');

  // Anteprima descrizione dinamica aggiornata in tempo reale
  const previewDesc = useMemo(() => {
    return buildDesc(formData) || 'Dettagli Utensile';
  }, [formData]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent size="lg" showCloseButton={false} className="p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-2xl">
        {showSuccess ? (
          <ModalBody>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center p-8 sm:p-12 min-h-[40vh]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-20 h-20 rounded-full bg-accent-emerald/20 border-4 border-accent-emerald/30 flex items-center justify-center mb-6 shadow-carica"
              >
                <CheckCircle2 size={40} className="text-accent-emerald drop-shadow-lg" />
              </motion.div>
              <h2 className="app-h1 text-center mb-2">Utensile Aggiornato</h2>
              <p className="app-body text-muted-foreground text-center">
                Tutti i dettagli e la giacenza a magazzino sono stati salvati con successo.
              </p>
            </motion.div>
          </ModalBody>
        ) : !isAdmin ? (
          /* BLOCCO DI SICUREZZA: UTENTE NON AMMINISTRATORE */
          <>
            <ModalHeader 
              icon={<Lock size={24} className="text-accent-rose" />}
              overline="Accesso Riservato"
              title="Permessi Insufficienti"
              subtitle="Solo gli amministratori possono modificare i dati e le quantità degli utensili."
            />
            <ModalBody className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center gap-4 py-8">
                <div className="w-16 h-16 rounded-2xl bg-accent-rose/10 border border-accent-rose/30 flex items-center justify-center text-accent-rose shadow-inner">
                  <Lock size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="app-h3 text-foreground">Azione Riservata agli Amministratori</h3>
                  <p className="app-body text-muted-foreground max-w-md">
                    Non disponi delle autorizzazioni necessarie per modificare la scheda tecnica o la giacenza di magazzino per questo articolo.
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 h-11 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Chiudi
              </button>
            </ModalFooter>
          </>
        ) : (
          /* SCHERMATA COMPLETA MODIFICA PER AMMINISTRATORE */
          <>
            <ModalHeader 
              icon={<SlidersHorizontal size={24} className="text-accent-blue" />}
              overline="Gestione Catalogo · Riservato Amministratori"
              title="Modifica Dettagli Fresa"
              subtitle="Aggiorna parametri tecnici, codici e giacenza a magazzino."
            />

            <ModalBody className="p-4 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto custom-scrollbar">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-accent-rose text-xs font-semibold">
                  <AlertTriangle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ANTEPRIMA LIVE SCHEDA UTENSILE */}
              <div className="p-3.5 rounded-xl bg-sky-500/10 dark:bg-sky-950/40 border border-sky-500/25 flex flex-col gap-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="app-overline text-sky-700 dark:text-sky-300">Anteprima Denominazione</span>
                  <span className="app-caption text-sky-600 dark:text-sky-400">ID: {tool?.id?.substring(0, 8)}…</span>
                </div>
                <p className="app-h3 text-foreground font-bold truncate">
                  {previewDesc}
                </p>
              </div>

              <form id={formId} onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. SEZIONE MAGAZZINO & GIACENZA (IN PRIMO PIANO COME DA RICHIESTA) */}
                <div className="space-y-3 p-4 rounded-2xl border border-border/70 bg-card/40 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <h3 className="app-h3 text-foreground flex items-center gap-2">
                      <Package size={17} className="text-accent-emerald" />
                      Magazzino &amp; Giacenza
                    </h3>
                    <span className="app-caption text-accent-emerald font-bold">
                      Giacenza Live Modificabile
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Controllo Quantità Rapido con Stepper e Input */}
                    <FormFieldWrapper 
                      label="Quantità a Magazzino" 
                      required={true}
                      helperText="Pezzi disponibili"
                      error={fieldErrors['Quantità']}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(formData['Quantità']) || 0;
                            if (cur > 0) {
                              handleNumberChange({ target: { name: 'Quantità', value: cur - 1 } });
                            }
                          }}
                          className="glass-button w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Riduci quantità"
                        >
                          <Minus size={16} />
                        </button>

                        <div className="relative flex-1">
                          <Input 
                            type="number" 
                            min="0" 
                            name="Quantità" 
                            value={formData['Quantità']} 
                            onChange={handleNumberChange} 
                            className={`glass-input h-11 min-h-[44px] rounded-xl px-3 text-center text-base font-black tabular-nums focus-visible:ring-2 focus-visible:ring-accent-blue/50 ${
                              (Number(formData['Quantità']) || 0) > 0 ? 'text-accent-emerald' : 'text-accent-rose'
                            }`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 app-caption text-muted-foreground pointer-events-none">
                            PZ
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(formData['Quantità']) || 0;
                            handleNumberChange({ target: { name: 'Quantità', value: cur + 1 } });
                          }}
                          className="glass-button w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Aumenta quantità"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </FormFieldWrapper>

                    <CreatableSelectField 
                      name="Ubicazione" 
                      label="Ubicazione a Magazzino" 
                      required={true}
                      value={formData.Ubicazione} 
                      options={dbOptions.Ubicazione}
                      onChange={handleChange}
                      onAddNewOption={addNewOption}
                      placeholder="es. FRESA METALLI1, Cassetto A..."
                      customPlaceholder="es. Armadio B, Ripiano 2..."
                      error={fieldErrors.Ubicazione}
                    />

                    <div className="sm:col-span-2">
                      <CreatableSelectField 
                        name="Stato" 
                        label="Stato Tagliente / Articolo" 
                        required={false}
                        value={formData.Stato} 
                        options={['NUOVO', 'USATO', 'RIACCONDIZIONATO', 'DISPONIBILE']}
                        onChange={handleChange}
                        onAddNewOption={addNewOption}
                        placeholder="Seleziona stato articolo..."
                        customPlaceholder="es. DA RIAFFILARE, USURATO..."
                      />
                    </div>
                  </div>
                </div>

                {/* 2. SEZIONE IDENTIFICAZIONE */}
                <div className="space-y-3 p-4 rounded-2xl border border-border/70 bg-card/40 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <h3 className="app-h3 text-foreground flex items-center gap-2">
                      <Tag size={17} className="text-accent-blue" />
                      Identificazione &amp; Matricola
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormFieldWrapper 
                      label="Codice Aziendale" 
                      required={false}
                      helperText="Barcode / matricola interna"
                      error={fieldErrors.Codice}
                    >
                      <Input 
                        type="text" 
                        name="Codice" 
                        value={formData.Codice} 
                        onChange={handleChange} 
                        placeholder="es. AZ-1042 o Barcode" 
                        className="glass-input h-11 min-h-[44px] rounded-xl px-3.5 text-sm font-bold text-foreground focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                      />
                    </FormFieldWrapper>

                    <FormFieldWrapper 
                      label="Codice Produttore" 
                      required={false}
                      helperText="Serial Number fornitore"
                      error={fieldErrors['Serial Number']}
                    >
                      <Input 
                        type="text" 
                        name="Serial Number" 
                        value={formData['Serial Number']} 
                        onChange={handleChange} 
                        placeholder="es. WNT-84920" 
                        className="glass-input h-11 min-h-[44px] rounded-xl px-3.5 text-sm font-bold text-foreground focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                      />
                    </FormFieldWrapper>
                  </div>
                </div>

                {/* 3. PARAMETRI GEOMETRICI E TIPOLOGIA */}
                <div className="space-y-3 p-4 rounded-2xl border border-border/70 bg-card/40 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <h3 className="app-h3 text-foreground flex items-center gap-2">
                      <SlidersHorizontal size={17} className="text-accent-blue" />
                      Specifiche Geometriche
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CreatableSelectField 
                      name="Tipologia" 
                      label="Tipologia" 
                      required={true}
                      value={formData.Tipologia} 
                      options={dbOptions.Tipologia}
                      onChange={handleChange}
                      onAddNewOption={addNewOption}
                      placeholder="es. Fresa, Punta, Maschio..."
                      customPlaceholder="es. Fresa Speciale, Punta..."
                      error={fieldErrors.Tipologia}
                    />

                    <CreatableSelectField 
                      name="Diametro" 
                      label="Diametro Nominale" 
                      required={true}
                      value={formData.Diametro} 
                      options={dbOptions.Diametro}
                      onChange={handleChange}
                      onAddNewOption={addNewOption}
                      placeholder="es. D10, 12, Ø16..."
                      customPlaceholder="es. 10 o D10"
                      error={fieldErrors.Diametro}
                    />

                    {isFormaVisible && (
                      <CreatableSelectField 
                        name="Forma" 
                        label="Forma Fresa" 
                        required={true}
                        value={formData.Forma} 
                        options={dbOptions.Forma}
                        onChange={handleChange}
                        onAddNewOption={addNewOption}
                        placeholder="es. Candela, Torica, Sferica..."
                        customPlaceholder="es. Torica, Sferica..."
                        error={fieldErrors.Forma}
                      />
                    )}

                    {isRaggioVisible && (
                      <CreatableSelectField 
                        name="Raggio" 
                        label="Raggio di Punta" 
                        required={false}
                        customPlaceholder="es. 0.5 o 1.0"
                        value={formData.Raggio} 
                        options={dbOptions.Raggio}
                        onChange={handleChange}
                        onAddNewOption={addNewOption}
                        placeholder="es. R0.5, R1..."
                        error={fieldErrors.Raggio}
                      />
                    )}

                    {isPassoVisible && (
                      <CreatableSelectField 
                        name="Passo" 
                        label="Passo Filettatura" 
                        required={false}
                        customPlaceholder="es. 1.5 o 1.75"
                        value={formData.Passo} 
                        options={dbOptions.Passo}
                        onChange={handleChange}
                        onAddNewOption={addNewOption}
                        placeholder="es. 1.0, 1.5..."
                        error={fieldErrors.Passo}
                      />
                    )}

                    {isAngoloVisible && (
                      <CreatableSelectField 
                        name="Angolo" 
                        label="Angolo" 
                        required={false}
                        customPlaceholder="es. 90° o 60°"
                        value={formData.Angolo} 
                        options={dbOptions.Angolo}
                        onChange={handleChange}
                        onAddNewOption={addNewOption}
                        placeholder="es. 90°, 60°..."
                        error={fieldErrors.Angolo}
                      />
                    )}

                    {isTolleranzaVisible && (
                      <CreatableSelectField 
                        name="Tolleranza" 
                        label="Tolleranza Foro" 
                        required={false}
                        customPlaceholder="es. H7 o H6"
                        value={formData.Tolleranza} 
                        options={dbOptions.Tolleranza}
                        onChange={handleChange}
                        onAddNewOption={addNewOption}
                        placeholder="es. H7, H6..."
                        error={fieldErrors.Tolleranza}
                      />
                    )}

                    <FormFieldWrapper 
                      label="Lunghezza (mm)" 
                      required={false}
                      helperText="Lunghezza utile"
                    >
                      <Input 
                        type="number" 
                        name="Lunghezza" 
                        value={formData.Lunghezza} 
                        onChange={handleNumberChange} 
                        placeholder="es. 75" 
                        className="glass-input h-11 min-h-[44px] rounded-xl px-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                      />
                    </FormFieldWrapper>
                  </div>
                </div>

                {/* 4. SEZIONE COMMERCIALE E MATERIALE */}
                <div className="border border-border/70 rounded-2xl overflow-hidden bg-card/40 dark:bg-slate-900/40">
                  <button
                    type="button"
                    onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                    className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-accent/50 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <h4 className="app-h3 text-foreground">Dettagli Aggiuntivi &amp; Commerciali</h4>
                      <span className="app-caption bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded-full font-bold">
                        Fornitore, Prezzo, Materiale
                      </span>
                    </div>
                    <ChevronDown 
                      size={20} 
                      className={`text-muted-foreground transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  
                  {isAccordionOpen && (
                    <div className="p-4 border-t border-border/50 bg-background/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CreatableSelectField 
                          name="Fornitore" 
                          label="Fornitore" 
                          required={false}
                          value={formData.Fornitore} 
                          options={dbOptions.Fornitore}
                          onChange={handleChange}
                          onAddNewOption={addNewOption}
                          placeholder="es. Sandvik, Guhring, WNT..."
                          customPlaceholder="es. Sandvik, Iscar, Walter..."
                        />

                        <FormFieldWrapper 
                          label="Prezzo Unitario Netto (€)" 
                          required={false}
                          helperText="IVA esclusa"
                        >
                          <Input 
                            type="number" 
                            step="0.01"
                            name="Prezzo" 
                            value={formData.Prezzo} 
                            onChange={handleNumberChange} 
                            placeholder="es. 45.50" 
                            className="glass-input h-11 min-h-[44px] rounded-xl px-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                          />
                        </FormFieldWrapper>

                        <CreatableSelectField 
                          name="Materiale" 
                          label="Materiale Costruttivo" 
                          required={false}
                          value={formData.Materiale} 
                          options={dbOptions.Materiale}
                          onChange={handleChange}
                          onAddNewOption={addNewOption}
                          placeholder="es. METALLO DURO, HSS..."
                          customPlaceholder="es. Metallo Duro, HSS-Co..."
                        />

                        <CreatableSelectField 
                          name="Rivestimento" 
                          label="Rivestimento" 
                          required={false}
                          value={formData.Rivestimento} 
                          options={dbOptions.Rivestimento}
                          onChange={handleChange}
                          onAddNewOption={addNewOption}
                          placeholder="es. TiAlN, AlCrN..."
                          customPlaceholder="es. AlCrN, TiAlN, Diamante..."
                        />

                        <CreatableSelectField 
                          name="Lavorazione" 
                          label="Tipo Lavorazione" 
                          required={false}
                          value={formData.Lavorazione} 
                          options={dbOptions.Lavorazione}
                          onChange={handleChange}
                          onAddNewOption={addNewOption}
                          placeholder="es. Fresatura, Foratura..."
                          customPlaceholder="es. Fresatura, Tornitura..."
                        />

                        <FormFieldWrapper 
                          label="Senso di Rotazione" 
                          required={false}
                        >
                          <Select 
                            value={formData.Rotazione || undefined} 
                            onValueChange={(val) => handleChange({ target: { name: 'Rotazione', value: val } })}
                          >
                            <SelectTrigger className="glass-input w-full h-11 min-h-[44px] rounded-xl px-3.5 text-sm font-medium cursor-pointer">
                              <SelectValue placeholder="Seleziona rotazione..." />
                            </SelectTrigger>
                            <SelectContent className="glass-panel z-[var(--z-dialog-2,60)] bg-popover/95 backdrop-blur-xl">
                              <SelectItem value="DX" className="cursor-pointer font-bold">Destrorsa (DX)</SelectItem>
                              <SelectItem value="SX" className="cursor-pointer font-bold">Sinistrorsa (SX)</SelectItem>
                              <SelectItem value="Reversibile" className="cursor-pointer font-bold">Reversibile</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormFieldWrapper>
                      </div>
                    </div>
                  )}
                </div>

              </form>
            </ModalBody>

            <ModalFooter className="p-4 sm:p-6 bg-slate-50/70 dark:bg-slate-900/60 border-t border-border/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-5 h-11 rounded-xl text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-slate-800 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                Annulla
              </button>

              <button
                type="submit"
                form={formId}
                disabled={isLoading}
                className="action-btn-primary px-6 h-11 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <Save size={16} />
                <span>{isLoading ? 'Salvataggio…' : 'Salva Modifiche'}</span>
              </button>
            </ModalFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditToolModal;
