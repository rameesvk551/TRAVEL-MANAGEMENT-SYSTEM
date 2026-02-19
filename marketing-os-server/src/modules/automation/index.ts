/**
 * Automation Module - Smart Automation Rules Engine
 * 
 * Features:
 * - Event-triggered automation rules
 * - Multiple trigger types: no_reply, cart_abandoned, payment_pending, etc.
 * - Condition-based filtering
 * - Action execution: send_message, assign_agent, update_lead, trigger_flow
 * - Rate limiting and cooldown periods
 * - Execution logging and analytics
 */

export * from './automation.types.js';
export * from './automation.model.js';
export * from './automation.repository.js';
export * from './automation.engine.js';
export * from './automation.service.js';
export * from './automation.controller.js';
export { createAutomationRoutes } from './automation.routes.js';
