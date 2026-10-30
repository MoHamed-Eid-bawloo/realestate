import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, Building2, CalendarDays, CheckCircle2, ChevronRight,
  CircleDollarSign, Clock, CreditCard, Download, ExternalLink, Eye, FileText, Globe2, Handshake,
  Landmark, Layers, LayoutDashboard, LockKeyhole, Mail, MapPin, Percent, Phone, Plus, RefreshCw, Save,
  Settings, ShieldAlert, ShieldCheck, Sparkles, Store, TrendingUp, UserCheck, UserX, Users, Wallet, XCircle,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore, type PlatformSettings } from '@/store/appStore'
import { formatDate, formatEGP, formatNumber, fromNow } from '@/lib/format'
import { cn, downloadCsv, humanize, uid } from '@/lib/utils'
import { PageHeader, StatCard, SearchInput, InfoRow, SectionTitle, UserCell } from '@/components/shared'
import { BarsChart, ChartCard, DonutChart, DonutLegend, chartColors } from '@/components/charts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { ConfirmDialog, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Sheet } from '@/components/ui/dialog'
import { Avatar, EmptyState, Pagination, Switch } from '@/components/ui/misc'
import type { Company, Employee } from '@/types'

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

function PlatformHeading({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return (
    <PageHeader
      eyebrow={<><ShieldCheck className="size-3.5" /> {useI18n().t('Super Admin')}</>}
      title={title}
      description={description}
      actions={actions}
    />
  )
}

export function AdminOverviewPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const companies = useAppStore((s) => s.companies)
  const subscriptions = useAppStore((s) => s.subscriptions)
  const plans = useAppStore((s) => s.subscriptionPlans)
  const employees = useAppStore((s) => s.employees)
  const brokers = useAppStore((s) => s.brokers)
  const properties = useAppStore((s) => s.properties)
  const projects = useAppStore((s) => s.projects)
  const deals = useAppStore((s) => s.deals)
  const transactions = useAppStore((s) => s.transactions)
  const tickets = useAppStore((s) => s.tickets)
  const audit = useAppStore((s) => s.audit)
  const cooperationRequests = useAppStore((s) => s.cooperationRequests)
  const updateCompany = useAppStore((s) => s.updateCompany)
  const toast = useAppStore((s) => s.toast)

  const planById = new Map(plans.map((plan) => [plan.id, plan]))
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'active')
  const atRiskSubscriptions = subscriptions.filter((subscription) => subscription.status === 'past_due')
  const mrr = sum(activeSubscriptions.map((subscription) => planById.get(subscription.planId)?.price ?? 0))
  const atRiskMrr = sum(atRiskSubscriptions.map((subscription) => planById.get(subscription.planId)?.price ?? 0))
  const platformGmv = sum(deals.filter((deal) => deal.stage === 'won').map((deal) => deal.value))
  const wonTransactions = sum(transactions.filter((tx) => tx.status === 'completed').map((tx) => tx.amount))
  const users = employees.length + brokers.length
  const pendingListings = properties.filter((property) => property.status === 'pending_review').length
  const unverifiedCompanies = companies.filter((company) => !company.verified).length
  const unverifiedBrokers = brokers.filter((broker) => !broker.verified).length
  const openTickets = tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_progress').length
  const openDisputes = cooperationRequests.filter((request) => request.dispute === 'open').length

  const planSubscribers = plans.map((plan) => ({
    name: plan.name,
    value: subscriptions.filter((subscription) => subscription.planId === plan.id).length,
    mrr: subscriptions.filter((subscription) => subscription.planId === plan.id && subscription.status === 'active').reduce((total, subscription) => total + plan.price, 0),
  }))

  const typeData = ['brokerage', 'developer', 'hybrid'].map((type) => ({
    name: t(humanize(type)),
    value: companies.filter((company) => company.type === type).length,
  })).filter((item) => item.value > 0)

  const planData = planSubscribers.filter((item) => item.value > 0).map((item) => ({ name: item.name, value: item.value }))

  const exportOverview = () => {
    downloadCsv('nawyati-platform-overview.csv', [
      ['Metric', 'Value'],
      ['Companies', companies.length],
      ['Platform users', users],
      ['Active subscriptions', activeSubscriptions.length],
      ['MRR (EGP)', mrr],
      ['ARR (EGP)', mrr * 12],
      ['At-risk MRR (EGP)', atRiskMrr],
      ['Marketplace GMV (EGP)', platformGmv],
      ['Collected transaction value (EGP)', wonTransactions],
      ['Properties', properties.length],
      ['Projects', projects.length],
      ['Pending listings', pendingListings],
      ['Open support tickets', openTickets],
      ['Open disputes', openDisputes],
    ])
    toast('Platform report exported', 'A CSV summary of the demo platform metrics was downloaded.')
  }

  const reviewQueue = [
    { label: t('Pending listings'), value: pendingListings, href: '/admin/moderation', tone: 'amber' as const },
    { label: t('Unverified companies'), value: unverifiedCompanies, href: '/admin/moderation', tone: 'blue' as const },
    { label: t('Unverified brokers'), value: unverifiedBrokers, href: '/admin/moderation', tone: 'purple' as const },
    { label: t('Open disputes'), value: openDisputes, href: '/admin/moderation', tone: 'navy' as const },
  ]

  return (
    <div>
      <PlatformHeading
        title={t('Platform Overview')}
        description={t('Tenant health, marketplace activity and subscription revenue across the demo platform.')}
        actions={<>
          <Button variant="outline" onClick={exportOverview}><Download className="size-4" /> {t('Export')}</Button>
          <Button onClick={() => navigate('/admin/moderation')}><ShieldAlert className="size-4" /> {t('Review moderation')}</Button>
        </>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Companies')} value={companies.length} icon={Building2} hint={`${companies.filter((c) => c.status === 'active').length} ${t('active')}`} href="/admin/companies" />
        <StatCard label={t('Platform users')} value={users} icon={Users} tone="blue" hint={`${employees.length} ${t('employees')} · ${brokers.length} ${t('brokers')}`} href="/admin/users" />
        <StatCard label={t('Subscription MRR')} value={formatEGP(mrr, lang, true)} icon={CreditCard} tone="green" hint={`${activeSubscriptions.length} ${t('active subscriptions')}`} href="/admin/subscriptions" />
        <StatCard label={t('Marketplace GMV')} value={formatEGP(platformGmv, lang, true)} icon={TrendingUp} tone="purple" hint={t('won deals across all tenants')} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard title={t('Recurring revenue by plan')} description={`${t('Illustrative subscription MRR in EGP')} · ${t('demo billing')}`}>
          <BarsChart
            data={planSubscribers.map((plan) => ({ name: plan.name, mrr: plan.mrr, subscribers: plan.value }))}
            series={[
              { key: 'mrr', label: t('MRR'), color: chartColors.emerald },
              { key: 'subscribers', label: t('Subscribers'), color: chartColors.sky },
            ]}
            height={280}
          />
        </ChartCard>
        <ChartCard title={t('Tenant mix')} description={t('Companies by business model')}>
          <DonutChart data={typeData} height={190} centerValue={String(companies.length)} centerLabel={t('companies')} />
          <div className="px-3 pb-2"><DonutLegend data={typeData} /></div>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="text-[14px] font-semibold">{t('Recent companies')}</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Latest tenants and subscription state')}</p>
            </div>
            <Link to="/admin/companies" className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline">
              {t('Manage companies')} <ArrowRight className="size-3 rtl:rotate-180" />
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Company')}</TableHead>
                <TableHead>{t('Type')}</TableHead>
                <TableHead>{t('Plan')}</TableHead>
                <TableHead>{t('Employees')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead className="text-end">{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...companies].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6).map((company) => {
                const subscription = subscriptions.find((item) => item.companyId === company.id)
                return (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-7 place-items-center rounded-lg text-[10px] font-semibold text-white" style={{ background: company.logoColor }}>{company.name.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <p className="text-[12px] font-medium">{company.name}</p>
                          <p className="text-[10px] text-muted-foreground">{company.city}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px]">{t(humanize(company.type))}</TableCell>
                    <TableCell className="text-[12px]">{subscription ? planById.get(subscription.planId)?.name : '—'}</TableCell>
                    <TableCell className="text-[12px]">{company.employees}</TableCell>
                    <TableCell><StatusBadge status={company.status} /></TableCell>
                    <TableCell className="text-end">
                      {!company.verified ? (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => { updateCompany(company.id, { verified: true, status: 'active' }); toast('Company verified', `${company.name} can now publish inventory.`) }}
                        >
                          <BadgeCheck className="size-3.5" /> {t('Verify')}
                        </Button>
                      ) : (
                        <Badge tone="green"><CheckCircle2 className="size-3" /> {t('Verified')}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <SectionTitle title={t('Review queue')} description={t('Items waiting for a platform decision')} />
              <ShieldAlert className="size-4 text-amber-500" />
            </div>
            <div className="space-y-2">
              {reviewQueue.map((item) => (
                <Link key={item.label} to={item.href} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 px-3 py-2.5 transition-colors hover:bg-muted/50">
                  <span className="text-[12px]">{item.label}</span>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
                    {item.value}
                    <ChevronRight className="size-3.5 text-muted-foreground rtl:rotate-180" />
                  </span>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle title={t('Platform health')} description={t('Operational snapshot')} />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12px]"><span className="text-muted-foreground">{t('Listings')}</span><span className="font-medium">{formatNumber(properties.length, lang)} · {properties.filter((p) => p.listingStatus === 'published').length} {t('published')}</span></div>
              <div className="flex items-center justify-between text-[12px]"><span className="text-muted-foreground">{t('Projects')}</span><span className="font-medium">{projects.length}</span></div>
              <div className="flex items-center justify-between text-[12px]"><span className="text-muted-foreground">{t('Collected transactions')}</span><span className="font-medium">{formatEGP(wonTransactions, lang, true)}</span></div>
              <div className="flex items-center justify-between text-[12px]"><span className="text-muted-foreground">{t('Open tickets')}</span><span className={cn('font-medium', openTickets > 0 && 'text-amber-600 dark:text-amber-400')}>{openTickets}</span></div>
              <div className="flex items-center justify-between text-[12px]"><span className="text-muted-foreground">{t('At-risk MRR')}</span><span className={cn('font-medium', atRiskMrr > 0 && 'text-rose-600 dark:text-rose-400')}>{formatEGP(atRiskMrr, lang, true)}</span></div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <ChartCard title={t('Subscription distribution')} description={t('Companies per plan')}>
          <DonutChart data={planData} height={190} centerValue={String(subscriptions.length)} centerLabel={t('subscriptions')} />
          <div className="px-3 pb-2"><DonutLegend data={planData} /></div>
        </ChartCard>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="text-[14px] font-semibold">{t('Audit trail')}</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Recent platform activity in the demo')}</p>
            </div>
            <Activity className="size-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {audit.slice(0, 6).map((entry) => (
              <div key={entry.id} className="flex items-start gap-2.5 px-4 py-3">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium">{t(entry.action)}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{entry.target}</p>
                </div>
                <div className="text-end">
                  <p className="text-[10px] text-muted-foreground">{entry.actor === 'System' ? t('System') : entry.actor}</p>
                  <p className="text-[10px] text-muted-foreground/70">{fromNow(entry.at, lang)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export function AdminCompaniesPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const companies = useAppStore((s) => s.companies)
  const employees = useAppStore((s) => s.employees)
  const properties = useAppStore((s) => s.properties)
  const subscriptions = useAppStore((s) => s.subscriptions)
  const plans = useAppStore((s) => s.subscriptionPlans)
  const deals = useAppStore((s) => s.deals)
  const updateCompany = useAppStore((s) => s.updateCompany)
  const toast = useAppStore((s) => s.toast)

  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = companies.find((company) => company.id === selectedId)
  const planById = new Map(plans.map((plan) => [plan.id, plan]))

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return companies
      .filter((company) => type === 'all' || company.type === type)
      .filter((company) => status === 'all' || company.status === status)
      .filter((company) => !term || company.name.toLowerCase().includes(term) || company.city.toLowerCase().includes(term) || company.license.toLowerCase().includes(term) || company.email.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [companies, query, type, status])

  const selectedSubscription = selected ? subscriptions.find((subscription) => subscription.companyId === selected.id) : undefined
  const selectedPlan = selectedSubscription ? planById.get(selectedSubscription.planId) : undefined
  const selectedEmployees = selected ? employees.filter((employee) => employee.companyId === selected.id) : []
  const selectedProperties = selected ? properties.filter((property) => property.companyId === selected.id) : []
  const selectedDeals = selected ? deals.filter((deal) => deal.companyId === selected.id) : []

  const exportCompanies = () => {
    downloadCsv('nawyati-companies.csv', [
      ['Company', 'Type', 'License', 'City', 'Status', 'Verified', 'Plan', 'Employees', 'Listings', 'Rating'],
      ...filtered.map((company) => {
        const subscription = subscriptions.find((item) => item.companyId === company.id)
        return [company.name, company.type, company.license, company.city, company.status, company.verified ? 'Yes' : 'No', planById.get(subscription?.planId ?? '')?.name ?? '—', company.employees, properties.filter((p) => p.companyId === company.id).length, company.rating]
      }),
    ])
    toast('Companies exported', 'The company directory was downloaded as a CSV file.')
  }

  const toggleActive = (company: Company) => {
    const next = company.status === 'suspended' ? 'active' : 'suspended'
    updateCompany(company.id, { status: next })
    toast(next === 'active' ? 'Company reactivated' : 'Company suspended', `${company.name} is now ${next}.`)
  }

  return (
    <div>
      <PlatformHeading
        title={t('Companies')}
        description={t('Manage tenants, verification state and subscription visibility across the platform.')}
        actions={<Button variant="outline" onClick={exportCompanies}><Download className="size-4" /> {t('Export')}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Total companies')} value={companies.length} icon={Building2} />
        <StatCard label={t('Active')} value={companies.filter((company) => company.status === 'active').length} icon={CheckCircle2} tone="green" />
        <StatCard label={t('Verified')} value={companies.filter((company) => company.verified).length} icon={BadgeCheck} tone="blue" />
        <StatCard label={t('Suspended')} value={companies.filter((company) => company.status === 'suspended').length} icon={XCircle} tone="amber" />
      </div>

      <Card className="mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder={t('Search name, city, license or email')} className="w-full sm:w-80" />
          <Select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-[150px]">
            <option value="all">{t('All types')}</option>
            <option value="brokerage">{t('Brokerage')}</option>
            <option value="developer">{t('Developer')}</option>
            <option value="hybrid">{t('Hybrid')}</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-[150px]">
            <option value="all">{t('All statuses')}</option>
            <option value="active">{t('Active')}</option>
            <option value="pending">{t('Pending')}</option>
            <option value="suspended">{t('Suspended')}</option>
          </Select>
          <span className="ms-auto text-[11px] text-muted-foreground">{filtered.length} {t('companies')}</span>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Company')}</TableHead>
              <TableHead>{t('Type')}</TableHead>
              <TableHead>{t('License')}</TableHead>
              <TableHead>{t('Plan')}</TableHead>
              <TableHead>{t('Employees')}</TableHead>
              <TableHead>{t('Listings')}</TableHead>
              <TableHead>{t('Rating')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead className="text-end">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((company) => {
              const subscription = subscriptions.find((item) => item.companyId === company.id)
              return (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-lg text-[10px] font-semibold text-white" style={{ background: company.logoColor }}>{company.name.slice(0, 2).toUpperCase()}</span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 text-[12px] font-medium">{company.name}{company.verified && <BadgeCheck className="size-3.5 text-sky-500" />}</p>
                        <p className="text-[10px] text-muted-foreground">{company.city}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px]">{t(humanize(company.type))}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">{company.license}</TableCell>
                  <TableCell className="text-[12px]">{subscription ? planById.get(subscription.planId)?.name : '—'}</TableCell>
                  <TableCell className="text-[12px]">{employees.filter((employee) => employee.companyId === company.id).length}</TableCell>
                  <TableCell className="text-[12px]">{properties.filter((property) => property.companyId === company.id).length}</TableCell>
                  <TableCell className="text-[12px]">{company.rating.toFixed(1)}</TableCell>
                  <TableCell><StatusBadge status={company.status} /></TableCell>
                  <TableCell className="text-end">
                    <div className="inline-flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setSelectedId(company.id)} aria-label={t('View company')}><Eye className="size-3.5" /></Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { updateCompany(company.id, { verified: !company.verified }); toast(company.verified ? 'Verification removed' : 'Company verified', company.name) }}
                        aria-label={t('Toggle verification')}
                      >
                        <BadgeCheck className={cn('size-3.5', company.verified && 'text-sky-500')} />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => toggleActive(company)} aria-label={t('Toggle status')}>
                        {company.status === 'suspended' ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-rose-500" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {!filtered.length && <EmptyState icon={Building2} title={t('No companies found')} description={t('Try a different search term, type or status.')} />}
      </Card>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)} width="520px">
        {selected && (
          <>
            <div className="border-b border-border p-5 pe-14">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl text-sm font-semibold text-white" style={{ background: selected.logoColor }}>{selected.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.01em]">{selected.name}</h2>
                  <div className="mt-1 flex items-center gap-1.5">
                    <StatusBadge status={selected.status} />
                    {selected.verified && <Badge tone="blue"><BadgeCheck className="size-3" /> {t('Verified')}</Badge>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Employees')}</p><p className="mt-1 text-lg font-semibold">{selectedEmployees.length}</p></div>
                <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Listings')}</p><p className="mt-1 text-lg font-semibold">{selectedProperties.length}</p></div>
                <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Deals')}</p><p className="mt-1 text-lg font-semibold">{selectedDeals.length}</p></div>
              </div>
              <div className="divide-y divide-border">
                <InfoRow label={t('Business model')} value={t(humanize(selected.type))} />
                <InfoRow label={t('License')} value={selected.license} />
                <InfoRow label={t('Email')} value={selected.email} />
                <InfoRow label={t('Phone')} value={selected.phone} />
                <InfoRow label={t('City')} value={selected.city} />
                <InfoRow label={t('Branches')} value={selected.branches} />
                <InfoRow label={t('Rating')} value={`${selected.rating.toFixed(1)} / 5`} />
                <InfoRow label={t('Joined')} value={formatDate(selected.createdAt, lang, 'dd MMM yyyy')} />
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Subscription')}</p>
                    <p className="mt-1 text-[13px] font-semibold">{selectedPlan?.name ?? t('No plan')}</p>
                  </div>
                  <StatusBadge status={selectedSubscription?.status ?? 'none'} />
                </div>
                {selectedSubscription && selectedPlan && (
                  <div className="mt-3 space-y-2 text-[11px] text-muted-foreground">
                    <div className="flex justify-between"><span>{t('Monthly price')}</span><span className="font-medium text-foreground">{formatEGP(selectedPlan.price, lang)}</span></div>
                    <div className="flex justify-between"><span>{t('Seats')}</span><span>{selectedSubscription.seatsUsed} / {selectedPlan.userLimit}</span></div>
                    <div className="flex justify-between"><span>{t('Listings')}</span><span>{selectedSubscription.propertyCount} / {selectedPlan.propertyLimit}</span></div>
                    <div className="flex justify-between"><span>{t('Renewal')}</span><span>{formatDate(selectedSubscription.renewalDate, lang, 'dd MMM yyyy')}</span></div>
                  </div>
                )}
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('/admin/subscriptions')}>
                  <CreditCard className="size-3.5" /> {t('Manage subscription')}
                </Button>
              </div>
            </div>
            <div className="flex gap-2 border-t border-border p-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { updateCompany(selected.id, { verified: !selected.verified }); toast(selected.verified ? 'Verification removed' : 'Company verified', selected.name) }}
              >
                <BadgeCheck className="size-4" /> {selected.verified ? t('Remove verification') : t('Verify company')}
              </Button>
              <Button variant={selected.status === 'suspended' ? 'accent' : 'danger-soft'} className="flex-1" onClick={() => toggleActive(selected)}>
                {selected.status === 'suspended' ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                {selected.status === 'suspended' ? t('Reactivate') : t('Suspend')}
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </div>
  )
}

export function AdminUsersPage() {
  const { t, lang } = useI18n()
  const companies = useAppStore((s) => s.companies)
  const employees = useAppStore((s) => s.employees)
  const teams = useAppStore((s) => s.teams)
  const updateEmployee = useAppStore((s) => s.updateEmployee)
  const addEmployee = useAppStore((s) => s.addEmployee)
  const toast = useAppStore((s) => s.toast)

  const [query, setQuery] = useState('')
  const [companyId, setCompanyId] = useState('all')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [editingId, setEditingId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const editing = employees.find((employee) => employee.id === editingId)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return employees
      .filter((employee) => companyId === 'all' || employee.companyId === companyId)
      .filter((employee) => role === 'all' || employee.role === role)
      .filter((employee) => status === 'all' || employee.status === status)
      .filter((employee) => !term || employee.name.toLowerCase().includes(term) || employee.email.toLowerCase().includes(term) || employee.phone.includes(term))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [employees, query, companyId, role, status])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const companyById = new Map(companies.map((company) => [company.id, company]))

  const exportUsers = () => {
    downloadCsv('nawyati-users.csv', [
      ['Name', 'Company', 'Role', 'Title', 'Email', 'Phone', 'Status', 'Deals won', 'Joined'],
      ...filtered.map((employee) => [employee.name, companyById.get(employee.companyId)?.name ?? '—', employee.role, employee.title, employee.email, employee.phone, employee.status, employee.dealsWon, employee.joinedAt]),
    ])
    toast('Users exported', 'The platform user directory was downloaded as a CSV file.')
  }

  return (
    <div>
      <PlatformHeading
        title={t('Users')}
        description={t('Every employee account across all tenant companies. This demo uses role switching instead of passwords.')}
        actions={<>
          <Button variant="outline" onClick={exportUsers}><Download className="size-4" /> {t('Export')}</Button>
          <Button onClick={() => setInviteOpen(true)}><Plus className="size-4" /> {t('Invite user')}</Button>
        </>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Total users')} value={employees.length} icon={Users} />
        <StatCard label={t('Active')} value={employees.filter((employee) => employee.status === 'active').length} icon={CheckCircle2} tone="green" />
        <StatCard label={t('Sales agents')} value={employees.filter((employee) => employee.role === 'agent').length} icon={UserCheck} tone="blue" />
        <StatCard label={t('On leave')} value={employees.filter((employee) => employee.status === 'on_leave').length} icon={Clock} tone="amber" />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
        {t('Accounts sign in with Supabase Auth. Passwords and sessions are managed by Supabase and never stored in the app.')}
      </div>

      <Card className="mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1) }} placeholder={t('Search name, email or phone')} className="w-full sm:w-72" />
          <Select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setPage(1) }} className="h-9 w-[180px]">
            <option value="all">{t('All companies')}</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </Select>
          <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} className="h-9 w-[130px]">
            <option value="all">{t('All roles')}</option>
            <option value="owner">{t('Owner')}</option>
            <option value="manager">{t('Manager')}</option>
            <option value="agent">{t('Agent')}</option>
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="h-9 w-[140px]">
            <option value="all">{t('All statuses')}</option>
            <option value="active">{t('Active')}</option>
            <option value="on_leave">{t('On leave')}</option>
            <option value="inactive">{t('Inactive')}</option>
          </Select>
          <span className="ms-auto text-[11px] text-muted-foreground">{filtered.length} {t('users')}</span>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('User')}</TableHead>
              <TableHead>{t('Company')}</TableHead>
              <TableHead>{t('Role')}</TableHead>
              <TableHead>{t('Contact')}</TableHead>
              <TableHead>{t('Deals won')}</TableHead>
              <TableHead>{t('Joined')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead className="text-end">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell><UserCell name={employee.name} sub={employee.title} color={employee.avatarColor} /></TableCell>
                <TableCell className="text-[12px]">{companyById.get(employee.companyId)?.name ?? '—'}</TableCell>
                <TableCell><Badge tone={employee.role === 'owner' ? 'navy' : employee.role === 'manager' ? 'purple' : 'blue'}>{t(humanize(employee.role))}</Badge></TableCell>
                <TableCell>
                  <p className="text-[11px]">{employee.email}</p>
                  <p className="text-[10px] text-muted-foreground">{employee.phone}</p>
                </TableCell>
                <TableCell className="text-[12px]">{employee.dealsWon}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground">{formatDate(employee.joinedAt, lang, 'dd MMM yyyy')}</TableCell>
                <TableCell><StatusBadge status={employee.status} /></TableCell>
                <TableCell className="text-end">
                  <div className="inline-flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(employee.id)} aria-label={t('Edit user')}><Eye className="size-3.5" /></Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        const next = employee.status === 'active' ? 'inactive' : 'active'
                        updateEmployee(employee.id, { status: next })
                        toast(next === 'active' ? 'User activated' : 'User deactivated', employee.name)
                      }}
                      aria-label={t('Toggle user status')}
                    >
                      {employee.status === 'active' ? <UserX className="size-3.5 text-rose-500" /> : <UserCheck className="size-3.5 text-emerald-500" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!filtered.length && <EmptyState icon={Users} title={t('No users found')} description={t('Try a different company, role, status or search.')} />}
        {!!filtered.length && <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />}
      </Card>

      {editing && (
        <UserEditSheet
          key={editing.id}
          employee={editing}
          companies={companies}
          onClose={() => setEditingId(null)}
          onSave={(patch) => {
            updateEmployee(editing.id, patch)
            setEditingId(null)
          }}
        />
      )}

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        companies={companies}
        teams={teams}
        onCreate={(employee) => {
          addEmployee(employee)
          setInviteOpen(false)
        }}
      />
    </div>
  )
}

function UserEditSheet({ employee, companies, onClose, onSave }: { employee: Employee; companies: Company[]; onClose: () => void; onSave: (patch: Partial<Employee>) => void }) {
  const { t, lang } = useI18n()
  const [name, setName] = useState(employee.name)
  const [title, setTitle] = useState(employee.title)
  const [email, setEmail] = useState(employee.email)
  const [phone, setPhone] = useState(employee.phone)
  const [status, setStatus] = useState<Employee['status']>(employee.status)
  const company = companies.find((item) => item.id === employee.companyId)

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()} width="480px">
      <div className="border-b border-border p-5 pe-14">
        <div className="flex items-center gap-3">
          <Avatar name={employee.name} color={employee.avatarColor} size="lg" />
          <div>
            <h2 className="text-lg font-semibold">{employee.name}</h2>
            <p className="text-[11px] text-muted-foreground">{company?.name ?? '—'} · {t(humanize(employee.role))}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <Label>{t('Full name')}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>{t('Job title')}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>{t('Email')}</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>{t('Phone')}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label>{t('Status')}</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as Employee['status'])}>
            <option value="active">{t('Active')}</option>
            <option value="on_leave">{t('On leave')}</option>
            <option value="inactive">{t('Inactive')}</option>
          </Select>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border px-4">
          <InfoRow label={t('Joined')} value={formatDate(employee.joinedAt, lang, 'dd MMM yyyy')} />
          <InfoRow label={t('Deals won')} value={employee.dealsWon} />
          <InfoRow label={t('Attendance')} value={`${employee.attendance}%`} />
          <InfoRow label={t('Target')} value={formatEGP(employee.target, lang, true)} />
        </div>
      </div>
      <div className="flex gap-2 border-t border-border p-4">
        <Button variant="outline" className="flex-1" onClick={onClose}>{t('Cancel')}</Button>
        <Button
          className="flex-1"
          disabled={!name.trim() || !email.trim()}
          onClick={() => onSave({ name: name.trim(), title, email: email.trim(), phone, status })}
        >
          <Save className="size-4" /> {t('Save changes')}
        </Button>
      </div>
    </Sheet>
  )
}

function InviteUserDialog({ open, onOpenChange, companies, teams, onCreate }: {
  open: boolean
  onOpenChange: (value: boolean) => void
  companies: Company[]
  teams: { id: string; companyId: string }[]
  onCreate: (employee: Employee) => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [role, setRole] = useState<'agent' | 'manager' | 'owner'>('agent')
  const [title, setTitle] = useState('Sales Agent')
  const [error, setError] = useState('')

  const reset = () => {
    setName('')
    setEmail('')
    setPhone('')
    setRole('agent')
    setTitle('Sales Agent')
    setError('')
  }

  const submit = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) { setError(t('Name, email and phone are required.')); return }
    const employee: Employee = {
      id: uid('e'),
      companyId,
      name: name.trim(),
      nameAr: name.trim(),
      role,
      title,
      titleAr: title,
      email: email.trim(),
      phone: phone.trim(),
      teamId: teams.find((team) => team.companyId === companyId)?.id ?? '',
      avatarColor: '#334E68',
      target: role === 'agent' ? 3_000_000 : 0,
      achieved: 0,
      leadsAssigned: 0,
      dealsWon: 0,
      conversion: 0,
      status: 'active',
      joinedAt: new Date().toISOString(),
      attendance: 100,
      permissions: role === 'agent' ? ['Assigned leads', 'Own deals', 'Tasks'] : ['Team management', 'Reports'],
    }
    onCreate(employee)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { onOpenChange(value); if (!value) reset() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Invite platform user')}</DialogTitle>
          <DialogDescription>{t('Creates an employee profile in your workspace. No invitation email is sent.')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label required>{t('Full name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Salma Hany" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label required>{t('Email')}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.eg" />
            </div>
            <div>
              <Label required>{t('Phone')}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 100 000 0000" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{t('Company')}</Label>
              <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>{t('Role')}</Label>
              <Select
                value={role}
                onChange={(e) => {
                  const next = e.target.value as 'agent' | 'manager' | 'owner'
                  setRole(next)
                  setTitle(next === 'agent' ? 'Sales Agent' : next === 'manager' ? 'Sales Manager' : 'Company Owner')
                }}
              >
                <option value="agent">{t('Sales Agent')}</option>
                <option value="manager">{t('Sales Manager')}</option>
                <option value="owner">{t('Company Owner')}</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>{t('Job title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          {error && <p className="text-[11px] text-rose-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button onClick={submit}><Plus className="size-4" /> {t('Create user')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminModerationPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const properties = useAppStore((s) => s.properties)
  const companies = useAppStore((s) => s.companies)
  const brokers = useAppStore((s) => s.brokers)
  const cooperationRequests = useAppStore((s) => s.cooperationRequests)
  const updateProperty = useAppStore((s) => s.updateProperty)
  const updateCompany = useAppStore((s) => s.updateCompany)
  const updateBroker = useAppStore((s) => s.updateBroker)
  const updateCooperation = useAppStore((s) => s.updateCooperation)
  const toast = useAppStore((s) => s.toast)

  const listingQueue = properties.filter((property) => property.status === 'pending_review' || (property.listingStatus === 'draft' && !property.verified))
  const companyQueue = companies.filter((company) => !company.verified)
  const brokerQueue = brokers.filter((broker) => !broker.verified)
  const disputeQueue = cooperationRequests.filter((request) => request.dispute === 'open' || request.dispute === 'resolved')
  const companyById = new Map(companies.map((company) => [company.id, company]))

  const approveListing = (id: string, title: string) => {
    updateProperty(id, { status: 'available', listingStatus: 'published', verified: true })
    toast('Listing approved', `${title} is now published in the marketplace.`)
  }
  const rejectListing = (id: string, title: string) => {
    updateProperty(id, { status: 'unavailable', listingStatus: 'draft', verified: false })
    toast('Listing rejected', `${title} was sent back to the company as a draft.`, 'warning')
  }

  return (
    <div>
      <PlatformHeading
        title={t('Marketplace Moderation')}
        description={t('Review verification queues, published inventory and partner disputes. Decisions update workspace records only.')}
        actions={<Button variant="outline" onClick={() => downloadCsv('nawyati-moderation-queue.csv', [
          ['Queue', 'Item', 'Reference', 'Status'],
          ...listingQueue.map((property) => ['Listing', property.title, property.code, property.status]),
          ...companyQueue.map((company) => ['Company', company.name, company.license, company.status]),
          ...brokerQueue.map((broker) => ['Broker', broker.name, broker.id, 'unverified']),
          ...disputeQueue.map((request) => ['Dispute', request.code, request.propertyId, request.dispute ?? 'none']),
        ])}><Download className="size-4" /> {t('Export queue')}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Pending listings')} value={listingQueue.length} icon={Layers} tone="amber" hint={t('awaiting review')} />
        <StatCard label={t('Unverified companies')} value={companyQueue.length} icon={Building2} tone="blue" hint={t('licence checks')} />
        <StatCard label={t('Unverified brokers')} value={brokerQueue.length} icon={Handshake} tone="purple" hint={t('partner screening')} />
        <StatCard label={t('Disputes')} value={disputeQueue.filter((request) => request.dispute === 'open').length} icon={ShieldAlert} tone="navy" hint={t('open cases')} />
      </div>

      <Tabs defaultValue="listings" className="mt-4">
        <TabsList>
          <TabsTrigger value="listings"><Layers className="size-3.5" /> {t('Listings')} <span className="ms-1 rounded bg-muted px-1.5 text-[10px]">{listingQueue.length}</span></TabsTrigger>
          <TabsTrigger value="companies"><Building2 className="size-3.5" /> {t('Companies')} <span className="ms-1 rounded bg-muted px-1.5 text-[10px]">{companyQueue.length}</span></TabsTrigger>
          <TabsTrigger value="brokers"><Handshake className="size-3.5" /> {t('Brokers')} <span className="ms-1 rounded bg-muted px-1.5 text-[10px]">{brokerQueue.length}</span></TabsTrigger>
          <TabsTrigger value="disputes"><ShieldAlert className="size-3.5" /> {t('Disputes')} <span className="ms-1 rounded bg-muted px-1.5 text-[10px]">{disputeQueue.length}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Listing')}</TableHead>
                  <TableHead>{t('Company')}</TableHead>
                  <TableHead>{t('Location')}</TableHead>
                  <TableHead>{t('Price')}</TableHead>
                  <TableHead>{t('Submitted')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead className="text-end">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listingQueue.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell><p className="max-w-[220px] truncate text-[12px] font-medium">{property.title}</p><p className="text-[10px] text-muted-foreground">{property.code} · {t(humanize(property.type))}</p></TableCell>
                    <TableCell className="text-[12px]">{companyById.get(property.companyId)?.name ?? '—'}</TableCell>
                    <TableCell className="text-[12px]">{property.location}</TableCell>
                    <TableCell className="text-[12px] font-medium">{formatEGP(property.price, lang, true)}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{formatDate(property.createdAt, lang, 'dd MMM yyyy')}</TableCell>
                    <TableCell><StatusBadge status={property.status} /></TableCell>
                    <TableCell className="text-end">
                      <div className="inline-flex items-center gap-1">
                        <Link to={`/properties/${property.id}`} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={t('Preview listing')}><ExternalLink className="size-3.5" /></Link>
                        <Button variant="ghost" size="icon-sm" onClick={() => approveListing(property.id, property.title)} aria-label={t('Approve listing')}><CheckCircle2 className="size-3.5 text-emerald-500" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => rejectListing(property.id, property.title)} aria-label={t('Reject listing')}><XCircle className="size-3.5 text-rose-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!listingQueue.length && <EmptyState icon={CheckCircle2} title={t('Listing queue is clear')} description={t('New submissions will appear here for review.')} />}
          </Card>
        </TabsContent>

        <TabsContent value="companies">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Company')}</TableHead>
                  <TableHead>{t('Type')}</TableHead>
                  <TableHead>{t('License')}</TableHead>
                  <TableHead>{t('City')}</TableHead>
                  <TableHead>{t('Rating')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead className="text-end">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyQueue.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-7 place-items-center rounded-lg text-[10px] font-semibold text-white" style={{ background: company.logoColor }}>{company.name.slice(0, 2).toUpperCase()}</span>
                        <div><p className="text-[12px] font-medium">{company.name}</p><p className="text-[10px] text-muted-foreground">{company.email}</p></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px]">{t(humanize(company.type))}</TableCell>
                    <TableCell className="text-[11px]">{company.license}</TableCell>
                    <TableCell className="text-[12px]">{company.city}</TableCell>
                    <TableCell className="text-[12px]">{company.rating.toFixed(1)}</TableCell>
                    <TableCell><StatusBadge status={company.status} /></TableCell>
                    <TableCell className="text-end">
                      <div className="inline-flex items-center gap-1">
                        <Button variant="outline" size="xs" onClick={() => { updateCompany(company.id, { verified: true, status: 'active' }); toast('Company verified', company.name) }}><CheckCircle2 className="size-3.5" /> {t('Verify')}</Button>
                        <Button variant="ghost" size="xs" className="text-rose-600" onClick={() => { updateCompany(company.id, { status: 'suspended' }); toast('Company suspended', company.name, 'warning') }}>{t('Suspend')}</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!companyQueue.length && <EmptyState icon={BadgeCheck} title={t('All companies verified')} description={t('There are no pending licence checks.')} />}
          </Card>
        </TabsContent>

        <TabsContent value="brokers">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Broker')}</TableHead>
                  <TableHead>{t('Company')}</TableHead>
                  <TableHead>{t('Zone')}</TableHead>
                  <TableHead>{t('Listings')}</TableHead>
                  <TableHead>{t('Rating')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead className="text-end">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brokerQueue.map((broker) => (
                  <TableRow key={broker.id}>
                    <TableCell><UserCell name={broker.name} sub={broker.phone} color={broker.avatarColor} /></TableCell>
                    <TableCell className="text-[12px]">{broker.companyName}</TableCell>
                    <TableCell className="text-[12px]">{broker.zone}</TableCell>
                    <TableCell className="text-[12px]">{broker.activeListings}</TableCell>
                    <TableCell className="text-[12px]">{broker.rating.toFixed(1)}</TableCell>
                    <TableCell><Badge tone="amber">{t('Unverified')}</Badge></TableCell>
                    <TableCell className="text-end">
                      <Button variant="outline" size="xs" onClick={() => { updateBroker(broker.id, { verified: true }); toast('Broker verified', `${broker.name} can now request cooperation.`) }}>
                        <CheckCircle2 className="size-3.5" /> {t('Verify')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!brokerQueue.length && <EmptyState icon={BadgeCheck} title={t('All brokers verified')} description={t('New partner applications will appear here.')} />}
          </Card>
        </TabsContent>

        <TabsContent value="disputes">
          <Card className="overflow-hidden">
            {disputeQueue.length ? (
              <div className="divide-y divide-border">
                {disputeQueue.map((request) => (
                  <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium">{request.code} · {request.customerNameMasked}</p>
                      <p className="text-[10px] text-muted-foreground">{companyById.get(request.requestingCompanyId)?.name} → {companyById.get(request.owningCompanyId)?.name} · {request.commissionPct}% · {request.propertyId.toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={request.dispute === 'open' ? 'red' : 'green'}>{t(humanize(request.dispute ?? 'none'))}</Badge>
                      {request.dispute === 'open' && (
                        <Button variant="outline" size="xs" onClick={() => { updateCooperation(request.id, { dispute: 'resolved' }); toast('Dispute resolved', `${request.code} was marked as resolved in the demo.`) }}>
                          <CheckCircle2 className="size-3.5" /> {t('Mark resolved')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ShieldAlert}
                title={t('No disputes recorded')}
                description={t('Open a dispute from the exchange trust desk to test this queue.')}
                action={<Button variant="outline" size="sm" onClick={() => navigate('/exchange/trust')}><ArrowRight className="size-3.5 rtl:rotate-180" /> {t('Open trust desk')}</Button>}
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function AdminSubscriptionsPage() {
  const { t, lang } = useI18n()
  const plans = useAppStore((s) => s.subscriptionPlans)
  const subscriptions = useAppStore((s) => s.subscriptions)
  const companies = useAppStore((s) => s.companies)
  const updateSubscription = useAppStore((s) => s.updateSubscription)
  const toast = useAppStore((s) => s.toast)

  const planById = new Map(plans.map((plan) => [plan.id, plan]))
  const companyById = new Map(companies.map((company) => [company.id, company]))
  const active = subscriptions.filter((subscription) => subscription.status === 'active')
  const mrr = active.reduce((total, subscription) => total + (planById.get(subscription.planId)?.price ?? 0), 0)
  const pastDue = subscriptions.filter((subscription) => subscription.status === 'past_due')
  const trials = subscriptions.filter((subscription) => subscription.status === 'trial')

  const planSubscribers = plans.map((plan) => ({
    name: plan.name,
    value: subscriptions.filter((subscription) => subscription.planId === plan.id).length,
    mrr: subscriptions.filter((subscription) => subscription.planId === plan.id && subscription.status === 'active').reduce((total) => total + plan.price, 0),
  }))

  const exportSubscriptions = () => {
    downloadCsv('nawyati-subscriptions.csv', [
      ['Company', 'Plan', 'Status', 'Seats used', 'Seat limit', 'Listings', 'Listing limit', 'Monthly (EGP)', 'Renewal'],
      ...subscriptions.map((subscription) => {
        const plan = planById.get(subscription.planId)
        return [companyById.get(subscription.companyId)?.name ?? subscription.companyId, plan?.name ?? subscription.planId, subscription.status, subscription.seatsUsed, plan?.userLimit ?? 0, subscription.propertyCount, plan?.propertyLimit ?? 0, plan?.price ?? 0, subscription.renewalDate]
      }),
    ])
    toast('Subscriptions exported', 'The subscription ledger was downloaded as a CSV file.')
  }

  return (
    <div>
      <PlatformHeading
        title={t('Subscriptions')}
        description={t('Plans, tenants and recurring revenue. Billing is illustrative; no payment provider is connected.')}
        actions={<Button variant="outline" onClick={exportSubscriptions}><Download className="size-4" /> {t('Export')}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Monthly recurring revenue')} value={formatEGP(mrr, lang, true)} icon={CreditCard} tone="green" hint={`${active.length} ${t('active subscriptions')}`} />
        <StatCard label={t('Annual run rate')} value={formatEGP(mrr * 12, lang, true)} icon={TrendingUp} tone="blue" hint={t('based on active MRR')} />
        <StatCard label={t('Trials')} value={trials.length} icon={Clock} tone="amber" hint={t('conversion pipeline')} />
        <StatCard label={t('Past due')} value={pastDue.length} icon={AlertTriangle} tone="purple" hint={t('needs follow-up')} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {plans.map((plan) => {
          const subscribers = planSubscribers.find((item) => item.name === plan.name)?.value ?? 0
          return (
            <Card key={plan.id} className={cn('relative p-4', plan.popular && 'border-accent/40 ring-1 ring-accent/20')}>
              {plan.popular && <Badge tone="green" className="absolute end-3 top-3">{t('Popular')}</Badge>}
              <p className="text-[12px] font-semibold">{plan.name}</p>
              <p className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">{plan.price ? formatEGP(plan.price, lang, true) : t('Free')}<span className="text-[10px] font-normal text-muted-foreground">{plan.price ? ` / ${t('month')}` : ''}</span></p>
              <p className="mt-1 text-[10px] text-muted-foreground">{plan.userLimit} {t('users')} · {plan.propertyLimit} {t('listings')}</p>
              <div className="mt-3 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{subscribers} {t('subscribers')}</span>
                <span className="font-medium">{formatEGP(plan.price * subscribers, lang, true)}</span>
              </div>
              <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                {plan.features.slice(0, 3).map((feature) => (
                  <li key={feature} className="flex items-start gap-1.5 text-[10px] text-muted-foreground"><CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-500" /> {feature}</li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-[14px] font-semibold">{t('Tenant subscriptions')}</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Change a plan to update its demo billing state')}</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Company')}</TableHead>
                <TableHead>{t('Plan')}</TableHead>
                <TableHead>{t('Seats')}</TableHead>
                <TableHead>{t('Listings')}</TableHead>
                <TableHead>{t('Renewal')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead className="text-end">{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => {
                const plan = planById.get(subscription.planId)
                const company = companyById.get(subscription.companyId)
                return (
                  <TableRow key={subscription.companyId}>
                    <TableCell><p className="text-[12px] font-medium">{company?.name ?? subscription.companyId}</p><p className="text-[10px] text-muted-foreground">{company?.city}</p></TableCell>
                    <TableCell>
                      <Select
                        value={subscription.planId}
                        onChange={(e) => updateSubscription(subscription.companyId, e.target.value)}
                        className="h-8 w-[150px] text-[12px]"
                      >
                        {plans.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                      </Select>
                    </TableCell>
                    <TableCell className="text-[11px]">{subscription.seatsUsed} / {plan?.userLimit ?? '—'}</TableCell>
                    <TableCell className="text-[11px]">{subscription.propertyCount} / {plan?.propertyLimit ?? '—'}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{formatDate(subscription.renewalDate, lang, 'dd MMM yyyy')}</TableCell>
                    <TableCell><StatusBadge status={subscription.status} /></TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => { updateSubscription(subscription.companyId, subscription.planId); toast('Subscription renewed', `${company?.name ?? 'Tenant'} renewed for 30 days in the demo.`) }}
                      >
                        <RefreshCw className="size-3" /> {t('Renew')}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>

        <div className="space-y-4">
          <ChartCard title={t('Subscribers by plan')} description={t('Tenant distribution')}>
            <DonutChart data={planSubscribers.filter((plan) => plan.value > 0)} height={185} centerValue={String(companies.length)} centerLabel={t('tenants')} />
            <div className="px-3 pb-2"><DonutLegend data={planSubscribers.filter((plan) => plan.value > 0)} /></div>
          </ChartCard>
          <Card className="p-4">
            <SectionTitle title={t('Revenue at risk')} description={t('Past-due tenant subscriptions')} />
            {pastDue.length ? (
              <div className="space-y-2">
                {pastDue.map((subscription) => {
                  const plan = planById.get(subscription.planId)
                  return (
                    <div key={subscription.companyId} className="flex items-center justify-between gap-2 rounded-lg border border-amber-200/70 bg-amber-50/60 px-3 py-2 text-[11px] dark:border-amber-500/20 dark:bg-amber-500/10">
                      <span className="font-medium">{companyById.get(subscription.companyId)?.name}</span>
                      <span className="font-semibold">{formatEGP(plan?.price ?? 0, lang)}</span>
                    </div>
                  )
                })}
              </div>
            ) : <p className="text-[11px] text-muted-foreground">{t('No past-due subscriptions.')}</p>}
            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-3 shrink-0" /> {t('Subscription changes update workspace records. No invoices are issued.')}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function AdminSettingsPage() {
  const { t } = useI18n()
  const platform = useAppStore((s) => s.platform)
  const updatePlatform = useAppStore((s) => s.updatePlatform)
  const reload = useAppStore((s) => s.reload)
  const rolePermissions = useAppStore((s) => s.rolePermissions)
  const toast = useAppStore((s) => s.toast)
  const [draft, setDraft] = useState<PlatformSettings>(platform)
  const dirty = JSON.stringify(draft) !== JSON.stringify(platform)

  const reloadWorkspace = async () => {
    await reload()
    setDraft(useAppStore.getState().platform)
    toast('Workspace reloaded', 'The latest platform settings were fetched from Supabase.', 'info')
  }

  function update<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }))
  }

  const features = [
    { key: 'marketplaceEnabled' as const, label: 'Public marketplace', description: 'Buyer-facing property search, listings and inquiry capture.' },
    { key: 'exchangeEnabled' as const, label: 'Broker exchange', description: 'Cross-company cooperation requests and shared inventory.' },
    { key: 'aiAssistantEnabled' as const, label: 'AI sales assistant', description: 'Simulated assistant, recommendations and lead scoring views.' },
    { key: 'developerPortalEnabled' as const, label: 'Developer portal', description: 'Project inventory, broker activity and sales analytics for developers.' },
  ]

  return (
    <div>
      <PlatformHeading
        title={t('Platform Settings')}
        description={t('Control platform identity, feature visibility and moderation guardrails. Changes are stored in this browser only.')}
        actions={<>
          <Button variant="outline" disabled={!dirty} onClick={() => setDraft(platform)}><RefreshCw className="size-4" /> {t('Discard')}</Button>
          <Button
            disabled={!dirty}
            onClick={() => { updatePlatform(draft); toast('Platform settings saved', 'The demo configuration was updated in local storage.') }}
          >
            <Save className="size-4" /> {t('Save changes')}
          </Button>
        </>}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle title={t('General')} description={t('Platform name and regional defaults')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>{t('Platform name')}</Label>
                <Input value={draft.name} onChange={(e) => update('name', e.target.value)} />
              </div>
              <div>
                <Label>{t('Support email')}</Label>
                <Input type="email" value={draft.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} />
              </div>
              <div>
                <Label>{t('Currency')}</Label>
                <Select value={draft.defaultCurrency} onChange={(e) => update('defaultCurrency', e.target.value)}>
                  <option value="EGP">EGP — Egyptian pound</option>
                  <option value="USD">USD — US dollar</option>
                  <option value="AED">AED — UAE dirham</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>{t('Timezone')}</Label>
                <Select value={draft.timezone} onChange={(e) => update('timezone', e.target.value)}>
                  <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle title={t('Feature availability')} description={t('Toggle modules in the demo workspace navigation')} />
            <div className="divide-y divide-border">
              {features.map((feature) => (
                <div key={feature.key} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-[12px] font-medium">{t(feature.label)}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{t(feature.description)}</p>
                  </div>
                  <Switch checked={draft[feature.key]} onCheckedChange={(value) => update(feature.key, value)} />
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3 shrink-0" />
              {t('Feature flags are saved locally and only affect this demo interface. No external service is provisioned or disabled.')}
            </p>
          </Card>

          <Card className="p-5">
            <SectionTitle title={t('Moderation guardrails')} description={t('Thresholds applied by the demo review queue')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{t('Minimum listing price (EGP)')}</Label>
                <Input type="number" min={0} step={50000} value={draft.minListingPrice} onChange={(e) => update('minListingPrice', Math.max(0, Number(e.target.value) || 0))} />
              </div>
              <div>
                <Label>{t('Maximum listings per company')}</Label>
                <Input type="number" min={1} step={10} value={draft.maxListingsPerCompany} onChange={(e) => update('maxListingsPerCompany', Math.max(1, Number(e.target.value) || 1))} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 sm:col-span-2">
                <div>
                  <p className="text-[12px] font-medium">{t('Auto-moderation')}</p>
                  <p className="text-[10px] text-muted-foreground">{t('Route new submissions to review with automated checks.')}</p>
                </div>
                <Switch checked={draft.autoModeration} onCheckedChange={(value) => update('autoModeration', value)} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 sm:col-span-2">
                <div>
                  <p className="text-[12px] font-medium">{t('Maintenance mode preview')}</p>
                  <p className="text-[10px] text-muted-foreground">{t('Show a preview banner across internal layouts. Does not block access.')}</p>
                </div>
                <Switch checked={draft.maintenanceMode} onCheckedChange={(value) => update('maintenanceMode', value)} />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle title={t('Refresh workspace')} description={t('Pull the latest platform records from Supabase')} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-medium">{t('Reload workspace')}</p>
                <p className="mt-0.5 max-w-md text-[10px] leading-relaxed text-muted-foreground">{t('Fetches companies, subscriptions, moderation records and platform settings again. Unsaved edits in this form are replaced.')}</p>
              </div>
              <Button variant="outline" onClick={() => void reloadWorkspace()}><RefreshCw className="size-4" /> {t('Reload workspace')}</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle title={t('Workspace preview')} description={t('How the platform identity appears in the demo')} />
            <div className="rounded-xl border border-border bg-muted/25 p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary text-sm font-semibold text-white"><Landmark className="size-5" /></span>
                <div>
                  <p className="text-[13px] font-semibold">{draft.name}</p>
                  <p className="text-[10px] text-muted-foreground">{draft.supportEmail}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg border border-border bg-card px-3 py-2"><p className="text-muted-foreground">{t('Currency')}</p><p className="mt-0.5 text-[12px] font-medium">{draft.defaultCurrency}</p></div>
                <div className="rounded-lg border border-border bg-card px-3 py-2"><p className="text-muted-foreground">{t('Timezone')}</p><p className="mt-0.5 text-[12px] font-medium">{draft.timezone}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {features.map((feature) => (
                  <Badge key={feature.key} tone={draft[feature.key] ? 'green' : 'outline'}>{t(feature.label)}</Badge>
                ))}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-[14px] font-semibold">{t('Role permissions')}</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Default access groups shown for demo reference')}</p>
            </div>
            <div className="divide-y divide-border">
              {rolePermissions.map((role) => (
                <div key={role.role} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-medium">{t(role.role)}</p>
                    <Badge tone="outline">{role.members} {t('members')}</Badge>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{t(role.description)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {role.permissions.map((permission) => <span key={permission} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{t(permission)}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-2 text-[10px] leading-relaxed text-muted-foreground">
              <InfoIcon />
              {t('Settings are saved to your Supabase workspace. Billing, email delivery and payment processing remain simulated.')}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoIcon() {
  const { t } = useI18n()
  return (
    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-border text-[9px] font-semibold">i</span>
  )
}
