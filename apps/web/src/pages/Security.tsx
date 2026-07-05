import { Link } from 'react-router-dom';
import MarkHeader from '@/components/MarkHeader';
import MarkFooter from '@/components/MarkFooter';

// ──────────────────────────────────────────────────────────────────────
// Security — Trust, HIPAA, encryption, data residency, breach policy
// ──────────────────────────────────────────────────────────────────────
//
// Mark's design system v1.0:
//   - ps-card sections with eyebrow labels (no emoji icons — clinical surface)
//   - indigo contact card in place of the old brand-50 box
//   - Fact-based, no marketing fluff

const THIRD_PARTY_SERVICES = [
  {
    name: 'Supabase',
    role: 'Primary database, authentication, row-level security',
    data: 'All user, parent, and therapist records',
    location: 'United States (US-East / US-West regions)',
  },
  {
    name: 'Stripe',
    role: 'Payment processing for therapist subscriptions',
    data: 'Billing details, subscription status, last-4 card digits only',
    location: 'United States',
  },
  {
    name: 'Vercel',
    role: 'Static asset hosting, edge network, serverless API',
    data: 'No PHI — only public marketing pages and API code',
    location: 'Global edge, with US-default routing',
  },
  {
    name: 'AWS (via Supabase)',
    role: 'Underlying infrastructure for database and storage',
    data: 'Encrypted at rest, encrypted in transit',
    location: 'United States',
  },
];

type SectionProps = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

function Section({ eyebrow, title, children }: SectionProps) {
  return (
    <section className="ps-card">
      <span className="ps-eyebrow">{eyebrow}</span>
      <h3 className="text-xl md:text-[22px] font-semibold text-ps-text mt-2 mb-4 tracking-tight">
        {title}
      </h3>
      <div className="text-sm md:text-base">{children}</div>
    </section>
  );
}

export default function Security() {
  return (
    <div className="min-h-dvh bg-ps-bg-soft flex flex-col">
      <MarkHeader product="parentscript" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 md:px-10 py-10 md:py-14">
        {/* Title */}
        <div className="mb-10">
          <span className="ps-eyebrow">Security & Compliance</span>
          <h2 className="text-3xl md:text-[36px] font-bold text-ps-text mt-2 mb-3 tracking-tight">
            Security & Compliance
          </h2>
          <p className="text-base md:text-lg text-ps-text-soft leading-relaxed">
            ParentScript handles Protected Health Information (PHI) under HIPAA. Here's exactly how
            we protect it, where it lives, and what we do if something goes wrong.
          </p>
          <p className="text-sm text-ps-text-softer mt-3">Last updated: June 2026</p>
        </div>

        <div className="space-y-5">
          <Section eyebrow="HIPAA compliance" title="HIPAA-aligned, BAA-ready.">
            <p className="text-ps-text-soft leading-relaxed">
              ParentScript is designed as a HIPAA-aligned platform. We sign a Business Associate
              Agreement (BAA) with every covered-entity customer (typically the supervising
              clinician or clinic) before any PHI is uploaded.
            </p>
            <ul className="mt-4 space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                All therapists and parents are bound by our Terms of Service and Privacy Policy
              </li>
              <li>We use HIPAA-eligible infrastructure only (Supabase + AWS + Stripe)</li>
              <li>
                Row-Level Security (RLS) ensures therapists can only access their own caseload
              </li>
              <li>Parents can only see their own assignments — never other clients</li>
              <li>Every PHI access is logged in an audit trail</li>
            </ul>
          </Section>

          <Section eyebrow="Encryption" title="TLS 1.2+, AES-256 at rest, bcrypt for passwords.">
            <div className="space-y-4 text-ps-text-soft">
              <div>
                <h4 className="font-semibold text-ps-text mb-1">In transit</h4>
                <p>
                  All data transmitted between your browser, our servers, and our database providers
                  is encrypted using TLS 1.2 or higher. There is no plaintext HTTP fallback anywhere
                  in the stack.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-ps-text mb-1">At rest</h4>
                <p>
                  All PHI is encrypted at rest using AES-256 via our database provider's managed
                  encryption. Database backups are also encrypted. Application secrets (API keys,
                  signing secrets) live in environment variables and are rotated on a regular
                  schedule.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-ps-text mb-1">In application</h4>
                <p>
                  Passwords are hashed using bcrypt via Supabase Auth — we never see or store them
                  in plaintext. Session tokens are short-lived and refresh automatically.
                </p>
              </div>
            </div>
          </Section>

          <Section eyebrow="Data residency" title="US only, no international transfers.">
            <p className="text-ps-text-soft leading-relaxed">
              All PHI is stored and processed in the United States. Specifically:
            </p>
            <ul className="mt-4 space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                <strong className="text-ps-text">Database:</strong> Supabase, hosted on AWS in
                US-East and US-West
              </li>
              <li>
                <strong className="text-ps-text">Backups:</strong> US-based, encrypted, retained per
                the schedule below
              </li>
              <li>
                <strong className="text-ps-text">Frontend hosting:</strong> Vercel — public
                marketing and API code only; no PHI on the edge
              </li>
            </ul>
            <p className="mt-4 text-sm text-ps-text-softer">
              We do not transfer PHI outside the United States. International users are served from
              US regions, with longer latency as the trade-off.
            </p>
          </Section>

          <Section
            eyebrow="Breach notification"
            title="24-hour containment, written incident report."
          >
            <p className="text-ps-text-soft leading-relaxed">
              In the event of a security incident that compromises PHI, we commit to:
            </p>
            <ol className="mt-4 space-y-2 text-ps-text-soft list-decimal list-inside">
              <li>
                <strong className="text-ps-text">Within 24 hours:</strong> begin investigation,
                contain the incident, and notify affected customers via email to the address on
                file.
              </li>
              <li>
                <strong className="text-ps-text">Per HIPAA Breach Notification Rule</strong> (45 CFR
                §164.400-414), notify HHS and affected individuals when the incident meets the
                definition of a breach.
              </li>
              <li>
                <strong className="text-ps-text">Written incident report</strong> describing what
                happened, what data was affected, what we did to contain it, and what we're changing
                to prevent recurrence.
              </li>
              <li>
                <strong className="text-ps-text">Cooperate with regulatory inquiries</strong> and
                any subsequent forensic investigation.
              </li>
            </ol>
            <p className="mt-4 text-sm text-ps-text-softer">
              If you discover a vulnerability, please report it to{' '}
              <a href="mailto:security@parentscript.app" className="ps-link font-medium">
                security@parentscript.app
              </a>{' '}
              — responsible disclosure is welcome and will be acknowledged within one business day.
            </p>
          </Section>

          <Section eyebrow="Data retention" title="30-day grace, 6-year audit, 35-day backups.">
            <p className="text-ps-text-soft leading-relaxed">
              We keep data only as long as needed for clinical continuity and legal compliance.
            </p>
            <ul className="mt-4 space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                <strong className="text-ps-text">Active records:</strong> therapist and parent
                account data retained while the relationship is active and for 30 days after it
                ends.
              </li>
              <li>
                <strong className="text-ps-text">Inactive records:</strong> after the 30-day grace
                period, account data is purged from production systems.
              </li>
              <li>
                <strong className="text-ps-text">Deletion requests:</strong> therapists can export
                or delete all their data at any time via the dashboard, or by emailing{' '}
                <a href="mailto:support@parentscript.app" className="ps-link font-medium">
                  support@parentscript.app
                </a>
                . Deletion is completed within 30 days.
              </li>
              <li>
                <strong className="text-ps-text">Audit logs:</strong> retained for 6 years per HIPAA
                documentation requirements.
              </li>
              <li>
                <strong className="text-ps-text">Backups:</strong> encrypted backups retained for 35
                days, then permanently destroyed.
              </li>
              <li>
                <strong className="text-ps-text">Backups deleted:</strong> all backup copies are
                confirmed-destroyed within 60 days of the retention cutoff.
              </li>
            </ul>
          </Section>

          <Section eyebrow="Third-party services" title="A small, vetted sub-processor list.">
            <p className="text-ps-text-soft leading-relaxed mb-4">
              We use a small, vetted set of sub-processors. None of them have rights to your data
              beyond what's strictly needed to provide their service.
            </p>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-ps-bg-soft text-left">
                    <th className="px-3 py-2 font-semibold text-ps-text-soft border-b border-ps-border">
                      Provider
                    </th>
                    <th className="px-3 py-2 font-semibold text-ps-text-soft border-b border-ps-border">
                      Role
                    </th>
                    <th className="px-3 py-2 font-semibold text-ps-text-soft border-b border-ps-border">
                      Data handled
                    </th>
                    <th className="px-3 py-2 font-semibold text-ps-text-soft border-b border-ps-border">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {THIRD_PARTY_SERVICES.map(svc => (
                    <tr key={svc.name} className="border-b border-ps-border">
                      <td className="px-3 py-3 font-semibold text-ps-text align-top">{svc.name}</td>
                      <td className="px-3 py-3 text-ps-text-soft align-top">{svc.role}</td>
                      <td className="px-3 py-3 text-ps-text-soft align-top">{svc.data}</td>
                      <td className="px-3 py-3 text-ps-text-soft align-top">{svc.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-ps-text-softer">
              We will provide at least 30 days' notice before adding any new sub-processor that
              handles PHI.
            </p>
          </Section>

          <Section eyebrow="Security contact" title="security@parentscript.app.">
            <p className="text-ps-text-soft leading-relaxed">
              For security questions, vulnerability reports, BAA requests, or compliance
              documentation:
            </p>
            <div className="mt-4 ps-card bg-ps-accent-softer border-ps-accent-soft">
              <p className="text-sm text-ps-text-soft mb-1">
                <strong className="text-ps-text">Security team:</strong>{' '}
                <a href="mailto:security@parentscript.app" className="ps-link font-medium">
                  security@parentscript.app
                </a>
              </p>
              <p className="text-sm text-ps-text-soft mb-1">
                <strong className="text-ps-text">Privacy / data requests:</strong>{' '}
                <a href="mailto:privacy@parentscript.app" className="ps-link font-medium">
                  privacy@parentscript.app
                </a>
              </p>
              <p className="text-sm text-ps-text-soft">
                <strong className="text-ps-text">General support:</strong>{' '}
                <a href="mailto:support@parentscript.app" className="ps-link font-medium">
                  support@parentscript.app
                </a>
              </p>
            </div>
            <p className="mt-4 text-sm text-ps-text-softer">
              Mailing address available on request for formal legal correspondence.
            </p>
          </Section>
        </div>

        {/* CTA back to signup */}
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
