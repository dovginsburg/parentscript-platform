// ============================================================
// AI Prompts — Client-side type contract
// ============================================================
//
// The actual prompt construction lives server-side in
// /api/prompts.mjs so the system prompt can never leak to the
// client (and so a curious user with DevTools can't reverse-
// engineer the guardrails). This file only exposes:
//
//   - the response TypeScript shape (CoachResponse)
//   - the request shape (CoachRequest)
//   - the small set of error codes a caller might see
//   - one safe label the UI can render verbatim
//
// IMPORTANT: do NOT put the system prompt text here. Server-only.
//
// Anchor for the curriculum:
//   PCIT (Parent-Child Interaction Therapy) — Eyberg & Funderburk
//   BPT  (Behavioral Parent Training) — standard protocol
//   Both are the evidence base the L1–L4 skill curriculum in this
//   app is built on (see docs/BUILD_PLAN.md §4).
// ============================================================

// ── Request shape the frontend POSTs to /api/coach ─────────────
export interface CoachContext {
  /** Child age in years (rounded). Optional — omit if unknown. */
  childAge?: number;
  /** Slugs of skills the parent has unlocked. Calibrates the model
   *  to use only tools the parent has actually been taught. */
  skillsUnlocked?: string[];
  /** Sibling age in years (rounded). Only used for `surface: 'sibling'`. */
  siblingAge?: number;
  /** User's own age in years (rounded). Only used for `surface: 'sibling'`. */
  userAge?: number;
}

/** Which surface is asking. Default 'parent'. See docs/PLATFORM_BLUEPRINT.md. */
export type CoachSurface = 'parent' | 'sibling';

export interface CoachRequest {
  situation: string;
  context?: CoachContext;
  surface?: CoachSurface;
  /** Locale code for the crisis response (default 'en-US').
   *  Per Mira's protocol, unreviewed locales return 400 from /api/coach. */
  locale?: string;
}

// ── Response shape /api/coach returns ──────────────────────────
// 3 steps max — see PHASE2_AI_FEATURES.md §Feature 1.
export interface CoachResponse {
  steps: string[];
  safetyNote: string;
  disclaimer: string;
  empathy?: string;
}

// ── Streaming event types ───────────────────────────────────────
export type CoachStreamEvent =
  | { type: 'empathy'; text: string }
  | { type: 'step'; index: number; text: string }
  | { type: 'safety'; text: string }
  | { type: 'disclaimer'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

// ── Errors ─────────────────────────────────────────────────────
// Mirrors what /api/coach returns from express — kept here so
// the React layer can switch on the same code.
export type CoachErrorCode =
  | 'missing_situation'
  | 'situation_too_long'
  | 'not_configured' // server has no AI key
  | 'upstream_failure' // LLM provider error
  | 'network_error' // fetch threw
  | 'unknown';

export interface CoachError {
  error: string;
  code: CoachErrorCode;
}

// ── Safe UI labels ─────────────────────────────────────────────
// The server controls the disclaimer wording. The client just
// surfaces it. We still export a fallback so the UI never blanks
// out before the network round-trip resolves.
export const FALLBACK_DISCLAIMER =
  'This is AI-generated guidance, not medical or therapeutic advice. Your therapist knows your child best. If you are in crisis, call or text 988. If anyone is in immediate danger, call 911.';

export const FALLBACK_SAFETY_NOTE =
  'If your child is in immediate danger of hurting themselves or others, call 911. For crisis support, call or text 988.';

// ── "AI-generated" badge label ─────────────────────────────────
// Used in the UI so parents and therapists never forget they are
// reading machine output (PHASE2_AI_FEATURES.md Core Principle:
// "Be transparent").
export const AI_GENERATED_LABEL = 'AI-generated';

// ── Streaming client helper ────────────────────────────────────
// Calls /api/coach with Accept: text/event-stream and delivers
// structured events via the onEvent callback as they arrive.
// Accepts an AbortSignal so callers can cancel mid-stream.
// `surface` (default 'parent') selects the system prompt variant.
// `locale` (default 'en-US') selects the human-reviewed crisis text.
export async function streamCoachResponse(
  situation: string,
  context: CoachContext | undefined,
  onEvent: (event: CoachStreamEvent) => void,
  signal?: AbortSignal,
  surface: CoachSurface = 'parent',
  locale: string = 'en-US'
): Promise<void> {
  const trimmed = (situation ?? '').trim();
  if (!trimmed) {
    onEvent({ type: 'error', message: 'Please describe what is happening.' });
    return;
  }

  let res: Response;
  try {
    res = await fetch('/api/coach', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({ situation: trimmed, context, surface, locale }),
      signal,
    });
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') return;
    onEvent({ type: 'error', message: 'Network error — check your connection and try again.' });
    return;
  }

  if (!res.ok) {
    onEvent({ type: 'error', message: 'Coach request failed. Please try again.' });
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        let evt: CoachStreamEvent;
        try {
          evt = JSON.parse(line.slice(6)) as CoachStreamEvent;
        } catch {
          continue;
        }
        onEvent(evt);
      }
    }
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') return;
    onEvent({ type: 'error', message: 'Connection lost. Please try again.' });
  }
}

// ── Tiny client helper ─────────────────────────────────────────
// POSTs to /api/coach (Vite dev proxy → :8787 in dev, same-origin
// in prod). Validates response shape defensively so the UI never
// crashes if the model returns an unexpected field.
// `surface` (default 'parent') and `locale` (default 'en-US') are
// forwarded to the server.
export async function fetchCoachResponse(
  situation: string,
  context?: CoachContext,
  surface: CoachSurface = 'parent',
  locale: string = 'en-US'
): Promise<CoachResponse> {
  const trimmed = (situation ?? '').trim();
  if (!trimmed)
    throw {
      code: 'missing_situation',
      error: 'Please describe what is happening.',
    } satisfies CoachError;
  if (trimmed.length > 2000)
    throw {
      code: 'situation_too_long',
      error: 'Please shorten to under 2000 characters.',
    } satisfies CoachError;

  let res: Response;
  try {
    res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ situation: trimmed, context, surface, locale } satisfies CoachRequest),
    });
  } catch {
    throw {
      code: 'network_error',
      error: 'Network error — check your connection and try again.',
    } satisfies CoachError;
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw {
      code: 'unknown',
      error: 'Unexpected response from the coach service.',
    } satisfies CoachError;
  }

  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'error' in body && typeof (body as any).error === 'string'
        ? (body as any).error
        : 'Coach request failed.';
    let code: CoachErrorCode = 'unknown';
    if (res.status === 503) code = 'not_configured';
    else if (res.status === 502) code = 'upstream_failure';
    throw { code, error: msg } satisfies CoachError;
  }

  const obj = body as Partial<CoachResponse> | null;
  const steps = Array.isArray(obj?.steps) ? obj!.steps.slice(0, 3).map(String) : [];
  if (steps.length === 0) {
    throw {
      code: 'upstream_failure',
      error: 'Coach returned no steps. Try again.',
    } satisfies CoachError;
  }
  return {
    steps,
    safetyNote: typeof obj?.safetyNote === 'string' ? obj.safetyNote : FALLBACK_SAFETY_NOTE,
    disclaimer: typeof obj?.disclaimer === 'string' ? obj.disclaimer : FALLBACK_DISCLAIMER,
  };
}
