// ============================================================
// Client-side safety mirror — preflight BEFORE /api/coach
// ============================================================
//
// The server has the authoritative preflight in api/safety-guard.mjs.
// This client mirror exists so a crisis-flagged situation gets the
// verbatim response INSTANTLY (no network roundtrip) and works even
// when the API key isn't configured.
//
// KEEP IN SYNC with api/safety-guard.mjs:
//   - Direct patterns must match exactly.
//   - Indirect patterns must match exactly.
//   - CRISIS_RESPONSE_TEXT and SCOPE_DISCLOSURE_TEXT must match.
//   - If Mira flags a change, both files change together. (Verified
//     in t_clin_1782815154 review-protocol.)
//
// Reference: t_clin_gary_1782815200 (kanban) — this file is
// the builder slice of that task.
// ============================================================

export const CRISIS_CATEGORIES = Object.freeze({
  SUICIDAL_PARENT: 'suicidal_parent',
  SUICIDAL_CHILD: 'suicidal_child',
  SELF_HARM: 'self_harm',
  HARM_TO_CHILD: 'harm_to_child',
  ABUSE_DISCLOSURE: 'abuse_disclosure',
  IPV: 'ipv',
  COERCION: 'coercion',
  DIAGNOSTIC_SEEKING: 'diagnostic_seeking',
} as const)

export type CrisisCategory = (typeof CRISIS_CATEGORIES)[keyof typeof CRISIS_CATEGORIES]

export const CRISIS_RESPONSE_TEXT = `It sounds like you're going through something serious, and we want you to be safe. ParentScript isn't the right tool for this moment. Please reach out right now to a person who can help:
• 988 — Suicide & Crisis Lifeline (call or text)
• 911 — for immediate emergency
• 1-800-422-4453 — Childhelp National Child Abuse Hotline
• Text HOME to 741741 — Crisis Text Line
• 1-800-799-SAFE (7233) — National Domestic Violence Hotline
If you're outside the U.S., please contact your local emergency number. You don't have to handle this alone.`

export const SCOPE_DISCLOSURE_TEXT =
  'ParentScript is a parenting support tool, not therapy, counseling, or medical advice. It is not a crisis service. If you or your child are in crisis, call 988, 911, the Childhelp National Child Abuse Hotline (1-800-422-4453), or text HOME to 741741.'

export interface CrisisTrigger {
  category: CrisisCategory
  indirect: boolean
  /** Where the match came from: 'direct' keyphrase vs 'indirect' phrasing. */
  matchSource: 'direct' | 'indirect'
}

interface DirectPattern {
  cat: CrisisCategory
  re: RegExp
}

// Direct patterns — string-literal regexes for clarity in code review.
// MUST stay in sync with api/safety-guard.mjs.
const DIRECT_PATTERNS: DirectPattern[] = [
  { cat: CRISIS_CATEGORIES.SUICIDAL_PARENT, re: /\b(i\s+wants?\s+to\s+(die|kill\s+myself|end\s*(it|my\s*life))|i\s+(want|wish(ed)?|plan(ning)?|decided)\s*to\s*(die|kill\s*myself)|i\s+want\s+to\s+die|kill\s+myself\s+tonight|kill\s+myself\b|suicide|suicidal|better\s+off\s+dead|wish\s+i\s+was\s*dead|end\s+it\s+all|end\s+my\s+life|take\s+my\s+own\s+life|i\s+should\s+(just\s+)?disappear|i\s+have\s+no\s+reason\s+to\s+live)\b/i },
  { cat: CRISIS_CATEGORIES.SELF_HARM, re: /\b(hurting\s+myself|cutting\s+myself|cutting\s+my|burning\s+myself|hitting\s+myself|i\s+cut|i\s+burn\s+myself|self[- ]?harm|i\s+want\s+to\s+hurt\s+myself)\b/i },
  { cat: CRISIS_CATEGORIES.HARM_TO_CHILD, re: /\b(i\s+(hit|kicked|punched|slapped|grabbed|shoved|shook|threw|smacked)\s+(him|her|them|my\s+(son|daughter|kid|child|baby))|i\s+left\s+a\s+mark|i\s+bruised|i\s+couldn'?t\s+stop\s+hitting|i\s+lost\s+control\s+and\s+(hit|kicked|slapped|grabbed))\b/i },
  { cat: CRISIS_CATEGORIES.ABUSE_DISCLOSURE, re: /\b(someone'?s?\s+(hurting|hitting|touching)\s+(my\s+)?(child|kid|son|daughter|baby)|my\s+(partner|husband|boyfriend|girlfriend|wife|ex)\s+(is\s+)?(hurting|hitting|touching|raping|molesting|abusing)|i\s+was\s+(sexually\s+)?(abused|molested|raped)\s+(as\s+a\s+child|when\s+i\s+was)|my\s+(dad|mom|parent)\s+(sexually\s+)?(abused|molested)\s+me|i\s+was\s+touched\s+inappropriately)\b/i },
  { cat: CRISIS_CATEGORIES.SUICIDAL_CHILD, re: /\b(my\s+(son|daughter|kid|child)\s+(said|says|told\s+me\s+(they|he|she))\s+.{0,80}(wants?\s+to\s+die|kill\s+(himself|herself|themselves)|killed?\s+(himself|herself|themselves)|suicide|suicidal|hurt\s+(himself|herself|themselves|him|her|them)|cutting\s+(himself|herself|themselves))|my\s+(son|daughter|kid|child)\s+(wants|wanted)\s+to\s+die|my\s+(son|daughter|kid|child)\s+(is|are)\s+(cutting|hurting)\s+(themselves|himself|herself))\b/i },
  { cat: CRISIS_CATEGORIES.IPV, re: /\b(my\s+(partner|husband|boyfriend|girlfriend|wife|ex)\s+(hits?|kicks?|beats?|chokes?)\s+me|i'?m\s+(scared|afraid)\s+of\s+my\s+(partner|husband|boyfriend|girlfriend|wife|ex)|i\s+have\s+to\s+hide\s+(my|the)\s+(bruises?|injuries?|money)|he\s+(won'?t|will\s+not)\s+let\s+me\s+(leave|go|work)|i'?m\s+being\s+controlled)\b/i },
  { cat: CRISIS_CATEGORIES.COERCION, re: /\b((don'?t|do\s+not)\s+tell\s+(anyone|my\s+(husband|wife|partner|therapist|doctor))|(promise|swear)\s+you\s+won'?t\s+tell|this\s+is\s+(just\s+)?between\s+us|keep\s+(it|this)\s+(secret|quiet)|don'?t\s+tell\s+(anyone|my\s+(wife|husband)))\b/i },
  { cat: CRISIS_CATEGORIES.DIAGNOSTIC_SEEKING, re: /\b(do\s+you\s+think\s+my\s+(child|kid|son|daughter)\s+has\s+(adhd|autism|asd|odd|anxiety|depression|bipolar|ptsd|conduct\s+disorder)|does\s+my\s+(child|kid)\s+have\s+(adhd|autism|odd)|what\s+medication\s+(should|do|would)\s+(i|my\s+child)|should\s+(i|my\s+child)\s+be\s+on\s+medication)\b/i },
]

// Indirect phrasing — high-risk for suicidal ideation without
// saying "die" or "kill myself". MUST stay in sync with
// api/safety-guard.mjs (including the "today" downgrade filter).
const INDIRECT_PATTERNS: RegExp[] = [
  /\b(tired|exhausted)\s+of\s+everything\b/i,
  /\b(can'?t|cannot)\s+keep\s+going\b/i,
  /\b(can'?t|cannot)\s+go\s+on\s+(any\s*more|like\s+this)\b/i,
  /\b(can'?t|cannot)\s+do\s+(this|it|any\s*of\s*this)\s+any\s*more\b/i,
  /\b(done\s+with\s+everything|nothing\s+matters\s+anymore|what'?s\s+the\s+point|what\s+is\s+the\s+point)\b/i,
  /\b(no\s+point\s+(in\s+)?(continuing|living|waking\s+up|trying))\b/i,
  /\bwouldn[\u2019']?t\s+mind\s+if\s+i\s+didn[\u2019']?t\s+wake\s+up\b/i,
  /\b(wish\s+i\s+could\s+(just\s+)?sleep\s+and\s+never\s+wake)\b/i,
  /\b(everyone\s+would\s+be\s+better\s+off\s+without\s+me)\b/i,
  /\b(wish\s+i\s+wasn'?t\s+here|i\s+shouldn'?t\s+have\s+been\s+born|nobody\s+(would\s+)?miss\s+me\s+if\s+i\s+was\s+gone)\b/i,
  /\b(giving\s+(up|it\s+all\s+up)|nothing\s+to\s+live\s+for|no\s+reason\s+to\s+(live|keep\s+going))\b/i,
]

const DAY_SCOPE_REGEX = /\b(today|tonight|this\s+morning|right\s+now\s+alone|just\s+today)\b/i
const DOWNGRADEABLE_INDIRECT_INDICES = new Set([1, 2, 3, 5, 6, 7])

export function detectCrisisTrigger(situation: string): CrisisTrigger | null {
  if (!situation || typeof situation !== 'string') return null
  const text = situation
  for (const { cat, re } of DIRECT_PATTERNS) {
    if (re.test(text)) return { category: cat, indirect: false, matchSource: 'direct' }
  }
  for (let i = 0; i < INDIRECT_PATTERNS.length; i++) {
    if (INDIRECT_PATTERNS[i].test(text)) {
      if (DOWNGRADEABLE_INDIRECT_INDICES.has(i) && DAY_SCOPE_REGEX.test(text)) {
        return null
      }
      return { category: CRISIS_CATEGORIES.SUICIDAL_PARENT, indirect: true, matchSource: 'indirect' }
    }
  }
  return null
}

export interface CoachResponse {
  steps: string[]
  safetyNote: string
  disclaimer: string
  empathy?: string
}

/**
 * Build a CoachResponse that mirrors what the server returns for a
 * crisis-flagged situation. The shape is identical to a normal
 * `/api/coach` response — INCLUDING a non-standard `_crisis: true`
 * flag the UI can switch on to render the full-screen crisis modal.
 */
export function crisisResponsePayload(): CoachResponse & { _crisis: true } {
  return {
    empathy: 'You are not alone. Help is available right now.',
    steps: [
      'Pause what you are doing.',
      CRISIS_RESPONSE_TEXT,
      'Tell someone you trust: a friend, family member, or your therapist.',
    ],
    safetyNote: SCOPE_DISCLOSURE_TEXT,
    disclaimer:
      'This is AI-generated guidance, not medical or therapeutic advice. If you or your child are in crisis, call 988, 911, or the Childhelp National Child Abuse Hotline (1-800-422-4453). ParentScript is not a crisis service.',
    _crisis: true,
  }
}

/**
 * Top-level helper for the UI: returns the verbatim crisis response
 * if the situation triggers, or `null` to send to /api/coach normally.
 */
export function shieldSituationClient(situation: string): (CoachResponse & { _crisis: true }) | null {
  const trigger = detectCrisisTrigger(situation)
  if (!trigger) return null
  return crisisResponsePayload()
}

// ── Convenience: type guards for discriminated UI ──────────────────
export function isCrisisResponse(r: CoachResponse | null | undefined): r is CoachResponse & { _crisis: true } {
  return Boolean(r && (r as { _crisis?: boolean })._crisis === true)
}
