import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
export { CollapsibleStatGrid } from './collapsible-stat-grid';

const accentConfig = {
  blue: {
    bg: 'bg-accent-blue/10',
    border: 'border-accent-blue/20',
    icon: 'text-accent-blue'
  },
  emerald: {
    bg: 'bg-accent-emerald/10',
    border: 'border-accent-emerald/20',
    icon: 'text-accent-emerald'
  },
  rose: {
    bg: 'bg-accent-rose/10',
    border: 'border-accent-rose/20',
    icon: 'text-accent-rose'
  },
  orange: {
    bg: 'bg-accent-orange/10',
    border: 'border-accent-orange/20',
    icon: 'text-accent-orange'
  },
  default: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    icon: 'text-slate-500 dark:text-slate-400'
  }
};

const deltaConfig = {
  up: {
    symbol: '▲',
    badge: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20'
  },
  down: {
    symbol: '▼',
    badge: 'bg-accent-rose/10 text-accent-rose border-accent-rose/20'
  },
  flat: {
    symbol: '−',
    badge: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
  }
};

export function StatTile({
  icon,
  label,
  value,
  delta,
  accent,
  tone,
  subtext,
  className
}) {
  const chosenAccent = accent || tone || 'blue';
  const color = accentConfig[chosenAccent] || accentConfig.blue;
  const deltaStyle = delta && deltaConfig[delta.direction]
    ? deltaConfig[delta.direction]
    : deltaConfig.flat;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon;
    return <IconComponent size={16} className={cn("w-4 h-4", color.icon)} />;
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 select-none shadow-xs transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div
          className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-lg border",
            color.bg,
            color.border
          )}
        >
          {renderIcon()}
        </div>
        <div
          className="app-overline text-accent-orange line-clamp-2 leading-snug min-w-0"
          title={typeof label === 'string' ? label : undefined}
        >
          {label}
        </div>
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="app-kpi text-foreground">
            {value}
          </span>
          {delta && delta.text && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold tracking-tight border",
                deltaStyle.badge
              )}
            >
              {deltaStyle.symbol && (
                <span className="text-xs leading-none" aria-hidden="true">
                  {deltaStyle.symbol}
                </span>
              )}
              <span>{delta.text}</span>
            </span>
          )}
        </div>

        {subtext && (
          <p className="text-xs text-muted-foreground line-clamp-2 sm:truncate font-medium tabular-nums" title={typeof subtext === 'string' ? subtext : undefined}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

StatTile.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.elementType, PropTypes.element]).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  delta: PropTypes.shape({
    direction: PropTypes.oneOf(['up', 'down', 'flat']),
    text: PropTypes.string.isRequired
  }),
  accent: PropTypes.oneOf(['blue', 'emerald', 'rose', 'orange', 'default']),
  tone: PropTypes.oneOf(['blue', 'emerald', 'rose', 'orange', 'default']),
  subtext: PropTypes.string,
  className: PropTypes.string
};

export default StatTile;
