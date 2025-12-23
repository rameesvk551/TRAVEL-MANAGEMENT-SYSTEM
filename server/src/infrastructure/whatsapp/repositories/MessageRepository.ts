// infrastructure/whatsapp/repositories/MessageRepository.ts
// Repository implementation for WhatsApp messages

import { Pool } from 'pg';
import {
  WhatsAppMessage,
  WhatsAppMessageProps,
  DeliveryStatus,
} from '../../../domain/entities/whatsapp/index.js';
import {
  IMessageRepository,
  MessageFilters,
  MessageStats,
} from '../../../domain/interfaces/whatsapp/index.js';

/**
 * MessageRepository - Postgres implementation
 */
export class MessageRepository implements IMessageRepository {
  constructor(private pool: Pool) {}

  async findById(id: string, tenantId: string): Promise<WhatsAppMessage | null> {
    const row = await this.pool.query(
      'SELECT * FROM whatsapp_messages WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return row.rows[0] ? this.mapToEntity(row.rows[0]) : null;
  }

  async findByProviderMessageId(
    providerMessageId: string,
    tenantId: string
  ): Promise<WhatsAppMessage | null> {
    const row = await this.pool.query(
      'SELECT * FROM whatsapp_messages WHERE provider_message_id = $1 AND tenant_id = $2',
      [providerMessageId, tenantId]
    );
    return row.rows[0] ? this.mapToEntity(row.rows[0]) : null;
  }

  async findByIdempotencyKey(key: string): Promise<WhatsAppMessage | null> {
    const row = await this.pool.query(
      'SELECT * FROM whatsapp_messages WHERE idempotency_key = $1',
      [key]
    );
    return row.rows[0] ? this.mapToEntity(row.rows[0]) : null;
  }

  async findByConversation(
    conversationId: string,
    tenantId: string,
    limit?: number,
    offset?: number
  ): Promise<WhatsAppMessage[]> {
    const rows = await this.pool.query(
      `SELECT * FROM whatsapp_messages 
       WHERE conversation_id = $1 AND tenant_id = $2
       ORDER BY provider_timestamp DESC
       LIMIT $3 OFFSET $4`,
      [conversationId, tenantId, limit ?? 50, offset ?? 0]
    );
    return rows.rows.map(this.mapToEntity);
  }

  async findAll(tenantId: string, filters?: MessageFilters): Promise<WhatsAppMessage[]> {
    let query = 'SELECT * FROM whatsapp_messages WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];
    let paramCount = 1;

    if (filters?.conversationId) {
      paramCount++;
      query += ` AND conversation_id = $${paramCount}`;
      params.push(filters.conversationId);
    }

    if (filters?.direction) {
      paramCount++;
      query += ` AND direction = $${paramCount}`;
      params.push(filters.direction);
    }

    if (filters?.messageType) {
      paramCount++;
      query += ` AND message_type = $${paramCount}`;
      params.push(filters.messageType);
    }

    if (filters?.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters?.isProcessed !== undefined) {
      paramCount++;
      query += ` AND is_processed = $${paramCount}`;
      params.push(filters.isProcessed);
    }

    if (filters?.linkedLeadId) {
      paramCount++;
      query += ` AND linked_lead_id = $${paramCount}`;
      params.push(filters.linkedLeadId);
    }

    if (filters?.linkedBookingId) {
      paramCount++;
      query += ` AND linked_booking_id = $${paramCount}`;
      params.push(filters.linkedBookingId);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const rows = await this.pool.query(query, params);
    return rows.rows.map(this.mapToEntity);
  }

  async findUnprocessed(tenantId: string, limit?: number): Promise<WhatsAppMessage[]> {
    const rows = await this.pool.query(
      `SELECT * FROM whatsapp_messages 
       WHERE tenant_id = $1 AND is_processed = FALSE
       ORDER BY created_at ASC
       LIMIT $2`,
      [tenantId, limit ?? 100]
    );
    return rows.rows.map(this.mapToEntity);
  }

  async findRequiringResponse(tenantId: string): Promise<WhatsAppMessage[]> {
    const rows = await this.pool.query(
      `SELECT * FROM whatsapp_messages 
       WHERE tenant_id = $1 
         AND requires_response = TRUE
         AND direction = 'INBOUND'
       ORDER BY created_at ASC`,
      [tenantId]
    );
    return rows.rows.map(this.mapToEntity);
  }

  async save(message: WhatsAppMessage): Promise<WhatsAppMessage> {
    await this.pool.query(
      `INSERT INTO whatsapp_messages (
        id, tenant_id, conversation_id, provider_message_id, provider_timestamp,
        direction, sender_phone, recipient_phone, message_type,
        text_content, media_content, location_content, contact_content,
        interactive_content, template_content,
        reply_to_message_id, selected_button_id, selected_list_item_id,
        status, status_timestamps, failure_reason,
        linked_lead_id, linked_booking_id, linked_trip_id, handled_by_user_id,
        is_processed, processing_error, requires_response,
        idempotency_key, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
      )
      ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        message.id,
        message.tenantId,
        message.conversationId,
        message.providerMessageId,
        message.providerTimestamp,
        message.direction,
        message.senderPhone,
        message.recipientPhone,
        message.messageType,
        JSON.stringify(message.textContent),
        JSON.stringify(message.mediaContent),
        JSON.stringify(message.locationContent),
        JSON.stringify(message.contactContent),
        JSON.stringify(message.interactiveContent),
        JSON.stringify(message.templateContent),
        message.replyToMessageId,
        message.selectedButtonId,
        message.selectedListItemId,
        message.status,
        JSON.stringify(message.statusTimestamps),
        message.failureReason,
        message.linkedLeadId,
        message.linkedBookingId,
        message.linkedTripId,
        message.handledByUserId,
        message.isProcessed,
        message.processingError,
        message.requiresResponse,
        message.idempotencyKey,
        message.createdAt,
        message.updatedAt,
      ]
    );

    return message;
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: DeliveryStatus,
    timestamp?: Date,
    errorReason?: string
  ): Promise<void> {
    const statusKey = status.toLowerCase();
    
    await this.pool.query(
      `UPDATE whatsapp_messages SET
        status = $3,
        status_timestamps = status_timestamps || $4::jsonb,
        failure_reason = COALESCE($5, failure_reason),
        updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [
        id,
        tenantId,
        status,
        JSON.stringify({ [statusKey]: timestamp || new Date() }),
        errorReason,
      ]
    );
  }

  async markProcessed(id: string, tenantId: string, error?: string): Promise<void> {
    await this.pool.query(
      `UPDATE whatsapp_messages SET
        is_processed = TRUE,
        processing_error = $3,
        updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId, error]
    );
  }

  async linkToEntities(
    id: string,
    tenantId: string,
    links: { leadId?: string; bookingId?: string; tripId?: string }
  ): Promise<void> {
    await this.pool.query(
      `UPDATE whatsapp_messages SET
        linked_lead_id = COALESCE($3, linked_lead_id),
        linked_booking_id = COALESCE($4, linked_booking_id),
        linked_trip_id = COALESCE($5, linked_trip_id),
        updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId, links.leadId, links.bookingId, links.tripId]
    );
  }

  async getStats(tenantId: string, fromDate: Date, toDate: Date): Promise<MessageStats> {
    const result = await this.pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE direction = 'OUTBOUND') as total_sent,
        COUNT(*) FILTER (WHERE direction = 'INBOUND') as total_received,
        COUNT(*) FILTER (WHERE status = 'FAILED') as total_failed,
        COUNT(*) FILTER (WHERE direction = 'INBOUND' AND requires_response = TRUE) as unread_count
       FROM whatsapp_messages
       WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3`,
      [tenantId, fromDate, toDate]
    );

    const row = result.rows[0];
    return {
      totalSent: parseInt(row.total_sent),
      totalReceived: parseInt(row.total_received),
      totalFailed: parseInt(row.total_failed),
      avgResponseTimeMinutes: 0, // Would require more complex query
      unreadCount: parseInt(row.unread_count),
    };
  }

  async countByConversation(conversationId: string, tenantId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM whatsapp_messages WHERE conversation_id = $1 AND tenant_id = $2',
      [conversationId, tenantId]
    );
    return parseInt(result.rows[0].count);
  }

  async deleteOlderThan(tenantId: string, beforeDate: Date): Promise<number> {
    const result = await this.pool.query(
      'DELETE FROM whatsapp_messages WHERE tenant_id = $1 AND created_at < $2',
      [tenantId, beforeDate]
    );
    return result.rowCount || 0;
  }

  private mapToEntity(row: Record<string, unknown>): WhatsAppMessage {
    return WhatsAppMessage.fromPersistence({
      id: row.id as string,
      tenantId: row.tenant_id as string,
      conversationId: row.conversation_id as string,
      providerMessageId: row.provider_message_id as string,
      providerTimestamp: new Date(row.provider_timestamp as string),
      direction: row.direction as any,
      senderPhone: row.sender_phone as string,
      recipientPhone: row.recipient_phone as string,
      messageType: row.message_type as any,
      textContent: row.text_content as any,
      mediaContent: row.media_content as any,
      locationContent: row.location_content as any,
      contactContent: row.contact_content as any,
      interactiveContent: row.interactive_content as any,
      templateContent: row.template_content as any,
      replyToMessageId: row.reply_to_message_id as string,
      selectedButtonId: row.selected_button_id as string,
      selectedListItemId: row.selected_list_item_id as string,
      status: row.status as any,
      statusTimestamps: row.status_timestamps as any,
      failureReason: row.failure_reason as string,
      linkedLeadId: row.linked_lead_id as string,
      linkedBookingId: row.linked_booking_id as string,
      linkedTripId: row.linked_trip_id as string,
      handledByUserId: row.handled_by_user_id as string,
      isProcessed: row.is_processed as boolean,
      processingError: row.processing_error as string,
      requiresResponse: row.requires_response as boolean,
      idempotencyKey: row.idempotency_key as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    });
  }
}
