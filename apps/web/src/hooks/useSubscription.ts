import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

// ────────────────────────────────────────────────────────────────
// useSubscription — Fetch therapist's subscription status
// ────────────────────────────────────────────────────────────────
//
// Returns the current subscription or null (free tier).
// Used by Billing component and for plan gating.

interface Subscription {
  id: string;
  therapist_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string;
  plan: 'solo' | 'pro' | 'clinic';
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  seats: number;
}

export function useSubscription() {
  const { therapist } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!therapist?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchSubscription() {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('therapist_id', therapist!.id)
        .in('status', ['trialing', 'active', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        setSubscription(data);
        setLoading(false);
      }
    }

    fetchSubscription();

    return () => {
      cancelled = true;
    };
  }, [therapist?.id]);

  return { subscription, loading };
}

// ────────────────────────────────────────────────────────────────
// Plan gating helpers
// ────────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<string, number> = {
  free: 0, // free tier cannot add clients (therapist must subscribe)
  solo: 25,
  pro: Infinity,
  clinic: Infinity,
};

export function getMaxClients(plan: string): number {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export function canAddClient(
  subscription: Subscription | null,
  currentClientCount: number
): boolean {
  const plan = subscription?.plan ?? 'free';
  const limit = getMaxClients(plan);
  // free tier: cannot add clients (therapist must be on a paid plan)
  if (plan === 'free') return false;
  return currentClientCount < limit;
}
