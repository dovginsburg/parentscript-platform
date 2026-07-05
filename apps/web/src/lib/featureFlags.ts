// ============================================================
// Feature Flags & Parent Preferences — Central Registry
// ============================================================
//
// THE ONE FILE TO EDIT when adding a new flag or preference.
//
// Each entry is declarative:
//   - id           the typed key (must match TherapistFeatureFlag
//                  or ParentPreferenceKey in lib/types.ts)
//   - label        short title shown on settings UI
//   - description  one-line plain-English explanation
//   - category     group label for the settings page
//   - defaultOn   initial value when no row exists yet
//   - experimental true hides behind a small "experimental" badge
//
// Storage is jsonb on Supabase, so adding a new key requires
// NO migration. The shape is typed end-to-end:
//   1. Add the key to TherapistFeatureFlag / ParentPreferenceKey
//      in src/lib/types.ts
//   2. Add an entry to THERAPIST_FLAGS or PARENT_PREFS below
//   3. Use useFeatureFlags().isEnabled('yourFlag') in components
// ============================================================

import type { TherapistFeatureFlag, ParentPreferenceKey } from './types';

export interface TherapistFlagMeta {
  id: TherapistFeatureFlag;
  label: string;
  description: string;
  category: string;
  defaultOn: boolean;
  experimental?: boolean;
}

export interface ParentPrefMeta {
  id: ParentPreferenceKey;
  label: string;
  description: string;
  category: string;
  defaultOn: boolean;
  experimental?: boolean;
}

// ── Therapist feature flags ──────────────────────────────────────
// Clinical / app-feature controls owned by the therapist.
// Defaults ON — toggling OFF is the opt-out.
export const THERAPIST_FLAGS: readonly TherapistFlagMeta[] = [
  {
    id: 'inTheMoment',
    label: 'In-the-Moment panic button',
    description: 'Lets parents open the full-screen crisis-style tips page from the home screen.',
    category: 'Parent-facing features',
    defaultOn: true,
  },
  {
    id: 'practiceLogging',
    label: 'Practice logging',
    description:
      'Lets parents log how a skill practice went (good / mixed / hard + reflection tags).',
    category: 'Parent-facing features',
    defaultOn: true,
  },
  {
    id: 'customNoteTemplates',
    label: 'Custom note templates (coming soon)',
    description:
      'Per-client note templates you can attach to a focus skill. Stored for when this ships.',
    category: 'Therapist tools',
    defaultOn: false,
    experimental: true,
  },
  {
    id: 'exportClientData',
    label: 'Export client data (coming soon)',
    description: "Download a client's unlock history and practice logs as CSV.",
    category: 'Therapist tools',
    defaultOn: false,
    experimental: true,
  },
];

// ── Parent preferences ────────────────────────────────────────────
// NON-CLINICAL UX only. Defaults ON — toggling OFF is the opt-out.
export const PARENT_PREFS: readonly ParentPrefMeta[] = [
  {
    id: 'showInTheMoment',
    label: 'Show In-the-Moment button',
    description: 'Display the red panic-mode button at the top of your home screen.',
    category: 'Home screen',
    defaultOn: true,
  },
  {
    id: 'showPracticeLogging',
    label: 'Show practice logging link',
    description: 'Display the "+ Log practice" link on your home screen.',
    category: 'Home screen',
    defaultOn: true,
  },
  {
    id: 'enableNotifications',
    label: 'Allow notifications',
    description:
      'Reminders to log practice when your therapist unlocks a new skill. (Requires browser permission.)',
    category: 'Notifications',
    defaultOn: true,
  },
  {
    id: 'largeText',
    label: 'Larger text',
    description: 'Bumps skill titles and body text up one size for easier reading.',
    category: 'Display',
    defaultOn: false,
  },
  {
    id: 'reducedMotion',
    label: 'Reduce motion',
    description: 'Disables slide and swipe animations throughout the app.',
    category: 'Display',
    defaultOn: false,
  },
  {
    id: 'confirmBeforeAction',
    label: 'Ask before destructive actions',
    description: 'Shows a confirmation prompt before logging out and similar actions.',
    category: 'Safety',
    defaultOn: true,
  },
];

// ── Defaults lookup ───────────────────────────────────────────────
export function defaultTherapistFlags(): Record<TherapistFeatureFlag, boolean> {
  const out = {} as Record<TherapistFeatureFlag, boolean>;
  for (const f of THERAPIST_FLAGS) out[f.id] = f.defaultOn;
  return out;
}

export function defaultParentPrefs(): Record<ParentPreferenceKey, boolean> {
  const out = {} as Record<ParentPreferenceKey, boolean>;
  for (const p of PARENT_PREFS) out[p.id] = p.defaultOn;
  return out;
}

// ── Grouped helpers (for settings UI) ─────────────────────────────
export function groupTherapistFlagsByCategory(): Record<string, TherapistFlagMeta[]> {
  const groups: Record<string, TherapistFlagMeta[]> = {};
  for (const f of THERAPIST_FLAGS) {
    if (!groups[f.category]) groups[f.category] = [];
    groups[f.category].push(f);
  }
  return groups;
}

export function groupParentPrefsByCategory(): Record<string, ParentPrefMeta[]> {
  const groups: Record<string, ParentPrefMeta[]> = {};
  for (const p of PARENT_PREFS) {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  }
  return groups;
}

// ── Resolve helper ────────────────────────────────────────────────
// Given a partial jsonb blob and the full defaults, return a fully
// populated record. New flags added later will simply get their
// default value for users whose stored row predates the flag —
// no broken state, no migration.
export function resolveTherapistFlags(
  stored: Partial<Record<TherapistFeatureFlag, boolean>> | null | undefined
): Record<TherapistFeatureFlag, boolean> {
  return { ...defaultTherapistFlags(), ...(stored ?? {}) };
}

export function resolveParentPrefs(
  stored: Partial<Record<ParentPreferenceKey, boolean>> | null | undefined
): Record<ParentPreferenceKey, boolean> {
  return { ...defaultParentPrefs(), ...(stored ?? {}) };
}

// ── Cross-flag resolver for the parent side ───────────────────────
// A parent's view of "is feature X available?" depends on BOTH
// their own preference AND their therapist's flag:
//
//   - The therapist must have enabled the feature for their caseload
//   - The parent must have it visible on their home screen
//
// This is intentional: therapists can globally disable a feature
// even if a parent's toggle is on; parents can hide a feature
// even if the therapist has it on. Both must agree.
export type ParentFeatureKey = 'inTheMoment' | 'practiceLogging';

export function parentCanUse(
  feature: ParentFeatureKey,
  therapistFlags: Record<TherapistFeatureFlag, boolean>,
  parentPrefs: Record<ParentPreferenceKey, boolean>
): boolean {
  switch (feature) {
    case 'inTheMoment':
      return Boolean(therapistFlags.inTheMoment) && Boolean(parentPrefs.showInTheMoment);
    case 'practiceLogging':
      return Boolean(therapistFlags.practiceLogging) && Boolean(parentPrefs.showPracticeLogging);
  }
}
