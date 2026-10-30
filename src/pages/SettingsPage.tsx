import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, BriefcaseBusiness, Building2, CalendarDays, Check, Database, Download, Globe2, Handshake,
  Home, Landmark, LockKeyhole, LogOut, Mail, MessageCircle, Moon, RotateCcw, Save, ShieldCheck, Sparkles, Sun,
  Users,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useActiveCompany, useActiveEmployee, useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { useTab } from '@/lib/useTab'
import { cn, downloadCsv } from '@/lib/utils'
import { formatDate, formatEGP } from '@/lib/format'
import { roleLabel } from '@/lib/labels'
import { InfoRow, PageHeader, SectionTitle } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch, Avatar, Progress } from '@/components/ui/misc'
import { Field, Input, Select } from '@/components/ui/input'

const tabs = [
  { id: 'profile', label: 'Profile', icon: Users },
  { id: 'preferences', label: 'Preferences', icon: Sparkles },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

const notificationRows: { key: 'email' | 'whatsapp' | 'push' | 'digest'; title: string; description: string; icon: React.ElementType }[] = [
  { key: 'email', title: 'Email notifications', description: 'Daily lead summaries, deal updates and weekly reports by email.', icon: Mail },
  { key: 'whatsapp', title: 'WhatsApp notifications', description: 'Instant alerts for new leads, viewings and cooperation requests.', icon: MessageCircle },
  { key: 'push', title: 'Push notifications', description: 'Browser alerts for assigned tasks, mentions and approvals.', icon: Bell },
  { key: 'digest', title: 'Weekly digest', description: 'A Monday summary of pipeline health, targets and commissions.', icon: CalendarDays },
]

export function SettingsPage() {
  const { t, lang, setLang } = useI18n()
  const navigate = useNavigate()
  const { tab, setTab } = useTab('profile')

  const role = useAppStore((s) => s.role)
  const account = useAppStore((s) => s.profile)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const setActiveCompany = useAppStore((s) => s.setActiveCompany)
  const activeCompanyId = useAppStore((s) => s.activeCompanyId)
  const company = useActiveCompany()
  const employee = useActiveEmployee()
  const teams = useAppStore((s) => s.teams)
  const employees = useAppStore((s) => s.employees)
  const companies = useAppStore((s) => s.companies)
  const developer = useAppStore((s) => s.developers.find((d) => d.id === s.activeDeveloperId))
  const broker = useAppStore((s) => s.brokers.find((b) => b.id === s.activeBrokerId))
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const updateEmployee = useAppStore((s) => s.updateEmployee)
  const subscriptions = useAppStore((s) => s.subscriptions)
  const plans = useAppStore((s) => s.subscriptionPlans)
  const reload = useAppStore((s) => s.reload)
  const toast = useAppStore((s) => s.toast)
  const signOut = useAuthStore((s) => s.signOut)

  const isCompanyRole = role === 'owner' || role === 'manager' || role === 'agent'
  const isSuperAdmin = role === 'super_admin'
  const canEditProfile = isCompanyRole && !!employee

  const identity = useMemo(() => {
    const displayName = account?.fullName || employee.name
    const email = account?.email || employee.email
    const avatarColor = account?.avatarColor ?? employee.avatarColor
    if (role === 'super_admin') {
      return {
        name: displayName,
        nameAr: displayName,
        title: t('Platform Administrator'),
        email,
        phone: '',
        org: t('Nawyati Real Estate OS'),
        orgSub: t('Platform operations'),
        verified: true,
        avatarColor,
        since: account?.createdAt ?? '',
      }
    }
    if (role === 'developer') {
      return {
        name: displayName,
        nameAr: displayName,
        title: t('Development Director'),
        email: email || developer?.email || '',
        phone: developer?.phone ?? '',
        org: developer ? (lang === 'ar' ? developer.nameAr : developer.name) : '',
        orgSub: t('Developer account'),
        verified: developer?.verified ?? false,
        avatarColor,
        since: account?.createdAt ?? '',
      }
    }
    if (role === 'broker') {
      return {
        name: broker?.name ?? displayName,
        nameAr: broker?.name ?? displayName,
        title: t('Independent Broker'),
        email: email,
        phone: broker?.phone ?? '',
        org: broker?.companyName ?? '',
        orgSub: t('Broker account'),
        verified: broker?.verified ?? false,
        avatarColor,
        since: account?.createdAt ?? '',
      }
    }
    if (role === 'customer') {
      return {
        name: displayName,
        nameAr: displayName,
        title: t('Verified buyer'),
        email: email,
        phone: '',
        org: 'Nawyati Marketplace',
        orgSub: t('Customer account'),
        verified: true,
        avatarColor,
        since: account?.createdAt ?? '',
      }
    }
    return {
      name: displayName,
      nameAr: employee.nameAr,
      title: employee.title,
      email: employee.email,
      phone: employee.phone,
      org: company ? (lang === 'ar' ? company.nameAr : company.name) : '',
      orgSub: roleLabel[role],
      verified: company?.verified ?? true,
      avatarColor,
      since: employee.joinedAt,
    }
  }, [role, account, employee, developer, broker, company, lang, t])

  const [profile, setProfile] = useState({
    name: employee?.name ?? '',
    nameAr: employee?.nameAr ?? '',
    title: employee?.title ?? '',
    email: employee?.email ?? '',
    phone: employee?.phone ?? '',
  })
  const [notifPrefs, setNotifPrefs] = useState(settings.notificationPrefs)
  const [autoAssign, setAutoAssign] = useState(settings.autoAssign)

  useEffect(() => {
    if (employee) {
      setProfile({ name: employee.name, nameAr: employee.nameAr, title: employee.title, email: employee.email, phone: employee.phone })
    }
  }, [employee?.id])

  useEffect(() => {
    setNotifPrefs(settings.notificationPrefs)
    setAutoAssign(settings.autoAssign)
  }, [settings.notificationPrefs, settings.autoAssign])

  const notificationDirty = JSON.stringify(notifPrefs) !== JSON.stringify(settings.notificationPrefs)
  const workspaceDirty = autoAssign !== settings.autoAssign

  const team = isCompanyRole && employee ? teams.find((x) => x.id === employee.teamId) : undefined
  const manager = isCompanyRole && employee?.managerId ? employees.find((x) => x.id === employee.managerId) : undefined

  const subscription = subscriptions.find((s) => s.companyId === activeCompanyId)
  const plan = plans.find((p) => p.id === subscription?.planId)
  const seatLimit = plan?.userLimit ?? 0
  const seatUsage = subscription?.seatsUsed ?? 0
  const propertyUsage = subscription?.propertyCount ?? 0

  const saveProfile = () => {
    if (!canEditProfile || !employee) return
    if (!profile.name.trim() || !profile.email.trim()) {
      toast('Missing details', 'Name and email are required.', 'error')
      return
    }
    updateEmployee(employee.id, {
      name: profile.name.trim(),
      nameAr: profile.nameAr.trim() || profile.name.trim(),
      title: profile.title.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
    })
  }

  const saveNotifications = () => {
    updateSettings({ notificationPrefs: notifPrefs })
    toast('Notification preferences saved', 'These choices are saved to your workspace. No external messages are sent.')
  }

  const saveWorkspace = () => {
    updateSettings({ autoAssign })
    toast('Workspace preferences saved', 'Auto-assignment is applied to new leads in this workspace.')
  }

  const reloadWorkspace = async () => {
    await reload()
    toast('Workspace reloaded', 'The latest records were fetched from Supabase.', 'info')
  }

  const endSession = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const exportAccount = () => {
    downloadCsv('nawyati-account.csv', [
      ['Field', 'Value'],
      ['Name', identity.name],
      ['Role', roleLabel[role]],
      ['Title', identity.title],
      ['Email', identity.email],
      ['Phone', identity.phone],
      ['Organization', identity.org],
      ['Interface language', lang === 'ar' ? 'Arabic' : 'English'],
      ['Theme', theme],
      ['Member since', formatDate(identity.since, 'en')],
    ])
    toast('Account exported', 'A CSV summary was downloaded locally in your browser.')
  }

  return (
    <div>
      <PageHeader
        title={t('Settings')}
        description={t('Manage your profile, workspace preferences and account access in one place.')}
        eyebrow={<><ShieldCheck className="size-3.5 text-accent" /> {t('Workspace')} · {t('Settings')}</>}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/')}><Home /> {t('Return to marketplace')}</Button>
            {tab === 'profile' && canEditProfile && <Button variant="accent" onClick={saveProfile}><Save /> {t('Save changes')}</Button>}
            {tab === 'notifications' && <Button variant="accent" onClick={saveNotifications} disabled={!notificationDirty}><Save /> {t('Save changes')}</Button>}
            {tab === 'workspace' && (role === 'owner' || role === 'manager' || role === 'super_admin') && <Button variant="accent" onClick={saveWorkspace} disabled={!workspaceDirty}><Save /> {t('Save changes')}</Button>}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition-colors', tab === x.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
            <x.icon className="size-3.5" /> {t(x.label)}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="overflow-hidden p-0">
            <div className="h-20 bg-gradient-to-br from-primary via-[#1d3b5c] to-accent/70" />
            <div className="-mt-9 px-5 pb-5">
              <Avatar name={identity.name} color={identity.avatarColor} size="lg" className="size-16 text-base ring-4 ring-card" />
              <h2 className="mt-3 text-lg font-semibold tracking-[-0.02em]">{lang === 'ar' ? identity.nameAr : identity.name}</h2>
              <p className="text-xs text-muted-foreground">{identity.title}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Badge tone={identity.verified ? 'green' : 'amber'}>{identity.verified ? t('Verified') : t('Verification pending')}</Badge>
                <Badge tone="navy">{t(roleLabel[role])}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-[12px]">
                <p className="flex items-center gap-2 text-muted-foreground"><Building2 className="size-3.5 shrink-0" /> <span className="truncate">{identity.org}</span></p>
                <p className="flex items-center gap-2 text-muted-foreground"><Mail className="size-3.5 shrink-0" /> <span className="truncate">{identity.email}</span></p>
                <p className="flex items-center gap-2 text-muted-foreground" dir="ltr"><span className="w-3.5 shrink-0" /><span>{identity.phone}</span></p>
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <InfoRow label={t('Role')} value={t(roleLabel[role])} />
                <InfoRow label={t('Member since')} value={formatDate(identity.since, lang)} />
                <InfoRow label={t('Organization')} value={identity.orgSub} />
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{t('Supabase account')} · {t('Password managed by Supabase Auth')}</p>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <SectionTitle
                title={t('Personal details')}
                description={canEditProfile ? t('Changes are saved to your Supabase workspace.') : t('This profile is read-only.')}
                action={canEditProfile ? <Button size="sm" onClick={saveProfile}><Save /> {t('Save profile')}</Button> : <Badge tone="outline"><LockKeyhole className="size-3" /> {t('Read-only')}</Badge>}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Name')} required={canEditProfile}>
                  <Input value={canEditProfile ? profile.name : identity.name} readOnly={!canEditProfile} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                </Field>
                <Field label={t('Title')}>
                  <Input value={canEditProfile ? profile.title : identity.title} readOnly={!canEditProfile} onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))} />
                </Field>
                <Field label={t('Email')} required={canEditProfile}>
                  <Input type="email" value={canEditProfile ? profile.email : identity.email} readOnly={!canEditProfile} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
                </Field>
                <Field label={t('Phone')}>
                  <Input value={canEditProfile ? profile.phone : identity.phone} readOnly={!canEditProfile} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} dir="ltr" />
                </Field>
                <Field label={t('Arabic name')} className="sm:col-span-2">
                  <Input value={canEditProfile ? profile.nameAr : identity.nameAr} readOnly={!canEditProfile} onChange={(e) => setProfile((p) => ({ ...p, nameAr: e.target.value }))} dir="rtl" />
                </Field>
              </div>
              {!canEditProfile && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
                  <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
                  <span>{role === 'developer' || role === 'broker' ? t('Developer and broker profiles are managed by the platform team.') : t('This identity is read-only and cannot be edited here.')}</span>
                </div>
              )}
            </Card>

            {canEditProfile && employee && (
              <Card className="p-5">
                <SectionTitle title={t('Employment')} description={company ? (lang === 'ar' ? company.nameAr : company.name) : undefined} />
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <InfoRow label={t('Employee ID')} value={<span className="font-mono text-[11px]">{employee.id.toUpperCase()}</span>} />
                  <InfoRow label={t('Team')} value={team ? (lang === 'ar' ? team.nameAr : team.name) : '—'} />
                  <InfoRow label={t('Manager')} value={manager?.name ?? '—'} />
                  <InfoRow label={t('Status')} value={t(employee.status === 'on_leave' ? 'On leave' : employee.status === 'active' ? 'Active' : 'Inactive')} />
                  <InfoRow label={t('Joined')} value={formatDate(employee.joinedAt, lang)} />
                  <InfoRow label={t('Attendance')} value={`${employee.attendance}%`} />
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{t('Sales target')}</span>
                    <span className="font-medium">{formatEGP(employee.achieved, lang, true)} / {formatEGP(employee.target, lang, true)}</span>
                  </div>
                  <Progress value={employee.target ? Math.min(100, Math.round((employee.achieved / employee.target) * 100)) : 0} />
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'preferences' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <SectionTitle title={t('Language')} description={t('The interface switches between English and Arabic, including RTL layout.')} />
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                { value: 'en' as const, label: 'English', sub: 'LTR interface' },
                { value: 'ar' as const, label: 'العربية', sub: 'واجهة من اليمين إلى اليسار' },
              ]).map((o) => (
                <button
                  key={o.value}
                  onClick={() => { setLang(o.value); toast('Language updated', o.value === 'ar' ? 'تم تحويل الواجهة إلى العربية.' : 'The interface is now in English.') }}
                  className={cn('flex items-center gap-3 rounded-xl border p-3.5 text-start transition-colors', lang === o.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40')}
                >
                  <span className={cn('grid size-8 place-items-center rounded-lg text-[11px] font-semibold', lang === o.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{o.value === 'en' ? 'EN' : 'ع'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">{o.label}</span>
                    <span className="block text-[11px] text-muted-foreground">{o.sub}</span>
                  </span>
                  {lang === o.value && <Check className="size-4 text-accent" />}
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground"><Globe2 className="size-3" /> {t('Your language choice is saved for the next visit.')}</p>
          </Card>

          <Card className="p-5">
            <SectionTitle title={t('Theme')} description={t('Use light or dark mode across the entire platform.')} />
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                { value: 'light' as const, label: 'Light', icon: Sun },
                { value: 'dark' as const, label: 'Dark', icon: Moon },
              ]).map((o) => (
                <button
                  key={o.value}
                  onClick={() => setTheme(o.value)}
                  className={cn('rounded-xl border p-3.5 text-start transition-colors', theme === o.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40')}
                >
                  <div className={cn('mb-2.5 flex h-16 items-end gap-1.5 rounded-lg border p-2', o.value === 'light' ? 'border-slate-200 bg-[#F7F9FC]' : 'border-slate-700 bg-[#0B1220]')}>
                    <span className={cn('h-4 w-3 rounded-sm', o.value === 'light' ? 'bg-slate-300' : 'bg-slate-600')} />
                    <span className={cn('h-7 flex-1 rounded-sm', o.value === 'light' ? 'bg-white' : 'bg-slate-800')} />
                    <span className={cn('h-10 w-1/3 rounded-sm', o.value === 'light' ? 'bg-emerald-200' : 'bg-emerald-500/40')} />
                  </div>
                  <span className="flex items-center gap-2 text-[13px] font-medium"><o.icon className="size-3.5" /> {t(o.label)} {theme === o.value && <Check className="ms-auto size-4 text-accent" />}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground"><Sparkles className="size-3" /> {t('Theme preferences are stored in this browser.')}</p>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <SectionTitle title={t('Regional formats')} description={t('Pricing, dates and timezone used throughout the demo.')} />
            <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
              <InfoRow label={t('Currency')} value="EGP · Egyptian Pound" />
              <InfoRow label={t('Country')} value={t('Egypt')} />
              <InfoRow label={t('Timezone')} value="Africa/Cairo" />
              <InfoRow label={t('Date format')} value="dd MMM yyyy" />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">{t('Pricing is formatted with Egyptian locale rules. No live exchange rates are used.')}</p>
          </Card>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card className="p-5">
            <SectionTitle title={t('Notification preferences')} description={t('Choose how you want to be notified. Delivery is simulated in this demo.')} />
            <div className="divide-y divide-border">
              {notificationRows.map((row) => (
                <div key={row.key} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary dark:bg-white/5 dark:text-slate-200"><row.icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{t(row.title)}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{t(row.description)}</p>
                  </div>
                  <Switch checked={notifPrefs[row.key]} onCheckedChange={(v) => setNotifPrefs((p) => ({ ...p, [row.key]: v }))} className="mt-1.5" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button variant="ghost" size="sm" onClick={() => setNotifPrefs(settings.notificationPrefs)} disabled={!notificationDirty}>{t('Discard')}</Button>
              <Button variant="accent" size="sm" onClick={saveNotifications} disabled={!notificationDirty}><Save /> {t('Save preferences')}</Button>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="border-amber-200/70 bg-amber-50/50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
              <p className="flex items-center gap-2 text-[12px] font-semibold"><Bell className="size-4 text-amber-600 dark:text-amber-400" /> {t('Simulated delivery')}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {t('No emails, WhatsApp messages or push notifications are sent. Toggles only update your workspace preferences.')}
              </p>
            </Card>
            <Card className="p-5">
              <SectionTitle title={t('Always-on alerts')} />
              <div className="space-y-2.5 text-[11px]">
                {[
                  t('New lead assigned to you'),
                  t('Deal moved to reservation or won'),
                  t('Commission payment marked as paid'),
                  t('Cooperation request accepted'),
                  t('Support ticket escalated'),
                ].map((x) => (
                  <p key={x} className="flex items-start gap-2 text-muted-foreground"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> {x}</p>
                ))}
              </div>
              <p className="mt-3 border-t border-border pt-3 text-[10px] text-muted-foreground">{t('Critical workspace alerts cannot be disabled.')}</p>
            </Card>
          </div>
        </div>
      )}

      {tab === 'workspace' && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <Card className="p-5">
              <SectionTitle
                title={t('Organization')}
                description={isCompanyRole ? t('The company workspace currently in use.') : t('Your organization details.')}
                action={role === 'super_admin' ? <Badge tone="purple">{t('Super Admin')}</Badge> : <Badge tone="green">{t('Active')}</Badge>}
              />
              {role === 'super_admin' ? (
                <Field label={t('Switch company')} hint={t('Super admins can inspect any tenant workspace.')}>
                  <Select
                    value={activeCompanyId}
                    onChange={(e) => {
                      setActiveCompany(e.target.value)
                      toast('Workspace switched', `Now viewing ${companies.find((c) => c.id === e.target.value)?.name}.`, 'info')
                    }}
                  >
                    {companies.map((c) => <option key={c.id} value={c.id}>{lang === 'ar' ? c.nameAr : c.name}</option>)}
                  </Select>
                </Field>
              ) : null}

              {isCompanyRole && company ? (
                <div className="mt-2">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl text-sm font-semibold text-white" style={{ background: company.logoColor }}>{company.name.split(' ').slice(0, 2).map((n) => n[0]).join('')}</span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold">{lang === 'ar' ? company.nameAr : company.name}</p>
                      <p className="text-[11px] text-muted-foreground">{company.city} · {company.type}</p>
                    </div>
                    <Badge tone={company.verified ? 'green' : 'amber'} className="ms-auto">{company.verified ? t('Verified') : t('Verification pending')}</Badge>
                  </div>
                  <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
                    <InfoRow label={t('License number')} value={company.license} />
                    <InfoRow label={t('Branches')} value={company.branches} />
                    <InfoRow label={t('Employees')} value={company.employees} />
                    <InfoRow label={t('Contact phone')} value={company.phone} />
                    <InfoRow label={t('Contact email')} value={company.email} />
                    <InfoRow label={t('Created')} value={formatDate(company.createdAt, lang)} />
                  </div>
                </div>
              ) : role === 'developer' && developer ? (
                <div className="mt-2">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl text-sm font-semibold text-white" style={{ background: developer.logoColor }}>{developer.name.slice(0, 2)}</span>
                    <div>
                      <p className="text-[14px] font-semibold">{lang === 'ar' ? developer.nameAr : developer.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t('Developer account')} · {t('Founded')} {developer.founded}</p>
                    </div>
                    <Badge tone={developer.verified ? 'green' : 'amber'} className="ms-auto">{developer.verified ? t('Verified') : t('Verification pending')}</Badge>
                  </div>
                  <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
                    <InfoRow label={t('Projects')} value={developer.projects} />
                    <InfoRow label={t('Contact email')} value={developer.email} />
                    <InfoRow label={t('Contact phone')} value={developer.phone} />
                    <InfoRow label={t('Role')} value={t('Property Developer')} />
                  </div>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/developer')}><Building2 /> {t('View developer portal')}</Button>
                </div>
              ) : role === 'broker' && broker ? (
                <div className="mt-2">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl text-sm font-semibold text-white" style={{ background: broker.avatarColor }}>{broker.name.split(' ').slice(0, 2).map((n) => n[0]).join('')}</span>
                    <div>
                      <p className="text-[14px] font-semibold">{broker.name}</p>
                      <p className="text-[11px] text-muted-foreground">{broker.companyName} · {broker.zone}</p>
                    </div>
                    <Badge tone={broker.verified ? 'green' : 'amber'} className="ms-auto">{broker.verified ? t('Verified') : t('Verification pending')}</Badge>
                  </div>
                  <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
                    <InfoRow label={t('Active listings')} value={broker.activeListings} />
                    <InfoRow label={t('Deals won')} value={broker.dealsClosed} />
                    <InfoRow label={t('Commission')} value={`${broker.commissionRate}%`} />
                    <InfoRow label={t('Phone')} value={broker.phone} />
                  </div>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/exchange/network')}><Handshake /> {t('Open broker network')}</Button>
                </div>
              ) : (
                <div className="mt-2 rounded-lg border border-border bg-muted/40 p-4 text-[11px] leading-relaxed text-muted-foreground">
                  {t('Your customer account is managed from the marketplace. Saved homes, searches, inquiries and viewings live in your account area.')}
                  <div className="mt-3"><Button variant="outline" size="sm" onClick={() => navigate('/account')}><Home /> {t('Open customer account')}</Button></div>
                </div>
              )}
            </Card>

            {isCompanyRole && (
              <Card className="p-5">
                <SectionTitle title={t('Workspace preferences')} description={t('Controls applied to new records in the CRM.')} />
                <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3.5">
                  <div>
                    <p className="text-[13px] font-medium">{t('Auto-assign new leads')}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{t('Route incoming leads to the next available consultant using the round-robin rule.')}</p>
                  </div>
                  <Switch checked={autoAssign} onCheckedChange={setAutoAssign} disabled={!canEditProfile} className="mt-1" />
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setAutoAssign(settings.autoAssign)} disabled={!workspaceDirty}>{t('Discard')}</Button>
                  <Button variant="accent" size="sm" onClick={saveWorkspace} disabled={!workspaceDirty || !canEditProfile}><Save /> {t('Save preferences')}</Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button variant="outline" size="sm" onClick={() => navigate('/crm/settings')}><Landmark /> {t('CRM settings')}</Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/crm/operations?tab=teams')}><Users /> {t('Teams')}</Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/inventory')}><Building2 /> {t('Inventory')}</Button>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {(isCompanyRole || isSuperAdmin) && plan ? (
              <Card className="p-5">
                <SectionTitle title={t('Plan & usage')} description={t('Illustrative subscription for this demo.')} action={<Badge tone="navy">{plan.name}</Badge>} />
                <p className="text-2xl font-semibold tracking-[-0.03em]">{formatEGP(plan.price, lang)}<span className="text-xs font-normal text-muted-foreground"> / {t('mo')}</span></p>
                <p className="mt-1 text-[11px] text-muted-foreground">{t('Renewal date')}: {subscription ? formatDate(subscription.renewalDate, lang) : '—'}</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px]"><span className="text-muted-foreground">{t('Seats')}</span><span className="font-medium">{seatUsage} / {seatLimit}</span></div>
                    <Progress value={seatLimit ? Math.min(100, Math.round((seatUsage / seatLimit) * 100)) : 0} className="mt-1.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px]"><span className="text-muted-foreground">{t('Property limit')}</span><span className="font-medium">{propertyUsage} / {plan.propertyLimit}</span></div>
                    <Progress value={plan.propertyLimit ? Math.min(100, Math.round((propertyUsage / plan.propertyLimit) * 100)) : 0} className="mt-1.5" tone="navy" />
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{t('Plan features')}</p>
                  <div className="mt-2 space-y-1.5">
                    {plan.features.slice(0, 4).map((f) => <p key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground"><Check className="mt-0.5 size-3 shrink-0 text-emerald-500" /> {t(f)}</p>)}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigate(isSuperAdmin ? '/admin/subscriptions' : '/finance?tab=payouts')}>
                  {isSuperAdmin ? t('Manage subscriptions') : t('View billing & payouts')}
                </Button>
                <p className="mt-2 text-center text-[9px] text-muted-foreground">{t('Demo billing only. No payments are processed.')}</p>
              </Card>
            ) : (
              <Card className="p-5">
                <SectionTitle title={t('Account')} />
                <div className="space-y-2 text-[11px] text-muted-foreground">
                  <p className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-emerald-500" /> {t('Verified workspace')}</p>
                  <p className="flex items-center gap-2"><Database className="size-3.5" /> {t('Workspace data stored in Supabase')}</p>
                  <p className="flex items-center gap-2"><LockKeyhole className="size-3.5" /> {t('Access enforced by row-level security')}</p>
                </div>
              </Card>
            )}

            <Card className="p-5">
              <SectionTitle title={t('Need help?')} description={t('Support is simulated in this demo.')} />
              <div className="space-y-2 text-[11px] text-muted-foreground">
                <p className="flex items-center gap-2"><Mail className="size-3.5" /> support@nawyati.example</p>
                <p className="flex items-center gap-2" dir="ltr"><span className="w-3.5" />+20 2 2461 8800</p>
                <p className="flex items-center gap-2"><CalendarDays className="size-3.5" /> {t('Response time')}: {t('under 15 min')}</p>
              </div>
              <Button variant="ghost" size="sm" className="mt-3 px-0" onClick={() => toast('Help center', 'The help center is simulated in this frontend demo.', 'info')}>{t('Help center')}</Button>
            </Card>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <Card className="p-5">
              <SectionTitle title={t('Account & session')} description={t('Signed in through Supabase Auth with workspace role enforcement.')} action={<Badge tone="navy">{t(roleLabel[role])}</Badge>} />
              <div className="grid gap-x-8 sm:grid-cols-2">
                <InfoRow label={t('Signed in as')} value={identity.name} />
                <InfoRow label={t('Email')} value={identity.email || '—'} />
                <InfoRow label={t('Role')} value={t(roleLabel[role])} />
                <InfoRow label={t('Workspace')} value={identity.org || '—'} />
                <InfoRow label={t('Session')} value={t('Supabase Auth')} />
                <InfoRow label={t('Member since')} value={identity.since ? formatDate(identity.since, lang) : '—'} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Button variant="outline" size="sm" onClick={() => void reloadWorkspace()}><RotateCcw /> {t('Reload workspace')}</Button>
                <Button variant="danger-soft" size="sm" onClick={() => void endSession()}><LogOut /> {t('Sign out')}</Button>
              </div>
            </Card>

            <Card className="p-5">
              <SectionTitle title={t('Security model')} description={t('How identity and workspace data are handled.')} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-3.5">
                  <p className="flex items-center gap-2 text-[12px] font-medium"><LockKeyhole className="size-3.5 text-accent" /> {t('Supabase Auth')}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t('Email and password sessions are issued by Supabase Auth. Row-level security scopes every table to your workspace.')}</p>
                </div>
                <div className="rounded-lg border border-border p-3.5">
                  <p className="flex items-center gap-2 text-[12px] font-medium"><Database className="size-3.5 text-accent" /> {t('PostgreSQL workspace')}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t('Companies, leads, deals and commissions live in your Supabase project, not in the browser.')}</p>
                </div>
                <div className="rounded-lg border border-border p-3.5">
                  <p className="flex items-center gap-2 text-[12px] font-medium"><ShieldCheck className="size-3.5 text-accent" /> {t('No real integrations')}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t('Payments, WhatsApp, email and AI features are simulated. No external service receives data.')}</p>
                </div>
                <div className="rounded-lg border border-border p-3.5">
                  <p className="flex items-center gap-2 text-[12px] font-medium"><BriefcaseBusiness className="size-3.5 text-accent" /> {t('Session')}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t('You are signed in as')} {identity.name} · {t(roleLabel[role])}.</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <SectionTitle title={t('Data & privacy')} description={t('Download a summary of your account or end the session.')} />
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={exportAccount}><Download /> {t('Export account')}</Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate('/account?tab=favorites')}><Home /> {t('Open customer account')}</Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => void reloadWorkspace()}><RotateCcw /> {t('Reload workspace')}</Button>
                <Button variant="danger-soft" size="sm" className="w-full justify-start" onClick={() => void endSession()}><LogOut /> {t('Sign out')}</Button>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{t('Reloading fetches the latest records from Supabase. Signing out clears the cached workspace from this browser.')}</p>
            </Card>

            <Card className="border-amber-200/70 bg-amber-50/40 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
              <p className="flex items-center gap-2 text-[12px] font-semibold text-amber-700 dark:text-amber-400"><Sparkles className="size-4" /> {t('Demo data')}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{t('Listings, leads, deals and commissions are fictional seed records. Payments, WhatsApp and AI features remain simulated.')}</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
