/**
 * Campaigns (Marketing) module — re-exports existing service, controller, and routes.
 */

// DTOs
export type { CreateCampaignDTO } from './campaign.dto.js';

// Service
export { CampaignService } from './campaign.service.js';

// Infrastructure
export { CampaignDispatcher } from './campaign.dispatcher.js';
export { SequelizeCampaignRepository } from './campaign.repository.js';
export { SequelizeSegmentRepository } from './segment.repository.js';

// Controller
export { CampaignController } from './campaign.controller.js';

// Routes
export { createMarketingRoutes } from './campaign.routes.js';
