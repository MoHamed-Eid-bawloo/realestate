import { useMemo, useState } from 'react'
import {
  CheckCircle2, ClipboardList, Handshake, LifeBuoy, Plus, ShieldAlert, Star, Wrench, Clock, Search,
  MessageSquare, Sparkles, ThumbsUp,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/appStore'
import { useTab } from '@/lib/useTab'
import { cn } from '@/lib/utils'
import { formatDate, fromNow } from '@/lib/format'
import { PageHeader, StatCard, SearchInput, UserCell, EmptyState, DataTableEmpty } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Progress } from '@/components/ui/misc'
import { DonutChart, DonutLegend, chartColors } from '@/components/charts'
import type { SupportTicket } from '@/types'

const tabs = [
  { id: 'tickets', label: 'Support Tickets' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'after-sales', label: 'After-Sales' },
  { id: 'csat', label: 'Customer Satisfaction' },
  { id: 'maintenance', label: 'Maintenance Requests' },
]

export function SuccessPage() {
  const { t, lang } = useI18n()
  const { tab, setTab } = useTab('tickets')
  const companyId = useAppStore((s) => s.activeCompanyId)
  const ticketsAll = useAppStore((s) => s.tickets)
  const employees = useAppStore(useShallow((s) => s.employees.filter((e) => e.companyId === s.activeCompanyId)))
  const deals = useAppStore(useShallow((s) => s.deals.filter((d) => d.companyId === s.activeCompanyId)))
  const addTicket = useAppStore((s) => s.addTicket)
  const updateTicket = useAppStore((s) => s.updateTicket)
  const toast = useAppStore((s) => s.toast)

  const tickets = ticketsAll.filter((x) => x.companyId === companyId)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [reply, setReply] = useState('')

  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unassigned'
  const employeeColor = (id: string) => employees.find((e) => e.id === id)?.avatarColor

  const scopedForTab = useMemo(() => {
    const byTab = tab === 'complaints' ? tickets.filter((x) => x.category === 'complaint')
      : tab === 'maintenance' ? tickets.filter((x) => x.category === 'maintenance')
        : tickets
    return byTab
  }, [tickets, tab])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scopedForTab
      .filter((x) => statusFilter === 'all' || x.status === statusFilter)
      .filter((x) => !q || `${x.code} ${x.customerName} ${x.subject}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [scopedForTab, query, statusFilter])

  const open = tickets.filter((x) => x.status === 'open' || x.status === 'in_progress').length
  const resolved = tickets.filter((x) => x.status === 'resolved' || x.status === 'closed').length
  const rated = tickets.filter((x) => x.satisfaction)
  const csat = rated.length ? Math.round((rated.reduce((s, x) => s + (x.satisfaction ?? 0), 0) / (rated.length * 5)) * 100) : 0
  const avgResponse = 42
  const wonDeals = deals.filter((d) => d.stage === 'won')

  const csatBuckets = [5, 4, 3, 2, 1].map((n) => ({ name: `${n} ★`, value: rated.filter((x) => x.satisfaction === n).length }))

  const submitTicket = (payload: Omit<SupportTicket, 'id' | 'code' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
    addTicket({
      ...payload, id: `st-${Math.random().toString(36).slice(2, 8)}`, code: `TKT-${Math.floor(4200 + Math.random() * 700)}`,
      companyId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    toast('Ticket created', 'The assigned team has been notified in this demo.')
    setDialogOpen(false)
  }

  const escalate = (ticket: SupportTicket) => {
    updateTicket(ticket.id, { priority: 'urgent' })
    toast('Ticket escalated', `${ticket.code} is now urgent and flagged for the manager.`, 'info')
  }

  const sendReply = () => {
    if (!selected || !reply.trim()) return
    updateTicket(selected.id, { status: 'in_progress', updatedAt: new Date().toISOString() })
    toast('Reply recorded', `Your response to ${selected.customerName} was added to ${selected.code}.`)
    setReply('')
  }

  return (
    <div>
      <PageHeader
        title={t('Customer Success')}
        description={t('After-sales support, complaints and maintenance with SLA visibility.')}
        eyebrow={<><LifeBuoy className="size-3.5 text-accent" /> {t('CRM')} · {t('Customer Success')}</>}
        actions={<Button variant="accent" onClick={() => setDialogOpen(true)}><Plus /> {t('New ticket')}</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Open tickets')} value={open} icon={LifeBuoy} hint={`${tickets.filter((x) => x.priority === 'urgent').length} ${t('urgent')}`} />
        <StatCard label={t('Resolved')} value={resolved} icon={CheckCircle2} tone="green" hint={`${tickets.length ? Math.round((resolved / tickets.length) * 100) : 0}% ${t('resolution rate')}`} />
        <StatCard label={t('CSAT')} value={`${csat}%`} icon={ThumbsUp} tone="amber" hint={`${rated.length} ${t('responses')}`} />
        <StatCard label={t('Avg first response')} value={`${avgResponse}m`} icon={Clock} tone="blue" hint={t('SLA target 60 minutes')} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={cn('h-8 shrink-0 rounded-lg border px-3 text-[11px] font-medium transition-colors', tab === x.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>{t(x.label)}</button>
        ))}
      </div>

      {(tab === 'tickets' || tab === 'complaints' || tab === 'maintenance') && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={query} onChange={setQuery} placeholder={t('Search tickets…')} className="w-64" />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
                <option value="all">{t('All statuses')}</option>
                {['open', 'in_progress', 'resolved', 'closed'].map((x) => <option key={x} value={x}>{t(x.replace(/_/g, ' '))}</option>)}
              </Select>
            </div>
            <span className="text-[11px] text-muted-foreground">{filtered.length} {t('records')}</span>
          </div>
          {filtered.length === 0 ? (
            <DataTableEmpty title={t('No tickets match')} description={t('Adjust the filters or create a new ticket.')} action={<Button size="sm" variant="accent" onClick={() => setDialogOpen(true)}>{t('New ticket')}</Button>} />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((x) => (
                <div key={x.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', x.category === 'complaint' ? 'bg-rose-500/10 text-rose-600' : x.category === 'maintenance' ? 'bg-amber-500/10 text-amber-600' : 'bg-sky-500/10 text-sky-600')}>
                    {x.category === 'complaint' ? <ShieldAlert className="size-4" /> : x.category === 'maintenance' ? <Wrench className="size-4" /> : <LifeBuoy className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-medium">{x.subject}</p><Badge tone="outline">{x.code}</Badge></div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{x.customerName} · {t(x.category)} · {fromNow(x.updatedAt, lang)}</p>
                  </div>
                  <div className="hidden sm:block"><UserCell name={employeeName(x.assignedTo)} color={employeeColor(x.assignedTo)} /></div>
                  <StatusBadge status={x.priority} />
                  <StatusBadge status={x.status} />
                  <Button size="xs" variant="outline" onClick={() => setSelected(x)}>{t('Manage')}</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'after-sales' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label={t('Handed over units')} value={wonDeals.length} icon={Handshake} tone="green" hint={t('Won deals with handover')} />
            <StatCard label={t('Warranty active')} value={wonDeals.filter((d) => Date.now() - new Date(d.updatedAt).getTime() < 365 * 86400000).length} icon={ShieldAlert} tone="blue" hint={t('Within 12 months')} />
            <StatCard label={t('Maintenance requests')} value={tickets.filter((x) => x.category === 'maintenance').length} icon={Wrench} tone="amber" hint={`${tickets.filter((x) => x.category === 'maintenance' && x.status !== 'closed').length} ${t('still open')}`} />
          </div>
          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{t('After-sales portfolio')}</p><p className="text-[10px] text-muted-foreground">{t('Handover status and warranty coverage for completed deals.')}</p></div>
            <div className="divide-y divide-border">
              {wonDeals.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600"><Handshake className="size-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-medium">{d.propertyTitle}</p><p className="text-[10px] text-muted-foreground">{d.customerName} · {d.code} · {t('Handover')} {formatDate(d.updatedAt, lang, 'dd MMM yyyy')}</p></div>
                  <Badge tone="green">{t('Warranty active')}</Badge>
                  <Button size="xs" variant="outline" onClick={() => { setTab('maintenance'); setDialogOpen(true) }}><Wrench /> {t('Log request')}</Button>
                </div>
              ))}
              {wonDeals.length === 0 && <EmptyState icon={Handshake} title={t('No completed handovers yet')} description={t('Won deals will appear here with warranty coverage.')} />}
            </div>
          </Card>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { title: t('Handover checklist'), detail: t('Meter readings, keys, snag list and unit condition sign-off.'), value: '8 steps' },
              { title: t('Warranty policy'), detail: t('12 months structural, 24 months MEP, developer-backed in this demo.'), value: '12–24 mo' },
              { title: t('Service SLA'), detail: t('Acknowledgement in 4 hours, technician assigned within one business day.'), value: '4h' },
            ].map((x) => (
              <Card key={x.title} className="p-4"><div className="flex items-center justify-between"><p className="text-[12px] font-semibold">{x.title}</p><Badge tone="navy">{x.value}</Badge></div><p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">{x.detail}</p></Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'csat' && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <Card className="p-4">
              <p className="text-[13px] font-semibold">{t('Satisfaction score')}</p>
              <div className="mt-2 flex items-end gap-2"><span className="text-[40px] font-semibold leading-none tracking-[-0.04em]">{csat}%</span><span className="pb-1 text-[11px] text-muted-foreground">{t('from')} {rated.length} {t('rated tickets')}</span></div>
              <div className="mt-4 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn('size-5', n <= Math.round(csat / 20) ? 'fill-amber-400 text-amber-400' : 'text-border')} />)}
              </div>
              <div className="mt-5 space-y-2">
                {csatBuckets.map((b) => (
                  <div key={b.name} className="flex items-center gap-2">
                    <span className="w-8 text-[10px] text-muted-foreground">{b.name}</span>
                    <Progress value={rated.length ? (b.value / rated.length) * 100 : 0} tone="amber" />
                    <span className="w-5 text-end text-[10px] font-medium">{b.value}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between"><p className="text-[13px] font-semibold">{t('Tickets by category')}</p><Badge tone="outline">{tickets.length} {t('total')}</Badge></div>
              <div className="mt-3 grid items-center gap-4 sm:grid-cols-2">
                <DonutChart data={[
                  { name: t('Maintenance'), value: tickets.filter((x) => x.category === 'maintenance').length },
                  { name: t('Complaints'), value: tickets.filter((x) => x.category === 'complaint').length },
                  { name: t('Payments'), value: tickets.filter((x) => x.category === 'payment').length },
                  { name: t('Delivery'), value: tickets.filter((x) => x.category === 'delivery').length },
                  { name: t('Inquiries'), value: tickets.filter((x) => x.category === 'inquiry').length },
                ]} height={190} centerValue={`${csat}%`} centerLabel={t('CSAT')} colors={[chartColors.emerald, chartColors.rose, chartColors.amber, chartColors.sky, chartColors.violet]} />
                <DonutLegend data={[
                  { name: t('Maintenance'), value: tickets.filter((x) => x.category === 'maintenance').length },
                  { name: t('Complaints'), value: tickets.filter((x) => x.category === 'complaint').length },
                  { name: t('Payments'), value: tickets.filter((x) => x.category === 'payment').length },
                  { name: t('Delivery'), value: tickets.filter((x) => x.category === 'delivery').length },
                  { name: t('Inquiries'), value: tickets.filter((x) => x.category === 'inquiry').length },
                ]} colors={[chartColors.emerald, chartColors.rose, chartColors.amber, chartColors.sky, chartColors.violet]} />
              </div>
            </Card>
          </div>
          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{t('Recent feedback')}</p><p className="text-[10px] text-muted-foreground">{t('Ratings captured after ticket resolution.')}</p></div>
            <div className="divide-y divide-border">
              {rated.map((x) => (
                <div key={x.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn('size-3.5', n <= (x.satisfaction ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-border')} />)}</div>
                  <div className="min-w-0 flex-1"><p className="text-[12px] font-medium">{x.subject}</p><p className="text-[10px] text-muted-foreground">{x.customerName} · {x.code} · {formatDate(x.updatedAt, lang, 'dd MMM')}</p></div>
                  <StatusBadge status={x.status} />
                </div>
              ))}
            </div>
          </Card>
          <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Sparkles className="size-3 text-accent" /> {t('CSAT is calculated from demo satisfaction ratings only.')}</p>
        </div>
      )}

      <TicketDialog open={dialogOpen} onOpenChange={setDialogOpen} employees={employees} defaultCategory={tab === 'maintenance' ? 'maintenance' : tab === 'complaints' ? 'complaint' : 'inquiry'} onSubmit={submitTicket} />

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.subject}</DialogTitle>
                <DialogDescription>{selected.code} · {selected.customerName} · {t('opened')} {formatDate(selected.createdAt, lang, 'dd MMM yyyy')}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border border-border p-2.5"><p className="text-[9px] uppercase tracking-wide text-muted-foreground">{t('Category')}</p><p className="mt-0.5 font-medium capitalize">{selected.category}</p></div>
                <div className="rounded-lg border border-border p-2.5"><p className="text-[9px] uppercase tracking-wide text-muted-foreground">{t('Assigned to')}</p><p className="mt-0.5 font-medium">{employeeName(selected.assignedTo)}</p></div>
                <div className="rounded-lg border border-border p-2.5"><p className="text-[9px] uppercase tracking-wide text-muted-foreground">{t('Priority')}</p><div className="mt-1"><StatusBadge status={selected.priority} /></div></div>
                <div className="rounded-lg border border-border p-2.5"><p className="text-[9px] uppercase tracking-wide text-muted-foreground">{t('Status')}</p><div className="mt-1"><StatusBadge status={selected.status} /></div></div>
              </div>
              <p className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">{selected.description}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Field label={t('Update status')}>
                  <Select value={selected.status} onChange={(e) => { const status = e.target.value as SupportTicket['status']; updateTicket(selected.id, { status }); setSelected({ ...selected, status }); if (status === 'resolved' || status === 'closed') toast('Ticket resolved', `${selected.code} is now ${status}.`) }}>
                    {['open', 'in_progress', 'resolved', 'closed'].map((x) => <option key={x} value={x}>{t(x.replace(/_/g, ' '))}</option>)}
                  </Select>
                </Field>
                <Field label={t('Reassign')}>
                  <Select value={selected.assignedTo} onChange={(e) => { updateTicket(selected.id, { assignedTo: e.target.value }); setSelected({ ...selected, assignedTo: e.target.value }); toast('Ticket reassigned', `Now owned by ${employeeName(e.target.value)}.`) }}>
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label={t('Add an internal reply')} className="mt-3">
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder={t('Document the action taken…')} />
              </Field>
              <DialogFooter className="!flex-row justify-between">
                <Button variant="outline" size="sm" onClick={() => escalate(selected)}><ShieldAlert /> {t('Escalate')}</Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>{t('Close')}</Button>
                  <Button variant="accent" size="sm" onClick={sendReply} disabled={!reply.trim()}><MessageSquare /> {t('Save reply')}</Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TicketDialog({ open, onOpenChange, employees, defaultCategory, onSubmit }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  employees: ReturnType<typeof useAppStore.getState>['employees']
  defaultCategory: SupportTicket['category']
  onSubmit: (payload: Omit<SupportTicket, 'id' | 'code' | 'companyId' | 'createdAt' | 'updatedAt'>) => void
}) {
  const { t } = useI18n()
  const [form, setForm] = useState(() => ({ subject: '', customerName: '', category: defaultCategory, priority: 'medium' as SupportTicket['priority'], assignedTo: employees[0]?.id ?? '', description: '' }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.customerName.trim()) return
    onSubmit({ subject: form.subject.trim(), customerName: form.customerName.trim(), category: form.category, priority: form.priority, status: 'open', assignedTo: form.assignedTo, description: form.description || 'Customer reported the issue through the support desk.', satisfaction: undefined })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('New support ticket')}</DialogTitle>
          <DialogDescription>{t('Log a complaint, maintenance request or after-sales inquiry.')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label={t('Subject')} required><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={t('e.g. AC not cooling in unit B-302')} required /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('Customer')} required><Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder={t('Customer name')} required /></Field>
            <Field label={t('Category')}><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as SupportTicket['category'] })}>{['maintenance', 'complaint', 'payment', 'delivery', 'inquiry'].map((x) => <option key={x} value={x}>{t(x)}</option>)}</Select></Field>
            <Field label={t('Priority')}><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as SupportTicket['priority'] })}>{['low', 'medium', 'high', 'urgent'].map((x) => <option key={x} value={x}>{t(x)}</option>)}</Select></Field>
            <Field label={t('Assign to')}><Select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></Field>
          </div>
          <Field label={t('Description')}><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder={t('What happened and what has been promised?')} /></Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
            <Button type="submit" variant="accent">{t('Create ticket')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
