import { Request, Response, Router } from 'express';
import { CRMService } from './crm.service.js';

export class CRMController {
    constructor(private crmService: CRMService) { }
    getDashboard = async (req: Request, res: Response) => {
        try {
            const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            res.json(await this.crmService.getDashboard(t));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    getLeads = async (req: Request, res: Response) => {
        try {
            const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            res.json(await this.crmService.getLeads(t, req.query as any));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    createLead = async (req: Request, res: Response) => {
        try {
            const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            res.status(201).json(await this.crmService.createLead(t, req.body));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    bulkCreateLeads = async (req: Request, res: Response) => {
        try {
            const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            res.status(201).json(await this.crmService.bulkCreateLeads(t, req.body.leads));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    updateLead = async (req: Request, res: Response) => {
        try {
            const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            res.json(await this.crmService.updateLead(t, req.params.id, req.body));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    scoreLeads = async (req: Request, res: Response) => {
        try {
            const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            res.json(await this.crmService.scoreLeads(t));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    getStages = async (req: Request, res: Response) => {
        try {
            const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            res.json(await this.crmService.getPipelineStages(t));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    createStage = async (req: Request, res: Response) => {
        try {
            const t = (req as any).tenantId || 'default';
            res.status(201).json(await this.crmService.createPipelineStage(t, req.body));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    getDeals = async (req: Request, res: Response) => {
        try {
            const t = (req as any).tenantId || 'default';
            res.json(await this.crmService.getDeals(t, req.query.stageId as string));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    createDeal = async (req: Request, res: Response) => {
        try {
            const t = (req as any).tenantId || 'default';
            res.status(201).json(await this.crmService.createDeal(t, req.body));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    moveDeal = async (req: Request, res: Response) => {
        try {
            const t = (req as any).tenantId || 'default';
            res.json(await this.crmService.moveDeal(t, req.params.id, req.body.stageId));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    getTasks = async (req: Request, res: Response) => {
        try {
            const t = (req as any).tenantId || 'default';
            res.json(await this.crmService.getTasks(t, req.query as any));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    createTask = async (req: Request, res: Response) => {
        try {
            const t = (req as any).tenantId || 'default';
            res.status(201).json(await this.crmService.createTask(t, req.body));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
    getActivities = async (req: Request, res: Response) => {
        try {
            const t = (req as any).tenantId || 'default';
            res.json(await this.crmService.getActivities(t, req.params.leadId));
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    };
}

export function createCRMRoutes(authMiddleware: any, controller: CRMController): Router {
    const router = Router();
    router.use(authMiddleware);
    router.get('/dashboard', controller.getDashboard);
    router.get('/leads', controller.getLeads);
    router.post('/leads', controller.createLead);
    router.post('/leads/bulk', controller.bulkCreateLeads);
    router.put('/leads/:id', controller.updateLead);
    router.post('/leads/score', controller.scoreLeads);
    router.get('/pipeline/stages', controller.getStages);
    router.post('/pipeline/stages', controller.createStage);
    router.get('/deals', controller.getDeals);
    router.post('/deals', controller.createDeal);
    router.put('/deals/:id/move', controller.moveDeal);
    router.get('/tasks', controller.getTasks);
    router.post('/tasks', controller.createTask);
    router.get('/activities/:leadId', controller.getActivities);
    return router;
}
