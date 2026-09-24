import React, { useState, useCallback, Fragment } from 'react';
import { ArrowLeft, ChevronRight, Menu as MenuIcon, MoreHorizontal } from 'lucide-react';
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

function Crumb({ crumb, isCurrent, isRoot, className }) {
  const content = (
    <>
      {crumb.icon && <span className="shrink-0 flex">{crumb.icon}</span>}
      <span className={cn("truncate", isRoot && crumb.icon && "max-sm:sr-only")}>{crumb.label}</span>
    </>
  );
  const base = cn(
    "flex items-center gap-1.5 h-9 px-2 rounded-lg min-w-0 text-sm whitespace-nowrap",
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

/** Su mobile i livelli intermedi collassano in un "…" che apre l'elenco completo. */
function CollapsedCrumbs({ crumbs }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Mostra il percorso completo"
        className="md:hidden shrink-0 h-9 px-2 rounded-lg flex items-center text-slate-500 hover:text-accent-blue hover:bg-accent-blue/[0.06] cursor-pointer"
      >
        <MoreHorizontal size={16} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start" className="z-[var(--z-dialog)]">
          <Menu.Popup className={menuPopupClass}>
            {crumbs.map((c, i) => (
              <Menu.Item key={`${c.label}-${i}`} onClick={() => c.onClick?.()} disabled={!c.onClick} className={menuItemClass}>
                <span className="truncate">{c.label}</span>
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/**
 * Percorso navigabile. Priorità di spazio (§2): il percorso tiene la sua larghezza naturale,
 * la ricerca prende il resto; quando non c'è spazio la ricerca scende fino a 50px (solo lente)
 * e solo dopo il percorso inizia a troncare — prima i livelli intermedi, poi l'ultimo.
 */
function Breadcrumbs({ crumbs }) {
  const last = crumbs.length - 1;
  const middle = crumbs.slice(1, last);
  return (
    <nav aria-label="Percorso" className="flex items-center min-w-0 shrink pl-1">
      {crumbs.map((crumb, i) => {
        const isRoot = i === 0;
        const isCurrent = i === last;
        const isMiddle = !isRoot && !isCurrent;
        return (
          <Fragment key={`${crumb.label}-${i}`}>
            {i === 1 && middle.length > 0 && <CollapsedCrumbs crumbs={middle} />}
            {i === 1 && middle.length > 0 && <ChevronRight size={14} className="md:hidden shrink-0 mx-0.5 text-slate-400" aria-hidden="true" />}
            <Crumb
              crumb={crumb}
              isRoot={isRoot}
              isCurrent={isCurrent}
              className={cn(
                isRoot && crumbs.length > 1 && "shrink-[2]",
                isMiddle && "max-md:hidden shrink-[4] min-w-[3.5rem]",
                isCurrent && crumbs.length > 1 && "shrink min-w-[3.5rem]"
              )}
            />
            {!isCurrent && (
              <span className={cn("flex shrink-0", isMiddle && "max-md:hidden", isRoot && middle.length > 0 && "max-md:hidden")}>
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
 * - Senza `crumbs` il percorso è ricavato da `breadcrumb` (sezione, non cliccabile) + `title`.
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
  className
}) {
  const setMobileSidebarOpen = useNavigationStore(state => state.setMobileSidebarOpen);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const handleSearchActive = useCallback((active) => setIsSearchActive(active), []);

  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  const crumbs = crumbsProp && crumbsProp.length > 0
    ? crumbsProp
    : [breadcrumb && { label: breadcrumb }, { label: title }].filter(Boolean);

  return (
    <header className={cn("min-h-[64px] py-2.5 shrink-0 flex items-center gap-2 px-2 sm:px-4 lg:px-8 border-b border-border/50", className)}>
      <h1 className="sr-only">{title}</h1>
      <IconButton
        icon={<MenuIcon size={20} />}
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Apri menu"
        variant="ghost"
        className="md:hidden text-accent-blue"
      />
      {showBack && (
        <IconButton
          icon={<ArrowLeft size={16} />}
          onClick={handleBack}
          aria-label="Indietro"
          variant="outline"
          className={cn("glass-button border-slate-900/10 dark:border-white/10", isSearchActive && "max-md:hidden")}
        />
      )}

      {/* Percorso: tiene la larghezza naturale, tronca solo quando la ricerca è già a 50px */}
      <div className={cn("flex items-center min-w-0 shrink h-11 pr-1 rounded-[var(--radius-control,12px)] border border-slate-900/10 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 shadow-sm", isSearchActive && "max-md:hidden")}>
        <Breadcrumbs crumbs={crumbs} />
      </div>

      {/* Ricerca: prende lo spazio che avanza, minimo 50px (lente sempre visibile) */}
      {search
        ? <SearchField {...search} onActiveChange={handleSearchActive} />
        : <GlobalSearch placeholder={searchPlaceholder} onActiveChange={handleSearchActive} />}

      {action && (
        <div className={cn("flex items-center gap-2 shrink-0", isSearchActive && "max-md:hidden")}>
          {action}
        </div>
      )}
    </header>
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
