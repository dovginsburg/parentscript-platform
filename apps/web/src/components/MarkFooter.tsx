import { Link } from 'react-router-dom';
import ScopeOfPracticeDisclosure from '@/components/ScopeOfPracticeDisclosure';

// ──────────────────────────────────────────────────────────────────────
// MarkFooter — shared marketing-page footer
// ──────────────────────────────────────────────────────────────────────
//
// Replaces the hand-rolled <footer> block that previously lived on
// each public page. Adds the indigo brand-mark column, drops the
// shouty uppercase column labels in favor of the eyebrow style, and
// folds the scope-of-practice disclosure in consistently.
//
// The classic three-column layout stays — Product / Company / Legal —
// plus a brand block on the left. Last line keeps the required
// 988 / 911 disclaimer (clinical non-negotiable).

type MarkFooterProps = {
  product?: 'parentscript' | 'sibling';
};

export default function MarkFooter({ product = 'parentscript' }: MarkFooterProps) {
  const year = new Date().getFullYear();

  const brandLabel = product === 'sibling' ? 'SiblingSupport' : 'ParentScript';
  const homeLink = product === 'sibling' ? '/sibling' : '/';
  const mark = product === 'sibling' ? 'S' : 'P';

  return (
    <footer className="bg-ps-bg border-t border-ps-border mt-12">
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-10 md:py-12">
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

          {/* Company */}
          <div>
            <p className="ps-label mb-3">Company</p>
            <ul className="space-y-2 text-sm">
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
              <li>
                <a
                  href="mailto:press@parentscript.app"
                  className="text-ps-text-soft hover:text-ps-accent transition-ps"
                >
                  Press
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
                  Security & HIPAA
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
            call 911 or the Suicide &amp; Crisis Lifeline at 988.
          </p>
        </div>

        {/* Scope of practice + crisis lines. Mira-verified disclosure. */}
        <div className="mt-8">
          <ScopeOfPracticeDisclosure
            compact
            surface={product === 'sibling' ? 'sibling' : 'parent'}
          />
        </div>

        {/* Hidden home link for router integrity */}
        <Link to={homeLink} className="sr-only">
          {brandLabel} home
        </Link>
      </div>
    </footer>
  );
}
