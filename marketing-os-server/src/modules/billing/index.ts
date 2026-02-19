/**
 * Billing module — re-exports existing service, controller, and routes
 * into the feature-based module structure.
 */

// Types
export type { BillingPlanType, SubscriptionStatus, PaymentStatus } from './billing.types.js';
export { SUPER_ADMIN_ROLES } from './billing.types.js';

// Service
export { BillingService } from './billing.service.js';
export { BillingJobs } from './billing.jobs.js';
export { RazorpayClient } from './RazorpayClient.js';

// Contracts
export type { BillingOnboardingPort } from './billing.contracts.js';

// Controller
export { BillingController } from './billing.controller.js';

// Routes
export { createBillingRoutes } from './billing.routes.js';
