import { useState } from 'react';

/* ============================================================
   CrisisCard — "In-the-Moment" emergency banner for ParentScript
   ============================================================
   Renders ABOVE all other UI on the parent-side home so that
   when a parent is in crisis, the hotlines are one tap away —
   not three scrolls down.

   Tokens used (packages/design/tokens.json → global.feedback.crisis):
     bg:        #FEE2E2
     bgStrong:  #FCA5A5
     border:    #DC2626  (2px)
     ink:       #7F1D1D
     shadow:    0 8px 32px rgba(220,38,38,0.20)

   z-index: crisis (400) — above modal (200). Always visible
   unless explicitly dismissed.

   Visible on every parent page. Hides only when:
     - The user clicks "hide for now" (sessionStorage)
     - Force-hidden via the `hidden` prop

   Why a card and not just a button?
     - The current "In the Moment" button goes to a coaching
       flow. This card is the hard, unmissable escalation path.
     - Hotlines are real <a href="tel:…"> so a phone-tap works.
     - Renders first on the page so a parent scrolling for
       help lands on it immediately.

   Acceptance:
     - Above-the-fold on parent home (no scroll needed)
     - Phone numbers tappable on mobile (tel: links)
     - Token-aligned colors (#DC2626 border, etc.)
     - Hidden state persisted for the session only
     - Accessible: role="region" + aria-label
   ============================================================ */

interface CrisisCardProps {
  /** Optional override for the headline. Default is clinical, plain. */
  heading?: string;
  /** Optional override for the body. Default is judgment-free. */
  body?: string;
  /** Force-hide (e.g. feature flag off, demo mode). */
  hidden?: boolean;
}

interface Hotline {
  label: string;
  full: string;
  href: string;
}

const HOTLINES: Hotline[] = [
  { label: '988', full: 'Suicide & Crisis Lifeline', href: 'tel:988' },
  { label: '911', full: 'Emergency services', href: 'tel:911' },
  { label: '1-800-422-4453', full: 'Childhelp (child abuse)', href: 'tel:18004224453' },
];

const SESSION_KEY = 'parentscript-crisis-card-dismissed';

export default function CrisisCard({
  heading = 'If it feels too big to hold alone, call someone.',
  body = "ParentScript is a coaching tool, not a crisis tool. If you're worried about your child's safety or your own, talk to a person who can help right now.",
  hidden = false,
}: CrisisCardProps) {
  // Read once on mount so we don't re-hide on re-render.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  });

  if (hidden || dismissed) return null;

  function handleDismiss() {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // sessionStorage may be blocked; that's fine — card stays visible.
    }
    setDismissed(true);
  }

  return (
    <aside
      role="region"
      aria-label="Crisis support — call someone if you're in immediate danger"
      className="crisis-card"
    >
      <div className="crisis-card-inner">
        <div className="crisis-card-text">
          <span className="crisis-card-label">
            <span className="crisis-card-label-dot" aria-hidden="true" />
            in-the-moment
          </span>
          <h2 className="crisis-card-heading">{heading}</h2>
          <p className="crisis-card-body">{body}</p>
        </div>

        <div className="crisis-card-hotlines" role="list">
          {HOTLINES.map(h => (
            <a
              key={h.label}
              href={h.href}
              role="listitem"
              className="crisis-card-hotline"
              aria-label={`${h.full} — ${h.label}`}
            >
              <span className="crisis-card-hotline-label">{h.label}</span>
              <span className="crisis-card-hotline-full">{h.full}</span>
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="crisis-card-dismiss"
          aria-label="Hide this card for the rest of the session"
        >
          hide for now
        </button>
      </div>
    </aside>
  );
}

/* ============================================================
   Companion CSS — drop into apps/web/src/styles/design-system-components.css
   ============================================================ */

export const CRISIS_CARD_CSS = `
.crisis-card {
  z-index: 400;
  background: #FEE2E2;
  border: 2px solid #DC2626;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(220, 38, 38, 0.20);
  margin: 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
@media (min-width: 768px) {
  .crisis-card { margin: 24px; padding: 24px; }
}

.crisis-card-inner {
  display: grid;
  gap: 18px;
  grid-template-columns: 1fr;
}
@media (min-width: 880px) {
  .crisis-card-inner {
    grid-template-columns: 1.4fr 1fr;
    align-items: center;
    gap: 28px;
  }
}

.crisis-card-text { color: #7F1D1D; }

.crisis-card-label {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 4px 12px;
  background: #DC2626;
  color: #FFFFFF;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.crisis-card-label-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.30);
  animation: crisis-pulse 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
}
@keyframes crisis-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.55); }
  70%  { box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .crisis-card-label-dot { animation: none; }
}

.crisis-card-heading {
  font-size: clamp(20px, 2.6vw, 26px);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
  margin-bottom: 8px;
}
.crisis-card-body {
  font-size: 15px;
  line-height: 1.55;
  color: #7F1D1D;
  max-width: 60ch;
}

.crisis-card-hotlines {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
@media (min-width: 560px) {
  .crisis-card-hotlines { grid-template-columns: 1fr 1fr 1fr; }
}

.crisis-card-hotline {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  background: #FFFFFF;
  border: 1px solid #FCA5A5;
  border-radius: 12px;
  color: #7F1D1D;
  transition:
    background-color 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
    color 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  min-height: 64px;
  text-decoration: none;
}
.crisis-card-hotline:hover {
  background: #7F1D1D;
  color: #FFFFFF;
  border-color: #7F1D1D;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(127, 29, 29, 0.25);
}
.crisis-card-hotline:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.40);
}
.crisis-card-hotline:active { transform: translateY(0); }

.crisis-card-hotline-label {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.005em;
  font-feature-settings: 'tnum' 1;
}
.crisis-card-hotline-full {
  font-size: 12px;
  font-weight: 500;
  color: #B91C1C;
}
.crisis-card-hotline:hover .crisis-card-hotline-full {
  color: rgba(255, 255, 255, 0.85);
}

.crisis-card-dismiss {
  align-self: flex-start;
  background: transparent;
  border: none;
  color: #7F1D1D;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 0;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(127, 29, 29, 0.40);
  cursor: pointer;
  min-height: 32px;
  transition: text-decoration-color 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.crisis-card-dismiss:hover { text-decoration-color: #7F1D1D; }
.crisis-card-dismiss:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.40);
  border-radius: 4px;
}

@media (forced-colors: active) {
  .crisis-card { border: 2px solid CanvasText; }
  .crisis-card-hotline { border: 1px solid CanvasText; }
  .crisis-card-hotline:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
    box-shadow: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .crisis-card-hotline { transition: none; }
  .crisis-card-hotline:hover { transform: none; }
  .crisis-card-dismiss { transition: none; }
}
`.trim();
