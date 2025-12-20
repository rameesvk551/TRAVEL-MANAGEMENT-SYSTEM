import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { createApiRouter } from './presentation/routes/index.js';
import { createCrmRoutes } from './presentation/routes/crmRoutes.js';
import { errorMiddleware } from './presentation/middleware/index.js';
import { createAuthMiddleware } from './presentation/middleware/auth.middleware.js';
import {
    AuthService,
    ResourceService,
    TenantService,
    BookingService,
    AvailabilityService
} from './application/services/index.js';
import {
    AuthController,
    ResourceController,
    BookingController
} from './presentation/controllers/index.js';
import {
    UserRepository,
    ResourceRepository,
    TenantRepository,
    BookingRepository
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

    // Services
    const tenantService = new TenantService(tenantRepository);
    const resourceService = new ResourceService(resourceRepository);
    const authService = new AuthService(userRepository, tenantRepository);
    const availabilityService = new AvailabilityService(bookingRepository, resourceRepository);
    const bookingService = new BookingService(bookingRepository, availabilityService);

    // Controllers
    const resourceController = new ResourceController(resourceService);
    const authController = new AuthController(authService);
    const bookingController = new BookingController(bookingService);

    // Initialize Middleware
    const authMiddleware = createAuthMiddleware(authService, userRepository);

    // API routes
    app.use('/api', createApiRouter({
        resourceController,
        authController,
        bookingController,
        tenantService,
        authMiddleware,
    }));

    app.use('/api/crm', createCrmRoutes(authMiddleware));

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
