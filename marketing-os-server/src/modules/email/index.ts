/**
 * Email module — re-exports existing service, controller, and routes.
 */

// Services
export { EmailService } from './EmailService.js';
export { EmailSettingsService } from './EmailSettingsService.js';
export { EmailTrackingService } from './EmailTrackingService.js';
export { DripOrchestrator } from './DripOrchestrator.js';

// Infrastructure
export { DripWorker } from './DripWorker.js';

// Controllers & Routes
export { EmailController, createEmailRoutes } from './EmailController.js';
export { EmailTrackingController } from './EmailTrackingController.js';
export { DripController, createDripRoutes } from './DripController.js';
