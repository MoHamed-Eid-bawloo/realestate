import { useMemo } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Building2, ChevronDown, Check, Handshake, PanelLeftClose, PanelLeftOpen, ShieldCheck, Store, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { useI18n } from '@/i18n'
import { navForRole } from '@/lib/nav'
import { roleLabel } from '@/lib/labels'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown'
import { Badge } from '@/components/ui/badge'

export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm">
        <svg viewBox="0 0 32 32" className="size-6"><path d="M5 25V12l11-7 11 7v13h-7v-9H12v9H5Z" fill="#142B45" /><path d="M16 11l4-2.5V12h-4Z" fill="#10B981" /></svg>
        <span className="absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full border-2 border-[#0D2134] bg-accent" />
      </span>
      {!compact && (
        <span className="flex flex-col">
          <span className={cn('text-[17px] font-semibold leading-tight tracking-[-0.03em]', light ? 'text-white' : 'text-[#142B45] dark:text-white')}>Nawyati</span>
          <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-sidebar-muted">Real Estate OS</span>
        </span>
      )}
    </Link>
  )
}

function useActiveMatch() {
  const { pathname, search } = useLocation()
  const tab = new URLSearchParams(search).get('tab')
  return useMemo(() => {
    return (href: string, itemTab?: string) => {
      const url = new URL(href, 'http://x')
      const path = url.pathname
      const qTab = url.searchParams.get('tab')
      const pathMatch = path === '/crm'
        ? pathname === '/crm'
        : pathname === path || pathname.startsWith(`${path}/`)
      if (!pathMatch) return false
      if (qTab) return tab === qTab && pathname === path
      if (itemTab) return tab === itemTab
      if (pathname !== path) return false
      return !tab
    }
  }, [pathname, tab])
}

export function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const { t } = useI18n()
  const role = useAppStore((s) => s.role)
  const company = useAppStore((s) => s.companies.find((c) => c.id === s.activeCompanyId))
  const developer = useAppStore((s) => s.developers.find((d) => d.id === s.activeDeveloperId))
  const broker = useAppStore((s) => s.brokers.find((b) => b.id === s.activeBrokerId))
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const companies = useAppStore((s) => s.companies)
  const setActiveCompany = useAppStore((s) => s.setActiveCompany)
  const toast = useAppStore((s) => s.toast)
  const platform = useAppStore((s) => s.platform)
  const newLeads = useAppStore((s) => s.leads.filter((l) => l.companyId === s.activeCompanyId && l.status === 'new').length)
  const overdue = useAppStore((s) => s.tasks.filter((task) => task.companyId === s.activeCompanyId && task.status !== 'done' && new Date(task.dueDate) < new Date()).length)
  const nav = useMemo(() => navForRole(role)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!platform.aiAssistantEnabled && item.href.startsWith('/crm/ai')) return false
        if (!platform.exchangeEnabled && item.href.startsWith('/exchange')) return false
        if (!platform.developerPortalEnabled && item.href.startsWith('/developer')) return false
        return true
      }),
    }))
    .filter((group) => group.items.length > 0), [role, platform.aiAssistantEnabled, platform.exchangeEnabled, platform.developerPortalEnabled])
  const isActive = useActiveMatch()
  const showCompact = collapsed && !mobile

  const tenantLabel = role === 'super_admin' ? 'Nawyati Platform' : role === 'developer' ? developer?.name ?? '' : role === 'broker' ? broker?.name ?? '' : company?.name ?? ''
  const tenantSub = role === 'super_admin' ? 'Super administration' : role === 'developer' ? 'Verified developer' : role === 'broker' ? 'Independent broker' : 'Business workspace'

  return (
    <aside className={cn('sidebar-gradient flex h-full min-h-0 flex-col border-e border-sidebar-border text-white', mobile ? 'w-[276px]' : 'w-[264px]', showCompact && 'w-[76px]')}>
      <div className={cn('flex h-16 shrink-0 items-center justify-between px-4', showCompact && 'justify-center px-2')}>
        <Brand light compact={showCompact} />
        {mobile ? (
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-sidebar-muted hover:bg-white/10 hover:text-white"><X className="size-4" /></button>
        ) : (
          <button onClick={toggleSidebar} className={cn('grid size-8 place-items-center rounded-lg text-sidebar-muted transition-colors hover:bg-white/10 hover:text-white', showCompact && 'hidden')}>
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      <div className={cn('mx-3 mb-3', showCompact && 'mx-2')}>
        {role === 'super_admin' || role === 'developer' || role === 'broker' ? (
          <div className={cn('flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.06] p-2.5', showCompact && 'justify-center p-2')}>
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-accent/15 text-accent">
              {role === 'developer' ? <Building2 className="size-4" /> : role === 'broker' ? <Handshake className="size-4" /> : <ShieldCheck className="size-4" />}
            </span>
            {!showCompact && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-white">{tenantLabel}</p>
                <p className="truncate text-[10px] text-sidebar-muted">{t(tenantSub)}</p>
              </div>
            )}
            {!showCompact && <Badge tone="green" className="border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0 text-[9px] text-emerald-300">Demo</Badge>}
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger className={cn('flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.06] p-2.5 text-start transition-colors hover:bg-white/[0.1]', showCompact && 'justify-center p-2')}>
              <span className="grid size-7 shrink-0 place-items-center rounded-md text-[9px] font-bold text-white" style={{ background: company?.logoColor ?? '#334E68' }}>
                {company?.name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
              </span>
              {!showCompact && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-white">{tenantLabel}</p>
                    <p className="truncate text-[10px] text-sidebar-muted">{t('Business workspace')}</p>
                  </div>
                  <ChevronDown className="size-3.5 shrink-0 text-sidebar-muted" />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
              <DropdownMenuLabel>{t('Switch company')}</DropdownMenuLabel>
              {companies.map((c) => (
                <DropdownMenuItem key={c.id} onSelect={() => { setActiveCompany(c.id); toast('Workspace switched', `Now viewing ${c.name}.`) }}>
                  <span className="grid size-6 place-items-center rounded text-[8px] font-bold text-white" style={{ background: c.logoColor }}>{c.name.split(' ').slice(0, 2).map((n) => n[0]).join('')}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px]">{c.name}</span>
                    <span className="block text-[10px] text-muted-foreground">{c.city} · {c.status}</span>
                  </span>
                  {c.id === company?.id && <Check className="size-3.5 text-accent" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => window.location.assign('/settings')}>
                <Store className="size-3.5" /> {t('Company settings')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <nav className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {nav.map((group) => (
          <div key={group.label} className="mb-4">
            {!showCompact && <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted/70">{t(group.label)}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.tab)
                const Icon = item.icon
                const badge = item.label === 'Lead Inbox' ? newLeads : item.label === 'Tasks' ? overdue : 0
                return (
                  <NavLink
                    key={item.href + item.label}
                    to={item.href}
                    onClick={onClose}
                    title={showCompact ? t(item.label) : undefined}
                    className={cn(
                      'group flex h-8 items-center gap-2.5 rounded-md px-2 text-[12px] transition-colors',
                      active ? 'bg-white/[0.11] font-medium text-white shadow-[inset_2px_0_0_#10B981] rtl:shadow-[inset_-2px_0_0_#10B981]' : 'text-sidebar-muted hover:bg-white/[0.06] hover:text-white',
                      showCompact && 'justify-center px-0',
                    )}
                  >
                    {Icon && <Icon className={cn('size-4 shrink-0', active ? 'text-accent' : 'text-sidebar-muted group-hover:text-white')} />}
                    {!showCompact && <span className="flex-1 truncate">{t(item.label)}</span>}
                    {!showCompact && badge > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-accent/20 px-1 text-[9px] font-semibold text-emerald-300">{badge}</span>}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn('shrink-0 border-t border-sidebar-border p-3', showCompact && 'px-2')}>
        <Link to="/" onClick={onClose} className={cn('mb-2 flex h-8 items-center gap-2.5 rounded-md px-2 text-[12px] text-sidebar-muted transition-colors hover:bg-white/[0.06] hover:text-white', showCompact && 'justify-center px-0')} title={t('Back to marketplace')}>
          <Store className="size-4 shrink-0" />
          {!showCompact && <span>{t('Back to marketplace')}</span>}
        </Link>
        {!showCompact ? (
          <div className="rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-2.5">
            <div className="flex items-center gap-2">
              <Zap className="size-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-white">{role === 'owner' || role === 'manager' || role === 'agent' ? t('Business plan') : role === 'super_admin' ? t('Platform control') : role === 'developer' ? t('Developer workspace') : t('Verified network')}</span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-sidebar-muted">{t('All data is demo data and stored locally in your browser.')}</p>
            <Link to="/settings" className="mt-2 inline-flex text-[10px] font-medium text-emerald-400 hover:text-emerald-300">{role === 'super_admin' ? t('Platform Settings') : t('Settings')} →</Link>
          </div>
        ) : (
          <button onClick={toggleSidebar} className="mx-auto grid size-8 place-items-center rounded-lg text-sidebar-muted hover:bg-white/10 hover:text-white" title="Expand">
            <PanelLeftOpen className="size-4" />
          </button>
        )}
      </div>
    </aside>
  )
}
