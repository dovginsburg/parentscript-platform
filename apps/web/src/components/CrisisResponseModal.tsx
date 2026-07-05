import { useEffect } from 'react';
import { CRISIS_RESPONSE_TEXT, SCOPE_DISCLOSURE_TEXT } from '@/lib/safety';

interface CrisisResponseModalProps {
  /** Trigger category for analytics / anonymized logging. */
  category: string;
  /** Whether this was caught via an indirect phrasing (vs. keyphrase). */
  indirect: boolean;
  onClose: () => void;
}

/**
 * Full-screen, high-contrast, panic-mode response.
 *
 * Surfaced when the safety preflight (client OR server) flags a
 * situation as a crisis-class trigger. This is the EXACT rendering
 * the verbatim crisis response text from Mira's clinical memo —
 * no LLM output, no templating, no animation beyond initial fade-in.
 *
 * Why a modal (not a regular step result):
 *   1. A parent in distress needs the hotlines above the fold and
 *      tappable. The regular result UI buries them inside steps.
 *   2. High-contrast on dark bg → readable in low-light, high-stress
 *      environments.
 *   3. Auto-opens on top of the streaming/result panel. The parent
 *      never has to "find" the help.
 *
 * Accessibility:
 *   - role="alertdialog" + aria-live=assertive so screen readers
 *     interrupt whatever else they're saying.
 *   - The hotline numbers are <a href="tel:…"> so a phone-tap
 *     works on mobile.
 */
export default function CrisisResponseModal({
  category,
  indirect,
  onClose,
}: CrisisResponseModalProps) {
  // Auto-focus the close button so keyboard users can dismiss without
  // accidentally tapping a phone link.
  useEffect(() => {
    // Slight delay so the screen reader announces the modal first.
    const t = setTimeout(() => {
      const btn = document.querySelector<HTMLButtonElement>('[data-crisis-close]');
      btn?.focus();
    }, 250);
    return () => clearTimeout(t);
  }, []);

  // The "lines" are rendered as a list so each hotline is its own
  // tappable target on mobile.
  const lines = CRISIS_RESPONSE_TEXT.split('\n').filter(l => l.trim());

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col"
      role="alertdialog"
      aria-live="assertive"
      aria-label="Help is available right now"
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-white/60">
          Help is available right now
          {indirect && <span className="ml-2 text-white/40">· sensitive content detected</span>}
        </p>
        <button
          onClick={onClose}
          data-crisis-close
          aria-label="Close this safety screen"
          className="text-white/80 hover:text-white min-h-tap min-w-tap px-2"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
        <div className="md:max-w-2xl md:mx-auto">
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">You are not alone.</h1>
          <p className="text-lg md:text-xl text-white/80 mb-8">
            ParentScript isn't the right tool for this moment. Please reach out to a person who can
            help right now.
          </p>

          <div className="space-y-3 mb-8">
            {lines.map((line, i) => {
              // Match "• <number> — <name>" and link the phone number.
              const phoneMatch = line.match(
                /(\d{3}[\s-]?\d{3}[\s-]?\d{4}|\d{4}|\d{3}-\d{3}-\d{4})/
              );
              const cleanedPhone = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, '') : null;
              return (
                <a
                  key={i}
                  href={cleanedPhone ? `tel:${cleanedPhone}` : undefined}
                  className="block bg-white text-black rounded-2xl px-5 py-5 md:py-7 font-bold text-parent-lg md:text-2xl leading-snug active:bg-white/90 min-h-tap touch-feedback"
                  aria-label={line}
                >
                  {line}
                </a>
              );
            })}
          </div>

          <details className="mt-6 mb-8">
            <summary className="text-white/70 text-sm cursor-pointer min-h-tap py-2">
              Scope of what ParentScript is
            </summary>
            <p className="text-white/70 text-sm mt-3 leading-relaxed">{SCOPE_DISCLOSURE_TEXT}</p>
          </details>

          <p className="text-white/40 text-xs">
            Category: <span className="font-mono">{category}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
