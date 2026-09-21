import React, { useState, useEffect } from 'react';
import { Toast } from '@base-ui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

let toastCounter = 0;
let addToastFn = () => {};

export const toast = (message, options = {}) => {
  addToastFn({ id: toastCounter++, message, ...options });
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
    };
  }, []);

  return (
    <Toast.Provider swipeDirection="up">
      {children}
      {toasts.map((t) => (
        <Toast.Root
          key={t.id}
          role="status"
          onOpenChange={(open) => {
            if (!open) {
              setToasts((prev) => prev.filter((item) => item.id !== t.id));
            }
          }}
          className={cn(
            "bg-popover text-popover-foreground border shadow-lg rounded-[var(--radius-control,12px)] p-4 flex items-center justify-between gap-4 w-full data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=move]:translate-y-[var(--base-toast-swipe-move-y)] data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-top-full data-[state=open]:slide-in-from-top-full data-[swipe=cancel]:translate-y-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-top-full",
            t.type === 'error' && "border-accent-rose text-accent-rose",
            t.type === 'success' && "border-accent-emerald text-accent-emerald",
            t.className
          )}
        >
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            {t.title && <Toast.Title className="font-semibold text-sm truncate">{t.title}</Toast.Title>}
            <Toast.Description className="text-sm font-medium leading-tight">{t.message}</Toast.Description>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {t.onUndo && (
              <Toast.Action altText="Annulla" asChild>
                <button
                  onClick={t.onUndo}
                  className="px-3 py-1.5 text-xs font-bold uppercase rounded-md border hover:bg-muted transition-colors"
                >
                  Annulla
                </button>
              </Toast.Action>
            )}
            <Toast.Close className="rounded-md p-1.5 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50">
              <X className="w-4 h-4" />
            </Toast.Close>
          </div>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed top-0 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-full max-w-sm p-4 z-[var(--z-toast)] pt-[calc(16px+env(safe-area-inset-top,0px))] mt-[64px] outline-none pointer-events-none" />
    </Toast.Provider>
  );
}
