// ============================================================
// Safety-guard locale test
// ============================================================
//
// Verifies the localization registry rejects unreviewed locales
// and that the en-US payload still matches the verbatim text.
//
// Per Mira's protocol: crisis responses must NEVER be auto-translated.
// Translation is a hand-reviewed clinical step. The test enforces this.
//
// Run: node api/safety-guard.locale.test.mjs
// ============================================================

import {
  LOCALES,
  DEFAULT_LOCALE,
  listLocales,
  getLocale,
  getCrisisResponse,
  getScopeDisclosure,
  crisisResponsePayload,
  shieldSituation,
  CRISIS_RESPONSE_EN_US,
  SCOPE_DISCLOSURE_EN_US,
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

it('registry is frozen and only en-US is registered', () => {
  expect('listLocales() includes en-US', listLocales().includes('en-US'))
  expect('DEFAULT_LOCALE is en-US', DEFAULT_LOCALE === 'en-US')
  expect('only en-US registered at this point', listLocales().length === 1)
  // Per Mira's protocol, es-US is PENDING and must NOT be auto-shipped.
  expect('es-US is NOT yet registered (Mira review pending)', !listLocales().includes('es-US'))
})

it('getCrisisResponse(en-US) returns the verbatim Mira-approved text', () => {
  expect('matches CRISIS_RESPONSE_EN_US', getCrisisResponse('en-US') === CRISIS_RESPONSE_EN_US)
  expect('contains 988', getCrisisResponse('en-US').includes('988'))
  expect('contains 911', getCrisisResponse('en-US').includes('911'))
  expect('contains Childhelp', getCrisisResponse('en-US').includes('1-800-422-4453'))
  expect('contains Crisis Text Line', getCrisisResponse('en-US').includes('741741'))
  expect('contains NDVH', getCrisisResponse('en-US').includes('1-800-799-SAFE'))
})

it('getScopeDisclosure(en-US) returns the Mira-approved scope text', () => {
  expect('matches SCOPE_DISCLOSURE_EN_US', getScopeDisclosure('en-US') === SCOPE_DISCLOSURE_EN_US)
  expect('mentions parenting support tool', getScopeDisclosure('en-US').includes('parenting support tool'))
  expect('mentions not therapy', getScopeDisclosure('en-US').includes('not therapy'))
  expect('mentions not a crisis service', getScopeDisclosure('en-US').includes('not a crisis service'))
})

it('getCrisisResponse() defaults to en-US', () => {
  expect('default matches en-US', getCrisisResponse() === CRISIS_RESPONSE_EN_US)
})

it('throws on unreviewed locale (es-US) — Mira protocol', () => {
  let threw = false
  try {
    getCrisisResponse('es-US')
  } catch (e) {
    threw = true
    expect('error message mentions clinical review', e.message.includes('human-reviewed'))
    expect('error message mentions Mira', e.message.toLowerCase().includes('clinical'))
    expect('error message lists available locales', e.message.includes('en-US'))
  }
  expect('getCrisisResponse("es-US") throws', threw)
})

it('throws on bogus locale (xx-ZZ) — Mira protocol', () => {
  let threw = false
  try { getCrisisResponse('xx-ZZ') } catch { threw = true }
  expect('getCrisisResponse("xx-ZZ") throws', threw)
})

it('crisisResponsePayload(locale) wires the right text', () => {
  const p = crisisResponsePayload('en-US')
  expect('steps[1] is the verbatim crisis response', p.steps[1] === CRISIS_RESPONSE_EN_US)
  expect('safetyNote is the scope disclosure', p.safetyNote === SCOPE_DISCLOSURE_EN_US)
  expect('_crisis flag is true', p._crisis === true)
})

it('shieldSituation(text, locale) returns the right locale payload', () => {
  const r = shieldSituation('I want to die', 'en-US')
  expect('safe:false', r.safe === false)
  expect('response.steps[1] is en-US crisis text', r.response.steps[1] === CRISIS_RESPONSE_EN_US)
})

it('shieldSituation(text, es-US) throws — refuses to auto-translate', () => {
  let threw = false
  try {
    shieldSituation('I want to die', 'es-US')
  } catch {
    threw = true
  }
  expect('shieldSituation with es-US throws', threw)
})

it('locale registry entries are frozen (no runtime mutation)', () => {
  const entry = LOCALES['en-US']
  expect('entry is frozen', Object.isFrozen(entry))
  let mutationThrew = false
  try {
    entry.crisis = 'tampered'
  } catch {
    mutationThrew = true
  }
  expect('mutation throws (frozen) — or at least does not stick', mutationThrew || entry.crisis === CRISIS_RESPONSE_EN_US)
})

// ── Summary ───────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) {
  console.log('\nFailing cases:')
  for (const f of failures) console.log('  -', f)
  process.exit(1)
} else {
  console.log('\nALL LOCALE CHECKS PASSED')
}
