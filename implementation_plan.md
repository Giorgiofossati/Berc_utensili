# Implementation Plan — Rifiniture UI/UX Bercella Utensili

Piano d'esecuzione per applicare al codice le regole approvate nei round 1-3 di rifiniture (già scritte in [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)). Non ripete la migrazione già completata (Fase 0-4 di [`Miglioramenti UI/audit/REPORT_FINALE.md`](./Miglioramenti%20UI/audit/REPORT_FINALE.md): PageTemplate, Dialog `size`, StateBlock, icon-button, filter-chip, segmented-control, reset stato tra viste — tutta già nel codice) — copre solo il **delta** tra lo stato attuale e le regole dei tre round di rifiniture.

**Convenzioni**: ogni voce cita la sezione di `DESIGN_SYSTEM.md` che la giustifica e il file da toccare. Ordine pensato per dipendenze: i token vengono prima dei componenti che li usano, i componenti condivisi prima delle viste che li consumano. Non saltare fasi: un componente che usa `--shadow-2` prima che il token esista si rompe silenziosamente.

Prima di iniziare, verificare `npm run lint:tokens` (script già presente in `package.json`) per capire se controlla già radius/z-index — se sì, estenderlo con le nuove regole in Fase 1 invece di scrivere un controllo separato.

---

## Fase 0bis — Bug reali osservati (priorità massima)

Trovati con screenshot di produzione + verifica dal vivo (dev server, misure DOM reali, non stime) il 2026-09-19. A differenza del resto del piano, questi non aspettano i token di Fase 1: sono correzioni puntuali e indipendenti, da fare per prime.

1. **`CommesseView.jsx:214`** — la riga toolbar (`flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full`) non va mai a capo da `md:` in su: la ricerca è `flex-1 md:max-w-md` accanto a un segmented control `shrink-0`, che le lascia solo lo spazio avanzato. Misurato dal vivo: il placeholder ha bisogno di 291px, la casella ne riceve 259 → 32px tagliati (§2, regola 6 nuova). **Fix**: `flex-wrap` sulla riga, la ricerca con una larghezza minima garantita (`min-w-[220px]` o simile) che non scende mai sotto la leggibilità del placeholder; il gruppo segmented va a capo sotto quando non c'è spazio, invece di comprimere la ricerca.

2. **`CommesseView.jsx:351-355`** — `<span className="... truncate">{item.codice}</span>` non si restringe: manca `min-w-0` sullo span stesso e sul suo genitore diretto (riga 351), quindi il blocco icona+codice+badge chiede 294px in una card che ne ha 233 disponibili — il menu `⋮` finisce **87px fuori dalla card** (misurato dal vivo). **Fix**: aggiungere `min-w-0` allo `<span>` di riga 352 (o al div di riga 351) — la catena `min-w-0` deve arrivare fino all'elemento che tronca, non fermarsi due livelli sopra come oggi (§5, nuova nota sul troncamento).

3. **Verifica da estendere**: lo stesso pattern (badge/testo inline senza `min-w-0` sull'elemento con `truncate`) va controllato anche in `OperatorsView.jsx` e nelle righe di `VirtualizedTable.jsx` — non aperti in questa sessione, ma è lo stesso errore strutturale e potrebbe ripetersi.

4. **Doppia `PageToolbar` in Inventario/Elenco** (§2, regola 6 nuova) — `App.jsx:320-330` avvolge `DropdownFilterView` (che a `DropdownFilterView.jsx:222` renderizza già la propria `PageToolbar`, con `border-b-0` per evitare un doppio bordo — ma la toolbar esterna resta comunque, con il suo bordo, creando due linee con una fascia vuota in mezzo). **Fix**: eliminare la `PageToolbar` esterna in `App.jsx` per il ramo `dropdown`/Elenco; il bottone "Resetta Tutto" (oggi a `App.jsx:324`) si fonde con il bottone "Reset" già presente in `DropdownFilterView.jsx:287-298` (vedi punto 5) invece di restare un secondo controllo in una toolbar separata. In modalità Griglia (`viewMode === 'grid'`) la `PageToolbar` esterna resta invece necessaria (è l'unica, non c'è un `DropdownFilterView` sotto) — il fix riguarda solo il ramo Elenco.

5. **Due bottoni di reset invertiti rispetto al glossario** (§9) — "Resetta Tutto" arancione (`App.jsx:324`, usa `resetFilters`) e "Reset" rosa (`DropdownFilterView.jsx:287-298`, usa `setFilters({}); clearSearchQuery()`) sono due controlli distinti con colori scambiati: il glossario dice "Reset filtri" (distruttivo) = rosa, "Cancella" (locale) = arancione — nel codice è il contrario, e sono pure duplicati. **Fix**: un solo bottone "Reset filtri" rosa che azzera sia `filterStack`/`resetFilters` sia i filtri interni di `DropdownFilterView` (i due stati vanno unificati o il reset deve chiamare entrambi); eliminare il secondo controllo. Va deciso durante il fix se `resetFilters` e `setFilters({})` sono già sincronizzati (sembra di sì, tramite `onFilterChange`) — se lo sono, probabilmente serve solo **un** bottone che chiama uno dei due.

6. ~~**Filtri a cascata che si spostano**~~ — **Applicato** (verificato nel codice il 2026-09-24: `DropdownFilterView.jsx` non smonta più i filtri, usa `isDisabled` + `disabled` sul `Select`/`SelectTrigger`, `layout`/`popLayout` rimossi dai filtri). Ha però scoperto il bug 7 sotto.

7. **Riga filtri che sfora a destra, irraggiungibile** (§5, regola `min-w-0` generalizzata) — `DropdownFilterView.jsx:250`, `<motion.div className="overflow-hidden shrink-0">` che avvolge l'intera riga filtri: `shrink-0` + nessun `min-w-0` fa sì che questo wrapper pretenda la sua larghezza "a contenuto" (misurato dal vivo: **2167px**) invece di rispettare i **1120px** disponibili nella `PageToolbar` — il `flex md:flex-wrap` dei filtri al suo interno non ha mai la possibilità di andare a capo, perché il suo contenitore diretto non si restringe mai abbastanza da forzarlo. Stessa causa esatta del bug 2 (`CommesseView`), sintomo diverso: lì rompeva `truncate`, qui rompe `flex-wrap`. **Fix**: su quel `motion.div` sostituire `shrink-0` con `min-w-0 w-full` (deve *poter* restringersi e occupare la larghezza reale disponibile, non il contrario).

8. **Filtri "appiccicati" alla barra sopra** (§2, nota spaziatura) — spazio verticale tra la barra di ricerca/vista e la riga filtri misurato dal vivo: **4px**, nessun passo della scala di §1.9 (probabile residuo della rimozione della doppia toolbar del bug 4). **Fix**: portare il gap al passo `compact` (12px) — verificare il margine/padding tra `PageToolbar` (bug 4) e il wrapper di riga 250 una volta corretto il bug 7, potrebbero risolversi insieme.

9. **Densità compatta come default** (§5.2, decisione invertita il 2026-09-24) — `ToolsGrid.jsx:27`, `density: propDensity = 'comfortable'` → `'compact'`. Cambia il default per tutti e 4 gli usi di `ToolsGrid` (`DropdownFilterView.jsx`, `App.jsx:229`, `AddToolToMultiModal.jsx`, `ScannerView.jsx`) — nessuno passa `density` esplicitamente oggi, quindi erediteranno tutti il nuovo default. **Verificare prima di chiudere**: l'altezza *reale* di "Comoda" misurata dal vivo è 69px, non i 56px dichiarati in §5.2 — controllare che "Compatta" (`py-2`, stimata 44px) non abbia lo stesso scarto tra dichiarato e reale prima di promuoverla a default, e che il target touch rimanga ≥44px anche nella resa effettiva (§1.6, "44px senza eccezioni").

10. **Badge di riga non allineati tra loro** (§5.2, nuova nota) — `ToolsGrid.jsx`: Ubicazione (riga 183) e Lavorazione (riga 235) usano già `app-caption`, coerenti tra loro; **Stato** (riga 208) è l'unico fuori standard con `text-xs font-black` — altezza di riga diversa, quindi centrato nella propria cella ma 2-4px sopra o sotto il centro reale rispetto alle altre due colonne (misurato dal vivo). **Fix**: colonna Stato → `app-caption font-black` al posto di `text-xs font-black`, per allinearsi a Ubicazione/Lavorazione.

11. **Filtri con etichetta lunga a rischio taglio** (§4.4, nuova regola) — `DropdownFilterView.jsx:261`, `min-w-[130px] md:min-w-[140px]`. Misurato dal vivo a viewport stretto: "SISTEMA MISURA" sfora di 10px, "RIVESTIMENTO" ha solo 7px di margine (causa: `tracking-[0.25em]` su `app-overline` aggiunge ~2.5px per carattere, non conteggiati da una stima naive della larghezza testo). **Fix**: `md:min-w-[140px]` → `md:min-w-[160px]`.

12. **`.app-h3` non più maiuscolo su dati reali** (§1.3, round 4 approvato) — `src/index.css`: rimuovere `uppercase` dalla definizione di `.app-h3`. Poi rivedere i 18 usi nel codice, con trattamento diverso a seconda del ruolo:
    - **Dato reale → beneficia della rimozione, nessuna modifica al JSX serve** (il cambio è nel CSS): `ToolsGrid.jsx:129` (descrizione utensile), `OrderModal.jsx:98`, `HistoryView.jsx:280,641` (descrizione movimento), `MultiMovementView.jsx:245,324` (righe Distinta), `CommesseView.jsx:417` (`item.descrizione`, testo libero), `LoginScreen.jsx:290,315,340` (nome operatore).
    - **Etichetta fissa breve → il cambio va bene anche qui, nessuna azione richiesta**: `AddToolModal.jsx:156,206,361`, `UserSettingsModal.jsx:50`, `BarcodeScanner.jsx:148`, `StateBlock.jsx:231`.
    - **Eccezione da applicare esplicitamente**: `CategoryGridCard.jsx:28` (tessere "Fresa"/"Alesatore") — aggiungere l'utility `uppercase` di Tailwind accanto a `app-h3` per mantenere l'aspetto attuale, come da eccezione dichiarata in §1.3. `DiameterList.jsx:62` — verificare il contenuto reale (probabile valore diametro, es. "Ø10"): se è un dato o un'etichetta decide se applicare la stessa eccezione.

---

## Fase 1 — Token di base (`src/index.css`)

Nessuna vista dipende da queste modifiche per funzionare oggi, ma tutto il resto del piano le usa. Farle per prime.

1. **Ombre/elevazione (§1.10)** — aggiungere in `@theme`:
   ```css
   --shadow-1: 0 8px 24px rgba(15,23,42,.06);
   --shadow-2: 0 16px 40px rgba(15,23,42,.12);
   --shadow-3: 0 28px 64px rgba(15,23,42,.20);
   --shadow-4: 0 18px 44px rgba(15,23,42,.28);
   ```
   più le varianti scure (opacità propria, non lo stesso rgba più leggero) in `:root.dark`. Non toccare `--shadow-premium/-carica/-scarica/-barcode/-scan`: restano ombre semantiche separate (§1.10).

2. **Token di transizione (§1.12)** — aggiungere in `@theme`:
   ```css
   --motion-fast: 150ms;
   --motion-base: 250ms;
   --motion-slow: 400ms;
   ```

3. **Stato unico per elementi interattivi (§1.13)** — aggiungere in `@layer components` una utility riusabile, es. `.state-hover-tint` (`background-color: rgba(14,165,233,.06)`) e `.state-selected` (`background-color: rgba(14,165,233,.1); box-shadow: inset 3px 0 0 var(--color-accent-blue);`), così ogni componente delle fasi successive la importa invece di reinventare il colore.

4. **`prefers-reduced-motion` globale (§1.12)** — estendere la media query già presente per lo skeleton (da creare in Fase 2) a tutte le classi `active:scale-*`/`hover:-translate-*` esistenti in `index.css` (`action-btn-carica`/`-scarica` usano `animate-pulse` sulle frecce — disattivarlo sotto `prefers-reduced-motion`).

5. **Verifica z-index drawer (§1.5, nota round 2)** — non è un token da aggiungere, è una riga da correggere in `Sidebar.jsx` (vedi Fase 3.2): l'overlay mobile usa `z-50` invece di `var(--z-drawer)`. Segnato qui perché dipende dai token già esistenti in `@theme`, nessuna modifica a `index.css`.

---

## Fase 1bis — Spacing fuori scala (§1.9)

Controllato nel codice (non solo teoria): **17 casi reali** di `p-5`/`px-5`/`py-5`/`gap-5`/`mt-5` (20px, il passo "quasi standard" vietato da §1.9) da riportare al passo più vicino della scala a 6 (di solito `-4` 16px se è un padding interno, `-6` 24px se separa due sezioni — valutare caso per caso, non un cerca-e-sostituisci automatico):

| File | Riga | Classe da correggere |
| :--- | :--- | :--- |
| `src/App.jsx` | 223 | `gap-5` |
| `src/App.jsx` | 430 | `p-5` |
| `src/features/auth/UserSettingsModal.jsx` | 41 | `p-5` |
| `src/features/filters/DiameterList.jsx` | 93 | `p-5` |
| `src/features/admin/HistoryView.jsx` | 542 | `p-5` |
| `src/features/admin/CommesseView.jsx` | 298 | `px-5` |
| `src/features/admin/CommesseView.jsx` | 338 | `p-5` |
| `src/features/inventory/MovementModal.jsx` | 193 | `gap-5` |
| `src/features/scanner/ScannerView.jsx` | 132 | `py-5` |
| `src/features/inventory/OrderModal.jsx` | 111 | `gap-5` |
| `src/features/inventory/AddToolModal.jsx` | 132 | `p-5` + `gap-5` (due sul tag stesso elemento) |
| `src/features/inventory/AddToolModal.jsx` | 155 | `p-5` + `gap-5` |
| `src/components/common/ErrorBoundary.jsx` | 104 | `mt-5` |
| `src/components/layout/Header.jsx` | 115 | `p-5` |
| `src/components/common/AppTutorial.jsx` | 258 | `p-5` |

**Non toccare** invece i mezzi-passi (`gap-1.5`, `py-2.5`, `p-3.5`, `mt-0.5`, 228 occorrenze rilevate): sono rifiniture fini già collaudate su badge/icon-button/chip, non violazioni — vedi l'eccezione ora esplicita in §1.9. Riscriverli tutti sarebbe un diff enorme senza beneficio visivo, con rischio concreto di regressione su elementi già allineati al pixel.

Fase indipendente, a basso rischio, può essere fatta subito dopo i token di Fase 1 e prima di aprire i componenti condivisi.

---

## Fase 2 — Componenti condivisi da estendere

Tutti già esistenti; si modificano, non si ricreano.

### 2.1 `src/components/common/StateBlock.jsx` (§8.2)
Stato attuale: icona `w-16 h-16` generica, un solo `loading` a spinner, un solo `empty` generico.
- Ridurre l'icona a `56×56` (`w-14 h-14`) con `rounded-[18px]`, per allinearsi a §8.2.
- Aggiungere una prop `variant` per `empty`: `'generic' | 'filtered' | 'search'` (§8.2 round 3) — ciascuna con icona/titolo/corpo/CTA propri (default a `'generic'` per non rompere le chiamate esistenti).
- Aggiungere modalità `loading="skeleton"` con una prop `skeletonShape: 'row' | 'card' | 'grid'` che renderizza blocchi shimmer della geometria richiesta invece dello spinner; mantenere lo spinner come default per non rompere gli usi attuali finché le viste non passano esplicitamente `skeletonShape`.
- Aggiungere l'animazione shimmer (`@keyframes shimmer`) in `index.css`, guardata da `prefers-reduced-motion` (§8.2).
- `error`: verificare che il `description` di default non esponga mai un messaggio Supabase grezzo quando i chiamanti passano `error.message` direttamente (controllare gli usi in Fase 4).

### 2.2 `src/components/layout/Sidebar.jsx` (§4.6, §1.13)
- `NavItem`: cambiare `hover:bg-slate-100 dark:hover:bg-slate-800/50` in `hover:bg-accent-blue/[0.06]` — stessa tinta della tabella, non più un grigio diverso.
- Aggiungere prop `disabled` a `NavItem`: `opacity-40 cursor-not-allowed pointer-events-none`, nessun `onClick`.
- Badge contatore (`multiMovementCount`): se `> 99` mostrare `"99+"` invece del numero pieno.
- Riga 267 (`motion.div` overlay mobile): sostituire `z-50` con `z-[var(--z-drawer)]`.

### 2.3 `src/components/common/DataTable/VirtualizedTable.jsx` (§5.2, §1.13)
File dove vivono davvero hover/selezione della tabella (non in `ToolsGrid.jsx`).
- Riga 147: `hover:bg-white/[0.06]` → `hover:bg-accent-blue/[0.06]` (oggi è un bianco neutro, non l'azzurrino già "approvato" da tempo — è la stessa incoerenza vista nella sidebar).
- Riga 150: `isSelected ? 'bg-accent-blue/5' : ''` → `isSelected ? 'bg-accent-blue/10 shadow-[inset_3px_0_0_var(--color-accent-blue)]' : ''` (oggi manca l'indicatore di bordo, la selezione si vede solo dal colore).
- Aggiungere prop `density: 'comfortable' | 'compact'` propagata da `ToolsGrid` (righe 69 e 171 diventano `py-3.5`/`py-2` in base alla prop, default `comfortable`).
- Riga esaurita: verificare che il colore rosa resti sulla cella Qty/Stato e non sull'intera riga (controllo, probabilmente già corretto — verificare in Fase 4 vista per vista).

### 2.4 `src/features/inventory/ToolsGrid.jsx` (§5)
- Aggiungere prop `selectionMode: 'none' | 'toggle' | 'pick'` (oggi è `isSelectionMode` booleano letto da `useFilterStore`) e propagarla a `VirtualizedTable`. Questo è tecnicamente un item della migrazione originale (R3 in `REPORT_FINALE.md`) risultato solo parzialmente completato — verificare prima se `isSelectionMode` è già resettato correttamente da `useNavigationStore.setCurrentView` (dovrebbe esserlo, già in Fase 0) e se sì limitarsi a formalizzare la prop senza toccare la logica di reset.
- Aggiungere un toggle "Comoda/Compatta" nella toolbar interna (§5.2) che imposta la prop `density` di 2.3, visibile solo quando `showDensityToggle` (nuova prop, default `false` — attivarla solo nelle viste dati-intensive, vedi Fase 4).

### 2.5 Audit dimensioni icone (§1.11)
Non è una singola modifica ma una passata di ricerca-e-sostituzione guidata: cercare ogni `size={N}` di `lucide-react` fuori dai 5 valori ammessi (14/16/20/24/32-40) e riportarlo al passo più vicino per ruolo. Rilevati oggi (da non ripetere via grep, sono già catalogati): `size={11,12,13,15,17,22,42}`. File coinvolti (dai conteggi originali): principalmente componenti `features/*` e `common/*` — fare un file alla volta durante la Fase 4 (per vista), non come passata isolata, per evitare un diff enorme senza contesto.

### 2.6 `src/components/ui/dialog.jsx` — nessuna modifica richiesta
`size`, `ModalHeader/Body/Footer` sono già implementati correttamente secondo §6.1/§6.2. Verificare solo, durante la Fase 4, che ogni modale esistente sia stata migrata a questi export invece di avere ancora `!max-w-*` locali residui (controllo, non è chiaro dal solo diff se `OrderModal.jsx`, per esempio, è stato aggiornato).

---

## Fase 3 — Nuovo componente

### 3.1 `src/components/ui/stat-tile.jsx` (§4.5)
Nuovo file. Props: `icon`, `label`, `value`, `delta?: {direction: 'up'|'down'|'flat', text: string}`, `accent: 'blue'|'emerald'|'rose'|'orange'`. Sola lettura (nessun `onClick`/`cursor-pointer` di default). Icona in box `36×36 rounded-[11px]` colorato secondo `accent`. Vedi il prototipo nell'artifact "Rifiniture Design Bercella" per l'anatomia esatta (icona → `app-overline` → `app-qty-lg` + badge delta).

### 3.2 Wrapper `@container` (§1.14)
Non un componente a sé — una convenzione da applicare dove serve: aggiungere la classe `@container` al contenitore diretto di ogni griglia che userà `stat-tile` o le tessere di §1.8, e sostituire `md:grid-cols-N`/`lg:grid-cols-N` con `@sm:grid-cols-N`/`@xl:grid-cols-N` **solo** in quei punti (non nel breakpoint tabella→card di §5, che resta legato al viewport).

---

## Fase 4 — Applicazione per vista

Ordine consigliato: dalla vista più semplice (per validare i componenti di Fase 2-3 con basso rischio) alla più complessa.

1. **Storico movimenti** (`HistoryView.jsx`)
   - Aggiungere riga di `stat-tile` (Totale/Carichi/Scarichi/Da riordinare o equivalenti per questa vista) in cima a `PageContent`, dentro un wrapper `@container` (§4.5, §1.14).
   - Attivare `showDensityToggle` su `ToolsGrid`/tabella (vista dati-intensiva, §5.2).
   - `StateBlock` empty: usare `variant="filtered"` quando ci sono filtri attivi, `variant="generic"` altrimenti (§8.2).
   - Verificare/aggiornare le dimensioni icone (§1.11).

2. **Commesse** (`CommesseView.jsx`)
   - `StateBlock` empty con `variant="generic"` (vuoto genuino: "nessuna commessa") vs `variant="search"` se c'è una ricerca attiva.
   - Verificare hover/selected sulle card commessa se usano una loro implementazione invece di `VirtualizedTable` (§1.13 va applicato lì comunque, come principio generale — stessa tinta, non un componente diverso).

3. **Gestione Operatori** (`OperatorsView.jsx`)
   - Stesso trattamento empty state di Commesse.
   - Verificare icon-button esistenti (righe con icone 14px segnalate nell'audit originale, §1.11: min 16px per icon-button, 14px solo per icone *dentro* testo/badge).

4. **Movimento Multiplo** (`MultiMovementView.jsx`, `useMultiMovementStore.js`)
   - `StateBlock`/riga segnaposto della Distinta: verificare che il loading (se presente al caricamento iniziale) usi lo skeleton di riga (§8.2), non uno spinner a pagina intera — la Distinta è già "griglia immediata" per§5.1, quindi probabilmente non serve un loading state qui, verificare.

5. **Scanner** (`ScannerView.jsx`) ✅
   - Applicare `density`/hover-selected via `ToolsGrid` (eredita da Fase 2, verificato che non vi siano stili locali duplicati). Audit icone conforme (§1.11, Search 20px/32px, Camera 20px/24px, ArrowDown/Up 14px, X 16px).
   - In `BarcodeScanner.jsx`, corretta classe operational copy da `.app-caption` a `.app-body`.

6. **Home / Inventario** (`ToolsGrid.jsx` in modalità Elenco, `CategoryGridCard.jsx`, `DiameterList.jsx`) ✅
   - Griglia tessere categoria/diametro (§1.8): applicato `@container` (§1.14) al contenitore in `App.jsx`, `CategoryGridCard.jsx` e `DiameterList.jsx`.
   - `CategoryGridCard.jsx`: convertito root da `div` a `<button type="button">` accessibile con focus-ring e classi `@container`.
   - `DiameterList.jsx`: audit icone (Search e Clear a 16px), integrato `StateBlock` standard per la ricerca vuota con azzeramento query, hover conforme `hover:bg-accent-blue/[0.06]`.

7. **Modali** (`MovementModal.jsx`, `AddToolModal.jsx`, `OrderModal.jsx`, `AddToolToMultiModal.jsx`)
   - Verificare che tutte usino `ModalHeader/Body/Footer` di `dialog.jsx` (già pronti, Fase 2.6) invece di markup proprio residuo.
   - Griglia campi form multi-colonna (§7): applicare `@container` dove la larghezza del modale (non dello schermo) deve decidere il numero di colonne (§1.14).
   - Icone: audit dimensioni (§1.11).

8. **Login** (`LoginScreen.jsx`) e **Tutorial** (`AppTutorial.jsx`)
   - Solo audit icone (§1.11) e, per il tutorial, verifica `prefers-reduced-motion` sulle animazioni spotlight (§1.12) — nessuna modifica strutturale prevista da questo piano.

---

## Fase 5 — QA e chiusura

1. Eseguire la checklist completa di `DESIGN_SYSTEM.md` §12 (23 voci) su ogni vista toccata nella Fase 4 — non solo le voci nuove (15-23), anche le 1-14 per verificare che nessuna modifica le abbia rotte.
2. Doppio tema (chiaro/scuro) su ogni componente di Fase 2-3, in particolare le nuove ombre (§1.10: lo scuro ha opacità propria, non va desaturato automaticamente) e lo shimmer dello skeleton.
3. Mobile (375-428px): verificare che `@container` (Fase 3.2) non interferisca con la regola tabella→card di §5 (sono due meccanismi diversi, non devono sovrapporsi sullo stesso elemento).
4. `npm run build` e `npm run lint` puliti (checklist §12.14) prima di considerare chiuso ogni singolo file della Fase 4.
5. Rigenerare gli screenshot di regressione con `Miglioramenti UI/tools/cap.mjs` (già riusabile, vedi `Miglioramenti UI/index.md`) per un confronto visivo prima/dopo su almeno le viste di Fase 4.1-4.3, quelle con più modifiche visibili.

---

## Fuori scope per questo piano

Rimandato esplicitamente ad approvazione futura, non eseguire senza nuova conferma:
- Reveal-on-hover per le azioni di riga su viste desktop-only (parcheggiato in §1.13).
- Round 4 di rifiniture (empty/error illustrazioni più elaborate, eventuale sidebar collassabile a icone su tablet, altre idee non ancora discusse).
