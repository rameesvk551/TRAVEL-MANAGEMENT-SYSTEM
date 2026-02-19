/**
 * Growth module — re-exports existing services, controllers, and routes.
 */

// Services
export { TrackingService } from './TrackingService.js';
export { SourceAnalyticsService } from './SourceAnalyticsService.js';
export { ConversionService } from './ConversionService.js';
export { FunnelAnalyticsService } from './FunnelAnalyticsService.js';
export { IntegrationService } from './IntegrationService.js';
export { WidgetService } from './WidgetService.js';

// Repositories
export { SequelizeVisitorRepository } from './SequelizeVisitorRepository.js';
export { SequelizeTrackingEventRepository } from './SequelizeTrackingEventRepository.js';
export { SequelizeTrafficSourceRepository } from './SequelizeTrafficSourceRepository.js';
export { SequelizeConversionRepository } from './SequelizeConversionRepository.js';
export { SequelizeAdCostRepository } from './SequelizeAdCostRepository.js';
export { SequelizeIntegrationCredentialRepository } from './SequelizeIntegrationCredentialRepository.js';
export { SequelizeFunnelRepository } from './SequelizeFunnelRepository.js';

// Controllers
export { TrackingController } from './TrackingController.js';
export { AnalyticsController } from './AnalyticsController.js';
export { IntegrationController } from './IntegrationController.js';
export { FunnelController } from './FunnelController.js';
export { WidgetController } from './WidgetController.js';

// Routes
export { createGrowthRoutes } from './growth.routes.js';
