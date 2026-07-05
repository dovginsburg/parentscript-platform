import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { FREE_TIER_DAILY_COACHING_LIMIT, type UsageKind } from '@/lib/types';

// ────────────────────────────────────────────────────────────────────
// useDailyUsage — Free-tier daily interaction counter
// ────────────────────────────────────────────────────────────────────
//
// Fetches today's usage bucket for the current parent and exposes an
// `increment` helper that calls the SECURITY DEFINER RPC. Returns:
//
//   coachingCount     — number of In-the-Moment interactions today
//   practiceCount     — number of practice logs today
//   coachingLimit     — FREE_TIER_DAILY_COACHING_LIMIT (1)
//   coachingRemaining — max(0, limit - count)
//   canCoach          — coachingRemaining > 0
//   atCoachingLimit   — coachingRemaining === 0
//   loading           — true while the initial fetch is in flight
//   refresh()         — re-fetch today's counts
//   increment(kind)   — atomically bump the counter; returns new count
//
// Only the parent themselves (auth.uid() === parent.id) can read or
// increment — enforced both by RLS and by the RPC's GRANT.
// ────────────────────────────────────────────────────────────────────

interface UseDailyUsageResult {
  coachingCount: number;
  practiceCount: number;
  coachingLimit: number;
  coachingRemaining: number;
  canCoach: boolean;
  atCoachingLimit: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  increment: (kind: UsageKind) => Promise<number>;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function useDailyUsage(): UseDailyUsageResult {
  const { parent } = useAuth();
  const [coachingCount, setCoachingCount] = useState(0);
  const [practiceCount, setPracticeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!parent?.id) {
      setCoachingCount(0);
      setPracticeCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('parent_daily_usage')
      .select('kind, count')
      .eq('parent_id', parent.id)
      .eq('usage_date', todayUtc());

    if (error) {
      console.error('[useDailyUsage] fetch failed:', error);
      setLoading(false);
      return;
    }

    let c = 0;
    let p = 0;
    for (const row of data ?? []) {
      if (row.kind === 'coaching') c = row.count as number;
      else if (row.kind === 'practice') p = row.count as number;
    }
    setCoachingCount(c);
    setPracticeCount(p);
    setLoading(false);
  }, [parent?.id]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const increment = useCallback(
    async (kind: UsageKind): Promise<number> => {
      if (!parent?.id) throw new Error('Not signed in');
      const { data, error } = await supabase.rpc('increment_parent_daily_usage', {
        p_parent_id: parent.id,
        p_kind: kind,
      });
      if (error) {
        console.error('[useDailyUsage] increment failed:', error);
        throw error;
      }
      const newCount = Number(data ?? 0);
      if (kind === 'coaching') setCoachingCount(newCount);
      else setPracticeCount(newCount);
      return newCount;
    },
    [parent?.id]
  );

  const coachingLimit = FREE_TIER_DAILY_COACHING_LIMIT;
  const coachingRemaining = Math.max(0, coachingLimit - coachingCount);

  return {
    coachingCount,
    practiceCount,
    coachingLimit,
    coachingRemaining,
    canCoach: coachingRemaining > 0,
    atCoachingLimit: coachingRemaining === 0,
    loading,
    refresh: fetchCounts,
    increment,
  };
}
