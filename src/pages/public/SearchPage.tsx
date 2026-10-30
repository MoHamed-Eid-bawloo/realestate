import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Bath, BedDouble, Bookmark, Building2, Check, ChevronDown, Grid3X3, Heart, LayoutList, Map as MapIcon,
  MapPin, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Star, X,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { formatArea, formatPrice } from '@/lib/format'
import { PropertyCard } from '@/components/PropertyCard'
import { Button } from '@/components/ui/button'
import { Input, Select, Checkbox, Field } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet } from '@/components/ui/dialog'
import { EmptyState, Skeleton, Pagination } from '@/components/ui/misc'
import { SearchInput, SegmentedControl } from '@/components/shared'
import type { ListingType, Property, PropertyType } from '@/types'
import { cn } from '@/lib/utils'

const locations = ['New Cairo', 'Sheikh Zayed', '6th of October', 'New Administrative Capital', 'Mostakbal City', 'North Coast', 'Maadi', 'Nasr City', 'New Alamein']
const types: PropertyType[] = ['apartment', 'villa', 'townhouse', 'penthouse', 'duplex', 'chalet', 'office', 'retail']
const PAGE_SIZE = 9

export function SearchPage() {
  const { t, lang } = useI18n()
  const [params, setParams] = useSearchParams()
  const properties = useAppStore((s) => s.properties)
  const projects = useAppStore((s) => s.projects)
  const developers = useAppStore((s) => s.developers)
  const addSavedSearch = useAppStore((s) => s.addSavedSearch)
  const toast = useAppStore((s) => s.toast)
  const [loading, setLoading] = useState(true)
  const [mobileFilters, setMobileFilters] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(timer)
  }, [])

  const get = (key: string) => params.get(key) ?? ''
  const view = (get('view') || 'grid') as 'grid' | 'list' | 'map'
  const listingType = get('listingType')
  const sort = get('sort') || 'featured'
  const page = Number(get('page') || '1')

  const update = (key: string, value: string | boolean) => {
    const next = new URLSearchParams(params)
    if (value === '' || value === false) next.delete(key)
    else next.set(key, String(value))
    if (key !== 'page') next.set('page', '1')
    setParams(next, { replace: true })
  }
  const reset = () => setParams(new URLSearchParams({ listingType: listingType || 'sale' }), { replace: true })

  const filtered = useMemo(() => {
    const q = get('q').toLowerCase()
    return properties
      .filter((p) => p.listingStatus === 'published' && !['sold', 'rented', 'unavailable'].includes(p.status))
      .filter((p) => !listingType || p.listingType === listingType)
      .filter((p) => !get('type') || p.type === get('type'))
      .filter((p) => !get('location') || p.location === get('location'))
      .filter((p) => !get('developer') || p.developerId === get('developer'))
      .filter((p) => !get('project') || p.projectId === get('project'))
      .filter((p) => !get('finishing') || p.finishing === get('finishing'))
      .filter((p) => !get('bedrooms') || p.bedrooms >= Number(get('bedrooms')))
      .filter((p) => !get('bathrooms') || p.bathrooms >= Number(get('bathrooms')))
      .filter((p) => !get('minPrice') || p.price >= Number(get('minPrice')))
      .filter((p) => !get('maxPrice') || p.price <= Number(get('maxPrice')))
      .filter((p) => !get('verified') || p.verified)
      .filter((p) => !get('ready') || p.readyToMove)
      .filter((p) => !q || `${p.title} ${p.titleAr} ${p.location} ${p.description}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'price-asc') return a.price - b.price
        if (sort === 'price-desc') return b.price - a.price
        if (sort === 'area') return b.area - a.area
        if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        return Number(b.featured) - Number(a.featured) || b.views - a.views
      })
  }, [properties, params, listingType, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const activeFilters = [
    ['type', 'Property type'], ['location', 'Location'], ['developer', 'Developer'], ['project', 'Project'],
    ['bedrooms', 'Bedrooms'], ['bathrooms', 'Bathrooms'], ['minPrice', 'Min price'], ['maxPrice', 'Max price'],
    ['finishing', 'Finishing'], ['verified', 'Verified'], ['ready', 'Ready to move'],
  ].filter(([key]) => get(key))

  const saveSearch = () => {
    const summary = [
      get('location') || t('All locations'), get('type') ? t(get('type')[0].toUpperCase() + get('type').slice(1)) : t('Any type'),
      get('maxPrice') ? `≤ EGP ${Number(get('maxPrice')).toLocaleString()}` : t('Any price'),
    ].join(' · ')
    addSavedSearch({ id: `ss${Date.now()}`, name: get('location') ? `${t(get('location'))} ${t('search')}` : t('New property search'), filters: summary, createdAt: new Date().toISOString(), alerts: true })
  }

  const setPage = (p: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(p))
    setParams(next, { replace: true })
    window.scrollTo({ top: 280, behavior: 'smooth' })
  }

  const heading = listingType === 'rent' ? t('Properties for rent') : listingType === 'resale' ? t('Resale properties') : t('Properties for sale')

  return (
    <div className="bg-background">
      {/* Page header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Link to="/" className="hover:text-foreground">{t('Home')}</Link>
            <span>/</span>
            <span className="text-foreground">{t('Properties')}</span>
          </nav>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">{heading}</h1>
              <p className="mt-1 text-[12px] text-muted-foreground">{filtered.length} {t('verified and available properties')} · {t('Egypt')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={saveSearch} className="gap-1.5"><Bookmark className="size-3.5" /> {t('Save search')}</Button>
              <Link to="/account?tab=favorites"><Button variant="outline" size="sm" className="gap-1.5"><Heart className="size-3.5" /> {t('Favorites')}</Button></Link>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex w-fit rounded-lg bg-muted p-0.5">
              {[{ v: '', l: 'All' }, { v: 'sale', l: 'Buy' }, { v: 'rent', l: 'Rent' }, { v: 'resale', l: 'Resale' }].map((tab) => (
                <button key={tab.v} onClick={() => update('listingType', tab.v)} className={cn('h-7 rounded-md px-3 text-[11px] font-medium transition-all', (listingType || '') === tab.v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{t(tab.l)}</button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={get('q')} onChange={(e) => update('q', e.target.value)} placeholder={t('Search by location, project or property')} className="h-9 ps-9" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-[250px] shrink-0 lg:block">
          <div className="sticky top-[84px]">
            <FilterPanel params={params} update={update} reset={reset} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 lg:hidden" onClick={() => setMobileFilters(true)}>
                <SlidersHorizontal className="size-3.5" /> {t('Filters')} {activeFilters.length > 0 && <span className="grid size-4 place-items-center rounded-full bg-accent text-[9px] text-white">{activeFilters.length}</span>}
              </Button>
              <span className="text-[11px] text-muted-foreground">{t('Showing')} <span className="font-medium text-foreground">{filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> {t('of')} {filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sort} onChange={(e) => update('sort', e.target.value)} className="h-8 w-[150px] text-[11px]">
                <option value="featured">{t('Recommended')}</option>
                <option value="newest">{t('Newest')}</option>
                <option value="price-asc">{t('Price: low to high')}</option>
                <option value="price-desc">{t('Price: high to low')}</option>
                <option value="area">{t('Area: largest')}</option>
              </Select>
              <SegmentedControl
                value={view}
                onChange={(v) => update('view', v)}
                options={[
                  { value: 'grid', label: '', icon: Grid3X3 },
                  { value: 'list', label: '', icon: LayoutList },
                  { value: 'map', label: '', icon: MapIcon },
                ]}
              />
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {activeFilters.map(([key, label]) => (
                <button key={key} onClick={() => update(key, '')} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground">
                  {t(label)}: <span className="font-medium text-foreground">{get(key).length > 14 ? get(key).slice(0, 14) + '…' : get(key)}</span> <X className="size-2.5" />
                </button>
              ))}
              <button onClick={reset} className="text-[10px] font-medium text-accent hover:underline">{t('Clear all')}</button>
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <div className="space-y-2 p-4"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-6 w-1/3" /></div>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={Search}
                title={t('No properties found')}
                description={t('Try changing your filters or expanding your budget.')}
                action={<Button onClick={reset} variant="outline">{t('Clear filters')}</Button>}
              />
            </Card>
          ) : view === 'map' ? (
            <MapView properties={filtered} selected={selectedMarker} onSelect={setSelectedMarker} />
          ) : view === 'list' ? (
            <div className="space-y-3">
              {visible.map((p) => <PropertyCard key={p.id} property={p} layout="list" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}

          {!loading && filtered.length > 0 && view !== 'map' && (
            <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          )}
        </div>
      </div>

      <Sheet open={mobileFilters} onOpenChange={setMobileFilters} width="340px">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm font-semibold">{t('Filters')}</p>
          <button onClick={() => setMobileFilters(false)} className="text-[11px] font-medium text-accent">{t('Done')}</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <FilterPanel params={params} update={update} reset={reset} />
        </div>
        <div className="border-t border-border p-4">
          <Button className="w-full" onClick={() => setMobileFilters(false)}>{t('Show')} {filtered.length} {t('properties')}</Button>
        </div>
      </Sheet>
    </div>
  )
}

function FilterPanel({ params, update, reset }: { params: URLSearchParams; update: (k: string, v: string | boolean) => void; reset: () => void }) {
  const { t } = useI18n()
  const get = (k: string) => params.get(k) ?? ''
  const developers = useAppStore((s) => s.developers)
  const projects = useAppStore((s) => s.projects)

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold"><SlidersHorizontal className="size-3.5" /> {t('Filters')}</p>
        <button onClick={reset} className="text-[10px] font-medium text-accent hover:underline">{t('Reset')}</button>
      </div>
      <div className="space-y-3.5">
        <Field label={t('Location')}>
          <Select value={get('location')} onChange={(e) => update('location', e.target.value)} className="h-8 text-[11px]">
            <option value="">{t('Any location')}</option>
            {locations.map((l) => <option key={l} value={l}>{t(l)}</option>)}
          </Select>
        </Field>
        <Field label={t('Property type')}>
          <Select value={get('type')} onChange={(e) => update('type', e.target.value)} className="h-8 text-[11px]">
            <option value="">{t('Any type')}</option>
            {types.map((tp) => <option key={tp} value={tp}>{t(tp[0].toUpperCase() + tp.slice(1))}</option>)}
          </Select>
        </Field>
        <div>
          <p className="mb-1.5 text-xs font-medium">{t('Price range')}</p>
          <div className="grid grid-cols-2 gap-1.5">
            <Select value={get('minPrice')} onChange={(e) => update('minPrice', e.target.value)} className="h-8 text-[10px]">
              <option value="">{t('Min')}</option>
              {[3000000, 5000000, 8000000, 10000000, 15000000, 20000000].map((v) => <option key={v} value={v}>{(v / 1_000_000)}M</option>)}
            </Select>
            <Select value={get('maxPrice')} onChange={(e) => update('maxPrice', e.target.value)} className="h-8 text-[10px]">
              <option value="">{t('Max')}</option>
              {[5000000, 8000000, 12000000, 15000000, 20000000, 30000000].map((v) => <option key={v} value={v}>{(v / 1_000_000)}M</option>)}
            </Select>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium">{t('Bedrooms')}</p>
          <div className="flex flex-wrap gap-1">
            {['', '1', '2', '3', '4', '5'].map((b) => (
              <button key={b} onClick={() => update('bedrooms', b)} className={cn('h-7 min-w-8 rounded-md border px-2 text-[11px] transition-colors', get('bedrooms') === b ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted')}>{b ? `${b}+` : t('Any')}</button>
            ))}
          </div>
        </div>
        <Field label={t('Developer')}>
          <Select value={get('developer')} onChange={(e) => update('developer', e.target.value)} className="h-8 text-[11px]">
            <option value="">{t('Any developer')}</option>
            {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label={t('Project')}>
          <Select value={get('project')} onChange={(e) => update('project', e.target.value)} className="h-8 text-[11px]">
            <option value="">{t('Any project')}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label={t('Finishing')}>
          <Select value={get('finishing')} onChange={(e) => update('finishing', e.target.value)} className="h-8 text-[11px]">
            <option value="">{t('Any')}</option>
            <option value="finished">{t('Finished')}</option>
            <option value="semi_finished">{t('Semi finished')}</option>
            <option value="core_shell">{t('Core & shell')}</option>
          </Select>
        </Field>
        <div className="space-y-2 border-t border-border pt-3">
          <Checkbox checked={!!get('verified')} onChange={(e) => update('verified', e.target.checked)} label={t('Verified listings only')} />
          <Checkbox checked={!!get('ready')} onChange={(e) => update('ready', e.target.checked)} label={t('Ready to move')} />
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-medium"><ShieldCheck className="size-3.5 text-emerald-500" /> {t('Every listing is checked')}</p>
          <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">{t('Ownership, pricing and availability are verified by our team before publishing.')}</p>
        </div>
      </div>
    </Card>
  )
}

function MapView({ properties, selected, onSelect }: { properties: Property[]; selected: string | null; onSelect: (id: string) => void }) {
  const { t, tx, lang } = useI18n()
  const selectedProperty = properties.find((p) => p.id === selected) ?? properties[0]
  return (
    <div className="relative h-[620px] overflow-hidden rounded-xl border border-border bg-[#EDF3EC] dark:bg-[#12241f]">
      <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M0 12 C20 8, 32 18, 46 12 C62 5, 75 10, 100 4 L100 0 L0 0Z" fill="#BFDBE8" opacity="0.6" />
        <path d="M-5 62 L105 38" stroke="#CBD5D8" strokeWidth="2.4" />
        <path d="M-5 44 L105 70" stroke="#D5DEE0" strokeWidth="1.4" />
        <path d="M28 -5 L38 105" stroke="#D5DEE0" strokeWidth="1.2" />
        <path d="M70 -5 L62 105" stroke="#CBD5D8" strokeWidth="1.8" />
        <path d="M-5 85 L105 76" stroke="#D5DEE0" strokeWidth="1" />
        <circle cx="20" cy="55" r="10" fill="#DDE8D7" />
        <circle cx="83" cy="82" r="14" fill="#DDE8D7" />
        <circle cx="55" cy="28" r="8" fill="#E4EDDD" />
      </svg>
      <div className="absolute start-[14%] top-[18%] text-[10px] font-medium text-slate-500 dark:text-slate-400">Sheikh Zayed</div>
      <div className="absolute start-[58%] top-[44%] text-[10px] font-medium text-slate-500 dark:text-slate-400">New Cairo</div>
      <div className="absolute start-[68%] top-[24%] text-[10px] font-medium text-slate-500 dark:text-slate-400">New Capital</div>
      <div className="absolute start-[24%] top-[68%] text-[10px] font-medium text-slate-500 dark:text-slate-400">Maadi</div>
      <div className="absolute end-3 top-3 rounded-lg border border-border bg-card/90 px-3 py-2 text-[10px] text-muted-foreground shadow-card backdrop-blur">
        <p className="font-medium text-foreground">{t('Map view')}</p>
        <p>{properties.length} {t('properties in this area')}</p>
        <p className="mt-1 text-[9px]">{t('Demo map — not a real map service')}</p>
      </div>
      {properties.slice(0, 12).map((p, i) => {
        const x = 12 + ((i * 29) % 76)
        const y = 20 + ((i * 23) % 58)
        const active = selectedProperty?.id === p.id
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn('absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1.5 text-[10px] font-semibold shadow-md transition-all hover:scale-105', active ? 'z-20 bg-accent text-white ring-4 ring-emerald-500/20' : 'bg-white text-[#142B45] hover:bg-[#142B45] hover:text-white')}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {formatPrice(p.price, p.listingType, lang).replace(' EGP', '')}
          </button>
        )
      })}
      {selectedProperty && (
        <Link to={`/properties/${selectedProperty.id}`} className="absolute inset-x-3 bottom-3 z-30 flex gap-3 rounded-xl border border-border bg-card p-3 shadow-pop sm:inset-x-auto sm:start-3 sm:w-[360px]">
          <img src={selectedProperty.images[0]} alt="" className="h-[84px] w-[110px] shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground">{t(selectedProperty.location)} · {t(selectedProperty.type)}</p>
            <p className="mt-0.5 truncate text-[12px] font-semibold">{tx(selectedProperty.title, selectedProperty.titleAr)}</p>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><BedDouble className="size-3" /> {selectedProperty.bedrooms}</span>
              <span className="inline-flex items-center gap-1"><Bath className="size-3" /> {selectedProperty.bathrooms}</span>
              <span>{formatArea(selectedProperty.area, lang)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-accent">{formatPrice(selectedProperty.price, selectedProperty.listingType, lang)}</span>
              <span className="text-[10px] font-medium">{t('View')} →</span>
            </div>
          </div>
        </Link>
      )}
    </div>
  )
}
