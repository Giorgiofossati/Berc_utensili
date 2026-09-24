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
  annullo: { label: 'Annullo', dettaglio: 'Operazione annullata', direzione: 'interno' }
};

const STILE = {
  in: { badge: 'badge-emerald', text: 'text-accent-emerald', segno: '+' },
  out: { badge: 'badge-rose', text: 'text-accent-rose', segno: '-' },
  interno: { badge: 'badge-blue', text: 'text-accent-blue', segno: '' }
};

export function getMovementMeta(tipo) {
  const base = TIPI[tipo] || { label: tipo || '—', dettaglio: 'Movimento', direzione: 'interno' };
  return { ...base, ...STILE[base.direzione] };
}

export function formatMovementQty(tipo, quantita) {
  const { segno } = getMovementMeta(tipo);
  return `${segno}${quantita ?? 0}`;
}
