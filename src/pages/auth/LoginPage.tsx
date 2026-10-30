import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Building2, CheckCheck, Database, Eye, EyeOff, Globe2, Handshake, KeyRound, Loader2,
  LockKeyhole, Mail, Moon, ShieldCheck, Sparkles, SquareTerminal, Sun, Users,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import { defaultPathForRole, roleIcons } from '@/lib/nav'
import { roleLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { Brand } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import type { Role } from '@/types'

const DEMO_PASSWORD = 'Demo1234!'

const demoAccounts: { role: Role; email: string; label: string; hint: string }[] = [
  { role: 'super_admin', email: 'admin@nawyati.demo', label: 'Platform Admin', hint: 'Companies, moderation, subscriptions' },
  { role: 'owner', email: 'owner@nilecrest.demo', label: 'Tarek El-Masry', hint: 'Nile Crest Realty · owner' },
  { role: 'manager', email: 'manager@nilecrest.demo', label: 'Omar El-Shazly', hint: 'Nile Crest Realty · sales manager' },
  { role: 'agent', email: 'agent@nilecrest.demo', label: 'Youssef Adel', hint: 'Nile Crest Realty · consultant' },
  { role: 'developer', email: 'developer@aurora.demo', label: 'Aurora Developments', hint: 'Developer portal' },
  { role: 'broker', email: 'broker@independent.demo', label: 'Karim El-Sherbiny', hint: 'Independent broker network' },
  { role: 'customer', email: 'customer@sara.demo', label: 'Sara Wagih', hint: 'Marketplace account' },
]

export function LoginPage() {
  const { t, lang, setLang } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const session = useAuthStore((s) => s.session)
  const ready = useAuthStore((s) => s.ready)
  const busy = useAuthStore((s) => s.busy)
  const signIn = useAuthStore((s) => s.signIn)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from

  useEffect(() => {
    if (ready && session) {
      const role = useAuthStore.getState().profile?.role ?? 'customer'
      navigate(from ?? defaultPathForRole(role), { replace: true })
    }
  }, [ready, session, from, navigate])

  const fillAccount = (account: (typeof demoAccounts)[number]) => {
    setEmail(account.email)
    setPassword(DEMO_PASSWORD)
    setError(null)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError(t('Enter your email and password to continue.'))
      return
    }
    const result = await signIn(email.trim(), password)
    if (!result.ok) {
      setError(result.message ?? t('Could not sign in.'))
      return
    }
    const profile = useAuthStore.getState().profile
    navigate(from ?? defaultPathForRole(profile?.role ?? 'customer'), { replace: true })
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="hero-gradient relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14">
        <div className="grid-pattern absolute inset-0 opacity-60" aria-hidden />
        <div className="relative">
          <Brand light />
          <div className="mt-16 max-w-lg">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-200">
              <Sparkles className="size-3" /> {t('Real Estate Operating System')}
            </p>
            <h1 className="mt-5 text-balance text-[38px] font-semibold leading-[1.08] tracking-[-0.04em] xl:text-[44px]">
              {t('One workspace for the entire Egyptian property journey.')}
            </h1>
            <p className="mt-4 max-w-md text-[13px] leading-relaxed text-slate-300">
              {t('Marketplace, CRM, inventory, developer portal and broker exchange — connected to a secure Supabase workspace with role-based access.')}
            </p>
          </div>

          <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-2">
            {[
              { icon: Building2, title: 'Marketplace & inventory', body: 'Published listings, projects and unit inventory in one catalog.' },
              { icon: Users, title: 'CRM & pipeline', body: 'Leads, customers, deals, reservations and commissions by team.' },
              { icon: Handshake, title: 'Broker exchange', body: 'Cross-company cooperation requests with protected customer data.' },
              { icon: ShieldCheck, title: 'Role-based access', body: 'Row-level security scopes every tenant workspace.' },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300"><card.icon className="size-4" /></span>
                <p className="mt-2.5 text-[12px] font-semibold text-white">{t(card.title)}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300/90">{t(card.body)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-10 flex max-w-lg flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-accent" /> {t('Supabase Auth · PostgreSQL')}</span>
          <span>{t('EGP pricing · Egyptian market')}</span>
          <span>{t('Demo data is fictional')}</span>
        </div>
      </aside>

      <main className="relative flex flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-5 lg:px-8">
          <Link to="/" className="lg:invisible"><Brand /></Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} title={t('Language')} className="relative">
              <Globe2 className="size-4" />
              <span className="absolute -bottom-0.5 text-[7px] font-bold uppercase">{lang === 'en' ? 'ع' : 'EN'}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={t(theme === 'light' ? 'Dark mode' : 'Light')}>
              {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-2 lg:px-8">
          <div className="w-full max-w-[420px]">
            {!isSupabaseConfigured ? (
              <SetupNotice />
            ) : (
              <>
                <div className="mb-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground dark:bg-white dark:text-[#142B45]"><KeyRound className="size-5" /></span>
                  <h1 className="mt-4 text-[26px] font-semibold tracking-[-0.03em]">{t('Sign in to Nawyati')}</h1>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                    {t('Use a demo account below or your Supabase credentials. Access is enforced by workspace roles.')}
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-3.5">
                  <div>
                    <Label htmlFor="email" required>{t('Email')}</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.demo" className="h-10 ps-9" disabled={busy} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password" required>{t('Password')}</Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-10 ps-9 pe-10" disabled={busy} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={t(showPassword ? 'Hide password' : 'Show password')}>
                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] leading-relaxed text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300" role="alert">
                      {error}
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="animate-spin" /> : <ArrowRight className="rtl:rotate-180" />}
                    {busy ? t('Signing in…') : t('Sign in')}
                  </Button>
                </form>

                <div className="mt-7">
                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('Demo accounts')}</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <p className="mt-2 text-center text-[10px] text-muted-foreground">{t('Every demo account uses the password')} <span className="font-mono text-foreground">{DEMO_PASSWORD}</span></p>
                  <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {demoAccounts.map((account) => {
                      const Icon = roleIcons[account.role]
                      const active = email === account.email
                      return (
                        <button
                          key={account.email}
                          type="button"
                          onClick={() => fillAccount(account)}
                          className={cn('flex items-center gap-2.5 rounded-lg border p-2.5 text-start transition-colors', active ? 'border-accent/60 bg-accent/5' : 'border-border bg-card hover:bg-muted/50')}
                        >
                          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><Icon className="size-3.5" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-medium">{t(roleLabel[account.role])}</span>
                            <span className="block truncate text-[9.5px] text-muted-foreground">{t(account.label)}</span>
                          </span>
                          {active && <CheckCheck className="size-3.5 shrink-0 text-accent" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <p className="mt-6 text-center text-[10px] leading-relaxed text-muted-foreground">
                  {t('Sessions, profiles and workspace data are stored in your Supabase project. Listings, leads and commissions are fictional demo records.')}
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function SetupNotice() {
  const { t } = useI18n()
  return (
    <div>
      <span className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><Database className="size-5" /></span>
      <h1 className="mt-4 text-[24px] font-semibold tracking-[-0.03em]">{t('Connect your Supabase project')}</h1>
      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
        {t('This build talks directly to Supabase. Add the project URL and anon key, apply the migration and seed the demo tenant to enable sign-in.')}
      </p>

      <ol className="mt-5 space-y-3">
        {[
          { title: 'Create a Supabase project', body: 'Open the Supabase dashboard and create a project, or use an existing one.' },
          { title: 'Apply the schema', body: 'Run supabase/migrations/20261030000100_init.sql in the SQL editor. It creates tables, RLS policies and RPCs.' },
          { title: 'Add environment variables', body: 'Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Add SUPABASE_SERVICE_ROLE_KEY for seeding only.' },
          { title: 'Seed the demo tenant', body: 'Run node --env-file=.env scripts/seed.mjs to create the seven demo accounts and sample records.' },
        ].map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-xl border border-border bg-card p-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/5 text-[10px] font-semibold text-primary dark:bg-white/5 dark:text-slate-200">{index + 1}</span>
            <div>
              <p className="text-[12px] font-medium">{t(step.title)}</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">{t(step.body)}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"><SquareTerminal className="size-3" /> {t('Environment')}</p>
        <pre className="mt-2 overflow-x-auto text-[10px] leading-relaxed text-foreground"><code>{`VITE_SUPABASE_URL=https://<project>.supabase.co\nVITE_SUPABASE_ANON_KEY=<anon-key>\nSUPABASE_SERVICE_ROLE_KEY=<service-role-key>`}</code></pre>
      </div>

      <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3 shrink-0 text-emerald-500" />
        {t('The service role key is only used by the local seed script. Never expose it in the browser or commit it to version control.')}
      </p>

      <Button asChild variant="outline" className="mt-5 w-full"><Link to="/"><ArrowRight className="rtl:rotate-180" /> {t('Back to marketplace')}</Link></Button>
    </div>
  )
}
