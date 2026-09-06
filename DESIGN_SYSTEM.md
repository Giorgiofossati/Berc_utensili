# Design System: Bercella Utensili CNC

Documento di riferimento ufficiale per l'interfaccia utente di **Bercella Utensili**.  
Qualsiasi nuova schermata, componente o modifica deve conformarsi **rigorosamente** a queste specifiche, senza introdurre stili arbitrari o deviazioni.

---

## 1. Filosofia & Identità Visiva ("Industrial Professional Look")

L'applicazione è progettata per operatori di officina meccanica e amministratori di magazzino CNC.  
L'ambiente operativo richiede:
- **Massima leggibilità istantanea:** Contrasti netti, testi ben gerarchizzati, zero elementi decorativi fini a se stessi.
- **Ergonomia tattile (Touch-First):** Touch target minimi di 44×44px su mobile/tablet per operatori che usano guanti o schermi touch da officina.
- **Layout App-Like (Single-Screen 100vh/100dvh):** L'applicazione non scrolla l'intero viewport (`overflow-hidden` su root). Lo scroll è delegato esclusivamente ai contenitori dati interni (`flex-1 min-h-0 overflow-y-auto`).
- **Glassmorphism funzionale e leggero:** Pannelli semitrasparenti con sfocatura (`backdrop-blur-xl/2xl`), senza mai nidificare contenitori glass dentro altri contenitori glass (evita cali di frame-rate e ombre sovrapposte).

---

## 2. Palette Colori & Token Semantici

### 🚫 Regola Fondamentale sui Colori
> **DIVIETO ASSOLUTO:** Non utilizzare **MAI** il colore `indigo`, né varianti violacee per l'interfaccia.  
> Il design system si basa esclusivamente sul binomio **Ciano/Blu Tecnico + Arancione Industriale**, coadiuvato da Verde Smeraldo (Carico/Disponibile) e Rosa Rubino (Scarico/Esaurito).

### Token Colori Primari & Funzionali
| Token Semantico | Valore HEX / Tailwind | Ruolo e Utilizzo |
| :--- | :--- | :--- |
| **Accent Blue / Cyan** | `#0ea5e9` (`sky-500`) / `#06b6d4` (`cyan-500`) | Colore primario brand, focus ring, icone primarie, badge informativi, selezione riga. |
| **Accent Orange** | `#f97316` (`orange-500`) / `#ea580c` (`orange-600`) | Colore secondario/alert: overline, avvisi, alert scorte, tasto reset filtri, ordine riassortimento. |
| **Accent Emerald (Success)** | `#10b981` (`emerald-500`) | Operazione **CARICO / DEPOSITA**, stato `Disponibile` / `NUOVO`, giacenze positive (> 0 pz). |
| **Accent Rose (Destructive)** | `#f43f5e` (`rose-500`) | Operazione **SCARICO / PRELEVA**, stato `Esaurito`, giacenze a zero (0 pz), eliminazione. |

### Superfici & Background (Tema Chiaro vs Scuro)
| Elemento | Tema Chiaro (Light Mode) | Tema Scuro (Dark Mode) |
| :--- | :--- | :--- |
| **Sfondo Globale** | `#f8fafc` (`slate-50`) con gradienti radiali morbidi | `#020617` (`slate-950`) con texture industriale e radial glow |
| **Pannelli Glass (`.glass-panel`)** | `rgba(255, 255, 255, 0.75)` + bordo `rgba(0,0,0,0.08)` | `rgba(15, 23, 42, 0.45)` + bordo `rgba(255,255,255,0.12)` |
| **Bottoni Glass (`.glass-button`)** | `rgba(255, 255, 255, 0.85)` + bordo `rgba(0,0,0,0.08)` | `rgba(15, 23, 42, 0.65)` + bordo `rgba(255,255,255,0.12)` |
| **Testo Principale** | `#0f172a` (`slate-900`) | `#ffffff` / `#f8fafc` (`slate-50`) |
| **Testo Secondario** | `#475569` (`slate-600`) | `#94a3b8` (`slate-400`) |
| **Testo Muted / Caption** | `#64748b` (`slate-500`) | `#64748b` (`slate-500`) |

---

## 3. Sistema Tipografico e Font

### Font Family Ufficiale
- **Font Ufficiale di Progetto:** [`Inter`](https://fonts.google.com/specimen/Inter)
  - Caricato in `index.html` e applicato globalmente a tutta l'applicazione tramite `--font-inter: "Inter", ui-sans-serif, system-ui, sans-serif;`.
  - Rimane il font storico e identitario del progetto Bercella, garantendo pulizia, leggibilità e perfetta resa visiva.

### Regola di Applicazione
Tutti i testi dell'applicazione **devono utilizzare esclusivamente le classi semantiche `.app-*`** definite in `src/index.css`. È vietato introdurre classi arbitrarie come `text-5xl`, `text-[13px]`, `tracking-widest` sparse nei file.

| Classe Semantica | Definizione Tailwind | Utilizzo Obbligatorio |
| :--- | :--- | :--- |
| `.app-overline` | `text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]` | Micro-titoli di sezione, overline card, indicatori di livello (es. "LIVELLO 2", "TRACCIAMENTO LOG"). |
| `.app-h1` | `text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight` | Titoli primari delle viste e pagine principali (es. "GESTIONE OPERATORI", "STORICO MOVIMENTI"). |
| `.app-h2` | `text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight leading-tight` | Titoli di modali, dialog e card primarie (es. "DETTAGLIO UTENSILE", "NUOVO INSERIMENTO"). |
| `.app-h3` | `text-xs sm:text-sm font-bold uppercase tracking-tight leading-snug` | Titoli di articoli in liste/tabelle, intestazioni card griglia, titoli tessere diametro. |
| `.app-body` | `text-xs sm:text-sm font-medium leading-relaxed` | Testo standard di spiegazione, descrizioni form, note, dettagli tecnici. |
| `.app-caption` | `text-[10px] sm:text-xs font-semibold font-mono` | Codici aziendali, timestamp, metadati secondari, ID transazioni (applica automaticamente `JetBrains Mono`). |
| `.app-qty-sm` | `text-xs sm:text-sm md:text-base font-black tabular-nums` | Numeri di quantità nelle righe di tabelle e liste compatte. |
| `.app-qty-lg` | `text-2xl sm:text-3xl md:text-4xl font-black tabular-nums leading-none` | Quantità in evidenza nei modali di dettaglio e nei contatori principali. |

---

## 4. Spaziature, Dimensioni Card & Raggi di Curvatura

### Regola Fondamentale per Card Affiancate (Sibling / Split Cards)
> [!IMPORTANT]
> **Divieto di Asimmetria nelle Card Affiancate:**
> Quando due o più card sono disposte l'una accanto all'altra su desktop (es. la presentazione tutorial e il box login nella schermata di accesso), il contenitore genitore **deve sempre utilizzare `items-stretch`** e le card interne devono avere `h-full flex flex-col justify-between`.
> - **Altezza:** Identica al pixel per tutte le card affiancate. MAI usare `items-center` con altezze libere diverse che causano "galleggiamento" asimmetrico e sgradevole.
> - **Raggio di curvatura:** Identico (es. `rounded-[32px]`).
> - **Padding:** Identico (`p-6 sm:p-8`).
> - **Allineamento Linee di Base:** Gli header devono partire alla stessa altezza superiore e i footer di stato (`border-t`) devono coincidere esattamente sulla stessa linea di base inferiore.

### Scala Dimensionale delle Card
- **Tessere Categorie (Carosello / Griglia Livello 1):** Aspetto 1:1 rigoroso (`aspect-square`), dimensioni fluide responsive `max-w-[155px]` fino a `max-w-[235px]`, raggio `rounded-[16px] md:rounded-[20px]`.
- **Tessere Diametro / Sigle (Livello 2):** Griglia `auto-fill / minmax(130px, 1fr)`, altezza minima omogenea `min-h-[82px] sm:min-h-[88px]`, raggio `rounded-[16px] sm:rounded-[18px]`.
- **Card Interne Liste (Queue Drawer, User rows):** Altezza automatica densa (`p-3 sm:p-4`), raggio `rounded-[20px] sm:rounded-[24px]`.
- **Macro Card & Modali (Login, Dialog Movimento, Form Utensile):** Raggio unificato `rounded-[32px]` (o `rounded-[28px] sm:rounded-[36px]`), padding calibrato `p-6 sm:p-8`, altezza massima `max-h-[90dvh]` a schermo intero senza scroll globale.

### Scala Raggi di Curvatura (Border Radius)
- **Tag / Badge / Micro-Pill:** `rounded-full` o `rounded-md` (`6px`)
- **Bottoni Standard / Input / Select:** `rounded-xl` (`12px`) o `rounded-[14px]`
- **Tessere Diametro / Category Cards:** `rounded-[16px]` (`sm:rounded-[18px]`)
- **Pannelli Glass / Toolbar / Righe Lista:** `rounded-[20px]` (`md:rounded-[24px]`)
- **Modali Principali / Dialog / Card Grandi:** `rounded-[32px]`

### Safe Zones & Dispositivi Mobili (iOS Safari / PWA)
- Tutte le viste devono rispettare i margini hardware tramite le utility:
  - Container principale: `.app-container` (include `env(safe-area-inset-*)`).
  - Toast di sistema: `.safe-toast-top`.
  - Floating Action Bar e Drawer: `calc(12px + env(safe-area-inset-bottom, 0px))`.
- **Prevenzione Ritaglio Bordi (Clip Outlines):** Nei contenitori con scroll verticale (`overflow-y-auto`), prevedere sempre un padding interno `p-2 pb-8` (o `pb-24` se ci sono bottoni fissi in basso) per evitare che contorni di focus (`ring`), ombreggiatura (`box-shadow`) o badge vengano tagliati dal bordo del contenitore.

---

## 5. Componenti Standardizzati

### A. Bottoni di Azione (Macro Actions)
- **Bottone Carica / Deposita:**
  - Classe: `.action-btn-carica` (sfondo verde `#10b981`, testo bianco o slate scuro, ombra verde smeraldo).
- **Bottone Scarica / Preleva:**
  - Classe: `.action-btn-scarica` (sfondo rosa rubino `#f43f5e`, testo bianco, ombra rosa rubino).
- **Bottone Ordine Riassortimento:**
  - Classe: `.action-btn-order` o arancione industriale (`#f97316`).
- **Bottone Glass / Secondario:**
  - Classe: `.glass-button` con hover scale `active:scale-95` e transizioni rapide (`duration-200`).

### B. Badge di Stato & Quantità
- `.badge`: `px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase inline-flex items-center justify-center whitespace-nowrap`
- `.badge-emerald`: Giacenza > 0, stato `Disponibile`, operazione `Carico`.
- `.badge-rose`: Giacenza = 0, stato `Esaurito`, operazione `Scarico`.
- `.badge-blue`: Codice aziendale, fornitore, stato informativo.
- `.badge-orange`: Ubicazione magazzino, alert, stato `Da Ordinare`.

### C. Tabelle Inventario & Log (TanStack Table + Virtualizer)
- **Mobile Rule (Zero Scroll Orizzontale):**
  - Mostrare sempre su mobile: Icona utensile, Descrizione abbreviata `.app-h3`, Quantità `.app-qty-sm`.
  - Nascondere su mobile via `hidden md:flex`: Ubicazione, Fornitore, Stato, Codice Aziendale.
  - Cliccando qualsiasi riga si apre il **Modale Dettaglio Utensile** che mostra tutte le colonne e info accessorie.
- **Dimensioni Fisse Colonne Header/Celle:**
  - Descrizione: `meta: { isFlex: true }`, `size: 0` (assorbe tutto lo spazio orizzontale rimanente con `truncate`).
  - QTY: `size: 64` (o `70px`), fissa, centrata.
  - Ubicazione / Fornitore / Stato: `size: 100-140px`, fisse.

### D. Modali & Dialog (Single-Screen / No Scroll Interno Inutile)
- **Standard Obbligatorio:** Utilizzare sempre `@/components/ui/dialog` basato su Radix UI. Non creare div full-screen con overlay manuali (evita rotture di focus trap e scroll-lock).
- **Dimensioni & Layout:**
  - `max-w-3xl` per dettaglio/movimento, `max-w-md` per ordini o conferme.
  - Altezza massima `max-h-[92dvh]`.
  - Nessuno scroll interno forzato se il contenuto può stare comodamente a schermo. Usare griglie a 2/3 colonne compatte (`p-2.5`, testo compatto) per i parametri tecnici.

### E. Form & Campi di Input
- **Touch-Friendly & No Auto-Zoom iOS:** Tutti gli input di testo devono avere `text-sm` (almeno 14-16px) per prevenire lo zoom automatico di Safari su iPhone.
- **Focus Rings:** Sempre visibili con `focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:border-accent-blue`.
- **Pulsante Cancella ('X'):** Ogni input di ricerca deve avere un pulsante dedicato per azzerare il campo con un tap.

---

## 6. Checklist di Controllo Qualità per ogni Modifica

Prima di considerare conclusa qualsiasi modifica o nuova feature, verificare:
1. [ ] **Nessun colore `indigo`** presente nel codice aggiunto o modificato.
2. [ ] **Zero scroll orizzontale** su viewport mobile (375px - 428px).
3. [ ] **Nessun testo con classi arbitrarie** (verificato l'uso di `.app-overline`, `.app-h1`, `.app-h2`, `.app-h3`, `.app-body`, `.app-caption`, `.app-qty-*`).
4. [ ] **Touch target minimi:** tutti i bottoni e chip cliccabili hanno un'area utile confortevole (minimo 36-44px).
5. [ ] **Dialog Shadcn nativi:** tutti i popup/modali usano `<Dialog>` e `<DialogContent>`, senza modali custom `fixed inset-0` orfani.
6. [ ] **Doppio tema verificato:** il componente è perfettamente leggibile sia in Dark Mode (`.dark`) che in Light Mode.
7. [ ] **Build pulita:** `npm run build` eseguito con esito positivo senza errori.
