import { useMemo, useState } from 'react'
import {
  ArrowRight, BadgeCheck, Check, ChevronRight, ClipboardCheck, GitPullRequest, Mail, MapPinned, Pencil,
  Percent, Plus, Target, Trash2, TrendingUp, Trophy, UserCog, UserPlus, Users, UsersRound, X,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { useTab } from '@/lib/useTab'
import { formatEGP, formatNumber, fromNow } from '@/lib/format'
import { cn, downloadCsv } from '@/lib/utils'
import type { Employee } from '@/types'
import { PageHeader, StatCard, TableShell, UserCell, SectionTitle, InfoRow, DataTableEmpty } from '@/components/shared'
import { BarsChart, ChartCard, DonutChart, chartColors } from '@/components/charts'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input, Select, Field } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, ConfirmDialog, Sheet } from '@/components/ui/dialog'
import { Avatar, EmptyState, Progress, Switch } from '@/components/ui/misc'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const tabs = [
  { id: 'teams', label: 'Sales Teams', icon: UsersRound },
  { id: 'employees', label: 'Employees', icon: UserCog },
  { id: 'targets', label: 'Targets', icon: Target },
  { id: 'territories', label: 'Territories', icon: MapPinned },
  { id: 'performance', label: 'Agent Performance', icon: Trophy },
  { id: 'teams-performance', label: 'Team Performance', icon: Users },
  { id: 'rules', label: 'Assignment Rules', icon: GitPullRequest },
  { id: 'approvals', label: 'Approvals', icon: ClipboardCheck },
]

interface Approval { id: string; title: string; detail: string; requester: string; type: string; status: 'pending' | 'approved' | 'rejected'; at: string }

const initialApprovals: Approval[] = [
  { id: 'ap1', title: '5% price discount — Contemporary Villa', detail: 'Nada Ibrahim requested a 5% discount to close this week.', requester: 'Mariam Fathy', type: 'Discount', status: 'pending', at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'ap2', title: 'Cooperation split — COP-3201', detail: 'Cairo Prime requests a 50/50 split on the Skyline apartment.', requester: 'Partnership desk', type: 'Cooperation', status: 'pending', at: new Date(Date.now() - 7400000).toISOString() },
  { id: 'ap3', title: 'Reservation extension — Palm Residence', detail: 'Extend the reservation by 7 days while the buyer finalises financing.', requester: 'Youssef Adel', type: 'Reservation', status: 'pending', at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'ap4', title: 'Commission adjustment — DL-2412', detail: 'Increase partner commission from 20% to 25% of the company share.', requester: 'Salma Hany', type: 'Commission', status: 'approved', at: new Date(Date.now() - 3 * 86400000).toISOString() },
]

export function OperationsPage() {
  const { t } = useI18n()
  const { tab, setTab } = useTab('teams')
  const activeCompanyId = useAppStore((s) => s.activeCompanyId)
  const employeesAll = useAppStore((s) => s.employees)
  const teamsAll = useAppStore((s) => s.teams)
  const leads = useAppStore((s) => s.leads)
  const deals = useAppStore((s) => s.deals)
  const updateEmployee = useAppStore((s) => s.updateEmployee)
  const updateTeam = useAppStore((s) => s.updateTeam)
  const deleteEmployee = useAppStore((s) => s.deleteEmployee)
  const addEmployee = useAppStore((s) => s.addEmployee)
  const toast = useAppStore((s) => s.toast)

  const employees = useMemo(() => employeesAll.filter((e) => e.companyId === activeCompanyId), [employeesAll, activeCompanyId])
  const teams = useMemo(() => teamsAll.filter((x) => x.companyId === activeCompanyId), [teamsAll, activeCompanyId])
  const companyDeals = deals.filter((d) => d.companyId === activeCompanyId)
  const companyLeads = leads.filter((l) => l.companyId === activeCompanyId)
  const [teamSheet, setTeamSheet] = useState<string | null>(null)
  const [employeeOpen, setEmployeeOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [targetDrafts, setTargetDrafts] = useState<Record<string, number>>({})
  const [approvals, setApprovals] = useState(initialApprovals)
  const [territoryOpen, setTerritoryOpen] = useState(false)
  const [territoryTeam, setTerritoryTeam] = useState(teams[0]?.id ?? '')
  const [territory, setTerritory] = useState('')

  const totalTarget = employees.reduce((s, e) => s + e.target, 0)
  const totalAchieved = employees.reduce((s, e) => s + e.achieved, 0)
  const activeTeam = teams.find((x) => x.id === teamSheet)

  const chartData = employees.filter((e) => e.role === 'agent').map((e) => ({ name: e.name.split(' ')[0], target: Math.round(e.target / 1_000_000), achieved: Math.round(e.achieved / 1_000_000) }))

  return (
    <div>
      <PageHeader
        title={t('Sales Operations')}
        description={t('Teams, capacity, targets and approvals that keep the sales floor running.')}
        actions={<><Button variant="outline" size="sm" onClick={() => downloadCsv('employees.csv', [['Name', 'Role', 'Title', 'Email', 'Phone', 'Target', 'Achieved', 'Conversion'], ...employees.map((e) => [e.name, e.role, e.title, e.email, e.phone, e.target, e.achieved, e.conversion])])}><ArrowRight className="size-3.5 rotate-90" /> {t('Export')}</Button><Button size="sm" onClick={() => { setEditing(null); setEmployeeOpen(true) }}><UserPlus className="size-3.5" /> {t('Add employee')}</Button></>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Team members')} value={employees.length} icon={Users} tone="navy" hint={`${teams.length} ${t('sales teams')}`} />
        <StatCard label={t('Target attainment')} value={`${Math.round((totalAchieved / Math.max(1, totalTarget)) * 100)}%`} icon={Target} tone="green" hint={`${formatEGP(totalAchieved, 'en', true)} / ${formatEGP(totalTarget, 'en', true)}`} />
        <StatCard label={t('Open leads')} value={companyLeads.filter((l) => !['won', 'lost'].includes(l.status)).length} icon={TrendingUp} tone="blue" hint={t('Across active agents')} />
        <StatCard label={t('Pending approvals')} value={approvals.filter((a) => a.status === 'pending').length} icon={ClipboardCheck} tone="amber" hint={t('Awaiting manager action')} />
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((x) => {
          const Icon = x.icon
          return <button key={x.id} onClick={() => setTab(x.id)} className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition-colors', (tab === x.id || (tab === '' && x.id === 'teams')) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}><Icon className="size-3.5" /> {t(x.label)}</button>
        })}
      </div>

      {(tab === 'teams' || tab === '') && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const manager = employees.find((e) => e.id === team.managerId)
            const members = employees.filter((e) => team.memberIds.includes(e.id))
            const attainment = Math.round((team.achieved / Math.max(1, team.target)) * 100)
            return (
              <Card key={team.id} className="p-5">
                <div className="flex items-start justify-between gap-2"><div><h3 className="text-[14px] font-semibold">{team.name}</h3><p className="text-[10px] text-muted-foreground">{team.territory}</p></div><Badge tone={attainment >= 80 ? 'green' : 'amber'}>{attainment}%</Badge></div>
                <div className="mt-3 flex -space-x-1.5">
                  {members.slice(0, 5).map((m) => <Avatar key={m.id} name={m.name} color={m.avatarColor} size="sm" />)}
                  {members.length > 5 && <span className="grid size-7 place-items-center rounded-full bg-muted text-[9px] font-semibold ring-2 ring-card">+{members.length - 5}</span>}
                </div>
                <div className="mt-4 space-y-1"><div className="flex justify-between text-[10px]"><span className="text-muted-foreground">{t('Target')}</span><span>{formatEGP(team.achieved, 'en', true)} / {formatEGP(team.target, 'en', true)}</span></div><Progress value={attainment} tone={attainment >= 80 ? 'accent' : 'amber'} /></div>
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5 text-center text-[10px]">
                  <div><p className="text-muted-foreground">{t('Members')}</p><p className="mt-0.5 text-[13px] font-semibold">{members.length}</p></div>
                  <div><p className="text-muted-foreground">{t('Won')}</p><p className="mt-0.5 text-[13px] font-semibold">{members.reduce((s, m) => s + m.dealsWon, 0)}</p></div>
                  <div><p className="text-muted-foreground">{t('Convert')}</p><p className="mt-0.5 text-[13px] font-semibold">{members.length ? Math.round(members.reduce((s, m) => s + m.conversion, 0) / members.length) : 0}%</p></div>
                </div>
                <div className="mt-3 flex gap-1.5"><Button size="xs" variant="outline" className="flex-1" onClick={() => setTeamSheet(team.id)}><Users className="size-3" /> {t('View team')}</Button><Button size="xs" variant="ghost" onClick={() => { setTerritoryTeam(team.id); setTerritory(team.territory); setTerritoryOpen(true) }}><Pencil className="size-3" /></Button></div>
                <p className="mt-2 text-[9px] text-muted-foreground">{t('Manager')}: {manager?.name ?? '—'}</p>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'employees' && (
        <TableShell header={<div className="flex w-full flex-wrap items-center gap-2"><p className="text-[13px] font-semibold">{employees.length} {t('team members')}</p><div className="ms-auto flex gap-2"><Button size="sm" variant="outline" onClick={() => downloadCsv('employees.csv', [['Name', 'Role', 'Title', 'Email', 'Target', 'Achieved'], ...employees.map((e) => [e.name, e.role, e.title, e.email, e.target, e.achieved])])}><ArrowRight className="size-3.5 rotate-90" /> {t('Export')}</Button><Button size="sm" onClick={() => { setEditing(null); setEmployeeOpen(true) }}><Plus className="size-3.5" /> {t('Add employee')}</Button></div></div>}>
          <Table>
            <TableHeader><TableRow><TableHead>{t('Employee')}</TableHead><TableHead>{t('Role')}</TableHead><TableHead>{t('Contact')}</TableHead><TableHead>{t('Team')}</TableHead><TableHead>{t('Target')}</TableHead><TableHead>{t('Achieved')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead className="text-end">{t('Actions')}</TableHead></TableRow></TableHeader>
            <TableBody>{employees.map((e) => {
              const team = teams.find((x) => x.id === e.teamId || x.memberIds.includes(e.id))
              return (
                <TableRow key={e.id}>
                  <TableCell><UserCell name={e.name} sub={e.title} color={e.avatarColor} /></TableCell>
                  <TableCell><Badge tone={e.role === 'owner' ? 'purple' : e.role === 'manager' ? 'blue' : 'default'} className="capitalize">{e.role}</Badge></TableCell>
                  <TableCell><p dir="ltr" className="text-[11px] text-muted-foreground">{e.email}</p><p dir="ltr" className="text-[10px] text-muted-foreground">{e.phone}</p></TableCell>
                  <TableCell className="text-[11px]">{team?.name ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatEGP(e.target, 'en', true)}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Progress value={(e.achieved / Math.max(1, e.target)) * 100} className="w-16" /><span className="text-[10px] text-muted-foreground">{Math.round((e.achieved / Math.max(1, e.target)) * 100)}%</span></div></TableCell>
                  <TableCell><StatusBadge status={e.status} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1"><Button size="xs" variant="ghost" onClick={() => { setEditing(e); setEmployeeOpen(true) }}><Pencil className="size-3" /></Button><Button size="xs" variant="ghost" onClick={() => setDeleteTarget(e)}><Trash2 className="size-3 text-rose-500" /></Button></div>
                  </TableCell>
                </TableRow>
              )
            })}</TableBody>
          </Table>
        </TableShell>
      )}

      {tab === 'targets' && (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
            <TableShell header={<p className="text-[13px] font-semibold">{t('Annual targets by employee')}</p>}>
              <Table>
                <TableHeader><TableRow><TableHead>{t('Employee')}</TableHead><TableHead>{t('Target')}</TableHead><TableHead>{t('Achieved')}</TableHead><TableHead>{t('Attainment')}</TableHead><TableHead className="text-end">{t('Update')}</TableHead></TableRow></TableHeader>
                <TableBody>{employees.filter((e) => e.role !== 'owner').map((e) => {
                  const draft = targetDrafts[e.id] ?? e.target
                  return (
                    <TableRow key={e.id}>
                      <TableCell><UserCell name={e.name} sub={e.title} color={e.avatarColor} /></TableCell>
                      <TableCell><Input type="number" value={draft} onChange={(ev) => setTargetDrafts((d) => ({ ...d, [e.id]: Number(ev.target.value) }))} className="h-8 w-32 text-[11px]" /></TableCell>
                      <TableCell className="whitespace-nowrap">{formatEGP(e.achieved, 'en', true)}</TableCell>
                      <TableCell><Badge tone={(e.achieved / Math.max(1, draft)) >= 0.8 ? 'green' : 'amber'}>{Math.round((e.achieved / Math.max(1, draft)) * 100)}%</Badge></TableCell>
                      <TableCell className="text-end"><Button size="xs" onClick={() => { updateEmployee(e.id, { target: draft }); toast('Target saved', `${e.name}: ${formatEGP(draft, 'en', true)}`) }} disabled={draft === e.target}><Check className="size-3" /> {t('Save')}</Button></TableCell>
                    </TableRow>
                  )
                })}</TableBody>
              </Table>
            </TableShell>
            <div className="space-y-4">
              <Card className="p-5"><SectionTitle title={t('Company attainment')} /><DonutChart data={[{ name: t('Achieved'), value: Math.round(totalAchieved / 1_000_000) }, { name: t('Remaining'), value: Math.max(1, Math.round((totalTarget - totalAchieved) / 1_000_000)) }]} centerValue={`${Math.round((totalAchieved / Math.max(1, totalTarget)) * 100)}%`} centerLabel={t('of target')} height={180} colors={[chartColors.emerald, chartColors.slate]} /><p className="mt-3 text-center text-[11px] text-muted-foreground">{formatEGP(totalAchieved, 'en', true)} {t('of')} {formatEGP(totalTarget, 'en', true)}</p></Card>
              <Card className="p-5"><SectionTitle title={t('Target settings')} /><p className="text-[11px] leading-relaxed text-muted-foreground">{t('Targets are stored per employee in this demo. Changing a target immediately updates dashboards and forecast calculations.')}</p></Card>
            </div>
          </div>
        </div>
      )}

      {tab === 'territories' && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {['New Cairo & East', 'Sheikh Zayed & West', 'North Coast', 'New Administrative Capital', 'Maadi', '6th of October'].map((zone, i) => {
            const zoneLeads = companyLeads.filter((l) => l.location.toLowerCase().includes(zone.split(' ')[0].toLowerCase()))
            const zoneDeals = companyDeals.filter((d) => d.propertyTitle.length && zoneLeads.some((l) => l.name === d.customerName))
            const team = teams.find((x) => x.territory.includes(zone.split(' ')[0])) ?? teams[i % Math.max(1, teams.length)]
            return (
              <Card key={zone} className="p-5">
                <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"><MapPinned className="size-4" /></span><div><p className="text-[13px] font-semibold">{zone}</p><p className="text-[10px] text-muted-foreground">{team ? team.name : t('Unassigned')}</p></div></div><Badge tone={team ? 'green' : 'amber'}>{team ? t('Covered') : t('Open')}</Badge></div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-lg bg-muted/50 p-2.5"><p className="text-muted-foreground">{t('Leads')}</p><p className="mt-0.5 text-[14px] font-semibold">{zoneLeads.length}</p></div><div className="rounded-lg bg-muted/50 p-2.5"><p className="text-muted-foreground">{t('Deal value')}</p><p className="mt-0.5 text-[14px] font-semibold">{formatEGP(zoneDeals.reduce((s, d) => s + d.value, 0), 'en', true)}</p></div></div>
                <Button size="xs" variant="outline" className="mt-3 w-full" onClick={() => { setTerritoryTeam(team?.id ?? teams[0]?.id ?? ''); setTerritory(zone); setTerritoryOpen(true) }}><Pencil className="size-3" /> {t('Assign territory')}</Button>
              </Card>
            )
          })}
        </div>
      )}

      {(tab === 'performance' || tab === 'teams-performance') && (
        <div className="space-y-4">
          <ChartCard title={tab === 'performance' ? t('Agent target vs achieved') : t('Team target vs achieved')} description={t('Values in EGP millions.')}><BarsChart data={tab === 'performance' ? chartData : teams.map((x) => ({ name: x.name, target: Math.round(x.target / 1_000_000), achieved: Math.round(x.achieved / 1_000_000) }))} series={[{ key: 'target', label: t('Target'), color: chartColors.slate }, { key: 'achieved', label: t('Achieved'), color: chartColors.emerald }]} height={280} /></ChartCard>
          {tab === 'performance' ? (
            <TableShell header={<p className="text-[13px] font-semibold">{t('Agent scorecard')}</p>}>
              <Table>
                <TableHeader><TableRow><TableHead>{t('Agent')}</TableHead><TableHead>{t('Leads assigned')}</TableHead><TableHead>{t('Deals won')}</TableHead><TableHead>{t('Conversion')}</TableHead><TableHead>{t('Attainment')}</TableHead><TableHead>{t('Attendance')}</TableHead></TableRow></TableHeader>
                <TableBody>{employees.filter((e) => e.role === 'agent').sort((a, b) => b.conversion - a.conversion).map((e) => (
                  <TableRow key={e.id}><TableCell><UserCell name={e.name} sub={e.title} color={e.avatarColor} /></TableCell><TableCell>{e.leadsAssigned}</TableCell><TableCell>{e.dealsWon}</TableCell><TableCell><Badge tone={e.conversion >= 30 ? 'green' : e.conversion >= 20 ? 'amber' : 'default'}>{e.conversion}%</Badge></TableCell><TableCell><Progress value={(e.achieved / Math.max(1, e.target)) * 100} className="w-24" /><span className="mt-1 block text-[9px] text-muted-foreground">{Math.round((e.achieved / Math.max(1, e.target)) * 100)}%</span></TableCell><TableCell className="text-[11px]">{e.attendance}%</TableCell></TableRow>
                ))}</TableBody>
              </Table>
            </TableShell>
          ) : (
            <TableShell header={<p className="text-[13px] font-semibold">{t('Team scorecard')}</p>}>
              <Table>
                <TableHeader><TableRow><TableHead>{t('Team')}</TableHead><TableHead>{t('Members')}</TableHead><TableHead>{t('Territory')}</TableHead><TableHead>{t('Target')}</TableHead><TableHead>{t('Achieved')}</TableHead><TableHead>{t('Manager')}</TableHead><TableHead className="text-end">{t('Action')}</TableHead></TableRow></TableHeader>
                <TableBody>{teams.map((x) => <TableRow key={x.id}><TableCell className="font-medium">{x.name}</TableCell><TableCell>{employees.filter((e) => x.memberIds.includes(e.id)).length}</TableCell><TableCell className="text-[11px] text-muted-foreground">{x.territory}</TableCell><TableCell>{formatEGP(x.target, 'en', true)}</TableCell><TableCell>{formatEGP(x.achieved, 'en', true)}</TableCell><TableCell className="text-[11px]">{employees.find((e) => e.id === x.managerId)?.name}</TableCell><TableCell className="text-end"><Button size="xs" variant="outline" onClick={() => setTeamSheet(x.id)}>{t('View')}</Button></TableCell></TableRow>)}</TableBody>
              </Table>
            </TableShell>
          )}
        </div>
      )}

      {tab === 'rules' && <AssignmentRules teams={teams} />}

      {tab === 'approvals' && (
        <div className="space-y-3">
          {approvals.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', a.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : a.status === 'approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400')}><ClipboardCheck className="size-4" /></span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[13px] font-semibold">{a.title}</p><Badge tone="outline">{a.type}</Badge><StatusBadge status={a.status} /></div><p className="mt-0.5 text-[11px] text-muted-foreground">{a.detail}</p><p className="mt-1 text-[9px] text-muted-foreground">{a.requester} · {fromNow(a.at)}</p></div>
              {a.status === 'pending' ? <div className="flex gap-1.5"><Button size="xs" variant="outline" onClick={() => { setApprovals((xs) => xs.map((x) => x.id === a.id ? { ...x, status: 'rejected' } : x)); toast('Request rejected', a.title, 'info') }}><X className="size-3" /> {t('Reject')}</Button><Button size="xs" onClick={() => { setApprovals((xs) => xs.map((x) => x.id === a.id ? { ...x, status: 'approved' } : x)); toast('Request approved', a.title) }}><Check className="size-3" /> {t('Approve')}</Button></div> : <Badge tone={a.status === 'approved' ? 'green' : 'red'}>{t(a.status === 'approved' ? 'Resolved' : 'Closed')}</Badge>}
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!teamSheet} onOpenChange={(v) => !v && setTeamSheet(null)} width="440px">
        {activeTeam && (
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-5 pe-12"><h2 className="text-lg font-semibold">{activeTeam.name}</h2><p className="text-[11px] text-muted-foreground">{activeTeam.territory} · {formatEGP(activeTeam.achieved, 'en', true)} / {formatEGP(activeTeam.target, 'en', true)}</p><Progress value={(activeTeam.achieved / Math.max(1, activeTeam.target)) * 100} className="mt-3" /></div>
            <div className="thin-scrollbar flex-1 overflow-y-auto p-5">
              <h3 className="mb-2 text-[12px] font-semibold">{t('Members')}</h3>
              <div className="space-y-2">{employees.filter((e) => activeTeam.memberIds.includes(e.id)).map((e) => (
                <div key={e.id} className="flex items-center gap-2.5 rounded-lg border border-border p-2.5"><Avatar name={e.name} color={e.avatarColor} size="sm" /><div className="min-w-0 flex-1"><p className="text-[12px] font-medium">{e.name}</p><p className="text-[10px] text-muted-foreground">{e.title} · {e.dealsWon} {t('won')}</p></div><Badge tone={e.status === 'active' ? 'green' : 'amber'}>{t(e.status)}</Badge></div>
              ))}</div>
              <div className="mt-5"><h3 className="mb-2 text-[12px] font-semibold">{t('Team details')}</h3><div className="divide-y divide-border rounded-lg border border-border px-3"><InfoRow label={t('Manager')} value={employees.find((e) => e.id === activeTeam.managerId)?.name ?? '—'} /><InfoRow label={t('Territory')} value={activeTeam.territory} /><InfoRow label={t('Target')} value={formatEGP(activeTeam.target)} /><InfoRow label={t('Attainment')} value={`${Math.round((activeTeam.achieved / Math.max(1, activeTeam.target)) * 100)}%`} /></div></div>
            </div>
            <div className="border-t border-border p-4"><Button className="w-full" onClick={() => { toast('Team message queued', `A demo message was queued to ${activeTeam.name}.`, 'info'); setTeamSheet(null) }}><Mail className="size-3.5" /> {t('Message team')}</Button></div>
          </div>
        )}
      </Sheet>

      <EmployeeDialog open={employeeOpen} onOpenChange={setEmployeeOpen} employee={editing} companyId={activeCompanyId} teams={teams} onSave={(e) => { if (editing) updateEmployee(editing.id, e); else addEmployee(e as Employee) }} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title={t('Remove team member?')} description={`${deleteTarget?.name} ${t('will lose access to this demo workspace.')}`} confirmLabel={t('Remove')} danger onConfirm={() => { if (deleteTarget) deleteEmployee(deleteTarget.id) }} />

      <Dialog open={territoryOpen} onOpenChange={setTerritoryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('Assign territory')}</DialogTitle><DialogDescription>{t('Set the coverage area for this sales team.')}</DialogDescription></DialogHeader>
          <Field label={t('Team')}><Select value={territoryTeam} onChange={(e) => setTerritoryTeam(e.target.value)}>{teams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
          <Field label={t('Territory')} className="mt-3"><Input value={territory} onChange={(e) => setTerritory(e.target.value)} placeholder="e.g. New Cairo & East" /></Field>
          <DialogFooter><Button variant="outline" onClick={() => setTerritoryOpen(false)}>{t('Cancel')}</Button><Button onClick={() => { updateTeam(territoryTeam, { territory }); setTerritoryOpen(false) }}>{t('Save territory')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AssignmentRules({ teams }: { teams: ReturnType<typeof useAppStore.getState>['teams'] }) {
  const { t } = useI18n()
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const toast = useAppStore((s) => s.toast)
  const [rules, setRules] = useState([
    { id: 'r1', name: 'Website leads with score above 70', target: 'Alpha Sales · round robin', enabled: true, priority: 'High' },
    { id: 'r2', name: 'North Coast and chalet inquiries', target: 'Coastal specialists', enabled: true, priority: 'High' },
    { id: 'r3', name: 'Broker-sourced leads', target: 'Partnership desk review', enabled: true, priority: 'Medium' },
    { id: 'r4', name: 'Walk-in leads', target: 'Branch manager routing', enabled: false, priority: 'Medium' },
    { id: 'r5', name: 'Unattended leads after 24 hours', target: 'Recycle to shared pool', enabled: true, priority: 'Low' },
  ])
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <TableShell header={<div className="flex w-full items-center justify-between"><p className="text-[13px] font-semibold">{t('Assignment rules')}</p><Badge tone={settings.autoAssign ? 'green' : 'default'}>{settings.autoAssign ? t('Auto-assign on') : t('Manual assignment')}</Badge></div>}>
        <Table>
          <TableHeader><TableRow><TableHead>{t('Rule')}</TableHead><TableHead>{t('Route to')}</TableHead><TableHead>{t('Priority')}</TableHead><TableHead className="text-end">{t('Enabled')}</TableHead></TableRow></TableHeader>
          <TableBody>{rules.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-[11px] text-muted-foreground">{r.target}</TableCell>
              <TableCell><Badge tone={r.priority === 'High' ? 'amber' : 'outline'}>{r.priority}</Badge></TableCell>
              <TableCell className="text-end"><Switch checked={r.enabled} onCheckedChange={(v) => { setRules((xs) => xs.map((x) => x.id === r.id ? { ...x, enabled: v } : x)); toast(v ? 'Rule enabled' : 'Rule paused', r.name, 'info') }} /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </TableShell>
      <div className="space-y-4">
        <Card className="p-5"><SectionTitle title={t('Global assignment')} /><div className="flex items-center justify-between gap-3"><div><p className="text-[12px] font-medium">{t('Auto-assign new leads')}</p><p className="text-[10px] text-muted-foreground">{t('Apply rules in priority order.')}</p></div><Switch checked={settings.autoAssign} onCheckedChange={(v) => { updateSettings({ autoAssign: v }); toast(v ? 'Auto-assignment enabled' : 'Auto-assignment disabled', undefined, 'info') }} /></div></Card>
        <Card className="p-5"><SectionTitle title={t('Teams in rotation')} /><div className="space-y-2">{teams.map((x) => <div key={x.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-[11px]"><span>{x.name}</span><Badge tone="outline">{x.memberIds.length} {t('members')}</Badge></div>)}</div></Card>
      </div>
    </div>
  )
}

function EmployeeDialog({ open, onOpenChange, employee, companyId, teams, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; employee: Employee | null; companyId: string; teams: ReturnType<typeof useAppStore.getState>['teams']; onSave: (e: Partial<Employee> & { name: string }) => void }) {
  const { t } = useI18n()
  const [name, setName] = useState(employee?.name ?? '')
  const [title, setTitle] = useState(employee?.title ?? 'Property Consultant')
  const [role, setRole] = useState<Employee['role']>(employee?.role ?? 'agent')
  const [email, setEmail] = useState(employee?.email ?? '')
  const [phone, setPhone] = useState(employee?.phone ?? '')
  const [teamId, setTeamId] = useState(employee?.teamId ?? teams[0]?.id ?? '')
  const [target, setTarget] = useState(employee?.target ?? 20000000)

  const save = () => {
    if (name.trim().length < 2) return
    onSave({ ...(employee ?? {}), id: employee?.id ?? `e${Date.now()}`, companyId, name: name.trim(), nameAr: employee?.nameAr ?? name.trim(), title, role, email, phone, teamId, target, avatarColor: employee?.avatarColor ?? '#334E68', status: employee?.status ?? 'active', permissions: employee?.permissions ?? [] } as Partial<Employee> & { name: string })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{employee ? t('Edit employee') : t('Add employee')}</DialogTitle><DialogDescription>{t('Team members can own leads, deals and tasks in this workspace.')}</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('Full name')} required><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label={t('Job title')}><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label={t('Role')}><Select value={role} onChange={(e) => setRole(e.target.value as Employee['role'])}>{['manager', 'agent'].map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
          <Field label={t('Team')}><Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>{teams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
          <Field label={t('Email')}><Input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" /></Field>
          <Field label={t('Phone')}><Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" /></Field>
          <Field label={t('Annual target (EGP)')} className="sm:col-span-2"><Input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} /></Field>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button><Button onClick={save} disabled={name.trim().length < 2}>{employee ? t('Save changes') : t('Add employee')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
