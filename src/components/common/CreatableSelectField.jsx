import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, X, Sparkles, CornerDownLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

/**
 * CreatableSelectField
 * Dropdown select evoluto con supporto ergonomico per l'aggiunta di nuove voci/categorie.
 * La tendina principale rimane sempre visibile ("quella principale").
 * Cliccando sul pulsante "+" o selezionando "+ Crea nuova voce..." dalla lista,
 * compare una finestrella dedicata appena sotto alla principale per digitare il nuovo
 * valore e salvarlo immediatamente, rendendolo subito selezionato e disponibile nel menu.
 */
export const CreatableSelectField = ({
  name,
  label,
  required = false,
  isVisible = true,
  value,
  options = [],
  onChange,
  onAddNewOption,
  placeholder,
  customPlaceholder,
  helperText,
  error,
  disabled = false
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [inputError, setInputError] = useState('');
  const inputRef = useRef(null);
  const panelId = useId();

  // Opzioni disponibili garantendo che il valore selezionato sia sempre presente nella lista
  const availableOptions = useMemo(() => {
    if (!value || String(value).trim() === '') return options;
    const strVal = String(value);
    if (options.some(opt => String(opt).toLowerCase() === strVal.toLowerCase())) {
      return options;
    }
    return [strVal, ...options];
  }, [options, value]);

  const handleOpenAddNew = () => {
    setInputError('');
    setNewOptionValue('');
    setIsAddingNew(true);
  };

  const handleCloseAddNew = () => {
    setInputError('');
    setNewOptionValue('');
    setIsAddingNew(false);
  };

  // Quando si apre la finestrella sotto, imposta il focus automatico sull'input
  useEffect(() => {
    if (isAddingNew) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isAddingNew]);

  if (!isVisible) return null;

  const handleSave = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = (newOptionValue || '').trim();
    if (!trimmed) {
      setInputError(`Inserisci un testo valido per ${label.toLowerCase()}.`);
      inputRef.current?.focus();
      return;
    }

    if (onAddNewOption) {
      onAddNewOption(name, trimmed);
    } else if (onChange) {
      onChange({ target: { name, value: trimmed } });
    }

    handleCloseAddNew();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCloseAddNew();
    }
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {/* Label e Helper Text */}
      <div className="flex items-center justify-between">
        <label className="app-label text-foreground flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-accent-blue font-black">*</span>}
        </label>
        {helperText && (
          <span className="app-caption text-muted-foreground font-normal lowercase">
            {helperText}
          </span>
        )}
      </div>

      {/* Riquadro Principale: Select + Tasto Più ("quella principale") */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Select
            value={value ? String(value) : undefined}
            onValueChange={(val) => {
              if (val === '__CREATE_NEW_OPTION__') {
                handleOpenAddNew();
              } else {
                onChange({ target: { name, value: val } });
                if (isAddingNew) handleCloseAddNew();
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger 
              className={`glass-input w-full h-[44px] min-h-[44px] rounded-[var(--radius-control,12px)] px-3.5 text-sm font-medium focus:ring-2 focus:ring-accent-blue/50 transition-all cursor-pointer ${
                value ? 'font-bold text-foreground' : 'text-muted-foreground'
              } ${error ? 'border-accent-rose' : ''}`}
            >
              <SelectValue placeholder={placeholder || `Seleziona ${label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent className="glass-panel z-[var(--z-dialog-2,60)] border-border bg-popover/95 backdrop-blur-xl max-h-[280px]">
              {availableOptions.map((opt) => (
                <SelectItem key={String(opt)} value={String(opt)} className="cursor-pointer font-bold">
                  {opt}
                </SelectItem>
              ))}
              <SelectItem 
                value="__CREATE_NEW_OPTION__" 
                className="text-accent-blue font-black cursor-pointer border-t border-border/40 mt-1 pt-2 flex items-center gap-1.5 focus:bg-accent-blue/10"
              >
                <Plus size={14} className="text-accent-blue shrink-0" />
                <span>+ Crea nuova voce...</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasto Più ergonomico ed esplicito per aprire la finestrella di creazione */}
        <button
          type="button"
          onClick={() => (isAddingNew ? handleCloseAddNew() : handleOpenAddNew())}
          disabled={disabled}
          className={`w-[44px] h-[44px] min-w-[44px] shrink-0 rounded-[var(--radius-control,12px)] glass-button flex items-center justify-center transition-all cursor-pointer border ${
            isAddingNew 
              ? 'bg-accent-blue/15 border-accent-blue text-accent-blue shadow-sm' 
              : 'border-border/60 hover:border-accent-blue/50 text-muted-foreground hover:text-accent-blue hover:bg-accent-blue/5'
          }`}
          title={isAddingNew ? `Chiudi inserimento ${label}` : `Aggiungi nuova opzione per ${label}`}
          aria-label={isAddingNew ? `Chiudi inserimento ${label}` : `Aggiungi nuova opzione per ${label}`}
          aria-expanded={isAddingNew}
          aria-controls={panelId}
        >
          <Plus 
            size={18} 
            className={`transition-transform duration-200 ${isAddingNew ? 'rotate-45 text-accent-blue' : ''}`} 
          />
        </button>
      </div>

      {/* Segnalazione errore validazione campo principale */}
      {error && !isAddingNew && (
        <span className="text-accent-rose text-xs font-bold mt-0.5">{error}</span>
      )}

      {/* FINESTRELLA SUB-PANEL: Posizionata appena sotto a quella principale */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 p-3 rounded-xl border border-sky-400/40 dark:border-sky-500/30 bg-sky-50/90 dark:bg-sky-950/40 backdrop-blur-md shadow-md flex flex-col gap-2.5 ring-1 ring-sky-400/20">
              
              {/* Testata finestrella */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                  <Sparkles size={14} className="text-accent-blue animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Nuova voce: <span className="underline decoration-accent-blue/50">{label}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCloseAddNew}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Annulla e chiudi"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Input e bottoni */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={newOptionValue}
                    onChange={(e) => {
                      setNewOptionValue(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={customPlaceholder || `Digita nuova voce per ${label.toLowerCase()}...`}
                    className={`glass-input h-[42px] min-h-[42px] rounded-lg px-3.5 text-sm font-semibold text-foreground bg-white/90 dark:bg-slate-900/90 border-sky-300 dark:border-sky-700/80 focus-visible:ring-2 focus-visible:ring-accent-blue/50 shadow-inner ${
                      inputError ? 'border-accent-rose ring-1 ring-accent-rose' : ''
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseAddNew}
                    className="glass-button h-[42px] px-3.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!newOptionValue.trim()}
                    className="action-btn action-btn-carica h-[42px] px-4 rounded-lg text-xs font-black tracking-wider flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Salva</span>
                  </button>
                </div>
              </div>

              {inputError && (
                <span className="text-accent-rose text-xs font-bold -mt-1">{inputError}</span>
              )}

              <p className="app-caption text-slate-500 dark:text-slate-400 text-xs leading-tight flex items-center gap-1">
                <CornerDownLeft size={11} className="inline opacity-70" />
                Premi <kbd className="px-1 py-0.5 bg-black/10 dark:bg-white/10 rounded font-mono font-bold">Invio</kbd> per registrare e selezionare la voce.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatableSelectField;
