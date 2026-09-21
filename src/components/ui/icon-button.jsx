import React from 'react';
import { cn } from '@/lib/utils';
import { Menu } from '@base-ui/react';
import { MoreVertical } from 'lucide-react';
import PropTypes from 'prop-types';

export const IconButton = React.forwardRef(({ 
  icon, 
  variant = 'ghost', 
  className, 
  'aria-label': ariaLabel,
  ...props 
}, ref) => {
  const variants = {
    ghost: 'hover:bg-accent hover:text-accent-foreground text-foreground',
    glass: 'glass-button text-foreground',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground bg-background text-foreground',
  };

  return (
    <button
      ref={ref}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[var(--radius-control,12px)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
});

IconButton.displayName = 'IconButton';
IconButton.propTypes = {
  'aria-label': PropTypes.string.isRequired,
};

export function IconMenu({ items, ariaLabel = "Azioni aggiuntive", className }) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label={ariaLabel} className={cn(
        'inline-flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[var(--radius-control,12px)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground text-foreground',
        className
      )}>
        <MoreVertical className="w-5 h-5" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end" className="z-[var(--z-dialog)]">
          <Menu.Popup className="min-w-[180px] p-1 bg-popover/95 backdrop-blur-md rounded-[var(--radius-control,12px)] border shadow-md text-popover-foreground outline-none animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
            {items.map((item, i) => {
              if (item.type === 'separator') {
                return <Menu.Separator key={`sep-${i}`} className="-mx-1 my-1 h-px bg-border" />;
              }
              return (
                <Menu.Item
                  key={i}
                  onSelect={item.onClick}
                  disabled={item.disabled}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    item.destructive && "text-accent-rose focus:text-accent-rose focus:bg-accent-rose/10"
                  )}
                >
                  {item.icon && <span className="mr-2 h-4 w-4">{item.icon}</span>}
                  {item.label}
                </Menu.Item>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
