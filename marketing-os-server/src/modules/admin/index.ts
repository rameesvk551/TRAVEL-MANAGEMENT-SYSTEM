/**
 * Admin module — re-exports existing service, controller, and routes
 * into the feature-based module structure.
 */

// Types
export type { PaginatedResult } from './admin.service.js';

// Service
export { AdminService } from './admin.service.js';

// Controller
export { AdminController } from './admin.controller.js';

// Routes
export { createAdminRoutes } from './admin.routes.js';
