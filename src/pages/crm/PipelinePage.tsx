import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, BadgeCheck, BarChart3, Bookmark, Check, ChevronRight, CircleDollarSign,
  Download, FileSignature, FileX2, GripVertical, Handshake, Layers, Lightbulb, Plus, ReceiptText,
  RotateCcw, Search, Sparkles, Target, TrendingUp, Trophy, Unlock, Wallet, X,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/appStore'
import { useTab } from '@/lib/useTab'
import { formatDate, formatEGP, fromNow } from '@/lib/format'
import { cn, downloadCsv } from '@/lib/utils'
import type { Deal, DealStage, PipelineId } from '@/types'
import { pipelineStages } from '@/data/seed'
import { PageHeader, StatCard, SearchInput, TableShell, InfoRow, SectionTitle, DataTableEmpty, SegmentedControl } from '@/components/shared'
import { ChartCard, BarsChart, DonutChart, FunnelChart, TrendChart, chartColors } from '@/components/charts'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input, Select, Textarea, Field } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown'
import { Avatar, EmptyState, Progress } from '@/components/ui/misc'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const tabs = [
  { id: 'board', label: 'Pipeline board', icon: Layers },
  { id: 'opportunities', label: 'Opportunities', icon: Lightbulb },
  { id: 'deals', label: 'All deals', icon: Handshake },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'reservations', label: 'Reservations', icon: Bookmark },
  { id: 'contracts', label: 'Contracts', icon: FileSignature },
  { id: 'lost', label: 'Lost deals', icon: FileX2 },
  { id: 'forecast', label: 'Forecast', icon: BarChart3 },
]

const stageLabels: Record<DealStage, string> = { new: 'New', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', reservation: 'Reservation', won: 'Won', lost: 'Lost' }
const stageColors: Record<DealStage, string> = {
  new: 'border-slate-300 dark:border-slate-600', qualified: 'border-sky-300 dark:border-sky-500/40', proposal: 'border-violet-300 dark:border-violet-500/40',
  negotiation: 'border-amber-300 dark:border-amber-500/40', reservation: 'border-emerald-300 dark:border-emerald-500/40', won: 'border-emerald-400 dark:border-emerald-500/60', lost: 'border-rose-300 dark:border-rose-500/40',
}
const pipelines: { id: PipelineId; label: string }[] = [
  { id: 'primary', label: 'Primary sales' }, { id: 'resale', label: 'Resale' }, { id: 'rental', label: 'Rentals' }, { id: 'commercial', label: 'Commercial' }, { id: 'developer', label: 'Developer sales' },
]

export function PipelinePage() {
  const { t } = useI18n()
  const { tab, setTab } = useTab('board')
  const role = useAppStore((s) => s.role)
  const activeCompanyId = useAppStore((s) => s.activeCompanyId)
  const allDeals = useAppStore((s) => s.deals)
  const employees = useAppStore(useShallow((s) => s.employees.filter((e) => e.companyId === s.activeCompanyId)))
  const properties = useAppStore((s) => s.properties)
  const transactionsAll = useAppStore((s) => s.transactions)
  const selectedPipeline = useAppStore((s) => s.selectedPipeline)
  const setSelectedPipeline = useAppStore((s) => s.setSelectedPipeline)
  const [openDeal, setOpenDeal] = useState<Deal | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)

  const agentScope = role === 'agent' ? 'e3' : null
  const deals = useMemo(() => allDeals.filter((d) => d.companyId === activeCompanyId && (!agentScope || d.agentId === agentScope)), [allDeals, activeCompanyId, agentScope])
  const transactions = transactionsAll.filter((tx) => tx.companyId === activeCompanyId && (!agentScope || tx.agentId === agentScope))
  const active = deals.filter((d) => !['won', 'lost'].includes(d.stage))
  const pipelineValue = active.reduce((s, d) => s + d.value, 0)
  const weighted = active.reduce((s, d) => s + (d.value * d.probability) / 100, 0)
  const won = deals.filter((d) => d.stage === 'won')
  const wonValue = won.reduce((s, d) => s + d.value, 0)
  const avgDeal = deals.length ? Math.round(deals.reduce((s, d) => s + d.value, 0) / deals.length) : 0
  const winRate = deals.filter((d) => ['won', 'lost'].includes(d.stage)).length ? Math.round((won.length / deals.filter((d) => ['won', 'lost'].includes(d.stage)).length) * 100) : 0

  return (
    <div>
      <PageHeader
        title={t('Sales Pipelines')}
        description={t('Move opportunities from inquiry to signed reservation. Drag cards between stages to update the deal in this demo.')}
        eyebrow={<><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-accent" /> {active.length} {t('active opportunities')}</span><span>·</span><span>{formatEGP(pipelineValue, 'en', true)} {t('open value')}</span></>}
        actions={<><Button variant="outline" size="sm" onClick={() => downloadCsv('pipeline.csv', [['Code', 'Customer', 'Property', 'Value', 'Stage', 'Probability', 'Agent', 'Expected close'], ...deals.map((d) => [d.code, d.customerName, d.propertyTitle, d.value, d.stage, d.probability, employees.find((e) => e.id === d.agentId)?.name ?? '', d.expectedClose])])}><Download className="size-3.5" /> {t('Export')}</Button><Button size="sm" onClick={() => setNewOpen(true)}><Plus className="size-3.5" /> {t('New opportunity')}</Button></>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Open pipeline')} value={formatEGP(pipelineValue, 'en', true)} icon={Layers} tone="navy" hint={`${active.length} ${t('active opportunities')}`} />
        <StatCard label={t('Weighted forecast')} value={formatEGP(weighted, 'en', true)} icon={Target} tone="blue" hint={t('Probability adjusted')} />
        <StatCard label={t('Won this period')} value={formatEGP(wonValue, 'en', true)} icon={Trophy} tone="green" hint={`${won.length} ${t('closed won')}`} />
        <StatCard label={t('Win rate')} value={`${winRate}%`} icon={TrendingUp} tone="amber" hint={`${t('Avg. deal')} ${formatEGP(avgDeal, 'en', true)}`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((x) => {
            const Icon = x.icon
            return (
              <button key={x.id} onClick={() => setTab(x.id)} className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition-colors', (tab === x.id || (tab === '' && x.id === 'board')) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
                <Icon className="size-3.5" /> {t(x.label)}
              </button>
            )
          })}
        </div>
        {tab === 'board' && (
          <Select value={selectedPipeline} onChange={(e) => setSelectedPipeline(e.target.value)} className="h-9 w-auto min-w-[170px]">
            {pipelines.map((p) => <option key={p.id} value={p.id}>{t(p.label)}</option>)}
          </Select>
        )}
      </div>

      {(tab === 'board' || tab === '') && (
        <PipelineBoard deals={deals.filter((d) => d.pipelineId === selectedPipeline)} employees={employees} dragging={dragging} setDragging={setDragging} onOpen={setOpenDeal} />
      )}
      {tab === 'opportunities' && <DealsTab deals={active} employees={employees} properties={properties} onOpen={setOpenDeal} title="Active opportunities" description="Every deal still in play, sorted by expected close." />}
      {tab === 'deals' && <DealsTab deals={deals} employees={employees} properties={properties} onOpen={setOpenDeal} title="All deals" description="Complete deal history for this workspace." showStageFilter />}
      {tab === 'transactions' && <TransactionsTab transactions={transactions} employees={employees} />}
      {tab === 'reservations' && <ReservationsTab deals={deals.filter((d) => d.stage === 'reservation' || d.reservationStatus !== 'none')} properties={properties} employees={employees} onOpen={setOpenDeal} />}
      {tab === 'contracts' && <ContractsTab deals={deals.filter((d) => d.contractStatus !== 'none' || d.stage === 'won')} employees={employees} onOpen={setOpenDeal} />}
      {tab === 'lost' && <LostTab deals={deals.filter((d) => d.stage === 'lost')} employees={employees} onOpen={setOpenDeal} />}
      {tab === 'forecast' && <ForecastTab deals={deals} employees={employees} />}

      <DealDetailDialog deal={openDeal} onOpenChange={(v) => !v && setOpenDeal(null)} />
      <NewDealDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}

function PipelineBoard({ deals, employees, dragging, setDragging, onOpen }: { deals: Deal[]; employees: ReturnType<typeof useAppStore.getState>['employees']; dragging: string | null; setDragging: (v: string | null) => void; onOpen: (d: Deal) => void }) {
  const { t } = useI18n()
  const moveDeal = useAppStore((s) => s.moveDeal)
  const toast = useAppStore((s) => s.toast)
  const columns = [...pipelineStages.map((s) => ({ id: s.id as DealStage, label: s.label, probability: s.probability })), { id: 'lost' as DealStage, label: 'Lost', probability: 0 }]

  const drop = (stage: DealStage) => {
    if (!dragging) return
    const result = moveDeal(dragging, stage)
    toast(result.ok ? 'Deal moved' : 'Cannot move deal', result.message, result.ok ? 'success' : 'error')
    setDragging(null)
  }

  return (
    <div className="thin-scrollbar -mx-1 overflow-x-auto pb-2">
      <div className="flex min-w-[1120px] gap-3 px-1">
        {columns.map((col) => {
          const rows = deals.filter((d) => d.stage === col.id)
          const value = rows.reduce((s, d) => s + d.value, 0)
          const meta = pipelineStages.find((s) => s.id === col.id)
          return (
            <div key={col.id} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(col.id)} className={cn('flex w-[215px] shrink-0 flex-col rounded-xl border bg-muted/20', stageColors[col.id], dragging ? 'border-dashed' : '')}>
              <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2.5">
                <div className="flex items-center gap-1.5"><span className="text-[11px] font-semibold">{t(col.label)}</span><span className="rounded bg-muted px-1.5 text-[9px] text-muted-foreground">{rows.length}</span></div>
                <span className="text-[9px] text-muted-foreground">{meta ? `${meta.probability}%` : '—'}</span>
              </div>
              <div className="px-3 py-1.5 text-[9px] font-medium text-muted-foreground">{formatEGP(value, 'en', true)}</div>
              <div className="thin-scrollbar min-h-[120px] flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                {rows.length === 0 && <div className="rounded-lg border border-dashed border-border p-4 text-center text-[10px] text-muted-foreground">{t('Drop a deal here')}</div>}
                {rows.map((deal) => {
                  const agent = employees.find((e) => e.id === deal.agentId)
                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDragging(deal.id)}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => onOpen(deal)}
                      className={cn('group cursor-pointer rounded-lg border border-border bg-card p-2.5 shadow-card transition-all hover:border-slate-300 hover:shadow-pop dark:hover:border-slate-600', dragging === deal.id && 'opacity-50')}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[10px] font-medium text-muted-foreground">{deal.code}</p>
                        <GripVertical className="size-3 text-muted-foreground/50" />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug">{deal.propertyTitle}</p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{deal.customerName}</p>
                      <p className="mt-1.5 text-[12px] font-semibold tabular-nums">{formatEGP(deal.value, 'en', true)}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">{agent && <Avatar name={agent.name} color={agent.avatarColor} size="xs" />}<span className="text-[9px] text-muted-foreground">{formatDate(deal.expectedClose, 'en', 'dd MMM')}</span></div>
                        <Badge tone={deal.probability >= 70 ? 'green' : deal.probability >= 40 ? 'amber' : 'default'} className="text-[9px]">{deal.probability}%</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DealsTab({ deals, employees, onOpen, title, description, showStageFilter }: { deals: Deal[]; employees: ReturnType<typeof useAppStore.getState>['employees']; properties: ReturnType<typeof useAppStore.getState>['properties']; onOpen: (d: Deal) => void; title: string; description: string; showStageFilter?: boolean }) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [stage, setStage] = useState('all')
  const [agent, setAgent] = useState('all')
  const rows = useMemo(() => deals.filter((d) => {
    const term = q.toLowerCase()
    if (term && ![d.code, d.customerName, d.propertyTitle].join(' ').toLowerCase().includes(term)) return false
    if (showStageFilter && stage !== 'all' && d.stage !== stage) return false
    if (agent !== 'all' && d.agentId !== agent) return false
    return true
  }).sort((a, b) => new Date(a.expectedClose).getTime() - new Date(b.expectedClose).getTime()), [deals, q, stage, agent, showStageFilter])

  return (
    <TableShell header={
      <div className="flex w-full flex-wrap items-center gap-2">
        <div><p className="text-[13px] font-semibold">{t(title)}</p><p className="text-[10px] text-muted-foreground">{t(description)}</p></div>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder={t('Search deals…')} className="w-48" />
          {showStageFilter && <Select value={stage} onChange={(e) => setStage(e.target.value)} className="h-9 w-auto"><option value="all">{t('All stages')}</option>{[...pipelineStages.map((s) => s.id), 'lost'].map((s) => <option key={s} value={s}>{t(stageLabels[s as DealStage])}</option>)}</Select>}
          <Select value={agent} onChange={(e) => setAgent(e.target.value)} className="h-9 w-auto"><option value="all">{t('All agents')}</option>{employees.filter((e) => e.role === 'agent').map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select>
          <Button size="sm" variant="outline" onClick={() => downloadCsv('deals.csv', [['Code', 'Customer', 'Property', 'Value', 'Stage', 'Probability'], ...rows.map((d) => [d.code, d.customerName, d.propertyTitle, d.value, d.stage, d.probability])])}><Download className="size-3.5" /> {t('Export')}</Button>
        </div>
      </div>
    }>
      {rows.length === 0 ? <DataTableEmpty title={t('No deals found')} description={t('Try adjusting the search or stage filter.')} /> : (
        <Table>
          <TableHeader><TableRow><TableHead>{t('Deal')}</TableHead><TableHead>{t('Customer')}</TableHead><TableHead>{t('Property')}</TableHead><TableHead>{t('Value')}</TableHead><TableHead>{t('Stage')}</TableHead><TableHead>{t('Probability')}</TableHead><TableHead>{t('Agent')}</TableHead><TableHead>{t('Close date')}</TableHead><TableHead className="w-8" /></TableRow></TableHeader>
          <TableBody>{rows.map((d) => {
            const agentRow = employees.find((e) => e.id === d.agentId)
            return (
              <TableRow key={d.id} className="cursor-pointer" onClick={() => onOpen(d)}>
                <TableCell className="font-medium">{d.code}</TableCell>
                <TableCell>{d.customerName}</TableCell>
                <TableCell className="max-w-[230px] truncate">{d.propertyTitle}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{formatEGP(d.value, 'en', true)}</TableCell>
                <TableCell><StatusBadge status={d.stage} /></TableCell>
                <TableCell><div className="flex items-center gap-2"><Progress value={d.probability} className="w-14" tone={d.probability >= 70 ? 'accent' : 'amber'} /><span className="text-[10px] text-muted-foreground">{d.probability}%</span></div></TableCell>
                <TableCell>{agentRow ? <span className="flex items-center gap-1.5 text-[11px]"><Avatar name={agentRow.name} color={agentRow.avatarColor} size="xs" />{agentRow.name.split(' ')[0]}</span> : '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-[11px] text-muted-foreground">{formatDate(d.expectedClose, 'en', 'dd MMM')}</TableCell>
                <TableCell><ChevronRight className="size-3.5 text-muted-foreground rtl:rotate-180" /></TableCell>
              </TableRow>
            )
          })}</TableBody>
        </Table>
      )}
    </TableShell>
  )
}

function TransactionsTab({ transactions, employees }: { transactions: ReturnType<typeof useAppStore.getState>['transactions']; employees: ReturnType<typeof useAppStore.getState>['employees'] }) {
  const { t } = useI18n()
  const updateTransactionStatus = useAppStore((s) => s.updateTransactionStatus)
  const [status, setStatus] = useState('all')
  const rows = transactions.filter((x) => status === 'all' || x.status === status)
  const overdue = transactions.filter((x) => x.status === 'overdue').reduce((s, x) => s + x.amount, 0)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('Completed volume')} value={formatEGP(transactions.filter((x) => x.status === 'completed').reduce((s, x) => s + x.amount, 0), 'en', true)} icon={CircleDollarSign} tone="green" hint={`${transactions.filter((x) => x.status === 'completed').length} ${t('settled invoices')}`} />
        <StatCard label={t('Pending volume')} value={formatEGP(transactions.filter((x) => x.status === 'pending').reduce((s, x) => s + x.amount, 0), 'en', true)} icon={Wallet} tone="amber" hint={`${transactions.filter((x) => x.status === 'pending').length} ${t('invoices to collect')}`} />
        <StatCard label={t('Overdue')} value={formatEGP(overdue, 'en', true)} icon={AlertTriangle} tone="purple" hint={t('Needs finance follow-up')} />
      </div>
      <TableShell header={<div className="flex w-full flex-wrap items-center gap-2"><p className="text-[13px] font-semibold">{t('Transactions')}</p><div className="ms-auto flex gap-2"><Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-auto"><option value="all">{t('All statuses')}</option>{['completed', 'pending', 'overdue'].map((s) => <option key={s} value={s}>{s}</option>)}</Select><Button size="sm" variant="outline" onClick={() => downloadCsv('transactions.csv', [['Invoice', 'Customer', 'Property', 'Amount', 'Commission', 'Status', 'Date'], ...rows.map((x) => [x.invoiceNo, x.customerName, x.propertyTitle, x.amount, x.commission, x.status, x.date])])}><Download className="size-3.5" /> {t('Export')}</Button></div></div>}>
        <Table>
          <TableHeader><TableRow><TableHead>{t('Invoice')}</TableHead><TableHead>{t('Customer')}</TableHead><TableHead>{t('Property')}</TableHead><TableHead>{t('Amount')}</TableHead><TableHead>{t('Commission')}</TableHead><TableHead>{t('Agent')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead>{t('Date')}</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{rows.map((x) => (
            <TableRow key={x.id}>
              <TableCell className="font-medium">{x.invoiceNo}</TableCell>
              <TableCell>{x.customerName}</TableCell>
              <TableCell className="max-w-[200px] truncate">{x.propertyTitle}</TableCell>
              <TableCell className="whitespace-nowrap">{formatEGP(x.amount, 'en', true)}</TableCell>
              <TableCell className="whitespace-nowrap text-emerald-600 dark:text-emerald-400">{formatEGP(x.commission, 'en', true)}</TableCell>
              <TableCell className="text-[11px] text-muted-foreground">{employees.find((e) => e.id === x.agentId)?.name ?? '—'}</TableCell>
              <TableCell><StatusBadge status={x.status} /></TableCell>
              <TableCell className="whitespace-nowrap text-[11px] text-muted-foreground">{formatDate(x.date, 'en', 'dd MMM yyyy')}</TableCell>
              <TableCell>{x.status !== 'completed' && <Button size="xs" variant="outline" onClick={() => updateTransactionStatus(x.id, 'completed')}><Check className="size-3" /> {t('Mark paid')}</Button>}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </TableShell>
    </div>
  )
}

function ReservationsTab({ deals, properties, employees, onOpen }: { deals: Deal[]; properties: ReturnType<typeof useAppStore.getState>['properties']; employees: ReturnType<typeof useAppStore.getState>['employees']; onOpen: (d: Deal) => void }) {
  const { t } = useI18n()
  const setPropertyStatus = useAppStore((s) => s.setPropertyStatus)
  const updateDeal = useAppStore((s) => s.updateDeal)
  const toast = useAppStore((s) => s.toast)
  return (
    <div className="space-y-4">
      <Card className="border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
        <div className="flex items-start gap-3"><Bookmark className="mt-0.5 size-4 text-emerald-600" /><div><p className="text-[13px] font-semibold">{t('Reservation protection')}</p><p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{t('The demo blocks double reservations: a unit can only move to reservation while it is available. Releasing a reservation makes the property available again.')}</p></div></div>
      </Card>
      <TableShell header={<p className="text-[13px] font-semibold">{deals.length} {t('reservations')}</p>}>
        {deals.length === 0 ? <DataTableEmpty title={t('No reservations yet')} description={t('Move an opportunity to the reservation stage to see it here.')} /> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t('Deal')}</TableHead><TableHead>{t('Customer')}</TableHead><TableHead>{t('Property')}</TableHead><TableHead>{t('Value')}</TableHead><TableHead>{t('Unit status')}</TableHead><TableHead>{t('Contract')}</TableHead><TableHead className="text-end">{t('Actions')}</TableHead></TableRow></TableHeader>
            <TableBody>{deals.map((d) => {
              const p = properties.find((x) => x.id === d.propertyId)
              return (
                <TableRow key={d.id}>
                  <TableCell><button onClick={() => onOpen(d)} className="font-medium hover:text-accent">{d.code}</button></TableCell>
                  <TableCell>{d.customerName}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{d.propertyTitle}</TableCell>
                  <TableCell>{formatEGP(d.value, 'en', true)}</TableCell>
                  <TableCell><StatusBadge status={p?.status ?? 'reserved'} /></TableCell>
                  <TableCell><StatusBadge status={d.contractStatus === 'signed' ? 'signed' : d.contractStatus === 'draft' ? 'pending' : 'new'} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button size="xs" variant="outline" onClick={() => {
                        const res = setPropertyStatus(d.propertyId, 'available')
                        if (res.ok) updateDeal(d.id, { stage: 'negotiation', reservationStatus: 'none', probability: 65 })
                        toast(res.ok ? 'Reservation released' : 'Could not release', res.message, res.ok ? 'info' : 'error')
                      }}><Unlock className="size-3" /> {t('Release')}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}</TableBody>
          </Table>
        )}
      </TableShell>
    </div>
  )
}

function ContractsTab({ deals, employees, onOpen }: { deals: Deal[]; employees: ReturnType<typeof useAppStore.getState>['employees']; onOpen: (d: Deal) => void }) {
  const { t } = useI18n()
  const updateDeal = useAppStore((s) => s.updateDeal)
  return (
    <TableShell header={<p className="text-[13px] font-semibold">{t('Contracts and signatures')}</p>}>
      {deals.length === 0 ? <DataTableEmpty title={t('No contracts')} description={t('Generate a contract from a reservation to see it here.')} /> : (
        <Table>
          <TableHeader><TableRow><TableHead>{t('Deal')}</TableHead><TableHead>{t('Customer')}</TableHead><TableHead>{t('Property')}</TableHead><TableHead>{t('Value')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead>{t('Agent')}</TableHead><TableHead className="text-end">{t('Action')}</TableHead></TableRow></TableHeader>
          <TableBody>{deals.map((d) => (
            <TableRow key={d.id}>
              <TableCell><button onClick={() => onOpen(d)} className="font-medium hover:text-accent">{d.code}</button></TableCell>
              <TableCell>{d.customerName}</TableCell>
              <TableCell className="max-w-[220px] truncate">{d.propertyTitle}</TableCell>
              <TableCell>{formatEGP(d.value, 'en', true)}</TableCell>
              <TableCell><Badge tone={d.contractStatus === 'signed' ? 'green' : 'amber'}>{d.contractStatus === 'signed' ? t('Signed') : t('Draft')}</Badge></TableCell>
              <TableCell className="text-[11px] text-muted-foreground">{employees.find((e) => e.id === d.agentId)?.name}</TableCell>
              <TableCell className="text-end">{d.contractStatus !== 'signed' ? <Button size="xs" onClick={() => updateDeal(d.id, { contractStatus: 'signed' })}><FileSignature className="size-3" /> {t('Mark signed')}</Button> : <Badge tone="green"><BadgeCheck className="size-3" /> {t('Executed')}</Badge>}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </TableShell>
  )
}

function LostTab({ deals, employees, onOpen }: { deals: Deal[]; employees: ReturnType<typeof useAppStore.getState>['employees']; onOpen: (d: Deal) => void }) {
  const { t } = useI18n()
  const moveDeal = useAppStore((s) => s.moveDeal)
  const toast = useAppStore((s) => s.toast)
  const reasons = useMemo(() => {
    const map = new Map<string, number>()
    deals.forEach((d) => map.set(d.lostReason ?? 'Other', (map.get(d.lostReason ?? 'Other') ?? 0) + 1))
    return [...map.entries()]
  }, [deals])
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <TableShell header={<p className="text-[13px] font-semibold">{deals.length} {t('lost deals')}</p>}>
        {deals.length === 0 ? <DataTableEmpty title={t('No lost deals')} description={t('Great — every opportunity is still in play.')} /> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t('Deal')}</TableHead><TableHead>{t('Customer')}</TableHead><TableHead>{t('Value')}</TableHead><TableHead>{t('Reason')}</TableHead><TableHead>{t('Agent')}</TableHead><TableHead className="text-end">{t('Action')}</TableHead></TableRow></TableHeader>
            <TableBody>{deals.map((d) => (
              <TableRow key={d.id}>
                <TableCell><button onClick={() => onOpen(d)} className="font-medium hover:text-accent">{d.code}</button><p className="max-w-[200px] truncate text-[10px] text-muted-foreground">{d.propertyTitle}</p></TableCell>
                <TableCell>{d.customerName}</TableCell>
                <TableCell>{formatEGP(d.value, 'en', true)}</TableCell>
                <TableCell><span className="text-[11px] text-muted-foreground">{d.lostReason ?? '—'}</span></TableCell>
                <TableCell className="text-[11px] text-muted-foreground">{employees.find((e) => e.id === d.agentId)?.name}</TableCell>
                <TableCell className="text-end"><Button size="xs" variant="outline" onClick={() => { moveDeal(d.id, 'qualified'); toast('Deal reopened', `${d.code} moved back to qualified.`) }}><RotateCcw className="size-3" /> {t('Reopen')}</Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </TableShell>
      <Card className="p-5">
        <SectionTitle title={t('Lost reasons')} description={t('Learnings from closed-lost opportunities.')} />
        <div className="space-y-3">
          {reasons.map(([reason, count], i) => <div key={reason}><div className="mb-1 flex justify-between gap-2 text-[11px]"><span className="truncate">{reason}</span><span className="text-muted-foreground">{count}</span></div><Progress value={(count / Math.max(1, deals.length)) * 100} tone={i === 0 ? 'red' : 'amber'} /></div>)}
        </div>
        <div className="mt-4 rounded-lg bg-muted/50 p-3 text-[10px] leading-relaxed text-muted-foreground">{t('Reopen a deal when the customer re-engages. The demo keeps the original lost reason in the record history.')}</div>
      </Card>
    </div>
  )
}

function ForecastTab({ deals, employees }: { deals: Deal[]; employees: ReturnType<typeof useAppStore.getState>['employees'] }) {
  const { t } = useI18n()
  const active = deals.filter((d) => !['won', 'lost'].includes(d.stage))
  const weighted = active.reduce((s, d) => s + (d.value * d.probability) / 100, 0)
  const committed = active.filter((d) => d.probability >= 70).reduce((s, d) => s + d.value, 0)
  const bestCase = active.reduce((s, d) => s + d.value, 0)
  const target = employees.reduce((s, e) => s + e.target, 0)
  const achieved = employees.reduce((s, e) => s + e.achieved, 0)
  const gap = Math.max(0, target - achieved - weighted)
  const stageData = pipelineStages.filter((s) => s.id !== 'won').map((s) => ({ name: t(stageLabels[s.id]), value: active.filter((d) => d.stage === s.id).reduce((x, d) => x + d.value, 0) }))
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() + i)
    const label = d.toLocaleDateString('en', { month: 'short' })
    const rows = active.filter((x) => { const e = new Date(x.expectedClose); return e.getMonth() === d.getMonth() && e.getFullYear() === d.getFullYear() })
    return { name: label, committed: Math.round(rows.filter((x) => x.probability >= 70).reduce((s, x) => s + x.value, 0) / 1_000_000), weighted: Math.round(rows.reduce((s, x) => s + (x.value * x.probability) / 100, 0) / 1_000_000) }
  })
  const atRisk = active.filter((d) => new Date(d.expectedClose).getTime() < Date.now() + 7 * 86400000 && d.probability < 50)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Weighted forecast')} value={formatEGP(weighted, 'en', true)} icon={Target} tone="blue" hint={t('Probability adjusted')} />
        <StatCard label={t('Committed')} value={formatEGP(committed, 'en', true)} icon={BadgeCheck} tone="green" hint={t('70%+ probability')} />
        <StatCard label={t('Best case')} value={formatEGP(bestCase, 'en', true)} icon={TrendingUp} tone="navy" hint={t('All open opportunities')} />
        <StatCard label={t('Gap to target')} value={formatEGP(gap, 'en', true)} icon={AlertTriangle} tone="amber" hint={`${Math.round((achieved / Math.max(1, target)) * 100)}% ${t('achieved')}`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={t('Six-month forecast')} description={t('Committed and weighted pipeline by expected close month (EGP M).')}><TrendChart data={monthly} series={[{ key: 'committed', label: t('Committed'), color: chartColors.emerald }, { key: 'weighted', label: t('Weighted'), color: chartColors.navy }]} height={260} /></ChartCard>
        <ChartCard title={t('Open value by stage')} description={t('Where forecast value sits today.')}><BarsChart data={stageData} series={[{ key: 'value', label: t('Open value'), color: chartColors.sky }]} height={260} vertical /></ChartCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <TableShell header={<p className="text-[13px] font-semibold">{t('At-risk opportunities')}</p>}>
          {atRisk.length === 0 ? <EmptyState icon={Trophy} title={t('No at-risk deals')} description={t('No low-probability deals are closing in the next seven days.')} /> : (
            <Table>
              <TableHeader><TableRow><TableHead>{t('Deal')}</TableHead><TableHead>{t('Value')}</TableHead><TableHead>{t('Probability')}</TableHead><TableHead>{t('Close date')}</TableHead><TableHead>{t('Agent')}</TableHead></TableRow></TableHeader>
              <TableBody>{atRisk.map((d) => <TableRow key={d.id}><TableCell className="font-medium">{d.code}<p className="text-[10px] text-muted-foreground">{d.customerName}</p></TableCell><TableCell>{formatEGP(d.value, 'en', true)}</TableCell><TableCell><Badge tone="red">{d.probability}%</Badge></TableCell><TableCell className="text-[11px] text-muted-foreground">{formatDate(d.expectedClose, 'en', 'dd MMM')}</TableCell><TableCell className="text-[11px] text-muted-foreground">{employees.find((e) => e.id === d.agentId)?.name}</TableCell></TableRow>)}</TableBody>
            </Table>
          )}
        </TableShell>
        <Card className="p-5">
          <SectionTitle title={t('Target attainment')} />
          <DonutChart data={[{ name: t('Achieved'), value: Math.round(achieved / 1_000_000) }, { name: t('Remaining'), value: Math.max(1, Math.round((target - achieved) / 1_000_000)) }]} centerValue={`${Math.round((achieved / Math.max(1, target)) * 100)}%`} centerLabel={t('of target')} height={180} colors={[chartColors.emerald, chartColors.slate]} />
          <div className="mt-4 space-y-2 text-[11px]"><div className="flex justify-between"><span className="text-muted-foreground">{t('Annual target')}</span><span className="font-medium">{formatEGP(target, 'en', true)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t('Achieved')}</span><span className="font-medium text-emerald-600 dark:text-emerald-400">{formatEGP(achieved, 'en', true)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t('Weighted pipeline')}</span><span className="font-medium">{formatEGP(weighted, 'en', true)}</span></div></div>
          <div className="mt-4 rounded-lg border border-amber-200/60 bg-amber-50/60 p-3 text-[10px] leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">{t('Forecast is generated from local demo deals and team targets. It is not connected to a real forecasting service.')}</div>
        </Card>
      </div>
    </div>
  )
}

function DealDetailDialog({ deal, onOpenChange }: { deal: Deal | null; onOpenChange: (v: boolean) => void }) {
  const { t } = useI18n()
  const employees = useAppStore((s) => s.employees)
  const properties = useAppStore((s) => s.properties)
  const moveDeal = useAppStore((s) => s.moveDeal)
  const updateDeal = useAppStore((s) => s.updateDeal)
  const toast = useAppStore((s) => s.toast)
  const [lostReason, setLostReason] = useState('')
  const [lostOpen, setLostOpen] = useState(false)
  if (!deal) return null
  const prop = properties.find((p) => p.id === deal.propertyId)
  const agent = employees.find((e) => e.id === deal.agentId)

  const advance = (stage: DealStage) => {
    const result = moveDeal(deal.id, stage)
    toast(result.ok ? 'Deal updated' : 'Cannot update deal', result.message, result.ok ? 'success' : 'error')
  }

  return (
    <Dialog open={!!deal} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{deal.code} <StatusBadge status={deal.stage} /></DialogTitle>
          <DialogDescription>{deal.propertyTitle} · {deal.customerName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('Deal value')}</p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.02em]">{formatEGP(deal.value)}</p>
            <div className="mt-3"><div className="mb-1 flex justify-between text-[10px] text-muted-foreground"><span>{t('Probability')}</span><span>{deal.probability}%</span></div><Progress value={deal.probability} tone={deal.probability >= 70 ? 'accent' : 'amber'} /></div>
          </Card>
          <div className="rounded-xl border border-border p-4">
            <div className="divide-y divide-border">
              <InfoRow label={t('Customer')} value={deal.customerName} />
              <InfoRow label={t('Agent')} value={agent?.name ?? '—'} />
              <InfoRow label={t('Expected close')} value={formatDate(deal.expectedClose, 'en', 'dd MMM yyyy')} />
              <InfoRow label={t('Commission')} value={`${deal.commissionPct}%`} />
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-2"><p className="text-[12px] font-semibold">{t('Move stage')}</p><Badge tone="outline">{t(stageLabels[deal.stage])}</Badge></div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pipelineStages.map((s) => <Button key={s.id} size="xs" variant={deal.stage === s.id ? 'default' : 'outline'} onClick={() => advance(s.id as DealStage)} disabled={deal.stage === s.id}>{t(stageLabels[s.id])}</Button>)}
            <Button size="xs" variant={deal.stage === 'lost' ? 'danger' : 'danger-soft'} onClick={() => setLostOpen(true)} disabled={deal.stage === 'lost'}><X className="size-3" /> {t('Mark lost')}</Button>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Button variant="outline" size="sm" onClick={() => { updateDeal(deal.id, { contractStatus: 'draft', reservationStatus: 'pending' }); toast('Contract draft created', 'A demo contract draft is ready for review.') }}><FileSignature className="size-3.5" /> {t('Generate contract draft')}</Button>
          <Button variant="outline" size="sm" onClick={() => { updateDeal(deal.id, { reservationStatus: 'confirmed' }); toast('Reservation confirmed', `${prop?.title ?? 'Property'} is marked as reserved.`) }}><Bookmark className="size-3.5" /> {t('Confirm reservation')}</Button>
        </div>
        {prop && <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-border p-2.5"><img src={prop.images[0]} alt="" className="size-11 rounded-md object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium">{prop.title}</p><p className="text-[10px] text-muted-foreground">{formatEGP(prop.price, 'en', true)} · {prop.location} · <span className="capitalize">{prop.status}</span></p></div><Link to={`/properties/${prop.id}`} className="text-[10px] font-medium text-accent hover:underline">{t('Open listing')}</Link></div>}
        {lostOpen && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-500/20 dark:bg-rose-500/10">
            <p className="text-[11px] font-medium">{t('Why was this deal lost?')}</p>
            <div className="mt-2 flex gap-2"><Input value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder={t('e.g. Chose a competitor')} /><Button size="sm" variant="danger" onClick={() => { updateDeal(deal.id, { stage: 'lost', lostReason: lostReason || 'Not specified', probability: 0 }); setLostOpen(false); setLostReason(''); toast('Deal marked lost', 'The lost reason was saved for reporting.', 'info') }}>{t('Confirm')}</Button></div>
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>{t('Close')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewDealDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useI18n()
  const employees = useAppStore(useShallow((s) => s.employees.filter((e) => e.companyId === s.activeCompanyId)))
  const properties = useAppStore(useShallow((s) => s.properties.filter((p) => p.companyId === s.activeCompanyId)))
  const customers = useAppStore(useShallow((s) => s.customers.filter((c) => c.companyId === s.activeCompanyId)))
  const addDeal = useAppStore((s) => s.addDeal)
  const [customerId, setCustomerId] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [value, setValue] = useState(0)
  const [stage, setStage] = useState<DealStage>('qualified')
  const [pipelineId, setPipelineId] = useState<PipelineId>('primary')
  const [agentId, setAgentId] = useState(employees.find((e) => e.role === 'agent')?.id ?? employees[0]?.id ?? 'e3')
  const [probability, setProbability] = useState(35)
  const [expectedClose, setExpectedClose] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))

  const chooseProperty = (id: string) => {
    setPropertyId(id)
    const p = properties.find((x) => x.id === id)
    if (p) { setValue(p.price); setPipelineId(p.listingType === 'resale' ? 'resale' : p.listingType === 'rent' ? 'rental' : 'primary') }
  }

  const save = () => {
    const customer = customers.find((c) => c.id === customerId)
    const property = properties.find((p) => p.id === propertyId)
    if (!customer || !property || value <= 0) return
    addDeal({
      id: `dl${Date.now()}`, code: `DL-${Math.floor(2500 + Math.random() * 400)}`, companyId: property.companyId, customerId: customer.id,
      customerName: customer.name, propertyId: property.id, propertyTitle: property.title, value, stage, pipelineId, agentId,
      developerId: property.developerId, probability, expectedClose: new Date(expectedClose).toISOString(), reservationStatus: 'none',
      contractStatus: 'none', commissionPct: 2.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastActivity: new Date().toISOString(),
    })
    onOpenChange(false)
    setCustomerId(''); setPropertyId(''); setValue(0); setStage('qualified'); setProbability(35)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t('New opportunity')}</DialogTitle><DialogDescription>{t('Link a customer to an available property and open a deal.')}</DialogDescription></DialogHeader>
        <div className="grid gap-3">
          <Field label={t('Customer')} required><Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">{t('Select customer')}</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {formatEGP(c.budgetMax, 'en', true)}</option>)}</Select></Field>
          <Field label={t('Property')} required><Select value={propertyId} onChange={(e) => chooseProperty(e.target.value)}><option value="">{t('Select property')}</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.title} — {formatEGP(p.price, 'en', true)}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('Deal value (EGP)')} required><Input type="number" value={value || ''} onChange={(e) => setValue(Number(e.target.value))} /></Field>
            <Field label={t('Probability %')}><Input type="number" min={0} max={100} value={probability} onChange={(e) => setProbability(Number(e.target.value))} /></Field>
            <Field label={t('Stage')}><Select value={stage} onChange={(e) => setStage(e.target.value as DealStage)}>{pipelineStages.map((s) => <option key={s.id} value={s.id}>{t(stageLabels[s.id as DealStage])}</option>)}</Select></Field>
            <Field label={t('Pipeline')}><Select value={pipelineId} onChange={(e) => setPipelineId(e.target.value as PipelineId)}>{pipelines.map((p) => <option key={p.id} value={p.id}>{t(p.label)}</option>)}</Select></Field>
            <Field label={t('Agent')}><Select value={agentId} onChange={(e) => setAgentId(e.target.value)}>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></Field>
            <Field label={t('Expected close')}><Input type="date" value={expectedClose} onChange={(e) => setExpectedClose(e.target.value)} /></Field>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button><Button onClick={save} disabled={!customerId || !propertyId || value <= 0}><Sparkles className="size-3.5" /> {t('Create opportunity')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
