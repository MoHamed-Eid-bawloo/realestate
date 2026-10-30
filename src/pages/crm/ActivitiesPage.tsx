import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Activity as ActivityIcon, CalendarCheck, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle,
  Clock, Eye, FileSignature, FileText, History, ListTodo, Mail, MessageCircle, Phone, Plus, Trash2, Users, Video,
  Wallet, AlertTriangle,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { useTab } from '@/lib/useTab'
import { cn } from '@/lib/utils'
import { formatDate, fromNow } from '@/lib/format'
import { PageHeader, StatCard, SectionTitle, UserCell, DataTableEmpty, SearchInput } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { EmptyState, Progress } from '@/components/ui/misc'
import type { Activity, Lead, Task, Viewing } from '@/types'

const taskIcons: Record<Task['type'], React.ElementType> = {
  call: Phone, whatsapp: MessageCircle, email: Mail, meeting: Users, viewing: Eye,
  document: FileText, contract: FileSignature, payment: Wallet,
}

const activityIcons: Record<Activity['type'], React.ElementType> = {
  call: Phone, whatsapp: MessageCircle, email: Mail, meeting: Users, viewing: Eye,
  note: FileText, status: CheckCircle2, system: ActivityIcon, task: ListTodo,
}

const tabs = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'follow-ups', label: 'Follow-ups' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'viewings', label: 'Viewings' },
  { id: 'calls', label: 'Call Logs' },
  { id: 'timeline', label: 'Timeline' },
]

const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export function ActivitiesPage() {
  const { t, lang } = useI18n()
  const { tab, setTab } = useTab('tasks')
  const [params, setParams] = useSearchParams()
  const role = useAppStore((s) => s.role)
  const companyId = useAppStore((s) => s.activeCompanyId)
  const employees = useAppStore((s) => s.employees)
  const tasksAll = useAppStore((s) => s.tasks)
  const leadsAll = useAppStore((s) => s.leads)
  const viewingsAll = useAppStore((s) => s.viewings)
  const updateTask = useAppStore((s) => s.updateTask)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const updateViewing = useAppStore((s) => s.updateViewing)
  const addLeadActivity = useAppStore((s) => s.addLeadActivity)
  const updateLead = useAppStore((s) => s.updateLead)
  const toast = useAppStore((s) => s.toast)

  const agentId = role === 'agent' ? 'e3' : undefined
  const employeesScoped = employees.filter((e) => e.companyId === companyId)
  const tasks = useMemo(() => tasksAll.filter((x) => x.companyId === companyId && (!agentId || x.assigneeId === agentId)), [tasksAll, companyId, agentId])
  const leads = useMemo(() => leadsAll.filter((l) => l.companyId === companyId && (!agentId || l.assigneeId === agentId)), [leadsAll, companyId, agentId])
  const viewings = useMemo(() => viewingsAll.filter((v) => v.companyId === companyId && (!agentId || v.agentId === agentId)), [viewingsAll, companyId, agentId])

  const [taskOpen, setTaskOpen] = useState(params.get('new') === '1')
  const [editing, setEditing] = useState<Task | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())

  const closeTask = (open: boolean) => {
    setTaskOpen(open)
    if (!open) {
      setEditing(null)
      if (params.get('new')) { const p = new URLSearchParams(params); p.delete('new'); setParams(p, { replace: true }) }
    }
  }

  const openTask = (task?: Task) => { setEditing(task ?? null); setTaskOpen(true) }

  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unassigned'

  const overdue = tasks.filter((x) => x.status !== 'done' && new Date(x.dueDate).getTime() < Date.now())
  const today = tasks.filter((x) => x.status !== 'done' && isSameDay(new Date(x.dueDate), new Date()))
  const done = tasks.filter((x) => x.status === 'done')
  const completion = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0
  const upcomingViewings = viewings.filter((v) => v.status === 'scheduled')

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks
      .filter((x) => statusFilter === 'all' || x.status === statusFilter)
      .filter((x) => !q || `${x.title} ${x.customerName ?? ''} ${x.propertyTitle ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [tasks, query, statusFilter])

  const meetings = tasks.filter((x) => x.type === 'meeting')
  const followUps = useMemo(() => leads
    .filter((l) => !['won', 'lost'].includes(l.status) && l.nextFollowUp)
    .sort((a, b) => new Date(a.nextFollowUp).getTime() - new Date(b.nextFollowUp).getTime()), [leads])

  const calls = useMemo(() => {
    const logged = leads.flatMap((l) => l.activities.filter((a) => a.type === 'call' || a.type === 'whatsapp' || a.type === 'email').map((a) => ({ ...a, lead: l })))
    const planned = tasks.filter((x) => x.type === 'call').map((x) => ({ id: x.id, type: 'call' as const, title: x.title, detail: x.customerName ?? 'Scheduled call', at: x.dueDate, actor: employeeName(x.assigneeId), task: x, lead: undefined as Lead | undefined }))
    return [...logged, ...planned].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [leads, tasks])

  const timeline = useMemo(() => {
    const fromLeads = leads.flatMap((l) => l.activities.map((a) => ({ ...a, source: `${l.name} · ${l.phone}`, href: `/crm/leads/${l.id}` })))
    const fromTasks = tasks.flatMap((x) => x.status === 'done' ? [{ id: `t-${x.id}`, type: 'task' as const, title: x.title, detail: `Completed by ${employeeName(x.assigneeId)}`, at: x.dueDate, actor: employeeName(x.assigneeId), source: x.customerName ?? 'Internal', href: '/crm/activities' }] : [])
    return [...fromLeads, ...fromTasks].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 60)
  }, [leads, tasks])

  const calendarCells = useMemo(() => {
    const start = new Date(month)
    const offset = start.getDay()
    const cells: { date: Date; current: boolean }[] = []
    for (let i = 0; i < 42; i++) {
      const date = new Date(month.getFullYear(), month.getMonth(), i - offset + 1)
      cells.push({ date, current: date.getMonth() === month.getMonth() })
    }
    return cells
  }, [month])

  const eventsForDay = (date: Date) => {
    const dayTasks = tasks.filter((x) => isSameDay(new Date(x.dueDate), date) && x.status !== 'done')
    const dayViewings = viewings.filter((v) => isSameDay(new Date(v.date), date))
    return { dayTasks, dayViewings }
  }

  const markDone = (task: Task) => {
    updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
    toast(task.status === 'done' ? 'Task reopened' : 'Task completed', task.title, 'info')
  }

  const logFollowUp = (lead: Lead) => {
    addLeadActivity(lead.id, 'call', 'Follow-up call completed', `Called ${lead.name} about ${lead.propertyType} options in ${lead.location}.`, 'You')
    updateLead(lead.id, { nextFollowUp: new Date(Date.now() + 3 * 86400000).toISOString(), status: lead.status === 'new' ? 'contacted' : lead.status })
    toast('Follow-up logged', `Next touchpoint scheduled in 3 days for ${lead.name}.`)
  }

  const dayEvents = eventsForDay(selectedDay)

  return (
    <div>
      <PageHeader
        title={t('Activities & Productivity')}
        description={t('Every call, visit, meeting and follow-up in one operational calendar.')}
        eyebrow={<><ActivityIcon className="size-3.5 text-accent" /> {t('CRM')} · {t('Activities')}</>}
        actions={<Button variant="accent" onClick={() => openTask()}><Plus /> {t('New task')}</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Open tasks')} value={tasks.filter((x) => x.status !== 'done').length} icon={ListTodo} hint={`${today.length} ${t('due today')}`} />
        <StatCard label={t('Overdue')} value={overdue.length} icon={AlertTriangle} tone="amber" hint={t('Needs attention today')} />
        <StatCard label={t('Viewings scheduled')} value={upcomingViewings.length} icon={CalendarCheck} tone="blue" hint={t('Confirmed property visits')} />
        <StatCard label={t('Completion rate')} value={`${completion}%`} icon={CheckCircle2} tone="green" hint={`${done.length} ${t('of')} ${tasks.length} ${t('tasks')}`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={cn('h-8 shrink-0 rounded-lg border px-3 text-[11px] font-medium transition-colors', tab === x.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
            {t(x.label)}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <SearchInput value={query} onChange={setQuery} placeholder={t('Search tasks…')} className="w-64" />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
                <option value="all">{t('All statuses')}</option>
                <option value="todo">{t('To do')}</option>
                <option value="in_progress">{t('In progress')}</option>
                <option value="done">{t('Done')}</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{filteredTasks.length} {t('tasks')}</span>
              <Button size="sm" variant="outline" onClick={() => openTask()}><Plus /> {t('Add')}</Button>
            </div>
          </div>
          {filteredTasks.length === 0 ? (
            <DataTableEmpty title={t('No tasks match your filters')} description={t('Create a task or adjust the status filter.')} action={<Button size="sm" variant="accent" onClick={() => openTask()}>{t('New task')}</Button>} />
          ) : (
            <div className="divide-y divide-border">
              {filteredTasks.map((task) => {
                const Icon = taskIcons[task.type]
                const isOverdue = task.status !== 'done' && new Date(task.dueDate).getTime() < Date.now()
                return (
                  <div key={task.id} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                    <button onClick={() => markDone(task)} className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors', task.status === 'done' ? 'border-accent bg-accent text-white' : 'border-border text-transparent hover:border-accent')} title={t('Toggle complete')}>
                      <Check className="size-3" />
                    </button>
                    <span className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground', task.status === 'done' && 'opacity-50')}><Icon className="size-3.5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-[13px] font-medium', task.status === 'done' && 'text-muted-foreground line-through')}>{task.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                        <span className={cn('inline-flex items-center gap-1', isOverdue && 'font-medium text-rose-500')}><Clock className="size-2.5" /> {formatDate(task.dueDate, lang, 'dd MMM · HH:mm')}</span>
                        <span>·</span>
                        <span>{employeeName(task.assigneeId)}</span>
                        {task.customerName && <><span>·</span><span>{task.customerName}</span></>}
                        {task.propertyTitle && <><span>·</span><span className="truncate">{task.propertyTitle}</span></>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <StatusBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                      <button onClick={() => openTask(task)} className="hidden rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground group-hover:block">{t('Edit')}</button>
                      <button onClick={() => setConfirmDelete(task)} className="hidden rounded-md p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 group-hover:block"><Trash2 className="size-3.5" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {tab === 'follow-ups' && (
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="text-[13px] font-semibold">{t('Follow-up queue')}</p>
              <p className="text-[10px] text-muted-foreground">{t('Open leads ordered by the next scheduled touchpoint.')}</p>
            </div>
            <div className="divide-y divide-border">
              {followUps.map((lead) => {
                const late = new Date(lead.nextFollowUp).getTime() < Date.now()
                return (
                  <div key={lead.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <Link to={`/crm/leads/${lead.id}`} className="truncate text-[13px] font-medium hover:text-accent">{lead.name}</Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        <span className={cn(late && 'font-medium text-rose-500')}>{late ? t('Overdue') : t('Next')}: {formatDate(lead.nextFollowUp, lang, 'dd MMM · HH:mm')}</span>
                        <span>·</span><span>{lead.location}</span><span>·</span><span>{employeeName(lead.assigneeId)}</span>
                      </p>
                    </div>
                    <StatusBadge status={lead.status} />
                    <Button size="xs" variant="outline" onClick={() => logFollowUp(lead)}><Phone /> {t('Log call')}</Button>
                  </div>
                )
              })}
            </div>
          </Card>
          <Card className="p-4">
            <SectionTitle title={t('Follow-up health')} description={t('Contact discipline across your open book.')} />
            <div className="space-y-4">
              {[
                { label: t('Contacted in last 24h'), value: leads.filter((l) => Date.now() - new Date(l.lastContact).getTime() < 86400000).length, tone: 'accent' as const },
                { label: t('No contact for 3+ days'), value: leads.filter((l) => Date.now() - new Date(l.lastContact).getTime() > 3 * 86400000).length, tone: 'amber' as const },
                { label: t('Overdue follow-up'), value: followUps.filter((l) => new Date(l.nextFollowUp).getTime() < Date.now()).length, tone: 'red' as const },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]"><span className="text-muted-foreground">{row.label}</span><span className="font-semibold">{row.value}</span></div>
                  <Progress value={leads.length ? (row.value / leads.length) * 100 : 0} tone={row.tone} />
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
              {t('Tip: log every call from the lead profile so the timeline and AI scoring stay accurate.')}
            </div>
          </Card>
        </div>
      )}

      {tab === 'calendar' && (
        <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-[14px] font-semibold">{formatDate(month, lang, 'MMMM yyyy')}</p>
                <p className="text-[10px] text-muted-foreground">{t('Tasks, meetings and property viewings')}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon-sm" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="rtl:rotate-180" /></Button>
                <Button size="sm" variant="outline" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSelectedDay(d) }}>{t('Today')}</Button>
                <Button size="icon-sm" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="rtl:rotate-180" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-2">{t(d)}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {calendarCells.map(({ date, current }, i) => {
                const { dayTasks, dayViewings } = eventsForDay(date)
                const selected = isSameDay(date, selectedDay)
                const isToday = isSameDay(date, new Date())
                return (
                  <button key={i} onClick={() => setSelectedDay(date)} className={cn('min-h-[86px] border-b border-e border-border/60 p-1.5 text-start align-top transition-colors hover:bg-muted/40', !current && 'bg-muted/20 text-muted-foreground', selected && 'bg-accent/5 ring-1 ring-inset ring-accent/40')}>
                    <span className={cn('grid size-5 place-items-center rounded-full text-[10px] font-medium', isToday && 'bg-primary text-primary-foreground')}>{date.getDate()}</span>
                    <div className="mt-1 space-y-1">
                      {dayTasks.slice(0, 2).map((x) => <p key={x.id} className="truncate rounded bg-sky-500/10 px-1 py-0.5 text-[8.5px] font-medium text-sky-700 dark:text-sky-300">{x.title}</p>)}
                      {dayViewings.slice(0, 1).map((x) => <p key={x.id} className="truncate rounded bg-emerald-500/10 px-1 py-0.5 text-[8.5px] font-medium text-emerald-700 dark:text-emerald-300">{x.time} · {x.customerName}</p>)}
                      {(dayTasks.length + dayViewings.length) > 3 && <p className="px-1 text-[8px] text-muted-foreground">+{dayTasks.length + dayViewings.length - 3} {t('more')}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
          <Card className="p-4">
            <SectionTitle title={formatDate(selectedDay, lang, 'EEEE dd MMM')} description={`${dayEvents.dayTasks.length + dayEvents.dayViewings.length} ${t('scheduled items')}`} action={<Button size="xs" variant="outline" onClick={() => openTask()}><Plus /> {t('Task')}</Button>} />
            <div className="space-y-2">
              {dayEvents.dayTasks.map((x) => (
                <div key={x.id} className="rounded-lg border border-border p-2.5">
                  <div className="flex items-center gap-2"><span className="text-[10px] font-medium text-muted-foreground">{formatDate(x.dueDate, lang, 'HH:mm')}</span><StatusBadge status={x.priority} /></div>
                  <p className="mt-1 text-[12px] font-medium">{x.title}</p>
                  <p className="text-[10px] text-muted-foreground">{employeeName(x.assigneeId)}</p>
                </div>
              ))}
              {dayEvents.dayViewings.map((v) => (
                <div key={v.id} className="rounded-lg border border-emerald-200/60 bg-emerald-50/50 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                  <div className="flex items-center gap-2"><span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">{v.time}</span><StatusBadge status={v.status} /></div>
                  <p className="mt-1 text-[12px] font-medium">{v.propertyTitle}</p>
                  <p className="text-[10px] text-muted-foreground">{v.customerName} · {employeeName(v.agentId)}</p>
                </div>
              ))}
              {dayEvents.dayTasks.length + dayEvents.dayViewings.length === 0 && (
                <EmptyState icon={CalendarDays} title={t('Nothing scheduled')} description={t('This day is clear. Add a task or schedule a viewing.')} />
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === 'meetings' && (
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{t('Meetings')}</p><p className="text-[10px] text-muted-foreground">{t('Internal reviews and customer meetings.')}</p></div>
          <div className="divide-y divide-border">
            {meetings.map((x) => (
              <div key={x.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-9 place-items-center rounded-lg bg-violet-500/10 text-violet-600"><Video className="size-4" /></span>
                <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{x.title}</p><p className="text-[10px] text-muted-foreground">{formatDate(x.dueDate, lang, 'EEE dd MMM · HH:mm')} · {x.notes ?? t('No agenda notes')}</p></div>
                <UserCell name={employeeName(x.assigneeId)} sub={employees.find((e) => e.id === x.assigneeId)?.title} color={employees.find((e) => e.id === x.assigneeId)?.avatarColor} />
                <StatusBadge status={x.status} />
              </div>
            ))}
            {meetings.length === 0 && <DataTableEmpty title={t('No meetings scheduled')} description={t('Create a meeting task to block time with your team.')} />}
          </div>
        </Card>
      )}

      {tab === 'viewings' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div><p className="text-[13px] font-semibold">{t('Property viewings')}</p><p className="text-[10px] text-muted-foreground">{t('Track confirmations, outcomes and no-shows.')}</p></div>
            <Badge tone="blue">{viewings.filter((v) => v.status === 'scheduled').length} {t('scheduled')}</Badge>
          </div>
          <div className="divide-y divide-border">
            {[...viewings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((v) => (
              <div key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600"><Eye className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{v.propertyTitle}</p>
                  <p className="text-[10px] text-muted-foreground">{v.customerName} · {formatDate(v.date, lang, 'dd MMM yyyy')} {t('at')} {v.time} · {employeeName(v.agentId)}</p>
                </div>
                <StatusBadge status={v.status} />
                <div className="flex items-center gap-1.5">
                  {v.status === 'scheduled' && <>
                    <Button size="xs" variant="outline" onClick={() => updateViewing(v.id, { status: 'completed' })}><Check /> {t('Completed')}</Button>
                    <Button size="xs" variant="ghost" onClick={() => updateViewing(v.id, { status: 'no_show' })}>{t('No-show')}</Button>
                    <Button size="xs" variant="ghost" onClick={() => updateViewing(v.id, { date: new Date(new Date(v.date).getTime() + 86400000).toISOString() })}>{t('Reschedule')}</Button>
                  </>}
                  {v.status !== 'scheduled' && <Button size="xs" variant="ghost" onClick={() => updateViewing(v.id, { status: 'scheduled' })}>{t('Reopen')}</Button>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'calls' && (
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{t('Call and message log')}</p><p className="text-[10px] text-muted-foreground">{t('Logged calls, messages and scheduled callbacks.')}</p></div>
          <div className="divide-y divide-border">
            {calls.map((c) => {
              const Icon = c.type === 'call' ? Phone : c.type === 'whatsapp' ? MessageCircle : Mail
              return (
                <div key={`${c.id}-${c.lead?.id ?? ''}`} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/5 text-primary dark:bg-white/5 dark:text-slate-200"><Icon className="size-3.5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">{c.title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{'lead' in c && c.lead ? `${c.lead.name} · ` : ''}{c.detail}</p>
                  </div>
                  <span className="hidden text-[10px] text-muted-foreground sm:block">{fromNow(c.at, lang)}</span>
                  {'lead' in c && c.lead ? <Link to={`/crm/leads/${c.lead.id}`} className="text-[11px] font-medium text-accent hover:underline">{t('Open lead')}</Link> : <Badge tone="outline">{t('Scheduled')}</Badge>}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {tab === 'timeline' && (
        <Card className="p-5">
          <SectionTitle title={t('Activity timeline')} description={t('Chronological record of customer touchpoints.')} />
          <div className="relative space-y-0 before:absolute before:bottom-2 before:start-[15px] before:top-2 before:w-px before:bg-border">
            {timeline.map((item) => {
              const Icon = activityIcons[item.type] ?? ActivityIcon
              return (
                <div key={`${item.id}-${item.at}`} className="relative flex gap-3 pb-4">
                  <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground"><Icon className="size-3.5" /></span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[12px] font-medium">{item.title}</p>
                      <span className="text-[9px] text-muted-foreground">{fromNow(item.at, lang)}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.detail}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground/80">{item.actor} · {item.source}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <TaskDialog open={taskOpen} onOpenChange={closeTask} task={editing} employees={employeesScoped} companyId={companyId} />
      <ConfirmDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)} title={t('Delete task?')} description={t('This removes the task from the shared activity calendar.')} confirmLabel={t('Delete')} danger onConfirm={() => { if (confirmDelete) deleteTask(confirmDelete.id) }} />
    </div>
  )
}

function TaskDialog({ open, onOpenChange, task, employees, companyId }: { open: boolean; onOpenChange: (v: boolean) => void; task: Task | null; employees: ReturnType<typeof useAppStore.getState>['employees']; companyId: string }) {
  const { t } = useI18n()
  const addTask = useAppStore((s) => s.addTask)
  const updateTask = useAppStore((s) => s.updateTask)
  const [form, setForm] = useState(() => blank(task))

  function blank(x: Task | null) {
    return {
      title: x?.title ?? '',
      type: x?.type ?? 'call',
      priority: x?.priority ?? 'medium',
      status: x?.status ?? 'todo',
      dueDate: x ? x.dueDate.slice(0, 16) : new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      assigneeId: x?.assigneeId ?? employees[0]?.id ?? '',
      customerName: x?.customerName ?? '',
      propertyTitle: x?.propertyTitle ?? '',
      notes: x?.notes ?? '',
      reminder: x?.reminder ?? true,
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = {
      title: form.title.trim(), type: form.type as Task['type'], priority: form.priority as Task['priority'],
      status: form.status as Task['status'], dueDate: new Date(form.dueDate).toISOString(), assigneeId: form.assigneeId,
      customerName: form.customerName || undefined, propertyTitle: form.propertyTitle || undefined,
      notes: form.notes || undefined, reminder: form.reminder,
    }
    if (task) updateTask(task.id, payload)
    else addTask({ id: `tk-${Math.random().toString(36).slice(2, 8)}`, companyId, ...payload })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? t('Edit task') : t('New task')}</DialogTitle>
          <DialogDescription>{t('Tasks appear on the team calendar and the assignee inbox.')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label={t('Task title')} required><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('e.g. Send payment plan to Nada')} required /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('Type')}>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Task['type'] })}>
                {['call', 'whatsapp', 'email', 'meeting', 'viewing', 'document', 'contract', 'payment'].map((x) => <option key={x} value={x}>{t(x.replace(/\b\w/g, (c) => c.toUpperCase()))}</option>)}
              </Select>
            </Field>
            <Field label={t('Priority')}>
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}>
                {['low', 'medium', 'high', 'urgent'].map((x) => <option key={x} value={x}>{t(x.replace(/\b\w/g, (c) => c.toUpperCase()))}</option>)}
              </Select>
            </Field>
            <Field label={t('Due date')} required><Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required /></Field>
            <Field label={t('Assignee')}>
              <Select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </Field>
            <Field label={t('Customer')}><Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder={t('Optional')} /></Field>
            <Field label={t('Property')}><Input value={form.propertyTitle} onChange={(e) => setForm({ ...form, propertyTitle: e.target.value })} placeholder={t('Optional')} /></Field>
          </div>
          <Field label={t('Notes')}><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('Context, agenda or next steps')} /></Field>
          <label className="flex items-center gap-2 text-[12px] text-muted-foreground"><input type="checkbox" checked={form.reminder} onChange={(e) => setForm({ ...form, reminder: e.target.checked })} className="size-4 accent-[#10B981]" /> {t('Send a reminder 30 minutes before')}</label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
            <Button type="submit" variant="accent">{task ? t('Save changes') : t('Create task')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
