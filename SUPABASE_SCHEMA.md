# SUPABASE_SCHEMA

## Struttura del Database (Aggiornata Fase 1 - Ciclo di Vita Utensili)

Questo documento descrive le principali tabelle e le loro relazioni, aggiornate secondo il contratto `CONTRACT_LIFECYCLE.md` (Fase 1).

### `Utensili_B1` (Catalogo)
- **Campi aggiunti in Fase 1:** `prezzo_acquisto` (NUMERIC), `costo_riaffilatura` (NUMERIC), `max_riaffilature` (INT default 3).
- **Quantità:** Mantenuta e aggiornata tramite trigger (`update_utensili_quantita_from_posizioni`), come somma delle posizioni in `magazzino` e `cassetto`.
- (Oltre a `tipologia`, `forma`, `diametro`, `codice`, `fornitore`, `quantita`, ecc.)

### `macchine_cnc` (Nuova)
- `id` (UUID PK)
- `nome` (TEXT, unique)
- `reparto` (TEXT)
- `ordine` (INT)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)

### `spedizioni_riaffilatura` (Nuova)
- `id` (UUID PK)
- `ddt` (TEXT)
- `fornitore` (TEXT)
- `stato` (TEXT, check in `in_viaggio`, `rientrata`)
- `data_invio` (TIMESTAMPTZ)
- `data_rientro` (TIMESTAMPTZ)
- `operatore_invio` (TEXT), `operatore_rientro` (TEXT)

### `posizioni_utensile` (Nuova - Cuore del sistema)
Gestisce dove si trova fisicamente un utensile.
- `id` (UUID PK)
- `id_utensile` (UUID FK su `Utensili_B1`)
- `luogo` (TEXT enum: `magazzino`, `cassetto`, `macchina`, `cestello`, `fornitore`)
- `stato` (TEXT enum: `nuovo`, `usato`, `riaffilato`)
- `n_riaffilature` (INT default 0)
- `id_commessa` (UUID FK su `commesse`)
- `id_macchina` (UUID FK su `macchine_cnc`)
- `id_spedizione` (UUID FK su `spedizioni_riaffilatura`)
- `quantita` (INT check > 0)
- `entrata_il` (TIMESTAMPTZ), `aggiornato_il` (TIMESTAMPTZ)
- **Vincoli:** `id_macchina` è obbligatorio se `luogo='macchina'`, `id_commessa` se `luogo='cassetto'`, ecc.

### `movements_history` (Storico Movimenti, Aggiornata)
- **Campi aggiunti in Fase 1:** `id_operazione` (UUID, gestisce idempotenza), `id_macchina`, `luogo_da`, `luogo_a`, `stato`, `n_riaffilature`, `id_spedizione`, `causale_scarto`, `nota`, `costo_unitario`, `snapshot_da`, `snapshot_a`.
- **Indice non unico:** `(id_operazione)` (contratto v1.2, rimossa unicità per ammettere prelievi e spedizioni da più mucchietti dello stesso utensile).

### `utenti` (Aggiornata)
- **Campi aggiunti in Fase 1 (Permessi):** `can_view_dashboard`, `can_manage_catalog`, `can_manage_riaffilature` (default false), `can_pick_tools` (default true). Gli Admin ottengono tutti i permessi true.

### `commesse` (Aggiornata)
Nessuna nuova colonna aggiunta. `ubicazione` continua a indicare l'indirizzo del cassetto.

### `ordini` (Aggiornata)
- **Campi aggiunti in Fase 1:** `commessa_id` (UUID FK su `commesse`).

### Trigger
- `trg_update_utensili_quantita` su `posizioni_utensile` che tiene allineato il campo `Utensili_B1."Quantità"`.

### Legacy
- `giacenze_commesse` rinominata in `giacenze_commesse_legacy` dopo la migrazione dati in Fase 1.

## RPC (Aggiunte in Fase 2 e 3)
### Letture
- `get_opzioni_prelievo(p_id_utensile, p_id_operatore) -> json`
- `get_in_produzione() -> json`
- `get_opzioni_deposito(p_id_utensile) -> json`
- `get_riaffilature(p_giorni_storico) -> json`

### Scritture
- `preleva(p_id_operazione, p_id_operatore, p_id_utensile, p_da_luogo, p_da_id_commessa, p_da_id_posizione, p_stato, p_id_macchina, p_id_commessa, p_quantita) -> json`
- `deposita(p_id_operazione, p_id_operatore, p_id_utensile, p_quantita, p_stato, p_id_commessa, p_id_ordine) -> json`
- `smonta(p_id_operazione, p_id_operatore, p_id_posizione, p_quantita, p_esito, p_causale, p_nota, p_dest_id_macchina, p_dest_id_commessa) -> json`
- `annulla_operazione(p_id_operazione_originale, p_id_operatore) -> json`
- `spedisci_cestello(p_id_operazione, p_id_operatore, p_ddt, p_fornitore, p_id_posizioni) -> json`
- `aggiorna_ddt(p_id_spedizione, p_ddt, p_fornitore, p_id_operatore) -> json`
- `rientra_spedizione(p_id_operazione, p_id_operatore, p_id_spedizione, p_righe) -> json`

### Aggiunte in Fase 4 (Dashboard, Realtime, Legacy)
- **Realtime**: Le tabelle `posizioni_utensile`, `spedizioni_riaffilatura` e `macchine_cnc` sono aggiunte alla publication `supabase_realtime`.
- **RPC `get_dashboard_stats(p_da, p_a, p_id_operatore)`**:
  - Legge i movimenti in `movements_history` aggregando spesa, risparmi e scarti nel periodo.
  - Ritorna `json` coi totali raggruppati per macchine, commesse e causali.
  - Verifica il permesso `can_view_dashboard`.
- **Compatibilità Legacy (`handle_bulk_movement` / `handle_multi_movement`)**:
  - Riscritte per inserire/modificare righe in `posizioni_utensile`.
  - Mappano logicamente `carico`, `scarico` e `spostamento` nel nuovo sistema basato su luoghi e stati (`magazzino`, `cassetto`, `nuovo`, ecc.) preservando i tipi stringa storici e garantendo l'allineamento di `Quantità` tramite il nuovo trigger.
