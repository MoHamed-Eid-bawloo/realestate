import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'

export function Avatar({ name, color, className, size = 'md' }: { name: string; color?: string; className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizes = { xs: 'size-6 text-[9px]', sm: 'size-7 text-[10px]', md: 'size-9 text-[11px]', lg: 'size-12 text-sm' }
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-full font-semibold text-white ring-2 ring-card', sizes[size], className)}
      style={{ background: color ?? 'linear-gradient(135deg,#334E68,#142B45)' }}
    >
      {initials(name)}
    </span>
  )
}

export function Progress({ value, className, tone = 'accent' }: { value: number; className?: string; tone?: 'accent' | 'navy' | 'amber' | 'red' | 'blue' }) {
  const colors = { accent: 'bg-accent', navy: 'bg-primary dark:bg-slate-300', amber: 'bg-amber-500', red: 'bg-rose-500', blue: 'bg-sky-500' }
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className={cn('h-full rounded-full transition-all', colors[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Switch({ checked, onCheckedChange, className, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; className?: string; disabled?: boolean }) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn('relative h-5 w-9 shrink-0 rounded-full bg-border transition-colors data-[state=checked]:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50', className)}
    >
      <SwitchPrimitive.Thumb className="block size-4 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 rtl:data-[state=checked]:-translate-x-4" />
    </SwitchPrimitive.Root>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-xl border border-border bg-muted/50 text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-border', className)} />
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">{children}</kbd>
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: { page: number; pageSize: number; total: number; onPageChange: (p: number) => void; onPageSizeChange?: (n: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>{pageSize * (page - 1) + 1}–{Math.min(pageSize * page, total)} of {total}</span>
        {onPageSizeChange && (
          <select
            className="h-7 rounded-md border border-border bg-card px-1.5 text-xs"
            value={pageSize}
            onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1) }}
          >
            {[8, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="h-7 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40">{'Prev'}</button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, pages - 4))
          const p = start + i
          return (
            <button key={p} onClick={() => onPageChange(p)} className={cn('size-7 rounded-md text-xs font-medium', p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>{p}</button>
          )
        })}
        <button disabled={page >= pages} onClick={() => onPageChange(page + 1)} className="h-7 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40">{'Next'}</button>
      </div>
    </div>
  )
}
