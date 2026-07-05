import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSubscription } from '@/hooks/useSubscription'

// ──────────────────────────────────────────────────────────────────────
// Billing — Subscription management card for therapists
// ──────────────────────────────────────────────────────────────────────
//
// Mark's design system v1.0:
//   - ps-card shell with eyebrow label
//   - Status pills use the warm/success/info palette
//   - Calm factual tone, no marketing language
//
// Shows current plan, status, and next billing date.
// "Manage Billing" button opens Stripe Billing Portal.

export default function Billing() {
  const { subscription, loading } = useSubscription()
  const [portalLoading, setPortalLoading] = useState(false)

  async function openPortal() {
    if (!subscription?.stripe_customer_id) return

    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripe_customer_id: subscription.stripe_customer_id,
        }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to open billing portal.')
      }
    } catch (err) {
      alert('Network error. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="ps-card animate-pulse space-y-4">
        <div className="h-4 bg-ps-bg-soft rounded w-1/4" />
        <div className="h-4 bg-ps-bg-soft rounded w-1/2" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="ps-card">
        <span className="ps-eyebrow">Billing</span>
        <h3 className="text-lg font-semibold text-ps-text mt-2 mb-2">No active subscription</h3>
        <p className="text-sm text-ps-text-soft mb-4">
          You're on the free tier. Upgrade to unlock more clients and features.
        </p>
        <Link to="/pricing" className="ps-btn ps-btn-primary ps-btn-sm">
          View plans
        </Link>
      </div>
    )
  }

  // Mark's pill taxonomy for status.
  const statusPillTone: Record<string, 'success' | 'info' | 'warm' | 'danger' | 'neutral'> = {
    active: 'success',
    trialing: 'info',
    past_due: 'warm',
    canceled: 'danger',
    unpaid: 'danger',
  }

  const planNames: Record<string, string> = {
    solo: 'Solo',
    pro: 'Pro',
    clinic: 'Clinic',
    free: 'Free',
  }

  const planDescription: Record<string, string> = {
    solo: '1 therapist, up to 25 parents',
    pro: '1 therapist, unlimited parents',
    clinic: 'Multiple therapists, unlimited parents',
    free: 'Self-guided, 1 interaction/day',
  }

  const statusTone = statusPillTone[subscription.status] ?? 'neutral'

  return (
    <div className="ps-card">
      <span className="ps-eyebrow">Billing</span>
      <h3 className="text-lg font-semibold text-ps-text mt-2 mb-4">Subscription</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ps-text-soft">Plan</span>
          <span className="text-sm font-semibold text-ps-text">
            {planNames[subscription.plan] || subscription.plan}
          </span>
        </div>

        <div className="text-xs text-ps-text-softer text-right -mt-2">
          {planDescription[subscription.plan] || ''}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-ps-text-soft">Status</span>
          <span className={`ps-pill ps-pill-${statusTone}`}>
            <span className="dot" />
            {subscription.status}
          </span>
        </div>

        {subscription.current_period_end && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-ps-text-soft">Next billing</span>
            <span className="text-sm font-semibold text-ps-text">
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </span>
          </div>
        )}

        {subscription.plan === 'clinic' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-ps-text-soft">Seats</span>
            <span className="text-sm font-semibold text-ps-text">
              {subscription.seats}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-ps-border">
        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="w-full ps-btn ps-btn-secondary disabled:opacity-50"
        >
          {portalLoading ? 'Loading…' : 'Manage billing'}
        </button>
        <p className="text-xs text-ps-muted mt-2 text-center">
          Update payment method, view invoices, cancel subscription
        </p>
      </div>
    </div>
  )
}