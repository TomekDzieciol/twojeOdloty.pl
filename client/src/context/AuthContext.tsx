import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

type AuthContextValue = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const AGE_VERIFIED_KEY = 'age_verified'
const AGE_VERIFIED_AT_KEY = 'age_verified_at'

export function getAgeVerified(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.includes(AGE_VERIFIED_KEY + '=true')
}

export function setAgeVerified(): void {
  document.cookie = `${AGE_VERIFIED_KEY}=true; path=/; max-age=31536000; SameSite=Lax`
  document.cookie = `${AGE_VERIFIED_AT_KEY}=${Date.now()}; path=/; max-age=31536000; SameSite=Lax`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(data ?? null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id)
  }, [user?.id, fetchProfile])

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null
    try {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user?.id) {
          try {
            await fetchProfile(session.user.id)
          } catch {
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
        setLoading(false)
      })
      subscription = sub

      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          setUser(session?.user ?? null)
          if (session?.user?.id) {
            return fetchProfile(session.user.id)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } catch {
      setLoading(false)
    }

    return () => subscription?.unsubscribe?.()
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
