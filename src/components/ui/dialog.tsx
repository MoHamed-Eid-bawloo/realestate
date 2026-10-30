import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({ className, children, overlayClassName, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { overlayClassName?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={cn('fixed inset-0 z-50 bg-[#071426]/50 backdrop-blur-[2px] data-[state=open]:animate-in', overlayClassName)} />
      <DialogPrimitive.Content
        className={cn('fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-pop outline-none animate-scale-in', className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute end-4 top-4 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1.5 pe-8', className)} {...props} />
}
export function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-lg font-semibold tracking-[-0.01em]', className)} {...props} />
}
export function DialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-xs leading-relaxed text-muted-foreground', className)} {...props} />
}
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}

export function Sheet({ open, onOpenChange, children, side = 'right', width = '460px' }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode; side?: 'right' | 'left'; width?: string }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#071426]/45 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          style={{ width, maxWidth: '94vw' }}
          className={cn(
            'fixed top-0 z-50 flex h-full flex-col overflow-hidden border-border bg-card shadow-pop outline-none animate-slide-in',
            side === 'right' ? 'end-0 border-s' : 'start-0 border-e',
          )}
        >
          {children}
          <DialogPrimitive.Close className="absolute end-4 top-4 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', onConfirm, danger = false }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; description: string; confirmLabel?: string; onConfirm: () => void; danger?: boolean }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="h-9 rounded-lg border border-border px-3.5 text-[13px] font-medium hover:bg-muted">Cancel</button>
          <button
            onClick={() => { onConfirm(); onOpenChange(false) }}
            className={cn('h-9 rounded-lg px-3.5 text-[13px] font-medium text-white', danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-accent hover:bg-emerald-600')}
          >{confirmLabel}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
