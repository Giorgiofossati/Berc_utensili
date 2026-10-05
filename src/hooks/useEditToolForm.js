import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { buildDesc } from '../lib/toolUtils';
import { useInventoryStore } from '../store/useInventoryStore';
import { useMovementStore } from '../store/useMovementStore';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Hook dedicato alla gestione e validazione della modifica di un utensile esistente.
 * Riservato agli amministratori per consentire la modifica di tutti i dati tecnici,
 * anagrafici e della giacenza di magazzino.
 */
export const useEditToolForm = ({ tool, onClose, onToolUpdated }) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const isAdmin = currentUser?.ruolo === 'Admin';
  const tools = useInventoryStore(state => state.tools);
  const updateToolInStore = useInventoryStore(state => state.updateTool);

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

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
    Angolo: [],
    Stato: []
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
    Angolo: false,
    Stato: false
  });

  const [formData, setFormData] = useState({
    Codice: '',
    'Serial Number': '',
    Tipologia: '',
    Diametro: '',
    'Diametro Nominale': '',
    Forma: '',
    Raggio: '',
    Passo: '',
    Tolleranza: '',
    Lunghezza: '',
    Angolo: '',
    Rotazione: '',
    'Quantità': 0,
    Ubicazione: '',
    Stato: 'NUOVO',
    Fornitore: '',
    Prezzo: '',
    Materiale: '',
    Rivestimento: '',
    Lavorazione: ''
  });

  // Re-inizializzazione del form quando cambia l'utensile selezionato
  useEffect(() => {
    if (tool && typeof tool === 'object') {
      setFormData({
        Codice: tool.Codice || tool['Codice Aziendale'] || '',
        'Serial Number': tool['Serial Number'] || tool.SerialNumber || tool['Codice Fornitore'] || '',
        Tipologia: tool.Tipologia || '',
        Diametro: tool.Diametro || '',
        'Diametro Nominale': tool['Diametro Nominale'] != null ? tool['Diametro Nominale'] : '',
        Forma: tool.Forma || '',
        Raggio: tool.Raggio != null ? tool.Raggio : '',
        Passo: tool.Passo != null ? tool.Passo : '',
        Tolleranza: tool.Tolleranza || '',
        Lunghezza: tool.Lunghezza != null ? tool.Lunghezza : '',
        Angolo: tool.Angolo || '',
        Rotazione: tool.Rotazione || '',
        'Quantità': tool['Quantità'] != null ? Number(tool['Quantità']) : 0,
        Ubicazione: tool.Ubicazione || '',
        Stato: tool.Stato || 'NUOVO',
        Fornitore: tool.Fornitore || '',
        Prezzo: tool.Prezzo != null ? tool.Prezzo : '',
        Materiale: tool.Materiale || '',
        Rivestimento: tool.Rivestimento || '',
        Lavorazione: tool.Lavorazione || ''
      });
      setFieldErrors({});
      setError(null);
      setShowSuccess(false);
    }
  }, [tool]);

  // Caricamento opzioni categorie esistenti per suggerimenti dropdown
  useEffect(() => {
    const mergeCustomOptions = (optionsObj) => {
      try {
        const cached = JSON.parse(localStorage.getItem('berc_custom_tool_options') || '{}');
        keys.forEach(key => {
          if (cached[key] && Array.isArray(cached[key])) {
            optionsObj[key] = [...new Set([...(optionsObj[key] || []), ...cached[key]])].sort((a, b) => 
              a.toString().localeCompare(b.toString(), undefined, { numeric: true, sensitivity: 'base' })
            );
          }
        });
      } catch {
        /* ignore */
      }
      return optionsObj;
    };

    const keys = ['Tipologia', 'Forma', 'Diametro', 'Ubicazione', 'Materiale', 'Rivestimento', 'Fornitore', 'Lavorazione', 'Passo', 'Tolleranza', 'Raggio', 'Angolo', 'Stato'];
    if (tools && tools.length > 0) {
      const processed = {};
      keys.forEach(key => {
        const values = tools
          .map(row => row[key])
          .filter(val => val !== null && val !== undefined && val !== '');
        processed[key] = [...new Set(values)].sort((a, b) => 
          a.toString().localeCompare(b.toString(), undefined, { numeric: true, sensitivity: 'base' })
        );
      });
      setDbOptions(mergeCustomOptions(processed));
    }
  }, [tools]);

  const isFieldVisible = useCallback((fieldName) => {
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
  }, [formData.Tipologia, formData.Forma]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'Tipologia') {
        const t = (value || '').toUpperCase();
        if (t.includes('FRESA')) updated.Lavorazione = 'Fresatura';
        else if (t.includes('PUNTA')) updated.Lavorazione = 'Foratura';
        else if (t.includes('MASCHIO') || t.includes('SPACCAMASCHIO')) updated.Lavorazione = 'Filettatura';
        else if (t.includes('TASTATORE')) updated.Lavorazione = 'Tastatura';
        else if (t.includes('LAMATORE')) updated.Lavorazione = 'Lamatura';
        else if (t.includes('ALESATORE')) updated.Lavorazione = 'Alesatura';
      }
      return updated;
    });

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value !== '' ? Number(value) : '' }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const toggleCustomField = (fieldName) => {
    setCustomInputFields(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  const addNewOption = useCallback((fieldName, newValue) => {
    if (!newValue || !String(newValue).trim()) return;
    const trimmed = String(newValue).trim();

    setDbOptions(prev => {
      const currentList = prev[fieldName] || [];
      if (currentList.some(item => String(item).toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const updated = [...currentList, trimmed].sort((a, b) => 
        a.toString().localeCompare(b.toString(), undefined, { numeric: true, sensitivity: 'base' })
      );
      return { ...prev, [fieldName]: updated };
    });

    setFormData(prev => {
      const updated = { ...prev, [fieldName]: trimmed };
      if (fieldName === 'Tipologia') {
        const t = trimmed.toUpperCase();
        if (t.includes('FRESA')) updated.Lavorazione = 'Fresatura';
        else if (t.includes('PUNTA')) updated.Lavorazione = 'Foratura';
        else if (t.includes('MASCHIO') || t.includes('SPACCAMASCHIO')) updated.Lavorazione = 'Filettatura';
        else if (t.includes('TASTATORE')) updated.Lavorazione = 'Tastatura';
        else if (t.includes('LAMATORE')) updated.Lavorazione = 'Lamatura';
        else if (t.includes('ALESATORE')) updated.Lavorazione = 'Alesatura';
      }
      return updated;
    });

    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
    }

    try {
      const cached = JSON.parse(localStorage.getItem('berc_custom_tool_options') || '{}');
      const list = cached[fieldName] || [];
      if (!list.some(item => String(item).toLowerCase() === trimmed.toLowerCase())) {
        cached[fieldName] = [...list, trimmed];
        localStorage.setItem('berc_custom_tool_options', JSON.stringify(cached));
      }
    } catch {
      /* ignore */
    }
  }, [fieldErrors]);

  const validateForm = () => {
    const errors = {};

    if (!isAdmin) {
      errors._general = "Accesso negato: solo gli amministratori possono modificare i dettagli degli utensili.";
      setFieldErrors(errors);
      return false;
    }

    if (!formData.Tipologia || !formData.Tipologia.trim()) {
      errors.Tipologia = "La tipologia dell'utensile è obbligatoria.";
    }

    if (!formData.Diametro || !String(formData.Diametro).trim()) {
      errors.Diametro = "Il diametro nominale è obbligatorio.";
    }

    if (!formData.Ubicazione || !formData.Ubicazione.trim()) {
      errors.Ubicazione = "L'ubicazione a magazzino è obbligatoria.";
    }

    if (formData['Quantità'] === '' || formData['Quantità'] === undefined || Number(formData['Quantità']) < 0) {
      errors['Quantità'] = "La quantità a magazzino deve essere un numero valido maggiore o uguale a zero.";
    }

    // Validazione attributi reattivi: per gli utensili esistenti validiamo solo se il campo specifico è parziale
    const t = (formData.Tipologia || '').toUpperCase();
    const forma = (formData.Forma || '').toUpperCase();

    if (t.includes('FRESA') && (forma.includes('TORICA') || forma.includes('SFERICA'))) {
      if (formData.Raggio && isNaN(parseFloat(String(formData.Raggio).replace(',', '.')))) {
        errors.Raggio = "Inserire un raggio numerico valido (es. 0.5 o 1.0).";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sanitizeDouble = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    return isNaN(num) ? null : num;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);

    if (!tool || !tool.id) {
      setError("Utensile non valido o non selezionato.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const dataToUpdate = {
        Codice: formData.Codice?.trim() || null,
        'Serial Number': formData['Serial Number']?.trim() || null,
        Tipologia: formData.Tipologia?.trim() || null,
        Diametro: formData.Diametro ? String(formData.Diametro).trim() : null,
        Forma: formData.Forma?.trim() || null,
        Raggio: isFieldVisible('Raggio') ? sanitizeDouble(formData.Raggio) : null,
        Passo: isFieldVisible('Passo') ? sanitizeDouble(formData.Passo) : null,
        Tolleranza: isFieldVisible('Tolleranza') ? (formData.Tolleranza?.trim() || null) : null,
        Lunghezza: sanitizeDouble(formData.Lunghezza),
        Angolo: isFieldVisible('Angolo') ? (formData.Angolo?.trim() || null) : null,
        Rotazione: formData.Rotazione?.trim() || null,
        'Quantità': Math.max(0, parseInt(formData['Quantità'], 10) || 0),
        Ubicazione: formData.Ubicazione?.trim() || null,
        Stato: formData.Stato?.trim() || 'NUOVO',
        Fornitore: formData.Fornitore?.trim() || null,
        Prezzo: sanitizeDouble(formData.Prezzo),
        Materiale: formData.Materiale?.trim() || null,
        Rivestimento: formData.Rivestimento?.trim() || null,
        Lavorazione: formData.Lavorazione?.trim() || null
      };

      // Aggiorna Diametro Nominale se parsabile
      if (dataToUpdate.Diametro) {
        const cleanD = String(dataToUpdate.Diametro).replace(/^[ØøDd]/, '').trim();
        const numD = sanitizeDouble(cleanD);
        if (numD !== null) {
          dataToUpdate['Diametro Nominale'] = numD;
        }
      }

      // Ricalcola la descrizione originale canonica
      dataToUpdate['Descrizione Originale'] = buildDesc(dataToUpdate) || tool['Descrizione Originale'] || 'Utensile';

      const { data: updatedRecord, error: updateErr } = await supabase
        .from('Utensili_B1')
        .update(dataToUpdate)
        .eq('id', tool.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      const finalRecord = updatedRecord || { ...tool, ...dataToUpdate };

      // 1. Aggiorna immediatamente lo store inventario e la cache locale
      if (updateToolInStore) {
        updateToolInStore(finalRecord);
      }

      // 2. Aggiorna lo stato selectedTool in useMovementStore per sincronizzare la vista corrente
      useMovementStore.getState().setSelectedTool(finalRecord);

      setShowSuccess(true);
      setTimeout(() => {
        if (onToolUpdated) {
          onToolUpdated(finalRecord);
        }
        if (onClose) {
          onClose();
        }
      }, 1200);
    } catch (err) {
      console.error('Errore aggiornamento utensile:', err);
      setError("Errore durante l'aggiornamento: " + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAdmin,
    isLoading,
    showSuccess,
    error,
    fieldErrors,
    dbOptions,
    customInputFields,
    formData,
    isFieldVisible,
    handleChange,
    handleNumberChange,
    toggleCustomField,
    addNewOption,
    handleSubmit
  };
};

export default useEditToolForm;
