import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { friendlyAuthError } from '@/lib/authErrors'
import ScopeOfPracticeGate from '@/components/ScopeOfPracticeGate'
import OAuthButtons from '@/components/OAuthButtons'
import MagicLinkButton from '@/components/MagicLinkButton'

// ────────────────────────────────────────────────────────────────────
// ParentSignup — Free-tier self-serve parent signup
// ────────────────────────────────────────────────────────────────────
//
// Two-step flow (mirrored from ParentSignup on 2026-07-04 in service of
// the P0 fix t_ff96d525 — therapist signup was leaking the raw RLS
// error when email_confirm was required):
//
//   1. signup   — email + password (no invite code required)
//   2. confirm  — show "check your email"; on click of the confirmation
//                 link useAuth sets the session and ?confirmed=1 brings
//                 us back here
//   3. consent  — privacy/safety disclosures; on submit we call the
//                 auth.users trigger to ensure the parents row exists.
//                 If the trigger hasn't run yet (e.g. migration 010 not
//                 deployed), we still attempt the insert here as a
//                 fallback so the flow degrades gracefully.
//
// On success, navigates to /parent. The useAuth hook picks up the new
// parent row on its next role fetch.
// ────────────────────────────────────────────────────────────────────

type Step = 'signup' | 'confirm' | 'consent'

export default function ParentSignup() {
  const navigate = useNavigate()
  const { refreshRole } = useAuth()

  const [step, setStep] = useState<Step>(
    new URLSearchParams(window.location.search).get('confirmed') === '1' ? 'consent' : 'signup'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.href.split('#')[0],
          // Tell the auth.users trigger (migration 010) to auto-create
          // the parents row with is_self_serve = TRUE and client_id NULL.
          data: { role: 'parent' },
        },
      })
      if (signUpError) throw signUpError
      if (!data.user) throw new Error('Signup failed — no user returned')
      setStep(data.session ? 'consent' : 'confirm')
    } catch (err: unknown) {
      const friendly = friendlyAuthError(err, 'ParentSignup.signup')
      setError(friendly.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConsent(e: React.FormEvent) {
    e.preventDefault()
    if (!consentChecked) return
    setError(null)
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please confirm your email first — check your inbox for the link.')

      // Migration 010 already created the parents row (is_self_serve=TRUE,
      // client_id=NULL) when signUp ran. We do an UPSERT here so the flow
      // works whether or not the trigger is deployed — the unique PK on
      // parents.id guarantees idempotency.
      const { error: upsertError } = await supabase.from('parents').upsert({
        id: user.id,
        client_id: null,
        email: user.email ?? email,
        is_self_serve: true,
      }, { onConflict: 'id', ignoreDuplicates: true })
      if (upsertError) throw upsertError

      await refreshRole()
      navigate('/parent')
    } catch (err: unknown) {
      const friendly = friendlyAuthError(err, 'ParentSignup.consent')
      setError(friendly.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScopeOfPracticeGate>
    <div className="min-h-dvh bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-brand-800 tracking-tight">ParentScript</h1>
        <p className="mt-1 text-sm text-gray-500">AMAZED Labs</p>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">
          {step === 'signup'
            ? 'Create a free parent account'
            : step === 'confirm'
              ? 'Check your email'
              : 'A few things to know'}
        </h2>
        {step === 'signup' && (
          <p className="mt-2 text-sm text-gray-600">
            No therapist required. 1 free coaching interaction a day.
          </p>
        )}
      </div>

      {/* Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md md:max-w-lg">
        <div className="bg-white py-8 px-6 shadow sm:rounded-xl md:py-10 md:px-10">
          {step === 'signup' && (
            <div className="space-y-5">
              {/* OAuth first — same callback as the therapist flow. New
                  parents via Google/Apple still need to complete the
                  consent step on the next render (we read step from
                  URLSearchParams in initialize; existing users land
                  here with confirmed=1 set by the callback handler
                  after role lookup). */}
              <OAuthButtons />
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">or sign up with email</span>
                </div>
              </div>
              <form onSubmit={handleSignup} className="space-y-5">
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
                  Password (8+ characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold py-3 md:py-4 rounded-lg transition disabled:opacity-60 min-h-tap text-base"
              >
                {loading ? 'Creating account…' : 'Continue'}
              </button>
              </form>

              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">or</span>
                </div>
              </div>

              <MagicLinkButton email={email} />
            </div>
          )}

          {step === 'confirm' && (
            <div className="text-center space-y-3" data-testid="parent-signup-check-email">
              <p className="text-sm text-gray-600">
                We sent a confirmation link to {email}. Open it to finish setup and continue to consent.
              </p>
              <p className="text-xs text-gray-500">
                Didn't get it? Check your spam folder.
              </p>
            </div>
          )}

          {step === 'consent' && (
            <form onSubmit={handleConsent} className="space-y-4">
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  ✓ <strong>Free tier.</strong> 1 In-the-Moment coaching interaction per
                  day, plus access to L1–L2 skills (Connection & Shaping Behavior).
                </p>
                <p>
                  ✓ <strong>No real names stored.</strong> Your email is your login only —
                  it&apos;s never tied to a child&apos;s name or your own.
                </p>
                <p>
                  ✓ <strong>No clinical notes.</strong> We don&apos;t keep free-text notes
                  about you or your child.
                </p>
                <p>
                  ✓ <strong>This app does not handle emergencies.</strong> For any
                  situation involving danger, call 911. For mental health crisis support,
                  call or text 988.
                </p>
                <p>
                  ✓ <strong>Skill content is general guidance.</strong> It has not been
                  individualized for your child. Connect with a ParentScript therapist to
                  unlock L3–L5 skills and a tailored plan.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer min-h-tap pt-2">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={e => setConsentChecked(e.target.checked)}
                  className="mt-1 h-5 w-5 text-brand-600 rounded"
                />
                <span className="text-sm text-gray-700">
                  I understand and agree to use ParentScript as a supplement to — not a
                  replacement for — professional support.
                </span>
              </label>

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-lg bg-red-50 border border-red-500 p-3 text-sm text-red-700 font-medium"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!consentChecked || loading}
                className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold py-3 md:py-4 rounded-lg transition disabled:opacity-60 min-h-tap text-base"
              >
                {loading ? 'Setting up…' : 'Get started'}
              </button>
            </form>
          )}
        </div>

        {/* Cross-links — sign in / therapist invite */}
        {step === 'signup' && (
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-700 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        )}
        {step === 'signup' && (
          <p className="mt-2 text-center text-xs text-gray-500">
            Have an invite from your therapist? Use the link they sent you.{' '}
            <Link to="/login" className="text-brand-700 hover:underline">
              Therapist sign in
            </Link>
          </p>
        )}
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
        <a href="mailto:support@parentscript.app" className="hover:text-brand-700 hover:underline">
          Contact support
        </a>
      </div>
    </div>
    </ScopeOfPracticeGate>
  )
}