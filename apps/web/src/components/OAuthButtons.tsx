import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/* ============================================================
   OAuthButtons — Apple / Google / Email
   ============================================================
   Polished against Mark's design tokens (button.variants.oauth*).
   - Apple: black button with white Apple logo
   - Google: white button with Google logo
   - Email: ghost button (transparent, secondary text)
   - Hover: subtle lift + token-aligned color shift
   - Focus: 3px token-aligned focus ring (a11y)
   - Disabled: 60% opacity while pending
   - Min height: 44px (WCAG 2.5.5 target size)

   Token-aligned colors (from packages/design/tokens.json):
     oauthApple:  bg #000000, fg #FFFFFF, hover #1F1F23
     oauthGoogle: bg #FFFFFF, fg #1F1F23, hover #F9FAFB, border #D1D5DB
     oauthEmail:  bg transparent, fg #4B5563, hover text, border #D1D5DB

   Used on the auth pages alongside the email+password form.
   Calls supabase.auth.signInWithOAuth for Apple/Google. For
   email, this just emits an `onEmailClick` callback (the parent
   reveals the email+password form).

   Provider enablement happens in the Supabase dashboard — see
   the original component's header comment for the redirectTo /
   callback URL contract.
   ============================================================ */

type Provider = 'google' | 'apple' | 'email'

interface OAuthButtonsProps {
  /** Where to send users after the OAuth round-trip. */
  redirectTo?: string
  /** Layout — stack (default) or side-by-side. */
  layout?: 'stack' | 'row'
  /** Custom labels for the OAuth buttons. */
  googleLabel?: string
  appleLabel?: string
  emailLabel?: string
  /** Called when the user picks the email (ghost) option. */
  onEmailClick?: () => void
}

const GOOGLE_SVG = (
  <svg viewBox="0 0 24 24" className="oauth-icon" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.36-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.45 14.97.5 12 .5 7.7.5 3.99 3.11 2.18 7.07l3.66 2.83C6.71 6.66 9.14 4.75 12 4.75z"
    />
  </svg>
)

const APPLE_SVG = (
  <svg viewBox="0 0 24 24" className="oauth-icon" aria-hidden="true">
    <path
      fill="currentColor"
      d="M16.365 1.43c0 1.14-.434 2.21-1.224 3.005-.857.862-1.965 1.43-3.072 1.36-.143-1.116.43-2.27 1.193-2.998.847-.81 2.012-1.36 3.103-1.367zM20.5 17.18c-.42.97-.62 1.4-1.16 2.26-.75 1.2-1.81 2.7-3.12 2.71-1.17.01-1.47-.76-3.06-.75-1.59.01-1.92.77-3.09.76-1.31-.01-2.32-1.37-3.07-2.57-2.1-3.35-2.32-7.29-1.02-9.39.92-1.49 2.37-2.36 3.74-2.36 1.39 0 2.27.77 3.42.77 1.12 0 1.8-.77 3.41-.77 1.22 0 2.51.67 3.43 1.82-3.02 1.65-2.53 5.97.46 7.52z"
    />
  </svg>
)

const MAIL_SVG = (
  <svg viewBox="0 0 24 24" className="oauth-icon" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 7 9-7" />
  </svg>
)

export default function OAuthButtons({
  redirectTo,
  layout = 'stack',
  googleLabel = 'Continue with Google',
  appleLabel = 'Continue with Apple',
  emailLabel = 'Continue with email',
  onEmailClick,
}: OAuthButtonsProps) {
  const [pending, setPending] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Build callback URL. window.location.origin returns the bare origin
  // (no basename), so we append /auth/callback explicitly. The Vercel
  // rewrite rule in vercel.json routes /app/auth/callback → /index.html
  // and the React Router matches /auth/callback (basename-stripped).
  const callbackUrl = redirectTo ?? `${window.location.origin}/auth/callback`

  async function handleOAuth(provider: 'google' | 'apple') {
    setError(null)
    setPending(provider)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl },
      })
      if (oauthError) throw oauthError
      // Supabase will redirect the browser — no further work here.
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        (err instanceof Error ? err.message : null) ||
        String(err) ||
        'Could not start sign-in'
      console.error(`[OAuthButtons] ${provider} signInWithOAuth failed:`, err)
      setError(msg)
      setPending(null)
    }
  }

  function handleEmail() {
    setError(null)
    setPending('email')
    try {
      onEmailClick?.()
    } finally {
      // The parent typically reveals the email form synchronously.
      // We clear "pending" so the buttons don't stay disabled.
      setPending(null)
    }
  }

  const containerCls =
    layout === 'row' ? 'oauth-grid oauth-grid-row' : 'oauth-stack'

  return (
    <div className="oauth-buttons">
      <div className={containerCls}>
        {/* ── Apple — black button with Apple logo ─────────── */}
        <button
          type="button"
          onClick={() => handleOAuth('apple')}
          disabled={pending !== null}
          className="oauth-btn oauth-btn-apple"
          aria-label={appleLabel}
        >
          {APPLE_SVG}
          <span>{pending === 'apple' ? 'Opening Apple…' : appleLabel}</span>
        </button>

        {/* ── Google — white button with Google logo ───────── */}
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={pending !== null}
          className="oauth-btn oauth-btn-google"
          aria-label={googleLabel}
        >
          {GOOGLE_SVG}
          <span>{pending === 'google' ? 'Opening Google…' : googleLabel}</span>
        </button>

        {/* ── Email — ghost button ─────────────────────────── */}
        <button
          type="button"
          onClick={handleEmail}
          disabled={pending !== null}
          className="oauth-btn oauth-btn-email"
          aria-label={emailLabel}
        >
          {MAIL_SVG}
          <span>{emailLabel}</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="oauth-error">
          {error}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Companion CSS — drop into apps/web/src/styles/design-system-components.css
   Token-aligned to packages/design/tokens.json.
   ============================================================ */

export const OAUTH_BUTTONS_CSS = `
.oauth-buttons { display: flex; flex-direction: column; gap: 12px; }

.oauth-stack { display: flex; flex-direction: column; gap: 10px; }
.oauth-grid { display: grid; gap: 10px; }
.oauth-grid-row { grid-template-columns: 1fr; }
@media (min-width: 480px) { .oauth-grid-row { grid-template-columns: 1fr 1fr; } }

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 12px 18px;
  border-radius: 12px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.005em;
  cursor: pointer;
  transition:
    background-color 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  border: 1px solid transparent;
}
.oauth-btn:disabled { opacity: 0.60; cursor: not-allowed; }
.oauth-btn:active:not(:disabled) { transform: translateY(1px); }
.oauth-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
}

.oauth-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.oauth-btn-apple {
  background: #000000;
  color: #FFFFFF;
  border-color: #000000;
}
.oauth-btn-apple:hover:not(:disabled) {
  background: #1F1F23;
  border-color: #1F1F23;
  box-shadow: 0 4px 12px rgba(0,0,0,0.20);
}

.oauth-btn-google {
  background: #FFFFFF;
  color: #1F1F23;
  border-color: #D1D5DB;
}
.oauth-btn-google:hover:not(:disabled) {
  background: #F9FAFB;
  border-color: #9CA3AF;
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.06);
}

.oauth-btn-email {
  background: transparent;
  color: #4B5563;
  border-color: #D1D5DB;
}
.oauth-btn-email:hover:not(:disabled) {
  background: #FAFBFC;
  color: #111827;
  border-color: #9CA3AF;
}

.oauth-error {
  border-radius: 12px;
  background: #FEE2E2;
  border: 1px solid #DC2626;
  padding: 12px 14px;
  font-size: 14px;
  color: #7F1D1D;
  line-height: 1.4;
}

@media (forced-colors: active) {
  .oauth-btn { border: 1px solid ButtonText; }
  .oauth-btn:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
    box-shadow: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .oauth-btn { transition: none; }
  .oauth-btn:active:not(:disabled) { transform: none; }
}
`.trim()