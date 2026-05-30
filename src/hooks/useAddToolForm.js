import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { buildDesc } from '../lib/toolUtils';

export const useAddToolForm = ({ tools, onClose, onToolAdded }) => {
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
          const { data, error } = await supabase
            .from('Utensili_B1')
            .select('"Tipologia", "Forma", "Diametro", "Ubicazione", "Materiale", "Rivestimento", "Fornitore", "Lavorazione", "Passo", "Tolleranza", "Raggio", "Angolo"');
          
          if (error) throw error;
          
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

  const toggleCustomField = (fieldName) => {
    setCustomInputFields(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
    setFormData(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.Tipologia || !formData.Codice || !formData['Serial Number']) {
      alert("Tipologia, Codice Aziendale e Codice Produttore sono campi obbligatori.");
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
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Errore durante l'inserimento: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
};
