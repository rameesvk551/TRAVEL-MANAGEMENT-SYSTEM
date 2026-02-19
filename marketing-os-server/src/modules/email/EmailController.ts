import { Request, Response, Router } from 'express';
import { EmailService } from './EmailService.js';
import { EmailSettingsService } from './EmailSettingsService.js';
import { EmailTrackingController } from './EmailTrackingController.js';

export class EmailController {
    constructor(private emailService: EmailService, private emailSettingsService: EmailSettingsService) { }
    getDashboard = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; const s = new Date(req.query.start as string || new Date(Date.now() - 30 * 86400000).toISOString()); const e = new Date(req.query.end as string || new Date().toISOString()); res.json(await this.emailService.getDashboard(t, s, e)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    getCampaigns = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.emailService.getCampaigns(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    createCampaign = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.status(201).json(await this.emailService.createCampaign(t, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    sendCampaign = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.emailService.sendCampaign(t, req.params.id)); } catch (e: any) { res.status(500).json({ error: e.message }); } };

    getTemplates = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.emailService.getTemplates(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    createTemplate = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.status(201).json(await this.emailService.createTemplate(t, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    updateTemplate = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.emailService.updateTemplate(t, req.params.id, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    deleteTemplate = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.emailService.deleteTemplate(t, req.params.id)); } catch (e: any) { res.status(500).json({ error: e.message }); } };

    getDripSequences = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.emailService.getDripSequences(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    createDripSequence = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.status(201).json(await this.emailService.createDripSequence(t, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };

    // Settings
    getSettings = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.emailSettingsService.getSettings(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    updateSettings = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.emailSettingsService.saveSettings(t, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
    testConnection = async (req: Request, res: Response) => { try { const t = (req.headers['x-tenant-id'] as string) || 'default-tenant-id'; res.json(await this.emailSettingsService.testConnection(t)); } catch (e: any) { res.status(500).json({ error: e.message }); } };
}

export function createEmailRoutes(authMiddleware: any, controller: EmailController, trackingController: EmailTrackingController): Router {
    const router = Router();

    // Public Tracking Routes (No Auth)
    router.get('/track/open/:campaignId/:recipientId', trackingController.trackOpen);
    router.get('/track/click/:campaignId/:recipientId', trackingController.trackClick);

    // Protected Routes
    router.use(authMiddleware);
    router.get('/dashboard', controller.getDashboard);

    // Campaigns
    router.get('/campaigns', controller.getCampaigns);
    router.post('/campaigns', controller.createCampaign);
    router.post('/campaigns/:id/send', controller.sendCampaign);

    // Templates
    router.get('/templates', controller.getTemplates);
    router.post('/templates', controller.createTemplate);
    router.put('/templates/:id', controller.updateTemplate);
    router.delete('/templates/:id', controller.deleteTemplate);

    // Settings
    router.get('/settings', controller.getSettings);
    router.put('/settings', controller.updateSettings);
    router.post('/settings/test', controller.testConnection);

    // Drip
    router.get('/drip-sequences', controller.getDripSequences);
    router.post('/drip-sequences', controller.createDripSequence);
    return router;
}
