import { Link } from 'react-router-dom';
import MarkHeader from '@/components/MarkHeader';
import MarkFooter from '@/components/MarkFooter';

// ──────────────────────────────────────────────────────────────────────
// Privacy Policy — legally required for any app handling user data
// ──────────────────────────────────────────────────────────────────────
//
// Mark's design system v1.0:
//   - ps-card sections with eyebrow labels (no emoji icons)
//   - Calm clinical voice, no marketing tone
//   - Same contact panel pattern as Security
//
// Required by HIPAA (PHI handling disclosure), state privacy laws
// (CCPA, CPRA, etc.), app store policies, Stripe Terms.
// Last updated: June 27, 2026

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

export default function Privacy() {
  return (
    <div className="min-h-dvh bg-ps-bg-soft flex flex-col">
      <MarkHeader product="parentscript" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 md:px-10 py-10 md:py-14">
        <div className="mb-10">
          <span className="ps-eyebrow">Privacy</span>
          <h2 className="text-3xl md:text-[36px] font-bold text-ps-text mt-2 mb-3 tracking-tight">
            Privacy Policy
          </h2>
          <p className="text-base md:text-lg text-ps-text-soft leading-relaxed">
            This policy explains what data we collect, how we use it, and your rights. We handle
            Protected Health Information (PHI) under HIPAA.
          </p>
          <p className="text-sm text-ps-text-softer mt-3">Last updated: June 27, 2026</p>
        </div>

        <div className="space-y-5">
          <Section eyebrow="1. What we collect" title="Minimum data needed to provide the service.">
            <p className="text-ps-text-soft leading-relaxed mb-4">
              We collect only the minimum data needed to provide the service:
            </p>
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                <strong className="text-ps-text">Account data:</strong> email address, password hash
                (via Supabase Auth), and optional display name.
              </li>
              <li>
                <strong className="text-ps-text">Clinical labels:</strong> non-identifying client
                labels (e.g., "Client 042") chosen by the therapist. We never collect real names,
                dates of birth, or SSNs.
              </li>
              <li>
                <strong className="text-ps-text">Skill data:</strong> which skills are unlocked per
                client, practice logs (good/mixed/hard + optional reflection tags), and therapist
                note tags.
              </li>
              <li>
                <strong className="text-ps-text">Verification data:</strong> professional license
                number, state, and type (therapists only). Used solely for credential verification.
              </li>
              <li>
                <strong className="text-ps-text">Billing data:</strong> Stripe handles all payment
                details. We store only subscription plan, status, and Stripe customer/subscription
                IDs.
              </li>
              <li>
                <strong className="text-ps-text">Analytics:</strong> none. We do not use Google
                Analytics, Mixpanel, or similar third-party trackers.
              </li>
            </ul>
          </Section>

          <Section
            eyebrow="2. How we use your data"
            title="Service, verification, billing, and legal compliance."
          >
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                To provide the ParentScript service (skill unlocking, practice logging, AI
                coaching).
              </li>
              <li>To verify therapist credentials and prevent unauthorized clinical access.</li>
              <li>To process payments and manage subscriptions via Stripe.</li>
              <li>
                To send essential service emails (password reset, invite links, security alerts). No
                marketing emails without explicit opt-in.
              </li>
              <li>To comply with legal obligations (HIPAA, court orders, breach notification).</li>
            </ul>
          </Section>

          <Section eyebrow="3. How we share your data" title="We do not sell your data.">
            <p className="text-ps-text-soft leading-relaxed mb-4">
              We do not sell your data. We share data only with:
            </p>
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                <strong className="text-ps-text">Supabase</strong> — database hosting,
                authentication, and row-level security. Data is encrypted in transit and at rest.
              </li>
              <li>
                <strong className="text-ps-text">Stripe</strong> — payment processing. Stripe
                receives billing details only; no PHI is shared with Stripe.
              </li>
              <li>
                <strong className="text-ps-text">Vercel</strong> — static asset hosting. No PHI is
                stored on Vercel.
              </li>
              <li>
                <strong className="text-ps-text">AI providers (Anthropic/OpenAI)</strong> — only the
                situation text entered in "In-the-moment" coaching is sent, with no identifying
                information. We do not log or retain these requests.
              </li>
            </ul>
            <p className="mt-4 text-sm text-ps-text-softer">
              We will provide at least 30 days' notice before adding any new sub-processor that
              handles PHI.
            </p>
          </Section>

          <Section
            eyebrow="4. Data retention"
            title="Active records, 6-year audit logs, 35-day backups."
          >
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                <strong className="text-ps-text">Active accounts:</strong> retained while the
                account is active and for 30 days after cancellation or therapist–parent
                relationship ends.
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
                <strong className="text-ps-text">AI coaching interactions:</strong> not logged or
                retained server-side.
              </li>
            </ul>
          </Section>

          <Section
            eyebrow="5. Your rights"
            title="Access, correction, deletion, export, portability."
          >
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                <strong className="text-ps-text">Access:</strong> request a copy of all data we hold
                about you.
              </li>
              <li>
                <strong className="text-ps-text">Correction:</strong> update your account details at
                any time.
              </li>
              <li>
                <strong className="text-ps-text">Deletion:</strong> request full account deletion.
                Completed within 30 days.
              </li>
              <li>
                <strong className="text-ps-text">Export:</strong> therapists can export client skill
                state and practice logs.
              </li>
              <li>
                <strong className="text-ps-text">Portability:</strong> data is stored in standard
                formats (JSON/CSV) and can be provided on request.
              </li>
            </ul>
            <p className="mt-4 text-sm text-ps-text-softer">
              To exercise any right, email{' '}
              <a href="mailto:privacy@parentscript.app" className="ps-link font-medium">
                privacy@parentscript.app
              </a>
              .
            </p>
          </Section>

          <Section eyebrow="6. Security measures" title="TLS, AES-256, RLS, bcrypt.">
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>TLS 1.2+ for all data in transit. No plaintext HTTP fallback.</li>
              <li>AES-256 encryption at rest via Supabase/AWS.</li>
              <li>
                Row-Level Security (RLS) ensures therapists see only their own clients; parents see
                only their own data.
              </li>
              <li>Passwords hashed with bcrypt via Supabase Auth.</li>
              <li>Short-lived session tokens with automatic refresh.</li>
              <li>Regular security reviews and dependency updates.</li>
            </ul>
            <p className="mt-4 text-sm text-ps-text-softer">
              For full security details, visit our{' '}
              <Link to="/security" className="ps-link font-medium">
                Security & HIPAA page
              </Link>
              .
            </p>
          </Section>

          <Section eyebrow="7. Cookies & tracking" title="Essential cookies only. No analytics.">
            <p className="text-ps-text-soft leading-relaxed">
              We use only essential cookies for authentication (Supabase session tokens). We do not
              use tracking cookies, advertising cookies, or third-party analytics. The app respects
              browser Do-Not-Track signals.
            </p>
          </Section>

          <Section eyebrow="8. Children's privacy" title="Not directed at children under 13.">
            <p className="text-ps-text-soft leading-relaxed">
              ParentScript is intended for parents and therapists. We do not knowingly collect
              personal information from children under 13. If you believe a child has provided us
              with personal information, contact us at{' '}
              <a href="mailto:privacy@parentscript.app" className="ps-link font-medium">
                privacy@parentscript.app
              </a>{' '}
              and we will delete it promptly.
            </p>
          </Section>

          <Section eyebrow="9. Changes to this policy" title="30-day notice for material changes.">
            <p className="text-ps-text-soft leading-relaxed">
              We may update this policy as laws or our practices change. Material changes will be
              communicated via email at least 30 days before taking effect. The "Last updated" date
              at the top of this page reflects the most recent revision.
            </p>
          </Section>

          <Section eyebrow="10. Contact us" title="privacy@parentscript.app.">
            <div className="ps-card bg-ps-accent-softer border-ps-accent-soft">
              <p className="text-sm text-ps-text-soft mb-1">
                <strong className="text-ps-text">Privacy officer:</strong>{' '}
                <a href="mailto:privacy@parentscript.app" className="ps-link font-medium">
                  privacy@parentscript.app
                </a>
              </p>
              <p className="text-sm text-ps-text-soft mb-1">
                <strong className="text-ps-text">Security team:</strong>{' '}
                <a href="mailto:security@parentscript.app" className="ps-link font-medium">
                  security@parentscript.app
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
