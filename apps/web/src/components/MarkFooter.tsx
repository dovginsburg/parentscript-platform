import { Link } from 'react-router-dom';
import ScopeOfPracticeDisclosure from '@/components/ScopeOfPracticeDisclosure';

// ──────────────────────────────────────────────────────────────────────
// MarkFooter — shared marketing-page footer (Card 3 spec, 2026-07-08)
// ──────────────────────────────────────────────────────────────────────
//
// Replaces the hand-rolled <footer> block that previously lived on
// each public page. Adds the indigo brand-mark column, drops the
// shouty uppercase column labels in favor of the eyebrow style, and
// folds the scope-of-practice disclosure in consistently.
//
// Layout: 4 columns on desktop (Brand / Product / Support / Legal),
// stacked on mobile (<768px). The first clickable element on mobile
// is a prominent "Home" link above the column stack — Dov
// requirement, "back to home from any page."
//
// Crisis line (988, US Suicide & Crisis Lifeline) is rendered as its
// own prominent bar above the column grid, NOT buried in tiny text
// — the audience is stressed parents, and the script library can
// trigger someone in crisis. This is the most-visible crisis
// resource on the page.
//
// Clinical disclaimer sub-card uses the literal wording from the
// GPT-5.4 consult recommendation: "ParentScript provides parenting
// scripts informed by evidence-based approaches. It is not a
// substitute for professional mental health care." — pending Mira's
// approval. When Mira edits the wording, edit only the
// PS_CLINICAL_DISCLAIMER_TEXT constant below.
//
// The full Mira-verified ScopeOfPracticeDisclosure (with all crisis
// lines) follows the short disclaimer block.

const PS_CLINICAL_DISCLAIMER_TEXT =
  'ParentScript provides parenting scripts informed by evidence-based approaches. It is not a substitute for professional mental health care.';

type MarkFooterProps = {
  product?: 'parentscript' | 'sibling';
};

export default function MarkFooter({ product = 'parentscript' }: MarkFooterProps) {
  const year = new Date().getFullYear();

  const brandLabel = product === 'sibling' ? 'SiblingSupport' : 'ParentScript';
  const homeLink = product === 'sibling' ? '/sibling' : '/';
  const mark = product === 'sibling' ? 'S' : 'P';
  const showCrisis = product === 'parentscript';

  return (
    <footer className="bg-ps-bg border-t border-ps-border mt-12">
      {/* ── Mobile-first "Home" link — the FIRST clickable element
              in the footer on mobile. Above the column stack AND
              above the crisis bar. Hidden on md+ where the brand
              wordmark fills the role. ──────────────────────────── */}
      <div className="md:hidden border-b border-ps-border">
        <div className="max-w-[1240px] mx-auto px-6 py-4">
          <Link
            to={homeLink}
            aria-label={`${brandLabel} — back to home`}
            className="flex items-center gap-2 text-[15px] font-semibold text-ps-text hover:text-ps-accent transition-ps min-h-[44px]"
          >
            <span aria-hidden="true">←</span>
            <span>Home</span>
          </Link>
        </div>
      </div>

      {/* ── Crisis bar (parentscript only) — 988 prominently linked.
              Hidden on sibling surface; the sibling footer surfaces
              its own crisis resources via the disclosure component. */}
      {showCrisis && (
        <div className="bg-rose-50 border-b border-rose-200">
          <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-4 md:py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <p className="text-[14px] md:text-[15px] text-rose-900 leading-snug">
              <span className="font-semibold">In a crisis?</span> Call or text{' '}
              <a
                href="tel:988"
                className="font-bold underline text-rose-900 hover:text-rose-700"
              >
                988
              </a>{' '}
              for the Suicide &amp; Crisis Lifeline.
            </p>
            <Link
              to="/sibling/safety"
              className="text-[12px] uppercase tracking-wider font-semibold text-rose-700 hover:text-rose-900"
            >
              More crisis resources →
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-10 md:py-12">
        {/* ── Clinical disclaimer sub-card (Card 3 spec, Mira pending).
                The exact wording from the GPT-5.4 consult recommendation.
                When Mira edits it, change PS_CLINICAL_DISCLAIMER_TEXT. */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 md:p-5 mb-10">
          <p className="text-[12px] uppercase tracking-wider font-semibold text-brand-700 mb-2">
            Important
          </p>
          <p className="text-[14px] text-gray-800 leading-relaxed">
            {PS_CLINICAL_DISCLAIMER_TEXT}
          </p>
        </div>

        {/* ── 4-column grid: Brand | Product | Support | Legal
                On desktop: 4 col. On mobile: single column stack. ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="w-8 h-8 grid place-items-center bg-ps-accent text-white rounded-[10px] font-bold text-[15px]"
              >
                {mark}
              </span>
              <span className="font-bold text-[17px] tracking-tight text-ps-text">
                {brandLabel}
              </span>
            </div>
            <p className="text-xs text-ps-muted mt-2">AMAZED Labs</p>
            <p className="text-sm text-ps-text-soft mt-3 leading-relaxed">
              {product === 'sibling'
                ? 'Peer support for teens who are helping a sibling through a hard time.'
                : 'Evidence-based parenting support, prescribed by your therapist.'}
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="ps-label mb-3">Product</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/pricing"
                  className="text-ps-text-soft hover:text-ps-accent transition-ps"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-ps-text-soft hover:text-ps-accent transition-ps">
                  For therapists
                </Link>
              </li>
              <li>
                <Link
                  to="/parent-signup"
                  className="text-ps-text-soft hover:text-ps-accent transition-ps"
                >
                  For parents
                </Link>
              </li>
              <li>
                <Link
                  to="/sibling"
                  className="text-ps-text-soft hover:text-ps-accent transition-ps"
                >
                  SiblingSupport
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@parentscript.app"
                  className="text-ps-text-soft hover:text-ps-accent transition-ps"
                >
                  Contact sales
                </a>
              </li>
            </ul>
          </div>

          {/* Support (replaces "Company" per Card 3 spec) */}
          <div>
            <p className="ps-label mb-3">Support</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="tel:988"
                  className="text-rose-700 font-semibold hover:text-rose-900 transition-ps"
                >
                  988 — Crisis Lifeline
                </a>
              </li>
              <li>
                <Link
                  to="/sibling/safety"
                  className="text-ps-text-soft hover:text-ps-accent transition-ps"
                >
                  Crisis resources
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@parentscript.app"
                  className="text-ps-text-soft hover:text-ps-accent transition-ps"
                >
                  Support email
                </a>
              </li>
              <li>
                <Link to="/about" className="text-ps-text-soft hover:text-ps-accent transition-ps">
                  About
                </Link>
              </li>
              <li>
                <a
                  href="mailto:careers@parentscript.app"
                  className="text-ps-text-soft hover:text-ps-accent transition-ps"
                >
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="ps-label mb-3">Legal</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/security"
                  className="text-ps-text-soft hover:text-ps-accent transition-ps"
                >
                  Security &amp; HIPAA
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-ps-text-soft hover:text-ps-accent transition-ps"
                >
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-ps-text-soft hover:text-ps-accent transition-ps">
                  Terms of service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-ps-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs text-ps-muted">© {year} AMAZED Labs. All rights reserved.</p>
          <p className="text-xs text-ps-muted max-w-xl md:text-right">
            {brandLabel} is not a substitute for professional clinical judgment. In an emergency,
            call 911 or the Suicide &amp; Crisis Lifeline at{' '}
            <a href="tel:988" className="font-semibold underline">
              988
            </a>
            .
          </p>
        </div>

        {/* Full Mira-verified scope + crisis resources. Same wording
            that appears in onboarding modals and on every AI card. */}
        <div className="mt-8">
          <ScopeOfPracticeDisclosure
            compact
            surface={product === 'sibling' ? 'sibling' : 'parent'}
          />
        </div>

        {/* Hidden home link for router integrity (also helpful for
            assistive tech that scans for the destination of an
            ambiguous landmark). */}
        <Link to={homeLink} className="sr-only">
          {brandLabel} home
        </Link>
      </div>
    </footer>
  );
}
