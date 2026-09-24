// Simulazione in memoria delle RPC del ciclo di vita utensili.
// Implementa le stesse regole di docs/CONTRACT_LIFECYCLE.md (§3-§4) così la UI
// si sviluppa e si prova prima che il backend reale sia pronto.
// Restituisce { data, error } come supabase.rpc(); gli errori hanno la stessa forma
// ({ code: 'P0001', message: '<CODICE>', details: '<json>' }).
// Nessuna dipendenza da store o da import.meta: si può eseguire anche in Node.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const FRESH_MS = 72 * HOUR;
const STALE_IN_MACHINE_MS = 7 * DAY;
const UNDO_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_MAX_RIAFFILATURE = 3;

export const LUOGHI = ['magazzino', 'cassetto', 'macchina', 'cestello', 'fornitore'];
export const STATI = ['nuovo', 'usato', 'riaffilato'];
export const ESITI = ['consumato', 'rotto', 'buono', 'sposta'];
export const CAUSALI = ['usura', 'collisione', 'rottura_lavorazione', 'parametri_programma', 'altro', 'usura_limite_riaffilature', 'scarto_fornitore'];
export const CAUSALI_EVITABILI = ['collisione', 'parametri_programma'];
const CAUSALI_OPERATORE = ['usura', 'collisione', 'rottura_lavorazione', 'parametri_programma', 'altro'];

// ---------------------------------------------------------------------------
// Configurazione (lo store collega catalogo e operatore reali)
// ---------------------------------------------------------------------------

let resolveTool = () => null;
let resolveOperator = () => null;

export function configureMockDb(hooks = {}) {
  if (hooks.resolveTool) resolveTool = hooks.resolveTool;
  if (hooks.resolveOperator) resolveOperator = hooks.resolveOperator;
}

// ---------------------------------------------------------------------------
// Dati di esempio
// ---------------------------------------------------------------------------

const MOCK_TOOLS = {
  'mock-fr10': { codice: 'FR-10-Z4-072', descrizione: 'Fresa HM Ø10 Z4 L72', ubicazione: 'Scaffale B3', prezzo_acquisto: 48, costo_riaffilatura: 14 },
  'mock-pu85': { codice: 'PU-085-5D', descrizione: 'Punta HM Ø8,5 5xD', ubicazione: 'Scaffale B4', prezzo_acquisto: 62, costo_riaffilatura: 16 },
  'mock-sp50': { codice: 'SP-50-R08', descrizione: 'Fresa a spianare Ø50', ubicazione: 'Scaffale D1', prezzo_acquisto: 210, costo_riaffilatura: null },
  'mock-m8': { codice: 'MA-M8-HSS', descrizione: 'Maschio M8 macchina', ubicazione: 'Scaffale E2', prezzo_acquisto: 22, costo_riaffilatura: 8 },
  'mock-al12': { codice: 'AL-12-H7', descrizione: 'Alesatore Ø12 H7', ubicazione: 'Scaffale F1', prezzo_acquisto: 95, costo_riaffilatura: 25 },
  'mock-ft16': { codice: 'FT-16-R2', descrizione: 'Fresa torica Ø16 R2', ubicazione: 'Scaffale B5', prezzo_acquisto: 74, costo_riaffilatura: 18 },
  'mock-fr6': { codice: 'FR-06-Z3', descrizione: 'Fresa HM Ø6 Z3', ubicazione: 'Scaffale B1', prezzo_acquisto: 31, costo_riaffilatura: 11 },
  'mock-pu102': { codice: 'PU-102-3D', descrizione: 'Punta HM Ø10,2', ubicazione: 'Scaffale B4', prezzo_acquisto: 58, costo_riaffilatura: 15 },
  'mock-fr12': { codice: 'FR-12-Z4', descrizione: 'Fresa HM Ø12 Z4', ubicazione: 'Scaffale B2', prezzo_acquisto: 66, costo_riaffilatura: 17 }
};

function seedState(now) {
  const ago = (ms) => new Date(now - ms).toISOString();
  const state = {
    seq: 1,
    macchine: [
      { id: 'mac-cnc01', nome: 'CNC 01', reparto: 'Fresatura', ordine: 1, is_active: true },
      { id: 'mac-cnc02', nome: 'CNC 02', reparto: 'Fresatura', ordine: 2, is_active: true },
      { id: 'mac-cnc03', nome: 'CNC 03', reparto: 'Fresatura', ordine: 3, is_active: true },
      { id: 'mac-cnc04', nome: 'CNC 04', reparto: 'Tornitura', ordine: 4, is_active: true },
      { id: 'mac-cnc05', nome: 'CNC 05', reparto: 'Fresatura', ordine: 5, is_active: true }
    ],
    commesse: [
      { id: 'com-24118', codice: '24-118', descrizione: 'Carter Ducati', ubicazione: 'Cassettiera C · cassetto 4', stato: 'Attiva' },
      { id: 'com-24102', codice: '24-102', descrizione: 'Flange', ubicazione: 'Cassettiera A · cassetto 2', stato: 'Attiva' },
      { id: 'com-24121', codice: '24-121', descrizione: 'Prototipo', ubicazione: 'Cassettiera C · cassetto 7', stato: 'Attiva' },
      { id: 'com-24097', codice: '24-097', descrizione: 'Staffe', ubicazione: null, stato: 'Chiusa' }
    ],
    spedizioni: [
      { id: 'sped-1438', ddt: '1438', fornitore: null, stato: 'in_viaggio', data_invio: ago(13 * DAY), data_rientro: null, operatore_invio: 'Operatore demo', operatore_rientro: null },
      { id: 'sped-1451', ddt: '1451', fornitore: null, stato: 'in_viaggio', data_invio: ago(5 * DAY), data_rientro: null, operatore_invio: 'Operatore demo', operatore_rientro: null }
    ],
    posizioni: [],
    movimenti: [],
    operazioni: {},
    annullate: {}
  };

  const pos = (id_utensile, luogo, stato, quantita, { eta = 2 * DAY, ...extra } = {}) => {
    state.posizioni.push({
      id: `pos-${state.seq++}`, id_utensile, luogo, stato, quantita,
      n_riaffilature: 0, id_commessa: null, id_macchina: null, id_spedizione: null,
      entrata_il: ago(eta), aggiornato_il: ago(eta),
      _macchina_origine: null,
      ...extra
    });
  };
  pos('mock-fr10', 'magazzino', 'nuovo', 5);
  pos('mock-fr10', 'magazzino', 'usato', 2);
  pos('mock-fr10', 'magazzino', 'riaffilato', 3, { n_riaffilature: 1 });
  pos('mock-fr10', 'cassetto', 'nuovo', 12, { id_commessa: 'com-24118', eta: 8 * DAY });
  pos('mock-fr10', 'cassetto', 'usato', 1, { id_commessa: 'com-24118', eta: 1 * DAY });
  pos('mock-fr10', 'macchina', 'riaffilato', 1, { n_riaffilature: 2, id_macchina: 'mac-cnc03', id_commessa: 'com-24118', eta: 2 * HOUR });
  pos('mock-fr10', 'macchina', 'riaffilato', 1, { n_riaffilature: 1, id_macchina: 'mac-cnc05', id_commessa: 'com-24121', eta: 12 * DAY });
  pos('mock-pu85', 'magazzino', 'nuovo', 8);
  pos('mock-pu85', 'macchina', 'nuovo', 2, { id_macchina: 'mac-cnc03', id_commessa: 'com-24118', eta: 2 * DAY });
  pos('mock-sp50', 'macchina', 'usato', 1, { id_macchina: 'mac-cnc03', eta: 21 * DAY });
  pos('mock-m8', 'macchina', 'riaffilato', 1, { n_riaffilature: 3, id_macchina: 'mac-cnc03', eta: 6 * DAY });
  pos('mock-al12', 'macchina', 'nuovo', 1, { id_macchina: 'mac-cnc01', id_commessa: 'com-24102', eta: 5 * DAY });
  pos('mock-al12', 'cassetto', 'nuovo', 4, { id_commessa: 'com-24102', eta: 14 * DAY });
  pos('mock-ft16', 'macchina', 'nuovo', 1, { id_macchina: 'mac-cnc05', id_commessa: 'com-24118', eta: 1 * DAY });
  pos('mock-fr10', 'cestello', 'riaffilato', 2, { n_riaffilature: 2, id_commessa: 'com-24118', _macchina_origine: 'mac-cnc03', eta: 3 * HOUR });
  pos('mock-pu85', 'cestello', 'usato', 3, { _macchina_origine: 'mac-cnc01', eta: 1 * DAY });
  pos('mock-ft16', 'cestello', 'usato', 1, { id_commessa: 'com-24118', _macchina_origine: 'mac-cnc05', eta: 3 * DAY });
  pos('mock-al12', 'cestello', 'riaffilato', 1, { n_riaffilature: 1, id_commessa: 'com-24102', _macchina_origine: 'mac-cnc01', eta: 4 * DAY });
  pos('mock-fr6', 'fornitore', 'usato', 4, { id_spedizione: 'sped-1438', eta: 13 * DAY });
  pos('mock-pu102', 'fornitore', 'riaffilato', 3, { n_riaffilature: 1, id_commessa: 'com-24118', id_spedizione: 'sped-1438', eta: 13 * DAY });
  pos('mock-fr12', 'fornitore', 'riaffilato', 2, { n_riaffilature: 2, id_spedizione: 'sped-1438', eta: 13 * DAY });
  pos('mock-fr10', 'fornitore', 'usato', 5, { id_spedizione: 'sped-1451', eta: 5 * DAY });

  // Recenza macchina/commessa per le chip del prelievo
  const recent = [
    ['mac-cnc03', 'com-24118', 2 * HOUR], ['mac-cnc03', 'com-24097', 9 * DAY],
    ['mac-cnc01', 'com-24102', 5 * DAY], ['mac-cnc05', 'com-24121', 1 * DAY]
  ];
  recent.forEach(([m, c, eta]) => state.movimenti.push(movementRow(state, {
    tool_id: 'mock-fr10', tipo_operazione: 'prelievo', quantita: 1, operatore: 'Storico demo', _operatore_id: '*',
    id_macchina: m, commessa_id: c, luogo_da: 'magazzino', luogo_a: 'macchina', stato: 'nuovo', created_at: ago(eta)
  })));

  seedHistory(state, now);
  return state;
}

// Storico sintetico e deterministico degli ultimi 90 giorni, solo per la dashboard.
function seedHistory(state, now) {
  let r = 7;
  const rnd = () => ((r = (r * 48271) % 2147483647) / 2147483647);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const toolIds = Object.keys(MOCK_TOOLS);
  const causaliPesi = ['usura', 'usura', 'usura', 'collisione', 'collisione', 'rottura_lavorazione', 'rottura_lavorazione', 'parametri_programma', 'altro'];
  for (let i = 0; i < 160; i++) {
    const tool = pick(toolIds);
    const t = MOCK_TOOLS[tool];
    const created_at = new Date(now - (1 + rnd() * 89) * DAY).toISOString();
    const macchina = pick(state.macchine).id;
    const commessa = pick([null, 'com-24118', 'com-24102', 'com-24121', 'com-24118']);
    const k = rnd();
    const base = { tool_id: tool, operatore: 'Storico demo', created_at, id_macchina: macchina, commessa_id: commessa };
    if (k < 0.45) {
      state.movimenti.push(movementRow(state, { ...base, tipo_operazione: 'prelievo', quantita: 1 + Math.floor(rnd() * 2), luogo_da: 'magazzino', luogo_a: 'macchina', stato: 'nuovo', costo_unitario: t.prezzo_acquisto }));
    } else if (k < 0.75) {
      state.movimenti.push(movementRow(state, { ...base, id_macchina: null, commessa_id: null, tipo_operazione: 'rientro_riaffilatura', quantita: 1 + Math.floor(rnd() * 3), luogo_da: 'fornitore', luogo_a: 'magazzino', stato: 'usato', costo_unitario: t.costo_riaffilatura }));
    } else if (k < 0.93) {
      state.movimenti.push(movementRow(state, { ...base, tipo_operazione: 'smontaggio_scarto', quantita: 1, luogo_da: 'macchina', luogo_a: null, stato: 'usato', causale_scarto: pick(causaliPesi), costo_unitario: t.prezzo_acquisto }));
    } else {
      state.movimenti.push(movementRow(state, { ...base, id_macchina: null, tipo_operazione: 'scarto_fornitore', quantita: 1, luogo_da: 'fornitore', luogo_a: null, stato: 'usato', causale_scarto: 'scarto_fornitore', costo_unitario: t.prezzo_acquisto }));
    }
  }
}

function movementRow(state, fields) {
  return {
    id: `mov-${state.seq++}`,
    id_operazione: null,
    tool_id: null, tipo_operazione: null, quantita: 0, operatore: null, commessa_id: null,
    id_macchina: null, luogo_da: null, luogo_a: null, stato: null, n_riaffilature: null,
    id_spedizione: null, causale_scarto: null, nota: null, costo_unitario: null,
    snapshot_da: null, snapshot_a: null, created_at: new Date().toISOString(),
    _operatore_id: null,
    ...fields
  };
}

let db = seedState(Date.now());

export function resetMockDb(now = Date.now()) {
  db = seedState(now);
}

// ---------------------------------------------------------------------------
// Utilità interne
// ---------------------------------------------------------------------------

class RpcError extends Error {
  constructor(codice, detail = {}) {
    super(codice);
    this.codice = codice;
    this.detail = detail;
  }
}

const nowIso = () => new Date().toISOString();
const clone = (v) => JSON.parse(JSON.stringify(v));

function toolInfo(id) {
  if (MOCK_TOOLS[id]) return { max_riaffilature: DEFAULT_MAX_RIAFFILATURE, ...MOCK_TOOLS[id] };
  const real = resolveTool(id);
  if (!real) return null;
  ensureSeededRealTool(id, real);
  return {
    codice: real.codice ?? null,
    descrizione: real.descrizione ?? 'Utensile',
    ubicazione: real.ubicazione ?? null,
    prezzo_acquisto: real.prezzo_acquisto ?? null,
    costo_riaffilatura: real.costo_riaffilatura ?? null,
    max_riaffilature: real.max_riaffilature ?? DEFAULT_MAX_RIAFFILATURE
  };
}

// Un utensile reale del catalogo, cliccato in dev: gli diamo una giacenza plausibile
// una volta sola, partendo dalla sua "Quantità".
const seededReal = new Set();
function ensureSeededRealTool(id, real) {
  if (seededReal.has(id)) return;
  seededReal.add(id);
  if (db.posizioni.some(p => p.id_utensile === id)) return;
  const qty = Math.max(0, Math.min(Number(real.quantita) || 0, 99));
  const add = (stato, quantita, n = 0) => {
    if (quantita > 0) addQty({ id_utensile: id, luogo: 'magazzino', stato, n_riaffilature: n, id_commessa: null, id_macchina: null, id_spedizione: null }, quantita);
  };
  add('nuovo', qty);
  add('usato', qty > 0 ? 1 : 0);
  add('riaffilato', qty > 2 ? 2 : 0, 1);
}

function operatorOf(id) {
  const real = resolveOperator(id);
  const base = {
    nome: 'Operatore demo',
    can_pick_tools: true, can_manage_riaffilature: true, can_manage_catalog: true, can_view_dashboard: true
  };
  if (!real) return base;
  const isAdmin = real.ruolo === 'Admin';
  return {
    nome: [real.nome, real.cognome].filter(Boolean).join(' ') || base.nome,
    can_pick_tools: real.can_pick_tools ?? true,
    can_manage_riaffilature: real.can_manage_riaffilature ?? isAdmin,
    can_manage_catalog: real.can_manage_catalog ?? isAdmin,
    can_view_dashboard: real.can_view_dashboard ?? isAdmin
  };
}

function requireFlag(operatore, flag) {
  if (!operatore[flag]) throw new RpcError('PERMESSO_NEGATO', { permesso: flag });
}

function requireQty(q) {
  if (!Number.isInteger(q) || q <= 0) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_quantita' });
}

const commessaById = (id) => db.commesse.find(c => c.id === id) || null;
const macchinaById = (id) => db.macchine.find(m => m.id === id) || null;

function requireCommessaAttiva(id) {
  if (!id) return null;
  const c = commessaById(id);
  if (!c) throw new RpcError('DATI_NON_VALIDI', { campo: 'id_commessa' });
  if (c.stato !== 'Attiva') throw new RpcError('COMMESSA_CHIUSA', { codice: c.codice });
  return c;
}

function requireMacchina(id) {
  const m = macchinaById(id);
  if (!m || !m.is_active) throw new RpcError('DATI_NON_VALIDI', { campo: 'id_macchina' });
  return m;
}

const KEY_FIELDS = ['id_utensile', 'luogo', 'stato', 'n_riaffilature', 'id_commessa', 'id_macchina', 'id_spedizione'];
const keyOf = (p) => Object.fromEntries(KEY_FIELDS.map(k => [k, p[k] ?? (k === 'n_riaffilature' ? 0 : null)]));
const sameKey = (a, b) => KEY_FIELDS.every(k => (a[k] ?? null) === (b[k] ?? null));

function addQty(key, quantita, extra = {}) {
  const full = keyOf(key);
  let p = db.posizioni.find(x => sameKey(x, full));
  if (p) {
    p.quantita += quantita;
    p.aggiornato_il = nowIso();
    if (extra._macchina_origine) p._macchina_origine = extra._macchina_origine;
  } else {
    p = { id: `pos-${db.seq++}`, ...full, quantita, entrata_il: nowIso(), aggiornato_il: nowIso(), _macchina_origine: extra._macchina_origine || null };
    db.posizioni.push(p);
  }
  return p;
}

function removeQty(p, quantita) {
  if (p.quantita < quantita) throw new RpcError('GIACENZA_INSUFFICIENTE', { disponibili: p.quantita, richiesti: quantita });
  p.quantita -= quantita;
  p.aggiornato_il = nowIso();
  if (p.quantita === 0) db.posizioni = db.posizioni.filter(x => x !== p);
}

function log(ctx, fields) {
  db.movimenti.push(movementRow(db, {
    id_operazione: ctx.id,
    operatore: ctx.operatore.nome,
    _operatore_id: ctx.operatoreId,
    created_at: nowIso(),
    ...fields
  }));
}

// Esegue una scrittura in "transazione": idempotenza su id_operazione,
// ripristino completo dello stato se qualcosa fallisce.
function write(params, flag, fn) {
  const id = params.p_id_operazione;
  if (!id) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_id_operazione' });
  if (db.operazioni[id]) return { ...db.operazioni[id], gia_eseguita: true };
  const operatore = operatorOf(params.p_id_operatore);
  if (flag) requireFlag(operatore, flag);
  const backup = clone(db);
  try {
    const result = { ok: true, id_operazione: id, gia_eseguita: false, ...fn({ id, operatore, operatoreId: params.p_id_operatore }) };
    db.operazioni[id] = result;
    return result;
  } catch (err) {
    db = backup;
    throw err;
  }
}

const posView = (p) => {
  const t = toolInfo(p.id_utensile) || {};
  const c = commessaById(p.id_commessa);
  const m = macchinaById(p.id_macchina);
  return {
    id_posizione: p.id, id_utensile: p.id_utensile, codice: t.codice ?? null, descrizione: t.descrizione ?? null,
    luogo: p.luogo, id_macchina: p.id_macchina, nome_macchina: m ? m.nome : null,
    id_commessa: p.id_commessa, codice_commessa: c ? c.codice : null, descrizione_commessa: c ? c.descrizione : null,
    ubicazione_cassetto: c ? c.ubicazione : null,
    stato: p.stato, n_riaffilature: p.n_riaffilature, max_riaffilature: t.max_riaffilature ?? DEFAULT_MAX_RIAFFILATURE,
    quantita: p.quantita, entrata_il: p.entrata_il
  };
};

// ---------------------------------------------------------------------------
// Letture (§3)
// ---------------------------------------------------------------------------

function get_opzioni_prelievo({ p_id_utensile, p_id_operatore }) {
  const t = toolInfo(p_id_utensile);
  if (!t) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_id_utensile' });
  const now = Date.now();
  const prelievi = db.movimenti.filter(m => (m.tipo_operazione === 'prelievo' || m.tipo_operazione === 'spostamento_produzione') && m.id_macchina);

  const macchine = db.macchine.filter(m => m.is_active).map(m => {
    const mine = prelievi.filter(x => x.id_macchina === m.id && (x._operatore_id === p_id_operatore || x._operatore_id === '*'));
    const last = mine.reduce((acc, x) => (acc && acc > x.created_at ? acc : x.created_at), null);
    return { m: { id: m.id, nome: m.nome, reparto: m.reparto, ultimo_uso_operatore: last }, ordine: m.ordine };
  }).sort((a, b) => {
    const ua = a.m.ultimo_uso_operatore, ub = b.m.ultimo_uso_operatore;
    if (ua && ub) return ub.localeCompare(ua);
    if (ua) return -1;
    if (ub) return 1;
    return a.ordine - b.ordine;
  }).map(x => x.m);

  const commesse_per_macchina = {};
  macchine.forEach(m => {
    const byCommessa = {};
    prelievi.filter(x => x.id_macchina === m.id && x.commessa_id).forEach(x => {
      if (!byCommessa[x.commessa_id] || byCommessa[x.commessa_id] < x.created_at) byCommessa[x.commessa_id] = x.created_at;
    });
    commesse_per_macchina[m.id] = Object.entries(byCommessa)
      .map(([id, ultimo_uso]) => ({ c: commessaById(id), ultimo_uso }))
      .filter(x => x.c && x.c.stato === 'Attiva')
      .sort((a, b) => b.ultimo_uso.localeCompare(a.ultimo_uso))
      .slice(0, 5)
      .map(({ c, ultimo_uso }) => ({
        id: c.id, codice: c.codice, descrizione: c.descrizione, ubicazione_cassetto: c.ubicazione,
        ultimo_uso, fresca: now - new Date(ultimo_uso).getTime() <= FRESH_MS
      }));
  });

  const disponibilita = db.posizioni
    .filter(p => p.id_utensile === p_id_utensile && (p.luogo === 'magazzino' || p.luogo === 'cassetto'))
    .map(p => {
      const c = commessaById(p.id_commessa);
      return {
        luogo: p.luogo, id_commessa: p.id_commessa, codice_commessa: c ? c.codice : null,
        ubicazione: p.luogo === 'cassetto' ? (c ? c.ubicazione : null) : t.ubicazione,
        stato: p.stato, n_riaffilature: p.n_riaffilature, quantita: p.quantita
      };
    });

  const altrove_in_macchina = db.posizioni
    .filter(p => p.id_utensile === p_id_utensile && p.luogo === 'macchina' && now - new Date(p.entrata_il).getTime() > STALE_IN_MACHINE_MS)
    .map(p => ({
      id_posizione: p.id, id_macchina: p.id_macchina, nome_macchina: macchinaById(p.id_macchina)?.nome ?? null,
      codice_commessa: commessaById(p.id_commessa)?.codice ?? null, stato: p.stato, quantita: p.quantita, entrata_il: p.entrata_il
    }));

  return {
    utensile: { id: p_id_utensile, codice: t.codice, descrizione: t.descrizione, ubicazione: t.ubicazione, max_riaffilature: t.max_riaffilature },
    macchine, commesse_per_macchina, disponibilita, altrove_in_macchina
  };
}

function get_in_produzione() {
  return { righe: db.posizioni.filter(p => p.luogo === 'macchina' || p.luogo === 'cassetto').map(posView) };
}

function get_riaffilature({ p_giorni_storico = 30 } = {}) {
  const cestello = db.posizioni.filter(p => p.luogo === 'cestello').map(p => {
    const v = posView(p);
    return {
      id_posizione: v.id_posizione, id_utensile: v.id_utensile, descrizione: v.descrizione,
      nome_macchina_origine: macchinaById(p._macchina_origine)?.nome ?? null,
      codice_commessa: v.codice_commessa, n_riaffilature: v.n_riaffilature, max_riaffilature: v.max_riaffilature,
      quantita: v.quantita, entrata_il: v.entrata_il
    };
  });

  const limite = Date.now() - p_giorni_storico * DAY;
  const spedizioni = db.spedizioni
    .filter(s => s.stato === 'in_viaggio' || (s.data_rientro && new Date(s.data_rientro).getTime() >= limite))
    .map(s => {
      let righe;
      if (s.stato === 'in_viaggio') {
        righe = db.posizioni.filter(p => p.luogo === 'fornitore' && p.id_spedizione === s.id).map(p => {
          const t = toolInfo(p.id_utensile) || {};
          const c = commessaById(p.id_commessa);
          return {
            id_posizione: p.id, id_utensile: p.id_utensile, descrizione: t.descrizione ?? null, ubicazione_abituale: t.ubicazione ?? null,
            id_commessa: p.id_commessa, codice_commessa: c ? c.codice : null, ubicazione_cassetto: c ? c.ubicazione : null,
            commessa_attiva: c ? c.stato === 'Attiva' : false,
            n_riaffilature: p.n_riaffilature, max_riaffilature: t.max_riaffilature ?? DEFAULT_MAX_RIAFFILATURE, quantita: p.quantita, scartati: 0
          };
        });
      } else {
        const grouped = {};
        db.movimenti
          .filter(m => m.id_spedizione === s.id && (m.tipo_operazione === 'rientro_riaffilatura' || m.tipo_operazione === 'scarto_fornitore'))
          .forEach(m => {
            const k = `${m.tool_id}|${m.n_riaffilature}`;
            const t = toolInfo(m.tool_id) || {};
            grouped[k] = grouped[k] || {
              id_posizione: null, id_utensile: m.tool_id, descrizione: t.descrizione ?? null, ubicazione_abituale: t.ubicazione ?? null,
              id_commessa: null, codice_commessa: null, ubicazione_cassetto: null, commessa_attiva: false,
              n_riaffilature: m.n_riaffilature, max_riaffilature: t.max_riaffilature ?? DEFAULT_MAX_RIAFFILATURE, quantita: 0, scartati: 0
            };
            if (m.tipo_operazione === 'rientro_riaffilatura') grouped[k].quantita += m.quantita;
            else grouped[k].scartati += m.quantita;
          });
        righe = Object.values(grouped);
      }
      return {
        id: s.id, ddt: s.ddt, fornitore: s.fornitore, stato: s.stato, data_invio: s.data_invio, data_rientro: s.data_rientro,
        pezzi: righe.reduce((a, r) => a + r.quantita + r.scartati, 0), righe
      };
    })
    .sort((a, b) => a.data_invio.localeCompare(b.data_invio));

  return { cestello, spedizioni };
}

function get_opzioni_deposito({ p_id_utensile }) {
  const t = toolInfo(p_id_utensile);
  if (!t) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_id_utensile' });
  const ordine_aperto = p_id_utensile === 'mock-fr10'
    ? { id: 'ord-mock-1', quantita_richiesta: 50, id_commessa: 'com-24118', codice_commessa: '24-118' }
    : null;
  const recency = {};
  db.movimenti.forEach(m => {
    if (m.commessa_id && (!recency[m.commessa_id] || recency[m.commessa_id] < m.created_at)) recency[m.commessa_id] = m.created_at;
  });
  const attive = db.commesse.filter(c => c.stato === 'Attiva')
    .sort((a, b) => {
      if (ordine_aperto && a.id === ordine_aperto.id_commessa) return -1;
      if (ordine_aperto && b.id === ordine_aperto.id_commessa) return 1;
      return (recency[b.id] || '').localeCompare(recency[a.id] || '');
    })
    .slice(0, 6)
    .map(c => ({
      id: c.id, codice: c.codice, descrizione: c.descrizione, ubicazione_cassetto: c.ubicazione,
      pezzi_nel_cassetto: db.posizioni.filter(p => p.luogo === 'cassetto' && p.id_commessa === c.id && p.id_utensile === p_id_utensile).reduce((a, p) => a + p.quantita, 0)
    }));
  return {
    utensile: { id: p_id_utensile, codice: t.codice, descrizione: t.descrizione, ubicazione: t.ubicazione },
    ordine_aperto,
    commesse_attive: attive
  };
}

function get_dashboard_stats({ p_da, p_a, p_id_operatore }) {
  requireFlag(operatorOf(p_id_operatore), 'can_view_dashboard');
  const da = p_da ? new Date(p_da).getTime() : 0;
  const a = p_a ? new Date(p_a).getTime() : Date.now();
  const mov = db.movimenti.filter(m => {
    const t = new Date(m.created_at).getTime();
    return t >= da && t <= a;
  });
  const euro = (m) => (m.costo_unitario == null ? 0 : m.costo_unitario * m.quantita);
  const round = (n) => Math.round(n * 100) / 100;

  const rientri = mov.filter(m => m.tipo_operazione === 'rientro_riaffilatura');
  const risparmio = rientri.reduce((acc, m) => {
    const t = toolInfo(m.tool_id) || {};
    if (t.prezzo_acquisto == null || t.costo_riaffilatura == null) return acc;
    return acc + m.quantita * (t.prezzo_acquisto - t.costo_riaffilatura);
  }, 0);
  const prelieviNuovi = mov.filter(m => m.tipo_operazione === 'prelievo' && m.stato === 'nuovo');
  const nuoviEuro = prelieviNuovi.reduce((acc, m) => acc + euro(m), 0);
  const riaffEuro = rientri.reduce((acc, m) => acc + euro(m), 0);

  const scartiReparto = mov.filter(m => m.tipo_operazione === 'smontaggio_scarto');
  const scartiFornitore = mov.filter(m => m.tipo_operazione === 'scarto_fornitore');
  const tuttiScarti = scartiReparto.concat(scartiFornitore);
  const pezziScarti = tuttiScarti.reduce((acc, m) => acc + m.quantita, 0);
  const evitabili = tuttiScarti.filter(m => CAUSALI_EVITABILI.includes(m.causale_scarto));
  const pezziEvitabili = evitabili.reduce((acc, m) => acc + m.quantita, 0);

  const perMacchina = {};
  const perCommessa = {};
  prelieviNuovi.forEach(m => {
    if (m.id_macchina) perMacchina[m.id_macchina] = (perMacchina[m.id_macchina] || 0) + euro(m);
    const k = m.commessa_id || '_generico';
    perCommessa[k] = (perCommessa[k] || 0) + euro(m);
  });

  return {
    risparmio_riaffilature: { euro: round(risparmio), pezzi: rientri.reduce((acc, m) => acc + m.quantita, 0) },
    spesa: { euro: round(nuoviEuro + riaffEuro), nuovi_euro: round(nuoviEuro), riaffilature_euro: round(riaffEuro) },
    scarti: {
      pezzi: pezziScarti,
      reparto: scartiReparto.reduce((acc, m) => acc + m.quantita, 0),
      fornitore: scartiFornitore.reduce((acc, m) => acc + m.quantita, 0)
    },
    scarti_evitabili: {
      percentuale: pezziScarti ? Math.round((pezziEvitabili / pezziScarti) * 1000) / 10 : 0,
      euro: round(evitabili.reduce((acc, m) => acc + euro(m), 0))
    },
    per_macchina: db.macchine.map(m => ({ id_macchina: m.id, nome: m.nome, euro: round(perMacchina[m.id] || 0) })).sort((x, y) => y.euro - x.euro),
    per_causale: CAUSALI.map(c => {
      const rows = tuttiScarti.filter(m => m.causale_scarto === c);
      return { causale: c, evitabile: CAUSALI_EVITABILI.includes(c), pezzi: rows.reduce((acc, m) => acc + m.quantita, 0), euro: round(rows.reduce((acc, m) => acc + euro(m), 0)) };
    }),
    per_commessa: Object.entries(perCommessa).map(([k, v]) => {
      const c = k === '_generico' ? null : commessaById(k);
      return { id_commessa: c ? c.id : null, codice: c ? c.codice : null, descrizione: c ? c.descrizione : 'Generico macchina', euro: round(v) };
    }).sort((x, y) => y.euro - x.euro),
    utensili_senza_prezzo: Object.values(MOCK_TOOLS).filter(t => t.prezzo_acquisto == null || t.costo_riaffilatura == null).length
  };
}

// ---------------------------------------------------------------------------
// Scritture (§4)
// ---------------------------------------------------------------------------

function preleva(params) {
  return write(params, 'can_pick_tools', (ctx) => {
    const { p_id_utensile, p_da_luogo, p_da_id_commessa, p_da_id_posizione, p_stato, p_id_macchina, p_id_commessa, p_quantita } = params;
    requireQty(p_quantita);
    const macchina = requireMacchina(p_id_macchina);
    const commessa = requireCommessaAttiva(p_id_commessa);
    const t = toolInfo(p_id_utensile);
    if (!t) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_id_utensile' });

    let sources;
    if (p_da_id_posizione) {
      const p = db.posizioni.find(x => x.id === p_da_id_posizione);
      if (!p) throw new RpcError('POSIZIONE_NON_TROVATA', {});
      sources = [p];
    } else {
      if (!['magazzino', 'cassetto'].includes(p_da_luogo)) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_da_luogo' });
      if (!STATI.includes(p_stato)) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_stato' });
      if (p_da_luogo === 'cassetto' && !p_da_id_commessa) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_da_id_commessa' });
      sources = db.posizioni
        .filter(p => p.id_utensile === p_id_utensile && p.luogo === p_da_luogo && p.stato === p_stato &&
          (p_da_luogo === 'cassetto' ? p.id_commessa === p_da_id_commessa : true))
        .sort((a, b) => a.n_riaffilature - b.n_riaffilature);
    }
    const disponibili = sources.reduce((a, p) => a + p.quantita, 0);
    if (disponibili < p_quantita) throw new RpcError('GIACENZA_INSUFFICIENTE', { disponibili, richiesti: p_quantita });

    let resto = p_quantita;
    let luogoDa = null;
    let statoPreso = null;
    for (const src of sources) {
      if (resto === 0) break;
      const q = Math.min(resto, src.quantita);
      const da = keyOf(src);
      luogoDa = src.luogo;
      statoPreso = src.stato;
      removeQty(src, q);
      const dest = addQty({ ...da, luogo: 'macchina', id_macchina: macchina.id, id_commessa: commessa ? commessa.id : null, id_spedizione: null }, q);
      log(ctx, {
        tool_id: p_id_utensile, tipo_operazione: da.luogo === 'macchina' ? 'spostamento_produzione' : 'prelievo', quantita: q,
        commessa_id: dest.id_commessa, id_macchina: macchina.id, luogo_da: da.luogo, luogo_a: 'macchina',
        stato: da.stato, n_riaffilature: da.n_riaffilature,
        costo_unitario: da.stato === 'nuovo' && da.luogo !== 'macchina' ? t.prezzo_acquisto : null,
        snapshot_da: da, snapshot_a: keyOf(dest)
      });
      resto -= q;
    }
    const origine = luogoDa === 'cassetto' ? `Cassetto ${commessaById(p_da_id_commessa)?.codice ?? ''}` : luogoDa === 'macchina' ? 'altra macchina' : 'Magazzino';
    return {
      quantita: p_quantita,
      riepilogo: `${p_quantita} × ${statoPreso} · ${origine} → ${macchina.nome} · ${commessa ? commessa.codice : 'generico macchina'}`
    };
  });
}

function deposita(params) {
  return write(params, null, (ctx) => {
    const { p_id_utensile, p_quantita, p_stato = 'nuovo', p_id_commessa = null } = params;
    requireQty(p_quantita);
    if (!STATI.includes(p_stato)) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_stato' });
    const t = toolInfo(p_id_utensile);
    if (!t) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_id_utensile' });
    const commessa = requireCommessaAttiva(p_id_commessa);
    const dest = addQty({
      id_utensile: p_id_utensile, luogo: commessa ? 'cassetto' : 'magazzino', stato: p_stato,
      n_riaffilature: p_stato === 'riaffilato' ? 1 : 0, id_commessa: commessa ? commessa.id : null
    }, p_quantita);
    log(ctx, {
      tool_id: p_id_utensile, tipo_operazione: 'deposito', quantita: p_quantita, commessa_id: dest.id_commessa,
      luogo_da: null, luogo_a: dest.luogo, stato: p_stato, n_riaffilature: dest.n_riaffilature,
      costo_unitario: p_stato === 'nuovo' ? t.prezzo_acquisto : null, snapshot_da: null, snapshot_a: keyOf(dest)
    });
    return {};
  });
}

function smonta(params) {
  return write(params, 'can_pick_tools', (ctx) => {
    const { p_id_posizione, p_quantita, p_esito, p_causale = null, p_nota = null, p_dest_id_macchina = null, p_dest_id_commessa = null } = params;
    const p = db.posizioni.find(x => x.id === p_id_posizione);
    if (!p) throw new RpcError('POSIZIONE_NON_TROVATA', {});
    if (p.luogo !== 'macchina') throw new RpcError('DATI_NON_VALIDI', { campo: 'p_id_posizione' });
    requireQty(p_quantita);
    if (!ESITI.includes(p_esito)) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_esito' });
    const t = toolInfo(p.id_utensile) || {};
    const da = keyOf(p);
    let esito = p_esito;
    let causale = p_causale;
    if (esito === 'consumato' && p.n_riaffilature >= (t.max_riaffilature ?? DEFAULT_MAX_RIAFFILATURE)) {
      esito = 'rotto';
      causale = 'usura_limite_riaffilature';
    }
    if (esito === 'rotto' && p_esito === 'rotto' && !CAUSALI_OPERATORE.includes(causale)) {
      throw new RpcError('DATI_NON_VALIDI', { campo: 'p_causale' });
    }
    const base = { tool_id: p.id_utensile, quantita: p_quantita, commessa_id: p.id_commessa, id_macchina: p.id_macchina, luogo_da: 'macchina', stato: p.stato, n_riaffilature: p.n_riaffilature, nota: p_nota, snapshot_da: da };

    let destinazione = null;
    if (esito === 'consumato') {
      removeQty(p, p_quantita);
      const dest = addQty({ ...da, luogo: 'cestello', id_macchina: null }, p_quantita, { _macchina_origine: da.id_macchina });
      log(ctx, { ...base, tipo_operazione: 'smontaggio_cestello', luogo_a: 'cestello', snapshot_a: keyOf(dest) });
      destinazione = { luogo: 'cestello', id_macchina: null, nome_macchina: null, codice_commessa: commessaById(da.id_commessa)?.codice ?? null, ubicazione: null };
    } else if (esito === 'rotto') {
      removeQty(p, p_quantita);
      log(ctx, { ...base, tipo_operazione: 'smontaggio_scarto', luogo_a: null, causale_scarto: causale, costo_unitario: t.prezzo_acquisto ?? null, snapshot_a: null });
    } else if (esito === 'buono') {
      const c = commessaById(da.id_commessa);
      const toCassetto = c && c.stato === 'Attiva';
      removeQty(p, p_quantita);
      const dest = addQty({ ...da, luogo: toCassetto ? 'cassetto' : 'magazzino', stato: 'usato', id_macchina: null, id_commessa: toCassetto ? c.id : null }, p_quantita);
      log(ctx, { ...base, tipo_operazione: 'smontaggio_rientro', luogo_a: dest.luogo, snapshot_a: keyOf(dest) });
      destinazione = { luogo: dest.luogo, id_macchina: null, nome_macchina: null, codice_commessa: toCassetto ? c.codice : null, ubicazione: toCassetto ? c.ubicazione : (t.ubicazione ?? null) };
    } else {
      const m = requireMacchina(p_dest_id_macchina);
      const c = requireCommessaAttiva(p_dest_id_commessa);
      removeQty(p, p_quantita);
      const dest = addQty({ ...da, id_macchina: m.id, id_commessa: c ? c.id : null }, p_quantita);
      log(ctx, { ...base, tipo_operazione: 'spostamento_produzione', luogo_a: 'macchina', id_macchina: m.id, commessa_id: dest.id_commessa, snapshot_a: keyOf(dest) });
      destinazione = { luogo: 'macchina', id_macchina: m.id, nome_macchina: m.nome, codice_commessa: c ? c.codice : null, ubicazione: null };
    }
    return { esito_effettivo: esito, causale_effettiva: esito === 'rotto' ? causale : null, destinazione };
  });
}

function spedisci_cestello(params) {
  return write(params, 'can_manage_riaffilature', (ctx) => {
    const { p_ddt = null, p_fornitore = null, p_id_posizioni = null } = params;
    const posizioni = db.posizioni.filter(p => p.luogo === 'cestello' && (!p_id_posizioni || p_id_posizioni.includes(p.id)));
    if (posizioni.length === 0) throw new RpcError('DATI_NON_VALIDI', { campo: 'cestello' });
    const sped = {
      id: `sped-${db.seq++}`, ddt: p_ddt, fornitore: p_fornitore, stato: 'in_viaggio',
      data_invio: nowIso(), data_rientro: null, operatore_invio: ctx.operatore.nome, operatore_rientro: null
    };
    db.spedizioni.push(sped);
    let pezzi = 0;
    posizioni.forEach(p => {
      const da = keyOf(p);
      const q = p.quantita;
      const origine = p._macchina_origine;
      removeQty(p, q);
      const dest = addQty({ ...da, luogo: 'fornitore', id_spedizione: sped.id }, q, { _macchina_origine: origine });
      log(ctx, { tool_id: da.id_utensile, tipo_operazione: 'spedizione_riaffilatura', quantita: q, commessa_id: da.id_commessa, luogo_da: 'cestello', luogo_a: 'fornitore', stato: da.stato, n_riaffilature: da.n_riaffilature, id_spedizione: sped.id, snapshot_da: da, snapshot_a: keyOf(dest) });
      pezzi += q;
    });
    return { id_spedizione: sped.id, pezzi };
  });
}

function aggiorna_ddt({ p_id_spedizione, p_ddt, p_fornitore = null, p_id_operatore }) {
  requireFlag(operatorOf(p_id_operatore), 'can_manage_riaffilature');
  const s = db.spedizioni.find(x => x.id === p_id_spedizione);
  if (!s) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_id_spedizione' });
  s.ddt = p_ddt || null;
  if (p_fornitore !== null) s.fornitore = p_fornitore;
  return { ok: true };
}

function rientra_spedizione(params) {
  return write(params, 'can_manage_riaffilature', (ctx) => {
    const { p_id_spedizione, p_righe } = params;
    const sped = db.spedizioni.find(s => s.id === p_id_spedizione);
    if (!sped || sped.stato !== 'in_viaggio') throw new RpcError('DATI_NON_VALIDI', { campo: 'p_id_spedizione' });
    const posizioni = db.posizioni.filter(p => p.luogo === 'fornitore' && p.id_spedizione === sped.id);
    const righe = Array.isArray(p_righe) ? p_righe : [];
    if (righe.length !== posizioni.length || posizioni.some(p => !righe.find(r => r.id_posizione === p.id))) {
      throw new RpcError('DATI_NON_VALIDI', { campo: 'p_righe' });
    }
    let buoni = 0;
    let scartati = 0;
    posizioni.forEach(p => {
      const r = righe.find(x => x.id_posizione === p.id);
      const sc = Number(r.scartati) || 0;
      if (!Number.isInteger(sc) || sc < 0 || sc > p.quantita) throw new RpcError('DATI_NON_VALIDI', { campo: 'scartati' });
      const luogo = r.destinazione?.luogo;
      if (!['magazzino', 'cassetto'].includes(luogo)) throw new RpcError('DATI_NON_VALIDI', { campo: 'destinazione' });
      const commessa = luogo === 'cassetto' ? requireCommessaAttiva(r.destinazione.id_commessa) : null;
      if (luogo === 'cassetto' && !commessa) throw new RpcError('DATI_NON_VALIDI', { campo: 'destinazione' });
      const t = toolInfo(p.id_utensile) || {};
      const da = keyOf(p);
      const sani = p.quantita - sc;
      removeQty(p, p.quantita);
      const base = { tool_id: da.id_utensile, commessa_id: da.id_commessa, luogo_da: 'fornitore', stato: da.stato, n_riaffilature: da.n_riaffilature, id_spedizione: sped.id, snapshot_da: da };
      if (sani > 0) {
        const dest = addQty({ id_utensile: da.id_utensile, luogo, stato: 'riaffilato', n_riaffilature: da.n_riaffilature + 1, id_commessa: commessa ? commessa.id : null }, sani);
        log(ctx, { ...base, tipo_operazione: 'rientro_riaffilatura', quantita: sani, luogo_a: luogo, costo_unitario: t.costo_riaffilatura ?? null, snapshot_a: keyOf(dest) });
      }
      if (sc > 0) {
        log(ctx, { ...base, tipo_operazione: 'scarto_fornitore', quantita: sc, luogo_a: null, causale_scarto: 'scarto_fornitore', costo_unitario: t.prezzo_acquisto ?? null, snapshot_a: null });
      }
      buoni += sani;
      scartati += sc;
    });
    sped.stato = 'rientrata';
    sped.data_rientro = nowIso();
    sped.operatore_rientro = ctx.operatore.nome;
    return { buoni, scartati };
  });
}

function annulla_operazione({ p_id_operazione_originale, p_id_operatore }) {
  const operatore = operatorOf(p_id_operatore);
  const rows = db.movimenti.filter(m => m.id_operazione === p_id_operazione_originale && m.tipo_operazione !== 'annullo');
  if (!p_id_operazione_originale || rows.length === 0) throw new RpcError('DATI_NON_VALIDI', { campo: 'p_id_operazione_originale' });
  if (db.annullate[p_id_operazione_originale]) throw new RpcError('ANNULLO_NON_POSSIBILE', { motivo: 'gia_annullata' });
  const isRientro = rows.some(m => m.tipo_operazione === 'rientro_riaffilatura' || m.tipo_operazione === 'scarto_fornitore');
  const eta = Date.now() - new Date(rows[0].created_at).getTime();
  if (!isRientro && eta > UNDO_WINDOW_MS) throw new RpcError('ANNULLO_NON_POSSIBILE', { motivo: 'tempo_scaduto' });

  const backup = clone(db);
  const nuovoId = `annullo-${db.seq++}`;
  try {
    [...rows].reverse().forEach(m => {
      if (m.snapshot_a) {
        const p = db.posizioni.find(x => sameKey(x, m.snapshot_a));
        if (!p || p.quantita < m.quantita) throw new RpcError('ANNULLO_NON_POSSIBILE', { motivo: 'pezzi_spostati' });
        removeQty(p, m.quantita);
      }
      if (m.snapshot_da) addQty(m.snapshot_da, m.quantita);
      db.movimenti.push(movementRow(db, {
        id_operazione: nuovoId, tool_id: m.tool_id, tipo_operazione: 'annullo', quantita: m.quantita,
        operatore: operatore.nome, _operatore_id: p_id_operatore, commessa_id: m.commessa_id, id_macchina: m.id_macchina,
        luogo_da: m.luogo_a, luogo_a: m.luogo_da, stato: m.stato, n_riaffilature: m.n_riaffilature, id_spedizione: m.id_spedizione,
        nota: `Annullo di ${p_id_operazione_originale}`, snapshot_da: m.snapshot_a, snapshot_a: m.snapshot_da, created_at: nowIso()
      }));
    });
    const spedIds = [...new Set(rows.map(m => m.id_spedizione).filter(Boolean))];
    spedIds.forEach(id => {
      const s = db.spedizioni.find(x => x.id === id);
      if (!s) return;
      if (isRientro) {
        s.stato = 'in_viaggio';
        s.data_rientro = null;
        s.operatore_rientro = null;
      } else if (!db.posizioni.some(p => p.id_spedizione === id)) {
        db.spedizioni = db.spedizioni.filter(x => x.id !== id);
      }
    });
    db.annullate[p_id_operazione_originale] = nuovoId;
  } catch (err) {
    db = backup;
    throw err;
  }
  return { ok: true, id_operazione: nuovoId };
}

// Commesse attive per la ricerca "Cerca…" (in produzione è una lettura diretta della tabella commesse).
export function mockListCommesseAttive() {
  return clone(db.commesse.filter(c => c.stato === 'Attiva').map(({ id, codice, descrizione, ubicazione }) => ({ id, codice, descrizione, ubicazione })));
}

// ---------------------------------------------------------------------------
// Punto d'ingresso: stessa forma di supabase.rpc()
// ---------------------------------------------------------------------------

const HANDLERS = {
  get_opzioni_prelievo, get_in_produzione, get_riaffilature, get_opzioni_deposito, get_dashboard_stats,
  preleva, deposita, smonta, spedisci_cestello, aggiorna_ddt, rientra_spedizione, annulla_operazione
};

export async function mockRpc(name, params = {}, { latencyMs = 250 } = {}) {
  if (latencyMs) await new Promise(res => setTimeout(res, latencyMs));
  const fn = HANDLERS[name];
  if (!fn) return { data: null, error: { code: 'PGRST202', message: `Funzione ${name} non trovata`, details: null } };
  try {
    return { data: clone(fn(params)), error: null };
  } catch (err) {
    if (err instanceof RpcError) {
      return { data: null, error: { code: 'P0001', message: err.codice, details: JSON.stringify(err.detail) } };
    }
    return { data: null, error: { code: 'MOCK', message: err.message, details: null } };
  }
}
