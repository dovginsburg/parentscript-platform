import { useState } from 'react'

/* ============================================================
   TonePreview — Tono 4-tone rewrite preview
   ============================================================
   Shows an original message on the left and the four rewrites
   (warmer / clearer / funnier / safer) on the right. Each rewrite
   has a copy button.

   Surface: OPERATE (dark, premium, dry-witty)
   Tone accents (per design-tokens.json):
     warmer  → #F472B6 (pink)
     clearer → #38BDF8 (sky)
     funnier → #FBBF24 (amber)
     safer   → #34D399 (green)

   Visual hierarchy:
     - Left rail: original, read-only, muted
     - Right grid: four tone cards, each with a colored accent
       dot, label, body text, and "copy" button
     - On hover, the tone card lifts and its accent color fills
       the border
     - "Copied" feedback swaps the copy button label briefly
     - Works in dark (default) and prefers-color-scheme: light
       (we override the dark vars in light mode)

   Usage:
     <TonePreview
       original="hey team, just wanted to check in..."
       rewrites={{
         warmer: "quick check-in on q3...",
         clearer: "where are we on the q3 timeline?",
         funnier: "hey — checking on q3...",
         safer: "hi team — could you share the latest..."
       }}
       onCopy={(tone, text) => navigator.clipboard.writeText(text)}
     />
   ============================================================ */

export interface TonePreviewProps {
  /** The user's original text (left rail). */
  original: string
  /** The four rewrites from the Tono API. Missing tones are skipped. */
  rewrites: Partial<{
    warmer: string
    clearer: string
    funnier: string
    safer: string
  }>
  /** Optional copy handler. Defaults to clipboard. */
  onCopy?: (tone: ToneKey, text: string) => void | Promise<void>
  /** Compact mode — single column, smaller cards. */
  compact?: boolean
}

export type ToneKey = 'warmer' | 'clearer' | 'funnier' | 'safer'

interface ToneMeta {
  key: ToneKey
  label: string
  blurb: string
  color: string
  soft: string
  glow: string
}

const TONE_META: Record<ToneKey, ToneMeta> = {
  warmer: {
    key: 'warmer',
    label: 'warmer',
    blurb: 'adds warmth without losing the point',
    color: '#F472B6',
    soft: 'rgba(244, 114, 182, 0.14)',
    glow: 'rgba(244, 114, 182, 0.30)',
  },
  clearer: {
    key: 'clearer',
    label: 'clearer',
    blurb: 'cuts ambiguity. states the ask.',
    color: '#38BDF8',
    soft: 'rgba(56, 189, 248, 0.14)',
    glow: 'rgba(56, 189, 248, 0.30)',
  },
  funnier: {
    key: 'funnier',
    label: 'funnier',
    blurb: 'eases tension. stays professional.',
    color: '#FBBF24',
    soft: 'rgba(251, 191, 36, 0.14)',
    glow: 'rgba(251, 191, 36, 0.30)',
  },
  safer: {
    key: 'safer',
    label: 'safer',
    blurb: 'de-escalates. flags risk early.',
    color: '#34D399',
    soft: 'rgba(52, 211, 153, 0.14)',
    glow: 'rgba(52, 211, 153, 0.30)',
  },
}

const TONE_ORDER: ToneKey[] = ['warmer', 'clearer', 'funnier', 'safer']

export default function TonePreview({
  original,
  rewrites,
  onCopy,
  compact = false,
}: TonePreviewProps) {
  const [copiedTone, setCopiedTone] = useState<ToneKey | null>(null)
  const [errorTone, setErrorTone] = useState<ToneKey | null>(null)

  const handleCopy = async (tone: ToneKey) => {
    const text = rewrites[tone]
    if (!text) return
    try {
      if (onCopy) {
        await onCopy(tone, text)
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      }
      setCopiedTone(tone)
      setErrorTone(null)
      setTimeout(() => setCopiedTone(prev => (prev === tone ? null : prev)), 1400)
    } catch (err) {
      console.error('[TonePreview] copy failed:', err)
      setErrorTone(tone)
      setTimeout(() => setErrorTone(prev => (prev === tone ? null : prev)), 1800)
    }
  }

  const availableTones = TONE_ORDER.filter(t => rewrites[t])
  const charCount = original.length
  const wordCount = original.trim() ? original.trim().split(/\s+/).length : 0

  return (
    <div className={`tono-tone-preview ${compact ? 'is-compact' : ''}`}>
      {/* ── left rail: original ───────────────────────── */}
      <aside className="tono-tone-rail" aria-label="original message">
        <header className="tono-tone-rail-head">
          <span className="tono-tone-rail-dot" aria-hidden="true" />
          <span className="tono-tone-rail-label">original</span>
        </header>
        <p className="tono-tone-rail-body">{original}</p>
        <footer className="tono-tone-rail-foot">
          <span className="tono-mono">
            {charCount} chars · {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
        </footer>
      </aside>

      {/* ── right grid: the four rewrites ──────────────── */}
      <div
        className={`tono-tone-grid tono-tone-grid-${availableTones.length}`}
        role="list"
        aria-label="four rewrites"
      >
        {availableTones.map(tone => {
          const meta = TONE_META[tone]
          const text = rewrites[tone]!
          const isCopied = copiedTone === tone
          const isError = errorTone === tone
          return (
            <article
              key={tone}
              className="tono-tone-card"
              data-tone={tone}
              role="listitem"
              style={{
                // CSS vars per-card so hover / focus can read them
                ['--tone-color' as string]: meta.color,
                ['--tone-soft' as string]: meta.soft,
                ['--tone-glow' as string]: meta.glow,
              }}
            >
              <header className="tono-tone-card-head">
                <span className="tono-tone-name">
                  <span className="tono-tone-dot" aria-hidden="true" />
                  {meta.label}
                </span>
                <span className="tono-tone-blurb">{meta.blurb}</span>
              </header>
              <p className="tono-tone-card-body">{text}</p>
              <footer className="tono-tone-card-foot">
                <button
                  type="button"
                  onClick={() => handleCopy(tone)}
                  className="tono-tone-copy"
                  aria-label={`copy ${meta.label} rewrite`}
                >
                  {isCopied ? 'copied' : isError ? 'retry' : 'copy'}
                </button>
              </footer>
            </article>
          )
        })}
      </div>
    </div>
  )
}

/* ============================================================
   Companion CSS — drop into apps/web/src/styles/design-system-components.css
   The full styles are inlined there so PostCSS can compile them.
   ============================================================ */

export const TONE_PREVIEW_CSS = `
.tono-tone-preview {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #FFFFFF;
}
@media (min-width: 880px) {
  .tono-tone-preview { grid-template-columns: minmax(280px, 360px) 1fr; gap: 20px; }
  .tono-tone-preview.is-compact { grid-template-columns: 1fr; }
}

.tono-tone-rail {
  display: flex; flex-direction: column;
  background: #111113;
  border: 1px solid #1F1F23;
  border-radius: 18px;
  padding: 16px;
  min-height: 100%;
}
.tono-tone-rail-head {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9CA3AF;
  margin-bottom: 12px;
}
.tono-tone-rail-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #6B7280;
}
.tono-tone-rail-body {
  flex: 1;
  font-size: 15px;
  line-height: 1.55;
  color: #C9C9D1;
  white-space: pre-wrap;
}
.tono-tone-rail-foot {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #1F1F23;
  font-size: 11px;
  color: #6B7280;
}
.tono-mono {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
}

.tono-tone-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
}
@media (min-width: 560px) { .tono-tone-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1080px) {
  .tono-tone-grid-4 { grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; }
  .tono-tone-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
  .tono-tone-grid-2 { grid-template-columns: 1fr 1fr; }
  .tono-tone-grid-1 { grid-template-columns: 1fr; }
}
.tono-tone-grid-1 { grid-template-columns: 1fr; }
.tono-tone-grid-2 { grid-template-columns: 1fr 1fr; }
.tono-tone-grid-3 { grid-template-columns: 1fr 1fr 1fr; }

.tono-tone-card {
  display: flex; flex-direction: column;
  background: #16161A;
  border: 1px solid #1F1F23;
  border-radius: 12px;
  padding: 14px;
  transition: transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
              border-color 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
              box-shadow 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.tono-tone-card:hover {
  transform: translateY(-2px);
  border-color: var(--tone-color, #A855F7);
  box-shadow: 0 8px 24px rgba(0,0,0,0.30),
              0 0 0 1px var(--tone-color, #A855F7);
}
.tono-tone-card:focus-within {
  outline: none;
  border-color: var(--tone-color, #A855F7);
  box-shadow: 0 0 0 3px var(--tone-glow, rgba(168,85,247,0.35));
}

.tono-tone-card-head {
  display: flex; flex-direction: column; gap: 4px;
  margin-bottom: 10px;
}
.tono-tone-name {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600;
  color: var(--tone-color, #A855F7);
}
.tono-tone-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--tone-color, #A855F7);
  box-shadow: 0 0 12px var(--tone-color, #A855F7);
}
.tono-tone-blurb {
  font-size: 11px;
  color: #6B7280;
  line-height: 1.4;
}

.tono-tone-card-body {
  flex: 1;
  font-size: 14px;
  line-height: 1.55;
  color: #FFFFFF;
  margin-bottom: 14px;
  white-space: pre-wrap;
}

.tono-tone-card-foot {
  display: flex; justify-content: flex-end;
  margin-top: auto;
}
.tono-tone-copy {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: lowercase;
  color: #9CA3AF;
  background: transparent;
  border: 1px solid #2A2A30;
  border-radius: 8px;
  min-height: 32px;
  cursor: pointer;
  transition: all 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.tono-tone-copy:hover {
  color: var(--tone-color, #A855F7);
  border-color: var(--tone-color, #A855F7);
  background: var(--tone-soft, rgba(168,85,247,0.10));
}
.tono-tone-copy:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--tone-glow, rgba(168,85,247,0.35));
}

@media (prefers-reduced-motion: reduce) {
  .tono-tone-card, .tono-tone-copy { transition: none; }
  .tono-tone-card:hover { transform: none; }
}

@media (prefers-color-scheme: light) {
  .tono-tone-preview { color: #111113; }
  .tono-tone-rail {
    background: #FFFFFF;
    border-color: #E5E7EB;
  }
  .tono-tone-rail-head { color: #6B7280; }
  .tono-tone-rail-body { color: #4B5563; }
  .tono-tone-rail-foot {
    color: #9CA3AF;
    border-top-color: #E5E7EB;
  }
  .tono-tone-card {
    background: #FAFBFC;
    border-color: #E5E7EB;
  }
  .tono-tone-card-body { color: #111827; }
  .tono-tone-copy {
    color: #4B5563;
    border-color: #D1D5DB;
  }
  .tono-tone-card:hover {
    box-shadow: 0 8px 24px rgba(17,24,39,0.08);
  }
}
`.trim()