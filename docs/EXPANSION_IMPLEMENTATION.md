# Expansion Implementation Guide — 8 Clinical Domains

> **Version:** 1.0 | **Author:** Mira (Clinical) + Ezra (Strategy) | **Date:** June 2026
> **Purpose:** For each expansion area: app name suggestions, target personas, pricing model, MVP feature set, ParentScript integration plan, and competitive landscape.

---

## Table of Contents
1. [Anxiety Disorders](#1-anxiety-disorders)
2. [Addiction / Substance Use](#2-addiction--substance-use)
3. [Eating Disorders](#3-eating-disorders)
4. [ADHD / Executive Function](#4-adhd--executive-function)
5. [Depression](#5-depression)
6. [Trauma / PTSD](#6-trauma--ptsd)
7. [Autism Spectrum](#7-autism-spectrum)
8. [Relationship / Family Systems](#8-relationship--family-systems)

---

## 1. ANXIETY DISORDERS

### App Name Suggestions
- **CalmScript** (therapist-prescribed calm)
- **ExposurePath** (emphasizes ERP/exposure journey)
- **WorryWork** (action-oriented, destigmatized)
- **Steady** (simple, reassuring)

### Target User Personas
| Role | Persona | Key Pain Point |
|------|---------|---------------|
| **Therapist** | Dr. Sarah, 38, CBT therapist, sees 20 clients/week, burned out on printing worksheets | Needs structured exposure tracking without manual SUDS spreadsheets |
| **Patient** | Jake, 26, social anxiety, avoids restaurants and presentations | Needs in-the-moment coaching before social events |
| **Caregiver** | Jake's partner, wants to help but doesn't know how | Needs guidance on supporting without enabling avoidance |

### Pricing Model
- **Free:** 3 clients, L1–L2 content, GAD-7
- **Solo:** $19/mo — unlimited clients, full L1–L5, exposure hierarchy builder, SUDS tracking
- **Pro:** $39/mo — adds AI exposure coach, outcome analytics, custom hierarchy templates
- **Clinic:** $29/seat/mo — aggregate anxiety outcomes dashboard

### MVP Feature Set
- GAD-7 administration + auto-scoring + trend chart
- Exposure hierarchy builder (drag-and-drop, therapist edits, patient sees only current step)
- SUDS pre/post logger with timestamp and context note
- In-the-Moment panic attack + social anxiety scripts
- Worry time scheduler with reminder
- Thought record template (structured, not free-text)
- Safety escalation to 988 + therapist

### ParentScript Integration
- Reuse existing `skills` schema, `client_skill_state` unlock mechanic, practice logs
- Add `exposure_hierarchy` table (client_id, step_order, situation, predicted_SUDS, actual_SUDS)
- Add `suds_logs` table (hierarchy_step_id, pre, post, timestamp)
- Add `instruments.gad7` to existing instruments framework
- Reuse parent PWA shell; swap skill catalog for anxiety curriculum
- In-the-Moment button routes to anxiety-specific scripts based on module assignment

### Competitive Landscape
| Competitor | Model | Price | Gap MAZE Fills |
|------------|-------|-------|---------------|
| **NOCD** | B2C therapy service + free app | Free app; therapy $$$ | NOCD app is patient-driven; MAZE is therapist-controlled with unlock mechanic |
| **DARE** | B2C self-help content | $9.99/mo | No therapist oversight, no structured progression |
| **MindShift** | B2C CBT app | Free | No therapist dashboard, no exposure hierarchy integration |
| **Ginger** | B2B EAP + coaching | Employer-paid | Coaching, not CBT; no exposure therapy focus |
| **Woebot** | B2C AI chatbot | Free/Research | AI-only, no real therapist relationship |

**MAZE Differentiator:** The only therapist-controlled exposure therapy companion with progressive unlock, SUDS tracking, and crisis escalation.

---

## 2. ADDICTION / SUBSTANCE USE

### App Name Suggestions
- **RecoveryScript** (parallel to ParentScript)
- **SobrietyPath**
- **CraveCoach**
- **Anchor** (symbol of stability)

### Target User Personas
| Role | Persona | Key Pain Point |
|------|---------|---------------|
| **Therapist** | Mike, 45, LPC with SUD specialization, runs IOP group | Needs between-session craving support patients will actually use |
| **Patient** | Tasha, 32, opioid use disorder, 60 days sober, lives alone | Cravings hit at 2am with no one to call |
| **Peer** | Sponsor/family member, wants to see progress without being intrusive | Needs visibility into red flags without daily check-in burden |

### Pricing Model
- **Free:** 3 clients, L1–L2, AUDIT/DAST screening
- **Solo:** $24/mo — unlimited clients, full curriculum, trigger map, urge surfing log
- **Pro:** $44/mo — adds MAT adherence tracking, peer support matching, chain analysis tools
- **Clinic:** $34/seat/mo — group dashboard, outcome exports for ASAM reviews

*Note: Higher price than anxiety because of medical complexity and smaller therapist market.*

### MVP Feature Set
- AUDIT-C + DAST-2 administration + scoring
- Trigger map builder (people, places, emotions, times, events)
- Urge surfing timer (10-minute guided ride-the-wave)
- Refusal script library (social pressure, emotional, celebratory)
- HALT check-in (quick 4-question self-assessment)
- Sober day counter + milestone celebrations
- Craving intensity log (0–10) with trend chart
- Naloxone locator integration (geolocation-based)
- Safety escalation: 988 + sponsor hotline + therapist

### ParentScript Integration
- Reuse `skills` + `client_skill_state` + practice log schema
- Add `trigger_map` table (client_id, category, trigger, intensity, frequency)
- Add `craving_logs` table (client_id, intensity, trigger_id, outcome, timestamp)
- Add `sober_counter` table (client_id, start_date, lapses array)
- Add `instruments.audit` and `instruments.dast` to instruments framework
- In-the-Moment button: craving, social pressure, post-lapse scripts
- *Caution:* Requires ASAM-aligned clinical advisor before launch. Partner-led content.

### Competitive Landscape
| Competitor | Model | Price | Gap MAZE Fills |
|------------|-------|-------|---------------|
| **reSET-O** | FDA-cleared digital therapeutic | Insurance-billed | Prescription-only, heavy compliance; MAZE is lighter, therapist-controlled |
| **Sober Grid** | Peer support network | Free | No therapist oversight, no structured curriculum |
| **Pear Therapeutics** | Prescription digital therapeutics | Insurance | Same as reSET-O — heavy, slow, insurance-dependent |
| **SMART Recovery** | Free mutual support | Free | No professional therapist integration |
| **WEconnect** | Employer-sponsored recovery | Employer-paid | B2B EAP; not therapist-prescribed |

**MAZE Differentiator:** Bridges the gap between heavy prescription digital therapeutics and unsupported peer apps — therapist-controlled, evidence-based, lightweight.

---

## 3. EATING DISORDERS

### App Name Suggestions
- **NourishScript**
- **RestorePath**
- **WholePlate**
- **Sustained** (recovery as ongoing, not linear)

### Target User Personas
| Role | Persona | Key Pain Point |
|------|---------|---------------|
| **Therapist** | Dr. Patel, eating disorder specialist, FBT-trained | Parents need meal support guidance between sessions |
| **Patient** | Emma, 17, anorexia, in FBT with parents | Eats with family but needs support after meals when urges spike |
| **Parent** | Emma's mom, terrified of refeeding, doesn't know how to respond to resistance | Needs real-time coaching during meals and post-meal distress |

### Pricing Model
- **Free:** 2 clients (lower cap due to medical risk), L1, EDE-Q
- **Solo:** $29/mo — unlimited clients, full L1–L5, meal plan tool, fear food hierarchy
- **Pro:** $49/mo — adds family meal logging, parent coaching scripts, body image exposure tools
- **Clinic:** $39/seat/mo — multi-disciplinary team dashboard (therapist + dietitian + physician)

*Note: Highest price point due to medical liability and team coordination features.*

### MVP Feature Set
- EDE-Q + SCOFF administration + scoring
- Meal plan display (therapist/dietitian enters; patient sees daily plan)
- Fear food hierarchy builder (therapist-graded, patient unlocks progressively)
- Meal support timer (structured meal duration with prompts)
- Post-meal distress coaching script
- Body checking reduction tracker
- Weight trend chart (visible only to therapist, never to patient in early recovery)
- Vital signs log (patient or parent enters; flags medical instability)
- Safety escalation: 911 + therapist + treatment team

### ParentScript Integration
- Reuse `skills` + `client_skill_state` + practice log schema
- Add `meal_plans` table (client_id, date, meals array, status)
- Add `fear_food_hierarchy` table (client_id, food, level, exposure_count, SUDS)
- Add `vital_logs` table (client_id, weight, HR, BP, temp, timestamp)
- Add `instruments.edeq` and `instruments.scoff`
- In-the-Moment: binge urge, purge urge, body checking spiral scripts
- Family dashboard: parent logs meals, sees therapist notes on support strategies

### Competitive Landscape
| Competitor | Model | Price | Gap MAZE Fills |
|------------|-------|-------|---------------|
| **Recovery Record** | B2C meal tracking | Free/Premium | Patient-driven, no therapist control, no progressive unlock |
| **Equip** | Virtual ED treatment | Insurance ($$$) | Full treatment program; MAZE is adjunct tool, lighter, cheaper |
| **Rise Up + Recover** | B2C self-help | Free | No clinical oversight, no FBT integration |
| **Center for Change** | Residential/IOP | Insurance | Inpatient only; MAZE supports outpatient continuum |
| **Within Health** | Virtual IOP | Insurance | Same as Equip — heavy program, not therapist adjunct |

**MAZE Differentiator:** The only outpatient tool that supports FBT meal support with therapist-controlled progressive exposure and real-time parent coaching.

---

## 4. ADHD / EXECUTIVE FUNCTION

### App Name Suggestions
- **FocusScript**
- **ExecutivePath**
- **TaskFlow**
- **SteadyState** (play on executive function + stability)

### Target User Personas
| Role | Persona | Key Pain Point |
|------|---------|---------------|
| **Therapist** | Dr. Lee, 42, psychologist, ADHD coach | Patients need between-session accountability for EF strategies |
| **Patient** | Carlos, 29, late-diagnosed ADHD, software engineer | Starts 10 projects, finishes 0; time blindness causes missed deadlines |
| **Partner** | Carlos's wife, frustrated by forgotten commitments | Needs to support without becoming "the manager" |

### Pricing Model
- **Free:** 3 clients, L1–L2, ASRS screening
- **Solo:** $19/mo — unlimited clients, full curriculum, task timer, body doubling matching
- **Pro:** $39/mo — adds calendar integration, habit stack builder, RSD tracking, medication log
- **Clinic:** $29/seat/mo — workplace accommodation tracking, outcome reports for disability claims

### MVP Feature Set
- ASRS-v1.1 administration + scoring + trend
- Task initiation ritual builder ( therapist assigns; patient customizes)
- Pomodoro + time-block timer with ADHD-specific features (shorter blocks, visual countdown)
- Body doubling matching (virtual co-working within MAZE community)
- Impulse pause button (24-hour delay for purchases/decisions)
- Emotional dysregulation log (trigger, intensity, response, outcome)
- RSD reframing tool (cognitive restructuring specific to rejection sensitivity)
- Strengths inventory + integration exercises
- Safety escalation: 988 (if comorbid depression) + therapist

### ParentScript Integration
- Reuse `skills` + `client_skill_state` + practice log schema
- Add `tasks` table (client_id, task, chunked_steps, due_date, status, timer_sessions)
- Add `timer_sessions` table (task_id, duration, interruptions, completed)
- Add `body_double_sessions` table (requester_id, partner_id, start_time, end_time)
- Add `instruments.asrs` to instruments framework
- In-the-Moment: task paralysis, emotional dysregulation, impulse risk scripts
- Calendar integration via API (Google/Outlook read-only for time-blocking)

### Competitive Landscape
| Competitor | Model | Price | Gap MAZE Fills |
|------------|-------|-------|---------------|
| **Done** | ADHD medication management | $79/mo | Meds only; no therapy, no EF skills |
| **Inflow** | B2C ADHD self-help app | $47/mo | Self-help, no therapist control |
| **Tiimo** | Visual schedule/planner | $7/mo | Tool-only, no clinical framework |
| **Akili (EndeavorRx)** | Prescription game | Insurance | Kids only, prescription-required, narrow focus |
| **Focusmate** | Body doubling platform | Free/$5/mo | No therapy integration, no clinical progression |

**MAZE Differentiator:** Only platform combining therapist-controlled EF curriculum, body doubling, medication collaboration, and RSD-specific coaching.

---

## 5. DEPRESSION

### App Name Suggestions
- **RiseScript**
- **MoodPath**
- **Upward**
- **LightWork** (behavioral activation as "work")

### Target User Personas
| Role | Persona | Key Pain Point |
|------|---------|---------------|
| **Therapist** | Dr. Kim, 35, CBT therapist | Patients stop doing BA homework; need accountability without shame |
| **Patient** | Maria, 52, recurrent depression, empty nester | Can't get out of bed; needs smallest possible first step |
| **Family** | Maria's adult daughter, lives nearby | Wants to help but doesn't know whether to push or give space |

### Pricing Model
- **Free:** 3 clients, L1–L2, PHQ-9 + C-SSRS
- **Solo:** $19/mo — unlimited clients, full BA curriculum, activity scheduler, sleep tracker
- **Pro:** $39/mo — adds AI mood coach, rumination interruption, outcome analytics
- **Clinic:** $29/seat/mo — aggregate PHQ-9 trends, suicide-risk dashboard

### MVP Feature Set
- PHQ-9 + C-SSRS administration + scoring + trend (item 9 always surfaced separately)
- Activity scheduler (pleasure + mastery ratings, graded task assignment)
- Behavioral activation log (what did, pleasure rating, mastery rating, mood pre/post)
- Sleep hygiene tracker + bedtime/wake time consistency score
- Rumination interruption tool (10-minute worry timer + redirect prompt)
- Social connection micro-goal tracker
- Safety planning tool (digital safety plan, editable with therapist)
- Safety escalation: 988 + therapist + emergency contact (suicide-care rail)

### ParentScript Integration
- Reuse `skills` + `client_skill_state` + practice log schema
- Add `activity_logs` table (client_id, activity, pleasure_rating, mastery_rating, mood_pre, mood_post, timestamp)
- Add `sleep_logs` table (client_id, bedtime, wake_time, quality, timestamp)
- Add `safety_plans` table (client_id, warning_signs, coping_strategies, support_people, crisis_resources, lethal_means_plan)
- Add `instruments.phq9` and `instruments.cssrs`
- In-the-Moment: suicidal ideation (routes to human), can't get out of bed, rumination spiral
- Suicide-care rail: PHQ-9 item 9 > 0 → C-SSRS → 988/therapist → safety plan display

### Competitive Landscape
| Competitor | Model | Price | Gap MAZE Fills |
|------------|-------|-------|---------------|
| **Woebot** | B2C AI chatbot | Free | No therapist relationship, no BA structure |
| **Mindstrong** | B2B payer analytics | Payer contract | Passive monitoring, no patient engagement |
| **Ginger** | B2B coaching | Employer-paid | Coaching, not CBT; no structured BA |
| **Deprexis** | Prescription digital therapeutic | Insurance | European; requires prescription; heavy |
| **Sanvello** | B2C self-help | $8.99/mo | Self-help, no therapist control |

**MAZE Differentiator:** Therapist-controlled BA with suicide-care rail integrated, structured activity scheduling, and longitudinal PHQ-9 tracking.

---

## 6. TRAUMA / PTSD

### App Name Suggestions
- **GroundScript**
- **SteadyPath**
- **Reclaim**
- **AnchorPoint**

### Target User Personas
| Role | Persona | Key Pain Point |
|------|---------|---------------|
| **Therapist** | Dr. Rivera, 48, CPT-certified, trauma specialist | Patients dissociate between sessions; need grounding tools they'll remember to use |
| **Patient** | David, 34, combat veteran, PTSD + chronic pain | Flashbacks at work; needs discrete, fast grounding no one notices |
| **Partner** | David's spouse, sleeps lightly due to his nightmares | Needs guidance on supporting without walking on eggshells |

### Pricing Model
- **Free:** 2 clients (lower cap due to complexity), L1–L2, PCL-5
- **Solo:** $24/mo — unlimited clients, full curriculum, grounding tools, trigger log
- **Pro:** $44/mo — adds trauma narrative workspace, exposure session logger, dissociation tracking
- **Clinic:** $34/seat/mo — VA/group practice dashboard, outcome analytics

### MVP Feature Set
- PCL-5 + LEC administration + scoring + trend
- Grounding toolkit (5-4-3-2-1, physical anchor, cold water, muscle tension/release)
- Trigger identification and intensity log
- Window of tolerance self-monitoring (hyperarousal ↔ hypoarousal tracking)
- Sleep/nightmare log with coping response
- Containment visualization ("put the memory away" guided exercise)
- Stuck point journal (structured CPT-style thought records)
- Safety escalation: 988 + therapist + crisis line

### ParentScript Integration
- Reuse `skills` + `client_skill_state` + practice log schema
- Add `grounding_sessions` table (client_id, technique, pre_distress, post_distress, timestamp)
- Add `trigger_logs` table (client_id, trigger, intensity, response_used, outcome)
- Add `trauma_narratives` table (client_id, narrative_text encrypted, therapist_id, session_date)
- Add `instruments.pcl5` and `instruments.lec`
- In-the-Moment: flashback, dissociation, nightmare scripts
- *Note:* Trauma narrative storage requires encryption + BAA; defer to Pro tier with compliance milestone

### Competitive Landscape
| Competitor | Model | Price | Gap MAZE Fills |
|------------|-------|-------|---------------|
| **PTSD Coach** | VA B2C app | Free | Self-help, no therapist dashboard, no unlock mechanic |
| **CPT Coach** | VA companion | Free | CPT-only, no other modalities, no real-time coaching |
| **PE Coach** | VA companion | Free | PE-only, no therapist control |
| **NOCD** | OCD + trauma | Free app; therapy $$$ | No trauma-specific grounding tools, no CPT integration |
| **Lyssn** | Therapy session AI analysis | Clinic contract | Analyzes sessions, doesn't provide between-session tools |

**MAZE Differentiator:** Only platform with therapist-controlled trauma stabilization (L1–L2) before processing (L4), integrated grounding toolkit, and PCL-5 longitudinal tracking.

---

## 7. AUTISM SPECTRUM

### App Name Suggestions
- **AuthentiScript** (authenticity + script)
- **NeuroPath**
- **Unmask** (bold, community-aligned)
- **Flourish** (strengths-focused)

### Target User Personas
| Role | Persona | Key Pain Point |
|------|---------|---------------|
| **Therapist** | Jordan, 33, neurodiversity-affirming LPC, late-diagnosis specialty | Clients need accommodation support between sessions; parents need education |
| **Patient** | Aisha, 28, diagnosed at 27, masking burnout | Needs permission to unmask + practical tools for work/home |
| **Parent** | Aisha's mom, still learning neurodiversity paradigm | Wants to support but defaults to "try harder" messaging |

### Pricing Model
- **Free:** 3 clients, L1–L2, AQ-10
- **Solo:** $19/mo — unlimited clients, full curriculum, sensory profile, accommodation planner
- **Pro:** $39/mo — adds workplace/school advocacy tools, burnout recovery plan, autistic community connection
- **Clinic:** $29/seat/mo — family system dashboard, sibling support resources

### MVP Feature Set
- AQ-10 / RAADS-R administration + scoring
- Sensory profile builder (hypersensitive/hyposensitive across all senses)
- Energy accounting (spoon tracker) with pattern visualization
- Stimming log (what, when, regulation effect) — destigmatized framing
- Accommodation request generator (work, school, healthcare)
- Unmasking micro-goal tracker
- Routine builder with visual schedule
- Social navigation scripts (not "social skills" — context-appropriate communication)
- Safety escalation: 988 + therapist (burnout/depression comorbidity)

### ParentScript Integration
- Reuse `skills` + `client_skill_state` + practice log schema
- Add `sensory_profile` table (client_id, sense, sensitivity_level, triggers, accommodations)
- Add `energy_logs` table (client_id, spoons_used, spoons_available, activities, crash_flag)
- Add `accommodation_requests` table (client_id, setting, request_text, status, outcome)
- Add `instruments.aq10`
- In-the-Moment: sensory overload, autistic burnout, social overwhelm scripts
- Accessibility: dark mode default, reduced motion, no autoplay audio, high contrast

### Competitive Landscape
| Competitor | Model | Price | Gap MAZE Fills |
|------------|-------|-------|---------------|
| **Habitica** | Gamified task manager | Free | Not clinical, no therapist integration |
| **Todoist** | General task manager | $4/mo | No neurodivergent-specific design |
| **Tiimo** | Visual schedule | $7/mo | Tool-only, no clinical framework |
| **Cognito** | Autism therapy platform | Insurance | ABA-focused, not affirming |
| **NOVA** | Autism support app | Free | Parent-focused, not autistic-adult-centered |

**MAZE Differentiator:** The only neurodiversity-affirming, therapist-controlled platform with sensory profiling, energy accounting, and unmasking support.

---

## 8. RELATIONSHIP / FAMILY SYSTEMS

### App Name Suggestions
- **BondScript**
- **TogetherPath**
- **RepairFlow**
- **Weave** (interconnection)

### Target User Personas
| Role | Persona | Key Pain Point |
|------|---------|---------------|
| **Therapist** | Dr. Chen, 50, EFT-certified couples therapist | Couples forget repair attempts between sessions; need structured homework |
| **Patient** | Partners Alex + Sam, together 8 years, pursuer-withdrawer pattern | Same fight every week; need real-time de-escalation support |
| **Family** | Blended family, 4 kids, high conflict between co-parents | Needs structured communication tools kids can witness |

### Pricing Model
- **Free:** 2 couples, L1–L2, relationship satisfaction screen
- **Solo:** $24/mo — unlimited couples, full curriculum, shared dashboard, bid tracker
- **Pro:** $44/mo — adds conflict analysis, gridlocked conflict workspace, intimacy communication tools
- **Clinic:** $34/seat/mo — family therapy group dashboard, multi-generational genogram tool

### MVP Feature Set
- Gottman Relationship Assessment or Dyadic Adjustment Scale
- Bid for connection tracker (daily log, turning toward/away/against)
- Four Horsemen incident logger (self-awareness tool)
- Repair attempt library + practice log
- Timeout protocol timer (20-minute break with return reminder)
- Shared ritual builder (date nights, morning routines, bedtime)
- "I" statement constructor (guided formula with examples)
- Co-parenting communication tool (structured messaging, no emotion escalation)
- Safety escalation: domestic violence hotline + individual therapist contact

### ParentScript Integration
- Reuse `skills` + `client_skill_state` + practice log schema
- Add `relationship_logs` table (couple_id, bid_date, bid_type, response_type, notes)
- Add `conflict_logs` table (couple_id, trigger, horsemen_present, de_escalation_used, repair_attempt)
- Add `rituals` table (couple_id, ritual_name, frequency, last_completed, streak)
- Add `instruments.gottman` or `instruments.das`
- In-the-Moment: escalating conflict, withdrawer shutdown, betrayal rupture scripts
- Shared dashboard: both partners see same data (with consent); private journal option per partner

### Competitive Landscape
| Competitor | Model | Price | Gap MAZE Fills |
|------------|-------|-------|---------------|
| **Lasting** | B2C couples app | $79.99/yr | Self-help, no therapist control |
| **Paired** | B2C couples app | $74.99/yr | Same as Lasting — consumer, not clinical |
| **Gottman Card Decks** | Physical cards | $15 | No digital tracking, no therapist dashboard |
| **Regain** | Online couples therapy | $60–90/week | Therapy delivery, not between-session tool |
| **OurRelationship** | Research-based program | $50–150 | Fixed curriculum, no therapist customization |

**MAZE Differentiator:** Only therapist-controlled couples platform with real-time conflict de-escalation, Gottman-based tracking, and shared/private data architecture.

---

## Cross-Cutting Integration Notes

### Technical Reuse
All 8 modules share:
- **Auth layer:** Supabase Auth + RLS (existing)
- **Schema core:** `therapists`, `clients`, `skills`, `client_skill_state`, `practice_logs`
- **UI shell:** React + Vite + Tailwind PWA with role-based routing
- **In-the-Moment button:** same component, module-specific script routing
- **Safety escalation:** 988/911/therapist always visible, module-appropriate crisis paths
- **Instrument framework:** one table per validated scale, auto-scoring, trend charts

### Content Development Timeline
| Module | Content Weeks | Clinical Advisor Needed | Risk Level |
|--------|--------------|------------------------|------------|
| Anxiety | 6–8 | GCBT-certified | Medium |
| Depression | 6–8 | CBT/BA specialist | **High** (suicide rail) |
| ADHD | 6–8 | ADHD coach or psychologist | Low |
| Trauma | 8–10 | CPT/PE/EMDR certified | **High** (dissociation, suicide) |
| Autism | 6–8 | Autistic clinician or ND-affirming therapist | Medium |
| Relationships | 6–8 | EFT or Gottman-certified | Medium |
| Addiction | 10–12 | ASAM-certified or SUD specialist | **Very High** (medical) |
| Eating Disorders | 10–12 | CBT-E or FBT certified | **Very High** (medical) |

### Launch Priority Ranking
1. **Anxiety** — largest addressable market, lowest regulatory risk, strongest evidence base
2. **Depression** — massive market, but requires suicide-care rail first
3. **ADHD** — growing adult diagnosis market, natural ParentScript extension
4. **Trauma** — high need, but requires stabilization-first protocol and clinical rigor
5. **Relationships** — large market, different user model (couple vs. individual)
6. **Autism** — underserved adult market, strong community alignment
7. **Eating Disorders** — high clinical value, high liability, requires medical team integration
8. **Addiction** — highest regulatory burden, partner-led recommended

---

*End of Expansion Implementation Guide. Review quarterly against market conditions and clinical feedback.*
