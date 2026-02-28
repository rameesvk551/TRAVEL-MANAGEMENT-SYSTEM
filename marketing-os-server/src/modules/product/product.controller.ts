import { Request, Response, Router } from 'express';
import { ProductAnalyticsService } from '../modules/product.js';

export class ProductController {
    constructor(private productService: ProductAnalyticsService) { }
    getDashboard = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; const s = new Date(req.query.start as string || new Date(Date.now() - 30 * 86400000).toISOString()); const e = new Date(req.query.end as string || new Date().toISOString()); res.json(await this.productService.getDashboard(t, s, e)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    trackUsage = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.status(201).json(await this.productService.trackFeatureUsage(t, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getFeatureAdoption = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; const s = new Date(req.query.start as string || new Date(Date.now() - 30 * 86400000).toISOString()); const e = new Date(req.query.end as string || new Date().toISOString()); res.json(await this.productService.getFeatureAdoption(t, s, e)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getCohorts = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.productService.getCohorts(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };

    getEngagementScores = async (req: Request, res: Response) => {
        try {
            const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const s = new Date(req.query.start as string || new Date(Date.now() - 30 * 86400000).toISOString());
            const e = new Date(req.query.end as string || new Date().toISOString());
            res.json(await this.productService.getEngagementScores(t, s, e));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };

    startSession = async (req: Request, res: Response) => {
        try {
            const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            res.status(201).json(await this.productService.startSession(t, req.body));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };

    endSession = async (req: Request, res: Response) => {
        try {
            const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const { sessionId, pagesViewed } = req.body;
            await this.productService.endSession(t, sessionId, pagesViewed || 0);
            res.json({ success: true });
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };

    getRetentionCohorts = async (req: Request, res: Response) => {
        try {
            const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const weeks = parseInt(req.query.weeks as string) || 8;
            res.json(await this.productService.buildWeeklyRetentionCohorts(t, weeks));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
}

export function createProductRoutes(authMiddleware: any, controller: ProductController): Router {
    const router = Router();
    router.use(authMiddleware);

    router.get('/dashboard', controller.getDashboard);
    router.post('/track', controller.trackUsage);
    router.get('/features', controller.getFeatureAdoption);
    router.get('/cohorts', controller.getCohorts);
    router.get('/engagement', controller.getEngagementScores);
    router.post('/sessions/start', controller.startSession);
    router.post('/sessions/end', controller.endSession);
    router.get('/retention', controller.getRetentionCohorts);

    return router;
}

