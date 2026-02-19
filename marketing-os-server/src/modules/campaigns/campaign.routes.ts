import { Router, RequestHandler } from 'express';
import { CampaignController } from './campaign.controller.js';

// Controller passed from outside

export function createMarketingRoutes(
    authMiddleware: RequestHandler,
    campaignController: CampaignController
): Router {
    const router = Router();

    router.use(authMiddleware); // Protect all marketing routes

    // Campaign Routes
    router.post('/campaigns', campaignController.create);
    router.get('/campaigns', campaignController.getAll);
    router.get('/campaigns/:id', campaignController.getById);
    router.patch('/campaigns/:id', campaignController.update);
    router.delete('/campaigns/:id', campaignController.delete);
    router.post('/campaigns/:id/launch', campaignController.launch);

    return router;
}
