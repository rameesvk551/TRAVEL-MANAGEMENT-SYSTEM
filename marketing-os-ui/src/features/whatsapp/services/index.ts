// services/index.ts — barrel export for all WhatsApp services.

export { conversationService } from './conversationService';
export type { ConversationFilters } from './conversationService';

export { templateService } from './templateService';
export type { TemplateFilters } from './templateService';

export { broadcastService } from './broadcastService';
export type { BroadcastPayload } from './broadcastService';

export { automationRuleService, automationFlowService } from './automationService';

export { analyticsService } from './analyticsService';

export { contactService } from './contactService';
