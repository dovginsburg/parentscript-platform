-- =============================================
-- Sample Script Batch (Mira, 2026-06-30)
-- 5 first scripts grounded in PCIT / BPT / CPS / DBT
-- Companion: src/data/scripts-sample-batch.ts
-- Reference: kanban t_clin_gary_1782815200
-- =============================================
--
-- IMPORTANT — DO NOT RUN WITHOUT:
--   1. Sherlock QA pass on modality/age/equity (t_clin_sherlock_*)
--   2. A licensed-therapist sign-off per Mira's clinical-authority
--      requirement (kanban t_clin_gary_1782815200, eq §"NON-NEGOTIABLE")
--   3. `published` flipped from FALSE to TRUE in the row entries below.
--
-- Original schema (migrations/001_initial_schema.sql) provides:
--   skills (slug pk, level, sort_order, title, goal, use_when,
--          say_this, dont_say, safety_warning, age_adaptations,
--          is_published, created_at, updated_at)
-- Migration 008 added clinical metadata (modality, source, etc.)
--
-- Schema additions THIS migration makes:
--   - modality            text  — PCIT/BPT/CPS/DBT/etc.
--   - principle_citation  text  — short-form source citation
--   - min_age_years       int   — bottom of source age band
--   - max_age_years       int   — top of source age band
--   - equity_flags        jsonb — { cultural_neutral, ipv_safe,
--                                    neurodiv_aware, single_parent_safe,
--                                    lgbtq_inclusive }
--
-- Run order:
--   \i 001_initial_schema.sql
--   \i 002_rls_policies.sql
--   \i 003_seed_skills.sql
--   ...
--   \i 008_reload_postgrest_schema.sql
--   \i 009_sample_script_batch.sql   <-- this file

BEGIN;

-- ── 1. Column adds (idempotent) ──────────────────────────────────
ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS modality text,
  ADD COLUMN IF NOT EXISTS principle_citation text,
  ADD COLUMN IF NOT EXISTS min_age_years int,
  ADD COLUMN IF NOT EXISTS max_age_years int,
  ADD COLUMN IF NOT EXISTS equity_flags jsonb NOT NULL DEFAULT '{
    "cultural_neutral": true,
    "ipv_safe": true,
    "neurodiv_aware": true,
    "single_parent_safe": true,
    "lgbtq_inclusive": true
  }'::jsonb;

-- Make modality one of a known set. Use a CHECK rather than an enum
-- so adding new modalities doesn't require DDL.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skills_modality_check'
  ) THEN
    ALTER TABLE skills
      ADD CONSTRAINT skills_modality_check
      CHECK (modality IS NULL OR modality IN
        ('PCIT','BPT','CPS','DBT','Triple P','CBT','Circle of Security'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS skills_modality_idx ON skills(modality);
CREATE INDEX IF NOT EXISTS skills_age_band_idx ON skills(min_age_years, max_age_years);

-- ── 2. RLS — no-op (skills is already SELECT-restricted to
--       therapist-own-client-skills via 002_rls_policies.sql)
--       These rows will appear in the public-facing ParentHome
--       skill list ONLY after `is_published = TRUE`.

-- ── 3. The 5 scripts (UNPUBLISHED until QA + therapist sign-off) ──
INSERT INTO skills (slug, level, sort_order, title, goal, use_when, say_this, dont_say, safety_warning, age_adaptations, modality, principle_citation, min_age_years, max_age_years, equity_flags, is_published)
VALUES
(
  'tantrum-3yo-pcit',
  3, -- L3 'Limits & Boundaries' (closest fit; tantrums require limit-setting)
  31,
  'Tantrum in a 3-year-old',
  'Stay close and quiet until your child comes back to baseline, then reconnect with labeled praise.',
  'Your 2–4 year old is screaming, flailing, or on the floor — no one is in danger.',
  E'Crouch to their level. Speak low, slow, and short. "I''m right here. I''ll wait until you''re ready." Breathe out slowly so your body models calm. Once they soften — even a tiny bit — name it: "You stopped thrashing. That''s hard work." Offer water. Offer a hug only if they reach for it; don''t force one.',
  E'Don''t lecture mid-tantrum ("Use your words," "Big kids don''t cry"). Don''t bargain ("If you stop, you can have…"). Don''t threaten consequences during the storm — consequences land AFTER co-regulation.',
  E'If your child is hitting themselves, head-banging hard enough to injure, or holding their breath to faint, this is beyond a tantrum. Call your pediatrician or 911.',
  'Ages 2–4: mirror their tone-low, get on the floor, no lecturing.',
  'PCIT',
  E'Eyberg & Funderburk (2011), Parent-Child Interaction Therapy — CDI phase: ''Don''t'' skill + selective attention + labeled praise.',
  2, 4,
  '{"cultural_neutral": true, "ipv_safe": true, "neurodiv_aware": true, "single_parent_safe": true, "lgbtq_inclusive": true}'::jsonb,
  FALSE -- flip to TRUE after Sherlock QA + therapist sign-off
),
(
  'defiant-8yo-bpt-cps',
  3,
  32,
  'Defiant 8-year-old who won''t listen',
  'Move from a power-struggle to a problem-solving conversation without giving in or escalating.',
  'Your 6–10 year old refuses a reasonable request and escalates when you repeat it.',
  E'Lower your voice and slow down. "I can see this feels unfair to you. I hear you." Then — not a question — one clear command: "Shoes on. We''re leaving in two minutes." If the defiance continues, hold silence for 5 seconds. When any step forward happens — say it out loud: "You picked up your shoes. That''s exactly what I needed."',
  E'Avoid long explanations, repeated commands, threats ("no screen time for a week"), or matching their volume. Don''t "why" questions during defiance — they read as interrogation.',
  E'If the defiance includes aggression toward people, pets, or property: pause this script. Move to safety first, then call your therapist before trying any parenting move.',
  'Ages 6–8: short sentences, one command, then silence. Ages 9–10: explain the why briefly before the command.',
  'BPT',
  E'Kazdin (2008), Parent Management Training — clear commands + praise for compliance; Greene (2014), Collaborative & Proactive Solutions — ''kids do well if they can'' — empathy before expectation.',
  6, 10,
  '{"cultural_neutral": true, "ipv_safe": true, "neurodiv_aware": true, "single_parent_safe": true, "lgbtq_inclusive": true}'::jsonb,
  FALSE
),
(
  'bedtime-4yo-bpt-pcit',
  3,
  33,
  'Bedtime resistance at 4',
  'End the bedtime stalling pattern without yelling or screen bargaining.',
  'Your 3–5 year old keeps getting out of bed: "I need water," "one more story," "I scared."',
  E'Walk them back silently, every time. No lecture, no extra hugs. The same script, every time: "It''s sleep time. I''m walking you back. I love you." If they stay — the first minute they''re quiet, walk in and whisper: "You stayed in your bed. That''s exactly what bedtime looks like." Then leave. No extra attention in between walks-back.',
  E'Avoid negotiating ("one more story and then…"). Avoid scolding when you walk them back. Don''t add a new reward each night — it teaches that escalation works.',
  E'If your child says they are scared of something specific (a noise, the dark, a person), this script doesn''t address that. Acknowledge the fear out loud during the day and call your therapist.',
  'Ages 3–4: walks-back must be silent. Ages 5: brief acknowledgment OK on the way back.',
  'BPT',
  E'Forehand & Long (2010), Parent Training — ''extinction'' for attention-maintained behaviors, with PCIT-style labeled praise for compliant behavior.',
  3, 5,
  '{"cultural_neutral": true, "ipv_safe": true, "neurodiv_aware": true, "single_parent_safe": true, "lgbtq_inclusive": true}'::jsonb,
  FALSE
),
(
  'parent-losing-temper-dbt',
  4, -- L4 'Regulation & Repair'
  34,
  'When YOU are about to lose your temper',
  'Catch yourself before a reaction you''ll regret — and repair after if it already happened.',
  'You notice your chest is tight, your voice is rising, or you''re about to say something sharp.',
  E'STEP 1 — Pause + name it: "I am at a 7/10. I need ten seconds." STEP 2 — Hand on belly, slow exhale longer than inhale. 4 cycles. STEP 3 — Return low: "I lost my temper just now. That wasn''t okay. I''m going to take a breath and we can try again." (Repair is part of the script, not optional.)',
  E'Don''t skip Step 1 — naming the number interrupts the limbic hijack. Don''t apologize without changing behavior — kids read that as ''Mom is sorry, but nothing changes.'' Don''t promise you''ll never get angry — that''s a promise you can''t keep.',
  E'If you''re worried you''ve already hurt your child — physically or with words that landed too hard — pause this script and text or call your therapist TODAY. Repair can wait an hour, getting help can''t.',
  'All parenting ages; this script targets the PARENT''s regulation, not the child''s.',
  'DBT',
  E'Linehan (1993), DBT — ''wise mind'' ACCEPTS skills + opposite-action emotion regulation + repair as core DEAR MAN skill.',
  0, 18,
  '{"cultural_neutral": true, "ipv_safe": true, "neurodiv_aware": true, "single_parent_safe": true, "lgbtq_inclusive": true}'::jsonb,
  FALSE
),
(
  'sibling-conflict-5-8-cps-bpt',
  3,
  35,
  'Sibling conflict (ages 5 and 8)',
  'Pause the rivalry without picking a winner, and teach both kids to name what they each needed.',
  'Two siblings are yelling at, hitting, or tattling on each other and nothing is broken or bleeding.',
  E'STEP 1 — Separate first. "I see two upset kids. You go here, you go there. We talk in two minutes." STEP 2 — Validate both briefly: "You both feel frustrated right now. That''s real." STEP 3 — Problem-solve together when calm: "What were you each needing? What can we do next time?" Write their answers. They can sign it. Hang it on the fridge.',
  E'Don''t ask ''who started it'' — it teaches them to perform innocence, not to solve. Don''t force apologies on the spot; forced apologies breed resentment. Don''t compare them ("Why can''t you be like your brother?").',
  E'If a child has been physically hurt (mark, bruise, head-bonk) or there are weapons involved, skip problem-solving and call your therapist or pediatrician. If you suspect one sibling is being harmed by the other (not just conflict, but pattern), call Childhelp 1-800-422-4453.',
  'Ages 4–6: step 3 needs parent-scribe. Ages 7–10: both can write their own answers.',
  'CPS',
  E'Greene (2014), Collaborative & Proactive Solutions — Plan B (empathy + define adult concern + invite collaboration); BPT fade-out plan for sibling rivalry (Kazdin 2008).',
  4, 10,
  '{"cultural_neutral": true, "ipv_safe": true, "neurodiv_aware": true, "single_parent_safe": true, "lgbtq_inclusive": true}'::jsonb,
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- ── 4. Reload PostgREST schema cache so the REST API sees the new
--       columns immediately. Belt-and-suspenders; 008 already does
--       this for the base table.
NOTIFY pgrst, 'reload schema';

COMMIT;
