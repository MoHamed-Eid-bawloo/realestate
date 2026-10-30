import * as React from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

export const chartColors = {
  navy: '#142B45',
  slate: '#64748B',
  emerald: '#10B981',
  amber: '#F59E0B',
  sky: '#0EA5E9',
  violet: '#8B5CF6',
  rose: '#F43F5E',
  teal: '#14B8A6',
}

const grid = 'rgba(100,116,139,0.16)'
const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid rgb(var(--border))',
  background: 'rgb(var(--card))',
  color: 'rgb(var(--foreground))',
  boxShadow: '0 8px 24px rgba(15,35,58,0.12)',
  fontSize: 12,
}

export function ChartCard({ title, description, action, children, className, bodyClassName }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-2">
        <div>
          <h3 className="text-[14px] font-semibold tracking-[-0.01em]">{title}</h3>
          {description && <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn('min-h-0 flex-1 px-2 pb-3 pt-2', bodyClassName)}>{children}</div>
    </Card>
  )
}

export function ChartLegend({ series }: { series: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
      {series.map((s) => (
        <span key={s.label} className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  )
}

export function TrendChart({ data, series, xKey = 'name', height = 240, showGrid = true }: { data: Record<string, string | number>[]; series: { key: string; label: string; color: string }[]; xKey?: string; height?: number; showGrid?: boolean }) {
  const { isRTL } = useI18n()
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: isRTL ? 12 : 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />}
          <XAxis dataKey={xKey} axisLine={false} tickLine={false} tickMargin={10} reversed={isRTL} />
          <YAxis axisLine={false} tickLine={false} tickMargin={8} orientation={isRTL ? 'right' : 'left'} width={42} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
          <Tooltip contentStyle={tooltipStyle} />
          {series.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} fill={`url(#grad-${s.key})`} activeDot={{ r: 4, strokeWidth: 2 }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LineChartView({ data, series, xKey = 'name', height = 220 }: { data: Record<string, string | number>[]; series: { key: string; label: string; color: string }[]; xKey?: string; height?: number }) {
  const { isRTL } = useI18n()
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
          <XAxis dataKey={xKey} axisLine={false} tickLine={false} tickMargin={10} reversed={isRTL} />
          <YAxis axisLine={false} tickLine={false} tickMargin={8} orientation={isRTL ? 'right' : 'left'} width={38} />
          <Tooltip contentStyle={tooltipStyle} />
          {series.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarsChart({ data, series, xKey = 'name', height = 240, stacked = false, vertical = false, showGrid = true }: { data: Record<string, string | number>[]; series: { key: string; label: string; color: string }[]; xKey?: string; height?: number; stacked?: boolean; vertical?: boolean; showGrid?: boolean }) {
  const { isRTL } = useI18n()
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={vertical ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 14, left: vertical ? 8 : 0, bottom: 0 }} barGap={4}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" horizontal={!vertical} vertical={vertical} stroke={grid} />}
          {vertical ? (
            <>
              <XAxis type="number" axisLine={false} tickLine={false} tickMargin={8} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
              <YAxis type="category" dataKey={xKey} axisLine={false} tickLine={false} width={120} orientation={isRTL ? 'right' : 'left'} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tickMargin={10} reversed={isRTL} />
              <YAxis axisLine={false} tickLine={false} tickMargin={8} orientation={isRTL ? 'right' : 'left'} width={40} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
            </>
          )}
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(100,116,139,0.06)' }} />
          {series.map((s) => <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={vertical ? 14 : 26} stackId={stacked ? 'a' : undefined} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DonutChart({ data, height = 220, centerValue, centerLabel, colors = [chartColors.navy, chartColors.emerald, chartColors.sky, chartColors.amber, chartColors.violet, chartColors.rose, chartColors.teal] }: { data: { name: string; value: number }[]; height?: number; centerValue?: string; centerLabel?: string; colors?: string[] }) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="86%" paddingAngle={2} strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue && <span className="text-xl font-semibold tracking-[-0.03em]">{centerValue}</span>}
          {centerLabel && <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}

export function DonutLegend({ data, colors = [chartColors.navy, chartColors.emerald, chartColors.sky, chartColors.amber, chartColors.violet, chartColors.rose] }: { data: { name: string; value: number }[]; colors?: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center justify-between gap-3 text-xs">
          <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <span className="size-2 shrink-0 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span className="truncate">{d.name}</span>
          </span>
          <span className="font-medium tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span>
        </div>
      ))}
    </div>
  )
}

export function FunnelChart({ stages }: { stages: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1)
  return (
    <div className="space-y-2.5 px-2">
      {stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1].value : s.value
        const conv = prev ? Math.round((s.value / prev) * 100) : 100
        return (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-[11px] text-muted-foreground">{s.label}</span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-muted/60">
              <div className="h-full rounded-md transition-all" style={{ width: `${Math.max(6, (s.value / max) * 100)}%`, background: s.color }} />
            </div>
            <span className="w-12 shrink-0 text-end text-[11px] font-semibold tabular-nums">{s.value}</span>
            <span className="hidden w-9 shrink-0 text-end text-[10px] text-muted-foreground sm:block">{i === 0 ? '—' : `${conv}%`}</span>
          </div>
        )
      })}
    </div>
  )
}

export function Sparkline({ data, color = chartColors.emerald, height = 36 }: { data: number[]; color?: string; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((value, i) => ({ i, value }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.8} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
