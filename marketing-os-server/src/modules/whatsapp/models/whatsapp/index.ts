// domain/entities/whatsapp/index.ts
// WhatsApp domain entities exports

export {
  ConversationContext,
  type ConversationContextProps,
  type ConversationActorType,
  type LinkedEntityType,
  type ConversationState,
  type ActiveWorkflow,
  type ConversationActor,
  type LinkedEntity,
  type WorkflowProgress,
  type CommunicationChannel,
} from './ConversationContext.js';

export {
  WhatsAppMessage,
  type WhatsAppMessageProps,
  type MessageDirection,
  type MessageType,
  type DeliveryStatus,
  type TextContent,
  type MediaContent,
  type LocationContent,
  type ContactContent,
  type InteractiveContent,
  type TemplateContent,
} from './WhatsAppMessage.js';

export {
  MessageTemplate,
  type MessageTemplateProps,
  type TemplateCategory,
  type TemplateStatus,
  type TemplateUseCase,
  type TemplateVariable,
  type TemplateButton,
} from './MessageTemplate.js';

export {
  WhatsAppOptIn,
  type WhatsAppOptInProps,
  type OptInStatus,
  type OptInSource,
  type OptInAuditEntry,
} from './WhatsAppOptIn.js';

export {
  UnifiedTimelineEntry,
  type UnifiedTimelineEntryProps,
  type TimelineEntrySource,
  type TimelineEntryType,
  type TimelineVisibility,
  type TimelineMedia,
  type TimelineLocation,
} from './UnifiedTimeline.js';

export {
  WhatsAppBusinessConfig,
  type WhatsAppBusinessConfigProps,
  type WABAStatus,
  type OnboardingMethod,
  type WABACredentials,
  type PhoneNumberInfo,
} from './WhatsAppBusinessConfig.js';
