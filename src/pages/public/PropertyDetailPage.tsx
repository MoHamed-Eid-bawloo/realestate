import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bath, BedDouble, Building2, CalendarDays, Check, ChevronLeft, ChevronRight, Copy,
  Heart, Landmark, Layers, MapPin, MessageCircle, Phone, Scan, Share2, ShieldCheck, Sparkles, Star,
  CalendarClock, Compass, Home, Wallet,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { formatArea, formatDate, formatEGP } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PropertyCard } from '@/components/PropertyCard'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Avatar } from '@/components/ui/misc'

export function PropertyDetailPage() {
  const { id } = useParams()
  const { t, tx, lang } = useI18n()
  const navigate = useNavigate()
  const properties = useAppStore((s) => s.properties)
  const developers = useAppStore((s) => s.developers)
  const projects = useAppStore((s) => s.projects)
  const brokers = useAppStore((s) => s.brokers)
  const favorites = useAppStore((s) => s.favorites)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const addInquiry = useAppStore((s) => s.addInquiry)
  const requestViewing = useAppStore((s) => s.requestViewing)
  const toast = useAppStore((s) => s.toast)

  const property = properties.find((p) => p.id === id)
  const [image, setImage] = useState(0)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [viewingOpen, setViewingOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [whatsappOpen, setWhatsappOpen] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('11:00')

  if (!property) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <Home className="size-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">{t('Property not found')}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{t('This listing may have been archived or the link is incorrect.')}</p>
        <Link to="/properties" className="mt-5"><Button>{t('Browse properties')}</Button></Link>
      </div>
    )
  }

  const developer = developers.find((d) => d.id === property.developerId)
  const project = projects.find((p) => p.id === property.projectId)
  const broker = brokers.find((b) => b.id === property.brokerId)
  const agentName = broker?.name ?? 'Youssef Adel'
  const agentPhone = broker?.phone ?? '+20 101 345 6789'
  const isFav = favorites.includes(property.id)
  const similar = properties.filter((p) => p.id !== property.id && p.listingStatus === 'published' && (p.location === property.location || p.type === property.type)).slice(0, 3)
  const plan = property.paymentPlan

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // Clipboard may be unavailable in some demo browsers; the link is shown for manual copy.
    }
    toast('Link copied', 'The property link is ready to share.')
    setShareOpen(false)
  }

  const submitInquiry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || phone.replace(/\D/g, '').length < 9) {
      toast('Check your details', 'Enter your name and a valid Egyptian phone number.', 'error')
      return
    }
    addInquiry(property, name.trim(), phone.trim(), message.trim() || `I would like more information about ${property.title}.`)
    setInquiryOpen(false)
    setName(''); setPhone(''); setMessage('')
  }

  const submitViewing = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !date) {
      toast('Add a date', 'Enter your name and choose a preferred viewing date.', 'error')
      return
    }
    requestViewing(property, name.trim(), date, time)
    setViewingOpen(false)
    setName('')
    setDate('')
  }

  return (
    <div className="bg-background pb-16">
      <div className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="size-3 rtl:rotate-180" /> {t('Back')}</button>
          <span>/</span>
          <Link to="/" className="hover:text-foreground">{t('Home')}</Link>
          <span>/</span>
          <Link to="/properties" className="hover:text-foreground">{t('Properties')}</Link>
          <span>/</span>
          <span className="truncate text-foreground">{tx(property.title, property.titleAr)}</span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.65fr_1fr]">
          <div className="relative overflow-hidden rounded-xl bg-muted">
            <div className="relative h-[300px] sm:h-[400px]">
              <img src={property.images[image]} alt={tx(property.title, property.titleAr)} className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
              <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-[#142B45]">{t(property.listingType === 'sale' ? 'For sale' : property.listingType === 'rent' ? 'For rent' : 'Resale')}</span>
                  {property.verified && <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/95 px-2 py-1 text-[10px] font-semibold text-white"><ShieldCheck className="size-3" /> {t('Verified')}</span>}
                  {property.featured && <span className="inline-flex items-center gap-1 rounded-md bg-[#142B45]/90 px-2 py-1 text-[10px] font-semibold text-white"><Sparkles className="size-3" /> {t('Featured')}</span>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => toggleFavorite(property.id)} className="grid size-8 place-items-center rounded-full bg-white/95 text-slate-600 shadow-sm hover:scale-105" aria-label="Favorite"><Heart className={cn('size-4', isFav && 'fill-rose-500 text-rose-500')} /></button>
                  <button onClick={() => setShareOpen(true)} className="grid size-8 place-items-center rounded-full bg-white/95 text-slate-600 shadow-sm hover:scale-105" aria-label="Share"><Share2 className="size-4" /></button>
                </div>
              </div>
              {property.images.length > 1 && (
                <>
                  <button onClick={() => setImage((i) => (i - 1 + property.images.length) % property.images.length)} className="absolute start-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#142B45] shadow-sm hover:bg-white"><ChevronLeft className="size-4" /></button>
                  <button onClick={() => setImage((i) => (i + 1) % property.images.length)} className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#142B45] shadow-sm hover:bg-white"><ChevronRight className="size-4" /></button>
                </>
              )}
              <span className="absolute bottom-3 end-3 rounded-md bg-black/45 px-2 py-1 text-[9px] font-medium text-white backdrop-blur">{image + 1} / {property.images.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1.5">
              {property.images.map((img, i) => (
                <button key={img + i} onClick={() => setImage(i)} className={cn('h-16 overflow-hidden rounded-md border-2 transition-opacity sm:h-20', i === image ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100')}>
                  <img src={img} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <Card className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{property.code}</p>
                <h1 className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.03em]">{tx(property.title, property.titleAr)}</h1>
                <p className="mt-1.5 flex items-center gap-1 text-[12px] text-muted-foreground"><MapPin className="size-3.5" /> {t(property.location)} · {property.address}</p>
              </div>
              <StatusBadge status={property.status} />
            </div>

            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3.5">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{t('Asking price')}</p>
              <p className="mt-0.5 text-[26px] font-semibold tracking-[-0.035em]">{formatEGP(property.price, lang)}</p>
              {property.listingType !== 'rent' && (
                <p className="mt-1 text-[10px] text-muted-foreground">{t('From')} {formatEGP(plan.monthly, lang, true)} / {t('mo')} · {plan.downPaymentPct}% {t('down payment')} · {plan.years} {t('years')}</p>
              )}
              {property.listingType === 'rent' && <p className="mt-1 text-[10px] text-muted-foreground">{t('Monthly rent · utilities excluded')}</p>}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { icon: BedDouble, label: t('Bedrooms'), value: property.bedrooms || '—' },
                { icon: Bath, label: t('Bathrooms'), value: property.bathrooms },
                { icon: Scan, label: t('Area'), value: formatArea(property.area, lang) },
                { icon: Layers, label: t('Floor'), value: property.floor === 0 ? t('Ground') : property.floor },
                { icon: Compass, label: t('Finishing'), value: t(property.finishing === 'finished' ? 'Finished' : property.finishing === 'semi_finished' ? 'Semi finished' : 'Core & shell') },
                { icon: CalendarDays, label: t('Delivery'), value: property.readyToMove ? t('Ready to move') : formatDate(property.deliveryDate, lang, 'MMM yyyy') },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2">
                  <f.icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[9px] text-muted-foreground">{f.label}</p>
                    <p className="truncate text-[11px] font-medium">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-4">
              <Avatar name={agentName} color={broker?.avatarColor ?? '#142B45'} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold">{agentName}</p>
                <p className="text-[10px] text-muted-foreground">{t('Senior Property Consultant')}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-500" /> {t('Responds in under 15 min')}</p>
              </div>
              <a href={`tel:${agentPhone.replace(/\s/g, '')}`} className="grid size-8 place-items-center rounded-lg border border-border hover:bg-muted" aria-label={t('Call agent')}><Phone className="size-3.5" /></a>
            </div>

            <div className="mt-3 space-y-2">
              <Button className="w-full" onClick={() => setInquiryOpen(true)}>{t('Make an inquiry')}</Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setViewingOpen(true)} className="gap-1.5"><CalendarClock className="size-3.5" /> {t('Request a viewing')}</Button>
                <Button variant="outline" onClick={() => setWhatsappOpen(true)} className="gap-1.5 text-emerald-700 dark:text-emerald-400"><MessageCircle className="size-3.5" /> WhatsApp</Button>
              </div>
            </div>
            <p className="mt-2.5 text-center text-[9px] text-muted-foreground">{t('Demo contact — no real messages or calls are placed.')}</p>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold">{t('About this property')}</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{tx(property.description, property.descriptionAr)}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  `${t('Delivery')}: ${formatDate(property.deliveryDate, lang, 'MMMM yyyy')}`,
                  `${t('Finishing')}: ${t(property.finishing === 'finished' ? 'Finished' : property.finishing === 'semi_finished' ? 'Semi finished' : 'Core & shell')}`,
                  `${t('Ownership')}: ${t(property.ownerName)}`,
                  `${t('Listing')}: ${property.verified ? t('Verified by Nawyati') : t('Pending verification')}`,
                ].map((line) => <p key={line} className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Check className="size-3 text-emerald-500" /> {line}</p>)}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-[15px] font-semibold">{t('Amenities')}</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {property.amenities.map((a) => (
                  <span key={a} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-2 text-[11px]"><Check className="size-3.5 text-emerald-500" /> {t(a)}</span>
                ))}
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <h2 className="flex items-center gap-1.5 text-[15px] font-semibold"><Wallet className="size-4 text-muted-foreground" /> {t('Payment plan')}</h2>
                <PaymentCalculator price={property.price} baseDown={plan.downPaymentPct} years={plan.years} monthly={plan.monthly} delivery={plan.deliveryDate} />
              </Card>
              <Card className="p-5">
                <h2 className="flex items-center gap-1.5 text-[15px] font-semibold"><Landmark className="size-4 text-muted-foreground" /> {t('Floor plan')}</h2>
                <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                  <svg viewBox="0 0 240 160" className="w-full">
                    <rect x="4" y="4" width="232" height="152" rx="4" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400" />
                    <line x1="120" y1="4" x2="120" y2="100" stroke="currentColor" strokeWidth="1.5" className="text-slate-300" />
                    <line x1="4" y1="100" x2="160" y2="100" stroke="currentColor" strokeWidth="1.5" className="text-slate-300" />
                    <line x1="160" y1="100" x2="160" y2="156" stroke="currentColor" strokeWidth="1.5" className="text-slate-300" />
                    <rect x="24" y="24" width="54" height="36" rx="2" fill="#10B981" opacity="0.13" />
                    <rect x="140" y="24" width="70" height="48" rx="2" fill="#142B45" opacity="0.1" />
                    <rect x="24" y="116" width="70" height="22" rx="2" fill="#0EA5E9" opacity="0.12" />
                    <text x="40" y="46" className="fill-slate-500 text-[8px]">{t('Bedroom')}</text>
                    <text x="154" y="52" className="fill-slate-500 text-[8px]">{t('Living')}</text>
                    <text x="36" y="130" className="fill-slate-500 text-[8px]">{t('Kitchen')}</text>
                    <text x="130" y="140" className="fill-slate-500 text-[8px]">{t('Terrace')}</text>
                  </svg>
                </div>
                <p className="mt-2 text-[9px] text-muted-foreground">{t('Illustrative floor plan for this demo listing.')} {formatArea(property.area, lang)}</p>
              </Card>
            </div>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold">{t('Location')}</h2>
                <span className="text-[10px] text-muted-foreground">{t(property.location)}</span>
              </div>
              <div className="relative mt-3 h-[220px] overflow-hidden rounded-lg border border-border bg-[#EDF3EC] dark:bg-[#12241f]">
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 size-full">
                  <path d="M-2 30 L102 20" stroke="#CBD5D8" strokeWidth="2" />
                  <path d="M30 -2 L38 52" stroke="#D5DEE0" strokeWidth="1.4" />
                  <path d="M70 -2 L64 52" stroke="#D5DEE0" strokeWidth="1.4" />
                  <circle cx="50" cy="25" r="13" fill="#DDE8D7" />
                </svg>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="relative flex size-10 items-center justify-center rounded-full bg-accent text-white shadow-pop">
                    <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" />
                    <MapPin className="size-5" />
                  </span>
                </div>
                <div className="absolute bottom-3 start-3 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-card">
                  <p className="text-[10px] font-semibold">{tx(property.title, property.titleAr)}</p>
                  <p className="text-[9px] text-muted-foreground">{property.address} · {property.lat.toFixed(3)}, {property.lng.toFixed(3)}</p>
                </div>
                <span className="absolute end-3 top-3 rounded bg-card/90 px-2 py-1 text-[9px] text-muted-foreground">{t('Demo map')}</span>
              </div>
            </Card>

            <div>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('Similar properties')}</h2>
                <Link to={`/properties?location=${encodeURIComponent(property.location)}`} className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline">{t('View more')} <ArrowRight className="size-3 rtl:rotate-180" /></Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {developer && (
              <Card className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('Developer')}</p>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="grid size-10 place-items-center rounded-xl text-xs font-bold text-white" style={{ background: developer.logoColor }}>{developer.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold">{developer.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t('Founded')} {developer.founded} · {developer.projects} {t('projects')}</p>
                  </div>
                  {developer.verified && <ShieldCheck className="ms-auto size-4 text-emerald-500" />}
                </div>
                <p className="mt-2 line-clamp-3 text-[10px] leading-relaxed text-muted-foreground">{developer.description}</p>
                <Link to={`/projects?developer=${developer.id}`} className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-accent hover:underline">{t('View developer projects')} <ArrowRight className="size-3 rtl:rotate-180" /></Link>
              </Card>
            )}
            {project && (
              <Card className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('Project')}</p>
                <div className="mt-2 flex gap-2.5">
                  <img src={project.images[0]} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold">{tx(project.name, project.nameAr)}</p>
                    <p className="text-[10px] text-muted-foreground">{t(project.location)} · {project.availableUnits} {t('available units')}</p>
                    <Link to={`/projects?project=${project.id}`} className="mt-1 inline-flex text-[10px] font-medium text-accent hover:underline">{t('Project details')} →</Link>
                  </div>
                </div>
              </Card>
            )}

            <Card className="border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-800 dark:text-emerald-300"><ShieldCheck className="size-4" /> {t('Nawyati buyer protection')}</p>
              <ul className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-emerald-900/75 dark:text-emerald-200/70">
                {['Ownership and pricing verified by our team', 'No hidden brokerage fees', 'Reservation reviewed before payment', 'Dedicated consultant through handover'].map((x) => (
                  <li key={x} className="flex items-start gap-1.5"><Check className="mt-0.5 size-3 shrink-0" /> {t(x)}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-4">
              <p className="text-[12px] font-semibold">{t('AI match score')}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="relative grid size-14 place-items-center rounded-full" style={{ background: 'conic-gradient(#10B981 92%, rgb(var(--muted)) 0)' }}>
                  <span className="grid size-11 place-items-center rounded-full bg-card text-[12px] font-semibold">92%</span>
                </div>
                <div>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">{t('Strong match for buyers looking in')} {t(property.location)} {t('with a')} {formatEGP(property.price, lang, true)} {t('budget.')}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[9px] text-muted-foreground"><Sparkles className="size-2.5 text-emerald-500" /> {t('AI simulated')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-[12px] font-semibold">{t('What buyers ask')}</p>
              <div className="mt-2 space-y-1.5">
                {['Is the price negotiable?', 'Can I visit this week?', 'What is the payment plan?', 'Is parking included?'].map((q) => (
                  <button key={q} onClick={() => { setMessage(q); setInquiryOpen(true) }} className="flex w-full items-center justify-between rounded-lg border border-border px-2.5 py-2 text-start text-[10px] hover:bg-muted">
                    {t(q)} <ArrowRight className="size-3 text-muted-foreground rtl:rotate-180" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Inquiry */}
      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Make an inquiry')}</DialogTitle>
            <DialogDescription>{t('A consultant will contact you about')} {tx(property.title, property.titleAr)}. {t('Demo only — no real message is sent.')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitInquiry} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('Full name')} required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Your name')} /></Field>
              <Field label={t('Phone')} required><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 1XX XXX XXXX" dir="ltr" /></Field>
            </div>
            <Field label={t('Message')}><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('Tell us what you would like to know')} /></Field>
            <div className="rounded-lg bg-muted/50 p-2.5 text-[10px] text-muted-foreground">{t('By submitting you agree to be contacted by a verified consultant. This form is simulated.')}</div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInquiryOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit">{t('Send inquiry')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Viewing */}
      <Dialog open={viewingOpen} onOpenChange={setViewingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Request a viewing')}</DialogTitle>
            <DialogDescription>{t('Choose a preferred date and time. Your request will be confirmed by the consultant.')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitViewing} className="space-y-3">
            <Field label={t('Full name')} required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Your name')} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Preferred date')} required><Input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} /></Field>
              <Field label={t('Preferred time')}>
                <Select value={time} onChange={(e) => setTime(e.target.value)}>
                  {['10:00', '11:00', '12:00', '14:00', '15:30', '17:00', '19:00'].map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <img src={property.images[0]} alt="" className="size-10 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium">{tx(property.title, property.titleAr)}</p>
                <p className="text-[9px] text-muted-foreground">{t(property.location)} · {formatEGP(property.price, lang, true)}</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setViewingOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit">{t('Request viewing')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* WhatsApp demo */}
      <Dialog open={whatsappOpen} onOpenChange={setWhatsappOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('WhatsApp your consultant')}</DialogTitle>
            <DialogDescription>{t('This is a simulated WhatsApp conversation. No messages leave this demo.')}</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-[#E7F6EC] p-3 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2 border-b border-emerald-200/60 pb-2 dark:border-emerald-500/20">
              <Avatar name={agentName} color="#0F766E" size="sm" />
              <div>
                <p className="text-[11px] font-semibold">{agentName}</p>
                <p className="text-[9px] text-muted-foreground">{t('Online · usually replies quickly')}</p>
              </div>
            </div>
            <div className="mt-2 space-y-1.5">
              <p className="max-w-[85%] rounded-lg rounded-ss-none bg-white px-2.5 py-1.5 text-[11px] text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">{t('Hello! Thanks for your interest in')} {tx(property.title, property.titleAr)}. {t('How can I help?')}</p>
              <p className="ms-auto max-w-[85%] rounded-lg rounded-se-none bg-[#D9FDD3] px-2.5 py-1.5 text-[11px] text-slate-700 shadow-sm dark:bg-emerald-900/60 dark:text-emerald-100">{message || t('I would like to arrange a viewing this week.')}</p>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-white p-1.5 dark:bg-slate-800">
              <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('Type a message…')} className="flex-1 bg-transparent px-2 text-[11px] outline-none" />
              <Button size="xs" onClick={() => { if (message.trim()) { toast('Demo WhatsApp message sent', `${agentName} will reply in this simulated conversation.`); setMessage('') } }}>{t('Send')}</Button>
            </div>
            <p className="mt-2 flex items-center justify-center gap-1 text-[8px] text-muted-foreground"><ShieldCheck className="size-2.5" /> {t('Simulated demo chat · real WhatsApp is not connected')}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Share this property')}</DialogTitle>
            <DialogDescription>{t('Copy the link or share it with a friend.')}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
            <input readOnly value={shareUrl} dir="ltr" className="min-w-0 flex-1 bg-transparent px-1 text-[10px] text-muted-foreground outline-none" />
            <Button size="sm" variant="outline" onClick={copyLink}><Copy className="size-3.5" /> {t('Copy')}</Button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {['WhatsApp', 'Email', 'SMS'].map((c) => (
              <button key={c} onClick={() => { toast(`${c} share simulated`, 'Sharing is a demo action in this build.', 'info'); setShareOpen(false) }} className="rounded-lg border border-border p-3 text-center text-[11px] font-medium hover:bg-muted">{t(c)}</button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PaymentCalculator({ price, baseDown, years, monthly, delivery }: { price: number; baseDown: number; years: number; monthly: number; delivery: string }) {
  const { t, lang } = useI18n()
  const [down, setDown] = useState(baseDown)
  const [term, setTerm] = useState(years)
  const downAmount = Math.round((price * down) / 100)
  const financed = price - downAmount
  const computed = Math.round(financed / (term * 12))
  const display = Math.abs(computed - monthly) < 1000 ? monthly : computed

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-lg bg-muted/40 p-3">
        <p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{t('Estimated monthly')}</p>
        <p className="text-xl font-semibold tracking-[-0.03em]">{formatEGP(display, lang, true)}</p>
        <p className="text-[10px] text-muted-foreground">{formatEGP(downAmount, lang, true)} {t('down payment')} · {term} {t('years')}</p>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px]"><span className="text-muted-foreground">{t('Down payment percentage')}</span><span className="font-medium">{down}%</span></div>
        <input type="range" min={5} max={40} step={5} value={down} onChange={(e) => setDown(Number(e.target.value))} className="w-full accent-[#10B981]" />
      </div>
      <Field label={t('Installment years')}>
        <Select value={term} onChange={(e) => setTerm(Number(e.target.value))} className="h-8 text-[11px]">
          {Array.from({ length: 10 }, (_, i) => i + 3).map((y) => <option key={y} value={y}>{y} {t('years')}</option>)}
        </Select>
      </Field>
      <div className="flex items-center justify-between border-t border-border pt-2.5 text-[10px]">
        <span className="text-muted-foreground">{t('Delivery')}</span>
        <span className="font-medium">{formatDate(delivery, lang, 'MMM yyyy')}</span>
      </div>
    </div>
  )
}
