import { useState } from 'react'
import {
  ArrowRight, Bolt, CheckCircle2, Clock, GitBranch, GitPullRequest, Pause, Play, Plus, Settings2,
  Sparkles, Trash2, Workflow as WorkflowIcon, Zap,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/appStore'
import { useTab } from '@/lib/useTab'
import { cn } from '@/lib/utils'
import { fromNow } from '@/lib/format'
import { mockApi } from '@/services/mockApi'
import { PageHeader, StatCard, SectionTitle, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/misc'
import type { Workflow } from '@/types'

const triggers = ['New lead created', 'Lead status changed', 'Lead score updated', 'Viewing completed', 'Deal stage changed', 'Payment due', 'No activity for 14 days', 'Cooperation accepted', 'Ticket created']
const actionTypes = ['Assign employee', 'Create task', 'Send message', 'Send email', 'Add tag', 'Change status', 'Notify manager', 'Create approval request']
const conditionFields = ['Lead source', 'Lead score', 'Lead status', 'Property type', 'Deal value', 'Location', 'Assigned agent', 'Ticket category']
const operators = ['equals', 'not equals', 'greater than', 'less than', 'contains', 'is empty']

export function AutomationPage() {
  const { t, lang } = useI18n()
  const { tab, setTab } = useTab('workflows')
  const companyId = useAppStore((s) => s.activeCompanyId)
  const workflows = useAppStore(useShallow((s) => s.workflows.filter((w) => w.companyId === s.activeCompanyId)))
  const updateWorkflow = useAppStore((s) => s.updateWorkflow)
  const addWorkflow = useAppStore((s) => s.addWorkflow)
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const toast = useAppStore((s) => s.toast)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Workflow | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [routing, setRouting] = useState({ roundRobin: true, scoreThreshold: 70, duplicateCheck: true, slaMinutes: 15, newLeadAlert: true, viewingReminder: true })
  const [detail, setDetail] = useState<Workflow | null>(null)

  const enabled = workflows.filter((w) => w.enabled).length
  const totalRuns = workflows.reduce((s, w) => s + w.runs, 0)
  const lastRun = workflows.map((w) => w.lastRun).sort().reverse()[0]

  const runTest = async (wf: Workflow) => {
    setTesting(wf.id)
    await mockApi.save()
    updateWorkflow(wf.id, { runs: wf.runs + 1, lastRun: new Date().toISOString() })
    setTesting(null)
    toast('Test run completed', `${wf.name} matched 3 demo records and ran ${wf.actions.length} actions.`, 'info')
  }

  return (
    <div>
      <PageHeader
        title={t('Automation & AI')}
        description={t('Automate lead routing, follow-ups and handoffs without writing code.')}
        eyebrow={<><WorkflowIcon className="size-3.5 text-accent" /> {t('CRM')} · {t('Automation')}</>}
        actions={<Button variant="accent" onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus /> {t('New workflow')}</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Active workflows')} value={enabled} icon={Zap} hint={`${workflows.length} ${t('total')}`} />
        <StatCard label={t('Automation runs')} value={totalRuns.toLocaleString()} icon={Bolt} tone="green" hint={t('All time demo runs')} />
        <StatCard label={t('Last execution')} value={lastRun ? fromNow(lastRun, lang) : '—'} icon={Clock} tone="blue" />
        <StatCard label={t('Time saved')} value={`${Math.round(totalRuns * 3.5 / 60)}h`} icon={Sparkles} tone="purple" hint={t('Estimated from 3.5 min per run')} />
      </div>

      <div className="mb-4 flex items-center gap-1.5">
        {[{ id: 'workflows', label: 'Workflow Builder' }, { id: 'rules', label: 'Automation Rules' }].map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={cn('h-8 rounded-lg border px-3 text-[11px] font-medium transition-colors', tab === x.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>{t(x.label)}</button>
        ))}
      </div>

      {tab === 'workflows' && (
        <div className="grid gap-3 xl:grid-cols-2">
          {workflows.map((wf) => (
            <Card key={wf.id} className={cn('flex flex-col p-4', !wf.enabled && 'opacity-80')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', wf.enabled ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground')}><WorkflowIcon className="size-4" /></span>
                  <div>
                    <p className="text-[13px] font-semibold">{wf.name}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{wf.description}</p>
                  </div>
                </div>
                <Switch checked={wf.enabled} onCheckedChange={(v) => { updateWorkflow(wf.id, { enabled: v }); toast(v ? 'Workflow enabled' : 'Workflow paused', wf.name, 'info') }} />
              </div>

              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <Badge tone="navy"><Zap className="size-2.5" /> {t('Trigger')}</Badge>
                  <span className="font-medium">{t(wf.trigger)}</span>
                  <ArrowRight className="size-3 text-muted-foreground rtl:rotate-180" />
                  {wf.conditions.length > 0 && <><Badge tone="outline">{wf.conditions.length} {t('conditions')}</Badge><ArrowRight className="size-3 text-muted-foreground rtl:rotate-180" /></>}
                  <Badge tone="green">{wf.actions.length} {t('actions')}</Badge>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Bolt className="size-3" /> {wf.runs} {t('runs')}</span>
                <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {t('Last run')} {fromNow(wf.lastRun, lang)}</span>
                <span className={cn('inline-flex items-center gap-1', wf.enabled ? 'text-emerald-600' : 'text-muted-foreground')}><span className={cn('size-1.5 rounded-full', wf.enabled ? 'bg-emerald-500' : 'bg-border')} /> {wf.enabled ? t('Active') : t('Paused')}</span>
              </div>

              <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3">
                <Button size="xs" variant="outline" onClick={() => { setEditing(wf); setDialogOpen(true) }}><Settings2 /> {t('Edit')}</Button>
                <Button size="xs" variant="ghost" onClick={() => runTest(wf)} disabled={testing === wf.id}>{testing === wf.id ? <Pause /> : <Play />} {testing === wf.id ? t('Running…') : t('Test run')}</Button>
                <Button size="xs" variant="ghost" onClick={() => setDetail(wf)}><GitBranch /> {t('View logic')}</Button>
                <Button size="xs" variant="ghost" className="ms-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => { updateWorkflow(wf.id, { enabled: false }); toast('Workflow archived', `${wf.name} is now paused.`, 'info') }}><Trash2 /> {t('Archive')}</Button>
              </div>
            </Card>
          ))}
          {workflows.length === 0 && <Card className="xl:col-span-2"><EmptyState icon={WorkflowIcon} title={t('No workflows yet')} description={t('Create your first automation to route leads and follow up automatically.')} action={<Button size="sm" variant="accent" onClick={() => setDialogOpen(true)}>{t('New workflow')}</Button>} /></Card>}
        </div>
      )}

      {tab === 'rules' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{t('Operational rules')}</p><p className="text-[10px] text-muted-foreground">{t('These guards apply to every workflow and manual action.')}</p></div>
            <div className="divide-y divide-border">
              {[
                { key: 'autoAssign' as const, label: 'Automatic lead assignment', detail: 'Route new leads to the next agent with capacity in the matching territory.', value: settings.autoAssign, onChange: (v: boolean) => updateSettings({ autoAssign: v }) },
                { key: 'roundRobin' as const, label: 'Round-robin distribution', detail: 'Balance new leads evenly across available agents before falling back to score-based routing.', value: routing.roundRobin, onChange: (v: boolean) => setRouting({ ...routing, roundRobin: v }) },
                { key: 'duplicateCheck' as const, label: 'Duplicate detection', detail: 'Block imports and manual entry when phone or email matches an existing lead.', value: routing.duplicateCheck, onChange: (v: boolean) => setRouting({ ...routing, duplicateCheck: v }) },
                { key: 'newLeadAlert' as const, label: 'Instant new-lead alert', detail: 'Notify the assigned agent and manager as soon as a lead is created.', value: routing.newLeadAlert, onChange: (v: boolean) => setRouting({ ...routing, newLeadAlert: v }) },
                { key: 'viewingReminder' as const, label: 'Viewing reminders', detail: 'Send an SMS-style demo reminder 24 hours and 1 hour before a viewing.', value: routing.viewingReminder, onChange: (v: boolean) => setRouting({ ...routing, viewingReminder: v }) },
              ].map((rule) => (
                <div key={rule.key} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div><p className="text-[12px] font-medium">{t(rule.label)}</p><p className="mt-0.5 max-w-md text-[10.5px] leading-relaxed text-muted-foreground">{t(rule.detail)}</p></div>
                  <Switch checked={rule.value} onCheckedChange={(v) => { rule.onChange(v); toast('Rule updated', `${rule.label} is now ${v ? 'on' : 'off'}.`, 'info') }} />
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="p-4">
              <SectionTitle title={t('Routing thresholds')} description={t('Applied during automatic assignment.')} />
              <div className="space-y-4">
                <Field label={t('Minimum qualifying score')} hint={`${routing.scoreThreshold} / 100`}>
                  <input type="range" min={0} max={100} value={routing.scoreThreshold} onChange={(e) => setRouting({ ...routing, scoreThreshold: Number(e.target.value) })} className="w-full accent-[#10B981]" />
                </Field>
                <Field label={t('First-response SLA (minutes)')} hint={t('Creates an overdue alert when breached.')}>
                  <Input type="number" min={1} value={routing.slaMinutes} onChange={(e) => setRouting({ ...routing, slaMinutes: Number(e.target.value) })} />
                </Field>
                <Button size="sm" variant="accent" className="w-full" onClick={() => { toast('Routing rules saved', `Score threshold ${routing.scoreThreshold}, SLA ${routing.slaMinutes} minutes.`); }}>{t('Save routing rules')}</Button>
              </div>
            </Card>
            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold"><GitPullRequest className="size-3.5 text-accent" /> {t('Approval policy')}</p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">{t('Discounts above 5% and off-plan reservations require a manager approval. Approval requests appear in Sales Operations.')}</p>
              <div className="mt-3 flex items-center gap-2 text-[10px]"><CheckCircle2 className="size-3.5 text-emerald-500" /> {t('Policy active for all 9 agents')}</div>
            </Card>
          </div>
        </div>
      )}

      <WorkflowDialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null) }} workflow={editing} companyId={companyId} />

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
            <DialogDescription>{detail?.description}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <FlowStep tone="navy" label={t('Trigger')} value={t(detail.trigger)} icon={Zap} />
              {detail.conditions.map((c, i) => <FlowStep key={i} tone="amber" label={i === 0 ? t('Conditions') : t('And')} value={`${c.field} ${c.operator} ${c.value}`} icon={GitBranch} />)}
              {detail.actions.map((a, i) => <FlowStep key={i} tone="green" label={i === 0 ? t('Actions') : t('Then')} value={`${a.type}: ${a.value}`} icon={Bolt} />)}
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-[10.5px] leading-relaxed text-muted-foreground">
                {t('This builder is a visual simulation. No background jobs or external messages are executed in the demo.')}
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetail(null)}>{t('Close')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FlowStep({ tone, label, value, icon: Icon }: { tone: 'navy' | 'amber' | 'green'; label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
      <span className={cn('grid size-7 shrink-0 place-items-center rounded-md', tone === 'navy' && 'bg-primary/10 text-primary dark:bg-white/10 dark:text-white', tone === 'amber' && 'bg-amber-500/10 text-amber-600', tone === 'green' && 'bg-emerald-500/10 text-emerald-600')}><Icon className="size-3.5" /></span>
      <div><p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="text-[12px] font-medium">{value}</p></div>
    </div>
  )
}

function WorkflowDialog({ open, onOpenChange, workflow, companyId }: { open: boolean; onOpenChange: (v: boolean) => void; workflow: Workflow | null; companyId: string }) {
  const { t } = useI18n()
  const addWorkflow = useAppStore((s) => s.addWorkflow)
  const updateWorkflow = useAppStore((s) => s.updateWorkflow)
  const [form, setForm] = useState(() => blank(workflow))

  function blank(w: Workflow | null) {
    return {
      name: w?.name ?? '', description: w?.description ?? '', trigger: w?.trigger ?? triggers[0],
      conditionField: w?.conditions[0]?.field ?? conditionFields[0], conditionOperator: w?.conditions[0]?.operator ?? operators[0], conditionValue: w?.conditions[0]?.value ?? '',
      actionType: w?.actions[0]?.type ?? actionTypes[0], actionValue: w?.actions[0]?.value ?? '', enabled: w?.enabled ?? true,
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(), description: form.description.trim() || 'Custom automation created in the CRM builder.',
      trigger: form.trigger,
      conditions: form.conditionValue ? [{ field: form.conditionField, operator: form.conditionOperator, value: form.conditionValue }] : [],
      actions: [{ type: form.actionType, value: form.actionValue || 'Default demo action' }],
      enabled: form.enabled,
    }
    if (workflow) updateWorkflow(workflow.id, payload)
    else addWorkflow({ id: `wf-${Math.random().toString(36).slice(2, 8)}`, companyId, runs: 0, lastRun: new Date().toISOString(), ...payload })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{workflow ? t('Edit workflow') : t('New workflow')}</DialogTitle>
          <DialogDescription>{t('Define a trigger, an optional condition and the actions to run.')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label={t('Workflow name')} required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('e.g. Weekend viewing follow-up')} required /></Field>
          <Field label={t('Description')}><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('What should this automation achieve?')} rows={2} /></Field>
          <Field label={t('Trigger')}>
            <Select value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}>{triggers.map((x) => <option key={x}>{t(x)}</option>)}</Select>
          </Field>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('Condition (optional)')}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <Select value={form.conditionField} onChange={(e) => setForm({ ...form, conditionField: e.target.value })}>{conditionFields.map((x) => <option key={x}>{x}</option>)}</Select>
              <Select value={form.conditionOperator} onChange={(e) => setForm({ ...form, conditionOperator: e.target.value })}>{operators.map((x) => <option key={x}>{x}</option>)}</Select>
              <Input value={form.conditionValue} onChange={(e) => setForm({ ...form, conditionValue: e.target.value })} placeholder={t('Value')} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('Action')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value })}>{actionTypes.map((x) => <option key={x}>{t(x)}</option>)}</Select>
              <Input value={form.actionValue} onChange={(e) => setForm({ ...form, actionValue: e.target.value })} placeholder={t('e.g. Notify sales manager')} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="size-4 accent-[#10B981]" /> {t('Enable immediately')}</label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
            <Button type="submit" variant="accent">{workflow ? t('Save workflow') : t('Create workflow')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
