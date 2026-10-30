import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Bell, Building2, CheckCheck, Download, Handshake, Inbox, Settings, ShieldCheck, Trash2, Users, Wallet,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { formatDate, fromNow } from '@/lib/format'
import { cn, downloadCsv, humanize } from '@/lib/utils'
import { PageHeader, StatCard, SearchInput } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { EmptyState, Switch } from '@/components/ui/misc'
import type { Notification } from '@/types'

const categoryMeta = {
  crm: { icon: Users, tint: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
  properties: { icon: Building2, tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  exchange: { icon: Handshake, tint: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
  finance: { icon: Wallet, tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  system: { icon: Settings, tint: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300' },
} as const

export function NotificationsPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const role = useAppStore((s) => s.role)
  const activeCompanyId = useAppStore((s) => s.activeCompanyId)
  const notificationsAll = useAppStore((s) => s.notifications)
  const markRead = useAppStore((s) => s.markNotificationRead)
  const deleteNotification = useAppStore((s) => s.deleteNotification)
  const toast = useAppStore((s) => s.toast)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [unreadOnly, setUnreadOnly] = useState(false)

  const notifications = useMemo(() => {
    if (role === 'super_admin') return notificationsAll
    return notificationsAll.filter((notification) => !notification.companyId || notification.companyId === activeCompanyId)
  }, [role, notificationsAll, activeCompanyId])

  const unread = notifications.filter((notification) => !notification.read)
  const todayCount = notifications.filter((notification) => new Date(notification.createdAt).toDateString() === new Date().toDateString()).length
  const exchangeCount = notifications.filter((notification) => notification.category === 'exchange').length

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return notifications
      .filter((notification) => !unreadOnly || !notification.read)
      .filter((notification) => category === 'all' || notification.category === category)
      .filter((notification) => !term || notification.title.toLowerCase().includes(term) || notification.body.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notifications, unreadOnly, category, query])

  const groups = useMemo(() => {
    const today: Notification[] = []
    const yesterday: Notification[] = []
    const earlier: Notification[] = []
    const todayKey = new Date().toDateString()
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayKey = yesterdayDate.toDateString()
    filtered.forEach((notification) => {
      const key = new Date(notification.createdAt).toDateString()
      if (key === todayKey) today.push(notification)
      else if (key === yesterdayKey) yesterday.push(notification)
      else earlier.push(notification)
    })
    return [
      { label: t('Today'), items: today },
      { label: t('Yesterday'), items: yesterday },
      { label: t('Earlier'), items: earlier },
    ].filter((group) => group.items.length > 0)
  }, [filtered, t])

  const openNotification = (notification: Notification) => {
    markRead(notification.id)
    if (notification.href) navigate(notification.href)
  }

  const markAllRead = () => {
    const ids = unread.map((notification) => notification.id)
    if (!ids.length) { toast('All caught up', 'There are no unread notifications.', 'info'); return }
    ids.forEach((id) => markRead(id))
    toast('Notifications cleared', `${ids.length} notifications were marked as read.`, 'info')
  }

  const exportNotifications = () => {
    downloadCsv('nawyati-notifications.csv', [
      ['Title', 'Body', 'Category', 'Read', 'Created at', 'Link'],
      ...filtered.map((notification) => [notification.title, notification.body, notification.category, notification.read ? 'Yes' : 'No', notification.createdAt, notification.href ?? '']),
    ])
    toast('Notifications exported', 'The filtered notification list was downloaded as a CSV file.')
  }

  return (
    <div>
      <PageHeader
        eyebrow={<><Bell className="size-3.5" /> {t('Notifications')}</>}
        title={t('Notifications')}
        description={t('Lead assignments, cooperation updates, finance events and platform announcements in one place.')}
        actions={<>
          <Button variant="outline" onClick={exportNotifications}><Download className="size-4" /> {t('Export')}</Button>
          <Button variant="outline" onClick={() => navigate('/settings?tab=notifications')}><Settings className="size-4" /> {t('Preferences')}</Button>
          <Button onClick={markAllRead} disabled={!unread.length}><CheckCheck className="size-4" /> {t('Mark all read')}</Button>
        </>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('All notifications')} value={notifications.length} icon={Bell} />
        <StatCard label={t('Unread')} value={unread.length} icon={Inbox} tone="blue" hint={t('action required')} />
        <StatCard label={t('Today')} value={todayCount} icon={ShieldCheck} tone="green" hint={t('latest activity')} />
        <StatCard label={t('Exchange updates')} value={exchangeCount} icon={Handshake} tone="purple" hint={t('cooperation desk')} />
      </div>

      <Card className="mt-4 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder={t('Search notifications')} className="w-full sm:w-72" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-[170px]">
            <option value="all">{t('All categories')}</option>
            <option value="crm">{t('CRM')}</option>
            <option value="properties">{t('Properties')}</option>
            <option value="exchange">{t('Exchange')}</option>
            <option value="finance">{t('Finance')}</option>
            <option value="system">{t('System')}</option>
          </Select>
          <label className="ms-auto flex items-center gap-2 text-[11px] text-muted-foreground">
            {t('Unread only')}
            <Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} />
          </label>
        </div>
      </Card>

      {groups.length ? (
        <div className="mt-4 space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{group.label}</p>
              <Card className="overflow-hidden">
                <div className="divide-y divide-border">
                  {group.items.map((notification) => {
                    const meta = categoryMeta[notification.category] ?? categoryMeta.system
                    const Icon = meta.icon
                    return (
                      <div
                        key={notification.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openNotification(notification)}
                        onKeyDown={(event) => { if (event.key === 'Enter') openNotification(notification) }}
                        className={cn('group flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30', !notification.read && 'bg-accent/[0.035]')}
                      >
                        <span className={cn('mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg', meta.tint)}><Icon className="size-4" /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {!notification.read && <span className="size-1.5 shrink-0 rounded-full bg-accent" />}
                            <p className={cn('text-[12px] leading-tight', notification.read ? 'font-medium' : 'font-semibold')}>{notification.title}</p>
                            <Badge tone="outline">{t(humanize(notification.category))}</Badge>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{notification.body}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground/70">{fromNow(notification.createdAt, lang)} · {formatDate(notification.createdAt, lang, 'dd MMM, HH:mm')}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            onClick={(event) => { event.stopPropagation(); deleteNotification(notification.id); toast('Notification removed', undefined, 'info') }}
                            className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-rose-500 group-hover:opacity-100"
                            aria-label={t('Delete notification')}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          {notification.href && <ArrowRight className="size-3.5 text-muted-foreground/50 rtl:rotate-180" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card className="mt-4">
          <EmptyState
            icon={Bell}
            title={unreadOnly ? t('No unread notifications') : t('No notifications found')}
            description={unreadOnly ? t('You are all caught up.') : t('Try a different category or search term, or trigger an action in the demo.')}
            action={unreadOnly ? <Button variant="outline" size="sm" onClick={() => setUnreadOnly(false)}>{t('Show all')}</Button> : undefined}
          />
        </Card>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        {t('Notifications are generated by local demo actions. No email, SMS, push or WhatsApp messages are delivered.')}
      </div>
    </div>
  )
}
