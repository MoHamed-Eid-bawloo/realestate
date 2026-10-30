import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ArrowRight, Building2, Facebook, Globe2, Heart, Instagram, Linkedin, Mail, MapPin, Menu, Moon,
  Phone, Send, Sun, X, ShieldCheck, Sparkles,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { defaultPathForRole } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Brand } from '@/components/layout/Sidebar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function PublicLayout() {
  const { t, lang, setLang } = useI18n()
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const toast = useAppStore((s) => s.toast)
  const favorites = useAppStore((s) => s.favorites)
  const role = useAppStore((s) => s.role)
  const session = useAuthStore((s) => s.session)
  const workspaceHref = session ? defaultPathForRole(role) : '/login'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [policy, setPolicy] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    setMobileOpen(false)
  }, [location.pathname])

  const links = [
    { label: 'Buy', href: '/properties?listingType=sale' },
    { label: 'Rent', href: '/properties?listingType=rent' },
    { label: 'Resale', href: '/properties?listingType=resale' },
    { label: 'Projects', href: '/projects' },
    { label: 'Developers', href: '/projects#developers' },
  ]

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast('Enter a valid email', 'Please use a valid email address to receive new listings.', 'error')
      return
    }
    toast('You are on the list', `New Cairo and North Coast listings will be sent to ${email}.`)
    setEmail('')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <NavLink
                key={l.href}
                to={l.href}
                className={({ isActive }) => cn('rounded-lg px-3 py-2 text-[12px] font-medium transition-colors hover:bg-muted hover:text-foreground', isActive || (l.label === 'Buy' && location.pathname === '/') ? 'text-foreground' : 'text-muted-foreground')}
              >
                {t(l.label)}
              </NavLink>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-1.5">
            <span className="me-1 hidden items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[9px] font-medium text-muted-foreground xl:inline-flex">
              <span className="size-1.5 rounded-full bg-accent" /> {t('Supabase catalog')}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} title={t('Language')} className="relative">
              <Globe2 className="size-4" />
              <span className="absolute -bottom-0.5 text-[7px] font-bold uppercase">{lang === 'en' ? 'ع' : 'EN'}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={t('Theme')}>
              {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
            <Link to="/account?tab=favorites" className="relative hidden sm:grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title={t('Favorites')}>
              <Heart className="size-4" />
              {favorites.length > 0 && <span className="absolute end-1 top-1 grid size-3.5 place-items-center rounded-full bg-rose-500 text-[8px] font-semibold text-white">{favorites.length}</span>}
            </Link>
            <Link to={workspaceHref} className="hidden rounded-lg px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-muted sm:block">{t(session ? 'Open workspace' : 'Sign in')}</Link>
            <Link to="/app/inventory?new=1" className="hidden sm:block">
              <Button size="sm" className="gap-1.5"><Building2 className="size-3.5" /> {t('List a property')}</Button>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-card px-4 py-4 lg:hidden">
            <div className="grid gap-1">
              {links.map((l) => (
                <Link key={l.href} to={l.href} className="rounded-lg px-3 py-2.5 text-[13px] font-medium hover:bg-muted">{t(l.label)}</Link>
              ))}
              <Link to="/account" className="rounded-lg px-3 py-2.5 text-[13px] font-medium hover:bg-muted">{t('My Account')}</Link>
              <Link to={workspaceHref} className="mt-2 rounded-lg bg-primary px-3 py-2.5 text-center text-[13px] font-medium text-primary-foreground">{t(session ? 'Open workspace' : 'Sign in')}</Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer id="footer-contact" className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]">
            <div>
              <Brand />
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
                {t('One operating system for real estate')} — {t('the trusted marketplace, CRM and broker network for the Egyptian market.')}
              </p>
              <div className="mt-5 space-y-2 text-[11px] text-muted-foreground">
                <p className="flex items-center gap-2"><MapPin className="size-3.5" /> {t('New Cairo')}, {t('Egypt')}</p>
                <p className="flex items-center gap-2" dir="ltr"><Phone className="size-3.5" /> +20 2 2461 8800</p>
                <p className="flex items-center gap-2"><Mail className="size-3.5" /> hello@nawyati.eg</p>
              </div>
              <div className="mt-5 flex items-center gap-2">
                {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                  <button key={i} onClick={() => toast('Demo social link', 'Social channels are simulated in this demo.', 'info')} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <Icon className="size-3.5" />
                  </button>
                ))}
              </div>
            </div>

            <FooterColumn title="Explore">
              <FooterLink to="/properties?listingType=sale">Buy a property</FooterLink>
              <FooterLink to="/properties?listingType=rent">Rent a property</FooterLink>
              <FooterLink to="/properties?listingType=resale">Resale listings</FooterLink>
              <FooterLink to="/projects">New projects</FooterLink>
              <FooterLink to="/projects#developers">Developers</FooterLink>
            </FooterColumn>

            <FooterColumn title="For businesses">
              <FooterLink to="/app">Company CRM</FooterLink>
              <FooterLink to="/app">Developer portal</FooterLink>
              <FooterLink to="/app">Broker network</FooterLink>
              <button onClick={() => setPolicy('pricing')} className="block py-1 text-start text-[11px] text-muted-foreground hover:text-foreground">Plans & pricing</button>
              <FooterLink to="/app/inventory?new=1">List a property</FooterLink>
            </FooterColumn>

            <FooterColumn title="Your account">
              <FooterLink to="/account">My account</FooterLink>
              <FooterLink to="/account?tab=favorites">Favorites</FooterLink>
              <FooterLink to="/account?tab=searches">Saved searches</FooterLink>
              <FooterLink to="/account?tab=viewings">Viewings</FooterLink>
              <FooterLink to="/account?tab=requests">Buyer requests</FooterLink>
            </FooterColumn>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]">{t('Get new listings first')}</h3>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t('A weekly edit of verified homes, launches and investment picks.')}</p>
              <form onSubmit={subscribe} className="mt-3 flex gap-1.5">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={t('Your email address')} className="h-9 text-[11px]" />
                <Button size="icon" variant="accent" type="submit" className="shrink-0"><Send className="size-3.5" /></Button>
              </form>
              <p className="mt-2 text-[9px] text-muted-foreground">{t('Demo only. No emails are sent.')}</p>
              <div className="mt-5 flex flex-wrap items-center gap-1.5">
                {['Verified listings', 'Secure demo', 'EGP pricing'].map((x) => (
                  <span key={x} className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-[9px] text-muted-foreground"><ShieldCheck className="size-2.5 text-emerald-500" /> {t(x)}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-5 text-[10px] text-muted-foreground sm:flex-row sm:items-center">
            <p>© 2026 Nawyati Real Estate OS. {t('All rights reserved.')} {t('This is a frontend demo.')}</p>
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => setPolicy('terms')} className="hover:text-foreground">{t('Terms')}</button>
              <button onClick={() => setPolicy('privacy')} className="hover:text-foreground">{t('Privacy')}</button>
              <button onClick={() => setPolicy('help')} className="hover:text-foreground">{t('Help center')}</button>
              <Link to={workspaceHref} className="inline-flex items-center gap-1 font-medium text-foreground">{t('Open the CRM')} <ArrowRight className="size-3 rtl:rotate-180" /></Link>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={!!policy} onOpenChange={(v) => !v && setPolicy(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{policy === 'terms' ? t('Terms') : policy === 'privacy' ? t('Privacy') : policy === 'pricing' ? t('Plans & pricing') : t('Help center')}</DialogTitle>
            <DialogDescription>
              {policy === 'pricing'
                ? t('Subscription plans in this demo range from a free tier to Enterprise. Open the Super Admin subscriptions area to explore limits and features.')
                : t('This is a frontend demonstration. No real customer data is collected, no payments are processed and no messages are sent.')}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="flex items-center gap-2 text-[12px] font-medium"><Sparkles className="size-4 text-emerald-500" /> {t('Demo environment')}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{t('Listings and workspace records are fictional demo data stored in Supabase. You can explore the marketplace freely; CRM data requires a demo account.')}</p>
          </div>
          {policy === 'pricing' && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[['Starter', 'EGP 2,500 / mo', '5 users · 50 properties'], ['Professional', 'EGP 6,500 / mo', '15 users · 150 properties'], ['Business', 'EGP 14,000 / mo', '40 users · 500 properties'], ['Enterprise', 'EGP 32,000 / mo', '200 users · 2,000 properties']].map(([name, price, feats]) => (
                <div key={name} className="rounded-lg border border-border p-3">
                  <p className="text-[12px] font-semibold">{name}</p>
                  <p className="mt-0.5 text-[11px] text-accent">{price}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{feats}</p>
                </div>
              ))}
            </div>
          )}
          {policy === 'help' && (
            <div className="mt-4 space-y-2 text-[11px] text-muted-foreground">
              <p className="flex items-center gap-2"><Mail className="size-3.5" /> support@nawyati.eg</p>
              <p className="flex items-center gap-2" dir="ltr"><Phone className="size-3.5" /> +20 2 2461 8800</p>
              <p>{t('Response time: under 15 min for Business and Enterprise plans.')}</p>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <Button variant="outline" onClick={() => setPolicy(null)}>{t('Close')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useI18n()
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]">{t(title)}</h3>
      <div className="mt-3 space-y-1.5">{children}</div>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { t } = useI18n()
  return <Link to={to} className="block py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">{typeof children === 'string' ? t(children) : children}</Link>
}
