/**
 * Rate limiting middleware for ParentScript backend
 *
 * Protects against abuse of:
 * - /api/coach (AI coaching endpoint — expensive)
 * - /api/analytics (data aggregation endpoint)
 *
 * Uses in-memory store (replace with Redis in production for multi-instance)
 */

const requests = new Map(); // { ip: [timestamp, timestamp, ...] }

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

export function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  // Get existing requests for this IP
  let ipRequests = requests.get(ip) || [];

  // Remove timestamps outside the window
  ipRequests = ipRequests.filter(timestamp => now - timestamp < WINDOW_MS);

  // Check if limit exceeded
  if (ipRequests.length >= MAX_REQUESTS) {
    const oldestRequest = Math.min(...ipRequests);
    const resetTime = new Date(oldestRequest + WINDOW_MS);

    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again after ${resetTime.toISOString()}`,
      retryAfter: Math.ceil((oldestRequest + WINDOW_MS - now) / 1000),
    });
    return;
  }

  // Add current request
  ipRequests.push(now);
  requests.set(ip, ipRequests);

  // Cleanup old entries (prevent memory leak)
  if (requests.size > 10000) {
    const cutoff = now - WINDOW_MS;
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < WINDOW_MS);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }
  }

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - ipRequests.length);
  res.setHeader('X-RateLimit-Reset', new Date(now + WINDOW_MS).toISOString());

  next();
}

// Stricter rate limit for expensive AI endpoints
export function strictRateLimiter(req, res, next) {
  const STRICT_WINDOW_MS = 60 * 1000; // 1 minute
  const STRICT_MAX = 10; // 10 requests per minute

  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  let ipRequests = requests.get(`strict:${ip}`) || [];
  ipRequests = ipRequests.filter(timestamp => now - timestamp < STRICT_WINDOW_MS);

  if (ipRequests.length >= STRICT_MAX) {
    res.status(429).json({
      error: 'Too many AI requests',
      message: 'Please wait before making another coaching request',
      retryAfter: 60,
    });
    return;
  }

  ipRequests.push(now);
  requests.set(`strict:${ip}`, ipRequests);

  next();
}
