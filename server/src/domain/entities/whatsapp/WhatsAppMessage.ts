// domain/entities/whatsapp/WhatsAppMessage.ts
// Represents a single WhatsApp message

import { generateId } from '../../../shared/utils/index.js';

export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export type MessageType = 
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'DOCUMENT'
  | 'TEMPLATE'
  | 'LOCATION'
  | 'CONTACT'
  | 'INTERACTIVE';

export type MessageStatus = 
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED';

export interface WhatsAppMessageProps {
  id?: string;
  tenantId: string;
  conversationId: string;
  
  direction: MessageDirection;
  messageType: MessageType;
  
  senderPhone?: string;
  recipientPhone?: string;
  
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
  
  externalMessageId?: string;
  providerName?: string;
  
  status?: MessageStatus;
  
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  
  errorCode?: string;
  errorMessage?: string;
  
  metadata?: Record<string, unknown>;
  
  createdAt?: Date;
}

export class WhatsAppMessage {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly conversationId: string;
  
  public readonly direction: MessageDirection;
  public readonly messageType: MessageType;
  
  public readonly senderPhone?: string;
  public readonly recipientPhone?: string;
  
  public readonly content?: string;
  public readonly mediaUrl?: string;
  public readonly mediaType?: string;
  public readonly mediaSize?: number;
  
  public readonly externalMessageId?: string;
  public readonly providerName: string;
  
  public readonly status: MessageStatus;
  
  public readonly sentAt: Date;
  public readonly deliveredAt?: Date;
  public readonly readAt?: Date;
  public readonly failedAt?: Date;
  
  public readonly errorCode?: string;
  public readonly errorMessage?: string;
  
  public readonly metadata: Record<string, unknown>;
  
  public readonly createdAt: Date;

  private constructor(props: Required<Omit<WhatsAppMessageProps,
    'senderPhone' | 'recipientPhone' | 'content' | 'mediaUrl' | 
    'mediaType' | 'mediaSize' | 'externalMessageId' | 
    'deliveredAt' | 'readAt' | 'failedAt' | 'errorCode' | 'errorMessage'>> &
    Pick<WhatsAppMessageProps, 'senderPhone' | 'recipientPhone' | 'content' | 
    'mediaUrl' | 'mediaType' | 'mediaSize' | 'externalMessageId' | 
    'deliveredAt' | 'readAt' | 'failedAt' | 'errorCode' | 'errorMessage'>
  ) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.conversationId = props.conversationId;
    this.direction = props.direction;
    this.messageType = props.messageType;
    this.senderPhone = props.senderPhone;
    this.recipientPhone = props.recipientPhone;
    this.content = props.content;
    this.mediaUrl = props.mediaUrl;
    this.mediaType = props.mediaType;
    this.mediaSize = props.mediaSize;
    this.externalMessageId = props.externalMessageId;
    this.providerName = props.providerName;
    this.status = props.status;
    this.sentAt = props.sentAt;
    this.deliveredAt = props.deliveredAt;
    this.readAt = props.readAt;
    this.failedAt = props.failedAt;
    this.errorCode = props.errorCode;
    this.errorMessage = props.errorMessage;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
  }

  static create(props: WhatsAppMessageProps): WhatsAppMessage {
    const now = new Date();

    return new WhatsAppMessage({
      id: props.id ?? generateId(),
      tenantId: props.tenantId,
      conversationId: props.conversationId,
      direction: props.direction,
      messageType: props.messageType,
      senderPhone: props.senderPhone,
      recipientPhone: props.recipientPhone,
      content: props.content,
      mediaUrl: props.mediaUrl,
      mediaType: props.mediaType,
      mediaSize: props.mediaSize,
      externalMessageId: props.externalMessageId,
      providerName: props.providerName ?? 'meta',
      status: props.status ?? 'QUEUED',
      sentAt: props.sentAt ?? now,
      deliveredAt: props.deliveredAt,
      readAt: props.readAt,
      failedAt: props.failedAt,
      errorCode: props.errorCode,
      errorMessage: props.errorMessage,
      metadata: props.metadata ?? {},
      createdAt: props.createdAt ?? now,
    });
  }

  static fromPersistence(data: Required<Omit<WhatsAppMessageProps,
    'senderPhone' | 'recipientPhone' | 'content' | 'mediaUrl' | 
    'mediaType' | 'mediaSize' | 'externalMessageId' | 
    'deliveredAt' | 'readAt' | 'failedAt' | 'errorCode' | 'errorMessage'>> &
    Pick<WhatsAppMessageProps, 'senderPhone' | 'recipientPhone' | 'content' | 
    'mediaUrl' | 'mediaType' | 'mediaSize' | 'externalMessageId' | 
    'deliveredAt' | 'readAt' | 'failedAt' | 'errorCode' | 'errorMessage'>
  ): WhatsAppMessage {
    return new WhatsAppMessage(data);
  }

  get hasMedia(): boolean {
    return ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'].includes(this.messageType);
  }

  get wasDelivered(): boolean {
    return ['DELIVERED', 'READ'].includes(this.status);
  }

  get hasFailed(): boolean {
    return this.status === 'FAILED';
  }
}
