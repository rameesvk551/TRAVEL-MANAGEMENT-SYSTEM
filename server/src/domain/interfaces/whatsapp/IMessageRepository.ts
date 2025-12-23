// domain/interfaces/whatsapp/IMessageRepository.ts
// Repository interface for WhatsApp messages

import {
  WhatsAppMessage,
  WhatsAppMessageProps,
  MessageDirection,
  MessageType,
  DeliveryStatus,
} from '../../entities/whatsapp/WhatsAppMessage.js';

export interface MessageFilters {
  conversationId?: string;
  direction?: MessageDirection;
  messageType?: MessageType;
  status?: DeliveryStatus;
  isProcessed?: boolean;
  requiresResponse?: boolean;
  linkedLeadId?: string;
  linkedBookingId?: string;
  linkedTripId?: string;
  senderPhone?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface MessageStats {
  totalSent: number;
  totalReceived: number;
  totalFailed: number;
  avgResponseTimeMinutes: number;
  unreadCount: number;
}

export interface IMessageRepository {
  /**
   * Find message by ID
   */
  findById(id: string, tenantId: string): Promise<WhatsAppMessage | null>;

  /**
   * Find message by provider message ID (for deduplication)
   */
  findByProviderMessageId(
    providerMessageId: string,
    tenantId: string
  ): Promise<WhatsAppMessage | null>;

  /**
   * Find message by idempotency key
   */
  findByIdempotencyKey(key: string): Promise<WhatsAppMessage | null>;

  /**
   * Find messages for a conversation
   */
  findByConversation(
    conversationId: string,
    tenantId: string,
    limit?: number,
    offset?: number
  ): Promise<WhatsAppMessage[]>;

  /**
   * Find messages by filters
   */
  findAll(tenantId: string, filters?: MessageFilters): Promise<WhatsAppMessage[]>;

  /**
   * Find unprocessed messages
   */
  findUnprocessed(tenantId: string, limit?: number): Promise<WhatsAppMessage[]>;

  /**
   * Find messages requiring response
   */
  findRequiringResponse(tenantId: string): Promise<WhatsAppMessage[]>;

  /**
   * Save message
   */
  save(message: WhatsAppMessage): Promise<WhatsAppMessage>;

  /**
   * Update delivery status
   */
  updateStatus(
    id: string,
    tenantId: string,
    status: DeliveryStatus,
    timestamp?: Date,
    errorReason?: string
  ): Promise<void>;

  /**
   * Mark as processed
   */
  markProcessed(
    id: string,
    tenantId: string,
    error?: string
  ): Promise<void>;

  /**
   * Link message to business entities
   */
  linkToEntities(
    id: string,
    tenantId: string,
    links: {
      leadId?: string;
      bookingId?: string;
      tripId?: string;
    }
  ): Promise<void>;

  /**
   * Get message statistics
   */
  getStats(tenantId: string, fromDate: Date, toDate: Date): Promise<MessageStats>;

  /**
   * Count messages for conversation
   */
  countByConversation(conversationId: string, tenantId: string): Promise<number>;

  /**
   * Delete old messages (for compliance)
   */
  deleteOlderThan(tenantId: string, beforeDate: Date): Promise<number>;
}
