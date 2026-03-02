import { createStoreRoutes } from './store.routes.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../../middlewares/tenant.middleware.js';

export function createRouter() {
    return createStoreRoutes({
        authMiddleware: authMiddleware(),
        tenantMiddleware,
    });
}
