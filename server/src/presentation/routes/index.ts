import { Router, RequestHandler } from 'express';
import { createHealthRoutes } from './health.routes.js';
import { createResourceRoutes } from './resource.routes.js';
import { createAuthRoutes } from './auth.routes.js';
import { createBookingRoutes } from './booking.routes.js';
import { createInventoryRoutes } from './inventoryRoutes.js';
import { ResourceController } from '../controllers/ResourceController.js';
import { AuthController } from '../controllers/AuthController.js';
import { BookingController } from '../controllers/BookingController.js';
import { createTenantMiddleware } from '../middleware/index.js';
import { TenantService } from '../../application/services/TenantService.js';

import { createCrmRoutes } from './crmRoutes.js';
import { createDashboardRoutes } from './dashboard.routes.js';
import { DashboardController } from '../controllers/DashboardController.js';
import { createHRMSRoutes } from './hrms/index.js';
import { createVendorRoutes } from './vendor.routes.js';
import { createGearRoutes } from './gear.routes.js';
import { createBranchRoutes } from './branch.routes.js';
import accountingRoutes from './accountingRoutes.js';

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

    // Inventory Routes
    router.use('/inventory', tenantMiddleware, createInventoryRoutes(deps.authMiddleware));

    // HRMS Routes
    router.use('/hrms', tenantMiddleware, createHRMSRoutes(deps.authMiddleware));

    // Vendor Management Routes
    router.use('/vendors', tenantMiddleware, createVendorRoutes(deps.authMiddleware));

    // Gear Management Routes
    router.use('/gear', tenantMiddleware, createGearRoutes(deps.authMiddleware));

    // Branch Management Routes
    router.use('/branches', tenantMiddleware, createBranchRoutes(deps.authMiddleware));

    // Accounting Routes
    router.use('/accounting', tenantMiddleware, accountingRoutes);

    return router;
}
