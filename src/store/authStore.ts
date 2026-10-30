import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import type { Lang, Profile, Role, Theme } from '@/types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  ready: boolean
  busy: boolean
  error: string | null
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

let started = false
let activeUserId: string | null = null

async function loadProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (data) {
      return {
        id: data.id as string,
        email: data.email as string,
        fullName: data.full_name as string,
        role: data.role as Role,
        companyId: data.company_id as string | null,
        developerId: data.developer_id as string | null,
        brokerId: data.broker_id as string | null,
        employeeId: data.employee_id as string | null,
        avatarColor: (data.avatar_color as string) ?? '#142B45',
        language: (data.language as Lang) ?? 'en',
        theme: (data.theme as Theme) ?? 'light',
        createdAt: (data.created_at as string) ?? undefined,
      }
    }
    if (error) console.error('[auth] profile load failed', error.message)
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return null
}

async function activate(session: Session) {
  const profile = await loadProfile(session.user.id)
  useAuthStore.setState({ session, profile, error: profile ? null : 'Your profile is not ready yet.' })
  if (profile) await useAppStore.getState().hydrateWorkspace(profile)
  return profile
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  profile: null,
  ready: false,
  busy: false,
  error: null,

  init: async () => {
    if (started) return
    started = true
    await useAppStore.getState().hydratePublic()
    if (!isSupabaseConfigured || !supabase) {
      set({ ready: true })
      return
    }
    const { data } = await supabase.auth.getSession()
    const session = data.session
    if (session) {
      activeUserId = session.user.id
      await activate(session)
    }
    set({ ready: true })

    supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_OUT') {
        activeUserId = null
        set({ session: null, profile: null })
        useAppStore.getState().clearWorkspace()
        return
      }
      if (!next) return
      if (useAuthStore.getState().busy) {
        set({ session: next })
        return
      }
      if (activeUserId === next.user.id && event !== 'USER_UPDATED') {
        set({ session: next })
        return
      }
      activeUserId = next.user.id
      void activate(next)
    })
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, message: 'Supabase is not configured. Add the project URL and anon key to your environment.' }
    }
    set({ busy: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      set({ busy: false, error: error?.message ?? 'Could not sign in.' })
      return { ok: false, message: error?.message ?? 'Could not sign in.' }
    }
    activeUserId = data.session.user.id
    const profile = await activate(data.session)
    set({ busy: false })
    if (!profile) {
      return { ok: false, message: 'Signed in, but no workspace profile was found. Run the seed script or ask an administrator to create your profile.' }
    }
    return { ok: true }
  },

  signOut: async () => {
    if (supabase) await supabase.auth.signOut()
    activeUserId = null
    set({ session: null, profile: null, error: null })
    useAppStore.getState().clearWorkspace()
  },

  refresh: async () => {
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    if (data.session) await activate(data.session)
  },
}))
