import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, BrainCircuit, Building2, CalendarClock, Check, ChevronRight, Clock, FileText, Flame,
  Handshake, Mail, MapPin, MessageCircle, Phone, Plus, Send, Sparkles, StickyNote, Trash2, TrendingUp,
  UserCog, Wallet,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/appStore'
import { formatDate, formatEGP, formatArea, fromNow } from '@/lib/format'
import { sourceLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { Lead } from '@/types'
import { PageHeader, InfoRow, SectionTitle, UserCell } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input, Select, Textarea, Field } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, ConfirmDialog } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown'
import { Avatar, EmptyState, Progress } from '@/components/ui/misc'
import { LeadFormDialog } from './LeadsPage'

const activityIcons: Record<string, string> = { call: 'Call', whatsapp: 'WhatsApp', email: 'Email', meeting: 'Meeting', viewing: 'Viewing', note: 'Note', status: 'Status', system: 'System', task: 'Task' }

export function LeadDetailPage() {
  const { id } = useParams()
  const { t } = useI18n()
  const navigate = useNavigate()
  const lead = useAppStore((s) => s.leads.find((l) => l.id === id))
  const employees = useAppStore((s) => s.employees)
  const companyProperties = useAppStore(useShallow((s) => s.properties.filter((p) => p.companyId === s.activeCompanyId && p.status === 'available')))
  const tasks = useAppStore((s) => s.tasks)
  const updateLead = useAppStore((s) => s.updateLead)
  const addLeadNote = useAppStore((s) => s.addLeadNote)
  const addLeadActivity = useAppStore((s) => s.addLeadActivity)
  const convertLead = useAppStore((s) => s.convertLead)
  const deleteLeads = useAppStore((s) => s.deleteLeads)
  const addTask = useAppStore((s) => s.addTask)
  const updateTask = useAppStore((s) => s.updateTask)
  const toast = useAppStore((s) => s.toast)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [propertyId, setPropertyId] = useState('')
  const [note, setNote] = useState('')
  const [activityType, setActivityType] = useState<Lead['activities'][number]['type']>('call')
  const [activityTitle, setActivityTitle] = useState('')
  const [activityDetail, setActivityDetail] = useState('')
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [taskOpen, setTaskOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDue, setTaskDue] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  const [taskType, setTaskType] = useState<'call' | 'whatsapp' | 'email' | 'meeting' | 'viewing' | 'document'>('call')

  const relatedTasks = tasks.filter((x) => x.companyId === lead?.companyId && x.customerName === lead?.name && x.status !== 'done')
  const matches = useMemo(() => lead ? companyProperties.filter((p) => p.price <= lead.budgetMax * 1.08 && p.price >= lead.budgetMin * 0.85).slice(0, 4) : [], [companyProperties, lead])

  if (!lead) {
    return (
      <div>
        <PageHeader title={t('Lead not found')} description={t('This lead may have been deleted from the demo workspace.')} actions={<Button variant="outline" onClick={() => navigate('/crm/leads')}><ArrowLeft className="size-4 rtl:rotate-180" /> {t('Back to leads')}</Button>} />
        <Card><EmptyState icon={UserCog} title={t('No lead with this ID')} description={t('Choose another lead from the inbox to view its timeline.')} /></Card>
      </div>
    )
  }

  const owner = employees.find((e) => e.id === lead.assigneeId)

  const submitNote = () => {
    if (note.trim().length < 3) { toast('Note is too short', 'Add at least a few words before saving.', 'error'); return }
    addLeadNote(lead.id, note.trim(), 'You')
    toast('Note added', 'Your team can see this note on the lead timeline.')
    setNote('')
  }

  const submitActivity = () => {
    if (!activityTitle.trim()) { toast('Add an activity title', 'Describe what happened in one line.', 'error'); return }
    addLeadActivity(lead.id, activityType, activityTitle.trim(), activityDetail.trim() || 'Logged from the lead profile.', 'You')
    setActivityTitle(''); setActivityDetail('')
  }

  const scheduleFollowUp = () => {
    if (!followUpDate) return
    updateLead(lead.id, { nextFollowUp: new Date(followUpDate).toISOString() })
    addLeadActivity(lead.id, 'status', 'Follow-up scheduled', `Next follow-up set for ${formatDate(followUpDate)}.`, 'You')
    toast('Follow-up scheduled', formatDate(followUpDate, 'en', 'EEEE, dd MMM'))
    setFollowUpOpen(false)
  }

  const saveTask = () => {
    if (!taskTitle.trim()) { toast('Task title required', 'Describe the next step.', 'error'); return }
    addTask({
      id: `tk${Math.random().toString(36).slice(2, 8)}`, companyId: lead.companyId, title: taskTitle.trim(), type: taskType,
      priority: lead.priority, status: 'todo', dueDate: new Date(`${taskDue}T09:00:00`).toISOString(),
      assigneeId: lead.assigneeId, customerName: lead.name, reminder: true,
    })
    toast('Task created', `${taskTitle.trim()} is assigned to ${owner?.name ?? 'the lead owner'}.`)
    setTaskTitle(''); setTaskOpen(false)
  }

  const convert = () => {
    if (!propertyId) { toast('Choose a property', 'Select the property being offered to this lead.', 'error'); return }
    const deal = convertLead(lead.id, propertyId)
    if (deal) { setConvertOpen(false); navigate('/crm/pipeline?tab=deals') }
  }

  return (
    <div>
      <button onClick={() => navigate('/crm/leads')} className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5 rtl:rotate-180" /> {t('All leads')}</button>

      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center">
        <Avatar name={lead.name} color={owner?.avatarColor} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-[-0.02em]">{lead.name}</h1>
            <StatusBadge status={lead.status} dot />
            <Badge tone={lead.priority === 'urgent' ? 'red' : lead.priority === 'high' ? 'amber' : 'outline'}>{t(lead.priority)}</Badge>
            {lead.score >= 75 && <Badge tone="green"><Flame className="size-3" /> {t('Hot')} · {lead.score}</Badge>}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {lead.location}</span>
            <span className="inline-flex items-center gap-1"><Wallet className="size-3" /> {formatEGP(lead.budgetMin, 'en', true)} – {formatEGP(lead.budgetMax, 'en', true)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {t('Created')} {fromNow(lead.createdAt)}</span>
            <span>· {sourceLabel[lead.source]}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <a href={`tel:${lead.phone.replace(/\s/g, '')}`}><Button variant="outline" size="sm"><Phone className="size-3.5" /> {t('Call')}</Button></a>
          <Button variant="outline" size="sm" onClick={() => { setActivityType('whatsapp'); toast('WhatsApp composer ready', 'Log the outgoing message below to keep the timeline accurate.', 'info') }}><MessageCircle className="size-3.5" /> {t('WhatsApp')}</Button>
          <Button size="sm" onClick={() => setConvertOpen(true)}><Handshake className="size-3.5" /> {t('Convert')}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><ChevronRight className="size-4 rotate-90" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{t('Lead actions')}</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setEditOpen(true)}><FileText /> {t('Edit details')}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { setTaskOpen(true) }}><Plus /> {t('Create task')}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { setFollowUpDate(lead.nextFollowUp.slice(0, 10)); setFollowUpOpen(true) }}><CalendarClock /> {t('Reschedule follow-up')}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate(`/crm/inbox?customer=${encodeURIComponent(lead.name)}`)}><MessageCircle /> {t('Open conversation')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onSelect={() => setDeleteOpen(true)}><Trash2 /> {t('Delete lead')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle title={t('Lead summary')} description={t('What this buyer is looking for.')} action={<Button variant="outline" size="xs" onClick={() => setEditOpen(true)}>{t('Edit')}</Button>} />
            <div className="grid gap-x-6 sm:grid-cols-2">
              <div className="divide-y divide-border">
                <InfoRow label={t('Phone')} value={<span dir="ltr">{lead.phone}</span>} />
                <InfoRow label={t('Email')} value={<span dir="ltr">{lead.email}</span>} />
                <InfoRow label={t('Property type')} value={<span className="capitalize">{lead.propertyType}</span>} />
                <InfoRow label={t('Preferred area')} value={lead.preferredArea} />
              </div>
              <div className="divide-y divide-border">
                <InfoRow label={t('Budget')} value={`${formatEGP(lead.budgetMin, 'en', true)} – ${formatEGP(lead.budgetMax, 'en', true)}`} />
                <InfoRow label={t('Payment')} value={<span className="capitalize">{lead.paymentPreference}</span>} />
                <InfoRow label={t('Next follow-up')} value={formatDate(lead.nextFollowUp, 'en', 'dd MMM, HH:mm')} />
                <InfoRow label={t('Last contact')} value={fromNow(lead.lastContact)} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {lead.tags.map((tag) => <Badge key={tag} tone="outline">{tag}</Badge>)}
              {lead.campaign && <Badge tone="purple">{lead.campaign}</Badge>}
            </div>
            {lead.lostReason && <div className="mt-3 rounded-lg border border-rose-200/60 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"><strong>{t('Lost reason')}:</strong> {lead.lostReason}</div>}
          </Card>

          <Card className="p-5">
            <SectionTitle title={t('Activity timeline')} description={t('Calls, messages, viewings and system events.')} />
            <div className="mb-4 rounded-xl border border-border bg-muted/30 p-3">
              <div className="grid gap-2 sm:grid-cols-[130px_1fr]">
                <Select value={activityType} onChange={(e) => setActivityType(e.target.value as Lead['activities'][number]['type'])}>
                  {Object.entries(activityIcons).filter(([k]) => !['system', 'status', 'note'].includes(k)).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
                </Select>
                <Input value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} placeholder={t('What happened? e.g. Discovery call completed')} />
              </div>
              <Textarea value={activityDetail} onChange={(e) => setActivityDetail(e.target.value)} rows={2} placeholder={t('Add context, objections or agreed next steps…')} className="mt-2" />
              <div className="mt-2 flex justify-end"><Button size="xs" onClick={submitActivity}><Plus className="size-3" /> {t('Log activity')}</Button></div>
            </div>
            <div className="relative space-y-4 before:absolute before:bottom-2 before:start-[15px] before:top-2 before:w-px before:bg-border">
              {lead.activities.map((activity) => (
                <div key={activity.id} className="relative flex gap-3 ps-0">
                  <span className={cn('relative z-10 grid size-8 shrink-0 place-items-center rounded-full border bg-card text-[9px] font-semibold', activity.type === 'call' ? 'border-sky-200 text-sky-600 dark:border-sky-500/30' : activity.type === 'viewing' ? 'border-emerald-200 text-emerald-600 dark:border-emerald-500/30' : activity.type === 'system' ? 'border-border text-muted-foreground' : 'border-violet-200 text-violet-600 dark:border-violet-500/30')}>
                    {activity.type.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-medium">{activity.title}</p><Badge tone="default" className="text-[9px]">{t(activityIcons[activity.type] ?? activity.type)}</Badge></div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{activity.detail}</p>
                    <p className="mt-1 text-[9px] text-muted-foreground/80">{activity.actor} · {fromNow(activity.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle title={t('Notes')} description={t('Internal notes visible to your team only.')} />
            <div className="flex gap-2">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t('Write a note about budget, preferences or next steps…')} />
              <Button className="h-auto shrink-0 flex-col gap-1 px-3" onClick={submitNote}><StickyNote className="size-4" /><span className="text-[10px]">{t('Add')}</span></Button>
            </div>
            <div className="mt-4 space-y-3">
              {lead.notes.length === 0 && <p className="text-[11px] text-muted-foreground">{t('No notes yet.')}</p>}
              {lead.notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-medium">{n.author}</p><span className="text-[9px] text-muted-foreground">{fromNow(n.at)}</span></div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{n.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle title={t('Ownership')} />
            <Field label={t('Assigned to')}>
              <Select value={lead.assigneeId} onChange={(e) => { updateLead(lead.id, { assigneeId: e.target.value }); toast('Lead reassigned', `Now owned by ${employees.find((x) => x.id === e.target.value)?.name}.`) }}>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </Field>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Field label={t('Status')}>
                <Select value={lead.status} onChange={(e) => updateLead(lead.id, { status: e.target.value as Lead['status'] })}>
                  {['new', 'contacted', 'qualified', 'interested', 'viewing', 'negotiation', 'won', 'lost'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </Select>
              </Field>
              <Field label={t('Priority')}>
                <Select value={lead.priority} onChange={(e) => updateLead(lead.id, { priority: e.target.value as Lead['priority'] })}>
                  {['low', 'medium', 'high', 'urgent'].map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => { setFollowUpDate(lead.nextFollowUp.slice(0, 10)); setFollowUpOpen(true) }}><CalendarClock className="size-3.5" /> {t('Set next follow-up')}</Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><BrainCircuit className="size-4 text-accent" /><h3 className="text-[13px] font-semibold">{t('AI lead score')}</h3></div><Badge tone={lead.score >= 75 ? 'green' : lead.score >= 50 ? 'amber' : 'default'}>{lead.score}/100</Badge></div>
            <Progress value={lead.score} tone={lead.score >= 75 ? 'accent' : 'amber'} className="mt-3" />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{lead.score >= 75 ? t('High intent signals: recent replies, verified budget and active viewing history. Prioritise a same-day call.') : t('Engagement is moderate. Recommend a curated shortlist and a scheduled follow-up within 48 hours.')}</p>
            <div className="mt-3 space-y-1.5 text-[10px] text-muted-foreground">
              <p className="flex items-center justify-between"><span>{t('Budget confidence')}</span><span className="font-medium text-foreground">{Math.min(98, Math.round(lead.budgetMax / 200000))}%</span></p>
              <p className="flex items-center justify-between"><span>{t('Engagement')}</span><span className="font-medium text-foreground">{Math.min(96, 40 + lead.activities.length * 8)}%</span></p>
              <p className="flex items-center justify-between"><span>{t('Source quality')}</span><span className="font-medium text-foreground">{lead.source === 'referral' || lead.source === 'broker' ? 'High' : 'Medium'}</span></p>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle title={t('Next actions')} action={<Button size="icon-sm" variant="outline" onClick={() => setTaskOpen(true)}><Plus className="size-3.5" /></Button>} />
            <div className="space-y-2">
              {relatedTasks.length === 0 && <p className="text-[11px] text-muted-foreground">{t('No open tasks. Create one to keep momentum.')}</p>}
              {relatedTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
                  <button onClick={() => { updateTask(task.id, { status: 'done' }); toast('Task completed', task.title) }} className="mt-0.5 grid size-4 shrink-0 place-items-center rounded border border-border hover:border-accent hover:bg-accent/10"><Check className="size-2.5 text-accent" /></button>
                  <div className="min-w-0 flex-1"><p className="text-[11px] font-medium leading-snug">{task.title}</p><p className="text-[9px] text-muted-foreground">{formatDate(task.dueDate, 'en', 'dd MMM, HH:mm')} · {task.type}</p></div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle title={t('Matching inventory')} description={t('Available properties inside this budget.')} />
            <div className="space-y-2.5">
              {matches.length === 0 && <p className="text-[11px] text-muted-foreground">{t('No available inventory matches this budget right now.')}</p>}
              {matches.map((p) => (
                <Link key={p.id} to={`/properties/${p.id}`} className="flex items-center gap-2.5 rounded-lg border border-border p-2 transition-colors hover:bg-muted/40">
                  <img src={p.images[0]} alt="" className="size-11 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium">{p.title}</p><p className="text-[9px] text-muted-foreground">{formatEGP(p.price, 'en', true)} · {formatArea(p.area)} · {p.location}</p></div>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground rtl:rotate-180" />
                </Link>
              ))}
            </div>
            <Button className="mt-3 w-full" size="sm" onClick={() => setConvertOpen(true)}><TrendingUp className="size-3.5" /> {t('Create opportunity')}</Button>
          </Card>
        </div>
      </div>

      <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} employees={employees} defaultAssignee={lead.assigneeId} />

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Convert to opportunity')}</DialogTitle>
            <DialogDescription>{t('Choose the property being offered to')} {lead.name}. {t('A qualified deal will be created in the pipeline.')}</DialogDescription>
          </DialogHeader>
          <Field label={t('Property')} required>
            <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
              <option value="">{t('Select an available property')}</option>
              {companyProperties.map((p) => <option key={p.id} value={p.id}>{p.title} — {formatEGP(p.price, 'en', true)}</option>)}
            </Select>
          </Field>
          <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">
            <p className="flex justify-between"><span>{t('Lead')}</span><span className="font-medium text-foreground">{lead.name}</span></p>
            <p className="mt-1 flex justify-between"><span>{t('Budget')}</span><span className="font-medium text-foreground">{formatEGP(lead.budgetMax, 'en', true)}</span></p>
            <p className="mt-1 flex justify-between"><span>{t('Owner')}</span><span className="font-medium text-foreground">{owner?.name}</span></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={convert}><Sparkles className="size-3.5" /> {t('Convert lead')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('Schedule follow-up')}</DialogTitle><DialogDescription>{t('Pick the next date to contact')} {lead.name}.</DialogDescription></DialogHeader>
          <Field label={t('Date')}><Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} /></Field>
          <DialogFooter><Button variant="outline" onClick={() => setFollowUpOpen(false)}>{t('Cancel')}</Button><Button onClick={scheduleFollowUp} disabled={!followUpDate}>{t('Save')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('Create task')}</DialogTitle><DialogDescription>{t('Add a next step to the lead and assign it to its owner.')}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Field label={t('Task title')} required><Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder={t('e.g. Send payment plan and shortlist')} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t('Type')}><Select value={taskType} onChange={(e) => setTaskType(e.target.value as typeof taskType)}>{['call', 'whatsapp', 'email', 'meeting', 'viewing', 'document'].map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
              <Field label={t('Due date')}><Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} /></Field>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTaskOpen(false)}>{t('Cancel')}</Button><Button onClick={saveTask}><Plus className="size-3.5" /> {t('Create task')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title={t('Delete this lead?')} description={`${lead.name} ${t('and their activity timeline will be removed from the demo workspace.')}`} confirmLabel={t('Delete lead')} danger onConfirm={() => { deleteLeads([lead.id]); navigate('/crm/leads') }} />
    </div>
  )
}
