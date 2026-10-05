import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { buildDesc } from '../lib/toolUtils';
import { callLifecycleRpc, newOperationId, isLifecycleMock } from '../lib/lifecycleApi';
import { configureMockDb } from '../mocks/lifecycle/mockDb';
import { useAuthStore } from './useAuthStore';
import { useInventoryStore } from './useInventoryStore';

// Store del ciclo di vita utensili (prelievo guidato, in produzione, riaffilature, dashboard).
// Parla solo con le RPC di docs/CONTRACT_LIFECYCLE.md tramite lifecycleApi.

if (isLifecycleMock) {
  configureMockDb({
    resolveTool: (id) => {
      const t = useInventoryStore.getState().tools.find(x => x.id === id);
      if (!t) return null;
      return { codice: t.Codice, descrizione: buildDesc(t), ubicazione: t.Ubicazione, quantita: t['Quantità'] };
    },
    resolveOperator: (id) => {
      const u = useAuthStore.getState().currentUser;
      return u && u.id === id ? u : null;
    }
  });
}

let produzioneRealtimeChannel = null;
let refreshTimer = null;

const operatoreId = () => useAuthStore.getState().currentUser?.id ?? null;

const vuoto = (extra = {}) => ({ isLoading: false, error: null, loadedAt: null, ...extra });

export const useProduzioneStore = create((set, get) => ({
  inProduzione: vuoto({ righe: [] }),
  riaffilature: vuoto({ cestello: [], spedizioni: [] }),
  dashboard: vuoto({ data: null, periodo: null }),
  prelievo: vuoto({ opzioni: null, idUtensile: null }),
  deposito: vuoto({ opzioni: null, idUtensile: null }),

  // Da dove è stato aperto il prelievo (es. PRELEVA sul cassetto di una commessa): la commessa è già decisa.
  contestoPrelievo: null,
  setContestoPrelievo: (contesto) => set({ contestoPrelievo: contesto }),

  isSubmitting: false,
  // Ultima scrittura riuscita: alimenta il toast "Annulla".
  ultimaOperazione: null,

  // -------------------------------------------------------------------------
  // Letture
  // -------------------------------------------------------------------------

  _load: async (slice, rpc, params, map) => {
    set(state => ({ [slice]: { ...state[slice], isLoading: true, error: null } }));
    try {
      const data = await callLifecycleRpc(rpc, params);
      set(state => ({ [slice]: { ...state[slice], ...map(data), isLoading: false, error: null, loadedAt: Date.now() } }));
      return { success: true, data };
    } catch (error) {
      set(state => ({ [slice]: { ...state[slice], isLoading: false, error } }));
      return { success: false, error };
    }
  },

  fetchInProduzione: () => get()._load('inProduzione', 'get_in_produzione', {}, d => ({ righe: d.righe })),

  fetchRiaffilature: (giorniStorico = 30) =>
    get()._load('riaffilature', 'get_riaffilature', { p_giorni_storico: giorniStorico }, d => ({ cestello: d.cestello, spedizioni: d.spedizioni })),

  fetchDashboard: ({ da, a }) =>
    get()._load('dashboard', 'get_dashboard_stats', { p_da: da, p_a: a, p_id_operatore: operatoreId() }, d => ({ data: d, periodo: { da, a } })),

  loadOpzioniPrelievo: (idUtensile) => {
    set(state => ({ prelievo: { ...state.prelievo, opzioni: state.prelievo.idUtensile === idUtensile ? state.prelievo.opzioni : null, idUtensile } }));
    return get()._load('prelievo', 'get_opzioni_prelievo', { p_id_utensile: idUtensile, p_id_operatore: operatoreId() }, d => ({ opzioni: d }));
  },

  loadOpzioniDeposito: (idUtensile) => {
    set(state => ({ deposito: { ...state.deposito, opzioni: state.deposito.idUtensile === idUtensile ? state.deposito.opzioni : null, idUtensile } }));
    return get()._load('deposito', 'get_opzioni_deposito', { p_id_utensile: idUtensile }, d => ({ opzioni: d }));
  },

  // Ricarica solo le viste già aperte almeno una volta.
  refreshLoaded: async () => {
    const s = get();
    const jobs = [];
    if (s.inProduzione.loadedAt) jobs.push(s.fetchInProduzione());
    if (s.riaffilature.loadedAt) jobs.push(s.fetchRiaffilature());
    if (s.dashboard.loadedAt && s.dashboard.periodo) jobs.push(s.fetchDashboard(s.dashboard.periodo));
    if (s.prelievo.loadedAt && s.prelievo.idUtensile) jobs.push(s.loadOpzioniPrelievo(s.prelievo.idUtensile));
    await Promise.all(jobs);
  },

  // -------------------------------------------------------------------------
  // Scritture — ognuna accetta `idOperazione` per riprovare senza duplicare (§4.0.1)
  // -------------------------------------------------------------------------

  _write: async (rpc, params, { idOperazione, descrizione, annullabile = true } = {}) => {
    const id = idOperazione || newOperationId();
    set({ isSubmitting: true });
    try {
      const data = await callLifecycleRpc(rpc, { p_id_operazione: id, p_id_operatore: operatoreId(), ...params });
      set({
        isSubmitting: false,
        ultimaOperazione: annullabile ? { id, rpc, descrizione: descrizione ?? null, data, at: Date.now() } : get().ultimaOperazione
      });
      get().refreshLoaded();
      return { success: true, data, idOperazione: id };
    } catch (error) {
      set({ isSubmitting: false });
      return { success: false, error, idOperazione: id };
    }
  },

  // input: { idUtensile, da: { luogo, id_commessa, id_posizione }, stato, idMacchina, idCommessa, quantita }
  preleva: (input, opts) => get()._write('preleva', {
    p_id_utensile: input.idUtensile,
    p_da_luogo: input.da?.luogo ?? null,
    p_da_id_commessa: input.da?.id_commessa ?? null,
    p_da_id_posizione: input.da?.id_posizione ?? null,
    p_stato: input.stato ?? null,
    p_id_macchina: input.idMacchina,
    p_id_commessa: input.idCommessa ?? null,
    p_quantita: input.quantita
  }, opts),

  // input: { idUtensile, quantita, stato, idCommessa, idOrdine }
  deposita: (input, opts) => get()._write('deposita', {
    p_id_utensile: input.idUtensile,
    p_quantita: input.quantita,
    p_stato: input.stato ?? 'nuovo',
    p_id_commessa: input.idCommessa ?? null,
    p_id_ordine: input.idOrdine ?? null
  }, opts),

  // input: { idPosizione, quantita, esito, causale, nota, destMacchina, destCommessa }
  smonta: (input, opts) => get()._write('smonta', {
    p_id_posizione: input.idPosizione,
    p_quantita: input.quantita,
    p_esito: input.esito,
    p_causale: input.causale ?? null,
    p_nota: input.nota ?? null,
    p_dest_id_macchina: input.destMacchina ?? null,
    p_dest_id_commessa: input.destCommessa ?? null
  }, opts),

  // input: { ddt, fornitore, idPosizioni }
  spedisciCestello: (input = {}, opts) => get()._write('spedisci_cestello', {
    p_ddt: input.ddt || null,
    p_fornitore: input.fornitore || null,
    p_id_posizioni: input.idPosizioni ?? null
  }, opts),

  // righe: vedi righeRientroPredefinite() in lifecycleSelectors
  rientraSpedizione: (idSpedizione, righe, opts) => get()._write('rientra_spedizione', {
    p_id_spedizione: idSpedizione,
    p_righe: righe
  }, opts),

  aggiornaDdt: async (idSpedizione, ddt, fornitore = null) => {
    try {
      await callLifecycleRpc('aggiorna_ddt', { p_id_spedizione: idSpedizione, p_ddt: ddt, p_fornitore: fornitore, p_id_operatore: operatoreId() });
      get().refreshLoaded();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Avanzamento giornaliero fine turno
  registraAvanzamentoLavorazione: async ({ idCommessa, pezziAggiunti }) => {
    set({ isSubmitting: true });
    try {
      const data = await callLifecycleRpc('registra_avanzamento_lavorazione', {
        p_id_commessa: idCommessa,
        p_pezzi_aggiunti: pezziAggiunti,
        p_id_operatore: operatoreId()
      });
      set({ isSubmitting: false });
      get().refreshLoaded();
      return { success: true, data };
    } catch (error) {
      set({ isSubmitting: false });
      return { success: false, error };
    }
  },

  // Eredita utensile a bordo per nuova lavorazione
  ereditaUtensileBordo: async ({ idPosizione, nuovaCommessaId }) => {
    set({ isSubmitting: true });
    try {
      const data = await callLifecycleRpc('eredita_utensile_bordo', {
        p_id_posizione: idPosizione,
        p_nuova_commessa_id: nuovaCommessaId,
        p_id_operatore: operatoreId()
      });
      set({ isSubmitting: false });
      get().refreshLoaded();
      return { success: true, data };
    } catch (error) {
      set({ isSubmitting: false });
      return { success: false, error };
    }
  },

  // Chiusura lavorazione con opzione svuota cassetto
  chiudiLavorazione: async ({ idCommessa, svuotaCassetto = false }) => {
    set({ isSubmitting: true });
    try {
      const data = await callLifecycleRpc('chiudi_lavorazione', {
        p_id_commessa: idCommessa,
        p_svuota_cassetto: svuotaCassetto,
        p_id_operatore: operatoreId()
      });
      set({ isSubmitting: false });
      get().refreshLoaded();
      return { success: true, data };
    } catch (error) {
      set({ isSubmitting: false });
      return { success: false, error };
    }
  },

  annullaOperazione: async (idOperazioneOriginale) => {
    set({ isSubmitting: true });
    try {
      const data = await callLifecycleRpc('annulla_operazione', { p_id_operazione_originale: idOperazioneOriginale, p_id_operatore: operatoreId() });
      set(state => ({
        isSubmitting: false,
        ultimaOperazione: state.ultimaOperazione?.id === idOperazioneOriginale ? null : state.ultimaOperazione
      }));
      get().refreshLoaded();
      return { success: true, data };
    } catch (error) {
      set({ isSubmitting: false });
      return { success: false, error };
    }
  },

  clearUltimaOperazione: () => set({ ultimaOperazione: null }),

  // -------------------------------------------------------------------------
  // Realtime (§6): al primo evento si ricaricano le viste aperte
  // -------------------------------------------------------------------------

  initRealtime: () => {
    if (isLifecycleMock || produzioneRealtimeChannel) return;
    const onChange = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => get().refreshLoaded(), 400);
    };
    produzioneRealtimeChannel = supabase
      .channel('realtime:produzione')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posizioni_utensile' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spedizioni_riaffilatura' }, onChange)
      .subscribe();
  },

  cleanupRealtime: () => {
    clearTimeout(refreshTimer);
    if (produzioneRealtimeChannel) {
      supabase.removeChannel(produzioneRealtimeChannel);
      produzioneRealtimeChannel = null;
    }
  }
}));
