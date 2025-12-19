import { Router } from 'express';

export function createHealthRoutes(): Router {
    const router = Router();

    router.get('/health', (_req, res) => {
        res.json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            },
        });
    });

    return router;
}
