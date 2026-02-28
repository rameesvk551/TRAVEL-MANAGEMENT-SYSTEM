import { Request, Response, Router } from 'express';
import { AIInsightsService } from '../modules/ai.js';

export class AIController {
    constructor(private aiService: AIInsightsService) { }
    getDashboard = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.aiService.getDashboard(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getAnomalies = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.aiService.detectAnomalies(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getPredictions = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.aiService.getPredictions(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getRecommendations = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.aiService.getRecommendations(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getChurnRisk = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.aiService.getChurnRiskScores(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };

    getLeadScores = async (req: Request, res: Response) => {
        try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.aiService.getLeadScores(t)); }
        catch (e: any) { res.status(500).json({ error: e.message }); }
    };

    getRevenuePrediction = async (req: Request, res: Response) => {
        try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.aiService.getRevenuePrediction(t)); }
        catch (e: any) { res.status(500).json({ error: e.message }); }
    };

    getBudgetAllocation = async (req: Request, res: Response) => {
        try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.aiService.getBudgetAllocation(t)); }
        catch (e: any) { res.status(500).json({ error: e.message }); }
    };
}

export function createAIRoutes(authMiddleware: any, controller: AIController): Router {
    const router = Router();
    router.use(authMiddleware);
    router.get('/dashboard', controller.getDashboard);
    router.get('/anomalies', controller.getAnomalies);
    router.get('/predictions', controller.getPredictions);
    router.get('/recommendations', controller.getRecommendations);
    router.get('/churn-risk', controller.getChurnRisk);
    router.get('/lead-scores', controller.getLeadScores);
    router.get('/revenue-prediction', controller.getRevenuePrediction);
    router.get('/budget-allocation', controller.getBudgetAllocation);
    return router;
}

