import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Wrench, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { useAppStore } from '@/store/appStore'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const maintenanceMode = useAppStore((s) => s.platform.maintenanceMode)
  const setCommandOpen = useAppStore((s) => s.setCommandOpen)
  const { t } = useI18n()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandOpen])

  return (
    <div className="flex min-h-screen bg-background">
      <div className={cn('sticky top-0 hidden h-screen shrink-0 lg:block')}>
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-[#071426]/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 start-0 animate-slide-in">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        {maintenanceMode && !bannerDismissed && (
          <div className="flex items-center gap-2 border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-[11px] text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
            <Wrench className="size-3.5 shrink-0" />
            <span className="flex-1">
              {t('Maintenance mode preview — internal layouts only. Access is not blocked in this demo.')}
            </span>
            <button onClick={() => setBannerDismissed(true)} className="grid size-6 shrink-0 place-items-center rounded-md hover:bg-amber-200/50 dark:hover:bg-amber-400/10" aria-label={t('Dismiss')}>
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1540px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="mx-auto w-full max-w-[1540px] px-4 pb-5 text-[10px] text-muted-foreground sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <span>{t('Nawyati Real Estate OS · Supabase workspace · Demo records')}</span>
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-accent" /> {t('No real payments or external integrations')}</span>
          </div>
        </footer>
      </div>
      <CommandPalette />
    </div>
  )
}
