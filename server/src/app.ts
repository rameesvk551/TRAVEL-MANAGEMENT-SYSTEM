import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { createApiRouter } from './presentation/routes/index.js';
import { errorMiddleware } from './presentation/middleware/index.js';
import { createAuthMiddleware } from './presentation/middleware/auth.middleware.js';
import {
    AuthService,
    ResourceService,
    TenantService,
    BookingService,
    AvailabilityService,
    LeadService,
    ContactService,
    PipelineService,
    DashboardService
} from './application/services/index.js';
import {
    AuthController,
    ResourceController,
    BookingController,
    DashboardController,
    LeadController
} from './presentation/controllers/index.js';
import {
    UserRepository,
    ResourceRepository,
    TenantRepository,
    BookingRepository,
    LeadRepository,
    ContactRepository,
    PipelineRepository
} from './infrastructure/repositories/index.js';

/**
 * Create and configure the Express application.
 * Dependency injection happens here.
 */
export function createApp(): Express {
    const app = express();

    // Core middleware
    app.use(cors({ origin: config.server.corsOrigin, credentials: true }));
    app.use(express.json());

    // Repositories
    const tenantRepository = new TenantRepository();
    const resourceRepository = new ResourceRepository();
    const userRepository = new UserRepository();
    const bookingRepository = new BookingRepository();
    const leadRepository = new LeadRepository();

    // Services
    const tenantService = new TenantService(tenantRepository);
    const resourceService = new ResourceService(resourceRepository);
    const authService = new AuthService(userRepository, tenantRepository);
    const availabilityService = new AvailabilityService(bookingRepository, resourceRepository);
    const bookingService = new BookingService(bookingRepository, availabilityService);
    const leadService = new LeadService(leadRepository, new ContactService(new ContactRepository()), new PipelineService(new PipelineRepository()), bookingService);
    const dashboardService = new DashboardService(resourceRepository, bookingRepository, leadRepository);

    // Controllers
    const resourceController = new ResourceController(resourceService);
    const authController = new AuthController(authService);
    const bookingController = new BookingController(bookingService);
    const dashboardController = new DashboardController(dashboardService);

    // Initialize Middleware
    const authMiddleware = createAuthMiddleware(authService, userRepository);

    // API routes
    app.use('/api', createApiRouter({
        resourceController,
        authController,
        bookingController,
        dashboardController,
        tenantService,
        authMiddleware,
    }));

    // Welcome route
    app.get('/', (_req, res) => {
        res.json({
            name: 'Travel Operations Platform API',
            version: '1.0.0',
            docs: '/api/health',
        });
    });

    // Error handling (must be last)
    app.use(errorMiddleware);

    return app;
}
