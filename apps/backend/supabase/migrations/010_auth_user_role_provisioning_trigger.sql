-- =============================================
-- ParentScript — Auto-create role rows on auth.users insert
-- Migration 010: trigger that provisions the therapists OR parents row
--                when a new auth.users row is created.
-- =============================================
--
-- Why
-- ───
-- Quinn's QA (2026-07-04 E2E smoke, task t_a3e1cdf8) flagged two
-- P0 bugs rooted in the same underlying problem:
--
--   1. /app/signup (therapist signup) leaked the raw PostgREST error
--      `new row violates row-level security policy for table "therapists"`
--      because the client tried to INSERT into therapists immediately
--      after supabase.auth.signUp() — but signUp returns no session when
--      email_confirm is required, so auth.uid() is null, so the RLS
--      WITH CHECK (id = auth.uid()) policy blocks the insert.
--
--   2. /app/parent-signup stuck on a dead-end consent screen because
--      getUser() returns null with no session.
--
-- Both flows now defer row creation to a database trigger that runs
-- in a SECURITY DEFINER context (bypassing RLS) at the moment an
-- auth.users row is created. This is the canonical Supabase pattern
-- for "auto-provision a public.<role> row for each new auth user."
--
-- Design choices
-- ──────────────
-- 1. Intent is communicated via raw_user_meta_data->>'role' which the
--    client sets at signUp time:
--        supabase.auth.signUp({ email, password, options: {
--          data: { role: 'therapist', display_name: 'Dr. Smith' }
--        }})
--    Allowed values: 'therapist', 'parent'. Unknown / missing → no row
--    is created (the row creation is a hard failure that surfaces in
--    logs but does not roll back the auth.users insert — auth is the
--    source of truth, role rows are a derived view).
--
-- 2. SECURITY DEFINER + SET search_path = public, auth so the function
--    runs as the migration owner (typically postgres) and can write to
--    the public tables regardless of the RLS policies bound to the
--    `anon` / `authenticated` roles.
--
-- 3. ON CONFLICT DO NOTHING is used for idempotency. If the client
--    ever races a manual insert (e.g. via OAuth callback that also
--    provisions), the trigger won't error and the user isn't blocked.
--
-- 4. For self-serve parents, client_id is NULL and is_self_serve =
--    TRUE — matches what ParentSignup was inserting before. For
--    therapist-issued invites, the parent row still needs a client_id
--    and is_self_serve = FALSE; the invite redemption flow (out of
--    scope here) handles that case explicitly.
--
-- 5. No PHI. Only auth.users identifiers and the optional
--    display_name are copied.
-- =============================================

-- =============================================
-- 1. Helper: provision role row from auth.users metadata
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role     TEXT;
  v_display  TEXT;
  v_email    TEXT;
BEGIN
  -- raw_user_meta_data is JSONB on auth.users (set via supabase.auth.signUp
  -- options.data, or by OAuth providers).
  v_role    := NEW.raw_user_meta_data ->> 'role';
  v_display := NEW.raw_user_meta_data ->> 'display_name';
  v_email   := COALESCE(NEW.email, '');

  IF v_role = 'therapist' THEN
    INSERT INTO public.therapists (id, email, display_name)
    VALUES (NEW.id, v_email, NULLIF(v_display, ''))
    ON CONFLICT (id) DO NOTHING;

  ELSIF v_role = 'parent' THEN
    INSERT INTO public.parents (id, client_id, email, is_self_serve)
    VALUES (NEW.id, NULL, v_email, TRUE)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Unknown / missing role → no-op. Auth user is still created; an
  -- out-of-band provisioning flow (admin invite, OAuth callback) can
  -- supply the row later. We intentionally do NOT raise an exception:
  -- blocking the auth.users insert because metadata was missing would
  -- be a worse failure mode than silent no-op.
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_auth_user() IS
  'Auto-provisions a public.therapists or public.parents row when an '
  'auth.users row is created, reading role intent from '
  'raw_user_meta_data->>''role''. SECURITY DEFINER bypasses RLS. '
  'Added in migration 010 to fix the P0 RLS-leak bug (t_ff96d525).';

-- =============================================
-- 2. Trigger: fire AFTER INSERT on auth.users
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- =============================================
-- 3. Reload PostgREST schema cache (mirrors 008 pattern)
-- =============================================
NOTIFY pgrst, 'reload schema';