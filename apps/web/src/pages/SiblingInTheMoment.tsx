import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  FALLBACK_SAFETY_NOTE,
  FALLBACK_DISCLAIMER,
  type CoachResponse,
  streamCoachResponse,
} from '@/lib/ai-prompts'
import {
  detectCrisisTrigger,
  shieldSituationClient,
  isCrisisResponse,
} from '@/lib/safety'
import CrisisResponseModal from '@/components/CrisisResponseModal'
import ScopeOfPracticeDisclosure from '@/components/ScopeOfPracticeDisclosure'
import MarkFooter from '@/components/MarkFooter'

// ──────────────────────────────────────────────────────────────────────
// SiblingInTheMoment — peer-support coach for the SiblingSupport surface
// ──────────────────────────────────────────────────────────────────────
//
// Mark's design system v1.0 re-skin:
//   - Indigo accent on primary CTA + brand mark
//   - ps-card for input panel and step cards
//   - Calm clinical voice in copy
//   - Sentence case headings
//
// Architectural notes preserved verbatim from prior version:
//   - NO AUTH GATE in v0. SiblingSupport is open-access.
//   - NO DAILY-USAGE CAP in v0.
//   - NO "SAVE AS PRACTICE LOG" follow-up.
//   - Streaming surface, safety preflight, crisis modal unchanged.
//   - Surface = 'sibling' forwarded to /api/coach.

type AiMode = 'off' | 'input' | 'streaming' | 'result'

function parseStreamedText(text: string): CoachResponse {
  const lines = text.trim().split('\n')
  const steps: string[] = []
  let empathy = '', safetyNote = '', disclaimer = ''
  for (const line of lines) {
    const idx = line.indexOf(': ')
    if (idx < 0) continue
    const label = line.slice(0, idx)
    const val = line.slice(idx + 2).trim()
    if (!val) continue
    if (label === 'EMPATHY') empathy = val
    else if (label === 'STEP1') steps[0] = val
    else if (label === 'STEP2') steps[1] = val
    else if (label === 'STEP3') steps[2] = val
    else if (label === 'SAFETY') safetyNote = val
    else if (label === 'DISCLAIMER') disclaimer = val
  }
  const validSteps = steps.filter(Boolean)
  return {
    empathy,
    steps: validSteps.length > 0 ? validSteps : ['Take a breath. Try again in a moment.'],
    safetyNote: safetyNote || FALLBACK_SAFETY_NOTE,
    disclaimer: disclaimer || FALLBACK_DISCLAIMER,
  }
}

export default function SiblingInTheMoment() {
  const [aiMode, setAiMode] = useState<AiMode>('input')
  const [situationText, setSituationText] = useState('')
  const [aiResult, setAiResult] = useState<CoachResponse | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Streaming state
  const [streamedEmpathy, setStreamedEmpathy] = useState('')
  const [streamedSteps, setStreamedSteps] = useState<string[]>([])
  const [_streamedSafety, setStreamedSafety] = useState('')
  const [streamTyping, setStreamTyping] = useState('')

  // Crisis-flag state
  const [crisisTrigger, setCrisisTrigger] = useState<
    { category: string; indirect: boolean } | null
  >(null)

  // Refs mirror the streaming state so the final 'disclaimer' event
  // (which fires last) can read the latest empathy/safety values
  // without a React stale-closure race.
  const empathyRef = useRef('')
  const safetyRef = useRef('')
  const stepsRef = useRef<string[]>([])

  const abortRef = useRef<AbortController | null>(null)

  function handleBack() {
    if (aiMode === 'result') { setAiMode('input'); setAiResult(null); return }
    if (aiMode === 'streaming') {
      abortRef.current?.abort()
      setStreamTyping('')
      setAiMode('input')
      setAiError(null)
      return
    }
    window.history.back()
  }

  async function handleAiSubmit() {
    if (!situationText.trim()) return

    // Clinical-safety preflight (client mirror of api/safety-guard.mjs).
    const localShield = shieldSituationClient(situationText)
    if (localShield && isCrisisResponse(localShield)) {
      const trigger = detectCrisisTrigger(situationText)
      setAiError(null)
      setSituationText('')
      setAiResult(localShield)
      setAiMode('off')
      setCrisisTrigger({
        category: trigger?.category ?? 'unknown',
        indirect: !!trigger?.indirect,
      })
      return
    }

    setAiError(null)
    setStreamedEmpathy('')
    setStreamedSteps([])
    setStreamedSafety('')
    setStreamTyping('')
    setAiMode('streaming')

    abortRef.current = new AbortController()

    let accText = ''
    await streamCoachResponse(
      situationText,
      { siblingAge: 14, userAge: 17 },
      (evt) => {
        if (evt.type === 'empathy') {
          empathyRef.current = evt.text
          setStreamedEmpathy(evt.text)
        } else if (evt.type === 'step') {
          stepsRef.current[evt.index] = evt.text
          setStreamedSteps((prev) => {
            const next = [...prev]
            next[evt.index] = evt.text
            return next
          })
        } else if (evt.type === 'safety') {
          safetyRef.current = evt.text
          setStreamedSafety(evt.text)
        } else if (evt.type === 'disclaimer') {
          const steps = stepsRef.current.filter(Boolean)
          setAiResult({
            empathy: empathyRef.current,
            steps: steps.length > 0 ? steps : [evt.text],
            safetyNote: safetyRef.current || FALLBACK_SAFETY_NOTE,
            disclaimer: evt.text || FALLBACK_DISCLAIMER,
          })
          setAiMode('result')
        } else if (evt.type === 'done') {
          // No-op — disclaimer event already moved us to result.
        } else if (evt.type === 'error') {
          setAiError(evt.message)
          setAiMode('input')
        }
      },
      abortRef.current.signal,
      'sibling',
      'en-US',
    )
    if (aiMode === 'streaming' && accText) {
      const result = parseStreamedText(accText)
      setAiResult(result)
      setAiMode('result')
    }
  }

  return (
    <div className="min-h-dvh bg-ps-bg-soft flex flex-col">
      {/* Full-screen crisis modal — overlaid when the safety preflight catches a trigger */}
      {crisisTrigger && (
        <CrisisResponseModal
          category={crisisTrigger.category}
          indirect={crisisTrigger.indirect}
          onClose={() => {
            setCrisisTrigger(null)
            setAiResult(null)
            setSituationText('')
          }}
        />
      )}

      {/* Header — in-app chrome (not MarkHeader), per Mark's design system */}
      <header className="bg-ps-bg border-b border-ps-border px-4 md:px-8 pt-safe-top pb-4 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="text-ps-text-soft hover:text-ps-text min-h-tap flex items-center transition-ps"
          aria-label="Back"
        >
          ← Back
        </button>
        <Link to="/sibling" className="flex items-center gap-2 text-sm font-bold text-ps-text">
          <span aria-hidden="true" className="w-6 h-6 grid place-items-center bg-ps-accent text-white rounded-md text-xs font-bold">
            S
          </span>
          SiblingSupport
        </Link>
        <div className="w-12" />
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-2xl mx-auto w-full">
        {aiMode === 'input' && (
          <>
            <div className="mb-6">
              <span className="ps-eyebrow">SiblingSupport coach</span>
              <h1 className="text-2xl md:text-[30px] font-bold text-ps-text mt-2 mb-2 tracking-tight leading-tight">
                What's happening with your sibling?
              </h1>
              <p className="text-ps-text-soft leading-relaxed">
                One tap to get grounded. Type what just happened — even a
                sentence is enough. The coach will help you slow down, listen,
                and try one thing at a time.
              </p>
            </div>

            <div className="ps-card mb-3">
              <textarea
                value={situationText}
                onChange={(e) => setSituationText(e.target.value)}
                placeholder="e.g. My brother has been in his room for three days and won't talk to anyone."
                className="w-full min-h-32 p-0 bg-transparent border-0 focus:outline-none focus:ring-0 text-base text-ps-text placeholder:text-ps-muted resize-none"
                maxLength={2000}
                aria-label="What's happening with your sibling?"
              />
            </div>

            <div className="text-xs text-ps-text-softer text-right mb-3">
              {situationText.length} / 2000
            </div>

            {aiError && (
              <div className="ps-alert ps-alert-warm mb-3">
                <div className="ps-alert-content">
                  <p className="text-sm">{aiError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleAiSubmit}
              disabled={!situationText.trim()}
              className="w-full ps-btn ps-btn-primary ps-btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get grounded
            </button>

            <div className="mt-8">
              <ScopeOfPracticeDisclosure compact surface="sibling" />
            </div>
          </>
        )}

        {(aiMode === 'streaming' || aiMode === 'result') && (
          <div>
            <span className="ps-eyebrow">
              {aiMode === 'streaming' ? 'Holding space with you…' : 'Three steps to try'}
            </span>
            <h1 className="text-2xl md:text-[30px] font-bold text-ps-text mt-2 mb-6 tracking-tight">
              {aiMode === 'streaming' ? 'Holding space with you…' : 'Here are three steps.'}
            </h1>

            {/* Empathy */}
            {(streamedEmpathy || (aiResult?.empathy ?? '')) && (
              <p className="text-lg md:text-[20px] text-ps-text italic mb-6 leading-relaxed">
                {streamedEmpathy || aiResult?.empathy}
              </p>
            )}

            {/* Steps */}
            <ol className="space-y-3">
              {(aiResult?.steps || streamedSteps.filter(Boolean) || []).map((step, i) => (
                <li
                  key={i}
                  className="ps-card flex gap-3 items-start"
                >
                  <span
                    aria-hidden="true"
                    className="shrink-0 w-8 h-8 rounded-full bg-ps-accent text-white font-bold text-sm grid place-items-center mt-0.5"
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-base md:text-[17px] text-ps-text leading-relaxed">
                      {aiMode === 'streaming' && i === streamedSteps.filter(Boolean).length
                        ? step + streamTyping
                        : step}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Safety note */}
            {aiMode === 'result' && aiResult && (
              <div className="ps-alert ps-alert-warm mt-6">
                <div className="ps-alert-content">
                  <span className="eyebrow" style={{ color: 'var(--ps-danger)' }}>Safety</span>
                  <p className="text-sm text-ps-text leading-relaxed">
                    {aiResult.safetyNote}
                  </p>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            {aiMode === 'result' && aiResult && (
              <p className="mt-4 text-xs text-ps-text-softer leading-relaxed">
                {aiResult.disclaimer}
              </p>
            )}

            {/* Result-mode actions */}
            {aiMode === 'result' && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setAiMode('input')
                    setAiResult(null)
                    setSituationText('')
                  }}
                  className="flex-1 ps-btn ps-btn-secondary ps-btn-lg"
                >
                  Ask about something else
                </button>
                <Link
                  to="/sibling/safety"
                  className="flex-1 ps-btn ps-btn-secondary ps-btn-lg"
                >
                  More safety resources
                </Link>
              </div>
            )}

            {aiMode === 'streaming' && (
              <button
                onClick={() => abortRef.current?.abort()}
                className="mt-6 ps-btn ps-btn-ghost ps-btn-sm text-ps-text-soft underline"
              >
                Stop
              </button>
            )}
          </div>
        )}
      </main>

      <MarkFooter product="sibling" />
    </div>
  )
}