// ============================================================
// ParentScript — AI Backend API
// ============================================================
//
// Two endpoints:
//   POST /api/coach       — In-the-Moment AI coach
//   POST /api/analytics   — Practice pattern analysis + session prep
//
// SECURITY MODEL
//   - The AI provider API key lives ONLY on the server.
//   - Clients never see, send, or manage keys. (Requirement from
//     CLAUDE.md: zero-setup for users.)
//   - /api/coach accepts the situation in plain text and forwards
//     it to the AI provider. The situation text is NOT logged
//     server-side; we keep no PHI on disk.
//   - /api/analytics is gated: the caller must send a Supabase
//     access token, and the server uses the SERVICE_ROLE key to
//     query practice logs strictly for clients the caller owns
//     (therapist's own caseload, or parent's own logs only).
//
// DEPLOYMENT
//   - Local dev: `npm run dev:api` runs this server on :8787
//     alongside the Vite dev server (configured in vite.config.ts
//     to proxy /api/* → :8787).
//   - Production: deploy as a Node service on Fly/Render/Vercel
//     Node functions. Same code, same env vars.
//
// ENV VARS
//   ANTHROPIC_API_KEY    — preferred (Claude). If set, /api/coach
//                          uses Anthropic.
//   OPENAI_API_KEY       — fallback. If ANTHROPIC_API_KEY is unset
//                          and OPENAI_API_KEY is set, uses OpenAI.
//   SUPABASE_URL         — required for /api/analytics
//   SUPABASE_SERVICE_ROLE_KEY — required for /api/analytics (server-only)
//   PORT                 — defaults to 8787
// ============================================================

import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import {
  buildCoachSystemPrompt,
  buildCoachUserPrompt,
  buildSiblingCoachSystemPrompt,
  buildSiblingCoachUserPrompt,
} from './prompts.mjs';
import { buildAnalyticsSummary, buildSessionPrepSummary } from './analytics.mjs';
import {
  shieldSituation,
  getCrisisResponse,
  getScopeDisclosure,
  DEFAULT_LOCALE,
} from './safety-guard.mjs';
import { checkIpRate, checkKeyedRate, envLimit, ipRateMiddleware } from './rate_limit.mjs';

// Import shared types so backend and frontend stay in sync.
// CoachingResponse, RiskLevel, and domain models live in @parentscript/shared.
// @ts-check JSDoc can reference these for type safety in .mjs files.
/** @typedef {import('@parentscript/shared').CoachingResponse} CoachingResponse */
/** @typedef {import('@parentscript/shared').RiskLevel} RiskLevel */

// Per-surface scope disclosures. The crisis response is locale-aware
// (see safety-guard.mjs LOCALES); the scope text is per-surface.
// Per-surface scope text is hand-written and reviewed by Mira (or the
// appropriate clinical reviewer for that surface).
const SURFACE_SCOPE = Object.freeze({
  parent:
    'ParentScript is a parenting support tool, not therapy, counseling, or medical advice. It is not a crisis service. If you or your child are in crisis, call 988, 911, the Childhelp National Child Abuse Hotline (1-800-422-4453), or text HOME to 741741.',
  sibling:
    'SiblingSupport is a peer-support tool, not counseling, therapy, or medical advice. It is not a crisis service. If you or your sibling are in crisis, call or text 988, call 911, or call the Childhelp National Child Abuse Hotline (1-800-422-4453).',
});

const PORT = Number(process.env.PORT ?? 8787);

function bearerHeader(token) {
  return 'Bearer ' + token;
}

// ── Supabase helpers ─────────────────────────────────────────────
function getAnonKey() {
  // Prefer SUPABASE_ANON_KEY (server-idiomatic); fall back to the
  // VITE_ prefixed variant which Vite also sets in .env files.
  return process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? null;
}

// Verify a Supabase access token. Returns the user object or null.
async function verifyToken(accessToken) {
  const url = process.env.SUPABASE_URL;
  const anonKey = getAnonKey();
  if (!url || !anonKey) return null; // server not configured — skip auth in dev
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: bearerHeader(accessToken) } },
  });
  const { data } = await client.auth.getUser(accessToken);
  return data?.user ?? null;
}

// Extract and verify bearer token from request. Returns user or null.
async function requireAuth(req, res) {
  const auth = req.headers.authorization ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  const user = await verifyToken(m[1]);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return null;
  }
  return user;
}

const app = express();

// CORS — restrict to same origin in production; allow all in dev.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = process.env.ALLOWED_ORIGIN;
  if (!allowed || origin === allowed) {
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// HTTPS enforcement in production
app.use((req, res, next) => {
  if (process.env.ENFORCE_HTTPS === 'true') {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    if (proto !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  }
  next();
});

// Tiny request logger — never logs request bodies.
app.use((req, _res, next) => {
  console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.path);
  next();
});

// Per-IP rate limiting — protect the LLM (coach) endpoint from abuse.
// /api/coach is the expensive one (calls Anthropic), so it gets a tight cap.
// Other endpoints have looser caps. All configurable via env vars.
app.use(ipRateMiddleware('default', envLimit('PARENTSCRIPT_RATE_LIMIT_DEFAULT_PER_MIN', 60)));
app.use(
  '/api/coach',
  ipRateMiddleware('coach', envLimit('PARENTSCRIPT_RATE_LIMIT_COACH_PER_MIN', 20))
);
app.use(
  '/api/stripe',
  ipRateMiddleware('stripe', envLimit('PARENTSCRIPT_RATE_LIMIT_DEFAULT_PER_MIN', 30))
);

// Health
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    rate_limits: {
      default_per_min: envLimit('PARENTSCRIPT_RATE_LIMIT_DEFAULT_PER_MIN', 60),
      coach_per_min: envLimit('PARENTSCRIPT_RATE_LIMIT_COACH_PER_MIN', 20),
      stripe_per_min: envLimit('PARENTSCRIPT_RATE_LIMIT_DEFAULT_PER_MIN', 30),
    },
  });
});

// ── Stripe routes ────────────────────────────────────────────────
const STRIPE_PRICE_MAP = {
  solo: process.env.STRIPE_PRICE_SOLO_MONTHLY,
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY,
  clinic: process.env.STRIPE_PRICE_CLINIC_MONTHLY,
};

// POST /api/stripe/checkout — Create Stripe Checkout session
// Auth required: caller must be a signed-in therapist.
app.post('/api/stripe/checkout', express.json(), async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(503).json({ error: 'Stripe not configured.' });

  const { plan = 'solo', therapist_id, seats = 1 } = req.body || {};
  if (user.id !== therapist_id) {
    return res.status(403).json({ error: 'You can only start checkout for your own account.' });
  }
  const priceId = STRIPE_PRICE_MAP[plan];
  if (!priceId) return res.status(400).json({ error: `Unknown plan: ${plan}` });
  if (!therapist_id) return res.status(400).json({ error: 'therapist_id required.' });

  const stripe = new Stripe(stripeKey);
  const baseUrl =
    process.env.PUBLIC_BASE_URL ||
    `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      client_reference_id: therapist_id,
      line_items: [{ price: priceId, quantity: plan === 'clinic' ? seats : 1 }],
      metadata: { therapist_id, plan, seats: String(seats) },
      success_url: `${baseUrl}/app?checkout=success`,
      cancel_url: `${baseUrl}/app/pricing?checkout=cancel`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });
    return res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error('[checkout] error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

// POST /api/stripe/portal — Create Stripe Billing Portal session
// Auth required: caller must be the owner of the stripe_customer_id.
app.post('/api/stripe/portal', express.json(), async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(503).json({ error: 'Stripe not configured.' });

  const { stripe_customer_id } = req.body || {};
  if (!stripe_customer_id) return res.status(400).json({ error: 'stripe_customer_id required.' });

  // Verify this customer belongs to the requesting therapist.
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: subRow } = await admin
      .from('subscriptions')
      .select('therapist_id')
      .eq('stripe_customer_id', stripe_customer_id)
      .maybeSingle();
    if (!subRow || subRow.therapist_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized for this customer.' });
    }
  }

  const stripe = new Stripe(stripeKey);
  const baseUrl =
    process.env.PUBLIC_BASE_URL ||
    `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: `${baseUrl}/app`,
    });
    return res.json({ url: session.url });
  } catch (err) {
    console.error('[portal] error:', err.message);
    return res.status(500).json({ error: 'Failed to create portal session.' });
  }
});

// POST /api/stripe/webhook — Handle Stripe subscription events
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret)
    return res.status(503).json({ error: 'Stripe not configured.' });

  const stripe = new Stripe(stripeKey);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature.' });
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return res.status(503).json({ error: 'Service not configured.' });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Idempotency — drop duplicates
  const { error: idempotencyError } = await admin.from('webhook_events').insert({
    stripe_event_id: event.id,
    type: event.type,
  });
  if (
    idempotencyError &&
    (idempotencyError.message.includes('duplicate') || idempotencyError.code === '23505')
  ) {
    return res.json({ received: true, skipped: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = sub.items.data[0]?.price?.id;
        const plan =
          Object.entries(STRIPE_PRICE_MAP).find(([_, v]) => v === priceId)?.[0] || 'solo';
        await admin.from('subscriptions').upsert(
          {
            therapist_id: session.client_reference_id,
            stripe_customer_id: session.customer,
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            plan,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            seats: Number(session.metadata?.seats ?? 1),
          },
          { onConflict: 'stripe_customer_id' }
        );
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const priceId = sub.items.data[0]?.price?.id;
        const plan =
          Object.entries(STRIPE_PRICE_MAP).find(([_, v]) => v === priceId)?.[0] || 'solo';
        await admin
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            plan,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const { data: subRow } = await admin
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', invoice.subscription)
          .maybeSingle();
        await admin.from('invoices').insert({
          subscription_id: subRow?.id ?? null,
          stripe_invoice_id: invoice.id,
          amount_paid: event.type === 'invoice.payment_succeeded' ? invoice.amount_paid : 0,
          currency: invoice.currency,
          status: event.type === 'invoice.payment_succeeded' ? 'paid' : 'failed',
        });
        break;
      }
    }
  } catch (err) {
    console.error(`[webhook] handler error for ${event.type}:`, err.message);
    return res.status(500).json({ error: 'Event handler failed.' });
  }

  return res.json({ received: true });
});

// JSON body parser — registered AFTER the Stripe webhook so the
// global parser doesn't consume the raw stream before signature
// verification. The webhook uses express.raw() inline and needs
// the unparsed bytes for stripe.webhooks.constructEvent.
app.use(express.json({ limit: '64kb' }));

// ── /api/invite/:code ────────────────────────────────────────────
// Server-side invite validation. Returns { valid } without exposing
// the full invites table to anonymous Supabase queries.
// UUID format validated before touching the DB.
app.get('/api/invite/:code', async (req, res) => {
  const { code } = req.params;
  if (!code || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)) {
    return res.status(400).json({ valid: false });
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return res.status(503).json({ valid: false, error: 'Service not configured.' });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data } = await admin
    .from('invites')
    .select('id, client_id')
    .eq('code', code)
    .is('consumed_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!data) return res.json({ valid: false });
  return res.json({ valid: true, inviteId: data.id, clientId: data.client_id });
});

// ── /api/coach ───────────────────────────────────────────────────
// Requires a valid Supabase bearer token (parent or therapist).
// Body: { situation: string, context?: { childAge?, skillsUnlocked? } }
//
// If Accept: text/event-stream → SSE stream of labeled text chunks.
// Otherwise → JSON { steps, safetyNote, disclaimer, empathy }
app.post('/api/coach', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { situation, context, surface, locale } = req.body ?? {};
  if (typeof situation !== 'string' || situation.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty `situation`.' });
  }
  if (situation.length > 2000) {
    return res.status(400).json({ error: '`situation` too long (max 2000 chars).' });
  }

  // ── Surface validation ───────────────────────────────────────
  // 'parent' (default) and 'sibling' are the only supported surfaces.
  // Future surfaces (couple, caregiver, teacher) gate on clinical
  // review (see docs/PLATFORM_BLUEPRINT.md).
  const surfaceKey = surface === 'sibling' ? 'sibling' : 'parent';
  const surfaceScope = SURFACE_SCOPE[surfaceKey];

  // ── Locale resolution ────────────────────────────────────────
  // Per Mira's protocol, an unknown locale throws. We catch and
  // return a 400 so the client can fall back to en-US.
  let resolvedLocale = DEFAULT_LOCALE;
  if (locale && locale !== DEFAULT_LOCALE) {
    try {
      getCrisisResponse(locale);
      resolvedLocale = locale;
    } catch {
      return res.status(400).json({
        error: `Locale "${locale}" is not available. Per clinical protocol, crisis responses must be hand-reviewed before shipping. Add an entry to LOCALES in api/safety-guard.mjs after clinical sign-off.`,
      });
    }
  }

  // ── Clinical safety preflight (Mira, m.2026-06-30) ────────────
  // Runs BEFORE the LLM call so the verbatim crisis response cannot
  // be LLM-drifted and so a self-harm / abuse / IPV disclosure
  // short-circuits to a crisis-line handoff without burning an LLM
  // roundtrip. Locale-aware.
  const shield = shieldSituation(situation, resolvedLocale);
  if (!shield.safe) {
    // Anonymized structured log only — never the situation text.
    console.log(
      '[/api/coach] safety-shield triggered',
      JSON.stringify({
        category: shield.category,
        indirect: shield.indirect,
        surface: surfaceKey,
        locale: resolvedLocale,
        ts: new Date().toISOString(),
      })
    );
    // Override the surface's scope text (per-surface, not per-locale)
    // so the crisis modal shows the right disclosure for the surface.
    const response = { ...shield.response, safetyNote: surfaceScope };
    return res.json(response);
  }

  // ── Pick the right system + user prompt for the surface ───────
  let sysPrompt, userPrompt;
  if (surfaceKey === 'sibling') {
    sysPrompt = buildSiblingCoachSystemPrompt(context ?? {});
    userPrompt = buildSiblingCoachUserPrompt(situation);
  } else {
    sysPrompt = buildCoachSystemPrompt(context ?? {});
    userPrompt = buildCoachUserPrompt(situation);
  }
  const wantsStream = (req.headers.accept ?? '').includes('text/event-stream');

  if (wantsStream) {
    if (process.env.ANTHROPIC_API_KEY) {
      return streamAnthropic(sysPrompt, userPrompt, res);
    }
    if (process.env.OPENAI_API_KEY) {
      return streamViaOpenAI(sysPrompt, userPrompt, res);
    }
    res.writeHead(200, sseHeaders());
    res.write(
      'data: ' + JSON.stringify({ error: 'AI coach is not configured on this server.' }) + '\n\n'
    );
    res.end();
    return;
  }

  // Non-streaming fallback
  try {
    const result = await callLLM(sysPrompt, userPrompt);
    if (!result) {
      return res.status(503).json({ error: 'AI coach is not configured on this server.' });
    }
    return res.json(result);
  } catch (err) {
    console.error('[/api/coach] LLM error:', err?.message ?? err);
    return res.status(502).json({ error: 'AI coach request failed.' });
  }
});

// ── /api/analytics ──────────────────────────────────────────────
// Body: { type: 'practicePatterns' | 'sessionPrep', clientId?, therapistId? }
// Auth: bearer token (Supabase access token) validated server-side.
app.post('/api/analytics', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const userId = user.id;

  const { type, clientId, therapistId } = req.body ?? {};
  if (type !== 'practicePatterns' && type !== 'sessionPrep') {
    return res.status(400).json({ error: '`type` must be "practicePatterns" or "sessionPrep".' });
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return res.status(503).json({ error: 'Service not configured.' });
  }

  // Service-role client for data access (bypasses RLS — scope
  // is verified explicitly below).
  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  // Resolve caller role.
  const [{ data: tRow }, { data: pRow }] = await Promise.all([
    adminClient.from('therapists').select('id').eq('id', userId).maybeSingle(),
    adminClient.from('parents').select('id, client_id').eq('id', userId).maybeSingle(),
  ]);
  const isTherapist = Boolean(tRow);
  const isParent = Boolean(pRow);
  if (!isTherapist && !isParent) {
    return res.status(403).json({ error: 'No role on this account.' });
  }

  try {
    if (type === 'practicePatterns') {
      if (!clientId)
        return res.status(400).json({ error: '`clientId` required for practicePatterns.' });
      if (isTherapist) {
        const { data: client } = await adminClient
          .from('clients')
          .select('id, therapist_id')
          .eq('id', clientId)
          .maybeSingle();
        if (!client || client.therapist_id !== userId) {
          return res.status(403).json({ error: 'Not your client.' });
        }
      } else {
        if (!pRow || pRow.client_id !== clientId) {
          return res.status(403).json({ error: 'Not your client.' });
        }
      }
      const summary = await buildAnalyticsSummary(adminClient, clientId);
      return res.json(summary);
    }

    if (type === 'sessionPrep') {
      if (!isTherapist) return res.status(403).json({ error: 'Therapist only.' });
      const summary = await buildSessionPrepSummary(adminClient, userId, therapistId);
      return res.json(summary);
    }
  } catch (err) {
    console.error('[/api/analytics] error:', err?.message ?? err);
    return res.status(500).json({ error: 'Analytics failed.' });
  }
});

// ── SSE helpers ──────────────────────────────────────────────────
function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  };
}

function sseEvent(data) {
  return 'data: ' + JSON.stringify(data) + '\n\n';
}

// Parse one labeled output line from the LLM and emit an SSE event.
// Returns an object representation (used by the non-streaming path).
function parseLabeledLine(line) {
  const colonIdx = line.indexOf(': ');
  if (colonIdx < 0) return null;
  const label = line.slice(0, colonIdx).trim();
  const text = line.slice(colonIdx + 2).trim();
  if (!text) return null;
  switch (label) {
    case 'EMPATHY':
      return { type: 'empathy', text };
    case 'STEP1':
      return { type: 'step', index: 0, text };
    case 'STEP2':
      return { type: 'step', index: 1, text };
    case 'STEP3':
      return { type: 'step', index: 2, text };
    case 'SAFETY':
      return { type: 'safety', text };
    case 'DISCLAIMER':
      return { type: 'disclaimer', text };
    default:
      return null;
  }
}

// ── Anthropic streaming ──────────────────────────────────────────
// Streams labeled-line output from Claude as SSE events, one per
// completed line, so the client can render steps as they arrive.
async function streamAnthropic(sysPrompt, userPrompt, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-latest';

  res.writeHead(200, sseHeaders());

  let anthropicRes;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        stream: true,
        system: sysPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
  } catch (err) {
    console.error('[stream] fetch error:', err?.message);
    res.write(
      'data: ' +
        JSON.stringify({ error: 'Could not reach AI service. Check your connection.' }) +
        '\n\n'
    );
    res.end();
    return;
  }

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    console.error('[stream] Anthropic error:', anthropicRes.status, errText.slice(0, 200));
    res.write('data: ' + JSON.stringify({ error: 'AI coach request failed.' }) + '\n\n');
    res.end();
    return;
  }

  const reader = anthropicRes.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const sseLines = sseBuffer.split('\n');
      sseBuffer = sseLines.pop() ?? '';

      for (const sseLine of sseLines) {
        if (!sseLine.startsWith('data: ')) continue;
        const raw = sseLine.slice(6).trim();
        if (raw === '[DONE]') continue;

        let evt;
        try {
          evt = JSON.parse(raw);
        } catch {
          continue;
        }

        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          res.write('data: ' + JSON.stringify(evt.delta.text) + '\n\n');
        }
      }
    }

    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('[stream] read error:', err?.message);
    res.write('data: [DONE]\n\n');
  } finally {
    res.end();
  }
}

// ── OpenAI SSE shim ──────────────────────────────────────────────
// OpenAI doesn't stream — emit the full text in one chunk then [DONE].
async function streamViaOpenAI(sysPrompt, userPrompt, res) {
  res.writeHead(200, sseHeaders());
  try {
    const text = await callOpenAIRaw(sysPrompt, userPrompt);
    res.write('data: ' + JSON.stringify(text) + '\n\n');
    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('[stream/openai] error:', err?.message);
    res.write('data: ' + JSON.stringify({ error: 'AI coach request failed.' }) + '\n\n');
  } finally {
    res.end();
  }
}

// ── LLM dispatch ─────────────────────────────────────────────────
// Prefers Anthropic (Claude) — calibrated prompt assumes Claude's
// instruction-following. Falls back to OpenAI if no Anthropic key.
async function callLLM(systemPrompt, userPrompt) {
  if (process.env.ANTHROPIC_API_KEY) {
    return callAnthropic(systemPrompt, userPrompt);
  }
  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(systemPrompt, userPrompt);
  }
  return null;
}

async function callAnthropic(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-latest';
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error('Anthropic ' + r.status + ': ' + text.slice(0, 200));
  }
  const json = await r.json();
  const text = json?.content?.[0]?.text ?? '';
  return parseCoachText(text);
}

// Returns raw text from OpenAI (used by both streaming and non-streaming paths).
async function callOpenAIRaw(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: bearerHeader(apiKey),
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error('OpenAI ' + r.status + ': ' + text.slice(0, 200));
  }
  const json = await r.json();
  return json?.choices?.[0]?.message?.content ?? '';
}

async function callOpenAI(systemPrompt, userPrompt) {
  const text = await callOpenAIRaw(systemPrompt, userPrompt);
  return parseCoachText(text);
}

// Parse the labeled-line format the LLM now outputs.
// Returns a CoachingResponse matching @parentscript/shared.
/** @returns {CoachingResponse} */
function parseCoachText(text) {
  if (!text) throw new Error('Empty LLM response.');
  const lines = text.trim().split('\n');
  let steps = [];
  let safetyNote = '';
  let empathyText = '';

  for (const line of lines) {
    const evt = parseLabeledLine(line);
    if (!evt) continue;
    switch (evt.type) {
      case 'empathy':
        empathyText = evt.text;
        break;
      case 'step':
        steps[evt.index] = evt.text;
        break;
      case 'safety':
        safetyNote = evt.text;
        break;
      // Note: DISCLAIMER label is ignored; we don't include it in the response anymore
    }
  }

  const validSteps = steps.filter(Boolean);
  return {
    risk_level: 'low', // default; can be enhanced later with LLM-based risk assessment
    empathy: empathyText || "You're doing your best in a tough moment.",
    steps:
      validSteps.length > 0
        ? validSteps
        : ['Take a slow breath. You can pause this and try again in a moment.'],
    safety_note:
      safetyNote ||
      'If your child is in immediate danger of hurting themselves or others, call 911.',
    crisis_response: false,
  };
}

const DEFAULT_DISCLAIMER =
  'This is general guidance from AI, not medical or therapeutic advice. Your therapist knows your child best. For emergencies, call 911; for crisis support, call or text 988.';

// ── Boot ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('[parentscript-api] listening on :' + PORT);
  console.log('  anthropic: ' + (process.env.ANTHROPIC_API_KEY ? 'configured' : 'not set'));
  console.log('  openai:    ' + (process.env.OPENAI_API_KEY ? 'configured' : 'not set'));
  console.log('  supabase:  ' + (process.env.SUPABASE_URL ? 'configured' : 'not set'));
});
