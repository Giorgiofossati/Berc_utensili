import { supabase } from './supabase';
import { mockRpc, mockListCommesseAttive } from '../mocks/lifecycle/mockDb';

// Sorgente dati del ciclo di vita (docs/CONTRACT_LIFECYCLE.md).
// In sviluppo si usa la simulazione in memoria finché il backend non è pronto;
// VITE_LIFECYCLE_SOURCE=supabase|mock forza una delle due in qualsiasi ambiente.
const forced = import.meta.env.VITE_LIFECYCLE_SOURCE;
export const LIFECYCLE_SOURCE = forced === 'supabase' || forced === 'mock'
  ? forced
  : (import.meta.env.DEV ? 'mock' : 'supabase');

export const isLifecycleMock = LIFECYCLE_SOURCE === 'mock';

// Le schermate nuove (prelievo e deposito guidati) si accendono da sole con la simulazione;
// con Supabase solo quando il backend è pronto: VITE_LIFECYCLE_UI=true. Fino ad allora resta il flusso attuale.
const uiFlag = import.meta.env.VITE_LIFECYCLE_UI;
export const lifecycleUiEnabled = uiFlag === 'true' || (uiFlag !== 'false' && isLifecycleMock);

// Codici di errore del contratto (§4.0) → testo per l'operatore.
const ERROR_MESSAGES = {
  PERMESSO_NEGATO: () => 'Non hai il permesso per questa operazione. Chiedi a un responsabile.',
  GIACENZA_INSUFFICIENTE: (d) => d?.disponibili != null
    ? `Ne sono rimasti solo ${d.disponibili}: riduci la quantità.`
    : 'Pezzi insufficienti per questa operazione.',
  POSIZIONE_NON_TROVATA: () => 'Qualcuno ha appena spostato questi pezzi. La lista è stata aggiornata.',
  DATI_NON_VALIDI: () => 'Manca un dato per completare l’operazione.',
  COMMESSA_CHIUSA: (d) => `La commessa ${d?.codice ?? ''} è chiusa: scegline un’altra.`.replace('  ', ' '),
  ANNULLO_NON_POSSIBILE: (d) => d?.motivo === 'pezzi_spostati'
    ? 'Non si può più annullare: i pezzi sono già stati spostati di nuovo.'
    : d?.motivo === 'gia_annullata'
      ? 'Operazione già annullata.'
      : 'Non si può più annullare: sono passati più di 10 minuti.'
};

export class LifecycleError extends Error {
  constructor({ codice, detail = {}, message, isNetwork = false }) {
    super(message);
    this.name = 'LifecycleError';
    this.codice = codice;
    this.detail = detail;
    this.isNetwork = isNetwork;
  }
}

function parseDetail(details) {
  if (!details) return {};
  try {
    return JSON.parse(details);
  } catch {
    return {};
  }
}

function toLifecycleError(error) {
  const codice = error?.code === 'P0001' ? error.message : null;
  const detail = parseDetail(error?.details);
  if (codice && ERROR_MESSAGES[codice]) {
    return new LifecycleError({ codice, detail, message: ERROR_MESSAGES[codice](detail) });
  }
  const isNetwork = !error?.code || /fetch|network|timeout/i.test(error?.message || '');
  return new LifecycleError({
    codice: isNetwork ? 'RETE' : 'SCONOSCIUTO',
    detail,
    isNetwork,
    message: isNetwork
      ? 'Connessione assente. Riprova: l’operazione non verrà registrata due volte.'
      : 'Errore imprevisto. Riprova o avvisa un responsabile.'
  });
}

// Chiama una RPC del contratto. Restituisce `data` oppure lancia LifecycleError.
export async function callLifecycleRpc(name, params = {}) {
  let result;
  try {
    result = isLifecycleMock ? await mockRpc(name, params) : await supabase.rpc(name, params);
  } catch (err) {
    throw toLifecycleError({ message: err?.message });
  }
  if (result.error) throw toLifecycleError(result.error);
  return result.data;
}

// Commesse attive per la ricerca nelle domande guidate. Legge la tabella esistente `commesse`.
export async function listCommesseAttive() {
  if (isLifecycleMock) return mockListCommesseAttive();
  const { data, error } = await supabase
    .from('commesse')
    .select('id, codice, descrizione, ubicazione')
    .eq('stato', 'Attiva')
    .order('codice', { ascending: false });
  if (error) throw toLifecycleError(error);
  return data || [];
}

// id_operazione generato dal client (§4.0.1): lo stesso id va riusato nei tentativi successivi.
export function newOperationId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
