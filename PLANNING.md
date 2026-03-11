# 📋 PLANNING - Berc Utensili Warehouse Management

## 🎯 Project Overview
App React per gestione magazzino utensili CNC con:
- Ricerca utensili (testuale + filtri cascata dinamici)
- Carico/Scarico da magazzino
- Lettura Barcode/QR code
- Storico movimenti
- Admin panel protetto da password

**Stack**: React + Tailwind + Supabase + Vercel

---

## 📅 Milestones & Timeline

### Phase 1: Setup & Planning ✅
- **Target**: 11/03/2026
- Setup progetto React + Tailwind
- Creazione schema database Supabase
- Planning e design UI
- **Deliverables**: Repo inizializzato, file .md planning, schema DB

### Phase 2: Core Features Development
- **Target**: 18/03/2026
- Componenti React base
- Integrazione Supabase
- Gestione categorie dinamiche
- Ricerca e filtri
- **Deliverables**: MVP ricerca funzionante

### Phase 3: Barcode & Movimento
- **Target**: 25/03/2026
- Lettura barcode/QR
- Carico/Scarico logica
- Storico movimenti
- **Deliverables**: Funzionalità carico/scarico operativa

### Phase 4: Admin Panel & Polish
- **Target**: 01/04/2026
- Admin panel con password
- Gestione utensili (add/edit)
- Responsive design finalizzato
- **Deliverables**: App completa

### Phase 5: Testing & Deploy
- **Target**: 08/04/2026
- Testing cross-browser/mobile
- Deploy su Vercel
- **Deliverables**: App in produzione

---

## 🚀 Features Principales

1. **Home Page - Ricerca & Selezione Utensili**
   - Filtri cascata dinamici da Supabase
   - Carosello con card icone utensili
   - Pulsanti Carica/Scarica
   - Input Barcode/QR

2. **Barcode/QR Scanner**
   - Lettura da dispositivo mobile/PC
   - Fallback input manuale
   - Ricerca utensile per codice

3. **Carico/Scarico Magazzino**
   - Selezione quantità
   - Conferma operazione
   - Tracciamento storico completo

4. **Admin Panel (Password Protected)**
   - Gestione categorie
   - Add/Edit utensili
   - Modifica disponibilità
   - Visualizzazione storico

5. **Storico Movimenti**
   - Chi, cosa, quando
   - Export dati

---

## 📊 Struttura Componenti React

```
src/
├── components/
│   ├── Home.jsx                    # Pagina principale
│   ├── FilterCarousel.jsx          # Carosello filtri
│   ├── BarcodeScanner.jsx          # Lettore barcode
│   ├── LoadUnloadModal.jsx         # Modal carico/scarico
│   ├── AdminPanel.jsx              # Panel admin
│   ├── ToolForm.jsx                # Form add/edit utensili
│   └── HistoryView.jsx             # Visualizzazione storico
├── hooks/
│   ├── useSupabase.js              # Connessione DB
│   ├── useBarcodeInput.js          # Gestione input barcode
│   └── useCategories.js            # Caricamento categorie dinamiche
├── services/
│   ├── supabaseClient.js           # Configurazione Supabase
│   ├── toolService.js              # CRUD utensili
│   ├── inventoryService.js         # Carico/scarico
│   └── historyService.js           # Storico movimenti
└── App.jsx
```

---

## 🗄️ Database Schema (Supabase)

Vedi **SUPABASE_SCHEMA.md** per dettagli completi:

- **tools** - Catalogo utensili
- **categories** - Categorie dinamiche
- **inventory** - Quantità disponibile
- **movements_history** - Storico carico/scarico
- **users** (opz) - Tracciamento operatore

---

## ��� Task Backlog

Vedi **TASKS_BACKLOG.md** per lista dettagliata con:
- Task per fase
- Componenti React
- Integrazioni Supabase
- Testing
- Priority

---

## 🎨 UX/UI Design

Vedi **UX_UI.md** con:
- Layout pagina principale
- Mockup componenti
- Responsive design strategy
- Accessibility notes

---

## ⚙️ Configurazione Tecnica

### Dependencies
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "tailwindcss": "^3.x",
  "@supabase/supabase-js": "^2.x",
  "jsqr": "^1.x",  // QR code decoding
  "quagga2": "^1.x"  // Barcode decoding
}
```

### Environment Variables (.env.local)
```
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_PASSWORD=1234
```

---

## ✅ Success Criteria

- [ ] App carica categorie dinamiche da Supabase
- [ ] Ricerca per filtri funzionante
- [ ] Lettura barcode da smartphone/tablet/PC
- [ ] Carico/scarico aggiorna quantità
- [ ] Storico traccia chi, cosa, quando
- [ ] Admin panel accessibile con password 1234
- [ ] Interfaccia responsive su mobile e desktop
- [ ] Deploy su Vercel
- [ ] Zero console errors

---

## 📞 Note & Decisions

- Categorie e campi obbligatori caricati DINAMICAMENTE da DB
- Codice barcode: colonna "codice" (fallback "serialnumber")
- Password admin fissa: "1234"
- Storico: tabella movements_history con user_id, timestamp, tipo_operazione, quantità
- Real-time updates via Supabase subscription (opzionale fase successiva)