import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CollapsibleStatGrid
 * 
 * Container per schede statistiche e KPI.
 * - Su mobile (< md): Collassabile, default CHIUSO per azzerare l'ingombro verticale.
 *   Fornisce una barra/toggle compatta per espandere/comprimere al tocco.
 * - Su desktop (>= md): Sempre aperto, compatto e integrato orizzontalmente.
 */
export function CollapsibleStatGrid({
  children,
  title = "Statistiche e KPI",
  icon = BarChart2,
  count,
  gridClassName = "grid-cols-2 md:grid-cols-4",
  className,
  defaultOpenMobile = false
}) {
  const [isOpenMobile, setIsOpenMobile] = useState(defaultOpenMobile);

  const effectiveCount = count !== undefined 
    ? count 
    : React.Children.count(children);

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon;
    return <IconComponent size={14} />;
  };

  return (
    <div className={cn("w-full shrink-0", className)}>
      {/* Mobile Accordion Trigger (< md) */}
      <button
        type="button"
        onClick={() => setIsOpenMobile(prev => !prev)}
        aria-expanded={isOpenMobile}
        aria-label={`${isOpenMobile ? 'Nascondi' : 'Mostra'} ${title}`}
        className="md:hidden w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/80 active:scale-[0.99] cursor-pointer min-h-[40px]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded-md bg-accent-blue/10 text-accent-blue shrink-0">
            {renderIcon()}
          </span>
          <span className="truncate">{title}</span>
          {effectiveCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {effectiveCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-medium">
          <span>{isOpenMobile ? "Nascondi" : "Mostra"}</span>
          <ChevronDown
            size={14}
            className={cn("transition-transform duration-200", isOpenMobile && "rotate-180")}
          />
        </div>
      </button>

      {/* Grid Content: Conditional on mobile (< md), always block on desktop (>= md) */}
      <div
        className={cn(
          "transition-all duration-200",
          isOpenMobile ? "block mt-2" : "hidden",
          "md:block md:mt-0"
        )}
      >
        <div className={cn("grid gap-2 sm:gap-3 items-stretch", gridClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}

CollapsibleStatGrid.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.elementType, PropTypes.element]),
  count: PropTypes.number,
  gridClassName: PropTypes.string,
  className: PropTypes.string,
  defaultOpenMobile: PropTypes.bool
};

export default CollapsibleStatGrid;
