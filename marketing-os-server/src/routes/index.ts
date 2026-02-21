import type { Express } from 'express';
import { logger } from '../config/logger.js';
import onboardingRouter from '../modules/whatsapp/routes/onboarding.routes.js';
import { AuthRepository } from '../modules/auth/auth.repository.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { AuthController } from '../modules/auth/auth.controller.js';
import { createAuthRoutes } from '../modules/auth/auth.routes.js';
import { getRedisClient } from '../config/redis.js';
import { WhatsAppStoreService } from '../modules/store/store.service.js';
import { StoreController } from '../modules/store/store.controller.js';
import { createStoreRoutes } from '../modules/store/store.routes.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../middlewares/tenant.middleware.js';
import { createFlowRoutes } from '../modules/automation/flow.routes.js';
import { FlowController } from '../modules/automation/flow.controller.js';
import { FlowService } from '../modules/automation/flow.service.js';
import { MongoFlowRepository } from '../infrastructure/repositories/mongo/MongoFlowRepository.js';
import { createWhatsAppContainer } from '../modules/whatsapp/container.js';
import { createWhatsAppRoutes } from '../modules/whatsapp/whatsapp.routes.js';
import { getPool } from '../config/database.js';

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

    // 2. Store Module
    const storeService = new WhatsAppStoreService();
    const storeController = new StoreController(storeService);

    // Middlewares for store
    const protect = authMiddleware(authService);

    const storeRouter = createStoreRoutes({
        storeController,
        authMiddleware: protect,
        tenantMiddleware
    });

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

    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/whatsapp/onboard', onboardingRouter);
    app.use('/api/v1/whatsapp', whatsAppRoutes);
    app.use('/api/v1/store', storeRouter);
    app.use('/api/v1/automation/flows', flowRouter);

    logger.info('Registered routes: /api/v1/auth, /api/v1/whatsapp, /api/v1/store, /api/v1/automation/flows');

    return {
        campaignDispatcher: noopCampaignDispatcher,
        billingJobs: noopBillingJobs,
    };
}
