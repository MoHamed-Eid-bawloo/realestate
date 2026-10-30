import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'
import { statusTone } from '@/lib/labels'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap',
  {
    variants: {
      tone: {
        default: 'border-transparent bg-muted text-muted-foreground',
        navy: 'border-transparent bg-primary/8 text-primary dark:bg-white/10 dark:text-white',
        green: 'border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
        amber: 'border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',
        red: 'border-rose-200/60 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400',
        blue: 'border-sky-200/60 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400',
        purple: 'border-violet-200/60 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400',
        outline: 'border-border text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export function StatusBadge({ status, className, dot = false }: { status: string; className?: string; dot?: boolean }) {
  const { t } = useI18n()
  const tone = statusTone[status] ?? 'default'
  return (
    <Badge tone={tone} className={className}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {t(status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}
    </Badge>
  )
}
