// api/health.mjs — Health check for the parentscript backend
//
// Mirrors apps/backend/server.mjs's /api/health endpoint.
// Also exposes the configured rate limit values for ops visibility.

import { envLimit } from './lib/rate_limit.mjs';

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: 'parentscript-api',
    rate_limits: {
      default_per_min: envLimit('PARENTSCRIPT_RATE_LIMIT_DEFAULT_PER_MIN', 60),
      coach_per_min: envLimit('PARENTSCRIPT_RATE_LIMIT_COACH_PER_MIN', 20),
      stripe_per_min: envLimit('PARENTSCRIPT_RATE_LIMIT_DEFAULT_PER_MIN', 30),
    },
  });
}
