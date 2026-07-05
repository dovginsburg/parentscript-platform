-- =============================================
-- ParentScript — Self-serve parent signup + daily usage tracking
-- Migration 006: Free tier for parents without a therapist invite
-- =============================================
--
-- Design choices
-- ──────────────
-- 1. parents.client_id becomes NULLABLE. Self-serve parents have no
--    therapist-owned client record. Therapists invite their own
--    clients as before; client_id stays NOT NULL for invite flow.
--
-- 2. parents.is_self_serve BOOLEAN distinguishes the two flows. It
--    is required for downstream RLS (free-tier parents cannot read
--    client_skill_state or therapists' client roster) and for the
--    L1-L2-only / 1-interaction-per-day gating in the app.
--
-- 3. parent_daily_usage tracks one row per (parent, usage_date, kind).
--    "kind" is 'coaching' (In-the-Moment) or 'practice' (Practice Log)
--    so we can enforce the 1 coaching interaction/day limit and still
--    let free-tier parents practice-log without burning their daily.
--    The UNIQUE (parent_id, usage_date, kind) constraint + upsert
--    makes the counter idempotent.
--
-- 4. No PHI. The usage table only references auth.users and counts.
-- =============================================

-- =============================================
-- 1. parents: relax client_id, add is_self_serve
-- =============================================
ALTER TABLE parents ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS is_self_serve BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: existing rows are invite-based (client_id NOT NULL was
-- the previous invariant), so default FALSE is correct.
-- No UPDATE needed.

-- =============================================
-- 2. parent_daily_usage table
-- =============================================
CREATE TABLE parent_daily_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('coaching', 'practice')),
  count INT NOT NULL DEFAULT 1 CHECK (count >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_id, usage_date, kind)
);

CREATE INDEX idx_parent_daily_usage_parent_date
  ON parent_daily_usage(parent_id, usage_date);

-- =============================================
-- 3. updated_at trigger (reuses function from migration 004)
-- =============================================
CREATE TRIGGER parent_daily_usage_updated_at
  BEFORE UPDATE ON parent_daily_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 4. RLS
-- =============================================
ALTER TABLE parent_daily_usage ENABLE ROW LEVEL SECURITY;

-- Parents can read their own usage
CREATE POLICY "parent reads own daily usage"
  ON parent_daily_usage FOR SELECT
  USING (parent_id = auth.uid());

-- Parents can insert their own usage rows (used by the increment RPC
-- after each In-the-Moment interaction or practice log).
CREATE POLICY "parent inserts own daily usage"
  ON parent_daily_usage FOR INSERT
  WITH CHECK (parent_id = auth.uid());

-- Parents can update their own usage rows (the RPC does an UPSERT-style
-- increment, which requires UPDATE permission).
CREATE POLICY "parent updates own daily usage"
  ON parent_daily_usage FOR UPDATE
  USING (parent_id = auth.uid());

-- Service role can read all (for support / analytics)
CREATE POLICY "service role reads daily usage"
  ON parent_daily_usage FOR SELECT
  USING (auth.role() = 'service_role');

-- =============================================
-- 5. Atomic increment RPC
-- =============================================
-- Returns the new count for the (parent, date, kind) bucket AFTER
-- the increment. This is the single source of truth for the
-- 1-interaction/day free-tier limit.
CREATE OR REPLACE FUNCTION increment_parent_daily_usage(
  p_parent_id UUID,
  p_kind TEXT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (NOW() AT TIME ZONE 'UTC')::date;
  v_count INT;
BEGIN
  INSERT INTO parent_daily_usage (parent_id, usage_date, kind, count)
  VALUES (p_parent_id, v_today, p_kind, 1)
  ON CONFLICT (parent_id, usage_date, kind)
  DO UPDATE SET count = parent_daily_usage.count + 1
  RETURNING count INTO v_count;

  RETURN v_count;
END;
$$;

-- Lock down EXECUTE to authenticated parents only.
REVOKE ALL ON FUNCTION increment_parent_daily_usage(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_parent_daily_usage(UUID, TEXT) TO authenticated;