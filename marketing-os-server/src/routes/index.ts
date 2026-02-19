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

    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/whatsapp/onboard', onboardingRouter);
    app.use('/api/v1/store', storeRouter);

    logger.info('Registered routes: /api/v1/auth, /api/v1/whatsapp/onboard, /api/v1/store');

    return {
        campaignDispatcher: noopCampaignDispatcher,
        billingJobs: noopBillingJobs,
    };
}
