// domain/interfaces/whatsapp/index.ts
// WhatsApp interfaces exports

export {
  type IConversationRepository,
  type ConversationFilters,
} from './IConversationRepository.js';

export {
  type IWhatsAppProvider,
  type ProviderType,
  type WebhookEventType,
  type RawWebhookPayload,
  type IncomingMessage,
  type MessageStatusUpdate,
  type SendMessageRequest,
  type SendMessageResult,
  type TemplateSubmission,
  type TemplateApprovalStatus,
  type MediaUploadResult,
} from './IWhatsAppProvider.js';

export {
  type IMessageRepository,
  type MessageFilters,
  type MessageStats,
} from './IMessageRepository.js';

export {
  type ITimelineRepository,
  type TimelineFilters,
} from './ITimelineRepository.js';

// Alias for backward compatibility
export type TimelineQuery = TimelineFilters;
