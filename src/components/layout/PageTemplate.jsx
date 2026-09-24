import React, { useState, useCallback, useEffect, useRef, Fragment } from 'react';
import { ArrowLeft, ChevronRight, Menu as MenuIcon, X, Filter, Search } from 'lucide-react';
import { Menu } from '@base-ui/react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/icon-button';
import GlobalSearch, { SearchField } from './GlobalSearch';
import { useNavigationStore } from '../../store/useNavigationStore';

export function PageTemplate({ children, className }) {
  return (
    <div className={cn("flex flex-col h-full w-full max-w-[1280px] mx-auto", className)}>
      {children}
    </div>
  );
}

const menuPopupClass = "min-w-[180px] max-h-[min(360px,60dvh)] overflow-y-auto custom-scrollbar p-1 bg-popover/95 backdrop-blur-md rounded-[var(--radius-control,12px)] border shadow-md text-popover-foreground outline-none";
const menuItemClass = "flex min-h-[44px] cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 text-sm font-semibold outline-none transition-colors data-[highlighted]:bg-accent-blue/[0.06] data-[highlighted]:text-accent-blue";

/** Separatore `›` del percorso: se il livello ha figli, apre il menu per saltare a un altro elemento (stile Esplora risorse). */
function CrumbSeparator({ menu, parentLabel }) {
  if (!menu || !menu.items || menu.items.length === 0) {
    return <ChevronRight size={14} className="shrink-0 mx-0.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />;
  }
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Vai a un elemento di ${parentLabel}`}
        className="shrink-0 w-8 h-11 -my-1 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-accent-blue hover:bg-accent-blue/[0.06] data-[popup-open]:text-accent-blue data-[popup-open]:bg-accent-blue/10 data-[popup-open]:[&>svg]:rotate-90 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
      >
        <ChevronRight size={14} className="transition-transform duration-[var(--motion-fast,150ms)]" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start" className="z-[var(--z-dialog)]">
          <Menu.Popup className={menuPopupClass}>
            {menu.items.map((item) => (
              <Menu.Item
                key={item.label}
                onClick={() => menu.onSelect(item.value ?? item.label)}
                className={cn(menuItemClass, item.active && "bg-accent-blue/10 text-accent-blue")}
              >
                <span className="truncate">{item.label}</span>
                {item.count !== undefined && <span className="app-caption text-muted-foreground">{item.count}</span>}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function Crumb({ crumb, isCurrent, className }) {
  const content = (
    <>
      {crumb.icon && <span className="shrink-0 flex">{crumb.icon}</span>}
      <span className="truncate">{crumb.label}</span>
    </>
  );
  const base = cn(
    "flex items-center gap-1.5 h-11 md:h-9 px-2 rounded-lg min-w-0 text-sm whitespace-nowrap",
    isCurrent ? "font-bold text-slate-900 dark:text-white" : "font-semibold text-slate-500 dark:text-slate-400",
    className
  );
  if (crumb.onClick && !isCurrent) {
    return (
      <button
        type="button"
        onClick={crumb.onClick}
        title={crumb.label}
        className={cn(base, "cursor-pointer hover:bg-accent-blue/[0.06] hover:text-accent-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50")}
      >
        {content}
      </button>
    );
  }
  return <span className={base} title={crumb.label} aria-current={isCurrent ? 'page' : undefined}>{content}</span>;
}

/**
 * Percorso navigabile.
 * - Da `md` in su sta in riga con la ricerca. Priorità di spazio (§2.1): il percorso tiene la sua
 *   larghezza naturale, la ricerca prende il resto; quando non c'è spazio la ricerca scende fino a
 *   50px (solo lente) e solo dopo il percorso tronca — prima i livelli intermedi, poi l'ultimo.
 * - Sotto `md` ha una riga tutta sua a larghezza piena: niente troncamento, target 44px, scorre
 *   in orizzontale se serve e si posiziona sempre sull'ultimo livello.
 */
function Breadcrumbs({ crumbs }) {
  const navRef = useRef(null);
  const [isClipped, setIsClipped] = useState(false);
  const last = crumbs.length - 1;
  const pathKey = crumbs.map(c => c.label).join('/');

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    nav.scrollLeft = nav.scrollWidth;
    // sfumatura a sinistra solo quando l'inizio del percorso è fuori vista: dice "scorre", non "tagliato"
    const update = () => setIsClipped(nav.scrollLeft > 1);
    update();
    nav.addEventListener('scroll', update, { passive: true });
    return () => nav.removeEventListener('scroll', update);
  }, [pathKey]);

  return (
    <nav
      ref={navRef}
      aria-label="Percorso"
      className={cn(
        "flex items-center min-w-0 flex-1 md:flex-initial pl-1 max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden",
        isClipped && "max-md:[mask-image:linear-gradient(to_right,transparent,black_24px)]"
      )}
    >
      {crumbs.map((crumb, i) => {
        const isRoot = i === 0;
        const isCurrent = i === last;
        const isMiddle = !isRoot && !isCurrent;
        return (
          <Fragment key={`${crumb.label}-${i}`}>
            <Crumb
              crumb={crumb}
              isCurrent={isCurrent}
              className={cn(
                "max-md:shrink-0",
                isRoot && crumbs.length > 1 && "md:shrink-[2]",
                isMiddle && "md:shrink-[4] md:min-w-[3.5rem]",
                isCurrent && crumbs.length > 1 && "md:shrink md:min-w-[3.5rem]"
              )}
            />
            {!isCurrent && (
              <span className="flex shrink-0">
                <CrumbSeparator menu={crumbs[i + 1]?.siblings ?? crumb.children} parentLabel={crumb.label} />
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

/**
 * AppBar unica di ogni vista (§2, variante "Esplora risorse"):
 * [menu mobile] [indietro] [percorso] [ricerca] [azioni].
 * - `crumbs`: [{ label, icon?, onClick?, siblings?: { items:[{label,value?,active?}], onSelect } }]
 *   `siblings` di un livello alimenta il separatore `›` che lo precede.
 * - Senza `crumbs` il percorso è ricavato da `breadcrumb` (sezione, cliccabile = `onBack`) + `title`.
 * - `crumbsTrailing`: azione subito accessibile in coda al percorso (es. Reset filtri), sotto `lg`.
 * - `search`: la ricerca cerca sempre nel contenuto della vista corrente. Senza `search` la vista
 *   usa la ricerca utensili dell'Inventario (`GlobalSearch`); con `search` = props di `SearchField`.
 */
export function PageHeader({
  title,
  showBack = false,
  onBack,
  breadcrumb,
  crumbs: crumbsProp,
  searchPlaceholder,
  search,
  action,
  crumbsTrailing,
  className
}) {
  const setMobileSidebarOpen = useNavigationStore(state => state.setMobileSidebarOpen);
  // Mobile (< md): la ricerca è una lente; toccandola si apre a tutta barra sopra percorso e azioni
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchHasValue, setSearchHasValue] = useState(false);
  const searchWrapRef = useRef(null);
  const handleSearchState = useCallback(({ hasValue }) => setSearchHasValue(hasValue), []);

  const openMobileSearch = () => {
    setMobileSearchOpen(true);
    requestAnimationFrame(() => searchWrapRef.current?.querySelector('input')?.focus());
  };

  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  const crumbs = crumbsProp && crumbsProp.length > 0
    ? crumbsProp
    // la sezione porta dove porterebbe la freccia indietro: su mobile è l'unica via di ritorno nel percorso
    : [breadcrumb && { label: breadcrumb, onClick: onBack }, { label: title }].filter(Boolean);

  // Su mobile, a ricerca aperta, tutto il resto della barra si nasconde
  const hideOnMobileSearch = mobileSearchOpen && "max-md:hidden";

  return (
    <header className={cn("min-h-[64px] py-2.5 shrink-0 flex items-center gap-2 px-2 sm:px-4 lg:px-8 border-b border-border/50", className)}>
      <h1 className="sr-only">{title}</h1>
      <IconButton
        icon={<MenuIcon size={20} />}
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Apri menu"
        variant="ghost"
        className={cn("md:hidden text-accent-blue", hideOnMobileSearch)}
      />
      {showBack && (
        <IconButton
          icon={<ArrowLeft size={16} />}
          onClick={handleBack}
          aria-label="Indietro"
          variant="outline"
          // Sotto `md` il percorso fa già da navigazione: la freccia sarebbe ridondante
          className="max-md:hidden glass-button border-slate-900/10 dark:border-white/10"
        />
      )}

      {/* Percorso: da md tiene la larghezza naturale; su mobile prende lo spazio libero e scorre di lato */}
      <div className={cn("flex items-center min-w-0 max-md:flex-1 md:shrink h-11 pr-1 gap-1 rounded-[var(--radius-control,12px)] border border-slate-900/10 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 shadow-sm", hideOnMobileSearch)}>
        <Breadcrumbs crumbs={crumbs} />
        {crumbsTrailing && <div className="lg:hidden shrink-0 flex items-center">{crumbsTrailing}</div>}
      </div>

      {/* Mobile, ricerca chiusa: solo la lente (con pallino se c'è una ricerca attiva) */}
      {!mobileSearchOpen && (
        <button
          type="button"
          onClick={openMobileSearch}
          aria-label={searchHasValue ? 'Modifica la ricerca attiva' : 'Cerca'}
          className="md:hidden relative shrink-0 w-11 h-11 flex items-center justify-center rounded-[var(--radius-control,12px)] border border-slate-900/10 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 shadow-sm text-slate-500 dark:text-slate-400 active:bg-accent-blue/[0.14]"
        >
          <Search size={18} />
          {searchHasValue && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-blue" aria-hidden="true" />}
        </button>
      )}

      {/* Ricerca: da md sempre visibile (min 50px, il percorso cede spazio dopo); su mobile solo se aperta */}
      <div ref={searchWrapRef} className={cn("contents", !mobileSearchOpen && "max-md:hidden")}>
        {search
          ? <SearchField {...search} autoFocus={search.autoFocus} onActiveChange={handleSearchState} />
          : <GlobalSearch placeholder={searchPlaceholder} onActiveChange={handleSearchState} />}
      </div>
      {mobileSearchOpen && (
        <IconButton
          icon={<X size={18} />}
          onClick={() => setMobileSearchOpen(false)}
          aria-label="Chiudi ricerca"
          variant="ghost"
          className="md:hidden"
        />
      )}

      {action && (
        <div className={cn("flex items-center gap-2 shrink-0", hideOnMobileSearch)}>
          {action}
        </div>
      )}
    </header>
  );
}

/**
 * "Reset filtri" (§2.2, glossario §9): stesso bottone rosa in ogni vista.
 * - `placement="trailing"`: in coda al percorso (`crumbsTrailing`), visibile sotto `lg` — su mobile è
 *   sempre a portata senza aprire menu o filtri.
 * - `placement="bar"`: tra le azioni della barra, visibile da `lg` in su.
 * Si mostra solo quando c'è qualcosa da azzerare.
 */
export function ResetFiltersButton({ onClick, placement = 'bar', count }) {
  if (placement === 'trailing') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Reset filtri"
        className="h-[42px] min-w-[44px] flex items-center justify-center gap-1.5 px-2.5 sm:pr-3 rounded-r-[var(--radius-control,12px)] text-accent-rose hover:bg-accent-rose/10 active:bg-accent-rose/15 text-xs font-black uppercase tracking-wider whitespace-nowrap border-l border-slate-900/10 dark:border-white/10 transition-colors"
      >
        <X size={16} /> <span className="max-sm:sr-only">Reset</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden lg:flex h-11 items-center gap-1.5 px-3.5 rounded-[var(--radius-control,12px)] glass-button border border-accent-rose/25 text-accent-rose hover:bg-accent-rose/10 text-xs font-black uppercase tracking-wider whitespace-nowrap transition-colors"
    >
      <X size={14} /> Reset filtri{count ? ` (${count})` : ''}
    </button>
  );
}

/**
 * Su mobile i filtri non si impilano mai prima dei dati (§4.4): stanno dietro questo interruttore.
 * Da `md` in su è nascosto e i filtri sono sempre visibili.
 */
export function MobileFiltersToggle({ open, onToggle, count = 0, className }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={cn("md:hidden w-full h-11 flex items-center justify-center gap-1.5 glass-button px-3 rounded-xl app-overline text-accent-blue", className)}
    >
      <Filter size={14} className="shrink-0" />
      <span className="truncate">{open ? 'Nascondi filtri' : 'Mostra filtri'}</span>
      {count > 0 && <span className="bg-accent-blue text-slate-950 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 font-black tracking-normal">{count}</span>}
    </button>
  );
}

export function PageToolbar({ children, className }) {
  if (!children) return null;
  return (
    <div className={cn("min-h-[44px] h-auto py-1.5 shrink-0 flex items-center gap-3 px-4 lg:px-8 border-b border-border/50 bg-background/50 backdrop-blur-sm z-[var(--z-sticky)] sticky top-0", className)}>
      {children}
    </div>
  );
}

export function PageContent({ children, className }) {
  return (
    <div className={cn("flex-1 min-h-0 overflow-y-auto p-2 pb-8 sm:p-4 sm:pb-12 md:p-6 md:pb-16 lg:p-8 lg:pb-24 custom-scrollbar", className)}>
      {children}
    </div>
  );
}

export function PageFooter({ children, className }) {
  if (!children) return null;
  return (
    <div className={cn("min-h-[72px] h-auto py-3 shrink-0 sticky bottom-0 z-[var(--z-sticky)] bg-background/80 backdrop-blur-md border-t border-border/50 flex items-center justify-end px-4 lg:px-8 gap-3", className)}>
      {children}
    </div>
  );
}
