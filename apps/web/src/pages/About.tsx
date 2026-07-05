import { Link } from 'react-router-dom';
import MarkHeader from '@/components/MarkHeader';
import MarkFooter from '@/components/MarkFooter';

// ──────────────────────────────────────────────────────────────────────
// About — ParentScript story, team, contact
// ──────────────────────────────────────────────────────────────────────
//
// Mark's design system v1.0 (2026-07-03):
//   - Indigo brand mark in header
//   - ps-card sections with eyebrow labels (sentence case)
//   - Calm clinical voice, no marketing fluff
//
// Public page at /about. Short and honest: what ParentScript is,
// who's behind it, how to reach us. No marketing fluff.

const SECTIONS = [
  {
    eyebrow: 'What it is',
    title: 'A two-sided companion for parents working with a child therapist.',
    body: (
      <>
        <p className="text-ps-text-soft leading-relaxed mb-3">
          ParentScript is a two-sided companion for parents working with a child therapist.
          Therapists assign evidence-based skills session by session. Parents get a quiet,
          judgment-free place to practice them — including a single tap for "In the Moment" coaching
          when things are escalating at home.
        </p>
        <p className="text-ps-text-soft leading-relaxed">
          Everything is grounded in established modalities — PCIT, Parent–Child Interaction Therapy;
          BPT, Brief Parent Training; Triple P; CBT-based parenting interventions; CPS,
          Collaborative Problem Solving; and Circle of Security — adapted for the realities of
          modern family life.
        </p>
      </>
    ),
  },
  {
    eyebrow: "Who's behind it",
    title: 'AMAZED Labs, founded by Dov Ginsburg and Ariella Eisenberg, PsyD.',
    body: (
      <>
        <p className="text-ps-text-soft leading-relaxed mb-3">
          ParentScript is built by <strong>AMAZED Labs</strong> — a small studio focused on
          evidence-based tools for the moments between therapy sessions.
        </p>
        <p className="text-ps-text-soft leading-relaxed">
          Clinical content is reviewed by Dr. Eisenberg and a network of licensed child and family
          therapists. Engineering, design, and product are handled in-house.
        </p>
      </>
    ),
  },
  {
    eyebrow: "What it isn't",
    title: 'Not therapy. Not a tracker. Not an emergency resource.',
    body: (
      <ul className="space-y-2 text-ps-text-soft">
        <li className="flex gap-2">
          <span className="text-ps-success shrink-0" aria-hidden="true">
            ✓
          </span>
          It's not therapy. ParentScript is a practice companion, not a replacement for clinical
          care.
        </li>
        <li className="flex gap-2">
          <span className="text-ps-success shrink-0" aria-hidden="true">
            ✓
          </span>
          It's not a tracker. We don't run ads, sell data, or score parents on "compliance."
        </li>
        <li className="flex gap-2">
          <span className="text-ps-success shrink-0" aria-hidden="true">
            ✓
          </span>
          It's not an emergency resource. In a crisis, call 911 or the Suicide & Crisis Lifeline at
          988.
        </li>
      </ul>
    ),
  },
  {
    eyebrow: 'Get in touch',
    title: 'hello@parentscript.app',
    body: (
      <div className="space-y-1 text-sm text-ps-text-soft">
        <p>
          <strong className="text-ps-text">General:</strong>{' '}
          <a href="mailto:hello@parentscript.app" className="ps-link font-medium">
            hello@parentscript.app
          </a>
        </p>
        <p>
          <strong className="text-ps-text">Press &amp; partnerships:</strong>{' '}
          <a href="mailto:press@parentscript.app" className="ps-link font-medium">
            press@parentscript.app
          </a>
        </p>
        <p>
          <strong className="text-ps-text">Careers:</strong>{' '}
          <a href="mailto:careers@parentscript.app" className="ps-link font-medium">
            careers@parentscript.app
          </a>
        </p>
        <p>
          <strong className="text-ps-text">Support:</strong>{' '}
          <a href="mailto:support@parentscript.app" className="ps-link font-medium">
            support@parentscript.app
          </a>
        </p>
      </div>
    ),
  },
];

export default function About() {
  return (
    <div className="min-h-dvh bg-ps-bg-soft flex flex-col">
      <MarkHeader product="parentscript" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 md:px-10 py-10 md:py-14">
        <div className="mb-10">
          <span className="ps-eyebrow">About</span>
          <h2 className="text-3xl md:text-[36px] font-bold text-ps-text mt-2 mb-3 tracking-tight">
            About ParentScript
          </h2>
          <p className="text-base md:text-lg text-ps-text-soft leading-relaxed">
            ParentScript gives therapists a fast way to send the right script to the right parent at
            the right moment — and gives parents something to lean on when it's hard.
          </p>
        </div>

        <div className="space-y-5">
          {SECTIONS.map(s => (
            <section key={s.eyebrow} className="ps-card">
              <span className="ps-eyebrow">{s.eyebrow}</span>
              <h3 className="text-xl md:text-[22px] font-semibold text-ps-text mt-2 mb-3 tracking-tight">
                {s.title}
              </h3>
              <div className="text-sm md:text-base">{s.body}</div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 ps-card text-center">
          <h3 className="text-xl font-semibold text-ps-text mb-2">Ready to try ParentScript?</h3>
          <p className="text-ps-text-soft mb-5">14-day free trial. No credit card required.</p>
          <Link to="/signup" className="ps-btn ps-btn-primary ps-btn-lg">
            Create therapist account
          </Link>
        </div>
      </main>

      <MarkFooter product="parentscript" />
    </div>
  );
}
