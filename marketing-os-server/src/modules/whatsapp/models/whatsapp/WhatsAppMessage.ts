// domain/entities/whatsapp/WhatsAppMessage.ts
// Normalized message model - provider agnostic

import { generateId } from '../../../../shared/utils/index.js';

/**
 * Message direction
 */
export type MessageDirection = 'INBOUND' | 'OUTBOUND';

/**
 * Message types supported
 */
export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'DOCUMENT'
  | 'LOCATION'
  | 'CONTACT'
  | 'TEMPLATE'
  | 'INTERACTIVE'  // Buttons, lists
  | 'REACTION'
  | 'STICKER'
  | 'UNKNOWN';

/**
 * Delivery status
 */
export type DeliveryStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'DELETED';

/**
 * Message content types
 */
export interface TextContent {
  body: string;
  previewUrl?: string;
}

export interface MediaContent {
  mediaId: string;
  mimeType: string;
  fileName?: string;
  fileSize?: number;
  caption?: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
}

export interface LocationContent {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface ContactContent {
  name: string;
  phones: string[];
  emails?: string[];
}

export interface InteractiveContent {
  type: 'BUTTON' | 'LIST' | 'PRODUCT';
  header?: string;
  body: string;
  footer?: string;
  buttons?: Array<{
    id: string;
    title: string;
  }>;
  sections?: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
}

export interface TemplateContent {
  templateName: string;
  language: string;
  components: Array<{
    type: 'header' | 'body' | 'button';
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
      value: string | Record<string, unknown>;
    }>;
  }>;
}

export interface WhatsAppMessageProps {
  id?: string;
  tenantId: string;
  conversationId: string;

  // Provider references
  providerMessageId: string;  // WhatsApp's message ID
  providerTimestamp: Date;

  // Direction & participants
  direction: MessageDirection;
  senderPhone: string;
  recipientPhone: string;

  // Content
  messageType: MessageType;
  textContent?: TextContent;
  mediaContent?: MediaContent;
  locationContent?: LocationContent;
  contactContent?: ContactContent;
  interactiveContent?: InteractiveContent;
  templateContent?: TemplateContent;

  // Response tracking (for interactive messages)
  replyToMessageId?: string;
  selectedButtonId?: string;
  selectedListItemId?: string;

  // Delivery tracking
  status: DeliveryStatus;
  statusTimestamps: {
    sent?: Date;
    delivered?: Date;
    read?: Date;
    failed?: Date;
  };
  failureReason?: string;

  // Business context (populated by system)
  linkedLeadId?: string;
  linkedBookingId?: string;
  linkedTripId?: string;
  handledByUserId?: string;

  // Processing flags
  isProcessed: boolean;
  processingError?: string;
  requiresResponse: boolean;

  // Idempotency
  idempotencyKey: string;

  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * WhatsAppMessage - Normalized message entity
 * 
 * PROVIDER AGNOSTIC: Works with Meta, Twilio, or any provider.
 * The adapter layer normalizes incoming messages to this format.
 */
function _createWhatsAppMessage(props: WhatsAppMessageProps) {
    return {
        id: props.id!,
        tenantId: props.tenantId,
        conversationId: props.conversationId,
        providerMessageId: props.providerMessageId,
        providerTimestamp: props.providerTimestamp,
        direction: props.direction,
        senderPhone: props.senderPhone,
        recipientPhone: props.recipientPhone,
        messageType: props.messageType,
        textContent: props.textContent,
        mediaContent: props.mediaContent,
        locationContent: props.locationContent,
        contactContent: props.contactContent,
        interactiveContent: props.interactiveContent,
        templateContent: props.templateContent,
        replyToMessageId: props.replyToMessageId,
        selectedButtonId: props.selectedButtonId,
        selectedListItemId: props.selectedListItemId,
        status: props.status,
        statusTimestamps: props.statusTimestamps ?? {},
        failureReason: props.failureReason,
        linkedLeadId: props.linkedLeadId,
        linkedBookingId: props.linkedBookingId,
        linkedTripId: props.linkedTripId,
        handledByUserId: props.handledByUserId,
        isProcessed: props.isProcessed,
        processingError: props.processingError,
        requiresResponse: props.requiresResponse,
        idempotencyKey: props.idempotencyKey,
        createdAt: props.createdAt!,
        updatedAt: props.updatedAt!,
        get textBody(): string {
            return props.textContent?.body || props.mediaContent?.caption || props.interactiveContent?.body || '';
        },
    };
}

export const WhatsAppMessage = {
    create(props: WhatsAppMessageProps) {
        const now = new Date();
        return _createWhatsAppMessage({
            ...props,
            id: props.id ?? generateId(),
            status: props.status ?? 'PENDING',
            statusTimestamps: props.statusTimestamps ?? {},
            isProcessed: props.isProcessed ?? false,
            requiresResponse: props.requiresResponse ?? false,
            idempotencyKey: props.idempotencyKey ?? `${props.providerMessageId}-${props.tenantId}`,
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    },
    fromPersistence(data: WhatsAppMessageProps) {
        return _createWhatsAppMessage(data);
    },
};

export type WhatsAppMessage = ReturnType<typeof _createWhatsAppMessage>;
