import type { Express } from 'express';
import { logger } from '../config/logger.js';
import { AuthRepository } from '../modules/auth/auth.repository.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { AuthController } from '../modules/auth/auth.controller.js';
import { createAuthRoutes } from '../modules/auth/auth.routes.js';
import { getRedisClient } from '../config/redis.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../middlewares/tenant.middleware.js';
import { createFlowRoutes } from '../modules/flow/flow.routes.js';
import { FlowController } from '../modules/flow/flow.controller.js';
import { FlowService } from '../modules/flow/flow.service.js';
import { MongoFlowRepository } from '../infrastructure/repositories/mongo/MongoFlowRepository.js';
import { createWhatsAppContainer } from '../modules/whatsapp/container.js';
import { createWhatsAppRoutes } from '../modules/whatsapp/whatsapp.routes.js';
import { getPool } from '../config/database.js';

// Lead Module imports
import {
    LeadRepository, LeadService, LeadPipelineService, LeadNoteService,
    LeadFollowUpService, LeadAnalyticsService, LeadScoringService,
    LeadDuplicateService, LeadAssignmentService, LeadController, createLeadRoutes
} from '../modules/lead/index.js';

// ... other interfaces
interface CampaignDispatcherLike {
    startWorker(): void;
}

interface BillingJobsLike {
    start(): void;
}

const noopCampaignDispatcher: CampaignDispatcherLike = {
    startWorker() {
        logger.warn('Campaign dispatcher is disabled in minimal route mode.');
    },
};

const noopBillingJobs: BillingJobsLike = {
    start() {
        logger.warn('Billing cron jobs are disabled in minimal route mode.');
    },
};

/**
 * Dependencies returned from route registration for use by server.ts
 */
export interface AppDependencies {
    campaignDispatcher: CampaignDispatcherLike;
    billingJobs: BillingJobsLike;
}

/**
 * Register minimal routes needed for current WhatsApp onboarding flow.
 */
export function registerRoutes(app: Express): AppDependencies {
    // 1. Auth Module
    const authRepository = new AuthRepository();
    const redisClient = getRedisClient();
    const authService = new AuthService(authRepository, undefined, redisClient);
    const authController = new AuthController(authService);
    const authRouter = createAuthRoutes(authController);

    // 2. Shared middlewares
    const protect = authMiddleware(authService);

    // 3. Automation Module (Flows)
    const flowRepository = new MongoFlowRepository();
    const flowService = new FlowService(flowRepository);
    const flowController = new FlowController(); // Dependencies handled inside for now

    const flowRouter = createFlowRoutes({
        flowController,
        authMiddleware: protect,
        tenantMiddleware
    });

    // 4. WhatsApp Module
    const pool = getPool();
    const whatsAppContainer = createWhatsAppContainer(pool);
    const whatsAppRoutes = createWhatsAppRoutes({
        ...whatsAppContainer,
        authMiddleware: protect,
        tenantMiddleware
    });

    // 5. Lead Module
    const leadRepository = new LeadRepository();
    const leadAssignmentService = new LeadAssignmentService();
    const leadService = new LeadService(leadRepository);
    const leadPipelineService = new LeadPipelineService();
    const leadNoteService = new LeadNoteService();
    const leadFollowUpService = new LeadFollowUpService();
    const leadAnalyticsService = new LeadAnalyticsService();
    const leadScoringService = new LeadScoringService(leadRepository);
    const leadDuplicateService = new LeadDuplicateService();

    const leadController = new LeadController(
        leadService,
        leadPipelineService,
        leadNoteService,
        leadFollowUpService,
        leadAnalyticsService,
        leadScoringService,
        leadDuplicateService,
        leadAssignmentService
    );
    const leadRouter = createLeadRoutes({
        leadController,
        authMiddleware: protect,
        tenantMiddleware
    });

    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/whatsapp', whatsAppRoutes);
    app.use('/api/v1/automation/flows', flowRouter);
    app.use('/api/v1/leads', leadRouter);

    logger.info('Registered routes: /api/v1/auth, /api/v1/whatsapp, /api/v1/automation/flows, /api/v1/leads');

    return {
        campaignDispatcher: noopCampaignDispatcher,
        billingJobs: noopBillingJobs,
    };
}
