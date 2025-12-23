// domain/entities/whatsapp/WhatsAppMessage.ts
// Normalized message model - provider agnostic

import { generateId } from '../../../shared/utils/index.js';

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
  | 'STICKER';

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
export class WhatsAppMessage {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly conversationId: string;
  public readonly providerMessageId: string;
  public readonly providerTimestamp: Date;
  public readonly direction: MessageDirection;
  public readonly senderPhone: string;
  public readonly recipientPhone: string;
  public readonly messageType: MessageType;
  public readonly textContent?: TextContent;
  public readonly mediaContent?: MediaContent;
  public readonly locationContent?: LocationContent;
  public readonly contactContent?: ContactContent;
  public readonly interactiveContent?: InteractiveContent;
  public readonly templateContent?: TemplateContent;
  public readonly replyToMessageId?: string;
  public readonly selectedButtonId?: string;
  public readonly selectedListItemId?: string;
  public readonly status: DeliveryStatus;
  public readonly statusTimestamps: Record<string, Date | undefined>;
  public readonly failureReason?: string;
  public readonly linkedLeadId?: string;
  public readonly linkedBookingId?: string;
  public readonly linkedTripId?: string;
  public readonly handledByUserId?: string;
  public readonly isProcessed: boolean;
  public readonly processingError?: string;
  public readonly requiresResponse: boolean;
  public readonly idempotencyKey: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: WhatsAppMessageProps) {
    this.id = props.id!;
    this.tenantId = props.tenantId;
    this.conversationId = props.conversationId;
    this.providerMessageId = props.providerMessageId;
    this.providerTimestamp = props.providerTimestamp;
    this.direction = props.direction;
    this.senderPhone = props.senderPhone;
    this.recipientPhone = props.recipientPhone;
    this.messageType = props.messageType;
    this.textContent = props.textContent;
    this.mediaContent = props.mediaContent;
    this.locationContent = props.locationContent;
    this.contactContent = props.contactContent;
    this.interactiveContent = props.interactiveContent;
    this.templateContent = props.templateContent;
    this.replyToMessageId = props.replyToMessageId;
    this.selectedButtonId = props.selectedButtonId;
    this.selectedListItemId = props.selectedListItemId;
    this.status = props.status;
    this.statusTimestamps = props.statusTimestamps;
    this.failureReason = props.failureReason;
    this.linkedLeadId = props.linkedLeadId;
    this.linkedBookingId = props.linkedBookingId;
    this.linkedTripId = props.linkedTripId;
    this.handledByUserId = props.handledByUserId;
    this.isProcessed = props.isProcessed;
    this.processingError = props.processingError;
    this.requiresResponse = props.requiresResponse;
    this.idempotencyKey = props.idempotencyKey;
    this.createdAt = props.createdAt!;
    this.updatedAt = props.updatedAt!;
  }

  static create(props: WhatsAppMessageProps): WhatsAppMessage {
    const now = new Date();
    return new WhatsAppMessage({
      id: props.id ?? generateId(),
      ...props,
      status: props.status ?? 'PENDING',
      statusTimestamps: props.statusTimestamps ?? {},
      isProcessed: props.isProcessed ?? false,
      requiresResponse: props.requiresResponse ?? false,
      idempotencyKey: props.idempotencyKey ?? `${props.providerMessageId}-${props.tenantId}`,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  static fromPersistence(data: WhatsAppMessageProps): WhatsAppMessage {
    return new WhatsAppMessage(data);
  }

  /**
   * Get text body regardless of message type
   */
  get textBody(): string {
    if (this.textContent) return this.textContent.body;
    if (this.mediaContent?.caption) return this.mediaContent.caption;
    if (this.interactiveContent) return this.interactiveContent.body;
    return '';
  }
}
