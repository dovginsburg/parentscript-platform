import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import ScopeOfPracticeGate from '@/components/ScopeOfPracticeGate'

type Step = 'loading' | 'invalid' | 'signup' | 'confirm' | 'consent' | 'done'

export default function ParentOnboarding() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { refreshRole } = useAuth()

  const [step, setStep] = useState<Step>('loading')
  const [inviteId, setInviteId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!code) { setStep('invalid'); return }
    // Validate via server API — prevents public enumeration of invite codes
    fetch(`/api/invite/${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then((data: { valid: boolean; inviteId?: string; clientId?: string }) => {
        if (!data.valid || !data.inviteId || !data.clientId) {
          setStep('invalid')
          return
        }
        setInviteId(data.inviteId)
        setClientId(data.clientId)
        setStep(new URLSearchParams(window.location.search).get('confirmed') === '1' ? 'consent' : 'signup')
      })
      .catch(() => setStep('invalid'))
  }, [code])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.href.split('#')[0] },
      })
      if (signUpError) throw signUpError
      if (!data.user) throw new Error('Signup failed')
      setStep(data.session ? 'consent' : 'confirm')
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        (err instanceof Error ? err.message : null) ||
        String(err) ||
        'Signup failed'
      console.error('[ParentOnboarding] signup failed:', err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleConsent(e: React.FormEvent) {
    e.preventDefault()
    if (!consentChecked || !inviteId || !clientId) return
    setError(null)
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { error: parentError } = await supabase.from('parents').insert({
        id: user.id,
        client_id: clientId,
        email: user.email,
      })
      if (parentError) throw parentError

      const { error: consumeError } = await supabase
        .from('invites')
        .update({ consumed_at: new Date().toISOString() })
        .eq('id', inviteId)
      if (consumeError) throw consumeError

      await refreshRole()
      navigate('/parent')
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        (err instanceof Error ? err.message : null) ||
        String(err) ||
        'Something went wrong'
      console.error('[ParentOnboarding] consent failed:', err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-gray-500">Checking invite…</p>
      </div>
    )
  }

  if (step === 'invalid') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite not found</h1>
        <p className="text-gray-600">This link may be expired or already used. Ask your therapist for a new one.</p>
      </div>
    )
  }

  return (
    <ScopeOfPracticeGate>
    <div className="min-h-dvh bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md md:max-w-lg mx-auto w-full">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-brand-800 tracking-tight">ParentScript</h1>
          <p className="mt-2 text-gray-600">Your therapist has invited you to join ParentScript.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow p-8 md:p-10">
          {step === 'signup' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Create your account</h2>
              <p className="text-sm text-gray-500 mb-6">You'll use this to access your parenting skills.</p>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
                  <div className="rounded-lg bg-danger-50 border border-danger-500 p-3 text-sm text-danger-700">
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
            </>
          )}

          {step === 'confirm' && (
            <div className="text-center space-y-3">
              <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
              <p className="text-sm text-gray-600">
                We sent a confirmation link to {email}. Open it to finish setup and continue to consent.
              </p>
            </div>
          )}

          {step === 'consent' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">A few things to know</h2>
              <div className="space-y-3 text-sm text-gray-700 mb-6">
                <p>✓ <strong>No real names stored.</strong> This app uses a non-identifying label for your case — your name is never saved here.</p>
                <p>✓ <strong>No clinical notes.</strong> Your therapist uses structured check-ins only — no free-text records about you or your child.</p>
                <p>✓ <strong>This app does not handle emergencies.</strong> For any situation involving danger, call 911. For mental health crisis support, call or text 988.</p>
                <p>✓ <strong>Skill content is for general guidance only</strong> and has not been individualized for your child. Always follow your therapist's specific recommendations.</p>
              </div>
              <form onSubmit={handleConsent} className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer min-h-tap">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={e => setConsentChecked(e.target.checked)}
                    className="mt-1 h-5 w-5 text-brand-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I understand and agree to use ParentScript as a supplement to — not a replacement for — professional therapy.
                  </span>
                </label>
                {error && (
                  <div className="rounded-lg bg-danger-50 border border-danger-500 p-3 text-sm text-danger-700">
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
            </>
          )}
        </div>
      </div>
    </div>
    </ScopeOfPracticeGate>
  )
}
