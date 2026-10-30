import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, LogOut, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useI18n } from '@/i18n'
import { Brand } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/button'

export function AuthBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useAuthStore.getState().init()
  }, [])
  return <>{children}</>
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const ready = useAuthStore((s) => s.ready)
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const location = useLocation()

  if (!ready) return <FullScreenLoader />
  if (!session) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  if (!profile) return <ProfileMissing />
  return <>{children}</>
}

function ProfileMissing() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const signOut = useAuthStore((s) => s.signOut)
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><ShieldAlert className="size-6" /></span>
        <h1 className="mt-4 text-lg font-semibold">{t('Workspace profile not found')}</h1>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          {t('Your sign-in succeeded, but no role profile is attached. Run the seed script or ask a platform administrator to create your profile.')}
        </p>
        <Button variant="outline" className="mt-5" onClick={() => { void signOut().then(() => navigate('/login', { replace: true })) }}>
          <LogOut /> {t('Sign out')}
        </Button>
      </div>
    </div>
  )
}

export function FullScreenLoader() {
  const { t } = useI18n()
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Brand />
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm">
          <Loader2 className="size-3.5 animate-spin text-accent" /> {t('Loading your workspace…')}
        </span>
      </div>
    </div>
  )
}
