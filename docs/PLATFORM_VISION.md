# MAZE Unified Platform Vision

> **Version:** 1.0 | **Author:** Mira (Clinical) + Ezra (Strategy) | **Date:** June 2026
> **Purpose:** Architecture, content management, therapist UX across conditions, revenue projections, and priority ranking for the unified MAZE platform.

---

## 1. Platform Thesis

MAZE is not a collection of single-condition apps. It is a **unified clinical platform** where one therapist dashboard serves all behavioral interventions, one patient app adapts to any assigned module, and one content engine enables rapid vertical expansion.

The thesis in one sentence:

> *The unlock mechanic, therapist-controlled surface, evidence-based curriculum, and privacy-minimized data model that powered ParentScript are not parenting-specific. They are the general shape for delivering any therapist-prescribed behavioral intervention at scale.*

---

## 2. Unified Architecture

### 2.1 Core Principle: Content-Platform Separation

The platform should not need a deploy when a new clinical module ships. This is the test of whether MAZE is a platform or a product.

```
┌─────────────────────────────────────────────────────────────┐
│                    MAZE UNIFIED PLATFORM                     │
├─────────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER                                         │
│  ├─ Therapist Web App (React + Vite + Tailwind)            │
│  ├─ Patient PWA (React + Vite + Tailwind, mobile-first)    │
│  └─ Admin Dashboard (Clinic/Enterprise)                     │
├─────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER                                          │
│  ├─ Auth Service (Supabase Auth)                           │
│  ├─ Module Router (lazy-loads module component trees)      │
│  ├─ In-the-Moment Engine (module-specific script routing)  │
│  ├─ Instrument Framework (validated scale administration)  │
│  ├─ AI Coach (module-aware system prompts)                 │
│  └─ Notification Service (push, email, SMS)                │
├─────────────────────────────────────────────────────────────┤
│  CONTENT LAYER                                              │
│  ├─ Module Registry (skills, instruments, scripts)         │
│  ├─ Cheat Sheet Templates (schema-driven rendering)        │
│  ├─ Safety Script Library (crisis scripts per module)      │
│  └─ Outcome Measures (PHQ-9, GAD-7, PCL-5, etc.)          │
├─────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                 │
│  ├─ PostgreSQL (Supabase)                                  │
│  │   ├─ Tenancy: therapist_id → client_id → parent_id     │
│  │   ├─ RLS policies enforce all access boundaries        │
│  │   └─ Modules: lazy-loaded content, no code changes      │
│  ├─ AI Suggestion Log (audit trail for all AI outputs)     │
│  └─ Encrypted Notes (Pro tier, BAA milestone)              │
├─────────────────────────────────────────────────────────────┤
│  INTEGRATION LAYER                                          │
│  ├─ EHR Partners (SimplePractice, Jane, TherapyNotes)      │
│  ├─ Telehealth (session metadata sync)                     │
│  └─ Research API (IRB-approved, de-identified exports)     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Module System

Every module ships as a **versioned content pack** containing:

1. **Module manifest** — metadata, prerequisites, contraindications, safety tier
2. **Skill catalog** — ordered L1–L5, prerequisites, mastery checkpoints
3. **Cheat sheet templates** — goal, use_when, say_this, dont_say, safety_warning, age_adaptations
4. **In-the-Moment scripts** — 3-step crisis scripts per common scenario
5. **Outcome instruments** — validated scales with scoring logic
6. **AI system prompt** — module-aware coaching instructions with safety rails
7. **Therapist training** — async certification + live Q&A requirement

### 2.3 Schema Additions for Platform Scale

See `PHASE2_VISION.md` §7.2 for full SQL. Key additions:

- `modules` table — first-class module registry
- `clinic_module_subscriptions` — which modules each clinic has purchased
- `client_modules` — per-client module activation
- `instruments` + `instrument_administrations` — validated scale framework
- `ai_suggestions` — audit trail for all AI-generated clinical prompts
- `module_outcomes` materialized view — clinic-level aggregate analytics

### 2.4 Multi-Tenancy Evolution

| Phase | Tenancy Model | Use Case |
|-------|--------------|----------|
| **Today** | Therapist-level RLS | Solo practitioners |
| **Phase 2a** | Clinic tenancy (clinic_id) | Group practices (3–20 therapists) |
| **Phase 2b** | Organization tenancy (org_id) | Enterprise / health systems |
| **Phase 3** | White-label tenant isolation | B2B2C branded deployments |

All tenancy enforced in PostgreSQL RLS. No middleware auth changes required.

---

## 3. Content Management System

### 3.1 Clinical Content Lifecycle

```
Clinical Advisor Authors → Mira Clinical Review → Ariella Final Review →
→ Content Upload to Module Registry → Therapist Training Published →
→ Soft Launch (10 therapists) → Outcome Data Review → General Availability
```

### 3.2 Content Versioning

- Every skill, script, and instrument is versioned (semantic: v1.0.0)
- Therapists see "last updated" date on each skill card
- Major versions trigger re-certification requirement
- Minor versions auto-update with changelog notification
- Patch versions (typos, clarifications) deploy silently

### 3.3 Localization Framework

- All content stored with i18n keys from day one
- Primary language: US English
- Phase 2 targets: Spanish (clinical verticals), Mandarin (anxiety/depression)
- Translation by clinical translators, not generic services (clinical nuance matters)

### 3.4 Safety Content Governance

| Content Type | Review Frequency | Approver |
|-------------|-----------------|----------|
| Crisis scripts | Quarterly | Mira + Crisis Counselor |
| Safety escalation flows | Quarterly | Mira + Legal |
| AI system prompts | Monthly | Mira + AI Safety Review |
| Outcome instruments | Annually (or on validation update) | Clinical Advisor |
| Skill cheat sheets | Bi-annually | Mira + Clinical Advisor |

---

## 4. Therapist UX Across Conditions

### 4.1 Unified Dashboard

One screen. All patients. All modules. Zero context switching.

```
┌────────────────────────────────────────────────────────────┐
│  MAZE Therapist Dashboard                                  │
├────────────────────────────────────────────────────────────┤
│  [Filter: All Modules ▼] [Filter: All Clients ▼] [Search] │
├────────────────────────────────────────────────────────────┤
│  ⚠️  ALERTS (3)                                            │
│  • Patient J (Depression): PHQ-9 item 9 = 2 → CSSRS due   │
│  • Patient M (Anxiety): No app use 7 days → engagement risk│
│  • Patient K (Trauma): Dissociation log spike → review    │
├────────────────────────────────────────────────────────────┤
│  TODAY'S SESSIONS                                          │
│  10:00 AM  Emma R.      │ Anxiety L3 │ GAD-7: 14→9        │
│  11:30 AM  David T.     │ Trauma L2  │ PCL-5: 52→48       │
│  2:00 PM   Carlos M.    │ ADHD L4    │ ASRS: 46→38        │
│  3:30 PM   Aisha + Sam  │ Couples L3 │ DAS: 82→91         │
├────────────────────────────────────────────────────────────┤
│  COHORT OVERVIEW                                           │
│  Active Clients: 24 │ Modules: 4 │ Avg Practice: 4.2/wk   │
│  [Outcome Trends Chart] [Engagement Risk Chart]            │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Per-Client Detail View

```
┌────────────────────────────────────────────────────────────┐
│  Emma R. │ Anxiety Module │ GAD-7: 14→9 (↓5 pts)          │
├────────────────────────────────────────────────────────────┤
│  [Skill Tree L1–L5]  [Exposure Hierarchy]  [Practice Log] │
│  [Outcome Chart]     [Notes]               [AI Suggestions]│
├────────────────────────────────────────────────────────────┤
│  SKILL TREE                                                │
│  L1 ✅✅  L2 ✅✅  L3 🟡🔒🔒  L4 🔒🔒🔒🔒  L5 🔒🔒🔒🔒    │
│  [Unlock Next Skill] [Set Focus Tag] [Send Nudge]         │
└────────────────────────────────────────────────────────────┘
```

### 4.3 Cross-Module Patient View

A single patient can have multiple modules active. The dashboard shows all modules with color coding:

- 🟦 Anxiety
- 🟨 Depression
- 🟩 ADHD
- 🟥 Trauma
- 🟪 Autism
- 🟧 Relationships
- ⬜ Parenting (legacy)

Therapist toggles which module to focus on per session.

### 4.4 Pre-Session Brief (Auto-Generated)

For each upcoming session, MAZE auto-generates:

1. **Practice summary** since last session (frequency, skills used, ratings)
2. **Instrument trends** (GAD-7, PHQ-9, etc.)
3. **AI-flagged concerns** (differential diagnosis prompts, engagement risk)
4. **Suggested skill unlock** based on progression
5. **Safety alerts** (item 9 positive, missed practice, crisis log entries)

Therapist reviews in 60 seconds. No manual chart review required.

### 4.5 Structured Note Templates

Per-module note templates (no free-text in Solo tier):

| Module | Note Options |
|--------|-------------|
| Anxiety | focus_this_week / going_well / revisit / exposure_ready |
| Depression | activation_on_track / sleep_concern / social_withdrawal / safety_review |
| ADHD | tool_adopted / tool_struggling / emotional_dysregulation / medication_review |
| Trauma | stabilization_stable / processing_ready / dissociation_present / safety_review |
| Autism | accommodation_working / burnout_risk / unmasking_progress / family_support |
| Relationships | cycle_disrupted / repair_attempted / gridlocked / individual_session_needed |

---

## 5. Revenue Projections — Unified Platform

### 5.1 Assumptions

- **Module launch sequence:** Anxiety (M3), Depression (M6), ADHD (M9), Trauma (M12), Relationships (M15), Autism (M18), Eating Disorders (M21), Addiction (M24)
- **Market size per module:** See `EXPANSION_IMPLEMENTATION.md` per vertical
- **Conversion:** 20% of existing ParentScript therapists adopt each new module within 6 months of launch
- **New therapist acquisition:** Each module attracts new therapists from that specialty

### 5.2 Therapist Growth by Module

| Module | Launch | Month 6 | Month 12 | Month 18 | Module-Specific ARPU |
|--------|--------|---------|----------|----------|---------------------|
| Parenting | M0 | 400 | 1,200 | 3,000 | $22 (blended) |
| Anxiety | M3 | 100 | 500 | 1,500 | $21 |
| Depression | M6 | 80 | 400 | 1,200 | $21 |
| ADHD | M9 | 60 | 300 | 900 | $20 |
| Trauma | M12 | 40 | 200 | 600 | $24 |
| Relationships | M15 | 50 | 250 | 750 | $24 |
| Autism | M18 | 30 | 150 | 450 | $20 |
| Eating Disorders | M21 | 20 | 100 | 300 | $30 |
| Addiction | M24 | 15 | 75 | 225 | $30 |

### 5.3 Revenue Projections

#### Year 1 (Months 1–12)
| Metric | Value |
|--------|-------|
| Total paying therapists | 1,200 |
| Blended ARPU | $22/mo |
| MRR (end Y1) | $26,400 |
| ARR | $316,800 |
| Parents/patients on platform | 12,000 |
| Clinic accounts | 40 |

#### Year 2 (Months 13–24)
| Metric | Value |
|--------|-------|
| Total paying therapists | 3,500 |
| Blended ARPU | $26/mo (Pro upsells, clinic growth) |
| MRR (end Y2) | $91,000 |
| ARR | $1,092,000 |
| Parents/patients on platform | 42,000 |
| Clinic accounts | 120 |
| Modules live | 8 |

#### Year 3 (Months 25–36)
| Metric | Value |
|--------|-------|
| Total paying therapists | 8,000 |
| Blended ARPU | $30/mo |
| MRR (end Y3) | $240,000 |
| ARR | $2,880,000 |
| Parents/patients on platform | 96,000 |
| Clinic accounts | 300 |
| White-label deals | 2–3 |
| CE course revenue | $50,000/yr |

### 5.4 Revenue Mix Evolution

| Source | Y1 | Y2 | Y3 |
|--------|-----|-----|-----|
| Solo subscriptions | 70% | 55% | 40% |
| Pro subscriptions | 20% | 30% | 35% |
| Clinic/Enterprise | 8% | 12% | 18% |
| CE courses | 0% | 2% | 4% |
| White-label / API | 2% | 3% | 3% |

### 5.5 Cost Projections

| Cost Category | Y1 | Y2 | Y3 |
|--------------|-----|-----|-----|
| Infrastructure (Supabase + Vercel) | $3,600 | $8,000 | $18,000 |
| Development (Claude Code + contractor) | $24,000 | $60,000 | $120,000 |
| Clinical advisors (per module) | $15,000 | $40,000 | $60,000 |
| Legal / compliance | $5,000 | $10,000 | $15,000 |
| Conferences / marketing | $8,000 | $25,000 | $50,000 |
| Content creation | $5,000 | $20,000 | $40,000 |
| Customer success | $0 | $15,000 | $40,000 |
| **Total Costs** | **$60,600** | **$178,000** | **$343,000** |
| **Profit** | **$256,200** | **$914,000** | **$2,537,000** |

---

## 6. Priority Ranking

### 6.1 Module Launch Priority

| Rank | Module | Rationale | Launch Quarter |
|------|--------|-----------|---------------|
| **1** | **Anxiety** | Largest market, lowest risk, strongest evidence, fastest content build | Q1 |
| **2** | **Depression** | Massive market, but suicide-care rail must ship first | Q2 |
| **3** | **ADHD** | Natural ParentScript extension, growing adult diagnosis market | Q2 |
| **4** | **Trauma** | High need, good differentiation, requires stabilization protocol | Q3 |
| **5** | **Relationships** | Large market, different UX model (couple), Gottman/EFT recognition | Q3 |
| **6** | **Autism** | Underserved adult market, strong community alignment, lower competition | Q4 |
| **7** | **Eating Disorders** | High clinical value, high liability, requires medical team integration | Q4/Y2 |
| **8** | **Addiction** | Highest regulatory burden, partner-led recommended, smallest therapist market | Y2 |

### 6.2 Technical Priority

| Rank | Initiative | Rationale | Timeline |
|------|-----------|-----------|----------|
| **1** | Module framework (schema + UI router) | Unblocks all verticals | Month 1–2 |
| **2** | Instrument framework (PHQ-9, GAD-7, etc.) | Required for outcome tracking | Month 2–3 |
| **3** | AI Coach v1 (module-aware prompts) | Pro tier differentiator | Month 3–4 |
| **4** | Multi-client dashboard | Therapist retention feature | Month 4–5 |
| **5** | Native iOS/Android apps | Push notifications, wider reach | Month 5–7 |
| **6** | EHR integrations | Clinic-tier requirement | Month 8–10 |
| **7** | API v1 (partner access) | Research + integration revenue | Month 10–12 |
| **8** | White-label infrastructure | Enterprise revenue | Year 2 |

### 6.3 Clinical Priority

| Rank | Initiative | Rationale | Timeline |
|------|-----------|-----------|----------|
| **1** | Suicide-care rail (CSSRS + 988 routing) | Blocks depression module; moral imperative | Month 1–2 |
| **2** | Clinical advisor network (8 specialties) | Content quality gate | Month 1–6 |
| **3** | Outcome measurement validation | Defensibility to clinic admins | Month 3–9 |
| **4** | Safety script review (all modules) | Liability protection | Month 2–4 |
| **5** | CE credit accreditation | Retention + revenue lever | Month 6–12 |
| **6** | Peer-reviewed outcome research | Insurance / enterprise credibility | Year 2–3 |

---

## 7. Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Regulatory shutdown (HIPAA/FTC/state) | Low | Catastrophic | Legal review before each module; BAA with Supabase; no PHI in v1 |
| Suicide-care rail failure | Low | Catastrophic | Quarterly testing; 988 API integration; human escalation backup |
| Clinical content error | Medium | High | Mira review + clinical advisor sign-off + soft launch period |
| Therapist churn > 5%/month | Medium | High | NPS tracking; monthly feedback calls; responsive support |
| Competitor launches equivalent | Medium | Medium | Curriculum moat (Ariella + advisors); therapist relationships; outcome data |
| Module content delay | High | Medium | Staged launches; anxiety/depression first; buffer time built in |
| AI hallucination / bad advice | Medium | High | Human-in-the-loop; therapist approval required; audit logs; no diagnosis |
| Founder burnout | Medium | High | Hire clinical lead + backend engineer by Month 6 |
| Insurance/payer pressure | Low | Medium | Stay cash-pay B2B; defer PDT path until Year 3 |

---

## 8. Success Metrics (36-Month Horizon)

| Metric | Month 12 | Month 24 | Month 36 |
|--------|----------|----------|----------|
| Paying therapists | 1,200 | 3,500 | 8,000 |
| Modules live | 4 | 7 | 8+ |
| ARR | $317K | $1.09M | $2.88M |
| Parents/patients | 12,000 | 42,000 | 96,000 |
| Clinic accounts | 40 | 120 | 300 |
| NPS (therapists) | >60 | >65 | >70 |
| Monthly churn | <3% | <2.5% | <2% |
| Outcome publications | 0 | 1 | 3+ |
| Safety incidents | 0 | 0 | 0 |
| White-label deals | 0 | 1 | 3 |

---

*End of Unified Platform Vision. This document should be reviewed monthly by Dov, quarterly by the full team, and updated before any major strategic decision.*
