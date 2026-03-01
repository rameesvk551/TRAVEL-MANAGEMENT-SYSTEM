/**
 * Settings module entry-point router.
 * Builds its own middleware, returns a ready-to-mount router.
 */
import { createSettingsRoutes } from './settings.routes.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../../middlewares/tenant.middleware.js';

export function createRouter() {
    return createSettingsRoutes({
        authMiddleware: authMiddleware(),
        tenantMiddleware,
    });
}
