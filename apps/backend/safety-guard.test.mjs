// ============================================================
// Safety-guard smoke test (Node-only, no test framework)
// ============================================================
//
// Run: node api/safety-guard.test.mjs
//
// Tests the verbatim trigger patterns against the same lists Mira
// (mira profile) authored in the kanban task body. Not exhaustive
// — Sherlock's QA pass builds the full 50-phrasing test set.
//
// Exit code 0 = all pass. Non-zero = at least one fail (and the
// script prints which).
// ============================================================

import {
  detectCrisisTrigger,
  shieldSituation,
  crisisResponsePayload,
  CRISIS_RESPONSE_TEXT,
  SCOPE_DISCLOSURE_TEXT,
} from './safety-guard.mjs'

let pass = 0
let fail = 0
const failures = []

function expect(label, cond) {
  if (cond) {
    pass++
    console.log('  ✅', label)
  } else {
    fail++
    failures.push(label)
    console.log('  ❌', label)
  }
}

function it(name, fn) {
  console.log('\n' + name)
  fn()
}

// ── Direct triggers (must catch) ─────────────────────────────────
it('catches direct suicidal ideation (parent)', () => {
  const cases = [
    'i want to die',
    "I want to kill myself",
    "I wish I was dead",
    "suicide",
    "i'm suicidal",
    "I want to end it all",
    "end my life",
  ]
  for (const text of cases) {
    const t = detectCrisisTrigger(text)
    expect(`"${text}" → flag`, !!t)
  }
})

it('catches self-harm', () => {
  const cases = [
    "i've been hurting myself",
    "cutting myself",
    "i cut my arm",
    "burning myself tonight",
  ]
  for (const text of cases) {
    const t = detectCrisisTrigger(text)
    expect(`"${text}" → flag`, !!t)
  }
})

it('catches harm-to-child (parent admitting)', () => {
  const cases = [
    "I hit him and I can't stop",
    "i lost control and slapped my son",
    "i left a mark on her last night",
    "I shook my baby",
  ]
  for (const text of cases) {
    const t = detectCrisisTrigger(text)
    expect(`"${text}" → flag (${t && t.category})`, !!t)
  }
})

it('catches abuse disclosure', () => {
  const cases = [
    "Someone's hurting my child",
    "my partner is hitting my son",
    "i was molested as a child",
    "I was touched inappropriately by my dad",
  ]
  for (const text of cases) {
    const t = detectCrisisTrigger(text)
    expect(`"${text}" → flag (${t && t.category})`, !!t)
  }
})

it('catches child suicidal ideation', () => {
  const cases = [
    "my son said he wants to die",
    "my daughter told me she wants to kill herself",
    "my kid is hurting himself",
  ]
  for (const text of cases) {
    const t = detectCrisisTrigger(text)
    expect(`"${text}" → flag (${t && t.category})`, !!t)
  }
})

it('catches IPV (parent is victim)', () => {
  const cases = [
    "my partner hits me",
    "I'm afraid of my boyfriend",
    "I have to hide my bruises",
    "he won't let me leave",
  ]
  for (const text of cases) {
    const t = detectCrisisTrigger(text)
    expect(`"${text}" → flag (${t && t.category})`, !!t)
  }
})

it('catches coercion / privacy breach', () => {
  const cases = [
    "promise you won't tell",
    "don't tell my husband",
    "this is just between us",
    "keep this secret",
  ]
  for (const text of cases) {
    const t = detectCrisisTrigger(text)
    expect(`"${text}" → flag (${t && t.category})`, !!t)
  }
})

it('catches diagnostic-seeking', () => {
  const cases = [
    "do you think my kid has ADHD?",
    "does my child have autism",
    "what medication should I be on",
    "should my child be on medication",
  ]
  for (const text of cases) {
    const t = detectCrisisTrigger(text)
    expect(`"${text}" → flag (${t && t.category})`, !!t)
  }
})

// ── Indirect phrasing (must catch, flagged as indirect:true) ──────
it('catches indirect high-risk phrasing', () => {
  const cases = [
    "i'm just so tired of everything",
    "I can't do this anymore",
    "what's the point of any of this",
    "I wouldn't mind if I didn't wake up",
    "no point in continuing",
    "nothing to live for anymore",
    "wish I could sleep and never wake",
    "everyone would be better off without me",
    "i'm giving up",
  ]
  for (const text of cases) {
    const t = detectCrisisTrigger(text)
    expect(`"${text}" → flag (indirect=${t && t.indirect})`, !!t && t.indirect === true)
  }
})

// ── Must NOT flag (avoid false positives) ─────────────────────────
it('does NOT flag normal parenting situations', () => {
  const cases = [
    "My son threw his backpack and slammed his door when I told him to do homework",
    "My 3-year-old is having a tantrum because we won't buy a toy",
    "My 8-year-old refuses to brush his teeth",
    "I'm exhausted from work today",
    "I can't do this anymore today (no other trigger language)",
    "I yelled at my kid and I feel terrible about it",
    "My daughter said she's sad that grandma died",
    "My son is being mean to his sister again",
  ]
  // Note: "I'm exhausted" by itself should NOT flag — only the
  // indirect phrasing "tired of everything" should.
  for (const text of cases) {
    const t = detectCrisisTrigger(text)
    expect(`"${text}" → no flag`, !t)
  }
})

// ── shieldSituation integrates correctly ─────────────────────────
it('shieldSituation returns safe:true for benign input', () => {
  const r = shieldSituation("My kid won't eat dinner")
  expect('safe:true', r.safe === true)
  expect('no response', !('response' in r))
})

it('shieldSituation returns verbatim response for triggered input', () => {
  const r = shieldSituation('I want to die')
  expect('safe:false', r.safe === false)
  expect('has category', !!r.category)
  expect('has response object', !!r.response)
  // Server shape matches the @parentscript/shared CoachingResponse type
  // (snake_case). The client mirror in apps/web/src/lib/safety.ts adds
  // a custom `_crisis: true` flag for the UI — that's a client-only
  // concern. See types.ts in packages/shared.
  expect('crisis_response flag set', r.response.crisis_response === true)
  expect('contains 988', r.response.steps.some(s => s.includes('988')))
  expect('contains 911', r.response.steps.some(s => s.includes('911')))
  expect('contains Childhelp', r.response.steps.some(s => s.includes('1-800-422-4453')))
  expect('contains DV hotline', r.response.steps.some(s => s.includes('1-800-799-SAFE')))
})

// ── Verbatim strings are immutable ───────────────────────────────
it('CRISIS_RESPONSE_TEXT contains the four mandatory U.S. numbers', () => {
  expect('contains 988', CRISIS_RESPONSE_TEXT.includes('988'))
  expect('contains 911', CRISIS_RESPONSE_TEXT.includes('911'))
  expect('contains Childhelp 1-800-422-4453', CRISIS_RESPONSE_TEXT.includes('1-800-422-4453'))
  expect('contains HOME to 741741', CRISIS_RESPONSE_TEXT.includes('741741'))
  expect('contains NDVH 1-800-799-SAFE', CRISIS_RESPONSE_TEXT.includes('1-800-799-SAFE'))
})

it('SCOPE_DISCLOSURE_TEXT mentions tool vs. therapy', () => {
  expect('mentions parenting support tool', SCOPE_DISCLOSURE_TEXT.includes('parenting support tool'))
  expect('mentions not therapy', SCOPE_DISCLOSURE_TEXT.includes('not therapy'))
  expect('mentions not a crisis service', SCOPE_DISCLOSURE_TEXT.includes('not a crisis service'))
})

it('crisisResponsePayload has the right shape', () => {
  const r = crisisResponsePayload()
  // Server shape is snake_case to match the shared CoachingResponse
  // type. See packages/shared/src/types.ts.
  expect('crisis_response true', r.crisis_response === true)
  expect('3 steps', r.steps.length === 3)
  expect('safety_note = SCOPE_DISCLOSURE_TEXT', r.safety_note === SCOPE_DISCLOSURE_TEXT)
})

// ── Summary ───────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) {
  console.log('\nFailing cases:')
  for (const f of failures) console.log('  -', f)
  process.exit(1)
}
