import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { buildDesc } from '../lib/toolUtils';

export const useAddToolForm = ({ tools, onClose, onToolAdded }) => {
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
    'Quantità': 1,
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
    if (tools && tools.length > 0) {
      const processed = {};
      const keys = ['Tipologia', 'Forma', 'Diametro', 'Ubicazione', 'Materiale', 'Rivestimento', 'Fornitore', 'Lavorazione', 'Passo', 'Tolleranza', 'Raggio', 'Angolo'];
      keys.forEach(key => {
        const values = tools
          .map(row => row[key])
          .filter(val => val !== null && val !== undefined && val !== '');
        processed[key] = [...new Set(values)].sort((a, b) => 
          a.toString().localeCompare(b.toString(), undefined, { numeric: true, sensitivity: 'base' })
        );
      });
      setDbOptions(processed);
    } else {
      const fetchExistingOptions = async () => {
        try {
          const { data, error: fetchErr } = await supabase
            .from('Utensili_B1')
            .select('"Tipologia", "Forma", "Diametro", "Ubicazione", "Materiale", "Rivestimento", "Fornitore", "Lavorazione", "Passo", "Tolleranza", "Raggio", "Angolo"');
          
          if (fetchErr) throw fetchErr;
          
          if (data) {
            const processed = {};
            const keys = ['Tipologia', 'Forma', 'Diametro', 'Ubicazione', 'Materiale', 'Rivestimento', 'Fornitore', 'Lavorazione', 'Passo', 'Tolleranza', 'Raggio', 'Angolo'];
            keys.forEach(key => {
              const values = data
                .map(row => row[key])
                .filter(val => val !== null && val !== undefined && val !== '');
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
    setFormData(prev => ({ ...prev, [fieldName]: '' }));
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.Codice || !formData.Codice.trim()) {
      errors.Codice = "Il codice aziendale è obbligatorio.";
    }

    if (!formData['Serial Number'] || !formData['Serial Number'].trim()) {
      errors['Serial Number'] = "Il codice produttore è obbligatorio.";
    }

    if (!formData.Fornitore || !formData.Fornitore.trim()) {
      errors.Fornitore = "Il fornitore è obbligatorio.";
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
      errors['Quantità'] = "La quantità iniziale deve essere maggiore o uguale a zero.";
    }

    // Validazione attributi indispensabili reattivi
    const t = (formData.Tipologia || '').toUpperCase();
    const forma = (formData.Forma || '').toUpperCase();

    if (t.includes('FRESA')) {
      if (!formData.Forma || !formData.Forma.trim()) {
        errors.Forma = "La forma è obbligatoria per le frese (es. Candela, Torica, Sferica).";
      } else if ((forma.includes('TORICA') || forma.includes('SFERICA')) && (!formData.Raggio || !String(formData.Raggio).trim())) {
        errors.Raggio = "Il raggio di punta è obbligatorio per frese toriche o sferiche.";
      }
    }

    if (t.includes('MASCHIO') || t.includes('SPACCAMASCHIO')) {
      if (!formData.Passo || !String(formData.Passo).trim()) {
        errors.Passo = "Il passo di filettatura è obbligatorio per i maschi.";
      }
    }

    if (t.includes('SVASATORE') || t.includes('SMUSSATORE')) {
      if (!formData.Angolo || !String(formData.Angolo).trim()) {
        errors.Angolo = "L'angolo di svasatura è obbligatorio (es. 90°, 60°).";
      }
    }

    if (t.includes('ALESATORE')) {
      if (!formData.Tolleranza || !formData.Tolleranza.trim()) {
        errors.Tolleranza = "La tolleranza è obbligatoria per gli alesatori (es. H7).";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const dataToInsert = { ...formData };
      
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
      dataToInsert['Descrizione Originale'] = buildDesc(dataToInsert);

      const { error: insertErr } = await supabase
        .from('Utensili_B1')
        .insert([dataToInsert]);

      if (insertErr) throw insertErr;

      setShowSuccess(true);
      setTimeout(() => {
        if (onToolAdded) {
          onToolAdded();
        }
        if (onClose) {
          onClose();
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Errore durante l'inserimento: " + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
    handleSubmit
  };
};
