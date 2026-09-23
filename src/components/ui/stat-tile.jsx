import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

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
  accent = 'blue',
  className
}) {
  const color = accentConfig[accent] || accentConfig.blue;
  const deltaStyle = delta && deltaConfig[delta.direction]
    ? deltaConfig[delta.direction]
    : deltaConfig.flat;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon;
    return <IconComponent size={24} className={cn("w-6 h-6", color.icon)} />;
  };

  return (
    <div
      className={cn(
        "flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 select-none",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "w-[36px] h-[36px] shrink-0 flex items-center justify-center rounded-[11px] border",
            color.bg,
            color.border
          )}
        >
          {renderIcon()}
        </div>
        <div
          className="app-overline text-accent-orange truncate min-w-0"
          title={typeof label === 'string' ? label : undefined}
        >
          {label}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mt-3 flex-wrap">
        <span className="app-qty-lg text-foreground">{value}</span>
        {delta && delta.text && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold tracking-tight border",
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
  accent: PropTypes.oneOf(['blue', 'emerald', 'rose', 'orange']),
  className: PropTypes.string
};

export default StatTile;
