import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole, Therapist, Parent } from '@/lib/types'

interface AuthState {
  user: User | null
  role: UserRole | null
  therapist: Therapist | null
  parent: Parent | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>
  refreshRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchRole(userId: string): Promise<{
  role: UserRole | null
  therapist: Therapist | null
  parent: Parent | null
}> {
  const [tRes, pRes] = await Promise.all([
    supabase.from('therapists').select('*').eq('id', userId).maybeSingle(),
    supabase.from('parents').select('*').eq('id', userId).maybeSingle(),
  ])
  // P2-4: surface RLS/role-lookup failures in Vercel runtime logs so a
  // stuck-on-Loading screen is debuggable from logs alone. We do NOT
  // expose the raw error to the UI — auth loading state still resolves.
  if (tRes.error) console.warn('[useAuth] fetchRole therapists lookup failed:', tRes.error)
  if (pRes.error) console.warn('[useAuth] fetchRole parents lookup failed:', pRes.error)
  if (tRes.data) return { role: 'therapist', therapist: tRes.data, parent: null }
  if (pRes.data) return { role: 'parent', therapist: null, parent: pRes.data }
  return { role: null, therapist: null, parent: null }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    therapist: null,
    parent: null,
    loading: true,
  })

  async function loadUser(user: User | null) {
    if (!user) {
      setState({ user: null, role: null, therapist: null, parent: null, loading: false })
      return
    }
    const roleData = await fetchRole(user.id)
    setState({ user, ...roleData, loading: false })
  }

  async function refreshRole() {
    if (!state.user) return
    const roleData = await fetchRole(state.user.id)
    setState(prev => ({ ...prev, ...roleData }))
  }

  useEffect(() => {
    let cancelled = false

    async function initializeAuth() {
      const params = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (type === 'signup' && accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!error) {
          const url = new URL(window.location.href)
          url.hash = ''
          url.searchParams.set('confirmed', '1')
          window.location.replace(url.toString())
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!cancelled) loadUser(session?.user ?? null)
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
