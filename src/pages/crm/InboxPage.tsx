import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Bot, CheckCheck, FileText, Globe2, Mail, MessageCircle, MessagesSquare, Phone, Plus,
  Search, Send, Sparkles, StickyNote, UserPlus, Users, Wand2, X,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/appStore'
import { useTab } from '@/lib/useTab'
import { cn } from '@/lib/utils'
import { fromNow } from '@/lib/format'
import { mockApi } from '@/services/mockApi'
import { PageHeader, SearchInput, SectionTitle, UserCell, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Avatar } from '@/components/ui/misc'

const channelIcons = { whatsapp: MessageCircle, email: Mail, chat: Globe2 } as const

const tabs = [
  { id: 'all', label: 'Unified Inbox' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Emails' },
  { id: 'chat', label: 'Website Chat' },
  { id: 'calls', label: 'Call History' },
  { id: 'templates', label: 'Message Templates' },
  { id: 'notes', label: 'Internal Notes' },
]

const defaultTemplates = [
  { id: 'mt1', name: 'Viewing confirmation', channel: 'WhatsApp', body: 'Hi {{customer}}, your viewing for {{property}} is confirmed for {{date}} at {{time}}. Our consultant {{agent}} will meet you at the main entrance.' },
  { id: 'mt2', name: 'Payment plan brochure', channel: 'Email', body: 'Dear {{customer}}, thank you for your interest in {{property}}. Attached is the full payment plan with the 10% down payment option over 8 years. I am happy to walk you through the numbers.' },
  { id: 'mt3', name: 'New launch invitation', channel: 'WhatsApp', body: '{{customer}}, as a valued client you are invited to the private launch of our new phase in {{location}} this Thursday. Reply YES and I will reserve two seats for you.' },
  { id: 'mt4', name: 'Follow-up after viewing', channel: 'WhatsApp', body: 'Hi {{customer}}, it was a pleasure showing you {{property}} yesterday. Would you like me to hold the unit for 48 hours while you decide?' },
]

export function InboxPage() {
  const { t, lang } = useI18n()
  const { tab, setTab } = useTab('all')
  const [params, setParams] = useSearchParams()
  const role = useAppStore((s) => s.role)
  const companyId = useAppStore((s) => s.activeCompanyId)
  const conversationsAll = useAppStore((s) => s.conversations)
  const employees = useAppStore(useShallow((s) => s.employees.filter((e) => e.companyId === s.activeCompanyId)))
  const leads = useAppStore(useShallow((s) => s.leads.filter((l) => l.companyId === s.activeCompanyId)))
  const tasks = useAppStore(useShallow((s) => s.tasks.filter((x) => x.companyId === s.activeCompanyId)))
  const sendMessage = useAppStore((s) => s.sendMessage)
  const addInternalNote = useAppStore((s) => s.addInternalNote)
  const markConversationRead = useAppStore((s) => s.markConversationRead)
  const assignConversation = useAppStore((s) => s.assignConversation)
  const convertConversation = useAppStore((s) => s.convertConversation)
  const toast = useAppStore((s) => s.toast)

  const agentId = role === 'agent' ? 'e3' : undefined
  const conversations = useMemo(() => conversationsAll.filter((c) => c.companyId === companyId && (!agentId || c.assigneeId === agentId)), [conversationsAll, companyId, agentId])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(() => params.get('c') ?? conversations[0]?.id ?? '')
  const [draft, setDraft] = useState('')
  const [internal, setInternal] = useState(false)
  const [templates, setTemplates] = useState(defaultTemplates)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [template, setTemplate] = useState({ name: '', channel: 'WhatsApp', body: '' })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations
      .filter((c) => tab === 'all' || tab === 'notes' || c.channel === tab)
      .filter((c) => !q || `${c.customerName} ${c.lastMessage} ${c.phone}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
  }, [conversations, tab, query])

  const selected = conversations.find((c) => c.id === selectedId) ?? filtered[0]
  const selectedLead = selected ? leads.find((l) => l.name === selected.customerName) : undefined
  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unassigned'
  const employeeColor = (id: string) => employees.find((e) => e.id === id)?.avatarColor

  const select = (id: string) => {
    setSelectedId(id)
    markConversationRead(id)
    const p = new URLSearchParams(params)
    p.set('c', id)
    setParams(p, { replace: true })
  }

  const send = async () => {
    if (!selected || !draft.trim()) return
    const text = draft.trim()
    setDraft('')
    if (internal) addInternalNote(selected.id, text)
    else {
      sendMessage(selected.id, text)
      await mockApi.sendMessageSimulated()
      toast('Message sent', `Delivered to ${selected.customerName} in this demo.`)
    }
  }

  const unread = conversations.reduce((s, c) => s + c.unread, 0)
  const waiting = conversations.filter((c) => c.status === 'pending').length
  const closed = conversations.filter((c) => c.status === 'closed').length

  const callLog = useMemo(() => {
    const logged = leads.flatMap((l) => l.activities.filter((a) => a.type === 'call').map((a) => ({ id: a.id, name: l.name, leadId: l.id, title: a.title, detail: a.detail, at: a.at, actor: a.actor })))
    const planned = tasks.filter((x) => x.type === 'call').map((x) => ({ id: x.id, name: x.customerName ?? 'Internal', leadId: undefined as string | undefined, title: x.title, detail: `Scheduled with ${employeeName(x.assigneeId)}`, at: x.dueDate, actor: employeeName(x.assigneeId) }))
    return [...logged, ...planned].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [leads, tasks])

  const notes = useMemo(() => conversations.flatMap((c) => c.messages.filter((m) => m.channel === 'note').map((m) => ({ ...m, conversation: c }))), [conversations])

  const useTemplate = (body: string) => {
    const name = selected?.customerName.split(' ')[0] ?? 'there'
    setDraft(body.replace(/\{\{customer\}\}/g, name).replace(/\{\{property\}\}/g, 'Skyline 3BR Garden Apartment').replace(/\{\{date\}\}/g, 'Saturday').replace(/\{\{time\}\}/g, '12:30').replace(/\{\{agent\}\}/g, 'Youssef Adel').replace(/\{\{location\}\}/g, 'New Cairo'))
    setTab('all')
  }

  const saveTemplate = () => {
    if (!template.name.trim() || !template.body.trim()) return
    setTemplates((prev) => [{ id: `mt-${Math.random().toString(36).slice(2, 7)}`, ...template }, ...prev])
    setTemplate({ name: '', channel: 'WhatsApp', body: '' })
    setTemplateOpen(false)
    toast('Template saved', 'Your team can use it from the composer in this demo.')
  }

  return (
    <div>
      <PageHeader
        title={t('Communication Center')}
        description={t('WhatsApp, email, website chat and internal notes in a single agent workspace.')}
        eyebrow={<><MessagesSquare className="size-3.5 text-accent" /> {t('CRM')} · {t('Unified Inbox')}</>}
        actions={<Button variant="accent" onClick={() => setTemplateOpen(true)}><Plus /> {t('New template')}</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t('Open conversations'), value: conversations.filter((c) => c.status !== 'closed').length, icon: MessagesSquare, tone: 'blue' },
          { label: t('Unread messages'), value: unread, icon: MessageCircle, tone: 'amber' },
          { label: t('Waiting on us'), value: waiting, icon: CheckCheck, tone: 'purple' },
          { label: t('Resolved'), value: closed, icon: CheckCheck, tone: 'green' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center justify-between p-4">
            <div><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p><p className="mt-1 text-[20px] font-semibold">{s.value}</p></div>
            <span className={cn('grid size-9 place-items-center rounded-lg', s.tone === 'blue' && 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400', s.tone === 'amber' && 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', s.tone === 'purple' && 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400', s.tone === 'green' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400')}><s.icon className="size-4" /></span>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={cn('h-8 shrink-0 rounded-lg border px-3 text-[11px] font-medium transition-colors', tab === x.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>{t(x.label)}</button>
        ))}
      </div>

      {(tab === 'all' || tab === 'whatsapp' || tab === 'email' || tab === 'chat' || tab === 'notes') && (
        <Card className="overflow-hidden">
          <div className="grid min-h-[620px] lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_280px]">
            <div className="border-b border-border lg:border-b-0 lg:border-e">
              <div className="border-b border-border p-3"><SearchInput value={query} onChange={setQuery} placeholder={t('Search conversations…')} /></div>
              <div className="thin-scrollbar max-h-[560px] overflow-y-auto">
                {filtered.map((c) => {
                  const Icon = channelIcons[c.channel]
                  return (
                    <button key={c.id} onClick={() => select(c.id)} className={cn('flex w-full items-start gap-2.5 border-b border-border/60 px-3 py-3 text-start transition-colors hover:bg-muted/40', selected?.id === c.id && 'bg-accent/5 shadow-[inset_2px_0_0_#10B981]')}>
                      <span className="relative">
                        <Avatar name={c.customerName} color={c.avatarColor} size="sm" />
                        <span className="absolute -bottom-0.5 -end-0.5 grid size-4 place-items-center rounded-full border border-card bg-muted text-muted-foreground"><Icon className="size-2.5" /></span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[12px] font-medium">{c.customerName}</span>
                          <span className="shrink-0 text-[8.5px] text-muted-foreground">{fromNow(c.lastAt, lang)}</span>
                        </span>
                        <span className="mt-0.5 line-clamp-1 block text-[10.5px] text-muted-foreground">{c.lastMessage}</span>
                        <span className="mt-1 flex items-center gap-1.5">
                          <StatusBadge status={c.status} />
                          {c.unread > 0 && <span className="grid size-4 place-items-center rounded-full bg-accent text-[8px] font-bold text-white">{c.unread}</span>}
                        </span>
                      </span>
                    </button>
                  )
                })}
                {filtered.length === 0 && <EmptyState icon={Search} title={t('No conversations')} description={t('Try another channel or search term.')} />}
              </div>
            </div>

            <div className="flex min-w-0 flex-col">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
                    <Avatar name={selected.customerName} color={selected.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{selected.customerName}</p>
                      <p className="text-[10px] text-muted-foreground" dir="ltr">{selected.phone} · {selected.channel}</p>
                    </div>
                    <Select value={selected.assigneeId} onChange={(e) => assignConversation(selected.id, e.target.value)} className="h-8 w-36 text-[11px]">
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </Select>
                    {selectedLead ? (
                      <Button size="xs" variant="outline" asChild><Link to={`/crm/leads/${selectedLead.id}`}>{t('Open lead')} <ArrowRight className="rtl:rotate-180" /></Link></Button>
                    ) : (
                      <Button size="xs" variant="accent" onClick={() => convertConversation(selected.id)}><UserPlus /> {t('Create lead')}</Button>
                    )}
                  </div>

                  <div className="thin-scrollbar flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4" style={{ maxHeight: 430 }}>
                    {selected.messages.map((m) => {
                      const note = m.channel === 'note'
                      return (
                        <div key={m.id} className={cn('flex', m.sender === 'agent' ? 'justify-end' : 'justify-start')}>
                          <div className={cn('max-w-[82%] rounded-xl px-3 py-2 text-[12px] leading-relaxed shadow-sm', note ? 'border border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200' : m.sender === 'agent' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card')}>
                            {note && <p className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300"><StickyNote className="size-2.5" /> {t('Internal note')}</p>}
                            <p>{m.text}</p>
                            <p className={cn('mt-1 text-[8.5px]', m.sender === 'agent' && !note ? 'text-primary-foreground/60' : 'text-muted-foreground')}>{fromNow(m.at, lang)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="border-t border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setInternal(false)} className={cn('rounded-md px-2 py-1 text-[10px] font-medium', !internal ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted')}>{t('Reply')}</button>
                        <button onClick={() => setInternal(true)} className={cn('rounded-md px-2 py-1 text-[10px] font-medium', internal ? 'bg-amber-500/10 text-amber-600' : 'text-muted-foreground hover:bg-muted')}>{t('Internal note')}</button>
                      </div>
                      <button onClick={() => useTemplate(templates[0]?.body ?? '')} className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"><Wand2 className="size-3" /> {t('Use template')}</button>
                    </div>
                    <div className="flex items-end gap-2">
                      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder={internal ? t('Write a note for your team…') : t('Write a reply…')} className="min-h-[46px] resize-none" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
                      <Button variant="accent" onClick={send} disabled={!draft.trim()}><Send className="rtl:rotate-180" /></Button>
                    </div>
                    <p className="mt-1.5 text-[9px] text-muted-foreground">{t('Demo only — messages are simulated and never leave the browser.')}</p>
                  </div>
                </>
              ) : (
                <EmptyState icon={MessagesSquare} title={t('Select a conversation')} description={t('Pick a conversation from the list to reply.')} />
              )}
            </div>

            {selected && (
              <div className="hidden border-s border-border xl:block">
                <div className="border-b border-border p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('Customer context')}</p>
                  <div className="mt-3"><UserCell name={selected.customerName} sub={selected.phone} color={selected.avatarColor} /></div>
                  <div className="mt-3 space-y-2 text-[11px]">
                    <p className="flex justify-between"><span className="text-muted-foreground">{t('Owner')}</span><span className="font-medium">{employeeName(selected.assigneeId)}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">{t('Channel')}</span><span className="font-medium capitalize">{selected.channel}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">{t('Status')}</span><StatusBadge status={selected.status} /></p>
                    {selectedLead && <p className="flex justify-between"><span className="text-muted-foreground">{t('Lead score')}</span><span className="font-semibold text-accent">{selectedLead.score}</span></p>}
                  </div>
                </div>
                <div className="p-4">
                  <div className="rounded-xl border border-violet-200/60 bg-violet-50/60 p-3 dark:border-violet-500/20 dark:bg-violet-500/5">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300"><Sparkles className="size-3.5" /> {t('AI summary')}</p>
                    <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">{selected.aiSummary}</p>
                    <p className="mt-2 text-[8.5px] text-muted-foreground/80">{t('Simulated insight — no external AI service is called.')}</p>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => { useTemplate('Hi {{customer}}, based on your preferences I have shortlisted three homes in {{location}}. Shall I send the brochure?'); }}><Wand2 /> {t('Draft a reply')}</Button>
                    <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => setTab('templates')}><FileText /> {t('Browse templates')}</Button>
                    <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => { if (selectedLead) { navigator.clipboard?.writeText(`/crm/leads/${selectedLead.id}`); toast('Lead link copied', 'Open it from the command palette or All Leads.', 'info') } else convertConversation(selected.id) }}><Link2Icon /> {selectedLead ? t('Copy lead link') : t('Create lead record')}</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'calls' && (
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{t('Call history')}</p><p className="text-[10px] text-muted-foreground">{t('Logged calls from leads and scheduled callbacks.')}</p></div>
          <div className="divide-y divide-border">
            {callLog.map((c) => (
              <div key={`${c.id}-${c.at}`} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-8 place-items-center rounded-full bg-sky-500/10 text-sky-600"><Phone className="size-3.5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium">{c.name} · {c.title}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{c.detail}</p>
                </div>
                <span className="hidden text-[10px] text-muted-foreground sm:block">{fromNow(c.at, lang)}</span>
                {c.leadId ? <Link to={`/crm/leads/${c.leadId}`} className="text-[11px] font-medium text-accent hover:underline">{t('Open lead')}</Link> : <Badge tone="outline">{t('Scheduled')}</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'templates' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] text-muted-foreground">{templates.length} {t('approved message templates')}</p>
            <Button size="sm" variant="accent" onClick={() => setTemplateOpen(true)}><Plus /> {t('New template')}</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((x) => (
              <Card key={x.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-[13px] font-semibold">{x.name}</p><Badge tone="outline" className="mt-1">{x.channel}</Badge></div>
                  <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"><FileText className="size-4" /></span>
                </div>
                <p className="mt-3 flex-1 rounded-lg border border-border bg-muted/30 p-2.5 text-[11px] leading-relaxed text-muted-foreground">{x.body}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="xs" variant="accent" onClick={() => useTemplate(x.body)}>{t('Use template')}</Button>
                  <Button size="xs" variant="ghost" onClick={() => toast('Template duplicated', `${x.name} copy created in this demo.`, 'info')}>{t('Duplicate')}</Button>
                  <Button size="xs" variant="ghost" onClick={() => { setTemplates((prev) => prev.filter((tpl) => tpl.id !== x.id)); toast('Template deleted', x.name, 'info') }}>{t('Delete')}</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3"><p className="text-[13px] font-semibold">{t('Internal notes')}</p><p className="text-[10px] text-muted-foreground">{t('Private context shared only with your team.')}</p></div>
          <div className="divide-y divide-border">
            {notes.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600"><StickyNote className="size-3.5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px]">{n.text}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground">{n.conversation.customerName} · {fromNow(n.at, lang)}</p>
                </div>
                <Button size="xs" variant="ghost" onClick={() => { setTab('all'); select(n.conversationId) }}>{t('Open thread')}</Button>
              </div>
            ))}
            {notes.length === 0 && <EmptyState icon={StickyNote} title={t('No internal notes yet')} description={t('Switch to Internal note in any conversation to add context for the team.')} />}
          </div>
        </Card>
      )}

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('New message template')}</DialogTitle>
            <DialogDescription>{t('Variables like {{customer}} are replaced when the template is used.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label={t('Template name')} required><Input value={template.name} onChange={(e) => setTemplate({ ...template, name: e.target.value })} placeholder={t('e.g. Weekend viewing invite')} /></Field>
            <Field label={t('Channel')}>
              <Select value={template.channel} onChange={(e) => setTemplate({ ...template, channel: e.target.value })}>
                {['WhatsApp', 'Email', 'Website chat'].map((x) => <option key={x}>{x}</option>)}
              </Select>
            </Field>
            <Field label={t('Template content')} required hint={'{{customer}} · {{property}} · {{location}} · {{date}} · {{time}} · {{agent}}'}>
              <Textarea value={template.body} onChange={(e) => setTemplate({ ...template, body: e.target.value })} placeholder={t('Write the message…')} rows={5} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateOpen(false)}>{t('Cancel')}</Button>
            <Button variant="accent" onClick={saveTemplate} disabled={!template.name.trim() || !template.body.trim()}>{t('Save template')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Link2Icon() {
  return <ArrowRight className="size-4 rtl:rotate-180" />
}
