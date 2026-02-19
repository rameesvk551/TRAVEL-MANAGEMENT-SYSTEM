/**
 * Monitoring module — re-exports existing service, controller, and routes.
 */

// Service
export { AlertService } from './monitoring.service.js';

// Controller
export { MonitoringController } from './monitoring.controller.js';

// Routes
export { createMonitoringRoutes } from './monitoring.controller.js';
