import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, ChevronDown, Command, CreditCard, Globe2, Handshake, LogOut, Menu, Moon,
  Plus, RotateCcw, Search, Settings, Sun, Building2, UserPlus, CalendarPlus, PlusCircle, Store,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown'
import { roleIcons } from '@/lib/nav'
import { roleLabel } from '@/lib/labels'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t, lang, setLang, fromNow: fromNowLocalized } = useI18n()
  const navigate = useNavigate()
  const role = useAppStore((s) => s.role)
  const profile = useAppStore((s) => s.profile)
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const setCommandOpen = useAppStore((s) => s.setCommandOpen)
  const notifications = useAppStore((s) => s.notifications)
  const markAll = useAppStore((s) => s.markAllNotificationsRead)
  const markRead = useAppStore((s) => s.markNotificationRead)
  const reload = useAppStore((s) => s.reload)
  const toast = useAppStore((s) => s.toast)
  const signOut = useAuthStore((s) => s.signOut)
  const company = useAppStore((s) => s.companies.find((c) => c.id === s.activeCompanyId))
  const employee = useAppStore((s) => s.employees.find((e) => e.id === s.profile?.employeeId))
  const unread = notifications.filter((n) => !n.read).length
  const [notifOpen, setNotifOpen] = useState(false)

  const userName = profile?.fullName ?? employee?.name ?? 'Nawyati member'
  const userTitle = employee?.title ?? t(roleLabel[role])

  const quickActions = role === 'developer'
    ? [
        { label: 'New project', icon: Building2, href: '/developer/projects?new=1' },
        { label: 'Reserve a unit', icon: PlusCircle, href: '/developer/units' },
        { label: 'View broker activity', icon: Handshake, href: '/developer/brokers' },
      ]
    : role === 'broker'
      ? [
          { label: 'New cooperation request', icon: Handshake, href: '/exchange/requests?new=1' },
          { label: 'Browse exchange', icon: Store, href: '/exchange' },
          { label: 'Commission overview', icon: CreditCard, href: '/exchange/commissions' },
        ]
      : role === 'super_admin'
        ? [
            { label: 'Review companies', icon: Building2, href: '/admin/companies' },
            { label: 'Moderation queue', icon: CheckCheck, href: '/admin/moderation' },
            { label: 'Platform settings', icon: Settings, href: '/admin/settings' },
          ]
        : [
            { label: 'Add lead', icon: UserPlus, href: '/crm/leads?new=1' },
            { label: 'Add property', icon: PlusCircle, href: '/inventory?new=1' },
            { label: 'Create task', icon: CalendarPlus, href: '/crm/activities?new=1' },
          ]

  const reloadWorkspace = async () => {
    await reload()
    toast('Workspace reloaded', 'The latest records were fetched from Supabase.', 'info')
  }

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border px-4 lg:px-6">
      <button onClick={onMenu} className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground lg:hidden"><Menu className="size-4" /></button>

      <button onClick={() => setCommandOpen(true)} className="group flex h-9 w-full max-w-[320px] items-center gap-2 rounded-lg border border-border bg-card px-3 text-start text-[12px] text-muted-foreground shadow-sm transition-colors hover:border-slate-300 dark:hover:border-slate-600">
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1 truncate">{t('Search everything…')}</span>
        <span className="hidden items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground sm:flex"><Command className="size-2.5" />K</span>
      </button>

      <div className="hidden flex-1 items-center gap-2 xl:flex">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-accent" /> {t('Supabase workspace')}
        </span>
        <span className="text-[11px] text-muted-foreground">{company?.name ?? profile?.fullName}</span>
      </div>

      <div className="ms-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="accent" size="sm" className="me-1 hidden gap-1.5 sm:inline-flex">
              <Plus className="size-3.5" /> {t('Create')} <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[220px]">
            <DropdownMenuLabel>{t('Quick actions')}</DropdownMenuLabel>
            {quickActions.map((a) => (
              <DropdownMenuItem key={a.label} onSelect={() => navigate(a.href)}>
                <a.icon /> {t(a.label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} title={t('Language')} className="relative">
          <Globe2 className="size-4" />
          <span className="absolute -bottom-0.5 text-[7px] font-bold uppercase">{lang === 'en' ? 'ع' : 'EN'}</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} title={t(theme === 'light' ? 'Dark mode' : 'Light')}>
          {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>

        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" title={t('Notifications')}>
              <Bell className="size-4" />
              {unread > 0 && <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-card" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[360px] p-0">
            <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
              <div>
                <p className="text-[13px] font-semibold">{t('Notifications')}</p>
                <p className="text-[10px] text-muted-foreground">{unread} {t('unread')}</p>
              </div>
              <button onClick={markAll} className="text-[10px] font-medium text-accent hover:underline">{t('Mark all as read')}</button>
            </div>
            <div className="max-h-[330px] overflow-y-auto">
              {notifications.slice(0, 6).map((n) => (
                <button
                  key={n.id}
                  onClick={() => { markRead(n.id); setNotifOpen(false); if (n.href) navigate(n.href) }}
                  className="flex w-full items-start gap-2.5 border-b border-border/70 px-3.5 py-3 text-start transition-colors last:border-0 hover:bg-muted/60"
                >
                  <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', n.read ? 'bg-border' : 'bg-accent')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">{n.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-muted-foreground">{n.body}</span>
                    <span className="mt-1 block text-[9px] text-muted-foreground/80">{fromNowLocalized(n.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>
            <Link to="/notifications" onClick={() => setNotifOpen(false)} className="block border-t border-border px-3.5 py-2.5 text-center text-[11px] font-medium text-accent hover:bg-muted/50">
              {t('View all')} {t('Notifications')}
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <Link to="/settings" className="flex items-center gap-2 rounded-lg border border-border bg-card py-1 pe-2 ps-1.5 shadow-sm transition-colors hover:bg-muted" title={t(roleLabel[role])}>
          <span className="grid size-6 place-items-center rounded-md bg-accent/10 text-accent">
            {(() => { const Icon = roleIcons[role]; return <Icon className="size-3.5" /> })()}
          </span>
          <span className="hidden text-[11px] font-medium sm:block">{t(roleLabel[role])}</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ms-0.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
              <Avatar name={userName} color={profile?.avatarColor ?? employee?.avatarColor} size="md" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[250px]">
            <div className="px-2.5 py-2">
              <p className="text-[13px] font-semibold">{userName}</p>
              <p className="text-[10px] text-muted-foreground">{userTitle}</p>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{profile?.email}</p>
              {company && <p className="mt-1 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"><Building2 className="size-2.5" /> {company.name}</p>}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/settings')}><Settings /> {t('Settings')}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/notifications')}><Bell /> {t('Notifications')}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(role === 'super_admin' ? '/admin/settings' : '/settings')}><CreditCard /> {t('Billing')}</DropdownMenuItem>
            <DropdownMenuItem onSelect={toggleTheme}><Sun /> {t(theme === 'light' ? 'Dark mode' : 'Light')}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void reloadWorkspace()}><RotateCcw /> {t('Reload workspace')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/')}><Store /> {t('Back to marketplace')}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { void signOut().then(() => navigate('/login', { replace: true })) }}><LogOut /> {t('Sign out')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
