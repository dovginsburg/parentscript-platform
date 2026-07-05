import { Link } from 'react-router-dom'

// ──────────────────────────────────────────────────────────────────────
// MarkHeader — shared marketing-page header
// ──────────────────────────────────────────────────────────────────────
//
// Renders the ParentScript brand mark (indigo square with "P") + a
// slim nav. Replaces the hand-rolled <header> block that previously
// lived on every public page (Home, About, Pricing, Security, …).
//
// Source of truth: /Users/Ezra/Projects/team/mark-deliverables/
//   - design-tokens.json (colors, type, radii)
//   - parentscript-dashboard.html (sidebar brand-mark archetype)
//   - brand-voice-guide.md (sentence case, lowercase CTAs, no shouting)
//
// Props:
//   - product: 'parentscript' | 'sibling' — swaps the brand label
//     + nav items for the SiblingSupport surface
//   - cta: optional { label, href } for a header CTA button on the
//     right edge (e.g. "Open the coach" on /sibling/safety)
//
// Lane note: this is the public-site header. Auth-gated pages
// (ClientList, ParentHome, InTheMoment, Billing inside the
// authenticated shell) render their own app chrome and do NOT use
// MarkHeader.

type MarkHeaderProps = {
  product?: 'parentscript' | 'sibling'
  cta?: { label: string; href: string }
}

export default function MarkHeader({ product = 'parentscript', cta }: MarkHeaderProps) {
  if (product === 'sibling') {
    return (
      <header className="bg-ps-bg border-b border-ps-border">
        <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link to="/sibling" className="flex items-center gap-3" aria-label="SiblingSupport — back to landing">
            <span
              aria-hidden="true"
              className="w-8 h-8 grid place-items-center bg-ps-accent text-white rounded-[10px] font-bold text-[15px]"
            >
              S
            </span>
            <span className="font-bold text-[17px] tracking-tight text-ps-text">
              SiblingSupport
            </span>
            <span className="text-xs text-ps-muted hidden sm:inline">AMAZED Labs</span>
          </Link>

          <nav className="flex items-center gap-4 md:gap-6 text-sm font-medium">
            <Link
              to="/sibling/safety"
              className="text-ps-text-soft hover:text-ps-text transition-ps min-h-tap flex items-center"
            >
              Safety
            </Link>
            {cta ? (
              <Link
                to={cta.href}
                className="ps-btn ps-btn-primary ps-btn-sm"
              >
                {cta.label}
              </Link>
            ) : (
              <Link
                to="/sibling/app"
                className="ps-btn ps-btn-primary ps-btn-sm"
              >
                Open the coach
              </Link>
            )}
          </nav>
        </div>
      </header>
    )
  }

  // parentscript (default)
  return (
    <header className="bg-ps-bg border-b border-ps-border">
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" aria-label="ParentScript — back to home">
          <span
            aria-hidden="true"
            className="w-8 h-8 grid place-items-center bg-ps-accent text-white rounded-[10px] font-bold text-[15px]"
          >
            P
          </span>
          <span className="font-bold text-[17px] tracking-tight text-ps-text">
            ParentScript
          </span>
          <span className="text-xs text-ps-muted hidden sm:inline">AMAZED Labs</span>
        </Link>

        <nav className="flex items-center gap-4 md:gap-6 text-sm font-medium">
          <Link
            to="/pricing"
            className="text-ps-text-soft hover:text-ps-text transition-ps min-h-tap flex items-center"
          >
            Pricing
          </Link>
          <Link
            to="/security"
            className="text-ps-text-soft hover:text-ps-text transition-ps min-h-tap flex items-center"
          >
            Security
          </Link>
          <Link
            to="/about"
            className="text-ps-text-soft hover:text-ps-text transition-ps min-h-tap flex items-center"
          >
            About
          </Link>
          <Link
            to="/login"
            className="text-ps-text-soft hover:text-ps-text transition-ps min-h-tap flex items-center"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="ps-btn ps-btn-primary ps-btn-sm hidden sm:inline-flex"
          >
            Start free trial
          </Link>
        </nav>
      </div>
    </header>
  )
}