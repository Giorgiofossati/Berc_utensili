---
name: Bercella Utensili — Industrial Precision
colors:
  canvas: '#f8fafc'
  surface: '#ffffff'
  surface-dim: '#f1f5f9'
  surface-glass: rgba(255, 255, 255, 0.70)
  surface-sunken: '#f1f5f9'
  border: '#e2e8f0'
  border-whisper: rgba(0, 0, 0, 0.08)
  ink: '#0f172a'
  ink-secondary: '#475569'
  ink-muted: '#64748b'
  primary: '#0ea5e9'
  on-primary: '#0f172a'
  primary-container: '#e0f2fe'
  on-primary-container: '#075985'
  accent-tint: rgba(14, 165, 233, 0.10)
  signal-deposit: '#10b981'
  on-signal-deposit: '#ffffff'
  signal-withdraw: '#f43f5e'
  on-signal-withdraw: '#ffffff'
  signal-alert: '#f97316'
  on-signal-alert: '#ffffff'
  signal-scanner: '#06b6d4'
  on-signal-scanner: '#0f172a'
  dark-canvas: '#020617'
  dark-surface: '#0f172a'
  dark-surface-raised: '#1e293b'
  dark-surface-glass: rgba(15, 23, 42, 0.40)
  dark-border: '#1e293b'
  dark-border-strong: '#334155'
  dark-ink: '#f8fafc'
  dark-ink-secondary: '#94a3b8'
typography:
  overline:
    fontFamily: Geist
    fontSize: 10px
    fontWeight: '900'
    lineHeight: 14px
    letterSpacing: 0.25em
    textTransform: uppercase
  h1:
    fontFamily: Geist
    fontSize: clamp(1.25rem, 1rem + 1.2vw, 1.875rem)
    fontWeight: '900'
    lineHeight: '1.2'
    letterSpacing: -0.025em
    textTransform: uppercase
  h2:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '900'
    lineHeight: 28px
    letterSpacing: -0.025em
    textTransform: uppercase
  h3:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: -0.01em
  body:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: '0'
  label:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
    textTransform: uppercase
  caption:
    fontFamily: monospace
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: '0'
  qty-sm:
    fontFamily: monospace
    fontSize: 14px
    fontWeight: '900'
    lineHeight: 18px
    fontVariantNumeric: tabular-nums
  qty-lg:
    fontFamily: monospace
    fontSize: 28px
    fontWeight: '900'
    lineHeight: 32px
    fontVariantNumeric: tabular-nums
  kpi:
    fontFamily: monospace
    fontSize: 24px
    fontWeight: '900'
    lineHeight: 24px
    fontVariantNumeric: tabular-nums
rounded:
  tag: 6px
  control: 12px
  card: 16px
  icon-box: 18px
  panel: 24px
  modal: 32px
  full: 9999px
spacing:
  unit: 4px
  space-xs: 4px
  space-sm: 8px
  space-md: 12px
  space-lg: 16px
  space-xl: 24px
  space-2xl: 32px
  space-3xl: 48px
  touch-min: 44px
  sidebar-width: 248px
  max-width: 1280px
  max-width-wide: 1600px
---

## Brand & Style

This design system is engineered specifically for high-precision manufacturing shop floors, tooling storage towers, and automated CNC workshop management. The visual atmosphere fuses aerospace engineering clarity with industrial reliability: ultra-crisp contrasts, zero ornamental distraction, absolute functional clarity, and instant operational recognition under difficult shop-floor lighting conditions (glare, reflections, and oil-resistant touchscreen tablets).

The design ethos balances:
- **Utilitarian Precision:** Every pixel, edge, and numerical readout reflects mechanical tolerance standards. Surfaces are matte cool slate (`#f8fafc` light / `#020617` dark) with single-layer glassmorphism (`.glass-panel`) and crisp 1px hairlines.
- **Immediate State Visibility:** Color operates strictly as an unambiguous functional trigger (deposit, withdraw, scanner, alert). Chromatic hues are never decorative.
- **Physical-Touch Ergonomics:** High touch tolerances (minimum **44×44px** hit targets, `min-h-[44px] min-w-[44px]`) built for operators using work gloves on workshop terminals.
- **App-Like Single-Screen Layout:** Root `#root` locked at `100dvh` with `overflow-hidden`. Scrolling is strictly delegated to inner data containers (`PageContent` via `overflow-y-auto` with safe bottom padding `pb-24` or `pb-28`). Zero horizontal scroll across all viewports.
- **Absolute Chromatic Discipline:** Indigo, purple, violet, and pure black (`#000000`) are strictly **BANNED**.

## Colors

The color system enforces strict semantic meaning to eliminate operator error during critical machining and tool inventory workflows. Every accent has a fixed background/text pair declared in `@theme` of `src/index.css`.

### Semantic Palette & Roles
- **Primary Interactive (`#0ea5e9` - Blu Tecnico):** System commands, active navigation states, focus rings, selected rows, and primary actions. Text on Blu Tecnico is strictly deep slate `#0f172a` (Slate 900) to pass WCAG AA contrast (white text fails at 2.77:1).
- **Deposit Operation (`#10b981` - Verde Smeraldo):** "Deposita" action (`.action-btn-carica`), in-stock status, normal operating tolerances, available tools. Pair strictly with `#ffffff` text.
- **Withdrawal Operation (`#f43f5e` - Rosa Rubino):** "Preleva" action (`.action-btn-scarica`), depleted/out-of-stock notification (0 pz), destructive actions. Pair strictly with `#ffffff` text.
- **Industrial Alert (`#f97316` - Arancione Industriale):** Exclusively reserved for stock reorder thresholds, inventory warnings, and tool wear advisories (`.action-btn-order`). NEVER used as a general accent, location badge, or role indicator. Pair strictly with `#ffffff` text.
- **Barcode & Optical Data (`#06b6d4` - Ciano Ottico):** Exclusively designated for hardware scanner triggers, barcode/QR visual frames, and camera optical targeting. Pair strictly with deep slate `#0f172a` text.
- **Neutral Foundations:**
  - *Light Theme (default):* Canvas `#f8fafc` (Slate 50), Surface `#ffffff`, Glass `rgba(255,255,255,0.70)`, Border `#e2e8f0`, Text `#0f172a`, Muted `#64748b`.
  - *Dark Theme (`.dark`):* Canvas `#020617` (Slate 950), Surface `#0f172a`, Glass `rgba(15,23,42,0.40)`, Border `#1e293b`, Text `#f8fafc`, Secondary `#94a3b8`.

## Typography

Typography is engineered for extreme legibility under industrial conditions. **Geist** (`--font-geist`) provides structured, neutral letterforms for all prose, labels, and headings, while monospace with **`tabular-nums`** is strictly enforced for all tool codes, SKU identifiers, timestamps, drawer locations, and quantities.

### Semantic Utility Classes (`src/index.css`)
Arbitrary font classes (`text-5xl`, `text-[13px]`) are prohibited. Use only the `.app-*` typography scale:
- `.app-overline`: `text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]` — Section micro-marker, **ALWAYS orange** (`#f97316`), never other colors.
- `.app-h1`: `text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight` — Single page title in `PageHeader`.
- `.app-h2`: `text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight` — Modal or macro-card title.
- `.app-h3`: `text-xs sm:text-sm font-bold tracking-tight` — Row/item title. **Sentence case only** (never uppercase on catalog or dynamic user data).
- `.app-body`: `text-xs sm:text-sm font-medium leading-relaxed` — Standard prose, instructions, notes.
- `.app-caption`: `text-[10px] sm:text-xs font-semibold font-mono` — Codes, SKU, drawer positions, timestamps. **NEVER for conversational sentences**.
- `.app-label`: `text-[11px] sm:text-xs font-bold uppercase tracking-wider` — Form field labels (minimum 11px).
- `.app-qty-sm`: `text-xs sm:text-sm md:text-base font-black tabular-nums` — Table row quantity indicator.
- `.app-qty-lg`: `text-2xl sm:text-3xl md:text-4xl font-black tabular-nums` — Prominent stock readout / hero metric.
- `.app-kpi`: `text-xl sm:text-2xl font-black tabular-nums font-mono leading-none whitespace-nowrap` — Value of a `StatTile` (amounts, counts). No negative tracking on mono.

*Font Loading Rule:* Every weight used with a family must be loaded in `index.html` (Geist and Geist Mono: 400–900). A missing weight makes the browser synthesize a fake bold (smeared, wider glyphs) — e.g. `font-black font-mono` without Geist Mono 900.

### Number & Currency Formatting
- Always use `formatItalianNumber` / `formatItalianCurrency` from `@/lib/utils`. Never `toLocaleString`, `Intl.NumberFormat` or hand-built strings.
- Thousands separator = `THOUSANDS_SEPARATOR` (thin space U+2009 + word joiner U+2060), decimals = comma, currency suffix `€` after the same thin space: `398 910,42 €`.
- Why not a normal space: in Geist Mono every space is as wide as a digit, so `398 910` looks like two separate numbers. The thin space is 0.2em in both Geist and Geist Mono; the word joiner prevents line breaks inside a number.
- Charts: labels round to the euro (`formatItalianCurrency(v, 0)`); tooltips and tables keep 2 decimals.

*Casing Rule:* UPPERCASE is reserved strictly for short fixed labels (`.app-overline`, `.badge`, `.action-btn-*`, `.app-label`). Dynamic data (tool descriptions, job codes, operator names) MUST remain in sentence case to prevent truncation and visual fatigue.

## Layout & Spacing

The layout model is anchored in an operational structured grid with a 4px base rhythm (`4, 8, 12, 16, 24, 32, 48px`).

- **Application Shell:** Single-screen `100dvh` architecture. Main viewport capped at 1280px (expanding to 1600px for dense matrices). Only `PageContent` scrolls; navigation and toolbars remain firmly anchored.
- **Desktop (≥1024px):** Fixed 248px sidebar (`SidebarProvider`), top bar with breadcrumb path and scoped search, and dense virtualized data grids.
- **Mobile (<768px):** Collapses into a single-column layout. Tables transform into structured cards. Zero horizontal overflow. Sticky action buttons or command bars maintain thumb reachability (`command-bar-container`).
- **Touch Target Rule (Fitts's Law):** Every interactive target (buttons, toggles, steppers, table triggers, icon buttons) must maintain an inviolable minimum interactive hit envelope of **44×44px** (`min-h-[44px] min-w-[44px]`).
- **Container Queries:** For modular cards and dialog fields, use `@container` (`@sm:grid-cols-2 @xl:grid-cols-4`) rather than viewport-based breakpoints.
- **Scroll Container Safe Padding:** Content areas use `p-2 pb-8` (`pb-24` or `pb-28` when bottom action bars exist) to avoid clipping focus rings, outlines, or bottom buttons. Centered content in scrolling boxes must use `justify-center-safe` to prevent top-edge clipping.

## Elevation & Depth

Visual hierarchy relies on **Tonal Layering**, crisp 1px borders, and calibrated diffuse shadows rather than heavy drop shadows:
- **Floor 0 (Inline/Resting):** Pure surfaces divided by 1px hairlines (`#e2e8f0` light / `#1e293b` dark).
- **Floor 1 (Sticky Chrome & Panels):** `.glass-panel` with `backdrop-blur-2xl`, `--shadow-1` (`0 8px 24px rgba(15,23,42,.06)`), `--z-sticky: 10`.
- **Floor 2 (Dropdowns & Sheets):** `--shadow-2` (`0 16px 40px rgba(15,23,42,.12)`), `--z-drawer: 40`.
- **Floor 3 (Modals & Overlays):** Standard dialogs with `--shadow-3` (`0 28px 64px rgba(15,23,42,.20)`), `--z-dialog: 50`.
- **Floor 4 (Toasts & Guides):** Global alerts with `--shadow-4`, `--z-toast: 70`, `--z-tour: 80`.
- **Glassmorphism Rule ("Box-in-a-Box" BANNED):** Never nest a `.glass-panel` inside another `.glass-panel`. Internal regions are separated using 1px dividers or subtle surface tints (`surface-dim`).

## Shapes

A strict geometric hierarchy governs corner radii based on container size and touch encapsulation:
- **Tags & Status Badges (`--radius-tag: 6px`):** Fixed 6px radius for compact status pills and metadata chips.
- **Controls & Form Inputs (`--radius-control: 12px`):** Fixed 12px radius for buttons, text fields, select triggers, and filter chips.
- **Cards & Category Tiles (`--radius-card: 16px`):** Fixed 16px radius for distinct tooling tiles and metric bays.
- **Box Header & Tile Icons (`--radius-icon-box: 18px`):** Fixed 18px radius for icon boxes in modal headers and stat tiles.
- **Panels & Toolbars (`--radius-panel: 24px`):** Fixed 24px radius for floating toolbars, list rows, and structural panels.
- **Modal Dialogs (`--radius-modal: 32px`):** Fixed 32px radius for dialog windows, sheet containers, and login card.

## Components

All components must adhere strictly to design tokens, density requirements, and touch ergonomics:

### Action Buttons
- Macro operation buttons: `.action-btn-carica` (Verde `#10b981`), `.action-btn-scarica` (Rosa `#f43f5e`), `.action-btn-primary` (Blu `#0ea5e9` con testo `#0f172a`), `.action-btn-order` (Arancione `#f97316`).
- Always `min-h-[44px]`, `whitespace-nowrap font-black tracking-wider`. No text wrapping.
- Action hierarchy: Exactly ONE primary button per view/dialog. Destructive actions live in secondary style or inside the `⋮` overflow menu.

### Badges & Status Pills
- Fixed format: `px-3.5 py-1 rounded-full text-[11px] font-black uppercase inline-flex items-center justify-center`.
- `.badge-emerald`: Giacenza > 0, Disponibile, Nuovo.
- `.badge-rose`: Giacenza = 0, Esaurito, Preleva.
- `.badge-blue`: Codice aziendale, fornitore, Ubicazione (con icona `MapPin` 12px).
- `.badge-orange`: **SOLO** alert scorte / "Da ordinare".

### PageTemplate & PageHeader
- `PageHeader` (AppBar 64px): Single unified bar with breadcrumb path + scoped search field (`min-w-[50px]`, expandable on mobile) + view actions.
- Any flex container that wraps or truncates requires **`min-w-0` at every level of the flex tree**.
- Mobile: Single line `☰` · path · lens · actions. Reset button sits trailing inside the path box when filters are active.

### Data Tables (TanStack Table v8)
- Unified component: `<ToolsGrid hideExtraFilters={true} />`. Virtualized rows with sticky header.
- Row heights: Compact 44px (default, `py-2`), Comfortable 56px (`py-3.5`).
- Mobile (<768px): Commutes to structured cards showing icon, description (`.app-h3`), and quantity (`.app-qty-sm`). Details open on click.
- Distinta (Movimento Multiplo): Table ready on frame 1 without passive empty state. Extended catalog picker uses `size="xl"` dialog.

### Modal Dialogs (shadcn / Radix)
- 4 Standard Tiers:
  - `sm` (`max-w-md` / 448px): Confirmations & destructive alerts (2 buttons).
  - `md` (`max-w-2xl md:max-w-3xl` / 640-768px): Operational forms, jobs, configuration.
  - `lg` (`max-w-3xl md:max-w-4xl` / 768-896px): Tool technical details, multi-step wizards.
  - `xl` (`max-w-6xl md:max-w-7xl`, `h-[88dvh]`): Fullscreen catalog picker.
- Header: Always `showCloseButton={false}` on `DialogContent`. Close 'X' button is placed inside the flex header aligned with title and icon.
- Mobile bounds: `DialogContent` uses `max-h-[calc(100dvh-2rem)] flex flex-col`. `ModalHeader`/`ModalFooter` are `shrink-0`, `ModalBody` is `flex-1 min-h-0 overflow-y-auto`. Detail modals must fit without inner scroll (`overflow-hidden`).

### Guided Action Flows
- Questions in natural language ("Su quale macchina va?") with numbered `GuidedStep` circles turning to green checks.
- `DirectionStrip`: "Prendi da [Ubicazione] → Porta a [Macchina]".
- `QuantityStepper`: 44px −/+ steppers with numeric input.
- `ChoiceChip`: 3-5 high-probability chips (`min-h-11`) + "Altro...".
- Confirmation triggers immediate modal close and a `Toast` with an **Annulla** action for 8 seconds.

### Feedback & States (`StateBlock`)
- Every async view implements: `loading` (geometry-matching skeleton shimmer), `empty` (cause-specific with next action CTA), `error` (clear human message with retry button), `success` (data).

## Negative Rules & Anti-Patterns (Banned)

- ❌ **NO Indigo / Purple / Violet:** Replaced strictly by Blu Tecnico (`#0ea5e9`), Ciano (`#06b6d4`), and Arancione (`#f97316`).
- ❌ **NO Pure Black (`#000000`):** Use Slate-950 (`#020617`) or Slate-900 (`#0f172a`).
- ❌ **NO Touch Targets < 44×44px:** All buttons, toggles, and icon triggers must meet `min-h-[44px] min-w-[44px]`.
- ❌ **NO `.app-caption` for Prose:** Monospace caption is strictly for codes, SKU, coordinates, and timestamps.
- ❌ **NO Uppercase Dynamic Data:** Descriptions, job notes, and operator names must use sentence case to prevent truncations.
- ❌ **NO Nested Glass Panels:** Never wrap a `.glass-panel` inside another `.glass-panel`.
- ❌ **NO Arbitrary Typography:** Do not use `text-5xl` or `text-[13px]`; use semantic `.app-*` classes only.
- ❌ **NO Horizontal Page Scroll:** Mobile viewports must stay locked within `100dvh` single-column bounds.
- ❌ **NO Fabricated Metrics:** Never invent uptime or mock statistics; use clear `[metric]` placeholders.
- ❌ **NO Normal Space as Thousands Separator:** Use the shared formatters (thin space); never `toLocaleString('it-IT')` (dot separator) or `' '`.
- ❌ **NO Unreadable Chart Labels:** SVG chart labels need a halo (`paint-order: stroke`, stroke = surface color), must not overlap (hide on collision, keep data in tooltip) and flows under ~2.5% of total are aggregated into an "Altre …" node.
- ❌ **NO Blind Lint Faith:** Always verify component imports manually (ESLint does not catch JSX `ReferenceError`).
