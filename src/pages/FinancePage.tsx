import { useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowRight, Banknote, Building2, Calculator, CalendarDays, CheckCircle2, ChevronRight,
  CircleDollarSign, Clock, CreditCard, Download, Eye, FileText, Handshake, Info, Landmark, Percent,
  ReceiptText, ShieldCheck, TrendingUp, Users, Wallet,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { formatDate, formatEGP, formatNumber } from '@/lib/format'
import { cn, downloadCsv, humanize } from '@/lib/utils'
import { useTab } from '@/lib/useTab'
import { PageHeader, StatCard, SearchInput, InfoRow, SectionTitle } from '@/components/shared'
import { BarsChart, ChartCard, DonutChart, DonutLegend, chartColors } from '@/components/charts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input, Label, Select } from '@/components/ui/input'
import { ConfirmDialog, Sheet } from '@/components/ui/dialog'
import { EmptyState, Pagination, Progress } from '@/components/ui/misc'
import type { Commission, Transaction } from '@/types'

const tabs = [
  { id: 'overview', label: 'Overview', icon: Wallet },
  { id: 'commissions', label: 'Commissions', icon: Percent },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'calculator', label: 'Installment Calculator', icon: Calculator },
  { id: 'payouts', label: 'Payouts', icon: Banknote },
] as const

type FinanceTab = (typeof tabs)[number]['id']

const meta: Record<FinanceTab, { title: string; description: string }> = {
  overview: { title: 'Finance Overview', description: 'Revenue, receivables and commission health across the demo finance ledger.' },
  commissions: { title: 'Commissions', description: 'Commission entitlements for agents, brokers and partner companies.' },
  transactions: { title: 'Transactions', description: 'Every invoice, collection status and commission attached to open or closed deals.' },
  calculator: { title: 'Installment Calculator', description: 'Model a cash or installment plan for any listing and export the breakdown.' },
  payouts: { title: 'Payouts', description: 'Consolidated settlements awaiting release. Payout actions only update the local demo ledger.' },
}

const roleTone: Record<string, 'navy' | 'blue' | 'purple' | 'green'> = {
  company: 'navy', agent: 'blue', broker: 'purple', partner: 'green',
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export function FinancePage({ defaultTab = 'overview' }: { defaultTab?: string }) {
  const { t, lang } = useI18n()
  const { tab: rawTab, setTab } = useTab(defaultTab)
  const tab = (tabs.some((item) => item.id === rawTab) ? rawTab : 'overview') as FinanceTab

  const role = useAppStore((s) => s.role)
  const activeCompanyId = useAppStore((s) => s.activeCompanyId)
  const activeDeveloperId = useAppStore((s) => s.activeDeveloperId)
  const activeBrokerId = useAppStore((s) => s.activeBrokerId)
  const company = useAppStore((s) => s.companies.find((c) => c.id === s.activeCompanyId))
  const developer = useAppStore((s) => s.developers.find((d) => d.id === s.activeDeveloperId))
  const broker = useAppStore((s) => s.brokers.find((b) => b.id === s.activeBrokerId))
  const employees = useAppStore((s) => s.employees)
  const dealsAll = useAppStore((s) => s.deals)
  const transactionsAll = useAppStore((s) => s.transactions)
  const commissionsAll = useAppStore((s) => s.commissions)
  const propertiesAll = useAppStore((s) => s.properties)
  const settings = useAppStore((s) => s.settings)
  const updateTransactionStatus = useAppStore((s) => s.updateTransactionStatus)
  const payCommissions = useAppStore((s) => s.payCommissions)
  const updateCommissionStatus = useAppStore((s) => s.updateCommissionStatus)
  const toast = useAppStore((s) => s.toast)

  const scopedDeals = useMemo(() => {
    if (role === 'super_admin') return dealsAll
    if (role === 'developer') return dealsAll.filter((d) => d.developerId === activeDeveloperId)
    if (role === 'broker') return dealsAll.filter((d) => d.brokerId === activeBrokerId)
    return dealsAll.filter((d) => d.companyId === activeCompanyId)
  }, [role, dealsAll, activeDeveloperId, activeBrokerId, activeCompanyId])

  const scopedDealIds = useMemo(() => new Set(scopedDeals.map((d) => d.id)), [scopedDeals])

  const transactions = useMemo(() => {
    if (role === 'super_admin') return transactionsAll
    if (role === 'developer' || role === 'broker') return transactionsAll.filter((tx) => scopedDealIds.has(tx.dealId))
    return transactionsAll.filter((tx) => tx.companyId === activeCompanyId)
  }, [role, transactionsAll, scopedDealIds, activeCompanyId])

  const commissions = useMemo(() => {
    if (role === 'super_admin') return commissionsAll
    if (role === 'developer') return commissionsAll.filter((c) => scopedDealIds.has(c.dealId))
    if (role === 'broker') return commissionsAll.filter((c) => c.beneficiaryId === activeBrokerId || scopedDealIds.has(c.dealId))
    return commissionsAll.filter((c) => c.companyId === activeCompanyId)
  }, [role, commissionsAll, scopedDealIds, activeBrokerId, activeCompanyId])

  const scopeLabel = role === 'super_admin' ? t('All companies') : role === 'developer' ? (developer?.name ?? '') : role === 'broker' ? (broker?.name ?? '') : (company?.name ?? '')

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees])
  const sortedTransactions = useMemo(() => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [transactions])

  const collected = sum(transactions.filter((tx) => tx.status === 'completed').map((tx) => tx.amount))
  const outstanding = sum(transactions.filter((tx) => tx.status !== 'completed').map((tx) => tx.amount))
  const overdueTransactions = transactions.filter((tx) => tx.status === 'overdue')
  const overdueAmount = sum(overdueTransactions.map((tx) => tx.amount))
  const invoiced = collected + outstanding
  const collectionRate = invoiced ? Math.round((collected / invoiced) * 100) : 0

  const commissionTotal = sum(commissions.map((c) => c.amount))
  const commissionPaid = sum(commissions.filter((c) => c.status === 'paid').map((c) => c.amount))
  const commissionOpen = sum(commissions.filter((c) => c.status !== 'paid').map((c) => c.amount))
  const commissionOverdue = sum(commissions.filter((c) => c.status === 'overdue').map((c) => c.amount))
  const openCommissions = commissions.filter((c) => c.status !== 'paid')

  const commissionStatusData = (['paid', 'pending', 'overdue'] as const).map((status) => ({
    name: t(status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : 'Overdue'),
    value: sum(commissions.filter((c) => c.status === status).map((c) => c.amount)),
  }))

  const commissionRoleData = (['company', 'agent', 'broker', 'partner'] as const)
    .map((roleKey) => ({
      name: t(roleKey === 'company' ? 'Company' : roleKey === 'agent' ? 'Agent' : roleKey === 'broker' ? 'Broker' : 'Partner'),
      value: sum(commissions.filter((c) => c.role === roleKey).map((c) => c.amount)),
    }))
    .filter((item) => item.value > 0)

  const weeklySeries = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - (7 - i) * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      return { start, end, name: formatDate(start, lang, 'dd MMM'), collected: 0, outstanding: 0 }
    })
    transactions.forEach((tx) => {
      const time = new Date(tx.date).getTime()
      const bucket = weeks.find((w) => time >= w.start.getTime() && time < w.end.getTime())
      if (!bucket) return
      if (tx.status === 'completed') bucket.collected += tx.amount / 1_000_000
      else bucket.outstanding += tx.amount / 1_000_000
    })
    return weeks.map((w) => ({
      name: w.name,
      collected: Math.round(w.collected * 10) / 10,
      outstanding: Math.round(w.outstanding * 10) / 10,
    }))
  }, [transactions, lang])

  const payoutGroups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: Commission['role']; amount: number; count: number; overdue: number; dueDate: string }>()
    commissions.filter((c) => c.status !== 'paid').forEach((c) => {
      const existing = map.get(c.beneficiaryId)
      if (existing) {
        existing.amount += c.amount
        existing.count += 1
        if (c.status === 'overdue') existing.overdue += 1
        if (new Date(c.dueDate).getTime() < new Date(existing.dueDate).getTime()) existing.dueDate = c.dueDate
      } else {
        map.set(c.beneficiaryId, {
          id: c.beneficiaryId, name: c.beneficiaryName, role: c.role, amount: c.amount,
          count: 1, overdue: c.status === 'overdue' ? 1 : 0, dueDate: c.dueDate,
        })
      }
    })
    return [...map.values()].sort((a, b) => b.amount - a.amount)
  }, [commissions])

  const recentlySettled = useMemo(() => commissions
    .filter((c) => c.status === 'paid')
    .sort((a, b) => new Date(b.paidAt ?? b.dueDate).getTime() - new Date(a.paidAt ?? a.dueDate).getTime())
    .slice(0, 6), [commissions])

  const [commissionQuery, setCommissionQuery] = useState('')
  const [commissionStatus, setCommissionStatus] = useState('all')
  const [commissionRole, setCommissionRole] = useState('all')
  const filteredCommissions = useMemo(() => {
    const query = commissionQuery.trim().toLowerCase()
    const rank: Record<string, number> = { overdue: 0, pending: 1, paid: 2 }
    return commissions
      .filter((c) => commissionStatus === 'all' || c.status === commissionStatus)
      .filter((c) => commissionRole === 'all' || c.role === commissionRole)
      .filter((c) => !query || c.beneficiaryName.toLowerCase().includes(query) || c.dealId.toLowerCase().includes(query) || c.id.toLowerCase().includes(query))
      .sort((a, b) => (rank[a.status] ?? 3) - (rank[b.status] ?? 3) || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [commissions, commissionQuery, commissionStatus, commissionRole])

  const [txQuery, setTxQuery] = useState('')
  const [txStatus, setTxStatus] = useState('all')
  const [txType, setTxType] = useState('all')
  const [txPage, setTxPage] = useState(1)
  const txPageSize = 10
  const filteredTransactions = useMemo(() => {
    const query = txQuery.trim().toLowerCase()
    const rank: Record<string, number> = { overdue: 0, pending: 1, completed: 2 }
    return sortedTransactions
      .filter((tx) => txStatus === 'all' || tx.status === txStatus)
      .filter((tx) => txType === 'all' || tx.type === txType)
      .filter((tx) => !query || tx.customerName.toLowerCase().includes(query) || tx.propertyTitle.toLowerCase().includes(query) || tx.invoiceNo.toLowerCase().includes(query))
      .sort((a, b) => (rank[a.status] ?? 3) - (rank[b.status] ?? 3) || new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [sortedTransactions, txQuery, txStatus, txType])
  const pagedTransactions = filteredTransactions.slice((txPage - 1) * txPageSize, txPage * txPageSize)

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [payoutTarget, setPayoutTarget] = useState<string | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)
  const payoutGroup = payoutGroups.find((group) => group.id === payoutTarget)

  const openIdsFor = (beneficiaryId: string) => commissions
    .filter((c) => c.beneficiaryId === beneficiaryId && c.status !== 'paid')
    .map((c) => c.id)

  const [price, setPrice] = useState(9_500_000)
  const [downPct, setDownPct] = useState(10)
  const [years, setYears] = useState(8)
  const [annualRate, setAnnualRate] = useState(0)
  const [propertyId, setPropertyId] = useState('')

  const downPayment = Math.round((price * downPct) / 100)
  const financed = Math.max(0, price - downPayment)
  const months = Math.max(1, years * 12)
  const monthlyRate = annualRate / 100 / 12
  const monthly = monthlyRate > 0
    ? (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
    : financed / months
  const totalInterest = Math.max(0, monthly * months - financed)
  const planTotal = downPayment + monthly * months
  const schedule = Array.from({ length: years }, (_, i) => {
    const paid = Math.round(monthly * 12 * (i + 1))
    return { year: i + 1, monthly: Math.round(monthly), paid, remaining: Math.max(0, Math.round(financed - paid)) }
  })
  const priceOptions = useMemo(() => propertiesAll.filter((p) => p.status === 'available').slice(0, 30), [propertiesAll])

  const downloadPaymentPlan = () => {
    downloadCsv('nawyati-payment-plan.csv', [
      ['Nawyati — Demo Payment Plan', ''],
      ['Listing', propertyId ? propertiesAll.find((p) => p.id === propertyId)?.title ?? '' : 'Custom price'],
      ['Property price (EGP)', price],
      ['Down payment', `${downPct}%`],
      ['Down payment amount (EGP)', downPayment],
      ['Financed amount (EGP)', Math.round(financed)],
      ['Installment years', years],
      ['Annual interest', `${annualRate}%`],
      ['Monthly installment (EGP)', Math.round(monthly)],
      ['Total interest (EGP)', Math.round(totalInterest)],
      ['Total payable (EGP)', Math.round(planTotal)],
      [],
      ['Year', 'Monthly (EGP)', 'Paid to date (EGP)', 'Remaining (EGP)'],
      ...schedule.map((row) => [row.year, row.monthly, row.paid, row.remaining]),
    ])
    toast('Payment plan exported', 'The demo installment schedule was downloaded as a CSV file.')
  }

  const downloadInvoice = (tx: Transaction) => {
    downloadCsv(`${tx.invoiceNo}.csv`, [
      ['Invoice', tx.invoiceNo],
      ['Customer', tx.customerName],
      ['Property', tx.propertyTitle],
      ['Amount (EGP)', tx.amount],
      ['Commission (EGP)', tx.commission],
      ['Type', tx.type],
      ['Status', tx.status],
      ['Date', tx.date],
      ['Note', 'Demo document generated locally. It is not a tax invoice.'],
    ])
    toast('Invoice exported', 'A demo invoice file was downloaded locally.')
  }

  const exportCurrent = () => {
    if (tab === 'calculator') { downloadPaymentPlan(); return }
    if (tab === 'commissions') {
      downloadCsv('nawyati-commissions.csv', [
        ['Commission ID', 'Deal', 'Beneficiary', 'Role', 'Rate (%)', 'Amount (EGP)', 'Status', 'Due date'],
        ...filteredCommissions.map((c) => [c.id, c.dealId, c.beneficiaryName, c.role, c.pct, c.amount, c.status, c.dueDate]),
      ])
      toast('Commissions exported', 'The filtered commission ledger was downloaded as a CSV file.')
      return
    }
    if (tab === 'payouts') {
      downloadCsv('nawyati-payouts.csv', [
        ['Beneficiary', 'Role', 'Open amount (EGP)', 'Entries', 'Overdue entries', 'Next due date'],
        ...payoutGroups.map((group) => [group.name, group.role, group.amount, group.count, group.overdue, group.dueDate]),
      ])
      toast('Payout schedule exported', 'The open settlement schedule was downloaded as a CSV file.')
      return
    }
    if (tab === 'transactions') {
      downloadCsv('nawyati-transactions.csv', [
        ['Invoice', 'Customer', 'Property', 'Amount (EGP)', 'Commission (EGP)', 'Type', 'Status', 'Date'],
        ...filteredTransactions.map((tx) => [tx.invoiceNo, tx.customerName, tx.propertyTitle, tx.amount, tx.commission, tx.type, tx.status, tx.date]),
      ])
      toast('Transactions exported', 'The filtered invoice ledger was downloaded as a CSV file.')
      return
    }
    downloadCsv('nawyati-finance-overview.csv', [
      ['Metric', 'Value'],
      ['Scope', scopeLabel],
      ['Invoiced (EGP)', invoiced],
      ['Collected (EGP)', collected],
      ['Outstanding (EGP)', outstanding],
      ['Overdue invoices', overdueTransactions.length],
      ['Overdue amount (EGP)', overdueAmount],
      ['Commission total (EGP)', commissionTotal],
      ['Commission paid (EGP)', commissionPaid],
      ['Commission open (EGP)', commissionOpen],
      ['Collection rate', `${collectionRate}%`],
    ])
    toast('Finance snapshot exported', 'A CSV summary of the demo finance ledger was downloaded.')
  }

  const headerActions = tab === 'calculator' ? (
    <Button onClick={downloadPaymentPlan}><Download className="size-4" /> {t('Download plan')}</Button>
  ) : tab === 'payouts' ? (
    <>
      <Button variant="outline" onClick={exportCurrent}><Download className="size-4" /> {t('Export')}</Button>
      <Button variant="accent" disabled={!openCommissions.length} onClick={() => setConfirmAll(true)}><Banknote className="size-4" /> {t('Run all payouts')}</Button>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={exportCurrent}><Download className="size-4" /> {t('Export')}</Button>
      <Button onClick={() => setTab('payouts')}><Banknote className="size-4" /> {t('Payouts')}</Button>
    </>
  )

  return (
    <div>
      <PageHeader
        eyebrow={<><Wallet className="size-3.5" /> {t('Finance')} <ChevronRight className="size-3 text-muted-foreground/60 rtl:rotate-180" /> {scopeLabel}</>}
        title={t(meta[tab].title)}
        description={t(meta[tab].description)}
        actions={headerActions}
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value)}>
        <div className="overflow-x-auto pb-1">
          <TabsList>
            {tabs.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                <item.icon className="size-3.5" />
                {t(item.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('Collected revenue')} value={formatEGP(collected, lang, true)} icon={CircleDollarSign} tone="green" hint={t('completed invoices')} />
            <StatCard label={t('Outstanding receivables')} value={formatEGP(outstanding, lang, true)} icon={Clock} tone="amber" hint={t('pending and overdue')} href="/finance?tab=transactions" />
            <StatCard label={t('Commission payable')} value={formatEGP(commissionOpen, lang, true)} icon={Percent} tone="blue" hint={t('awaiting settlement')} href="/finance?tab=commissions" />
            <StatCard label={t('Overdue invoices')} value={overdueTransactions.length} icon={AlertTriangle} tone="amber" hint={formatEGP(overdueAmount, lang, true)} href="/finance?tab=transactions" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <ChartCard title={t('Collections by week')} description={`${t('Collected and outstanding invoices, EGP millions')} · ${scopeLabel}`}>
              <BarsChart
                data={weeklySeries}
                series={[
                  { key: 'collected', label: t('Collected'), color: chartColors.emerald },
                  { key: 'outstanding', label: t('Outstanding'), color: chartColors.rose },
                ]}
                height={280}
              />
            </ChartCard>
            <ChartCard title={t('Commission status')} description={t('Value of the commission ledger by settlement state')}>
              <DonutChart data={commissionStatusData} height={190} centerValue={formatEGP(commissionTotal, lang, true)} centerLabel={t('total commission')} colors={[chartColors.emerald, chartColors.amber, chartColors.rose]} />
              <div className="px-3 pb-2"><DonutLegend data={commissionStatusData} colors={[chartColors.emerald, chartColors.amber, chartColors.rose]} /></div>
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h3 className="text-[14px] font-semibold">{t('Recent transactions')}</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Latest invoices across the selected scope')}</p>
                </div>
                <button onClick={() => setTab('transactions')} className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline">
                  {t('View all')} <ArrowRight className="size-3 rtl:rotate-180" />
                </button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Invoice')}</TableHead>
                    <TableHead>{t('Customer')}</TableHead>
                    <TableHead>{t('Amount')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead className="text-end">{t('Date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.slice(0, 6).map((tx) => (
                    <TableRow key={tx.id} className="cursor-pointer" onClick={() => setSelectedTx(tx)}>
                      <TableCell className="font-medium">{tx.invoiceNo}</TableCell>
                      <TableCell className="text-[12px]">{tx.customerName}</TableCell>
                      <TableCell className="font-medium">{formatEGP(tx.amount, lang, true)}</TableCell>
                      <TableCell><StatusBadge status={tx.status} /></TableCell>
                      <TableCell className="text-end text-[11px] text-muted-foreground">{formatDate(tx.date, lang, 'dd MMM')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!sortedTransactions.length && <EmptyState icon={ReceiptText} title={t('No transactions yet')} description={t('Invoices linked to this scope will appear here.')} />}
            </Card>

            <Card className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[14px] font-semibold">{t('Collection health')}</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Share of invoiced value collected')}</p>
                </div>
                <Badge tone={collectionRate >= 60 ? 'green' : collectionRate >= 35 ? 'amber' : 'red'}>{collectionRate}%</Badge>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{t('Collected')}</span>
                    <span className="font-medium">{formatEGP(collected, lang, true)}</span>
                  </div>
                  <Progress value={collectionRate} tone="accent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Invoiced')}</p>
                    <p className="mt-1 text-[15px] font-semibold">{formatEGP(invoiced, lang, true)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Receivables')}</p>
                    <p className="mt-1 text-[15px] font-semibold">{formatEGP(outstanding, lang, true)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-amber-200/70 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  {t('Figures come from the local demo ledger. No payment gateway or bank connection is active.')}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
            <ChartCard title={t('Commission by beneficiary type')} description={t('Who earns from the current scoped ledger')}>
              <DonutChart data={commissionRoleData} height={190} centerValue={String(commissions.length)} centerLabel={t('entries')} />
              <div className="px-3 pb-2"><DonutLegend data={commissionRoleData} /></div>
            </ChartCard>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h3 className="text-[14px] font-semibold">{t('Next payouts')}</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Beneficiaries with open commission balances')}</p>
                </div>
                <button onClick={() => setTab('payouts')} className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline">
                  {t('Open payouts')} <ArrowRight className="size-3 rtl:rotate-180" />
                </button>
              </div>
              <div className="divide-y divide-border">
                {payoutGroups.slice(0, 5).map((group) => (
                  <div key={group.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      {group.role === 'broker' ? <Handshake className="size-4" /> : group.role === 'company' ? <Building2 className="size-4" /> : <Users className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium">{group.name}</p>
                      <p className="text-[10px] text-muted-foreground">{group.count} {t('entries')} · {t('due')} {formatDate(group.dueDate, lang, 'dd MMM')}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-[12px] font-semibold">{formatEGP(group.amount, lang, true)}</p>
                      {group.overdue > 0 && <p className="text-[10px] font-medium text-rose-500">{group.overdue} {t('overdue')}</p>}
                    </div>
                  </div>
                ))}
                {!payoutGroups.length && <EmptyState icon={CheckCircle2} title={t('All commissions settled')} description={t('There are no open payouts in this scope.')} />}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('Total commission')} value={formatEGP(commissionTotal, lang, true)} icon={Percent} hint={`${commissions.length} ${t('entries')}`} />
            <StatCard label={t('Paid')} value={formatEGP(commissionPaid, lang, true)} icon={CheckCircle2} tone="green" hint={t('settled to beneficiaries')} />
            <StatCard label={t('Awaiting settlement')} value={formatEGP(commissionOpen, lang, true)} icon={Clock} tone="amber" hint={`${openCommissions.length} ${t('entries')}`} />
            <StatCard label={t('Overdue commissions')} value={formatEGP(commissionOverdue, lang, true)} icon={AlertTriangle} tone="purple" hint={t('past the agreed due date')} />
          </div>

          <Card className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={commissionQuery} onChange={setCommissionQuery} placeholder={t('Search beneficiary, deal or ID')} className="w-full sm:w-72" />
              <Select value={commissionStatus} onChange={(e) => setCommissionStatus(e.target.value)} className="h-9 w-[150px]">
                <option value="all">{t('All statuses')}</option>
                <option value="pending">{t('Pending')}</option>
                <option value="paid">{t('Paid')}</option>
                <option value="overdue">{t('Overdue')}</option>
              </Select>
              <Select value={commissionRole} onChange={(e) => setCommissionRole(e.target.value)} className="h-9 w-[150px]">
                <option value="all">{t('All beneficiary types')}</option>
                <option value="company">{t('Company')}</option>
                <option value="agent">{t('Agent')}</option>
                <option value="broker">{t('Broker')}</option>
                <option value="partner">{t('Partner')}</option>
              </Select>
              <span className="ms-auto text-[11px] text-muted-foreground">{filteredCommissions.length} {t('entries')}</span>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Beneficiary')}</TableHead>
                  <TableHead>{t('Deal')}</TableHead>
                  <TableHead>{t('Type')}</TableHead>
                  <TableHead>{t('Rate')}</TableHead>
                  <TableHead>{t('Amount')}</TableHead>
                  <TableHead>{t('Due date')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead className="text-end">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <p className="text-[12px] font-medium">{commission.beneficiaryName}</p>
                      <p className="text-[10px] text-muted-foreground">{commission.id.toUpperCase()}</p>
                    </TableCell>
                    <TableCell className="text-[12px]">{commission.dealId.toUpperCase()}</TableCell>
                    <TableCell><Badge tone={roleTone[commission.role] ?? 'default'}>{t(humanize(commission.role))}</Badge></TableCell>
                    <TableCell className="text-[12px]">{commission.pct}%</TableCell>
                    <TableCell className="font-medium">{formatEGP(commission.amount, lang, true)}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{formatDate(commission.dueDate, lang, 'dd MMM yyyy')}</TableCell>
                    <TableCell><StatusBadge status={commission.status} /></TableCell>
                    <TableCell className="text-end">
                      {commission.status !== 'paid' ? (
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => updateCommissionStatus(commission.id, 'paid')}>{t('Mark paid')}</Button>
                          {commission.status !== 'overdue' && (
                            <Button variant="ghost" size="xs" className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => updateCommissionStatus(commission.id, 'overdue')}>
                              {t('Flag overdue')}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-3.5" /> {t('Settled')}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!filteredCommissions.length && <EmptyState icon={Percent} title={t('No commissions found')} description={t('Try changing the status, beneficiary type or search term.')} />}
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <Card className="p-4">
              <SectionTitle title={t('Commission structure')} description={t('Default rates configured for this workspace')} />
              <div className="divide-y divide-border">
                {settings.commissionRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Percent className="size-4" /></span>
                      <div>
                        <p className="text-[12px] font-medium">{rule.name}</p>
                        <p className="text-[10px] text-muted-foreground">{rule.appliesTo}</p>
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold">{rule.pct}%</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <SectionTitle title={t('Settlement policy')} description={t('How payouts are handled in this demo')} />
              <ul className="space-y-3 text-[12px] text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> {t('Agent commissions are released after the buyer payment is collected.')}</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> {t('Broker cooperation shares follow the accepted cooperation terms.')}</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> {t('Overdue entries stay visible until a finance manager settles or disputes them.')}</li>
                <li className="flex gap-2"><Info className="mt-0.5 size-3.5 shrink-0 text-amber-500" /> {t('Payout actions only update the local demo ledger. No bank transfer or payment provider is connected.')}</li>
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('Invoiced value')} value={formatEGP(invoiced, lang, true)} icon={ReceiptText} hint={`${transactions.length} ${t('invoices')}`} />
            <StatCard label={t('Collected')} value={formatEGP(collected, lang, true)} icon={CheckCircle2} tone="green" hint={`${collectionRate}% ${t('of invoiced value')}`} />
            <StatCard label={t('Outstanding')} value={formatEGP(outstanding, lang, true)} icon={Clock} tone="amber" hint={`${transactions.filter((tx) => tx.status === 'pending').length} ${t('pending invoices')}`} />
            <StatCard label={t('Overdue')} value={formatEGP(overdueAmount, lang, true)} icon={AlertTriangle} tone="purple" hint={`${overdueTransactions.length} ${t('invoices')}`} />
          </div>

          <Card className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={txQuery} onChange={(value) => { setTxQuery(value); setTxPage(1) }} placeholder={t('Search customer, property or invoice')} className="w-full sm:w-72" />
              <Select value={txStatus} onChange={(e) => { setTxStatus(e.target.value); setTxPage(1) }} className="h-9 w-[150px]">
                <option value="all">{t('All statuses')}</option>
                <option value="completed">{t('Completed')}</option>
                <option value="pending">{t('Pending')}</option>
                <option value="overdue">{t('Overdue')}</option>
              </Select>
              <Select value={txType} onChange={(e) => { setTxType(e.target.value); setTxPage(1) }} className="h-9 w-[150px]">
                <option value="all">{t('All types')}</option>
                <option value="sale">{t('Sale')}</option>
                <option value="resale">{t('Resale')}</option>
                <option value="rent">{t('Rent')}</option>
              </Select>
              <span className="ms-auto text-[11px] text-muted-foreground">{filteredTransactions.length} {t('invoices')}</span>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Invoice')}</TableHead>
                  <TableHead>{t('Customer')}</TableHead>
                  <TableHead>{t('Property')}</TableHead>
                  <TableHead>{t('Amount')}</TableHead>
                  <TableHead>{t('Commission')}</TableHead>
                  <TableHead>{t('Agent')}</TableHead>
                  <TableHead>{t('Date')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead className="text-end">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.invoiceNo}</TableCell>
                    <TableCell className="text-[12px]">{tx.customerName}</TableCell>
                    <TableCell><p className="max-w-[190px] truncate text-[12px]">{tx.propertyTitle}</p><p className="text-[10px] uppercase text-muted-foreground">{t(humanize(tx.type))}</p></TableCell>
                    <TableCell className="font-medium">{formatEGP(tx.amount, lang, true)}</TableCell>
                    <TableCell className="text-[12px]">{formatEGP(tx.commission, lang, true)}</TableCell>
                    <TableCell className="text-[12px]">{employeeMap.get(tx.agentId)?.name ?? '—'}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{formatDate(tx.date, lang, 'dd MMM yyyy')}</TableCell>
                    <TableCell><StatusBadge status={tx.status} /></TableCell>
                    <TableCell className="text-end">
                      <div className="inline-flex items-center gap-1">
                        {tx.status !== 'completed' && (
                          <Button variant="ghost" size="xs" onClick={() => updateTransactionStatus(tx.id, 'completed')}>{t('Mark collected')}</Button>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => setSelectedTx(tx)} aria-label={t('View invoice')}><Eye className="size-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!filteredTransactions.length && <EmptyState icon={FileText} title={t('No transactions found')} description={t('Try changing the status, type or search term.')} />}
            {!!filteredTransactions.length && <Pagination page={txPage} pageSize={txPageSize} total={filteredTransactions.length} onPageChange={setTxPage} />}
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
            <Card className="p-5">
              <SectionTitle title={t('Plan inputs')} description={t('Adjust the price, down payment and term to model a plan.')} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>{t('Load a listing price')}</Label>
                  <Select
                    value={propertyId}
                    onChange={(e) => {
                      const nextId = e.target.value
                      setPropertyId(nextId)
                      const listing = propertiesAll.find((p) => p.id === nextId)
                      if (listing) {
                        setPrice(listing.price)
                        setDownPct(listing.paymentPlan.downPaymentPct)
                        setYears(listing.paymentPlan.years)
                      }
                    }}
                  >
                    <option value="">{t('Choose an available listing (optional)')}</option>
                    {priceOptions.map((listing) => (
                      <option key={listing.id} value={listing.id}>{listing.title} · {formatEGP(listing.price, lang, true)}</option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>{t('Property price (EGP)')}</Label>
                  <Input type="number" min={0} step={100000} value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatEGP(price, lang)}</p>
                </div>
                <div>
                  <Label>{t('Down payment')}</Label>
                  <div className="flex items-center gap-2">
                    <Input type="range" min={0} max={60} step={5} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} className="h-9 accent-[#10B981]" />
                    <span className="w-12 text-end text-[13px] font-semibold">{downPct}%</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatEGP(downPayment, lang, true)}</p>
                </div>
                <div>
                  <Label>{t('Installment years')}</Label>
                  <Select value={years} onChange={(e) => setYears(Number(e.target.value))}>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((year) => (
                      <option key={year} value={year}>{year} {t(year === 1 ? 'year' : 'years')}</option>
                    ))}
                  </Select>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatNumber(months, lang)} {t('monthly installments')}</p>
                </div>
                <div>
                  <Label>{t('Annual interest')}</Label>
                  <Input type="number" min={0} max={30} step={0.25} value={annualRate} onChange={(e) => setAnnualRate(Math.max(0, Number(e.target.value) || 0))} />
                  <p className="mt-1 text-[11px] text-muted-foreground">{annualRate === 0 ? t('0% developer plan') : t('applied as a reducing balance rate')}</p>
                </div>
                <div>
                  <Label>{t('Plan type')}</Label>
                  <div className="flex h-9 items-center rounded-lg border border-border bg-muted/40 px-3 text-[12px] font-medium">
                    {annualRate === 0 ? t('Interest-free installments') : t('Interest-bearing installments')}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={downloadPaymentPlan}><Download className="size-4" /> {t('Download plan')}</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPrice(9_500_000)
                    setDownPct(10)
                    setYears(8)
                    setAnnualRate(0)
                    setPropertyId('')
                  }}
                >
                  {t('Reset')}
                </Button>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="overflow-hidden">
                <div className="bg-primary p-5 text-white dark:bg-[#0d1d30]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/60">{t('Estimated monthly installment')}</p>
                  <p className="mt-2 text-[30px] font-semibold tracking-[-0.03em]">{formatEGP(Math.round(monthly), lang)}</p>
                  <p className="mt-1 text-[11px] text-white/60">{years} {t('years')} · {annualRate}% {t('annual interest')} · {t('demo calculation')}</p>
                </div>
                <div className="grid grid-cols-2 gap-px bg-border">
                  <div className="bg-card p-4">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Down payment')}</p>
                    <p className="mt-1 text-[15px] font-semibold">{formatEGP(downPayment, lang, true)}</p>
                  </div>
                  <div className="bg-card p-4">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Financed amount')}</p>
                    <p className="mt-1 text-[15px] font-semibold">{formatEGP(financed, lang, true)}</p>
                  </div>
                  <div className="bg-card p-4">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Total interest')}</p>
                    <p className="mt-1 text-[15px] font-semibold">{formatEGP(Math.round(totalInterest), lang, true)}</p>
                  </div>
                  <div className="bg-card p-4">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Total payable')}</p>
                    <p className="mt-1 text-[15px] font-semibold">{formatEGP(Math.round(planTotal), lang, true)}</p>
                  </div>
                </div>
                <div className="p-4 pt-2">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{t('Down payment')} {downPct}%</span>
                    <span>{t('Financed')} {100 - downPct}%</span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary dark:bg-slate-300" style={{ width: `${downPct}%` }} />
                    <div className="h-full bg-accent" style={{ width: `${100 - downPct}%` }} />
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    {t('This is an illustrative calculation only. Final installment plans are confirmed in the sales contract.')}
                  </p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="text-[14px] font-semibold">{t('Yearly schedule')}</h3>
                  <Badge tone="outline">{schedule.length} {t('years')}</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Year')}</TableHead>
                      <TableHead>{t('Monthly')}</TableHead>
                      <TableHead>{t('Paid to date')}</TableHead>
                      <TableHead className="text-end">{t('Remaining')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell className="text-[12px] font-medium">{t('Year')} {row.year}</TableCell>
                        <TableCell className="text-[12px]">{formatEGP(row.monthly, lang, true)}</TableCell>
                        <TableCell className="text-[12px]">{formatEGP(row.paid, lang, true)}</TableCell>
                        <TableCell className="text-end text-[12px]">{formatEGP(row.remaining, lang, true)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><ShieldCheck className="size-4" /></span>
            <div>
              <p className="text-[13px] font-semibold">{t('Demo settlement desk')}</p>
              <p className="mt-0.5 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
                {t('Settling a payout only updates the local commission records in this browser. No bank transfer, wallet or payment provider is connected, and no funds move.')}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('Pending settlement')} value={formatEGP(commissionOpen, lang, true)} icon={Banknote} tone="amber" hint={`${openCommissions.length} ${t('entries')}`} />
            <StatCard label={t('Paid to date')} value={formatEGP(commissionPaid, lang, true)} icon={CheckCircle2} tone="green" hint={t('demo ledger')} />
            <StatCard label={t('Beneficiaries awaiting')} value={payoutGroups.length} icon={Users} tone="blue" hint={t('consolidated payouts')} />
            <StatCard label={t('Overdue commissions')} value={formatEGP(commissionOverdue, lang, true)} icon={AlertTriangle} tone="purple" hint={`${openCommissions.filter((c) => c.status === 'overdue').length} ${t('entries')}`} />
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h3 className="text-[14px] font-semibold">{t('Open settlement schedule')}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Grouped by beneficiary, ordered by open balance')}</p>
              </div>
              <Badge tone={payoutGroups.some((g) => g.overdue > 0) ? 'red' : 'green'}>
                {payoutGroups.some((g) => g.overdue > 0) ? t('Overdue items need attention') : t('On schedule')}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Beneficiary')}</TableHead>
                  <TableHead>{t('Type')}</TableHead>
                  <TableHead>{t('Entries')}</TableHead>
                  <TableHead>{t('Open amount')}</TableHead>
                  <TableHead>{t('Next due')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead className="text-end">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell><p className="text-[12px] font-medium">{group.name}</p><p className="text-[10px] text-muted-foreground">{group.id.toUpperCase()}</p></TableCell>
                    <TableCell><Badge tone={roleTone[group.role] ?? 'default'}>{t(humanize(group.role))}</Badge></TableCell>
                    <TableCell className="text-[12px]">{group.count}</TableCell>
                    <TableCell className="font-medium">{formatEGP(group.amount, lang, true)}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{formatDate(group.dueDate, lang, 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      {group.overdue > 0
                        ? <Badge tone="red">{group.overdue} {t('overdue')}</Badge>
                        : <Badge tone="green">{t('On schedule')}</Badge>}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button variant="outline" size="xs" onClick={() => setPayoutTarget(group.id)}>
                        <Banknote className="size-3.5" /> {t('Settle payout')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!payoutGroups.length && <EmptyState icon={CheckCircle2} title={t('No open payouts')} description={t('Every commission entry in this scope has been settled.')} />}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-[14px] font-semibold">{t('Recently settled')}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Latest commission entries marked as paid')}</p>
              </div>
              <LinklessLink onClick={() => setTab('commissions')} label={t('View ledger')} />
            </div>
            <div className="divide-y divide-border">
              {recentlySettled.map((commission) => (
                <div key={commission.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">{commission.beneficiaryName}</p>
                    <p className="text-[10px] text-muted-foreground">{commission.id.toUpperCase()} · {commission.dealId.toUpperCase()} · {commission.paidAt ? formatDate(commission.paidAt, lang, 'dd MMM yyyy') : t('settled')}</p>
                  </div>
                  <span className="text-[12px] font-semibold">{formatEGP(commission.amount, lang, true)}</span>
                </div>
              ))}
              {!recentlySettled.length && <EmptyState icon={Banknote} title={t('No settled payouts yet')} description={t('Settled commission entries will appear here.')} />}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        {selectedTx && (
          <>
            <div className="border-b border-border p-5 pe-14">
              <Badge tone="outline">{selectedTx.invoiceNo}</Badge>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.01em]">{selectedTx.propertyTitle}</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{selectedTx.customerName}</p>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('Invoice amount')}</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{formatEGP(selectedTx.amount, lang)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={selectedTx.status} />
                  <Badge tone="outline">{t(humanize(selectedTx.type))}</Badge>
                </div>
              </div>
              <div className="divide-y divide-border">
                <InfoRow label={t('Commission')} value={formatEGP(selectedTx.commission, lang)} />
                <InfoRow label={t('Sales agent')} value={employeeMap.get(selectedTx.agentId)?.name ?? '—'} />
                <InfoRow label={t('Invoice date')} value={formatDate(selectedTx.date, lang, 'dd MMM yyyy')} />
                <InfoRow label={t('Linked deal')} value={selectedTx.dealId.toUpperCase()} />
                <InfoRow label={t('Reference')} value={selectedTx.id.toUpperCase()} />
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-amber-200/70 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {t('This record belongs to the local demo ledger. Collecting it does not process a real payment.')}
              </div>
            </div>
            <div className="flex gap-2 border-t border-border p-4">
              <Button variant="outline" className="flex-1" onClick={() => downloadInvoice(selectedTx)}><Download className="size-4" /> {t('Export invoice')}</Button>
              {selectedTx.status !== 'completed' ? (
                <Button
                  variant="accent"
                  className="flex-1"
                  onClick={() => {
                    updateTransactionStatus(selectedTx.id, 'completed')
                    setSelectedTx({ ...selectedTx, status: 'completed' })
                  }}
                >
                  <CheckCircle2 className="size-4" /> {t('Mark collected')}
                </Button>
              ) : (
                <Button className="flex-1" disabled><CheckCircle2 className="size-4" /> {t('Collected')}</Button>
              )}
            </div>
          </>
        )}
      </Sheet>

      <ConfirmDialog
        open={!!payoutTarget}
        onOpenChange={(open) => !open && setPayoutTarget(null)}
        title={t('Settle this payout?')}
        description={payoutGroup
          ? `${payoutGroup.name} · ${formatEGP(payoutGroup.amount, lang)}. ${t('This records a simulated settlement in the local demo ledger; no funds move.')}`
          : ''}
        confirmLabel={t('Record settlement')}
        onConfirm={() => {
          if (payoutTarget) payCommissions(openIdsFor(payoutTarget))
          setPayoutTarget(null)
        }}
      />

      <ConfirmDialog
        open={confirmAll}
        onOpenChange={setConfirmAll}
        title={t('Run all payouts?')}
        description={`${openCommissions.length} ${t('open commission entries worth')} ${formatEGP(commissionOpen, lang)} ${t('will be marked as paid in the demo ledger. No real transfers are made.')}`}
        confirmLabel={t('Record all settlements')}
        onConfirm={() => payCommissions(openCommissions.map((c) => c.id))}
      />
    </div>
  )
}

function LinklessLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline">
      {label} <ArrowRight className="size-3 rtl:rotate-180" />
    </button>
  )
}
