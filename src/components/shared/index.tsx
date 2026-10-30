import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/misc'
import { Inbox } from 'lucide-react'

export { EmptyState }

export function PageHeader({ title, description, actions, eyebrow, children }: { title: string; description?: string; actions?: React.ReactNode; eyebrow?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">{eyebrow}</div>}
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, delta, deltaLabel, hint, href, tone = 'navy', className }: {
  label: string
  value: React.ReactNode
  icon: React.ElementType
  delta?: number
  deltaLabel?: string
  hint?: string
  href?: string
  tone?: 'navy' | 'green' | 'amber' | 'blue' | 'purple'
  className?: string
}) {
  const tones = {
    navy: 'bg-primary/5 text-primary dark:bg-white/5 dark:text-slate-200',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    blue: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    purple: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  }
  const inner = (
    <Card className={cn('group relative overflow-hidden p-4 transition-all hover:border-slate-300 dark:hover:border-slate-600', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">{label}</p>
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', tones[tone])}><Icon className="size-4" /></span>
      </div>
      <p className="mt-2.5 text-[22px] font-semibold tracking-[-0.03em]">{value}</p>
      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
        {typeof delta === 'number' && (
          <span className={cn('inline-flex items-center gap-0.5 font-medium', delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {(deltaLabel || hint) && <span className="text-muted-foreground">{deltaLabel ?? hint}</span>}
      </div>
    </Card>
  )
  return href ? <Link to={href}>{inner}</Link> : inner
}

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 ps-9" />
      {value && (
        <button onClick={() => onChange('')} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export function FilterButton({ count, onClick, label = 'Filters' }: { count?: number; onClick?: () => void; label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="gap-1.5">
      <SlidersHorizontal className="size-3.5" />
      {label}
      {count ? <span className="ms-0.5 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-semibold text-white">{count}</span> : null}
    </Button>
  )
}

export function TableShell({ children, header, footer, className, noPadding }: { children: React.ReactNode; header?: React.ReactNode; footer?: React.ReactNode; className?: string; noPadding?: boolean }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {header && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">{header}</div>}
      <div className={noPadding ? '' : 'overflow-hidden'}>{children}</div>
      {footer}
    </Card>
  )
}

export function DataTableEmpty({ title = 'No records found', description = 'Try adjusting your filters or create a new record.', action }: { title?: string; description?: string; action?: React.ReactNode }) {
  return <EmptyState icon={Inbox} title={title} description={description} action={action} />
}

export function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-2.5', className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-end text-[13px] font-medium">{value || '—'}</span>
    </div>
  )
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function SegmentedControl<T extends string>({ options, value, onChange, className }: { options: { value: T; label: string; icon?: React.ElementType }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn('inline-flex h-8 items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5', className)}>
      {options.map((o) => {
        const Icon = o.icon
        return (
          <button key={o.value} onClick={() => onChange(o.value)} className={cn('inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors', value === o.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {Icon && <Icon className="size-3.5" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function UserCell({ name, sub, color, avatar }: { name: string; sub?: string; color?: string; avatar?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      {avatar ?? (
        <span className="grid size-7 shrink-0 place-items-center rounded-full text-[9px] font-semibold text-white" style={{ background: color ?? '#334E68' }}>
          {name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium leading-tight">{name}</p>
        {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}
