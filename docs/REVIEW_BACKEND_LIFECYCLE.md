# Revisione backend Ciclo di Vita — rispetto al contratto v1.1

> **Revisore**: Claude · **Data**: 2026-09-24 · **Oggetto**: `supabase/migrations/20260924_lifecycle_{1,2,3,4}_*.sql`, `supabase/tests/lifecycle_fase{2,3,4}.sql`
>
> **Esito: NON applicare in produzione.** L'impianto è quello giusto (tabelle, vincoli, idempotenza, trigger, migrazione con verifica), ma ci sono errori che impediscono alle migration di girare o che corromperebbero i dati. I test SQL non possono essere stati eseguiti con successo (vedi B1, B2, B3).

---

## A. Bloccanti — le migration non girano o si rompono al primo uso reale

| # | Dove | Problema | Correzione |
|---|---|---|---|
| **A1** | `lifecycle_2_rpc_base.sql` righe 1-3 | Il file inizia con `import os` / `sql = """`: è uno script Python salvato come `.sql`. Nell'SQL Editor fallisce subito. | Togliere le prime 3 righe. |
| **A2** | lifecycle_2 (tutte le RPC di lettura), lifecycle_3 (`get_riaffilature`) | Colonne inesistenti di `Utensili_B1`: `u.codice`, `u.descrizione`, `u.ubicazione`, `u."Descrizione"`. I nomi reali sono `"Codice"`, `"Descrizione Originale"`, `"Ubicazione"` (vedi `get_tools_catalog` nella migration 20260923). | Usare i nomi reali tra virgolette. |
| **A3** | lifecycle_2 `get_opzioni_deposito` e `deposita` | Colonne inesistenti di `ordini`: `o.quantita` e `o.created_at`. I nomi reali sono `quantita_richiesta` e `data_ordine`. | Correggere entrambe. |
| **A4** | `preleva`, `smonta`, `annulla_operazione` | `UPDATE … SET quantita = quantita - x` seguito da `DELETE` se arriva a 0: l'UPDATE a 0 **viola `CHECK (quantita > 0)`** prima del DELETE. Qualunque prelievo o smontaggio che svuota una posizione (cioè quasi tutti) va in errore. | Come già fatto bene in `handle_multi_movement`: `IF quantita = x THEN DELETE ELSE UPDATE`. |
| **A5** | lifecycle_1, indice unico `idx_movements_history_id_operazione_parziale` | L'indice `(id_operazione, tool_id, luogo_da, luogo_a)` blocca operazioni legittime che scrivono più righe con la stessa chiave: prelievo che prende da due mucchietti con `n_riaffilature` diverso, spedizione di un cestello con due mucchietti dello stesso utensile, rientro di due righe dello stesso utensile. Il test fase 3 crea proprio questo caso (usato n=0 e n=1 dello stesso utensile). *L'errore nasce dal contratto (§2.8 suggeriva l'indice): è mio.* | Eliminare l'indice. L'idempotenza è già garantita dal controllo iniziale `EXISTS … id_operazione`. Aggiornerò il contratto. |
| **A6** | lifecycle_4 `handle_multi_movement` (carico e spostamento) | `ON CONFLICT (…, COALESCE(id_commessa, '0000…'), …)` non corrisponde a nessun indice (quello unico è sulle colonne semplici con `NULLS NOT DISTINCT`): *"there is no unique or exclusion constraint matching the ON CONFLICT specification"*. **Il deposito dell'app attuale in produzione smetterebbe di funzionare.** | Usare la stessa lista di colonne di `preleva`: `ON CONFLICT (id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)`. |
| **A7** | lifecycle_3 (tutte le funzioni) | `RAISE EXCEPTION 'DATI_NON_VALIDI' USING ERRCODE='P0001', MESSAGE='{…}'`: messaggio indicato due volte (*"RAISE option already specified: MESSAGE"*). Inoltre il JSON va in `MESSAGE` invece che in `DETAIL`, e la UI leggerebbe `{"campo":…}` come codice d'errore. | Usare la forma di lifecycle_2: `RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='DATI_NON_VALIDI', DETAIL='{"campo":"…"}'`. Stesso trattamento per `PERMESSO_NEGATO` (con `DETAIL='{"permesso":"…"}'`). |
| **A8** | lifecycle_3 `get_riaffilature` | `ORDER BY sr.data_invio` fuori da `jsonb_agg` in una query di aggregazione: errore *"must appear in the GROUP BY clause"*. | `jsonb_agg(… ORDER BY sr.data_invio)`. |
| **A9** | lifecycle_3 `rientra_spedizione` | Il rientro fa `UPDATE` della posizione in viaggio verso `magazzino`/`cassetto`, `riaffilato`, `n+1`. Se esiste già un mucchietto con la stessa chiave (caso normale: in magazzino ci sono già riaffilati n=1 di quell'utensile), l'UPDATE viola l'indice unico. | Togliere la posizione dal fornitore (DELETE) e fare **upsert** nella destinazione con `ON CONFLICT … DO UPDATE SET quantita = quantita + EXCLUDED.quantita`, come in `preleva`. Lo `snapshot_a` deve riferirsi alla riga di destinazione. |

## B. Gravi — girano ma producono dati o permessi sbagliati

| # | Dove | Problema | Correzione |
|---|---|---|---|
| **B1** | lifecycle_2 `check_permesso` | `IF NOT v_has_permesso` con `NULL` (flag nullo o **operatore inesistente**) non entra nell'IF: **il permesso viene concesso**. Un id operatore sbagliato passa tutti i controlli di `preleva` e `smonta`. | `IF NOT COALESCE(v_has_permesso, false)` (come in lifecycle_3/4). Colonne flag `NOT NULL`. |
| **B2** | lifecycle_4 `get_dashboard_stats` | Gli scarti sono filtrati con `luogo_a IS NULL`: **tutto lo storico precedente alla migrazione** (carichi e scarichi, dove `luogo_a` non esiste) e ogni `scarico` legacy verrebbero contati come scarti. Il 31% "evitabili" e i pezzi scartati sarebbero falsi fin dal primo giorno. | Filtrare per tipo: `tipo_operazione IN ('smontaggio_scarto','scarto_fornitore')`. |
| **B3** | lifecycle_2 `smonta` esito `buono` | Registrato con `tipo_operazione = 'scarico'` invece di `smontaggio_rientro`. Nello storico un rientro in magazzino appare come **uscita** e sfalsa i totali (D1). | `'smontaggio_rientro'`. |
| **B4** | lifecycle_3 | Nomi di `tipo_operazione` diversi dal contratto §2.8: `spedizione_cestello` al posto di `spedizione_riaffilatura`, e gli scarti del fornitore come `scarico` al posto di `scarto_fornitore`. Storico e dashboard (A/B2) dipendono da questi nomi. | Usare esattamente i nomi del contratto. |
| **B5** | lifecycle_3 `get_riaffilature` | `commessa_attiva = c.stato != 'chiusa'`: il valore reale è `'Chiusa'` (maiuscola), quindi una commessa chiusa risulta attiva e la UI proporrebbe un cassetto non valido. | `c.stato = 'Attiva'`. |
| **B6** | lifecycle_2 `smonta` esito `rotto` | `p_causale` non è obbligatoria: si possono registrare scarti senza motivo, e la dashboard perde proprio il dato per cui esiste. | Se `p_esito = 'rotto'` e causale nulla o non tra le 5 causali operatore → `DATI_NON_VALIDI {"campo":"p_causale"}`. |
| **B7** | lifecycle_2 `annulla_operazione` | Non controlla se l'operazione è già stata annullata: un doppio tocco su "Annulla" (o un retry dopo un errore di rete) **annulla due volte** e duplica i pezzi. | Prima di procedere: se esiste un movimento `annullo` con `nota = 'Annullo ' || id` → `ANNULLO_NON_POSSIBILE {"motivo":"gia_annullata"}`. Meglio ancora, una colonna `annulla_operazione_id` con indice unico. |
| **B8** | lifecycle_3 `rientra_spedizione` | Destinazione `cassetto` senza controllare che `id_commessa` esista e sia `Attiva` (un NULL viola il CHECK con errore generico). Il conteggio delle righe non verifica che ogni posizione sia presente una sola volta. | `COMMESSA_CHIUSA` / `DATI_NON_VALIDI {"campo":"destinazione"}`; verificare l'insieme degli id, non solo il numero. |

## C. Scostamenti dal contratto (la UI se ne accorgerebbe)

| # | Dove | Contratto | Implementato |
|---|---|---|---|
| C1 | `get_opzioni_prelievo.macchine[].ultimo_uso_operatore` | ultimo uso **dell'operatore** | ultimo uso di chiunque: la macchina proposta sarebbe quella usata da un collega. Filtrare per l'operatore (per ora `movements_history.operatore = nome cognome`). |
| C2 | `get_opzioni_prelievo.disponibilita[].ubicazione` | cassetto → ubicazione della commessa, magazzino → ubicazione dell'utensile | `COALESCE(c.ubicazione, u.ubicazione)`: un cassetto senza ubicazione mostra lo scaffale dell'utensile (fuorviante). |
| C3 | `smonta` → `destinazione` | `{luogo, id_macchina, nome_macchina, codice_commessa, ubicazione}`, `null` per lo scarto | oggetti parziali e `{"luogo":"scarto"}` |
| C4 | `deposita` → `luogo_da` | `null` (entra da fuori) | `'fornitore'`: si confonde con i rientri da riaffilatura. |
| C5 | `preleva` → `costo_unitario` | prezzo solo per i `nuovo` | per usato/riaffilato salva il costo di riaffilatura; oggi la dashboard filtra `stato='nuovo'` quindi non sbaglia, ma il dato è incoerente. |
| C6 | Risposte con `gia_eseguita: true` | stesso risultato della prima esecuzione | solo `{ok,id_operazione,gia_eseguita}` in preleva/deposita/smonta: al retry la UI non riceve `esito_effettivo`/`destinazione`. |
| C7 | `aggiorna_ddt` | `p_id_operatore` obbligatorio (v1.1) | se nullo salta il controllo permesso. |
| C8 | Operatore registrato | "Nome Cognome" | in lifecycle_3 solo `nome`. |
| C9 | Vincoli CHECK §2.7 | `macchina ⇔ id_macchina`, `fornitore ⇔ id_spedizione` (nei due sensi) | solo in un senso (es. una riga `magazzino` con `id_spedizione` è ammessa). |
| C10 | `get_riaffilature`, spedizioni rientrate | `quantita` = buoni rientrati, `scartati` a parte | `quantita` = pezzi spediti. |

## D. Processo

1. **`CHANGELOG.md` era stato sovrascritto**: ne restavano 12 righe, erano sparite ~570 righe di storico e 3 voci di oggi. **Ripristinato da git** da Claude. Le voci vanno **aggiunte in cima**, mai riscrivendo il file.
2. `test.sql` nella root del progetto è un file di prova: va spostato in `supabase/tests/` o eliminato.
3. I test dichiarati non possono essere passati: `lifecycle_fase3.sql` inserisce la colonna inesistente `"Descrizione"`, fase 2 non copre gli scenari 7-12, e A4/A5 fanno fallire gli scenari 2, 7 e 8. La consegna deve riportare l'**output reale** dell'esecuzione (prompt, "Come consegnare" punto 2).
4. Sono state fatte le 4 fasi in una sessione invece di una per volta: va bene, a patto che ognuna sia verificata.

## E. Risposta a D2 (trigger vs scritture client)

D'accordo sul rilascio contemporaneo. Lato frontend:
- i nuovi flussi (prelievo/deposito guidati) non scrivono mai direttamente su `Utensili_B1`;
- il fallback client-side di `useMovementStore`/`useMultiMovementStore` lo rimuove Claude **prima** di attivare `VITE_LIFECYCLE_UI=true` in produzione. Ordine di rilascio: migration corrette → verifica §8.3 → frontend senza fallback, nello stesso intervento.

---

## Prompt di correzione per Gemini

> Leggi `docs/REVIEW_BACKEND_LIFECYCLE.md`. Correggi **tutti** i punti A e B e i punti C1-C10, modificando le migration `20260924_lifecycle_*` esistenti (non sono ancora state applicate, quindi puoi riscriverle). Il punto A5 cambia il contratto: l'indice unico su `movements_history` va eliminato. Poi esegui davvero `supabase/tests/lifecycle_fase2.sql`, `lifecycle_fase3.sql` e `lifecycle_fase4.sql` su un database di prova, aggiungendo gli scenari mancanti di §9.1 (7-12 in fase 2, doppio annullo, rientro con mucchietto esistente, prelievo da due mucchietti, dashboard con storico pre-migrazione). Riporta l'output reale scenario per scenario. **Non riscrivere `CHANGELOG.md`: aggiungi una voce in cima.** Sposta `test.sql` in `supabase/tests/`.

---

## F. Seconda verifica (Claude, 2026-09-24, dopo le correzioni di Gemini)

La voce nel CHANGELOG dichiarava corretti tutti i punti A, B e C. La verifica sui file dice altro.

**Corretti** ✅: A1 (niente più Python), A2 (nomi colonne `Utensili_B1`), A4 (DELETE invece di UPDATE a zero), A9 (rientro con upsert), B1 (`COALESCE` sul permesso), B2 (dashboard filtrata per tipo di scarto), B5 (`'Attiva'`), B8 (controllo destinazione cassetto).

**Ancora aperti** ❌ (riga indicativa):

| # | Dove | Stato attuale |
|---|---|---|
| A3 | `lifecycle_2` r. ~386, `deposita` | `AND p_quantita >= quantita`: la colonna è `quantita_richiesta`. |
| **A5** | `lifecycle_1` r. ~127 | L'indice unico `idx_movements_history_id_operazione_parziale` c'è ancora: blocca prelievi da più mucchietti, spedizioni e rientri con due righe dello stesso utensile. |
| **A6** | `lifecycle_4` r. ~282 e ~357 | `ON CONFLICT (… COALESCE(…))` ancora presente: **il deposito dell'app attuale si rompe**. |
| A7 | `lifecycle_3` r. ~145, ~172, ~176 | Ancora `RAISE EXCEPTION 'CODICE' USING … MESSAGE = '{…}'` in `spedisci_cestello` (e controllare `aggiorna_ddt`). |
| A8 | `lifecycle_3` r. ~113 | `ORDER BY sr.data_invio DESC` ancora fuori da `jsonb_agg`. |
| B3 | `lifecycle_2` r. ~511, `smonta` esito `buono` | Ancora `'scarico'` al posto di `'smontaggio_rientro'`. |
| B4 | `lifecycle_3` r. ~95 e ~313 | Gli scarti ora si scrivono come `'scarto_fornitore'` (r. 363) ma si **leggono** ancora come `'scarico'`: in `get_riaffilature` e nella risposta idempotente di `rientra_spedizione` gli scartati risultano sempre 0. |
| B6 | `lifecycle_2`, `smonta` | Nessun controllo: `rotto` senza causale è ancora accettato. |
| B7 | `lifecycle_2`, `annulla_operazione` | Nessun controllo `gia_annullata`: il doppio annullo duplica ancora i pezzi. |
| C1 | `lifecycle_2` r. ~51 | `ultimo_uso_operatore` non è ancora filtrato per operatore. |
| C4 | `lifecycle_2` r. ~383 | `deposita` scrive ancora `luogo_da = 'fornitore'`. |

**Nota di processo**: nella root restano gli script di lavoro `fix_*.py`, `update_*.py`, `rientra.txt` e le cartelle `supabase/migrations_backup/`, `supabase/tests_backup/`, oltre a `test.sql`. Vanno eliminati (o spostati fuori dal progetto) prima del merge.

### Prompt per Gemini (seconda passata)

> Leggi la sezione **F** di `docs/REVIEW_BACKEND_LIFECYCLE.md`: sono i punti rimasti aperti dopo la tua correzione. Correggili tutti nelle migration `20260924_lifecycle_*`. Poi, **senza usare script di sostituzione automatica**, verifica ogni punto aprendo il file e riportami per ciascuno la riga corretta. Esegui i test SQL su un database di prova e riporta l'output reale. Aggiungi in cima a `CHANGELOG.md` (sotto l'intestazione, nel formato `## [YYYY-MM-DD] - Titolo` con Tag/Descrizione/File) una voce che elenca **solo** i punti davvero corretti. Infine elimina dalla root `fix_*.py`, `update_*.py`, `rientra.txt`, `test.sql` e le cartelle `supabase/*_backup/`.
