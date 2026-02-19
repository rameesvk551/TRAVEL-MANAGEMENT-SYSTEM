import { Request, Response, NextFunction } from 'express';
import { RATE_LIMIT } from '../config/constants.js';

const hits = new Map<string, number>();
const resetTime = new Map<string, number>();

/**
 * Simple in-memory rate limiter (replacement for express-rate-limit to avoid new dependency).
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    if (!resetTime.has(ip) || now > resetTime.get(ip)!) {
        resetTime.set(ip, now + RATE_LIMIT.WINDOW_MS);
        hits.set(ip, 0);
    }

    const currentHits = hits.get(ip)! + 1;
    hits.set(ip, currentHits);

    if (currentHits > RATE_LIMIT.MAX_REQUESTS) {
        res.status(429).json({
            status: 'error',
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later.',
        });
        return;
    }

    next();
};
