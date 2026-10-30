import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Bell, BellOff, CalendarClock, CalendarDays, Clock, Compass, Heart, Home, LogOut, Mail, MapPin,
  MessageSquare, Phone, Search, Sparkles, Trash2, UserRound, Wallet, BedDouble, Bath, Scan, ShieldCheck, Plus,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { useTab } from '@/lib/useTab'
import { formatArea, formatDate, formatEGP, fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PropertyCard } from '@/components/PropertyCard'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, EmptyState, Switch } from '@/components/ui/misc'

const tabs = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'searches', label: 'Saved searches', icon: Search },
  { id: 'inquiries', label: 'My inquiries', icon: MessageSquare },
  { id: 'viewings', label: 'Viewing appointments', icon: CalendarClock },
  { id: 'requests', label: 'Buyer requests', icon: Compass },
  { id: 'profile', label: 'Profile', icon: UserRound },
]

export function AccountPage() {
  const { t, lang } = useI18n()
  const { tab, setTab } = useTab('overview')
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const account = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)
  const properties = useAppStore((s) => s.properties)
  const favorites = useAppStore((s) => s.favorites)
  const inquiries = useAppStore((s) => s.inquiries)
  const viewings = useAppStore((s) => s.viewingAppointments)
  const savedSearches = useAppStore((s) => s.savedSearches)
  const buyerRequests = useAppStore((s) => s.buyerRequests)
  const removeSavedSearch = useAppStore((s) => s.removeSavedSearch)
  const addSavedSearch = useAppStore((s) => s.addSavedSearch)
  const cancelViewing = useAppStore((s) => s.cancelViewingRequest)
  const addBuyerRequest = useAppStore((s) => s.addBuyerRequest)
  const toast = useAppStore((s) => s.toast)

  const [requestOpen, setRequestOpen] = useState(false)
  const [requestTitle, setRequestTitle] = useState('')
  const [requestLocation, setRequestLocation] = useState('New Cairo')
  const [requestBudget, setRequestBudget] = useState('12000000')
  const [profileName, setProfileName] = useState(account?.fullName ?? 'Layla Hassan')
  const [profilePhone, setProfilePhone] = useState('+20 100 555 7712')
  const [profileEmail, setProfileEmail] = useState(account?.email ?? 'layla.hassan@example.com')
  const [alerts, setAlerts] = useState(true)
  const [profileSeeded, setProfileSeeded] = useState(Boolean(account))

  useEffect(() => {
    if (!account || profileSeeded) return
    setProfileName(account.fullName)
    setProfileEmail(account.email)
    setProfileSeeded(true)
  }, [account, profileSeeded])

  const favProperties = properties.filter((p) => favorites.includes(p.id))
  const recommendations = useMemo(() => properties
    .filter((p) => p.listingStatus === 'published' && p.status === 'available' && !favorites.includes(p.id))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.views - a.views)
    .slice(0, 6), [properties, favorites])
  const upcoming = viewings.filter((v) => v.status !== 'cancelled').slice(0, 3)

  const openRequest = () => {
    setRequestTitle('')
    setRequestLocation('New Cairo')
    setRequestBudget('12000000')
    setRequestOpen(true)
  }

  const submitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestTitle.trim()) {
      toast('Add a title', 'Describe the property you are looking for.', 'error')
      return
    }
    addBuyerRequest({ title: requestTitle.trim(), locations: [requestLocation], budget: Number(requestBudget) })
    setRequestOpen(false)
  }

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    toast('Profile updated', 'Your contact preferences were saved for this demo session.')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const displayName = account?.fullName ?? profileName

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={displayName} color={account?.avatarColor ?? '#0F766E'} size="lg" className="size-14 text-base" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">{t('Customer account')}</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-[-0.03em]">{t('Hello')}, {displayName.split(' ')[0]}</h1>
            <p className="mt-1 text-[12px] text-muted-foreground">{session && account ? account.email : t('Your shortlist, searches and visits in one place.')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/properties"><Button variant="outline" className="gap-1.5"><Search className="size-3.5" /> {t('Browse properties')}</Button></Link>
          <Button onClick={openRequest} className="gap-1.5"><Plus className="size-3.5" /> {t('New buyer request')}</Button>
          {session && <Button variant="ghost" className="gap-1.5" onClick={handleSignOut}><LogOut className="size-3.5" /> {t('Sign out')}</Button>}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Saved homes', value: favorites.length, icon: Heart, tone: 'text-rose-500' },
          { label: 'Active inquiries', value: inquiries.filter((i) => i.status !== 'closed').length, icon: MessageSquare, tone: 'text-sky-500' },
          { label: 'Upcoming viewings', value: viewings.filter((v) => v.status !== 'cancelled').length, icon: CalendarClock, tone: 'text-amber-500' },
          { label: 'Buyer requests', value: buyerRequests.length, icon: Compass, tone: 'text-emerald-500' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{t(s.label)}</p>
              <s.icon className={cn('size-4', s.tone)} />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside>
          <Card className="overflow-hidden p-1.5">
            {tabs.map((item) => {
              const active = tab === item.id
              const count = item.id === 'favorites' ? favorites.length : item.id === 'viewings' ? viewings.length : item.id === 'inquiries' ? inquiries.length : item.id === 'requests' ? buyerRequests.length : 0
              return (
                <button key={item.id} onClick={() => setTab(item.id)} className={cn('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] transition-colors', active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  <item.icon className="size-4 shrink-0" />
                  <span className="flex-1 text-start">{t(item.label)}</span>
                  {count > 0 && <span className={cn('grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-semibold', active ? 'bg-white/20' : 'bg-muted text-muted-foreground')}>{count}</span>}
                </button>
              )
            })}
          </Card>
          <Card className="mt-3 border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300"><Sparkles className="size-3.5" /> {t('AI concierge')}</p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-emerald-900/70 dark:text-emerald-200/70">{t('Tell us your budget and preferred area. We will shortlist verified homes and arrange viewings.')}</p>
            <Button size="sm" variant="outline" className="mt-3 w-full border-emerald-300/60 bg-white/60 text-[11px] dark:bg-transparent" onClick={openRequest}>{t('Get a shortlist')}</Button>
          </Card>
        </aside>

        <div className="min-w-0">
          {tab === 'overview' && (
            <div className="space-y-6">
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold">{t('Upcoming viewings')}</h2>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Your confirmed and requested property visits.')}</p>
                  </div>
                  <button onClick={() => setTab('viewings')} className="text-[11px] font-medium text-accent hover:underline">{t('View all')}</button>
                </div>
                {upcoming.length === 0 ? (
                  <EmptyState icon={CalendarDays} title={t('No upcoming viewings')} description={t('Request a visit from any property page.')} action={<Link to="/properties"><Button size="sm" variant="outline">{t('Browse marketplace')}</Button></Link>} />
                ) : (
                  <div className="mt-3 space-y-2">
                    {upcoming.map((v) => {
                      const prop = properties.find((p) => p.id === v.propertyId)
                      return (
                        <div key={v.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                          <img src={prop?.images[0]} alt="" className="size-12 shrink-0 rounded-md object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-medium">{prop ? t(prop.title) : t('Property')}</p>
                            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="size-3" /> {formatDate(v.date, lang, 'EEE, dd MMM')} · {v.time}</p>
                          </div>
                          <StatusBadge status={v.status} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

              <div>
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('Recommended for you')}</h2>
                    <p className="text-[11px] text-muted-foreground">{t('Matched to your saved homes and budget.')}</p>
                  </div>
                  <Link to="/properties" className="text-[11px] font-medium text-accent hover:underline">{t('See all')}</Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {recommendations.slice(0, 3).map((p) => <PropertyCard key={p.id} property={p} />)}
                </div>
              </div>

              <Card className="p-5">
                <h2 className="text-[15px] font-semibold">{t('Your buyer requests')}</h2>
                {buyerRequests.length === 0 ? <p className="mt-2 text-[11px] text-muted-foreground">{t('Your submitted requests will appear here.')}</p> : (
                  <div className="mt-3 divide-y divide-border">
                    {buyerRequests.map((r) => (
                      <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                        <div>
                          <p className="text-[12px] font-medium">{r.title}</p>
                          <p className="text-[10px] text-muted-foreground">{r.locations.join(' · ')} · {formatEGP(r.budget, lang)}</p>
                        </div>
                        <Badge tone={r.status === 'Matched' ? 'green' : 'blue'}>{t(r.status)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {tab === 'favorites' && (
            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('Favorites')}</h2>
                  <p className="text-[11px] text-muted-foreground">{favorites.length} {t('saved properties')} · {t('tap the heart on any listing to save it')}</p>
                </div>
                <Link to="/properties"><Button size="sm" variant="outline">{t('Find more homes')}</Button></Link>
              </div>
              {favProperties.length === 0 ? (
                <Card><EmptyState icon={Heart} title={t('No saved properties yet')} description={t('Start exploring and tap the heart to save properties.')} action={<Link to="/properties"><Button size="sm">{t('Browse properties')}</Button></Link>} /></Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{favProperties.map((p) => <PropertyCard key={p.id} property={p} />)}</div>
              )}
            </section>
          )}

          {tab === 'searches' && (
            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('Saved searches')}</h2>
                  <p className="text-[11px] text-muted-foreground">{t('Get alerted when matching verified listings go live.')}</p>
                </div>
                <Link to="/properties"><Button size="sm" variant="outline">{t('Create new search')}</Button></Link>
              </div>
              <div className="space-y-2">
                {savedSearches.map((s) => (
                  <Card key={s.id} className="flex flex-wrap items-center gap-3 p-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary dark:bg-white/5 dark:text-slate-200"><Search className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.filters} · {t('saved')} {fromNow(s.createdAt, lang)}</p>
                    </div>
                    <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {s.alerts ? <Bell className="size-3.5 text-accent" /> : <BellOff className="size-3.5" />}
                      <Switch checked={s.alerts} onCheckedChange={(v) => {
                        // Toggle alert preference in-place by replacing the saved search record.
                        addSavedSearch({ ...s, id: s.id, alerts: v })
                        removeSavedSearch(s.id)
                        toast(v ? 'Alerts enabled' : 'Alerts paused', v ? 'We will notify you about matching listings.' : 'You will no longer receive alerts for this search.', 'info')
                      }} />
                    </label>
                    <Link to={`/properties?location=${encodeURIComponent(s.filters.split(' · ')[0])}`}><Button size="xs" variant="outline">{t('View results')}</Button></Link>
                    <button onClick={() => { removeSavedSearch(s.id); toast('Search removed', 'The saved search was deleted.', 'info') }} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-rose-500"><Trash2 className="size-3.5" /></button>
                  </Card>
                ))}
                {savedSearches.length === 0 && <Card><EmptyState icon={Search} title={t('No saved searches')} description={t('Save any search from the marketplace to track new matches.')} /></Card>}
              </div>
            </section>
          )}

          {tab === 'inquiries' && (
            <section>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('My inquiries')}</h2>
              <p className="mb-3 text-[11px] text-muted-foreground">{t('Every property question and its status.')}</p>
              {inquiries.length === 0 ? <Card><EmptyState icon={MessageSquare} title={t('No inquiries yet')} description={t('Questions you send from a property page will appear here.')} action={<Link to="/properties"><Button size="sm" variant="outline">{t('Browse properties')}</Button></Link>} /></Card> : (
                <div className="space-y-2">
                  {inquiries.map((inq) => {
                    const prop = properties.find((p) => p.id === inq.propertyId)
                    return (
                      <Card key={inq.id} className="p-4">
                        <div className="flex flex-wrap items-start gap-3">
                          <img src={prop?.images[0]} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link to={`/properties/${inq.propertyId}`} className="text-[12px] font-semibold hover:text-accent">{inq.propertyTitle}</Link>
                              <StatusBadge status={inq.status} />
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">“{inq.message}”</p>
                            <p className="mt-1.5 text-[9px] text-muted-foreground">{fromNow(inq.at, lang)}</p>
                          </div>
                          <Button size="xs" variant="outline" onClick={() => toast('Consultant notified', 'A demo follow-up request was added to the agent inbox.', 'info')}>{t('Follow up')}</Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {tab === 'viewings' && (
            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('Viewing appointments')}</h2>
                  <p className="text-[11px] text-muted-foreground">{t('Requested, confirmed and completed visits.')}</p>
                </div>
                <Link to="/properties"><Button size="sm" variant="outline">{t('Schedule a visit')}</Button></Link>
              </div>
              <div className="space-y-2">
                {viewings.map((v) => {
                  const prop = properties.find((p) => p.id === v.propertyId)
                  return (
                    <Card key={v.id} className={cn('p-4', v.status === 'cancelled' && 'opacity-60')}>
                      <div className="flex flex-wrap items-center gap-3">
                        <img src={prop?.images[0]} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold">{prop ? t(prop.title) : t('Property')}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" /> {formatDate(v.date, lang, 'EEE, dd MMM yyyy')}</span>
                            <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {v.time}</span>
                            <span className="inline-flex items-center gap-1"><UserRound className="size-3" /> {v.agentName}</span>
                          </p>
                        </div>
                        <StatusBadge status={v.status} />
                        {v.status !== 'cancelled' && v.status !== 'completed' && (
                          <Button size="xs" variant="outline" onClick={() => cancelViewing(v.id)}>{t('Cancel')}</Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
                {viewings.length === 0 && <Card><EmptyState icon={CalendarDays} title={t('No upcoming viewings')} description={t('Request a visit from any property page.')} /></Card>}
              </div>
            </section>
          )}

          {tab === 'requests' && (
            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('Buyer requests')}</h2>
                  <p className="text-[11px] text-muted-foreground">{t('Verified agencies send matching proposals to your requests.')}</p>
                </div>
                <Button size="sm" onClick={openRequest}><Plus className="size-3.5" /> {t('New request')}</Button>
              </div>
              <div className="space-y-2">
                {buyerRequests.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[12px] font-semibold">{r.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {r.locations.join(' · ')}</span>
                          <span className="inline-flex items-center gap-1"><Wallet className="size-3" /> {formatEGP(r.budget, lang)}</span>
                        </p>
                        <p className="mt-1 text-[9px] text-muted-foreground">{t('Submitted')} {fromNow(r.createdAt, lang)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={r.status === 'Matched' ? 'green' : 'blue'}>{t(r.status)}</Badge>
                        <Button size="xs" variant="outline" onClick={() => toast('Proposals requested', 'Participating agencies were asked to send matches in this demo.', 'info')}>{t('View proposals')}</Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {buyerRequests.length === 0 && <Card><EmptyState icon={Compass} title={t('No buyer requests')} description={t('Describe the property you want and let verified agencies propose matches.')} action={<Button size="sm" onClick={openRequest}>{t('Create request')}</Button>} /></Card>}
              </div>
            </section>
          )}

          {tab === 'profile' && (
            <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
              <Card className="p-5">
                <h2 className="text-[15px] font-semibold">{t('Profile')}</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t('Your contact details and preferences.')}</p>
                <form onSubmit={saveProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label={t('Full name')}><Input value={profileName} onChange={(e) => setProfileName(e.target.value)} /></Field>
                  <Field label={t('Phone')}><Input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} dir="ltr" /></Field>
                  <Field label={t('Email')} className="sm:col-span-2"><Input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} type="email" dir="ltr" /></Field>
                  <Field label={t('Preferred location')}><Select defaultValue="New Cairo">{[...new Set(properties.map((p) => p.location))].map((l) => <option key={l} value={l}>{t(l)}</option>)}</Select></Field>
                  <Field label={t('Budget')}><Select defaultValue="12000000">{[5000000, 8000000, 12000000, 18000000, 25000000].map((b) => <option key={b} value={b}>{formatEGP(b, lang, true)}</option>)}</Select></Field>
                  <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                    <div>
                      <p className="text-[11px] font-medium">{t('Property alerts')}</p>
                      <p className="text-[9px] text-muted-foreground">{t('Receive new matching listings by email and WhatsApp.')}</p>
                    </div>
                    <Switch checked={alerts} onCheckedChange={(v) => { setAlerts(v); toast(v ? 'Alerts enabled' : 'Alerts paused', 'Notification preferences updated.', 'info') }} />
                  </div>
                  <div className="sm:col-span-2"><Button type="submit">{t('Save changes')}</Button></div>
                </form>
              </Card>
              <div className="space-y-3">
                <Card className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('Account')}</p>
                  <div className="mt-2 space-y-2 text-[11px]">
                    <p className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" /> <span dir="ltr">{profilePhone}</span></p>
                    <p className="flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" /> {profileEmail}</p>
                    <p className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-emerald-500" /> {t('Verified buyer')}</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('Preferences')}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['Apartments', 'Ready to move', 'Installments', 'New Cairo', 'North Coast'].map((p) => <Badge key={p} tone="outline">{t(p)}</Badge>)}
                  </div>
                  <p className="mt-3 text-[9px] leading-relaxed text-muted-foreground">{t('Preferences improve your AI recommendations. Demo only.')}</p>
                </Card>
              </div>
            </section>
          )}
        </div>
      </div>

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('New buyer request')}</DialogTitle>
            <DialogDescription>{t('Tell verified agencies exactly what you are looking for.')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRequest} className="space-y-3">
            <Field label={t('What are you looking for?')} required><Input value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} placeholder={t('e.g. 3-bedroom apartment with garden')} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Preferred location')}>
                <Select value={requestLocation} onChange={(e) => setRequestLocation(e.target.value)}>
                  {['New Cairo', 'Sheikh Zayed', '6th of October', 'New Administrative Capital', 'Mostakbal City', 'North Coast', 'Maadi', 'New Alamein'].map((l) => <option key={l} value={l}>{t(l)}</option>)}
                </Select>
              </Field>
              <Field label={t('Maximum budget')}>
                <Select value={requestBudget} onChange={(e) => setRequestBudget(e.target.value)}>
                  {[5000000, 8000000, 12000000, 18000000, 25000000, 40000000].map((b) => <option key={b} value={b}>{formatEGP(b, lang, true)}</option>)}
                </Select>
              </Field>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-[10px] text-muted-foreground">{t('Your contact details stay hidden until you choose to engage with a proposal.')}</div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRequestOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit">{t('Submit request')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
