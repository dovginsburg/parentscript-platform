import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeBack } from '@/hooks/useSwipe';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useAuth } from '@/hooks/useAuth';
import { useDailyUsage } from '@/hooks/useDailyUsage';
import { supabase } from '@/lib/supabase';
import {
  AI_GENERATED_LABEL,
  FALLBACK_SAFETY_NOTE,
  FALLBACK_DISCLAIMER,
  type CoachResponse,
} from '@/lib/ai-prompts';
import { detectCrisisTrigger, shieldSituationClient, isCrisisResponse } from '@/lib/safety';
import CrisisResponseModal from '@/components/CrisisResponseModal';

interface Situation {
  id: string;
  label: string;
  emoji: string;
  tips: string[];
}

const SITUATIONS: Situation[] = [
  {
    id: 'meltdown',
    label: 'Meltdown / Tantrum',
    emoji: '🌊',
    tips: [
      'Stay calm. Your nervous system regulates theirs.',
      'Get low — crouch or sit nearby. No lectures right now.',
      "Say: \"I'm right here. I'll wait until you're ready.\"",
    ],
  },
  {
    id: 'defiance',
    label: "Defiance / Won't listen",
    emoji: '🚫',
    tips: [
      'One calm, clear command. Only one.',
      'Wait 5 seconds in silence. Do not repeat yet.',
      'When they comply — any step forward — praise it immediately.',
    ],
  },
  {
    id: 'whining',
    label: 'Whining / Complaining',
    emoji: '😤',
    tips: [
      'Do not respond to the whine. Wait for a normal voice.',
      'Stay neutral — no irritation in your face or tone.',
      'The moment they use a normal voice: engage warmly.',
    ],
  },
  {
    id: 'sibling',
    label: 'Sibling conflict',
    emoji: '⚡',
    tips: [
      'Separate first. Ask questions second.',
      'Validate both sides: "You both feel frustrated right now."',
      'If safe: let them work it out. Stay close, but step back.',
    ],
  },
];

const DISCLAIMER =
  'This app guides everyday difficult moments. For any situation involving danger to yourself or others, call 911 immediately.';

function parseStreamedText(text: string): CoachResponse {
  const lines = text.trim().split('\n');
  const steps: string[] = [];
  let empathy = '',
    safetyNote = '',
    disclaimer = '';
  for (const line of lines) {
    const idx = line.indexOf(': ');
    if (idx < 0) continue;
    const label = line.slice(0, idx);
    const val = line.slice(idx + 2).trim();
    if (!val) continue;
    if (label === 'EMPATHY') empathy = val;
    else if (label === 'STEP1') steps[0] = val;
    else if (label === 'STEP2') steps[1] = val;
    else if (label === 'STEP3') steps[2] = val;
    else if (label === 'SAFETY') safetyNote = val;
    else if (label === 'DISCLAIMER') disclaimer = val;
  }
  const validSteps = steps.filter(Boolean);
  return {
    empathy,
    steps: validSteps.length > 0 ? validSteps : ['Take a breath. Try again in a moment.'],
    safetyNote: safetyNote || FALLBACK_SAFETY_NOTE,
    disclaimer: disclaimer || FALLBACK_DISCLAIMER,
  };
}

type AiMode = 'off' | 'input' | 'streaming' | 'result';

export default function InTheMoment() {
  const navigate = useNavigate();
  const { canUse, loading } = useFeatureFlags();
  const { parent } = useAuth();
  // Daily usage is only enforced for free-tier parents. Therapist-connected
  // parents have unlimited coaching interactions.
  const isFreeTier = Boolean(parent?.is_self_serve);
  const { canCoach, loading: usageLoading, increment } = useDailyUsage();
  const [selected, setSelected] = useState<Situation | null>(null);
  const [showEscalation, setShowEscalation] = useState(false);

  // AI coaching state
  const [aiMode, setAiMode] = useState<AiMode>('off');
  const [situationText, setSituationText] = useState('');
  const [aiResult, setAiResult] = useState<CoachResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Streaming state — filled progressively as text arrives
  const [streamedEmpathy, setStreamedEmpathy] = useState('');
  const [streamedSteps, setStreamedSteps] = useState<string[]>([]);
  const [_streamedSafety, setStreamedSafety] = useState('');
  const [streamTyping, setStreamTyping] = useState('');

  // Persist the AI situation + result so we can offer a "save as practice log"
  // follow-up on the result screen without re-asking the parent.
  const [lastSituation, setLastSituation] = useState('');
  const [savedAsLog, setSavedAsLog] = useState(false);
  const [savingLog, setSavingLog] = useState(false);

  // Crisis-flag state — when the preflight matches, we render the
  // full-screen CrisisResponseModal instead of the regular result
  // list. See src/lib/safety.ts (Mira, 2026-06-30).
  const [crisisTrigger, setCrisisTrigger] = useState<{
    category: string;
    indirect: boolean;
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Redirect during render is forbidden — do it after commit.
  useEffect(() => {
    if (!loading && !canUse('inTheMoment')) {
      navigate('/parent', { replace: true });
    }
  }, [loading, canUse, navigate]);

  if (!loading && !canUse('inTheMoment')) {
    return null;
  }

  // Free-tier parents who have already used today's interaction see a
  // "come back tomorrow" panel instead of the input form.
  const blockedByUsage = isFreeTier && !usageLoading && !canCoach;

  function handleBack() {
    if (aiMode === 'result') {
      setAiMode('input');
      setAiResult(null);
      setSavedAsLog(false);
      return;
    }
    if (aiMode === 'streaming') {
      abortRef.current?.abort();
      setStreamTyping('');
      setAiMode('off');
      setAiError(null);
      return;
    }
    if (aiMode === 'input') {
      setAiMode('off');
      setAiError(null);
      return;
    }
    if (selected) {
      setSelected(null);
      return;
    }
    navigate('/parent');
  }

  const swipeHandlers = useSwipeBack(handleBack);

  async function handleAiSubmit() {
    if (!situationText.trim()) return;
    // Pre-flight: free-tier parents can't burn the request if they're capped.
    if (isFreeTier && !canCoach) {
      setAiError(
        "You've used today's free coaching interaction. It resets at midnight UTC, or upgrade for unlimited use."
      );
      return;
    }
    // Clinical-safety preflight (client mirror of api/safety-guard.mjs).
    // Runs BEFORE the network roundtrip so the verbatim crisis response
    // is instant and works even if the LLM is offline / unconfigured.
    // When `_crisis: true` is returned, we swap to a full-screen modal
    // instead of the normal step-list render.
    const localShield = shieldSituationClient(situationText);
    if (localShield && isCrisisResponse(localShield)) {
      const trigger = detectCrisisTrigger(situationText);
      setAiError(null);
      setSituationText('');
      setAiResult(localShield);
      setAiMode('off'); // CrisisResponseModal renders outside aiMode
      setCrisisTrigger({
        category: trigger?.category ?? 'unknown',
        indirect: !!trigger?.indirect,
      });
      return;
    }
    setAiError(null);
    setStreamedEmpathy('');
    setStreamedSteps([]);
    setStreamedSafety('');
    setStreamTyping('');
    setAiMode('streaming');
    setLastSituation(situationText);
    setSavedAsLog(false);

    abortRef.current = new AbortController();
    let accText = '';
    // Track whether we landed on a real, complete result so we can
    // decide whether to charge the free-tier daily interaction.
    let chargedUsage = false;

    // Parse accumulated text incrementally, updating streaming state on each chunk
    function updateFromText(text: string) {
      const lines = text.split('\n');
      const lastLine = lines[lines.length - 1];
      const completedLines = lines.slice(0, -1);
      const steps: string[] = ['', '', ''];
      let empathy = '',
        safety = '';
      for (const line of completedLines) {
        const idx = line.indexOf(': ');
        if (idx < 0) continue;
        const label = line.slice(0, idx);
        const val = line.slice(idx + 2).trim();
        if (label === 'EMPATHY') empathy = val;
        else if (label === 'STEP1') steps[0] = val;
        else if (label === 'STEP2') steps[1] = val;
        else if (label === 'STEP3') steps[2] = val;
        else if (label === 'SAFETY') safety = val;
      }
      setStreamedEmpathy(empathy);
      setStreamedSteps([...steps]);
      setStreamedSafety(safety);
      // Track the content of the line currently being typed for blinking cursor
      const partIdx = lastLine.indexOf(': ');
      const partLabel = partIdx >= 0 ? lastLine.slice(0, partIdx) : '';
      const partContent = partIdx >= 0 ? lastLine.slice(partIdx + 2) : '';
      setStreamTyping(['STEP1', 'STEP2', 'STEP3'].includes(partLabel) ? partContent : '');
    }

    try {
      const { data: sessData } = await supabase.auth.getSession();
      const token = sessData.session?.access_token ?? '';
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify({ situation: situationText }),
        signal: abortRef.current.signal,
      });
      if (!response.ok || !response.body) {
        const json = await response.json().catch(() => ({}));
        setAiError((json as { error?: string }).error ?? 'Request failed. Please try again.');
        setAiMode('input');
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const dataLine = part.split('\n').find(l => l.startsWith('data: '));
          if (!dataLine) continue;
          const data = dataLine.slice(6);
          if (data === '[DONE]') {
            const result = parseStreamedText(accText);
            setAiResult(result);
            setAiMode('result');
            chargedUsage = true;
            return;
          }
          let parsed: unknown;
          try {
            parsed = JSON.parse(data);
          } catch {
            continue;
          }
          if (typeof parsed === 'string') {
            accText += parsed;
            updateFromText(accText);
          } else if (parsed && typeof parsed === 'object' && 'error' in parsed) {
            setAiError((parsed as { error: string }).error);
            setAiMode('input');
            return;
          }
        }
      }
      // Stream closed without [DONE] — use what arrived
      const result = parseStreamedText(accText);
      if (result.steps.filter(Boolean).length > 0) {
        setAiResult(result);
        setAiMode('result');
        chargedUsage = true;
      } else {
        setAiError('No response received. Please try again.');
        setAiMode('input');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setAiError('Connection failed. Please try again.');
      setAiMode('input');
    } finally {
      // Charge the free-tier daily interaction only when we got a real
      // result. We don't decrement on errors, aborts, or empty streams.
      if (chargedUsage && isFreeTier) {
        try {
          await increment('coaching');
        } catch {
          /* swallow — UI already shows result */
        }
      }
    }
  }

  // Save the AI situation + result as a practice log so the therapist
  // can see what the parent worked on between sessions. Only available
  // for therapist-connected parents (self-serve parents have no therapist
  // to read the log — and client_id would be NULL, which only works
  // after migration 007 runs).
  async function handleSaveAsLog() {
    if (!parent || !lastSituation.trim() || savedAsLog || savingLog) return;
    if (!parent.client_id) return; // safety: self-serve parents have no therapist
    setSavingLog(true);
    const { error } = await supabase.from('practice_logs').insert({
      client_id: parent.client_id,
      parent_id: parent.id,
      skill_id: null,
      practiced_at: new Date().toISOString(),
      went_how: 'mixed', // AI interaction: not a clean "good"/"hard" outcome
      reflection_tags: ['in-the-moment'],
    });
    if (error) {
      console.error('[InTheMoment] save-as-log failed:', error);
      setSavingLog(false);
      return;
    }
    setSavedAsLog(true);
    setSavingLog(false);
  }

  const isAiFlow = aiMode !== 'off';

  return (
    <div className="min-h-dvh bg-gray-900 text-white flex flex-col swipeable" {...swipeHandlers}>
      {/* Full-screen crisis modal — overlaid when the safety preflight
          catches a trigger pattern. Renders outside the normal layout
          so the hotlines are above the fold and tappable. */}
      {crisisTrigger && (
        <CrisisResponseModal
          category={crisisTrigger.category}
          indirect={crisisTrigger.indirect}
          onClose={() => {
            setCrisisTrigger(null);
            setAiResult(null);
            setSituationText('');
          }}
        />
      )}
      {/* Header */}
      <header className="px-4 md:px-8 pt-safe-top pb-4 flex items-center justify-between landscape-compact-header">
        <button
          onClick={handleBack}
          className="text-gray-300 hover:text-white text-sm font-medium min-h-tap flex items-center gap-1"
        >
          ← {selected || isAiFlow ? 'Back' : 'Exit'}
        </button>
        <h1 className="text-lg font-bold text-white">In the Moment</h1>
        <div className="w-16" />
      </header>

      {/* Main content */}
      <div className="flex-1 px-4 md:px-8 pb-4 overflow-y-auto panel-scroll">
        <div className="md:max-w-3xl md:mx-auto">
          {/* ── Preset situation list ── */}
          {!selected && !isAiFlow && (
            <>
              <p className="text-gray-300 text-parent-base mb-6 text-center landscape-hide">
                What's happening right now?
              </p>
              <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {SITUATIONS.map(situation => (
                  <button
                    key={situation.id}
                    onClick={() => setSelected(situation)}
                    className="w-full bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-left rounded-2xl md:rounded-3xl px-5 py-5 md:py-8 transition min-h-tap flex items-center gap-4 touch-feedback"
                  >
                    <span className="text-4xl md:text-5xl">{situation.emoji}</span>
                    <span className="text-parent-xl md:text-2xl font-bold text-white">
                      {situation.label}
                    </span>
                  </button>
                ))}
                {/* AI coaching option */}
                <button
                  onClick={() => {
                    setAiMode('input');
                    setAiError(null);
                    setSituationText('');
                  }}
                  className="w-full bg-brand-900 hover:bg-brand-800 active:bg-brand-700 border border-brand-600 text-left rounded-2xl md:rounded-3xl px-5 py-5 md:py-8 transition min-h-tap flex items-center gap-4 touch-feedback md:col-span-2"
                >
                  <span className="text-4xl md:text-5xl">✨</span>
                  <div>
                    <span className="text-parent-xl md:text-2xl font-bold text-white block">
                      Describe what's happening
                    </span>
                    <span className="text-brand-300 text-sm mt-0.5 block">
                      Get personalized AI guidance
                    </span>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ── Preset tips ── */}
          {selected && !isAiFlow && (
            <>
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-1">
                  {selected.emoji} {selected.label}
                </p>
                <h2 className="text-parent-2xl md:text-4xl font-black text-white leading-tight">
                  Try this:
                </h2>
              </div>
              <div className="space-y-4">
                {selected.tips.map((tip, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 rounded-2xl md:rounded-3xl px-5 md:px-7 py-5 md:py-6 flex gap-4 items-start"
                  >
                    <span className="text-brand-400 font-black text-2xl md:text-3xl leading-none mt-0.5 shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-parent-lg md:text-xl text-white font-semibold leading-snug flex-1">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-6 text-center px-4">{DISCLAIMER}</p>
            </>
          )}

          {/* ── AI: text input ── */}
          {aiMode === 'input' && (
            <>
              {blockedByUsage ? (
                <div className="text-center py-8">
                  <p className="text-gray-300 text-parent-base md:text-lg mb-2">
                    You've used today's free coaching interaction.
                  </p>
                  <p className="text-gray-500 text-sm">
                    It resets at midnight UTC, or upgrade for unlimited use.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <h2 className="text-parent-2xl md:text-3xl font-black text-white leading-tight mb-1">
                      What's happening?
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Describe the situation in your own words.
                    </p>
                  </div>
                  <textarea
                    className="w-full bg-gray-800 text-white rounded-2xl px-5 py-4 text-parent-base md:text-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-gray-500 min-h-[140px]"
                    placeholder="e.g., My son just threw his backpack and slammed his door when I told him to do homework…"
                    value={situationText}
                    onChange={e => setSituationText(e.target.value)}
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-600 text-right mt-1 mb-4">
                    {situationText.length}/2000
                  </p>
                  {aiError && (
                    <div className="bg-danger-900 border border-danger-600 rounded-xl px-4 py-3 mb-4">
                      <p className="text-danger-200 text-sm">{aiError}</p>
                    </div>
                  )}
                  <button
                    onClick={handleAiSubmit}
                    disabled={!situationText.trim()}
                    className="w-full bg-brand-700 hover:bg-brand-600 active:bg-brand-800 text-white font-bold text-parent-base md:text-lg py-4 rounded-2xl transition disabled:opacity-50 min-h-tap"
                  >
                    Get guidance
                  </button>
                  <p className="text-xs text-gray-600 text-center mt-4 px-4">
                    Your description is sent to an AI for analysis. Do not include full names or
                    identifying details.
                  </p>
                </>
              )}
            </>
          )}

          {/* ── AI: streaming — steps appear one by one ── */}
          {aiMode === 'streaming' && (
            <>
              {streamedEmpathy ? (
                <p className="text-brand-300 text-parent-base md:text-lg italic mb-5">
                  "{streamedEmpathy}"
                </p>
              ) : (
                <div className="flex items-center gap-3 mb-5 py-2">
                  <span className="inline-block w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-gray-400 text-sm">Thinking…</span>
                </div>
              )}

              {streamedEmpathy && (
                <div className="mb-4">
                  <h2 className="text-parent-2xl md:text-4xl font-black text-white leading-tight">
                    Try this:
                  </h2>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {streamedSteps.map((step, i) =>
                  step ? (
                    <div
                      key={i}
                      className="bg-gray-800 rounded-2xl md:rounded-3xl px-5 md:px-7 py-5 md:py-6 flex gap-4 items-start"
                      style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
                    >
                      <span className="text-brand-400 font-black text-2xl md:text-3xl leading-none mt-0.5 shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-parent-lg md:text-2xl text-white font-semibold leading-snug flex-1">
                        {step}
                      </p>
                    </div>
                  ) : null
                )}

                {/* Next step: typewriter content with blinking cursor, or loading dots */}
                {streamedEmpathy && streamedSteps.filter(Boolean).length < 3 && (
                  <div className="bg-gray-800 rounded-2xl px-5 py-5 flex gap-4 items-start">
                    <span className="text-brand-400 font-black text-2xl leading-none mt-0.5 shrink-0">
                      {streamedSteps.filter(Boolean).length + 1}
                    </span>
                    {streamTyping ? (
                      <p className="text-parent-lg md:text-2xl text-white font-semibold leading-snug flex-1">
                        {streamTyping}
                        <span className="animate-pulse">▋</span>
                      </p>
                    ) : (
                      <div className="flex gap-1.5 items-center pt-2">
                        {[0, 150, 300].map(delay => (
                          <span
                            key={delay}
                            className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── AI: result ── */}
          {aiMode === 'result' && aiResult && (
            <>
              {aiResult.empathy && (
                <p className="text-brand-300 text-parent-base md:text-lg italic mb-5">
                  "{aiResult.empathy}"
                </p>
              )}

              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-parent-2xl md:text-4xl font-black text-white leading-tight">
                  Try this:
                </h2>
                <span className="text-xs bg-brand-900 border border-brand-700 text-brand-300 px-2.5 py-1 rounded-full font-medium shrink-0 ml-3">
                  {AI_GENERATED_LABEL}
                </span>
              </div>

              {/* Steps */}
              <div className="space-y-4 mb-6">
                {aiResult.steps.map((step, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 rounded-2xl md:rounded-3xl px-5 md:px-7 py-5 md:py-6 flex gap-4 items-start"
                  >
                    <span className="text-brand-400 font-black text-2xl md:text-3xl leading-none mt-0.5 shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-parent-lg md:text-2xl text-white font-semibold leading-snug flex-1">
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              {/* Safety note + 988/911 always visible */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 mb-4">
                <p className="text-yellow-300 text-sm font-semibold mb-3">
                  {aiResult.safetyNote || FALLBACK_SAFETY_NOTE}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:988"
                    className="flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm py-3 rounded-xl min-h-tap"
                  >
                    📞 988
                    <span className="text-xs font-normal text-brand-200">(Crisis)</span>
                  </a>
                  <a
                    href="tel:911"
                    className="flex items-center justify-center gap-2 bg-danger-600 hover:bg-danger-700 text-white font-bold text-sm py-3 rounded-xl min-h-tap"
                  >
                    🚨 911
                    <span className="text-xs font-normal text-red-200">(Emergency)</span>
                  </a>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-gray-500 text-center px-4 mb-2">{aiResult.disclaimer}</p>

              {/* Save as practice log — therapist-connected parents only.
                  Gives the therapist visibility into AI-guided moments
                  without the parent needing to switch screens. */}
              {parent?.client_id && (
                <div className="pt-2">
                  {savedAsLog ? (
                    <div className="bg-green-900 border border-green-700 rounded-xl px-4 py-3 text-center">
                      <p className="text-green-200 text-sm font-medium">
                        ✓ Saved as practice log — your therapist will see this.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleSaveAsLog}
                      disabled={savingLog}
                      className="w-full bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-600 text-white font-semibold text-sm py-3 rounded-xl transition disabled:opacity-50 min-h-tap flex items-center justify-center gap-2"
                    >
                      {savingLog ? 'Saving…' : '📝 Save this moment as a practice log'}
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setAiMode('input');
                  setAiResult(null);
                  setSavedAsLog(false);
                }}
                className="w-full py-3 text-brand-400 hover:text-brand-200 text-sm font-medium transition"
              >
                Try a different description →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Escalation panel — always at bottom (preset & AI input modes) */}
      {aiMode !== 'result' && (
        <div className="border-t border-gray-700 px-4 md:px-8 pb-safe-bottom">
          <div className="md:max-w-3xl md:mx-auto">
            {!showEscalation ? (
              <button
                onClick={() => setShowEscalation(true)}
                className="w-full py-4 text-gray-400 hover:text-white text-sm font-medium transition min-h-tap"
              >
                This isn't working / I need help →
              </button>
            ) : (
              <div className="py-4 space-y-3">
                <p className="text-sm font-semibold text-gray-300 mb-3 text-center">
                  Get more help
                </p>
                <div className="md:grid md:grid-cols-2 md:gap-3 space-y-3 md:space-y-0">
                  <a
                    href="tel:988"
                    className="flex items-center justify-center gap-3 w-full bg-brand-700 hover:bg-brand-800 text-white font-bold text-parent-base md:text-lg py-4 md:py-5 rounded-2xl min-h-tap"
                  >
                    📞 Call or Text 988
                    <span className="text-xs font-normal text-brand-200">(Crisis line)</span>
                  </a>
                  <a
                    href="tel:911"
                    className="flex items-center justify-center gap-3 w-full bg-danger-600 hover:bg-danger-700 text-white font-bold text-parent-base md:text-lg py-4 md:py-5 rounded-2xl min-h-tap"
                  >
                    🚨 Call 911
                    <span className="text-xs font-normal text-red-200">(Emergency)</span>
                  </a>
                </div>
                <button
                  onClick={() => setShowEscalation(false)}
                  className="w-full py-3 text-gray-500 text-sm hover:text-gray-300 transition"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
