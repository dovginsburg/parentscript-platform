import { Link } from 'react-router-dom';
import ScopeOfPracticeDisclosure from '@/components/ScopeOfPracticeDisclosure';

// ──────────────────────────────────────────────────────────────────────
// Footer — shared site-wide footer for public pages
// ──────────────────────────────────────────────────────────────────────
//
// Used on /pricing, /security, /login, /signup. Contains:
//   - Brand + tagline
//   - Product / company / legal link columns
//   - Copyright
//
// Therapist portal pages (ClientList, ClientDetail, TherapistSettings)
// and parent PWA pages render their own in-app chrome — they don't
// include this footer because they're inside the authenticated app.

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-black text-brand-800 tracking-tight">ParentScript</h3>
            <p className="text-xs text-gray-500 mt-0.5">AMAZED Labs</p>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              Evidence-based parenting support, prescribed by your therapist.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/pricing" className="text-gray-600 hover:text-brand-700">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-gray-600 hover:text-brand-700">
                  For therapists
                </Link>
              </li>
              <li>
                <Link to="/parent-signup" className="text-gray-600 hover:text-brand-700">
                  For parents
                </Link>
              </li>
              <li>
                <Link to="/sibling" className="text-gray-600 hover:text-brand-700">
                  SiblingSupport
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@parentscript.app"
                  className="text-gray-600 hover:text-brand-700"
                >
                  Contact sales
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-brand-700">
                  About
                </Link>
              </li>
              <li>
                <a
                  href="mailto:careers@parentscript.app"
                  className="text-gray-600 hover:text-brand-700"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="mailto:press@parentscript.app"
                  className="text-gray-600 hover:text-brand-700"
                >
                  Press
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/security" className="text-gray-600 hover:text-brand-700">
                  Security & HIPAA
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-brand-700">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-brand-700">
                  Terms of service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs text-gray-500">© {year} AMAZED Labs. All rights reserved.</p>
          <p className="text-xs text-gray-500">
            ParentScript is not a substitute for professional clinical judgment. In an emergency,
            call 911 or the Suicide & Crisis Lifeline at 988.
          </p>
        </div>

        {/* Scope of practice + crisis lines. Mira-verified disclosure. */}
        <div className="mt-8">
          <ScopeOfPracticeDisclosure compact />
        </div>
      </div>
    </footer>
  );
}
