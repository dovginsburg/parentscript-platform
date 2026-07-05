/**
 * Domain types for ParentScript — shared between web, mobile, and backend.
 * Kept in lockstep with apps/backend/server.mjs + supabase/migrations/.
 */

export type RiskLevel = 'low' | 'medium' | 'high';

// In-the-Moment coaching response — see api/safety-guard.mjs for the
// crisis-response flow that swaps in for flagged inputs.
export interface CoachingResponse {
  risk_level: RiskLevel | string;
  empathy: string;
  steps: string[];
  safety_note?: string | null;
  crisis_response?: boolean;
}

// Therapist-managed client (a parent they treat).
export interface Client {
  id: string;
  therapist_id: string;
  parent_id?: string | null;
  label: string; // non-identifying ("Family of 2")
  created_at: string;
  child_age_band?: string; // e.g. "3-5" — used for skill age adaptations
}

// Skill cheat-sheet — the core content object.
export interface Skill {
  id: string;
  // Mirrors the DB CHECK constraint `level BETWEEN 1 AND 4` in
  // apps/backend/supabase/migrations/001_initial_schema.sql:56.
  level: 'L1' | 'L2' | 'L3' | 'L4';
  modality: string; // "PCIT" | "BPT" | "CPS" | "Triple P" | "Circle of Security"
  title: string;
  body: string;
  age_adaptations?: Record<string, string>;
  evidence_refs?: string[];
  reviewed_by: string; // Mira or her delegate
}

// Per-client skill assignment — therapists unlock skills session-by-session.
export interface SkillUnlock {
  id: string;
  client_id: string;
  skill_id: string;
  unlocked_at: string;
  expires_at?: string | null; // optional timed unlock
}

// Practice log entries — parents record what they tried and how it went.
export interface PracticeLog {
  id: string;
  parent_id: string;
  skill_id: string;
  attempted_at: string;
  worked?: boolean | null; // quick yes/no
  reflection?: string | null; // short reflection, never free-text PHI
  intensity?: 1 | 2 | 3 | 4 | 5;
}
