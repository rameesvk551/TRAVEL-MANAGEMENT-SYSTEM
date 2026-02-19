/**
 * Lead module — CRM layer for WhatsApp Sales Automation.
 */

export * from './lead.types.js';
export { Lead, LeadActivity, initLeadModels } from './lead.model.js';
export { LeadRepository } from './lead.repository.js';
export { LeadService } from './lead.service.js';
export { LeadController } from './lead.controller.js';
export { createLeadRoutes } from './lead.routes.js';
