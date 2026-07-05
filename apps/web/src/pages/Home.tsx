import { useState } from 'react';
import { Link } from 'react-router-dom';
import MarkHeader from '@/components/MarkHeader';
import MarkFooter from '@/components/MarkFooter';
import ScopeOfPracticeDisclosure from '@/components/ScopeOfPracticeDisclosure';

// ──────────────────────────────────────────────────────────────────────
// Home — public marketing landing page (parentscript.app/)
// ──────────────────────────────────────────────────────────────────────
//
// Mark's design system v1.0 (2026-07-03):
//   - Surface: monitor (light, clinical, calm, judgment-free)
//   - Indigo accent (#6366F1), Inter font, sentence case
//   - Calm/clinical voice — no "AI parenting coach," no "transform your journey"
//   - Required clinical guardrails: scope-of-practice disclosure inline;
//     crisis lines (988, 911) visible on the page
//
// Monitor archetype (from parentscript-dashboard.html):
//   - Sidebar nav + content density on authed screens
//   - Public marketing version: top header + glanceable hero + dense
//     "what it does" cards, no centerstage hero+3-cards pattern
//
// Copy slots that still need Quinn's polish are tagged TODO(QUINN).
// Clinical guardrails are Mira-verified. DO NOT add clinical claims
// without Mira sign-off — see brand-voice-guide.md MUST-NEVER list.

const PILLARS = [
  {
    eyebrow: 'Therapist-guided',
    title: 'Skills your clinician can review',
    body: 'Every skill your child practices is something your clinician can see and review between sessions. No more guessing what to work on between visits.',
    pillTone: 'accent' as const,
  },
  {
    eyebrow: 'Modality-cited',
    title: 'Built on PCIT, BPT, Triple P, CPS',
    body: 'Every script cites the framework it comes from — Parent-Child Interaction Therapy, Brief Parent Training, Triple P, Collaborative Problem Solving. Cited inline, not hidden in a footnote.',
    pillTone: 'info' as const,
  },
  {
    eyebrow: 'Safety, built in',
    title: '988 surface first, always',
    body: 'Crisis detection, mandated-reporting-aware disclosure, and clear scope-of-practice guardrails on every interaction. The safety rail is the load-bearing string.',
    pillTone: 'warm' as const,
  },
  {
    eyebrow: 'Session-log transparency',
    title: 'Parents and clinicians see the same picture',
    body: 'What was practiced, what worked, what to revisit. No black box. Your clinician walks into the next session already knowing what happened at home.',
    pillTone: 'neutral' as const,
  },
];

// Mira-verified headline candidates. Quinn picks one or writes a
// better one. These are pre-approved by clinical review.
// "Say the right thing at the right time" is the brand line from
// Mark's brand-voice-guide.md ("one line" for ParentScript).
const HEADLINE_CANDIDATES = [
  'Say the right thing at the right time.',
  'Scripts your therapist can stand behind.',
  'Between-session support, organized by framework.',
  'Built on PCIT, BPT, CPS, and DBT — not vibes.',
];

// FAQ — Mira-vetted. Each answer stays inside the "Claims we MAY make"
// boundary. No clinical-outcome numbers, no HIPAA certification claim,
// no "as effective as therapy" framing.
const FAQ = [
  {
    id: 'what',
    q: 'What exactly is ParentScript?',
    a: 'ParentScript is a therapist-guided parenting skills app. Your clinician assigns the specific skill to practice this week — a PCIT narration, a Triple P routine, a CPS Plan B — and it shows up in the parent app with what to say, what not to say, and the underlying principle. It is not therapy, and it is not a replacement for therapy.',
  },
  {
    id: 'how-much',
    q: 'How much does it cost?',
    a: 'Parents can start free — 1 In-the-Moment coaching interaction per day, plus the L1–L2 skill library. Therapists choose Solo ($19/mo, up to 25 parents), Pro ($39/mo, unlimited parents), or Clinic ($29/seat/mo). All paid plans include a 14-day free trial with no credit card required.',
  },
  {
    id: 'hipaa',
    q: 'Is my data HIPAA-protected?',
    a: 'We are designed as a HIPAA-aligned platform. We sign a Business Associate Agreement (BAA) with every covered-entity customer before any PHI is exchanged, use HIPAA-eligible infrastructure (Supabase on AWS, Stripe, Vercel edge with no PHI), and enforce row-level security so therapists only see their own caseload. Read the full Security & HIPAA page for the breach-notification policy, encryption details, and sub-processor list.',
  },
  {
    id: 'crisis',
    q: 'What happens if I say something about harming myself or my child?',
    a: 'If you describe a crisis — suicidal thoughts, thoughts of hurting your child, active abuse — ParentScript immediately stops the coaching flow and shows a full-screen screen with the 988 Suicide & Crisis Lifeline, Crisis Text Line (text HOME to 741741), Childhelp (1-800-422-4453), and 911. The interaction is logged as a red-flag event your clinician can see in their queue if you are connected to one. ParentScript is not a crisis service; in an emergency, call 911.',
  },
  {
    id: 'therapist',
    q: 'I am a therapist. How do I onboard my existing caseload?',
    a: 'Create a therapist account, then generate an invite link for each parent from the client list. Parents open the link, accept the scope-of-practice disclosure, and connect to you. You control which skills are unlocked for each family and see their practice logs, reflections, and any red-flag events between sessions.',
  },
  {
    id: 'modality',
    q: 'Which therapy approaches is ParentScript built on?',
    a: 'The skill library is grounded in the modalities clinicians already use: PCIT (Eyberg), BPT (Kazdin), CPS (Greene), Triple P (Sanders), Circle of Security (Hoffman/Marvin), DBT (Linehan), 1-2-3 Magic (Phelan), PMT (Forehand), and CBT-parent (Abelsohn). Every script cites its source modality so your clinician can review the lineage with you.',
  },
];

export default function Home() {
  // TODO(QUINN): pick one headline candidate or replace.
  // Default uses Mark's brand-voice one-liner.
  const headline = HEADLINE_CANDIDATES[0];

  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // TODO(QUINN): sub-headline / value prop paragraph.
  // Mira-vetted. Keep clinical guardrails (no "perfect," no "guaranteed").
  const subheadline =
    "ParentScript turns what your therapist assigns into something your family can actually use at 7pm on a Tuesday. Evidence-based scripts, a single tap for the hard moments, and a clinician who can see what's working.";

  // TODO(QUINN): source a real clinician testimonial with license
  // context disclosed. NO fabricated quotes.
  const testimonial = {
    quote:
      '"ParentScript gives me a way to extend the work we do in session into the moments families actually live in. The framing is right; the citations are right; my families trust it."',
    attribution: '— [Name, Credential, License #, State]',
    note: 'TODO(QUINN): replace with a real, signed clinician quote. Marketer-lane.',
  };

  return (
    <div className="min-h-dvh bg-ps-bg-soft flex flex-col">
      <MarkHeader product="parentscript" />

      <main className="flex-1">
        {/* ── Hero (Monitor archetype: glanceable hierarchy, not centered hero+3-cards) ── */}
        <section className="bg-ps-bg border-b border-ps-border">
          <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-14 md:py-20">
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-start">
              <div>
                <span className="ps-pill ps-pill-accent mb-4">
                  <span className="dot" />
                  For clinicians and the families they work with
                </span>
                <h2 className="text-[32px] md:text-[40px] leading-[1.2] font-bold tracking-tight text-ps-text mb-5">
                  {headline}
                </h2>
                <p className="text-base md:text-[17px] text-ps-text-soft leading-relaxed mb-8 max-w-xl">
                  {subheadline}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/signup" className="ps-btn ps-btn-primary ps-btn-lg">
                    Start 14-day free trial
                  </Link>
                  <Link to="/parent-signup" className="ps-btn ps-btn-secondary ps-btn-lg">
                    Parents — start free
                  </Link>
                </div>
                <p className="text-xs text-ps-muted mt-3">
                  No credit card required. Cancel anytime.
                </p>
              </div>

              {/* Inline dashboard preview — concrete artifact, not abstract promise */}
              <aside aria-label="Sample dashboard preview" className="ps-card">
                <div className="ps-card-head">
                  <div className="ps-card-title">
                    <span className="ps-eyebrow">Today's recommended script</span>
                    <h3>When the snack request gets stuck on repeat</h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="ps-pill ps-pill-warm">
                    <span className="dot" />
                    tantrum
                  </span>
                  <span className="ps-pill ps-pill-neutral">age 4</span>
                  <span className="ps-pill ps-pill-info">PCIT · CDI</span>
                </div>
                <p className="text-[15px] leading-relaxed text-ps-text py-4 border-y border-ps-border mb-4">
                  "i hear you really want another cracker.{' '}
                  <em className="not-italic bg-ps-warm-soft px-1 rounded text-ps-warm-ink font-medium">
                    i can't say yes right now.
                  </em>{' '}
                  what i can do is offer a banana, or we can read a story together while we wait for
                  dinner. which sounds good to you?"
                </p>
                <p className="text-xs text-ps-text-softer">
                  Why this works: validates the want, holds the limit, offers two acceptable
                  alternatives. Source: PCIT manual (Eyberg).
                </p>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Four pillars (real content density, not 3-card marketing) ── */}
        <section className="px-6 md:px-10 py-12 md:py-16 bg-ps-bg-soft">
          <div className="max-w-[1240px] mx-auto">
            <div className="mb-8 max-w-2xl">
              <span className="ps-eyebrow">What makes ParentScript different</span>
              <h3 className="text-2xl md:text-[28px] font-bold text-ps-text mt-2 tracking-tight">
                A therapist-guided practice companion, not a chatbot.
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {PILLARS.map(p => (
                <article key={p.title} className="ps-card">
                  <span className={`ps-pill ps-pill-${p.pillTone} mb-3`}>
                    <span className="dot" />
                    {p.eyebrow}
                  </span>
                  <h4 className="text-[17px] font-semibold text-ps-text mb-2 tracking-tight">
                    {p.title}
                  </h4>
                  <p className="text-sm text-ps-text-soft leading-relaxed">{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works (numbered steps) ── */}
        <section className="px-6 md:px-10 py-12 md:py-16 bg-ps-bg border-y border-ps-border">
          <div className="max-w-[1100px] mx-auto">
            <div className="mb-8 max-w-2xl">
              <span className="ps-eyebrow">How it works</span>
              <h3 className="text-2xl md:text-[28px] font-bold text-ps-text mt-2 tracking-tight">
                Four steps between your session and the next one.
              </h3>
            </div>
            <ol className="grid md:grid-cols-2 gap-4">
              {[
                {
                  step: '1',
                  title: 'Therapist assigns skills session by session',
                  body: "Your clinician unlocks the specific skill — a PCIT-CDI narration, a 1-2-3 Magic counting protocol, a CPS Plan B — that fits your family's presenting issue this week.",
                },
                {
                  step: '2',
                  title: 'Parent practices in the moment',
                  body: 'The unlocked skill shows up in the parent app with what to say, what not to say, and the underlying principle — in plain English with the modality cited.',
                },
                {
                  step: '3',
                  title: '"In the moment" for the hard days',
                  body: "When it's loud and your nervous system is shot, one tap walks you through TIPP, a co-regulation script, and a Plan B conversation — all on a single screen.",
                },
                {
                  step: '4',
                  title: 'Clinician sees what happened',
                  body: 'Practice logs, reflections, and red-flag events surface in the therapist dashboard between sessions — so the next visit starts where this week ended.',
                },
              ].map(s => (
                <li key={s.step} className="ps-card flex gap-4 items-start">
                  <span
                    aria-hidden="true"
                    className="shrink-0 w-10 h-10 rounded-full bg-ps-accent text-white font-bold text-lg grid place-items-center"
                  >
                    {s.step}
                  </span>
                  <div>
                    <h4 className="text-[16px] font-semibold text-ps-text mb-1 tracking-tight">
                      {s.title}
                    </h4>
                    <p className="text-sm text-ps-text-soft leading-relaxed">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Pricing teaser (dense, glanceable) ── */}
        <section className="px-6 md:px-10 py-12 md:py-16 bg-ps-bg-soft">
          <div className="max-w-[1100px] mx-auto">
            <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <span className="ps-eyebrow">Pricing</span>
                <h3 className="text-2xl md:text-[28px] font-bold text-ps-text mt-2 tracking-tight">
                  Simple, clinician-friendly pricing.
                </h3>
              </div>
              <Link
                to="/pricing"
                className="ps-link inline-flex items-center gap-1 text-sm font-medium"
              >
                Compare all features
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  tier: 'Solo',
                  price: '$19',
                  suffix: '/mo',
                  note: '1 therapist · up to 25 parents',
                  tone: 'plain',
                },
                {
                  tier: 'Pro',
                  price: '$39',
                  suffix: '/mo',
                  note: '1 therapist · unlimited parents',
                  tone: 'popular',
                },
                {
                  tier: 'Clinic',
                  price: '$29',
                  suffix: '/seat/mo',
                  note: 'Multiple therapists · shared roster',
                  tone: 'plain',
                },
              ].map(p => (
                <div
                  key={p.tier}
                  className={`ps-card relative ${p.tone === 'popular' ? 'border-ps-accent border-2 shadow-md' : ''}`}
                >
                  {p.tone === 'popular' && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 ps-pill ps-pill-accent">
                      Most popular
                    </span>
                  )}
                  <p className="ps-eyebrow mb-2">{p.tier}</p>
                  <p className="text-3xl font-bold text-ps-text">
                    {p.price}
                    <span className="text-base font-normal text-ps-text-softer">{p.suffix}</span>
                  </p>
                  <p className="text-xs text-ps-text-soft mt-2">{p.note}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-ps-text-soft mt-8">
              Parents start free — 1 coaching interaction per day, L1–L2 skill library.
            </p>
          </div>
        </section>

        {/* ── Trust / HIPAA teaser (warm, factual) ── */}
        <section className="px-6 md:px-10 py-12 md:py-16 bg-ps-bg border-y border-ps-border">
          <div className="max-w-3xl mx-auto">
            <div className="ps-alert">
              <div className="ps-alert-icon" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z" />
                </svg>
              </div>
              <div className="ps-alert-content">
                <span className="eyebrow">Built for clinical trust</span>
                <h2>HIPAA-aligned, US-only data residency.</h2>
                <p>
                  Row-level security ensures your therapist sees only their caseload. Data is
                  encrypted in transit and at rest. BAAs available on request.
                </p>
              </div>
              <div className="ps-alert-actions">
                <Link to="/security" className="ps-btn ps-btn-secondary ps-btn-sm">
                  Security & HIPAA
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonial (placeholder for Quinn) ── */}
        <section className="px-6 md:px-10 py-12 md:py-16 bg-ps-bg-soft">
          <div className="max-w-3xl mx-auto text-center">
            <span className="ps-eyebrow">From a clinician</span>
            <p className="text-xl md:text-[22px] text-ps-text leading-relaxed mt-4 italic">
              {testimonial.quote}
            </p>
            <p className="text-sm text-ps-text-soft font-semibold mt-4">
              {testimonial.attribution}
            </p>
            <p className="text-xs text-ps-muted mt-1 italic">{testimonial.note}</p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-6 md:px-10 py-12 md:py-16 bg-ps-bg border-t border-ps-border">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <span className="ps-eyebrow">Common questions</span>
              <h3 className="text-2xl md:text-[28px] font-bold text-ps-text mt-2 tracking-tight">
                From clinicians and parents.
              </h3>
            </div>
            <div className="space-y-3">
              {FAQ.map(item => {
                const isOpen = openFaq === item.id;
                return (
                  <div key={item.id} className="ps-card !p-0 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : item.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${item.id}`}
                      className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 min-h-tap hover:bg-ps-bg-soft transition-ps"
                    >
                      <span className="text-base md:text-[17px] font-semibold text-ps-text">
                        {item.q}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`shrink-0 text-ps-text-soft text-xl transition-transform duration-240 ${isOpen ? 'rotate-45' : ''}`}
                      >
                        +
                      </span>
                    </button>
                    {isOpen && (
                      <div
                        id={`faq-${item.id}`}
                        role="region"
                        className="px-5 pb-5 text-sm md:text-base text-ps-text-soft leading-relaxed border-t border-ps-border"
                      >
                        <p className="pt-4">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-ps-text-softer mt-6 text-center">
              Have a question we missed? Email{' '}
              <a href="mailto:hello@parentscript.app" className="ps-link">
                hello@parentscript.app
              </a>
              .
            </p>
          </div>
        </section>

        {/* ── Final CTA (sentence case, calm voice) ── */}
        <section className="px-6 md:px-10 py-12 md:py-16 bg-ps-accent-soft">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-[28px] font-bold text-ps-accent-ink mb-3 tracking-tight">
              Ready to try ParentScript?
            </h3>
            <p className="text-ps-text-soft mb-6 max-w-xl mx-auto">
              14-day free trial. No credit card required. Parents can start free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup" className="ps-btn ps-btn-primary ps-btn-lg">
                Create therapist account
              </Link>
              <Link to="/parent-signup" className="ps-btn ps-btn-secondary ps-btn-lg">
                Parents — start free
              </Link>
            </div>
          </div>
        </section>

        {/* Required clinical guardrail — Mira-verified disclosure text. */}
        <section className="px-6 md:px-10 py-10 bg-ps-bg border-t border-ps-border">
          <div className="max-w-3xl mx-auto">
            <ScopeOfPracticeDisclosure surface="parent" />
          </div>
        </section>
      </main>

      <MarkFooter product="parentscript" />
    </div>
  );
}
