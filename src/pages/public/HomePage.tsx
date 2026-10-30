import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Bath, BedDouble, Building2, Check, ChevronRight, CircleDollarSign,
  Handshake, MapPin, Quote, Scan, Search, ShieldCheck, Sparkles, Star, TrendingUp, Users, Wand2,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { formatEGP, formatNumber } from '@/lib/format'
import { PropertyCard } from '@/components/PropertyCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ListingType } from '@/types'

const locations = [
  { name: 'New Cairo', img: '/img/p2.jpg', blurb: 'Family compounds & new launches' },
  { name: 'Sheikh Zayed', img: '/img/p7.jpg', blurb: 'West Cairo’s green communities' },
  { name: 'North Coast', img: '/img/p4.jpg', blurb: 'Beachfront & lagoon living' },
  { name: 'New Administrative Capital', img: '/img/p12.jpg', blurb: 'The city of the future' },
  { name: 'Mostakbal City', img: '/img/p3.jpg', blurb: 'Space, parks and value' },
  { name: 'Maadi', img: '/img/p6.jpg', blurb: 'Established, leafy and central' },
]

export function HomePage() {
  const { t, tx, lang } = useI18n()
  const navigate = useNavigate()
  const properties = useAppStore((s) => s.properties)
  const developers = useAppStore((s) => s.developers)
  const projects = useAppStore((s) => s.projects)
  const [listing, setListing] = useState<ListingType>('sale')
  const [location, setLocation] = useState('')
  const [type, setType] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [featuredTab, setFeaturedTab] = useState<'all' | 'verified' | 'new' | 'ready'>('all')

  const available = useMemo(() => properties.filter((p) => p.listingStatus === 'published' && p.status === 'available'), [properties])
  const featured = available.filter((p) => p.featured).slice(0, 6)
  const filteredFeatured = featured.filter((p) => {
    if (featuredTab === 'verified') return p.verified
    if (featuredTab === 'new') return new Date(p.createdAt).getTime() > Date.now() - 140 * 86400000
    if (featuredTab === 'ready') return p.readyToMove
    return true
  }).slice(0, 6)
  const recent = available.slice(0, 4)
  const recommended = available.filter((p) => p.id !== featured[0]?.id).slice(2, 5)

  const search = () => {
    const params = new URLSearchParams()
    params.set('listingType', listing)
    if (location) params.set('location', location)
    if (type) params.set('type', type)
    if (maxPrice) params.set('maxPrice', maxPrice)
    navigate(`/properties?${params.toString()}`)
  }

  const stats = [
    { value: '12,400+', label: 'Verified listings' },
    { value: '38', label: 'Trusted developers' },
    { value: '120+', label: 'Agency partners' },
    { value: 'EGP 4.2B', label: 'Closed volume' },
  ]

  const counts = ['all', 'verified', 'new', 'ready'].map((tab) => ({
    tab,
    count: tab === 'all' ? featured.length : featured.filter((p) => tab === 'verified' ? p.verified : tab === 'new' ? new Date(p.createdAt).getTime() > Date.now() - 140 * 86400000 : p.readyToMove).length,
  }))

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden text-white">
        <div className="grid-pattern absolute inset-0 opacity-60" />
        <div className="absolute -end-40 -top-40 size-[520px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8 lg:pb-28 lg:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-medium text-white/85 backdrop-blur">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                </span>
                {t('Verified listings · Direct from developers · No hidden fees')}
              </span>
              <h1 className="mt-5 max-w-xl text-[38px] font-semibold leading-[1.06] tracking-[-0.045em] text-balance sm:text-5xl lg:text-[56px]">
                {t('Find your place in')} <span className="text-emerald-300">{t('Egypt’s next chapter.')}</span>
              </h1>
              <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
                {t('Discover verified homes, new launches and resale opportunities from trusted developers and brokers — with transparent pricing and expert guidance at every step.')}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/65">
                {['Ownership verified', 'EGP pricing', 'Expert local agents'].map((x) => (
                  <span key={x} className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-emerald-400" /> {t(x)}</span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px] lg:ms-auto">
              <div className="absolute -inset-4 rounded-[2rem] border border-white/10 bg-white/[0.03]" />
              <div className="relative overflow-hidden rounded-2xl border border-white/15 shadow-hero">
                <img src="/img/p4.jpg" alt="Azure Bay waterfront residence" className="h-[320px] w-full object-cover sm:h-[380px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/85 via-transparent to-[#071426]/20" />
                <div className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-[#142B45] shadow-sm">
                  <BadgeCheck className="size-3.5 text-emerald-500" /> {t('Verified listing')}
                </div>
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/60">{t('North Coast')} · {t('Chalet')}</p>
                    <p className="mt-1 text-lg font-semibold tracking-[-0.02em]">{t('Azure Bay Waterfront Chalet')}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-white/70">
                      <span className="inline-flex items-center gap-1"><BedDouble className="size-3" /> 3</span>
                      <span className="inline-flex items-center gap-1"><Bath className="size-3" /> 2</span>
                      <span className="inline-flex items-center gap-1"><Scan className="size-3" /> 160 m²</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/10 px-3 py-2 text-end backdrop-blur">
                    <p className="text-[9px] uppercase tracking-wider text-white/60">{t('Starting at')}</p>
                    <p className="text-sm font-semibold">{formatEGP(9800000, lang, true)}</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -start-4 hidden w-[210px] rounded-xl border border-white/15 bg-[#0B1E33]/90 p-3 shadow-hero backdrop-blur sm:block">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300"><Wand2 className="size-3.5" /></span>
                  <div>
                    <p className="text-[10px] font-semibold text-white">AI property match</p>
                    <p className="text-[9px] text-white/55">Based on your preferences</p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[92%] rounded-full bg-emerald-400" /></div>
                  <span className="text-[10px] font-semibold text-emerald-300">92%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
      </section>

      {/* Search */}
      <section className="relative z-20 mx-auto -mt-12 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-pop sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-lg bg-muted p-0.5">
              {(['sale', 'rent', 'resale'] as ListingType[]).map((l) => (
                <button key={l} onClick={() => setListing(l)} className={`h-7 rounded-md px-3 text-[11px] font-medium transition-all ${listing === l ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t(l === 'sale' ? 'Buy' : l === 'rent' ? 'Rent' : 'Resale')}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'Ready to move', onClick: () => navigate('/properties?ready=1') },
                { label: 'Verified only', onClick: () => navigate('/properties?verified=1') },
                { label: 'New launches', onClick: () => navigate('/projects') },
              ].map((chip) => (
                <button key={chip.label} onClick={chip.onClick} className="rounded-md border border-border bg-card px-2 py-1 text-[9px] font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground">{t(chip.label)}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
            <label className="flex h-11 items-center gap-2.5 rounded-lg border border-border bg-background px-3">
              <MapPin className="size-4 text-muted-foreground" />
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-transparent text-[12px] outline-none">
                <option value="">{t('Any location')}</option>
                {locations.map((l) => <option key={l.name} value={l.name}>{t(l.name)}</option>)}
                {['6th of October', 'Nasr City', 'New Alamein'].map((l) => <option key={l} value={l}>{t(l)}</option>)}
              </select>
            </label>
            <label className="flex h-11 items-center gap-2.5 rounded-lg border border-border bg-background px-3">
              <Building2 className="size-4 text-muted-foreground" />
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-transparent text-[12px] outline-none">
                <option value="">{t('Any property type')}</option>
                {['apartment', 'villa', 'townhouse', 'penthouse', 'duplex', 'chalet', 'office', 'retail'].map((tp) => <option key={tp} value={tp}>{t(tp[0].toUpperCase() + tp.slice(1))}</option>)}
              </select>
            </label>
            <label className="flex h-11 items-center gap-2.5 rounded-lg border border-border bg-background px-3">
              <CircleDollarSign className="size-4 text-muted-foreground" />
              <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full bg-transparent text-[12px] outline-none">
                <option value="">{t('Any budget')}</option>
                {[
                  ['5000000', 'Up to EGP 5M'], ['10000000', 'Up to EGP 10M'], ['15000000', 'Up to EGP 15M'], ['20000000', 'Up to EGP 20M'], ['30000000', 'Up to EGP 30M'],
                ].map(([v, label]) => <option key={v} value={v}>{t(label)}</option>)}
              </select>
            </label>
            <Button onClick={search} size="lg" className="h-11 gap-2 px-6">
              <Search className="size-4" /> {t('Search properties')}
            </Button>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[9px] text-muted-foreground">
            <span className="me-1">{t('Popular:')}</span>
            {['New Cairo', 'Sheikh Zayed', 'North Coast', 'New Capital'].map((l) => (
              <button key={l} onClick={() => navigate(`/properties?location=${encodeURIComponent(l)}`)} className="rounded-full border border-border px-2 py-0.5 hover:border-slate-300 hover:text-foreground">{t(l === 'New Capital' ? 'New Administrative Capital' : l)}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust stats */}
      <section className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-card md:grid-cols-4 md:divide-x md:divide-border rtl:md:divide-x-reverse">
          {stats.map((s) => (
            <div key={s.label} className="px-3 py-1 md:text-center">
              <p className="text-xl font-semibold tracking-[-0.03em]">{s.value}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{t(s.label)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t('Handpicked selection')}
          title={t('Featured properties')}
          description={t('Verified homes, carefully selected for quality, location and value.')}
          action={<Link to="/properties" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:text-accent">{t('View all properties')} <ArrowRight className="size-3.5 rtl:rotate-180" /></Link>}
        />
        <div className="mb-5 flex flex-wrap gap-1.5">
          {counts.map((c) => (
            <button key={c.tab} onClick={() => setFeaturedTab(c.tab as typeof featuredTab)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium transition-colors ${featuredTab === c.tab ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {t(c.tab === 'all' ? 'All listings' : c.tab === 'verified' ? 'Verified' : c.tab === 'new' ? 'New this month' : 'Ready to move')}
              <span className={`text-[9px] ${featuredTab === c.tab ? 'text-white/60' : 'text-muted-foreground/70'}`}>{c.count}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFeatured.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      </section>

      {/* Locations */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t('Where to live')}
          title={t('Explore by location')}
          description={t('From established neighborhoods to new waterfront communities.')}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {locations.map((l, i) => {
            const count = properties.filter((p) => p.location === l.name).length
            return (
              <Link
                key={l.name}
                to={`/properties?location=${encodeURIComponent(l.name)}`}
                className={`group relative overflow-hidden rounded-xl ${i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''} ${i === 3 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <div className={i === 0 ? 'h-[260px] sm:h-[340px] lg:h-full lg:min-h-[380px]' : 'h-[150px] lg:h-[184px]'}>
                  <img src={l.img} alt={l.name} className="size-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/85 via-[#071426]/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                  <div>
                    <p className="text-[13px] font-semibold text-white">{t(l.name)}</p>
                    <p className="mt-0.5 text-[10px] text-white/65">{count} {t('available properties')} · {t(l.blurb)}</p>
                  </div>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                    <ArrowUpRight className="size-3.5 rtl:rotate-90" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Developers */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t('Trusted partners')}
          title={t('Featured developers')}
          description={t('Work directly with Egypt’s most established development teams.')}
          action={<Link to="/projects#developers" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:text-accent">{t('All developers')} <ArrowRight className="size-3.5 rtl:rotate-180" /></Link>}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {developers.map((d) => {
            const devProjects = projects.filter((p) => p.developerId === d.id)
            return (
              <Link key={d.id} to={`/projects?developer=${d.id}#developers`} className="group rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: d.logoColor }}>{d.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                  {d.verified && <Badge tone="green" className="gap-1"><ShieldCheck className="size-2.5" /> {t('Verified')}</Badge>}
                </div>
                <p className="mt-3 text-[13px] font-semibold">{d.name}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{t('Founded')} {d.founded} · {devProjects.length} {t('projects')}</p>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-[10px] text-muted-foreground">{t('From')} {formatEGP(Math.min(...devProjects.map((p) => p.priceFrom)), lang, true)}</span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground transition-colors group-hover:text-accent rtl:rotate-90" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Projects */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t('New launches')}
          title={t('Popular projects')}
          description={t('Explore master plans, payment plans and live availability.')}
          action={<Link to="/projects" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:text-accent">{t('All projects')} <ArrowRight className="size-3.5 rtl:rotate-180" /></Link>}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {projects.filter((p) => p.featured).slice(0, 3).map((p) => {
            const dev = developers.find((d) => d.id === p.developerId)
            return (
              <Link key={p.id} to={`/projects?project=${p.id}`} className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop">
                <div className="relative h-[210px] overflow-hidden">
                  <img src={p.images[0]} alt={p.name} className="size-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/70 via-transparent to-transparent" />
                  <span className="absolute start-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[9px] font-semibold text-[#142B45]">{dev?.name}</span>
                  <div className="absolute inset-x-4 bottom-3 flex items-end justify-between text-white">
                    <div>
                      <p className="text-[15px] font-semibold">{tx(p.name, p.nameAr)}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/70"><MapPin className="size-3" /> {t(p.location)}</p>
                    </div>
                    <span className="rounded-md bg-white/15 px-2 py-1 text-[10px] backdrop-blur">{t('From')} {formatEGP(p.priceFrom, lang, true)}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{p.availableUnits} {t('units available')}</span>
                    <span>{t('Delivery')} {new Date(p.deliveryDate).getFullYear()}</span>
                  </div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-emerald-500" style={{ width: `${(p.availableUnits / p.totalUnits) * 100}%` }} />
                    <div className="h-full bg-amber-400" style={{ width: `${(p.reservedUnits / p.totalUnits) * 100}%` }} />
                    <div className="h-full bg-slate-400" style={{ width: `${(p.soldUnits / p.totalUnits) * 100}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"><Sparkles className="size-3" /> {t('AI matched')}</span>
                    <span className="text-[10px] font-medium text-foreground group-hover:text-accent">{t('Explore project')} →</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* B2B band */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#0C2035] p-6 text-white sm:p-10 lg:p-12">
          <div className="grid-pattern absolute inset-0 opacity-50" />
          <div className="absolute -end-20 -top-32 size-[420px] rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-300">{t('For real estate businesses')}</Badge>
              <h2 className="mt-4 max-w-lg text-[28px] font-semibold leading-[1.12] tracking-[-0.035em] sm:text-[36px]">
                {t('Run your entire real estate business on one connected platform.')}
              </h2>
              <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-white/60">
                {t('One operating system for real estate')} — {t('marketing, CRM, inventory, brokers, commissions and business intelligence, built for the Egyptian market.')}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/app"><Button size="lg" variant="white" className="gap-2">{t('Open the CRM')} <ArrowRight className="size-4 rtl:rotate-180" /></Button></Link>
                <Link to="/app/exchange"><Button size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">{t('Explore the broker network')}</Button></Link>
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 text-[10px] text-white/40"><ShieldCheck className="size-3" /> {t('Demo workspace with realistic sample data')}</p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {[
                { icon: Building2, title: 'Marketplace & listings', body: 'Publish verified inventory and capture demand.' },
                { icon: Users, title: 'Multi-tenant CRM', body: 'Leads, pipelines, teams and customers in one place.' },
                { icon: Handshake, title: 'Broker exchange', body: 'Cooperate securely with protected customer sources.' },
                { icon: TrendingUp, title: 'Analytics & AI', body: 'Forecasts, next-best actions and performance insights.' },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
                  <f.icon className="size-4 text-emerald-300" />
                  <p className="mt-3 text-[12px] font-semibold">{t(f.title)}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-white/50">{t(f.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recently added + recommended */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t('Fresh to market')}
          title={t('Recently added')}
          description={t('New verified listings added to the marketplace this week.')}
          action={<Link to="/properties?sort=newest" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:text-accent">{t('See all')} <ArrowRight className="size-3.5 rtl:rotate-180" /></Link>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      </section>

      <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t('AI matched')}
          title={t('Recommended for you')}
          description={t('Based on your interest in New Cairo apartments and North Coast chalets.')}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow={t('Client stories')} title={t('What our clients say')} description={t('Real journeys from buyers, sellers and partner agencies.')} />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: 'Nour & Ahmed', role: 'Bought in Sheikh Zayed', quote: 'We compared four compounds in one afternoon and reserved our villa the same week. Every listing was exactly as described — no surprises at handover.', color: '#0F766E' },
            { name: 'Dina Raafat', role: 'Resale seller, Maadi', quote: 'The CRM kept every inquiry and viewing in one place. We sold above our target price in 34 days and always knew which agent was following up.', color: '#B45309' },
            { name: 'Hassan Kamel', role: 'Partner agency, West Cairo', quote: 'The exchange changed how we cooperate. Commission terms are clear, customer sources are protected, and the workspace keeps both teams aligned.', color: '#0369A1' },
          ].map((tst) => (
            <div key={tst.name} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card">
              <Quote className="size-5 text-accent/40" />
              <p className="mt-3 flex-1 text-[12px] leading-relaxed text-muted-foreground">“{t(tst.quote)}”</p>
              <div className="mt-5 flex items-center gap-2.5 border-t border-border pt-4">
                <span className="grid size-8 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: tst.color }}>{tst.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                <div>
                  <p className="text-[11px] font-semibold">{tst.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t(tst.role)}</p>
                </div>
                <div className="ms-auto flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-3 fill-amber-400 text-amber-400" />)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl">
          <img src="/img/p8.jpg" alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#081728]/95 via-[#0C2035]/85 to-[#0C2035]/30 rtl:bg-gradient-to-l" />
          <div className="relative flex flex-col items-start gap-5 p-8 text-white sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">{t('List with confidence')}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{t('Selling or renting? Reach serious, verified buyers.')}</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-white/60">{t('List your property with a Nawyati agency and get professional photography, verified exposure and a dedicated consultant.')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/app/inventory?new=1"><Button size="lg" variant="white" className="gap-2">{t('List a property')} <ArrowRight className="size-4 rtl:rotate-180" /></Button></Link>
              <button onClick={() => navigate('/properties')} className="h-11 rounded-lg border border-white/25 px-5 text-[13px] font-medium text-white hover:bg-white/10">{t('Browse properties')}</button>
            </div>
          </div>
        </div>
      </section>

      <div className="h-16" />
    </div>
  )
}

function SectionHead({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">{eyebrow}</p>
        <h2 className="mt-1.5 text-[24px] font-semibold tracking-[-0.025em] sm:text-[27px]">{title}</h2>
        <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
