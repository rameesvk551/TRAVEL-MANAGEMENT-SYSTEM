import { Request, Response, Router } from 'express';
import { AlertService } from '../modules/monitoring';

export class MonitoringController {
    constructor(private alertService: AlertService) { }
    getRules = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.alertService.getRules(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    createRule = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.status(201).json(await this.alertService.createRule(t, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    updateRule = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.alertService.updateRule(t, req.params.id, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    deleteRule = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.alertService.deleteRule(t, req.params.id)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getHistory = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.alertService.getHistory(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getReports = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.alertService.getReports(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    createReport = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.status(201).json(await this.alertService.createReport(t, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getDashboards = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.alertService.getDashboards(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    createDashboard = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.status(201).json(await this.alertService.createDashboard(t, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };

    getSystemHealth = async (_req: Request, res: Response) => {
        try { res.json(await this.alertService.getSystemHealth()); }
        catch (e: any) { res.status(500).json({ error: e.message }); }
    };

    evaluateAlerts = async (req: Request, res: Response) => {
        try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.alertService.evaluateAlertRules(t)); }
        catch (e: any) { res.status(500).json({ error: e.message }); }
    };
}

export function createMonitoringRoutes(authMiddleware: any, controller: MonitoringController): Router {
    const router = Router();
    router.get('/health', controller.getSystemHealth); // No auth for health checks
    router.use(authMiddleware);
    router.get('/rules', controller.getRules);
    router.post('/rules', controller.createRule);
    router.put('/rules/:id', controller.updateRule);
    router.delete('/rules/:id', controller.deleteRule);
    router.get('/history', controller.getHistory);
    router.get('/reports', controller.getReports);
    router.post('/reports', controller.createReport);
    router.get('/dashboards', controller.getDashboards);
    router.post('/dashboards', controller.createDashboard);
    router.post('/evaluate', controller.evaluateAlerts);
    return router;
}

