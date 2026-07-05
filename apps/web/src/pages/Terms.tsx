import { Link } from 'react-router-dom';
import MarkHeader from '@/components/MarkHeader';
import MarkFooter from '@/components/MarkFooter';

// ──────────────────────────────────────────────────────────────────────
// Terms of Service — legally required for subscription SaaS
// ──────────────────────────────────────────────────────────────────────
//
// Mark's design system v1.0:
//   - ps-card sections with eyebrow labels (no emoji icons)
//   - Calm legal tone
//
// Required by Stripe, app stores, and general SaaS compliance.
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

export default function Terms() {
  return (
    <div className="min-h-dvh bg-ps-bg-soft flex flex-col">
      <MarkHeader product="parentscript" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 md:px-10 py-10 md:py-14">
        <div className="mb-10">
          <span className="ps-eyebrow">Legal</span>
          <h2 className="text-3xl md:text-[36px] font-bold text-ps-text mt-2 mb-3 tracking-tight">
            Terms of Service
          </h2>
          <p className="text-base md:text-lg text-ps-text-soft leading-relaxed">
            By using ParentScript, you agree to these terms. Please read them carefully.
          </p>
          <p className="text-sm text-ps-text-softer mt-3">Last updated: June 27, 2026</p>
        </div>

        <div className="space-y-5">
          <Section eyebrow="1. Definitions" title="Service, user, therapist, parent, PHI.">
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                <strong className="text-ps-text">"Service"</strong> means the ParentScript web
                application and any related services.
              </li>
              <li>
                <strong className="text-ps-text">"User"</strong> means any person who accesses or
                uses the Service, including therapists and parents.
              </li>
              <li>
                <strong className="text-ps-text">"Therapist"</strong> means a licensed mental health
                professional who uses ParentScript to assign skills to clients.
              </li>
              <li>
                <strong className="text-ps-text">"Parent"</strong> means a caregiver who receives
                skill assignments from their therapist via ParentScript.
              </li>
              <li>
                <strong className="text-ps-text">"PHI"</strong> means Protected Health Information
                as defined by HIPAA.
              </li>
            </ul>
          </Section>

          <Section eyebrow="2. Eligibility" title="Licensed therapists, invited parents, 18+.">
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                <strong className="text-ps-text">Therapists</strong> must hold a valid clinical
                license in their jurisdiction. We verify licenses manually; use of the Service prior
                to verification is at your own risk.
              </li>
              <li>
                <strong className="text-ps-text">Parents</strong> must be invited by a therapist.
                Self-signup is not available for parents.
              </li>
              <li>You must be at least 18 years old to use the Service.</li>
              <li>
                You may not use the Service if you are barred from receiving services under
                applicable law.
              </li>
            </ul>
          </Section>

          <Section
            eyebrow="3. Subscription & billing"
            title="Free tier, 14-day trial, monthly + annual plans."
          >
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                <strong className="text-ps-text">Free tier:</strong> Parents can use basic features
                without a therapist at no cost (1 interaction/day).
              </li>
              <li>
                <strong className="text-ps-text">Paid plans:</strong> Solo ($19/mo), Pro ($39/mo),
                and Clinic ($29/seat/mo). All paid plans include a 14-day free trial. No credit card
                required to start the trial.
              </li>
              <li>
                <strong className="text-ps-text">Billing:</strong> Processed via Stripe. You agree
                to pay all fees associated with your selected plan.
              </li>
              <li>
                <strong className="text-ps-text">Cancellation:</strong> You may cancel at any time
                via the Stripe Billing Portal. Cancellations take effect at the end of the current
                billing period.
              </li>
              <li>
                <strong className="text-ps-text">Refunds:</strong> Prorated refunds are available
                within 14 days of charge for annual plans. Monthly plans are not refundable.
              </li>
              <li>
                <strong className="text-ps-text">Price changes:</strong> We will provide 30 days'
                notice before changing subscription prices.
              </li>
            </ul>
          </Section>

          <Section
            eyebrow="4. Acceptable use"
            title="No client names in labels, no credentials shared, no malware."
          >
            <p className="text-ps-text-soft leading-relaxed mb-4">You agree not to:</p>
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                Use real names, dates of birth, or other identifying information for client labels.
                Use non-identifying labels only.
              </li>
              <li>Share your account credentials with others.</li>
              <li>Attempt to access data belonging to other users.</li>
              <li>
                Use the Service for any purpose other than its intended clinical support function.
              </li>
              <li>Reverse engineer, decompile, or attempt to extract source code.</li>
              <li>Upload malware, viruses, or harmful code.</li>
              <li>
                Use the AI coaching feature to generate content that is illegal, harmful, or
                discriminatory.
              </li>
            </ul>
            <p className="mt-4 text-sm text-ps-text-softer">
              Violation may result in immediate account termination without refund.
            </p>
          </Section>

          <Section
            eyebrow="5. HIPAA & clinical responsibility"
            title="Therapists own clinical judgment. Call 911 in emergencies."
          >
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                ParentScript is designed as a HIPAA-aligned platform. We sign a Business Associate
                Agreement (BAA) with covered-entity customers upon request.
              </li>
              <li>
                Therapists are responsible for maintaining clinical standards and complying with all
                applicable licensing and privacy laws.
              </li>
              <li>
                ParentScript does not provide clinical advice. All skill content is for general
                guidance and must be adapted by the therapist to each client's needs.
              </li>
              <li>
                In an emergency, users must call 911 or the Suicide & Crisis Lifeline at 988. The
                Service is not an emergency resource.
              </li>
            </ul>
          </Section>

          <Section
            eyebrow="6. Data ownership & deletion"
            title="You own your data. 30-day deletion, 6-year audit."
          >
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>You retain ownership of any data you input into the Service.</li>
              <li>
                We grant you a limited license to use the Service in accordance with these terms.
              </li>
              <li>
                Upon account deletion, your data will be permanently removed within 30 days, except
                where retention is required by law or for audit purposes (6 years for HIPAA audit
                logs).
              </li>
              <li>
                Therapists may export client data at any time via the dashboard or by contacting
                support.
              </li>
            </ul>
          </Section>

          <Section
            eyebrow="7. Limitation of liability"
            title="Service provided 'as is.' Cap = 12 months paid."
          >
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                The Service is provided "as is" without warranties of any kind, express or implied.
              </li>
              <li>
                We are not liable for any clinical outcomes, missed diagnoses, or treatment
                decisions made by therapists using the Service.
              </li>
              <li>
                Our total liability to you for any claim arising from the Service shall not exceed
                the amount you paid us in the 12 months preceding the claim.
              </li>
              <li>
                We are not liable for indirect, incidental, special, or consequential damages.
              </li>
            </ul>
          </Section>

          <Section eyebrow="8. Termination" title="Cancel by email. We may suspend for violations.">
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                You may terminate your account at any time by emailing{' '}
                <a href="mailto:support@parentscript.app" className="ps-link font-medium">
                  support@parentscript.app
                </a>
                .
              </li>
              <li>
                We may suspend or terminate your account for violation of these terms, non-payment,
                or if required by law.
              </li>
              <li>
                Upon termination, your right to use the Service ceases immediately. Provisions that
                by their nature should survive termination (liability, data retention, dispute
                resolution) will survive.
              </li>
            </ul>
          </Section>

          <Section
            eyebrow="9. Dispute resolution"
            title="Delaware law, binding arbitration, no class actions."
          >
            <ul className="space-y-2 text-ps-text-soft list-disc list-inside">
              <li>
                These terms are governed by the laws of the State of Delaware, USA, without regard
                to conflict of law principles.
              </li>
              <li>
                Any dispute shall first be addressed through informal negotiation. If unresolved,
                disputes shall be resolved by binding arbitration in Delaware under the rules of the
                American Arbitration Association.
              </li>
              <li>
                Class action waivers: You agree to resolve disputes on an individual basis and waive
                any right to participate in class actions.
              </li>
            </ul>
          </Section>

          <Section
            eyebrow="10. Changes to these terms"
            title="30-day email notice for material changes."
          >
            <p className="text-ps-text-soft leading-relaxed">
              We may update these terms from time to time. Material changes will be communicated via
              email at least 30 days before taking effect. Continued use of the Service after
              changes constitutes acceptance. The "Last updated" date at the top reflects the most
              recent revision.
            </p>
          </Section>

          <Section eyebrow="11. Contact us" title="legal@parentscript.app.">
            <div className="ps-card bg-ps-accent-softer border-ps-accent-soft">
              <p className="text-sm text-ps-text-soft mb-1">
                <strong className="text-ps-text">Legal:</strong>{' '}
                <a href="mailto:legal@parentscript.app" className="ps-link font-medium">
                  legal@parentscript.app
                </a>
              </p>
              <p className="text-sm text-ps-text-soft mb-1">
                <strong className="text-ps-text">Support:</strong>{' '}
                <a href="mailto:support@parentscript.app" className="ps-link font-medium">
                  support@parentscript.app
                </a>
              </p>
              <p className="text-sm text-ps-text-soft">
                <strong className="text-ps-text">Privacy:</strong>{' '}
                <a href="mailto:privacy@parentscript.app" className="ps-link font-medium">
                  privacy@parentscript.app
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
