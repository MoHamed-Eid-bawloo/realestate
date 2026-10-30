import { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, BarChart3, Building2, CalendarCheck, CheckCircle2,
  ChevronRight, CircleDollarSign, Download, Eye, Handshake, Home, Info, Layers, Lightbulb,
  MapPin, Percent, PieChart, Sparkles, Star, Target, TrendingUp, Trophy, UserCheck, Users, Wallet,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { formatDate, formatEGP, formatNumber } from '@/lib/format'
import { cn, downloadCsv, humanize } from '@/lib/utils'
import { useTab } from '@/lib/useTab'
import { PageHeader, StatCard, SectionTitle } from '@/components/shared'
import { BarsChart, ChartCard, DonutChart, DonutLegend, FunnelChart, chartColors } from '@/components/charts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select } from '@/components/ui/input'
import { EmptyState, Progress } from '@/components/ui/misc'
import { sourceColors, sourceLabel } from '@/lib/labels'
import type { DealStage } from '@/types'

const tabs = [
  { id: 'overview', label: 'Performance', icon: BarChart3 },
  { id: 'sales', label: 'Sales', icon: TrendingUp },
  { id: 'marketing', label: 'Marketing', icon: Target },
  { id: 'inventory', label: 'Inventory', icon: Building2 },
  { id: 'customers', label: 'Customers', icon: Users },
] as const

type AnalyticsTab = (typeof tabs)[number]['id']

const rangeOptions = [
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last quarter', days: 90 },
  { id: '180', label: 'Last 6 months', days: 180 },
  { id: '365', label: 'Last 12 months', days: 365 },
]

const stageLabels: Record<DealStage, string> = {
  new: 'New', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', reservation: 'Reservation', won: 'Won', lost: 'Lost',
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export function AnalyticsPage() {
  const { t, lang } = useI18n()
  const { tab: rawTab, setTab } = useTab('overview')

  const role = useAppStore((s) => s.role)
  const activeCompanyId = useAppStore((s) => s.activeCompanyId)
  const activeDeveloperId = useAppStore((s) => s.activeDeveloperId)
  const activeBrokerId = useAppStore((s) => s.activeBrokerId)
  const company = useAppStore((s) => s.companies.find((c) => c.id === s.activeCompanyId))
  const developer = useAppStore((s) => s.developers.find((d) => d.id === s.activeDeveloperId))
  const broker = useAppStore((s) => s.brokers.find((b) => b.id === s.activeBrokerId))
  const leadsAll = useAppStore((s) => s.leads)
  const dealsAll = useAppStore((s) => s.deals)
  const propertiesAll = useAppStore((s) => s.properties)
  const projectsAll = useAppStore((s) => s.projects)
  const transactionsAll = useAppStore((s) => s.transactions)
  const customersAll = useAppStore((s) => s.customers)
  const employeesAll = useAppStore((s) => s.employees)
  const brokersAll = useAppStore((s) => s.brokers)
  const ticketsAll = useAppStore((s) => s.tickets)
  const viewingsAll = useAppStore((s) => s.viewings)
  const commissionsAll = useAppStore((s) => s.commissions)
  const toast = useAppStore((s) => s.toast)

  const leadsEnabled = ['super_admin', 'owner', 'manager', 'agent'].includes(role)
  const availableTabs = tabs.filter((item) => item.id !== 'marketing' || leadsEnabled)
  const tab = (availableTabs.some((item) => item.id === rawTab) ? rawTab : 'overview') as AnalyticsTab

  const [range, setRange] = useState('90')
  const rangeDays = rangeOptions.find((option) => option.id === range)?.days ?? 90
  const cutoff = Date.now() - rangeDays * 86_400_000
  const inRange = (iso: string) => new Date(iso).getTime() >= cutoff
  const rangeLabel = t(rangeOptions.find((option) => option.id === range)?.label ?? 'Last quarter')

  const scopedDeals = useMemo(() => {
    if (role === 'super_admin') return dealsAll
    if (role === 'developer') return dealsAll.filter((d) => d.developerId === activeDeveloperId)
    if (role === 'broker') return dealsAll.filter((d) => d.brokerId === activeBrokerId)
    return dealsAll.filter((d) => d.companyId === activeCompanyId)
  }, [role, dealsAll, activeDeveloperId, activeBrokerId, activeCompanyId])

  const scopedDealIds = useMemo(() => new Set(scopedDeals.map((d) => d.id)), [scopedDeals])

  const leads = useMemo(() => {
    if (!leadsEnabled) return []
    if (role === 'super_admin') return leadsAll
    return leadsAll.filter((l) => l.companyId === activeCompanyId)
  }, [leadsEnabled, role, leadsAll, activeCompanyId])

  const transactions = useMemo(() => {
    if (role === 'super_admin') return transactionsAll
    if (role === 'developer' || role === 'broker') return transactionsAll.filter((tx) => scopedDealIds.has(tx.dealId))
    return transactionsAll.filter((tx) => tx.companyId === activeCompanyId)
  }, [role, transactionsAll, scopedDealIds, activeCompanyId])

  const properties = useMemo(() => {
    if (role === 'super_admin') return propertiesAll
    if (role === 'developer') return propertiesAll.filter((p) => p.developerId === activeDeveloperId)
    if (role === 'broker') return propertiesAll.filter((p) => p.listingStatus === 'published')
    return propertiesAll.filter((p) => p.companyId === activeCompanyId)
  }, [role, propertiesAll, activeDeveloperId, activeCompanyId])

  const customers = useMemo(() => {
    if (role === 'super_admin') return customersAll
    if (role === 'developer' || role === 'broker') {
      const ids = new Set(scopedDeals.map((d) => d.customerId).filter(Boolean) as string[])
      return customersAll.filter((c) => ids.has(c.id))
    }
    return customersAll.filter((c) => c.companyId === activeCompanyId)
  }, [role, customersAll, scopedDeals, activeCompanyId])

  const employees = useMemo(() => {
    if (role === 'super_admin') return employeesAll
    if (role === 'developer' || role === 'broker') return []
    return employeesAll.filter((e) => e.companyId === activeCompanyId)
  }, [role, employeesAll, activeCompanyId])

  const tickets = useMemo(() => {
    if (role === 'super_admin') return ticketsAll
    if (role === 'developer' || role === 'broker') return []
    return ticketsAll.filter((item) => item.companyId === activeCompanyId)
  }, [role, ticketsAll, activeCompanyId])

  const viewings = useMemo(() => {
    if (role === 'super_admin') return viewingsAll
    if (role === 'developer' || role === 'broker') return []
    return viewingsAll.filter((v) => v.companyId === activeCompanyId)
  }, [role, viewingsAll, activeCompanyId])

  const commissions = useMemo(() => {
    if (role === 'super_admin') return commissionsAll
    if (role === 'developer') return commissionsAll.filter((c) => scopedDealIds.has(c.dealId))
    if (role === 'broker') return commissionsAll.filter((c) => c.beneficiaryId === activeBrokerId || scopedDealIds.has(c.dealId))
    return commissionsAll.filter((c) => c.companyId === activeCompanyId)
  }, [role, commissionsAll, scopedDealIds, activeBrokerId, activeCompanyId])

  const projects = useMemo(() => {
    if (role === 'super_admin' || role === 'broker') return projectsAll
    if (role === 'developer') return projectsAll.filter((p) => p.developerId === activeDeveloperId)
    const ids = new Set(properties.map((p) => p.projectId).filter(Boolean) as string[])
    return projectsAll.filter((p) => ids.has(p.id))
  }, [role, projectsAll, activeDeveloperId, properties])

  const scopeLabel = role === 'super_admin' ? t('All companies') : role === 'developer' ? (developer?.name ?? '') : role === 'broker' ? (broker?.name ?? '') : (company?.name ?? '')

  const activeDeals = scopedDeals.filter((d) => !['won', 'lost'].includes(d.stage))
  const wonDeals = scopedDeals.filter((d) => d.stage === 'won')
  const lostDeals = scopedDeals.filter((d) => d.stage === 'lost')
  const closedDeals = wonDeals.length + lostDeals.length
  const gmv = sum(wonDeals.map((d) => d.value))
  const pipelineValue = sum(activeDeals.map((d) => d.value))
  const weightedForecast = sum(activeDeals.map((d) => (d.value * d.probability) / 100))
  const winRate = closedDeals ? Math.round((wonDeals.length / closedDeals) * 100) : 0
  const avgDeal = scopedDeals.length ? Math.round(sum(scopedDeals.map((d) => d.value)) / scopedDeals.length) : 0
  const periodLeads = leads.filter((l) => inRange(l.createdAt))
  const periodDeals = scopedDeals.filter((d) => inRange(d.createdAt))
  const periodTransactions = transactions.filter((tx) => inRange(tx.date))
  const collectedRevenue = sum(periodTransactions.filter((tx) => tx.status === 'completed').map((tx) => tx.amount))
  const periodViewings = viewings.filter((v) => inRange(v.date))
  const leadConversion = leads.length ? Math.round((leads.filter((l) => l.status === 'won').length / leads.length) * 100) : 0
  const qualifiedLeads = leads.filter((l) => ['qualified', 'interested', 'viewing', 'negotiation', 'won'].includes(l.status))
  const staleLeads = leads.filter((l) => !['won', 'lost'].includes(l.status) && Date.now() - new Date(l.lastContact).getTime() > 7 * 86_400_000)
  const averageCycle = wonDeals.length
    ? Math.round(sum(wonDeals.map((d) => Math.max(1, (new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime()) / 86_400_000))) / wonDeals.length)
    : 0

  const sourceRows = useMemo(() => {
    const valueByCustomer = new Map<string, number>()
    transactions.forEach((tx) => valueByCustomer.set(tx.customerName, (valueByCustomer.get(tx.customerName) ?? 0) + tx.amount))
    const map = new Map<string, { source: string; leads: number; qualified: number; won: number; value: number }>()
    leads.forEach((lead) => {
      const existing = map.get(lead.source) ?? { source: lead.source, leads: 0, qualified: 0, won: 0, value: 0 }
      existing.leads += 1
      if (['qualified', 'interested', 'viewing', 'negotiation', 'won'].includes(lead.status)) existing.qualified += 1
      if (lead.status === 'won') { existing.won += 1; existing.value += valueByCustomer.get(lead.name) ?? 0 }
      map.set(lead.source, existing)
    })
    return [...map.values()].sort((a, b) => b.leads - a.leads)
  }, [leads, transactions])

  const campaignRows = useMemo(() => {
    const map = new Map<string, { name: string; leads: number; won: number; value: number }>()
    leads.filter((lead) => lead.campaign).forEach((lead) => {
      const name = lead.campaign as string
      const existing = map.get(name) ?? { name, leads: 0, won: 0, value: 0 }
      existing.leads += 1
      if (lead.status === 'won') existing.won += 1
      map.set(name, existing)
    })
    return [...map.values()].sort((a, b) => b.leads - a.leads)
  }, [leads])

  const sourceData = sourceRows.map((row) => ({ name: t(sourceLabel[row.source] ?? row.source), value: row.leads }))

  const stageData = (['new', 'qualified', 'proposal', 'negotiation', 'reservation', 'won', 'lost'] as DealStage[])
    .map((stage) => ({
      stage,
      name: t(stageLabels[stage]),
      value: scopedDeals.filter((d) => d.stage === stage).length,
      amount: sum(scopedDeals.filter((d) => d.stage === stage).map((d) => d.value)),
    }))

  const leadFunnel = [
    { label: t('New'), value: leads.filter((l) => l.status !== 'lost').length, color: chartColors.navy },
    { label: t('Contacted'), value: leads.filter((l) => !['new', 'lost'].includes(l.status)).length, color: chartColors.slate },
    { label: t('Qualified'), value: leads.filter((l) => ['qualified', 'interested', 'viewing', 'negotiation', 'won'].includes(l.status)).length, color: chartColors.sky },
    { label: t('Viewing'), value: leads.filter((l) => ['viewing', 'negotiation', 'won'].includes(l.status)).length, color: chartColors.violet },
    { label: t('Negotiation'), value: leads.filter((l) => ['negotiation', 'won'].includes(l.status)).length, color: chartColors.amber },
    { label: t('Won'), value: leads.filter((l) => l.status === 'won').length, color: chartColors.emerald },
  ]

  const dealOrder: DealStage[] = ['new', 'qualified', 'proposal', 'negotiation', 'reservation', 'won']
  const dealFunnel = dealOrder.map((stage, index) => ({
    label: t(stageLabels[stage]),
    value: scopedDeals.filter((d) => d.stage !== 'lost' && dealOrder.indexOf(d.stage) >= index).length,
    color: [chartColors.navy, chartColors.slate, chartColors.sky, chartColors.violet, chartColors.amber, chartColors.emerald][index],
  }))

  const weeklySeries = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - (7 - i) * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      return { start, end, name: formatDate(start, lang, 'dd MMM'), revenue: 0, newDeals: 0 }
    })
    periodTransactions.filter((tx) => tx.status === 'completed').forEach((tx) => {
      const time = new Date(tx.date).getTime()
      const bucket = weeks.find((w) => time >= w.start.getTime() && time < w.end.getTime())
      if (bucket) bucket.revenue += tx.amount / 1_000_000
    })
    periodDeals.forEach((deal) => {
      const time = new Date(deal.createdAt).getTime()
      const bucket = weeks.find((w) => time >= w.start.getTime() && time < w.end.getTime())
      if (bucket) bucket.newDeals += deal.value / 1_000_000
    })
    return weeks.map((w) => ({
      name: w.name,
      revenue: Math.round(w.revenue * 10) / 10,
      newDeals: Math.round(w.newDeals * 10) / 10,
    }))
  }, [periodTransactions, periodDeals, lang])

  const locationRows = useMemo(() => {
    const map = new Map<string, { location: string; listings: number; value: number; views: number; sold: number }>()
    properties.forEach((property) => {
      const existing = map.get(property.location) ?? { location: property.location, listings: 0, value: 0, views: 0, sold: 0 }
      existing.listings += 1
      existing.value += property.price
      existing.views += property.views
      if (property.status === 'sold' || property.status === 'rented') existing.sold += 1
      map.set(property.location, existing)
    })
    return [...map.values()].sort((a, b) => b.listings - a.listings)
  }, [properties])

  const propertyStatusData = (['available', 'reserved', 'sold', 'rented', 'pending_review'] as const)
    .map((status) => ({ name: t(humanize(status)), value: properties.filter((p) => p.status === status).length }))
    .filter((item) => item.value > 0)

  const typeData = useMemo(() => {
    const map = new Map<string, number>()
    properties.forEach((property) => map.set(property.type, (map.get(property.type) ?? 0) + 1))
    return [...map.entries()].map(([name, value]) => ({ name: t(humanize(name)), value })).sort((a, b) => b.value - a.value)
  }, [properties, t])

  const priceBands = useMemo(() => {
    const bands = [
      { name: t('Under 5M'), min: 0, max: 5_000_000 },
      { name: t('5M – 10M'), min: 5_000_000, max: 10_000_000 },
      { name: t('10M – 20M'), min: 10_000_000, max: 20_000_000 },
      { name: t('20M+'), min: 20_000_000, max: Number.POSITIVE_INFINITY },
    ]
    return bands.map((band) => ({
      name: band.name,
      listings: properties.filter((p) => p.price >= band.min && p.price < band.max).length,
    }))
  }, [properties, t])

  const portfolioValue = sum(properties.map((p) => p.price))
  const availableProperties = properties.filter((p) => p.status === 'available').length
  const publishedProperties = properties.filter((p) => p.listingStatus === 'published').length
  const avgPrice = properties.length ? Math.round(portfolioValue / properties.length) : 0

  const topListings = useMemo(() => [...properties].sort((a, b) => b.views - a.views).slice(0, 8), [properties])

  const projectRows = useMemo(() => {
    const propertyById = new Map(propertiesAll.map((p) => [p.id, p]))
    const map = new Map<string, { id: string; name: string; location: string; deals: number; value: number; available: number }>()
    scopedDeals.forEach((deal) => {
      const property = propertyById.get(deal.propertyId)
      if (!property?.projectId) return
      const project = projectsAll.find((p) => p.id === property.projectId)
      if (!project) return
      const existing = map.get(project.id) ?? {
        id: project.id, name: project.name, location: project.location, deals: 0, value: 0, available: project.availableUnits,
      }
      existing.deals += 1
      existing.value += deal.value
      map.set(project.id, existing)
    })
    projects.forEach((project) => {
      if (!map.has(project.id) && project.availableUnits > 0) {
        map.set(project.id, { id: project.id, name: project.name, location: project.location, deals: 0, value: 0, available: project.availableUnits })
      }
    })
    return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 8)
  }, [scopedDeals, projects, projectsAll, propertiesAll])

  const performerRows = useMemo(() => {
    if (employees.length) {
      return employees
        .filter((employee) => employee.role === 'agent')
        .map((employee) => {
          const agentDeals = scopedDeals.filter((d) => d.agentId === employee.id)
          return {
            id: employee.id, name: employee.name, color: employee.avatarColor,
            deals: agentDeals.length,
            value: sum(agentDeals.filter((d) => d.stage === 'won').map((d) => d.value)) || employee.achieved,
            target: employee.target,
            pct: employee.target ? Math.min(100, Math.round((employee.achieved / employee.target) * 100)) : 0,
          }
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    }
    const rows = new Map<string, { id: string; name: string; color: string; deals: number; value: number; target: number; pct: number }>()
    scopedDeals.forEach((deal) => {
      if (!deal.brokerId) return
      const brokerInfo = brokersAll.find((b) => b.id === deal.brokerId)
      if (!brokerInfo) return
      const existing = rows.get(deal.brokerId) ?? { id: brokerInfo.id, name: brokerInfo.name, color: brokerInfo.avatarColor, deals: 0, value: 0, target: 0, pct: 0 }
      existing.deals += 1
      if (deal.stage === 'won') existing.value += deal.value
      rows.set(deal.brokerId, existing)
    })
    return [...rows.values()].sort((a, b) => b.value - a.value)
  }, [employees, scopedDeals, brokersAll])

  const topCustomers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; deals: number; value: number; type: string }>()
    scopedDeals.forEach((deal) => {
      const customer = customersAll.find((c) => c.id === deal.customerId)
      const existing = map.get(deal.customerName) ?? { id: customer?.id ?? deal.customerName, name: deal.customerName, deals: 0, value: 0, type: customer?.type ?? 'buyer' }
      existing.deals += 1
      if (deal.stage === 'won') existing.value += deal.value
      map.set(deal.customerName, existing)
    })
    return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 8)
  }, [scopedDeals, customersAll])

  const customerTypeData = ['buyer', 'seller', 'tenant', 'investor'].map((type) => ({
    name: t(humanize(type)),
    value: customers.filter((c) => c.type === type).length,
  })).filter((item) => item.value > 0)

  const preferredLocations = useMemo(() => {
    const map = new Map<string, number>()
    customers.forEach((customer) => customer.preferredLocations.forEach((place) => map.set(place, (map.get(place) ?? 0) + 1)))
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7)
  }, [customers])

  const customerBudgetBands = useMemo(() => {
    const bands = [
      { name: t('Under 5M'), min: 0, max: 5_000_000 },
      { name: t('5M – 10M'), min: 5_000_000, max: 10_000_000 },
      { name: t('10M – 20M'), min: 10_000_000, max: 20_000_000 },
      { name: t('20M+'), min: 20_000_000, max: Number.POSITIVE_INFINITY },
    ]
    return bands.map((band) => ({
      name: band.name,
      customers: customers.filter((customer) => customer.budgetMax >= band.min && customer.budgetMax < band.max).length,
    }))
  }, [customers, t])

  const avgBudget = customers.length ? Math.round(sum(customers.map((c) => c.budgetMax)) / customers.length) : 0
  const satisfactionScores = tickets.filter((ticket) => typeof ticket.satisfaction === 'number').map((ticket) => ticket.satisfaction as number)
  const satisfaction = satisfactionScores.length ? Math.round((sum(satisfactionScores) / satisfactionScores.length) * 10) / 10 : 0
  const openTickets = tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_progress').length
  const inventoryViews = sum(properties.map((p) => p.views))
  const reservedProperties = properties.filter((p) => p.status === 'reserved').length
  const commissionsOpen = sum(commissions.filter((c) => c.status !== 'paid').map((c) => c.amount))

  const insights = useMemo(() => {
    const cards: { title: string; detail: string; tone: 'green' | 'amber' | 'blue' | 'purple' }[] = []
    if (sourceRows.length) {
      const best = [...sourceRows].sort((a, b) => (b.won / Math.max(1, b.leads)) - (a.won / Math.max(1, a.leads)))[0]
      if (best.won > 0) cards.push({
        title: `${t(sourceLabel[best.source] ?? best.source)} ${t('converts best')}`,
        detail: `${best.won} ${t('won from')} ${best.leads} ${t('leads')}. ${t('Consider shifting more budget to this channel.')}`,
        tone: 'green',
      })
    }
    if (performerRows.length) {
      const top = performerRows[0]
      cards.push({
        title: `${top.name} ${t('leads the board')}`,
        detail: `${formatEGP(top.value, lang, true)} ${t('closed value across')} ${top.deals} ${t('deals')}.`,
        tone: 'blue',
      })
    }
    if (locationRows.length) {
      const topLocation = [...locationRows].sort((a, b) => b.views - a.views)[0]
      cards.push({
        title: `${topLocation.location} ${t('drives demand')}`,
        detail: `${formatNumber(topLocation.views, lang)} ${t('listing views across')} ${topLocation.listings} ${t('listings')}.`,
        tone: 'purple',
      })
    }
    if (staleLeads.length) {
      cards.push({
        title: `${staleLeads.length} ${t('leads need a follow-up')}`,
        detail: t('No contact has been logged for more than seven days. Assign or recycle them to protect conversion.'),
        tone: 'amber',
      })
    }
    if (reservedProperties > 0) {
      cards.push({
        title: `${reservedProperties} ${t('listings are reserved')}`,
        detail: t('Confirm reservation deposits or release stale holds to keep availability accurate.'),
        tone: 'amber',
      })
    }
    if (!cards.length) cards.push({
      title: t('Not enough activity yet'),
      detail: t('Insights appear once leads, deals or inventory activity is recorded in this scope.'),
      tone: 'blue',
    })
    return cards.slice(0, 4)
  }, [sourceRows, performerRows, locationRows, staleLeads.length, reservedProperties, lang, t])

  const exportReport = () => {
    if (tab === 'sales') {
      downloadCsv('nawyati-sales-analytics.csv', [
        ['Deal', 'Customer', 'Property', 'Value (EGP)', 'Stage', 'Probability', 'Expected close'],
        ...scopedDeals.map((d) => [d.code, d.customerName, d.propertyTitle, d.value, d.stage, d.probability, d.expectedClose]),
      ])
    } else if (tab === 'marketing') {
      downloadCsv('nawyati-marketing-analytics.csv', [
        ['Source', 'Leads', 'Qualified', 'Won', 'Conversion %'],
        ...sourceRows.map((row) => [sourceLabel[row.source] ?? row.source, row.leads, row.qualified, row.won, row.leads ? Math.round((row.won / row.leads) * 100) : 0]),
      ])
    } else if (tab === 'inventory') {
      downloadCsv('nawyati-inventory-analytics.csv', [
        ['Property', 'Location', 'Type', 'Price (EGP)', 'Status', 'Views', 'Listing status'],
        ...properties.map((p) => [p.title, p.location, p.type, p.price, p.status, p.views, p.listingStatus]),
      ])
    } else if (tab === 'customers') {
      downloadCsv('nawyati-customer-analytics.csv', [
        ['Customer', 'Type', 'Budget max (EGP)', 'Preferred locations'],
        ...customers.map((c) => [c.name, c.type, c.budgetMax, c.preferredLocations.join(' / ')]),
      ])
    } else {
      downloadCsv('nawyati-performance-report.csv', [
        ['Metric', 'Value'],
        ['Scope', scopeLabel],
        ['Period', rangeLabel],
        ['Closed revenue (EGP)', collectedRevenue],
        ['Won GMV (EGP)', gmv],
        ['Active pipeline (EGP)', pipelineValue],
        ['Weighted forecast (EGP)', Math.round(weightedForecast)],
        ['Win rate', `${winRate}%`],
        ['Average deal (EGP)', avgDeal],
        ['New leads in period', periodLeads.length],
        ['Lead conversion', `${leadConversion}%`],
        ['Open commissions (EGP)', commissionsOpen],
      ])
    }
    toast('Report exported', 'The current analytics view was downloaded as a CSV file.')
  }

  return (
    <div>
      <PageHeader
        eyebrow={<><BarChart3 className="size-3.5" /> {t('Analytics')} <ChevronRight className="size-3 text-muted-foreground/60 rtl:rotate-180" /> {scopeLabel}</>}
        title={t('Business Intelligence')}
        description={`${t('Cross-module performance for')} ${scopeLabel} · ${rangeLabel}`}
        actions={<>
          <Select value={range} onChange={(e) => setRange(e.target.value)} className="h-9 w-[160px]">
            {rangeOptions.map((option) => <option key={option.id} value={option.id}>{t(option.label)}</option>)}
          </Select>
          <Button variant="outline" onClick={exportReport}><Download className="size-4" /> {t('Export report')}</Button>
        </>}
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value)}>
        <div className="overflow-x-auto pb-1">
          <TabsList>
            {availableTabs.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                <item.icon className="size-3.5" />
                {t(item.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('Closed revenue')} value={formatEGP(collectedRevenue, lang, true)} icon={CircleDollarSign} tone="green" hint={rangeLabel} />
            <StatCard label={t('Active pipeline')} value={formatEGP(pipelineValue, lang, true)} icon={Layers} hint={`${activeDeals.length} ${t('open deals')}`} />
            <StatCard
              label={leadsEnabled ? t('New leads') : t('New deals')}
              value={leadsEnabled ? periodLeads.length : periodDeals.length}
              icon={leadsEnabled ? Users : Handshake}
              tone="blue"
              hint={rangeLabel}
            />
            <StatCard label={t('Win rate')} value={`${winRate}%`} icon={Trophy} tone="amber" hint={`${wonDeals.length} ${t('deals won')}`} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <ChartCard title={t('Revenue and new business')} description={`${t('Weekly value, EGP millions')} · ${rangeLabel}`}>
              <BarsChart
                data={weeklySeries}
                series={[
                  { key: 'revenue', label: t('Collected revenue'), color: chartColors.emerald },
                  { key: 'newDeals', label: t('New deal value'), color: chartColors.navy },
                ]}
                height={280}
              />
            </ChartCard>
            <ChartCard title={leadsEnabled ? t('Lead source mix') : t('Pipeline mix')} description={leadsEnabled ? t('Where demand comes from') : t('Deal value by stage')}>
              {leadsEnabled ? (
                <>
                  <DonutChart data={sourceData} height={190} centerValue={String(leads.length)} centerLabel={t('leads')} colors={sourceColors} />
                  <div className="px-3 pb-2"><DonutLegend data={sourceData} colors={sourceColors} /></div>
                </>
              ) : (
                <>
                  <DonutChart
                    data={stageData.filter((item) => item.amount > 0).map((item) => ({ name: item.name, value: item.amount }))}
                    height={190}
                    centerValue={formatEGP(pipelineValue, lang, true)}
                    centerLabel={t('pipeline')}
                  />
                  <div className="px-3 pb-2">
                    <DonutLegend data={stageData.filter((item) => item.amount > 0).map((item) => ({ name: item.name, value: item.amount }))} />
                  </div>
                </>
              )}
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.1fr]">
            <ChartCard title={t('Conversion funnel')} description={leadsEnabled ? t('Lead progression through sales') : t('Deal progression by stage')}>
              <div className="py-2">
                <FunnelChart stages={leadsEnabled ? leadFunnel : dealFunnel} />
              </div>
            </ChartCard>
            <ChartCard title={t('Deal size mix')} description={t('Open and closed deal value by band')}>
              <BarsChart
                data={[
                  { name: t('Under 5M'), deals: scopedDeals.filter((d) => d.value < 5_000_000).length },
                  { name: t('5M – 10M'), deals: scopedDeals.filter((d) => d.value >= 5_000_000 && d.value < 10_000_000).length },
                  { name: t('10M – 20M'), deals: scopedDeals.filter((d) => d.value >= 10_000_000 && d.value < 20_000_000).length },
                  { name: t('20M+'), deals: scopedDeals.filter((d) => d.value >= 20_000_000).length },
                ]}
                series={[{ key: 'deals', label: t('Deals'), color: chartColors.sky }]}
                height={240}
              />
            </ChartCard>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"><Sparkles className="size-4" /></span>
                <div>
                  <h3 className="text-[14px] font-semibold">{t('Operational insights')}</h3>
                  <p className="text-[10px] text-muted-foreground">{t('Rules calculated locally, not a live AI model')}</p>
                </div>
              </div>
              <div className="mt-3 space-y-2.5">
                {insights.map((insight, index) => (
                  <div key={index} className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="flex items-center gap-1.5">
                      <Lightbulb className={cn('size-3.5', insight.tone === 'green' ? 'text-emerald-500' : insight.tone === 'amber' ? 'text-amber-500' : insight.tone === 'purple' ? 'text-violet-500' : 'text-sky-500')} />
                      <p className="text-[11px] font-semibold">{insight.title}</p>
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{insight.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h3 className="text-[14px] font-semibold">{t('Top projects')}</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Deal value and remaining availability')}</p>
                </div>
                <Badge tone="outline">{rangeLabel}</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Project')}</TableHead>
                    <TableHead>{t('Location')}</TableHead>
                    <TableHead>{t('Deals')}</TableHead>
                    <TableHead>{t('Deal value')}</TableHead>
                    <TableHead className="text-end">{t('Available units')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectRows.slice(0, 6).map((project) => (
                    <TableRow key={project.id}>
                      <TableCell><p className="text-[12px] font-medium">{project.name}</p><p className="text-[10px] text-muted-foreground">{project.id.toUpperCase()}</p></TableCell>
                      <TableCell className="text-[12px]">{project.location}</TableCell>
                      <TableCell className="text-[12px]">{project.deals}</TableCell>
                      <TableCell className="font-medium">{formatEGP(project.value, lang, true)}</TableCell>
                      <TableCell className="text-end text-[12px]">{project.available}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!projectRows.length && <EmptyState icon={Building2} title={t('No project activity')} description={t('Projects linked to deals in this scope will appear here.')} />}
            </Card>
            <Card className="p-4">
              <SectionTitle title={t('Location demand')} description={t('Views and listings by area')} />
              <div className="space-y-3">
                {locationRows.slice(0, 5).map((row) => {
                  const maxViews = Math.max(...locationRows.map((x) => x.views), 1)
                  return (
                    <div key={row.location}>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{row.location}</span>
                        <span className="font-medium">{formatNumber(row.views, lang)} {t('views')}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(3, (row.views / maxViews) * 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
                {!locationRows.length && <p className="py-6 text-center text-xs text-muted-foreground">{t('No inventory in this scope.')}</p>}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('Active pipeline')} value={formatEGP(pipelineValue, lang, true)} icon={Layers} hint={`${activeDeals.length} ${t('open deals')}`} />
            <StatCard label={t('Weighted forecast')} value={formatEGP(weightedForecast, lang, true)} icon={Target} tone="green" hint={t('probability adjusted')} />
            <StatCard label={t('Average deal')} value={formatEGP(avgDeal, lang, true)} icon={Handshake} tone="blue" hint={`${scopedDeals.length} ${t('deals')}`} />
            <StatCard label={t('Average sales cycle')} value={`${averageCycle} ${t('days')}`} icon={CalendarCheck} tone="amber" hint={`${wonDeals.length} ${t('won deals')}`} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <ChartCard title={t('Pipeline value by stage')} description={t('Open and closed value, EGP millions')}>
              <BarsChart
                data={stageData.map((item) => ({ name: item.name, amount: Math.round((item.amount / 1_000_000) * 10) / 10 }))}
                series={[{ key: 'amount', label: t('Value'), color: chartColors.navy }]}
                height={280}
                vertical
              />
            </ChartCard>
            <ChartCard title={t('Win / loss split')} description={t('Closed deals in this scope')}>
              <DonutChart
                data={[
                  { name: t('Won'), value: wonDeals.length },
                  { name: t('Lost'), value: lostDeals.length },
                ]}
                height={185}
                centerValue={`${winRate}%`}
                centerLabel={t('win rate')}
                colors={[chartColors.emerald, chartColors.rose]}
              />
              <div className="px-3 pb-2">
                <DonutLegend data={[{ name: t('Won'), value: wonDeals.length }, { name: t('Lost'), value: lostDeals.length }]} colors={[chartColors.emerald, chartColors.rose]} />
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
            <Card className="overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-[14px] font-semibold">{t('Deal stage breakdown')}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Count and EGP value per stage')}</p>
              </div>
              <div className="divide-y divide-border">
                {stageData.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={stage.stage} />
                      <span className="text-[10px] text-muted-foreground">{stage.value} {t('deals')}</span>
                    </div>
                    <span className="text-[12px] font-medium">{formatEGP(stage.amount, lang, true)}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h3 className="text-[14px] font-semibold">{t('Top performers')}</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{employees.length ? t('Agent target attainment') : t('Broker contribution to scoped deals')}</p>
                </div>
                <Trophy className="size-4 text-amber-500" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Name')}</TableHead>
                    <TableHead>{t('Deals')}</TableHead>
                    <TableHead>{t('Closed value')}</TableHead>
                    <TableHead>{t('Target')}</TableHead>
                    <TableHead className="text-end">{t('Attainment')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performerRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full text-[9px] font-semibold text-white" style={{ background: row.color }}>{row.name.split(' ').slice(0, 2).map((part) => part[0]).join('')}</span>
                          <span className="text-[12px] font-medium">{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px]">{row.deals}</TableCell>
                      <TableCell className="font-medium">{formatEGP(row.value, lang, true)}</TableCell>
                      <TableCell className="text-[12px]">{row.target ? formatEGP(row.target, lang, true) : '—'}</TableCell>
                      <TableCell className="text-end">
                        {row.target ? (
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={row.pct} className="w-16" />
                            <span className="w-8 text-end text-[11px] font-medium">{row.pct}%</span>
                          </div>
                        ) : <span className="text-[11px] text-muted-foreground">{row.deals} {t('deals')}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!performerRows.length && <EmptyState icon={Users} title={t('No performers yet')} description={t('Deal ownership will populate this leaderboard.')} />}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('Total leads')} value={leads.length} icon={Users} hint={`${periodLeads.length} ${t('new in period')}`} />
            <StatCard label={t('Qualified leads')} value={qualifiedLeads.length} icon={UserCheck} tone="blue" hint={`${leads.length ? Math.round((qualifiedLeads.length / leads.length) * 100) : 0}% ${t('of total')}`} />
            <StatCard label={t('Lead conversion')} value={`${leadConversion}%`} icon={TrendingUp} tone="green" hint={`${leads.filter((l) => l.status === 'won').length} ${t('won leads')}`} />
            <StatCard label={t('Stale follow-ups')} value={staleLeads.length} icon={AlertTriangle} tone="amber" hint={t('no contact in 7+ days')} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <ChartCard title={t('Leads by source')} description={t('Volume and quality by acquisition channel')}>
              <BarsChart
                data={sourceRows.map((row) => ({ name: t(sourceLabel[row.source] ?? row.source), leads: row.leads, won: row.won }))}
                series={[
                  { key: 'leads', label: t('Leads'), color: chartColors.sky },
                  { key: 'won', label: t('Won'), color: chartColors.emerald },
                ]}
                height={280}
              />
            </ChartCard>
            <ChartCard title={t('Lead status mix')} description={t('Current state of all leads')}>
              <DonutChart
                data={(['new', 'contacted', 'qualified', 'interested', 'viewing', 'negotiation', 'won', 'lost'] as const)
                  .map((status) => ({ name: t(humanize(status)), value: leads.filter((l) => l.status === status).length }))
                  .filter((item) => item.value > 0)}
                height={190}
                centerValue={String(leads.length)}
                centerLabel={t('leads')}
              />
              <div className="px-3 pb-2">
                <DonutLegend
                  data={(['new', 'contacted', 'qualified', 'won', 'lost'] as const)
                    .map((status) => ({ name: t(humanize(status)), value: leads.filter((l) => l.status === status).length }))
                    .filter((item) => item.value > 0)}
                />
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <Card className="overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-[14px] font-semibold">{t('Source performance')}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Leads, qualification and closed value by channel')}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Source')}</TableHead>
                    <TableHead>{t('Leads')}</TableHead>
                    <TableHead>{t('Qualified')}</TableHead>
                    <TableHead>{t('Won')}</TableHead>
                    <TableHead>{t('Conversion')}</TableHead>
                    <TableHead className="text-end">{t('Closed value')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourceRows.map((row) => (
                    <TableRow key={row.source}>
                      <TableCell className="text-[12px] font-medium">{t(sourceLabel[row.source] ?? row.source)}</TableCell>
                      <TableCell className="text-[12px]">{row.leads}</TableCell>
                      <TableCell className="text-[12px]">{row.qualified}</TableCell>
                      <TableCell className="text-[12px]">{row.won}</TableCell>
                      <TableCell>
                        <Badge tone={row.leads && row.won / row.leads >= 0.2 ? 'green' : row.won ? 'amber' : 'default'}>
                          {row.leads ? Math.round((row.won / row.leads) * 100) : 0}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end font-medium">{formatEGP(row.value, lang, true)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!sourceRows.length && <EmptyState icon={Target} title={t('No lead sources yet')} description={t('Captured leads will populate channel performance.')} />}
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-[14px] font-semibold">{t('Campaigns')}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Leads attributed to tracked campaigns')}</p>
              </div>
              <div className="divide-y divide-border">
                {campaignRows.map((campaign) => (
                  <div key={campaign.name} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-medium">{campaign.name}</p>
                      <Badge tone="blue">{campaign.leads} {t('leads')}</Badge>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{campaign.won} {t('won')} · {campaign.leads ? Math.round((campaign.won / campaign.leads) * 100) : 0}% {t('conversion')}</p>
                  </div>
                ))}
                {!campaignRows.length && <EmptyState icon={Target} title={t('No tracked campaigns')} description={t('Leads with a campaign attribution will appear here.')} />}
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-[14px] font-semibold">{t('Demand signals')}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Most viewed listings in this scope')}</p>
              </div>
              <Badge tone="outline">{formatNumber(inventoryViews, lang)} {t('total views')}</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Listing')}</TableHead>
                  <TableHead>{t('Location')}</TableHead>
                  <TableHead>{t('Price')}</TableHead>
                  <TableHead>{t('Views')}</TableHead>
                  <TableHead className="text-end">{t('Status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topListings.slice(0, 5).map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell><p className="max-w-[240px] truncate text-[12px] font-medium">{listing.title}</p><p className="text-[10px] text-muted-foreground">{listing.code}</p></TableCell>
                    <TableCell className="text-[12px]">{listing.location}</TableCell>
                    <TableCell className="font-medium">{formatEGP(listing.price, lang, true)}</TableCell>
                    <TableCell className="text-[12px]">{formatNumber(listing.views, lang)}</TableCell>
                    <TableCell className="text-end"><StatusBadge status={listing.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('Listings')} value={properties.length} icon={Building2} hint={`${publishedProperties} ${t('published')}`} />
            <StatCard label={t('Available')} value={availableProperties} icon={CheckCircle2} tone="green" hint={`${reservedProperties} ${t('reserved')}`} />
            <StatCard label={t('Portfolio value')} value={formatEGP(portfolioValue, lang, true)} icon={Wallet} tone="blue" hint={t('all scoped listings')} />
            <StatCard label={t('Average price')} value={formatEGP(avgPrice, lang, true)} icon={CircleDollarSign} tone="purple" hint={`${formatNumber(inventoryViews, lang)} ${t('listing views')}`} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <ChartCard title={t('Status mix')} description={t('Listing availability')}>
              <DonutChart data={propertyStatusData} height={185} centerValue={String(properties.length)} centerLabel={t('listings')} />
              <div className="px-3 pb-2"><DonutLegend data={propertyStatusData} /></div>
            </ChartCard>
            <ChartCard title={t('Property types')} description={t('Inventory composition')}>
              <BarsChart data={typeData} series={[{ key: 'value', label: t('Listings'), color: chartColors.violet }]} height={245} vertical />
            </ChartCard>
            <ChartCard title={t('Price bands')} description={t('Listings by asking price')}>
              <BarsChart data={priceBands} series={[{ key: 'listings', label: t('Listings'), color: chartColors.sky }]} height={245} />
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <Card className="overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-[14px] font-semibold">{t('Location performance')}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Supply, average price and demand by area')}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Location')}</TableHead>
                    <TableHead>{t('Listings')}</TableHead>
                    <TableHead>{t('Avg. price')}</TableHead>
                    <TableHead>{t('Views')}</TableHead>
                    <TableHead className="text-end">{t('Sold / rented')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationRows.map((row) => (
                    <TableRow key={row.location}>
                      <TableCell className="text-[12px] font-medium">{row.location}</TableCell>
                      <TableCell className="text-[12px]">{row.listings}</TableCell>
                      <TableCell className="text-[12px]">{formatEGP(Math.round(row.value / row.listings), lang, true)}</TableCell>
                      <TableCell className="text-[12px]">{formatNumber(row.views, lang)}</TableCell>
                      <TableCell className="text-end text-[12px]">{row.sold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!locationRows.length && <EmptyState icon={MapPin} title={t('No inventory found')} description={t('Listings in this scope will appear here.')} />}
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-[14px] font-semibold">{t('Top viewed listings')}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Demand leaders by marketplace views')}</p>
              </div>
              <div className="divide-y divide-border">
                {topListings.slice(0, 6).map((listing, index) => (
                  <div key={listing.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-[10px] font-semibold">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium">{listing.title}</p>
                      <p className="text-[10px] text-muted-foreground">{listing.location} · {formatEGP(listing.price, lang, true)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Eye className="size-3" /> {formatNumber(listing.views, lang)}</span>
                  </div>
                ))}
                {!topListings.length && <EmptyState icon={Home} title={t('No listings yet')} description={t('Published inventory will appear here.')} />}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('Customers')} value={customers.length} icon={Users} hint={`${customers.filter((c) => c.type === 'buyer').length} ${t('buyers')}`} />
            <StatCard label={t('Average budget')} value={formatEGP(avgBudget, lang, true)} icon={Wallet} tone="green" hint={t('maximum budget')} />
            <StatCard label={t('Satisfaction')} value={satisfaction ? `${satisfaction} / 5` : '—'} icon={Star} tone="amber" hint={`${satisfactionScores.length} ${t('responses')}`} />
            <StatCard label={t('Open tickets')} value={openTickets} icon={Activity} tone="blue" hint={t('support workload')} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
            <ChartCard title={t('Customer types')} description={t('Mix of buyers, sellers, tenants and investors')}>
              <DonutChart data={customerTypeData} height={190} centerValue={String(customers.length)} centerLabel={t('customers')} />
              <div className="px-3 pb-2"><DonutLegend data={customerTypeData} /></div>
            </ChartCard>
            <ChartCard title={t('Preferred locations')} description={t('Where customers want to buy or rent')}>
              <BarsChart data={preferredLocations} series={[{ key: 'value', label: t('Customers'), color: chartColors.teal }]} height={245} vertical />
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
            <ChartCard title={t('Budget distribution')} description={t('Customers grouped by maximum budget')}>
              <BarsChart data={customerBudgetBands} series={[{ key: 'customers', label: t('Customers'), color: chartColors.amber }]} height={250} />
            </ChartCard>
            <Card className="overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-[14px] font-semibold">{t('Top customers by value')}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Highest won deal value in this scope')}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Customer')}</TableHead>
                    <TableHead>{t('Type')}</TableHead>
                    <TableHead>{t('Deals')}</TableHead>
                    <TableHead className="text-end">{t('Won value')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="text-[12px] font-medium">{customer.name}</TableCell>
                      <TableCell><Badge tone="blue">{t(humanize(customer.type))}</Badge></TableCell>
                      <TableCell className="text-[12px]">{customer.deals}</TableCell>
                      <TableCell className="text-end font-medium">{formatEGP(customer.value, lang, true)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!topCustomers.length && <EmptyState icon={Users} title={t('No customer value yet')} description={t('Deals linked to customers will populate this list.')} />}
            </Card>
          </div>

          <Card className="p-4">
            <SectionTitle title={t('Viewing activity')} description={t('Scheduled and completed property visits in the selected period')} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/25 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Viewings in period')}</p>
                <p className="mt-1 text-lg font-semibold">{periodViewings.length}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/25 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Completed')}</p>
                <p className="mt-1 text-lg font-semibold">{periodViewings.filter((v) => v.status === 'completed').length}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/25 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Scheduled')}</p>
                <p className="mt-1 text-lg font-semibold">{periodViewings.filter((v) => v.status === 'scheduled').length}</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {t('Analytics are calculated from the local demo dataset. Metrics update when you change records, but no external data warehouse, ad platform or AI service is connected.')}
      </div>
    </div>
  )
}
