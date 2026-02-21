// presentation/middleware/whatsapp/rateLimiting.ts

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function createRateLimiter(config: any) {
    const { windowMs, maxRequests, keyGenerator = (req: any) => req.ip || 'unknown', skipFailedRequests = false, handler } = config;
    return (req: any, res: any, next: any) => {
        const key = keyGenerator(req);
        const now = Date.now();
        let record = rateLimitStore.get(key);
        if (!record || now >= record.resetAt) {
            record = { count: 0, resetAt: now + windowMs };
            rateLimitStore.set(key, record);
        }
        record.count++;
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));
        if (record.count > maxRequests) {
            if (handler) { handler(req, res); return; }
            res.status(429).json({ error: 'Too many requests', retryAfter: Math.ceil((record.resetAt - now) / 1000) });
            return;
        }
        if (skipFailedRequests) {
            const originalEnd = res.end.bind(res);
            res.end = function (...args: any[]) {
                if (res.statusCode >= 400) { record!.count--; }
                return originalEnd(...args);
            };
        }
        next();
    };
}

export const webhookRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, maxRequests: 1000,
    keyGenerator: (req: any) => req.headers['x-forwarded-for'] || req.ip || 'webhook',
});

export const sendMessageRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, maxRequests: 60,
    keyGenerator: (req: any) => `send:${req.context?.tenantId || 'unknown'}`,
    handler: (req: any, res: any) => {
        res.status(429).json({ error: 'Message rate limit exceeded', message: 'You have exceeded the maximum message sending rate. Please try again later.' });
    },
});

export const bulkOperationRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, maxRequests: 10,
    keyGenerator: (req: any) => `bulk:${req.context?.tenantId || 'unknown'}`,
});

export const apiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, maxRequests: 100,
    keyGenerator: (req: any) => `api:${req.context?.userId || req.ip || 'unknown'}`,
    skipFailedRequests: true,
});

export function cleanupRateLimitStore() {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now >= record.resetAt) { rateLimitStore.delete(key); }
    }
}

setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
