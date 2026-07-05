import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

// ────────────────────────────────────────────────────────────────────
// AuthCallback — shared post-auth landing for OAuth + email confirm
// ────────────────────────────────────────────────────────────────────
//
// Supabase sends users back here with an access_token + refresh_token
// in the URL hash. The AuthProvider's onAuthStateChange picks the
// session up automatically; we just need to wait for a non-null user
// and then route based on role.
//
// Routing rules:
//   - therapist role       → /therapist/clients
//   - parent role          → /parent
//   - authenticated, no role yet (new OAuth user, e.g. Google/Apple
//     landed here without a therapists/parents row) → /start
//     (RootRedirect handles that case)
//   - error                → /login with an `auth_error=1` query
//     so the user can retry
//
// Why we don't just `navigate('/dashboard')`:
//   The task brief suggested /dashboard, but the existing app uses
//   /therapist/clients for therapists and /parent for parents. We
//   keep that convention so Quinn's QA pass still covers the routes.
// ────────────────────────────────────────────────────────────────────

type Status = 'pending' | 'ok' | 'error'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('pending')
  const [detail, setDetail] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    let redirectTimer: ReturnType<typeof setTimeout> | null = null

    async function resolve() {
      // 1. If there's an OAuth error in the hash, surface it.
      const hash = window.location.hash.slice(1)
      const params = new URLSearchParams(hash)
      const oauthError =
        params.get('error_description') || params.get('error')
      if (oauthError) {
        if (cancelled) return
        setDetail(oauthError)
        setStatus('error')
        return
      }

      // 2. getSession() — Supabase JS client parses the hash automatically
      //    on construction of createClient, but only when persistSession is
      //    on (default). If a session is already present we're done.
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()
      if (sessionError) {
        if (cancelled) return
        setDetail(sessionError.message)
        setStatus('error')
        return
      }

      const user = sessionData.session?.user
      if (!user) {
        // No session and no error — user may have landed here directly.
        // Send them to /start (RootRedirect → /login if unauthed).
        if (cancelled) return
        setStatus('ok')
        navigate('/start', { replace: true })
        return
      }

      // 3. Look up role. Mirror useAuth's fetchRole logic so we can
      //    redirect immediately without waiting for the full provider
      //    re-render cycle.
      const [tRes, pRes] = await Promise.all([
        supabase
          .from('therapists')
          .select('id')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('parents')
          .select('id')
          .eq('id', user.id)
          .maybeSingle(),
      ])

      if (cancelled) return

      // RLS errors on a public-row lookup are usually "not found", not
      // a real failure — log but don't block the redirect.
      if (tRes.error) {
        console.warn('[AuthCallback] therapists lookup failed:', tRes.error)
      }
      if (pRes.error) {
        console.warn('[AuthCallback] parents lookup failed:', pRes.error)
      }

      // Clear the URL hash so a refresh doesn't replay the OAuth flow.
      try {
        const clean = new URL(window.location.href)
        clean.hash = ''
        clean.searchParams.delete('error')
        clean.searchParams.delete('error_description')
        window.history.replaceState(null, '', clean.toString())
      } catch {
        // best-effort
      }

      setStatus('ok')
      if (tRes.data) {
        navigate('/therapist/clients', { replace: true })
      } else if (pRes.data) {
        navigate('/parent', { replace: true })
      } else {
        // Authenticated but no role row — let RootRedirect decide.
        navigate('/start', { replace: true })
      }
    }

    // 5s safety timeout — if anything hangs (slow Supabase, RLS issue),
    // send the user to /login rather than spinning forever.
    redirectTimer = setTimeout(() => {
      if (cancelled || status !== 'pending') return
      setDetail('Timed out waiting for session — please sign in again.')
      setStatus('error')
    }, 5000)

    resolve()

    return () => {
      cancelled = true
      if (redirectTimer) clearTimeout(redirectTimer)
    }
    // status intentionally not in deps — we only want to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  if (status === 'error') {
    const qs = detail ? `?auth_error=1&msg=${encodeURIComponent(detail)}` : '?auth_error=1'
    return (
      <CallbackScreen
        title="Sign-in didn't complete"
        body={detail || 'Please try again.'}
        actionLabel="Back to sign in"
        onAction={() => navigate(`/login${qs}`, { replace: true })}
      />
    )
  }

  return (
    <CallbackScreen
      title="Finishing sign-in…"
      body="One moment while we get you set up."
      showSpinner
    />
  )
}

function CallbackScreen({
  title,
  body,
  actionLabel,
  onAction,
  showSpinner,
}: {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
  showSpinner?: boolean
}) {
  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white shadow sm:rounded-xl px-8 py-10 max-w-md w-full text-center">
        <h1 className="text-4xl font-black text-brand-800 tracking-tight mb-6">
          ParentScript
        </h1>
        {showSpinner && (
          <div
            className="mx-auto mb-4 w-8 h-8 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin"
            aria-label="Loading"
          />
        )}
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-6 break-words">{body}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold py-3 rounded-lg transition min-h-tap"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
