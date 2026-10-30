import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, CheckCircle2, Clock, Download, ExternalLink, FileSignature,
  Handshake, Layers, LockKeyhole, Mail, MapPin, MessageSquare, Percent, Phone, Plus, Search, Send, ShieldAlert,
  ShieldCheck, Sparkles, Star, Store, Users, Wallet, XCircle,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { formatDate, formatEGP, formatNumber, formatPrice, fromNow } from '@/lib/format'
import { cn, downloadCsv, uid } from '@/lib/utils'
import { InfoRow, PageHeader, SectionTitle, StatCard, UserCell } from '@/components/shared'
import { BarsChart, ChartCard, DonutChart, DonutLegend, chartColors } from '@/components/charts'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, EmptyState, Progress } from '@/components/ui/misc'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Sheet } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { useTab } from '@/lib/useTab'
import { statusTone } from '@/lib/labels'
import type { Broker, CooperationRequest, Property } from '@/types'

function maskName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'Protected buyer'
  return `${parts[0]}${parts[1] ? ` ${parts[1][0]}.` : ''}`
}

function useExchangeData() {
  const brokerId = useAppStore((s) => s.activeBrokerId)
  const broker = useAppStore((s) => s.brokers.find((b) => b.id === s.activeBrokerId))
  const properties = useAppStore((s) => s.properties)
  const brokers = useAppStore((s) => s.brokers)
  const companies = useAppStore((s) => s.companies)
  const requests = useAppStore((s) => s.cooperationRequests)
  const commissions = useAppStore((s) => s.commissions)
  const deals = useAppStore((s) => s.deals)
  const requesterCompanyId = broker?.companyId ?? 'c1'
  const market = useMemo(() => properties.filter((p) => p.listingStatus === 'published' && !['sold', 'unavailable', 'rented'].includes(p.status) && p.companyId !== requesterCompanyId), [properties, requesterCompanyId])
  return { brokerId, broker, properties, brokers, companies, requests, commissions, deals, market, requesterCompanyId }
}

function CooperationDialog({ initialProperty, onClose }: { initialProperty: Property | null; onClose: () => void }) {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { broker, brokerId, brokers, companies, market, requests, requesterCompanyId } = useExchangeData()
  const addCooperation = useAppStore((s) => s.addCooperation)
  const toast = useAppStore((s) => s.toast)
  const [propertyId, setPropertyId] = useState(initialProperty?.id ?? market[0]?.id ?? '')
  const [customer, setCustomer] = useState('')
  const [pct, setPct] = useState('2.25')
  const [terms, setTerms] = useState('Shared commission 50/50, customer source locked for 90 days, owner company handles contracting.')
  const property = market.find((p) => p.id === propertyId) ?? initialProperty
  const owningCompany = companies.find((c) => c.id === property?.companyId)
  const requestingCompany = companies.find((c) => c.id === requesterCompanyId)
  const ownerBroker = brokers.find((b) => b.companyName === owningCompany?.name) ?? brokers.find((b) => b.id !== brokerId) ?? brokers[0]

  const submit = () => {
    if (!property) {
      toast('Select a property', 'Choose a shared listing to request cooperation on.', 'error')
      return
    }
    const commission = Number(pct)
    if (!commission || commission <= 0 || commission > 10) {
      toast('Check the commission', 'Enter a commission percentage between 0 and 10.', 'error')
      return
    }
    const code = `COP-${3300 + requests.length}`
    const now = new Date().toISOString()
    const req: CooperationRequest = {
      id: uid('cr'),
      code,
      requestingCompanyId: requesterCompanyId,
      owningCompanyId: property.companyId,
      propertyId: property.id,
      requesterBrokerId: brokerId,
      ownerBrokerId: ownerBroker.id,
      customerNameMasked: maskName(customer) || 'Protected buyer',
      customerProtected: true,
      commissionPct: commission,
      commissionSplit: [{ party: requestingCompany?.name ?? 'Requesting company', pct: 50 }, { party: owningCompany?.name ?? 'Owning company', pct: 50 }],
      status: 'pending',
      terms,
      createdAt: now,
      updatedAt: now,
      milestones: [
        { label: 'Cooperation request submitted', done: true, date: now },
        { label: 'Availability confirmed by owner', done: false, date: now },
        { label: 'Commission agreed', done: false, date: now },
        { label: 'Customer viewing', done: false, date: now },
        { label: 'Deal closed', done: false, date: now },
      ],
      activities: [{ id: uid('ca'), type: 'system', title: 'Request created', detail: `Cooperation requested by ${requestingCompany?.name ?? 'your company'} through the exchange.`, at: now, actor: 'System' }],
      notes: [],
      dispute: 'none',
    }
    addCooperation(req)
    onClose()
    navigate(`/exchange/requests/${req.id}`)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('Request cooperation')}</DialogTitle>
          <DialogDescription>{t('The customer identity stays masked until the owning company accepts the request.')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label={t('Shared property')} required>
            <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
              {market.map((p) => <option key={p.id} value={p.id}>{p.title} · {formatEGP(p.price, lang, true)}</option>)}
            </Select>
          </Field>
          {property && (
            <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
              <img src={property.images[0]} alt="" className="size-12 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium">{property.title}</p>
                <p className="text-[10px] text-muted-foreground">{t(property.location)} · {owningCompany?.name}</p>
              </div>
              <Badge tone="outline">{t(property.type)}</Badge>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('Customer name')} hint={t('Will be masked as first name + initial')}><Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Ahmed El-Sayed" /></Field>
            <Field label={t('Commission percentage')} required><Input type="number" step="0.25" min="0" max="10" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
          </div>
          <Field label={t('Agreement terms')}><Textarea value={terms} onChange={(e) => setTerms(e.target.value)} /></Field>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium"><LockKeyhole className="size-3.5 text-accent" /> {t('Customer protection')}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{t('The owner sees only the masked name until acceptance. Your company remains the customer source of record for 90 days.')}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('Cancel')}</Button>
          <Button onClick={submit}><Handshake className="size-4" /> {t('Send request')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ExchangeMarketplacePage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { broker, brokerId, brokers, companies, market, requests } = useExchangeData()
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('all')
  const [type, setType] = useState('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sort, setSort] = useState('commission')
  const [requestFor, setRequestFor] = useState<Property | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detail, setDetail] = useState<Property | null>(null)

  const locations = [...new Set(market.map((p) => p.location))]
  const types = [...new Set(market.map((p) => p.type))]

  const filtered = useMemo(() => market.filter((p) => {
    if (location !== 'all' && p.location !== location) return false
    if (type !== 'all' && p.type !== type) return false
    if (verifiedOnly && !p.verified) return false
    if (!query.trim()) return true
    return `${p.title} ${p.titleAr} ${p.location} ${p.code}`.toLowerCase().includes(query.trim().toLowerCase())
  }).sort((a, b) => sort === 'price_low' ? a.price - b.price : sort === 'price_high' ? b.price - a.price : sort === 'newest' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : (b.price / 1e7) - (a.price / 1e7)), [market, location, type, verifiedOnly, query, sort])

  const myRequests = requests.filter((r) => r.requesterBrokerId === brokerId)
  const avgCommission = broker?.commissionRate ?? 2.25
  const owners = new Set(market.map((p) => p.companyId)).size

  return (
    <div>
      <PageHeader
        eyebrow={<><Store className="size-3.5" /> {t('Broker Network')}</>}
        title={t('Exchange marketplace')}
        description={t('Verified shared inventory from partner brokerages, with protected customers and agreed commission splits.')}
        actions={<Button onClick={() => { setRequestFor(market[0] ?? null); setDialogOpen(true) }}><Plus className="size-4" /> {t('New cooperation request')}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Shared listings')} value={market.length} icon={Store} hint={`${owners} ${t('partner companies')}`} />
        <StatCard label={t('My requests')} value={myRequests.length} icon={Handshake} tone="blue" hint={`${myRequests.filter((r) => r.status === 'accepted').length} ${t('accepted')}`} href="/exchange/requests" />
        <StatCard label={t('Average commission')} value={`${avgCommission}%`} icon={Percent} tone="green" hint={t('network standard')} />
        <StatCard label={t('Verified listings')} value={market.filter((p) => p.verified).length} icon={ShieldCheck} tone="purple" hint={t('quality checked')} />
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search shared inventory…')} className="ps-9" />
          </div>
          <Select value={location} onChange={(e) => setLocation(e.target.value)} className="h-9 w-[160px]">
            <option value="all">{t('All locations')}</option>
            {locations.map((l) => <option key={l} value={l}>{t(l)}</option>)}
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-[140px]">
            <option value="all">{t('Any type')}</option>
            {types.map((x) => <option key={x} value={x}>{t(x.replace(/^./, (c) => c.toUpperCase()))}</option>)}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 w-[160px]">
            <option value="commission">{t('Best commission')}</option>
            <option value="price_low">{t('Price: low to high')}</option>
            <option value="price_high">{t('Price: high to low')}</option>
            <option value="newest">{t('Newest')}</option>
          </Select>
          <Button size="sm" variant={verifiedOnly ? 'default' : 'outline'} onClick={() => setVerifiedOnly((v) => !v)}><BadgeCheck className="size-3.5" /> {t('Verified only')}</Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Store} title={t('No shared listings found')} description={t('Try another location or reset the filters.')} action={<Button size="sm" variant="outline" onClick={() => { setQuery(''); setLocation('all'); setType('all'); setVerifiedOnly(false) }}>{t('Clear filters')}</Button>} />
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => {
              const company = companies.find((c) => c.id === p.companyId)
              const owner = brokers.find((b) => b.companyId === p.companyId) ?? brokers.find((b) => b.companyName === company?.name)
              return (
                <Card key={p.id} className="group overflow-hidden">
                  <div className="relative h-40 overflow-hidden">
                    <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/75 via-transparent to-transparent" />
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge tone="green" className="border-emerald-400/30 bg-emerald-500/15 text-emerald-200">{p.verified ? t('Verified') : t('Partner listing')}</Badge>
                        {p.featured && <Badge tone="amber" className="bg-amber-500/20 text-amber-200">{t('Featured')}</Badge>}
                      </div>
                      <Badge tone="outline" className="border-white/30 bg-black/25 text-white">{t(p.type.replace(/^./, (c) => c.toUpperCase()))}</Badge>
                    </div>
                    <div className="absolute inset-x-3 bottom-3 text-white">
                      <p className="text-sm font-semibold">{formatPrice(p.price, p.listingType, lang)}</p>
                      <p className="text-[10px] text-white/80">{t(p.location)} · {formatNumber(p.area, lang)} m²</p>
                    </div>
                  </div>
                  <div className="p-3.5">
                    <p className="truncate text-[12px] font-medium">{lang === 'ar' ? p.titleAr : p.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><Building2 className="size-3" /> {company?.name}</p>
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Percent className="size-3" /> {owner?.commissionRate ?? 2.25}% {t('commission')}</span>
                      <span>{p.bedrooms} {t('bd')} · {p.bathrooms} {t('ba')}</span>
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setDetail(p)}>{t('Details')}</Button>
                      <Button size="sm" className="flex-1" onClick={() => { setRequestFor(p); setDialogOpen(true) }}><Handshake className="size-3.5" /> {t('Request')}</Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Card>

      {dialogOpen && <CooperationDialog initialProperty={requestFor} onClose={() => { setDialogOpen(false); setRequestFor(null) }} />}

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)} width="460px">
        {detail && (() => {
          const company = companies.find((c) => c.id === detail.companyId)
          return (
            <div className="flex h-full flex-col">
              <div className="relative h-48 shrink-0 overflow-hidden">
                <img src={detail.images[0]} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/80 to-transparent" />
                <div className="absolute inset-x-5 bottom-4 text-white">
                  <p className="text-lg font-semibold">{formatPrice(detail.price, detail.listingType, lang)}</p>
                  <p className="text-[11px] text-white/80">{detail.title}</p>
                </div>
              </div>
              <div className="thin-scrollbar flex-1 overflow-y-auto p-5">
                <div className="divide-y divide-border">
                  <InfoRow label={t('Owner company')} value={company?.name} />
                  <InfoRow label={t('Location')} value={t(detail.location)} />
                  <InfoRow label={t('Type')} value={t(detail.type)} />
                  <InfoRow label={t('Area')} value={`${formatNumber(detail.area, lang)} m²`} />
                  <InfoRow label={t('Bedrooms')} value={detail.bedrooms} />
                  <InfoRow label={t('Finishing')} value={t(detail.finishing.replace(/_/g, ' '))} />
                  <InfoRow label={t('Delivery date')} value={formatDate(detail.deliveryDate, lang, 'MMM yyyy')} />
                  <InfoRow label={t('Listing code')} value={detail.code} />
                </div>
                <SectionTitle title={t('Payment plan')} />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-border p-2"><p className="text-sm font-semibold">{detail.paymentPlan.downPaymentPct}%</p><p className="text-[9px] text-muted-foreground">{t('Down payment')}</p></div>
                  <div className="rounded-lg border border-border p-2"><p className="text-sm font-semibold">{detail.paymentPlan.years}</p><p className="text-[9px] text-muted-foreground">{t('Years')}</p></div>
                  <div className="rounded-lg border border-border p-2"><p className="text-sm font-semibold">{formatEGP(detail.paymentPlan.monthly, lang, true)}</p><p className="text-[9px] text-muted-foreground">{t('Monthly')}</p></div>
                </div>
                <SectionTitle title={t('Amenities')} />
                <div className="flex flex-wrap gap-1.5">{detail.amenities.map((a) => <Badge key={a} tone="outline">{a}</Badge>)}</div>
                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{detail.description}</p>
              </div>
              <div className="border-t border-border p-4">
                <Button className="w-full" onClick={() => { setDetail(null); setRequestFor(detail); setDialogOpen(true) }}><Handshake className="size-4" /> {t('Request cooperation')}</Button>
              </div>
            </div>
          )
        })()}
      </Sheet>

      <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-accent/10 text-accent"><Sparkles className="size-4" /></span>
          <div><p className="text-[12px] font-medium">{t('Need a unit that is not listed?')}</p><p className="text-[10px] text-muted-foreground">{t('Post a buyer request and let verified partners propose matching inventory.')}</p></div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/exchange/requests?new=1')}>{t('Create request')} <ArrowRight className="size-3.5 rtl:rotate-180" /></Button>
      </Card>
    </div>
  )
}

export function CooperationRequestsPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { tab, setTab } = useTab('all')
  const { brokerId, requests, properties, brokers, companies, market } = useExchangeData()
  const updateCooperationStatus = useAppStore((s) => s.updateCooperationStatus)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'mine' | 'all'>('mine')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setDialogOpen(true)
      const p = new URLSearchParams(searchParams)
      p.delete('new')
      setSearchParams(p, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const scoped = scope === 'mine' ? requests.filter((r) => r.requesterBrokerId === brokerId || r.ownerBrokerId === brokerId) : requests
  const statuses = ['all', 'pending', 'negotiation', 'accepted', 'completed', 'rejected', 'cancelled']
  const filtered = scoped.filter((r) => {
    if (tab !== 'all' && r.status !== tab) return false
    if (!query.trim()) return true
    const prop = properties.find((p) => p.id === r.propertyId)
    return `${r.code} ${r.customerNameMasked} ${prop?.title ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
  })

  const stats = [
    { label: t('Open requests'), value: scoped.filter((r) => r.status === 'pending').length, tone: 'amber' as const, icon: Clock },
    { label: t('Under negotiation'), value: scoped.filter((r) => r.status === 'negotiation').length, tone: 'blue' as const, icon: MessageSquare },
    { label: t('Accepted'), value: scoped.filter((r) => r.status === 'accepted').length, tone: 'green' as const, icon: CheckCircle2 },
    { label: t('Completed'), value: scoped.filter((r) => r.status === 'completed').length, tone: 'purple' as const, icon: Handshake },
  ]

  const accept = (r: CooperationRequest) => { updateCooperationStatus(r.id, 'accepted'); }
  const reject = (r: CooperationRequest) => { updateCooperationStatus(r.id, 'rejected'); }

  const exportRequests = () => {
    downloadCsv('cooperation-requests.csv', [
      ['Code', 'Property', 'Requesting company', 'Owning company', 'Commission %', 'Status', 'Updated'],
      ...filtered.map((r) => {
        const prop = properties.find((p) => p.id === r.propertyId)
        return [r.code, prop?.title ?? '', companies.find((c) => c.id === r.requestingCompanyId)?.name ?? '', companies.find((c) => c.id === r.owningCompanyId)?.name ?? '', r.commissionPct, r.status, r.updatedAt]
      }),
    ])
  }

  return (
    <div>
      <PageHeader
        eyebrow={<><Handshake className="size-3.5" /> {t('Broker Network')}</>}
        title={t('Cooperation requests')}
        description={t('Structured broker-to-broker collaboration with protected customers and milestone tracking.')}
        actions={<>
          <Button variant="outline" onClick={exportRequests}><Download className="size-4" /> {t('Export')}</Button>
          <Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> {t('New request')}</Button>
        </>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} tone={s.tone} />)}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5">
          {statuses.map((s) => (
            <button key={s} onClick={() => setTab(s)} className={cn('h-8 rounded-md px-2.5 text-[11px] font-medium capitalize transition-colors', tab === s ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {t(s === 'all' ? 'All' : s)}
              {s !== 'all' && <span className="ms-1 text-[9px] text-muted-foreground">{scoped.filter((r) => r.status === s).length}</span>}
            </button>
          ))}
        </div>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search request or property…')} className="h-9 w-full sm:w-[240px]" />
        <Select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} className="h-9 w-[150px]">
          <option value="mine">{t('Involving me')}</option>
          <option value="all">{t('All network')}</option>
        </Select>
      </div>

      <Card className="mt-4 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Handshake} title={t('No cooperation requests')} description={t('Requests you send or receive will appear here.')} action={<Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="size-3.5" /> {t('New request')}</Button>} />
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>{t('Request')}</TableHead><TableHead>{t('Property')}</TableHead><TableHead>{t('Parties')}</TableHead><TableHead>{t('Customer')}</TableHead><TableHead>{t('Commission')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead>{t('Updated')}</TableHead><TableHead className="text-end">{t('Actions')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const prop = properties.find((p) => p.id === r.propertyId)
                const requester = companies.find((c) => c.id === r.requestingCompanyId)
                const owner = companies.find((c) => c.id === r.owningCompanyId)
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link to={`/exchange/requests/${r.id}`} className="font-medium hover:text-accent">{r.code}</Link>
                      <p className="text-[10px] text-muted-foreground">{fromNow(r.createdAt, lang)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {prop && <img src={prop.images[0]} alt="" className="size-8 rounded-md object-cover" />}
                        <div className="min-w-0"><p className="max-w-[180px] truncate text-[11px] font-medium">{prop?.title ?? '—'}</p><p className="text-[9px] text-muted-foreground">{prop ? t(prop.location) : ''}</p></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-[10px]"><span className="text-muted-foreground">{t('From')}</span> {requester?.name}</p>
                      <p className="text-[10px]"><span className="text-muted-foreground">{t('To')}</span> {owner?.name}</p>
                    </TableCell>
                    <TableCell><span className="inline-flex items-center gap-1 text-[11px]"><LockKeyhole className="size-3 text-muted-foreground" /> {r.customerNameMasked}</span></TableCell>
                    <TableCell className="font-medium">{r.commissionPct}%</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">{fromNow(r.updatedAt, lang)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {r.status === 'pending' && <Button size="xs" variant="outline" onClick={() => accept(r)}>{t('Accept')}</Button>}
                        {r.status === 'pending' && <Button size="xs" variant="ghost" onClick={() => reject(r)}>{t('Reject')}</Button>}
                        <Link to={`/exchange/requests/${r.id}`}><Button size="xs" variant="outline">{t('Workspace')}</Button></Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {dialogOpen && <CooperationDialog initialProperty={market[0] ?? null} onClose={() => setDialogOpen(false)} />}
    </div>
  )
}

export function CooperationWorkspacePage() {
  const { t, lang } = useI18n()
  const { id } = useParams()
  const navigate = useNavigate()
  const { requests, properties, brokers, companies, deals } = useExchangeData()
  const updateCooperation = useAppStore((s) => s.updateCooperation)
  const updateCooperationStatus = useAppStore((s) => s.updateCooperationStatus)
  const addCooperationNote = useAppStore((s) => s.addCooperationNote)
  const toast = useAppStore((s) => s.toast)
  const [note, setNote] = useState('')

  const request = requests.find((r) => r.id === id)

  if (!request) {
    return (
      <div>
        <PageHeader title={t('Cooperation workspace')} description={t('This request may have been removed or reset.')} />
        <Card><EmptyState icon={Handshake} title={t('Request not found')} description={t('Return to the cooperation list to pick an active request.')} action={<Button size="sm" onClick={() => navigate('/exchange/requests')}>{t('Back to requests')}</Button>} /></Card>
      </div>
    )
  }

  const property = properties.find((p) => p.id === request.propertyId)
  const requester = companies.find((c) => c.id === request.requestingCompanyId)
  const owner = companies.find((c) => c.id === request.owningCompanyId)
  const requesterBroker = brokers.find((b) => b.id === request.requesterBrokerId)
  const ownerBroker = brokers.find((b) => b.id === request.ownerBrokerId)
  const linkedDeal = deals.find((d) => d.cooperationId === request.id || (d.propertyId === request.propertyId && request.status === 'accepted'))
  const commissionValue = property ? Math.round((property.price * request.commissionPct) / 100) : 0
  const milestoneProgress = request.milestones.length ? Math.round((request.milestones.filter((m) => m.done).length / request.milestones.length) * 100) : 0

  const toggleMilestone = (index: number) => {
    const now = new Date().toISOString()
    updateCooperation(request.id, { milestones: request.milestones.map((m, i) => i === index ? { ...m, done: !m.done, date: now } : m) })
    toast('Milestone updated', `“${request.milestones[index].label}” was ${request.milestones[index].done ? 'reopened' : 'completed'}.`)
  }

  const setStatus = (status: CooperationRequest['status']) => {
    updateCooperationStatus(request.id, status)
    if (status === 'completed' && linkedDeal) {
      toast('Cooperation completed', `${linkedDeal.code} is linked to this request. Commission is ready for payout.`)
    }
  }

  const toggleDispute = () => {
    const next = request.dispute === 'open' ? 'none' : 'open'
    updateCooperation(request.id, { dispute: next })
    toast(next === 'open' ? 'Dispute opened' : 'Dispute resolved', next === 'open' ? 'The trust desk will review this cooperation.' : 'The dispute flag was cleared.', next === 'open' ? 'warning' : 'success')
  }

  const sendNote = () => {
    if (!note.trim()) {
      toast('Note is empty', 'Write a note before adding it.', 'error')
      return
    }
    addCooperationNote(request.id, note.trim())
    setNote('')
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/exchange/requests" className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5 rtl:rotate-180" /> {t('Back to requests')}</Link>
      </div>
      <PageHeader
        eyebrow={<><Handshake className="size-3.5" /> {t('Cooperation workspace')} · {request.code}</>}
        title={property?.title ?? request.code}
        description={`${requester?.name} → ${owner?.name} · ${t('created')} ${formatDate(request.createdAt, lang)}`}
        actions={<>
          <Button variant="outline" onClick={() => navigate('/exchange/commissions')}><Wallet className="size-4" /> {t('Commissions')}</Button>
          <StatusBadge status={request.status} className="h-8 px-3 text-[12px]" />
        </>}
      />

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionTitle title={t('Progress')} description={`${request.milestones.filter((m) => m.done).length} / ${request.milestones.length} ${t('milestones complete')}`} />
              <span className="text-[12px] font-semibold">{milestoneProgress}%</span>
            </div>
            <Progress value={milestoneProgress} className="mb-4" />
            <div className="space-y-2">
              {request.milestones.map((m, i) => (
                <button key={`${m.label}-${i}`} onClick={() => toggleMilestone(i)} className="flex w-full items-center gap-3 rounded-lg border border-border p-2.5 text-start transition-colors hover:bg-muted/40">
                  <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border', m.done ? 'border-accent bg-accent text-white' : 'border-border text-transparent')}><Check className="size-3" /></span>
                  <span className={cn('flex-1 text-[12px]', m.done && 'text-muted-foreground line-through')}>{m.label}</span>
                  <span className="text-[9px] text-muted-foreground">{formatDate(m.date, lang, 'MMM d, HH:mm')}</span>
                </button>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <SectionTitle title={t('Parties')} />
              <div className="space-y-3">
                {[{ company: requester, broker: requesterBroker, label: t('Requested by') }, { company: owner, broker: ownerBroker, label: t('Owning party') }].map(({ company, broker, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg text-[9px] font-bold text-white" style={{ background: company?.logoColor ?? '#334E68' }}>{company?.name.split(' ').slice(0, 2).map((n) => n[0]).join('')}</span>
                    <div className="min-w-0 flex-1"><p className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="truncate text-[12px] font-medium">{company?.name}</p><p className="truncate text-[10px] text-muted-foreground">{broker?.name} · {broker?.phone}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-medium"><LockKeyhole className="size-3.5 text-accent" /> {t('Customer source')}</p>
                <p className="mt-1 text-[12px] font-semibold">{request.customerNameMasked}</p>
                <p className="text-[9px] text-muted-foreground">{request.customerProtected ? t('Contact details shielded until acceptance') : t('Customer details shared')}</p>
              </div>
            </Card>

            <Card className="p-4">
              <SectionTitle title={t('Commercials')} />
              <div className="divide-y divide-border">
                <InfoRow label={t('Commission')} value={`${request.commissionPct}%`} />
                <InfoRow label={t('On property value')} value={formatEGP(commissionValue, lang, true)} />
                <InfoRow label={t('Requesting company')} value={`${request.commissionSplit[0]?.pct ?? 50}%`} />
                <InfoRow label={t('Owning company')} value={`${request.commissionSplit[1]?.pct ?? 50}%`} />
              </div>
              <div className="mt-3 rounded-lg border border-border p-3">
                <p className="text-[10px] leading-relaxed text-muted-foreground">{request.terms}</p>
              </div>
            </Card>
          </div>

          {property && (
            <Card className="overflow-hidden">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <img src={property.images[0]} alt="" className="h-24 w-full rounded-lg object-cover sm:w-32" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">{property.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="size-3" /> {t(property.location)} · {property.code}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone="outline">{t(property.type)}</Badge>
                    <Badge tone="outline">{formatNumber(property.area, lang)} m²</Badge>
                    <Badge tone="outline">{property.bedrooms} {t('bd')}</Badge>
                    <StatusBadge status={property.status} />
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-sm font-semibold">{formatEGP(property.price, lang, true)}</p>
                  <Link to={`/properties/${property.id}`} className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-accent">{t('View listing')} <ExternalLink className="size-3" /></Link>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <SectionTitle title={t('Negotiation notes')} description={t('Shared with both parties in this workspace')} />
            <div className="flex gap-2">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Add a note about availability, split or timeline…')} onKeyDown={(e) => e.key === 'Enter' && sendNote()} />
              <Button onClick={sendNote}><Send className="size-3.5" /> {t('Add note')}</Button>
            </div>
            <div className="mt-3 space-y-2">
              {request.notes.length === 0 && <p className="py-3 text-center text-[11px] text-muted-foreground">{t('No notes yet.')}</p>}
              {request.notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-border p-2.5">
                  <p className="text-[11px] leading-relaxed">{n.text}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground">{n.author} · {fromNow(n.at, lang)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <SectionTitle title={t('Actions')} />
            <div className="space-y-2">
              {request.status === 'pending' && <>
                <Button className="w-full" onClick={() => setStatus('accepted')}><CheckCircle2 className="size-4" /> {t('Accept cooperation')}</Button>
                <Button variant="outline" className="w-full" onClick={() => setStatus('negotiation')}><MessageSquare className="size-4" /> {t('Counter offer')}</Button>
                <Button variant="ghost" className="w-full" onClick={() => setStatus('rejected')}><XCircle className="size-4" /> {t('Reject request')}</Button>
              </>}
              {request.status === 'negotiation' && <>
                <Button className="w-full" onClick={() => setStatus('accepted')}><CheckCircle2 className="size-4" /> {t('Accept terms')}</Button>
                <Button variant="ghost" className="w-full" onClick={() => setStatus('cancelled')}>{t('Cancel request')}</Button>
              </>}
              {request.status === 'accepted' && <>
                <Button className="w-full" onClick={() => setStatus('completed')}><Handshake className="size-4" /> {t('Mark completed')}</Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/crm/pipeline')}><Layers className="size-4" /> {t('Open deal pipeline')}</Button>
              </>}
              {['rejected', 'cancelled', 'completed'].includes(request.status) && (
                <Button variant="outline" className="w-full" onClick={() => setStatus('pending')}>{t('Reopen request')}</Button>
              )}
              <Button variant="ghost" className={cn('w-full', request.dispute === 'open' && 'text-amber-600')} onClick={toggleDispute}>
                <ShieldAlert className="size-4" /> {request.dispute === 'open' ? t('Resolve dispute') : t('Report issue')}
              </Button>
            </div>
            {request.dispute === 'open' && <Badge tone="red" className="mt-2">{t('Dispute open')}</Badge>}
          </Card>

          {linkedDeal && (
            <Card className="p-4">
              <SectionTitle title={t('Linked deal')} />
              <p className="text-[13px] font-semibold">{linkedDeal.code}</p>
              <p className="text-[11px] text-muted-foreground">{linkedDeal.customerName} · {formatEGP(linkedDeal.value, lang, true)}</p>
              <div className="mt-2 flex items-center justify-between"><StatusBadge status={linkedDeal.stage} /><span className="text-[11px] font-medium">{linkedDeal.probability}%</span></div>
            </Card>
          )}

          <Card className="p-4">
            <SectionTitle title={t('Protection')} />
            <div className="space-y-2 text-[11px]">
              <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> {t('Customer source protected for 90 days')}</p>
              <p className="flex items-start gap-2"><FileSignature className="mt-0.5 size-3.5 shrink-0 text-sky-500" /> {t('Commission split recorded on both sides')}</p>
              <p className="flex items-start gap-2"><BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-violet-500" /> {t('Owner company handles contracting')}</p>
              <p className="flex items-start gap-2"><LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-amber-500" /> {t('Contact details shielded until acceptance')}</p>
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle title={t('Audit trail')} />
            <div className="relative space-y-3 before:absolute before:inset-y-1 before:start-[11px] before:w-px before:bg-border">
              {[...request.activities].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).map((a) => (
                <div key={a.id} className="relative flex gap-2.5">
                  <span className="z-10 grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground"><Clock className="size-3" /></span>
                  <div className="min-w-0"><p className="text-[11px] font-medium">{a.title}</p><p className="line-clamp-2 text-[10px] text-muted-foreground">{a.detail}</p><p className="text-[9px] text-muted-foreground/70">{fromNow(a.at, lang)}</p></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function ExchangeCommissionsPage() {
  const { t, lang } = useI18n()
  const { tab, setTab } = useTab('all')
  const { commissions, brokerId, deals } = useExchangeData()
  const updateCommissionStatus = useAppStore((s) => s.updateCommissionStatus)
  const toast = useAppStore((s) => s.toast)
  const [query, setQuery] = useState('')

  const mine = commissions.filter((c) => c.beneficiaryId === brokerId)
  const totalPool = commissions.reduce((s, c) => s + c.amount, 0)
  const myTotal = mine.reduce((s, c) => s + c.amount, 0)
  const pending = commissions.filter((c) => c.status !== 'paid').reduce((s, c) => s + c.amount, 0)
  const overdue = commissions.filter((c) => c.status === 'overdue').reduce((s, c) => s + c.amount, 0)

  const filtered = commissions.filter((c) => {
    if (tab !== 'all' && c.status !== tab) return false
    if (!query.trim()) return true
    return `${c.beneficiaryName} ${c.role} ${deals.find((d) => d.id === c.dealId)?.code ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
  })

  const roleData = ['company', 'agent', 'broker', 'partner'].map((role) => ({ name: t(role.replace(/^./, (c) => c.toUpperCase())), value: commissions.filter((c) => c.role === role).reduce((s, c) => s + c.amount, 0) })).filter((x) => x.value > 0)
  const statusData = ['paid', 'pending', 'overdue'].map((status) => ({ name: t(status.replace(/^./, (c) => c.toUpperCase())), value: commissions.filter((c) => c.status === status).reduce((s, c) => s + c.amount, 0) })).filter((x) => x.value > 0)

  const pay = (id: string) => { updateCommissionStatus(id, 'paid'); }

  const exportCommissions = () => {
    downloadCsv('exchange-commissions.csv', [
      ['Beneficiary', 'Role', 'Deal', 'Percentage', 'Amount (EGP)', 'Status', 'Due date'],
      ...filtered.map((c) => [c.beneficiaryName, c.role, deals.find((d) => d.id === c.dealId)?.code ?? c.dealId, c.pct, c.amount, c.status, c.dueDate]),
    ])
    toast('Commissions exported', 'The commission ledger was downloaded as CSV.')
  }

  return (
    <div>
      <PageHeader
        eyebrow={<><Percent className="size-3.5" /> {t('Broker Network')}</>}
        title={t('Commission management')}
        description={t('Network commission ledger, splits and payout status across cooperation deals.')}
        actions={<>
          <Button variant="outline" onClick={exportCommissions}><Download className="size-4" /> {t('Export')}</Button>
          <Button onClick={() => { commissions.filter((c) => c.status !== 'paid').forEach((c) => updateCommissionStatus(c.id, 'paid')); toast('Payout run simulated', 'All open commissions were marked as paid in this demo.', 'info') }}><Wallet className="size-4" /> {t('Run payout')}</Button>
        </>}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Commission pool')} value={formatEGP(totalPool, lang, true)} icon={Wallet} hint={`${commissions.length} ${t('records')}`} />
        <StatCard label={t('My commission')} value={formatEGP(myTotal, lang, true)} icon={Percent} tone="green" hint={`${mine.length} ${t('records')}`} />
        <StatCard label={t('Pending payout')} value={formatEGP(pending, lang, true)} icon={Clock} tone="amber" />
        <StatCard label={t('Overdue')} value={formatEGP(overdue, lang, true)} icon={ShieldAlert} tone="purple" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            {['all', 'paid', 'pending', 'overdue'].map((s) => (
              <button key={s} onClick={() => setTab(s)} className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium capitalize', tab === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>{t(s === 'all' ? 'All' : s)}</button>
            ))}
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search beneficiary…')} className="ms-auto h-8 w-full sm:w-[200px]" />
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={Wallet} title={t('No commissions found')} description={t('Adjust the status filter or search term.')} />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>{t('Beneficiary')}</TableHead><TableHead>{t('Deal')}</TableHead><TableHead>{t('Role')}</TableHead><TableHead>{t('Split')}</TableHead><TableHead>{t('Amount')}</TableHead><TableHead>{t('Due')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead className="text-end">{t('Actions')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const deal = deals.find((d) => d.id === c.dealId)
                  const isMine = c.beneficiaryId === brokerId
                  return (
                    <TableRow key={c.id} className={isMine ? 'bg-accent/[0.04]' : undefined}>
                      <TableCell><UserCell name={c.beneficiaryName} sub={isMine ? t('You') : t(c.role)} color={isMine ? '#10B981' : '#334E68'} /></TableCell>
                      <TableCell><p className="text-[11px] font-medium">{deal?.code ?? c.dealId}</p><p className="max-w-[150px] truncate text-[9px] text-muted-foreground">{deal?.propertyTitle}</p></TableCell>
                      <TableCell><Badge tone="outline">{t(c.role.replace(/^./, (x) => x.toUpperCase()))}</Badge></TableCell>
                      <TableCell className="text-[11px]">{c.pct}%</TableCell>
                      <TableCell className="font-medium">{formatEGP(c.amount, lang, true)}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{formatDate(c.dueDate, lang)}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-end">
                        {c.status !== 'paid' ? <Button size="xs" variant="outline" onClick={() => pay(c.id)}>{t('Mark paid')}</Button> : <span className="text-[10px] text-muted-foreground">{t('Paid')}</span>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        <div className="space-y-4">
          <ChartCard title={t('Commission by role')} description={t('Share of the network pool')}>
            <div className="grid items-center gap-3 sm:grid-cols-[1fr_1fr] xl:grid-cols-1 2xl:grid-cols-[1fr_1fr]">
              <DonutChart data={roleData} height={170} centerValue={formatEGP(totalPool, lang, true)} centerLabel={t('pool')} />
              <div className="px-3 pb-2"><DonutLegend data={roleData} /></div>
            </div>
          </ChartCard>
          <Card className="p-4">
            <SectionTitle title={t('Payout status')} />
            <div className="space-y-2.5">
              {statusData.map((s, i) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-[10px]"><span className="text-muted-foreground">{s.name}</span><span className="font-medium">{formatEGP(s.value, lang, true)}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(s.value / Math.max(1, totalPool)) * 100}%`, background: [chartColors.emerald, chartColors.amber, chartColors.rose][i] }} /></div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium"><ShieldCheck className="size-3.5 text-accent" /> {t('Commission protection')}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{t('Every cooperation deal records the agreed split on both sides. Disputes can be escalated to the trust desk from the request workspace.')}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function ExchangeTrustPage() {
  const { t, lang } = useI18n()
  const { requests, brokers, companies } = useExchangeData()
  const updateCooperation = useAppStore((s) => s.updateCooperation)
  const updateBroker = useAppStore((s) => s.updateBroker)
  const toast = useAppStore((s) => s.toast)
  const [policy, setPolicy] = useState<string | null>(null)

  const disputed = requests.filter((r) => r.dispute === 'open')
  const protectedCount = requests.filter((r) => r.customerProtected).length
  const verified = brokers.filter((b) => b.verified)
  const completion = requests.length ? Math.round((requests.filter((r) => r.status === 'completed').length / requests.length) * 100) : 0
  const trustScore = Math.round((verified.length / Math.max(1, brokers.length)) * 40 + (completion / 100) * 40 + (disputed.length === 0 ? 20 : 10))

  const toggleDispute = (id: string, open: boolean) => {
    updateCooperation(id, { dispute: open ? 'open' : 'resolved' })
    toast(open ? 'Dispute opened' : 'Dispute resolved', open ? 'The trust desk will review this cooperation.' : 'The cooperation record was cleared.', open ? 'warning' : 'success')
  }

  const policies = [
    { id: 'customer', title: t('Customer protection'), icon: LockKeyhole, body: t('Customer names and phone numbers stay masked until the owning company accepts cooperation. The requesting broker remains the source of record for 90 days, and both sides can see the protection status in the workspace.') },
    { id: 'commission', title: t('Commission escrow'), icon: Wallet, body: t('Agreed commission splits are recorded when the request is created. Payouts are tracked in the commission ledger and can only be marked paid after the deal is completed.') },
    { id: 'dispute', title: t('Dispute resolution'), icon: ShieldAlert, body: t('Either party can flag a cooperation for review. The trust desk sees the full audit trail, notes and milestone history, and can resolve or escalate the case.') },
    { id: 'verification', title: t('Broker verification'), icon: BadgeCheck, body: t('Verified partners have a completed company profile, a valid license on record and a track record of closed cooperation deals. Unverified partners can still request cooperation with extra checks.') },
  ]

  return (
    <div>
      <PageHeader
        eyebrow={<><ShieldCheck className="size-3.5" /> {t('Broker Network')}</>}
        title={t('Trust & protection')}
        description={t('Safeguards that keep broker-to-broker cooperation transparent and accountable.')}
        actions={<Button variant="outline" onClick={() => setPolicy('customer')}><FileSignature className="size-4" /> {t('Review policies')}</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-[#0c1f34] p-6 text-white">
          <div className="absolute -end-10 -top-10 size-44 rounded-full bg-accent/20 blur-2xl" />
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">{t('Network trust score')}</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-5xl font-semibold tracking-[-0.04em]">{trustScore}</span>
            <span className="pb-1.5 text-[12px] text-white/70">/ 100</span>
          </div>
          <p className="mt-1 max-w-md text-[11px] leading-relaxed text-white/70">{t('Calculated from verified partners, completed cooperation and open disputes. This is a demo score based on local sample data.')}</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-2.5"><p className="text-lg font-semibold">{verified.length}</p><p className="text-[9px] text-white/60">{t('Verified partners')}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-2.5"><p className="text-lg font-semibold">{protectedCount}</p><p className="text-[9px] text-white/60">{t('Protected customers')}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-2.5"><p className="text-lg font-semibold">{disputed.length}</p><p className="text-[9px] text-white/60">{t('Open disputes')}</p></div>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {policies.map((p) => (
            <button key={p.id} onClick={() => setPolicy(p.id)} className="rounded-xl border border-border bg-card p-4 text-start transition-colors hover:border-slate-300 dark:hover:border-slate-600">
              <span className="grid size-8 place-items-center rounded-lg bg-accent/10 text-accent"><p.icon className="size-4" /></span>
              <p className="mt-2 text-[12px] font-semibold">{p.title}</p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{p.body}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><h3 className="text-[14px] font-semibold">{t('Cooperation safeguards')}</h3><p className="text-[10px] text-muted-foreground">{t('Protection status by request')}</p></div><Badge tone="green">{completion}% {t('completed')}</Badge></div>
          <Table>
            <TableHeader><TableRow><TableHead>{t('Request')}</TableHead><TableHead>{t('Customer')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead>{t('Dispute')}</TableHead><TableHead className="text-end">{t('Actions')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link to={`/exchange/requests/${r.id}`} className="font-medium hover:text-accent">{r.code}</Link><p className="text-[9px] text-muted-foreground">{companies.find((c) => c.id === r.owningCompanyId)?.name}</p></TableCell>
                  <TableCell><span className="inline-flex items-center gap-1 text-[11px]"><LockKeyhole className="size-3 text-muted-foreground" /> {r.customerNameMasked}</span></TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell><Badge tone={r.dispute === 'open' ? 'red' : r.dispute === 'resolved' ? 'green' : 'default'}>{t(r.dispute === 'open' ? 'Open' : r.dispute === 'resolved' ? 'Resolved' : 'None')}</Badge></TableCell>
                  <TableCell className="text-end">
                    {r.dispute === 'open'
                      ? <Button size="xs" variant="outline" onClick={() => toggleDispute(r.id, false)}>{t('Resolve')}</Button>
                      : <Button size="xs" variant="ghost" onClick={() => toggleDispute(r.id, true)}>{t('Flag')}</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3"><h3 className="text-[14px] font-semibold">{t('Partner verification')}</h3><p className="text-[10px] text-muted-foreground">{t('Review unverified brokers')}</p></div>
          <div className="divide-y divide-border">
            {brokers.slice(0, 7).map((b) => (
              <div key={b.id} className="flex items-center gap-2.5 px-4 py-2.5">
                <Avatar name={b.name} color={b.avatarColor} size="sm" />
                <div className="min-w-0 flex-1"><p className="flex items-center gap-1 truncate text-[11px] font-medium">{b.name} {b.verified && <BadgeCheck className="size-3 text-sky-500" />}</p><p className="text-[9px] text-muted-foreground">{b.companyName} · {b.zone}</p></div>
                {b.verified ? <Badge tone="green">{t('Verified')}</Badge> : <Button size="xs" variant="outline" onClick={() => { updateBroker(b.id, { verified: true }); toast('Broker verified', `${b.name} is now a verified partner.`) }}>{t('Verify')}</Button>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Dialog open={!!policy} onOpenChange={(v) => !v && setPolicy(null)}>
        <DialogContent className="max-w-lg">
          {(() => {
            const p = policies.find((x) => x.id === policy)
            if (!p) return null
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><p.icon className="size-4 text-accent" /> {p.title}</DialogTitle>
                  <DialogDescription>{t('Protection policy · demo environment')}</DialogDescription>
                </DialogHeader>
                <p className="text-[12px] leading-relaxed text-muted-foreground">{p.body}</p>
                <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium"><ShieldCheck className="size-3.5 text-accent" /> {t('Demo note')}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{t('These protections are simulated user-interface rules. No legal agreement, escrow or real dispute process exists in this frontend demo.')}</p>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setPolicy(null)}>{t('Close')}</Button><Button onClick={() => setPolicy(null)}>{t('Acknowledge')}</Button></DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ExchangeNetworkPage() {
  const { t, lang } = useI18n()
  const { brokers, deals, requests, companies } = useExchangeData()
  const addBroker = useAppStore((s) => s.addBroker)
  const toast = useAppStore((s) => s.toast)
  const [query, setQuery] = useState('')
  const [zone, setZone] = useState('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selected, setSelected] = useState<Broker | null>(null)
  const [form, setForm] = useState({ name: '', companyName: '', phone: '', zone: 'New Cairo', commissionRate: '2.25' })

  const zones = [...new Set(brokers.map((b) => b.zone))]
  const filtered = brokers.filter((b) => {
    if (zone !== 'all' && b.zone !== zone) return false
    if (verifiedOnly && !b.verified) return false
    if (!query.trim()) return true
    return `${b.name} ${b.companyName} ${b.zone}`.toLowerCase().includes(query.trim().toLowerCase())
  })

  const rows = filtered.map((b) => {
    const bDeals = deals.filter((d) => d.brokerId === b.id)
    const bRequests = requests.filter((r) => r.requesterBrokerId === b.id || r.ownerBrokerId === b.id)
    return { broker: b, deals: bDeals.length, won: bDeals.filter((d) => d.stage === 'won').length, value: bDeals.reduce((s, d) => s + d.value, 0), requests: bRequests.length }
  })

  const zoneData = zones.map((z) => ({ name: z, value: brokers.filter((b) => b.zone === z).length })).filter((x) => x.value > 0)
  const networkValue = deals.reduce((s, d) => s + d.value, 0)

  const submitInvite = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast('Missing details', 'Add the broker name and phone number.', 'error')
      return
    }
    addBroker({
      id: uid('b'), name: form.name.trim(), companyName: form.companyName.trim() || 'Independent', verified: false,
      rating: 4, activeListings: 0, dealsClosed: 0, commissionRate: Number(form.commissionRate) || 2.25,
      phone: form.phone.trim(), avatarColor: ['#0F766E', '#B45309', '#0369A1', '#7C3AED', '#BE123C'][brokers.length % 5], zone: form.zone,
    })
    setInviteOpen(false)
    setForm({ name: '', companyName: '', phone: '', zone: 'New Cairo', commissionRate: '2.25' })
  }

  return (
    <div>
      <PageHeader
        eyebrow={<><Users className="size-3.5" /> {t('Broker Network')}</>}
        title={t('Partner network')}
        description={t('The brokers and companies cooperating on shared inventory across Egypt.')}
        actions={<Button onClick={() => setInviteOpen(true)}><Plus className="size-4" /> {t('Invite partner')}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Network brokers')} value={brokers.length} icon={Users} hint={`${brokers.filter((b) => b.verified).length} ${t('verified')}`} />
        <StatCard label={t('Partner companies')} value={new Set(brokers.map((b) => b.companyName)).size} icon={Building2} tone="blue" />
        <StatCard label={t('Network deal value')} value={formatEGP(networkValue, lang, true)} icon={Wallet} tone="green" />
        <StatCard label={t('Cooperation deals')} value={requests.length} icon={Handshake} tone="purple" hint={`${requests.filter((r) => r.status === 'accepted' || r.status === 'completed').length} ${t('active')}`} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search partners…')} className="ps-9" />
        </div>
        <Select value={zone} onChange={(e) => setZone(e.target.value)} className="h-9 w-[170px]">
          <option value="all">{t('All zones')}</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </Select>
        <Button size="sm" variant={verifiedOnly ? 'default' : 'outline'} onClick={() => setVerifiedOnly((v) => !v)}><BadgeCheck className="size-3.5" /> {t('Verified only')}</Button>
        <span className="ms-auto text-[11px] text-muted-foreground">{rows.length} {t('partners')}</span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>{t('Partner')}</TableHead><TableHead>{t('Zone')}</TableHead><TableHead>{t('Rating')}</TableHead><TableHead>{t('Deals')}</TableHead><TableHead>{t('Commission')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead className="text-end">{t('Actions')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map(({ broker, deals: dealCount, requests: reqCount }) => (
                <TableRow key={broker.id}>
                  <TableCell><UserCell name={broker.name} sub={broker.companyName} color={broker.avatarColor} /></TableCell>
                  <TableCell className="text-[11px]">{broker.zone}</TableCell>
                  <TableCell><span className="inline-flex items-center gap-1 text-[11px]"><Star className="size-3 fill-amber-400 text-amber-400" /> {broker.rating.toFixed(1)}</span></TableCell>
                  <TableCell className="text-[12px]">{dealCount} <span className="text-muted-foreground">· {reqCount} {t('coop.')}</span></TableCell>
                  <TableCell className="font-medium">{broker.commissionRate}%</TableCell>
                  <TableCell><Badge tone={broker.verified ? 'green' : 'amber'}>{broker.verified ? t('Verified') : t('Pending')}</Badge></TableCell>
                  <TableCell className="text-end"><Button size="xs" variant="outline" onClick={() => setSelected(broker)}>{t('View')}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <div className="space-y-4">
          <ChartCard title={t('Network by zone')} description={t('Brokers per coverage area')}>
            <BarsChart data={zoneData} series={[{ key: 'value', label: t('Brokers'), color: chartColors.navy }]} height={220} vertical />
          </ChartCard>
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold"><Sparkles className="size-4 text-accent" /> {t('Network tip')}</p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{t('Partners with complete profiles are 2.4x more likely to have cooperation requests accepted. Invite your active brokers and ask them to verify their company license.')}</p>
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setInviteOpen(true)}><Plus className="size-3.5" /> {t('Invite partner')}</Button>
          </Card>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)} width="420px">
        {selected && (
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-5 pe-12">
              <div className="flex items-center gap-3">
                <Avatar name={selected.name} color={selected.avatarColor} size="lg" />
                <div><h2 className="flex items-center gap-1.5 text-base font-semibold">{selected.name} {selected.verified && <BadgeCheck className="size-4 text-sky-500" />}</h2><p className="text-[11px] text-muted-foreground">{selected.companyName} · {selected.zone}</p></div>
              </div>
            </div>
            <div className="flex-1 p-5">
              <div className="divide-y divide-border">
                <InfoRow label={t('Phone')} value={<span dir="ltr">{selected.phone}</span>} />
                <InfoRow label={t('Rating')} value={`${selected.rating.toFixed(1)} / 5`} />
                <InfoRow label={t('Active listings')} value={selected.activeListings} />
                <InfoRow label={t('Deals closed')} value={selected.dealsClosed} />
                <InfoRow label={t('Commission rate')} value={`${selected.commissionRate}%`} />
                <InfoRow label={t('Status')} value={<Badge tone={selected.verified ? 'green' : 'amber'}>{selected.verified ? t('Verified partner') : t('Pending verification')}</Badge>} />
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { window.location.href = `/exchange/requests?new=1` }}>{t('Request cooperation')}</Button>
                <Button className="flex-1" onClick={() => { toast('Message simulated', `Your message to ${selected.name} was not sent — messaging is simulated in this demo.`, 'info') }}>{t('Contact')}</Button>
              </div>
            </div>
          </div>
        )}
      </Sheet>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Invite partner')}</DialogTitle>
            <DialogDescription>{t('Add a broker to the cooperation network. New partners start unverified.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label={t('Broker name')} required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Hazem Fathy" /></Field>
            <Field label={t('Company')}><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Independent" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Phone')} required><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+20 100 000 0000" dir="ltr" /></Field>
              <Field label={t('Commission %')}><Input type="number" step="0.25" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} /></Field>
            </div>
            <Field label={t('Zone')}>
              <Select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}>
                {['New Cairo', 'Sheikh Zayed', '6th of October', 'New Capital', 'North Coast', 'New Alamein', 'Maadi', 'Mostakbal City'].map((z) => <option key={z} value={z}>{z}</option>)}
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={submitInvite}><Send className="size-4" /> {t('Send invite')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
