# M — Coerenza cross-schermata: header di pagina, back/breadcrumb, contenitori, toolbar, tabelle

> **Audit UX/UI · Berc_utensili** · Sessione 2026-09-18 · Viewport desktop 1440×900 (sidebar 288px → area contenuto 1152px, `app-container` px 16 → area utile x = 304…1424, 1120px).
> Tutte le misure in px sono **stime dagli screenshot** (±4px) e sono state incrociate con le classi Tailwind nel sorgente.

**Screenshot analizzati**: `03-home-lista-default`, `06-home-griglia-forma`, `07-home-diametri`, `08-home-tabella-filtrata`, `15-movimento-multiplo-distinta`, `16-movimento-multiplo-picker`, `17-movimento-multiplo-vuoto`, `18-commesse`, `21-storico-movimenti`, `22-gestione-operatori`, `29-scanner-deposito-rapido`, `30-scanner-lista-live`, `33-scanner-dettaglio-tab`.

**Sorgenti verificati**: `src/App.jsx` (righe 218–380), `src/components/layout/Header.jsx`, `src/features/inventory/MultiMovementView.jsx`, `src/features/inventory/ToolsGrid.jsx`, `src/features/inventory/AddToolToMultiModal.jsx`, `src/features/filters/DropdownFilterView.jsx`, `src/features/filters/DiameterList.jsx`, `src/features/admin/CommesseView.jsx`, `src/features/admin/HistoryView.jsx`, `src/features/admin/OperatorsView.jsx`, `src/features/scanner/ScannerView.jsx`, `src/components/common/DataTable/VirtualizedTable.jsx`, `src/index.css`.

---

## 0. Sintesi esecutiva

Sette viste di primo livello, **sette anatomie di header diverse**. Nessuna vista condivide con un'altra la stessa combinazione di {titolo, overline, back, azioni}. Il bordo sinistro del contenuto oscilla tra x=304 e x=336 (jitter 32px) e arriva a x=416 nello scanner. Il pulsante "torna indietro" esiste in **5 stili diversi** (e in 2 viste non esiste). La stessa tabella `ToolsGrid` viene montata in 4 contesti con 3 larghezze massime diverse e con la modalità "checkbox" governata da uno stato globale che trapela tra viste.

La causa non è "sciatteria" nei singoli file: è che `DESIGN_SYSTEM.md` specifica con precisione millimetrica **i modali** (Sez. 5.D: tier di larghezza, header icona+overline+titolo+X, footer) ma **non dice nulla sulle pagine**. Non esistono: un template di pagina, un componente `PageHeader`, una regola sul back/breadcrumb, una scala di larghezze per i contenitori di vista, una specifica della toolbar filtri, varianti dichiarate per la `DataTable`. Ogni sviluppatore (o agente) ha quindi ricostruito da zero l'header "guardando il modale più vicino", ottenendo sette interpretazioni.

---

## 1. Tabella comparativa (vista × anatomia)

Legenda posizione: `L` = sinistra, `R` = destra, `C` = centro. Le coordinate sono x (o x–x) in px a 1440.

| Vista (file) | Titolo (classe · size · pos) | Overline (testo · colore) | Back (label · stile · pos · target) | Azioni a destra | Contenitore: max-width (classe → effettivo) | Padding orizz. → bordo sx contenuto | Raggio pannello principale | Ricerca locale | Toolbar filtri |
|---|---|---|---|---|---|---|---|---|---|
| **03 Home · Elenco** (`App.jsx` + `DropdownFilterView`) | **nessuno** | nessuna | **nessuno** | toggle Elenco/Griglia 84×44 @x=1340 (è nel "breadcrumb bar" di App.jsx) | `max-w-7xl` (1280) → 1120 (clamp) | `px-2` → x≈313 | 24px (`rounded-[24px]`) | no (solo globale header) | 13 combobox h=32 rounded 14 su 2 righe (y=158–230) + "Seleziona" |
| **08 Home · Tabella filtrata** (`App.jsx` r.235–260 + `ToolsGrid`) | breadcrumb "FRESA / CANDELA / D10" · `text-xs` 12px bold (**non** `app-h1`) · L dentro pill | "FILTRO CORRENTE" · `text-[9px]` arbitrario · **arancione** | icona ← · cerchio glass **28px** (`p-1.5`+16) · L dentro pill · **arancione** · target <44 | "RESETTA TUTTO" pill h=30 @x=1197 + toggle vista | pill breadcrumb full-width (x=304–1181, h=47, r=16); tabella `max-w-[1600px]` → 1120 | `px-2` → x≈313 | 24px | no | 9 combobox h=32 + "Seleziona" (y=160–232) |
| **07 Home · Diametri** (`DiameterList`) | "SCEGLI IL DIAMETRO…" `app-h3` dentro card | "LIVELLO 2 · SELEZIONA DIAMETRO" · **blu** + badge "52 misure" | come 08 (pill breadcrumb) | "RESETTA TUTTO" + toggle | card `max-w-6xl` (1152) → x=336–1392 (1056) | interno card `px-6` | **32px** (`rounded-[32px]`) | **sì**, dentro header card, 288×36 @x=1079 | no |
| **15 Movimento Multiplo** (`MultiMovementView` r.83–96) | "MOVIMENTO MULTIPLO" · `app-h1` **forzato a 24px** (`md:text-2xl`) · L · con icon-box 40×40 r=14 | "DISTINTA OPERATIVA" · **blu** | **nessuno** | select commessa 282×40 + segmented PRELIEVO/DEPOSITO 228×40 + "AGGIUNGI UTENSILE" primary 188×40 r=12 — tutto in riga con il titolo, `border-b` sotto | `max-w-7xl mx-auto` → 1072 | `px-6` → x=328 | 24px + footer sticky separato r≈20 | no | no (azioni nel header) |
| **16 Picker distinta** (`AddToolToMultiModal`, modale) | "SELEZIONA UTENSILE PER LA DISTINTA" · `app-h2` **forzato a 16px** · L · icon-box 40 | "CATALOGO MAGAZZINO" · blu | X chiudi 44 · R | — | `max-w-6xl xl:max-w-7xl` → 1280 (x=80–1360) | `p-6` → x=106 | 32px modale / 20px tabella | **sì**, 1228×42 | no; contatore "1000 UTENSILI TROVATI" **duplicato** (y=220 modale, y=276 tabella) |
| **18 Commesse** (`CommesseView` r.193–240) | "COMMESSE" · `app-h1` 30px · L · icona folder 24 inline | "GESTIONE CENTRI DI COSTO" · **arancione** + badge "1 totali" | icona ← · glass-button **44×44 r=16** · **L** · **blu** | refresh 44×44 r=16 + "NUOVA COMMESSA" primary 208×44 r=16 | **nessun max-w** (`w-full`) → 1072 | `px-6` → x=328 | nessun pannello: card r=24 direttamente su sfondo | **sì**, 780×44 r=16 (y=169–213) | segmented Tutte/Attive/Chiuse 282×44 |
| **21 Storico** (`HistoryView` r.356–383) | "STORICO MOVIMENTI" · `app-h1` 30px · L · **no icona** | "TRACCIAMENTO LOG" · **arancione** | "**← Home**" · `glass-panel` 104×38 r=18 · **R** · blu | "Aggiorna" `glass-button` 100×34 r=18 (stile diverso dal bottone accanto) | `max-w-[1600px]` → 1088 | `px-4` → x=320 (titolo x=324) | 24px, full-height | **sì**, 450×36 r=14 | search + select + segmented TUTTI/CARICHI/SCARICHI + select, h=36 (y=162–197) |
| **22 Operatori** (`OperatorsView` r.345–358) | "GESTIONE OPERATORI" · `app-h1` 30px · L · no icona | "AMMINISTRAZIONE" · **arancione** | "**← Indietro**" · `glass-panel` 116×42 **r=20** · **R** · blu | — | `max-w-7xl` → 1068; **scroll dell'intera pagina** (`overflow-y-auto` sul contenitore, unico caso) | `px-6` → x=332 | **32px** (`rounded-[32px] p-6`, 2 pannelli) | **sì**, 600×46 r=16 **dentro** il pannello sx + refresh 44 | no |
| **29/30/31 Scanner Deposito/Prelievo** (`ScannerView` r.65–87) | "DEPOSITO RAPIDO"/"PRELIEVO RAPIDO" · `app-h1` 30px · **C** | "OPERAZIONE DI CARICO/SCARICO" · **verde/rosso** | icona ← · cerchio glass **40×40 rounded-full** · L flottante (x=324) · **arancione** · spacer fantasma a destra | — (segmented DETTAGLIO/DEPOSITA/PRELEVA 304×36 centrato sotto il titolo) | `max-w-[1600px]` esterno, ma **search `max-w-4xl` (896)** e empty-card `max-w-3xl` (768) → search x=416–1232, tabella x=321–1407 (**disallineate di 95px per lato**) | `px-4` → x=320 | 24px tabella / **36px** empty card / 32px camera | **sì**, 816×**62** r=24 (la più grande dell'app, 1.7× Commesse) + camera 64×64 | segmented h=36 |
| **33 Scanner Dettaglio** | "OPTICAL SCANNER" · terzo titolo per la stessa vista · C | "RICONOSCIMENTO LASER" · **ciano** | come 29 | — | come 29 | come 29 | camera 32px | sì | segmented |

### 1.1 Riepilogo numerico

| Attributo | Valori distinti osservati | N. varianti |
|---|---|---|
| Stile/posizione **titolo** | assente · pill 12px · h1 24px+icon-box · h1 30px+icona inline · h1 30px nudo · h1 30px centrato · h2 16px (modale) | **7** |
| Colore **overline** | arancione (08, 18, 21, 22) · blu (07, 15, 16) · verde/rosso/ciano (scanner) | **5** |
| **Back** | assente (03, 15) · cerchio 28 arancione in pill (08) · cerchio 40 arancione flottante (29) · quadrato 44 blu r16 sx (18) · "← Home" dx r18 (21) · "← Indietro" dx r20 (22) | **5 stili + 2 assenze** |
| **Bordo sinistro contenuto** | 313 · 320 · 321 · 324 · 328 · 332 · 336 · 416 | 8 valori, range **103px** |
| **max-width contenitore** | nessuno · `max-w-3xl` · `max-w-4xl` · `max-w-6xl` · `max-w-7xl` · `max-w-[1600px]` | **6** |
| **Raggio pannello principale** | 16 (pill) · 20 · 24 · 32 · 36 | **5** |
| **Altezza barra ricerca locale** | 36 · 42 · 44 · 46 · 62 | **5** |
| **Altezza controlli toolbar** | 30 · 32 · 34 · 36 · 38 · 40 · 42 · 44 | **8** |

---

## 2. Confronto tabelle (`ToolsGrid` / `VirtualizedTable`) e toolbar filtri

### 2.1 La stessa `ToolsGrid` in 4 contesti

| Contesto | Wrapper esterno | Larghezza effettiva tabella | Checkbox visibili? | Click riga fa… | Chevron `>` a destra | Contatore "N trovati" |
|---|---|---|---|---|---|---|
| 03 Home Elenco | `DropdownFilterView` `max-w-7xl` + `ToolsGrid` `max-w-[1600px]` | 1102 (x=313–1415) | solo in modalità "Seleziona" | apre dettaglio (o seleziona) | sì | 1× |
| 08 Home Griglia L3 | `App.jsx` → `ToolsGrid` diretto | 1102 | idem | idem | sì | 1× |
| 30/33 Scanner | `ScannerView` `max-w-[1600px]` | 1086 (x=321–1407) | **sì, sempre** (stato globale `isSelectionMode` trapelato dalla Home) | **spunta checkbox** invece di aprire il movimento (31) | sì (affordance falsa) | 1× |
| 16 Picker distinta (modale) | `AddToolToMultiModal` `max-w-7xl` | 1228 (x=106–1334) | sì (stesso leak) | inserisce in distinta | sì (affordance falsa: suggerisce "dettaglio") | **2×** (modale + tabella) |

**Causa nel codice** (`ToolsGrid.jsx` r.28–30, 88–90, 298–306): la tabella non ha una prop `selectionMode`/`variant`; legge `isSelectionMode` da `useFilterStore` (globale) e cambia sia il rendering (checkbox) sia il comportamento del click. Nessuno dei 4 chiamanti può dichiarare "qui voglio righe cliccabili senza checkbox" o "qui voglio selezione multipla nativa". Il `renderRowTrailing` è sempre `ChevronRight` anche quando il click non naviga.

A 1440 le larghezze coincidono quasi (1102 vs 1086) perché entrambe sono clampate dall'area disponibile; a **≥1600px divergono di 320px** (`max-w-7xl`=1280 vs `max-w-[1600px]`) — la Home sarebbe più stretta della lista scanner, come notato nel catalogo per la sessione a 1720.

### 2.2 Toolbar filtri

| Vista | Composizione | Altezza controlli | Raggio | Allineamento con tabella sottostante | Posizione "Seleziona"/azione batch |
|---|---|---|---|---|---|
| 03 | 13 `Select` `glass-button` `app-overline` + "Seleziona" | 32 | 14 | sì (x=320 vs 313) | ultimo chip a destra |
| 08 | 9 `Select` + "Seleziona" | 32 | 14 | sì | ultimo chip |
| 18 | input search + segmented 3 voci | **44** | 16 | n/d (card) | — |
| 21 | input search + `Select` + segmented 3 + `Select` | **36** | 14 / 12 | sì (x=320) | — |
| 29 | segmented 3 voci **centrato** + search gigante | 36 / **62** | 16 / 24 | **no** (search 896 vs tabella 1086) | — |

Tre altezze (32/36/44), due famiglie di raggi, un segmented centrato e tre allineati a sinistra, con le stesse classi `glass-button rounded-[12px] md:rounded-[14px] px-3 py-1.5 app-overline` copiate a mano in `ToolsGrid`, `DropdownFilterView`, `HistoryView` (3 copie del medesimo stile di chip, nessun componente `FilterChip`/`Toolbar`).

---

## 3. Elenco incoerenze con gravità

| # | Problema | Gravità | Evidenza | Causa (lacuna DS / codice) | Soluzione |
|---|---|---|---|---|---|
| M1 | **5 stili di "back" + 2 viste senza back**; etichetta cambia (icona / "Home" / "Indietro"), posizione cambia (L/R), colore cambia (arancione/blu), dimensione cambia (28/40/44px) | **Alta** | 08, 18, 21, 22, 29, 15, 03 | DS: nessuna regola su back/breadcrumb. Codice: ogni vista implementa `onClick={() => setView('home')}` con markup proprio (`CommesseView` r.198, `HistoryView` r.376, `OperatorsView` r.353, `ScannerView` r.69, `App.jsx` r.238) | Regola DS "Back = icona ←, 44×44, `glass-button rounded-2xl text-accent-blue`, sempre a sinistra del titolo, `aria-label='Indietro'`"; implementato una volta in `PageHeader` |
| M2 | **Back a 28px** nel breadcrumb Home (`p-1.5` + icona 16) sotto il minimo touch 44px richiesto dal DS §1 | **Alta** | 08 (x=322–350) | Codice `App.jsx` r.248 | `min-w-[44px] min-h-[44px]` via `PageHeader.back` |
| M3 | **Titolo assente** in Home Elenco/Griglia L1: la vista principale non ha nome, la posizione dell'utente nel flusso non è dichiarata; il breadcrumb compare solo dal 2° livello | **Alta** | 03, 05, 06 | DS: nessuna regola "ogni vista ha un titolo". Codice `App.jsx` r.235: header condizionato a `filterStack.length > 0` | Header persistente "INVENTARIO" con breadcrumb `Inventario / Fresa / Candela / D10` |
| M4 | **Bordo sinistro del contenuto salta di 103px** tra viste (313→416); anche tra le viste "normali" jitter di 23px (313/320/328/332/336) | **Alta** | tutte | DS: nessuna scala di larghezza contenitore; codice: 6 `max-w-*` diversi e 3 padding (`px-2`/`px-4`/`px-6`) | Token unico `--page-max-w: 1280px` + `--page-px: 16/24px` nel `PageTemplate`; le viste non dichiarano più `max-w` |
| M5 | **Scanner: barra ricerca 896px vs tabella 1086px** (disallineamento 95px/lato) e altezza input 62px (1.7× la Commesse) | Alta | 29, 30 | Codice `ScannerView` r.128 `max-w-4xl` dentro `max-w-[1600px]` | Ricerca locale nella zona toolbar del template, `w-full`, h=44 |
| M6 | **Tre titoli per la stessa vista** Scanner (Deposito Rapido / Prelievo Rapido / Optical Scanner) + overline in 3 colori; l'utente non capisce di essere nella stessa schermata | Alta | 29, 31, 33 | DS: nessuna regola "titolo = identità della vista, stato = badge" | Titolo fisso "SCANNER" + badge di modalità colorato (`badge-emerald/rose/blue`) |
| M7 | **Stato di selezione trapela**: checkbox sempre visibili in Scanner e Picker, click riga cambia significato (spunta invece di aprire) | Alta | 30, 31, 16; anomalia catalogo §7 | Codice `ToolsGrid.jsx` r.28 legge `isSelectionMode` globale; DS §5.C non definisce varianti della tabella | Prop `selectionMode: 'none' \| 'toggle' \| 'multi'` esplicita; reset dello store al cambio vista |
| M8 | **`app-h1` sovrascritto a 24px** (MultiMovement) e `app-h2` a 16px (Picker): la scala tipografica del DS viene aggirata proprio nei titoli | Media | 15, 16 | DS §3 vieta classi arbitrarie ma non impedisce l'override; codice r.92 `app-h1 text-lg sm:text-xl md:text-2xl` | `PageHeader` rende il titolo con `app-h1` senza className aggiuntivo |
| M9 | **Overline in 5 colori** (arancione, blu, verde, rosso, ciano) senza semantica dichiarata | Media | 07, 15, 18, 21, 22, 29 | DS §2 assegna all'arancione le "overline" ma nessuna vista blu/verde lo rispetta | Regola: overline pagina = `text-accent-orange`; colore semantico ammesso solo nei badge di stato |
| M10 | **Azioni di header a pesi diversi**: `glass-button` (Aggiorna) accanto a `glass-panel` (Home) nello stesso header con altezze 34 vs 38 | Media | 21 | DS §6 definisce i livelli ma non l'ingombro (altezza) dei bottoni di header | `PageHeader.actions` con slot tipizzati: `primary` (h44 fill) · `secondary` (h44 outline) · `icon` (44×44) |
| M11 | **Pannello principale con raggio 16/20/24/32/36** a seconda della vista | Media | 08 (16), 16 (20), 03/21 (24), 22 (32), 29 (36) | DS §4 dà una scala ma non dice quale gradino usa il "pannello di vista" | Regola: contenitore di vista = `rounded-[24px]`; 32px riservato a modali e card hero |
| M12 | **Ricerca locale in 5 altezze** (36/42/44/46/62) e 4 posizioni (toolbar, dentro card, dentro pannello, hero centrata); coesiste con la ricerca globale in header che al focus **abbandona la vista** (`Header.jsx` r.26–34: `setCurrentView('home')`) | Media | 07, 18, 21, 22, 29 + header ovunque | DS §5.E parla dell'input ma non della sua collocazione nella pagina; nessuna regola su ricerca globale vs locale | `PageToolbar.search` unico (h44, r16, `w-full max-w-[720px]`); la ricerca globale in header è disattivata/visibilmente "globale" nelle viste con ricerca locale |
| M13 | **Toolbar filtri in 3 altezze** (32/36/44) e chip copiati in 3 file | Media | 03, 21, 18 | DS: nessuna sezione "Toolbar filtri" | Componente `FilterChip` (h36 desktop / h44 touch) + `PageToolbar` |
| M14 | **Contatore "1000 UTENSILI TROVATI" duplicato** nel picker | Bassa | 16 | Codice: `AddToolToMultiModal` r.109 + `ToolsGrid` r.293 | Prop `showCount={false}` su `ToolsGrid` |
| M15 | **Chevron `>`** su righe il cui click non apre nulla (selezione/inserimento) | Bassa | 16, 30 | Codice `ToolsGrid` r.309 `renderRowTrailing` fisso | Trailing derivato da `selectionMode` |
| M16 | **Operatori scrolla l'intera pagina** (`overflow-y-auto` sul contenitore, header incluso) mentre tutte le altre viste hanno header fisso e scroll interno al pannello | Bassa | 22 | Codice `OperatorsView` r.345; DS §1 "Layout App-Like" non è applicato | Template con header `shrink-0` e contenuto `flex-1 min-h-0 overflow-y-auto` |
| M17 | **Commesse è l'unica vista con URL proprio** (`/commesse`) e senza pannello contenitore | Bassa | 18 | Nessuna regola di routing/contenitore | Allineare a `PageTemplate` (pannello o griglia card dentro `PageContent`) |

---

## 4. Diagnosi: cosa manca nel design system

`DESIGN_SYSTEM.md` è un ottimo **catalogo di atomi e di modali**, ma non contiene un solo paragrafo su come si compone **una pagina**. Ne consegue che le viste sono state pensate "una per una" perché il DS le tratta così. In dettaglio:

| # | Lacuna | Effetto osservato | Sezione DS dove dovrebbe stare |
|---|---|---|---|
| L1 | **Non esiste un Page Template** (anatomia header → toolbar → contenuto → footer, con altezze e spaziature). Il DS descrive con precisione l'anatomia dei *modali* (§5.D punto 4 "Allineamento Header Millimetrico") ma non quella delle pagine | 7 header diversi; scroll di pagina vs scroll interno (M16); footer sticky solo in MultiMovement | nuova §5.G "Page Template" |
| L2 | **Non esiste un componente `PageHeader`** in `src/components/layout/` (ci sono solo `Header.jsx` = barra globale e `Sidebar.jsx`) | ogni vista riscrive overline+titolo+back+azioni (M1, M3, M8, M9, M10) | §5.G + file `src/components/layout/PageHeader.jsx` |
| L3 | **Nessuna regola su back / breadcrumb / navigazione fra viste**: etichetta, posizione, quando serve, cosa fa (torna alla vista precedente o a home?) | 5 stili di back, 2 assenze, back a 28px (M1, M2) | §5.G "Navigazione" |
| L4 | **Nessuna scala di larghezza per i contenitori di vista** (esiste per i modali: 4 tier) | 6 `max-w` diversi, bordo sinistro variabile 313–416 (M4, M5) | §4 "Scala larghezze pagina" |
| L5 | **`DataTable`/`ToolsGrid` senza varianti dichiarate**: §5.C definisce le colonne ma non `selectionMode`, `onRowClick` semantico, trailing, contatore, larghezza | leak di stato, checkbox fantasma, chevron falso, contatore doppio (M7, M14, M15) | §5.C "Varianti della tabella" |
| L6 | **Toolbar filtri non specificata** (altezza chip, raggio, ordine: ricerca → filtri → segmented → azioni batch, allineamento con la tabella) | 3 altezze, chip copiati in 3 file, segmented centrato vs sinistra (M13, M5) | §5.G "PageToolbar" + componente `FilterChip` |
| L7 | **Ricerca globale vs locale non regolata**: §5.E e regola 21 di `gemini.md` dicono che la barra globale "al focus attiva dropdownView" ma non dicono come convive con una ricerca locale nella stessa schermata | due barre di ricerca visibili in 5 viste, una delle quali teleporta l'utente (M12) | §5.G "Ricerca" |
| L8 | **Titolo = identità della vista** non è una regola; il DS elenca `.app-h1` come "titoli primari delle viste" ma non impone che ogni vista ne abbia uno né vieta di cambiarlo con lo stato | Home senza titolo, Scanner con 3 titoli (M3, M6) | §5.G |
| L9 | **Nessuna semantica del colore dell'overline di pagina** (§2 dice "overline" sotto Accent Orange, ma senza vincolo) | 5 colori (M9) | §2 tabella token |
| L10 | **Altezza standard dei controlli** (input, bottone, chip, segmented) non definita: §1 dà il minimo touch 44px, §4 dà solo i raggi | altezze 30…62px (M10, M12, M13) | §4 "Scala altezze controlli" |
| L11 | **Nessuna regola sul raggio del contenitore di vista** (§4 dà 20/24 "Pannelli Glass" ma poi Operatori usa 32, Scanner 36) | M11 | §4 |

Nota: la Sez. 6 ("Gerarchia delle Azioni") dimostra che il team sa scrivere regole compositive quando sente il problema. Il problema qui è identico ("ogni vista pensata da sola") ma spostato dal *bottone* alla *pagina*.

---

## 5. Proposta: "Page Template" unico + componente `PageHeader`

### 5.1 Anatomia del Page Template

```
┌──────────────────────────────────────────────────────────────────────┐
│ Header globale (Header.jsx: ricerca globale + hamburger)  h=56       │  ← invariato
├──────────────────────────────────────────────────────────────────────┤
│ <PageTemplate>  w-full max-w-[1280px] mx-auto px-4 md:px-6           │
│ ┌ PageHeader ─────────────────────────────────────────── h=64 ─────┐ │
│ │ [←44] [icon 40] OVERLINE · badge           [icon44][secondary][PRIMARY44] │
│ │               TITOLO app-h1                                       │ │
│ │ (opz.) breadcrumb: Inventario / Fresa / Candela   app-caption     │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ ┌ PageToolbar (opzionale) ────────────────────────────── h=44 ─────┐ │
│ │ [🔍 ricerca locale  max-w-[720px]] [chip][chip][chip] [segmented] [batch] │
│ └───────────────────────────────────────────────────────────────────┘ │
│ ┌ PageContent ───────────────── flex-1 min-h-0 ────────────────────┐ │
│ │ variant="panel": glass-panel rounded-[24px] overflow-hidden       │ │
│ │ variant="plain": nessun pannello (griglie di card/tessere)        │ │
│ │ variant="split": grid lg:grid-cols-[1fr_360px] gap-6              │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ ┌ PageFooter (opzionale, sticky) ────────────────────── h=72 ──────┐ │
│ │ riepilogo sx                       [ANNULLA h44] [CONFERMA h44]   │ │
│ └───────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 Specifiche (px / token Tailwind)

| Zona | Specifica | Classi |
|---|---|---|
| **Contenitore pagina** | larghezza max **1280px** (`max-w-7xl`), centrato, padding orizzontale 16px mobile / 24px desktop; nessuna vista dichiara un proprio `max-w` | `w-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col gap-3 md:gap-4 flex-1 min-h-0` |
| Variante larga (solo tabelle dense a ≥1600px) | `wide` → 1600px | `max-w-[1600px]` (una sola alternativa ammessa) |
| **PageHeader** | altezza 64px desktop (56 mobile), `shrink-0`, nessun `border-b` (lo spazio è dato dal `gap`) | `flex items-center justify-between gap-3 min-h-[56px] md:min-h-[64px]` |
| Back | 44×44, `glass-button rounded-2xl text-accent-blue`, icona `ArrowLeft 18`, **sempre a sinistra** del titolo, `aria-label="Indietro"`; **mai** testo "Home"/"Indietro" a destra | `min-w-[44px] min-h-[44px]` |
| Icon-box (opz.) | 40×40 r14 `bg-accent-blue/10 border-accent-blue/20 text-accent-blue` (stesso box dei modali §5.D.4, scala −8px) | `w-10 h-10 rounded-[14px]` |
| Overline | `.app-overline` **`text-accent-orange`** (unico colore per l'overline di pagina); badge contatore opzionale accanto | |
| Titolo | `.app-h1` **senza override di size**; 1 titolo fisso per vista; lo stato (Deposito/Prelievo, Attiva/Chiusa) va in un `.badge` accanto al titolo, non nel titolo | |
| Breadcrumb (opz.) | sotto il titolo, `.app-caption` non mono, separatori "/" `text-slate-400`, ultimo elemento `text-slate-900`; ogni segmento cliccabile, target ≥32px alto | `flex items-center gap-1.5` |
| Azioni destra | da sinistra a destra: icone 44×44 (`glass-button rounded-2xl`) → secondaria outline h44 → **una sola** primaria fill h44 r16 (`action-btn-primary`), `whitespace-nowrap` | `flex items-center gap-2` |
| **PageToolbar** | una riga (wrap su mobile), tutti i controlli **h=44** touch / **h=36** su `md:` con `min-h`; raggio **16px**; ordine fisso: ricerca → chip filtri → segmented → azione batch ("Seleziona") | `flex flex-wrap items-center gap-2 shrink-0` |
| Ricerca locale | `w-full md:max-w-[720px]`, h come sopra, `rounded-2xl`, icona 16 a sinistra, X di cancellazione a destra; se presente, la ricerca globale in header mostra placeholder "Cerca in tutto il magazzino…" e resta attiva (nessun teletrasporto silenzioso: mostra un toast "Sei stato portato all'Inventario") | |
| FilterChip | `glass-button rounded-2xl px-3 app-overline min-h-[36px] md:min-h-[36px]` su desktop, 44 su touch (`pointer: coarse`) | componente `FilterChip` |
| **PageContent** | `flex-1 min-h-0`; `panel` = `glass-panel rounded-[24px] overflow-hidden flex flex-col`; scroll **sempre interno** (`overflow-y-auto` sul figlio) — mai sul contenitore pagina | |
| Contatore risultati | sempre nella testata del pannello (`px-4 md:px-6 py-3 border-b app-overline text-accent-orange`), mai duplicato fuori | |
| **PageFooter** | sticky in basso, `shrink-0`, h72, `glass-panel rounded-[20px] px-4 md:px-6`, bottoni h44: `ANNULLA` outline + primaria | |
| Raggi | contenitore di vista **24px** · toolbar/chip/bottoni **16px** · modali **32px** (invariato) · tessere 16/18 (invariato) | |

### 5.3 Componente `PageHeader` — `src/components/layout/PageHeader.jsx`

```jsx
/**
 * PageHeader — intestazione standard di ogni vista di primo livello.
 * Sostituisce gli header ad hoc di CommesseView, HistoryView, OperatorsView,
 * ScannerView, MultiMovementView e il "breadcrumb bar" di App.jsx.
 */
PageHeader.propTypes = {
  /** Titolo fisso della vista, reso con .app-h1 (obbligatorio, mai vuoto) */
  title: PropTypes.string.isRequired,
  /** Overline sopra il titolo, reso con .app-overline text-accent-orange */
  overline: PropTypes.string,
  /** Icona lucide (componente) mostrata nell'icon-box 40×40 a sinistra del titolo */
  icon: PropTypes.elementType,
  /** Back: false = nessun back; true = torna a 'home'; funzione = handler custom;
      string = nome vista di destinazione (useNavigationStore) */
  back: PropTypes.oneOfType([PropTypes.bool, PropTypes.func, PropTypes.string]),
  /** Breadcrumb: [{ label: 'Inventario', onClick }, { label: 'Fresa', onClick }, { label: 'D10' }]
      L'ultimo elemento è la posizione corrente e non è cliccabile */
  breadcrumb: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
  })),
  /** Badge accanto all'overline o al titolo (es. contatore, stato modalità).
      tone segue la palette semantica del DS */
  badge: PropTypes.shape({
    label: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(['neutral', 'blue', 'orange', 'emerald', 'rose']),
    position: PropTypes.oneOf(['overline', 'title']),
  }),
  /** Azioni a destra, rese nell'ordine icon* → secondary → primary.
      Al massimo UNA primary (DS §6). */
  actions: PropTypes.shape({
    primary: PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      onClick: PropTypes.func.isRequired,
      disabled: PropTypes.bool,
      tone: PropTypes.oneOf(['primary', 'carica', 'scarica', 'order']),
    }),
    secondary: PropTypes.shape({ label: PropTypes.string.isRequired, icon: PropTypes.elementType, onClick: PropTypes.func.isRequired, disabled: PropTypes.bool }),
    icons: PropTypes.arrayOf(PropTypes.shape({
      icon: PropTypes.elementType.isRequired,
      label: PropTypes.string.isRequired,   // usato come aria-label e title
      onClick: PropTypes.func.isRequired,
      loading: PropTypes.bool,
    })),
  }),
  /** Slot libero per controlli di contesto (es. select commessa, segmented)
      reso tra il titolo e le actions; su mobile va a capo */
  children: PropTypes.node,
  /** Allinea il titolo al centro (uso eccezionale, sconsigliato): default false */
  centered: PropTypes.bool,
};
```

Firma sintetica:

```jsx
<PageHeader
  title="Commesse"
  overline="Gestione centri di costo"
  icon={FolderKanban}
  back                                   // ← 44×44, sinistra, blu
  badge={{ label: `${stats.total} totali`, tone: 'neutral', position: 'overline' }}
  actions={{
    icons: [{ icon: RefreshCw, label: 'Ricarica commesse', onClick: fetchCommesse, loading: isLoading }],
    primary: { label: 'Nuova commessa', icon: Plus, onClick: handleOpenCreate },
  }}
/>
```

Componenti fratelli da creare nello stesso file o accanto (`src/components/layout/PageTemplate.jsx`):

```jsx
<PageTemplate width="default" | "wide">            // max-w-7xl | max-w-[1600px]
  <PageHeader … />
  <PageToolbar search={{ value, onChange, placeholder }} segmented={…} batch={…}>
    <FilterChip … />                               // chip ripetibili
  </PageToolbar>
  <PageContent variant="panel" | "plain" | "split" countLabel="24 utensili trovati">
    …
  </PageContent>
  <PageFooter summary={<…/>} cancel={{…}} confirm={{…}} />
</PageTemplate>
```

`ToolsGrid` riceve tre nuove prop esplicite: `selectionMode: 'none' | 'toggle' | 'multi'` (default `'none'`; il chiamante non può più ereditare lo stato globale), `showCount: boolean` (default `true`), `rowTrailing: 'chevron' | 'none' | ReactNode` (derivato da `selectionMode` se omesso).

### 5.4 Righe da aggiungere a `DESIGN_SYSTEM.md`

Inserire come nuova sezione **5.G** (dopo "F. Tabelle di Distinta") e integrare §2, §4, §5.C:

```markdown
### G. Page Template & PageHeader (anatomia obbligatoria delle viste di primo livello)

> **Perché esiste questa sezione:** senza un template le viste sono state costruite una per una
> (7 header diversi, 5 stili di "Indietro", bordo del contenuto che salta di 100px tra una vista
> e l'altra). Questa sezione fa per le pagine ciò che la §5.D fa per i modali.

1. **Ogni vista di primo livello** (Inventario, Movimento Multiplo, Commesse, Storico, Operatori,
   Scanner) è composta da `<PageTemplate>` → `<PageHeader>` → `[<PageToolbar>]` → `<PageContent>`
   → `[<PageFooter>]` (`src/components/layout/`). È vietato scrivere header, toolbar o
   contenitori di pagina ad hoc nei file di feature.
2. **Contenitore:** `max-w-7xl` (1280px) centrato, `px-4 md:px-6`. Variante `wide` (1600px) solo
   per tabelle dense. Nessuna vista dichiara un proprio `max-w`. Il pannello di contenuto ha
   raggio `rounded-[24px]`; lo scroll è sempre interno al pannello, mai sul contenitore pagina.
3. **Titolo:** ogni vista ha esattamente UN titolo fisso (`.app-h1`, mai ridimensionato con
   classi aggiuntive) e UNA overline `.app-overline text-accent-orange`. Lo stato o la modalità
   (Deposito/Prelievo, Attiva/Chiusa, N selezionati) va in un `.badge` accanto al titolo, non
   nel testo del titolo. L'Inventario ha titolo "INVENTARIO" con breadcrumb sotto.
4. **Back:** icona `ArrowLeft`, 44×44, `glass-button rounded-2xl text-accent-blue`, sempre
   immediatamente a sinistra del titolo, `aria-label="Indietro"`. Mai testo "Home"/"Indietro",
   mai a destra, mai sotto i 44px. Il back porta alla vista di provenienza (stack di
   `useNavigationStore`), non sempre a 'home'.
5. **Breadcrumb:** solo per navigazioni a cascata (Inventario a griglia); sotto il titolo,
   `.app-caption` sans-serif, segmenti cliccabili con altezza ≥32px; il primo segmento è sempre
   il nome della vista, quindi appare già al livello 0.
6. **Azioni di header:** ordine da sinistra a destra: icone 44×44 → secondaria outline h44 →
   una sola primaria fill h44 `rounded-[16px]`. Tutti i controlli di header sono alti 44px.
7. **PageToolbar:** una riga sotto l'header con ordine fisso ricerca locale → `FilterChip` →
   segmented → azione batch. Altezza controlli 36px su desktop, 44px su touch; raggio 16px;
   la larghezza della toolbar coincide con quella del pannello sottostante.
8. **Ricerca globale vs locale:** se la vista ha una ricerca locale, la barra globale dell'header
   mantiene placeholder "Cerca in tutto il magazzino…" e, quando porta l'utente all'Inventario,
   lo comunica con un toast. Una sola ricerca locale per vista, mai dentro card o pannelli
   interni, mai più alta di 44px.
9. **Footer sticky:** solo per viste transazionali (distinte); riepilogo a sinistra,
   `ANNULLA` outline + primaria a destra, h44, pannello `rounded-[20px]`.
```

Integrazioni puntuali:

- **§2 tabella token**, riga Accent Orange: aggiungere "**overline di pagina (`PageHeader`)**: sempre arancione; i colori semantici (emerald/rose/cyan) sono riservati ai badge di modalità".
- **§4 nuova sotto-sezione "Scala Larghezze Pagina"**: `default` 1280px · `wide` 1600px · modali secondo i 4 tier. "Scala Altezze Controlli": bottone/input/chip **44px** touch, 36px desktop compatto (solo toolbar), icon-button 44×44.
- **§4 Scala Raggi**: aggiungere "Contenitore di vista / PageContent: `rounded-[24px]`; PageFooter e toolbar: `rounded-[20px]`/`rounded-[16px]`".
- **§5.C Tabelle**: aggiungere "**Varianti**: `selectionMode='none'` (click = apri dettaglio, chevron visibile) · `'toggle'` (click = seleziona/aggiungi, nessun chevron, icona `+`/check) · `'multi'` (checkbox visibili, click = spunta). La modalità è **sempre** una prop del chiamante, mai letta da uno store globale. Il contatore "N trovati" vive solo nella testata del pannello (`showCount`)."
- **§7 Checklist**: aggiungere "11. [ ] La vista usa `PageTemplate`/`PageHeader` e non dichiara `max-w-*`, header o back propri."

---

## 6. Piano di migrazione vista per vista

Ordine scelto per **massimizzare la coerenza percepita con il minimo rischio**: prima le viste "amministrative" semplici (validano il componente), poi lo scanner (più visibile), infine Home (più intrecciata con `App.jsx`).

| Step | Vista / file | Cosa cambia | Effort | Dipendenze |
|---|---|---|---|---|
| 0 | **Fondazioni**: `src/components/layout/PageTemplate.jsx`, `PageHeader.jsx`, `PageToolbar.jsx` (+ `FilterChip`), `PageContent`, `PageFooter`; righe DS §5.G; `ToolsGrid` prop `selectionMode`/`showCount`/`rowTrailing` | nuovo codice, nessuna vista toccata | **M** | — |
| 1 | **Storico** `HistoryView.jsx` r.352–383 | sostituire header (rimuovere "← Home" a destra, refresh → `actions.icons`), toolbar h36→`PageToolbar`, rimuovere `max-w-[1600px]` | **S** | 0 |
| 2 | **Operatori** `OperatorsView.jsx` r.345–358 | header (rimuovere "← Indietro"), scroll interno invece che di pagina, pannelli 32→24px, ricerca locale spostata in `PageToolbar` | **S** | 0 |
| 3 | **Commesse** `CommesseView.jsx` r.193–240 | header già vicino allo standard: sostituire con `PageHeader`, `PageContent variant="plain"`, `PageToolbar` con search + segmented | **S** | 0 |
| 4 | **Movimento Multiplo** `MultiMovementView.jsx` r.83–130 | header: aggiungere `back`, ripristinare `app-h1` pieno, select commessa + segmented nello slot `children`, "AGGIUNGI UTENSILE" come `actions.primary`; footer → `PageFooter` | **M** | 0 |
| 5 | **Picker distinta** `AddToolToMultiModal.jsx` | `ToolsGrid selectionMode="toggle" showCount={false}`; header modale resta §5.D ma titolo `app-h2` non ridotto | **S** | 0 |
| 6 | **Scanner** `ScannerView.jsx` r.60–130 | titolo fisso "SCANNER" + badge modalità; back → `PageHeader.back`; segmented in `PageToolbar` allineato a sinistra; ricerca locale h44 `w-full` (sparisce il disallineamento 896/1086); `ToolsGrid selectionMode="toggle"` in Deposita/Preleva, `"none"` in Dettaglio; reset di `isSelectionMode` all'ingresso | **M** | 0 |
| 7 | **Home Inventario** `App.jsx` r.232–290 + `DropdownFilterView` r.189–330 + `DiameterList` r.51–76 | `PageHeader title="Inventario"` sempre presente con `breadcrumb` dallo stack (già al livello 0), toggle vista e "Resetta" in `actions`; combobox → `FilterChip` in `PageToolbar`; `DiameterList` perde header e ricerca propri (li dà la toolbar); `ToolsGrid` senza `max-w` proprio; "Seleziona" diventa azione batch della toolbar che imposta `selectionMode="multi"` | **L** | 0, 6 (per il reset dello stato) |
| 8 | **Regressione visiva** | screenshot 1440/1720/390 delle 7 viste, verifica bordo sinistro = 328px ovunque (1440), altezze controlli 44/36, un solo back | **S** | 1–7 |

Effort totale stimato: **~5 giorni/persona** (0=1g, 1–3=0.5g cad., 4=0.5g, 5=0.25g, 6=0.75g, 7=1.5g, 8=0.5g).

---

## 7. Quick wins (applicabili subito, prima del template)

1. `App.jsx` r.248: back del breadcrumb da `p-1.5` a `min-w-[44px] min-h-[44px]` (M2) — 1 riga.
2. `HistoryView.jsx` r.378 e `OperatorsView.jsx` r.355: sostituire i bottoni testuali "Home"/"Indietro" a destra con lo stesso markup di `CommesseView.jsx` r.198–206 (icona 44×44 blu a sinistra del titolo) — allinea 3 viste su 5 in 20 minuti.
3. `MultiMovementView.jsx` r.92 e `AddToolToMultiModal.jsx` r.70: rimuovere gli override di size su `app-h1`/`app-h2` (M8).
4. `ScannerView.jsx` r.128: `max-w-4xl` → `w-full` sulla barra di ricerca; `py-3.5 sm:py-5` → `py-2.5` (M5).
5. `ToolsGrid.jsx`: aggiungere `selectionMode` prop con default che ignora lo store quando fornita; `ScannerView` e `AddToolToMultiModal` la passano esplicitamente (M7, M15).
6. `AddToolToMultiModal.jsx` r.109: rimuovere il contatore duplicato (M14).
7. Overline: sostituire `text-accent-blue`/`emerald`/`rose`/`cyan` con `text-accent-orange` in 15, 16, 07, 29 (M9) — trovabile con `grep -n "app-overline text-accent-" src/features`.
