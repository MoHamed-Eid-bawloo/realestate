import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, BriefcaseBusiness, CalendarClock, ChevronRight, Contact, Download, Mail, MapPin,
  MessageCircle, Phone, Plus, Search, Sparkles, Star, TrendingUp, UserCheck, UserPlus, Users, Wallet,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/appStore'
import { useTab } from '@/lib/useTab'
import { formatDate, formatEGP, fromNow, initials } from '@/lib/format'
import { sourceLabel } from '@/lib/labels'
import { cn, downloadCsv } from '@/lib/utils'
import type { Customer } from '@/types'
import { PageHeader, StatCard, SearchInput, TableShell, InfoRow, SectionTitle, DataTableEmpty } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input, Select, Textarea, Field } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Sheet } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown'
import { Avatar, EmptyState, Progress } from '@/components/ui/misc'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const customerTabs = [
  { id: 'all', label: 'All customers' },
  { id: 'buyers', label: 'Buyers' },
  { id: 'investors', label: 'Investors' },
  { id: 'tenants', label: 'Tenants' },
  { id: '360', label: 'Customer 360' },
]

export function CustomersPage() {
  const { t } = useI18n()
  const { tab, setTab } = useTab('all')
  const navigate = useNavigate()
  const activeCompanyId = useAppStore((s) => s.activeCompanyId)
  const customersAll = useAppStore((s) => s.customers)
  const employees = useAppStore(useShallow((s) => s.employees.filter((e) => e.companyId === s.activeCompanyId)))
  const deals = useAppStore((s) => s.deals)
  const transactions = useAppStore((s) => s.transactions)
  const updateCustomer = useAppStore((s) => s.updateCustomer)
  const addCustomer = useAppStore((s) => s.addCustomer)
  const toast = useAppStore((s) => s.toast)
  const role = useAppStore((s) => s.role)

  const customers = useMemo(() => customersAll.filter((c) => c.companyId === activeCompanyId), [customersAll, activeCompanyId])
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [owner, setOwner] = useState('all')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [note, setNote] = useState('')

  const filtered = useMemo(() => customers.filter((c) => {
    const term = q.trim().toLowerCase()
    if (term && ![c.name, c.phone, c.email, c.preferredLocations.join(' ')].join(' ').toLowerCase().includes(term)) return false
    if (type !== 'all' && c.type !== type) return false
    if (owner !== 'all' && c.assignedTo !== owner) return false
    if (tab === 'buyers' && c.type !== 'buyer') return false
    if (tab === 'investors' && c.type !== 'investor') return false
    if (tab === 'tenants' && c.type !== 'tenant') return false
    return true
  }), [customers, q, type, owner, tab])

  const lifetime = (name: string) => transactions.filter((tx) => tx.customerName === name && tx.status === 'completed').reduce((s, tx) => s + tx.amount, 0)
  const open = (customer: Customer) => { setSelected(customer); setSheetOpen(true); setNote('') }

  const addNote = () => {
    if (!selected || note.trim().length < 3) return
    updateCustomer(selected.id, {
      notes: [{ id: `n${Date.now()}`, author: 'You', text: note.trim(), at: new Date().toISOString() }, ...selected.notes],
      timeline: [{ id: `t${Date.now()}`, type: 'note', title: 'Note added', detail: note.trim(), at: new Date().toISOString(), actor: 'You' }, ...selected.timeline],
      lastInteraction: new Date().toISOString(),
    })
    setSelected({ ...selected, notes: [{ id: `n${Date.now()}`, author: 'You', text: note.trim(), at: new Date().toISOString() }, ...selected.notes] })
    setNote('')
    toast('Note added', 'The customer timeline was updated.')
  }

  return (
    <div>
      <PageHeader
        title={t('Customers')}
        description={t('A unified record of every buyer, seller, tenant and investor across your company.')}
        eyebrow={<><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-accent" /> {customers.length} {t('customers')}</span><span>·</span><span>{customers.filter((c) => c.type === 'investor').length} {t('investors')}</span></>}
        actions={<><Button variant="outline" size="sm" onClick={() => downloadCsv('customers.csv', [['Name', 'Phone', 'Email', 'Type', 'Budget min', 'Budget max', 'Locations'], ...filtered.map((c) => [c.name, c.phone, c.email, c.type, c.budgetMin, c.budgetMax, c.preferredLocations.join(' / ')])])}><Download className="size-3.5" /> {t('Export')}</Button><Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}><UserPlus className="size-3.5" /> {t('Add customer')}</Button></>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Total customers')} value={customers.length} icon={Users} tone="navy" hint={t('Across all segments')} />
        <StatCard label={t('Buyers')} value={customers.filter((c) => c.type === 'buyer').length} icon={Contact} tone="blue" hint={t('Active purchase intent')} />
        <StatCard label={t('Investors')} value={customers.filter((c) => c.type === 'investor').length} icon={TrendingUp} tone="green" hint={t('Portfolio and yield focused')} />
        <StatCard label={t('Repeat clients')} value={new Set(deals.filter((d) => d.stage === 'won').map((d) => d.customerName)).size} icon={Star} tone="amber" hint={t('Won at least one deal')} />
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {customerTabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={cn('h-8 shrink-0 rounded-lg border px-3 text-[11px] font-medium transition-colors', (tab === x.id || (tab === '' && x.id === 'all')) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>{t(x.label)}</button>
        ))}
      </div>

      {tab === '360' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const customerDeals = deals.filter((d) => d.customerName === c.name)
            return (
              <Card key={c.id} className="group p-5 transition-all hover:border-slate-300 dark:hover:border-slate-600">
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} color={c.avatarColor} size="lg" />
                  <div className="min-w-0 flex-1">
                    <button onClick={() => open(c)} className="truncate text-[14px] font-semibold hover:text-accent">{c.name}</button>
                    <p className="text-[10px] capitalize text-muted-foreground">{c.type} · {c.preferredLocations[0]}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1"><Badge tone="outline">{sourceLabel[c.source]}</Badge>{customerDeals.some((d) => d.stage === 'won') && <Badge tone="green"><Star className="size-2.5" /> {t('Client')}</Badge>}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-[10px]">
                  <div><p className="text-muted-foreground">{t('Budget')}</p><p className="mt-0.5 text-[12px] font-semibold">{formatEGP(c.budgetMax, 'en', true)}</p></div>
                  <div><p className="text-muted-foreground">{t('Lifetime value')}</p><p className="mt-0.5 text-[12px] font-semibold">{formatEGP(lifetime(c.name), 'en', true)}</p></div>
                  <div><p className="text-muted-foreground">{t('Deals')}</p><p className="mt-0.5 text-[12px] font-semibold">{customerDeals.length}</p></div>
                  <div><p className="text-muted-foreground">{t('Last touch')}</p><p className="mt-0.5 text-[12px] font-semibold">{fromNow(c.lastInteraction)}</p></div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <Button size="xs" variant="outline" className="flex-1" onClick={() => open(c)}><UserCheck className="size-3" /> {t('Open 360')}</Button>
                  <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="inline-flex"><Button size="xs" variant="ghost"><Phone className="size-3" /></Button></a>
                  <Button size="xs" variant="ghost" onClick={() => toast('WhatsApp opened in demo', 'Message threads are simulated in the unified inbox.', 'info')}><MessageCircle className="size-3" /></Button>
                </div>
              </Card>
            )
          })}
          {filtered.length === 0 && <Card className="sm:col-span-2 xl:col-span-3"><DataTableEmpty title={t('No customers found')} description={t('Add your first customer or clear the filters.')} action={<Button size="sm" onClick={() => setFormOpen(true)}><Plus className="size-3.5" /> {t('Add customer')}</Button>} /></Card>}
        </div>
      ) : (
        <TableShell header={
          <div className="flex w-full flex-wrap items-center gap-2">
            <SearchInput value={q} onChange={setQ} placeholder={t('Search customers…')} className="w-full sm:w-64" />
            <Select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-auto"><option value="all">{t('All types')}</option>{['buyer', 'seller', 'tenant', 'investor'].map((x) => <option key={x} value={x}>{x}</option>)}</Select>
            <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="h-9 w-auto"><option value="all">{t('All owners')}</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select>
            <Button variant="outline" size="sm" onClick={() => downloadCsv('customers.csv', [['Name', 'Phone', 'Email', 'Type', 'Budget max'], ...filtered.map((c) => [c.name, c.phone, c.email, c.type, c.budgetMax])])}><Download className="size-3.5" /> {t('Export')}</Button>
          </div>
        }>
          {filtered.length === 0 ? <DataTableEmpty title={t('No customers match')} description={t('Try a different search or segment.')} /> : (
            <Table>
              <TableHeader><TableRow><TableHead>{t('Customer')}</TableHead><TableHead>{t('Type')}</TableHead><TableHead>{t('Contact')}</TableHead><TableHead>{t('Budget')}</TableHead><TableHead>{t('Preferred areas')}</TableHead><TableHead>{t('Owner')}</TableHead><TableHead>{t('Last interaction')}</TableHead><TableHead className="w-8" /></TableRow></TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const own = employees.find((e) => e.id === c.assignedTo)
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <button onClick={() => open(c)} className="flex items-center gap-2.5 text-start">
                          <Avatar name={c.name} color={c.avatarColor} size="sm" />
                          <span><span className="block text-[13px] font-medium hover:text-accent">{c.name}</span><span className="block text-[10px] text-muted-foreground">{c.email}</span></span>
                        </button>
                      </TableCell>
                      <TableCell><Badge tone={c.type === 'investor' ? 'green' : c.type === 'buyer' ? 'blue' : c.type === 'tenant' ? 'amber' : 'purple'} className="capitalize">{c.type}</Badge></TableCell>
                      <TableCell dir="ltr" className="whitespace-nowrap text-[11px] text-muted-foreground">{c.phone}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatEGP(c.budgetMax, 'en', true)}</TableCell>
                      <TableCell><span className="text-[11px]">{c.preferredLocations.join(', ')}</span></TableCell>
                      <TableCell>{own ? <span className="text-[11px]">{own.name}</span> : <span className="text-[11px] text-muted-foreground">{t('Unassigned')}</span>}</TableCell>
                      <TableCell className="whitespace-nowrap text-[11px] text-muted-foreground">{fromNow(c.lastInteraction)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><ChevronRight className="size-4 rotate-90" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => open(c)}><UserCheck /> {t('Customer 360')}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => navigate(`/crm/customers/${c.id}`)}><Contact /> {t('Open profile')}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { setEditing(c); setFormOpen(true) }}><Sparkles /> {t('Edit customer')}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toast('Intro email queued', `A demo email would be sent to ${c.email}.`, 'info')}><Mail /> {t('Send email')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => navigate(`/crm/pipeline?tab=deals&customer=${c.id}`)}><BriefcaseBusiness /> {t('View deals')}</DropdownMenuItem>
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
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} width="520px">
        {selected && (
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-5 pb-4">
              <div className="flex items-start gap-3 pe-8">
                <Avatar name={selected.name} color={selected.avatarColor} size="lg" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold">{selected.name}</h2>
                  <p className="text-[11px] capitalize text-muted-foreground">{selected.type} · {sourceLabel[selected.source]}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5"><Badge tone="outline">{selected.preferredType}</Badge><Badge tone="outline">{selected.bedrooms} {t('bedrooms')}</Badge></div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <a href={`tel:${selected.phone.replace(/\s/g, '')}`}><Button variant="outline" size="sm" className="w-full"><Phone className="size-3.5" /></Button></a>
                <Button variant="outline" size="sm" onClick={() => toast('WhatsApp opened', 'Demo messaging is handled in the unified inbox.', 'info')}><MessageCircle className="size-3.5" /></Button>
                <Button variant="outline" size="sm" onClick={() => toast('Email composer', `A demo message to ${selected.email} would open here.`, 'info')}><Mail className="size-3.5" /></Button>
              </div>
            </div>
            <div className="thin-scrollbar flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3"><p className="text-[10px] text-muted-foreground">{t('Lifetime value')}</p><p className="mt-1 text-[15px] font-semibold">{formatEGP(lifetime(selected.name), 'en', true)}</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-[10px] text-muted-foreground">{t('Open deals')}</p><p className="mt-1 text-[15px] font-semibold">{deals.filter((d) => d.customerName === selected.name && !['won', 'lost'].includes(d.stage)).length}</p></div>
              </div>
              <div>
                <h3 className="mb-2 text-[12px] font-semibold">{t('Preferences')}</h3>
                <div className="divide-y divide-border rounded-lg border border-border px-3">
                  <InfoRow label={t('Budget')} value={`${formatEGP(selected.budgetMin, 'en', true)} – ${formatEGP(selected.budgetMax, 'en', true)}`} />
                  <InfoRow label={t('Locations')} value={selected.preferredLocations.join(', ')} />
                  <InfoRow label={t('Property type')} value={<span className="capitalize">{selected.preferredType}</span>} />
                  <InfoRow label={t('Assigned to')} value={employees.find((e) => e.id === selected.assignedTo)?.name ?? t('Unassigned')} />
                  <InfoRow label={t('Customer since')} value={formatDate(selected.createdAt)} />
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-[12px] font-semibold">{t('Notes')}</h3>
                <div className="flex gap-2">
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t('Add a note for the team…')} />
                  <Button className="h-auto shrink-0" size="icon" onClick={addNote}><Plus className="size-4" /></Button>
                </div>
                <div className="mt-2 space-y-2">
                  {selected.notes.map((n) => <div key={n.id} className="rounded-lg bg-muted/50 p-2.5"><p className="text-[10px] font-medium">{n.author} · {fromNow(n.at)}</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{n.text}</p></div>)}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-[12px] font-semibold">{t('Recent timeline')}</h3>
                <div className="space-y-3">
                  {selected.timeline.slice(0, 5).map((x) => (
                    <div key={x.id} className="flex gap-2.5"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" /><div><p className="text-[11px] font-medium">{x.title}</p><p className="text-[10px] text-muted-foreground">{x.detail}</p><p className="mt-0.5 text-[9px] text-muted-foreground/70">{fromNow(x.at)}</p></div></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-border p-4">
              <Button className="w-full" onClick={() => { setSheetOpen(false); navigate(`/crm/customers/${selected.id}`) }}>{t('Open full customer profile')} <ChevronRight className="size-4 rtl:rotate-180" /></Button>
            </div>
          </div>
        )}
      </Sheet>

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} employees={employees} companyId={activeCompanyId} onSave={(c) => { if (editing) updateCustomer(editing.id, c); else addCustomer(c); toast(editing ? 'Customer updated' : 'Customer added', `${c.name} was saved.`) }} />
    </div>
  )
}

function CustomerFormDialog({ open, onOpenChange, customer, employees, companyId, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; customer: Customer | null; employees: ReturnType<typeof useAppStore.getState>['employees']; companyId: string; onSave: (c: Customer) => void }) {
  const { t } = useI18n()
  const [name, setName] = useState(customer?.name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [type, setType] = useState<Customer['type']>(customer?.type ?? 'buyer')
  const [budgetMin, setBudgetMin] = useState(customer?.budgetMin ?? 5000000)
  const [budgetMax, setBudgetMax] = useState(customer?.budgetMax ?? 10000000)
  const [location, setLocation] = useState(customer?.preferredLocations[0] ?? 'New Cairo')
  const [propertyType, setPropertyType] = useState<Customer['preferredType']>(customer?.preferredType ?? 'apartment')
  const [assignedTo, setAssignedTo] = useState(customer?.assignedTo ?? employees.find((e) => e.role === 'agent')?.id ?? employees[0]?.id ?? 'e3')

  const reset = () => {
    setName(customer?.name ?? ''); setPhone(customer?.phone ?? ''); setEmail(customer?.email ?? ''); setType(customer?.type ?? 'buyer')
    setBudgetMin(customer?.budgetMin ?? 5000000); setBudgetMax(customer?.budgetMax ?? 10000000)
    setLocation(customer?.preferredLocations[0] ?? 'New Cairo'); setPropertyType(customer?.preferredType ?? 'apartment')
    setAssignedTo(customer?.assignedTo ?? employees.find((e) => e.role === 'agent')?.id ?? 'e3')
  }

  const save = () => {
    if (name.trim().length < 2 || phone.trim().length < 8 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    onSave({
      id: customer?.id ?? `cu${Date.now()}`, companyId: customer?.companyId ?? companyId, name: name.trim(), phone: phone.trim(), email: email.trim(),
      type, budgetMin, budgetMax, preferredLocations: [location], preferredType: propertyType, bedrooms: customer?.bedrooms ?? 3,
      assignedTo, createdAt: customer?.createdAt ?? new Date().toISOString(), avatarColor: customer?.avatarColor ?? '#0F766E',
      notes: customer?.notes ?? [], lastInteraction: customer?.lastInteraction ?? new Date().toISOString(), source: customer?.source ?? 'website', timeline: customer?.timeline ?? [],
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) reset() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{customer ? t('Edit customer') : t('Add customer')}</DialogTitle><DialogDescription>{t('Keep contact details and buying preferences in one place.')}</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('Full name')} required><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label={t('Phone')} required><Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" /></Field>
          <Field label={t('Email')} required><Input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" /></Field>
          <Field label={t('Customer type')}><Select value={type} onChange={(e) => setType(e.target.value as Customer['type'])}>{['buyer', 'seller', 'tenant', 'investor'].map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
          <Field label={t('Budget from')}><Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(Number(e.target.value))} /></Field>
          <Field label={t('Budget to')}><Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(Number(e.target.value))} /></Field>
          <Field label={t('Preferred location')}><Input value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
          <Field label={t('Property type')}><Select value={propertyType} onChange={(e) => setPropertyType(e.target.value as Customer['preferredType'])}>{['apartment', 'villa', 'townhouse', 'penthouse', 'duplex', 'chalet', 'office', 'retail'].map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
          <Field label={t('Assigned to')}><Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></Field>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button><Button onClick={save}>{customer ? t('Save changes') : t('Create customer')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CustomerDetailPage() {
  const { id } = useParams()
  const { t } = useI18n()
  const navigate = useNavigate()
  const customer = useAppStore((s) => s.customers.find((c) => c.id === id))
  const employees = useAppStore((s) => s.employees)
  const deals = useAppStore(useShallow((s) => s.deals.filter((d) => d.customerName === customer?.name)))
  const transactions = useAppStore(useShallow((s) => s.transactions.filter((tx) => tx.customerName === customer?.name)))
  const properties = useAppStore((s) => s.properties)
  const updateCustomer = useAppStore((s) => s.updateCustomer)
  const toast = useAppStore((s) => s.toast)
  const [note, setNote] = useState('')

  if (!customer) {
    return <Card><EmptyState icon={Contact} title={t('Customer not found')} description={t('This customer may have been removed from the demo workspace.')} action={<Button onClick={() => navigate('/crm/customers')}>{t('Back to customers')}</Button>} /></Card>
  }

  const owner = employees.find((e) => e.id === customer.assignedTo)
  const lifetime = transactions.filter((tx) => tx.status === 'completed').reduce((s, tx) => s + tx.amount, 0)

  const addNote = () => {
    if (note.trim().length < 3) return
    updateCustomer(customer.id, {
      notes: [{ id: `n${Date.now()}`, author: 'You', text: note.trim(), at: new Date().toISOString() }, ...customer.notes],
      timeline: [{ id: `t${Date.now()}`, type: 'note', title: 'Note added', detail: note.trim(), at: new Date().toISOString(), actor: 'You' }, ...customer.timeline],
    })
    setNote('')
    toast('Note added', 'Customer timeline updated.')
  }

  return (
    <div>
      <button onClick={() => navigate('/crm/customers')} className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5 rtl:rotate-180" /> {t('Customers')}</button>
      <PageHeader
        title={customer.name}
        description={`${customer.type[0].toUpperCase() + customer.type.slice(1)} · ${customer.preferredLocations.join(', ')} · ${t('Customer since')} ${formatDate(customer.createdAt, 'en', 'MMM yyyy')}`}
        eyebrow={<><Badge tone={customer.type === 'investor' ? 'green' : 'blue'} className="capitalize">{customer.type}</Badge><Badge tone="outline">{sourceLabel[customer.source]}</Badge></>}
        actions={<><a href={`tel:${customer.phone.replace(/\s/g, '')}`}><Button variant="outline" size="sm"><Phone className="size-3.5" /> {t('Call')}</Button></a><Button variant="outline" size="sm" onClick={() => toast('WhatsApp opened', 'Demo messaging is simulated.', 'info')}><MessageCircle className="size-3.5" /> WhatsApp</Button><Button size="sm" onClick={() => navigate(`/crm/customers?tab=360`)}><UserCheck className="size-3.5" /> {t('Customer 360')}</Button></>}
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Lifetime value')} value={formatEGP(lifetime, 'en', true)} icon={Wallet} tone="green" hint={`${transactions.filter((x) => x.status === 'completed').length} ${t('completed transactions')}`} />
        <StatCard label={t('Deals')} value={deals.length} icon={BriefcaseBusiness} tone="navy" hint={`${deals.filter((d) => d.stage === 'won').length} ${t('won')}`} />
        <StatCard label={t('Budget')} value={formatEGP(customer.budgetMax, 'en', true)} icon={TrendingUp} tone="blue" hint={`${formatEGP(customer.budgetMin, 'en', true)} – ${formatEGP(customer.budgetMax, 'en', true)}`} />
        <StatCard label={t('Last interaction')} value={fromNow(customer.lastInteraction)} icon={CalendarClock} tone="amber" hint={owner ? `${t('Owner')}: ${owner.name}` : t('Unassigned')} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle title={t('Timeline')} description={t('Every touchpoint with this customer.')} />
            <div className="space-y-4">
              {customer.timeline.map((x) => (
                <div key={x.id} className="flex gap-3"><span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[8px] font-semibold">{x.type.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-1"><p className="text-[12px] font-medium">{x.title}</p><span className="text-[9px] text-muted-foreground">{fromNow(x.at)}</span></div><p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{x.detail}</p></div></div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <SectionTitle title={t('Deals and transactions')} />
            {deals.length === 0 ? <p className="text-[11px] text-muted-foreground">{t('No deals yet.')}</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>{t('Deal')}</TableHead><TableHead>{t('Property')}</TableHead><TableHead>{t('Value')}</TableHead><TableHead>{t('Stage')}</TableHead><TableHead>{t('Agent')}</TableHead></TableRow></TableHeader>
                <TableBody>{deals.map((d) => <TableRow key={d.id}><TableCell className="font-medium">{d.code}</TableCell><TableCell className="max-w-[220px] truncate">{d.propertyTitle}</TableCell><TableCell>{formatEGP(d.value, 'en', true)}</TableCell><TableCell><StatusBadge status={d.stage} /></TableCell><TableCell className="text-[11px] text-muted-foreground">{employees.find((e) => e.id === d.agentId)?.name ?? '—'}</TableCell></TableRow>)}</TableBody>
              </Table>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle title={t('Profile')} />
            <div className="divide-y divide-border"><InfoRow label={t('Phone')} value={<span dir="ltr">{customer.phone}</span>} /><InfoRow label={t('Email')} value={<span dir="ltr">{customer.email}</span>} /><InfoRow label={t('Locations')} value={customer.preferredLocations.join(', ')} /><InfoRow label={t('Property type')} value={customer.preferredType} /><InfoRow label={t('Bedrooms')} value={customer.bedrooms} /><InfoRow label={t('Owner')} value={owner?.name ?? t('Unassigned')} /></div>
          </Card>
          <Card className="p-5">
            <SectionTitle title={t('Notes')} />
            <div className="flex gap-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t('Add note…')} /><Button size="icon" className="h-auto" onClick={addNote}><Plus className="size-4" /></Button></div>
            <div className="mt-3 space-y-2">{customer.notes.map((n) => <div key={n.id} className="rounded-lg bg-muted/50 p-2.5"><p className="text-[10px] font-medium">{n.author} · {fromNow(n.at)}</p><p className="mt-1 text-[11px] text-muted-foreground">{n.text}</p></div>)}</div>
          </Card>
          <Card className="p-5">
            <SectionTitle title={t('Recommended properties')} />
            <div className="space-y-2">{properties.filter((p) => p.price <= customer.budgetMax).slice(0, 3).map((p) => <Link key={p.id} to={`/properties/${p.id}`} className="flex gap-2 rounded-lg border border-border p-2 hover:bg-muted/40"><img src={p.images[0]} alt="" className="size-10 rounded object-cover" /><div className="min-w-0"><p className="truncate text-[11px] font-medium">{p.title}</p><p className="text-[9px] text-muted-foreground">{formatEGP(p.price, 'en', true)}</p></div></Link>)}</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
