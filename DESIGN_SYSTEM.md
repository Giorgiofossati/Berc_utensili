# Design System — Bercella Utensili CNC

Documento di riferimento ufficiale per l'interfaccia utente di **Bercella Utensili**.
Ogni schermata, componente o modifica deve conformarsi a queste specifiche. Se una situazione non è coperta da questo documento, **non improvvisare**: applica il pattern più vicino già descritto, oppure fermati e chiedi conferma — non inventare una nuova variante.

> **Basi scientifiche & checklist agenti:** [`SYSTEM_AUDIT_RULES.md`](./SYSTEM_AUDIT_RULES.md) (Fitts, Hick, Miller, ISO 9241, WCAG 2.1 AA).
> **Origine di questa revisione:** [`Miglioramenti UI/audit/REPORT_FINALE.md`](./Miglioramenti%20UI/audit/REPORT_FINALE.md) — audit completo di 13 schermate, 8 lacune di sistema (R1-R8), ~250 osservazioni.
> **Prototipi approvati:** le tavole di riferimento per Page Template, gerarchia azioni, menu `⋮`, scala modali, mappa colore→stato, tabella→card sono state validate come prototipo prima di essere scritte qui (regola §0.2).
> **Riferimenti esterni:** [Tailwind CSS v4 docs](https://tailwindcss.com/docs) · [shadcn/ui docs](https://ui.shadcn.com/docs) — consultali prima di introdurre una nuova classe, token o pattern di componente non coperto da questo file (vedi §9).

---

## 0. Come usare questo documento

### 0.1 Stack e proprietà del codice
React + Vite + Tailwind CSS v4 (config CSS-first in `src/index.css`) + componenti shadcn/ui (`style: base-nova`, primitive `@base-ui/react`, non Radix) + Supabase. I componenti in `src/components/ui/` **non sono una dipendenza esterna**: sono codice di proprietà del progetto, installati via CLI shadcn e poi estesi qui dentro (nuove varianti `cva`, nuovi `size`). Si modificano direttamente, non si aggirano con classi arbitrarie sovrapposte.

### 0.2 Regola per pattern nuovi
Se serve un componente o un layout che questo documento non descrive:
1. Cerca prima un pattern equivalente qui dentro (quasi sempre esiste già una variante applicabile).
2. Se è davvero nuovo, **non improvvisarlo nel codice**: proponi 1-2 prototipi visivi (screenshot o artifact) e aspetta conferma umana prima di scriverlo nel design system o applicarlo alle viste.
3. Solo dopo l'approvazione, il pattern entra in questo file e diventa vincolante per tutti.

### 0.3 Filosofia ("Industrial Professional Look")
App per operatori di officina meccanica CNC e amministratori di magazzino:
- **Leggibilità istantanea**: contrasti netti, gerarchia tipografica chiara, zero decorazioni fini a sé stesse.
- **Touch-first**: target minimo **44×44px, senza eccezioni** (icon-only incluso) — operatori con guanti su tablet da officina.
- **Layout app-like**: `100dvh`, `overflow-hidden` sulla root; lo scroll è sempre e solo del contenitore dati interno (`PageContent`, §2).
- **Glassmorphism funzionale**: pannelli `backdrop-blur`, mai due `glass-panel` annidati.
- **Un solo modo per fare ogni cosa**: un solo Page Template, una sola scala di modali, un solo Toast, un solo lessico per ogni azione (§8).

---

## 1. Design Tokens

### 🚫 Regola fondamentale sui colori
**Divieto assoluto di `indigo`/`purple`/`violet`** in tutta l'interfaccia, icone incluse. Palette: **Ciano/Blu tecnico + Arancione industriale**, più Verde Smeraldo (Carico/Disponibile) e Rosa Rubino (Scarico/Esaurito).

### 1.1 Palette semantica
Ogni accent ha una coppia sfondo/testo dichiarata (pattern shadcn `token` / `token-foreground`, in `@theme` di `src/index.css`), così il contrasto è nel token e non è una scelta lasciata al componente:

| Token | Valore | `-foreground` (testo sopra) | Ruolo |
| :--- | :--- | :--- | :--- |
| `--color-accent-blue` | `#0ea5e9` | `#0f172a` (slate-900, **mai bianco**: 2.77:1 fallisce WCAG) | Brand primario, focus ring, selezione, info |
| `--color-accent-orange` | `#f97316` | `#ffffff` | **Solo** alert scorte / ordine riassortimento — mai ubicazione, mai ruolo utente |
| `--color-accent-emerald` | `#10b981` | `#ffffff` | Operazione **Deposita**, stato Disponibile/Nuovo |
| `--color-accent-rose` | `#f43f5e` | `#ffffff` | Operazione **Preleva**, stato Esaurito, eliminazione |
| `--color-accent-cyan` | `#06b6d4` | `#0f172a` | Scanner/barcode |

> Ogni volta che un colore accent viene usato come sfondo pieno, il testo sopra è **sempre** il token `-foreground` corrispondente — mai deciso caso per caso nel componente (chiude il problema "ACCEDI bianco su blu 2.77:1" del report, §A1).

### 1.2 Superfici (chiaro / scuro)
| Elemento | Chiaro | Scuro |
| :--- | :--- | :--- |
| Sfondo globale | `#f8fafc` (slate-50) + gradiente radiale | `#020617` (slate-950) + texture + radial glow |
| `.glass-panel` | `rgba(255,255,255,.75)`, bordo `rgba(0,0,0,.08)` | `rgba(15,23,42,.45)`, bordo `rgba(255,255,255,.12)` |
| `.glass-button` | `rgba(255,255,255,.85)`, bordo `rgba(0,0,0,.08)` | `rgba(15,23,42,.65)`, bordo `rgba(255,255,255,.12)` |
| Testo principale | `#0f172a` | `#ffffff` / `#f8fafc` |
| Testo secondario | `#475569` | `#94a3b8` |
| Testo muted/caption | `#64748b` | `#64748b` |

### 1.3 Tipografia

> **Principio guida** *(round 3, 2026-09-19)*: in un componente compatto (riga, card, chip) per far risaltare un'informazione si usano peso, colore, allineamento, spaziatura e ordine — **mai ingrandire il testo** "perché deve notarsi". Un font più grande fuori scala rompe la gerarchia qui sotto ed è il primo segnale di un componente improvvisato.

Font ufficiale: **Inter** (`--font-inter`, caricato in `index.html`). **Vietate** le classi arbitrarie di testo (`text-5xl`, `text-[13px]`, `tracking-widest` sparse) — usare esclusivamente le classi semantiche `.app-*` (definite via `@utility` in `src/index.css`, coerente con la guida ufficiale Tailwind v4 sull'uso di `@utility` per classi riutilizzabili con supporto alle varianti):

| Classe | Definizione | Uso |
| :--- | :--- | :--- |
| `.app-overline` | `text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]` | Micro-titolo di sezione/pagina — **sempre arancione**, mai altro colore |
| `.app-h1` | `text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight` | Titolo di `PageHeader`, uno per vista |
| `.app-h2` | `text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight` | Titolo modale/card primaria |
| `.app-h3` | `text-xs sm:text-sm font-bold tracking-tight` | Titolo riga/card in liste e griglie — **non maiuscolo** (round 4, 2026-09-24, vedi nota sotto) |
| `.app-body` | `text-xs sm:text-sm font-medium leading-relaxed` | Testo standard, descrizioni, note |
| `.app-caption` | `text-[10px] sm:text-xs font-semibold font-mono` | Codici, timestamp, ID — **mai** per istruzioni discorsive |
| `.app-label` | `text-[11px] sm:text-xs font-bold uppercase tracking-wide` | Etichette di campo form (minimo 11px, mai 8-9px) |
| `.app-qty-sm` / `.app-qty-lg` | `text-xs…base` / `text-2xl…4xl font-black tabular-nums` | Quantità in riga / quantità in evidenza |

> **Maiuscolo: solo per etichette brevi a vocabolario fisso, mai per dati reali** *(prototipo approvato, rifiniture UI round 4, 2026-09-24)*: `.app-overline`, `.badge`, `.action-btn-*` e `.app-label` restano maiuscoli — sono etichette di 2-3 parole scelte da noi, mai testo dell'utente, e il maiuscolo lì aiuta a distinguerle come "etichetta" rispetto al contenuto. `.app-h3` **perde il maiuscolo**: il suo uso documentato in questa tabella è "titolo riga/card in liste e griglie", cioè quasi sempre un dato reale — descrizione utensile, testo libero di una commessa, nome di un operatore. Il maiuscolo su un dato reale toglie le forme delle lettere che l'occhio usa per riconoscere una parola a colpo d'occhio (va contro "Leggibilità istantanea", §0.3) ed è la causa diretta del bug di troncamento già corretto in §4.4 — il maiuscolo occupa più larghezza a parità di contenuto. Resta grassetto + dimensione a fare la gerarchia, come da principio del round 3 ("non ingrandire il testo per farlo risaltare").
>
> **Eccezione dichiarata**: le tessere categoria di primo livello (griglia "Fresa"/"Alesatore", §1.8) usano `.app-h3` su vocabolario fisso e breve come un badge, non su un dato utente — possono restare maiuscole aggiungendo l'utility `uppercase` di Tailwind sopra `.app-h3` in quel punto specifico, per coerenza visiva con l'aspetto "tessera". È una scelta estetica di quel componente, non una deroga generale alla regola sopra.

### 1.4 Scala raggi (unica, token reali — non più `rounded-[Npx]` arbitrari)
Tailwind v4 raccomanda esplicitamente i valori arbitrari solo come eccezione "una tantum": ogni valore riusato diventa un token in `@theme`. Questa è la scala unica per l'intera app, da dichiarare come token `--radius-*` (sullo schema shadcn: `--radius-sm/md/lg/xl` derivati da un unico `--radius` base):

| Token | Valore | Uso |
| :--- | :--- | :--- |
| `--radius-tag` | `6px` (o `rounded-full`) | Tag, badge, micro-pill |
| `--radius-control` | `12px` | Bottoni, input, select, filter chip |
| `--radius-card` | `16px` | Card categoria/diametro (griglia livello 1-2) |
| `--radius-panel` | `24px` | Pannelli glass, toolbar, righe lista, `PageTemplate` |
| `--radius-modal` | `32px` | Modali principali, card macro (login) |

### 1.5 Scala z-index (sostituisce ~20 valori arbitrari `z-[1001]`…`z-[9999]`)
Dichiarata come variabili CSS in `:root` di `src/index.css`, mai un numero arbitrario nel markup:

```css
--z-sticky: 10;   /* header/toolbar sticky dentro la vista */
--z-fab: 30;       /* floating action button, "?" guida */
--z-drawer: 40;    /* drawer filtri mobile, sheet */
--z-dialog: 50;    /* modali standard */
--z-dialog-2: 60;  /* modale su modale (conferma sopra form) */
--z-toast: 70;     /* toast — sempre sopra tutto tranne il tour */
--z-tour: 80;       /* AppTutorial/coach-mark */
```

### 1.6 Larghezze pagina e touch target
- Larghezza standard di ogni vista: **1280px** (`max-w-[1280px]`). Variante `wide` **1600px**, solo per tabelle dati molto estese (Storico, picker distinta). Nessun'altra larghezza è ammessa — chiude il jitter di 103px tra viste.
- Touch target minimo **44×44px senza eccezioni**, icon-only incluso (corregge l'ambiguità "36-44px" del §7.7 precedente e i controlli reali da 26-38px trovati in audit).

### 1.7 Safe area & mobile
- Container: `.app-container` (include `env(safe-area-inset-*)`).
- Toast: `.safe-toast-top`. Floating bar/drawer: `calc(12px + env(safe-area-inset-bottom,0px))`.
- Contenitori con scroll verticale: padding `p-2 pb-8` (`pb-24` se ci sono bottoni fissi in basso) per non tagliare focus ring/ombre/badge sul bordo.

### 1.8 Card affiancate e tessere di griglia
> **Divieto di asimmetria nelle card affiancate:** quando due o più card stanno una accanto all'altra su desktop, il contenitore genitore usa sempre `items-stretch` e le card interne `h-full flex flex-col justify-between`. Altezza, raggio (`--radius-modal`) e padding (`p-6 sm:p-8`) identici al pixel; header allineati in alto, footer di stato (`border-t`) sulla stessa linea di base. Mai `items-center` con altezze libere.

Scala tessere griglia inventario:
- **Categoria (livello 1)**: `aspect-square`, `max-w-[155px]` → `max-w-[235px]` responsive, `--radius-card` (16px, `md:18-20px`).
- **Diametro/sigla (livello 2)**: griglia `auto-fill / minmax(130px, 1fr)`, altezza minima omogenea `min-h-[82px] sm:min-h-[88px]`, stesso `--radius-card`.
- **Card interne liste** (queue drawer, righe utente): altezza automatica densa (`p-3 sm:p-4`), raggio intermedio `20-24px`.

### 1.9 Scala spacing & padding

> **Prototipo approvato**: rifiniture UI round 1, 2026-09-19.

Tailwind è già su una griglia di 4px: il problema non era la scala ma l'assenza di una regola su **quale passo usare per quale ruolo**. Sei passi, ognuno con un compito dichiarato — non introducono nuovi numeri, nominano quelli già in uso:

| Passo | Valore | Ruolo |
| :--- | :--- | :--- |
| micro | `4px` (`p-1`/`gap-1`) | Gap icona↔testo in badge/chip, padding verticale `.badge` |
| tight | `8px` (`p-2`/`gap-2`) | Gap tra icon-button affiancati, padding interno filter chip |
| compact | `12px` (`p-3`/`gap-3`) | Padding card dense: riga lista, card queue, tessera griglia livello 2 |
| standard | `16px` (`p-4`/`gap-4`) | Padding di default (tessera griglia livello 1), gutter pagina mobile, gap tra campi form dello stesso gruppo |
| section | `24px` (`p-6`/`space-y-6`) | Distanza tra due gruppi/sezioni nella stessa vista o modale, padding body modale `sm` |
| modal | `32px` (`p-8`/`space-y-8`) | Padding body modale `lg`/`xl`, separazione tra blocchi di primo livello in una pagina lunga (es. Storico: stat tile → filtri → tabella) |

**Regola di promozione**: un valore diverso da questi sei che ricorre ≥3 volte nel codice va promosso in questa scala, non lasciato come eccezione sparsa — stesso principio già applicato ai radius in §1.4. `p-5`, `p-7`, `gap-5`, `m-5` (20px/28px — il passo "quasi standard" che confonde con 16px/24px/32px) sono vietati a livello di **card, sezione, modale**: padding esterno di un componente, gap tra gruppi, margini tra blocchi.

**Eccezione dichiarata — mezzi passi per rifiniture fini** *(verificato nel codice, round 4, 2026-09-19)*: i valori a 2px (`gap-1.5`, `py-2.5`, `p-3.5`, `mt-0.5`…) sono già usati centinaia di volte nel codice per allineamenti fini — gap icona↔testo in badge/chip, padding di micro-controlli, rifiniture di 1-2px per centrare un'icona. Sono **ammessi** quando restano dentro un singolo controllo piccolo (badge, icon-button, chip, riga compatta) — non sono l'eccezione da eliminare, sono un livello di dettaglio sotto la scala a 6 passi, che resta la regola per card/sezioni/modali. Non promuoverli a token: sono aggiustamenti locali, non ruoli riusabili come i sei passi sopra.

**Padding annidato**: una card dentro un'altra card non ripete lo stesso passo — il contenitore esterno usa il passo `section`/`modal`, l'elemento interno il passo `standard`/`compact`. Mai due livelli di nesting con lo stesso padding (si perde la gerarchia visiva anche senza cambiare colore).

### 1.10 Scala ombre & elevazione

> **Prototipo approvato**: rifiniture UI round 1, 2026-09-19.

La scala `--z-*` (§1.5) dice cosa sta sopra cosa ma non quanto si stacca dallo sfondo — oggi ogni componente inventa la propria ombra (`shadow-2xl`, `shadow-premium`, box-shadow inline). Cinque livelli agganciati 1:1 ai livelli z già approvati, dichiarati in `@theme` con coppia chiaro/scuro (lo scuro non è lo stesso rgba più leggero, ha opacità propria):

| Livello | Token | Uso | z-index abbinato |
| :--- | :--- | :--- | :--- |
| 0 | *(nessuno, solo bordo)* | Riga lista, contenuto inline | — |
| 1 | `--shadow-1` | `.glass-panel`, toolbar sticky | `--z-sticky` |
| 2 | `--shadow-2` | Popover, dropdown, drawer filtri | `--z-drawer` |
| 3 | `--shadow-3` | Dialog standard e dialog-2 | `--z-dialog` / `--z-dialog-2` |
| 4 | `--shadow-4` | Toast, tour/coach-mark | `--z-toast` / `--z-tour` |

Le ombre semantiche esistenti (`--shadow-carica`/`-scarica`/`-barcode`/`-scan`) **non sono elevazione**: sono feedback colorato di stato e si sommano al livello base, non lo sostituiscono. Mai saltare un livello (un popover non prende l'ombra di un toast solo perché "sembra più importante" — l'elevazione segue lo z-index, non una scelta estetica del componente).

### 1.11 Sistema icone

> **Prototipo approvato**: rifiniture UI round 2, 2026-09-19.

`lucide-react` è già l'unica libreria usata in tutto il codice (32 file) — lo stroke è già coerente a 2px ovunque (il default, mai forzato altrove). Manca solo la dimensione: oggi rilevate **15 misure diverse, da 11 a 42px**, nessuna dichiarata. Scala chiusa a 5 passi:

| Passo | Valore | Uso |
| :--- | :--- | :--- |
| micro | `14px` | Dentro badge, caption, testo inline |
| default | `16px` | Bottoni, nav, input, icon-button — il passo più usato |
| enfasi | `20px` | Header di sezione, icona in filter chip attivo |
| box header | `24px` | Icona nel box `w-9/10 h-9/10` di header modale (§6.2) e stat tile (§4.5) |
| hero | `32-40px` | Empty/error state (§8.2), onboarding |

**Libreria unica**: vietato mischiare altri set di icone o emoji come icona funzionale. **Colore monocromo**: slate neutro o accent semantico, mai palette mista sulla stessa icona — estende a tutte le icone UI il divieto viola già in vigore per le icone tipologia utensile (§4.2).

### 1.12 Token di transizione

> **Prototipo approvato**: rifiniture UI round 2, 2026-09-19.

Tre velocità, dichiarate in `@theme`, al posto di `duration-200`/`duration-300` sparsi e di uno spring Framer Motion diverso per ogni file:

| Token | Valore | Uso |
| :--- | :--- | :--- |
| `--motion-fast` | `150ms` | Micro-feedback: hover colore, `active:scale` su bottoni/icon-button |
| `--motion-base` | `250ms` | Transizioni di stato: apertura accordion, cambio tab/segmented, ingresso toast |
| `--motion-slow` | `400ms` | Cambi di layout ampi: drawer, apertura/chiusura dialog, spotlight tutorial |

**Easing direzionale**: `ease-out` per ciò che entra, `ease-in` per ciò che esce — mai lo stesso in entrambe le direzioni. **Un solo preset spring** Framer Motion per indicator/drag (`stiffness 350, damping 30`, già in uso nell'indicator attivo della sidebar, `Sidebar.jsx`) invece di uno diverso per componente. **`prefers-reduced-motion`**: oggi rispettato solo dallo skeleton (§8.2) — va esteso a tutti gli `active:scale`/hover-translate delle action-btn e ai preset Framer Motion.

### 1.13 Stato unico per elementi interattivi

> **Prototipo approvato**: rifiniture UI round 3, 2026-09-19. Fonte esterna: guida di design interna di Twenty CRM (github.com/twentyhq/twenty).

Bottoni, card, righe tabella, voci di menu, filter chip: **stessa scala di stati per tutti**, dichiarata una volta sola invece di essere ridefinita componente per componente (§5.2 e §4.6 sono casi particolari di questa scala, non regole a sé):

| Stato | Trattamento |
| :--- | :--- |
| Default | Sfondo trasparente o superficie base, nessuna tinta |
| Hover | Tinta `accent-blue/6%` — **sempre questa, mai un grigio diverso per componente** |
| Pressed | Tinta `accent-blue/14%`, solo per la durata del click, transizione `--motion-fast` (§1.12) |
| Selected | Tinta `accent-blue/10%` + indicatore di bordo (sinistro su righe/nav, intero su chip) — mai *solo* un cambio di colore del testo |
| Disabled | Stessa forma e posizione, opacità 40%, nessun hover, nessun colore nuovo |
| Loading | Stesse dimensioni del contenuto pronto, skeleton (§8.2) — mai un componente che cambia formato mentre carica |

**Azioni sempre visibili, mai nascoste dietro un hover del mouse**: i tablet in officina non hanno hover (§0.3) — un'azione "che appare solo passando il mouse" (pattern comune in tool desktop come Gmail/Notion) è invisibile per l'uso touch primario dell'app. Regola: le azioni di riga/card sono **sempre visibili**; quando sono più di due si raggruppano nel menu `⋮` (§3), non si nascondono al passaggio del mouse. Un reveal-on-hover resta un'opzione da valutare in futuro **solo** per una vista realmente desktop-only (es. Operatori/Commesse lato admin) — non è la regola di base e non va introdotto senza una richiesta esplicita.

### 1.14 Griglie che si adattano al contenitore, non al viewport

> **Prototipo approvato**: rifiniture UI round 3, 2026-09-19. Fonte esterna: `shadcn-ui/ui`, esempio dashboard ufficiale (`SectionCards`), Tailwind CSS v4 docs.

Una griglia con `md:grid-cols-4` decide quante colonne mostrare guardando la larghezza dello **schermo**. Dentro un modale o con la sidebar aperta lo spazio reale disponibile è più stretto dello schermo, ma la regola "guarda lo schermo" non se ne accorge — le card si schiacciano lo stesso. Tailwind v4 supporta nativamente le *container query* (`@container`), che rispondono alla larghezza del box, non del viewport:

```html
<!-- Oggi: risponde allo schermo -->
<div class="grid gap-3 md:grid-cols-4">...</div>

<!-- Proposta: risponde al box che lo contiene -->
<div class="@container">
  <div class="grid gap-3 @sm:grid-cols-2 @xl:grid-cols-4">...</div>
</div>
```

**Dove applicarla**: griglia stat tile (§4.5), tessere categoria/diametro (§1.8), campi form multi-colonna nei modali (§7) — ovunque il contenitore non ha garantita la stessa larghezza del viewport. **Dove NON serve**: il passaggio tabella→card sotto `md` (§5) resta legato al dispositivo reale, non al box — lì si resta su `md:`/`lg:`. Nessuna dipendenza nuova, è nativo in Tailwind v4 (già installato).

---

## 2. Page Template & PageHeader

**Obbligatorio per ogni vista di primo livello** (Home, Scanner, Movimento Multiplo, Commesse, Storico, Operatori). Chiude R1/R2 del report: 7 header diversi, 5 stili di "indietro", Home senza titolo, 6 larghezze di contenitore.

Componente: `src/components/layout/PageTemplate.jsx`, esporta `PageHeader` (la barra unica), `PageToolbar`, `PageContent`, `PageFooter`; la ricerca è in `src/components/layout/GlobalSearch.jsx`.

### Anatomia (dall'alto in basso, sempre in questo ordine)

> **Barra unica** *(prototipo approvato, variante A "Esplora risorse", round 5, 2026-09-24 — sostituisce la variante B "percorso dentro la ricerca" provata nello stesso round)*: prima c'erano tre fasce impilate — ricerca globale (`Header.jsx`), titolo + breadcrumb + toggle (`PageHeader`), toolbar con Reset/Seleziona — prima ancora dei filtri, e in Storico/Commesse/Operatori/Scanner una **seconda** casella di ricerca sotto la barra. Ora esiste **una sola barra** (`PageHeader` in `src/components/layout/PageTemplate.jsx`) con **una sola ricerca**, identica in ogni vista; `Header.jsx` è stato eliminato.

| Blocco | Altezza | Obbligatorio | Contenuto |
| :--- | :--- | :--- | :--- |
| **PageHeader (AppBar)** | 64px | Sempre | Da sinistra: menu 44×44 (solo mobile, apre la sidebar) → indietro 44×44 (se c'è un livello a cui tornare) → **casella percorso** → **casella ricerca** → azioni della vista. Titolo: `<h1 class="sr-only">`, visivamente è l'ultimo segmento del percorso. |
| **PageToolbar** | 44px | Solo se la vista ha **filtri** o controlli propri della vista | Solo filtri (e controlli di dominio come commessa/operazione in Movimento Multiplo) — mai ricerca globale, reset, cambio vista o selezione: quelli stanno nella barra. |
| **PageContent** | resto, `flex-1 min-h-0 overflow-y-auto` | Sempre | **Unico** contenitore con scroll della vista. Contiene i 4 stati obbligatori se mostra dati da rete (§6.J). |
| **PageFooter** | 72px sticky | Solo se ci sono azioni bloccanti (wizard, form a step) | Layout: [secondaria outline] + [primaria], sempre a destra |

### 2.1 Percorso e ricerca

Due caselle affiancate con la stessa forma (`h-11`, `--radius-control`, bordo, sfondo `white/80`), come barra indirizzi + casella di ricerca di Esplora risorse:

1. **Percorso (a sinistra)**:
   - Ogni segmento non corrente è un `button` che riporta a quel livello; l'ultimo è il livello corrente (`aria-current="page"`, grassetto, non cliccabile).
   - Il primo segmento è la radice della vista con icona (es. 📦 Inventario); sotto `sm` resta solo l'icona.
   - Il separatore `›` tra due segmenti, **quando il livello ha alternative**, è un bottone che apre il menu degli elementi dello stesso livello ("fratelli") con quello corrente evidenziato: da Fresa › Candela si passa a Fresa › Sferica senza tornare indietro. Se non ci sono alternative il `›` è solo grafico.
   - Viste senza gerarchia (Storico, Commesse, Operatori, Scanner, Movimento Multiplo): percorso = `Sezione › Titolo` (es. Magazzino › Storico movimenti), con la sezione non cliccabile — non esiste una pagina "Magazzino".
   - Mobile (`< md`): i livelli intermedi collassano in un `…` che apre l'elenco completo; restano radice (icona) + `…` + livello corrente.
2. **Ricerca (a destra)** — `SearchField` (`src/components/layout/GlobalSearch.jsx`), `flex-1 basis-0`, **larghezza minima 50px**. **Cerca sempre nel contenuto della vista in cui ti trovi**, mai altrove — stessa logica in tutta l'app:

   | Vista | Cosa cerca | Note |
   | :--- | :--- | :--- |
   | Inventario | Utensili dentro il percorso corrente | Prima lettera in griglia → vista elenco. Fotocamera barcode. |
   | Scanner | Utensile da depositare/prelevare | Autofocus su desktop, fotocamera apre il mirino nella pagina. |
   | Movimento Multiplo | Utensile da aggiungere alla distinta | La prima lettera apre il catalogo (picker `xl`) già filtrato. |
   | Storico movimenti | Movimenti (utensile, codice, operatore) | |
   | Commesse | Commesse (codice, descrizione, ubicazione) | |
   | Operatori | Operatori (nome, ID) | |

   Nessuna vista ha una seconda casella di ricerca sotto la barra. Il placeholder dice cosa si cerca e dove ("Cerca in Candela…", "Cerca operatore per nome o ID…").

**Priorità di spazio (vincolante)**: il percorso tiene la sua larghezza naturale; la ricerca prende tutto lo spazio che avanza. Quando lo spazio finisce, la ricerca si restringe fino a **50px — la lente resta sempre visibile** — e solo dopo il percorso inizia a troncare con ellissi, in quest'ordine: livelli intermedi (`shrink-[4]`), radice (`shrink-[2]`, fino alla sola icona), livello corrente per ultimo (min 3.5rem). Implementazione: percorso `shrink min-w-0` con base `auto`, ricerca `flex-1 basis-0 min-w-[50px]` — mai `flex-1` sul percorso, mai una larghezza fissa sulla ricerca.

Dentro la ricerca, gli accessori compaiono solo se c'è spazio (container query sul campo, §1.14): `×` cancella da 120px, fotocamera barcode da 180px, badge `⌘K` da 260px. Su mobile, quando la ricerca è attiva (focus o testo), percorso, indietro e azioni si nascondono e il campo prende tutta la riga.

**Comportamento**: in Inventario la ricerca si combina con il percorso/filtri attivi. `⌘K`/`Ctrl+K` porta il focus nella ricerca della vista corrente, `Esc` lo toglie.

**Percorso = stato dei filtri**: cliccare un livello del percorso azzera tutto ciò che viene dopo, anche in vista elenco (i filtri a tendina seguono il percorso). L'ordine dei livelli è sempre la cascata Tipologia → Forma → Diametro → attributi, qualunque sia l'ordine in cui l'utente ha scelto i filtri.

**Eccezione dichiarata al target 44×44 (§1.6)**: i separatori-menu `›` sono 32×44px. Il bersaglio principale di navigazione è il segmento stesso (≥44px di altezza, largo quanto il testo); il separatore è una scorciatoia secondaria, e portarlo a 44px di larghezza allungherebbe ogni percorso di 12px per livello, togliendo spazio proprio al testo che la regola di priorità protegge.

### 2.2 Azioni nella barra
A destra della ricerca, in quest'ordine: controlli di vista (toggle elenco/griglia, modalità Scanner — sempre `SegmentedControl` alto 44px; sotto `lg` le opzioni con `compact` restano solo icona) → icona "Aggiorna" (outline, dove la vista carica dati da rete) → **una** azione visibile a testo (es. "Reset filtri", solo quando c'è qualcosa da azzerare, da `lg` in su) → menu `⋮` con tutto il resto (Seleziona più utensili, Nuovo utensile, Reset filtri sempre presente qui, disabilitato quando non serve). Stessa regola di §3: oltre 2 icone → menu `⋮`; "Reset filtri" in rosa e separato da un divisore nel menu.

### Regole
1. **Back**: sempre lo stesso componente icona 44×44 a sinistra della barra, mai testo ("← Home"), mai posizione diversa (niente FAB arancione flottante). Usa `history.back()` quando la navigazione lo permette (chiude la rottura del browser back in Commesse). In Inventario torna al livello precedente del percorso.
2. **Titolo**: un solo titolo per vista, fisso — mai 2-3 varianti dello stesso titolo (Scanner aveva "DEPOSITO RAPIDO"/"PRELIEVO RAPIDO"/"OPTICAL SCANNER"; usare sempre "Scanner" + badge di modalità accanto). È l'ultimo segmento del percorso più un `<h1>` `sr-only` per i lettori di schermo.
3. **Percorso**: presente da subito anche al livello 0, navigabile (§2.1).
4. **Icona**: o nella radice del percorso o nelle card sottostanti, mai entrambe nella stessa vista.
5. **Larghezza**: eredita da `PageContent`, mai dichiarata di nuovo nella vista figlia (§1.6).
6. **Una sola barra e al massimo una `PageToolbar` per vista** *(bug reale osservato, 2026-09-19)*: mai una `PageToolbar` che ne avvolge un'altra, mai una seconda barra con ricerca, reset o selezione dentro un componente figlio (`DropdownFilterView` e `ToolsGrid` non hanno più né "Reset filtri" né "Seleziona": stanno nella barra). Sintomo tipico di questo errore: due linee orizzontali sovrapposte con una fascia vuota in mezzo.
   Quando una toolbar impila due righe (es. filtri che vanno a capo), lo spazio verticale tra le due segue comunque §1.9: passo `compact` (12px), mai i 3-4px che restano "per caso" quando due contenitori vengono uniti senza margine dichiarato.
7. **Wrap della toolbar** *(bug reale osservato, 2026-09-19)*: ricerca e filtri/segmented **non competono mai per lo stesso spazio senza una via d'uscita**. La riga usa `flex-wrap`, la ricerca ha una larghezza minima garantita (`min-w-[220px]` o equivalente) e **non è mai `flex-1` accanto a un gruppo `shrink-0`** che le lascia solo gli avanzi: quando non entrano affiancati, il gruppo filtri/segmented va a capo su una riga sotto, la ricerca resta larga e leggibile. Meglio ancora: contenitore `@container` (§1.14) con `@md:flex-row`/wrap invece di `md:flex-row` fisso sul viewport — la larghezza reale disponibile è quella di `PageContent` (che dipende dalla sidebar), non quella dello schermo, esattamente il caso già descritto in §1.14. Verificato che senza questa regola il placeholder si taglia (es. `CommesseView.jsx`, §2.6 nota d'implementazione).

### 2.3 Schermata di login

> **Prototipo approvato**: variante A "griglia, schermo bloccato", round 5, 2026-09-24. Sostituisce le due card affiancate (presentazione + lista verticale di operatori) che facevano scorrere l'intera pagina e nascondevano alcuni operatori sotto il bordo.

- **Schermo bloccato**: root `fixed inset-0 h-[100dvh] overflow-hidden`. La pagina non scorre mai; se gli operatori non ci stanno, scorre **solo la griglia** dentro la card — intestazione, ricerca e piè di pagina restano fermi.
- **Intestazione**: una riga con marchio (overline "Bercella S.r.l." + nome app) e icon-button `ⓘ` che apre la descrizione del sistema. Il vecchio pannello di presentazione affiancato non c'è più.
- **Card**: alta quanto il contenuto, centrata in verticale, `max-h-full`, `--radius-modal`. Titolo "Chi sei?" + ricerca per nome/ID.
- **Griglia unica**: operatori e amministratori **insieme**, nell'ordine alfabetico del database, senza gruppi separati. 2 colonne su mobile, 3 da `sm`, 4 da `lg`.
- **Tessera persona** (`button` reale, ≥68px di altezza): iniziali 40×40 `accent-blue/10` → nome in `.app-h3` (non maiuscolo, fino a 2 righe, poi ellissi) → ID in `.app-caption`. Stati da §1.13.
- **Amministratori**: stessa tessera, con **solo** un lucchetto 14px a destra (`aria-label` "…, amministratore, richiede password"). Il tocco apre, dentro la stessa card, il passo password: riepilogo persona + campo password + [Indietro outline] [ACCEDI primaria]. Errori inline sotto il campo (§7). Un operatore entra al primo tocco, senza passo intermedio.
- **Piè di pagina**: legenda del lucchetto ("🔒 = richiede password"), così il simbolo non ha bisogno di una sezione dedicata.
- Stati §8.2: skeleton a tessere durante il caricamento, errore con "Riprova", nessun risultato che cita il termine cercato.

---

## 3. Gerarchia delle Azioni (Scala di Enfasi)

> **Perché**: ogni nuova funzione ripeteva lo stesso problema — troppi bottoni a pari peso, nessuna gerarchia (es. `CommesseView` con 4 punti di interazione sovrapposti, `MovementModal` con 3 bottoni identici). Non è una nuova palette: è la regola su **quando** usare quale peso, tra quelli già esistenti.

### Regola fondamentale
**In ogni vista o modale può esistere UNA sola azione Primaria alla volta** (eccezione: coppie complementari a pari dignità come Deposita/Preleva restano entrambe Livello 1 — non c'è gerarchia tra loro, solo verso le accessorie). Le azioni distruttive (elimina, chiudi commessa, disattiva) **non sono mai Primarie**: al massimo Secondarie, di norma nel menu `⋮`.

| Livello | Stile | Quando |
| :--- | :--- | :--- |
| **1. Primaria** | Fill pieno (`.action-btn-carica/-scarica/-primary/-order`) | L'unica azione consigliata (Salva, Conferma) |
| **2. Secondaria** | Outline, stesso ingombro della Primaria | Alternativa valida non prioritaria, o Primaria "orfana" quando è l'unica disponibile |
| **3. Terziaria** | Solo testo + icona | Azioni poco frequenti/navigazione (Vedi Storico) |
| **4. Icona** | Icon-button 44×44, glass/ghost, `aria-label` obbligatorio | Utility su card/riga |
| **Menu `⋮`** | Icon-button 44×44 → popup con lista testuale | **Oltre 2 azioni icona** sulla stessa card/riga: si raggruppano qui, mai affiancate. Azioni distruttive sempre qui, in rosa/rose, separate dal resto con un divisore. |

Componenti da creare: `src/components/ui/icon-button.jsx` (44px, `aria-label` obbligatorio a livello di prop-type/lint), menu `⋮` costruito su `@base-ui/react/menu` (già installato — non serve una nuova dipendenza).

### Applicazioni di riferimento
- `MovementModal.jsx` — step "Dettaglio": Deposita/Preleva Livello 1 a pari peso; "Crea Ordine" Livello 3 quando le prime due sono visibili, Livello 2 quando è l'unica azione (articolo esaurito).
- Card commessa/categoria: `button`/`role=button` reale (mai `div onClick`), stato come badge informativo, azioni (cambia stato, elimina) nel menu `⋮`.

---

## 4. Componenti — Bottoni, Badge, SegmentedControl

### 4.1 Bottoni di azione (macro)
- `.action-btn-carica`: sfondo `--color-accent-emerald`, testo bianco, ombra smeraldo.
- `.action-btn-scarica`: sfondo `--color-accent-rose`, testo bianco, ombra rosa.
- `.action-btn-primary`: sfondo `--color-accent-blue`, testo **`#0f172a` sempre** (mai bianco, §1.1).
- `.action-btn-order`: sfondo `--color-accent-orange`, testo bianco.
- `.glass-button`: secondario, `active:scale-95`, `duration-200`.
- Bottone icona (`Button` shadcn `size="icon"` / `icon-sm` / `icon-lg`): minimo reso **44px** anche quando la classe base shadcn è più piccola — override esplicito, mai lasciare il default 32px (`size-8`) su un controllo touch primario.

### 4.2 Badge & mappa stato→colore (unica ammessa)
`.badge` base: `px-3.5 py-1 rounded-full text-[11px] font-black uppercase`.

| Badge | Significato — **unico** | Non usare per |
| :--- | :--- | :--- |
| `.badge-emerald` | Giacenza > 0, stato Disponibile/Nuovo, operazione Deposita | — |
| `.badge-rose` | Giacenza = 0, stato Esaurito, operazione Preleva, eliminazione | — |
| `.badge-blue` | Codice aziendale, fornitore, info neutra | Stato di giacenza |
| `.badge-orange` | **Solo** alert scorte / "Da ordinare" | Ubicazione, ruolo utente, ricerca risultati (mai "1000 UTENSILI TROVATI" in arancione — è un falso alert) |

> **Bug reale corretto (2026-09-24)**: `ToolsGrid.jsx`, colonna Ubicazione, usava `badge-orange` — esattamente il caso che questa tabella vieta da prima ancora dell'inizio di questo lavoro di rifiniture. Corretto in `badge-blue` ("info neutra", il caso giusto secondo la riga sopra). La regola era già scritta correttamente: il codice non la seguiva.

**Peso visivo relativo tra badge nella stessa riga** *(bug reale osservato, 2026-09-24)*: quando più badge convivono nella stessa riga/card (es. Ubicazione, Stato, Lavorazione in `ToolsGrid`), il colore da solo non basta a stabilire quale conta di più — un badge neutro `bg-slate-100` su sfondo quasi bianco ha meno contrasto della sua stessa tinta di sfondo e "sparisce" come pillola, lasciando il testo scuro in grassetto a risaltare **più** dei badge colorati accanto (misurato: succedeva con Lavorazione, che doveva essere la colonna meno importante). Regola: la colonna meno rilevante non è un badge affievolito, è **testo semplice** (`app-caption text-muted-foreground`, nessun sfondo/bordo) — una pillola "silenziosa" è un ossimoro visivo, non esiste una via di mezzo stabile. Ordine di enfasi in `ToolsGrid`: Stato (badge colorato, informazione operativa diretta) → Ubicazione (`badge-blue`, riferimento) → Lavorazione (testo semplice, metadato).

**Ubicazione: leggero rilievo in più, senza competere con Stato** *(decisione 2026-09-24)*: resta `badge-blue` (informazione di riferimento, non un alert), ma con un'icona `MapPin` (12px) dentro il badge — l'icona velocizza la lettura a colpo d'occhio più di qualsiasi variazione di colore o peso, senza alzarne la "voce" al livello di Stato. La stessa `badge-blue` usata per Codice Aziendale resta senza icona: l'icona è il segnale che distingue "dove si trova" da "un altro codice di riferimento", non un'enfasi generica su tutto il blu.

**Centraggio verticale robusto per badge di cella** *(bug reale osservato, 2026-09-24)*: `text-align:center` su un contenitore blocco + `inline-block` sul badge sembra centrare, ma resta soggetto a differenze di 2-4px tra colonne con configurazioni flex diverse (`isFlex` vs larghezza fissa) — la stessa classe di bug del `min-w-0` mancante, qui sul versante verticale. Fix strutturale: il contenitore diretto del badge è `flex items-center justify-center` (non `text-center`), e il badge stesso è `inline-flex items-center` (non `inline-block`) — il centraggio passa sempre dal motore flex, mai dal text-align, così l'altezza di riga non dipende più dal calcolo del line-box ereditato.

Icone tipologia utensile: monocrome (`accent-blue` o `slate`) o palette ridotta — **mai viola/indigo** (rimuovere da `toolUtils.jsx`).

### 4.3 SegmentedControl
Componente da creare: `src/components/ui/segmented-control.jsx`, su `@base-ui/react/toggle-group`. Sostituisce le 4 implementazioni diverse (Storico, Commesse, Scanner, Multi) e i 3 lessici (CARICO/SCARICO, DEPOSITA/PRELEVA, PRELIEVO/DEPOSITO): **un solo componente, un solo lessico** — vedi glossario §8.

### 4.4 FilterChip
Componente da creare: `src/components/ui/filter-chip.jsx`. Stati: neutro (`bg-black/5`), attivo (`bg-accent-blue/10 text-accent-blue`), sempre con `×` per rimuovere. Ordine in toolbar: ricerca → filtri primari attivi → "+ Altri filtri" (secondari) → segmented. Su mobile: drawer/sheet (`@base-ui/react/drawer`, già installato), mai 7 righe di filtri impilate prima dei dati.

**Filtri a cascata: posizione fissa, mai smontati** *(bug reale osservato, 2026-09-19)*: quando una selezione azzera le opzioni valide di un altro filtro, quel filtro **non sparisce e non si sposta** — resta nello stesso punto, disabilitato (§1.13: stessa posizione, opacità 40%, nessun hover). La cascata resta intelligente (non si può scegliere una combinazione impossibile), ma l'ordine e la posizione dei filtri sul rigo sono uno stato stabile, mai animato da un `layout`/`popLayout` che li fa scivolare — un bersaglio che si sposta mentre l'utente sta per cliccarlo è un problema di ergonomia (Fitts), non un dettaglio estetico. Le uniche cose che possono davvero comparire/sparire sulla riga sono elementi transitori aggiuntivi (chip di ricerca attiva, bottone reset) — mai uno degli **8 filtri stessi**.

**Larghezza minima dei filtri: 140px non basta per le etichette lunghe** *(bug reale osservato, 2026-09-24)*: alla larghezza minima attuale (`min-w-[140px]`), l'etichetta di un filtro con `tracking-[0.25em]` (lo stile `app-overline` usato per tutte le label filtro) può tagliarsi — misurato dal vivo: "SISTEMA MISURA" sfora di 10px, "RIVESTIMENTO" ha solo 7px di margine, entrambi a rischio concreto di troncamento. **Fix**: portare il minimo a `min-w-[160px]`. **Nota di metodo per chi misura queste cose in futuro**: uno spazio tra le lettere così largo (2.5px per ogni carattere a 10px di font) non lo conta un semplice calcolo della larghezza del testo — va sommato esplicitamente (`letter-spacing × (numero caratteri − 1)`), altrimenti la stima dice "ci sta" quando in realtà non ci sta.

**Select vuoto = `null`, mai `undefined`** *(bug reale osservato, 2026-09-24)*: il `Select` di `@base-ui` con `value={undefined}` smette di essere controllato e continua a mostrare l'ultima scelta. Effetti visti: "Reset filtri" e i clic sul percorso azzeravano i dati ma le tendine mostravano ancora il vecchio valore, e scegliendo "(Tutti)" compariva la stringa grezza `all`. Regola: il valore vuoto si passa come `null` e, se esiste un'opzione "Tutti", il suo valore sentinella (`'all'`) si mappa su `null` — così compare il placeholder con il nome del filtro. Vale per `DropdownFilterView`, `ToolsGrid` e Storico.

**`SegmentedControl` — stato selezionato**: `@base-ui` marca l'opzione attiva con `data-pressed`, non `data-state="on"`. Lo stile selezionato usa `data-[pressed]:` (sfondo, testo `accent-blue`, anello `accent-blue/30`); un'opzione semantica può sovrascrivere il colore (es. Deposita smeraldo, Preleva rosa).

### 4.5 Stat Tile

> **Prototipo approvato**: rifiniture UI round 1, 2026-09-19.

Componente da creare: `src/components/ui/stat-tile.jsx`. Chiude l'assenza di overview: Home, Storico e Commesse oggi aprono subito su filtri e tabella, zero lettura a colpo d'occhio.

- **Sola lettura**: nessun `cursor-pointer`, nessun hover "cliccabile" — se in futuro una tile dovrà filtrare la tabella sottostante, cambia forma (bordo + hover reale) invece di restare ambigua.
- **Max 4 per vista**, sempre in cima a `PageContent`, prima di ricerca/filtri — mai in coda.
- **Icona**: stesso box `36×36 rounded-[11px]` dell'header modale (§6.2), colore = colore semantico della metrica (mai decorativo/casuale).
- **Delta**: badge `▲/▼` solo quando il confronto è su un periodo reale e dichiarato; se non c'è un periodo di confronto, badge neutro con l'unità (es. "a magazzino") — mai una percentuale inventata.
- Layout: griglia `2 colonne` mobile → `4 colonne` desktop, `items-stretch`, stesso padding `standard` (§1.9) su tutte.
- **Nota d'uso**: valutare vista per vista se le stat tile tolgono spazio operativo utile (es. su viste dove la tabella deve restare visibile above-the-fold su schermi piccoli/tablet da officina) — in quel caso si omettono, non si comprimono sotto la dimensione minima leggibile.

### 4.6 NavItem — stati

> **Prototipo approvato**: rifiniture UI round 2, 2026-09-19.

`Sidebar.jsx` ha già un buon pattern (barra indicatore animata + tinta sull'elemento attivo): si formalizza come regola vincolante per **qualsiasi** lista di navigazione dell'app, non solo il menu principale, con uno stato `disabled` oggi assente.

| Stato | Trattamento |
| :--- | :--- |
| Default | Sfondo trasparente |
| Hover | Tinta `accent-blue/6%` — **stessa identica tinta dell'hover tabella** (§5.2), mai un grigio diverso per componente |
| Active | Tinta `accent-blue/10%` + barra piena 3px a sinistra, animata (`layoutId`, già implementato) |
| Disabled *(non ancora usato)* | Opacità 40%, `cursor:not-allowed`, nessun hover — riservato a voci non disponibili per il ruolo/piano corrente |

**Badge contatore**: stile unico già corretto (`bg-accent-blue text-white rounded-full`) — oltre 99 mostra "99+", mai un numero a 3+ cifre che allarga il badge. **Un solo componente** `NavItem` per ogni lista di navigazione dell'app. **Nota di allineamento (da applicare in fase di codice, non ora)**: l'overlay del drawer mobile della sidebar usa oggi `z-50` hardcoded mentre §1.5 dichiara `--z-drawer: 40` — da riallineare quando si passa all'implementazione.

---

## 5. DataTable & Toolbar

`ToolsGrid` (TanStack Table + Virtualizer) è **un solo componente con varianti dichiarate**, mai 4 implementazioni diverse per contesto (chiude R3: checkbox fantasma, click riga sbagliato, picker Movimento Multiplo che non aggiunge nulla).

### Prop obbligatorie
- `selectionMode: "none" | "toggle" | "pick"` — mai un booleano globale `isSelectionMode` letto da uno store condiviso tra viste. Va **resettato esplicitamente** in `useNavigationStore.setCurrentView` e ovunque si cambi vista.
- `onRowClick`: semantico rispetto a `selectionMode` (in `"pick"` seleziona, in `"none"` apre il dettaglio — mai lo stesso click con effetti diversi senza che l'utente lo capisca).
- `showCount`: contatore risultati, uno solo, mai duplicato.
- Larghezza ereditata da `PageContent` (§2), mai una larghezza propria diversa nella stessa schermata (Scanner aveva ricerca 896px / card 751px / tabella 1088px insieme).

### Colonne
- Descrizione: `meta:{isFlex:true}`, assorbe lo spazio (`truncate`).
- QTY: `size:64-70px`, fissa, centrata.
- Ubicazione/Fornitore/Stato: `size:100-140px`, fisse.
- **Azioni**: larghezza fissa, mai spostata da un testo lungo in un'altra colonna — la colonna flessibile (Descrizione) si accorcia, le azioni restano al loro posto. Regola generale, non solo per `ToolsGrid`: vale per card commessa/operatore e righe della Distinta (§5.1). *(round 3, 2026-09-19 — vedi anche §1.13 sulla visibilità delle azioni)*
- **Ogni restringimento in un flex container richiede `min-w-0` a ogni livello della catena — non solo `truncate`** *(bug reale osservato, 2026-09-19-24)*: un elemento flex di default rifiuta di restringersi sotto la sua larghezza naturale (`min-width:auto` implicito) finché non riceve `min-w-0` esplicito — e questo vale sia che si voglia troncare un testo, sia che si voglia far andare a capo un gruppo di filtri (`flex-wrap`). Tre bug reali dalla stessa causa: `CommesseView.jsx` (`truncate` su uno `<span>` senza `min-w-0` sullo span né sul suo genitore diretto → il badge e il menu `⋮` sfondavano la card); `DropdownFilterView.jsx` (il wrapper della riga filtri aveva `shrink-0` e nessun `min-w-0` → pretendeva 2167px in una toolbar da 1120px, il `flex-wrap` interno non aveva mai la possibilità di scattare e i filtri finivano fuori schermo, irraggiungibili); `OperatorsView.jsx` (nome operatore con `truncate` senza `min-w-0` sul proprio genitore diretto → con un nome lungo il badge "Tu" avrebbe rischiato di uscire dalla card, stesso schema esatto di `CommesseView`, trovato controllando deliberatamente se il pattern si ripeteva altrove). **Checklist per ogni contenitore che deve restringersi o andare a capo**: `min-w-0` sul contenitore diretto **e** su ogni suo antenato flex fino al primo elemento che ha davvero spazio da cedere; mai `shrink-0` su un wrapper che deve poi lasciare ai suoi figli la possibilità di andare a capo — sono comportamenti opposti.

### Regola mobile (zero scroll orizzontale)
- Mostrare sempre: icona, descrizione (`.app-h3`), quantità (`.app-qty-sm`).
- Nascondere via `hidden md:flex`: ubicazione, fornitore, stato, codice.
- Click riga → Modale Dettaglio con tutte le colonne e info accessorie.
- Sotto `md`: **tabella → card**, mai tabella con scroll orizzontale (vedi prototipo tavola 3).

### 5.1 Distinta (Movimento Multiplo)
- **Griglia immediata, zero empty-state passivo**: la tabella con tutte le colonne (`#`, Descrizione, Codice, Ubicazione, Giacenza, Quantità, Azioni) compare fin dal primo frame — mai un box vuoto/illustrazione.
- Prima riga sempre interattiva (bordo tratteggiato ciano, icona `+`, testo d'invito); righe segnaposto fisse comunicano il "foglio di lavoro pronto".
- In coda: riga fissa `+ Aggiungi riga N (seleziona un altro utensile)…`.
- Selezione articoli: sempre `Dialog size="xl"` (§6.1) con `<ToolsGrid selectionMode="pick" hideExtraFilters />` — mai card compresse o elenchi stretti.

### 5.2 Righe tabella — hover, selezione, densità

> **Prototipo approvato**: rifiniture UI round 1, 2026-09-19.

Tre stati e due densità, oggi non dichiarati da nessuna parte: ogni tabella dell'app deve usare gli stessi valori.

| Stato/densità | Regola |
| :--- | :--- |
| **Compatta** (default, invertito dal round 1) | Riga 44px, `py-2` — *(decisione 2026-09-24, dopo prova dal vivo: la densità "Comoda" da 56px rendeva le righe visibilmente troppo alte rispetto al contenuto — vedi nota sotto)* |
| **Comoda** (opt-in dal toolbar) | Riga 56px, `py-3.5` — solo per viste con poche righe dove serve più respiro (es. risultati di una ricerca molto ristretta) |
| **Hover** | Tinta `accent-blue/6%` uniforme, stesso valore in ogni tabella — caso particolare della scala unica di §1.13 |
| **Selezionata** | Tinta `accent-blue/10%` + bordo sinistro pieno 3px — mai *solo* il checkbox come unico segnale (si perde scrollando) |
| **Riga esaurita** | Colore rosa solo sulla cella Qty/Stato (§4.2), mai sulla riga intera — altrimenti confligge con hover/selezione |

> **Nota bug reale (2026-09-24)**: l'altezza *misurata* dal vivo per "Comoda" era **69px**, non i 56px dichiarati qui — `py-3.5` da solo non produce 56px, dipende anche dall'altezza di riga del contenuto. Va verificata/corretta anche la resa reale di "Compatta" prima di considerarla a posto come nuovo default: il numero nella tabella è l'obiettivo, non è detto che il CSS attuale lo produca esattamente (stesso tipo di scarto già visto altrove in questo documento tra regola scritta e resa reale).
>
> **Chip/badge non allineati tra loro nella stessa riga** *(bug reale osservato, 2026-09-24)*: `Ubicazione`, `Stato` e `Lavorazione` usano classi tipografiche diverse (`app-caption` per Ubicazione, `text-xs font-black` per Stato, ecc.), ognuna con un'altezza di riga propria — il badge risulta centrato nella propria cella ma di 2-4px sopra o sotto il centro reale a seconda della colonna, in direzioni non coerenti tra loro. Il problema non è l'allineamento flex (quello è corretto, verificato) ma l'inconsistenza tipografica tra badge che dovrebbero essere trattati allo stesso modo. **Fix**: un'unica classe di testo per tutti i badge di cella tabella (stessa dimensione, stesso `line-height`), non una scelta diversa per colonna.

---

## 6. Modali & Dialog

Standard obbligatorio: `@/components/ui/dialog` (base `@base-ui/react/dialog`). Mai `div fixed inset-0` custom.

### 6.1 Scala dimensionale (sostituisce le 5 varianti "in prosa" precedenti)
Prop `size` da aggiungere a `DialogContent`, valori **chiusi**, nessun `!max-w-*` arbitrario fuori da questa lista:

| `size` | Larghezza | Uso | Struttura interna |
| :--- | :--- | :--- | :--- |
| `sm` | 448px | Conferme, alert distruttivi | Colonna singola, `p-6 sm:p-8`, 2 bottoni (Annulla / Azione) |
| `md` | 640px | Form anagrafici, commesse, config utente | Griglia 2 colonne su desktop, `p-6 sm:p-8` |
| `lg` | 768px | Movimento utensile, wizard multi-step | Hero QTY, stepper, `p-6 sm:p-8 md:p-10` |
| `xl` | 1024px | Selezione tabellare estesa (picker distinta) | `ToolsGrid` integrata, `h-[88dvh]` |

**Wizard multi-step** (es. Dettaglio → Prelievo → Crea Ordine): resta **sempre alla stessa `size`** dall'inizio alla fine, footer con [INDIETRO] + [AVANTI/INVIA] nella stessa modale — mai un salto di formato a metà flusso (chiude il caso 768→448px senza back).

### 6.2 Anatomia header (millimetrica)
- Sinistra: icona in box `w-12 h-12 rounded-[18px] bg-accent-blue/10 border border-accent-blue/20`.
- Centro: overline (`.app-overline`) + badge di stato opzionale + `.app-h2` + sottotitolo (`.app-body text-slate-500`).
- Destra: `X` allineata, `min-w-[44px] min-h-[44px]`, **sempre** `showCloseButton={false}` su `DialogContent` + `X` reinserita nella riga flex dell'header (mai il default shadcn `absolute top-2 right-2` fluttuante).
- Titolo con codice: separare azione (`.app-h2`) e codice (badge mono dedicato), mai `truncate` su titoli operativi brevi.

### 6.3 Regole
1. Zero "box in a box": niente contenitori grigi intermedi con bordi spuri. *(Estesa oltre i modali, round 3: vale ovunque due superfici con bordo/sfondo proprio si toccherebbero — una stat tile, §4.5, non va incorniciata di nuovo dentro un riquadro; una riga di tabella non va richiusa in un pannello con lo stesso bordo della tabella che la contiene.)*
2. Bottoni di conferma: `whitespace-nowrap font-black tracking-wider`, mai a capo su due righe.
3. Dismiss con dati non salvati (`dirty`): richiede conferma, mai scarto silenzioso su Esc/click fuori.
4. Footer: `-mx-4 -mb-4 border-t bg-muted/50`, sempre `[secondaria outline] + [primaria]` in quest'ordine, mai 3 bottoni a pari peso.

---

## 7. Form

Griglia 1/2/4 colonne in base a `size` del dialog (§6.1). Gruppi con titolo `.app-h3`. Primitive `Input`/`Select` (`src/components/ui/`) allineate ai token di §1, mai riscritte a mano per singola vista.

### Regole
1. **Label**: `.app-label`, minimo 11px — mai 8-9px opacità 60%.
2. **Asterisco = validato**: un campo con `*` deve avere una regola di validazione reale attiva. Vietato marcare 12 campi come obbligatori quando solo 3 sono validati.
3. **Errori**: sempre inline sotto il campo, `aria-invalid` + focus automatico sul primo errore + apertura automatica dell'eventuale accordion che lo contiene. **Mai `alert()`**.
4. **Accordion "Attributi avanzati"**: solo per campi davvero opzionali, chiuso di default con badge conteggio (pattern già applicato in `AddToolModal.jsx` — divulgazione progressiva reale, non un div che nasconde campi obbligatori).
5. **Placeholder**: sempre un esempio di formato (`AZ-1042`), mai testo che sembra un valore precompilato (niente `••••••••` per una password vuota).
6. **Campo barcode**: bottone camera integrato (scanner), mai un campo di solo testo.
7. **Touch/iOS**: input `text-sm` (14-16px) per evitare l'auto-zoom Safari. Focus ring sempre visibile (`focus-visible:ring-2 focus-visible:ring-accent-blue/50`).

---

## 8. Toast, Stato e Navigazione

### 8.1 Toast (unico globale)
Componente da creare: `src/components/common/Toast.jsx` su `@base-ui/react/toast` (già installato — sostituisce le 3 implementazioni attuali: globale, Operatori, Commesse-fallback).
- Un solo slot, in coda se più notifiche, `role="status"`.
- Posizione: mai sopra la ricerca globale o zone interattive attive; rispetta `.safe-toast-top`.
- Copy umano, mai da log ("NOTIFICA SISTEMA" → messaggio in linguaggio naturale).
- Azioni distruttive/reversibili: sempre `onUndo` quando l'azione è annullabile (es. "Ubicazione chiusa" deve poter tornare indietro).

### 8.2 StateBlock — 4 stati obbligatori
Componente da creare: `src/components/common/StateBlock.jsx`. **Ogni vista che mostra dati da rete deve gestire esplicitamente**:
1. `loading` — mai un empty state travestito da "0 elementi" durante il caricamento.
2. `empty` — con CTA pertinente.
3. `error` — leggibile, con retry. **Mai** un errore Supabase silenzioso che mostra l'empty state (rischio concreto: Commesse/Storico duplicano dati perché l'utente pensa che la lista sia vuota).
4. `success` — contenuto normale.

> **Skeleton loading** *(prototipo approvato, rifiniture UI round 1, 2026-09-19)*: per liste/tabelle/griglie con dati da rete, `loading` non è uno spinner generico ma uno skeleton che ricalca la geometria esatta del contenuto reale (stessa altezza riga/card, stesso radius, stesse colonne) — shimmer unico `1.4s ease infinite`, rispetta `prefers-reduced-motion` (diventa opacità fissa, mai rimosso del tutto). Lo spinner resta solo per azioni puntuali (submit di un bottone).

> **Anatomia empty & error** *(prototipo approvato, rifiniture UI round 2, 2026-09-19)*: stessa struttura per entrambi — icona `56×56 rounded-[18px]` centrata → titolo `.app-h3` una riga → corpo `.app-body` max 36 caratteri di larghezza, max 2 righe → **un solo** bottone (mai due a pari peso). `empty` = icona neutra (`text-muted` su `surface-sunken`), mai tinta di allarme. `error` = rosa **solo sull'icona**, mai sfondo pieno della card. Copy umano: dire cosa è successo + cosa fare, mai codici errore o testo Supabase in chiaro (il dettaglio tecnico va in console/log). Altezza minima uguale a quella dello skeleton che lo precede, per non far "saltare" il layout.
>
> **Empty state contestuale** *(prototipo approvato, rifiniture UI round 3, 2026-09-19)*: `empty` non è un solo messaggio ma tre, stessa anatomia, causa diversa nominata nel testo — mai lo stesso "Nessun elemento trovato" per situazioni diverse: **vuoto genuino** (nessun dato esiste ancora, es. commessa senza movimenti → CTA "Registra il primo movimento", eventuale link secondario "Scopri come funziona" solo qui); **vuoto per filtri** (i dati esistono, i filtri li escludono → CTA "Reimposta filtri"); **nessun risultato ricerca** (il messaggio cita il termine cercato, es. «Nessun risultato per «D16»» → CTA "Modifica la ricerca"). Mai un secondo bottone a pari peso: solo un link testuale, e solo nel vuoto genuino.

### 8.3 Stato tra viste — nessun effetto collaterale nascosto
1. `useNavigationStore.setCurrentView` azzera sempre `isSelectionMode`/`selectedToolsIds` e ogni stato di "modalità" transitorio (chiude leak in Scanner, picker, Home).
2. Overlay/tour/ricerca globale **non modificano mai** lo stato della vista ospite. La ricerca globale in focus non resetta filtri né cambia vista (`Header.jsx` — rimuovere side-effect da `onFocus`).
3. Chiudere il tutorial aggiorna solo il flag `tutorialCompleted`, mai l'intero utente/ruolo (`useAuthStore.completeTutorial` non deve chiamare `setCurrentUser`).
4. Stato di modalità che sopravvive a un'operazione conclusa (es. `batchOpType`) va resettato subito dopo `onSuccess`.
5. Azioni distruttive → conferma esplicita o Toast con Undo, mai silenziose ("Annulla" non deve mai significare "svuota tutta la distinta" senza dirlo).
6. Navigazione: `history.back()` per il back quando possibile; niente route custom con `pushState` manuale che rompe il tasto Indietro del browser (serve il rewrite SPA in `vercel.json` per `/commesse`).

---

## 9. Glossario (nomi vincolanti in tutta l'app)

> **Principio generale** *(round 3, 2026-09-19)*: la tabella sotto fissa il lessico di dominio, ma la regola vale per **qualsiasi** azione ricorrente dell'interfaccia, non solo per queste voci — se un'azione si chiama "Aggiorna" in Storico, non può chiamarsi "Ricarica" altrove con lo stesso identico effetto.

| Concetto | Nome unico da usare | Mai |
| :--- | :--- | :--- |
| Operazioni di magazzino | **Deposita** / **Preleva** | Carico/Scarico, Prelievo/Deposito |
| Registro movimenti | **Storico movimenti** | Storico Log, Tracciamento Log |
| Overlay di aiuto | **Guida** | 5 nomi diversi per lo stesso overlay |
| Vista utensile | **Dettaglio utensile** | — |
| Elenco righe Movimento Multiplo | **Distinta** | — |
| Reset filtri (distruttivo) vs azzeramento locale campo | **"Reset filtri"** (rosa, con conferma se ci sono filtri attivi) vs **"Cancella"** (arancione, singolo campo) | Due bottoni affiancati con nomi/colori invertiti o ambigui |

---

## 10. Riferimenti esterni (per gli agenti)

Prima di introdurre una nuova classe Tailwind, un nuovo token o una nuova variante di componente shadcn non prevista da questo documento:
1. **[Tailwind CSS v4 — Theme variables](https://tailwindcss.com/docs/theme)**: i valori arbitrari (`w-[672px]`, `text-[13px]`) sono un'eccezione "una tantum", non la norma — se un valore si ripete, va promosso a token `@theme` (radius, z-index, spacing di questo documento). `@utility` per classi che devono supportare varianti (`hover:`, `lg:`, come le `.app-*`); `@layer components` per blocchi component-like sovrascrivibili dalle utility (`.badge`, `.action-btn-*`).
2. **[Tailwind CSS v4 — Dark mode](https://tailwindcss.com/docs/dark-mode)**: strategia già corretta in `src/index.css` (`@custom-variant dark (&:where(.dark, .dark *))` + classe `.dark` sulla root) — non cambiare pattern.
3. **[shadcn/ui — Theming](https://ui.shadcn.com/docs/theming)**: ogni nuovo token semantico va dichiarato come coppia `--token` / `--token-foreground` in `:root`/`.dark`, esposto via `@theme inline` — mai un colore accent usato come sfondo senza il suo `-foreground` dichiarato (§1.1).
4. **[shadcn/ui — componenti](https://ui.shadcn.com/docs/components)**: prima di scrivere un componente a mano, verifica se esiste già un blocco shadcn equivalente da installare via CLI ed estendere (pattern già seguito da `dialog.jsx`, `button.jsx`, `select.jsx`). I componenti nuovi richiesti da questo documento (`icon-button`, `segmented-control`, `filter-chip`, `toast`, drawer filtri mobile) si costruiscono sulle primitive **già installate** in `@base-ui/react` (`menu`, `toast`, `toggle-group`, `drawer`, `tooltip`, `popover`) — non serve aggiungere dipendenze.

---

## 11. Riferimenti visivi

| File | Contenuto |
| :--- | :--- |
| [`docs/design/screenshots/01-style-guide.png`](./docs/design/screenshots/01-style-guide.png) | Palette, tipografia, componenti glass/badge, Scala di Enfasi. |
| [`docs/design/screenshots/02-gerarchia-azioni.png`](./docs/design/screenshots/02-gerarchia-azioni.png) | 3 approcci confrontati per `MovementModal` prima di scegliere "Peso Differenziato" (§3). |
| [`docs/design/screenshots/03-commesse-redesign.png`](./docs/design/screenshots/03-commesse-redesign.png) | `CommesseView`: 4 affordance ridondanti → click unico + badge + menu `⋮` (già applicato al codice). |
| [`docs/design/screenshots/04-addtool-redesign.png`](./docs/design/screenshots/04-addtool-redesign.png) | `AddToolModal`: toggle piatto → accordion "Attributi Avanzati" (già applicato al codice). |
| Prototipi Page Template / Colore-Modali-Toast-Stati / Tabella-Scale | 3 tavole approvate in questa revisione (§2, §4.2, §6.1, §5) — link nell'artifact di sessione, da salvare come screenshot in `docs/design/screenshots/` se servono da riferimento persistente offline. |

---

## 12. Checklist di controllo qualità

Prima di considerare conclusa qualsiasi modifica:
1. [ ] Nessun colore `indigo`/`purple`/`violet`.
2. [ ] Zero scroll orizzontale su mobile (375-428px); tabelle → card sotto `md`.
3. [ ] Nessuna classe di testo arbitraria: solo `.app-*` (§1.3).
4. [ ] Nessun valore arbitrario riusato (radius, larghezza pagina, z-index): usa i token di §1.4-§1.6.
5. [ ] Vista di primo livello conforme a `PageTemplate`/`PageHeader` (§2): una sola barra con casella percorso + casella ricerca (min 50px, il percorso tronca solo dopo), la ricerca cerca nel contenuto della vista, back 44px, azioni a destra, nessuna seconda casella di ricerca/reset/selezione fuori dalla barra.
6. [ ] Oltre 2 icon-button sulla stessa riga/card → raggruppate nel menu `⋮` (§3).
7. [ ] Badge/colore conformi alla mappa stato→colore unica (§4.2) — nessun uso "creativo" dell'arancione.
8. [ ] Modale: `size` tra `sm/md/lg/xl` (§6.1), header con `showCloseButton={false}` + `X` nella riga flex, nessun "box in a box".
9. [ ] Form: asterisco solo su campi realmente validati, errori inline (mai `alert()`), label ≥11px.
10. [ ] Vista con dati da rete: gestisce i 4 stati (loading/empty/error/success, §8.2).
11. [ ] Cambio vista: nessuno stato di selezione/modalità residuo (§8.3); overlay/ricerca globale non alterano lo stato della vista ospite.
12. [ ] Elementi interattivi (card, riga) sono `button`/`role=button` con `tabIndex` e `aria-label`, mai `div onClick`.
13. [ ] Doppio tema verificato (chiaro/scuro), contrasto testo/sfondo ≥4.5:1 sui token di §1.1.
14. [ ] `npm run build` e `npm run lint` puliti.
15. [ ] Padding/gap di card, sezioni e modali solo sui 6 passi di §1.9 (4/8/12/16/24/32px) — nessun `p-5`/`p-7`/`gap-5` a quel livello (i mezzi-passi su badge/icon-button/chip restano ammessi, eccezione §1.9).
16. [ ] Ombre solo dai livelli di §1.10 (`--shadow-1..4`), mai un `shadow-2xl`/box-shadow inline nuovo fuori scala.
17. [ ] Tabelle: densità e stati riga conformi a §5.2 (hover/selezione/densità), skeleton conforme a §8.2 per il caricamento di liste/tabelle/griglie.
18. [ ] Icone solo `lucide-react`, dimensione tra i 5 passi di §1.11 (14/16/20/24/32-40px) — nessuna misura arbitraria nuova.
19. [ ] Empty/error state conformi all'anatomia di §8.2 (icona → titolo → corpo → un solo CTA); hover di qualsiasi elemento cliccabile = `accent-blue/6%` (§4.6, §5.2), mai un grigio diverso per componente.
20. [ ] Voci di navigazione (sidebar o altre liste) conformi ai 4 stati di §4.6, incluso `disabled` dove serve.
21. [ ] Vista provata con il contenuto più lungo plausibile (nome utensile, codice, ubicazione) — nessun testo che sposta un'icona/azione dal suo posto (§5, §1.13).
22. [ ] Empty state differenziato per causa (vuoto genuino / per filtri / ricerca senza risultati, §8.2), mai lo stesso messaggio generico per tutte e tre.
23. [ ] Griglie dentro contenitori a larghezza variabile (modali, stat tile, tessere) usano `@container` (§1.14), non solo `md:`/`lg:` legati al viewport.
24. [ ] `.app-h3` non maiuscolo quando mostra un dato reale (descrizione, nome, testo libero) — maiuscolo ammesso solo su etichette brevi a vocabolario fisso (§1.3) o sull'eccezione dichiarata delle tessere categoria.
25. [ ] Login: pagina che non scorre, griglia unica operatori + admin, lucchetto solo sugli admin (§2.3).
26. [ ] `Select`: valore vuoto passato come `null` (mai `undefined`), opzione "Tutti" mappata su `null` → torna il placeholder (§4.4).
