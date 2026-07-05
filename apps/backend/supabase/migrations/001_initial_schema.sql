-- =============================================
-- Parenting Skills App — Initial Schema
-- From BUILD_PLAN.md §3
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Table: therapists
-- =============================================
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT auth.users.id,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Table: clients
-- =============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- Non-identifying, therapist-chosen ("Client 042")
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Table: parents
-- =============================================
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT auth.users.id,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Table: invites
-- =============================================
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

-- =============================================
-- Table: skills (curriculum content)
-- =============================================
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 4),
  sort_order INT NOT NULL,
  title TEXT NOT NULL,
  goal TEXT NOT NULL,
  use_when TEXT NOT NULL,
  say_this TEXT NOT NULL,
  dont_say TEXT NOT NULL,
  safety_warning TEXT,
  age_adaptations TEXT, -- Age-specific guidance
  is_published BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================
-- Table: client_skill_state
-- =============================================
CREATE TABLE client_skill_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('locked', 'unlocked')) DEFAULT 'locked',
  unlocked_at TIMESTAMPTZ,
  note_tag TEXT CHECK (note_tag IN ('focus_this_week', 'going_well', 'revisit')),
  UNIQUE(client_id, skill_id)
);

-- =============================================
-- Table: practice_logs
-- =============================================
CREATE TABLE practice_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  practiced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  went_how TEXT NOT NULL CHECK (went_how IN ('good', 'mixed', 'hard')),
  reflection_tags TEXT[]
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_clients_therapist_id ON clients(therapist_id);
CREATE INDEX idx_parents_client_id ON parents(client_id);
CREATE INDEX idx_invites_client_id ON invites(client_id);
CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_client_skill_state_client_id ON client_skill_state(client_id);
CREATE INDEX idx_client_skill_state_skill_id ON client_skill_state(skill_id);
CREATE INDEX idx_practice_logs_client_id ON practice_logs(client_id);
CREATE INDEX idx_practice_logs_parent_id ON practice_logs(parent_id);
