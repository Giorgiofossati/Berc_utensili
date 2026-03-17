# Task List — Interfaccia Utensili Bercella

## 🔴 Bug / Problemi Attuali

### 1. Ricerca Barcode non funziona correttamente
- [x] Reimposta le spaziature tra elementi che si sovrappongono nella sezione scanner
- [x] Quando digito il codice manualmente si deve aggiornare la schermata entrando in **modalità ricerca manuale** dove vedo una lista compatta che si aggiorna **in tempo reale** digitando il codice. Attualmente funziona solo premendo Enter e apre direttamente il modale movimento senza mostrare risultati intermedi.
- [x] La lista in tempo reale deve mostrare tutti gli utensili il cui codice corrisponde ai caratteri inseriti (filtro parziale)

---

## 🟡 Funzionalità Mancanti (da UI_UX_Roadmap.md)

### 2. Toggle Carousel ↔ Filtri a Tendina
- [x] Aggiungere un **pulsante/icona di toggle** visibile nell'area centrale per passare dalla modalità **Carousel** alla modalità **Filtri a Tendina** e viceversa
- [x] In modalità filtri a tendina: mostrare un elenco a **griglia compatta** con card orizzontali sottili che mostrano gli utensili filtrati
- [x] Se gli utensili filtrati sono troppi, mostrare una **barra di scorrimento laterale** ben visibile e cliccabile

### 3. Livello 2 — Selezione DIAMETRO (mancante)
- [x] Dopo Tipologia (L0) → Forma (L1), aggiungere un **Livello 2** che mostra una **lista compatta** dei DIAMETRI disponibili (filtrati dai livelli precedenti)
- [x] I diametri devono essere presentati come lista compatta, non come card del carousel

### 4. Livello 3 — Lista Utensili a Griglia (mancante)
- [x] Dopo la selezione del diametro, mostrare una **lista compatta a griglia** degli utensili corrispondenti
- [x] Ogni riga deve mostrare i seguenti dettagli tecnici:
  1. **Descrizione aggregata** (Tipologia + Forma + Diametro + Passo + Tolleranza + Materiale + Rivestimento + Sistema di Misura)
  2. **Ubicazione**
  3. **Stato**
  4. **Quantità**
  5. **Codice**
  6. **Serial Number**
- [x] In alto nel Livello 3: aggiungere **menu a tendina** per filtrare le categorie rimanenti:
  - Lunghezza, Materiale, Tolleranza, Passo, Angolo, Rivestimento, Stato, Fornitore, Lavorazione, Sistema di Misura

### 5. Filtri Dinamici (mancante)
- [x] I filtri visibili devono aggiornarsi **dinamicamente**: se per gli elementi di una classe selezionata una colonna è `null` (tutti i valori sono null), quel filtro **non deve essere mostrato**

---

## 🟢 Funzionalità Già Implementate (da verificare e raffinare)

### ✅ Header (Info Bar)
- [x] Pulsante UTENTE a sinistra con menu collassabile
- [x] Data attuale in formato GG/MM/AAAA a destra
- [x] Stile Glassmorphism

### ✅ Carousel Component (Livello 0 e 1)
- [x] Carousel di card orizzontali con navigazione Dx/Sx
- [x] Card centrale in focus con 2 card laterali visibili
- [x] Click su card → navigazione al livello successivo
- [x] FRESA come prima categoria
- [x] Animazioni con Framer Motion (spring transitions)
- [x] Frecce e drag per lo scorrimento
- [x] Pulsante "indietro" per tornare al livello precedente

### ✅ Footer (Quick Actions)
- [x] Pulsante CARICO (Verde) a sinistra
- [x] Pulsante BARCODE/SCANNER (Cyan) al centro
- [x] Pulsante SCARICO (Rosso) a destra

### ✅ Altro
- [x] Modale per movimento Carico/Scarico
- [x] Storico movimenti
- [x] Toast notifications
- [x] Premium design con Glassmorphism

### 6. Layout e Responsive Design
- [x] Assicurarsi che tutti gli elementi si adattino ai diversi schermi (Responsive Design).
- [x] Creare una barra di scorrimento laterale ben visibile e cliccabile per scorrere la lista se gli elementi non stanno nella schermata.

### 7. Gestione Colori (Look Industriale Professionale)
- [ ] Rimuovere l'utilizzo del colore `indigo` dal CSS globale e dai componenti (es. `accent-indigo`).
- [ ] Creare e utilizzare un nuovo `accent-blue` o focalizzarsi su `accent-cyan` per bottoni, selezioni e highlight primari.
- [ ] Aggiungere `accent-orange` per contrasti e comandi secondari di reset/avviso.
- [ ] Aggiornare in `App.jsx` e `index.css` ogni riferimento ai vecchi colori per completare il restyle.

---

## 🔵 Funzionalità Future (Sessione di Domani)

### 8. Utenti e Privilegi
- [ ] Creare la tabella `utenti` su Supabase (Nome, Cognome, Codice ID, Ruolo, Password).
- [ ] Implementare la selezione utente con ricerca per nome o ID nella UI.
- [ ] Gestione permessi:
  - **Operatore**: Solo filtri e operazioni di carico/scarica.
  - **Admin**: Tutti i privilegi + accesso protetto da password (carica/scarica/nuovi utensili).
- [ ] Tracciare l'utente nei movimenti di magazzino.