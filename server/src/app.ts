import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { createApiRouter } from './presentation/routes/index.js';
import { errorMiddleware, createAuthMiddleware } from './presentation/middleware/index.js';
import { ResourceController, AuthController } from './presentation/controllers/index.js';
import { ResourceService, TenantService, AuthService } from './application/services/index.js';
import {
    TenantRepository,
    ResourceRepository,
    UserRepository,
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

    // Services
    const tenantService = new TenantService(tenantRepository);
    const resourceService = new ResourceService(resourceRepository);
    const authService = new AuthService(userRepository, tenantRepository);

    // Controllers
    const resourceController = new ResourceController(resourceService);
    const authController = new AuthController(authService);

    // Auth middleware
    const authMiddleware = createAuthMiddleware(authService, userRepository);

    // API routes
    app.use('/api', createApiRouter({
        resourceController,
        authController,
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
