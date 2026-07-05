-- =============================================
-- Therapist verification
-- =============================================
-- Adds license-number capture and a manually-reviewed
-- `is_verified` flag to the therapists table.
--
-- The ParentScript clinical team (or an admin via Supabase
-- Studio) is the only entity that flips `is_verified` to TRUE.
-- The application never sets it directly.
--
-- Run via:
--   psql "$SUPABASE_DB_URL" -f supabase/migrations/005_therapist_verification.sql
-- or paste into the Supabase SQL editor.

-- =============================================
-- Add columns
-- =============================================
ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS license_state  CHAR(2),
  ADD COLUMN IF NOT EXISTS license_type   TEXT,
  ADD COLUMN IF NOT EXISTS is_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- =============================================
-- Format check: STATE-TYPE-NUMBER
--   STATE  = 2-letter US code (we use the same list the
--            front-end enforces — see TherapistVerification.tsx)
--   TYPE   = LCSW | LMFT | LPC | LCPC | LMHC | PsyD | PhD
--   NUMBER = 4–7 digits
-- =============================================
ALTER TABLE therapists
  DROP CONSTRAINT IF EXISTS therapists_license_number_format;

ALTER TABLE therapists
  ADD CONSTRAINT therapists_license_number_format
  CHECK (
    license_number IS NULL
    OR license_number ~ '^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)-(LCSW|LMFT|LPC|LCPC|LMHC|PsyD|PhD)-[0-9]{4,7}$'
  );

-- =============================================
-- Cross-field consistency: if license_number is set, the
-- individual state/type columns must match its prefix.
-- (Trigger enforces; cheaper than CHECK with regex slicing.)
-- =============================================
CREATE OR REPLACE FUNCTION therapists_license_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.license_number IS NOT NULL THEN
    -- STATE
    IF NEW.license_state IS DISTINCT FROM substring(NEW.license_number FROM 1 FOR 2) THEN
      RAISE EXCEPTION 'license_state (%) does not match license_number prefix (%)',
        NEW.license_state, substring(NEW.license_number FROM 1 FOR 2);
    END IF;

    -- TYPE — substring between the two hyphens
    IF NEW.license_type IS DISTINCT FROM split_part(NEW.license_number, '-', 2) THEN
      RAISE EXCEPTION 'license_type (%) does not match license_number type segment (%)',
        NEW.license_type, split_part(NEW.license_number, '-', 2);
    END IF;
  END IF;

  -- verified_at must align with is_verified
  IF NEW.is_verified = TRUE AND NEW.verified_at IS NULL THEN
    NEW.verified_at := NOW();
  END IF;

  IF NEW.is_verified = FALSE THEN
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_therapists_license_consistency ON therapists;

CREATE TRIGGER trg_therapists_license_consistency
  BEFORE INSERT OR UPDATE ON therapists
  FOR EACH ROW
  EXECUTE FUNCTION therapists_license_consistency();

-- =============================================
-- updated_at trigger (idempotent — only creates if missing)
-- =============================================
CREATE OR REPLACE FUNCTION therapists_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_therapists_touch_updated_at'
  ) THEN
    ALTER TABLE therapists
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    CREATE TRIGGER trg_therapists_touch_updated_at
      BEFORE UPDATE ON therapists
      FOR EACH ROW
      EXECUTE FUNCTION therapists_touch_updated_at();
  END IF;
END $$;

-- =============================================
-- Index for "show me unverified therapists" admin queries
-- =============================================
CREATE INDEX IF NOT EXISTS idx_therapists_is_verified
  ON therapists(is_verified)
  WHERE is_verified = FALSE;

-- =============================================
-- RLS note: existing policies on therapists should already
-- allow therapists to UPDATE their own row (the parent UI
-- relies on that for display_name). If your installation
-- is more restrictive, ensure therapists can update
-- license_number / license_state / license_type but NOT
-- is_verified / verified_at / verified_by.
-- =============================================

-- =============================================
-- Helper: deny app-side flips of is_verified
-- (service_role bypasses this, so admins can still verify.)
-- =============================================
CREATE OR REPLACE FUNCTION therapists_guard_is_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- auth.role() = 'service_role' is the admin path; allow it.
  -- anon / authenticated users (the app) cannot change is_verified.
  IF current_setting('role', true) <> 'service_role' THEN
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'is_verified can only be changed by an admin (service_role).';
    END IF;
    IF NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
      RAISE EXCEPTION 'verified_at can only be changed by an admin (service_role).';
    END IF;
    IF NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
      RAISE EXCEPTION 'verified_by can only be changed by an admin (service_role).';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_therapists_guard_is_verified ON therapists;

CREATE TRIGGER trg_therapists_guard_is_verified
  BEFORE UPDATE ON therapists
  FOR EACH ROW
  EXECUTE FUNCTION therapists_guard_is_verified();