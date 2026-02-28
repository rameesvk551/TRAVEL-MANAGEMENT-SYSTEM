// presentation/controllers/whatsapp/index.ts
export { createWebhookController } from './WebhookController.js';
export { createConversationController } from './ConversationController.js';
export { createTimelineController } from './TimelineController.js';
export { createTemplateController } from './TemplateController.js';
export { createWhatsAppAnalyticsController } from './WhatsAppAnalyticsController.js';
export { createAutomationController } from './AutomationController.js';

// Type aliases matching old class names for backward compatibility
export type WebhookController = ReturnType<typeof import('./WebhookController.js').createWebhookController>;
export type ConversationController = ReturnType<typeof import('./ConversationController.js').createConversationController>;
export type TimelineController = ReturnType<typeof import('./TimelineController.js').createTimelineController>;
export type TemplateController = ReturnType<typeof import('./TemplateController.js').createTemplateController>;
export type WhatsAppAnalyticsController = ReturnType<typeof import('./WhatsAppAnalyticsController.js').createWhatsAppAnalyticsController>;
export type AutomationController = ReturnType<typeof import('./AutomationController.js').createAutomationController>;
