// api/coach.mjs — In-the-Moment AI coach (Vercel serverless function)
//
// Wraps the Express handler from apps/backend/server.mjs.
// Exports a default handler compatible with Vercel's /api/* routing.

// Imports from sibling lib/ folder
import { checkIpRate, envLimit, ipRateMiddleware } from './lib/rate_limit.mjs';

// Re-export the rate limiter (Vercel will tree-shake unused)
export { checkIpRate, envLimit, ipRateMiddleware };

// HTTP handler that runs on every /api/coach request.
export default async function handler(req, res) {
  // Per-IP rate limit (default: 20 req/min)
  const limit = envLimit('PARENTSCRIPT_RATE_LIMIT_COACH_PER_MIN', 20);
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkIpRate('coach', ip, limit, 60)) {
    res.status(429).json({
      error: `too many coach requests from this IP — try again in 60s`,
      code: 'rate_limited',
      scope: 'coach',
    });
    return;
  }

  // TODO: forward to Anthropic API
  // (This is a stub — full impl is in apps/backend/server.mjs)
  res.status(501).json({
    error: 'coach endpoint not yet implemented in this Vercel function',
    note: 'use the Railway-deployed backend until this is wired',
  });
}
