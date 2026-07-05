import { Link } from 'react-router-dom'
import MarkHeader from '@/components/MarkHeader'
import MarkFooter from '@/components/MarkFooter'
import ScopeOfPracticeDisclosure from '@/components/ScopeOfPracticeDisclosure'

// ──────────────────────────────────────────────────────────────────────
// SiblingSupport — public marketing landing page (sibling-support.parentscript.app)
// ──────────────────────────────────────────────────────────────────────
//
// Mark's design system v1.0:
//   - Indigo brand mark on header (S instead of P)
//   - Pillars as ps-card grid with eyebrow labels
//   - Calm peer-support voice — no "AI for siblings," no "transform your family"
//
// Surface #2 of the ParentScript platform family. v0 scope: peer
// support for teens 13–18 supporting a sibling in distress. Copy is
// gated on Mira's clinical sign-off and a school-counselor review.

const SIBLING_PILLARS = [
  {
    eyebrow: 'Peer-to-peer',
    title: 'Not authority.',
    body: "We don't lecture you about your sibling. We help you slow down and listen. The same way a good friend would.",
    pillTone: 'accent' as const,
  },
  {
    eyebrow: 'Active listening',
    title: 'Named feelings, mirrored before fixed.',
    body: "Skills from DBT validation and Carl Rogers' active listening — paraphrased for a teen register. You'll learn to mirror before you fix.",
    pillTone: 'info' as const,
  },
  {
    eyebrow: 'Built on the ParentScript safety rail',
    title: '988, 911, and Childhelp surface first.',
    body: 'If your sibling mentions self-harm, suicide, or abuse, the app surfaces 988, 911, and Childhelp first. No LLM gets to "respond" to that.',
    pillTone: 'warm' as const,
  },
  {
    eyebrow: 'You are not the only helper',
    title: 'Real support, and real trusted adults.',
    body: "Sibling support is real, and so is telling a trusted adult. The app never asks you to keep a secret that puts your sibling at risk.",
    pillTone: 'neutral' as const,
  },
]

export default function SiblingHome() {
  return (
    <div className="min-h-dvh bg-ps-bg-soft flex flex-col">
      <MarkHeader product="sibling" />

      <main className="flex-1">
        {/* Hero — Monitor archetype, glanceable */}
        <section className="bg-ps-bg border-b border-ps-border">
          <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-14 md:py-20">
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-start">
              <div>
                <span className="ps-pill ps-pill-accent mb-4">
                  <span className="dot" />
                  For teens supporting a sibling
                </span>
                <h2 className="text-[32px] md:text-[40px] leading-[1.15] font-bold text-ps-text mb-5 tracking-tight">
                  When your brother or sister is struggling,{' '}
                  <span className="text-ps-accent">here's how to help.</span>
                </h2>
                <p className="text-base md:text-[17px] text-ps-text-soft leading-relaxed mb-8 max-w-xl">
                  SiblingSupport is a peer-support app built on the same clinical
                  safety rail as ParentScript. One tap to get grounded when your
                  sibling is in crisis. Active-listening scripts you can actually
                  use. Always: 988, 911, and a trusted adult when things are too
                  big to hold alone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/sibling/app" className="ps-btn ps-btn-primary ps-btn-lg">
                    Start free — 1 coaching session a day
                  </Link>
                  <Link to="/sibling/safety" className="ps-btn ps-btn-secondary ps-btn-lg">
                    How safety works
                  </Link>
                </div>
              </div>

              {/* Sample coach moment — concrete artifact, peer voice */}
              <aside aria-label="Sample coach preview" className="ps-card">
                <span className="ps-eyebrow">A coach moment</span>
                <h3 className="text-base font-semibold text-ps-text mt-2 mb-3">
                  "my brother has been in his room for three days and won't talk to anyone."
                </h3>
                <ol className="space-y-3">
                  {[
                    "of course you're worried. that sounds exhausting to sit with.",
                    "before trying to talk, name it for yourself: scared, frustrated, missing him.",
                    "if he does open up, try mirroring — 'what i'm hearing is…' — before offering any fix.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span
                        aria-hidden="true"
                        className="shrink-0 w-6 h-6 rounded-full bg-ps-accent text-white text-xs font-bold grid place-items-center mt-0.5"
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-ps-text-soft leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="px-6 md:px-10 py-12 md:py-16 bg-ps-bg-soft">
          <div className="max-w-[1100px] mx-auto">
            <div className="mb-8 max-w-2xl">
              <span className="ps-eyebrow">What SiblingSupport is — and isn't</span>
              <h3 className="text-2xl md:text-[28px] font-bold text-ps-text mt-2 tracking-tight">
                Peer support, with the ParentScript safety rail behind it.
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {SIBLING_PILLARS.map((p) => (
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

        {/* Final CTA */}
        <section className="px-6 md:px-10 py-12 md:py-16 bg-ps-bg border-t border-ps-border">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-[28px] font-bold text-ps-text mb-3 tracking-tight">
              Ready when you are.
            </h3>
            <p className="text-ps-text-soft mb-6 max-w-xl mx-auto">
              Free, no signup required to try. Your sibling is lucky to have you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/sibling/app" className="ps-btn ps-btn-primary ps-btn-lg">
                Open the coach
              </Link>
              <Link to="/sibling/safety" className="ps-btn ps-btn-secondary ps-btn-lg">
                How safety works
              </Link>
            </div>
          </div>
        </section>

        {/* Scope of practice — non-negotiable on every page */}
        <section className="px-6 md:px-10 py-10 bg-ps-bg-soft border-t border-ps-border">
          <div className="max-w-3xl mx-auto">
            <ScopeOfPracticeDisclosure surface="sibling" />
          </div>
        </section>
      </main>

      <MarkFooter product="sibling" />
    </div>
  )
}