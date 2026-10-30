import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight, BadgeCheck, BrainCircuit, Check, ChevronRight, Copy, Download, Flame, GitBranch, Inbox,
  Link2, Mail, Phone, PieChart, Plus, Radio, RefreshCw, SearchX, Sparkles, Tags, Trash2, Upload, UserPlus,
  Users, X,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/appStore'
import { useTab } from '@/lib/useTab'
import { formatDate, formatEGP, fromNow } from '@/lib/format'
import { sourceLabel } from '@/lib/labels'
import { cn, downloadCsv } from '@/lib/utils'
import type { Lead, LeadSource, LeadStatus, Priority, PropertyType } from '@/types'
import { mockApi } from '@/services/mockApi'
import { PageHeader, SearchInput, StatCard, TableShell, UserCell, SectionTitle, DataTableEmpty } from '@/components/shared'
import { ChartCard, DonutChart, DonutLegend, BarsChart, chartColors } from '@/components/charts'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input, Select, Textarea, Field } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, ConfirmDialog } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown'
import { Avatar, EmptyState, Pagination, Progress } from '@/components/ui/misc'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const tabs = [
  { id: 'all', label: 'All Leads', icon: Users },
  { id: 'inbox', label: 'Lead Inbox', icon: Inbox },
  { id: 'sources', label: 'Sources', icon: Radio },
  { id: 'distribution', label: 'Distribution', icon: GitBranch },
  { id: 'scoring', label: 'Scoring', icon: PieChart },
  { id: 'segments', label: 'Segments', icon: Tags },
  { id: 'duplicates', label: 'Duplicates', icon: Copy },
]

const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'interested', 'viewing', 'negotiation', 'won', 'lost']
const priorities: Priority[] = ['low', 'medium', 'high', 'urgent']
const sources: LeadSource[] = ['website', 'whatsapp', 'facebook', 'instagram', 'referral', 'walk_in', 'call_center', 'broker', 'campaign']
const propertyTypes: PropertyType[] = ['apartment', 'villa', 'townhouse', 'penthouse', 'duplex', 'chalet', 'office', 'retail']

const segmentDefs = [
  { id: 'hot', label: 'Hot pipeline', description: 'Score 75+ and engaged within the last 3 days.', tone: 'red' as const, match: (l: Lead) => l.score >= 75 },
  { id: 'cash', label: 'Cash-ready', description: 'Budget above EGP 10M or tagged cash-ready.', tone: 'green' as const, match: (l: Lead) => l.budgetMax >= 10_000_000 || l.tags.includes('Cash-ready') },
  { id: 'broker', label: 'Broker sourced', description: 'Leads introduced through the broker network.', tone: 'purple' as const, match: (l: Lead) => l.source === 'broker' },
  { id: 'reengage', label: 'Needs re-engagement', description: 'No contact in more than five days.', tone: 'amber' as const, match: (l: Lead) => !['won', 'lost'].includes(l.status) && Date.now() - new Date(l.lastContact).getTime() > 5 * 86400000 },
  { id: 'coastal', label: 'Coastal buyers', description: 'North Coast, New Alamein and chalet demand.', tone: 'blue' as const, match: (l: Lead) => ['North Coast', 'New Alamein'].some((x) => l.location.includes(x)) || l.propertyType === 'chalet' },
]

const leadSchema = z.object({
  name: z.string().min(2, 'Enter the lead name'),
  phone: z.string().min(8, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email'),
  source: z.string(),
  location: z.string().min(2, 'Enter a preferred location'),
  budgetMin: z.coerce.number().min(0),
  budgetMax: z.coerce.number().positive('Enter a budget'),
  propertyType: z.string(),
  assigneeId: z.string().min(1, 'Choose an owner'),
  priority: z.string(),
  notes: z.string().optional(),
}).refine((v) => v.budgetMax >= v.budgetMin, { message: 'Maximum budget must be above the minimum', path: ['budgetMax'] })

type LeadFormValues = z.infer<typeof leadSchema>

export function LeadsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { tab, setTab } = useTab('all')
  const [params, setParams] = useSearchParams()
  const role = useAppStore((s) => s.role)
  const activeCompanyId = useAppStore((s) => s.activeCompanyId)
  const employees = useAppStore(useShallow((s) => s.employees.filter((e) => e.companyId === s.activeCompanyId)))
  const allLeads = useAppStore((s) => s.leads)
  const customers = useAppStore((s) => s.customers)
  const deleteLeads = useAppStore((s) => s.deleteLeads)
  const assignLeads = useAppStore((s) => s.assignLeads)
  const updateLead = useAppStore((s) => s.updateLead)
  const addLeadActivity = useAppStore((s) => s.addLeadActivity)
  const toast = useAppStore((s) => s.toast)

  const agentId = role === 'agent' ? 'e3' : null
  const leads = useMemo(
    () => allLeads.filter((l) => l.companyId === activeCompanyId && (!agentId || l.assigneeId === agentId)),
    [allLeads, activeCompanyId, agentId],
  )

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [source, setSource] = useState('all')
  const [assignee, setAssignee] = useState('all')
  const [priority, setPriority] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<Lead | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTo, setAssignTo] = useState(employees.find((e) => e.role === 'agent')?.id ?? employees[0]?.id ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [segment, setSegment] = useState('hot')
  const [dismissedDuplicates, setDismissedDuplicates] = useState<string[]>([])
  const [scoringFilter, setScoringFilter] = useState('all')

  useEffect(() => {
    if (params.get('new') === '1') { setEditing(null); setFormOpen(true); const next = new URLSearchParams(params); next.delete('new'); setParams(next, { replace: true }) }
  }, [params, setParams])

  useEffect(() => { setPage(1) }, [q, status, source, assignee, priority, tab, segment])

  const filtered = useMemo(() => {
    const base = tab === 'inbox' ? leads.filter((l) => l.status === 'new') : leads
    const term = q.trim().toLowerCase()
    const rows = base.filter((l) => {
      if (term && ![l.name, l.phone, l.email, l.location, l.tags.join(' ')].join(' ').toLowerCase().includes(term)) return false
      if (status !== 'all' && l.status !== status) return false
      if (source !== 'all' && l.source !== source) return false
      if (assignee !== 'all' && l.assigneeId !== assignee) return false
      if (priority !== 'all' && l.priority !== priority) return false
      return true
    })
    return [...rows].sort((a, b) => {
      if (sort === 'score') return b.score - a.score
      if (sort === 'budget') return b.budgetMax - a.budgetMax
      if (sort === 'followup') return new Date(a.nextFollowUp).getTime() - new Date(b.nextFollowUp).getTime()
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [leads, tab, q, status, source, assignee, priority, sort])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const counts = useMemo(() => ({
    new: leads.filter((l) => l.status === 'new').length,
    hot: leads.filter((l) => l.score >= 75).length,
    qualified: leads.filter((l) => ['qualified', 'interested', 'viewing', 'negotiation'].includes(l.status)).length,
  }), [leads])

  const duplicates = useMemo(() => leads
    .map((lead) => ({ lead, customer: customers.find((c) => c.name.trim().toLowerCase() === lead.name.trim().toLowerCase()) }))
    .filter((x) => x.customer && !dismissedDuplicates.includes(x.lead.id)), [leads, customers, dismissedDuplicates])

  const toggleAll = (checked: boolean) => setSelected(checked ? paged.map((l) => l.id) : [])
  const toggleOne = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  const selectedLeads = leads.filter((l) => selected.includes(l.id))

  const updateStatus = (lead: Lead, next: LeadStatus) => {
    updateLead(lead.id, { status: next })
    if (next === 'lost') updateLead(lead.id, { lostReason: 'Marked lost from the lead list' })
    toast('Lead status updated', `${lead.name} is now ${next.replace('_', ' ')}.`)
  }

  const exportCsv = (rows = filtered) => {
    downloadCsv('leads.csv', [
      ['Name', 'Phone', 'Email', 'Source', 'Status', 'Priority', 'Score', 'Budget min', 'Budget max', 'Location', 'Owner', 'Created'],
      ...rows.map((l) => [l.name, l.phone, l.email, sourceLabel[l.source], l.status, l.priority, l.score, l.budgetMin, l.budgetMax, l.location, employees.find((e) => e.id === l.assigneeId)?.name ?? '—', l.createdAt]),
    ])
    toast('Export ready', `${rows.length} leads were exported as CSV.`)
  }

  const runImport = async () => {
    setImporting(true)
    try {
      const { rows, skipped } = await mockApi.importLeadsCsv(importText)
      rows.forEach((row) => {
        useAppStore.getState().addLead({
          name: row.name, phone: row.phone, email: row.email, source: (sources.includes(row.source as LeadSource) ? row.source : 'website') as LeadSource,
          location: row.location, budgetMin: Math.round(row.budgetMax * 0.7), budgetMax: row.budgetMax,
          propertyType: 'apartment', assigneeId: assignTo || employees[0]?.id || 'e3', priority: 'medium',
          notes: 'Imported from CSV.',
        })
      })
      toast('Import complete', `${rows.length} leads imported${skipped ? ` · ${skipped} rows skipped` : ''}.`)
      setImportOpen(false)
      setImportText('')
      setTab('all')
    } finally { setImporting(false) }
  }

  const recalculate = () => {
    leads.filter((l) => !['won', 'lost'].includes(l.status)).forEach((l) => {
      const activityBoost = Math.min(18, l.activities.length * 4)
      const budgetBoost = Math.min(20, Math.round(l.budgetMax / 1_000_000))
      updateLead(l.id, { score: Math.min(98, 35 + activityBoost + budgetBoost + (l.priority === 'urgent' ? 12 : l.priority === 'high' ? 7 : 0)) })
    })
    toast('Scores recalculated', 'Demo AI scoring used activity, budget, priority and engagement recency.')
  }

  return (
    <div>
      <PageHeader
        title={t('All Leads')}
        description={t('Capture, qualify and route every inquiry into one pipeline. All changes are stored locally in this demo.')}
        eyebrow={<><span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5"><span className="size-1.5 rounded-full bg-accent" /> {leads.length} {t('leads in scope')}</span><span>·</span><span>{counts.new} {t('new')}</span></>}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="size-3.5" /> {t('Import')}</Button>
            <Button variant="outline" size="sm" onClick={() => exportCsv()}><Download className="size-3.5" /> {t('Export')}</Button>
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="size-3.5" /> {t('Add lead')}</Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <StatCard label={t('New leads')} value={counts.new} icon={Inbox} tone="blue" hint={t('Awaiting first contact')} className="min-w-[160px] flex-1" />
        <StatCard label={t('Qualified')} value={counts.qualified} icon={BadgeCheck} tone="green" hint={t('Budget and intent confirmed')} className="min-w-[160px] flex-1" />
        <StatCard label={t('Hot leads')} value={counts.hot} icon={Flame} tone="amber" hint={t('Score 75 or above')} className="min-w-[160px] flex-1" />
        <StatCard label={t('Unassigned')} value={leads.filter((l) => !l.assigneeId).length} icon={UserPlus} tone="purple" hint={t('Ready for distribution')} className="min-w-[160px] flex-1" />
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((x) => {
          const Icon = x.icon
          const active = tab === x.id || (tab === '' && x.id === 'all')
          return (
            <button key={x.id} onClick={() => setTab(x.id)} className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition-colors', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
              <Icon className="size-3.5" /> {t(x.label)}
              {x.id === 'inbox' && counts.new > 0 && <span className={cn('ms-0.5 rounded px-1 text-[9px]', active ? 'bg-white/20' : 'bg-muted')}>{counts.new}</span>}
              {x.id === 'duplicates' && duplicates.length > 0 && <span className={cn('ms-0.5 rounded px-1 text-[9px]', active ? 'bg-white/20' : 'bg-muted')}>{duplicates.length}</span>}
            </button>
          )
        })}
      </div>

      {['all', 'inbox'].includes(tab === '' ? 'all' : tab) && (
        <>
          <TableShell
            header={
              <div className="flex w-full flex-wrap items-center gap-2">
                <SearchInput value={q} onChange={setQ} placeholder={t('Search name, phone, email, tag…')} className="w-full sm:w-64" />
                <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-auto min-w-[125px]">
                  <option value="all">{t('All statuses')}</option>
                  {statuses.map((s) => <option key={s} value={s}>{t(s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}</option>)}
                </Select>
                <Select value={source} onChange={(e) => setSource(e.target.value)} className="h-9 w-auto min-w-[125px]">
                  <option value="all">{t('All sources')}</option>
                  {sources.map((s) => <option key={s} value={s}>{sourceLabel[s]}</option>)}
                </Select>
                <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="h-9 w-auto min-w-[135px]">
                  <option value="all">{t('All owners')}</option>
                  {employees.filter((e) => e.role !== 'owner').map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
                <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-9 w-auto min-w-[115px]">
                  <option value="all">{t('Any priority')}</option>
                  {priorities.map((p) => <option key={p} value={p}>{t(p[0].toUpperCase() + p.slice(1))}</option>)}
                </Select>
                <Select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 w-auto min-w-[135px]">
                  <option value="newest">{t('Newest first')}</option>
                  <option value="score">{t('Highest score')}</option>
                  <option value="budget">{t('Largest budget')}</option>
                  <option value="followup">{t('Follow-up due')}</option>
                </Select>
                {(q || status !== 'all' || source !== 'all' || assignee !== 'all' || priority !== 'all') && (
                  <Button variant="ghost" size="sm" onClick={() => { setQ(''); setStatus('all'); setSource('all'); setAssignee('all'); setPriority('all') }}>{t('Clear')}</Button>
                )}
              </div>
            }
            footer={filtered.length > 0 ? <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} /> : undefined}
          >
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/5 px-4 py-2.5 text-[12px]">
                <span className="font-medium">{selected.length} {t('selected')}</span>
                <Button size="xs" variant="outline" onClick={() => setAssignOpen(true)}><UserPlus className="size-3" /> {t('Assign')}</Button>
                <Button size="xs" variant="outline" onClick={() => exportCsv(selectedLeads)}><Download className="size-3" /> {t('Export')}</Button>
                <Button size="xs" variant="danger-soft" onClick={() => setDeleteOpen(true)}><Trash2 className="size-3" /> {t('Delete')}</Button>
                <button className="ms-auto text-muted-foreground hover:text-foreground" onClick={() => setSelected([])}><X className="size-3.5" /></button>
              </div>
            )}
            {paged.length === 0 ? (
              <DataTableEmpty title={t('No leads match these filters')} description={t('Adjust the filters or add a new lead to get started.')} action={<Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="size-3.5" /> {t('Add lead')}</Button>} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"><input type="checkbox" className="size-3.5 accent-[#10B981]" checked={paged.every((l) => selected.includes(l.id))} onChange={(e) => toggleAll(e.target.checked)} /></TableHead>
                    <TableHead>{t('Lead')}</TableHead>
                    <TableHead>{t('Source')}</TableHead>
                    <TableHead>{t('Budget')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Score')}</TableHead>
                    <TableHead>{t('Owner')}</TableHead>
                    <TableHead>{t('Last contact')}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((lead) => {
                    const owner = employees.find((e) => e.id === lead.assigneeId)
                    return (
                      <TableRow key={lead.id}>
                        <TableCell><input type="checkbox" className="size-3.5 accent-[#10B981]" checked={selected.includes(lead.id)} onChange={() => toggleOne(lead.id)} /></TableCell>
                        <TableCell>
                          <Link to={`/crm/leads/${lead.id}`} className="group flex items-center gap-2.5">
                            <Avatar name={lead.name} color={owner?.avatarColor} size="sm" />
                            <span className="min-w-0">
                              <span className="flex items-center gap-1.5">
                                <span className="truncate text-[13px] font-medium group-hover:text-accent">{lead.name}</span>
                                {lead.priority === 'urgent' && <Flame className="size-3 text-rose-500" />}
                              </span>
                              <span className="block truncate text-[10px] text-muted-foreground">{lead.location} · {lead.propertyType}</span>
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell><Badge tone="outline">{sourceLabel[lead.source]}</Badge></TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">{formatEGP(lead.budgetMax, 'en', true)}</TableCell>
                        <TableCell>
                          <select value={lead.status} onChange={(e) => updateStatus(lead, e.target.value as LeadStatus)} className="h-7 rounded-md border border-border bg-card px-1.5 text-[11px] capitalize">
                            {statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                          </select>
                        </TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums', lead.score >= 75 ? 'text-emerald-600 dark:text-emerald-400' : lead.score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
                            <span className={cn('size-1.5 rounded-full', lead.score >= 75 ? 'bg-emerald-500' : lead.score >= 50 ? 'bg-amber-500' : 'bg-slate-400')} /> {lead.score}
                          </span>
                        </TableCell>
                        <TableCell>
                          {owner ? <UserCell name={owner.name.split(' ')[0]} sub={owner.title.split(' ')[0]} color={owner.avatarColor} /> : <span className="text-[11px] text-muted-foreground">{t('Unassigned')}</span>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[11px] text-muted-foreground">{fromNow(lead.lastContact)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><ChevronRight className="size-4 rotate-90" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => navigate(`/crm/leads/${lead.id}`)}><ArrowRight /> {t('Open lead')}</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => { setEditing(lead); setFormOpen(true) }}><Sparkles /> {t('Edit lead')}</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => { setSelected([lead.id]); setAssignOpen(true) }}><UserPlus /> {t('Reassign')}</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => addLeadActivity(lead.id, 'call', 'Call logged', 'Outbound call logged from the lead list.', 'You')}><Phone /> {t('Log a call')}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onSelect={() => { setSelected([lead.id]); setDeleteOpen(true) }}><Trash2 /> {t('Delete lead')}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </TableShell>
          <p className="mt-2 text-[10px] text-muted-foreground">{t('Tip: use the checkbox column for bulk assignment, export or deletion.')}</p>
        </>
      )}

      {tab === 'sources' && <SourcesTab leads={leads} />}
      {tab === 'distribution' && <DistributionTab leads={leads} employees={employees} onAssign={(ids) => { setSelected(ids); setAssignOpen(true) }} />}
      {tab === 'scoring' && (
        <ScoringTab leads={leads} filter={scoringFilter} setFilter={setScoringFilter} onRecalculate={recalculate} />
      )}
      {tab === 'segments' && (
        <SegmentsTab leads={leads} segment={segment} setSegment={setSegment} />
      )}
      {tab === 'duplicates' && (
        <DuplicatesTab
          duplicates={duplicates}
          onDismiss={(id) => setDismissedDuplicates((d) => [...d, id])}
          onLink={(lead, customerName) => {
            addLeadActivity(lead.id, 'system', 'Linked to existing customer', `${lead.name} was linked to the existing customer record ${customerName}.`, 'You')
            toast('Records linked', `${lead.name} is now linked to their customer profile.`)
            setDismissedDuplicates((d) => [...d, lead.id])
          }}
        />
      )}

      <LeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={editing}
        employees={employees}
        defaultAssignee={employees.find((e) => e.role === 'agent')?.id ?? employees[0]?.id ?? 'e3'}
      />

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Assign leads')}</DialogTitle>
            <DialogDescription>{selected.length} {t('selected leads will be reassigned to a teammate.')}</DialogDescription>
          </DialogHeader>
          <Field label={t('Assign to')}>
            <Select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.title}</option>)}
            </Select>
          </Field>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {employees.filter((e) => e.role === 'agent').slice(0, 6).map((e) => {
              const load = leads.filter((l) => l.assigneeId === e.id && !['won', 'lost'].includes(l.status)).length
              return (
                <button key={e.id} onClick={() => setAssignTo(e.id)} className={cn('rounded-lg border p-2.5 text-start transition-colors', assignTo === e.id ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted/50')}>
                  <span className="flex items-center gap-2"><Avatar name={e.name} color={e.avatarColor} size="xs" /><span className="truncate text-[11px] font-medium">{e.name.split(' ')[0]}</span></span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">{load} {t('active leads')}</span>
                </button>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={() => { assignLeads(selected, assignTo); setAssignOpen(false); setSelected([]) }}><UserPlus className="size-3.5" /> {t('Assign')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`${t('Delete')} ${selected.length} ${t('lead(s)')}?`}
        description={t('This removes the lead and its timeline from this demo workspace. This cannot be undone.')}
        confirmLabel={t('Delete leads')}
        danger
        onConfirm={() => { deleteLeads(selected); setSelected([]) }}
      />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Import leads')}</DialogTitle>
            <DialogDescription>{t('Paste CSV rows as name, phone, email, source, location, budget. The demo parser is local only.')}</DialogDescription>
          </DialogHeader>
          <Field label={t('CSV data')} hint="Example: Omar Khairy, +20 100 555 0192, omar@example.com, website, New Cairo, 9000000">
            <Textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={7} placeholder={'Name, phone, email, source, location, budget\nOmar Khairy, +20 100 555 0192, omar@example.com, website, New Cairo, 9000000'} />
          </Field>
          <Field label={t('Default owner')} className="mt-3">
            <Select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.title}</option>)}
            </Select>
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={runImport} disabled={importing || !importText.trim()}>
              {importing ? <RefreshCw className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              {importing ? t('Importing…') : t('Import leads')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function LeadFormDialog({ open, onOpenChange, lead, employees, defaultAssignee }: { open: boolean; onOpenChange: (v: boolean) => void; lead: Lead | null; employees: ReturnType<typeof useAppStore.getState>['employees']; defaultAssignee: string }) {
  const { t } = useI18n()
  const addLead = useAppStore((s) => s.addLead)
  const updateLead = useAppStore((s) => s.updateLead)
  const toast = useAppStore((s) => s.toast)
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: '', phone: '', email: '', source: 'website', location: 'New Cairo', budgetMin: 5000000, budgetMax: 9000000, propertyType: 'apartment', assigneeId: defaultAssignee, priority: 'medium', notes: '' },
  })
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = form

  useEffect(() => {
    if (!open) return
    reset(lead ? {
      name: lead.name, phone: lead.phone, email: lead.email, source: lead.source, location: lead.location,
      budgetMin: lead.budgetMin, budgetMax: lead.budgetMax, propertyType: lead.propertyType,
      assigneeId: lead.assigneeId, priority: lead.priority, notes: '',
    } : { name: '', phone: '', email: '', source: 'website', location: 'New Cairo', budgetMin: 5000000, budgetMax: 9000000, propertyType: 'apartment', assigneeId: defaultAssignee, priority: 'medium', notes: '' })
  }, [open, lead, defaultAssignee, reset])

  const submit = async (values: LeadFormValues) => {
    await mockApi.save()
    if (lead) {
      updateLead(lead.id, {
        name: values.name, phone: values.phone, email: values.email, source: values.source as LeadSource, location: values.location,
        budgetMin: values.budgetMin, budgetMax: values.budgetMax, propertyType: values.propertyType as PropertyType,
        assigneeId: values.assigneeId, priority: values.priority as Priority,
      })
      toast('Lead updated', `${values.name}'s details were saved.`)
    } else {
      addLead({ ...values, source: values.source as LeadSource, propertyType: values.propertyType as PropertyType, priority: values.priority as Priority })
      toast('Lead added', `${values.name} is in the inbox and assigned to an owner.`)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lead ? t('Edit lead') : t('Add lead')}</DialogTitle>
          <DialogDescription>{lead ? t('Update contact details, budget and ownership.') : t('Capture an inquiry manually. It will appear at the top of the lead inbox.')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('Full name')} required error={errors.name?.message}><Input {...register('name')} placeholder="e.g. Menna Tarek" /></Field>
            <Field label={t('Phone')} required error={errors.phone?.message}><Input {...register('phone')} dir="ltr" placeholder="+20 100 000 0000" /></Field>
            <Field label={t('Email')} required error={errors.email?.message}><Input {...register('email')} dir="ltr" placeholder="name@example.com" /></Field>
            <Field label={t('Source')} required>
              <Select {...register('source')}>{sources.map((s) => <option key={s} value={s}>{sourceLabel[s]}</option>)}</Select>
            </Field>
            <Field label={t('Preferred location')} required error={errors.location?.message}><Input {...register('location')} placeholder="New Cairo" /></Field>
            <Field label={t('Property type')}>
              <Select {...register('propertyType')}>{propertyTypes.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}</Select>
            </Field>
            <Field label={t('Budget from (EGP)')} error={errors.budgetMin?.message}><Input type="number" {...register('budgetMin')} /></Field>
            <Field label={t('Budget to (EGP)')} error={errors.budgetMax?.message}><Input type="number" {...register('budgetMax')} /></Field>
            <Field label={t('Owner')} required>
              <Select {...register('assigneeId')}>{employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.title}</option>)}</Select>
            </Field>
            <Field label={t('Priority')}>
              <Select {...register('priority')}>{priorities.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}</Select>
            </Field>
            <Field label={t('Notes')} className="sm:col-span-2"><Textarea {...register('notes')} rows={3} placeholder={t('Budget, timeline, decision makers, next step…')} /></Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}{lead ? t('Save changes') : t('Create lead')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SourcesTab({ leads }: { leads: Lead[] }) {
  const { t } = useI18n()
  const data = useMemo(() => {
    const map = new Map<LeadSource, Lead[]>()
    leads.forEach((l) => map.set(l.source, [...(map.get(l.source) ?? []), l]))
    return [...map.entries()].map(([source, rows]) => ({
      source,
      total: rows.length,
      qualified: rows.filter((l) => ['qualified', 'interested', 'viewing', 'negotiation', 'won'].includes(l.status)).length,
      won: rows.filter((l) => l.status === 'won').length,
      avgBudget: rows.reduce((s, l) => s + l.budgetMax, 0) / rows.length,
      conv: rows.length ? Math.round((rows.filter((l) => l.status === 'won').length / rows.length) * 100) : 0,
    })).sort((a, b) => b.total - a.total)
  }, [leads])

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <ChartCard title={t('Lead volume by source')} description={t('Where your pipeline comes from in this workspace.')}>
        <DonutChart data={data.map((d) => ({ name: sourceLabel[d.source], value: d.total }))} centerValue={String(leads.length)} centerLabel={t('Total leads')} height={260} colors={[chartColors.navy, chartColors.emerald, chartColors.sky, chartColors.amber, chartColors.violet, chartColors.rose, chartColors.teal, chartColors.slate]} />
      </ChartCard>
      <Card className="p-5">
        <SectionTitle title={t('Source quality')} description={t('Conversion by acquisition channel.')} />
        <div className="space-y-4">
          {data.slice(0, 6).map((d) => (
            <div key={d.source}>
              <div className="mb-1.5 flex items-center justify-between text-[11px]"><span className="font-medium">{sourceLabel[d.source]}</span><span className="text-muted-foreground">{d.total} {t('leads')} · {d.conv}% {t('won')}</span></div>
              <Progress value={d.total ? (d.qualified / d.total) * 100 : 0} tone="accent" />
            </div>
          ))}
        </div>
      </Card>
      <ChartCard title={t('Cost and volume mix')} description={t('Demo attribution — no live ad spend is connected.')} className="xl:col-span-2">
        <BarsChart data={data.map((d) => ({ name: sourceLabel[d.source], leads: d.total, qualified: d.qualified }))} series={[{ key: 'leads', label: t('Leads'), color: chartColors.navy }, { key: 'qualified', label: t('Qualified'), color: chartColors.emerald }]} height={250} />
      </ChartCard>
      <Card className="xl:col-span-2">
        <Table>
          <TableHeader><TableRow><TableHead>{t('Source')}</TableHead><TableHead>{t('Leads')}</TableHead><TableHead>{t('Qualified')}</TableHead><TableHead>{t('Won')}</TableHead><TableHead>{t('Conversion')}</TableHead><TableHead>{t('Average budget')}</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.source}>
                <TableCell className="font-medium">{sourceLabel[d.source]}</TableCell>
                <TableCell>{d.total}</TableCell>
                <TableCell>{d.qualified}</TableCell>
                <TableCell>{d.won}</TableCell>
                <TableCell><Badge tone={d.conv >= 20 ? 'green' : d.conv >= 10 ? 'amber' : 'default'}>{d.conv}%</Badge></TableCell>
                <TableCell className="tabular-nums">{formatEGP(d.avgBudget, 'en', true)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

function DistributionTab({ leads, employees, onAssign }: { leads: Lead[]; employees: ReturnType<typeof useAppStore.getState>['employees']; onAssign: (ids: string[]) => void }) {
  const { t } = useI18n()
  const agents = employees.filter((e) => e.role === 'agent')
  const unassigned = leads.filter((l) => !['won', 'lost'].includes(l.status) && l.priority === 'urgent')
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <SectionTitle title={t('Assignment capacity')} description={t('Active lead load against each consultant.')} action={<Button size="xs" variant="outline" onClick={() => onAssign(unassigned.map((l) => l.id))} disabled={unassigned.length === 0}><GitBranch className="size-3" /> {t('Rebalance urgent')}</Button>} />
          <div className="space-y-3.5">
            {agents.map((e) => {
              const active = leads.filter((l) => l.assigneeId === e.id && !['won', 'lost'].includes(l.status))
              const capacity = 12
              return (
                <div key={e.id} className="flex items-center gap-3">
                  <Avatar name={e.name} color={e.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-[12px]"><span className="truncate font-medium">{e.name}</span><span className="shrink-0 text-[10px] text-muted-foreground">{active.length}/{capacity} {t('open leads')}</span></div>
                    <Progress value={(active.length / capacity) * 100} tone={active.length >= capacity ? 'amber' : 'accent'} className="mt-1.5" />
                  </div>
                  <Button size="xs" variant="ghost" onClick={() => onAssign(active.slice(0, 3).map((l) => l.id))} disabled={active.length === 0}>{t('Move')}</Button>
                </div>
              )
            })}
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title={t('Assignment rules')} description={t('Applied in order when a new lead arrives.')} />
          <div className="space-y-2.5">
            {[
              ['Website + score above 70', 'Alpha Sales · round robin', 'Auto'],
              ['North Coast inquiries', 'Coastal specialists first', 'Auto'],
              ['Broker-sourced leads', 'Partnership desk review', 'Manual'],
              ['Walk-in leads', 'Branch manager routing', 'Auto'],
            ].map(([rule, action, mode]) => (
              <div key={rule} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-muted"><GitBranch className="size-3" /></span>
                <div className="min-w-0 flex-1"><p className="text-[12px] font-medium">{t(rule)}</p><p className="text-[10px] text-muted-foreground">{t(action)}</p></div>
                <Badge tone={mode === 'Auto' ? 'green' : 'amber'}>{t(mode)}</Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => { window.location.assign('/crm/settings?tab=assignment') }}>{t('Configure rules')} <ArrowRight className="size-3.5 rtl:rotate-180" /></Button>
        </Card>
      </div>
      <TableShell header={<><div><p className="text-[13px] font-semibold">{t('Urgent leads needing an owner')}</p><p className="text-[10px] text-muted-foreground">{unassigned.length} {t('urgent leads currently active')}</p></div><Button size="xs" onClick={() => onAssign(unassigned.map((l) => l.id))} disabled={unassigned.length === 0}><UserPlus className="size-3" /> {t('Bulk assign')}</Button></>}>
        {unassigned.length === 0 ? <EmptyState icon={Check} title={t('Everything is assigned')} description={t('No urgent leads are waiting for distribution.')} /> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t('Lead')}</TableHead><TableHead>{t('Location')}</TableHead><TableHead>{t('Budget')}</TableHead><TableHead>{t('Owner')}</TableHead><TableHead>{t('Action')}</TableHead></TableRow></TableHeader>
            <TableBody>{unassigned.map((l) => (
              <TableRow key={l.id}><TableCell><Link className="font-medium hover:text-accent" to={`/crm/leads/${l.id}`}>{l.name}</Link></TableCell><TableCell>{l.location}</TableCell><TableCell>{formatEGP(l.budgetMax, 'en', true)}</TableCell><TableCell className="text-muted-foreground">{employees.find((e) => e.id === l.assigneeId)?.name}</TableCell><TableCell><Button size="xs" variant="outline" onClick={() => onAssign([l.id])}>{t('Assign')}</Button></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        )}
      </TableShell>
    </div>
  )
}

function ScoringTab({ leads, filter, setFilter, onRecalculate }: { leads: Lead[]; filter: string; setFilter: (v: string) => void; onRecalculate: () => void }) {
  const { t } = useI18n()
  const buckets = [
    { id: 'hot', label: 'Hot', range: '75–100', tone: 'red' as const, match: (l: Lead) => l.score >= 75 },
    { id: 'warm', label: 'Warm', range: '50–74', tone: 'amber' as const, match: (l: Lead) => l.score >= 50 && l.score < 75 },
    { id: 'cold', label: 'Cold', range: '0–49', tone: 'default' as const, match: (l: Lead) => l.score < 50 },
  ]
  const rows = [...leads].filter((l) => filter === 'all' || (buckets.find((b) => b.id === filter)?.match(l) ?? true)).sort((a, b) => b.score - a.score)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {buckets.map((b) => {
          const count = leads.filter(b.match).length
          return (
            <button key={b.id} onClick={() => setFilter(filter === b.id ? 'all' : b.id)} className={cn('rounded-xl border bg-card p-4 text-start transition-colors', filter === b.id ? 'border-accent' : 'border-border hover:bg-muted/30')}>
              <div className="flex items-center justify-between"><Badge tone={b.tone}>{t(b.label)}</Badge><span className="text-[10px] text-muted-foreground">{b.range}</span></div>
              <p className="mt-3 text-2xl font-semibold">{count}</p>
              <p className="text-[11px] text-muted-foreground">{t('leads')} · {leads.length ? Math.round((count / leads.length) * 100) : 0}% {t('of pipeline')}</p>
            </button>
          )
        })}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <TableShell header={<><p className="text-[13px] font-semibold">{t('Scored leads')}</p><Button size="xs" variant="outline" onClick={onRecalculate}><RefreshCw className="size-3" /> {t('Recalculate scores')}</Button></>} footer={undefined}>
          {rows.length === 0 ? <EmptyState icon={SearchX} title={t('No leads in this band')} /> : (
            <Table>
              <TableHeader><TableRow><TableHead>{t('Lead')}</TableHead><TableHead>{t('Score')}</TableHead><TableHead>{t('Signals')}</TableHead><TableHead>{t('Owner')}</TableHead><TableHead>{t('Next follow-up')}</TableHead></TableRow></TableHeader>
              <TableBody>{rows.slice(0, 12).map((l) => (
                <TableRow key={l.id}>
                  <TableCell><Link to={`/crm/leads/${l.id}`} className="font-medium hover:text-accent">{l.name}</Link><p className="text-[10px] text-muted-foreground">{l.location}</p></TableCell>
                  <TableCell><span className={cn('text-[13px] font-semibold', l.score >= 75 ? 'text-emerald-600 dark:text-emerald-400' : '')}>{l.score}</span></TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{(l.score >= 75 ? ['High intent', 'Fast replies'] : l.budgetMax >= 10_000_000 ? ['High budget'] : ['Nurture']).map((s) => <Badge key={s} tone="outline">{t(s)}</Badge>)}</div></TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">{useAppStore.getState().employees.find((e) => e.id === l.assigneeId)?.name ?? '—'}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">{formatDate(l.nextFollowUp, 'en', 'dd MMM')}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </TableShell>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2"><BrainCircuit className="size-4 text-accent" /><h3 className="text-[14px] font-semibold">{t('Scoring model')}</h3></div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t('Demo scoring combines engagement recency, budget, priority and activity depth. It runs locally and is not a production ML model.')}</p>
          <div className="mt-4 space-y-3">
            {[['Engagement recency', 30], ['Budget fit', 25], ['Activity depth', 20], ['Priority', 15], ['Source quality', 10]].map(([label, weight]) => (
              <div key={label as string}><div className="mb-1 flex justify-between text-[11px]"><span>{t(label as string)}</span><span className="text-muted-foreground">{weight}%</span></div><Progress value={weight as number} tone="navy" /></div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-muted/60 p-3 text-[10px] leading-relaxed text-muted-foreground">{t('Scores are recalculated on demand and stored with each lead in this browser.')}</div>
        </Card>
      </div>
    </div>
  )
}

function SegmentsTab({ leads, segment, setSegment }: { leads: Lead[]; segment: string; setSegment: (s: string) => void }) {
  const { t } = useI18n()
  const active = segmentDefs.find((s) => s.id === segment) ?? segmentDefs[0]
  const rows = leads.filter(active.match)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {segmentDefs.map((s) => {
          const count = leads.filter(s.match).length
          return (
            <button key={s.id} onClick={() => setSegment(s.id)} className={cn('rounded-xl border bg-card p-4 text-start transition-all', segment === s.id ? 'border-accent shadow-sm' : 'border-border hover:border-slate-300')}>
              <div className="flex items-center justify-between"><Badge tone={s.tone}>{t(s.label)}</Badge><span className="text-[18px] font-semibold">{count}</span></div>
              <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{t(s.description)}</p>
            </button>
          )
        })}
      </div>
      <TableShell header={<><div><p className="text-[13px] font-semibold">{t(active.label)}</p><p className="text-[10px] text-muted-foreground">{rows.length} {t('leads in this segment')}</p></div><Button size="xs" variant="outline" onClick={() => downloadCsv('segment.csv', [['Name', 'Phone', 'Budget', 'Status'], ...rows.map((l) => [l.name, l.phone, l.budgetMax, l.status])])}><Download className="size-3" /> {t('Export segment')}</Button></>}>
        {rows.length === 0 ? <EmptyState icon={Tags} title={t('No leads in this segment')} description={t('Try another segment or adjust your lead data.')} /> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t('Lead')}</TableHead><TableHead>{t('Phone')}</TableHead><TableHead>{t('Budget')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead>{t('Last contact')}</TableHead></TableRow></TableHeader>
            <TableBody>{rows.slice(0, 14).map((l) => (
              <TableRow key={l.id}>
                <TableCell><Link to={`/crm/leads/${l.id}`} className="font-medium hover:text-accent">{l.name}</Link><p className="text-[10px] text-muted-foreground">{l.location}</p></TableCell>
                <TableCell dir="ltr" className="text-[11px] text-muted-foreground">{l.phone}</TableCell>
                <TableCell>{formatEGP(l.budgetMax, 'en', true)}</TableCell>
                <TableCell><StatusBadge status={l.status} /></TableCell>
                <TableCell className="text-[11px] text-muted-foreground">{fromNow(l.lastContact)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </TableShell>
    </div>
  )
}

function DuplicatesTab({ duplicates, onDismiss, onLink }: { duplicates: { lead: Lead; customer?: { name: string } }[]; onDismiss: (id: string) => void; onLink: (lead: Lead, customerName: string) => void }) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <Card className="border-amber-200/70 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
        <div className="flex items-start gap-3">
          <Copy className="mt-0.5 size-4 text-amber-600" />
          <div><p className="text-[13px] font-semibold">{t('Duplicate detection')}</p><p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{t('The demo compares lead names against existing customer records. In a production deployment this would use phone, national ID, email and fuzzy matching with merge history.')}</p></div>
        </div>
      </Card>
      {duplicates.length === 0 ? (
        <Card><EmptyState icon={Sparkles} title={t('No duplicates detected')} description={t('Every lead is currently unique against the customer database. New matches will appear here automatically.')} /></Card>
      ) : (
        <TableShell header={<p className="text-[13px] font-semibold">{duplicates.length} {t('possible duplicate records')}</p>}>
          <Table>
            <TableHeader><TableRow><TableHead>{t('Lead')}</TableHead><TableHead>{t('Existing customer')}</TableHead><TableHead>{t('Match')}</TableHead><TableHead className="text-end">{t('Action')}</TableHead></TableRow></TableHeader>
            <TableBody>{duplicates.map(({ lead, customer }) => (
              <TableRow key={lead.id}>
                <TableCell><Link to={`/crm/leads/${lead.id}`} className="font-medium hover:text-accent">{lead.name}</Link><p className="text-[10px] text-muted-foreground">{lead.phone} · {lead.location}</p></TableCell>
                <TableCell><span className="font-medium">{customer?.name}</span><p className="text-[10px] text-muted-foreground">{t('Customer record')}</p></TableCell>
                <TableCell><Badge tone="amber">98% {t('name match')}</Badge></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Button size="xs" variant="outline" onClick={() => onDismiss(lead.id)}><X className="size-3" /> {t('Keep separate')}</Button>
                    <Button size="xs" onClick={() => onLink(lead, customer?.name ?? '')}><Link2 className="size-3" /> {t('Link records')}</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TableShell>
      )}
    </div>
  )
}
