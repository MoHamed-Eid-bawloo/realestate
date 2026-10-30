import { useState } from 'react'
import {
  Activity, Database, Flag, GitBranch, GitPullRequest, LockKeyhole, Plus, Save, Settings as SettingsIcon,
  Trash2, Users, ArrowUp, ArrowDown, Bell, Percent, Check,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/appStore'
import { useTab } from '@/lib/useTab'
import { cn } from '@/lib/utils'
import { PageHeader, SectionTitle, EmptyState, UserCell } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/input'
import { Switch, Progress } from '@/components/ui/misc'
import { pipelineStages } from '@/data/seed'

const tabs = [
  { id: 'general', label: 'CRM Settings', icon: SettingsIcon },
  { id: 'fields', label: 'Custom Fields', icon: Database },
  { id: 'pipelines', label: 'Custom Pipelines', icon: GitBranch },
  { id: 'statuses', label: 'Lead Statuses', icon: Flag },
  { id: 'activities', label: 'Activity Types', icon: Activity },
  { id: 'assignment', label: 'Assignment Rules', icon: GitPullRequest },
  { id: 'roles', label: 'Roles & Permissions', icon: LockKeyhole },
]

const allPermissions = ['Leads', 'Deals', 'Inventory', 'Reports', 'Team management', 'Billing', 'Roles & permissions', 'Approvals', 'Support']

export function CrmSettingsPage() {
  const { t } = useI18n()
  const { tab, setTab } = useTab('general')
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const addCustomField = useAppStore((s) => s.addCustomField)
  const removeCustomField = useAppStore((s) => s.removeCustomField)
  const addCommissionRule = useAppStore((s) => s.addCommissionRule)
  const removeCommissionRule = useAppStore((s) => s.removeCommissionRule)
  const rolePermissions = useAppStore((s) => s.rolePermissions)
  const company = useAppStore((s) => s.companies.find((c) => c.id === s.activeCompanyId))
  const employees = useAppStore(useShallow((s) => s.employees.filter((e) => e.companyId === s.activeCompanyId)))
  const toast = useAppStore((s) => s.toast)

  const [fieldOpen, setFieldOpen] = useState(false)
  const [commOpen, setCommOpen] = useState(false)
  const [field, setField] = useState({ entity: 'Lead', label: '', type: 'Text', required: false })
  const [comm, setComm] = useState({ name: '', pct: 2.5, appliesTo: 'Primary sales' })
  const [statuses, setStatuses] = useState([
    { id: 'new', label: 'New', color: '#0EA5E9', active: true },
    { id: 'contacted', label: 'Contacted', color: '#F59E0B', active: true },
    { id: 'qualified', label: 'Qualified', color: '#10B981', active: true },
    { id: 'interested', label: 'Interested', color: '#8B5CF6', active: true },
    { id: 'viewing', label: 'Viewing', color: '#14B8A6', active: true },
    { id: 'negotiation', label: 'Negotiation', color: '#F97316', active: true },
    { id: 'won', label: 'Won', color: '#059669', active: true },
    { id: 'lost', label: 'Lost', color: '#F43F5E', active: true },
  ])
  const [pipelines, setPipelines] = useState([
    { id: 'primary', name: 'Primary sales', stages: ['New', 'Qualified', 'Proposal', 'Negotiation', 'Reservation', 'Won'], active: true },
    { id: 'resale', name: 'Resale', stages: ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won'], active: true },
    { id: 'rental', name: 'Rental', stages: ['New', 'Qualified', 'Viewing', 'Offer', 'Won'], active: true },
    { id: 'commercial', name: 'Commercial', stages: ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won'], active: false },
    { id: 'developer', name: 'Developer sales', stages: ['New', 'Qualified', 'Unit hold', 'Reservation', 'Contract', 'Won'], active: true },
  ])
  const [pipelineName, setPipelineName] = useState('')
  const [permissionState, setPermissionState] = useState<Record<string, string[]>>(() => Object.fromEntries(rolePermissions.map((r) => [r.role, r.permissions])))

  const [autoAssign, setAutoAssign] = useState(settings.autoAssign)
  const [roundRobin, setRoundRobin] = useState(true)
  const [scoreRouting, setScoreRouting] = useState(true)
  const [sla, setSla] = useState(15)

  const saveGeneral = () => {
    updateSettings({ autoAssign })
    toast('CRM settings saved', 'Workspace configuration was updated in this demo.')
  }

  const addStatus = () => {
    const label = window.prompt('New lead status name')
    if (!label?.trim()) return
    setStatuses((prev) => [...prev, { id: label.toLowerCase().replace(/\s+/g, '_'), label: label.trim(), color: '#64748B', active: true }])
    toast('Status added', `${label} is now available in lead forms.`)
  }

  const moveStatus = (index: number, dir: -1 | 1) => {
    const next = [...statuses]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setStatuses(next)
  }

  const addPipeline = () => {
    if (!pipelineName.trim()) return
    setPipelines((prev) => [...prev, { id: pipelineName.toLowerCase().replace(/\s+/g, '-'), name: pipelineName.trim(), stages: ['New', 'Qualified', 'Proposal', 'Won'], active: true }])
    setPipelineName('')
    toast('Pipeline created', 'Add stages and assign it to teams in this demo.')
  }

  return (
    <div>
      <PageHeader
        title={t('CRM Configuration')}
        description={t('Tailor fields, pipelines, statuses, routing and permissions to your agency.')}
        eyebrow={<><SettingsIcon className="size-3.5 text-accent" /> {t('CRM')} · {t('Settings')}</>}
        actions={<Button variant="accent" onClick={saveGeneral}><Save /> {t('Save changes')}</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition-colors', tab === x.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}><x.icon className="size-3.5" /> {t(x.label)}</button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <Card className="p-4">
              <SectionTitle title={t('Workspace defaults')} description={company?.name} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('Currency')}><Select value={settings.currency} onChange={(e) => { updateSettings({ currency: e.target.value }); toast('Currency updated', `New records will display in ${e.target.value}.`, 'info') }}>{['EGP', 'AED', 'SAR', 'USD'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
                <Field label={t('Default lead owner')}><Select defaultValue="round-robin"><option value="round-robin">{t('Round-robin')}</option><option value="manager">{t('Sales manager')}</option><option value="team">{t('Team pool')}</option></Select></Field>
                <Field label={t('Week starts on')}><Select defaultValue="sunday"><option value="sunday">{t('Sunday')}</option><option value="monday">{t('Monday')}</option></Select></Field>
                <Field label={t('Working hours')}><Select defaultValue="9-6"><option value="9-6">09:00 – 18:00</option><option value="10-7">10:00 – 19:00</option></Select></Field>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-3">
                <div><p className="text-[12px] font-medium">{t('Automatic lead assignment')}</p><p className="text-[10px] text-muted-foreground">{t('New leads are routed to the next agent with capacity.')}</p></div>
                <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
              </div>
            </Card>
            <Card className="p-4">
              <SectionTitle title={t('Notification preferences')} description={t('Demo notifications stay inside the app.')} />
              <div className="space-y-1">
                {([
                  ['email', 'Email notifications', 'Daily summaries and assignment alerts.'],
                  ['whatsapp', 'WhatsApp alerts', 'Simulated lead and viewing alerts.'],
                  ['push', 'In-app push', 'Real-time toast notifications inside the CRM.'],
                  ['digest', 'Weekly digest', 'Pipeline and performance summary every Sunday.'],
                ] as const).map(([key, label, detail]) => (
                  <div key={key} className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
                    <div><p className="text-[12px] font-medium">{t(label)}</p><p className="text-[10px] text-muted-foreground">{t(detail)}</p></div>
                    <Switch checked={settings.notificationPrefs[key]} onCheckedChange={(v) => updateSettings({ notificationPrefs: { ...settings.notificationPrefs, [key]: v } })} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between"><SectionTitle title={t('Commission rules')} description={t('Default percentages for new deals.')} /><Button size="xs" variant="outline" onClick={() => setCommOpen(true)}><Plus /> {t('Add')}</Button></div>
              <div className="space-y-2">
                {settings.commissionRules.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                    <span className="grid size-7 place-items-center rounded-md bg-emerald-500/10 text-emerald-600"><Percent className="size-3.5" /></span>
                    <div className="min-w-0 flex-1"><p className="truncate text-[11.5px] font-medium">{r.name}</p><p className="text-[9px] text-muted-foreground">{r.appliesTo}</p></div>
                    <span className="text-[12px] font-semibold">{r.pct}%</span>
                    <button onClick={() => removeCommissionRule(r.id)} className="text-muted-foreground hover:text-rose-600"><Trash2 className="size-3.5" /></button>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold"><Bell className="size-3.5 text-accent" /> {t('Demo configuration')}</p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">{t('Changes are saved to your workspace in Supabase and are visible to your team.')}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[12px] font-semibold">{t('Workspace usage')}</p>
              <div className="mt-3 space-y-3">
                {[{ label: t('Seats'), value: employees.length, max: 15 }, { label: t('Custom fields'), value: settings.customFields.length, max: 20 }, { label: t('Automation rules'), value: 5, max: 10 }].map((x) => (
                  <div key={x.label}><div className="mb-1 flex justify-between text-[10px]"><span className="text-muted-foreground">{x.label}</span><span className="font-medium">{x.value} / {x.max}</span></div><Progress value={(x.value / x.max) * 100} /></div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'fields' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div><p className="text-[13px] font-semibold">{t('Custom fields')}</p><p className="text-[10px] text-muted-foreground">{t('Extend leads, customers and deals with agency-specific data.')}</p></div>
            <Button size="sm" variant="accent" onClick={() => setFieldOpen(true)}><Plus /> {t('New field')}</Button>
          </div>
          <div className="divide-y divide-border">
            {settings.customFields.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Database className="size-3.5" /></span>
                <div className="min-w-0 flex-1"><p className="text-[12px] font-medium">{f.label}</p><p className="text-[10px] text-muted-foreground">{f.entity} · {f.type}</p></div>
                {f.required && <Badge tone="amber">{t('Required')}</Badge>}
                <Badge tone="outline">{f.type}</Badge>
                <button onClick={() => { removeCustomField(f.id); toast('Field removed', f.label, 'info') }} className="text-muted-foreground hover:text-rose-600"><Trash2 className="size-4" /></button>
              </div>
            ))}
            {settings.customFields.length === 0 && <EmptyState icon={Database} title={t('No custom fields')} description={t('Add a field to capture extra information on leads or deals.')} action={<Button size="sm" variant="accent" onClick={() => setFieldOpen(true)}>{t('New field')}</Button>} />}
          </div>
        </Card>
      )}

      {tab === 'pipelines' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-end gap-2">
              <Field label={t('New pipeline')} className="flex-1"><Input value={pipelineName} onChange={(e) => setPipelineName(e.target.value)} placeholder={t('e.g. Off-plan launches')} /></Field>
              <Button variant="accent" onClick={addPipeline} disabled={!pipelineName.trim()}><Plus /> {t('Create pipeline')}</Button>
            </div>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            {pipelines.map((p) => (
              <Card key={p.id} className={cn('p-4', !p.active && 'opacity-70')}>
                <div className="flex items-start justify-between">
                  <div><p className="text-[13px] font-semibold">{p.name}</p><p className="text-[10px] text-muted-foreground">{p.stages.length} {t('stages')}</p></div>
                  <Switch checked={p.active} onCheckedChange={(v) => { setPipelines((prev) => prev.map((x) => x.id === p.id ? { ...x, active: v } : x)); toast(v ? 'Pipeline enabled' : 'Pipeline paused', p.name, 'info') }} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  {p.stages.map((s, i) => (
                    <span key={s} className="flex items-center gap-1">
                      <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[9px] font-medium">{t(s)}</span>
                      {i < p.stages.length - 1 && <span className="text-[9px] text-muted-foreground">→</span>}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-[9px] text-muted-foreground">{t('Used by')} {p.id === 'primary' ? '9' : p.id === 'developer' ? '4' : '2'} {t('agents')}</span>
                  <button onClick={() => { toast('Pipeline duplicated', `${p.name} copy created in this demo.`, 'info') }} className="text-[10px] font-medium text-accent hover:underline">{t('Duplicate')}</button>
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('Default CRM stages')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pipelineStages.map((s) => <Badge key={s.id} tone="outline">{t(s.label)}</Badge>)}
            </div>
          </Card>
        </div>
      )}

      {tab === 'statuses' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div><p className="text-[13px] font-semibold">{t('Lead statuses')}</p><p className="text-[10px] text-muted-foreground">{t('Reorder the lifecycle used across pipeline and reports.')}</p></div>
            <Button size="sm" variant="accent" onClick={addStatus}><Plus /> {t('Add status')}</Button>
          </div>
          <div className="divide-y divide-border">
            {statuses.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-5 text-[10px] text-muted-foreground">{i + 1}</span>
                <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                <div className="min-w-0 flex-1"><p className="text-[12px] font-medium">{s.label}</p><p className="text-[9px] text-muted-foreground">{s.id}</p></div>
                <Badge tone={s.active ? 'green' : 'default'}>{s.active ? t('Active') : t('Hidden')}</Badge>
                <Switch checked={s.active} onCheckedChange={(v) => setStatuses((prev) => prev.map((x) => x.id === s.id ? { ...x, active: v } : x))} />
                <button onClick={() => moveStatus(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
                <button onClick={() => moveStatus(i, 1)} disabled={i === statuses.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'activities' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <SectionTitle title={t('Activity types')} description={t('Used in tasks, logging and automation.')} action={<Button size="xs" variant="outline" onClick={() => { const label = window.prompt('New activity type'); if (label?.trim()) { updateSettings({ activityTypes: [...settings.activityTypes, label.trim()] }); toast('Activity type added', label.trim()) } }}><Plus /> {t('Add')}</Button>} />
            <div className="flex flex-wrap gap-2">
              {settings.activityTypes.map((a) => (
                <span key={a} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-[11px]">
                  {t(a)}
                  <button onClick={() => { updateSettings({ activityTypes: settings.activityTypes.filter((x) => x !== a) }); toast('Activity type removed', a, 'info') }} className="text-muted-foreground hover:text-rose-600"><Trash2 className="size-3" /></button>
                </span>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <SectionTitle title={t('Activity SLAs')} description={t('Reminder and escalation defaults.')} />
            <div className="space-y-3">
              {[['First call after new lead', 15], ['Follow-up after viewing', 24], ['Payment reminder before due date', 3], ['Recycle inactive lead', 14]].map(([label, days]) => (
                <div key={String(label)} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                  <p className="text-[11.5px]">{t(String(label))}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">{String(label).includes('call') ? t('minutes') : t('days')}<span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">{days}</span></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'assignment' && (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card className="p-4">
            <SectionTitle title={t('Assignment rules')} description={t('Control how new leads reach agents.')} />
            <div className="space-y-1">
              {[
                { label: t('Enable automatic assignment'), value: autoAssign, onChange: setAutoAssign },
                { label: t('Round-robin between agents'), value: roundRobin, onChange: setRoundRobin },
                { label: t('Route by lead score'), value: scoreRouting, onChange: setScoreRouting },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-border/60 py-2.5 last:border-0">
                  <p className="text-[12px]">{r.label}</p>
                  <Switch checked={r.value} onCheckedChange={r.onChange} />
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label={t('First-response SLA (minutes)')}><Input type="number" value={sla} onChange={(e) => setSla(Number(e.target.value))} /></Field>
              <Field label={t('Unassigned lead alerts')}><Select defaultValue="15"><option value="15">{t('After 15 minutes')}</option><option value="30">{t('After 30 minutes')}</option><option value="60">{t('After 1 hour')}</option></Select></Field>
            </div>
            <Button className="mt-4" variant="accent" onClick={() => { updateSettings({ autoAssign }); toast('Assignment rules saved', `SLA ${sla} minutes · round-robin ${roundRobin ? 'on' : 'off'}.`) }}><Save /> {t('Save assignment rules')}</Button>
          </Card>
          <Card className="p-4">
            <SectionTitle title={t('Agent capacity')} description={t('Maximum active leads per consultant.')} />
            <div className="space-y-2.5">
              {employees.filter((e) => e.role === 'agent').map((e) => {
                const capacity = 40
                const load = Math.min(capacity, e.leadsAssigned)
                return (
                  <div key={e.id}>
                    <div className="mb-1 flex items-center justify-between"><UserCell name={e.name} sub={e.title} color={e.avatarColor} /><span className="text-[10px] text-muted-foreground">{load}/{capacity}</span></div>
                    <Progress value={(load / capacity) * 100} tone={load / capacity > 0.85 ? 'red' : load / capacity > 0.65 ? 'amber' : 'accent'} />
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'roles' && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{t('Roles & permissions')}</p><p className="text-[10px] text-muted-foreground">{t('Toggle what each role can access in this demo.')}</p></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-[11px]">
                <thead><tr className="bg-muted/30 text-[9px] uppercase tracking-wide text-muted-foreground"><th className="px-4 py-2 text-start font-semibold">{t('Permission')}</th>{rolePermissions.map((r) => <th key={r.role} className="px-3 py-2 text-center font-semibold">{t(r.role)}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {allPermissions.map((perm) => (
                    <tr key={perm} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{t(perm)}</td>
                      {rolePermissions.map((r) => {
                        const active = permissionState[r.role]?.includes(perm) || permissionState[r.role]?.includes('All modules')
                        return (
                          <td key={r.role} className="px-3 py-2 text-center">
                            <button
                              onClick={() => setPermissionState((prev) => ({ ...prev, [r.role]: prev[r.role]?.includes(perm) ? prev[r.role].filter((p) => p !== perm) : [...(prev[r.role] ?? []), perm] }))}
                              className={cn('mx-auto grid size-5 place-items-center rounded border transition-colors', active ? 'border-accent bg-accent text-white' : 'border-border text-transparent hover:border-accent/50')}
                              title={t('Toggle permission')}
                            ><Check className="size-3" /></button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-[10px] text-muted-foreground">{employees.length} {t('members across')} {rolePermissions.length} {t('roles')}</p>
              <Button size="sm" variant="accent" onClick={() => toast('Permissions saved', 'Role matrix updated for this demo session.')}><Save /> {t('Save permissions')}</Button>
            </div>
          </Card>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rolePermissions.map((r) => (
              <Card key={r.role} className="p-4">
                <div className="flex items-center justify-between"><p className="text-[12.5px] font-semibold">{t(r.role)}</p><Badge tone="outline">{r.members} {t('members')}</Badge></div>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{t(r.description)}</p>
                <div className="mt-2.5 flex flex-wrap gap-1">{(permissionState[r.role] ?? r.permissions).slice(0, 5).map((p) => <span key={p} className="rounded bg-muted px-1.5 py-0.5 text-[8.5px] text-muted-foreground">{t(p)}</span>)}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={fieldOpen} onOpenChange={setFieldOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('New custom field')}</DialogTitle><DialogDescription>{t('Custom fields appear on the selected record form.')}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Field label={t('Field label')} required><Input value={field.label} onChange={(e) => setField({ ...field, label: e.target.value })} placeholder={t('e.g. Move-in timeline')} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Entity')}><Select value={field.entity} onChange={(e) => setField({ ...field, entity: e.target.value })}>{['Lead', 'Customer', 'Deal', 'Property'].map((x) => <option key={x}>{x}</option>)}</Select></Field>
              <Field label={t('Field type')}><Select value={field.type} onChange={(e) => setField({ ...field, type: e.target.value })}>{['Text', 'Number', 'Select', 'Date', 'Checkbox'].map((x) => <option key={x}>{x}</option>)}</Select></Field>
            </div>
            <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={field.required} onChange={(e) => setField({ ...field, required: e.target.checked })} className="size-4 accent-[#10B981]" /> {t('Required field')}</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldOpen(false)}>{t('Cancel')}</Button>
            <Button variant="accent" disabled={!field.label.trim()} onClick={() => { addCustomField({ id: `cf-${Math.random().toString(36).slice(2, 7)}`, ...field, label: field.label.trim() }); setField({ entity: 'Lead', label: '', type: 'Text', required: false }); setFieldOpen(false) }}>{t('Add field')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={commOpen} onOpenChange={setCommOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('Commission rule')}</DialogTitle><DialogDescription>{t('Applied to new deals matching the scope.')}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Field label={t('Rule name')} required><Input value={comm.name} onChange={(e) => setComm({ ...comm, name: e.target.value })} placeholder={t('e.g. Off-plan partner')} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Percentage')} required><Input type="number" step="0.25" value={comm.pct} onChange={(e) => setComm({ ...comm, pct: Number(e.target.value) })} /></Field>
              <Field label={t('Applies to')}><Select value={comm.appliesTo} onChange={(e) => setComm({ ...comm, appliesTo: e.target.value })}>{['Primary sales', 'Resale', 'Rentals', 'Broker cooperation', 'Developer sales'].map((x) => <option key={x}>{x}</option>)}</Select></Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommOpen(false)}>{t('Cancel')}</Button>
            <Button variant="accent" disabled={!comm.name.trim()} onClick={() => { addCommissionRule({ id: `cr-${Math.random().toString(36).slice(2, 7)}`, ...comm, name: comm.name.trim() }); setComm({ name: '', pct: 2.5, appliesTo: 'Primary sales' }); setCommOpen(false) }}>{t('Save rule')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
