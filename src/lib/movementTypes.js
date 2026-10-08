// Come mostrare ogni tipo_operazione di movements_history (contratto §2.8, domanda D1).
// `direzione` è rispetto alla giacenza di magazzino ("Quantità"):
//   'in'      → entra in magazzino/cassetto (verde, +N)
//   'out'     → esce dal magazzino o dal sistema (rosso, −N)
//   'interno' → si sposta fuori dal magazzino, la giacenza non cambia (blu, N)
const TIPI = {
  carico: { label: 'Deposito', dettaglio: 'Movimento di Deposito', direzione: 'in' },
  deposito: { label: 'Deposito', dettaglio: 'Deposito in magazzino', direzione: 'in' },
  smontaggio_rientro: { label: 'Rientro', dettaglio: 'Rientrato dalla macchina', direzione: 'in' },
  rientro_riaffilatura: { label: 'Riaffilato', dettaglio: 'Rientrato dalla riaffilatura', direzione: 'in' },

  scarico: { label: 'Prelievo', dettaglio: 'Movimento di Prelievo', direzione: 'out' },
  prelievo: { label: 'Prelievo', dettaglio: 'Prelevato verso la macchina', direzione: 'out' },
  smontaggio_scarto: { label: 'Scarto', dettaglio: 'Scartato in reparto', direzione: 'out' },
  scarto_fornitore: { label: 'Scarto', dettaglio: 'Scartato dal fornitore', direzione: 'out' },

  spostamento: { label: 'Spostamento', dettaglio: 'Spostato nel cassetto commessa', direzione: 'interno' },
  spostamento_produzione: { label: 'Spostamento', dettaglio: 'Spostato tra macchine o commesse', direzione: 'interno' },
  smontaggio_cestello: { label: 'Cestello', dettaglio: 'Smontato, nel cestello da riaffilare', direzione: 'interno' },
  spedizione_riaffilatura: { label: 'Spedito', dettaglio: 'Spedito in riaffilatura', direzione: 'interno' },
  annullo: { label: 'Annullo', dettaglio: 'Operazione annullata', direzione: 'interno' },
  creazione: { label: 'Creazione', dettaglio: 'Creazione nuovo articolo', direzione: 'creazione' },
  creazione_utensile: { label: 'Creazione', dettaglio: 'Creazione nuovo articolo', direzione: 'creazione' },
  modifica: { label: 'Modifica', dettaglio: 'Modifica anagrafica articolo', direzione: 'modifica' },
  modifica_utensile: { label: 'Modifica', dettaglio: 'Modifica anagrafica articolo', direzione: 'modifica' }
};

const STILE = {
  in: { badge: 'badge-emerald', text: 'text-accent-emerald', segno: '+' },
  out: { badge: 'badge-rose', text: 'text-accent-rose', segno: '-' },
  interno: { badge: 'badge-blue', text: 'text-accent-blue', segno: '' },
  creazione: { badge: 'badge-emerald', text: 'text-accent-emerald', segno: '+' },
  modifica: { badge: 'badge-orange', text: 'text-orange-500 dark:text-orange-400', segno: '' }
};

export function getMovementMeta(tipo) {
  const base = TIPI[tipo] || { label: tipo || '—', dettaglio: 'Movimento', direzione: 'interno' };
  return { ...base, ...STILE[base.direzione] };
}

export function formatMovementQty(tipo, quantita) {
  const meta = getMovementMeta(tipo);
  const q = quantita ?? 0;
  if (tipo === 'modifica' || tipo === 'modifica_utensile') {
    return `${q}`;
  }
  if (tipo === 'creazione' || tipo === 'creazione_utensile') {
    return q > 0 ? `+${q}` : `${q}`;
  }
  return `${meta.segno}${q}`;
}
