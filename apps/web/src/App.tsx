import { Component, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { FeatureFlagsProvider } from '@/hooks/useFeatureFlags'
import { isConfigured } from '@/lib/supabase'

// On iOS/Android Capacitor, the WebView serves dist/ from a local origin
// (capacitor://localhost on iOS, https://localhost on Android). There is
// no `/app/` prefix. On the Vercel web deployment, the production URL is
// parentscript.app/app/* and all routes are prefixed with `/app/`.
//
// Capacitor 8 + Vite + react-router-dom needs the basename to match the
// runtime host, otherwise the WebView loads /, the router thinks the
// active pathname is `/app` (or no basename), and the `<Route path="/">`
// never matches → fallback `<Route path="*" element={<Navigate to="/" />} />`
// loops back into itself → permanent white screen.
//
// Fix: pick basename based on platform. Native = empty (paths are root-
// relative on the local file origin). Web = "/app" (Vercel rewrite rule).
function getRouterBasename(): string {
  if (typeof window === 'undefined') return '/app'
  if (Capacitor.isNativePlatform()) return ''
  // Vercel web: only apply basename when we're actually hosted under /app.
  // (Avoids breaking a future deploy that serves from the root.)
  return window.location.pathname.startsWith('/app/') ||
    window.location.pathname === '/app'
    ? '/app'
    : ''
}

import TherapistAuth from '@/pages/auth/TherapistAuth'
import ParentOnboarding from '@/pages/auth/ParentOnboarding'
import ParentSignup from '@/pages/auth/ParentSignup'
import ParentLogin from '@/pages/auth/ParentLogin'
import ResetPassword from '@/pages/auth/ResetPassword'
import AuthCallback from '@/pages/AuthCallback'
import ClientList from '@/pages/therapist/ClientList'
import ClientDetail from '@/pages/therapist/ClientDetail'
import TherapistSettings from '@/pages/therapist/TherapistSettings'
import Pricing from '@/pages/Pricing'
import Billing from '@/pages/Billing'
import Security from '@/pages/Security'
import Privacy from '@/pages/Privacy'
import Terms from '@/pages/Terms'
import About from '@/pages/About'
import Home from '@/pages/Home'
import SiblingHome from '@/pages/SiblingHome'
import SiblingInTheMoment from '@/pages/SiblingInTheMoment'
import SiblingSafety from '@/pages/SiblingSafety'
import ParentHome from '@/pages/parent/ParentHome'
import ParentPreferences from '@/pages/parent/ParentPreferences'
import SkillDetail from '@/pages/parent/SkillDetail'
import InTheMoment from '@/pages/parent/InTheMoment'
import PracticeLog from '@/pages/parent/PracticeLog'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading…</div>
    </div>
  )
}

function TherapistRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user || role !== 'therapist') return <Navigate to="/login" replace />
  return <>{children}</>
}

function ParentRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user || role !== 'parent') return <Navigate to="/login" replace />
  return <>{children}</>
}

function RootRedirect() {
  const { user, role, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (role === 'therapist') return <Navigate to="/therapist/clients" replace />
  if (role === 'parent') return <Navigate to="/parent" replace />
  // Authenticated but no role yet (just signed up — redirect to login to re-check)
  return <Navigate to="/login" replace />
}

function SetupRequired() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-black text-brand-800 tracking-tight mb-4">ParentScript</h1>
      <div className="bg-white rounded-xl shadow p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Supabase setup required</h2>
        <p className="text-sm text-gray-600 mb-4">
          Copy <code className="bg-gray-100 px-1 rounded">.env.example</code> to{' '}
          <code className="bg-gray-100 px-1 rounded">.env</code> and fill in your Supabase
          project URL and anon key.
        </p>
        <p className="text-xs text-gray-400">
          Then run <code>docs/supabase-schema.sql</code> in the Supabase SQL editor.
        </p>
      </div>
    </div>
  )
}

// ── Connectivity probe ───────────────────────────────────────────
// Hits the Supabase auth settings endpoint to confirm the API is reachable
// and the anon key is recognized. Result drives the BootErrorScreen so a
// paused/deleted/rotated Supabase project surfaces a useful message instead
// of a silent white screen.
function ConnectivityBanner({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'pending' | 'ok' | 'broken'>('pending')
  const [detail, setDetail] = useState<string>('')

  useEffect(() => {
    if (!isConfigured) {
      setState('ok') // SetupRequired already covers the missing-env case
      return
    }
    const url = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/auth/v1/settings'
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 8000)
    fetch(url, { headers: { apikey: key }, signal: controller.signal })
      .then(r => {
        if (r.ok) {
          setState('ok')
        } else {
          setState('broken')
          r.text().then(t => setDetail(`HTTP ${r.status} — ${t.slice(0, 120)}`)).catch(() => {})
        }
      })
      .catch(e => {
        setState('broken')
        setDetail(String(e?.message || e).slice(0, 160))
      })
      .finally(() => clearTimeout(t))
    return () => {
      controller.abort()
      clearTimeout(t)
    }
  }, [])

  if (state !== 'broken') return <>{children}</>
  return (
    <>
      {children}
      <div
        role="alert"
        className="fixed bottom-0 inset-x-0 z-50 bg-amber-50 border-t-2 border-amber-500 px-4 py-3 text-xs text-amber-900 font-mono shadow-lg"
        data-testid="supabase-connectivity-banner"
      >
        <strong className="font-bold">⚠ Supabase API unreachable:</strong>{' '}
        {detail || 'unknown error'}. Email signup and login will fail until the
        Supabase project is restored. (Logged for support.)
      </div>
    </>
  )
}

// ── Error boundary ──────────────────────────────────────────────
// Catches render-time errors so a single bad component shows a real
// error screen instead of a permanent white screen.
class BootErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('[BootErrorBoundary] render failure:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-black text-brand-800 tracking-tight mb-4">ParentScript</h1>
          <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-left">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Something went wrong on launch</h2>
            <p className="text-sm text-gray-600 mb-3">
              A render error prevented the app from loading. Try closing and reopening the app.
              If this keeps happening, send the message below to support.
            </p>
            <pre className="bg-gray-100 text-xs p-3 rounded overflow-auto whitespace-pre-wrap break-words text-gray-800">
{String(this.state.error?.message ?? this.state.error)}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// RoutesRefresher — when Capacitor's WebView restores the app from the
// background, the history stack can drift; this normalizes it.
function RoutesRefresher() {
  const location = useLocation()
  useEffect(() => {
    // No-op for now, but lets us debug basename routing from the
    // device console.
    if (typeof window !== 'undefined') {
      (window as unknown as { __parentscriptPath?: string }).__parentscriptPath =
        location.pathname + location.search + location.hash
    }
  }, [location])
  return null
}

export default function App() {
  if (!isConfigured) return <SetupRequired />

  const basename = getRouterBasename()

  return (
    <BootErrorBoundary>
    <ConnectivityBanner>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <FeatureFlagsProvider>
        <RoutesRefresher />
        <Routes>
          {/* Public marketing homepage — always renders, regardless of auth. */}
          <Route path="/" element={<Home />} />

          {/* Post-auth landing — used after signup, login, or logout-redirect. */}
          <Route path="/start" element={<RootRedirect />} />

          {/* Therapist auth */}
          <Route path="/login" element={<TherapistAuth mode="login" />} />
          <Route path="/signup" element={<TherapistAuth mode="signup" />} />

          {/* Parent self-serve signup (public — no invite required) */}
          <Route path="/parent-signup" element={<ParentSignup />} />

          {/* Parent self-serve login (public — paired with /parent-signup).
              Without this, a parent who bounced after signup and tried to
              come back would land on /login (the therapist login form)
              which says "Email not confirmed" for unconfirmed users — a
              dead-end UX. /parent-login keeps parents on a parent-shaped
              screen. */}
          <Route path="/parent-login" element={<ParentLogin />} />

          {/* Parent onboarding via invite link (public) */}
          <Route path="/invite/:code" element={<ParentOnboarding />} />

          {/* Password reset (public — accessed via email link) */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Shared auth callback — OAuth (Google/Apple) and any future
              email-confirm path that wants a single landing. The page
              reads the URL hash, calls supabase.auth.getSession(), and
              role-redirects. */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Therapist portal */}
          <Route
            path="/therapist/clients"
            element={<TherapistRoute><ClientList /></TherapistRoute>}
          />
          <Route
            path="/therapist/clients/:id"
            element={<TherapistRoute><ClientDetail /></TherapistRoute>}
          />
          <Route
            path="/therapist/settings"
            element={<TherapistRoute><TherapistSettings /></TherapistRoute>}
          />
          <Route
            path="/pricing"
            element={<Pricing />}
          />
          <Route
            path="/security"
            element={<Security />}
          />
          <Route
            path="/privacy"
            element={<Privacy />}
          />
          <Route
            path="/terms"
            element={<Terms />}
          />
          <Route
            path="/about"
            element={<About />}
          />
          {/* SiblingSupport surface — public landing + minimal coach */}
          <Route path="/sibling" element={<SiblingHome />} />
          <Route path="/sibling/app" element={<SiblingInTheMoment />} />
          <Route path="/sibling/safety" element={<SiblingSafety />} />
          <Route
            path="/billing"
            element={<TherapistRoute><Billing /></TherapistRoute>}
          />

          {/* Parent PWA */}
          <Route
            path="/parent"
            element={<ParentRoute><ParentHome /></ParentRoute>}
          />
          <Route
            path="/parent/skills/:slug"
            element={<ParentRoute><SkillDetail /></ParentRoute>}
          />
          <Route
            path="/parent/in-the-moment"
            element={<ParentRoute><InTheMoment /></ParentRoute>}
          />
          <Route
            path="/parent/practice"
            element={<ParentRoute><PracticeLog /></ParentRoute>}
          />
          <Route
            path="/parent/preferences"
            element={<ParentRoute><ParentPreferences /></ParentRoute>}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </FeatureFlagsProvider>
      </AuthProvider>
    </BrowserRouter>
    </ConnectivityBanner>
    </BootErrorBoundary>
  )
}
