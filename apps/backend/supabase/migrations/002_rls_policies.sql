-- =============================================
-- Row-Level Security Policies
-- From BUILD_PLAN.md §4
-- =============================================

-- Enable RLS on all tables
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_skill_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Therapists: can read/update own profile
-- =============================================
CREATE POLICY "therapist reads own profile"
  ON therapists FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "therapist updates own profile"
  ON therapists FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "therapist inserts own profile"
  ON therapists FOR INSERT
  WITH CHECK (id = auth.uid());

-- =============================================
-- Clients: therapist owns their clients
-- =============================================
CREATE POLICY "therapist reads own clients"
  ON clients FOR SELECT
  USING (therapist_id = auth.uid());

CREATE POLICY "therapist inserts own clients"
  ON clients FOR INSERT
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "therapist updates own clients"
  ON clients FOR UPDATE
  USING (therapist_id = auth.uid());

CREATE POLICY "therapist deletes own clients"
  ON clients FOR DELETE
  USING (therapist_id = auth.uid());

-- =============================================
-- Parents: can read their own client
-- =============================================
CREATE POLICY "parent reads own client"
  ON clients FOR SELECT
  USING (
    id IN (SELECT client_id FROM parents WHERE id = auth.uid())
  );

-- =============================================
-- Parents: can read own profile
-- =============================================
CREATE POLICY "parent reads own profile"
  ON parents FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "parent inserts own profile"
  ON parents FOR INSERT
  WITH CHECK (id = auth.uid());

-- =============================================
-- Invites: therapist manages invites for their clients
-- =============================================
CREATE POLICY "therapist reads own client invites"
  ON invites FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE therapist_id = auth.uid())
  );

CREATE POLICY "therapist inserts own client invites"
  ON invites FOR INSERT
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE therapist_id = auth.uid())
  );

CREATE POLICY "therapist updates own client invites"
  ON invites FOR UPDATE
  USING (
    client_id IN (SELECT id FROM clients WHERE therapist_id = auth.uid())
  );

-- Parent can read invite for their client (for onboarding)
CREATE POLICY "parent reads invite for own client"
  ON invites FOR SELECT
  USING (
    client_id IN (SELECT client_id FROM parents WHERE id = auth.uid())
  );

-- =============================================
-- Skills: world-readable (published rows)
-- =============================================
CREATE POLICY "anyone reads published skills"
  ON skills FOR SELECT
  USING (is_published = TRUE);

-- =============================================
-- Client Skill State: therapist writes own clients
-- =============================================
CREATE POLICY "therapist reads own client skill state"
  ON client_skill_state FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE therapist_id = auth.uid())
  );

CREATE POLICY "therapist writes own client skill state"
  ON client_skill_state FOR ALL
  USING (
    client_id IN (SELECT id FROM clients WHERE therapist_id = auth.uid())
  );

-- Parent reads own client's skill state
CREATE POLICY "parent reads own client skill state"
  ON client_skill_state FOR SELECT
  USING (
    client_id IN (SELECT client_id FROM parents WHERE id = auth.uid())
  );

-- =============================================
-- Practice Logs: parent writes own, reads own
-- =============================================
CREATE POLICY "parent writes own practice logs"
  ON practice_logs FOR INSERT
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "parent reads own practice logs"
  ON practice_logs FOR SELECT
  USING (parent_id = auth.uid());

-- Therapist reads practice logs for their clients
CREATE POLICY "therapist reads own client practice logs"
  ON practice_logs FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE therapist_id = auth.uid())
  );
