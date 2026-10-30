import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Archive, Building2, CheckCircle2, Copy, Download, Eye, FileEdit, Filter, Grid3X3, History, Image as ImageIcon,
  LayoutList, MapPin, Plus, Search, ShieldCheck, Trash2, Upload, AlertTriangle, ChevronDown, Layers, X,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/appStore'
import { cn, downloadCsv } from '@/lib/utils'
import { formatArea, formatDate, formatEGP } from '@/lib/format'
import { PageHeader, StatCard, SearchInput, SectionTitle, InfoRow, DataTableEmpty, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Sheet, ConfirmDialog } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea, Checkbox } from '@/components/ui/input'
import { Progress } from '@/components/ui/misc'
import { SegmentedControl } from '@/components/shared'
import type { Property, PropertyStatus, PropertyType } from '@/types'

const listingTypes = ['sale', 'rent', 'resale'] as const
const propertyTypes: PropertyType[] = ['apartment', 'villa', 'townhouse', 'penthouse', 'duplex', 'chalet', 'office', 'retail']
const statuses: PropertyStatus[] = ['available', 'reserved', 'sold', 'rented', 'unavailable', 'pending_review']

const images = Array.from({ length: 14 }, (_, i) => `/img/p${i + 1}.jpg`)

export function InventoryPage() {
  const { t, lang } = useI18n()
  const [params, setParams] = useSearchParams()
  const companyId = useAppStore((s) => s.activeCompanyId)
  const company = useAppStore((s) => s.companies.find((c) => c.id === s.activeCompanyId))
  const propertiesAll = useAppStore((s) => s.properties)
  const projects = useAppStore((s) => s.projects)
  const developers = useAppStore((s) => s.developers)
  const deals = useAppStore(useShallow((s) => s.deals.filter((d) => d.companyId === s.activeCompanyId)))
  const addProperty = useAppStore((s) => s.addProperty)
  const updateProperty = useAppStore((s) => s.updateProperty)
  const archiveProperty = useAppStore((s) => s.archiveProperty)
  const duplicateProperty = useAppStore((s) => s.duplicateProperty)
  const setPropertyStatus = useAppStore((s) => s.setPropertyStatus)
  const toast = useAppStore((s) => s.toast)

  const properties = useMemo(() => propertiesAll.filter((p) => p.companyId === companyId), [propertiesAll, companyId])
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [listingFilter, setListingFilter] = useState('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [selected, setSelected] = useState<string[]>([])
  const [formOpen, setFormOpen] = useState(params.get('new') === '1')
  const [editing, setEditing] = useState<Property | null>(null)
  const [detail, setDetail] = useState<Property | null>(null)
  const [confirmArchive, setConfirmArchive] = useState<Property | null>(null)
  const [dupesOpen, setDupesOpen] = useState(false)

  const closeForm = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditing(null)
      if (params.get('new')) { const p = new URLSearchParams(params); p.delete('new'); setParams(p, { replace: true }) }
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return properties
      .filter((p) => tab === 'all' ? p.listingStatus !== 'archived' : tab === 'published' ? p.listingStatus === 'published' : tab === 'drafts' ? p.listingStatus === 'draft' : tab === 'archived' ? p.listingStatus === 'archived' : p.status === tab)
      .filter((p) => typeFilter === 'all' || p.type === typeFilter)
      .filter((p) => listingFilter === 'all' || p.listingType === listingFilter)
      .filter((p) => !q || `${p.title} ${p.titleAr} ${p.code} ${p.location} ${p.projectId}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [properties, tab, typeFilter, listingFilter, query])

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.includes(p.id))
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map((p) => p.id))
  const toggle = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const bulk = (action: 'publish' | 'archive' | 'review' | 'export') => {
    const chosen = properties.filter((p) => selected.includes(p.id))
    if (action === 'export') {
      downloadCsv('inventory-export.csv', [['Code', 'Title', 'Type', 'Listing', 'Location', 'Price', 'Area', 'Bedrooms', 'Status', 'Verification'], ...chosen.map((p) => [p.code, p.title, p.type, p.listingType, p.location, p.price, p.area, p.bedrooms, p.status, p.verified ? 'Verified' : 'Unverified'])])
      toast('Inventory exported', `${chosen.length} properties downloaded as CSV.`)
      return
    }
    chosen.forEach((p) => {
      if (action === 'publish') updateProperty(p.id, { listingStatus: 'published', status: p.status === 'unavailable' ? 'available' : p.status })
      if (action === 'archive') archiveProperty(p.id)
      if (action === 'review') updateProperty(p.id, { status: 'pending_review' })
    })
    toast(action === 'publish' ? 'Listings published' : action === 'archive' ? 'Listings archived' : 'Sent for review', `${chosen.length} properties updated.`, 'info')
    setSelected([])
  }

  const duplicateCandidates = useMemo(() => {
    const pairs: { a: Property; b: Property; reason: string }[] = []
    properties.forEach((a, i) => {
      properties.slice(i + 1).forEach((b) => {
        if (pairs.some((x) => x.a.id === a.id && x.b.id === b.id)) return
        const sameProject = a.projectId && a.projectId === b.projectId && a.type === b.type
        const closePrice = Math.abs(a.price - b.price) / Math.max(a.price, b.price) < 0.05 && a.area === b.area
        if (sameProject || closePrice) pairs.push({ a, b, reason: sameProject ? 'Same project, type and near-identical specs' : 'Same area and price within 5%' })
      })
    })
    return pairs
  }, [properties])

  const published = properties.filter((p) => p.listingStatus === 'published')
  const totalValue = properties.reduce((s, p) => s + p.price, 0)
  const verified = properties.filter((p) => p.verified).length
  const drafts = properties.filter((p) => p.listingStatus === 'draft').length

  const openEdit = (p: Property) => { setEditing(p); setFormOpen(true); setDetail(null) }

  return (
    <div>
      <PageHeader
        title={t('Property & Inventory Management')}
        description={t('Listings, availability, verification and lifecycle for') + ' ' + (company?.name ?? t('your company')) + '.'}
        eyebrow={<><Building2 className="size-3.5 text-accent" /> {t('Workspace')} · {t('Inventory')}</>}
        actions={
          <>
            <Button variant="outline" onClick={() => setDupesOpen(true)}><Copy /> {t('Duplicate check')}{duplicateCandidates.length > 0 && <Badge tone="amber" className="ms-0.5">{duplicateCandidates.length}</Badge>}</Button>
            <Button variant="accent" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus /> {t('Add property')}</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Total listings')} value={properties.length} icon={Building2} hint={`${published.length} ${t('published')}`} />
        <StatCard label={t('Portfolio value')} value={formatEGP(totalValue, lang, true)} icon={Layers} tone="green" hint={t('Asking price total')} />
        <StatCard label={t('Verified')} value={`${properties.length ? Math.round((verified / properties.length) * 100) : 0}%`} icon={ShieldCheck} tone="blue" hint={`${verified} ${t('of')} ${properties.length} ${t('listings')}`} />
        <StatCard label={t('Needs attention')} value={drafts} icon={AlertTriangle} tone="amber" hint={`${properties.filter((p) => p.status === 'pending_review').length} ${t('pending review')}`} />
      </div>

      <Card className="mb-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <SearchInput value={query} onChange={setQuery} placeholder={t('Search title, code, area…')} className="w-full sm:w-64" />
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-32"><option value="all">{t('All types')}</option>{propertyTypes.map((x) => <option key={x} value={x}>{t(x)}</option>)}</Select>
          <Select value={listingFilter} onChange={(e) => setListingFilter(e.target.value)} className="w-28"><option value="all">{t('All listings')}</option>{listingTypes.map((x) => <option key={x} value={x}>{t(x)}</option>)}</Select>
          <div className="ms-auto flex items-center gap-2">
            <SegmentedControl value={view} onChange={setView} options={[{ value: 'grid', label: t('Grid'), icon: Grid3X3 }, { value: 'table', label: t('Table'), icon: LayoutList }]} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2">
          {[
            { id: 'all', label: 'All listings' }, { id: 'published', label: 'Published' }, { id: 'drafts', label: 'Drafts' },
            { id: 'available', label: 'Available' }, { id: 'reserved', label: 'Reserved' }, { id: 'sold', label: 'Sold' }, { id: 'archived', label: 'Archived' },
          ].map((x) => (
            <button key={x.id} onClick={() => setTab(x.id)} className={cn('h-7 rounded-md px-2.5 text-[10.5px] font-medium transition-colors', tab === x.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>{t(x.label)}</button>
          ))}
          <div className="ms-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {selected.length > 0 ? (
              <>
                <span className="font-medium text-foreground">{selected.length} {t('selected')}</span>
                <Button size="xs" variant="outline" onClick={() => bulk('publish')}><Upload /> {t('Publish')}</Button>
                <Button size="xs" variant="outline" onClick={() => bulk('review')}><Eye /> {t('Review')}</Button>
                <Button size="xs" variant="outline" onClick={() => bulk('export')}><Download /> {t('Export')}</Button>
                <Button size="xs" variant="danger-soft" onClick={() => bulk('archive')}><Archive /> {t('Archive')}</Button>
              </>
            ) : <span>{filtered.length} {t('listings shown')}</span>}
          </div>
        </div>
      </Card>

      {view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <div className="relative h-40 overflow-hidden bg-muted">
                <img src={p.images[0]} alt={p.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge status={p.status} />
                    {p.listingStatus === 'draft' && <Badge tone="default">Draft</Badge>}
                    {p.listingStatus === 'archived' && <Badge tone="default">Archived</Badge>}
                  </div>
                  <label className="grid size-6 cursor-pointer place-items-center rounded-md bg-white/90 shadow-sm"><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="size-3.5 accent-[#10B981]" /></label>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-[#071426]/80 to-transparent p-2.5">
                  <div><p className="text-[15px] font-semibold text-white">{formatEGP(p.price, lang, true)}</p><p className="text-[9px] text-white/70">{p.code} · {t(p.listingType)}</p></div>
                  {p.verified && <span className="inline-flex items-center gap-0.5 rounded bg-white/15 px-1.5 py-0.5 text-[8px] font-medium text-white backdrop-blur"><ShieldCheck className="size-2.5" /> {t('Verified')}</span>}
                </div>
              </div>
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><h3 className="truncate text-[13px] font-semibold">{lang === 'ar' ? p.titleAr : p.title}</h3><p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="size-2.5" /> {t(p.location)} · {t(p.type)}</p></div>
                  <button onClick={() => setDetail(p)} className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Eye className="size-3.5" /></button>
                </div>
                <div className="mt-2.5 flex items-center gap-3 border-t border-border pt-2.5 text-[10px] text-muted-foreground">
                  <span>{p.bedrooms} {t('bd')}</span><span>{p.bathrooms} {t('ba')}</span><span>{formatArea(p.area, lang)}</span><span className="ms-auto">{p.views} {t('views')}</span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <Button size="xs" variant="outline" onClick={() => openEdit(p)}><FileEdit /> {t('Edit')}</Button>
                  <Button size="xs" variant="ghost" onClick={() => { duplicateProperty(p.id); toast('Draft copy created', `${p.title} duplicated.`, 'info') }}><Copy /> {t('Duplicate')}</Button>
                  <button onClick={() => setConfirmArchive(p)} className="ms-auto rounded-md p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"><Archive className="size-3.5" /></button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <Card className="sm:col-span-2 xl:col-span-3"><DataTableEmpty title={t('No properties match')} description={t('Adjust your filters or add a new listing.')} action={<Button size="sm" variant="accent" onClick={() => setFormOpen(true)}>{t('Add property')}</Button>} /></Card>}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-[10px] text-muted-foreground">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-3.5 accent-[#10B981]" /> {t('Select all')}
            <span className="ms-auto">{filtered.length} {t('listings')}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-[11.5px]">
              <thead><tr className="bg-muted/30 text-[9px] uppercase tracking-wide text-muted-foreground">{['', 'Property', 'Type', 'Location', 'Price', 'Area', 'Status', 'Views', ''].map((h, i) => <th key={i} className="px-3 py-2 text-start font-semibold">{t(h)}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2"><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="size-3.5 accent-[#10B981]" /></td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><img src={p.images[0]} alt="" className="size-9 rounded-md object-cover" /><div className="min-w-0"><p className="max-w-[220px] truncate font-medium">{p.title}</p><p className="text-[9px] text-muted-foreground">{p.code} · {p.bedrooms}BD · {p.bathrooms}BA</p></div>{p.verified && <ShieldCheck className="size-3 text-emerald-500" />}</div></td>
                    <td className="px-3 py-2 capitalize">{t(p.type)}<p className="text-[9px] text-muted-foreground capitalize">{t(p.listingType)}</p></td>
                    <td className="px-3 py-2">{t(p.location)}</td>
                    <td className="px-3 py-2 font-medium">{formatEGP(p.price, lang, true)}</td>
                    <td className="px-3 py-2">{formatArea(p.area, lang)}</td>
                    <td className="px-3 py-2"><StatusBadge status={p.listingStatus === 'draft' ? 'draft' : p.status} /></td>
                    <td className="px-3 py-2 text-muted-foreground">{p.views}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-1"><Button size="icon-sm" variant="ghost" onClick={() => setDetail(p)}><Eye /></Button><Button size="icon-sm" variant="ghost" onClick={() => openEdit(p)}><FileEdit /></Button><Button size="icon-sm" variant="ghost" onClick={() => setConfirmArchive(p)}><Archive /></Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <PropertyDialog open={formOpen} onOpenChange={closeForm} property={editing} companyId={companyId} projects={projects} developers={developers} onSave={(payload) => { if (editing) updateProperty(editing.id, payload); else addProperty(payload) }} />

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)} width="520px">
        {detail && (
          <>
            <div className="relative h-48 shrink-0 overflow-hidden"><img src={detail.images[0]} alt="" className="size-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#071426]/80 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-4"><div className="mb-1.5 flex gap-1.5"><StatusBadge status={detail.status} />{detail.verified && <Badge tone="green"><ShieldCheck className="size-2.5" /> {t('Verified')}</Badge>}</div><h2 className="text-lg font-semibold text-white">{detail.title}</h2><p className="text-[11px] text-white/70">{detail.location} · {detail.code}</p></div></div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-baseline justify-between"><p className="text-[22px] font-semibold">{formatEGP(detail.price, lang)}</p><Badge tone="outline" className="capitalize">{t(detail.listingType)}</Badge></div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[[t('Bedrooms'), detail.bedrooms], [t('Bathrooms'), detail.bathrooms], [t('Area'), formatArea(detail.area, lang)]].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg border border-border p-2 text-center"><p className="text-[9px] text-muted-foreground">{label}</p><p className="text-[12px] font-semibold">{value}</p></div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-border p-3">
                <InfoRow label={t('Type')} value={t(detail.type)} />
                <InfoRow label={t('Finishing')} value={t(detail.finishing.replace(/_/g, ' '))} />
                <InfoRow label={t('Ready to move')} value={detail.readyToMove ? t('Yes') : t('No')} />
                <InfoRow label={t('Delivery')} value={formatDate(detail.deliveryDate, lang, 'MMM yyyy')} />
                <InfoRow label={t('Developer')} value={developers.find((d) => d.id === detail.developerId)?.name ?? '—'} />
                <InfoRow label={t('Project')} value={projects.find((p) => p.id === detail.projectId)?.name ?? '—'} />
                <InfoRow label={t('Listing status')} value={t(detail.listingStatus)} />
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-semibold">{t('Description')}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{detail.description}</p>
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-semibold">{t('Amenities')}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">{detail.amenities.map((a) => <span key={a} className="rounded-md bg-muted px-2 py-0.5 text-[9.5px] text-muted-foreground">{t(a)}</span>)}</div>
              </div>
              <div className="mt-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold"><History className="size-3.5 text-accent" /> {t('Listing history')}</p>
                <div className="mt-2 space-y-2 border-s border-border ps-3">
                  {[
                    { label: t('Created'), at: detail.createdAt, detail: `Listed as ${detail.listingType} by ${company?.name}.` },
                    { label: t('Last updated'), at: detail.updatedAt, detail: `Status ${detail.status.replace(/_/g, ' ')} · ${detail.views} views.` },
                    ...deals.filter((d) => d.propertyId === detail.id).slice(0, 2).map((d) => ({ label: t('Linked deal'), at: d.updatedAt, detail: `${d.code} · ${d.customerName} · ${d.stage}.` })),
                  ].map((h) => (
                    <div key={`${h.label}-${h.at}`} className="relative"><span className="absolute -start-[17px] top-1 size-1.5 rounded-full bg-accent" /><p className="text-[10.5px] font-medium">{h.label} <span className="font-normal text-muted-foreground">· {formatDate(h.at, lang, 'dd MMM yyyy')}</span></p><p className="text-[9.5px] text-muted-foreground">{h.detail}</p></div>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-1.5">
                <Button size="sm" variant="accent" onClick={() => openEdit(detail)}><FileEdit /> {t('Edit listing')}</Button>
                <Button size="sm" variant="outline" onClick={() => { duplicateProperty(detail.id); setDetail(null) }}><Copy /> {t('Duplicate')}</Button>
                {detail.listingStatus !== 'published' && <Button size="sm" variant="outline" onClick={() => { updateProperty(detail.id, { listingStatus: 'published' }); setDetail({ ...detail, listingStatus: 'published' }) }}><Upload /> {t('Publish')}</Button>}
                <Select value={detail.status} onChange={(e) => { const result = setPropertyStatus(detail.id, e.target.value as PropertyStatus); if (!result.ok) toast('Status not changed', result.message, 'error'); else setDetail({ ...detail, status: e.target.value as PropertyStatus }) }} className="h-8 w-32 text-[11px]">
                  {statuses.map((s) => <option key={s} value={s}>{t(s.replace(/_/g, ' '))}</option>)}
                </Select>
              </div>
            </div>
          </>
        )}
      </Sheet>

      <Dialog open={dupesOpen} onOpenChange={setDupesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t('Duplicate listing check')}</DialogTitle><DialogDescription>{t('Similar properties detected by project, type, area and price. Review before publishing.')}</DialogDescription></DialogHeader>
          {duplicateCandidates.length === 0 ? <EmptyState icon={CheckCircle2} title={t('No duplicates found')} description={t('Your inventory looks clean based on demo matching rules.')} /> : (
            <div className="space-y-2">
              {duplicateCandidates.slice(0, 8).map(({ a, b, reason }) => (
                <div key={`${a.id}-${b.id}`} className="rounded-lg border border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
                  <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium"><AlertTriangle className="size-3.5 text-amber-500" /> {a.code} ↔ {b.code}</div>
                  <p className="mt-1 text-[11px]">{a.title} <span className="text-muted-foreground">/</span> {b.title}</p>
                  <p className="mt-0.5 text-[9.5px] text-muted-foreground">{reason}</p>
                  <div className="mt-2 flex gap-1.5">
                    <Button size="xs" variant="outline" onClick={() => { setDetail(a); setDupesOpen(false) }}>{t('Inspect first')}</Button>
                    <Button size="xs" variant="ghost" onClick={() => { archiveProperty(b.id); setDupesOpen(false) }}>{t('Archive second listing')}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDupesOpen(false)}>{t('Close')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmArchive} onOpenChange={(v) => !v && setConfirmArchive(null)} title={t('Archive this listing?')} description={t('It will be removed from the marketplace but kept in inventory history.')} confirmLabel={t('Archive')} danger onConfirm={() => { if (confirmArchive) { archiveProperty(confirmArchive.id); toast('Listing archived', `${confirmArchive.code} is now archived.`, 'info') } }} />
    </div>
  )
}

function PropertyDialog({ open, onOpenChange, property, companyId, projects, developers, onSave }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  property: Property | null
  companyId: string
  projects: ReturnType<typeof useAppStore.getState>['projects']
  developers: ReturnType<typeof useAppStore.getState>['developers']
  onSave: (p: Property) => void
}) {
  const { t } = useI18n()
  const [form, setForm] = useState(() => blank(property))

  function blank(p: Property | null) {
    return {
      title: p?.title ?? '', titleAr: p?.titleAr ?? '', type: p?.type ?? 'apartment', listingType: p?.listingType ?? 'sale',
      location: p?.location ?? 'New Cairo', address: p?.address ?? '', price: p?.price ?? 8000000, area: p?.area ?? 150,
      bedrooms: p?.bedrooms ?? 3, bathrooms: p?.bathrooms ?? 2, floor: p?.floor ?? 0, finishing: p?.finishing ?? 'finished',
      deliveryDate: p?.deliveryDate.slice(0, 10) ?? new Date().toISOString().slice(0, 10), readyToMove: p?.readyToMove ?? false,
      developerId: p?.developerId ?? developers[0]?.id ?? '', projectId: p?.projectId ?? '', status: p?.status ?? 'pending_review',
      description: p?.description ?? '', verified: p?.verified ?? false, featured: p?.featured ?? false,
      image: p?.images[0] ?? images[0],
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.price || !form.area) return
    const plan = { downPaymentPct: 10, years: 8, monthly: Math.round((form.price * 0.9) / 96), deliveryDate: new Date(form.deliveryDate).toISOString() }
    const payload: Property = {
      id: property?.id ?? `p-${Math.random().toString(36).slice(2, 8)}`,
      code: property?.code ?? `NC-${Math.floor(2000 + Math.random() * 4000)}`,
      title: form.title.trim(), titleAr: form.titleAr.trim() || form.title.trim(),
      type: form.type as PropertyType, listingType: form.listingType as Property['listingType'],
      location: form.location, locationAr: form.location, address: form.address || `${form.location}, Egypt`,
      price: Number(form.price), area: Number(form.area), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms),
      floor: Number(form.floor), finishing: form.finishing as Property['finishing'], deliveryDate: new Date(form.deliveryDate).toISOString(),
      readyToMove: form.readyToMove, developerId: form.developerId || undefined, projectId: form.projectId || undefined,
      companyId: property?.companyId ?? companyId, ownerName: property?.ownerName ?? 'Company portfolio', status: form.status as PropertyStatus,
      listingStatus: property?.listingStatus ?? 'draft', verified: form.verified, featured: form.featured,
      images: property?.images ?? [form.image], description: form.description || 'A premium listing created in the Nawyati demo workspace.',
      descriptionAr: property?.descriptionAr ?? (form.description || 'وحدة عقارية في النسخة التجريبية من منصة نواياتي.'),
      amenities: property?.amenities ?? ['Clubhouse', '24/7 security', 'Underground parking'], paymentPlan: property?.paymentPlan ?? plan,
      lat: property?.lat ?? 30.03, lng: property?.lng ?? 31.47, views: property?.views ?? 0,
      createdAt: property?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    onSave(payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{property ? t('Edit property') : t('Add property')}</DialogTitle><DialogDescription>{t('Saved listings are stored locally and can be published to the demo marketplace.')}</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('English title')} required><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('e.g. Skyline 3BR Garden Apartment')} required /></Field>
            <Field label={t('Arabic title')}><Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} placeholder="شقة ٣ غرف بحديقة" dir="rtl" /></Field>
            <Field label={t('Property type')}><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PropertyType })}>{propertyTypes.map((x) => <option key={x} value={x}>{t(x)}</option>)}</Select></Field>
            <Field label={t('Listing type')}><Select value={form.listingType} onChange={(e) => setForm({ ...form, listingType: e.target.value as Property['listingType'] })}>{listingTypes.map((x) => <option key={x} value={x}>{t(x)}</option>)}</Select></Field>
            <Field label={t('Location')}><Select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>{['New Cairo', 'Sheikh Zayed', 'New Zayed', 'North Coast', 'New Capital', 'Maadi', 'Heliopolis', '6th of October', 'New Alamein', 'Mostakbal City'].map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label={t('Address')}><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={t('Street and compound')} /></Field>
            <Field label={t('Price (EGP)')} required><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required /></Field>
            <Field label={t('Area (m²)')} required><Input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: Number(e.target.value) })} required /></Field>
            <Field label={t('Bedrooms')}><Input type="number" min={0} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })} /></Field>
            <Field label={t('Bathrooms')}><Input type="number" min={0} value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })} /></Field>
            <Field label={t('Finishing')}><Select value={form.finishing} onChange={(e) => setForm({ ...form, finishing: e.target.value as Property['finishing'] })}>{['finished', 'semi_finished', 'core_shell'].map((x) => <option key={x} value={x}>{t(x.replace(/_/g, ' '))}</option>)}</Select></Field>
            <Field label={t('Delivery date')}><Input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} /></Field>
            <Field label={t('Developer')}><Select value={form.developerId} onChange={(e) => setForm({ ...form, developerId: e.target.value })}><option value="">{t('Private / none')}</option>{developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
            <Field label={t('Project')}><Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}><option value="">{t('Standalone property')}</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
            <Field label={t('Availability')}><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PropertyStatus })}>{statuses.map((x) => <option key={x} value={x}>{t(x.replace(/_/g, ' '))}</option>)}</Select></Field>
            <Field label={t('Cover image')}><Select value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}>{images.map((x, i) => <option key={x} value={x}>{t('Demo image')} {i + 1}</option>)}</Select></Field>
          </div>
          <Field label={t('Description')}><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder={t('Highlight layout, finishes, amenities and location benefits.')} /></Field>
          <div className="flex flex-wrap items-center gap-4">
            <Checkbox label={t('Ready to move')} checked={form.readyToMove} onChange={(e) => setForm({ ...form, readyToMove: e.target.checked })} />
            <Checkbox label={t('Verified listing')} checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
            <Checkbox label={t('Feature on marketplace')} checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
            <Button type="submit" variant="accent">{property ? t('Save listing') : t('Create listing')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
