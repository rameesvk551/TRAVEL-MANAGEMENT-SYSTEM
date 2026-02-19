import { Router, RequestHandler } from 'express';
import { CampaignController } from './controllers/CampaignController.js';
import { CampaignService } from '../../application/marketing/services/CampaignService.js';
import { SequelizeCampaignRepository } from '../../infrastructure/marketing/repositories/SequelizeCampaignRepository.js';
import { SequelizeSegmentRepository } from '../../infrastructure/marketing/repositories/SequelizeSegmentRepository.js';
import { CampaignDispatcher } from '../../infrastructure/marketing/services/CampaignDispatcher.js';

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
