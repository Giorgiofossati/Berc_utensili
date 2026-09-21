import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({
  ...props
}) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-[var(--z-dialog)] bg-black/40 backdrop-blur-sm duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props} />
  );
}

const dialogSizes = {
  sm: "sm:max-w-[448px]",
  md: "sm:max-w-[640px]",
  lg: "sm:max-w-[768px]",
  xl: "sm:max-w-[1024px]",
};

function DialogContent({
  className,
  children,
  size = "md",
  showCloseButton = false,
  ...props
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--z-dialog)] grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-modal,32px)] bg-background p-0 text-foreground border shadow-2xl duration-200 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 overflow-hidden",
          dialogSizes[size] || dialogSizes.md,
          className
        )}
        {...props}>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button variant="ghost" className="absolute top-4 right-4" size="icon" />
            }>
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

export function ModalHeader({ icon, overline, title, subtitle, badge, className }) {
  return (
    <div className={cn("flex items-start gap-4 p-6 sm:p-8 pb-4 shrink-0 border-b border-border/50", className)}>
      {icon && (
        <div className="w-12 h-12 rounded-2xl shrink-0 bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[48px]">
        {(overline || badge) && (
          <div className="flex items-center gap-2 mb-1">
            {overline && <span className="app-overline text-accent-orange">{overline}</span>}
            {badge && badge}
          </div>
        )}
        <DialogTitle className="app-h2">{title}</DialogTitle>
        {subtitle && <DialogDescription className="app-body text-slate-500 mt-1">{subtitle}</DialogDescription>}
      </div>
      <DialogPrimitive.Close
        className="shrink-0 w-11 h-11 rounded-[var(--radius-control,12px)] flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-4"
        aria-label="Chiudi"
      >
        <XIcon className="w-5 h-5" />
      </DialogPrimitive.Close>
    </div>
  );
}

export function ModalBody({ children, className }) {
  return (
    <div className={cn("p-6 sm:p-8 overflow-y-auto custom-scrollbar max-h-[85vh]", className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }) {
  return (
    <div className={cn("px-6 py-4 sm:px-8 border-t border-border/50 bg-muted/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0", className)}>
      {children}
    </div>
  );
}

function DialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 p-6", className)}
      {...props} />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}>
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props} />
  );
}

function DialogDescription({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props} />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
