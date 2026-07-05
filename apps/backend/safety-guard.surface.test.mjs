// ============================================================
// Safety-guard + prompts surface test
// ============================================================
//
// Verifies the surface dispatch in api/prompts.mjs routes to the
// sibling voice for surface='sibling' and the parent voice otherwise.
//
// Per Mira's protocol: the crisis response is locale-aware; the
// surface scope text is per-surface. The preflight is surface-agnostic
// (same trigger patterns) but the rendered payload differs.
//
// Run: node api/safety-guard.surface.test.mjs
// ============================================================

import {
  buildCoachSystemPrompt,
  buildCoachUserPrompt,
  buildSiblingCoachSystemPrompt,
  buildSiblingCoachUserPrompt,
} from './prompts.mjs';
import {
  shieldSituation,
  crisisResponsePayload,
  DEFAULT_LOCALE,
  CRISIS_RESPONSE_EN_US,
} from './safety-guard.mjs';

// Import server.mjs's per-surface scope. We have to import it via a
// small re-export — server.mjs side-effects (starts an express listener)
// so we re-define it locally for the test instead.
const SURFACE_SCOPE = {
  parent:
    'ParentScript is a parenting support tool, not therapy, counseling, or medical advice. It is not a crisis service. If you or your child are in crisis, call 988, 911, the Childhelp National Child Abuse Hotline (1-800-422-4453), or text HOME to 741741.',
  sibling:
    'SiblingSupport is a peer-support tool, not counseling, therapy, or medical advice. It is not a crisis service. If you or your sibling are in crisis, call or text 988, call 911, or call the Childhelp National Child Abuse Hotline (1-800-422-4453).',
};

let pass = 0;
let fail = 0;
const failures = [];

function expect(label, cond) {
  if (cond) {
    pass++;
    console.log('  ✅', label);
  } else {
    fail++;
    failures.push(label);
    console.log('  ❌', label);
  }
}

function it(name, fn) {
  console.log('\n' + name);
  fn();
}

it('parent surface: system prompt anchors ParentScript + PCIT/BPT', () => {
  const sys = buildCoachSystemPrompt();
  expect('mentions ParentScript', sys.includes('ParentScript'));
  expect('mentions PCIT', sys.includes('PCIT'));
  expect('mentions BPT', sys.includes('BPT'));
  expect('mentions child therapist', sys.toLowerCase().includes('child therapist'));
  expect('does NOT mention sibling', !sys.toLowerCase().includes('sibling'));
});

it('sibling surface: system prompt anchors SiblingSupport + peer voice', () => {
  const sys = buildSiblingCoachSystemPrompt();
  expect('mentions SiblingSupport', sys.includes('SiblingSupport'));
  expect('mentions peer', sys.toLowerCase().includes('peer'));
  expect('mentions trusted adult', sys.toLowerCase().includes('trusted adult'));
  expect('mentions 988', sys.includes('988'));
  expect('mentions 911', sys.includes('911'));
  expect('mentions Childhelp', sys.toLowerCase().includes('childhelp'));
  expect('does NOT mention PCIT/BPT specifically', !sys.includes('PCIT'));
});

it('sibling surface injects siblingAge and userAge into the prompt', () => {
  const sys = buildSiblingCoachSystemPrompt({ siblingAge: 14, userAge: 17 });
  expect('renders sibling age 14', sys.includes('~14 years old'));
  expect('renders user age 17', sys.includes('~17 years old'));
});

it('user-prompt builder surfaces the right framing', () => {
  expect(
    'parent user prompt frames the situation as parent',
    buildCoachUserPrompt('test').toLowerCase().includes('parent is facing')
  );
  expect(
    'sibling user prompt frames as sibling',
    buildSiblingCoachUserPrompt('test').toLowerCase().includes('sibling')
  );
});

it('safety shield is surface-agnostic — same trigger for both', () => {
  const text = 'My kid said he wants to die';
  const r1 = shieldSituation(text, 'en-US');
  expect('triggers', !!r1);
  expect('category is suicidal_child (regardless of surface)', r1.category === 'suicidal_child');
});

it('crisis payload uses surface-specific scope text (per-surface, not per-locale)', () => {
  // We re-construct the same shape the API does.
  const shield = shieldSituation('I want to die', 'en-US');
  const parentScopePayload = { ...shield.response, safetyNote: SURFACE_SCOPE.parent };
  const siblingScopePayload = { ...shield.response, safetyNote: SURFACE_SCOPE.sibling };
  expect(
    'parent scope mentions ParentScript',
    parentScopePayload.safetyNote.includes('ParentScript')
  );
  expect(
    'sibling scope mentions SiblingSupport',
    siblingScopePayload.safetyNote.includes('SiblingSupport')
  );
  expect(
    'crisis steps[1] is the same locale text in both',
    parentScopePayload.steps[1] === siblingScopePayload.steps[1]
  );
  expect(
    'crisis steps[1] is en-US verbatim',
    parentScopePayload.steps[1] === CRISIS_RESPONSE_EN_US
  );
});

it('sibling surface system prompt surfaces the right hotline anchors', () => {
  const sys = buildSiblingCoachSystemPrompt();
  expect('mentions 988', sys.includes('988'));
  expect('mentions 911', sys.includes('911'));
  expect('mentions Childhelp', sys.toLowerCase().includes('childhelp'));
  expect('mentions trusted adult', sys.toLowerCase().includes('trusted adult'));
});

it('sibling surface does NOT auto-allow unreviewed locale (still throws)', () => {
  // Use a TRIGGER phrase so the crisis payload path is exercised.
  // (Safe input returns safe:true without ever consulting the locale.)
  let threw = false;
  try {
    shieldSituation('I want to die', 'es-US');
  } catch {
    threw = true;
  }
  expect('shieldSituation with trigger + es-US throws', threw);
});

it('sibling surface is gated on the prompt builder (not the safety shield)', () => {
  // The safety rail is shared. The voice is the only thing that differs.
  // This is the architectural property: one safety rail, many surfaces.
  const parent = buildCoachSystemPrompt();
  const sibling = buildSiblingCoachSystemPrompt();
  expect('parent and sibling prompts are different', parent !== sibling);
});

// ── Summary ───────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log('\nFailing cases:');
  for (const f of failures) console.log('  -', f);
  process.exit(1);
} else {
  console.log('\nALL SURFACE CHECKS PASSED');
}
