import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, BarChart3, Building2, CalendarClock, CheckCircle2, CircleDollarSign, Clock,
  Download, Eye, Handshake, Layers, LayoutDashboard, Mail, MapPin, Pencil, Phone, Plus, Send, ShieldCheck,
  TrendingUp, Users, Wallet,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { formatDate, formatEGP, formatNumber } from '@/lib/format'
import { cn, downloadCsv, uid } from '@/lib/utils'
import { InfoRow, PageHeader, SectionTitle, StatCard, UserCell } from '@/components/shared'
import { BarsChart, ChartCard, DonutChart, DonutLegend, TrendChart, chartColors } from '@/components/charts'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, EmptyState, Pagination, Progress } from '@/components/ui/misc'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Sheet } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { useTab } from '@/lib/useTab'
import type { Project, Unit } from '@/types'

const projectStatuses: Project['status'][] = ['selling', 'upcoming', 'sold_out']
const unitTypes: Unit['type'][] = ['apartment', 'duplex', 'townhouse', 'penthouse', 'villa']

function makeUnits(project: Project, count = 8): Unit[] {
  return Array.from({ length: count }, (_, i) => {
    const floor = (i % 6) + 1
    const area = 95 + ((i * 23) % 190)
    const type = unitTypes[i % unitTypes.length]
    const price = Math.round((project.priceFrom * (0.92 + (i % 5) * 0.055)) / 100000) * 100000
    const building = String.fromCharCode(65 + (i % 3))
    return {
      id: uid('u'),
      projectId: project.id,
      developerId: project.developerId,
      building: `Building ${building}`,
      floor,
      unitNumber: `${building}-${floor}0${(i % 4) + 1}`,
      area,
      bedrooms: type === 'villa' ? 5 : type === 'townhouse' || type === 'duplex' || type === 'penthouse' ? 4 : 2 + (i % 2),
      bathrooms: type === 'villa' ? 4 : 2 + (i % 2),
      price,
      type,
      status: 'available',
      deliveryDate: project.deliveryDate,
      paymentPlan: { downPaymentPct: 10, years: 8, monthly: Math.round((price * 0.8) / 96), deliveryDate: project.deliveryDate },
    }
  })
}

function useDeveloperData() {
  const developerId = useAppStore((s) => s.activeDeveloperId)
  const developer = useAppStore((s) => s.developers.find((d) => d.id === s.activeDeveloperId))
  const allProjects = useAppStore((s) => s.projects)
  const allUnits = useAppStore((s) => s.units)
  const allDeals = useAppStore((s) => s.deals)
  const allBrokers = useAppStore((s) => s.brokers)
  const projects = useMemo(() => allProjects.filter((p) => p.developerId === developerId), [allProjects, developerId])
  const units = useMemo(() => allUnits.filter((u) => u.developerId === developerId), [allUnits, developerId])
  const deals = useMemo(() => allDeals.filter((d) => d.developerId === developerId), [allDeals, developerId])
  return { developerId, developer, projects, units, deals, brokers: allBrokers }
}

function useProjectMap(projects: Project[]) {
  return useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
}

export function DeveloperOverviewPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { developer, projects, units, deals, brokers } = useDeveloperData()
  const map = useProjectMap(projects)

  const available = units.filter((u) => u.status === 'available')
  const reserved = units.filter((u) => u.status === 'reserved')
  const sold = units.filter((u) => u.status === 'sold')
  const brokerUnits = units.filter((u) => u.brokerId)
  const wonDeals = deals.filter((d) => d.stage === 'won')
  const soldValue = sold.reduce((s, u) => s + u.price, 0)
  const reservedValue = reserved.reduce((s, u) => s + u.price, 0)
  const brokerValue = brokerUnits.reduce((s, u) => s + u.price, 0)
  const sellThrough = units.length ? Math.round((sold.length / units.length) * 100) : 0
  const pipeline = deals.filter((d) => !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0)

  const projectRows = projects.map((p) => {
    const own = units.filter((u) => u.projectId === p.id)
    const soldUnits = own.filter((u) => u.status === 'sold').length
    return {
      ...p,
      units: own.length,
      available: own.filter((u) => u.status === 'available').length,
      reserved: own.filter((u) => u.status === 'reserved').length,
      sold: soldUnits,
      progress: own.length ? Math.round((soldUnits / own.length) * 100) : 0,
      value: own.reduce((s, u) => s + u.price, 0),
    }
  })

  const statusData = [
    { name: t('Available'), value: available.length },
    { name: t('Reserved'), value: reserved.length },
    { name: t('Sold'), value: sold.length },
  ]

  const salesSplit = projectRows.map((p) => ({ name: p.name, available: p.available, reserved: p.reserved, sold: p.sold }))
  const brokerRows = brokers
    .map((b) => ({ broker: b, count: brokerUnits.filter((u) => u.brokerId === b.id).length }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)

  const exportOverview = () => {
    downloadCsv('developer-overview.csv', [
      ['Project', 'Location', 'Units', 'Available', 'Reserved', 'Sold', 'Inventory value (EGP)'],
      ...projectRows.map((p) => [p.name, p.location, p.units, p.available, p.reserved, p.sold, p.value]),
    ])
  }

  return (
    <div>
      <PageHeader
        eyebrow={<><LayoutDashboard className="size-3.5" /> {t('Developer Portal')} · {developer?.name}</>}
        title={t('Developer overview')}
        description={t('Project delivery, inventory health and broker-driven sales for your portfolio.')}
        actions={<>
          <Button variant="outline" onClick={exportOverview}><Download className="size-4" /> {t('Export')}</Button>
          <Button onClick={() => navigate('/developer/projects?new=1')}><Plus className="size-4" /> {t('New project')}</Button>
        </>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label={t('Active projects')} value={projects.filter((p) => p.status === 'selling').length} icon={Building2} hint={`${projects.length} ${t('total')}`} href="/developer/projects" />
        <StatCard label={t('Total units')} value={formatNumber(units.length, lang)} icon={Layers} tone="blue" hint={`${available.length} ${t('available')}`} href="/developer/units" />
        <StatCard label={t('Sell-through')} value={`${sellThrough}%`} icon={TrendingUp} tone="green" delta={6} deltaLabel={t('vs last quarter')} />
        <StatCard label={t('Sold value')} value={formatEGP(soldValue, lang, true)} icon={Wallet} tone="green" hint={`${sold.length} ${t('units sold')}`} />
        <StatCard label={t('Reserved value')} value={formatEGP(reservedValue, lang, true)} icon={Clock} tone="amber" hint={`${reserved.length} ${t('reserved units')}`} />
        <StatCard label={t('Broker pipeline')} value={formatEGP(pipeline, lang, true)} icon={Handshake} tone="purple" hint={`${wonDeals.length} ${t('deals won')}`} href="/developer/brokers" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <ChartCard title={t('Inventory by project')} description={t('Unit mix across active communities')} action={<Badge tone="outline">{units.length} {t('units')}</Badge>}>
          <BarsChart data={salesSplit} series={[{ key: 'sold', label: t('Sold'), color: chartColors.navy }, { key: 'reserved', label: t('Reserved'), color: chartColors.amber }, { key: 'available', label: t('Available'), color: chartColors.emerald }]} height={280} stacked />
        </ChartCard>
        <ChartCard title={t('Inventory status')} description={t('Live unit availability')}>
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_1fr] xl:grid-cols-1 2xl:grid-cols-[1fr_1fr]">
            <DonutChart data={statusData} height={180} centerValue={`${sellThrough}%`} centerLabel={t('sold')} colors={[chartColors.emerald, chartColors.amber, chartColors.navy]} />
            <div className="px-3 pb-2"><DonutLegend data={statusData} colors={[chartColors.emerald, chartColors.amber, chartColors.navy]} /></div>
          </div>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div><h3 className="text-[14px] font-semibold">{t('Project performance')}</h3><p className="text-[10px] text-muted-foreground">{t('Sales progress and remaining inventory')}</p></div>
            <Button variant="ghost" size="xs" onClick={() => navigate('/developer/projects')}>{t('View all')} <ArrowRight className="size-3 rtl:rotate-180" /></Button>
          </div>
          {projectRows.length === 0 ? (
            <EmptyState icon={Building2} title={t('No projects yet')} description={t('Create your first project to start tracking inventory and broker sales.')} action={<Button size="sm" onClick={() => navigate('/developer/projects?new=1')}><Plus className="size-3.5" /> {t('New project')}</Button>} />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>{t('Project')}</TableHead><TableHead>{t('Units')}</TableHead><TableHead>{t('Progress')}</TableHead><TableHead>{t('Sold value')}</TableHead><TableHead>{t('Status')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {projectRows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <img src={p.images[0]} alt="" className="size-9 rounded-lg object-cover" />
                        <div><p className="text-[12px] font-medium">{p.name}</p><p className="text-[10px] text-muted-foreground">{t(p.location)}</p></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px]">{p.units}<span className="text-muted-foreground"> · {p.available} {t('free')}</span></TableCell>
                    <TableCell className="min-w-[120px]"><div className="flex items-center gap-2"><Progress value={p.progress} /><span className="w-8 text-end text-[10px] font-medium">{p.progress}%</span></div></TableCell>
                    <TableCell className="font-medium">{formatEGP(p.sold * (p.priceFrom || 0), lang, true)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between"><h3 className="text-[14px] font-semibold">{t('Broker activity')}</h3><Button variant="ghost" size="xs" onClick={() => navigate('/developer/brokers')}>{t('View all')}</Button></div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{formatEGP(brokerValue, lang, true)} {t('in broker-sourced inventory')}</p>
          <div className="mt-3 space-y-3">
            {brokerRows.slice(0, 5).map(({ broker, count }) => (
              <div key={broker.id} className="flex items-center gap-2.5">
                <Avatar name={broker.name} color={broker.avatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-[11px] font-medium">{broker.name} {broker.verified && <BadgeCheck className="size-3 text-sky-500" />}</p>
                  <p className="text-[9px] text-muted-foreground">{broker.companyName} · {broker.zone}</p>
                </div>
                <span className="text-[10px] font-medium">{count} {t('units')}</span>
              </div>
            ))}
            {brokerRows.length === 0 && <p className="py-6 text-center text-[11px] text-muted-foreground">{t('No broker activity yet.')}</p>}
          </div>
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium"><ShieldCheck className="size-3.5 text-accent" /> {t('Cooperation protection')}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{t('Customer details stay masked until a cooperation request is accepted by both parties.')}</p>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><h3 className="text-[14px] font-semibold">{t('Recent broker deals')}</h3><Button variant="ghost" size="xs" onClick={() => navigate('/developer/sales')}>{t('Sales performance')}</Button></div>
          {deals.length === 0 ? (
            <EmptyState icon={Handshake} title={t('No deals yet')} description={t('Broker deals on your inventory will appear here.')} />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>{t('Deal')}</TableHead><TableHead>{t('Project')}</TableHead><TableHead>{t('Value')}</TableHead><TableHead>{t('Stage')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {deals.slice(0, 5).map((d) => {
                  const unit = units.find((u) => u.projectId && u.brokerId === d.brokerId)
                  const project = unit ? map.get(unit.projectId) : undefined
                  return (
                    <TableRow key={d.id}>
                      <TableCell><p className="font-medium">{d.code}</p><p className="max-w-[180px] truncate text-[10px] text-muted-foreground">{d.customerName}</p></TableCell>
                      <TableCell className="text-[11px]">{project?.name ?? d.propertyTitle}</TableCell>
                      <TableCell className="font-medium">{formatEGP(d.value, lang, true)}</TableCell>
                      <TableCell><StatusBadge status={d.stage} /></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="text-[14px] font-semibold">{t('Delivery timeline')}</h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{t('Phases across your portfolio')}</p>
          <div className="mt-4 space-y-3">
            {projects.flatMap((p) => p.phases.map((ph) => ({ ...ph, project: p.name }))).slice(0, 6).map((ph, i) => (
              <div key={`${ph.project}-${ph.name}-${i}`} className="flex items-start gap-2.5">
                <span className={cn('mt-1 size-2 shrink-0 rounded-full', ph.status === 'delivered' ? 'bg-emerald-500' : ph.status === 'construction' ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600')} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium">{ph.project} · {ph.name}</p>
                  <p className="text-[9px] text-muted-foreground">{t(ph.status)} · {ph.delivery}</p>
                </div>
                <StatusBadge status={ph.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

type ProjectForm = {
  name: string
  nameAr: string
  location: string
  priceFrom: string
  deliveryDate: string
  status: Project['status']
  description: string
  descriptionAr: string
  amenities: string
}

function ProjectDialog({ project, developerId, onClose }: { project: Project | null; developerId: string; onClose: () => void }) {
  const { t } = useI18n()
  const addProject = useAppStore((s) => s.addProject)
  const updateProject = useAppStore((s) => s.updateProject)
  const addUnits = useAppStore((s) => s.addUnits)
  const toast = useAppStore((s) => s.toast)
  const [form, setForm] = useState<ProjectForm>({
    name: project?.name ?? '',
    nameAr: project?.nameAr ?? '',
    location: project?.location ?? 'New Cairo',
    priceFrom: project ? String(project.priceFrom) : '',
    deliveryDate: project?.deliveryDate?.slice(0, 10) ?? new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    status: project?.status ?? 'upcoming',
    description: project?.description ?? '',
    descriptionAr: project?.descriptionAr ?? '',
    amenities: project?.amenities.join(', ') ?? '',
  })
  const set = (patch: Partial<ProjectForm>) => setForm((f) => ({ ...f, ...patch }))

  const submit = () => {
    if (!form.name.trim()) {
      toast('Project name is required', 'Enter a name to create the project.', 'error')
      return
    }
    const price = Number(form.priceFrom)
    if (!price || price <= 0) {
      toast('Starting price is required', 'Add a valid price from value in EGP.', 'error')
      return
    }
    const year = new Date(form.deliveryDate).getFullYear()
    const base = {
      name: form.name.trim(),
      nameAr: form.nameAr.trim() || form.name.trim(),
      location: form.location,
      description: form.description || 'A new residential community with landscaped open space, community amenities and flexible payment plans.',
      descriptionAr: form.descriptionAr || 'مجتمع سكني جديد بمساحات خضراء ومرافق مجتمعية وخطط سداد مرنة.',
      amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      priceFrom: price,
      deliveryDate: form.deliveryDate,
      status: form.status,
      images: project?.images ?? ['/img/p1.jpg', '/img/p2.jpg', '/img/p8.jpg'],
      featured: project?.featured ?? false,
      phases: project?.phases ?? [{ name: 'Phase 1', status: 'planning' as const, delivery: String(year) }],
    }
    if (project) {
      updateProject(project.id, base)
    } else {
      const created: Project = {
        id: uid('pr'),
        developerId,
        ...base,
        totalUnits: 8,
        availableUnits: 8,
        reservedUnits: 0,
        soldUnits: 0,
      }
      addProject(created)
      addUnits(makeUnits(created, 8))
      toast('Unit inventory generated', '8 available units were added to the new project.', 'info')
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? t('Edit project') : t('New project')}</DialogTitle>
          <DialogDescription>{t('Projects are shared with the developer portal and broker network once published.')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('Project name')} required><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Aurora Gardens" /></Field>
          <Field label={t('Arabic name')}><Input value={form.nameAr} onChange={(e) => set({ nameAr: e.target.value })} dir="rtl" placeholder="حدائق أورورا" /></Field>
          <Field label={t('Location')} required>
            <Select value={form.location} onChange={(e) => set({ location: e.target.value })}>
              {['New Cairo', 'Sheikh Zayed', '6th of October', 'Mostakbal City', 'New Administrative Capital', 'North Coast', 'New Alamein', 'Maadi'].map((loc) => <option key={loc} value={loc}>{t(loc)}</option>)}
            </Select>
          </Field>
          <Field label={t('Starting price')} hint={t('EGP')} required><Input type="number" inputMode="numeric" value={form.priceFrom} onChange={(e) => set({ priceFrom: e.target.value })} placeholder="7200000" /></Field>
          <Field label={t('Delivery date')}><Input type="date" value={form.deliveryDate} onChange={(e) => set({ deliveryDate: e.target.value })} /></Field>
          <Field label={t('Status')}>
            <Select value={form.status} onChange={(e) => set({ status: e.target.value as Project['status'] })}>
              {projectStatuses.map((s) => <option key={s} value={s}>{t(s === 'selling' ? 'Selling' : s === 'upcoming' ? 'Upcoming' : 'Sold out')}</option>)}
            </Select>
          </Field>
          <Field label={t('Description')} className="sm:col-span-2"><Textarea value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder={t('Describe the community, amenities and lifestyle.')} /></Field>
          <Field label={t('Arabic description')} className="sm:col-span-2"><Textarea value={form.descriptionAr} onChange={(e) => set({ descriptionAr: e.target.value })} dir="rtl" placeholder="وصف المشروع بالعربية" /></Field>
          <Field label={t('Amenities')} hint={t('Separate with commas')} className="sm:col-span-2"><Input value={form.amenities} onChange={(e) => set({ amenities: e.target.value })} placeholder="Clubhouse, Pool, Padel courts" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('Cancel')}</Button>
          <Button onClick={submit}>{project ? t('Save changes') : t('Create project')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeveloperProjectsPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { developerId, projects, units } = useDeveloperData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | Project['status']>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [selected, setSelected] = useState<Project | null>(null)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null)
      setDialogOpen(true)
      const p = new URLSearchParams(searchParams)
      p.delete('new')
      setSearchParams(p, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filtered = projects.filter((p) => {
    if (status !== 'all' && p.status !== status) return false
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return `${p.name} ${p.nameAr} ${p.location}`.toLowerCase().includes(q)
  })

  return (
    <div>
      <PageHeader
        eyebrow={<><Building2 className="size-3.5" /> {t('Developer Portal')}</>}
        title={t('Projects')}
        description={t('Manage launches, phases and delivery timelines across your portfolio.')}
        actions={<Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="size-4" /> {t('New project')}</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search projects…')} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-[160px]">
          <option value="all">{t('All projects')}</option>
          {projectStatuses.map((s) => <option key={s} value={s}>{t(s === 'selling' ? 'Selling' : s === 'upcoming' ? 'Upcoming' : 'Sold out')}</option>)}
        </Select>
        <span className="text-[11px] text-muted-foreground">{filtered.length} {t('projects')}</span>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Building2} title={t('No projects found')} description={t('Try a different search or create a new project.')} action={<Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="size-3.5" /> {t('New project')}</Button>} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const own = units.filter((u) => u.projectId === p.id)
            const soldCount = own.filter((u) => u.status === 'sold').length
            const progress = own.length ? Math.round((soldCount / own.length) * 100) : 0
            return (
              <Card key={p.id} className="group overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/70 via-transparent to-transparent" />
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                    <StatusBadge status={p.status} />
                    <Badge tone="outline" className="border-white/30 bg-black/25 text-white">{p.phases.length} {t('phases')}</Badge>
                  </div>
                  <div className="absolute inset-x-3 bottom-3 text-white">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="flex items-center gap-1 text-[10px] text-white/80"><MapPin className="size-3" /> {t(p.location)}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{t('From')} <span className="font-semibold text-foreground">{formatEGP(p.priceFrom, lang, true)}</span></span>
                    <span className="text-muted-foreground">{own.length} {t('units')}</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2"><Progress value={progress} /><span className="w-8 text-end text-[10px] font-medium">{progress}%</span></div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 py-1.5"><p className="text-[13px] font-semibold">{own.filter((u) => u.status === 'available').length}</p><p className="text-[9px] text-muted-foreground">{t('Available')}</p></div>
                    <div className="rounded-lg bg-muted/50 py-1.5"><p className="text-[13px] font-semibold">{own.filter((u) => u.status === 'reserved').length}</p><p className="text-[9px] text-muted-foreground">{t('Reserved')}</p></div>
                    <div className="rounded-lg bg-muted/50 py-1.5"><p className="text-[13px] font-semibold">{soldCount}</p><p className="text-[9px] text-muted-foreground">{t('Sold')}</p></div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelected(p)}><Eye className="size-3.5" /> {t('Details')}</Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/developer/units?project=${p.id}`)}><Layers className="size-3.5" /> {t('Units')}</Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => { setEditing(p); setDialogOpen(true) }} aria-label={t('Edit')}><Pencil className="size-3.5" /></Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {dialogOpen && <ProjectDialog project={editing} developerId={developerId} onClose={() => { setDialogOpen(false); setEditing(null) }} />}

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)} width="520px">
        {selected && (() => {
          const own = units.filter((u) => u.projectId === selected.id)
          const soldCount = own.filter((u) => u.status === 'sold').length
          const progress = own.length ? Math.round((soldCount / own.length) * 100) : 0
          return (
            <div className="flex h-full flex-col">
              <div className="relative h-44 shrink-0 overflow-hidden">
                <img src={selected.images[0]} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/80 to-transparent" />
                <div className="absolute inset-x-5 bottom-4 text-white">
                  <StatusBadge status={selected.status} />
                  <h2 className="mt-1.5 text-lg font-semibold">{selected.name}</h2>
                  <p className="text-[11px] text-white/80">{selected.nameAr} · {t(selected.location)}</p>
                </div>
              </div>
              <div className="thin-scrollbar flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-border p-2"><p className="text-base font-semibold">{own.length}</p><p className="text-[9px] text-muted-foreground">{t('Units')}</p></div>
                  <div className="rounded-lg border border-border p-2"><p className="text-base font-semibold">{soldCount}</p><p className="text-[9px] text-muted-foreground">{t('Sold')}</p></div>
                  <div className="rounded-lg border border-border p-2"><p className="text-base font-semibold">{progress}%</p><p className="text-[9px] text-muted-foreground">{t('Sell-through')}</p></div>
                </div>
                <div className="mt-4 divide-y divide-border">
                  <InfoRow label={t('Starting price')} value={formatEGP(selected.priceFrom, lang, true)} />
                  <InfoRow label={t('Delivery date')} value={formatDate(selected.deliveryDate, lang, 'MMM yyyy')} />
                  <InfoRow label={t('Project type')} value={t('Residential')} />
                  <InfoRow label={t('Inventory value')} value={formatEGP(own.reduce((s, u) => s + u.price, 0), lang, true)} />
                </div>
                <SectionTitle title={t('Phases')} />
                <div className="space-y-2">
                  {selected.phases.map((ph, i) => (
                    <div key={`${ph.name}-${i}`} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                      <div className="flex items-center gap-2"><CalendarClock className="size-3.5 text-muted-foreground" /><span className="text-[12px] font-medium">{ph.name}</span></div>
                      <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground">{ph.delivery}</span><StatusBadge status={ph.status} /></div>
                    </div>
                  ))}
                </div>
                <SectionTitle title={t('Amenities')} />
                <div className="flex flex-wrap gap-1.5">{selected.amenities.map((a) => <Badge key={a} tone="outline">{a}</Badge>)}</div>
                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{selected.description}</p>
              </div>
              <div className="flex items-center gap-2 border-t border-border p-4">
                <Button variant="outline" className="flex-1" onClick={() => { setSelected(null); setEditing(selected); setDialogOpen(true) }}><Pencil className="size-4" /> {t('Edit project')}</Button>
                <Button className="flex-1" onClick={() => navigate(`/developer/units?project=${selected.id}`)}><Layers className="size-4" /> {t('Unit inventory')}</Button>
              </div>
            </div>
          )
        })()}
      </Sheet>
    </div>
  )
}

export function DeveloperUnitsPage() {
  const { t, lang } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const { projects, units, brokers } = useDeveloperData()
  const map = useProjectMap(projects)
  const reserveUnit = useAppStore((s) => s.reserveUnit)
  const releaseUnit = useAppStore((s) => s.releaseUnit)
  const toast = useAppStore((s) => s.toast)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | Unit['status']>('all')
  const [type, setType] = useState<'all' | Unit['type']>('all')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const pageSize = 12
  const projectFilter = searchParams.get('project') ?? 'all'

  const setProjectFilter = (value: string) => {
    const p = new URLSearchParams(searchParams)
    if (value === 'all') p.delete('project')
    else p.set('project', value)
    setSearchParams(p, { replace: true })
    setPage(1)
  }

  const filtered = useMemo(() => units.filter((u) => {
    if (projectFilter !== 'all' && u.projectId !== projectFilter) return false
    if (status !== 'all' && u.status !== status) return false
    if (type !== 'all' && u.type !== type) return false
    if (!query.trim()) return true
    const project = map.get(u.projectId)
    return `${u.unitNumber} ${u.building} ${project?.name ?? ''} ${u.type}`.toLowerCase().includes(query.trim().toLowerCase())
  }), [units, projectFilter, status, type, query, map])

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)
  const selected = units.find((u) => u.id === selectedId)

  const available = units.filter((u) => u.status === 'available').length
  const reserved = units.filter((u) => u.status === 'reserved').length
  const sold = units.filter((u) => u.status === 'sold').length
  const inventoryValue = units.reduce((s, u) => s + u.price, 0)

  const exportUnits = () => {
    downloadCsv('developer-units.csv', [
      ['Project', 'Unit', 'Building', 'Floor', 'Type', 'Area', 'Bedrooms', 'Price (EGP)', 'Status', 'Broker'],
      ...filtered.map((u) => [map.get(u.projectId)?.name ?? u.projectId, u.unitNumber, u.building, u.floor, u.type, u.area, u.bedrooms, u.price, u.status, brokers.find((b) => b.id === u.brokerId)?.name ?? '']),
    ])
    toast('Units exported', `${filtered.length} units were downloaded as CSV.`)
  }

  const reserve = (unit: Unit) => {
    const res = reserveUnit(unit.id)
    toast(res.ok ? 'Unit reserved' : 'Could not reserve', res.message, res.ok ? 'success' : 'error')
  }

  return (
    <div>
      <PageHeader
        eyebrow={<><Layers className="size-3.5" /> {t('Developer Portal')}</>}
        title={t('Unit inventory')}
        description={t('Live availability across every project. Reservations hold a unit for 48 hours.')}
        actions={<Button variant="outline" onClick={exportUnits}><Download className="size-4" /> {t('Export')}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Total units')} value={formatNumber(units.length, lang)} icon={Layers} hint={`${projects.length} ${t('projects')}`} />
        <StatCard label={t('Available')} value={available} icon={CheckCircle2} tone="green" hint={`${Math.round((available / Math.max(1, units.length)) * 100)}% ${t('of inventory')}`} />
        <StatCard label={t('Reserved')} value={reserved} icon={Clock} tone="amber" hint={t('48-hour holds')} />
        <StatCard label={t('Inventory value')} value={formatEGP(inventoryValue, lang, true)} icon={CircleDollarSign} tone="blue" hint={`${sold} ${t('units sold')}`} />
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder={t('Search unit, building, project…')} className="h-9 w-full sm:w-[240px]" />
          <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="h-9 w-[170px]">
            <option value="all">{t('All projects')}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1) }} className="h-9 w-[140px]">
            <option value="all">{t('All statuses')}</option>
            <option value="available">{t('Available')}</option>
            <option value="reserved">{t('Reserved')}</option>
            <option value="sold">{t('Sold')}</option>
          </Select>
          <Select value={type} onChange={(e) => { setType(e.target.value as typeof type); setPage(1) }} className="h-9 w-[140px]">
            <option value="all">{t('Any type')}</option>
            {unitTypes.map((x) => <option key={x} value={x}>{t(x.replace(/^./, (c) => c.toUpperCase()))}</option>)}
          </Select>
          <span className="ms-auto text-[11px] text-muted-foreground">{filtered.length} {t('units')}</span>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Layers} title={t('No units found')} description={t('Adjust the project, status or type filters.')} />
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>{t('Unit')}</TableHead><TableHead>{t('Project')}</TableHead><TableHead>{t('Type')}</TableHead><TableHead>{t('Area')}</TableHead><TableHead>{t('Bedrooms')}</TableHead><TableHead>{t('Price')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead>{t('Broker')}</TableHead><TableHead className="text-end">{t('Actions')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {pageItems.map((u) => {
                const broker = brokers.find((b) => b.id === u.brokerId)
                return (
                  <TableRow key={u.id}>
                    <TableCell><button onClick={() => setSelectedId(u.id)} className="text-start"><p className="font-medium hover:text-accent">{u.unitNumber}</p><p className="text-[10px] text-muted-foreground">{u.building} · {t('Floor')} {u.floor}</p></button></TableCell>
                    <TableCell><p className="text-[12px]">{map.get(u.projectId)?.name ?? '—'}</p><p className="text-[10px] text-muted-foreground">{t(map.get(u.projectId)?.location ?? '')}</p></TableCell>
                    <TableCell><Badge tone="outline">{t(u.type.replace(/^./, (c) => c.toUpperCase()))}</Badge></TableCell>
                    <TableCell className="text-[12px]">{formatNumber(u.area, lang)} m²</TableCell>
                    <TableCell className="text-[12px]">{u.bedrooms}</TableCell>
                    <TableCell className="font-medium">{formatEGP(u.price, lang, true)}</TableCell>
                    <TableCell><StatusBadge status={u.status} /></TableCell>
                    <TableCell>{broker ? <UserCell name={broker.name} sub={broker.companyName} color={broker.avatarColor} /> : <span className="text-[11px] text-muted-foreground">{t('Direct')}</span>}</TableCell>
                    <TableCell className="text-end">
                      {u.status === 'available' ? <Button size="xs" variant="outline" onClick={() => reserve(u)}>{t('Reserve')}</Button>
                        : u.status === 'reserved' ? <Button size="xs" variant="ghost" onClick={() => releaseUnit(u.id)}>{t('Release')}</Button>
                          : <span className="text-[10px] text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </Card>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelectedId(null)} width="440px">
        {selected && (() => {
          const project = map.get(selected.projectId)
          const broker = brokers.find((b) => b.id === selected.brokerId)
          return (
            <div className="flex h-full flex-col">
              <div className="border-b border-border p-5 pe-12">
                <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{project?.name} · {t(project?.location ?? '')}</p>
                <div className="mt-1 flex items-center gap-2"><h2 className="text-lg font-semibold">{selected.unitNumber}</h2><StatusBadge status={selected.status} /></div>
                <p className="mt-1 text-[11px] text-muted-foreground">{selected.building} · {t('Floor')} {selected.floor} · {t(selected.type)}</p>
              </div>
              <div className="thin-scrollbar flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border p-3"><p className="text-base font-semibold">{formatNumber(selected.area, lang)} m²</p><p className="text-[9px] text-muted-foreground">{t('Area')}</p></div>
                  <div className="rounded-lg border border-border p-3"><p className="text-base font-semibold">{selected.bedrooms} · {selected.bathrooms}</p><p className="text-[9px] text-muted-foreground">{t('Bedrooms')} · {t('Bathrooms')}</p></div>
                </div>
                <div className="mt-3 divide-y divide-border">
                  <InfoRow label={t('Price')} value={formatEGP(selected.price, lang, true)} />
                  <InfoRow label={t('Down payment')} value={`${selected.paymentPlan.downPaymentPct}% · ${formatEGP((selected.price * selected.paymentPlan.downPaymentPct) / 100, lang, true)}`} />
                  <InfoRow label={t('Monthly installment')} value={formatEGP(selected.paymentPlan.monthly, lang, true)} />
                  <InfoRow label={t('Years')} value={selected.paymentPlan.years} />
                  <InfoRow label={t('Delivery date')} value={formatDate(selected.deliveryDate, lang, 'MMM yyyy')} />
                  <InfoRow label={t('Broker')} value={broker?.name ?? t('Direct')} />
                </div>
                {broker && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-border p-3">
                    <Avatar name={broker.name} color={broker.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1"><p className="text-[11px] font-medium">{broker.name}</p><p className="text-[9px] text-muted-foreground">{broker.companyName} · {broker.zone}</p></div>
                    <Badge tone={broker.verified ? 'green' : 'amber'}>{broker.verified ? t('Verified') : t('Pending')}</Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2 border-t border-border p-4">
                {selected.status === 'available' && <Button className="flex-1" onClick={() => reserve(selected)}><Clock className="size-4" /> {t('Reserve unit')}</Button>}
                {selected.status === 'reserved' && <Button className="flex-1" variant="outline" onClick={() => releaseUnit(selected.id)}>{t('Release hold')}</Button>}
                {selected.status === 'sold' && <Button className="flex-1" variant="outline" disabled>{t('Sold')}</Button>}
              </div>
            </div>
          )
        })()}
      </Sheet>
    </div>
  )
}

export function DeveloperBrokersPage() {
  const { t, lang } = useI18n()
  const { units, deals, brokers } = useDeveloperData()
  const toast = useAppStore((s) => s.toast)
  const [query, setQuery] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const rows = brokers.map((broker) => {
    const own = units.filter((u) => u.brokerId === broker.id)
    const ownDeals = deals.filter((d) => d.brokerId === broker.id)
    return {
      broker,
      units: own.length,
      sold: own.filter((u) => u.status === 'sold').length,
      reserved: own.filter((u) => u.status === 'reserved').length,
      value: own.reduce((s, u) => s + u.price, 0),
      dealCount: ownDeals.length,
      won: ownDeals.filter((d) => d.stage === 'won').length,
      commission: ownDeals.filter((d) => d.stage === 'won').reduce((s, d) => s + (d.value * d.commissionPct) / 100, 0),
      lastDeal: ownDeals[0],
    }
  }).filter((r) => r.units > 0 || r.dealCount > 0)

  const filtered = rows.filter((r) => {
    if (verifiedOnly && !r.broker.verified) return false
    if (!query.trim()) return true
    return `${r.broker.name} ${r.broker.companyName} ${r.broker.zone}`.toLowerCase().includes(query.trim().toLowerCase())
  })

  const selected = rows.find((r) => r.broker.id === selectedId)
  const totalUnits = rows.reduce((s, r) => s + r.units, 0)
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0)
  const topData = filtered.slice().sort((a, b) => b.units - a.units).slice(0, 6).map((r) => ({ name: r.broker.name.split(' ')[0], units: r.units, sold: r.sold }))

  const sendMessage = () => {
    if (!message.trim()) {
      toast('Message is empty', 'Write a short message before sending.', 'error')
      return
    }
    toast('Message simulated', `Your note to ${selected?.broker.name} was not actually sent — this demo has no messaging backend.`, 'info')
    setMessage('')
  }

  return (
    <div>
      <PageHeader
        eyebrow={<><Handshake className="size-3.5" /> {t('Developer Portal')}</>}
        title={t('Broker activity')}
        description={t('Track the partners selling your inventory and the commissions they generate.')}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Active brokers')} value={rows.length} icon={Users} hint={`${rows.filter((r) => r.broker.verified).length} ${t('verified')}`} />
        <StatCard label={t('Broker-held units')} value={totalUnits} icon={Layers} tone="blue" hint={`${rows.reduce((s, r) => s + r.sold, 0)} ${t('sold')}`} />
        <StatCard label={t('Commission earned')} value={formatEGP(totalCommission, lang, true)} icon={Wallet} tone="green" hint={t('on won deals')} />
        <StatCard label={t('Average rating')} value={(rows.reduce((s, r) => s + r.broker.rating, 0) / Math.max(1, rows.length)).toFixed(1)} icon={BadgeCheck} tone="amber" hint={t('partner network')} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search broker or company…')} className="h-9 w-full sm:w-[240px]" />
            <Button size="sm" variant={verifiedOnly ? 'default' : 'outline'} onClick={() => setVerifiedOnly((v) => !v)}><BadgeCheck className="size-3.5" /> {t('Verified only')}</Button>
            <span className="ms-auto text-[11px] text-muted-foreground">{filtered.length} {t('brokers')}</span>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={Handshake} title={t('No broker activity found')} description={t('Brokers who reserve or sell your units appear here.')} />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>{t('Broker')}</TableHead><TableHead>{t('Zone')}</TableHead><TableHead>{t('Units')}</TableHead><TableHead>{t('Sold')}</TableHead><TableHead>{t('Commission')}</TableHead><TableHead>{t('Rating')}</TableHead><TableHead className="text-end">{t('Actions')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.broker.id}>
                    <TableCell><UserCell name={r.broker.name} sub={r.broker.companyName} color={r.broker.avatarColor} /></TableCell>
                    <TableCell className="text-[11px]">{r.broker.zone}</TableCell>
                    <TableCell className="text-[12px]">{r.units}</TableCell>
                    <TableCell className="text-[12px]">{r.sold}</TableCell>
                    <TableCell className="font-medium">{formatEGP(r.commission, lang, true)}</TableCell>
                    <TableCell><Badge tone={r.broker.rating >= 4.5 ? 'green' : 'amber'}>{r.broker.rating.toFixed(1)}</Badge></TableCell>
                    <TableCell className="text-end"><Button size="xs" variant="outline" onClick={() => setSelectedId(r.broker.id)}>{t('View')}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
        <ChartCard title={t('Top brokers by inventory')} description={t('Units assigned and sold')}>
          <BarsChart data={topData} series={[{ key: 'units', label: t('Units'), color: chartColors.navy }, { key: 'sold', label: t('Sold'), color: chartColors.emerald }]} height={260} vertical />
        </ChartCard>
      </div>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelectedId(null)} width="440px">
        {selected && (
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-5 pe-12">
              <div className="flex items-center gap-3">
                <Avatar name={selected.broker.name} color={selected.broker.avatarColor} size="lg" />
                <div>
                  <div className="flex items-center gap-1.5"><h2 className="text-base font-semibold">{selected.broker.name}</h2>{selected.broker.verified && <BadgeCheck className="size-4 text-sky-500" />}</div>
                  <p className="text-[11px] text-muted-foreground">{selected.broker.companyName} · {selected.broker.zone}</p>
                </div>
              </div>
            </div>
            <div className="thin-scrollbar flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border p-2"><p className="text-base font-semibold">{selected.units}</p><p className="text-[9px] text-muted-foreground">{t('Units')}</p></div>
                <div className="rounded-lg border border-border p-2"><p className="text-base font-semibold">{selected.won}</p><p className="text-[9px] text-muted-foreground">{t('Deals won')}</p></div>
                <div className="rounded-lg border border-border p-2"><p className="text-base font-semibold">{selected.broker.rating.toFixed(1)}</p><p className="text-[9px] text-muted-foreground">{t('Rating')}</p></div>
              </div>
              <div className="mt-3 divide-y divide-border">
                <InfoRow label={t('Phone')} value={<span dir="ltr">{selected.broker.phone}</span>} />
                <InfoRow label={t('Commission rate')} value={`${selected.broker.commissionRate}%`} />
                <InfoRow label={t('Inventory value')} value={formatEGP(selected.value, lang, true)} />
                <InfoRow label={t('Commission earned')} value={formatEGP(selected.commission, lang, true)} />
                <InfoRow label={t('Verification')} value={<Badge tone={selected.broker.verified ? 'green' : 'amber'}>{selected.broker.verified ? t('Verified') : t('Pending')}</Badge>} />
              </div>
              <div className="mt-4">
                <p className="mb-1.5 text-xs font-medium">{t('Message the broker')}</p>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('Share new availability, price updates or cooperation terms…')} />
                <Button size="sm" className="mt-2 w-full" onClick={sendMessage}><Send className="size-3.5" /> {t('Send message')}</Button>
                <p className="mt-1.5 text-[9px] text-muted-foreground">{t('Messaging is simulated in this demo. No message is actually sent.')}</p>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}

export function DeveloperSalesPage() {
  const { t, lang } = useI18n()
  const { projects, units, deals, brokers } = useDeveloperData()
  const toast = useAppStore((s) => s.toast)
  const [range, setRange] = useState('6')
  const map = useProjectMap(projects)

  const sold = units.filter((u) => u.status === 'sold')
  const won = deals.filter((d) => d.stage === 'won')
  const open = deals.filter((d) => !['won', 'lost'].includes(d.stage))
  const soldValue = sold.reduce((s, u) => s + u.price, 0) + won.reduce((s, d) => s + d.value, 0)
  const pipeline = open.reduce((s, d) => s + d.value, 0)
  const avgPrice = units.length ? Math.round(units.reduce((s, u) => s + u.price, 0) / units.length) : 0
  const sellThrough = units.length ? Math.round((sold.length / units.length) * 100) : 0
  const commission = won.reduce((s, d) => s + (d.value * d.commissionPct) / 100, 0)

  const months = Number(range) === 12 ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
  const trendBase = [16, 22, 19, 28, 24, 33, 30, 38, 35, 44, 41, 49]
  const trend = months.map((m, i) => ({ name: m, sales: trendBase[(i + (12 - months.length)) % 12], target: trendBase[(i + (12 - months.length)) % 12] + 6 }))

  const projectSales = projects.map((p) => {
    const own = units.filter((u) => u.projectId === p.id)
    return { name: p.name, sold: own.filter((u) => u.status === 'sold').length, reserved: own.filter((u) => u.status === 'reserved').length, available: own.filter((u) => u.status === 'available').length }
  })

  const brokerRows = brokers.map((b) => {
    const bUnits = units.filter((u) => u.brokerId === b.id)
    return { broker: b, units: bUnits.length, sold: bUnits.filter((u) => u.status === 'sold').length, value: bUnits.filter((u) => u.status === 'sold').reduce((s, u) => s + u.price, 0) }
  }).filter((r) => r.units > 0).sort((a, b) => b.value - a.value)

  const exportSales = () => {
    downloadCsv('developer-sales.csv', [
      ['Project', 'Sold', 'Reserved', 'Available', 'Inventory value (EGP)'],
      ...projects.map((p) => {
        const own = units.filter((u) => u.projectId === p.id)
        return [p.name, own.filter((u) => u.status === 'sold').length, own.filter((u) => u.status === 'reserved').length, own.filter((u) => u.status === 'available').length, own.reduce((s, u) => s + u.price, 0)]
      }),
    ])
    toast('Sales report exported', 'Project sales performance was downloaded as CSV.')
  }

  return (
    <div>
      <PageHeader
        eyebrow={<><TrendingUp className="size-3.5" /> {t('Developer Portal')}</>}
        title={t('Sales performance')}
        description={t('Revenue, pipeline and delivery performance across your developments.')}
        actions={<>
          <Select value={range} onChange={(e) => setRange(e.target.value)} className="h-9 w-[150px]"><option value="6">{t('Last 6 months')}</option><option value="12">{t('Last 12 months')}</option></Select>
          <Button variant="outline" onClick={exportSales}><Download className="size-4" /> {t('Export')}</Button>
        </>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={t('Sales value')} value={formatEGP(soldValue, lang, true)} icon={Wallet} tone="green" delta={14} deltaLabel={t('vs previous period')} />
        <StatCard label={t('Open pipeline')} value={formatEGP(pipeline, lang, true)} icon={Handshake} tone="blue" hint={`${open.length} ${t('active deals')}`} />
        <StatCard label={t('Sell-through')} value={`${sellThrough}%`} icon={TrendingUp} tone="amber" hint={`${sold.length} / ${units.length} ${t('units')}`} />
        <StatCard label={t('Average unit price')} value={formatEGP(avgPrice, lang, true)} icon={CircleDollarSign} hint={`${units.length} ${t('units')}`} />
        <StatCard label={t('Broker commission')} value={formatEGP(commission, lang, true)} icon={Users} tone="purple" hint={`${won.length} ${t('deals won')}`} />
        <StatCard label={t('Delivery horizon')} value={projects.length ? formatDate(projects.reduce((a, b) => (new Date(a.deliveryDate) < new Date(b.deliveryDate) ? a : b)).deliveryDate, lang, 'MMM yyyy') : '—'} icon={CalendarClock} hint={t('next handover')} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <ChartCard title={t('Sales trend')} description={t('Units sold per month, EGP millions')} action={<Badge tone="green"><TrendingUp className="size-3" /> 14%</Badge>}>
          <TrendChart data={trend} series={[{ key: 'sales', label: t('Sales'), color: chartColors.emerald }, { key: 'target', label: t('Target'), color: chartColors.slate }]} height={290} />
        </ChartCard>
        <ChartCard title={t('Sales by project')} description={t('Sold vs reserved vs available units')}>
          <BarsChart data={projectSales} series={[{ key: 'sold', label: t('Sold'), color: chartColors.navy }, { key: 'reserved', label: t('Reserved'), color: chartColors.amber }, { key: 'available', label: t('Available'), color: chartColors.emerald }]} height={290} stacked />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3"><h3 className="text-[14px] font-semibold">{t('Project sales')}</h3><p className="text-[10px] text-muted-foreground">{t('Inventory absorption by project')}</p></div>
          <Table>
            <TableHeader><TableRow><TableHead>{t('Project')}</TableHead><TableHead>{t('Sold')}</TableHead><TableHead>{t('Reserved')}</TableHead><TableHead>{t('Available')}</TableHead><TableHead>{t('Sell-through')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {projectSales.map((p) => {
                const total = p.sold + p.reserved + p.available
                const pct = total ? Math.round((p.sold / total) * 100) : 0
                return (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.sold}</TableCell>
                    <TableCell>{p.reserved}</TableCell>
                    <TableCell>{p.available}</TableCell>
                    <TableCell className="min-w-[130px]"><div className="flex items-center gap-2"><Progress value={pct} /><span className="w-8 text-end text-[10px] font-medium">{pct}%</span></div></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3"><h3 className="text-[14px] font-semibold">{t('Broker contribution')}</h3><p className="text-[10px] text-muted-foreground">{t('Sold value by partner')}</p></div>
          <div className="divide-y divide-border">
            {brokerRows.slice(0, 6).map((r) => (
              <div key={r.broker.id} className="flex items-center gap-2.5 px-4 py-2.5">
                <Avatar name={r.broker.name} color={r.broker.avatarColor} size="sm" />
                <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium">{r.broker.name}</p><p className="text-[9px] text-muted-foreground">{r.sold} {t('units sold')} · {r.units} {t('assigned')}</p></div>
                <span className="text-[11px] font-medium">{formatEGP(r.value, lang, true)}</span>
              </div>
            ))}
            {brokerRows.length === 0 && <p className="px-4 py-8 text-center text-[11px] text-muted-foreground">{t('No broker sales yet.')}</p>}
          </div>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="border-b border-border px-4 py-3"><h3 className="text-[14px] font-semibold">{t('Deals on your inventory')}</h3></div>
        {deals.length === 0 ? (
          <EmptyState icon={Handshake} title={t('No deals yet')} description={t('Broker deals on your inventory will appear here.')} />
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>{t('Deal')}</TableHead><TableHead>{t('Customer')}</TableHead><TableHead>{t('Property')}</TableHead><TableHead>{t('Broker')}</TableHead><TableHead>{t('Value')}</TableHead><TableHead>{t('Stage')}</TableHead><TableHead>{t('Close date')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {deals.map((d) => {
                const broker = brokers.find((b) => b.id === d.brokerId)
                const project = map.get(units.find((u) => u.brokerId === d.brokerId)?.projectId ?? '')
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.code}</TableCell>
                    <TableCell className="text-[12px]">{d.customerName}</TableCell>
                    <TableCell className="text-[11px]">{project?.name ?? d.propertyTitle}</TableCell>
                    <TableCell>{broker ? <UserCell name={broker.name} sub={broker.companyName} color={broker.avatarColor} /> : <span className="text-[11px] text-muted-foreground">{t('Direct')}</span>}</TableCell>
                    <TableCell className="font-medium">{formatEGP(d.value, lang, true)}</TableCell>
                    <TableCell><StatusBadge status={d.stage} /></TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{formatDate(d.expectedClose, lang)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
