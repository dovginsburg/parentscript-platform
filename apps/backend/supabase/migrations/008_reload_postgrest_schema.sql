-- =============================================
-- ParentScript — Force PostgREST schema cache refresh
-- Migration 008: ensures Supabase REST sees migration 006/007 columns,
-- tables, and RPCs immediately after deployment.
-- =============================================

NOTIFY pgrst, 'reload schema';
