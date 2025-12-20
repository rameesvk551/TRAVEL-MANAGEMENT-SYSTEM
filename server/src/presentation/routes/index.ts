import { Router, RequestHandler } from 'express';
import { createHealthRoutes } from './health.routes.js';
import { createResourceRoutes } from './resource.routes.js';
import { createAuthRoutes } from './auth.routes.js';
import { createBookingRoutes } from './booking.routes.js';
import { ResourceController } from '../controllers/ResourceController.js';
import { AuthController } from '../controllers/AuthController.js';
import { BookingController } from '../controllers/BookingController.js';
import { createTenantMiddleware } from '../middleware/index.js';
import { TenantService } from '../../application/services/TenantService.js';

import { createCrmRoutes } from './crmRoutes.js';
import { createDashboardRoutes } from './dashboard.routes.js';
import { DashboardController } from '../controllers/DashboardController.js';

interface RoutesDependencies {
    resourceController: ResourceController;
    authController: AuthController;
    bookingController: BookingController;
    dashboardController: DashboardController;
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
    router.use('/dashboard', tenantMiddleware, createDashboardRoutes(deps.dashboardController));
    router.use('/resources', tenantMiddleware, createResourceRoutes(deps.resourceController));
    router.use('/bookings', tenantMiddleware, createBookingRoutes({
        bookingController: deps.bookingController,
        authMiddleware: deps.authMiddleware,
    }));

    // CRM Routes (Apply tenant middleware here!)
    router.use('/crm', tenantMiddleware, createCrmRoutes(deps.authMiddleware));

    return router;
}
