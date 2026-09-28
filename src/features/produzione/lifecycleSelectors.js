// Logica di presentazione del ciclo di vita: funzioni pure sui dati del contratto
// (docs/CONTRACT_LIFECYCLE.md §3). Nessuna chiamata di rete, nessuno stato.

// Ordine di consiglio nel prelievo: prima ciò che è già pagato e ancora buono.
export const ORDINE_STATI = ['usato', 'riaffilato', 'nuovo'];

export const ETICHETTE_STATO = { nuovo: 'Nuovo', usato: 'Usato', riaffilato: 'Riaffilato' };

export const CAUSALI_OPERATORE = [
  { id: 'usura', label: 'Usura', hint: 'Fine vita naturale' },
  { id: 'collisione', label: 'Collisione', hint: 'Urto in macchina' }
];

export const ETICHETTE_CAUSALE = {
  usura: 'Usura',
  collisione: 'Collisione',
  rottura_lavorazione: 'Rottura in lavorazione',
  parametri_programma: 'Parametri / programma',
  altro: 'Altro',
  usura_limite_riaffilature: 'Usura (limite riaffilature)',
  scarto_fornitore: 'Scartato dal fornitore'
};

// ---------------------------------------------------------------------------
// Prelievo guidato
// ---------------------------------------------------------------------------

// Pezzi disponibili per stato in una sorgente ({ luogo, id_commessa }).
export function contaPerStato(disponibilita = [], sorgente) {
  const conteggi = { nuovo: 0, usato: 0, riaffilato: 0 };
  disponibilita.forEach(d => {
    if (d.luogo !== sorgente.luogo) return;
    if (sorgente.luogo === 'cassetto' && d.id_commessa !== sorgente.id_commessa) return;
    conteggi[d.stato] += d.quantita;
  });
  return conteggi;
}

export function statoConsigliato(conteggi) {
  return ORDINE_STATI.find(s => conteggi[s] > 0) || null;
}

// Se la commessa ha un cassetto con pezzi di questo utensile si parte da lì,
// altrimenti dal magazzino generale.
export function sorgentePredefinita(disponibilita = [], idCommessa) {
  if (idCommessa && disponibilita.some(d => d.luogo === 'cassetto' && d.id_commessa === idCommessa && d.quantita > 0)) {
    return { luogo: 'cassetto', id_commessa: idCommessa };
  }
  return { luogo: 'magazzino', id_commessa: null };
}

export function haCassetto(disponibilita = [], idCommessa) {
  return !!idCommessa && disponibilita.some(d => d.luogo === 'cassetto' && d.id_commessa === idCommessa && d.quantita > 0);
}

// La commessa più recente sulla macchina è preselezionata solo se "fresca" (≤ 72h, deciso dal backend).
export function commessaPreselezionata(opzioni, idMacchina) {
  const lista = opzioni?.commesse_per_macchina?.[idMacchina] || [];
  return lista[0]?.fresca ? lista[0].id : null;
}

// Macchina proposta: l'ultima usata dall'operatore (la lista arriva già ordinata).
export function macchinaPreselezionata(opzioni) {
  const prima = opzioni?.macchine?.[0];
  return prima?.ultimo_uso_operatore ? prima.id : null;
}

export function etichettaSorgente(disponibilita = [], sorgente, ubicazioneUtensile) {
  if (sorgente.luogo === 'cassetto') {
    const riga = disponibilita.find(d => d.luogo === 'cassetto' && d.id_commessa === sorgente.id_commessa);
    return {
      titolo: `Cassetto ${riga?.codice_commessa ?? ''}`.trim(),
      dettaglio: `${riga?.ubicazione ? riga.ubicazione + ' · ' : ''}riservati alla commessa`
    };
  }
  return { titolo: 'Magazzino generale', dettaglio: `${ubicazioneUtensile ? ubicazioneUtensile + ' · ' : ''}scorta comune` };
}

// ---------------------------------------------------------------------------
// In produzione
// ---------------------------------------------------------------------------

const GENERICO = '__generico__';

// modo 'macchina': gruppi = macchine, sezioni = commesse (i cassetti non compaiono).
// modo 'commessa': gruppi = commesse, sezioni = macchine + "nel cassetto" in fondo.
export function raggruppaInProduzione(righe = [], modo = 'macchina') {
  const perMacchina = modo === 'macchina';
  const gruppi = new Map();

  righe
    .filter(r => (perMacchina ? r.luogo === 'macchina' : true))
    .forEach(r => {
      const chiaveGruppo = perMacchina ? r.id_macchina : (r.id_commessa || GENERICO);
      if (!gruppi.has(chiaveGruppo)) {
        gruppi.set(chiaveGruppo, {
          chiave: chiaveGruppo,
          titolo: perMacchina ? r.nome_macchina : (r.id_commessa ? `${r.codice_commessa} ${r.descrizione_commessa ?? ''}`.trim() : 'Generico macchina'),
          codiceCommessa: perMacchina ? null : r.codice_commessa,
          ubicazioneCassetto: perMacchina ? null : r.ubicazione_cassetto,
          totale: 0,
          sezioni: new Map()
        });
      }
      const g = gruppi.get(chiaveGruppo);
      g.totale += r.quantita;

      const isCassetto = r.luogo === 'cassetto';
      const chiaveSezione = isCassetto ? '__cassetto__' : (perMacchina ? (r.id_commessa || GENERICO) : r.id_macchina);
      if (!g.sezioni.has(chiaveSezione)) {
        g.sezioni.set(chiaveSezione, {
          chiave: chiaveSezione,
          isCassetto,
          titolo: isCassetto
            ? 'Nel cassetto della commessa'
            : perMacchina
              ? (r.id_commessa ? `${r.codice_commessa} ${r.descrizione_commessa ?? ''}`.trim() : 'Generico macchina')
              : r.nome_macchina,
          dettaglio: isCassetto ? `${r.ubicazione_cassetto ? r.ubicazione_cassetto + ' · ' : ''}riservati, non ancora in macchina` : (perMacchina ? null : 'in macchina'),
          righe: []
        });
      }
      g.sezioni.get(chiaveSezione).righe.push(r);
    });

  return [...gruppi.values()]
    .map(g => ({
      ...g,
      sottotitolo: [...g.sezioni.values()].map(s => (s.isCassetto ? 'cassetto' : s.titolo)).join(' · '),
      sezioni: [...g.sezioni.values()].sort((a, b) => Number(a.isCassetto) - Number(b.isCassetto))
    }))
    .sort((a, b) => (a.titolo || '').localeCompare(b.titolo || '', 'it', { numeric: true }));
}

// Cosa succede se l'operatore sceglie "Consumato" su questa riga.
export function anteprimaConsumato(riga) {
  const max = riga.max_riaffilature ?? 3;
  if (riga.n_riaffilature >= max) {
    return { finisceNegliScarti: true, testo: `Ha già ${riga.n_riaffilature} riaffilature: finisce negli scarti per usura` };
  }
  const prossima = riga.n_riaffilature + 1;
  return { finisceNegliScarti: false, testo: `Cestello rosso · sarà la ${prossima}ª riaffilatura${prossima >= max ? ' (ultima)' : ''}` };
}

export function anteprimaBuono(riga) {
  return riga.id_commessa
    ? `Torna nel cassetto ${riga.codice_commessa} come usato`
    : 'Torna a magazzino come usato';
}

export function etichettaCiclo(riga) {
  if (!riga.n_riaffilature) return null;
  const ultima = riga.n_riaffilature >= (riga.max_riaffilature ?? 3);
  return { testo: `${riga.n_riaffilature}ª riaff.${ultima ? ' · ultima' : ''}`, ultima };
}

// ---------------------------------------------------------------------------
// Riaffilature
// ---------------------------------------------------------------------------

// Parametro p_righe predefinito per rientra_spedizione: tutto sano, al posto di sempre.
export function righeRientroPredefinite(spedizione) {
  return (spedizione?.righe || []).map(r => ({
    id_posizione: r.id_posizione,
    scartati: 0,
    destinazione: r.id_commessa && r.commessa_attiva
      ? { luogo: 'cassetto', id_commessa: r.id_commessa }
      : { luogo: 'magazzino', id_commessa: null }
  }));
}

export function giorniDa(iso, adesso = Date.now()) {
  if (!iso) return null;
  return Math.max(0, Math.floor((adesso - new Date(iso).getTime()) / 86400000));
}

// "oggi", "ieri", "5 gg fa", "3 sett fa"
export function etaBreve(iso, adesso = Date.now()) {
  const g = giorniDa(iso, adesso);
  if (g == null) return '';
  if (g === 0) return 'oggi';
  if (g === 1) return 'ieri';
  if (g < 14) return `${g} gg fa`;
  return `${Math.floor(g / 7)} sett fa`;
}

// Permessi lato interfaccia (contratto §5): il flag se c'è, altrimenti il ruolo.
// Serve solo a non mostrare azioni inutili: il controllo vero è nelle RPC.
export function puo(utente, flag) {
  if (!utente) return false;
  if (typeof utente[flag] === 'boolean') return utente[flag];
  return flag === 'can_pick_tools' ? true : utente.ruolo === 'Admin';
}

export function formatDataBreve(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}
