> ⚠️ **Superato (2026-09-24)**: schema e RPC sono ora definiti in [`docs/CONTRACT_LIFECYCLE.md`](docs/CONTRACT_LIFECYCLE.md), la UI nei prototipi approvati. Questo file resta come storico della richiesta iniziale.

# HANDOFF DOCUMENT: Gestione Ciclo di Vita Utensili e Controllo Costi

## 🎯 Obiettivo del Progetto
Evolvere l'attuale sistema di "Gestione Magazzino Semplice" in un sistema completo di **Tracciamento del Ciclo di Vita (Lifecycle Management)** e **Controllo di Gestione/Costi**. 
L'app dovrà tracciare il percorso fisico degli utensili (Magazzino -> Macchina/Commessa -> Riaffilatura -> Scarto) e calcolarne l'impatto economico.

---

## 🏗️ 1. Architettura Database (Supabase)

Le seguenti modifiche dovranno essere applicate al database.

### 1.1 `Utensili_B1` (Anagrafica e Giacenze Base)
Aggiungere le seguenti colonne per separare le giacenze e calcolare i costi:
- `giacenza_riaffilati` (INT, default 0)
- `prezzo_acquisto` (NUMERIC, default 0.00)
- `costo_riaffilatura` (NUMERIC, default 0.00)
*(Nota: L'attuale colonna `giacenza` rappresenterà gli utensili "Nuovi").*

### 1.2 `utenti` (RBAC - Role Based Access Control)
Sostituire la logica basata solo sulla stringa "ruolo" con flag booleani granulari (per predisporre futuri workflow a "richiesta"):
- `can_view_dashboard` (BOOL, default false) - Solo Admin
- `can_manage_catalog` (BOOL, default false) - Admin / Responsabile
- `can_pick_tools` (BOOL, default true) - Operatori
- `can_manage_riaffilature` (BOOL, default false) - Admin / Responsabile

### 1.3 `macchine_cnc` (Nuova Tabella)
Anagrafica dei centri di costo fisici:
- `id` (UUID, PK)
- `nome_macchina` (VARCHAR)
- `reparto` (VARCHAR, nullable)
- `is_active` (BOOL, default true)

### 1.4 `produzione_attiva` (Nuova Tabella - Cuore del Tracciamento)
Traccia gli utensili che sono usciti dal magazzino centrale e si trovano a bordo macchina (o assegnati a commessa).
- `id` (UUID, PK)
- `id_utensile` (UUID, FK -> Utensili_B1)
- `id_macchina` (UUID, FK -> macchine_cnc)
- `quantita` (INT)
- `stato_utensile` (VARCHAR) -> ENUM: 'Nuovo', 'Riaffilato'
- `commessa_origine` (VARCHAR) -> Testo libero. NOTA: Useremo una stringa speciale `[Generico Macchina]` per gli utensili di base.
- `data_carico` (TIMESTAMPTZ, default now())

### 1.5 `riaffilature_attive` (Nuova Tabella)
Traccia gli utensili fisicamente presso il fornitore (cestello rosso).
- `id` (UUID, PK)
- `id_utensile` (UUID, FK -> Utensili_B1)
- `quantita` (INT)
- `commessa_origine` (VARCHAR, nullable)
- `data_invio` (TIMESTAMPTZ, default now())

### 1.6 `movements_history` (Aggiornamento Log Transazioni)
Aggiungere campi per tracciare il contesto:
- `causale_scarto` (VARCHAR, nullable) -> Es: "Usura", "Collisione", "Non Affilabile".
- `id_macchina` (UUID, FK, nullable).
- Aggiornare i valori accettati per `tipo_movimento` includendo: `PRELIEVO_MACCHINA`, `SCARTO_MACCHINA`, `INVIO_RIAFFILATURA`, `RIENTRO_RIAFFILATURA`, `TRASFERIMENTO_COMMESSA`.

---

## 🧠 2. Logica di Business e RPC (Stored Procedures)

Per evitare disallineamenti di magazzino se cade la connessione del tablet, le azioni complesse devono essere gestite da RPC (Remote Procedure Call) in PostgreSQL:
1. **`smart_pick_tool`**: Prende i parametri (id_utensile, qty, stato, sorgente, id_macchina, commessa). Se la sorgente è il Magazzino, scala da `Utensili_B1`. Se la sorgente è un'altra macchina/commessa, scala da `produzione_attiva`. Inserisce in `produzione_attiva` per la nuova destinazione e logga su `movements_history`.
2. **`checkin_regrinding_batch`**: Prende un array di ID da `riaffilature_attive`, la quantità tornata intatta (che va sommata a `giacenza_riaffilati` in `Utensili_B1`) e la quantità scartata (che va persa, con causale). Elimina/aggiorna la riga in `riaffilature_attive`.
3. **`get_dashboard_stats`** (o View SQL dedicata): Calcola il Risparmio Totale (Riaffilature Rientrate * (Prezzo Nuovo - Costo Riaffilatura)), i costi per Macchina e le percentuali delle Causali di Scarto.

---

## 💻 3. Sviluppo Frontend (React + Zustand)

### 3.1 Gestione Stato (Zustand)
- Creare `useProduzioneStore.js`:
  - `fetchMacchine()`, `fetchAllocazioniAttive()`
  - Metodi per le azioni: `trasferisciUtensile`, `scartaUtensile`, `inviaRiaffilatura`.
- Aggiornare `useAuthStore.js` per esportare i boolean `can_view_dashboard`, ecc.

### 3.2 Modifica Modale Prelievo (Smart Pick)
Sostituire la logica attuale. Il modale deve chiedere **obbligatoriamente**:
- **Da dove prelevi? (Sorgente)**: Tendina popolata dinamicamente. Es: "Magazzino Centrale (Nuovi: 5)", "Commessa Ducati - Macchina 1 (Qta: 1)".
- **Macchina Destinazione**: Menu a tendina.
- **Commessa Destinazione**: Input testuale/tendina. Avrà sempre come prima opzione `[Generico / Attrezzaggio Base]`.
- **Quantità e Stato (Nuovo/Riaff)**.

### 3.3 Nuova Vista: "Commesse Attive"
- Raggruppa i dati di `produzione_attiva` per `commessa_origine`.
- Permette di vedere a colpo d'occhio tutti gli utensili impegnati in un progetto, a prescindere dalla macchina su cui si trovano.

### 3.4 Nuova Vista: "Bordo Macchina" (Gestione Reparto)
- Griglia delle `macchine_cnc`.
- Cliccando su una macchina, si apre la lista degli utensili montati, raggruppati per `commessa_origine`.
- **Azioni su riga**:
  - `Scarta`: Apre modale obbligatorio per la "Causale" (Usura, Collisione).
  - `Riaffila`: Sposta in `riaffilature_attive`.
  - `Trasferisci`: Scorciatoia per spostare su altra commessa/macchina.

### 3.5 Nuova Vista: "Check-in Riaffilature"
- Tabella alimentata da `riaffilature_attive`.
- L'utente seleziona le righe dei pacchi rientrati dal fornitore e per ciascuna dichiara: "X rientrati sani", "Y scartati dal fornitore".

### 3.6 Nuova Vista: "Dashboard Amministrativa"
- Accessibile solo se `can_view_dashboard` == true.
- Grafico a Torta: Causali di scarto (per isolare gli errori umani).
- Grafico a Barre: Consumo economico per Macchina CNC.
- Tabella KPI: "Risparmio Generato dalle Riaffilature" (metrica vitale).
- Tabella KPI: "Costo totale per Commessa".

---

## 🚀 4. Sequenza Operativa Suggerita per lo Sviluppatore / Agente AI
1. **Fase 1 (DB Foundation)**: Creare le tabelle (`macchine_cnc`, `produzione_attiva`, `riaffilature_attive`), aggiornare `Utensili_B1` e `utenti`. Creare le RPC Supabase fondamentali.
2. **Fase 2 (State & Data Fetching)**: Implementare `useProduzioneStore.js` e aggiornare l'auth.
3. **Fase 3 (Core UI)**: Creare la Sidebar Navigation, la vista `MacchineView` e `CommesseView` (in sola lettura).
4. **Fase 4 (Operational UI)**: Aggiornare il Modale di Prelievo e implementare i bottoni di azione (Scarta, Trasferisci, Riaffila) nelle viste Macchina/Commessa.
5. **Fase 5 (Check-in & Analytics)**: Sviluppare la pagina di rientro Riaffilature e infine la Dashboard Amministrativa con i grafici (es. Recharts).
