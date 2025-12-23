// presentation/middleware/whatsapp/rateLimiting.ts
// Rate limiting for WhatsApp operations

import { Request, Response, NextFunction } from 'express';

// In-memory store (should use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  handler?: (req: Request, res: Response) => void;
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    skipFailedRequests = false,
    handler,
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now >= record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, record);
    }

    record.count++;

    // Set headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > maxRequests) {
      if (handler) {
        handler(req, res);
        return;
      }

      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      });
      return;
    }

    // Track for skip on failure
    if (skipFailedRequests) {
      const originalEnd = res.end.bind(res);
      res.end = function(...args: any[]) {
        if (res.statusCode >= 400) {
          record!.count--;
        }
        return originalEnd(...args);
      };
    }

    next();
  };
}

/**
 * Rate limiter for webhook endpoints
 * Higher limits as these are provider callbacks
 */
export const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000,   // 1000 per minute (high for webhook bursts)
  keyGenerator: (req) => {
    // Use provider IP or signature as key
    return req.headers['x-forwarded-for'] as string || req.ip || 'webhook';
  },
});

/**
 * Rate limiter for sending messages
 * Per-tenant limits to prevent abuse
 */
export const sendMessageRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,     // 60 messages per minute per tenant
  keyGenerator: (req) => {
    const tenantId = req.context?.tenantId || 'unknown';
    return `send:${tenantId}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Message rate limit exceeded',
      message: 'You have exceeded the maximum message sending rate. Please try again later.',
    });
  },
});

/**
 * Rate limiter for bulk operations
 * Very strict limits
 */
export const bulkOperationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,          // 10 bulk operations per hour
  keyGenerator: (req) => {
    const tenantId = req.context?.tenantId || 'unknown';
    return `bulk:${tenantId}`;
  },
});

/**
 * Rate limiter for API endpoints
 * Standard per-user limits
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,    // 100 requests per minute per user
  keyGenerator: (req) => {
    const userId = req.context?.userId || req.ip || 'unknown';
    return `api:${userId}`;
  },
  skipFailedRequests: true, // Don't count failed requests
});

/**
 * Cleanup old rate limit records (run periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now >= record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
