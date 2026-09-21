import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/icon-button';

export function PageTemplate({ children, className }) {
  return (
    <div className={cn("flex flex-col h-full w-full max-w-[1280px] mx-auto", className)}>
      {children}
    </div>
  );
}

export function PageHeader({ 
  title, 
  showBack = false, 
  onBack, 
  breadcrumb,
  action 
}) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-[64px] h-auto py-2 shrink-0 flex items-center justify-between px-4 lg:px-8 border-b border-border/50">
      <div className="flex items-center gap-4">
        {showBack && (
          <IconButton
            icon={<ArrowLeft className="w-5 h-5" />}
            onClick={handleBack}
            aria-label="Indietro"
            variant="ghost"
          />
        )}
        <div className="flex flex-col justify-center">
          {breadcrumb && <div className="text-accent-orange app-overline mb-0.5">{breadcrumb}</div>}
          <h1 className="app-h1 text-foreground">{title}</h1>
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
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
