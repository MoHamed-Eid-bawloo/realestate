import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity as ActivityIcon, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Bot, CalendarCheck,
  CalendarDays, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock, Download, FileText, Flame,
  Handshake, LayoutDashboard, LineChart, PieChart, Plus, Sparkles, Target, TrendingUp, Trophy, Users,
  Wallet, PhoneCall, Eye, MessageSquare,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { formatDate, formatEGP, formatNumber, fromNow } from '@/lib/format'
import { cn, downloadCsv } from '@/lib/utils'
import { sourceLabel } from '@/lib/labels'
import { PageHeader, StatCard, SectionTitle, UserCell } from '@/components/shared'
import { BarsChart, ChartCard, DonutChart, DonutLegend, FunnelChart, LineChartView, Sparkline, TrendChart, chartColors } from '@/components/charts'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, EmptyState, Progress, Skeleton } from '@/components/ui/misc'
import { Select } from '@/components/ui/input'
import { pipelineStages } from '@/data/seed'
import type { DealStage, Lead } from '@/types'

type Mode = 'executive' | 'sales' | 'activity' | 'forecast'

const rangeOptions = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: 'quarter', label: 'This quarter', days: 90 },
  { id: 'custom', label: 'Custom range', days: 30 },
]

const stageLabels: Record<DealStage, string> = {
  new: 'New', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', reservation: 'Reservation', won: 'Won', lost: 'Lost',
}

export function CrmOverviewPage({ mode }: { mode: Mode }) {
  const { pathname } = useLocation()
  if (mode !== 'executive') return <Dashboard mode={mode} />
  if (pathname !== '/crm') return <Dashboard mode="executive" />
  return <Dashboard mode="executive" />
}

function Dashboard({ mode }: { mode: Mode }) {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const role = useAppStore((s) => s.role)
  const activeCompanyId = useAppStore((s) => s.activeCompanyId)
  const company = useAppStore((s) => s.companies.find((c) => c.id === s.activeCompanyId))
  const employeesAll = useAppStore((s) => s.employees)
  const leadsAll = useAppStore((s) => s.leads)
  const dealsAll = useAppStore((s) => s.deals)
  const tasksAll = useAppStore((s) => s.tasks)
  const viewingsAll = useAppStore((s) => s.viewings)
  const transactionsAll = useAppStore((s) => s.transactions)
  const ticketsAll = useAppStore((s) => s.tickets)
  const notifications = useAppStore((s) => s.notifications)
  const toggleTask = useAppStore((s) => s.updateTask)
  const toast = useAppStore((s) => s.toast)

  const [range, setRange] = useState('30')
  const [customStart, setCustomStart] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10))

  const employees = useMemo(() => employeesAll.filter((e) => e.companyId === activeCompanyId), [employeesAll, activeCompanyId])
  const agent = employees.find((e) => e.id === 'e3')
  const scopeEmployee = role === 'agent' ? agent?.id : undefined
  const leads = useMemo(() => leadsAll.filter((l) => l.companyId === activeCompanyId && (!scopeEmployee || l.assigneeId === scopeEmployee)), [leadsAll, activeCompanyId, scopeEmployee])
  const deals = useMemo(() => dealsAll.filter((d) => d.companyId === activeCompanyId && (!scopeEmployee || d.agentId === scopeEmployee)), [dealsAll, activeCompanyId, scopeEmployee])
  const tasks = useMemo(() => tasksAll.filter((x) => x.companyId === activeCompanyId && (!scopeEmployee || x.assigneeId === scopeEmployee)), [tasksAll, activeCompanyId, scopeEmployee])
  const viewings = useMemo(() => viewingsAll.filter((v) => v.companyId === activeCompanyId && (!scopeEmployee || v.agentId === scopeEmployee)), [viewingsAll, activeCompanyId, scopeEmployee])
  const transactions = useMemo(() => transactionsAll.filter((x) => x.companyId === activeCompanyId), [transactionsAll, activeCompanyId])
  const tickets = ticketsAll.filter((x) => x.companyId === activeCompanyId)

  const rangeDays = rangeOptions.find((r) => r.id === range)?.days ?? 30
  const cutoff = range === 'custom' ? new Date(customStart).getTime() : Date.now() - rangeDays * 86400000
  const end = range === 'custom' ? new Date(customEnd).getTime() + 86400000 : Date.now() + 86400000
  const inRange = (iso: string) => {
    const time = new Date(iso).getTime()
    return time >= cutoff && time <= end
  }

  const periodLeads = leads.filter((l) => inRange(l.createdAt))
  const newLeads = leads.filter((l) => l.status === 'new').length
  const qualified = leads.filter((l) => ['qualified', 'interested', 'viewing', 'negotiation'].includes(l.status)).length
  const activeOpps = deals.filter((d) => !['won', 'lost'].includes(d.stage))
  const wonDeals = deals.filter((d) => d.stage === 'won')
  const closedDeals = deals.filter((d) => ['won', 'lost'].includes(d.stage))
  const pipelineValue = activeOpps.reduce((s, d) => s + d.value, 0)
  const weighted = activeOpps.reduce((s, d) => s + (d.value * d.probability) / 100, 0)
  const revenue = transactions.filter((x) => x.status === 'completed').reduce((s, x) => s + x.amount, 0)
  const pendingRevenue = transactions.filter((x) => x.status !== 'completed').reduce((s, x) => s + x.amount, 0)
  const conversion = leads.length ? Math.round((wonDeals.length / leads.length) * 100) : 0
  const target = employees.reduce((s, e) => s + e.target, 0)
  const achieved = employees.reduce((s, e) => s + e.achieved, 0)
  const winRate = closedDeals.length ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0
  const avgDeal = deals.length ? Math.round(deals.reduce((s, d) => s + d.value, 0) / deals.length) : 0

  const overdueTasks = tasks.filter((x) => x.status !== 'done' && new Date(x.dueDate).getTime() < Date.now())
  const todayTasks = tasks.filter((x) => x.status !== 'done' && new Date(x.dueDate).toDateString() === new Date().toDateString())
  const upcomingViewings = viewings.filter((v) => v.status === 'scheduled')
  const staleLeads = leads.filter((l) => !['won', 'lost'].includes(l.status) && Date.now() - new Date(l.lastContact).getTime() > 5 * 86400000)
  const openTickets = tickets.filter((x) => x.status === 'open' || x.status === 'in_progress')

  const sourceData = useMemo(() => {
    const counts = new Map<string, number>()
    leads.forEach((l) => counts.set(sourceLabel[l.source] ?? l.source, (counts.get(sourceLabel[l.source] ?? l.source) ?? 0) + 1))
    return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [leads])

  const stageData = useMemo(() => pipelineStages.map((s) => ({
    name: t(stageLabels[s.id]),
    value: deals.filter((d) => d.stage === s.id).length,
    amount: deals.filter((d) => d.stage === s.id).reduce((x, d) => x + d.value, 0),
  })), [deals, t])

  const teamData = useMemo(() => employees
    .filter((e) => e.role === 'agent')
    .map((e) => ({ name: e.name.split(' ')[0], achieved: Math.round(e.achieved / 1_000_000), target: Math.round(e.target / 1_000_000) }))
    .sort((a, b) => b.achieved - a.achieved), [employees])

  const leadTrend = useMemo(() => {
    const points = range === 'today' ? 8 : range === '7' ? 7 : range === '30' ? 10 : 6
    const step = Math.max(1, Math.round((range === 'today' ? 3 : rangeDays) / points))
    return Array.from({ length: points }, (_, i) => {
      const start = new Date(cutoff + i * step * 86400000)
      const finish = new Date(cutoff + (i + 1) * step * 86400000)
      const bucket = leads.filter((l) => {
        const time = new Date(l.createdAt).getTime()
        return time >= start.getTime() && time < finish.getTime()
      })
      return {
        name: range === 'today' ? `${String(start.getHours()).padStart(2, '0')}:00` : formatDate(start, lang, 'dd MMM'),
        leads: bucket.length,
        qualified: bucket.filter((l) => ['qualified', 'interested', 'viewing', 'negotiation', 'won'].includes(l.status)).length,
      }
    })
  }, [leads, range, rangeDays, cutoff, lang])

  const revenueSeries = useMemo(() => {
    const base = [42, 48, 44, 57, 53, 66, 61, 74, 69, 88, 82, 96]
    return base.map((value, i) => ({
      name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      revenue: value,
      target: Math.round(value * 0.86),
    }))
  }, [])

  const funnel = [
    { label: t('New'), value: leads.filter((l) => l.status !== 'lost').length, color: chartColors.navy },
    { label: t('Contacted'), value: leads.filter((l) => !['new', 'lost'].includes(l.status)).length, color: chartColors.slate },
    { label: t('Qualified'), value: leads.filter((l) => ['qualified', 'interested', 'viewing', 'negotiation', 'won'].includes(l.status)).length, color: chartColors.sky },
    { label: t('Viewing'), value: leads.filter((l) => ['viewing', 'negotiation', 'won'].includes(l.status)).length, color: chartColors.violet },
    { label: t('Negotiation'), value: leads.filter((l) => ['negotiation', 'won'].includes(l.status)).length, color: chartColors.amber },
    { label: t('Won'), value: leads.filter((l) => l.status === 'won').length, color: chartColors.emerald },
  ]

  const dueFollowUps = leads
    .filter((l) => !['won', 'lost'].includes(l.status) && new Date(l.nextFollowUp).getTime() < Date.now() + 86400000)
    .sort((a, b) => new Date(a.nextFollowUp).getTime() - new Date(b.nextFollowUp).getTime())
    .slice(0, 5)

  const recentLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)
  const recentActivities = [
    ...leads.flatMap((l) => l.activities.map((a) => ({ ...a, lead: l.name, id: `${l.id}-${a.id}` }))),
    ...notifications.map((n) => ({ id: n.id, type: 'system' as const, title: n.title, detail: n.body, at: n.createdAt, actor: 'System', lead: '' })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8)

  const rangeLabel = rangeOptions.find((r) => r.id === range)?.label ?? 'Last 30 days'

  const exportSnapshot = () => {
    downloadCsv('nawyati-crm-snapshot.csv', [
      ['Metric', 'Value'],
      ['Company', company?.name ?? ''],
      ['Period', rangeLabel],
      ['Total leads', String(leads.length)],
      ['Qualified leads', String(qualified)],
      ['Active opportunities', String(activeOpps.length)],
      ['Pipeline value (EGP)', String(pipelineValue)],
      ['Weighted forecast (EGP)', String(Math.round(weighted))],
      ['Revenue (EGP)', String(revenue)],
      ['Conversion rate', `${conversion}%`],
      ['Win rate', `${winRate}%`],
    ])
    toast('Snapshot exported', 'A CSV summary of the current dashboard was downloaded.')
  }

  const finishTask = (id: string) => {
    toggleTask(id, { status: 'done' })
    toast('Task completed', 'The task was moved to done.')
  }

  if (mode === 'sales') {
    return (
      <div>
        <PageHeader
          eyebrow={<><LayoutDashboard className="size-3.5" /> {t('Sales Management')}</>}
          title={t('Sales Overview')}
          description={t('Pipeline health, revenue and team performance across the selected period.')}
          actions={<>
            <Select value={range} onChange={(e) => setRange(e.target.value)} className="h-9 w-[150px]">{rangeOptions.map((r) => <option key={r.id} value={r.id}>{t(r.label)}</option>)}</Select>
            <Button variant="outline" onClick={exportSnapshot}><Download className="size-4" /> {t('Export')}</Button>
            <Button onClick={() => navigate('/crm/pipeline')}><LayersIcon /> {t('Open pipeline')}</Button>
          </>}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t('Pipeline value')} value={formatEGP(pipelineValue, lang, true)} icon={CircleDollarSign} delta={12} deltaLabel={t('vs previous period')} />
          <StatCard label={t('Weighted forecast')} value={formatEGP(weighted, lang, true)} icon={Target} tone="green" delta={8} deltaLabel={t('probability adjusted')} />
          <StatCard label={t('Avg. deal size')} value={formatEGP(avgDeal, lang, true)} icon={Handshake} tone="blue" />
          <StatCard label={t('Win rate')} value={`${winRate}%`} icon={Trophy} tone="amber" delta={4} deltaLabel={`${wonDeals.length} ${t('deals won')}`} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
          <ChartCard title={t('Revenue trend')} description={`${t('Completed and pending transactions')} · ${t(rangeLabel)}`} action={<Badge tone="green"><ArrowUpRight className="size-3" /> 18.4%</Badge>}>
            <TrendChart data={revenueSeries} series={[{ key: 'revenue', label: t('Revenue'), color: chartColors.emerald }, { key: 'target', label: t('Target'), color: chartColors.slate }]} height={280} />
          </ChartCard>
          <ChartCard title={t('Pipeline by stage')} description={t('Deal count and value at each stage')}>
            <div className="space-y-3 px-3 pb-2">
              {stageData.map((s) => {
                const max = Math.max(...stageData.map((x) => x.amount), 1)
                return (
                  <div key={s.name}>
                    <div className="mb-1 flex items-center justify-between text-[11px]"><span className="text-muted-foreground">{s.name}</span><span className="font-medium">{s.value} · {formatEGP(s.amount, lang, true)}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(3, (s.amount / max) * 100)}%` }} /></div>
                  </div>
                )
              })}
            </div>
          </ChartCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <ChartCard title={t('Target vs achieved')} description={t('Sales agents, EGP millions')}>
            <BarsChart data={teamData} series={[{ key: 'target', label: t('Target'), color: chartColors.slate }, { key: 'achieved', label: t('Achieved'), color: chartColors.emerald }]} height={260} />
          </ChartCard>
          <ChartCard title={t('Conversion funnel')} description={t('Lead progression through the sales process')}>
            <div className="py-2"><FunnelChart stages={funnel} /></div>
          </ChartCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-[14px] font-semibold">{t('Recent deals')}</h3>
              <Link to="/crm/pipeline?tab=deals" className="text-[11px] font-medium text-accent hover:underline">{t('View all')}</Link>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>{t('Deal')}</TableHead><TableHead>{t('Customer')}</TableHead><TableHead>{t('Value')}</TableHead><TableHead>{t('Stage')}</TableHead><TableHead>{t('Agent')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {deals.slice(0, 6).map((d) => {
                  const emp = employees.find((e) => e.id === d.agentId)
                  return (
                    <TableRow key={d.id}>
                      <TableCell><Link to="/crm/pipeline?tab=deals" className="font-medium hover:text-accent">{d.code}</Link><p className="max-w-[180px] truncate text-[10px] text-muted-foreground">{d.propertyTitle}</p></TableCell>
                      <TableCell className="text-[12px]">{d.customerName}</TableCell>
                      <TableCell className="font-medium">{formatEGP(d.value, lang, true)}</TableCell>
                      <TableCell><StatusBadge status={d.stage} /></TableCell>
                      <TableCell><UserCell name={emp?.name ?? '—'} color={emp?.avatarColor} /></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
          <Card className="p-4">
            <h3 className="text-[14px] font-semibold">{t('Top agents')}</h3>
            <div className="mt-3 space-y-3">
              {teamData.slice(0, 5).map((a, i) => {
                const emp = employees.find((e) => e.name.startsWith(a.name))
                return (
                  <div key={a.name} className="flex items-center gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-md bg-muted text-[9px] font-semibold">{i + 1}</span>
                    <Avatar name={emp?.name ?? a.name} color={emp?.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">{emp?.name ?? a.name}</p>
                      <Progress value={Math.min(100, (a.achieved / Math.max(1, a.target)) * 100)} className="mt-1" />
                    </div>
                    <span className="text-[10px] font-medium">{a.achieved}M</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (mode === 'activity') {
    const todayAgenda = [...tasks].filter((x) => x.status !== 'done').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 8)
    const activityByType = ['call', 'whatsapp', 'email', 'meeting', 'viewing', 'note'].map((type) => ({
      name: t(type === 'call' ? 'Calls' : type === 'whatsapp' ? 'WhatsApp' : type === 'email' ? 'Emails' : type === 'meeting' ? 'Meetings' : type === 'viewing' ? 'Viewings' : 'Notes'),
      count: leads.reduce((s, l) => s + l.activities.filter((a) => a.type === type).length, 0),
    }))
    return (
      <div>
        <PageHeader
          eyebrow={<><ActivityIcon className="size-3.5" /> {t('Activities & Productivity')}</>}
          title={t('Activity Overview')}
          description={t('What your team is doing, what is due and what needs attention today.')}
          actions={<><Button variant="outline" onClick={() => navigate('/crm/activities?tab=calendar')}><CalendarDays className="size-4" /> {t('Calendar')}</Button><Button onClick={() => navigate('/crm/activities?new=1')}><Plus className="size-4" /> {t('Add task')}</Button></>}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t('Due today')} value={todayTasks.length} icon={CalendarCheck} deltaLabel={t('tasks')} />
          <StatCard label={t('Overdue')} value={overdueTasks.length} icon={AlertTriangle} tone="amber" href="/crm/activities?tab=follow-ups" hint={t('needs attention')} />
          <StatCard label={t('Viewings scheduled')} value={upcomingViewings.length} icon={Eye} tone="blue" href="/crm/activities?tab=viewings" />
          <StatCard label={t('Activities logged')} value={leads.reduce((s, l) => s + l.activities.length, 0)} icon={ActivityIcon} tone="green" hint={t('all time')} />
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <ChartCard title={t('Activities by type')} description={t('All interactions linked to leads and customers')}>
            <BarsChart data={activityByType} series={[{ key: 'count', label: t('Activities'), color: chartColors.navy }]} height={270} />
          </ChartCard>
          <ChartCard title={t('Weekly follow-up compliance')} description={t('Completed vs planned follow-ups')}>
            <LineChartView data={[{ name: 'W1', planned: 42, completed: 36 }, { name: 'W2', planned: 48, completed: 44 }, { name: 'W3', planned: 45, completed: 39 }, { name: 'W4', planned: 52, completed: 50 }]} series={[{ key: 'planned', label: t('Planned'), color: chartColors.slate }, { key: 'completed', label: t('Completed'), color: chartColors.emerald }]} height={250} />
          </ChartCard>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <Card>
            <div className="flex items-center justify-between border-b border-border px-4 py-3"><h3 className="text-[14px] font-semibold">{t('Today’s agenda')}</h3><Link to="/crm/activities" className="text-[11px] font-medium text-accent hover:underline">{t('All tasks')}</Link></div>
            <div className="divide-y divide-border">
              {todayAgenda.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                  <button onClick={() => finishTask(task.id)} className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:border-accent hover:text-accent" aria-label={t('Complete')}><Check className="size-3" /></button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">{task.title}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(task.dueDate, lang, 'MMM d, HH:mm')} · {task.customerName ?? t('Internal')}</p>
                  </div>
                  <StatusBadge status={task.priority} />
                </div>
              ))}
              {todayAgenda.length === 0 && <EmptyState icon={CheckCircle2} title={t('You are all caught up.')} description={t('No pending tasks in this workspace.')} />}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-[14px] font-semibold">{t('Activity timeline')}</h3>
            <div className="relative mt-3 space-y-3 before:absolute before:inset-y-1 before:start-[13px] before:w-px before:bg-border">
              {recentActivities.map((a) => (
                <div key={a.id} className="relative flex gap-3">
                  <span className="z-10 grid size-7 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground"><ActivityIcon className="size-3" /></span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium">{a.title}</p>
                    <p className="line-clamp-1 text-[10px] text-muted-foreground">{a.detail}</p>
                    <p className="text-[9px] text-muted-foreground/70">{fromNow(a.at, lang)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (mode === 'forecast') {
    const committed = deals.filter((d) => ['reservation', 'won'].includes(d.stage)).reduce((s, d) => s + d.value, 0)
    const bestCase = deals.filter((d) => ['proposal', 'negotiation'].includes(d.stage)).reduce((s, d) => s + d.value, 0)
    const atRisk = activeOpps.filter((d) => new Date(d.expectedClose).getTime() < Date.now() + 14 * 86400000 || d.probability < 35).slice(0, 6)
    const forecastSeries = [
      { name: 'Nov', actual: 0, forecast: 74 }, { name: 'Dec', actual: 0, forecast: 88 }, { name: 'Jan', actual: 0, forecast: 96 },
      { name: 'Feb', actual: 0, forecast: 104 }, { name: 'Mar', actual: 0, forecast: 118 }, { name: 'Apr', actual: 0, forecast: 126 },
    ]
    const agentForecast = employees.filter((e) => e.role === 'agent').map((e) => {
      const own = deals.filter((d) => d.agentId === e.id && !['won', 'lost'].includes(d.stage))
      return { name: e.name.split(' ')[0], forecast: Math.round(own.reduce((s, d) => s + (d.value * d.probability) / 100, 0) / 1_000_000), target: Math.round(e.target / 1_000_000) }
    })
    return (
      <div>
        <PageHeader
          eyebrow={<><Target className="size-3.5" /> {t('Forecasting')}</>}
          title={t('Sales Forecast')}
          description={t('Probability-weighted revenue forecast, committed pipeline and at-risk deals.')}
          actions={<><Button variant="outline" onClick={exportSnapshot}><Download className="size-4" /> {t('Export forecast')}</Button><Button onClick={() => navigate('/crm/pipeline')}>{t('Review pipeline')}</Button></>}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t('Weighted forecast')} value={formatEGP(weighted, lang, true)} icon={Target} delta={9} deltaLabel={t('quarter to date')} />
          <StatCard label={t('Committed')} value={formatEGP(committed, lang, true)} icon={CheckCircle2} tone="green" hint={t('reservations and won')} />
          <StatCard label={t('Best case')} value={formatEGP(committed + bestCase, lang, true)} icon={TrendingUp} tone="blue" hint={t('including proposal stage')} />
          <StatCard label={t('Gap to target')} value={formatEGP(Math.max(0, target - achieved), lang, true)} icon={AlertTriangle} tone="amber" hint={`${Math.round((achieved / target) * 100)}% ${t('achieved')}`} />
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <ChartCard title={t('Six-month revenue forecast')} description={t('Probability-weighted, EGP millions')}>
            <TrendChart data={forecastSeries} series={[{ key: 'forecast', label: t('Forecast'), color: chartColors.emerald }]} height={290} />
          </ChartCard>
          <ChartCard title={t('Quarter target')} description={`${formatEGP(achieved, lang, true)} / ${formatEGP(target, lang, true)}`}>
            <div className="flex flex-col items-center justify-center px-4 py-6">
              <div className="relative grid size-40 place-items-center rounded-full" style={{ background: `conic-gradient(#10B981 ${Math.min(100, (achieved / target) * 100)}%, rgb(var(--muted)) 0)` }}>
                <div className="grid size-32 place-items-center rounded-full bg-card text-center">
                  <div>
                    <p className="text-2xl font-semibold tracking-[-0.03em]">{Math.round((achieved / target) * 100)}%</p>
                    <p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{t('of target')}</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">{t('Forecast assumes current stage probabilities and expected close dates.')}</p>
            </div>
          </ChartCard>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3"><h3 className="text-[14px] font-semibold">{t('At-risk opportunities')}</h3><Badge tone="amber">{atRisk.length}</Badge></div>
            <Table>
              <TableHeader><TableRow><TableHead>{t('Deal')}</TableHead><TableHead>{t('Value')}</TableHead><TableHead>{t('Probability')}</TableHead><TableHead>{t('Close date')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {atRisk.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell><p className="font-medium">{d.customerName}</p><p className="max-w-[180px] truncate text-[10px] text-muted-foreground">{d.propertyTitle}</p></TableCell>
                    <TableCell className="font-medium">{formatEGP(d.value, lang, true)}</TableCell>
                    <TableCell><span className={cn('text-[11px] font-medium', d.probability < 35 ? 'text-rose-500' : 'text-amber-500')}>{d.probability}%</span></TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{formatDate(d.expectedClose, lang)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <ChartCard title={t('Forecast by agent')} description={t('Weighted pipeline, EGP millions')}>
            <BarsChart data={agentForecast} series={[{ key: 'target', label: t('Target'), color: chartColors.slate }, { key: 'forecast', label: t('Forecast'), color: chartColors.emerald }]} height={250} />
          </ChartCard>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow={<><LayoutDashboard className="size-3.5" /> {t('CRM')} · {company?.name}</>}
        title={`${t('Good morning')}, ${role === 'agent' ? 'Youssef' : role === 'manager' ? 'Omar' : 'Tarek'}`}
        description={t('Here is what needs your attention today.')}
        actions={<>
          <Select value={range} onChange={(e) => setRange(e.target.value)} className="h-9 w-[150px]">{rangeOptions.map((r) => <option key={r.id} value={r.id}>{t(r.label)}</option>)}</Select>
          <Button variant="outline" onClick={exportSnapshot}><Download className="size-4" /> {t('Export')}</Button>
          <Button onClick={() => navigate('/crm/leads?new=1')}><Plus className="size-4" /> {t('Add lead')}</Button>
        </>}
      />
      {range === 'custom' && (
        <Card className="mb-4 flex flex-wrap items-end gap-3 p-3">
          <label className="text-[10px] text-muted-foreground">{t('From')}<input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="mt-1 block h-8 rounded-md border border-border bg-card px-2 text-[11px]" /></label>
          <label className="text-[10px] text-muted-foreground">{t('To')}<input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="mt-1 block h-8 rounded-md border border-border bg-card px-2 text-[11px]" /></label>
          <p className="pb-1.5 text-[10px] text-muted-foreground">{periodLeads.length} {t('leads created in this range')}</p>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label={t('Total leads')} value={formatNumber(leads.length, lang)} icon={Users} delta={14} deltaLabel={t('vs previous period')} href="/crm/leads" />
        <StatCard label={t('New leads')} value={newLeads} icon={Flame} tone="amber" hint={`${periodLeads.length} ${t('in selected period')}`} href="/crm/leads?tab=inbox" />
        <StatCard label={t('Qualified leads')} value={qualified} icon={CheckCircle2} tone="green" delta={9} hint={`${Math.round((qualified / Math.max(1, leads.length)) * 100)}% ${t('of pipeline')}`} />
        <StatCard label={t('Active opportunities')} value={activeOpps.length} icon={Handshake} tone="blue" hint={formatEGP(pipelineValue, lang, true)} href="/crm/pipeline" />
        <StatCard label={t('Closed deals')} value={wonDeals.length} icon={Trophy} tone="purple" hint={`${winRate}% ${t('win rate')}`} href="/crm/pipeline?tab=deals" />
        <StatCard label={t('Revenue')} value={formatEGP(revenue, lang, true)} icon={Wallet} tone="green" delta={18} deltaLabel={t('completed transactions')} href="/finance" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <ChartCard
          title={t('Leads over time')}
          description={`${t(rangeLabel)} · ${t('new vs qualified')}`}
          action={<span className="inline-flex items-center gap-3 text-[10px]"><span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[#142B45] dark:bg-slate-300" /> {t('Leads')}</span><span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> {t('Qualified')}</span></span>}
        >
          <TrendChart data={leadTrend} series={[{ key: 'leads', label: t('Leads'), color: chartColors.navy }, { key: 'qualified', label: t('Qualified'), color: chartColors.emerald }]} height={270} />
        </ChartCard>
        <ChartCard title={t('Lead sources')} description={t('Where demand comes from')}>
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_1fr] xl:grid-cols-1 2xl:grid-cols-[1fr_1fr]">
            <DonutChart data={sourceData} height={180} centerValue={String(leads.length)} centerLabel={t('leads')} />
            <div className="px-3 pb-2"><DonutLegend data={sourceData} /></div>
          </div>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <ChartCard title={t('Revenue trend')} description={t('EGP millions · last 12 months')} className="xl:col-span-1">
          <TrendChart data={revenueSeries} series={[{ key: 'revenue', label: t('Revenue'), color: chartColors.emerald }]} height={200} />
        </ChartCard>
        <ChartCard title={t('Pipeline distribution')} description={t('Active deals by stage')}>
          <div className="space-y-2.5 px-3 pb-3">
            {stageData.filter((s) => s.value > 0).map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-[10px] text-muted-foreground">{s.name}</span>
                <Progress value={(s.value / Math.max(1, Math.max(...stageData.map((x) => x.value)))) * 100} tone={s.name === t('Won') ? 'accent' : 'navy'} />
                <span className="w-5 text-end text-[10px] font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title={t('Team performance')} description={t('Target vs achieved, EGP millions')}>
          <BarsChart data={teamData.slice(0, 5)} series={[{ key: 'target', label: t('Target'), color: chartColors.slate }, { key: 'achieved', label: t('Achieved'), color: chartColors.emerald }]} height={200} vertical />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div><h3 className="text-[14px] font-semibold">{t('Recent leads')}</h3><p className="text-[10px] text-muted-foreground">{t('Latest inquiries assigned to your team')}</p></div>
            <Link to="/crm/leads" className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline">{t('View all')} <ChevronRight className="size-3 rtl:rotate-180" /></Link>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>{t('Customer')}</TableHead><TableHead>{t('Budget')}</TableHead><TableHead>{t('Source')}</TableHead><TableHead>{t('Score')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead>{t('Agent')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {recentLeads.map((l) => {
                const emp = employees.find((e) => e.id === l.assigneeId)
                return (
                  <TableRow key={l.id}>
                    <TableCell><Link to={`/crm/leads/${l.id}`} className="block"><UserCell name={l.name} sub={`${t(l.location)} · ${fromNow(l.createdAt, lang)}`} color={SOURCE_COLORS[l.source]} /></Link></TableCell>
                    <TableCell className="text-[12px] font-medium">{formatEGP(l.budgetMax, lang, true)}</TableCell>
                    <TableCell><Badge tone="outline">{t(sourceLabel[l.source])}</Badge></TableCell>
                    <TableCell><span className={cn('inline-flex size-7 items-center justify-center rounded-md text-[10px] font-semibold', l.score >= 75 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : l.score >= 55 ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-muted text-muted-foreground')}>{l.score}</span></TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                    <TableCell><span className="text-[11px] text-muted-foreground">{emp?.name.split(' ')[0]}</span></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[14px] font-semibold"><AlertTriangle className="size-4 text-amber-500" /> {t('Attention needed')}</h3>
              <Badge tone="amber">{overdueTasks.length + staleLeads.length}</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {overdueTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-500/10"><Clock className="size-3.5" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium">{task.title}</p><p className="text-[9px] text-muted-foreground">{t('Overdue')} · {task.customerName}</p></div>
                  <button onClick={() => navigate('/crm/activities')} className="text-[9px] font-medium text-accent">{t('Open')}</button>
                </div>
              ))}
              {staleLeads.slice(0, 2).map((l) => (
                <div key={l.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-sky-50 text-sky-600 dark:bg-sky-500/10"><Users className="size-3.5" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium">{l.name}</p><p className="text-[9px] text-muted-foreground">{t('No contact for')} 5+ {t('days')}</p></div>
                  <Link to={`/crm/leads/${l.id}`} className="text-[9px] font-medium text-accent">{t('Open')}</Link>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between"><h3 className="text-[14px] font-semibold">{t('Follow-up due')}</h3><Link to="/crm/activities?tab=follow-ups" className="text-[10px] font-medium text-accent">{t('View all')}</Link></div>
            <div className="mt-3 divide-y divide-border">
              {dueFollowUps.slice(0, 4).map((l) => (
                <div key={l.id} className="flex items-center gap-2 py-2">
                  <Avatar name={l.name} color={SOURCE_COLORS[l.source]} size="xs" />
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium">{l.name}</p><p className="text-[9px] text-muted-foreground">{t('Next')}: {formatDate(l.nextFollowUp, lang, 'MMM d')}</p></div>
                  <Link to={`/crm/leads/${l.id}`}><Button size="xs" variant="outline">{t('View lead')}</Button></Link>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between"><h3 className="flex items-center gap-1.5 text-[14px] font-semibold"><Sparkles className="size-4 text-accent" /> {t('AI insights')}</h3><Badge tone="green">{t('Simulated')}</Badge></div>
            <div className="mt-4 space-y-2">
              {dueFollowUps.slice(0, 4).map((l) => (
                <div key={l.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                  <Avatar name={l.name} color={SOURCE_COLORS[l.source]} size="xs" />
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium">{l.name}</p><p className="text-[9px] text-muted-foreground">{t('highest intent today')}</p></div>
                  <Link to={`/crm/leads/${l.id}`} className="text-[9px] font-medium text-accent">{t('Act')}</Link>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[9px] leading-relaxed text-muted-foreground">{t('Next best action: prioritize')} {dueFollowUps[0]?.name ?? t('new leads')} {t('with a call before the end of the day.')}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

const SOURCE_COLORS: Record<string, string> = {
  website: '#142B45', instagram: '#8B5CF6', facebook: '#0EA5E9', referral: '#10B981', whatsapp: '#0F766E',
  walk_in: '#64748B', campaign: '#F59E0B', broker: '#BE123C', call_center: '#14B8A6',
}

function LayersIcon() {
  return <PieChart className="size-4" />
}
