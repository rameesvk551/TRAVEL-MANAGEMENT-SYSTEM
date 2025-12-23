// application/dtos/whatsapp/WhatsAppDTOs.ts
// Data Transfer Objects for WhatsApp operations

import {
  ConversationState,
  ActiveWorkflow,
  LinkedEntityType,
} from '../../../domain/entities/whatsapp/ConversationContext.js';
import {
  MessageType,
  DeliveryStatus,
} from '../../../domain/entities/whatsapp/WhatsAppMessage.js';
import { TemplateUseCase } from '../../../domain/entities/whatsapp/MessageTemplate.js';

// ============================================================================
// INBOUND MESSAGE HANDLING
// ============================================================================

export interface ProcessInboundMessageDTO {
  tenantId: string;
  providerMessageId: string;
  providerTimestamp: Date;
  senderPhone: string;
  recipientPhone: string;
  messageType: MessageType;
  textBody?: string;
  mediaUrl?: string;
  mediaCaption?: string;
  locationLat?: number;
  locationLng?: number;
  selectedButtonId?: string;
  selectedListItemId?: string;
  replyToMessageId?: string;
  providerMetadata?: Record<string, unknown>;
}

export interface ProcessedMessageResult {
  messageId: string;
  conversationId: string;
  isNewConversation: boolean;
  linkedTo?: {
    type: LinkedEntityType;
    entityId: string;
  };
  suggestedActions: string[];
  requiresHumanReview: boolean;
}

// ============================================================================
// OUTBOUND MESSAGE SENDING
// ============================================================================

export interface SendTextMessageDTO {
  tenantId: string;
  recipientPhone: string;
  text: string;
  replyToMessageId?: string;
  linkTo?: {
    type: LinkedEntityType;
    entityId: string;
  };
  senderUserId: string;
}

export interface SendTemplateMessageDTO {
  tenantId: string;
  recipientPhone: string;
  templateName: string;
  language?: string;
  variables: Record<string, string>;
  linkTo?: {
    type: LinkedEntityType;
    entityId: string;
  };
  senderUserId: string;
}

export interface SendInteractiveMessageDTO {
  tenantId: string;
  recipientPhone: string;
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{
    id: string;
    title: string;
  }>;
  listSections?: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
  senderUserId: string;
}

export interface SendMediaMessageDTO {
  tenantId: string;
  recipientPhone: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  mediaUrl: string;
  caption?: string;
  fileName?: string;
  senderUserId: string;
}

export interface MessageSentResult {
  success: boolean;
  messageId?: string;
  providerMessageId?: string;
  error?: string;
  errorCode?: string;
}

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

export interface ConversationDTO {
  id: string;
  tenantId: string;
  phoneNumber: string;
  displayName: string;
  state: ConversationState;
  linkedEntityType?: LinkedEntityType;
  linkedEntityId?: string;
  lastMessageAt: Date;
  lastMessagePreview: string;
  unreadCount: number;
  isEscalated: boolean;
  assignedToUserId?: string;
  assignedToName?: string;
}

export interface ConversationDetailDTO extends ConversationDTO {
  messages: MessageDTO[];
  linkedEntities: Array<{
    type: LinkedEntityType;
    entityId: string;
    displayName: string;
    status?: string;
  }>;
  timeline: TimelineEntryDTO[];
}

export interface MessageDTO {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  messageType: MessageType;
  textContent?: string;
  mediaUrl?: string;
  status: DeliveryStatus;
  senderName: string;
  timestamp: Date;
  isRead: boolean;
}

export interface TimelineEntryDTO {
  id: string;
  entryType: string;
  title: string;
  description?: string;
  actorName: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// WORKFLOW TRIGGERS
// ============================================================================

export interface TriggerWorkflowDTO {
  tenantId: string;
  conversationId: string;
  workflow: ActiveWorkflow;
  triggeredByUserId?: string;
  initialData?: Record<string, unknown>;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export interface BulkSendTemplateDTO {
  tenantId: string;
  templateName: string;
  language?: string;
  recipients: Array<{
    phone: string;
    variables: Record<string, string>;
    linkTo?: {
      type: LinkedEntityType;
      entityId: string;
    };
  }>;
  senderUserId: string;
  scheduledFor?: Date;
}

export interface BulkSendResult {
  totalRequested: number;
  successful: number;
  failed: number;
  errors: Array<{
    phone: string;
    error: string;
  }>;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface WhatsAppAnalyticsDTO {
  period: {
    from: Date;
    to: Date;
  };
  messages: {
    sent: number;
    received: number;
    delivered: number;
    read: number;
    failed: number;
  };
  conversations: {
    total: number;
    active: number;
    escalated: number;
    avgDurationMinutes: number;
  };
  responseMetrics: {
    avgResponseTimeMinutes: number;
    firstResponseTimeMinutes: number;
    resolutionRate: number;
  };
  byUseCase: Record<string, number>;
}
