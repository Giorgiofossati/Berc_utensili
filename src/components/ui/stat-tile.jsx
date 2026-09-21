import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const accentConfig = {
  blue: {
    bg: 'bg-accent-blue/10',
    border: 'border-accent-blue/20',
    text: 'text-accent-blue-foreground',
    icon: 'text-accent-blue'
  },
  emerald: {
    bg: 'bg-accent-emerald/10',
    border: 'border-accent-emerald/20',
    text: 'text-accent-emerald-foreground',
    icon: 'text-accent-emerald'
  },
  rose: {
    bg: 'bg-accent-rose/10',
    border: 'border-accent-rose/20',
    text: 'text-accent-rose-foreground',
    icon: 'text-accent-rose'
  },
  orange: {
    bg: 'bg-accent-orange/10',
    border: 'border-accent-orange/20',
    text: 'text-accent-orange-foreground',
    icon: 'text-accent-orange'
  }
};

const deltaConfig = {
  up: {
    icon: '▲',
    color: 'text-accent-emerald'
  },
  down: {
    icon: '▼',
    color: 'text-accent-rose'
  },
  flat: {
    icon: '−',
    color: 'text-slate-500'
  }
};

export function StatTile({ icon, label, value, delta, accent = 'blue', className }) {
  const Icon = icon;
  const color = accentConfig[accent] || accentConfig.blue;

  return (
    <div className={cn("flex flex-col p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl", className)}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-9 h-9 flex items-center justify-center rounded-xl border", color.bg, color.border)}>
          <Icon size={24} className={color.icon} />
        </div>
        <div className="app-overline text-accent-orange">{label}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="app-qty-lg">{value}</div>
        {delta && (
          <div className={cn("text-xs font-bold flex items-center gap-1", deltaConfig[delta.direction]?.color)}>
            <span>{deltaConfig[delta.direction]?.icon}</span>
            <span>{delta.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
