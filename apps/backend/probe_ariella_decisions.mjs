// Independent probe of the 3 Ariella-flagged under-trigger patterns.
// Verifies the review's claims against the current safety-guard.mjs.
//
// Run: node probe_ariella_decisions.mjs

import { detectCrisisTrigger } from './safety-guard.mjs'

const cases = [
  // F-3: I22 past-tense generic abuse ("Someone hurt me when I was little")
  { id: 'F-3a', text: "Someone hurt me when I was little.", expectTrig: true,  category: 'abuse_disclosure', note: 'review claim: MISSES' },
  { id: 'F-3b', text: "Someone was hurting me as a kid.",    expectTrig: true,  category: 'abuse_disclosure', note: 'review claim: MISSES (alt form)' },
  { id: 'F-3c', text: "Someone hurt me back then.",         expectTrig: true,  category: 'abuse_disclosure', note: 'review claim: MISSES' },
  { id: 'F-3d', text: "I was abused as a kid and I don't want to repeat it.", expectTrig: true, category: 'abuse_disclosure', note: 'canonical I22 — must still trigger' },

  // Negative guards for F-3: grandparent/benign "hurt" past tense
  { id: 'F-3e', text: "My parents hurt me when I was little.", expectTrig: true,  category: 'abuse_disclosure', note: 'past-perpetrator — should trigger' },
  { id: 'F-3f', text: "I scraped my knee when I was little.", expectTrig: false, category: null,             note: 'benign reflection — should NOT' },
  { id: 'F-3g', text: "Someone yelled at me when I was little.", expectTrig: false, category: null,           note: 'edge — verbal, lower signal; review says softer past-tense so this may trigger. Worth discussing.' },
  { id: 'F-3h', text: "Someone hurt me back in the day.", expectTrig: false, category: null,                 note: 'edge — vague time marker vs. canonical' },

  // F-4: I28 past-tense IPV-witnessing
  { id: 'F-4a', text: "I saw my friend being hurt by her partner.", expectTrig: true, category: 'abuse_disclosure', note: 'review claim: MISSES (past-participle passive)' },
  { id: 'F-4b', text: "I saw someone being hit by their boyfriend.", expectTrig: true, category: 'abuse_disclosure', note: 'past-participle passive — wider' },
  { id: 'F-4c', text: "I saw my friend's husband hitting her.",   expectTrig: true, category: 'abuse_disclosure', note: 'past-tense active — should trigger' },
  { id: 'F-4d', text: "Someone is hurting and I don't know how to help.", expectTrig: true, category: 'abuse_disclosure', note: 'canonical I28 — must still trigger' },

  // Negative guards for F-4
  { id: 'F-4e', text: "I saw someone being healed by the doctors after the accident.", expectTrig: false, category: null, note: 'past-participle but passive (medical), not IPV' },
  { id: 'F-4f', text: "My friend was hurting after the accident.", expectTrig: false, category: null, note: 'physical-pain guard should suppress' },

  // F-5: E38 age threshold (Dov question: tighten 4 only vs. loosen 4-7)
  { id: 'F-5a', text: "My 4-year-old told me he wants to die because he can't have ice cream.", expectTrig: false, category: null, note: '4yo — current 4-6 guard suppresses' },
  { id: 'F-5b', text: "My 5-year-old said she wants to die.",          expectTrig: false, category: null, note: '5yo — current 4-6 guard suppresses' },
  { id: 'F-5c', text: "My 6-year-old told me she wants to die.",        expectTrig: false, category: null, note: '6yo — current 4-6 guard suppresses' },
  { id: 'F-5d', text: "My 7-year-old said he wants to die.",            expectTrig: true,  category: 'child_suicidal_ideation', note: '7yo — currently triggers (no E38 suppression)' },
  { id: 'F-5e', text: "My 3-year-old said he wants to die.",            expectTrig: true,  category: 'child_suicidal_ideation', note: '3yo — triggers (out of guard window, parity error)' },
]

let pass = 0
let fail = 0
const failures = []

for (const c of cases) {
  const t = detectCrisisTrigger(c.text)
  const trig = !!t
  const trigOk = trig === c.expectTrig
  if (trigOk) {
    pass++
    console.log(`  ✅ ${c.id}  trig=${trig}  note=${c.note}`)
  } else {
    fail++
    failures.push(c)
    console.log(`  ❌ ${c.id}  trig=${trig} (expected ${c.expectTrig})  note=${c.note}  text="${c.text}"`)
  }
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) {
  console.log('\nFailing cases (independent verification of review):')
  for (const f of failures) console.log(`  - ${f.id}: "${f.text}"  note=${f.note}`)
}
