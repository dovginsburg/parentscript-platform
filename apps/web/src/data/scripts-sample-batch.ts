// ============================================================
// ParentScript — First content batch (5 sample scripts)
// ============================================================
//
// Authored by Mira (clinical psychology, 2026-06-30). Sourced from
// kanban task t_clin_1782815154 / t_clin_gary_1782815200.
//
// Each script carries the metadata Mira specified:
//   - modality       — the framework the script is grounded in
//                      (PCIT, BPT, CPS, DBT, Triple P, etc.)
//   - source_age_band — { min, max } the script is calibrated for
//   - principle_citation — short form citation of the source
//                      framework's principle(s)
//   - equity         — flags verifying the script works across
//                      cultural, IPV, neurodivergent, single-parent,
//                      and LGBTQ+ contexts (all TRUE by default)
//   - published      — false in this file; flip when reviewed by
//                      Sherlock (clinical QA) AND a licensed
//                      therapist. Do not auto-publish.
//
// These scripts are reference content for the In-the-Moment flow.
// They are NOT yet rendered in the production app — they are
// structured for review and ready to be loaded into Supabase
// (skills table) once Sherlock completes the QA pass.
//
// To seed: copy each entry into 003_seed_skills.sql (or a new
// migration 009_script_batch_1.sql). Use the `say_this` field
// for in-app rendering, `safety_warning` for the parent-facing
// caveat panel.
// ============================================================

export type Modality = 'PCIT' | 'BPT' | 'CPS' | 'DBT' | 'Triple P' | 'CBT' | 'Circle of Security';

export interface ScriptMetadata {
  modality: Modality;
  source_age_band: { min: number; max: number }; // child age in years
  principle_citation: string;
  equity: {
    cultural_neutral: boolean;
    ipv_safe: boolean;
    neurodiv_aware: boolean;
    single_parent_safe: boolean;
    lgbtq_inclusive: boolean;
  };
  /** Reviewed by a licensed therapist? Default false. */
  published: boolean;
}

export interface ParentScript {
  /** Stable slug; will become a Supabase primary key field. */
  slug: string;
  /** Short title shown in skill lists / search. */
  title: string;
  /** Goal of the script in one sentence. */
  goal: string;
  /** When the parent should reach for this script. */
  use_when: string;
  /** Verbatim script text (parent-facing). */
  say_this: string;
  /** Anti-patterns / phrasing to avoid. */
  dont_say: string;
  /** Optional safety caveat surfaced in the parent UI. */
  safety_warning: string | null;
  metadata: ScriptMetadata;
}

export const SAMPLE_SCRIPT_BATCH: ParentScript[] = [
  // ── 1. Tantrum in 3yo — PCIT (Eyberg) ────────────────────────────
  {
    slug: 'tantrum-3yo-pcit',
    title: 'Tantrum in a 3-year-old',
    goal: 'Stay close and quiet until your child comes back to baseline, then reconnect with labeled praise.',
    use_when: 'Your 2–4 year old is screaming, flailing, or on the floor — no one is in danger.',
    say_this:
      "Crouch to their level. Speak low, slow, and short. \"I'm right here. I'll wait until you're ready.\" " +
      'Breathe out slowly so your body models calm. Once they soften — even a tiny bit — name it: "You stopped thrashing. That\'s hard work." ' +
      "Offer water. Offer a hug only if they reach for it; don't force one.",
    dont_say:
      'Don\'t lecture mid-tantrum ("Use your words," "Big kids don\'t cry"). Don\'t bargain ("If you stop, you can have…"). ' +
      "Don't threaten consequences during the storm — consequences land AFTER co-regulation.",
    safety_warning:
      'If your child is hitting themselves, head-banging hard enough to injure, or holding their breath to faint, ' +
      'this is beyond a tantrum. Call your pediatrician or 911.',
    metadata: {
      modality: 'PCIT',
      source_age_band: { min: 2, max: 4 },
      principle_citation:
        "Eyberg & Funderburk (2011), Parent-Child Interaction Therapy — CDI phase: 'Don't' skill + selective attention + labeled praise.",
      equity: {
        cultural_neutral: true,
        ipv_safe: true,
        neurodiv_aware: true,
        single_parent_safe: true,
        lgbtq_inclusive: true,
      },
      published: false,
    },
  },

  // ── 2. Defiant 8yo — BPT (Kazdin) + CPS (Greene) ─────────────────
  {
    slug: 'defiant-8yo-bpt-cps',
    title: "Defiant 8-year-old who won't listen",
    goal: 'Move from a power-struggle to a problem-solving conversation without giving in or escalating.',
    use_when: 'Your 6–10 year old refuses a reasonable request and escalates when you repeat it.',
    say_this:
      'Lower your voice and slow down. "I can see this feels unfair to you. I hear you." ' +
      'Then — not a question — one clear command: "Shoes on. We\'re leaving in two minutes." ' +
      'If the defiance continues, hold silence for 5 seconds. When any step forward happens — say it out loud: ' +
      '"You picked up your shoes. That\'s exactly what I needed."',
    dont_say:
      'Avoid long explanations, repeated commands, threats (\"no screen time for a week\"), or matching their volume. ' +
      'Don\'t "why" questions during defiance — they read as interrogation.',
    safety_warning:
      'If the defiance includes aggression toward people, pets, or property: pause this script. ' +
      'Move to safety first, then call your therapist before trying any parenting move.',
    metadata: {
      modality: 'BPT',
      source_age_band: { min: 6, max: 10 },
      principle_citation:
        'Kazdin (2008), Parent Management Training — clear commands + praise for compliance; ' +
        "Greene (2014), Collaborative & Proactive Solutions — 'kids do well if they can' — empathy before expectation.",
      equity: {
        cultural_neutral: true,
        ipv_safe: true,
        neurodiv_aware: true,
        single_parent_safe: true,
        lgbtq_inclusive: true,
      },
      published: false,
    },
  },

  // ── 3. Bedtime resistance, 4yo — BPT (Forehand) + PCIT overlay ───
  {
    slug: 'bedtime-4yo-bpt-pcit',
    title: 'Bedtime resistance at 4',
    goal: 'End the bedtime stalling pattern without yelling or screen bargaining.',
    use_when:
      'Your 3–5 year old keeps getting out of bed: "I need water," "one more story," "I scared."',
    say_this:
      'Walk them back silently, every time. No lecture, no extra hugs. The same script, every time: ' +
      '"It\'s sleep time. I\'m walking you back. I love you." ' +
      'If they stay — the first minute they\'re quiet, walk in and whisper: "You stayed in your bed. That\'s exactly what bedtime looks like." ' +
      'Then leave. No extra attention in between walks-back.',
    dont_say:
      'Avoid negotiating (\"one more story and then…\"). Avoid scolding when you walk them back. ' +
      "Don't add a new reward each night — it teaches that escalation works.",
    safety_warning:
      'If your child says they are scared of something specific (a noise, the dark, a person), ' +
      "this script doesn't address that. Acknowledge the fear out loud during the day and call your therapist.",
    metadata: {
      modality: 'BPT',
      source_age_band: { min: 3, max: 5 },
      principle_citation:
        "Forehand & Long (2010), Parent Training — 'extinction' for attention-maintained behaviors, " +
        'with PCIT-style labeled praise for compliant behavior.',
      equity: {
        cultural_neutral: true,
        ipv_safe: true,
        neurodiv_aware: true,
        single_parent_safe: true,
        lgbtq_inclusive: true,
      },
      published: false,
    },
  },

  // ── 4. Parent losing their temper — DBT-informed (Linehan) ───────
  {
    slug: 'parent-losing-temper-dbt',
    title: 'When YOU are about to lose your temper',
    goal: "Catch yourself before a reaction you'll regret — and repair after if it already happened.",
    use_when:
      "You notice your chest is tight, your voice is rising, or you're about to say something sharp.",
    say_this:
      'STEP 1 — Pause + name it: "I am at a 7/10. I need ten seconds." ' +
      'STEP 2 — Hand on belly, slow exhale longer than inhale. 4 cycles. ' +
      'STEP 3 — Return low: "I lost my temper just now. That wasn\'t okay. I\'m going to take a breath and we can try again." ' +
      '(Repair is part of the script, not optional.)',
    dont_say:
      "Don't skip Step 1 — naming the number interrupts the limbic hijack. " +
      "Don't apologize without changing behavior — kids read that as 'Mom is sorry, but nothing changes.' " +
      "Don't promise you'll never get angry — that's a promise you can't keep.",
    safety_warning:
      "If you're worried you've already hurt your child — physically or with words that landed too hard — " +
      "pause this script and text or call your therapist TODAY. Repair can wait an hour, getting help can't.",
    metadata: {
      modality: 'DBT',
      source_age_band: { min: 0, max: 18 },
      principle_citation:
        "Linehan (1993), DBT — 'wise mind' ACCEPTS skills (Actions, Cognitive, Emotion, Physical, Escape, " +
        'Sensations, Take a break) + opposite-action emotion regulation + repair as core DEAR MAN skill.',
      equity: {
        cultural_neutral: true,
        ipv_safe: true,
        neurodiv_aware: true,
        single_parent_safe: true,
        lgbtq_inclusive: true,
      },
      published: false,
    },
  },

  // ── 5. Sibling conflict 5 & 8 — CPS (Greene) + BPT ────────────────
  {
    slug: 'sibling-conflict-5-8-cps-bpt',
    title: 'Sibling conflict (ages 5 and 8)',
    goal: 'Pause the rivalry without picking a winner, and teach both kids to name what they each needed.',
    use_when:
      'Two siblings are yelling at, hitting, or tattling on each other and nothing is broken or bleeding.',
    say_this:
      'STEP 1 — Separate first. "I see two upset kids. You go here, you go there. We talk in two minutes." ' +
      'STEP 2 — Validate both briefly: "You both feel frustrated right now. That\'s real." ' +
      'STEP 3 — Problem-solve together when calm: "What were you each needing? What can we do next time?" ' +
      'Write their answers. They can sign it. Hang it on the fridge.',
    dont_say:
      "Don't ask 'who started it' — it teaches them to perform innocence, not to solve. " +
      "Don't force apologies on the spot; forced apologies breed resentment. " +
      'Don\'t compare them ("Why can\'t you be like your brother?").',
    safety_warning:
      'If a child has been physically hurt (mark, bruise, head-bonk) or there are weapons involved, ' +
      'skip problem-solving and call your therapist or pediatrician. If you suspect one sibling is being harmed ' +
      'by the other (not just conflict, but pattern), call Childhelp 1-800-422-4453.',
    metadata: {
      modality: 'CPS',
      source_age_band: { min: 4, max: 10 },
      principle_citation:
        'Greene (2014), Collaborative & Proactive Solutions — Plan B (empathy + define adult concern + ' +
        'invite collaboration); BPT fade-out plan for sibling rivalry (Kazdin 2008).',
      equity: {
        cultural_neutral: true,
        ipv_safe: true,
        neurodiv_aware: true,
        single_parent_safe: true,
        lgbtq_inclusive: true,
      },
      published: false,
    },
  },
];

// ── Helpers ─────────────────────────────────────────────────────────
export function scriptsForAge(ageYears: number): ParentScript[] {
  return SAMPLE_SCRIPT_BATCH.filter(
    s => ageYears >= s.metadata.source_age_band.min && ageYears <= s.metadata.source_age_band.max
  );
}

export function scriptBySlug(slug: string): ParentScript | undefined {
  return SAMPLE_SCRIPT_BATCH.find(s => s.slug === slug);
}
