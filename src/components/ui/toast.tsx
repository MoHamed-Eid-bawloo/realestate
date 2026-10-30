import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}
const tones = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  warning: 'text-amber-500',
  info: 'text-sky-500',
}

export function Toaster() {
  const toasts = useAppStore((s) => s.toasts)
  const dismiss = useAppStore((s) => s.dismissToast)
  return (
    <div className="pointer-events-none fixed bottom-4 end-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.variant ?? 'success']
        return (
          <div key={toast.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-pop animate-slide-in">
            <Icon className={cn('mt-0.5 size-4 shrink-0', tones[toast.variant ?? 'success'])} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-tight">{toast.title}</p>
              {toast.description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{toast.description}</p>}
            </div>
            <button onClick={() => dismiss(toast.id)} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
