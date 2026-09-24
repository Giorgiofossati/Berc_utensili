# Contratto dati — Ciclo di vita utensili

> **Versione 1.2 · 2026-09-24** (1.1: aggiunto `p_id_operatore` a `get_dashboard_stats` e `aggiorna_ddt`; 1.2: tolto l'indice unico su `movements_history` §2.8, bloccava operazioni legittime — vedi `docs/REVIEW_BACKEND_LIFECYCLE.md` A5) · Sostituisce le sezioni 1-2 di [`HANDOFF_LIFECYCLE.md`](../HANDOFF_LIFECYCLE.md) (schema e RPC). Le sezioni 3-4 dell'handoff (UI) sono sostituite dai prototipi approvati: [canvas "Ciclo di vita utensili"](https://claude.ai/artifact/TD37rXa59zcN6epUPrhwjN).
>
> **Chi fa cosa**
> - **Backend (Gemini)**: tutto ciò che sta in `supabase/` — migration, tabelle, RPC, trigger, realtime, migrazione dati, test SQL. Aggiorna `SUPABASE_SCHEMA.md`.
> - **Frontend (Claude)**: tutto ciò che sta in `src/` — store Zustand, componenti, viste, mock. Aggiorna `DESIGN_SYSTEM.md`.
> - **Questo file è l'unico punto di contatto.** Nomi, parametri e forme JSON qui sotto sono vincolanti per entrambi. Chi ha bisogno di cambiarli non li cambia da solo: aggiunge una voce in [§10 Domande aperte](#10-domande-aperte) e aspetta l'ok di Giorgio.
> - Entrambi registrano ogni intervento in `CHANGELOG.md` (regola di progetto).

---

## 1. Modello mentale

Un utensile fisico si trova **sempre in esattamente un posto** e in **uno stato**. Ogni azione dell'operatore è "sposta N pezzi da una posizione a un'altra" (oppure "togli N pezzi dal sistema" per lo scarto).

```
                 deposita                  preleva                   smonta: consumato
  (fornitore) ──────────► MAGAZZINO ─────────────────► MACCHINA ─────────────────────► CESTELLO
                          CASSETTO  ◄───────────────── (commessa  ◄── smonta: buono       │ spedisci
                          (commessa)   smonta: buono    o generico)    (torna come usato)  ▼
                              ▲                             │                          FORNITORE
                              │      rientra_spedizione     │ smonta: rotto               │
                              └─────────────────────────────┼──────────────────────────────┘
                                   (come riaffilato, n+1)   ▼                   (scartati dal fornitore)
                                                       SCARTO (esce dal sistema, resta nello storico)
```

### 1.1 Vocabolario (valori esatti, minuscoli)

| Enum | Valori | Note |
|---|---|---|
| `luogo` | `magazzino`, `cassetto`, `macchina`, `cestello`, `fornitore` | Lo scarto **non** è un luogo: il pezzo esce da `posizioni_utensile` e resta solo in `movements_history`. |
| `stato` | `nuovo`, `usato`, `riaffilato` | `usato` = già montato almeno una volta, ancora buono. Un pezzo `riaffilato` montato e smontato "buono" torna `usato` mantenendo il suo `n_riaffilature`. |
| `esito_smontaggio` | `consumato`, `rotto`, `buono`, `sposta` | Le 4 schede "Com'è l'utensile?" della UI. |
| `causale_scarto` | `usura`, `collisione`, `rottura_lavorazione`, `parametri_programma`, `altro`, `usura_limite_riaffilature`, `scarto_fornitore` | Evitabili (rosso in dashboard): `collisione`, `parametri_programma`. |

### 1.2 Regole di stato che la UI dà per scontate
- `cassetto` = pezzi fisicamente in magazzino ma **riservati** a una commessa (cassettiera dedicata). L'indirizzo del cassetto è il campo già esistente `commesse.ubicazione` (es. "Cassettiera C · cassetto 4").
- Un pezzo in `macchina` ha sempre `id_macchina`; `id_commessa` nullo = **Generico macchina** (niente più stringa magica `[Generico Macchina]`).
- In `cestello` e `fornitore` il pezzo **conserva `id_commessa`** di provenienza (serve alla UI per proporre il cassetto al rientro).
- `n_riaffilature` = quante volte il pezzo è già stato riaffilato. `nuovo` ⇒ sempre 0. Al rientro dal fornitore diventa `n + 1`.
- Limite: `Utensili_B1.max_riaffilature` (default 3). `smonta` con esito `consumato` su un pezzo con `n_riaffilature >= max_riaffilature` diventa automaticamente scarto con causale `usura_limite_riaffilature` (la UI lo annuncia già prima, ma la regola vive nel DB).

---

## 2. Schema

Una migration per fase, in `supabase/migrations/`, con naming `YYYYMMDD_lifecycle_<n>_<descrizione>.sql`. Tutto idempotente (`IF NOT EXISTS`, `CREATE OR REPLACE`).

### 2.1 `macchine_cnc` (nuova)
| Colonna | Tipo | Note |
|---|---|---|
| `id` | uuid PK default `gen_random_uuid()` | |
| `nome` | text not null unique | es. "CNC 03" |
| `reparto` | text null | |
| `ordine` | int not null default 0 | ordinamento nelle liste |
| `is_active` | bool not null default true | |
| `created_at` | timestamptz default now() | |

### 2.2 `Utensili_B1` (colonne aggiunte)
| Colonna | Tipo | Note |
|---|---|---|
| `prezzo_acquisto` | numeric(10,2) **null** | **Null = sconosciuto**, non 0. La dashboard conta i null per l'avviso "N utensili senza prezzo". |
| `costo_riaffilatura` | numeric(10,2) null | idem |
| `max_riaffilature` | int not null default 3 | |

`"Quantità"` **resta** e diventa un valore derivato mantenuto da trigger (vedi §7): somma dei pezzi in `magazzino` + `cassetto`, tutti gli stati. Così catalogo, filtri e alert scorte esistenti continuano a funzionare senza modifiche.

### 2.3 `utenti` (colonne aggiunte)
`can_view_dashboard`, `can_manage_catalog`, `can_manage_riaffilature` (bool, default false), `can_pick_tools` (bool, default true). Migrazione: `ruolo = 'Admin'` ⇒ tutti true.

### 2.4 `commesse` (nessuna colonna nuova)
`ubicazione` esistente = indirizzo del cassetto. `stato = 'Chiusa'` ⇒ la commessa non compare nelle chip di prelievo/deposito (ma le posizioni esistenti restano visibili finché non sono svuotate).

### 2.5 `ordini` (colonna aggiunta)
`commessa_id` uuid null FK `commesse(id)` — permette al deposito di proporre "Sono stati comprati per la 24-118?".

### 2.6 `spedizioni_riaffilatura` (nuova)
| Colonna | Tipo | Note |
|---|---|---|
| `id` | uuid PK | |
| `ddt` | text null | facoltativo alla spedizione, compilabile dopo |
| `fornitore` | text null | |
| `stato` | text not null check in (`in_viaggio`,`rientrata`) default `in_viaggio` | |
| `data_invio` | timestamptz not null default now() | |
| `data_rientro` | timestamptz null | |
| `operatore_invio`, `operatore_rientro` | text null | stesso formato di `movements_history.operatore` |

### 2.7 `posizioni_utensile` (nuova — cuore del sistema)
| Colonna | Tipo | Note |
|---|---|---|
| `id` | uuid PK | |
| `id_utensile` | uuid not null FK `Utensili_B1(id)` on delete cascade | |
| `luogo` | text not null check (enum §1.1) | |
| `stato` | text not null check (enum §1.1) | |
| `n_riaffilature` | int not null default 0 check ≥ 0 | |
| `id_commessa` | uuid null FK `commesse(id)` | |
| `id_macchina` | uuid null FK `macchine_cnc(id)` | |
| `id_spedizione` | uuid null FK `spedizioni_riaffilatura(id)` | |
| `quantita` | int not null check > 0 | riga eliminata quando arriva a 0 |
| `entrata_il` | timestamptz not null default now() | aggiornato quando la riga nasce; la UI mostra "montato da 3 gg" |
| `aggiornato_il` | timestamptz not null default now() | |

Vincoli (CHECK):
- `luogo = 'macchina'` ⇔ `id_macchina is not null`
- `luogo = 'cassetto'` ⇒ `id_commessa is not null`
- `luogo = 'magazzino'` ⇒ `id_commessa is null and id_macchina is null`
- `luogo = 'fornitore'` ⇔ `id_spedizione is not null`
- `stato = 'nuovo'` ⇒ `n_riaffilature = 0`

Unicità: indice unico `NULLS NOT DISTINCT` su `(id_utensile, luogo, stato, n_riaffilature, id_commessa, id_macchina, id_spedizione)` — ogni "mucchietto" di pezzi identici è una riga sola; gli spostamenti fanno upsert.

Indici: `(luogo)`, `(id_macchina)`, `(id_commessa)`, `(id_spedizione)`, `(id_utensile)`.

### 2.8 `movements_history` (colonne aggiunte)
| Colonna | Tipo | Note |
|---|---|---|
| `id_operazione` | uuid null | stessa per tutte le righe di un'azione utente; chiave per idempotenza e annullo |
| `id_macchina` | uuid null FK | |
| `luogo_da`, `luogo_a` | text null | `luogo_a` null = scarto |
| `stato` | text null | stato del pezzo **prima** del movimento |
| `n_riaffilature` | int null | |
| `id_spedizione` | uuid null FK | |
| `causale_scarto` | text null check (enum §1.1) | |
| `nota` | text null | |
| `costo_unitario` | numeric(10,2) null | **fotografia** del costo al momento (prezzo_acquisto per `nuovo`, costo_riaffilatura per rientri): la dashboard non cambia se domani cambia il listino |
| `snapshot_da`, `snapshot_a` | jsonb null | chiavi complete della posizione di partenza/arrivo, servono ad `annulla_operazione` |

`tipo_operazione` accetta in più: `prelievo`, `deposito`, `smontaggio_cestello`, `smontaggio_scarto`, `smontaggio_rientro`, `spostamento_produzione`, `spedizione_riaffilatura`, `rientro_riaffilatura`, `scarto_fornitore`, `annullo`. I valori storici (`carico`, `scarico`, `spostamento`) restano validi.

**Nessun indice unico su `id_operazione`** (v1.2): una stessa operazione scrive legittimamente più righe con la stessa coppia utensile/luoghi (es. prelievo da due mucchietti con `n_riaffilature` diverso). L'idempotenza si garantisce solo col controllo iniziale di §4.0.1. Serve invece un indice semplice (non unico) su `id_operazione` per le ricerche.

---

## 3. Letture (RPC `SECURITY DEFINER`, `STABLE`, ritornano `json`)

Tutte le date in ISO 8601 UTC. Tutti gli importi numerici (non stringhe). Array sempre presenti (vuoti, mai null).

### 3.1 `get_opzioni_prelievo(p_id_utensile uuid, p_id_operatore uuid) → json`
Una sola chiamata apre il modale "Prelievo guidato".
```json
{
  "utensile": { "id": "…", "codice": "FR-10-Z4-072", "descrizione": "Fresa HM Ø10 Z4 L72", "ubicazione": "Scaffale B3", "max_riaffilature": 3 },
  "macchine": [ { "id": "…", "nome": "CNC 03", "reparto": null, "ultimo_uso_operatore": "2026-09-24T07:12:00Z" } ],
  "commesse_per_macchina": {
    "<id_macchina>": [ { "id": "…", "codice": "24-118", "descrizione": "Carter Ducati", "ubicazione_cassetto": "Cassettiera C · cassetto 4", "ultimo_uso": "2026-09-24T07:12:00Z", "fresca": true } ]
  },
  "disponibilita": [
    { "luogo": "cassetto", "id_commessa": "…", "codice_commessa": "24-118", "ubicazione": "Cassettiera C · cassetto 4", "stato": "usato", "n_riaffilature": 0, "quantita": 1 },
    { "luogo": "magazzino", "id_commessa": null, "codice_commessa": null, "ubicazione": "Scaffale B3", "stato": "riaffilato", "n_riaffilature": 1, "quantita": 3 }
  ],
  "altrove_in_macchina": [
    { "id_posizione": "…", "id_macchina": "…", "nome_macchina": "CNC 05", "codice_commessa": "24-121", "stato": "riaffilato", "quantita": 1, "entrata_il": "…" }
  ]
}
```
- `macchine`: tutte le attive; ordinate per `ultimo_uso_operatore` desc (null in fondo, poi `ordine`). La UI mostra le prime 3 come chip e le altre in "Altra…".
- `commesse_per_macchina`: per **ogni** macchina di `macchine`, max 5 commesse `Attive` ordinate per ultimo movimento su quella macchina (qualsiasi operatore). `fresca` = ultimo uso entro **72 ore** (costante unica in SQL, la UI si fida del flag).
- `disponibilita`: righe in `magazzino` + **tutti** i `cassetto` dell'utensile; la UI filtra per commessa scelta. Se più righe hanno stesso luogo/commessa/stato ma `n_riaffilature` diverso, restituirle separate; la UI le somma per mostrare "3 disp" e passa la riga con `n_riaffilature` più **basso** a `preleva`.
- `altrove_in_macchina`: posizioni `macchina` dello stesso utensile ferme da > 7 giorni (suggerimento "Su CNC 05 c'è 1 pezzo fermo da 12 giorni").

### 3.2 `get_in_produzione() → json`
Righe piatte; il raggruppamento (per macchina o per commessa) è della UI.
```json
{ "righe": [
  { "id_posizione": "…", "id_utensile": "…", "codice": "FR-10-Z4-072", "descrizione": "Fresa HM Ø10 Z4 L72",
    "luogo": "macchina", "id_macchina": "…", "nome_macchina": "CNC 03",
    "id_commessa": "…", "codice_commessa": "24-118", "descrizione_commessa": "Carter Ducati", "ubicazione_cassetto": "Cassettiera C · cassetto 4",
    "stato": "riaffilato", "n_riaffilature": 2, "max_riaffilature": 3, "quantita": 1, "entrata_il": "…" }
] }
```
Include `luogo in ('macchina','cassetto')`. `nome_macchina` null per i cassetti; `id_commessa` null = Generico macchina.

### 3.3 `get_riaffilature(p_giorni_storico int default 30) → json`
```json
{
  "cestello": [ { "id_posizione": "…", "id_utensile": "…", "descrizione": "…", "nome_macchina_origine": "CNC 03", "codice_commessa": "24-118", "n_riaffilature": 2, "max_riaffilature": 3, "quantita": 2, "entrata_il": "…" } ],
  "spedizioni": [
    { "id": "…", "ddt": "1438", "fornitore": null, "stato": "in_viaggio", "data_invio": "…", "data_rientro": null, "pezzi": 9,
      "righe": [ { "id_posizione": "…", "id_utensile": "…", "descrizione": "…", "ubicazione_abituale": "Scaffale B1",
                   "id_commessa": "…", "codice_commessa": "24-118", "ubicazione_cassetto": "…", "commessa_attiva": true,
                   "n_riaffilature": 1, "max_riaffilature": 3, "quantita": 4 } ] }
  ]
}
```
- `nome_macchina_origine`: dall'ultimo movimento `smontaggio_cestello` della posizione (la posizione in cestello non ha più `id_macchina`).
- `spedizioni`: tutte le `in_viaggio` + le `rientrata` negli ultimi `p_giorni_storico` giorni (le righe delle rientrate vengono dallo storico movimenti: `righe` con i pezzi rientrati, e in più `scartati` per riga).
- `commessa_attiva: false` ⇒ la UI non propone il cassetto al rientro.

### 3.4 `get_opzioni_deposito(p_id_utensile uuid) → json`
```json
{
  "utensile": { "id": "…", "codice": "…", "descrizione": "…", "ubicazione": "Scaffale B3" },
  "ordine_aperto": { "id": "…", "quantita_richiesta": 50, "id_commessa": "…", "codice_commessa": "24-118" },
  "commesse_attive": [ { "id": "…", "codice": "24-118", "descrizione": "Carter Ducati", "ubicazione_cassetto": "…", "pezzi_nel_cassetto": 13 } ]
}
```
`ordine_aperto`: l'ordine `In Attesa` più vecchio dell'utensile, o null. `commesse_attive`: prima quella dell'ordine, poi le 5 con movimenti più recenti.

### 3.5 `get_dashboard_stats(p_da timestamptz, p_a timestamptz, p_id_operatore uuid) → json`
```json
{
  "risparmio_riaffilature": { "euro": 8420.00, "pezzi": 186 },
  "spesa": { "euro": 21300.00, "nuovi_euro": 17800.00, "riaffilature_euro": 3500.00 },
  "scarti": { "pezzi": 74, "reparto": 58, "fornitore": 16 },
  "scarti_evitabili": { "percentuale": 31.1, "euro": 2950.00 },
  "per_macchina": [ { "id_macchina": "…", "nome": "CNC 03", "euro": 6100.00 } ],
  "per_causale": [ { "causale": "collisione", "evitabile": true, "pezzi": 17, "euro": 1900.00 } ],
  "per_commessa": [ { "id_commessa": null, "codice": null, "descrizione": "Generico macchina", "euro": 7960.00 } ],
  "utensili_senza_prezzo": 412
}
```
Formule (tutte su `movements_history` nel periodo, usando `costo_unitario` fotografato):
- **risparmio** = Σ pezzi rientrati sani × (prezzo_acquisto − costo_riaffilatura), solo dove entrambi noti.
- **spesa** = Σ prelievi di pezzi `nuovo` verso macchina × costo_unitario + Σ rientri × costo_riaffilatura.
- **per_macchina / per_commessa** = stessa spesa attribuita alla macchina/commessa di destinazione del prelievo.
- **scarti_evitabili.percentuale** = pezzi con causale evitabile / pezzi scartati totali × 100.
- `per_causale` include tutte le causali, anche a 0.
- Righe con costo sconosciuto contano nei pezzi ma non negli euro.

---

## 4. Scritture (RPC `SECURITY DEFINER`, `VOLATILE`, ritornano `json`)

### 4.0 Regole comuni a tutte le scritture
1. **Primo parametro `p_id_operazione uuid`** generato dal client. Se esistono già righe in `movements_history` con quell'id ⇒ **non rifare nulla** e restituire lo stesso risultato (`"gia_eseguita": true`). Protegge da doppi tap e retry dopo caduta di rete.
2. **`p_id_operatore uuid`** (id di `utenti`). La RPC ricava il nome per `movements_history.operatore` (formato attuale: "Nome Cognome") e verifica il flag richiesto.
3. **Tutto in una transazione**, con `SELECT … FOR UPDATE` sulle posizioni toccate.
4. **Errori**: `RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '<CODICE>', DETAIL = '<json>'`. La UI mostra un testo in base al codice e usa `DETAIL` per i numeri. Codici:

| Codice | Quando | `DETAIL` |
|---|---|---|
| `PERMESSO_NEGATO` | manca il flag | `{"permesso":"can_pick_tools"}` |
| `GIACENZA_INSUFFICIENTE` | la posizione di partenza ha meno pezzi | `{"disponibili":2,"richiesti":3}` |
| `POSIZIONE_NON_TROVATA` | id posizione inesistente (qualcuno l'ha svuotata nel frattempo) | `{}` |
| `DATI_NON_VALIDI` | parametro mancante/incoerente | `{"campo":"p_causale"}` |
| `COMMESSA_CHIUSA` | destinazione su commessa chiusa | `{"codice":"24-097"}` |
| `ANNULLO_NON_POSSIBILE` | i pezzi sono già stati spostati di nuovo, o sono passati più di 10 minuti | `{"motivo":"pezzi_spostati"}` |

5. **Risposta di successo** sempre con almeno `{"ok": true, "id_operazione": "…", "gia_eseguita": false}`.
6. Ogni scrittura aggiorna `"Quantità"` (via trigger, §7) e produce un solo evento realtime per tabella toccata.

### 4.1 `preleva(p_id_operazione, p_id_operatore, p_id_utensile, p_da_luogo text, p_da_id_commessa uuid, p_da_id_posizione uuid, p_stato text, p_id_macchina uuid, p_id_commessa uuid, p_quantita int) → json`
- Flag: `can_pick_tools`.
- Partenza: se `p_da_id_posizione` è valorizzato (caso "Prendi da lì" su un'altra macchina) si usa quella; altrimenti la riga `(p_id_utensile, p_da_luogo ∈ {magazzino,cassetto}, p_da_id_commessa, p_stato)` con `n_riaffilature` più basso. Se servono più pezzi di quanti ce ne sono in quella riga, prende dalle righe successive con `n_riaffilature` crescente.
- Arrivo: `luogo='macchina', id_macchina=p_id_macchina, id_commessa=p_id_commessa` (null = generico), stesso stato e `n_riaffilature`.
- `tipo_operazione`: `prelievo` (o `spostamento_produzione` se parte da una macchina).
- Risposta: `{ ok, id_operazione, gia_eseguita, "quantita": 1, "riepilogo": "1 × usato · Cassetto 24-118 → CNC 03 · 24-118" }` (il riepilogo lo può comporre anche la UI: è facoltativo).

### 4.2 `deposita(p_id_operazione, p_id_operatore, p_id_utensile, p_quantita int, p_stato text default 'nuovo', p_id_commessa uuid default null, p_id_ordine uuid default null) → json`
- Flag: nessuno (chiunque può depositare, come oggi).
- `p_id_commessa` null ⇒ `magazzino`; valorizzato ⇒ `cassetto` di quella commessa.
- Se `p_id_ordine` è valorizzato e la quantità depositata ≥ `quantita_richiesta` ⇒ ordine `Completato`.
- `tipo_operazione`: `deposito` (compatibile con i report che oggi leggono `carico`: aggiornare anche quei report o salvare `carico` — **vedi §10 D1**).

### 4.3 `smonta(p_id_operazione, p_id_operatore, p_id_posizione uuid, p_quantita int, p_esito text, p_causale text default null, p_nota text default null, p_dest_id_macchina uuid default null, p_dest_id_commessa uuid default null) → json`
- Flag: `can_pick_tools`. La posizione deve essere in `macchina`.

| `p_esito` | Effetto |
|---|---|
| `consumato` | → `cestello` (conserva stato, `n_riaffilature`, `id_commessa`). **Se `n_riaffilature >= max_riaffilature`** ⇒ trattato come `rotto` con causale `usura_limite_riaffilature`. |
| `rotto` | Esce dal sistema. `p_causale` obbligatoria. |
| `buono` | → `cassetto` della sua commessa (se commessa non nulla e **Attiva**), altrimenti `magazzino`. Stato diventa `usato` (anche da `nuovo`), `n_riaffilature` invariato. |
| `sposta` | → `macchina` `p_dest_id_macchina` / commessa `p_dest_id_commessa`, stato invariato. |

- Risposta: `{ ok, id_operazione, gia_eseguita, "esito_effettivo": "rotto", "causale_effettiva": "usura_limite_riaffilature", "destinazione": { "luogo": "cassetto", "codice_commessa": "24-118", "ubicazione": "…" } }` — la UI usa `esito_effettivo` e `destinazione` per il testo del toast.

### 4.4 `spedisci_cestello(p_id_operazione, p_id_operatore, p_ddt text default null, p_fornitore text default null, p_id_posizioni uuid[] default null) → json`
- Flag: `can_manage_riaffilature`.
- Crea una `spedizioni_riaffilatura` e sposta in `fornitore` tutte le posizioni `cestello` (o solo quelle in `p_id_posizioni`).
- Risposta: `{ ok, id_operazione, gia_eseguita, "id_spedizione": "…", "pezzi": 7 }`.
- Se il cestello è vuoto: `DATI_NON_VALIDI` con `{"campo":"cestello"}`.

### 4.5 `aggiorna_ddt(p_id_spedizione uuid, p_ddt text, p_fornitore text default null, p_id_operatore uuid) → json`
Semplice update, flag `can_manage_riaffilature`. Non serve `id_operazione`. Risposta `{ "ok": true }`.

### 4.6 `rientra_spedizione(p_id_operazione, p_id_operatore, p_id_spedizione uuid, p_righe jsonb) → json`
- Flag: `can_manage_riaffilature`. Spedizione deve essere `in_viaggio`.
- `p_righe`: una voce per **ogni** posizione della spedizione (se ne manca una: `DATI_NON_VALIDI`):
```json
[ { "id_posizione": "…", "scartati": 1, "destinazione": { "luogo": "cassetto", "id_commessa": "…" } },
  { "id_posizione": "…", "scartati": 0, "destinazione": { "luogo": "magazzino", "id_commessa": null } } ]
```
- Buoni (`quantita − scartati`) ⇒ destinazione indicata, stato `riaffilato`, `n_riaffilature + 1`, `costo_unitario = costo_riaffilatura`.
- Scartati ⇒ escono con causale `scarto_fornitore`.
- Spedizione ⇒ `rientrata`, `data_rientro = now()`.
- Risposta: `{ ok, id_operazione, gia_eseguita, "buoni": 8, "scartati": 1 }`.

### 4.7 `annulla_operazione(p_id_operazione_originale uuid, p_id_operatore uuid) → json`
Usata dal toast "ANNULLA · 5s" **e** dal menu ⋮ "Annulla il rientro / Correggi il rientro" (correggi = annulla + la UI riapre il flusso già compilato).
- Ripercorre le righe di `movements_history` con quell'`id_operazione` in ordine inverso usando `snapshot_da`/`snapshot_a`.
- Consentita entro **10 minuti** (toast) oppure, per `rientro_riaffilatura`, **sempre** finché i pezzi rientrati sono ancora tutti nella posizione di arrivo.
- Scrive righe `annullo` con un nuovo `id_operazione` e riporta la spedizione a `in_viaggio` se serve.
- Errore `ANNULLO_NON_POSSIBILE` altrimenti.
- Risposta: `{ ok, "id_operazione": "<nuovo>" }`.

---

## 5. Permessi

| Flag | Serve per |
|---|---|
| `can_pick_tools` | `preleva`, `smonta` |
| `can_manage_riaffilature` | `spedisci_cestello`, `aggiorna_ddt`, `rientra_spedizione` |
| `can_manage_catalog` | modifica prezzi/`max_riaffilature` (UI esistente di modifica utensile) |
| `can_view_dashboard` | `get_dashboard_stats` |

⚠️ **Limite noto, non da risolvere in questa fase**: il login attuale usa la tabella `utenti` con la chiave anon, non Supabase Auth. Il controllo del flag nelle RPC impedisce errori ma **non è sicurezza vera**: chi ha la chiave anon può passare qualsiasi `p_id_operatore`. La sicurezza vera richiede il passaggio a Supabase Auth (progetto a parte). Le RPC vanno comunque scritte così, perché con Supabase Auth basterà sostituire `p_id_operatore` con `auth.uid()`.

---

## 6. Realtime
Aggiungere alla publication `supabase_realtime`: `posizioni_utensile`, `spedizioni_riaffilatura`, `macchine_cnc`. La UI ricarica la vista interessata sul primo evento (con debounce), non ricostruisce lo stato dagli eventi: quindi basta che gli eventi arrivino.

---

## 7. Compatibilità con l'app esistente
1. **Trigger su `posizioni_utensile`** (insert/update/delete) ⇒ ricalcola `Utensili_B1."Quantità"` = Σ quantita dove `luogo in ('magazzino','cassetto')`. Nessuna vista attuale va toccata.
2. **`handle_bulk_movement` e `handle_multi_movement`** restano con la stessa firma finché la UI nuova non le sostituisce, ma riscritte sopra `posizioni_utensile`:
   - `carico` ⇒ come `deposita` in `magazzino`, stato `nuovo`.
   - `scarico` ⇒ toglie da `magazzino` con priorità `usato` → `riaffilato` → `nuovo`; se `p_commessa_id` è valorizzato, prima dal `cassetto` di quella commessa. I pezzi **escono dal sistema** come oggi (tipo `scarico`, nessuna macchina).
   - `spostamento` ⇒ da `magazzino` a `cassetto` della commessa.
3. `giacenze_commesse`: dopo la migrazione dati **non si cancella**, si rinomina in `giacenze_commesse_legacy` e non viene più scritta. Si elimina in una migration successiva, dopo l'ok di Giorgio.
4. Anche il fallback client-side in `useMovementStore`/`useMultiMovementStore` (introdotto il 2026-09-24) scrive direttamente su `Utensili_B1`: **lo rimuove Claude** lato UI quando le RPC nuove sono pronte. Fino ad allora il trigger del punto 1 e le scritture dirette si pesterebbero: Gemini deve segnalare in §10 se va gestito prima.

---

## 8. Migrazione dei dati esistenti (una migration dedicata, rilanciabile)
1. Per ogni riga di `giacenze_commesse` con quantita > 0 ⇒ posizione `cassetto`, stato `nuovo`.
2. Per ogni utensile ⇒ posizione `magazzino`, stato `nuovo`, quantita = `"Quantità"` − Σ giacenze_commesse (se > 0).
3. Verifica finale in SQL: per ogni utensile, Σ posizioni (magazzino+cassetto) = `"Quantità"` originale. Se una riga non torna, la migration **fallisce** e stampa gli id: meglio fermarsi che perdere pezzi.
4. Utenti `Admin` ⇒ tutti i flag true.

---

## 9. Fasi e consegne

| Fase | Backend (Gemini) | Frontend (Claude) | Consegna backend = |
|---|---|---|---|
| **1** | §2 schema + §7.1 trigger + §8 migrazione | mock JSON con queste forme in `src/mocks/lifecycle/`, store `useProduzioneStore` sui mock | migration applicabile + query di verifica §8.3 che passa |
| **2** | §3 letture + §4.1-4.3 + §4.7 | Prelievo guidato, Deposito, In produzione + Smonta | RPC + script `supabase/tests/lifecycle_fase2.sql` con gli scenari di §9.1 |
| **3** | §4.4-4.6 + §3.3 | Riaffilature (cestello, spedizione, rientro guidato, menu ⋮) | come sopra, `lifecycle_fase3.sql` |
| **4** | §3.5 + §6 + §7.2 | Dashboard, rimozione fallback client-side, schermate smartphone | come sopra, `lifecycle_fase4.sql` |

### 9.1 Scenari minimi di test (SQL, da far passare prima di consegnare)
1. Deposito 50 nuovi su cassetto 24-118 ⇒ `"Quantità"` +50, posizione cassetto = 50.
2. Prelievo 1 usato dal cassetto verso CNC 03/24-118 ⇒ cassetto −1, macchina +1, `"Quantità"` −1.
3. Stessa chiamata ripetuta con lo stesso `id_operazione` ⇒ nessun cambiamento, `gia_eseguita: true`.
4. Prelievo di 5 quando ce ne sono 3 ⇒ `GIACENZA_INSUFFICIENTE` con `DETAIL` corretto e nessuna modifica.
5. Smonta `buono` di un `nuovo` con commessa ⇒ torna nel cassetto come `usato`.
6. Smonta `consumato` di un pezzo con `n_riaffilature = 3`, max 3 ⇒ scarto `usura_limite_riaffilature`, non in cestello.
7. Spedisci cestello ⇒ spedizione con tutti i pezzi, cestello vuoto.
8. Rientro con 1 scartato su 4 ⇒ 3 riaffilati con n+1 nella destinazione, 1 scarto `scarto_fornitore`.
9. `annulla_operazione` sul rientro ⇒ tutto come prima del rientro, spedizione `in_viaggio`.
10. `annulla_operazione` su un prelievo dopo che il pezzo è stato smontato ⇒ `ANNULLO_NON_POSSIBILE`.
11. Utente senza `can_manage_riaffilature` che spedisce ⇒ `PERMESSO_NEGATO`.
12. `handle_bulk_movement('scarico')` legacy continua a funzionare e `"Quantità"` resta coerente con le posizioni.

---

## 10. Domande aperte
Chi scopre un problema lo aggiunge qui con: numero, autore, data, domanda, proposta. Si risolve solo con l'ok di Giorgio, poi si aggiorna il contratto e la versione in cima.

- **D1** (Claude, 2026-09-24) — `HistoryView.jsx` tratta ogni `tipo_operazione` diverso da `carico` come "Scarico" (badge, totali, filtro). Con i nuovi tipi un `deposito` apparirebbe come scarico e i totali sarebbero sbagliati. Proposta: la UI dello storico mappa i nuovi tipi su etichette leggibili (lo fa Claude); il backend usa i nuovi nomi. ✅ *Approvata da Giorgio il 2026-09-24 — implementata in `src/lib/movementTypes.js`.*

- **D2** (Gemini, 2026-09-24) — Riguardo al punto §7.4: Se il frontend continua ad utilizzare il fallback client-side (`useMovementStore`/`useMultiMovementStore`) che scrive direttamente su `Utensili_B1."Quantità"`, ci sarà un conflitto con il nuovo trigger su `posizioni_utensile` che ricalcola lo stesso campo. Dato che entrambi agiscono sul medesimo dato, le quantità potrebbero corrompersi o disallinearsi. **Proposta**: Sincronizzare il deploy di questa Fase 4 strettamente con il rilascio del frontend aggiornato (che rimuove il fallback). In alternativa, se non è possibile disattivare il fallback lato frontend contestualmente, il backend dovrebbe temporaneamente disabilitare il trigger di ricalcolo o la scrittura client-side su `Utensili_B1` (es. tramite RLS o bloccandolo se viene da client). L'opzione consigliata è il rilascio simultaneo.
  - ✅ *Risposta (Claude, 2026-09-24, in attesa dell'ok di Giorgio)*: rilascio contemporaneo. Ordine: migration corrette → verifica §8.3 → frontend senza fallback client-side e con `VITE_LIFECYCLE_UI=true`, nello stesso intervento. Il fallback lo rimuove Claude.
