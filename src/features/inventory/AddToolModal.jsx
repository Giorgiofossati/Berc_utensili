import React, { useState, useId } from 'react';
import { motion } from 'framer-motion';
import { Save, Database, CheckCircle2, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAddToolForm } from '../../hooks/useAddToolForm';
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

const AddToolModal = ({ onClose, onToolAdded, tools = [] }) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const formId = useId();

  const {
    isLoading,
    showSuccess,
    error,
    fieldErrors,
    dbOptions,
    formData,
    handleChange,
    handleNumberChange,
    addNewOption,
    handleSubmit
  } = useAddToolForm({ tools, onClose, onToolAdded });

  const type = (formData.Tipologia || '').toUpperCase();
  const forma = (formData.Forma || '').toUpperCase();
  const isFresa = type.includes('FRESA');
  const isToricaOrSferica = isFresa && (forma.includes('TORICA') || forma.includes('SFERICA'));
  const isMaschio = type.includes('MASCHIO') || type.includes('SPACCAMASCHIO');
  const isSvasatore = type.includes('SVASATORE') || type.includes('SMUSSATORE') || type.includes('TRACCIATORE');
  const isAlesatore = type.includes('ALESATORE');

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
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
              <h2 className="app-h1 text-center mb-2">Articolo Registrato</h2>
              <p className="app-body text-muted-foreground text-center">
                L'utensile è stato aggiunto correttamente all'inventario di magazzino.
              </p>
            </motion.div>
          </ModalBody>
        ) : (
          <>
            <ModalHeader 
              icon={<Database size={24} className="text-accent-blue" />}
              overline="Nuovo Inserimento"
              title="Aggiungi Articolo"
              subtitle="Inserisci i parametri geometrici e di ubicazione per registrare l'utensile."
            />

            <ModalBody className="p-6 sm:p-8 space-y-6">
              <form id={formId} onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. SEZIONE IDENTIFICAZIONE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <h3 className="app-h3 text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-blue" />
                      Identificazione
                    </h3>
                    <span className="app-caption text-muted-foreground">
                      * Entrambi i codici obbligatori
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormFieldWrapper 
                      label="Codice Aziendale" 
                      required={true}
                      helperText="Barcode / matricola interna"
                      error={fieldErrors.Codice}
                    >
                      <Input 
                        type="text" 
                        name="Codice" 
                        value={formData.Codice} 
                        onChange={handleChange} 
                        placeholder="es. AZ-1042 o Barcode" 
                        className={`glass-input h-[44px] min-h-[44px] rounded-[var(--radius-control,12px)] px-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-accent-blue/50 ${formData.Codice ? 'font-bold text-foreground' : ''} ${fieldErrors.Codice ? 'border-accent-rose' : ''}`}
                      />
                    </FormFieldWrapper>

                    <FormFieldWrapper 
                      label="Codice Produttore" 
                      required={true}
                      helperText="Serial Number fornitore"
                      error={fieldErrors['Serial Number']}
                    >
                      <Input 
                        type="text" 
                        name="Serial Number" 
                        value={formData['Serial Number']} 
                        onChange={handleChange} 
                        placeholder="es. WNT-84920" 
                        className={`glass-input h-[44px] min-h-[44px] rounded-[var(--radius-control,12px)] px-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-accent-blue/50 ${formData['Serial Number'] ? 'font-bold text-foreground' : ''} ${fieldErrors['Serial Number'] ? 'border-accent-rose' : ''}`}
                      />
                    </FormFieldWrapper>
                  </div>
                </div>

                {/* 2. PARAMETRI GEOMETRICI E TIPOLOGIA (INDISPENSABILI) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <h3 className="app-h3 text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-blue" />
                      Specifiche Geometriche Indispensabili
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
                      placeholder="es. FRESA, PUNTA, MASCHIO..."
                      customPlaceholder="es. FRESA SPECIALE, PUNTA ELICOIDALE..."
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
                      placeholder="es. 10, D12, Ø16..."
                      customPlaceholder="es. 10 o D10"
                      error={fieldErrors.Diametro}
                    />

                    {/* Campi reattivi condizionali per FRESE */}
                    {isFresa && (
                      <CreatableSelectField 
                        name="Forma" 
                        label="Forma Fresa" 
                        required={true}
                        value={formData.Forma} 
                        options={dbOptions.Forma}
                        onChange={handleChange}
                        onAddNewOption={addNewOption}
                        placeholder="es. CANDELA, TORICA, SFERICA..."
                        customPlaceholder="es. TORICA, SFERICA, SAGOMATA..."
                        error={fieldErrors.Forma}
                      />
                    )}

                    {isToricaOrSferica && (
                      <CreatableSelectField 
                        name="Raggio" 
                        label="Raggio di Punta" 
                        required={true}
                        customPlaceholder="es. R0.5 o 1.0"
                        value={formData.Raggio} 
                        options={dbOptions.Raggio}
                        onChange={handleChange}
                        onAddNewOption={addNewOption}
                        placeholder="es. R0.5, R1..."
                        error={fieldErrors.Raggio}
                      />
                    )}

                    {/* Campi reattivi condizionali per MASCHI */}
                    {isMaschio && (
                      <CreatableSelectField 
                        name="Passo" 
                        label="Passo Filettatura" 
                        required={true}
                        customPlaceholder="es. 1.5 o 1.75"
                        value={formData.Passo} 
                        options={dbOptions.Passo}
                        onChange={handleChange}
                        onAddNewOption={addNewOption}
                        placeholder="es. 1.0, 1.5..."
                        error={fieldErrors.Passo}
                      />
                    )}

                    {/* Campi reattivi condizionali per SVASATORI / SMUSSATORI */}
                    {isSvasatore && (
                      <CreatableSelectField 
                        name="Angolo" 
                        label="Angolo" 
                        required={true}
                        customPlaceholder="es. 90° o 60°"
                        value={formData.Angolo} 
                        options={dbOptions.Angolo}
                        onChange={handleChange}
                        onAddNewOption={addNewOption}
                        placeholder="es. 90°, 60°..."
                        error={fieldErrors.Angolo}
                      />
                    )}

                    {/* Campi reattivi condizionali per ALESATORI */}
                    {isAlesatore && (
                      <CreatableSelectField 
                        name="Tolleranza" 
                        label="Tolleranza" 
                        required={true}
                        customPlaceholder="es. H7 o H6"
                        value={formData.Tolleranza} 
                        options={dbOptions.Tolleranza}
                        onChange={handleChange}
                        onAddNewOption={addNewOption}
                        placeholder="es. H7, H6..."
                        error={fieldErrors.Tolleranza}
                      />
                    )}

                    <CreatableSelectField 
                      name="Fornitore" 
                      label="Fornitore" 
                      required={true}
                      value={formData.Fornitore} 
                      options={dbOptions.Fornitore}
                      onChange={handleChange}
                      onAddNewOption={addNewOption}
                      placeholder="es. Sandvik, Guhring, WNT..."
                      customPlaceholder="es. Sandvik, Iscar, Walter..."
                      error={fieldErrors.Fornitore}
                    />

                    <CreatableSelectField 
                      name="Ubicazione" 
                      label="Ubicazione Magazzino" 
                      required={true}
                      value={formData.Ubicazione} 
                      options={dbOptions.Ubicazione}
                      onChange={handleChange}
                      onAddNewOption={addNewOption}
                      placeholder="es. A-01, Cassetto 3..."
                      customPlaceholder="es. Armadio B, Ripiano 2..."
                      error={fieldErrors.Ubicazione}
                    />

                    <FormFieldWrapper 
                      label="Quantità Iniziale" 
                      required={true}
                      error={fieldErrors['Quantità']}
                    >
                      <Input 
                        type="number" 
                        min="0" 
                        name="Quantità" 
                        value={formData['Quantità']} 
                        onChange={handleNumberChange} 
                        className={`glass-input h-[44px] min-h-[44px] rounded-[var(--radius-control,12px)] px-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-accent-blue/50 ${formData['Quantità'] ? 'font-bold text-foreground' : ''}`}
                      />
                    </FormFieldWrapper>
                  </div>
                </div>

                {/* 3. SEZIONE ATTRIBUTI SECONDARI / DETTAGLI AGGIUNTIVI (OPZIONALI) */}
                <div className="border border-border/60 rounded-[var(--radius-card,16px)] overflow-hidden bg-card/30">
                  <button
                    type="button"
                    onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                    className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <h4 className="app-h3 text-foreground">Dettagli Aggiuntivi</h4>
                      <span className="app-caption bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded-full font-bold">
                        Opzionali (+5)
                      </span>
                    </div>
                    <ChevronDown 
                      size={20} 
                      className={`text-muted-foreground transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  
                  {isAccordionOpen && (
                    <div className="p-4 border-t border-border/50 bg-background/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <CreatableSelectField 
                          name="Materiale" 
                          label="Materiale Utensile" 
                          required={false}
                          value={formData.Materiale} 
                          options={dbOptions.Materiale}
                          onChange={handleChange}
                          onAddNewOption={addNewOption}
                          placeholder="es. MD, HSS..."
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
                          placeholder="es. TiAlN, TiN, DLC..."
                          customPlaceholder="es. AlCrN, TiAlN, Diamante..."
                        />

                        <CreatableSelectField 
                          name="Lavorazione" 
                          label="Lavorazione Primaria" 
                          required={false}
                          value={formData.Lavorazione} 
                          options={dbOptions.Lavorazione}
                          onChange={handleChange}
                          onAddNewOption={addNewOption}
                          placeholder="es. Fresatura, Foratura..."
                          customPlaceholder="es. Sbavatura, Filettatura..."
                        />

                        <FormFieldWrapper label="Lunghezza Tagliente / Totale">
                          <Input 
                            type="text" 
                            name="Lunghezza" 
                            value={formData.Lunghezza} 
                            onChange={handleChange} 
                            placeholder="es. 75mm o L=100" 
                            className="glass-input h-[44px] min-h-[44px] rounded-[var(--radius-control,12px)] px-3.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-accent-blue/50" 
                          />
                        </FormFieldWrapper>

                        <FormFieldWrapper label="Stato Articolo">
                          <Select 
                            name="Stato" 
                            value={formData.Stato} 
                            onValueChange={(val) => handleChange({ target: { name: 'Stato', value: val } })}
                          >
                            <SelectTrigger className="glass-input w-full h-[44px] min-h-[44px] rounded-[var(--radius-control,12px)] px-3.5 text-sm font-bold focus:ring-2 focus:ring-accent-blue/50 cursor-pointer">
                              <SelectValue placeholder="Seleziona stato" />
                            </SelectTrigger>
                            <SelectContent className="glass-panel z-[var(--z-dialog-2,60)] border-border bg-popover/95 backdrop-blur-xl">
                              <SelectItem value="Disponibile" className="font-bold text-accent-emerald">Disponibile</SelectItem>
                              <SelectItem value="Esaurito" className="font-bold text-accent-rose">Esaurito</SelectItem>
                              <SelectItem value="Da Ordinare" className="font-bold text-accent-orange">Da Ordinare</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormFieldWrapper>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs font-bold">
                    {error}
                  </div>
                )}
              </form>
            </ModalBody>

            <ModalFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-4 sm:p-6 border-t border-border/50 bg-muted/50">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={isLoading}
                className="glass-button px-5 py-2.5 rounded-[var(--radius-control,12px)] text-sm font-bold text-muted-foreground hover:text-foreground transition-colors min-h-[44px] cursor-pointer"
              >
                Annulla
              </button>
              <button 
                type="submit" 
                form={formId}
                disabled={isLoading}
                className="action-btn action-btn-carica px-7 py-2.5 flex items-center justify-center gap-2 rounded-[var(--radius-control,12px)] shadow-lg disabled:opacity-50 text-sm font-black tracking-wider whitespace-nowrap min-h-[44px] cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    <span>Salva Articolo</span>
                  </>
                )}
              </button>
            </ModalFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToolModal;
