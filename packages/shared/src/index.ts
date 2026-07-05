/**
 * @parentscript/shared — types, API client, i18n setup.
 *
 * This package is the shared kernel that every client surface (web, iOS,
 * Android, desktop, browser-extension) imports for:
 *   - Type-safe Supabase row types (therapist, parent, client, skill, unlock)
 *   - The fetch-based API client wrapping FastAPI at api.parentscript.app
 *   - i18next initialization with the 7 supported locales
 */
export * from "./types.js";
export * from "./api-client.js";
export {
  i18n,
  i18nResources,
  DEFAULT_LOCALE,
  baseI18nOptions,
} from "./i18n.js";
export type { ParentscriptI18n } from "./i18n.js";

// Skill levels — shared across therapist (assignment) and parent (display).
// Mirrors the DB CHECK constraint `level BETWEEN 1 AND 4` in
// apps/backend/supabase/migrations/001_initial_schema.sql:56.
export type SkillLevel = "L1" | "L2" | "L3" | "L4";

// Supported locales — set per market before going live.
export type LocaleCode = "en" | "es" | "fr" | "de" | "ja" | "pt-BR" | "ar";

// Roles — drives both routing (TherapistAuth vs ParentAuth) and RLS policies.
export type UserRole = "therapist" | "parent";