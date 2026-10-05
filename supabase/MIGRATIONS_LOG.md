# 📜 Registro Cronologico Migrazioni e Regole SQL (Supabase)

Questo documento traccia in ordine cronologico tutte le migrazioni dello schema database, le regole di sicurezza (RLS), le stored procedure (RPC) e gli indici di performance del progetto **Bercella Utensili**.

I file sorgente eseguibili risiedono nella directory [`supabase/migrations/`](./migrations/) e sono versionati con Git.

---

## 📅 Indice Cronologico delle Migrazioni

| Data | File di Migrazione | Oggetti Coinvolti | Scopo & Note |
| :--- | :--- | :--- | :--- |
| **Baseline** | [`supabase_schema.sql`](../supabase_schema.sql) | `Utensili_B1`, `utenti`, `ordini`, `commesse`, `movements_history`, `giacenze_commesse` | Baseline iniziale del database con tabelle primarie, vincoli e prime policy RLS. |
| **2026-09-23** | [`20260923_catalog_rpc_and_realtime.sql`](./migrations/20260923_catalog_rpc_and_realtime.sql) | RPC `get_tools_catalog()`, publication `supabase_realtime` | Bypass del limite 1000 righe PostgREST tramite JSON compresso server-side; abilitazione Realtime cross-device. |
| **2026-09-24** | [`20260924_fix_commesse_movement_logic.sql`](./migrations/20260924_fix_commesse_movement_logic.sql) | RPC `handle_bulk_movement`, `handle_multi_movement` | Correzione logica di allocazione utensili su commessa e gestione transazionale delle giacenze. |
| **2026-09-24** | [`20260924_lifecycle_1_schema_e_migrazione.sql`](./migrations/20260924_lifecycle_1_schema_e_migrazione.sql) | `posizioni_utensile`, `macchine_cnc`, `spedizioni_riaffilatura`, trigger `trg_update_utensili_quantita` | Fase 1 Ciclo di Vita Utensili: tracciamento fisico per posizione (`magazzino`, `cassetto`, `macchina`, `fornitore`) e stato. |
| **2026-09-24** | [`20260924_lifecycle_2_rpc_base.sql`](./migrations/20260924_lifecycle_2_rpc_base.sql) | RPC `preleva`, `deposita`, `sposta`, `smonta`, `scarta` | Fase 2 Ciclo di Vita: stored procedure atomiche per movimentazione fisica avanzata con snapshot e audit trail. |
| **2026-09-24** | [`20260924_lifecycle_3_riaffilature.sql`](./migrations/20260924_lifecycle_3_riaffilature.sql) | RPC `crea_spedizione_riaffilatura`, `rientro_spedizione` | Fase 3 Ciclo di Vita: logica ciclo riaffilature, DDT fornitore, avanzamento stato e incremento contatore riaffilature. |
| **2026-09-24** | [`20260924_lifecycle_4_dashboard_realtime_legacy.sql`](./migrations/20260924_lifecycle_4_dashboard_realtime_legacy.sql) | Viste analytics, RPC `get_dashboard_stats`, compatibilità legacy | Fase 4 Ciclo di Vita: viste aggregate KPI economici, monitoraggio scarti e integrazione retrocompatibile. |
| **2026-09-28/29** | [`20260928_roles_machines_requests.sql`](./migrations/20260928_roles_machines_requests.sql) | `richieste_movimento`, `richieste_movimento_voci`, `macchine_cnc`, vincolo `utenti.ruolo`, RPC `evadi_richiesta_movimento`, RPC `rifiuta_richiesta_movimento`, indici FK | Nuova architettura ruoli (Operatore, Admin, Manager), flusso richieste approvate dall'amministratore, prevenzione deadlock (`ORDER BY id FOR UPDATE`), hardening `search_path` e risoluzione warnings Supabase Advisors. |
| **2026-10-01** | [`20261001_lifecycle_e_lavorazioni_completo.sql`](./migrations/20261001_lifecycle_e_lavorazioni_completo.sql) | `commesse` (estensioni lavorazioni), `posizioni_utensile` (estensioni usura e pezzi), RPC `registra_avanzamento_lavorazione`, `eredita_utensile_bordo`, `chiudi_lavorazione`, RPC unificate | Migrazione unificata e completa Ciclo di Vita Utensili & Lavorazioni CNC: avanzamento rapido pezzi fine turno, semaforo usura tagliente, adozione utensili a bordo macchina (senza prelievi fittizi), e chiusura lavorazione con prompt cassetto. |
| **2026-10-05** | [`20261005_allow_tool_deletion.sql`](./migrations/20261005_allow_tool_deletion.sql) | `Utensili_B1`, `richieste_movimento_voci` | Abilitazione cancellazione riga utensile da parte degli amministratori: policy RLS `Utensili_B1_delete` per ruoli autenticati e anon, e aggiornamento vincolo FK su `richieste_movimento_voci` a `ON DELETE CASCADE`. |

---

## 🔒 Regole di Sicurezza e Best Practices Applicate

Tutti i file di migrazione seguono rigorosamente le direttive di **`supabase-postgres-best-practices`**:

1. **Idempotenza Assoluta**:
   - `CREATE TABLE IF NOT EXISTS`
   - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
   - `DROP POLICY IF EXISTS ...` prima di `CREATE POLICY`
   - `DO $$ ... $$` blocks per verifiche di vincoli e indici esistenti.

2. **Prevenzione Deadlock & Concorrenza**:
   - Nelle RPC con movimentazioni multiple di magazzino (`evadi_richiesta_movimento`), l'acquisizione dei lock su `"Utensili_B1"` avviene preventivamente in ordine deterministico crescente:
     ```sql
     PERFORM 1 FROM public."Utensili_B1" u
     WHERE u.id IN (SELECT tool_id FROM ...)
     ORDER BY u.id FOR UPDATE;
     ```

3. **Hardening Search Path**:
   - Tutte le funzioni dichiarate con `SECURITY DEFINER` hanno il parametro esplicito `SET search_path = public, pg_temp` per proteggere da attacchi di privilege escalation o search_path hijacking.

4. **Zero Sovrapposizioni RLS (No `multiple_permissive_policies`)**:
   - Non vengono mai usate policy generiche `FOR ALL` in combinazione con policy `FOR SELECT`.
   - Vengono generate policy granulari distinte per ciascun comando (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) con target esplicito `TO authenticated, anon`.

5. **Indici Covering su ogni Foreign Key (No `unindexed_foreign_keys`)**:
   - Tutte le relazioni `REFERENCES` possiedono il rispettivo indice btree dedicato per massimizzare le performance delle query di JOIN e dei controlli sui vincoli di integrità.

---

## 🌿 Backup e Tracciabilità con Git

Ogni singola riga di codice SQL presente in questa cartella è tracciata nella cronologia Git del repository:
- Per vedere la cronologia dei commit sulle migrazioni:
  ```bash
  git log --oneline -- supabase/
  ```
- Per visualizzare le differenze esatte introdotte da un commit su un file SQL:
  ```bash
  git log -p supabase/migrations/20260928_roles_machines_requests.sql
  ```
