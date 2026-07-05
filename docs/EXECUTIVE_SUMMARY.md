# Executive Summary — MAZE Clinical Expansion

> **For:** Dov (CEO, AMAZED Labs)  
> **From:** Mira (Clinical Specialist), Ezra (Strategy), Gary (Business), Sherlock (QA)  
> **Date:** June 27, 2026  
> **Status:** Decision-ready. Four documents delivered. Execution can begin immediately.

---

## What We Built

The clinical glossaries are complete (911 lines, 8 domains, 840+ terms). Four companion documents now complete the expansion package:

1. **EXPANSION_CHECKLISTS.md** — Operational checklists for all 8 clinical areas: therapist onboarding, patient intake, session-by-session skill progression (L1–L5), 3-step crisis coaching scripts, safety escalation protocols, progress metrics, and family/caregiver involvement.
2. **EXPANSION_IMPLEMENTATION.md** — Per-area app names, target personas, pricing models, MVP feature sets, ParentScript integration plans, competitive landscape analysis, and cross-cutting technical notes.
3. **PLATFORM_VISION.md** — Unified architecture (content-platform separation), content management system, therapist UX across conditions, 3-year revenue projections ($317K → $1.09M → $2.88M ARR), and priority rankings.
4. **EXECUTIVE_SUMMARY.md** — This document.

---

## The Opportunity

ParentScript proved the model: therapist-controlled progressive unlock of evidence-based skills, parents free, therapists pay. That model is not parenting-specific. It is the general shape for any therapist-prescribed behavioral intervention.

The 8 expansion domains represent a **$2.8M+ ARR opportunity within 36 months** and position MAZE as the only unified behavioral health platform where one therapist dashboard serves all conditions.

| Domain           | Market Size (US Therapists)    | Regulatory Risk    | Launch Priority |
| ---------------- | ------------------------------ | ------------------ | --------------- |
| Anxiety          | ~40,000 CBT therapists         | Medium             | **1st (Q1)**    |
| Depression       | ~50,000 therapists             | **High** (suicide) | **2nd (Q2)**    |
| ADHD             | ~25,000 clinicians             | Low                | **3rd (Q2)**    |
| Trauma/PTSD      | ~20,000 trauma specialists     | High               | 4th (Q3)        |
| Relationships    | ~30,000 couples therapists     | Medium             | 5th (Q3)        |
| Autism           | ~15,000 ND-affirming providers | Medium             | 6th (Q4)        |
| Eating Disorders | ~8,000 ED specialists          | **Very High**      | 7th (Q4/Y2)     |
| Addiction        | ~12,000 SUD counselors         | **Very High**      | 8th (Y2)        |

---

## Key Recommendations

### 1. Launch Anxiety Module First (Immediate)

**Why:** Largest addressable market, lowest regulatory risk, strongest evidence base, fastest content build (6–8 weeks). The GAD-7 is ubiquitous. CBT for anxiety is the most standardized protocol in outpatient care.

**What to ship:** GAD-7 administration, exposure hierarchy builder, SUDS tracker, In-the-Moment panic/social anxiety/OCD scripts, thought record templates.

**Price:** $19/mo Solo / $39/mo Pro / $29/seat Clinic.

### 2. Ship Suicide-Care Rail Before Depression Module

**Why:** The depression module cannot launch without a tested, end-to-end suicide safety flow: PHQ-9 item 9 → C-SSRS → 988 routing → therapist alert → safety plan display. This is non-negotiable.

**Timeline:** Build and test the rail in Month 1–2. Launch depression module in Month 3–4.

### 3. Keep Parents/Patients Free, Always

**Why:** The therapist is the customer, the channel, and the prescriber. Charging patients creates friction, doubles support costs, and undermines the clinical relationship. This decision is irreversible after launch.

**Price:** Free tier (3 clients) → Solo $19/mo → Pro $39/mo → Clinic $29/seat.

### 4. Build the Module Framework, Not Just Content

**Why:** A new module should not require an engineering deploy. The platform test is: can a clinical advisor author a new vertical and have it go live with only content uploads?

**Engineering priority:** Module registry, lazy-loaded component trees, instrument framework, module-aware AI prompts.

### 5. Hire Two People Before Month 6

**Why:** Founder burnout is the highest-likelihood, highest-impact risk. Dov cannot be clinical lead, backend engineer, and CEO simultaneously.

**Hire 1:** Clinical Lead (licensed therapist, content authoring, advisor management, safety review).

**Hire 2:** Backend Engineer (Supabase/Postgres, API development, EHR integrations, scaling).

### 6. Defer Addiction and Eating Disorders to Partner-Led Model

**Why:** Both domains have medical liability (refeeding syndrome, withdrawal, MAT) and regulatory complexity (ASAM, state substance-use rules) that exceed internal capacity.

**Path:** Partner with ASAM-certified organization for addiction, CBT-E/FBT-certified group for eating disorders. MAZE provides the platform; partner provides the clinical content and medical oversight.

### 7. Target $317K ARR by Month 12, $1M by Month 24

**How:** 1,200 paying therapists by end of Year 1 across 4 modules. 20% of existing ParentScript therapists adopt each new module. New therapist acquisition via conference circuit (PCIT International, ABCT) + Ariella's network + direct outreach.

**Costs:** ~$60K Year 1. Profit: ~$256K.

---

## Competitive Position

No competitor combines all three of MAZE's differentiators:

1. **Therapist-controlled progressive unlock** (not self-help, not patient-driven)
2. **Unified multi-condition dashboard** (not 8 separate apps)
3. **Outcome tracking with validated instruments** (not generic mood trackers)

| Competitor       | Therapist Control | Multi-Condition | Outcome Tracking |
| ---------------- | ----------------- | --------------- | ---------------- |
| NOCD             | ❌                | ❌              | ❌               |
| Woebot           | ❌                | ❌              | ❌               |
| PTSD Coach       | ❌                | ❌              | ❌               |
| Recovery Record  | ❌                | ❌              | ❌               |
| Ginger/Headspace | ❌                | ❌              | ❌               |
| **MAZE**         | **✅**            | **✅**          | **✅**           |

---

## Next Steps (This Week)

| Action                                               | Owner         | Deadline |
| ---------------------------------------------------- | ------------- | -------- |
| Review all 4 expansion documents                     | Dov / Ariella | June 29  |
| Confirm anxiety module launch priority               | Dov           | June 30  |
| Identify clinical advisor for anxiety module         | Ariella       | July 3   |
| Begin module framework engineering (schema + router) | Gary          | July 7   |
| Draft anxiety module skill catalog (L1–L5)           | Mira          | July 10  |
| Legal review of suicide-care rail design             | Dov           | July 14  |
| Post clinical lead job description                   | Dov / Ariella | July 7   |

---

## The Bottom Line

ParentScript was the proof of concept. The platform thesis is validated. The clinical content framework is complete. The architecture is designed to scale.

**The only remaining question is execution speed.**

Launch anxiety in Q1. Ship the suicide-care rail. Build the module framework. Hire the clinical lead. Everything else follows from those four decisions.

The first-mover window on therapist-controlled behavioral health platforms is open. It will not stay open forever.

---

_Delivered by Mira | AMAZED Labs | June 27, 2026_
