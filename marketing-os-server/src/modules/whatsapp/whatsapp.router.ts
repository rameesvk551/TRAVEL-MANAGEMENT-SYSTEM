/**
 * WhatsApp module entry-point router.
 * Builds its own container & middleware, returns a ready-to-mount router.
 */
import { createWhatsAppContainer } from './container.js';
import { createWhatsAppRoutes } from './whatsapp.routes.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../../middlewares/tenant.middleware.js';
import { getPool } from '../../config/database.js';

export function createRouter() {
    const container = createWhatsAppContainer(getPool(), {});

    return createWhatsAppRoutes({
        webhookController: container.webhookController,
        conversationController: container.conversationController,
        timelineController: container.timelineController,
        templateController: container.templateController,
        analyticsController: container.analyticsController,
        automationController: container.automationController,
        settingsController: container.settingsController,
        embeddedSignupController: container.embeddedSignupController,
        broadcastController: container.broadcastController,
        optInRepo: container.optInRepo,
        authMiddleware: authMiddleware(),
        tenantMiddleware,
    });
}
