import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { friendlyAuthError } from '@/lib/authErrors'
import ScopeOfPracticeGate from '@/components/ScopeOfPracticeGate'
import OAuthButtons from '@/components/OAuthButtons'

// ────────────────────────────────────────────────────────────────────
// ParentLogin — Free-tier self-serve parent login
// ────────────────────────────────────────────────────────────────────
//
// Separate route from /login (which is the therapist login form) so a
// parent who signed up via the free /parent-signup path and bounced
// before clicking the email-confirm link has a way back in. The
// therapist login screen says "Email not confirmed" for unconfirmed
// parents, which is confusing — a parent should land on a parent-shaped
// screen.
//
// On success, navigates to /parent. The useAuth hook picks up the
// parent row on its next role fetch.
//
// Raw PostgREST / Supabase errors are NEVER rendered to the UI
// (Quinn's QA 2026-07-04 t_ff96d525 — same info-leak class as the
// therapist signup RLS bug). friendlyAuthError logs the raw error to
// console and returns a short user-facing string.
// ────────────────────────────────────────────────────────────────────

type ForgotState = null | 'sending' | 'sent'

export default function ParentLogin() {
  const navigate = useNavigate()
  const { refreshRole } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotState, setForgotState] = useState<ForgotState>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
      await refreshRole()
      navigate('/parent')
    } catch (err: unknown) {
      // Sanitize — never render the raw PostgREST / auth error to the UI.
      const friendly = friendlyAuthError(err, 'ParentLogin.submit')
      setError(friendly.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email address above first.')
      return
    }
    setError(null)
    setForgotState('sending')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/app/reset-password`,
    })
    if (resetError) {
      const friendly = friendlyAuthError(resetError, 'ParentLogin.forgotPassword')
      setError(friendly.message)
      setForgotState(null)
      return
    }
    setForgotState('sent')
  }

  return (
    <ScopeOfPracticeGate>
      <div className="min-h-dvh bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-brand-800 tracking-tight">
            ParentScript
          </h1>
          <p className="mt-1 text-sm text-gray-500">AMAZED Labs</p>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Parent sign in
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Free-tier parent account. 1 coaching interaction per day.
          </p>
        </div>

        {/* Card — centered, max-w adapts to iPad */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md md:max-w-lg">
          <div className="bg-white py-8 px-6 shadow sm:rounded-xl md:py-10 md:px-10">
            <OAuthButtons />
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-lg bg-red-50 border border-red-500 p-3 text-sm text-red-700 font-medium"
                >
                  {error}
                </div>
              )}

              {forgotState === 'sent' && (
                <div
                  role="status"
                  className="rounded-lg bg-green-50 border border-green-400 p-3 text-sm text-green-800"
                >
                  Check your email — a password reset link is on its way.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold py-3 md:py-4 rounded-lg transition disabled:opacity-60 min-h-tap text-base"
              >
                {loading ? 'Please wait…' : 'Sign in'}
              </button>

              {forgotState !== 'sent' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotState === 'sending'}
                  className="w-full text-sm text-brand-700 hover:underline disabled:opacity-60"
                >
                  {forgotState === 'sending' ? 'Sending…' : 'Forgot password?'}
                </button>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              No account?{' '}
              <Link
                to="/parent-signup"
                className="text-brand-700 font-medium hover:underline"
              >
                Sign up free
              </Link>
            </p>

            {/* Therapist cross-link — visible so a parent who arrived
                via the wrong door can find their way back. */}
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Therapist?{' '}
                <Link to="/login" className="text-brand-700 hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer links — public */}
        <div className="mt-8 text-center text-xs text-gray-500 space-x-4">
          <Link to="/pricing" className="hover:text-brand-700 hover:underline">
            Pricing
          </Link>
          <span aria-hidden="true">·</span>
          <Link to="/security" className="hover:text-brand-700 hover:underline">
            Security & HIPAA
          </Link>
          <span aria-hidden="true">·</span>
          <Link to="/privacy" className="hover:text-brand-700 hover:underline">
            Privacy policy
          </Link>
          <span aria-hidden="true">·</span>
          <a
            href="mailto:support@parentscript.app"
            className="hover:text-brand-700 hover:underline"
          >
            Contact support
          </a>
        </div>
      </div>
    </ScopeOfPracticeGate>
  )
}