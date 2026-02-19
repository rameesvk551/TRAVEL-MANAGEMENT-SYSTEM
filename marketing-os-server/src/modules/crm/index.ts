/**
 * CRM module — re-exports existing service, controller, and routes.
 */

// Service
export { CRMService } from './crm.service.js';

// Infrastructure
// Note: Repository impl should ideally be internal, but exporting for now if used elsewhere
export { SequelizeLeadRepository } from './SequelizeLeadRepository.js';

// Controller & Routes
export { CRMController, createCRMRoutes } from './crm.controller.js';
