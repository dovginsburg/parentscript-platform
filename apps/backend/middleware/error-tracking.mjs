/**
 * Error tracking and monitoring middleware
 *
 * In production, integrates with Sentry for error reporting.
 * In development, logs errors to console.
 */

let Sentry = null;

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  try {
    const SentryNode = await import('@sentry/node');
    Sentry = SentryNode;

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
      beforeSend(event, hint) {
        // Don't send errors for known client issues
        if (event.exception) {
          const error = hint.originalException;
          if (error && error.message) {
            // Skip client-side validation errors
            if (error.message.includes('validation')) return null;
            // Skip expected errors
            if (error.message.includes('Unauthorized')) return null;
          }
        }
        return event;
      },
    });

    console.log('✓ Sentry error tracking initialized');
  } catch (error) {
    console.warn('⚠️  Failed to initialize Sentry:', error.message);
  }
}

export function errorHandler(err, req, res, next) {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Report to Sentry if available
  if (Sentry) {
    Sentry.captureException(err, {
      tags: {
        endpoint: req.path,
        method: req.method,
      },
      user: {
        ip_address: req.ip,
      },
      extra: {
        body: req.body,
        query: req.query,
      },
    });
  }

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Log slow requests
    if (duration > 1000) {
      console.warn('Slow request:', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        status: res.statusCode,
      });
    }

    // Log errors
    if (res.statusCode >= 400) {
      console.error('Request error:', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        ip: req.ip,
      });
    }
  });

  next();
}

export function healthCheck(req, res) {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
  });
}
