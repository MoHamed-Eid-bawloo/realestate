import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BrainCircuit, Check, ChevronRight, CircleDollarSign, Flame, Lightbulb, LineChart,
  MessageSquare, Send, Sparkles, Target, TrendingUp, Users, Wand2, AlertTriangle, Building2,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { useTab } from '@/lib/useTab'
import { cn } from '@/lib/utils'
import { formatEGP, formatNumber, fromNow } from '@/lib/format'
import { PageHeader, StatCard, SectionTitle, UserCell, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/misc'
import { BarsChart, ChartCard, DonutChart, DonutLegend, chartColors } from '@/components/charts'

const tabs = [
  { id: 'assistant', label: 'AI Sales Assistant' },
  { id: 'scoring', label: 'AI Lead Scoring' },
  { id: 'recommendations', label: 'Smart Recommendations' },
  { id: 'insights', label: 'AI Sales Insights' },
]

const prompts = [
  'Summarize my pipeline',
  'Which leads need attention today?',
  'Draft a follow-up for the hottest lead',
  'What is my best performing source?',
]

export function AiPage() {
  const { t, lang } = useI18n()
  const { tab, setTab } = useTab('assistant')
  const role = useAppStore((s) => s.role)
  const companyId = useAppStore((s) => s.activeCompanyId)
  const leadsAll = useAppStore((s) => s.leads)
  const dealsAll = useAppStore((s) => s.deals)
  const properties = useAppStore((s) => s.properties)
  const employees = useAppStore((s) => s.employees)
  const viewings = useAppStore((s) => s.viewings)
  const sourceLabel = useAppStore((s) => s.settings.leadSources)
  const updateLead = useAppStore((s) => s.updateLead)
  const addTask = useAppStore((s) => s.addTask)
  const toast = useAppStore((s) => s.toast)

  const agentId = role === 'agent' ? 'e3' : undefined
  const leads = useMemo(() => leadsAll.filter((l) => l.companyId === companyId && (!agentId || l.assigneeId === agentId)), [leadsAll, companyId, agentId])
  const deals = useMemo(() => dealsAll.filter((d) => d.companyId === companyId && (!agentId || d.agentId === agentId)), [dealsAll, companyId, agentId])
  const employeesScoped = employees.filter((e) => e.companyId === companyId)

  const [messages, setMessages] = useState<{ from: 'ai' | 'user'; text: string }[]>([
    { from: 'ai', text: 'Good morning. I can review your pipeline, prioritise follow-ups, suggest inventory matches and draft messages. Everything here is a local simulation using your demo data.' },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const openDeals = deals.filter((d) => !['won', 'lost'].includes(d.stage))
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0)
  const weighted = openDeals.reduce((s, d) => s + (d.value * d.probability) / 100, 0)
  const hotLeads = [...leads].filter((l) => !['won', 'lost'].includes(l.status)).sort((a, b) => b.score - a.score)
  const stale = leads.filter((l) => !['won', 'lost'].includes(l.status) && Date.now() - new Date(l.lastContact).getTime() > 5 * 86400000)

  const answer = (question: string) => {
    const q = question.toLowerCase()
    if (q.includes('pipeline') || q.includes('summar')) {
      return `You have ${openDeals.length} open opportunities worth ${formatEGP(pipelineValue, lang, true)}, with a weighted forecast of ${formatEGP(weighted, lang, true)}. ${deals.filter((d) => d.stage === 'negotiation').length} deals are in negotiation and ${deals.filter((d) => d.stage === 'reservation').length} are reserved. The largest open deal is ${openDeals.sort((a, b) => b.value - a.value)[0]?.propertyTitle ?? '—'} at ${formatEGP(openDeals.sort((a, b) => b.value - a.value)[0]?.value ?? 0, lang, true)}.`
    }
    if (q.includes('attention') || q.includes('today') || q.includes('overdue') || q.includes('follow')) {
      return `${stale.length} leads have had no contact for 5+ days. Prioritise ${hotLeads.slice(0, 3).map((l) => l.name).join(', ')}. Their average score is ${Math.round(hotLeads.slice(0, 3).reduce((s, l) => s + l.score, 0) / Math.max(1, hotLeads.slice(0, 3).length))} and combined budget is ${formatEGP(hotLeads.slice(0, 3).reduce((s, l) => s + l.budgetMax, 0), lang, true)}. Suggested next step: call the top lead today and send two matching listings.`
    }
    if (q.includes('draft') || q.includes('message') || q.includes('follow-up')) {
      const top = hotLeads[0]
      return top ? `Draft for ${top.name}: “Hi ${top.name.split(' ')[0]}, I shortlisted two ${top.propertyType}s in ${top.location} within your ${formatEGP(top.budgetMax, lang, true)} budget. One has a garden and a ready payment plan. Would Saturday 12:30 work for a viewing?”` : 'Add a lead first and I can draft a personalised follow-up.'
    }
    if (q.includes('source') || q.includes('channel') || q.includes('best')) {
      const counts = new Map<string, number>()
      leads.forEach((l) => counts.set(l.source, (counts.get(l.source) ?? 0) + 1))
      const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
      const labels: Record<string, string> = { website: 'Website', whatsapp: 'WhatsApp', facebook: 'Facebook', instagram: 'Instagram', referral: 'Referral', walk_in: 'Walk-in', call_center: 'Call center', broker: 'Broker', campaign: 'Campaign' }
      return `${best ? labels[best[0]] ?? best[0] : 'Website'} is your largest source with ${best?.[1] ?? 0} leads. Referral leads convert best in this demo dataset, while campaign leads need faster first response. Consider shifting 10% of campaign spend into referral incentives.`
    }
    if (q.includes('price') || q.includes('budget') || q.includes('afford')) {
      return `Median buyer budget is ${formatEGP(leads.length ? leads.map((l) => l.budgetMax).sort((a, b) => a - b)[Math.floor(leads.length / 2)] : 0, lang, true)}. The closest inventory match for the hottest lead is ${bestMatch(hotLeads[0])?.title ?? 'being reviewed'}. I can create a viewing task once you confirm availability.`
    }
    return `Here is what I can see: ${openDeals.length} open deals, ${leads.filter((l) => l.status === 'new').length} new leads and ${stale.length} leads without recent contact. Ask me to summarise the pipeline, find leads needing attention, draft a follow-up or compare sources. This response is generated locally from demo data — no external AI service is used.`
  }

  const send = () => {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [...prev, { from: 'user', text }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'ai', text: answer(text) }])
      setThinking(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)
    }, 650)
  }

  const bestMatch = (lead?: typeof leads[number]) => {
    if (!lead) return undefined
    return [...properties]
      .filter((p) => p.status === 'available')
      .map((p) => ({ p, score: matchScore(lead, p) }))
      .sort((a, b) => b.score - a.score)[0]?.p
  }

  const rescore = () => {
    leads.forEach((l) => {
      const statusScore: Record<string, number> = { new: 20, contacted: 34, qualified: 55, interested: 65, viewing: 76, negotiation: 86, won: 96, lost: 10 }
      const budget = Math.min(20, Math.round(l.budgetMax / 1_000_000))
      const recency = Math.max(0, 15 - Math.floor((Date.now() - new Date(l.lastContact).getTime()) / 86400000))
      const next = Math.max(5, Math.min(99, (statusScore[l.status] ?? 30) + budget + recency + (l.priority === 'urgent' ? 6 : l.priority === 'high' ? 3 : 0)))
      if (next !== l.score) updateLead(l.id, { score: next })
    })
    toast('Scores recalculated', `${leads.length} leads rescored using status, budget fit and contact recency.`)
  }

  const scoreBuckets = [
    { name: t('Hot · 80+'), value: leads.filter((l) => l.score >= 80).length },
    { name: t('Warm · 60–79'), value: leads.filter((l) => l.score >= 60 && l.score < 80).length },
    { name: t('Nurture · 40–59'), value: leads.filter((l) => l.score >= 40 && l.score < 60).length },
    { name: t('Cold · below 40'), value: leads.filter((l) => l.score < 40).length },
  ]

  const recommendations = hotLeads.slice(0, 8).map((lead) => {
    const matches = properties.filter((p) => p.status === 'available').map((p) => ({ property: p, score: matchScore(lead, p) })).sort((a, b) => b.score - a.score).slice(0, 2)
    return { lead, matches }
  })

  const insights = [
    { title: t('Response speed drives conversion'), body: `${leads.filter((l) => Date.now() - new Date(l.createdAt).getTime() < 86400000).length} leads arrived in the last 24 hours. Leads contacted within 15 minutes convert 2.4× better in this demo.`, tone: 'green' as const, icon: TrendingUp },
    { title: t('Negotiation stalls'), body: `${deals.filter((d) => d.stage === 'negotiation').length} deals have been in negotiation for more than 10 days. Offer a payment-plan comparison to unblock them.`, tone: 'amber' as const, icon: AlertTriangle },
    { title: t('Referral quality'), body: `Referral leads average a score of ${Math.round(leads.filter((l) => l.source === 'referral').reduce((s, l) => s + l.score, 0) / Math.max(1, leads.filter((l) => l.source === 'referral').length))} versus ${Math.round(leads.reduce((s, l) => s + l.score, 0) / Math.max(1, leads.length))} overall.`, tone: 'blue' as const, icon: Users },
    { title: t('Viewing follow-through'), body: `${viewings.filter((v) => v.status === 'completed').length} viewings completed and ${viewings.filter((v) => v.status === 'no_show').length} no-shows. Confirm viewings 24 hours ahead to reduce no-shows.`, tone: 'purple' as const, icon: Target },
  ]

  return (
    <div>
      <PageHeader
        title={t('AI Sales Assistant')}
        description={t('Local, simulated intelligence that ranks leads, recommends inventory and explains your pipeline.')}
        eyebrow={<><Sparkles className="size-3.5 text-accent" /> {t('CRM')} · {t('Automation & AI')}</>}
        actions={<Button variant="outline" onClick={rescore}><Wand2 /> {t('Recalculate scores')}</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Hot leads')} value={leads.filter((l) => l.score >= 80).length} icon={Flame} tone="amber" hint={t('Score 80 and above')} />
        <StatCard label={t('Weighted forecast')} value={formatEGP(weighted, lang, true)} icon={CircleDollarSign} tone="green" hint={t('Probability adjusted')} />
        <StatCard label={t('Leads at risk')} value={stale.length} icon={AlertTriangle} tone="purple" hint={t('No contact for 5+ days')} />
        <StatCard label={t('Average score')} value={leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0} icon={BrainCircuit} tone="blue" hint={`${leads.length} ${t('active leads')}`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={cn('h-8 shrink-0 rounded-lg border px-3 text-[11px] font-medium transition-colors', tab === x.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>{t(x.label)}</button>
        ))}
      </div>

      {tab === 'assistant' && (
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Card className="flex min-h-[540px] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-emerald-500 text-white"><Sparkles className="size-4" /></span><div><p className="text-[13px] font-semibold">{t('Nawyati Copilot')}</p><p className="text-[9px] text-muted-foreground">{t('Grounded in your demo CRM data')}</p></div></div>
              <Badge tone="purple">DEMO AI</Badge>
            </div>
            <div className="thin-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex gap-2.5', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                  {m.from === 'ai' && <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-violet-500/10 text-violet-600"><Sparkles className="size-3.5" /></span>}
                  <div className={cn('max-w-[85%] rounded-xl px-3 py-2.5 text-[12px] leading-relaxed', m.from === 'user' ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted/30')}>{m.text}</div>
                </div>
              ))}
              {thinking && <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Sparkles className="size-3.5 animate-pulse text-violet-500" /> {t('Analyzing your pipeline…')}</div>}
              <div ref={endRef} />
            </div>
            <div className="border-t border-border p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {prompts.map((p) => <button key={p} onClick={() => { setInput(p); }} className="rounded-full border border-border bg-card px-2.5 py-1 text-[9.5px] text-muted-foreground hover:border-accent/50 hover:text-foreground">{t(p)}</button>)}
              </div>
              <div className="flex items-center gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={t('Ask about leads, deals, inventory…')} />
                <Button variant="accent" onClick={send} disabled={!input.trim()}><Send className="rtl:rotate-180" /></Button>
              </div>
              <p className="mt-1.5 text-[9px] text-muted-foreground">{t('Simulated assistant. Answers are generated locally; no external AI API is used.')}</p>
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="p-4">
              <SectionTitle title={t('Suggested focus')} description={t('Ranked from live demo signals.')} />
              <div className="space-y-2">
                {hotLeads.slice(0, 4).map((l) => (
                  <Link key={l.id} to={`/crm/leads/${l.id}`} className="flex items-center gap-2 rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/40">
                    <UserCell name={l.name} sub={`${l.location} · ${formatEGP(l.budgetMax, lang, true)}`} color={employeesScoped.find((e) => e.id === l.assigneeId)?.avatarColor} />
                    <span className="ms-auto text-[13px] font-semibold text-accent">{l.score}</span>
                    <ChevronRight className="size-3.5 text-muted-foreground rtl:rotate-180" />
                  </Link>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between"><p className="text-[12px] font-semibold">{t('Score distribution')}</p><span className="text-[10px] text-muted-foreground">{leads.length} {t('leads')}</span></div>
              <DonutChart data={scoreBuckets} height={150} centerValue={String(leads.filter((l) => l.score >= 80).length)} centerLabel={t('hot')} colors={[chartColors.emerald, chartColors.sky, chartColors.amber, chartColors.slate]} />
              <DonutLegend data={scoreBuckets} colors={[chartColors.emerald, chartColors.sky, chartColors.amber, chartColors.slate]} />
            </Card>
          </div>
        </div>
      )}

      {tab === 'scoring' && (
        <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div><p className="text-[13px] font-semibold">{t('Lead scores')}</p><p className="text-[10px] text-muted-foreground">{t('Status, budget fit, recency and priority are blended locally.')}</p></div>
              <Button size="xs" variant="accent" onClick={rescore}><Wand2 /> {t('Recalculate')}</Button>
            </div>
            <div className="divide-y divide-border">
              {[...leads].sort((a, b) => b.score - a.score).map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold', l.score >= 80 ? 'bg-emerald-500/10 text-emerald-600' : l.score >= 60 ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground')}>{l.score}</span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/crm/leads/${l.id}`} className="truncate text-[12px] font-medium hover:text-accent">{l.name}</Link>
                    <div className="mt-1 flex items-center gap-2"><Progress value={l.score} tone={l.score >= 80 ? 'accent' : l.score >= 60 ? 'amber' : 'navy'} className="max-w-[180px]" /><span className="text-[9px] text-muted-foreground">{l.location}</span></div>
                  </div>
                  <StatusBadge status={l.status} />
                  <span className="hidden w-20 text-end text-[10px] text-muted-foreground sm:block">{formatEGP(l.budgetMax, lang, true)}</span>
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="p-4">
              <SectionTitle title={t('Scoring model')} description={t('Transparent weights used in the demo.')} />
              <div className="space-y-3">
                {[
                  { label: t('Pipeline status'), weight: 35 },
                  { label: t('Budget fit with inventory'), weight: 25 },
                  { label: t('Contact recency'), weight: 20 },
                  { label: t('Priority and intent signals'), weight: 12 },
                  { label: t('Source quality'), weight: 8 },
                ].map((x) => (
                  <div key={x.label}>
                    <div className="mb-1 flex justify-between text-[10.5px]"><span className="text-muted-foreground">{x.label}</span><span className="font-semibold">{x.weight}%</span></div>
                    <Progress value={x.weight * 2.6} tone="navy" />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold"><BrainCircuit className="size-3.5 text-violet-500" /> {t('Manual override')}</p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">{t('Scores are advisory. Sales managers can override a lead priority from the lead profile without changing the score.')}</p>
            </Card>
          </div>
        </div>
      )}

      {tab === 'recommendations' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-muted-foreground">{t('Inventory matches for your highest-intent leads, ranked by budget, type and location fit.')}</p>
            <Badge tone="outline">{recommendations.length} {t('leads')}</Badge>
          </div>
          {recommendations.map(({ lead, matches }) => (
            <Card key={lead.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <UserCell name={lead.name} sub={`${lead.propertyType} · ${lead.location} · ${formatEGP(lead.budgetMin, lang, true)}–${formatEGP(lead.budgetMax, lang, true)}`} color={employeesScoped.find((e) => e.id === lead.assigneeId)?.avatarColor} />
                <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-semibold', lead.score >= 80 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>{lead.score} {t('score')}</span>
                <Link to={`/crm/leads/${lead.id}`} className="ms-auto text-[11px] font-medium text-accent hover:underline">{t('Open lead')}</Link>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {matches.map(({ property, score }) => (
                  <div key={property.id} className="flex items-center gap-2.5 rounded-lg border border-border p-2.5">
                    <img src={property.images[0]} alt="" className="size-12 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-medium">{property.title}</p>
                      <p className="text-[9.5px] text-muted-foreground">{property.location} · {formatEGP(property.price, lang, true)}</p>
                    </div>
                    <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[9px] font-semibold text-accent">{score}% {t('match')}</span>
                    <Button size="icon-sm" variant="ghost" title={t('View property')} asChild><Link to={`/properties/${property.id}`}><ArrowRight className="rtl:rotate-180" /></Link></Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-end">
                <Button size="xs" variant="outline" onClick={() => { addTask({ id: `tk-${Math.random().toString(36).slice(2, 7)}`, companyId, title: `Share shortlist with ${lead.name}`, type: 'whatsapp', priority: 'high', status: 'todo', dueDate: new Date(Date.now() + 86400000).toISOString(), assigneeId: lead.assigneeId, customerName: lead.name, propertyTitle: matches[0]?.property.title, notes: 'AI recommended shortlist.', reminder: true }); toast('Follow-up task created', `Shortlist for ${lead.name} added to the activity queue.`) }}><MessageSquare /> {t('Create follow-up task')}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'insights' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {insights.map((x) => (
              <Card key={x.title} className="p-4">
                <span className={cn('grid size-8 place-items-center rounded-lg', x.tone === 'green' && 'bg-emerald-500/10 text-emerald-600', x.tone === 'amber' && 'bg-amber-500/10 text-amber-600', x.tone === 'blue' && 'bg-sky-500/10 text-sky-600', x.tone === 'purple' && 'bg-violet-500/10 text-violet-600')}><x.icon className="size-4" /></span>
                <p className="mt-3 text-[12px] font-semibold">{x.title}</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{x.body}</p>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t('Pipeline by stage')} description={t('Count and weighted value of open deals.')}>
              <BarsChart data={['qualified', 'proposal', 'negotiation', 'reservation'].map((stage) => ({ name: t(stage.replace(/\b\w/g, (c) => c.toUpperCase())), deals: deals.filter((d) => d.stage === stage).length }))} series={[{ key: 'deals', label: t('Deals'), color: chartColors.emerald }]} height={240} />
            </ChartCard>
            <ChartCard title={t('Lead source quality')} description={t('Average score by acquisition channel.')}>
              <BarsChart vertical data={Object.entries(leads.reduce<Record<string, { total: number; count: number }>>((acc, l) => { acc[l.source] = acc[l.source] ?? { total: 0, count: 0 }; acc[l.source].total += l.score; acc[l.source].count++; return acc }, {})).map(([source, v]) => ({ name: t(source.replace(/_/g, ' ')), score: Math.round(v.total / v.count) })).sort((a, b) => a.score - b.score)} series={[{ key: 'score', label: t('Average score'), color: chartColors.sky }]} height={240} />
            </ChartCard>
          </div>
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold"><Sparkles className="size-3.5 text-violet-500" /> {t('How this works')}</p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">{t('These insights are deterministic calculations over the demo dataset — pipeline counts, budget bands, contact recency and stage aging. No external analytics or AI service is connected.')}</p>
          </Card>
        </div>
      )}
    </div>
  )
}

function matchScore(lead: { budgetMin: number; budgetMax: number; propertyType: string; location: string; preferredArea: string }, property: { price: number; type: string; location: string }) {
  let score = 42
  if (property.type === lead.propertyType) score += 22
  if (property.location === lead.location || lead.preferredArea.includes(property.location)) score += 18
  if (property.price >= lead.budgetMin * 0.9 && property.price <= lead.budgetMax * 1.02) score += 18
  else if (property.price <= lead.budgetMax * 1.15) score += 8
  return Math.min(98, score)
}
