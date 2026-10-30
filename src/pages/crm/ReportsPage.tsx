import { useMemo, useState } from 'react'
import {
  BarChart3, ChartPie, Download, FileText, Layers, Radio, SlidersHorizontal, Trophy, Wallet, Users,
  TrendingUp, ArrowUpRight, Target, Sparkles,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/appStore'
import { useTab } from '@/lib/useTab'
import { cn, downloadCsv } from '@/lib/utils'
import { formatDate, formatEGP, formatNumber } from '@/lib/format'
import { sourceLabel, sourceColors } from '@/lib/labels'
import { PageHeader, StatCard, SectionTitle, SearchInput, DataTableEmpty } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Field, Select } from '@/components/ui/input'
import { Progress } from '@/components/ui/misc'
import { BarsChart, ChartCard, DonutChart, DonutLegend, FunnelChart, TrendChart, chartColors } from '@/components/charts'
import { pipelineStages } from '@/data/seed'
import type { DealStage } from '@/types'

const tabs = [
  { id: 'sales', label: 'Sales Reports', icon: BarChart3 },
  { id: 'conversion', label: 'Conversion Analytics', icon: ChartPie },
  { id: 'sources', label: 'Lead Source Analytics', icon: Radio },
  { id: 'agents', label: 'Agent Performance', icon: Trophy },
  { id: 'revenue', label: 'Revenue Analytics', icon: Wallet },
  { id: 'pipeline', label: 'Pipeline Analytics', icon: Layers },
  { id: 'custom', label: 'Custom Reports', icon: FileText },
]

const stageLabels: Record<DealStage, string> = { new: 'New', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', reservation: 'Reservation', won: 'Won', lost: 'Lost' }
const stageColors: Record<string, string> = { new: chartColors.sky, qualified: chartColors.teal, proposal: chartColors.violet, negotiation: chartColors.amber, reservation: chartColors.navy, won: chartColors.emerald, lost: chartColors.rose }

export function ReportsPage() {
  const { t, lang } = useI18n()
  const { tab, setTab } = useTab('sales')
  const role = useAppStore((s) => s.role)
  const companyId = useAppStore((s) => s.activeCompanyId)
  const leadsAll = useAppStore((s) => s.leads)
  const dealsAll = useAppStore((s) => s.deals)
  const transactionsAll = useAppStore((s) => s.transactions)
  const employeesAll = useAppStore((s) => s.employees)
  const commissions = useAppStore(useShallow((s) => s.commissions.filter((c) => c.companyId === s.activeCompanyId)))
  const toast = useAppStore((s) => s.toast)

  const agentId = role === 'agent' ? 'e3' : undefined
  const leads = useMemo(() => leadsAll.filter((l) => l.companyId === companyId && (!agentId || l.assigneeId === agentId)), [leadsAll, companyId, agentId])
  const deals = useMemo(() => dealsAll.filter((d) => d.companyId === companyId && (!agentId || d.agentId === agentId)), [dealsAll, companyId, agentId])
  const transactions = useMemo(() => transactionsAll.filter((x) => x.companyId === companyId && (!agentId || x.agentId === agentId)), [transactionsAll, companyId, agentId])
  const employees = employeesAll.filter((e) => e.companyId === companyId)

  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('90')
  const [customType, setCustomType] = useState('lead-source')
  const [groupBy, setGroupBy] = useState('source')

  const [reportRows, setReportRows] = useState<{ label: string; leads: number; deals: number; revenue: number }[] | null>(null)

  const won = deals.filter((d) => d.stage === 'won')
  const closed = deals.filter((d) => ['won', 'lost'].includes(d.stage))
  const active = deals.filter((d) => !['won', 'lost'].includes(d.stage))
  const revenue = transactions.filter((x) => x.status === 'completed').reduce((s, x) => s + x.amount, 0)
  const commissionsPaid = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0)
  const commissionPending = commissions.filter((c) => c.status !== 'paid').reduce((s, c) => s + c.amount, 0)
  const winRate = closed.length ? Math.round((won.length / closed.length) * 100) : 0
  const conversion = leads.length ? Math.round((won.length / leads.length) * 100) : 0
  const avgDeal = deals.length ? Math.round(deals.reduce((s, d) => s + d.value, 0) / deals.length) : 0

  const monthly = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return d
    })
    return months.map((d) => {
      const key = d.toISOString().slice(0, 7)
      const tx = transactions.filter((x) => x.date.slice(0, 7) === key && x.status === 'completed')
      const created = deals.filter((x) => x.createdAt.slice(0, 7) === key)
      const monthWon = deals.filter((x) => x.stage === 'won' && x.updatedAt.slice(0, 7) === key)
      return { name: formatDate(d, lang, 'MMM'), revenue: tx.reduce((s, x) => s + x.amount, 0), deals: created.length, won: monthWon.length }
    })
  }, [transactions, deals, lang])

  const sourceRows = useMemo(() => Object.keys(sourceLabel).map((source) => {
    const sourceLeads = leads.filter((l) => l.source === source)
    const sourceWon = won.filter((d) => sourceLeads.some((l) => l.name === d.customerName))
    return {
      key: source, name: t(sourceLabel[source]), leads: sourceLeads.length, won: sourceWon.length,
      conversion: sourceLeads.length ? Math.round((sourceWon.length / sourceLeads.length) * 100) : 0,
      value: sourceWon.reduce((s, d) => s + d.value, 0),
    }
  }).filter((x) => x.leads > 0).sort((a, b) => b.leads - a.leads), [leads, won, t])

  const agentRows = useMemo(() => employees.filter((e) => e.role !== 'owner').map((e) => {
    const employeeDeals = deals.filter((d) => d.agentId === e.id)
    const employeeWon = employeeDeals.filter((d) => d.stage === 'won')
    return {
      employee: e, leads: leads.filter((l) => l.assigneeId === e.id).length, deals: employeeDeals.length, won: employeeWon.length,
      revenue: employeeWon.reduce((s, d) => s + d.value, 0), conversion: e.conversion,
      attainment: e.target ? Math.round((e.achieved / e.target) * 100) : 0,
    }
  }).filter((r) => !query || r.employee.name.toLowerCase().includes(query.toLowerCase())), [employees, deals, leads, query])

  const stageRows = pipelineStages.map((s) => {
    const stageDeals = deals.filter((d) => d.stage === s.id)
    return { id: s.id, name: t(stageLabels[s.id]), color: stageColors[s.id], count: stageDeals.length, value: stageDeals.reduce((sum, d) => sum + d.value, 0), weighted: stageDeals.reduce((sum, d) => sum + (d.value * d.probability) / 100, 0) }
  })

  const funnel = [
    { label: t('Leads'), value: leads.length, color: chartColors.navy },
    { label: t('Qualified'), value: leads.filter((l) => ['qualified', 'interested', 'viewing', 'negotiation', 'won'].includes(l.status)).length, color: chartColors.sky },
    { label: t('Viewings'), value: leads.filter((l) => ['viewing', 'negotiation', 'won'].includes(l.status)).length, color: chartColors.teal },
    { label: t('Negotiation'), value: leads.filter((l) => ['negotiation', 'won'].includes(l.status)).length, color: chartColors.amber },
    { label: t('Won'), value: won.length, color: chartColors.emerald },
  ]

  const revenueByType = (['sale', 'resale', 'rent'] as const).map((type) => ({
    name: t(type.replace(/\b\w/g, (c) => c.toUpperCase())),
    value: transactions.filter((x) => x.type === type && x.status === 'completed').reduce((s, x) => s + x.amount, 0),
  }))

  const exportReport = (name: string, rows: (string | number)[][]) => {
    downloadCsv(`${name}-${new Date().toISOString().slice(0, 10)}.csv`, rows)
    toast('Report exported', `${name} was downloaded as CSV for this demo.`)
  }

  const buildCustom = () => {
    const group = groupBy
    const map = new Map<string, { leads: number; deals: number; revenue: number }>()
    const bump = (key: string) => { if (!map.has(key)) map.set(key, { leads: 0, deals: 0, revenue: 0 }); return map.get(key)! }
    leads.forEach((l) => { bump(group === 'location' ? l.location : group === 'status' ? l.status : sourceLabel[l.source] ?? l.source).leads++ })
    deals.forEach((d) => {
      const lead = leads.find((l) => l.name === d.customerName)
      const key = group === 'location' ? lead?.location ?? 'Unknown' : group === 'status' ? d.stage : sourceLabel[lead?.source ?? 'website'] ?? 'Website'
      bump(key).deals++
      if (d.stage === 'won') bump(key).revenue += d.value
    })
    setReportRows([...map.entries()].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.revenue - a.revenue))
    toast('Custom report generated', `${map.size} groups · ${customType} view.`)
  }

  return (
    <div>
      <PageHeader
        title={t('CRM Intelligence')}
        description={t('Revenue, conversion and team performance reporting with CSV export.')}
        eyebrow={<><BarChart3 className="size-3.5 text-accent" /> {t('CRM')} · {t('Reports')}</>}
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onChange={(e) => { setPeriod(e.target.value); toast('Period updated', `Showing the last ${e.target.value} days in this demo.`, 'info') }} className="w-36">
              <option value="30">{t('Last 30 days')}</option>
              <option value="90">{t('Last 90 days')}</option>
              <option value="180">{t('Last 6 months')}</option>
              <option value="365">{t('Last 12 months')}</option>
            </Select>
            <Button variant="outline" onClick={() => exportReport('sales-report', [['Metric', 'Value'], ['Leads', leads.length], ['Open deals', active.length], ['Won deals', won.length], ['Revenue', revenue], ['Win rate', `${winRate}%`], ['Conversion', `${conversion}%`]])}><Download /> {t('Export')}</Button>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Closed revenue')} value={formatEGP(revenue, lang, true)} icon={Wallet} tone="green" delta={12} deltaLabel={t('vs previous period')} />
        <StatCard label={t('Win rate')} value={`${winRate}%`} icon={Target} tone="blue" hint={`${won.length} ${t('won')} · ${closed.length - won.length} ${t('lost')}`} />
        <StatCard label={t('Lead conversion')} value={`${conversion}%`} icon={TrendingUp} tone="amber" hint={`${leads.length} ${t('leads')} · ${won.length} ${t('won')}`} />
        <StatCard label={t('Average deal')} value={formatEGP(avgDeal, lang, true)} icon={BarChart3} tone="purple" hint={`${active.length} ${t('open opportunities')}`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition-colors', tab === x.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}><x.icon className="size-3.5" /> {t(x.label)}</button>
        ))}
      </div>

      {tab === 'sales' && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <ChartCard title={t('Revenue and won deals')} description={t('Six-month demo trend')} action={<Badge tone="green"><ArrowUpRight className="size-2.5" /> {t('Trending up')}</Badge>}>
              <TrendChart data={monthly.map((m) => ({ name: m.name, revenue: m.revenue, won: m.won * 1_000_000 }))} series={[{ key: 'revenue', label: t('Revenue'), color: chartColors.emerald }, { key: 'won', label: t('Won value'), color: chartColors.navy }]} height={250} />
            </ChartCard>
            <ChartCard title={t('Pipeline value')} description={t('Open opportunities by stage')}>
              <BarsChart vertical data={stageRows.filter((s) => s.id !== 'won').map((s) => ({ name: s.name, value: Math.round(s.value / 1_000_000) }))} series={[{ key: 'value', label: t('EGP millions'), color: chartColors.sky }]} height={250} />
            </ChartCard>
          </div>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div><p className="text-[13px] font-semibold">{t('Stage performance')}</p><p className="text-[10px] text-muted-foreground">{t('Deal count, gross value and probability-weighted forecast.')}</p></div>
              <Button size="xs" variant="ghost" onClick={() => exportReport('stage-performance', [['Stage', 'Deals', 'Value', 'Weighted'], ...stageRows.map((s) => [s.name, s.count, s.value, Math.round(s.weighted)])])}><Download /> {t('CSV')}</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-[12px]">
                <thead><tr className="border-b border-border bg-muted/30 text-start text-[9px] uppercase tracking-wide text-muted-foreground">{['Stage', 'Deals', 'Gross value', 'Weighted', 'Share'].map((h) => <th key={h} className="px-4 py-2 text-start font-semibold">{t(h)}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {stageRows.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5"><span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: s.color }} />{s.name}</span></td>
                      <td className="px-4 py-2.5 font-medium">{s.count}</td>
                      <td className="px-4 py-2.5">{formatEGP(s.value, lang, true)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatEGP(s.weighted, lang, true)}</td>
                      <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Progress value={deals.length ? (s.count / deals.length) * 100 : 0} className="w-20" /><span className="text-[10px] text-muted-foreground">{deals.length ? Math.round((s.count / deals.length) * 100) : 0}%</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'conversion' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <ChartCard title={t('Lead-to-deal funnel')} description={t('Unique leads reaching each milestone.')}>
            <FunnelChart stages={funnel} />
            <div className="mt-5 grid grid-cols-3 gap-2 px-2">
              {[['Lead → qualified', funnel[1].value / Math.max(1, funnel[0].value)], ['Qualified → won', funnel[4].value / Math.max(1, funnel[1].value)], ['Overall', funnel[4].value / Math.max(1, funnel[0].value)]].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-border p-2 text-center"><p className="text-[9px] text-muted-foreground">{t(String(label))}</p><p className="mt-0.5 text-[15px] font-semibold">{Math.round(Number(value) * 100)}%</p></div>
              ))}
            </div>
          </ChartCard>
          <div className="space-y-4">
            <ChartCard title={t('Conversion by source')} description={t('Won deals divided by leads acquired.')}>
              <BarsChart data={sourceRows.slice(0, 6).map((s) => ({ name: s.name, conversion: s.conversion }))} series={[{ key: 'conversion', label: t('Conversion %'), color: chartColors.emerald }]} height={220} />
            </ChartCard>
            <Card className="p-4">
              <SectionTitle title={t('Conversion diagnostics')} description={t('Where deals stall in this demo.')} />
              <div className="space-y-2.5 text-[11px]">
                {[
                  { label: t('No activity after first call'), value: leads.filter((l) => l.status === 'contacted').length, detail: t('Send a curated shortlist within 24 hours.') },
                  { label: t('Stalled in negotiation'), value: deals.filter((d) => d.stage === 'negotiation').length, detail: t('Offer a payment plan comparison.') },
                  { label: t('Lost on price'), value: deals.filter((d) => d.lostReason?.toLowerCase().includes('price')).length, detail: t('Review discount approval thresholds.') },
                ].map((x) => (
                  <div key={x.label} className="flex items-start justify-between gap-3 rounded-lg border border-border p-2.5"><div><p className="font-medium">{x.label}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{x.detail}</p></div><span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold">{x.value}</span></div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'sources' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <ChartCard title={t('Lead volume by source')} description={t('Acquisition mix for the active workspace.')}>
            <DonutChart data={sourceRows.map((s) => ({ name: s.name, value: s.leads }))} height={230} centerValue={String(leads.length)} centerLabel={t('leads')} />
            <div className="px-4 pb-2"><DonutLegend data={sourceRows.map((s) => ({ name: s.name, value: s.leads }))} colors={sourceColors} /></div>
          </ChartCard>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{t('Source efficiency')}</p><Button size="xs" variant="ghost" onClick={() => exportReport('source-analytics', [['Source', 'Leads', 'Won', 'Conversion %', 'Won value'], ...sourceRows.map((s) => [s.name, s.leads, s.won, s.conversion, s.value])])}><Download /> {t('CSV')}</Button></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-[12px]">
                <thead><tr className="bg-muted/30 text-[9px] uppercase tracking-wide text-muted-foreground">{['Source', 'Leads', 'Won', 'Conversion', 'Won value'].map((h) => <th key={h} className="px-4 py-2 text-start font-semibold">{t(h)}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {sourceRows.map((s) => (
                    <tr key={s.key} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{s.name}</td><td className="px-4 py-2.5">{s.leads}</td><td className="px-4 py-2.5">{s.won}</td>
                      <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Progress value={s.conversion} className="w-16" /><span className="text-[10px]">{s.conversion}%</span></div></td>
                      <td className="px-4 py-2.5">{formatEGP(s.value, lang, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'agents' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div><p className="text-[13px] font-semibold">{t('Agent performance')}</p><p className="text-[10px] text-muted-foreground">{t('Targets, pipeline, wins and conversion per consultant.')}</p></div>
            <div className="flex items-center gap-2"><SearchInput value={query} onChange={setQuery} placeholder={t('Search agents…')} className="w-56" /><Button size="xs" variant="ghost" onClick={() => exportReport('agent-performance', [['Agent', 'Leads', 'Deals', 'Won', 'Revenue', 'Attainment %'], ...agentRows.map((r) => [r.employee.name, r.leads, r.deals, r.won, r.revenue, r.attainment])])}><Download /> {t('CSV')}</Button></div>
          </div>
          {agentRows.length === 0 ? <DataTableEmpty title={t('No agents match')} /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-[12px]">
                <thead><tr className="bg-muted/30 text-[9px] uppercase tracking-wide text-muted-foreground">{['Agent', 'Leads', 'Open deals', 'Won', 'Revenue', 'Attainment'].map((h) => <th key={h} className="px-4 py-2 text-start font-semibold">{t(h)}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {agentRows.sort((a, b) => b.revenue - a.revenue).map((r) => (
                    <tr key={r.employee.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5"><span className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full text-[8px] font-bold text-white" style={{ background: r.employee.avatarColor }}>{r.employee.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span><span><span className="block font-medium">{r.employee.name}</span><span className="block text-[9px] text-muted-foreground">{r.employee.title}</span></span></span></td>
                      <td className="px-4 py-2.5">{r.leads}</td><td className="px-4 py-2.5">{r.deals - r.won}</td><td className="px-4 py-2.5 font-medium text-emerald-600">{r.won}</td>
                      <td className="px-4 py-2.5">{formatEGP(r.revenue, lang, true)}</td>
                      <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Progress value={r.attainment} tone={r.attainment >= 90 ? 'accent' : r.attainment >= 60 ? 'amber' : 'red'} className="w-20" /><span className="text-[10px] font-medium">{r.attainment}%</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'revenue' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label={t('Collected revenue')} value={formatEGP(revenue, lang, true)} icon={Wallet} tone="green" hint={`${transactions.filter((x) => x.status === 'completed').length} ${t('completed invoices')}`} />
            <StatCard label={t('Commission paid')} value={formatEGP(commissionsPaid, lang, true)} icon={Wallet} tone="blue" hint={`${commissions.filter((c) => c.status === 'paid').length} ${t('settled')}`} />
            <StatCard label={t('Commission pending')} value={formatEGP(commissionPending, lang, true)} icon={Wallet} tone="amber" hint={`${commissions.filter((c) => c.status !== 'paid').length} ${t('open')}`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <ChartCard title={t('Monthly collected revenue')} description={t('Completed transactions only.')}>
              <TrendChart data={monthly.map((m) => ({ name: m.name, revenue: m.revenue }))} series={[{ key: 'revenue', label: t('Revenue'), color: chartColors.emerald }]} height={260} />
            </ChartCard>
            <ChartCard title={t('Revenue by transaction type')}>
              <DonutChart data={revenueByType} height={220} centerValue={formatEGP(revenue, lang, true)} centerLabel={t('collected')} />
              <div className="px-4 pb-2"><DonutLegend data={revenueByType} /></div>
            </ChartCard>
          </div>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{t('Recent transactions')}</p><Button size="xs" variant="ghost" onClick={() => exportReport('revenue-transactions', [['Invoice', 'Customer', 'Property', 'Amount', 'Commission', 'Status', 'Date'], ...transactions.map((x) => [x.invoiceNo, x.customerName, x.propertyTitle, x.amount, x.commission, x.status, x.date])])}><Download /> {t('CSV')}</Button></div>
            <div className="divide-y divide-border">
              {transactions.slice(0, 8).map((x) => (
                <div key={x.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <Badge tone="outline">{x.invoiceNo}</Badge>
                  <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-medium">{x.customerName}</p><p className="text-[10px] text-muted-foreground">{x.propertyTitle}</p></div>
                  <span className="text-[12px] font-semibold">{formatEGP(x.amount, lang, true)}</span>
                  <span className="hidden text-[10px] text-muted-foreground sm:block">{formatDate(x.date, lang, 'dd MMM yyyy')}</span>
                  <StatusBadge status={x.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <ChartCard title={t('Weighted forecast by stage')} description={t('Probability applied to open deal value.')}>
            <BarsChart data={stageRows.filter((s) => s.id !== 'won').map((s) => ({ name: s.name, weighted: Math.round(s.weighted / 1_000_000), gross: Math.round(s.value / 1_000_000) }))} series={[{ key: 'gross', label: t('Gross value'), color: chartColors.slate }, { key: 'weighted', label: t('Weighted'), color: chartColors.emerald }]} height={260} />
          </ChartCard>
          <Card className="p-4">
            <SectionTitle title={t('Pipeline health')} description={t('Diagnostics from the current board.')} />
            <div className="space-y-3">
              {[
                { label: t('Open opportunities'), value: active.length, hint: formatEGP(active.reduce((s, d) => s + d.value, 0), lang, true) },
                { label: t('Weighted forecast'), value: formatEGP(active.reduce((s, d) => s + (d.value * d.probability) / 100, 0), lang, true), hint: t('Probability adjusted') },
                { label: t('Deals at risk'), value: active.filter((d) => Date.now() - new Date(d.lastActivity).getTime() > 10 * 86400000).length, hint: t('No activity for 10+ days') },
                { label: t('Average age'), value: `${Math.round(active.reduce((s, d) => s + (Date.now() - new Date(d.createdAt).getTime()) / 86400000, 0) / Math.max(1, active.length))}d`, hint: t('Open deals') },
              ].map((x) => (
                <div key={x.label} className="flex items-center justify-between rounded-lg border border-border p-2.5"><div><p className="text-[11px] text-muted-foreground">{x.label}</p><p className="text-[15px] font-semibold">{x.value}</p></div><span className="text-[10px] text-muted-foreground">{x.hint}</span></div>
              ))}
            </div>
          </Card>
          <Card className="overflow-hidden lg:col-span-2">
            <div className="border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{t('Deals needing attention')}</p></div>
            <div className="divide-y divide-border">
              {active.filter((d) => Date.now() - new Date(d.lastActivity).getTime() > 10 * 86400000).map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <Badge tone="outline">{d.code}</Badge>
                  <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-medium">{d.propertyTitle}</p><p className="text-[10px] text-muted-foreground">{d.customerName} · {t('Last activity')} {formatDate(d.lastActivity, lang, 'dd MMM')}</p></div>
                  <span className="text-[12px] font-semibold">{formatEGP(d.value, lang, true)}</span>
                  <StatusBadge status={d.stage} />
                </div>
              ))}
              {active.filter((d) => Date.now() - new Date(d.lastActivity).getTime() > 10 * 86400000).length === 0 && <div className="p-6 text-center text-[11px] text-muted-foreground">{t('No stalled deals — the pipeline is healthy.')}</div>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'custom' && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="p-4">
            <SectionTitle title={t('Report builder')} description={t('Pick a dataset and grouping.')} />
            <div className="space-y-3">
              <Field label={t('Report type')}>
                <Select value={customType} onChange={(e) => setCustomType(e.target.value)}>
                  <option value="lead-source">{t('Lead source performance')}</option>
                  <option value="agent">{t('Agent productivity')}</option>
                  <option value="pipeline">{t('Pipeline snapshot')}</option>
                </Select>
              </Field>
              <Field label={t('Group by')}>
                <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  <option value="source">{t('Lead source')}</option>
                  <option value="location">{t('Location')}</option>
                  <option value="status">{t('Status')}</option>
                </Select>
              </Field>
              <Field label={t('Period')}><Select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="30">{t('Last 30 days')}</option><option value="90">{t('Last 90 days')}</option><option value="365">{t('Last 12 months')}</option></Select></Field>
              <Button className="w-full" variant="accent" onClick={buildCustom}><Sparkles /> {t('Generate report')}</Button>
              <Button className="w-full" variant="outline" disabled={!reportRows} onClick={() => reportRows && exportReport('custom-report', [['Group', 'Leads', 'Deals', 'Revenue'], ...reportRows.map((r) => [r.label, r.leads, r.deals, r.revenue])])}><Download /> {t('Export CSV')}</Button>
              <p className="flex items-center gap-1.5 text-[9px] leading-relaxed text-muted-foreground"><SlidersHorizontal className="size-3" /> {t('The builder queries the local demo store only. No data leaves the browser.')}</p>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{reportRows ? t('Generated report') : t('Report preview')}</p><Badge tone="outline">{groupBy}</Badge></div>
            {reportRows ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-[12px]">
                  <thead><tr className="bg-muted/30 text-[9px] uppercase tracking-wide text-muted-foreground">{['Group', 'Leads', 'Deals', 'Won revenue'].map((h) => <th key={h} className="px-4 py-2 text-start font-semibold">{t(h)}</th>)}</tr></thead>
                  <tbody className="divide-y divide-border">
                    {reportRows.map((r) => (
                      <tr key={r.label} className="hover:bg-muted/30"><td className="px-4 py-2.5 font-medium capitalize">{r.label.replace(/_/g, ' ')}</td><td className="px-4 py-2.5">{r.leads}</td><td className="px-4 py-2.5">{r.deals}</td><td className="px-4 py-2.5">{formatEGP(r.revenue, lang, true)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <span className="grid size-12 place-items-center rounded-xl border border-border bg-muted/50 text-muted-foreground"><FileText className="size-5" /></span>
                <p className="mt-3 text-[13px] font-semibold">{t('Build your report')}</p>
                <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">{t('Choose a type and grouping, then generate a report from live demo data.')}</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
