import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import apiRouter from './routes/index.js';
import { logger } from './config/logger.js';

/**
 * Creates and configures the Express application.
 * Separated from server startup for testability.
 */
export function createApp() {
    const app = express();

    // ── Global Middleware ──
    app.use(cors({ origin: '*' }));
    app.use(
        express.json({
            limit: '10mb',
            verify: (req: any, _res, buffer) => {
                // Store raw body for webhook signature verification (Razorpay, WhatsApp, etc.)
                req.rawBody = Buffer.from(buffer);
            },
        }),
    );
    app.use(express.urlencoded({ extended: true }));

    // ── Health Check ──
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // ── All module routes under /api ──
    app.use('/api/v1', apiRouter);

    // ── Error Handling (MUST be last) ──
    app.use(errorMiddleware);

    // ── 404 Fallback ──
    app.use((_req, res) => {
        res.status(404).json({
            status: 'error',
            code: 'NOT_FOUND',
            message: 'Route not found',
        });
    });

    logger.info('Application configured successfully');

    return app;
}
