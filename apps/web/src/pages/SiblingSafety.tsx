import { Link } from 'react-router-dom';
import { CRISIS_RESPONSE_TEXT } from '@/lib/safety';
import MarkHeader from '@/components/MarkHeader';
import MarkFooter from '@/components/MarkFooter';

// ──────────────────────────────────────────────────────────────────────
// SiblingSafety — how the safety rail works on the sibling surface
// ──────────────────────────────────────────────────────────────────────
//
// Mark's design system v1.0:
//   - indigo P-brand mark swapped for S
//   - Crisis response in a ps-alert with danger variant
//   - Sentence case headings throughout
//
// Public page at /sibling/safety. Renders the verbatim crisis
// response and a short, plain-language explanation of how the safety
// preflight works. No clinical claims — just transparency.

export default function SiblingSafety() {
  const lines = CRISIS_RESPONSE_TEXT.split('\n').filter(l => l.trim());
  return (
    <div className="min-h-dvh bg-ps-bg flex flex-col">
      <MarkHeader product="sibling" cta={{ label: 'Open the coach', href: '/sibling/app' }} />

      <main className="flex-1 px-6 md:px-10 py-12 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <span className="ps-eyebrow">SiblingSupport · Safety</span>
          <h2 className="text-3xl md:text-[36px] font-bold text-ps-text mt-2 mb-3 tracking-tight">
            How safety works
          </h2>
          <p className="text-lg text-ps-text-soft leading-relaxed">
            Before you ever see a coach response, SiblingSupport checks your message against
            patterns our clinical team has flagged as high-risk — anything that mentions self-harm,
            suicide, abuse, or violence toward your sibling. When that happens, we skip the AI and
            show you this directly:
          </p>
        </div>

        <div className="ps-alert ps-alert-warm mb-8">
          <div
            className="ps-alert-icon"
            aria-hidden="true"
            style={{ background: 'var(--ps-danger-soft)', color: 'var(--ps-danger)' }}
          >
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="ps-alert-content">
            <span className="eyebrow" style={{ color: 'var(--ps-danger)' }}>
              If you or your sibling are in crisis right now
            </span>
            <ul className="space-y-2 text-ps-text leading-relaxed mt-2 list-none">
              {lines.map((line, i) => (
                <li key={i} className="leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="ps-card">
          <span className="ps-eyebrow">Why we don't use AI for those moments</span>
          <h3 className="text-xl font-semibold text-ps-text mt-2 mb-3 tracking-tight">
            The right answer isn't a chatbot. It's a person on the line.
          </h3>
          <p className="text-ps-text-soft leading-relaxed mb-3">
            A large language model can sound caring but it can also drift — it might suggest the
            wrong thing, or miss the urgency. For moments this serious, the right thing isn't a
            chatbot response. It's a person on the other end of a phone line. The numbers above are
            free, 24/7, and you don't have to give your name.
          </p>
        </section>

        <section className="ps-card mt-5">
          <span className="ps-eyebrow">What the AI coach can help with</span>
          <h3 className="text-xl font-semibold text-ps-text mt-2 mb-3 tracking-tight">
            Active listening, validation, de-escalation.
          </h3>
          <p className="text-ps-text-soft leading-relaxed mb-3">
            For everything else — sibling conflict, worry, hard conversations, feeling overwhelmed —
            the AI coach can help you slow down, name what you're feeling, and try one grounded next
            step. The coach uses active listening, validation, and de-escalation, the same skills a
            school counselor would teach you.
          </p>
          <p className="text-ps-text-soft leading-relaxed">
            The coach is never the only helper. It always reminds you to tell a trusted adult if the
            situation is bigger than you can hold.
          </p>
        </section>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link to="/sibling/app" className="ps-btn ps-btn-primary ps-btn-lg">
            Open the coach
          </Link>
          <Link to="/sibling" className="ps-btn ps-btn-secondary ps-btn-lg">
            Back to landing
          </Link>
        </div>
      </main>

      <MarkFooter product="sibling" />
    </div>
  );
}
