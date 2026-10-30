import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Building2, CalendarDays, Check, ChevronLeft, ChevronRight, Layers,
  MapPin, Search, ShieldCheck, Sparkles, X,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/appStore'
import { formatArea, formatDate, formatEGP } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Select } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import type { Project } from '@/types'

const locations = ['All locations', 'New Cairo', 'Sheikh Zayed', '6th of October', 'New Administrative Capital', 'Mostakbal City', 'North Coast', 'New Alamein']

export function ProjectsPage() {
  const { t, tx, lang } = useI18n()
  const [params, setParams] = useSearchParams()
  const projects = useAppStore((s) => s.projects)
  const developers = useAppStore((s) => s.developers)
  const units = useAppStore((s) => s.units)
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState('All locations')
  const [developer, setDeveloper] = useState('')
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')

  const selectedId = params.get('project')
  const selected = projects.find((p) => p.id === selectedId)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const dev = params.get('developer')
    if (dev) setDeveloper(dev)
  }, [params])

  useEffect(() => {
    if (params.get('project')) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [params])

  const filtered = useMemo(() => projects
    .filter((p) => location === 'All locations' || p.location === location)
    .filter((p) => !developer || p.developerId === developer)
    .filter((p) => status === 'all' || p.status === status)
    .filter((p) => !query || `${p.name} ${p.nameAr} ${p.location}`.toLowerCase().includes(query.toLowerCase())),
  [projects, location, developer, status, query])

  const totalAvailable = projects.reduce((s, p) => s + p.availableUnits, 0)

  const openProject = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('project', id)
    setParams(next, { replace: true })
  }
  const closeProject = () => {
    const next = new URLSearchParams(params)
    next.delete('project')
    setParams(next, { replace: true })
  }

  return (
    <div>
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Link to="/" className="hover:text-foreground">{t('Home')}</Link>
            <span>/</span>
            <span className="text-foreground">{t('Projects')}</span>
          </nav>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Sparkles className="size-3" /> {t('New launches 2026')}
              </span>
              <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] sm:text-[36px]">{t('Projects & new developments')}</h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                {t('Explore master plans, live unit availability and payment plans from Egypt’s most trusted developers.')}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: projects.length, label: 'Projects' },
                { value: developers.length, label: 'Developers' },
                { value: totalAvailable, label: 'Units available' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-semibold tracking-[-0.03em]">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{t(s.label)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-muted p-0.5">
              {[
                { v: 'all', l: 'All projects' },
                { v: 'selling', l: 'Selling now' },
                { v: 'upcoming', l: 'Upcoming' },
                { v: 'sold_out', l: 'Sold out' },
              ].map((s) => (
                <button key={s.v} onClick={() => setStatus(s.v)} className={cn('h-7 rounded-md px-3 text-[11px] font-medium transition-all', status === s.v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{t(s.l)}</button>
              ))}
            </div>
            <Select value={location} onChange={(e) => setLocation(e.target.value)} className="h-8 w-auto min-w-[150px] text-[11px]">
              {locations.map((l) => <option key={l} value={l}>{t(l)}</option>)}
            </Select>
            <Select value={developer} onChange={(e) => setDeveloper(e.target.value)} className="h-8 w-auto min-w-[170px] text-[11px]">
              <option value="">{t('All developers')}</option>
              {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <div className="relative ms-auto min-w-[200px] flex-1 sm:max-w-[260px]">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search projects')} className="h-8 w-full rounded-lg border border-border bg-card ps-8 pe-3 text-[11px] outline-none focus:border-accent/60" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">{filtered.length} {t('projects')} · {t('live inventory from developers')}</p>
          <span className="hidden items-center gap-1.5 text-[10px] text-muted-foreground sm:inline-flex"><ShieldCheck className="size-3.5 text-emerald-500" /> {t('Developer-verified availability')}</span>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-[220px] w-full rounded-none" />
                <div className="space-y-2 p-4"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-8 w-full" /></div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">{t('No projects match your filters')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('Reset the filters to see all new developments.')}</p>
            <Button variant="outline" className="mt-4" onClick={() => { setLocation('All locations'); setDeveloper(''); setStatus('all'); setQuery('') }}>{t('Reset filters')}</Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => <ProjectCard key={p.id} project={p} onOpen={() => openProject(p.id)} />)}
          </div>
        )}
      </section>

      <section id="developers" className="border-t border-border bg-card py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">{t('Trusted partners')}</p>
              <h2 className="mt-1.5 text-[24px] font-semibold tracking-[-0.025em]">{t('Featured developers')}</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">{t('Work directly with established development teams and verified inventory.')}</p>
            </div>
            <Link to="/properties" className="inline-flex items-center gap-1.5 text-[12px] font-medium hover:text-accent">{t('Browse all properties')} <ArrowRight className="size-3.5 rtl:rotate-180" /></Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {developers.map((d) => {
              const devProjects = projects.filter((p) => p.developerId === d.id)
              return (
                <button
                  key={d.id}
                  onClick={() => { setDeveloper(d.id); window.scrollTo({ top: 300, behavior: 'smooth' }) }}
                  className="group rounded-xl border border-border bg-background p-4 text-start shadow-card transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-pop dark:hover:border-slate-600"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: d.logoColor }}>{d.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                    {d.verified && <Badge tone="green" className="gap-1"><ShieldCheck className="size-2.5" /> {t('Verified')}</Badge>}
                  </div>
                  <p className="mt-3 text-[13px] font-semibold">{d.name}</p>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{d.description}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[10px]">
                    <span className="text-muted-foreground">{devProjects.length} {t('projects')}</span>
                    <span className="font-medium text-accent">{t('View projects')} →</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#0C2035] px-6 py-9 text-white sm:px-10">
          <div className="grid-pattern absolute inset-0 opacity-50" />
          <div className="relative flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.03em] sm:text-[26px]">{t('Need help choosing a project?')}</h2>
              <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-white/60">{t('Share your budget and preferred area — a verified consultant will send a shortlist with live unit availability and payment plans.')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/account?tab=requests"><Button variant="white">{t('Submit a buyer request')} <ArrowRight className="size-4 rtl:rotate-180" /></Button></Link>
              <Link to="/properties"><Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">{t('Explore properties')}</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {selected && <ProjectDialog project={selected} onClose={closeProject} />}
    </div>
  )
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const { t, tx, lang } = useI18n()
  const developer = useAppStore((s) => s.developers.find((d) => d.id === project.developerId))
  const availablePct = Math.round((project.availableUnits / project.totalUnits) * 100)
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop">
      <button onClick={onOpen} className="relative block h-[220px] w-full overflow-hidden text-start">
        <img src={project.images[0]} alt={tx(project.name, project.nameAr)} className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/80 via-[#071426]/5 to-transparent" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="rounded-md bg-white/95 px-2 py-1 text-[9px] font-semibold text-[#142B45] backdrop-blur">{developer?.name}</span>
          <StatusBadge status={project.status} className="border-0 bg-white/90 text-[9px]" />
        </div>
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between text-white">
          <div>
            <p className="text-[16px] font-semibold tracking-[-0.02em]">{tx(project.name, project.nameAr)}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/70"><MapPin className="size-3" /> {t(project.location)}</p>
          </div>
          <span className="rounded-md bg-white/15 px-2 py-1 text-[10px] backdrop-blur">{t('From')} {formatEGP(project.priceFrom, lang, true)}</span>
        </div>
      </button>
      <div className="flex flex-1 flex-col p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/60 py-2">
            <p className="text-[13px] font-semibold">{project.availableUnits}</p>
            <p className="text-[9px] text-muted-foreground">{t('Available')}</p>
          </div>
          <div className="rounded-lg bg-muted/60 py-2">
            <p className="text-[13px] font-semibold">{project.reservedUnits}</p>
            <p className="text-[9px] text-muted-foreground">{t('Reserved')}</p>
          </div>
          <div className="rounded-lg bg-muted/60 py-2">
            <p className="text-[13px] font-semibold">{project.soldUnits}</p>
            <p className="text-[9px] text-muted-foreground">{t('Sold')}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{availablePct}% {t('available')}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" /> {t('Delivery')} {formatDate(project.deliveryDate, lang, 'yyyy')}</span>
          </div>
          <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-emerald-500" style={{ width: `${(project.availableUnits / project.totalUnits) * 100}%` }} />
            <div className="h-full bg-amber-400" style={{ width: `${(project.reservedUnits / project.totalUnits) * 100}%` }} />
            <div className="h-full bg-slate-400" style={{ width: `${(project.soldUnits / project.totalUnits) * 100}%` }} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
          <Button size="sm" variant="outline" onClick={onOpen} className="flex-1">{t('Project details')}</Button>
          <Link to={`/properties?project=${project.id}`} className="flex-1">
            <Button size="sm" className="w-full">{t('View units')}</Button>
          </Link>
        </div>
      </div>
    </article>
  )
}

function ProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const { t, tx, lang } = useI18n()
  const developer = useAppStore((s) => s.developers.find((d) => d.id === project.developerId))
  const units = useAppStore(useShallow((s) => s.units.filter((u) => u.projectId === project.id)))
  const [image, setImage] = useState(0)
  const [unitFilter, setUnitFilter] = useState('all')

  const visibleUnits = units
    .filter((u) => unitFilter === 'all' || u.status === unitFilter)
    .slice(0, 8)

  const next = () => setImage((i) => (i + 1) % project.images.length)
  const prev = () => setImage((i) => (i - 1 + project.images.length) % project.images.length)

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{project.name}</DialogTitle>
        <div className="relative h-[260px] overflow-hidden rounded-t-2xl bg-muted sm:h-[320px]">
          <img src={project.images[image]} alt={project.name} className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/85 via-transparent to-[#071426]/25" />
          <button onClick={prev} className="absolute start-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#142B45] shadow-sm hover:bg-white"><ChevronLeft className="size-4" /></button>
          <button onClick={next} className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#142B45] shadow-sm hover:bg-white"><ChevronRight className="size-4" /></button>
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">{developer?.name} · {t(project.location)}</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{tx(project.name, project.nameAr)}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-white/70"><ShieldCheck className="size-3.5 text-emerald-400" /> {t('Verified availability from developer')}</p>
            </div>
            <div className="rounded-lg bg-white/15 px-3 py-2 text-end backdrop-blur">
              <p className="text-[9px] uppercase tracking-wider text-white/60">{t('Starting from')}</p>
              <p className="text-sm font-semibold">{formatEGP(project.priceFrom, lang, true)}</p>
            </div>
          </div>
          <div className="absolute end-4 top-4 flex gap-1.5">
            {project.images.map((img, i) => (
              <button key={img} onClick={() => setImage(i)} className={cn('h-1.5 rounded-full transition-all', i === image ? 'w-5 bg-white' : 'w-1.5 bg-white/50')} />
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <p className="text-[12px] leading-relaxed text-muted-foreground">{tx(project.description, project.descriptionAr)}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.amenities.map((a) => <span key={a} className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-[10px]"><Check className="size-3 text-emerald-500" /> {t(a)}</span>)}
              </div>
              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('Project phases')}</p>
                <div className="mt-2 space-y-2">
                  {project.phases.map((phase) => (
                    <div key={phase.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('size-1.5 rounded-full', phase.status === 'delivered' ? 'bg-emerald-500' : phase.status === 'construction' ? 'bg-amber-400' : 'bg-slate-400')} />
                        <span className="text-[12px] font-medium">{phase.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] capitalize text-muted-foreground">{t(phase.status)}</span>
                        <Badge tone={phase.status === 'delivered' ? 'green' : phase.status === 'construction' ? 'amber' : 'default'}>{phase.delivery}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('Inventory')}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-semibold">{project.availableUnits}</p><p className="text-[9px] text-muted-foreground">{t('Available')}</p></div>
                  <div><p className="text-lg font-semibold">{project.reservedUnits}</p><p className="text-[9px] text-muted-foreground">{t('Reserved')}</p></div>
                  <div><p className="text-lg font-semibold">{project.soldUnits}</p><p className="text-[9px] text-muted-foreground">{t('Sold')}</p></div>
                </div>
              </div>
              <div className="rounded-xl border border-border p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('Payment plan')}</p>
                <dl className="mt-2 space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><dt className="text-muted-foreground">{t('Down payment')}</dt><dd className="font-medium">10%</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">{t('Installments')}</dt><dd className="font-medium">{t('Up to 8 years')}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">{t('Delivery')}</dt><dd className="font-medium">{formatDate(project.deliveryDate, lang, 'MMM yyyy')}</dd></div>
                </dl>
              </div>
              <Link to={`/properties?project=${project.id}`}><Button className="w-full">{t('View available properties')} <ArrowRight className="size-4 rtl:rotate-180" /></Button></Link>
              <p className="text-center text-[9px] text-muted-foreground">{t('Prices and availability are demo data.')}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold"><Layers className="size-4 text-muted-foreground" /> {t('Live unit inventory')}</p>
              <div className="inline-flex rounded-md bg-muted p-0.5">
                {['all', 'available', 'reserved', 'sold'].map((s) => (
                  <button key={s} onClick={() => setUnitFilter(s)} className={cn('h-6 rounded px-2 text-[10px] font-medium capitalize', unitFilter === s ? 'bg-card shadow-sm' : 'text-muted-foreground')}>{t(s)}</button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-[11px]">
                <thead className="bg-muted/50 text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-start">{t('Unit')}</th>
                    <th className="px-3 py-2 text-start">{t('Type')}</th>
                    <th className="px-3 py-2 text-start">{t('Area')}</th>
                    <th className="px-3 py-2 text-start">{t('Price')}</th>
                    <th className="px-3 py-2 text-start">{t('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUnits.map((u) => (
                    <tr key={u.id} className="border-t border-border/70">
                      <td className="px-3 py-2 font-medium">{u.unitNumber}<span className="ms-1 text-[9px] text-muted-foreground">{u.building}</span></td>
                      <td className="px-3 py-2 capitalize text-muted-foreground">{t(u.type)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatArea(u.area, lang)}</td>
                      <td className="px-3 py-2 font-medium">{formatEGP(u.price, lang, true)}</td>
                      <td className="px-3 py-2"><StatusBadge status={u.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[9px] text-muted-foreground">{t('Showing the first 8 units. Contact a consultant for the full availability sheet.')}</p>
              <Link to={`/properties?project=${project.id}`} className="inline-flex items-center gap-1 text-[10px] font-medium text-accent hover:underline">{t('Explore all units')} <ArrowUpRight className="size-3" /></Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
