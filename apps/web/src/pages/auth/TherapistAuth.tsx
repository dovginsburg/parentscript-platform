import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { friendlyAuthError } from '@/lib/authErrors'
import ScopeOfPracticeGate from '@/components/ScopeOfPracticeGate'
import OAuthButtons from '@/components/OAuthButtons'
import MagicLinkButton from '@/components/MagicLinkButton'

type Mode = 'login' | 'signup'
type ForgotState = null | 'sending' | 'sent'
type SignupStep = 'form' | 'checkEmail'

export default function TherapistAuth({ mode }: { mode: Mode }) {
  const navigate = useNavigate()
  const { refreshRole } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotState, setForgotState] = useState<ForgotState>(null)
  const [signupStep, setSignupStep] = useState<SignupStep>('form')
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.href.split('#')[0],
            data: { role: 'therapist', display_name: displayName || null },
          },
        })
        if (signUpError) throw signUpError
        if (!data.user) throw new Error('Signup failed — no user returned')

        if (data.session) {
          await refreshRole()
          navigate('/therapist/clients')
        } else {
          setSignedUpEmail(email)
          setSignupStep('checkEmail')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        await refreshRole()
        navigate('/therapist/clients')
      }
    } catch (err: unknown) {
      const friendly = friendlyAuthError(err, 'TherapistAuth.submit')
      setError(friendly.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email address above first.'); return }
    setError(null)
    setForgotState('sending')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/app/reset-password`,
    })
    if (resetError) {
      const friendly = friendlyAuthError(resetError, 'TherapistAuth.forgotPassword')
      setError(friendly.message)
      setForgotState(null)
      return
    }
    setForgotState('sent')
  }

  return (
    <ScopeOfPracticeGate>
    <div className="min-h-dvh bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-brand-800 tracking-tight">ParentScript</h1>
        <p className="mt-1 text-sm text-gray-500">AMAZED Labs</p>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">
          {mode === 'login'
            ? 'Therapist sign in'
            : signupStep === 'checkEmail'
              ? 'Check your email'
              : 'Create therapist account'}
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md md:max-w-lg">
        <div className="bg-white py-8 px-6 shadow sm:rounded-xl md:py-10 md:px-10">
          {mode === 'signup' && signupStep === 'checkEmail' ? (
            <div className="space-y-4 text-center" data-testid="signup-check-email">
              <p className="text-sm text-gray-700">
                We sent a confirmation link to{' '}
                <strong className="text-gray-900">{signedUpEmail}</strong>.
                Open it to finish setting up your therapist account — you'll land back here and we'll route you to your clients.
              </p>
              <p className="text-xs text-gray-500">
                Didn't get it? Check your spam folder, or{' '}
                <button
                  type="button"
                  className="text-brand-700 hover:underline font-medium"
                  onClick={() => { setSignupStep('form'); setSignedUpEmail(null); setError(null) }}
                >
                  start over
                </button>
                .
              </p>
            </div>
          ) : (
          <>
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
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display name (optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Dr. Smith"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
            )}

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
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            {mode === 'signup' && (
              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">or</span>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <MagicLinkButton email={email} />
            )}

            {mode === 'login' && forgotState !== 'sent' && (
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
          </>
          )}

          <p className="mt-6 text-center text-sm text-gray-600">
            {mode === 'login' ? (
              <>No account?{' '}
                <Link to="/signup" className="text-brand-700 font-medium hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>Already have an account?{' '}
                <Link to="/login" className="text-brand-700 font-medium hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>

          {mode === 'login' && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Parent without a therapist?{' '}
                <Link
                  to="/parent-signup"
                  className="text-brand-700 font-semibold hover:underline"
                >
                  Sign up free →
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

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
