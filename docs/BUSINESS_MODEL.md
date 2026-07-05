# MAZE — Business Model Recommendation

**For:** Dov / Ariella (AMAZED Labs)
**Status:** Decision-ready. The current plan ($29/mo therapist, parents free) is close to right but should be adjusted. See §6.
**Scope:** Pricing, tiers, GTM, and what to gate. Not a financial model or fundraising deck.

---

## TL;DR

**Charge therapists. Keep parents free. Always.**

That single decision unlocks the whole model, and it's the only decision you can't really reverse after launch. Everything below is calibration of that call.

- **Primary model:** B2B SaaS subscription paid by the therapist (the side that has the willingness and ability to pay, the employer budget, and the regulatory cover to use it with minors).
- **Pricing:** **$19/mo solo / $39/mo per-seat in a clinic** (annual discount). Free for the first 3 active clients; standard tier caps at ~25 active clients; a "Pro" tier adds L4–L5 content, analytics, and free-text notes (when compliance allows).
- **Parents: free, always, no exceptions.** Do not gate, do not "trial," do not soft-charge.
- **Clinic / group practice:** per-seat pricing plus a clinic admin seat (free). No volume discount in Phase 2; revisit when you have 20+ paying clinics.
- **GTM:** therapist-led distribution. The therapist _is_ the channel. Land with solo PCIT-certified therapists at conferences and in PCIT International's directory, expand into group practices, then clinic-wide deals.

The build plan's existing price ($29/mo, ~10 active clients) is in the right neighborhood. **I'd shift it down to $19/mo and drop the client cap**, then raise the floor to $39 once you have L4–L5 + analytics behind the paywall.

---

## 1. The two-sided pricing question

There are three honest options for a two-sided app like MAZE. I've evaluated each.

| Model                                                      | Who pays       | Verdict                                           |
| ---------------------------------------------------------- | -------------- | ------------------------------------------------- |
| **B2B only (therapist subscription)**                      | Therapist      | ✅ Recommended                                    |
| **Hybrid (therapist subscription + parent freemium tier)** | Both           | ⚠️ Possible but adds friction without much upside |
| **B2C freemium (parent subscription)**                     | Parent         | ❌ Avoid                                          |
| **Per-client / per-family micro-fee**                      | Passed through | ❌ Adds billing complexity, pisses off therapists |

### Why B2B wins for MAZE

1. **The therapist is the demand-creator.** Parents don't download MAZE because they saw an Instagram ad — they download it because their therapist sent them an invite link. The therapist is your CAC channel _and_ your paying customer _and_ the one with budget authority. Charging parents means taxing the side you don't have a relationship with and that has weaker payment intent.
2. **The therapist has the budget.** Therapy practice software (SimplePractice, Jane, TherapyNotes) runs **$39–$99+/mo per practitioner**. A solo therapist can expense $19/mo on a credit card with no approval. A parent downloading a parenting app to manage their kid's tantrums will churn at $9.99/mo when the tantrums stop.
3. **Parents churn when the crisis ends.** PCIT runs 12–20 weeks. The parent's utility curve looks like an inverted V — high at week 3, near zero at week 14. Billing them is a guaranteed refund request at the exact moment they tell friends "it worked."
4. **The therapist sees the value every session.** Each session, they check the parent's practice log, unlock the next skill, and leave a structured note. That's weekly active engagement — a paid user who _touches the product every week_. Parents might open MAZE twice a week; therapists open it every session.
5. **Regulatory.** MAZE handles data _about a child_ under therapist direction. Billing the parent for a tool their clinician prescribed raises questions about induced demand and patient steering. Billing the therapist for a clinical tool is unremarkable.

### Why not hybrid (charge therapists AND parents)

You'd be tempted by the optics: "therapist pays $19, parent pays $4.99/mo for premium coaching content." Don't.

- The therapist has already paid for the curriculum. Charging parents for premium content undercuts the model: the therapist _is_ the coach. You'd be selling the therapist's expertise back to their own client.
- The moment you charge the parent, customer support costs double (one paying customer = one angry email; two paying customers per family = two angry emails about a tantrum app).
- You can't A/B test it cleanly. The parent's app is a constrained surface — locked skills, no free-text — so there's almost nothing premium to gate without breaking the model.

The one legitimate hybrid is: **parents are always free, but therapists can sell MAZE to their clinic as a "patient engagement" line item** (i.e., the clinic reimburses the therapist's subscription as a practice expense, and parents never see a bill). That's not a different model — it's the same B2B model sold one tier up the org chart.

### Why not B2C freemium

Headspace ($12.99/mo) and Calm ($14.99/mo) prove you _can_ charge parents for content. But they sell self-help content; you sell **a controlled curriculum prescribed by their therapist**. Three problems:

- **Acquisition is unsolvable on the B2C side.** Parents searching "behavioral parent training app" find generic content. They won't find MAZE because MAZE requires a therapist relationship. Your SEO/SEM has nothing to hook.
- **Conversion requires clinical trust.** A parent won't pay $9.99/mo for "the app my therapist uses" when their therapist would give them the cheat sheets for free.
- **App Store / Play Store dynamics.** PWA avoids this for MVP, but the moment you ship native, you cede 30% to Apple/Google. At $9.99/mo, that's $3. That's $36/yr in fees for a user who churns in 14 weeks. The unit economics break.

### Why not per-client / per-family

Some clinic tools charge per-active-client (TherapyNotes, for example, has a per-claim pricing component). Don't.

- Therapists hate per-client pricing because it punishes them for caseload growth.
- Parents don't understand "your therapist's app costs them $2/case, which they passed to you."
- It makes your invoice a moving target. Subscription pricing is a fixed mental cost; metered pricing triggers cancellation reviews monthly.

---

## 2. Pricing tiers

### Recommended Phase 2 launch pricing (post-MVP validation)

| Tier       | Price                                             | Who it's for             | Limits                                                                                                                                                                     |
| ---------- | ------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free**   | $0                                                | Any therapist signing up | 3 active clients, L1–L3 content, structured notes only                                                                                                                     |
| **Solo**   | **$19/mo** or $190/yr ($15.83/mo)                 | Solo practitioner        | Unlimited active clients, L1–L3 content, structured notes, basic practice-log summary                                                                                      |
| **Pro**    | **$39/mo** or $390/yr ($32.50/mo)                 | Solo or clinic seat      | Everything in Solo + L4–L5 content (when shipped), free-text notes (when compliance-ready), parent analytics dashboard, custom structured-note templates, priority support |
| **Clinic** | **$29/seat/mo** (min 3 seats) + 1 admin seat free | Group practices          | Pro features per seat; clinic admin dashboard; bulk invite/deactivate                                                                                                      |

**Why these numbers:**

- **$19/mo is below every therapy-practice software price point** (SimplePractice $39, Jane $39–$99, TherapyNotes ~$80). It's a "yes" price — a therapist can expense it on a credit card without clinic approval. Below $20 you hit the impulse-purchase zone.
- **$39/mo is at the _low_ end of clinical software**, which signals "real tool, not a toy." Pairs well with L4–L5 (the content that takes 6+ months of clinician time to author and review).
- **Annual at ~17% discount** is the SaaS norm (RevenueCat data: health & fitness is the most annual-friendly vertical at 68% annual mix). Annual locks you in for the duration of a typical PCIT course (12–20 weeks) × multiple cases.
- **Free tier exists for two reasons**: (1) you need therapists to try it before they'll switch from their current workflow, and (2) PCIT trainees and graduate-clinic supervisors are a natural design-partner segment — give them free forever and they'll evangelize at their next job.
- **3-client free cap** is meaningful but not punitive. A trainee with 2–3 supervised cases is exactly who you want as a power user. A solo with 30+ clients will outgrow free in a week.
- **Per-seat clinic pricing** is the B2B SaaS default for tools used by multiple practitioners (Calendly, Notion, Linear, 1Password all do this). Discount per seat vs. solo is the GTM trade: clinics buy more seats, get better conversion, but cost less per seat because clinics have procurement friction you don't want to fight twice.

### Why I'm pushing back on the build plan's $29/mo

The existing plan says **$29/mo per therapist, ~10 active clients**. Three corrections:

1. **$19 beats $29 for solo therapists.** The $10/mo delta is the difference between "I'll expense this on a card" and "I need to talk to my practice owner." Solo therapists — your Phase 2 GTM target — are price-sensitive because they're paying out of post-tax income.
2. **Drop the active-client cap on Solo.** A 25-client cap feels punitive ("you're a power user, pay us more"). The marginal cost of a 26th client is essentially zero for MAZE (Supabase row counts, mostly). Don't engineer a soft paywall you don't need; raise price via _features_ (the Pro tier), not client count.
3. **Reserve client caps for the Free tier.** This is the right place — it converts engaged trainees into paying users without taxing productive solo therapists.

---

## 3. What to gate behind paid

The general rule: **gate features that compound with usage; don't gate features that gate onboarding.**

### Free tier

- Up to 3 active clients
- L1–L3 skills curriculum (the full PCIT/BPT foundation, which is enough to deliver real value)
- Structured therapist notes (the templates in the build plan)
- Parent PWA with all cheat sheets, In-the-Moment, practice logging
- Magic-link parent invites

### Solo ($19/mo) — the must-have paid jump

- Unlimited active clients
- Everything in Free
- Practice-log summary view (the §11.8 therapist dashboard)
- Email support

### Pro ($39/mo) — the upsell

- **L4–L5 content** (regulation, co-regulation, maintenance). These are authored last because they require the deepest clinical review.
- **Free-text clinical notes** (gated behind Pro _and_ behind a compliance milestone — HIPAA review, BAA with Supabase if applicable).
- **Parent analytics dashboard** (trends in practice frequency, skill-completion rates, escalation frequency over time).
- **Custom structured-note templates** (so a CBT therapist can build their own templates, not just PCIT).
- **Practice reminders / push notifications** for parents.
- **Outcome-measure integrations** (e.g., ECBI, SDQ — the validated instruments therapists already use).
- **Priority support.**

### Clinic ($29/seat/mo)

- Everything in Pro, per seat
- Clinic admin dashboard (aggregate metrics, no individual client PHI)
- Bulk invite/deactivate therapists
- Clinic-wide structured-note template library
- Single billing relationship

### What to **never** gate

- The In-the-Moment parent button. _Ever._ It exists to defuse a crisis. A paywall on a parent's crisis button is a clinical liability and a PR disaster. (This is also why parents are always free — they shouldn't be billed for a tool they're using mid-meltdown.)
- The 988 / 911 / therapist-call escalation. Always visible, always free.
- L1–L3 content. The curriculum is the _foundation_ of the model. Locking it would be like SimplePractice locking the calendar feature. You don't do that.

---

## 4. The "therapist as distribution channel" dynamic

This is the single most important strategic insight in this analysis and the build plan correctly identifies it without naming it. State it explicitly:

**The therapist is not just your customer. The therapist is your CAC, your onboarding, your retention, your support, your QA, and your brand.**

| Function             | In a typical B2B SaaS | In MAZE                                                                             |
| -------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| Customer acquisition | Sales / marketing     | Therapist invites a parent                                                          |
| Onboarding           | Self-serve docs / CSM | Therapist does it in-session, hands parent the phone                                |
| Activation           | User discovers value  | Parent opens the cheat sheet in front of therapist                                  |
| Retention            | Product stickiness    | Therapist's clinical workflow depends on it                                         |
| Support              | Tier 1 / 2            | Therapist is the de facto support (and they're trained to handle distressed humans) |
| Quality assurance    | Reviews, monitoring   | Clinician reviews content before parents see it                                     |

Every other B2B SaaS has to _build_ these functions. You get them for free because the therapist already does them as part of their job.

**Implications:**

1. **Your marketing budget is therapist conferences, not Meta ads.** PCIT International has an annual convention. The Association for Behavioral and Cognitive Therapies (ABCT) has one. State-level behavioral-health chapters. Ariella's professional network. Target the **PCIT-certified therapist** specifically — they're a small, identifiable population (~5,000–8,000 globally) with deep curriculum affinity.
2. **Your NPS question is not "would you recommend MAZE?" — it's "would you prescribe MAZE to your next client?"** This is a different metric because the therapist is both the user and the prescriber.
3. **Your churn curve follows clinical caseloads, not product usage.** A therapist churns when they change jobs, retire, or stop using PCIT — not when a new competitor launches. This is _good news_: churn is structurally low.
4. **Network effects are real but slow.** Every therapist who uses MAZE makes it easier to refer clients between therapists (continuity of care), and every parent who's had MAZE tells their friends "ask your therapist about MAZE." But the cycle is months, not weeks. Don't expect viral growth; expect durable, compounding growth.
5. **You have one rule for the parent-side UX: zero friction.** The therapist is your customer. The parent is your therapist's patient. Every extra step on the parent side is friction the therapist pays for in session time. PWA install on first visit (not "go to the App Store"), one-tap magic-link sign-in, no tutorial — the parent should be looking at their first cheat sheet in under 30 seconds from invite.

### The therapist-as-channel risk

There's one risk to flag: **if a therapist has a bad experience, they don't churn quietly — they tell every parent they see for the next five years.** Therapist word-of-mouth in clinical communities is _brutal_. This is why the free tier is generous (let therapists try before they buy) and why the parent-side UX has to be impeccable (the therapist's reputation is on the line).

---

## 5. Revenue projections

These are directional, not a financial model. Assumptions are listed; override them.

**Assumptions:**

- PCIT-trained therapist population: ~7,000 in the US (PCIT International directory + certified-trainee lists).
- Behavioral parent training (BPT) therapists with overlapping practice: ~30,000.
- Total addressable solo + small-clinic therapists who might prescribe a digital companion: ~25,000.
- Phase 2 launch conversion target (Year 1): 0.5% of addressable = 125 paying therapists.
- Year 2: 2% = 500 paying therapists.
- Year 3: 5% = 1,250 paying therapists.
- Mix: 70% Solo / 25% Pro / 5% Clinic (with avg 4 seats = 0.2 seats/therapist blended). Re-blend in Year 3 as clinics grow.

**Revenue at recommended pricing:**

| Year                     | Solo @ $19/mo       | Pro @ $39/mo        | Clinic @ $29/seat           | Blended ARPU/therapist | MRR      | ARR       |
| ------------------------ | ------------------- | ------------------- | --------------------------- | ---------------------- | -------- | --------- |
| **Year 1** (post-launch) | 87 × $19 = $1,653   | 31 × $39 = $1,209   | 6 × $29 × 4 seats = $696    | ~$28.5                 | ~$3,560  | ~$42,700  |
| **Year 2**               | 350 × $19 = $6,650  | 125 × $39 = $4,875  | 25 × $29 × 4 seats = $2,900 | ~$28.9                 | ~$14,425 | ~$173,100 |
| **Year 3**               | 875 × $19 = $16,625 | 313 × $39 = $12,207 | 63 × $29 × 4 seats = $7,308 | ~$29.0                 | ~$36,140 | ~$433,700 |

**Sensitivity at the original build plan's $29/mo:**

| Year   | Therapists | ARPU | ARR       |
| ------ | ---------- | ---- | --------- |
| Year 1 | 125        | $29  | ~$43,500  |
| Year 3 | 1,250      | $29  | ~$435,000 |

The two pricing strategies are close in Year 1–2. **Year 3 is where the difference compounds**: at $19 base + Pro upsells, your ARPU grows as more users adopt Pro and clinics. At flat $29, you're capped.

**Bear case (60% of base):** ~$260K ARR by Year 3. Still fundable for a small studio; not fundable for a Series A.

**Bull case (2x base + clinics grow faster than solo):** ~$900K ARR by Year 3 with deeper clinic penetration. Realistic if you land 2–3 large group-practice or hospital-system deals.

### What to do with parents-on-the-app metric

You'll be asked (by yourselves, by investors) about MAUs / parents on the platform. Here's how to think about it:

- **Track it, but don't monetize it.** Parents on the platform is your leading indicator of therapist retention. If parents stop opening the app, therapists will churn in 90 days.
- **Target metric:** Parents-per-paying-therapist. Healthy is 8–15 (a typical PCIT caseload). Above 20 means the therapist is stretched and at risk of burnout-driven churn.
- **Parent MAU as a vanity metric.** Don't put "100K parents using MAZE!" on your landing page. It's not the value prop — _therapist-prescribed_ is the value prop. A parent using MAZE without their therapist in the loop is a liability, not an asset.

---

## 6. Adjustments to the build plan

The current plan §8 (Phasing) says: _"monetization ($29/mo per therapist, ~10 active clients — parents always free)"_.

Recommended changes:

| Item            | Build plan                                 | Recommendation                                       | Why                                                                                                   |
| --------------- | ------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Price           | $29/mo                                     | **$19/mo Solo / $39/mo Pro**                         | $19 is below the impulse threshold for solo therapists; Pro at $39 is the real floor once L4–L5 ships |
| Client cap      | ~10 active clients                         | **Drop on Solo**; cap at 3 on **Free**               | Cap on Free forces conversion; cap on Solo is punitive and unnecessary                                |
| Annual discount | Not specified                              | **~17% off** (2 months free)                         | SaaS default; locks multi-case usage                                                                  |
| Free tier       | Not specified                              | **3 clients, L1–L3, structured notes only**          | Drives trainees, supervisors, and trial conversion                                                    |
| Clinic tier     | "multi-clinician orgs" deferred to Phase 3 | **Launch clinic tier in Phase 2** (per-seat + admin) | Group practices are your highest-LTV segment; don't wait                                              |
| Parent gating   | "always free"                              | **Keep**                                             | Non-negotiable                                                                                        |

---

## 7. Go-to-market (Phase 2)

Sequence matters. Don't run all of these at once.

### Phase 2a — Month 1–3: Design partner cohort (no marketing spend)

- Recruit 20–30 therapist design partners from Ariella's network + PCIT International directory.
- Free Solo for life in exchange for: weekly 30-min feedback calls, written testimonials, conference introductions.
- Goal: validate the $19/mo price point (do they pay after free ends?), identify Pro-tier features they actually want, capture before/after workflow data.
- **Critical signal:** if <50% of free design partners convert to paid at $19, the price is wrong (raise to $29) or the value prop is wrong (raise feature set first). If >75% convert, consider raising to $24.

### Phase 2b — Month 3–9: Solo therapist acquisition

- **Conference circuit.** PCIT International Convention, ABCT, state-level behavioral-health chapters. Booth presence, talk submissions, poster sessions. Target audience is small but _high intent_ — they came to learn about exactly what you built.
- **Content marketing for clinicians.** One blog post per week on a real clinical question (e.g., "How do you explain the PRIDE skills to a parent who's too anxious to play?"). SEO these against the queries therapists actually search. Don't write for parents — they aren't your buyer.
- **Direct outreach to PCIT-certified therapists.** The PCIT International directory is public. Personalized email referencing their clinic, their recent training. Slow, manual, works.
- **Referral program.** Give therapists who refer another therapist one month free. Trivial to implement, high trust because the referrer is a peer.

### Phase 2c — Month 9–18: Clinic / group practice

- Approach 5–10 mid-size group practices that employ 3+ PCIT-trained therapists. Offer 3 months at the clinic rate in exchange for a case study.
- Group practices have procurement friction. Build for it: SSO-ready, even if it's Google Workspace SSO in v1. Invoice-based billing, not card-only.
- Don't pursue hospital systems or insurance networks in Phase 2. The sales cycle is 12+ months and they won't pay per-seat — they pay per-encounter, which is a different (worse for you) model.

### Phase 2d — Month 12–24: Optional B2B2C

This is the long-term optional play. If a clinic or health system wants to **bundle MAZE into their patient-facing app** (white-label or co-branded), take the deal — but only if it doesn't compromise the data-minimization model. Revenue model: per-licensed-therapist pricing, same as Clinic tier, with a markup to the parent org. This is _not_ a near-term priority.

### What NOT to do in GTM

- **Don't run Meta ads to parents.** It's the wrong audience. Even at $5 CAC you'd be paying to acquire users who can't use the product (no therapist invite).
- **Don't publish "for parents" content marketing.** It's a brand play, not an acquisition play. Parents don't search for MAZE; therapists search for tools like MAZE.
- **Don't race to a freemium parent app.** Every minute spent on parent-side growth is a minute not spent on therapist sales.
- **Don't undercut Jane or SimplePractice.** MAZE is _adjacent_ to practice management software, not a competitor. Don't try to replace the calendar; complement the session.

---

## 8. Long-term revenue model options (parking lot, not near-term)

These are worth thinking about now only so you don't accidentally foreclose them. None are Phase 2 priorities.

1. **Outcome-measure licensing.** If you can show MAZE improves ECBI scores / SDQ scores / session attendance vs. control, group practices and payers will pay for access to the data. Year 3+ conversation.
2. **Continuing-education (CE) credit.** Therapists need CEs. If MAZE offers a CE-accredited curriculum review (pay $X, get Y CE hours), that's a natural add-on. Requires CE accreditation partnership, which takes ~6 months. Year 2.
3. **Insurance reimbursement / prescription digital therapeutic (PDT).** EndeavorRx path: FDA-cleared, insurance-billed. Massive upside, ~$5M and 3–5 years to execute. Year 3+ only. Don't start until you have product-market fit and a clinical advisory board.
4. **White-label / B2B2C with EHR vendors.** SimplePractice, Jane, TherapyNotes might want to embed a parent-engagement module. White-label deals are usually lopsided (you get distribution, they get price leverage) but worth a conversation in Year 2–3.
5. **Direct-to-consumer therapist directory.** "Find a PCIT therapist near you" — but only after you've saturated the supply side. Don't compete with Psychology Today in Phase 2.

---

## 9. Decisions for Dov / Ariella

These are the calls that need to be made before Phase 2 pricing is finalized. Listed in priority order.

1. **Confirm: parents are always free, no exceptions.** This is the strategic bedrock. Everything else is calibration.
2. **Confirm: $19/mo Solo / $39/mo Pro / $29/seat Clinic.** If not, what's the price and why? Push back if you have a therapist in mind who's already validated a number — that's better than my modeling.
3. **Confirm: free tier at 3 active clients.** The trade-off is "lower free-tier conversion friction" (raise cap to 5) vs. "faster paid conversion" (keep at 3).
4. **Free-text notes: behind Pro, behind compliance milestone — agree?** This is a sequencing call, not a pricing call.
5. **Annual discount: 17% (2 months free) — agree?** Industry default; if you want to push harder to lock annual, 25% (3 months free) is the next step.
6. **Clinic tier in Phase 2 vs. Phase 3?** The build plan says Phase 3. I'd argue Phase 2, because clinic seats are your highest-LTV customers and you want design partners early. Push back if you want to defer complexity.
7. **Acceptable payment processor for therapist subscriptions?** Stripe (default), but if you want to be invoiced-billing-friendly for clinics (Net 30) you'll need Stripe Invoicing or a B2B billing tool like Metronome / Orb. Costs $0–$500/mo at your scale.

---

## 10. What this analysis is _not_

- **Not a financial model.** Revenue projections use round numbers and assumed conversion curves. Run a proper model with cohort analysis before any fundraising or hiring commitments.
- **Not a legal review.** Pricing strategy interacts with HIPAA, state telehealth laws, FTC Health Breach Notification Rule, and consumer health data laws (especially WA's My Health My Data Act). Get counsel before Phase 2 launches paid tiers.
- **Not a competitive moat analysis.** MAZE's defensibility comes from the curriculum + therapist relationships, not from pricing. Pricing is downstream of moat, not a moat itself.
- **Not a fundraising pitch.** This is internal decision-making. If/when you raise, the pitch is "therapist-prescribed parenting companion, B2B SaaS at clinical-software price points, with a curriculum moat that scales via therapist distribution." That's a different doc.

---

## Appendix: Competitive pricing reference

Pulled from public sources, Q1 2026.

| Product              | Model                            | Price                             | Notes                                                                                                                              |
| -------------------- | -------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **SimplePractice**   | B2B SaaS, therapist              | $39–$99/mo per practitioner       | EHR, billing, telehealth. The dominant solo-therapist platform.                                                                    |
| **Jane App**         | B2B SaaS, therapist              | $39–$99/mo per practitioner       | EHR + scheduling; Canadian, growing in US.                                                                                         |
| **TherapyNotes**     | B2B SaaS, therapist              | ~$50–$80/mo per practitioner      | Older, billing-heavy.                                                                                                              |
| **NOCD**             | B2C therapy service + free app   | Free app; therapy via insurance   | App drives leads into insurance-billed therapy. Closest structural analog to MAZE — free app, monetized on the care delivery side. |
| **Headspace**        | B2C subscription                 | $12.99/mo or $5.83/mo annual      | Self-help content. Proven willingness to pay for mental health content.                                                            |
| **Calm**             | B2C subscription                 | $14.99/mo                         | Same as Headspace.                                                                                                                 |
| **EndeavorRx**       | Prescription digital therapeutic | Insurance-billed / ~$100/mo cash  | FDA-authorized; clinician-prescribed; payer-reimbursed. The "if MAZE becomes a PDT" template.                                      |
| **Triple P Online**  | B2B2C via provider organizations | Provider-licensed, varies         | Curriculum is licensed to orgs; not consumer-priced.                                                                               |
| **Incredible Years** | B2B curriculum licensing         | Varies; subscription to streaming | Clinician-facing video library. Subscription model for clinicians.                                                                 |
| **Parenting Hero**   | B2C mobile app                   | $4.99 one-time                    | Low-end consumer parenting content. Not therapist-controlled.                                                                      |

**Key references:**

- ADHD apps market: $1.9B (2025) → $6.7B (2033), Grand View Research.
- Parent coaching apps market: $2.8B (2025) → $8.6B (2034), ~13% CAGR, Market Intelo.
- Average full-time therapist caseload: 20–30 clients/week, Headway / Mentalyc / Blueprint.
- Therapy session cost (US, cash): $100–$250/session, Doctronic.
- Therapist software per-seat pricing: $39–$99/mo is the established market.

---

**Bottom line for Dov/Ariella:** Charge therapists $19/mo (Solo) or $39/mo (Pro). Keep parents free forever. Don't gate the In-the-Moment button, ever. Land with solo PCIT-trained therapists first, expand to clinics, defer insurance/PDT work until you have product-market fit. The build plan's direction is right; the price needs to come down and the tiers need to come up.

_— Gary, 2026-06-25_
