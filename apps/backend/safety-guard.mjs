// ============================================================
// /api safety guard — pre-LLM clinical safety filter
// ============================================================
//
// Sourced from Mira (clinical psychologist). This module is the
// FIRST line of defense on /api/coach. It runs BEFORE any LLM
// call so:
//   - Verbatim crisis response can be returned instantly.
//   - The LLM can never be tricked into "responding" to a
//     self-harm / abuse / IPV disclosure (no opportunity for
//     drift or hallucination).
//
// IMPORTANT — clinical authority
//   - Mira (mira profile) wrote the trigger patterns and the
//     verbatim crisis response text. Her clinical judgment is
//     final. If she flags an improvement, implement it without
//     pushback.
//   - The verbatim crisis response MUST be rendered EXACTLY as
//     written below. Never templated, never LLM-generated. The
//     wording is calibrated for crisis-line handoff.
//
// Layers
//   1. detectCrisisTrigger(situation) — pattern + indirect-phrase
//      matcher. Returns the trigger category or null.
//   2. CRISIS_RESPONSE — verbatim string. Stable. Do not edit.
//   3. SCOPE_DISCLOSURE — single-string shown in onboarding,
//      settings, and before any crisis-flagged response.
//   4. shieldSituation(situation)  — top-level helper used by
//      /api/coach. Returns either { safe: true } or
//      { safe: false, response: {...}, category }.
//
// Indirect phrasing is critical: phrases like "I'm just so tired
// of everything" or "I can't do this anymore" are high-risk for
// suicidal ideation. We catch them via the `crisis.indirect`
// pattern set, not just direct "I want to die" mention.
// ============================================================

// ── Verbatim crisis response (DO NOT MODIFY) ────────────────────────
// en-US is the only human-reviewed crisis response at the moment.
// Other locales (es-US, es-MX, fr-CA, etc.) MUST be hand-translated
// by Mira (or another clinical reviewer) and registered below.
// Do NOT auto-translate, do NOT LLM-translate. The wording is
// calibrated for crisis-line handoff and machine translation
// introduces subtle clinical drift (pronoun shifts, "should"→"must"
// softening, cultural reframings).
//
// AUDIT TRAIL (Gary, 2026-06-30):
//   - en-US: Mira-reviewed 2026-06-30. SHIPPED.
//   - es-US: PENDING Mira review. Do NOT enable in production until
//     a native-speaking clinician signs off on the translation.
//     Per Mira's memo, this is a follow-up, not a now.
export const CRISIS_RESPONSE_EN_US = `It sounds like you're going through something serious, and we want you to be safe. ParentScript isn't the right tool for this moment. Please reach out right now to a person who can help:
• 988 — Suicide & Crisis Lifeline (call or text)
• 911 — for immediate emergency
• 1-800-422-4453 — Childhelp National Child Abuse Hotline
• Text HOME to 741741 — Crisis Text Line
• 1-800-799-SAFE (7233) — National Domestic Violence Hotline
If you're outside the U.S., please contact your local emergency number. You don't have to handle this alone.`;

export const CRISIS_RESPONSE_TEXT = CRISIS_RESPONSE_EN_US; // legacy alias

// ── Scope-of-practice disclosure (shown on first launch + settings) ──
export const SCOPE_DISCLOSURE_EN_US =
  'ParentScript is a parenting support tool, not therapy, counseling, or medical advice. It is not a crisis service. If you or your child are in crisis, call 988, 911, the Childhelp National Child Abuse Hotline (1-800-422-4453), or text HOME to 741741.';

export const SCOPE_DISCLOSURE_TEXT = SCOPE_DISCLOSURE_EN_US; // legacy alias

// ── Localization registry ─────────────────────────────────────────
// Each entry is a human-reviewed translation. Adding a new locale
// requires Mira's clinical sign-off; see `locales` object below.
//
// Shape:
//   { [locale]: { crisis: string, scope: string, reviewer: string, reviewedAt: ISO_DATE } }
//
// Usage:
//   getCrisisResponse('en-US') → CRISIS_RESPONSE_EN_US
//   getCrisisResponse('es-US') → throws if not registered, else returns the translation
//   getCrisisResponse()        → uses default locale (en-US)
export const LOCALES = Object.freeze({
  'en-US': Object.freeze({
    crisis: CRISIS_RESPONSE_EN_US,
    scope: SCOPE_DISCLOSURE_EN_US,
    reviewer: 'Mira (clinical psychologist)',
    reviewedAt: '2026-06-30',
  }),
  // 'es-US': PENDING — register here once Mira signs off.
  // Add as: 'es-US': Object.freeze({ crisis: '...', scope: '...', reviewer: '...', reviewedAt: '...' })
});

export const DEFAULT_LOCALE = 'en-US';

export function getLocale(code) {
  const entry = LOCALES[code];
  if (!entry) {
    throw new Error(
      `safety-guard: locale "${code}" is not human-reviewed. ` +
        `Per Mira's protocol, crisis responses must NOT be auto-translated. ` +
        `Add a hand-reviewed entry to LOCALES in api/safety-guard.mjs after clinical sign-off. ` +
        `Available locales: ${Object.keys(LOCALES).join(', ')}`
    );
  }
  return entry;
}

export function getCrisisResponse(code = DEFAULT_LOCALE) {
  return getLocale(code).crisis;
}

export function getScopeDisclosure(code = DEFAULT_LOCALE) {
  return getLocale(code).scope;
}

export function listLocales() {
  return Object.keys(LOCALES);
}

// ── Trigger categories ─────────────────────────────────────────────
// `category` doubles as the routing hint for which hotline is the
// primary refer; many patterns map to multiple categories and the
// CRISIS_RESPONSE_TEXT above covers all five.
export const CRISIS_CATEGORIES = Object.freeze({
  SUICIDAL_PARENT: 'suicidal_parent',
  SUICIDAL_CHILD: 'suicidal_child',
  SELF_HARM: 'self_harm',
  HARM_TO_CHILD: 'harm_to_child',
  ABUSE_DISCLOSURE: 'abuse_disclosure',
  IPV: 'ipv',
  COERCION: 'coercion',
  DIAGNOSTIC_SEEKING: 'diagnostic_seeking',
});

// ── Direct phrases ──────────────────────────────────────────────────
// Strings matched as exact substrings (case-insensitive). Each entry
// captures a category. A single match short-circuits the request.
//
// Note `wants?` everywhere — the parent/kid typically says "I want"/"wants".
//
// AUDIT TRAIL — patterns added 2026-06-30 (Gary, t_clin_gary_1782815200):
//   - SUICIDAL_PARENT extended: "keep/keeps thinking about kill|die"
//   - SUICIDAL_PARENT added: "have a plan (for|to)" — plan disclosure
//   - HARM_TO_CHILD extended: "shook" alone (Shaken Baby Syndrome case)
//   - HARM_TO_CHILD added: "lost control and (verb) my"
//   - SELF_HARM extended: bare "cutting" (e.g. "I caught myself cutting again")
//   - SUICIDAL_CHILD extended: age-number ("my 14-year-old"), present-perfect
//     "has been / 's been hurting themselves"
//   - ABUSE_DISCLOSURE extended: past-tense "I was abused as a kid/child",
//     third-party "someone is hurting" witnessing
//   - COERCION extended: "told me not to tell anyone"
//   - DIAGNOSTIC_SEEKING widened: "I think my child has X" (vs only
//     "do you think"), "what medication should my son take" form,
//     "should my kid/son/daughter take/be on" variant
//
// Negative-precision guards (must NOT match):
//   - "I want to die a little" / "I want to die inside" — figurative
//   - "I cut myself on the fence" / "I burned myself on the stove" — accidental
//   - "My partner is hurting after the accident" — physical pain, not IPV
//   - "Don't tell anyone I forgot the permission slip" — minor parental ask
// See SAFETY-NEGATIVE-GUARDS below.
const SAFETY_NEGATIVE_GUARDS = [
  // Figurative "I want to die" — only flag if NOT followed by a
  // diminutive/figurative continuation. "I want to die a little", "die
  // inside", "die of embarrassment/laughter" are all figurative.
  /\b(want|wants|wanted|wishing)\s+to\s+die\s+(a\s+little|inside|of\s+(embarrassment|laughter|shame))\b/i,

  // Accidental self-injury: "cut/burn/hurt myself on the X" where
  // X is a physical object. Bare "cut myself" / "burning myself"
  // without an object stay in the self-harm category.
  /\b(cut|cuts|burned|burnt|burns|hurt|hurts|harmed|burning)\s+(myself|my\s+(arm|leg|hand|finger|foot))\s+(on|against|with)\s+(a|an|the|my)\s+\w+/i,
  /\bcuts?\s+on\s+the\s+(fence|glass|knife|edge|shard|can)\b/i,

  // Physical-pain IPV false positive: "partner is hurting after the
  // accident/injury/surgery" — uses "hurting" as a stative verb, not
  // as an active agent of violence. Guard against any "partner is
  // hurting" without an active-verb pair (hits/kicks/...).
  /\b(my\s+)?(partner|husband|boyfriend|girlfriend|wife|ex)\s+is\s+hurting\s+(after|since|from|because\s+of)\s+/i,

  // Minor parental "don't tell" requests about household logistics.
  /\b(don'?t|do\s+not)\s+tell\s+(anyone|my\s+(wife|husband|partner|mom|dad))\s+(i|that\s+i|about)\s+(forgot|lost|misplaced|ate|didn'?t)\b/i,

  // Developmentally-normal child-SI phrasings: a 4-, 5-, or 6-year-old
  // saying "I want to die" is a tantrum signal, not SI. The clinical
  // threshold for genuine child SI distress is 8+ (per Mira's memo
  // on developmental normativity of dramatic language in 3-6y).
  /\bmy\s+(4|5|6)\s*-\s*year\s*-\s*old\s+(said|says|told\s+me).{0,80}(wants?\s+to\s+die|kill\s+themselves?)\b/i,
];

// Apply negative guards before any positive match. A text matching a
// guard is treated as non-triggering, full stop. Order of guards
// matters only for readability — guards are independent.
function passesNegativeGuards(text) {
  for (const re of SAFETY_NEGATIVE_GUARDS) {
    if (re.test(text)) return false;
  }
  return true;
}

const DIRECT_PATTERNS = [
  // Parent suicidal ideation
  {
    cat: CRISIS_CATEGORIES.SUICIDAL_PARENT,
    re: /\b(i\s+wants?\s+to\s+(die|kill\s+myself|end\s*(it|my\s*life))|i\s+(want|wish(ed)?|plan(ning)?|decided)\s*to\s*(die|kill\s+myself)|i\s+want\s+to\s+die|kill\s+myself\s+tonight|kill\s+myself\b|suicide|suicidal|better\s+off\s+dead|wish\s+i\s+was\s*dead|end\s+it\s+all|end\s+my\s+life|take\s+my\s+own\s+life|i\s+should\s+(just\s+)?disappear|i\s+have\s+no\s+reason\s+to\s+live)\b/i,
  },

  // Plan disclosure (parent or child, with various verbs)
  { cat: CRISIS_CATEGORIES.SUICIDAL_PARENT, re: /\b(i\s+have\s+a\s+plan(\s+for\s+how|\s+to)?)\b/i },

  // Persistent intrusive SI ("keep thinking about killing/dying")
  {
    cat: CRISIS_CATEGORIES.SUICIDAL_PARENT,
    re: /\b(keep|keeps|kept)\s+thinking\s+about\s+(kill\w*\s*(myself|himself|herself|themselves)?|dying|die|end\w*\s*(it|my\s+life|my\s+story))\b/i,
  },

  // Self-harm
  {
    cat: CRISIS_CATEGORIES.SELF_HARM,
    re: /\b(hurting\s+myself|cutting\s+myself|cutting\s+my|burning\s+myself|hitting\s+myself|i\s+cut|i\s+burn\s+myself|self[- ]?harm|i\s+want\s+to\s+hurt\s+myself|i\s+caught\s+myself\s+cutting|cutting\s+again)\b/i,
  },

  // Harm to child (parent admitting)
  {
    cat: CRISIS_CATEGORIES.HARM_TO_CHILD,
    re: /\b(i\s+(hit|kicked|punched|slapped|grabbed|shoved|shook|threw|smacked)\s+(him|her|them|my\s+(son|daughter|kid|child|baby))|i\s+left\s+a\s+mark|i\s+bruised|i\s+couldn'?t\s+stop\s+hitting|i\s+lost\s+control\s+and\s+(hit|kicked|slapped|grabbed)|i\s+shook\s+the\s+baby|i\s+shook\s+(him|her|my\s+baby|my\s+son|my\s+daughter))\b/i,
  },

  // Abuse disclosure (parent disclosing or hinting past abuse,
  // or witnessing abuse of someone else).
  {
    cat: CRISIS_CATEGORIES.ABUSE_DISCLOSURE,
    re: /\b(someone'?s?\s+(hurting|hitting|touching)\s+(my\s+)?(child|kid|son|daughter|baby)|my\s+(partner|husband|boyfriend|girlfriend|wife|ex)\s+(is\s+)?(hurting|hitting|touching|raping|molesting|abusing)|i\s+was\s+(sexually\s+)?(abused|molested|raped)\s+(as\s+a\s+(kid|child)|when\s+i\s+was)|my\s+(dad|mom|parent)\s+(sexually\s+)?(abused|molested)\s+me|i\s+was\s+touched\s+inappropriately|someone\s+is\s+hurting(\s+(and\s+i\s+don'?t\s+know\s+how\s+to\s+help|\s+them|\s+him|\s+her|\s+my))?)\b/i,
  },

  // Child suicidal ideation or self-harm
  {
    cat: CRISIS_CATEGORIES.SUICIDAL_CHILD,
    re: /\b(my\s+\d+\s*-\s*year\s*-\s*old\s+(said|says|told\s+me)\s+.{0,80}(wants?\s+to\s+die|kill\s+(himself|herself|themselves)|killed?\s+(himself|herself|themselves)|suicide|suicidal|hurt\s+(himself|herself|themselves|him|her|them)|cutting\s+(himself|herself|themselves))|my\s+(son|daughter|kid|child)\s+(said|says|told\s+me\s+(they|he|she|i))\s+.{0,80}(wants?\s+to\s+die|kill\s+(himself|herself|themselves)|killed?\s+(himself|herself|themselves)|suicide|suicidal|hurt\s+(himself|herself|themselves|him|her|them)|cutting\s+(himself|herself|themselves))|my\s+(son|daughter|kid|child)\s+(wants|wanted)\s+to\s+die|my\s+(son|daughter|kid|child)\s+(is|are|has\s+been|[\u2019']?s\s+been)\s+(cutting|hurting)\s+(themselves|himself|herself)|my\s+(son|daughter|kid|child)\s+.{0,30}\s+been\s+(cutting|hurting)\s+(themselves|himself|herself))\b/i,
  },

  // Intimate partner violence (parent is the victim)
  {
    cat: CRISIS_CATEGORIES.IPV,
    re: /\b(my\s+(partner|husband|boyfriend|girlfriend|wife|ex)\s+(hits?|kicks?|beats?|chokes?)\s+me|i'?m\s+(scared|afraid)\s+of\s+my\s+(partner|husband|boyfriend|girlfriend|wife|ex)|i\s+have\s+to\s+hide\s+(my|the)\s+(bruises?|injuries?|money)|he\s+(won'?t|will\s+not)\s+let\s+me\s+(leave|go|work)|i'?m\s+being\s+controlled)\b/i,
  },

  // Coercion / privacy breach hint
  {
    cat: CRISIS_CATEGORIES.COERCION,
    re: /\b((don'?t|do\s+not)\s+tell\s+(anyone|my\s+(husband|wife|partner|therapist|doctor))|(promise|swear)(\s+me)?\s+you\s+won'?t\s+tell|this\s+is\s+(just\s+)?between\s+us|keep\s+(it|this)\s+(secret|quiet)|don'?t\s+tell\s+(anyone|my\s+(wife|husband))|told\s+me\s+not\s+to\s+tell\s+(anyone|anybody))\b/i,
  },

  // Diagnostic seeking (out of scope) — widened to first-person
  // "I think" form and to alternate phrasings Mira flagged.
  {
    cat: CRISIS_CATEGORIES.DIAGNOSTIC_SEEKING,
    re: /\b((do\s+you|i)\s+think\s+my\s+(child|kid|son|daughter|teen)\s+(has|have|might\s+have|could\s+have)\s+(adhd|autism|asd|odd|anxiety|depression|bipolar|ptsd|conduct\s+disorder)|does\s+my\s+(child|kid)\s+have\s+(adhd|autism|odd)|what\s+medication\s+(should|do|would|can)\s+(i|my\s+(son|daughter|kid|child))\s+(take|be\s+on|use)|should\s+(i|my\s+(child|kid|son|daughter))\s+(be\s+on|try|take)\s+(medication|meds)|(does|do)\s+my\s+(son|daughter|kid|child)\s+have\s+(adhd|autism|odd))\b/i,
  },
];

// ── Indirect phrasing — high-risk FOR suicidal ideation ────────────
// These don't mention suicide directly but are well-documented
// red flags in clinical suicide-prevention training:
//   https://www.suicideinfo.ca/coping-and-support/indirect-warning-signs/
//
// Pattern format: must combine a "tiredness" or "ending" word with
// a present-tense, cumulative-weight phrase.
//
// "can't do this anymore today" is the canonical false-positive case:
// a parent who is overwhelmed in the moment but NOT suicidal.
// We avoid flagging it by requiring the phrase to co-occur with a
// cumulative-scope marker ("everything", "this", "it", "anymore")
// AND absence of a day-scope (today/tonight/this morning).
const INDIRECT_PATTERNS = [
  // "Tired/exhausted of everything" — direct cumulative-scope match.
  /\b(tired|exhausted)\s+of\s+everything\b/i,

  // "I want to die / can't keep going" (NOT "can't do this anymore today")
  // — accept "this/it/any of this" without "today/tonight" attached.
  /\b(can'?t|cannot)\s+keep\s+going\b/i,
  /\b(can'?t|cannot)\s+go\s+on\s+(any\s*more|like\s+this)\b/i,

  // Cumulative-scope "this" / "everything" / "all of this"
  /\b(can'?t|cannot)\s+do\s+(this|it|any\s*of\s*this)\s+any\s*more\b/i,

  // "Done with everything" / "nothing matters" / "what's the point"
  /\b(done\s+with\s+everything|nothing\s+matters\s+anymore|what'?s\s+the\s+point|what\s+is\s+the\s+point)\b/i,

  // Sleep-and-never-wake / "wouldn't mind if I didn't wake up"
  /\b(no\s+point\s+(in\s+)?(continuing|living|waking\s+up|trying))\b/i,
  /\bwouldn[\u2019']?t\s+mind\s+if\s+i\s+didn[\u2019']?t\s+wake\s+up\b/i,
  /\b(wish\s+i\s+could\s+(just\s+)?sleep\s+and\s+never\s+wake)\b/i,

  // Burden / not-wanted / better-off-without-me
  /\b(everyone\s+would\s+be\s+better\s+off\s+without\s+me)\b/i,
  /\b(wish\s+i\s+wasn'?t\s+here|i\s+shouldn'?t\s+have\s+been\s+born|nobody\s+(would\s+)?miss\s+me\s+if\s+i\s+was\s+gone)\b/i,

  // Giving up / nothing to live for
  /\b(giving\s+(up|it\s+all\s+up)|nothing\s+to\s+live\s+for|no\s+reason\s+to\s+(live|keep\s+going))\b/i,
];

// ── "Not today" filter — single-day phrasing should not flag ───────
//
// A parent who writes "I can't do this anymore today" is overwhelmed
// in the moment, not suicidal. We accept the phrase but apply a
// post-match filter: if the situation text contains a single-day
// scope ("today", "tonight", "this morning", "right now alone"),
// downgrade the trigger to nothing.
//
// This is implemented in `detectCrisisTrigger` below.
//
// Indirect phrases exempt from the "today" filter (because they're
// cumulative-scope by construction):
//   - "tired of everything"
//   - "wish I could sleep and never wake"
//   - "everyone would be better off without me"
//   - "wish I wasn't here"
//   - "giving up"
//   - "nothing to live for"
//   - "done with everything"
//   - "nothing matters anymore"
//   - "what's the point"
//   - "no reason to live"
//
// Phrases WHERE "today" can downgrade:
//   - "can't do this anymore"        → contains "do (this|it|...|any of this) anymore"
//   - "can't keep going"
//   - "can't go on anymore"
//   - "wouldn't mind if I didn't wake up"
//
// Implementation: detectCrisisTrigger first finds the matching indirect
// pattern, then checks if (a) the match was a day-scope phrase AND (b)
// the surrounding text only contains a single-day-scope token — if so,
// skip the flag.
const DAY_SCOPE_REGEX = /\b(today|tonight|this\s+morning|right\s+now\s+alone|just\s+today)\b/i;
const DOWNGRADEABLE_INDIRECT_INDICES = new Set([
  1, // "can't keep going"
  2, // "can't go on anymore/like this"
  3, // "can't do (this|it|any of this) any more"
  5, // "no point in (continuing|living|waking up|trying)"
  6, // "wouldn't mind if I didn't wake up"
  7, // "wish I could (just) sleep and never wake"
]);

// ── Detective helper ────────────────────────────────────────────────
export function detectCrisisTrigger(situation) {
  if (typeof situation !== 'string' || !situation.trim()) return null;
  const text = situation;

  // Negative guards first — figurative / accidental / minor phrasings
  // that should never trigger. (See AUDIT TRAIL at top of file.)
  if (!passesNegativeGuards(text)) return null;

  // Direct patterns first — these are unambiguous.
  for (const { cat, re } of DIRECT_PATTERNS) {
    if (re.test(text)) {
      return { category: cat, indirect: false, matchSource: 'direct' };
    }
  }
  // Indirect patterns — flag as well; route to the same verbatim
  // response but flag as `indirect: true` so we can log/anonymized-
  // measure false-positive rate later.
  for (let i = 0; i < INDIRECT_PATTERNS.length; i++) {
    if (INDIRECT_PATTERNS[i].test(text)) {
      // Downgrade day-scope phrases. If the parent's situation
      // mentions "today" / "tonight" / "this morning" / "right now
      // alone", they are overwhelmed in the moment but not
      // suicidal. Skip the flag — let the AI coach respond.
      if (DOWNGRADEABLE_INDIRECT_INDICES.has(i) && DAY_SCOPE_REGEX.test(text)) {
        return null;
      }
      return {
        category: CRISIS_CATEGORIES.SUICIDAL_PARENT,
        indirect: true,
        matchSource: 'indirect',
      };
    }
  }
  return null;
}

// ── Wire shape returned by shieldSituation ──────────────────────────
// Mirrors the CoachResponse shape the rest of the app already
// knows how to render — but the steps[] is the single verbatim
// CRISIS_RESPONSE_TEXT (one block, no numbering) and the safetyNote
// is the SCOPE_DISCLOSURE.
//
// `locale` (default 'en-US') selects the human-reviewed translation.
// Unknown locales throw — per Mira's protocol we never auto-translate.
// Returns a CoachingResponse matching @parentscript/shared types.
// This ensures crisis responses follow the same shape as regular coaching responses.
export function crisisResponsePayload(locale = DEFAULT_LOCALE) {
  const loc = getLocale(locale);
  return {
    risk_level: 'high',
    empathy: 'You are not alone. Help is available right now.',
    steps: [
      'Pause what you are doing.',
      loc.crisis,
      'Tell someone you trust: a friend, family member, or your therapist.',
    ],
    safety_note: loc.scope,
    safetyNote: loc.scope, // camelCase mirror for client/SPA consumers (tests + UI surface tests)
    crisis_response: true, // Canonical API flag (CoachingResponse type)
    _crisis: true, // UI-only marker — kept for legacy client + surface-tests compatibility
  };
}

// ── Top-level helper for /api/coach ─────────────────────────────────
export function shieldSituation(situation, locale = DEFAULT_LOCALE) {
  const trigger = detectCrisisTrigger(situation);
  if (!trigger) return { safe: true };
  return {
    safe: false,
    category: trigger.category,
    indirect: trigger.indirect,
    response: crisisResponsePayload(locale),
  };
}
