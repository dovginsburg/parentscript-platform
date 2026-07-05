// UserRole lives in @parentscript/shared so every surface (web, iOS,
// Android, desktop) agrees on the same literal set — used both for
// routing (TherapistAuth vs ParentAuth) and RLS policy keys.
export type { UserRole } from '@parentscript/shared';

export interface Therapist {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  // Added by migration 005_therapist_verification.sql
  license_number?: string | null;
  license_state?: string | null;
  license_type?: string | null;
  is_verified?: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
}

export interface Client {
  id: string;
  therapist_id: string;
  label: string;
  created_at: string;
}

export interface Parent {
  id: string;
  client_id: string | null; // null for self-serve (free-tier) parents
  email: string;
  created_at: string;
  is_self_serve?: boolean; // true for free-tier parents without a therapist
}

/** Parent tier drives skill visibility + daily usage enforcement. */
export type ParentTier = 'free' | 'therapist_connected';

/** Usage kinds tracked in parent_daily_usage. */
export type UsageKind = 'coaching' | 'practice';

/** A single day's usage bucket for a parent. */
export interface ParentDailyUsage {
  id: string;
  parent_id: string;
  usage_date: string; // 'YYYY-MM-DD'
  kind: UsageKind;
  count: number;
  updated_at: string;
}

/** Free-tier limit (matches pricing copy). */
export const FREE_TIER_DAILY_COACHING_LIMIT = 1;

export interface Invite {
  id: string;
  client_id: string;
  code: string;
  expires_at: string;
  consumed_at: string | null;
}

export interface Skill {
  id: string;
  slug: string;
  level: number;
  sort_order: number;
  title: string;
  goal: string;
  use_when: string;
  say_this: string;
  dont_say: string;
  safety_warning: string | null;
  is_published: boolean;
}

export type NoteTag = 'focus_this_week' | 'going_well' | 'revisit';
export type SkillStatus = 'locked' | 'unlocked';

export interface ClientSkillState {
  id: string;
  client_id: string;
  skill_id: string;
  status: SkillStatus;
  unlocked_at: string | null;
  note_tag: NoteTag | null;
}

export interface ClientSkillStateWithSkill extends ClientSkillState {
  skill: Skill;
}

export type PracticeWentHow = 'good' | 'mixed' | 'hard';

export interface PracticeLog {
  id: string;
  client_id: string;
  parent_id: string;
  skill_id: string | null;
  practiced_at: string;
  went_how: PracticeWentHow;
  reflection_tags: string[] | null;
}

export interface PracticeLogWithSkill extends PracticeLog {
  skill: Skill | null;
}

export const REFLECTION_TAGS = [
  { value: 'stayed-calm', label: 'I stayed calm' },
  { value: 'lost-it', label: 'I lost my cool' },
  { value: 'child-responded', label: 'Child responded well' },
  { value: 'child-escalated', label: 'Child escalated' },
  { value: 'needed-breaks', label: 'Needed extra breaks' },
  { value: 'felt-supported', label: 'Felt supported' },
  { value: 'made-progress', label: 'Made progress' },
] as const;

export const NOTE_TAG_LABELS: Record<NoteTag, string> = {
  focus_this_week: 'Focus this week',
  going_well: 'Going well',
  revisit: 'Revisit',
};

// ────────────────────────────────────────────────────────────────────
// Feature Flags & Preferences
// ────────────────────────────────────────────────────────────────────
//
// Two scopes, deliberately separated so clinical content cannot be
// mutated by parents:
//
//   TherapistFeatureFlag — therapist-owned. Controls which app
//     features the therapist has enabled for their account / caseload.
//     Stored in therapist_feature_flags.flags (jsonb).
//
//   ParentPreferenceKey — parent-owned. NON-CLINICAL UX only.
//     Display, layout, notification opt-ins. Stored in
//     parent_preferences.prefs (jsonb).
//
// Adding a new flag or preference: add one entry to the registry in
// src/lib/featureFlags.ts. No migration required.

export type TherapistFeatureFlag =
  | 'inTheMoment' // "In the Moment" panic-mode feature for parents
  | 'practiceLogging' // practice logging button + page
  | 'customNoteTemplates' // (future) per-client note templates
  | 'exportClientData'; // (future) CSV export

export type ParentPreferenceKey =
  | 'showInTheMoment' // opt-in visibility of panic-mode button
  | 'showPracticeLogging' // opt-in visibility of practice log button
  | 'enableNotifications' // generic notification opt-in
  | 'largeText' // bumps parent-base/lg font sizes
  | 'reducedMotion' // respects prefers-reduced-motion + manual toggle
  | 'confirmBeforeAction'; // extra confirmation on destructive flows

// The row shape returned by Supabase for therapist_feature_flags.
// `flags` is intentionally jsonb-typed so the column can hold any
// future flag without a migration.
export interface TherapistFeatureFlagsRow {
  therapist_id: string;
  flags: Partial<Record<TherapistFeatureFlag, boolean>>;
  updated_at: string;
}

// Parent-side mirror of the same row, fetched when a parent loads
// the app so we can hide clinical features their therapist disabled.
export interface TherapistFlagsForParent {
  therapistId: string;
  flags: Partial<Record<TherapistFeatureFlag, boolean>>;
}

export interface ParentPreferencesRow {
  parent_id: string;
  prefs: Partial<Record<ParentPreferenceKey, boolean>>;
  updated_at: string;
}
