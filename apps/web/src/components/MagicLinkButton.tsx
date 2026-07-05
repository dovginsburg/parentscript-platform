import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { friendlyAuthError } from '@/lib/authErrors'

// ────────────────────────────────────────────────────────────────────
// MagicLinkButton — "Email me a sign-in link"
// ────────────────────────────────────────────────────────────────────
//
// Calls supabase.auth.signInWithOtp with the parent form's email.
// Supabase sends a one-time link to the inbox; clicking it creates a
// session and lands the user on /auth/callback where AuthCallback.tsx
// routes them to /therapist/clients or /parent.
//
// Notes:
// - Same Supabase dashboard requirement as OAuth: the "Email" provider
//   must be enabled (Dov's gating step). Until then signInWithOtp will
//   return a 4xx that friendlyAuthError surfaces as a generic message.
// - For sign-up flows, signInWithOtp on an existing-but-unconfirmed
//   address is the recommended way to nudge the user toward confirming.
//   For fresh sign-up, the regular signUp() flow already emails a
//   confirmation — so on signup pages we use signInWithOtp as a
//   "resend confirmation" alternative.
// - emailRedirectTo uses the bare /auth/callback so the Vercel SPA
//   rewrite (vercel.json) routes it through React Router regardless of
//   the /app/ basename.
// - Raw PostgREST / Supabase errors are NEVER rendered to the UI
//   (Quinn's QA 2026-07-04 t_ff96d525 — same info-leak class as the
//   therapist signup RLS bug). friendlyAuthError logs the raw error
//   to console and returns a short user-facing string.
// ────────────────────────────────────────────────────────────────────

export interface MagicLinkButtonProps {
  email: string
  /** Label override (defaults to "Email me a sign-in link"). */
  label?: string
  /** Where to redirect after the OTP round-trip. */
  redirectTo?: string
  /** Extra classes to merge onto the button. */
  className?: string
  /** Called after the user is told to check email. */
  onSent?: () => void
}

export default function MagicLinkButton({
  email,
  label = 'Email me a sign-in link',
  redirectTo,
  className = '',
  onSent,
}: MagicLinkButtonProps) {
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callbackUrl = redirectTo ?? `${window.location.origin}/auth/callback`

  async function handleClick() {
    if (!email) {
      setError('Enter your email address above first.')
      return
    }
    setError(null)
    setSent(false)
    setPending(true)
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl },
      })
      if (otpError) throw otpError
      setSent(true)
      onSent?.()
    } catch (err: unknown) {
      // Sanitize — never render the raw PostgREST / auth error to the UI.
      const friendly = friendlyAuthError(err, 'MagicLinkButton.otp')
      setError(friendly.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={
          'w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-800 font-semibold py-3 md:py-3.5 rounded-lg transition disabled:opacity-60 min-h-tap text-base ' +
          className
        }
        aria-label={label}
      >
        {/* Envelope icon — universal "email me" cue */}
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 shrink-0 text-gray-700"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
        <span>{pending ? 'Sending link…' : label}</span>
      </button>
      {sent && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg bg-green-50 border border-green-400 p-3 text-sm text-green-800"
        >
          Check <strong>{email}</strong> — a sign-in link is on its way.
        </div>
      )}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg bg-red-50 border border-red-500 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
    </div>
  )
}