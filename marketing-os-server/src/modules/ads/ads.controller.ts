import { Request, Response, Router } from 'express';
import { AdsService } from '../modules/ads.js';

export class AdsController {
    constructor(private adsService: AdsService) { }
    getDashboard = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.adsService.getDashboard(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getCampaigns = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.adsService.getCampaigns(t, req.query.platform as string)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    syncCampaign = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.status(201).json(await this.adsService.syncCampaign(t, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getABTests = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.adsService.getABTests(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    createABTest = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.status(201).json(await this.adsService.createABTest(t, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    recordABResult = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.adsService.recordABResult(t, req.params.id, req.body.variant, req.body.isConversion)); } catch (e: any) { res.status(500).json({ error: e.message }); } };

    getBudgetAlerts = async (req: Request, res: Response) => {
        try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.adsService.getBudgetAlerts(t)); }
        catch (e: any) { res.status(500).json({ error: e.message }); }
    };

    getCreativePerformance = async (req: Request, res: Response) => {
        try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.adsService.getCreativePerformance(t)); }
        catch (e: any) { res.status(500).json({ error: e.message }); }
    };
}

export function createAdsRoutes(authMiddleware: any, controller: AdsController): Router {
    const router = Router();
    router.use(authMiddleware);
    router.get('/dashboard', controller.getDashboard);
    router.get('/campaigns', controller.getCampaigns);
    router.post('/campaigns/sync', controller.syncCampaign);
    router.get('/ab-tests', controller.getABTests);
    router.post('/ab-tests', controller.createABTest);
    router.post('/ab-tests/:id/result', controller.recordABResult);
    router.get('/budget-alerts', controller.getBudgetAlerts);
    router.get('/creative-performance', controller.getCreativePerformance);
    return router;
}

