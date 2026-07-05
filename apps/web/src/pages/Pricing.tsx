import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import MarkHeader from '@/components/MarkHeader'
import MarkFooter from '@/components/MarkFooter'

// ──────────────────────────────────────────────────────────────────────
// Pricing — Plan selection page for therapists and parents
// ──────────────────────────────────────────────────────────────────────
//
// Mark's design system v1.0:
//   - Free tier as an indigo "featured" panel at the top
//   - Three therapist plans in ps-card grid (popular plan gets
//     accent border + "Most popular" pill)
//   - Comparison table with eyebrow header
//   - Calm clinical voice in copy ("for clinicians", not "unlock your practice")
//
// Clicking "Subscribe" on a paid tier creates a Stripe Checkout session
// and redirects to Stripe-hosted payment page.

const PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    price: 19,
    interval: 'mo',
    seat: false,
    audience: 'Therapist',
    description: 'For an individual therapist just getting started.',
    features: [
      '1 therapist account',
      'Up to 25 parents enrolled',
      '30 evidence-based skills',
      'In-the-moment coaching',
      'Practice logging',
      'Session prep reports',
      'Email support',
    ],
    cta: 'Start Solo',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39,
    interval: 'mo',
    seat: false,
    audience: 'Therapist',
    description: 'For the established therapist with a full caseload.',
    features: [
      '1 therapist account',
      'Unlimited parents enrolled',
      '30 evidence-based skills',
      'In-the-moment coaching',
      'Practice logging',
      'Session prep reports',
      'Priority support',
    ],
    cta: 'Go Pro',
    popular: true,
  },
  {
    id: 'clinic',
    name: 'Clinic',
    price: 29,
    interval: 'seat/mo',
    seat: true,
    audience: 'Clinic',
    description: 'For group practices with multiple therapists.',
    features: [
      'Multiple therapist accounts',
      'Unlimited parents enrolled',
      'Shared client roster',
      'Admin & team management',
      '30 evidence-based skills',
      'In-the-moment coaching',
      'Practice logging',
      'Session prep reports',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

const FREE_PLAN = {
  name: 'Free',
  price: 0,
  description: 'For parents who want a taste without a therapist.',
  features: [
    'No account required',
    '1 coaching interaction per day',
    'L1-L2 skills (connection & shaping behavior)',
    'In-the-moment coaching',
    'Self-guided practice logging',
    'Connect with a therapist to unlock L3-L5',
  ],
  cta: 'Try it free',
  href: '/parent-signup',
}

function formatPrice(plan: typeof PLANS[number]): string {
  return `$${plan.price}/${plan.interval}`
}

const COMPARISON_ROWS: { feature: string; values: Record<string, string | boolean> }[] = [
  { feature: 'Price', values: { free: 'Free', solo: formatPrice(PLANS[0]), pro: formatPrice(PLANS[1]), clinic: formatPrice(PLANS[2]) } },
  { feature: 'Parents enrolled', values: { free: 'Self-serve', solo: 'Up to 25', pro: 'Unlimited', clinic: 'Unlimited' } },
  { feature: 'Therapist accounts', values: { free: '—', solo: '1', pro: '1', clinic: 'Multiple' } },
  { feature: 'Evidence-based skills library', values: { free: 'L1-L2 only', solo: 'L1-L5', pro: 'L1-L5', clinic: 'L1-L5' } },
  { feature: 'In-the-moment coaching', values: { free: '1/day', solo: 'Unlimited', pro: 'Unlimited', clinic: 'Unlimited' } },
  { feature: 'Practice logging', values: { free: true, solo: true, pro: true, clinic: true } },
  { feature: 'Session prep reports', values: { free: false, solo: true, pro: true, clinic: true } },
  { feature: 'Shared client roster', values: { free: false, solo: false, pro: false, clinic: true } },
  { feature: 'Admin & team management', values: { free: false, solo: false, pro: false, clinic: true } },
  { feature: 'Email support', values: { free: false, solo: true, pro: true, clinic: true } },
  { feature: 'Priority support', values: { free: false, solo: false, pro: true, clinic: false } },
  { feature: 'Dedicated support', values: { free: false, solo: false, pro: false, clinic: true } },
]

const TIER_ORDER = ['free', 'solo', 'pro', 'clinic'] as const

export default function Pricing() {
  const { therapist } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe(planId: string) {
    setError(null)

    // Auth gating: unauthenticated visitors land on /signup where they can
    // create a therapist account. We route with ?plan= so the next /signup
    // iteration can pre-select the tier; the redirect is explicit-not-silent
    // so the click feels responsive (vs. the old "do nothing" perception).
    if (!therapist?.id) {
      window.location.href = `/signup?plan=${planId}`
      return
    }

    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          therapist_id: therapist.id,
          seats: planId === 'clinic' ? 1 : undefined,
        }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }

      // Map the most common server errors to friendly copy. 503 = "Stripe
      // not configured" -- the deploy-state failure mode where Vercel is
      // missing STRIPE_SECRET_KEY (verified via `vercel env ls`). Surface a
      // real inline message instead of alert() so the QA "do nothing"
      // symptom becomes impossible to miss.
      if (res.status === 503) {
        setError(
          'Subscriptions are temporarily unavailable. Please email ' +
            'support@parentscript.app and we will get you set up.',
        )
      } else if (res.status === 401 || res.status === 403) {
        setError('Your session expired. Please sign in again.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      } else {
        setError(data.error || 'Failed to create checkout session.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-dvh bg-ps-bg-soft flex flex-col">
      <MarkHeader product="parentscript" />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="ps-eyebrow">Pricing</span>
            <h2 className="text-3xl md:text-[36px] font-bold text-ps-text mt-2 mb-4 tracking-tight">
              Pricing built for clinicians.
            </h2>
            <p className="text-lg text-ps-text-soft max-w-2xl mx-auto leading-relaxed">
              Parents get started free. Therapists choose the plan that fits
              their caseload — Solo, Pro, or Clinic. All paid plans include a
              14-day free trial with no credit card required.
            </p>
          </div>

          {/* Free tier — parents (featured panel) */}
          <div className="ps-card bg-ps-accent-softer border-ps-accent-soft mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="ps-pill ps-pill-accent">For parents</span>
                <span className="ps-eyebrow">{FREE_PLAN.name}</span>
              </div>
              <h3 className="text-2xl font-bold text-ps-text mb-2">{FREE_PLAN.description}</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-ps-text-soft">
                {FREE_PLAN.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-ps-success mt-0.5 shrink-0" aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:text-right shrink-0">
              <div className="mb-3">
                <span className="text-4xl font-bold text-ps-text">$0</span>
                <span className="text-ps-text-softer">/forever</span>
              </div>
              <Link to={FREE_PLAN.href} className="ps-btn ps-btn-primary ps-btn-lg">
                {FREE_PLAN.cta}
              </Link>
            </div>
          </div>

          {/* Therapist plan cards */}
          <div className="mb-5 flex items-center gap-3">
            <span className="ps-eyebrow">For therapists</span>
            <span className="text-sm text-ps-text-softer">— cancel anytime, 14-day free trial on all paid plans</span>
          </div>

          {/* Inline error banner — replaces the silent alert() that made the
              QA report's "click does nothing" symptom possible. aria-live
              so screen readers announce it as soon as it appears. */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 ps-card border-ps-danger bg-ps-danger-softer text-ps-text"
            >
              <div className="flex items-start gap-3">
                <span
                  className="text-ps-danger mt-0.5 shrink-0"
                  aria-hidden="true"
                >
                  !
                </span>
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-ps-danger mb-1">
                    We could not start your subscription.
                  </p>
                  <p className="text-ps-text-soft">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-ps-text-softer hover:text-ps-text text-sm shrink-0"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-5 mb-14">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative ps-card flex flex-col ${
                  plan.popular ? 'border-ps-accent border-2 shadow-md' : ''
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 ps-pill ps-pill-accent">
                    Most popular
                  </span>
                )}

                <div className="mb-5">
                  <span className="ps-eyebrow">{plan.audience}</span>
                  <h4 className="text-xl font-semibold text-ps-text mt-1">{plan.name}</h4>
                  <p className="text-sm text-ps-text-softer mt-1">{plan.description}</p>
                </div>

                <div className="mb-5">
                  <span className="text-4xl font-bold text-ps-text">${plan.price}</span>
                  <span className="text-ps-text-softer">/{plan.interval}</span>
                </div>

                <ul className="space-y-3 mb-7 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ps-text-soft">
                      <span className="text-ps-success mt-0.5 shrink-0" aria-hidden="true">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.id === 'clinic' ? (
                  <a
                    href="mailto:sales@parentscript.app?subject=Clinic%20plan%20inquiry"
                    className="ps-btn ps-btn-secondary"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                    className={`ps-btn ${plan.popular ? 'ps-btn-primary' : 'ps-btn-secondary'} disabled:opacity-50`}
                  >
                    {loading === plan.id ? 'Redirecting…' : plan.cta}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Feature comparison table */}
          <div className="mb-14">
            <div className="text-center mb-6">
              <span className="ps-eyebrow">Compare features</span>
              <h3 className="text-2xl md:text-[28px] font-bold text-ps-text mt-2 tracking-tight">
                What's in each plan.
              </h3>
              <p className="text-ps-text-soft text-sm mt-2">
                Every paid plan includes a 14-day free trial. No credit card required.
              </p>
            </div>

            <div className="ps-card !p-0 overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-ps-bg-soft text-left">
                    <th className="px-4 py-3 font-semibold text-ps-text-soft border-b border-ps-border">Feature</th>
                    {TIER_ORDER.map((tier) => (
                      <th
                        key={tier}
                        className={`px-4 py-3 font-semibold border-b border-ps-border text-center ${
                          tier === 'pro' ? 'text-ps-accent' : 'text-ps-text-soft'
                        }`}
                      >
                        {tier === 'free' ? 'Free' : tier === 'solo' ? 'Solo' : tier === 'pro' ? 'Pro ★' : 'Clinic'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.feature} className="border-b border-ps-border">
                      <td className="px-4 py-3 text-ps-text-soft">{row.feature}</td>
                      {TIER_ORDER.map((tier) => {
                        const value = row.values[tier]
                        return (
                          <td key={tier} className="px-4 py-3 text-center">
                            {typeof value === 'boolean' ? (
                              value ? (
                                <span className="text-ps-success font-bold" aria-label="included">✓</span>
                              ) : (
                                <span className="text-ps-muted" aria-label="not included">—</span>
                              )
                            ) : (
                              <span className="text-ps-text">{value}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  {/* CTA row */}
                  <tr className="border-b border-ps-border">
                    <td className="px-4 py-4 text-ps-text-soft font-semibold">Get started</td>
                    <td className="px-4 py-4 text-center">
                      <Link to="/signup?role=parent" className="ps-link text-xs font-semibold">
                        Start free →
                      </Link>
                    </td>
                    {TIER_ORDER.slice(1).map((tier) => (
                      <td key={tier} className="px-4 py-4 text-center">
                        {tier === 'clinic' ? (
                          <a href="mailto:sales@parentscript.app" className="ps-link text-xs font-semibold">
                            Contact sales →
                          </a>
                        ) : (
                          <Link to={`/signup?plan=${tier}`} className="ps-link text-xs font-semibold">
                            Start trial →
                          </Link>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Final CTA */}
          <div className="ps-card bg-ps-accent-soft border-ps-accent text-center">
            <h3 className="text-2xl md:text-[28px] font-bold text-ps-accent-ink mb-2 tracking-tight">
              Start your 14-day free trial.
            </h3>
            <p className="text-ps-text-soft mb-6">
              Full access to Pro features. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup" className="ps-btn ps-btn-primary ps-btn-lg">
                Create therapist account
              </Link>
              <Link to="/security" className="ps-btn ps-btn-ghost ps-btn-lg text-ps-accent-ink">
                Read security & HIPAA details →
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12 text-center text-sm text-ps-text-softer">
            <p>All plans include a 14-day free trial. Cancel anytime.</p>
            <p className="mt-2">
              Questions? Email{' '}
              <a href="mailto:support@parentscript.app" className="ps-link">
                support@parentscript.app
              </a>
            </p>
          </div>
        </div>
      </main>

      <MarkFooter product="parentscript" />
    </div>
  )
}