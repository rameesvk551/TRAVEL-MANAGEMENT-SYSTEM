import { Router, RequestHandler } from 'express';
import { createHealthRoutes } from './health.routes.js';
import { createResourceRoutes } from './resource.routes.js';
import { createAuthRoutes } from './auth.routes.js';
import { ResourceController } from '../controllers/ResourceController.js';
import { AuthController } from '../controllers/AuthController.js';
import { createTenantMiddleware } from '../middleware/index.js';
import { TenantService } from '../../application/services/TenantService.js';

interface RoutesDependencies {
    resourceController: ResourceController;
    authController: AuthController;
    tenantService: TenantService;
    authMiddleware: RequestHandler;
}

export function createApiRouter(deps: RoutesDependencies): Router {
    const router = Router();
    const tenantMiddleware = createTenantMiddleware(deps.tenantService);

    // Public routes
    router.use(createHealthRoutes());
    router.use('/auth', createAuthRoutes({
        authController: deps.authController,
        authMiddleware: deps.authMiddleware,
    }));

    // Protected routes (tenant + auth required)
    router.use('/resources', tenantMiddleware, createResourceRoutes(deps.resourceController));

    return router;
}
