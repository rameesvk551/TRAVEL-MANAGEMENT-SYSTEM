// infrastructure/whatsapp/repositories/ConversationRepository.ts
// Repository implementation for conversation contexts

import { Pool } from 'pg';
import {
  ConversationContext,
  ConversationContextProps,
  ConversationState,
  LinkedEntityType,
  LinkedEntity,
} from '../../../domain/entities/whatsapp/index.js';
import {
  IConversationRepository,
  ConversationFilters,
} from '../../../domain/interfaces/whatsapp/index.js';

/**
 * ConversationRepository - Postgres implementation
 */
export class ConversationRepository implements IConversationRepository {
  constructor(private pool: Pool) {}

  async findById(id: string, tenantId: string): Promise<ConversationContext | null> {
    const row = await this.pool.query(
      `SELECT c.*, 
              json_agg(e.*) FILTER (WHERE e.id IS NOT NULL) as linked_entities
       FROM whatsapp_conversations c
       LEFT JOIN whatsapp_conversation_entities e ON c.id = e.conversation_id
       WHERE c.id = $1 AND c.tenant_id = $2
       GROUP BY c.id`,
      [id, tenantId]
    );
    
    return row.rows[0] ? this.mapToEntity(row.rows[0]) : null;
  }

  async findByThreadId(threadId: string, tenantId: string): Promise<ConversationContext | null> {
    const row = await this.pool.query(
      `SELECT c.*, 
              json_agg(e.*) FILTER (WHERE e.id IS NOT NULL) as linked_entities
       FROM whatsapp_conversations c
       LEFT JOIN whatsapp_conversation_entities e ON c.id = e.conversation_id
       WHERE c.whatsapp_thread_id = $1 AND c.tenant_id = $2
       GROUP BY c.id`,
      [threadId, tenantId]
    );
    
    return row.rows[0] ? this.mapToEntity(row.rows[0]) : null;
  }

  async findActiveByPhone(phoneNumber: string, tenantId: string): Promise<ConversationContext | null> {
    const row = await this.pool.query(
      `SELECT c.*, 
              json_agg(e.*) FILTER (WHERE e.id IS NOT NULL) as linked_entities
       FROM whatsapp_conversations c
       LEFT JOIN whatsapp_conversation_entities e ON c.id = e.conversation_id
       WHERE c.primary_actor_phone = $1 
         AND c.tenant_id = $2
         AND c.session_expires_at > NOW()
         AND c.state NOT IN ('COMPLETED', 'EXPIRED')
       GROUP BY c.id
       ORDER BY c.last_activity_at DESC
       LIMIT 1`,
      [phoneNumber, tenantId]
    );
    
    return row.rows[0] ? this.mapToEntity(row.rows[0]) : null;
  }

  async findByLinkedEntity(
    entityType: LinkedEntityType,
    entityId: string,
    tenantId: string
  ): Promise<ConversationContext[]> {
    const rows = await this.pool.query(
      `SELECT c.*, 
              json_agg(e2.*) FILTER (WHERE e2.id IS NOT NULL) as linked_entities
       FROM whatsapp_conversations c
       INNER JOIN whatsapp_conversation_entities e ON c.id = e.conversation_id
       LEFT JOIN whatsapp_conversation_entities e2 ON c.id = e2.conversation_id
       WHERE e.entity_type = $1 AND e.entity_id = $2 AND c.tenant_id = $3
       GROUP BY c.id
       ORDER BY c.last_activity_at DESC`,
      [entityType, entityId, tenantId]
    );
    
    return rows.rows.map(this.mapToEntity);
  }

  async findAll(tenantId: string, filters?: ConversationFilters): Promise<ConversationContext[]> {
    let query = `
      SELECT c.*, 
             json_agg(e.*) FILTER (WHERE e.id IS NOT NULL) as linked_entities
      FROM whatsapp_conversations c
      LEFT JOIN whatsapp_conversation_entities e ON c.id = e.conversation_id
      WHERE c.tenant_id = $1
    `;
    const params: unknown[] = [tenantId];
    let paramCount = 1;

    if (filters?.state) {
      paramCount++;
      query += ` AND c.state = $${paramCount}`;
      params.push(filters.state);
    }

    if (filters?.isEscalated !== undefined) {
      paramCount++;
      query += ` AND c.is_escalated = $${paramCount}`;
      params.push(filters.isEscalated);
    }

    if (filters?.phoneNumber) {
      paramCount++;
      query += ` AND c.primary_actor_phone = $${paramCount}`;
      params.push(filters.phoneNumber);
    }

    query += ` GROUP BY c.id ORDER BY c.last_activity_at DESC`;

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

  async findPendingReview(tenantId: string): Promise<ConversationContext[]> {
    const rows = await this.pool.query(
      `SELECT c.*, 
              json_agg(e.*) FILTER (WHERE e.id IS NOT NULL) as linked_entities
       FROM whatsapp_conversations c
       LEFT JOIN whatsapp_conversation_entities e ON c.id = e.conversation_id
       WHERE c.tenant_id = $1 AND c.requires_human_review = TRUE
       GROUP BY c.id
       ORDER BY c.last_activity_at ASC`,
      [tenantId]
    );
    
    return rows.rows.map(this.mapToEntity);
  }

  async save(context: ConversationContext): Promise<ConversationContext> {
    const existing = await this.pool.query(
      'SELECT id FROM whatsapp_conversations WHERE id = $1',
      [context.id]
    );

    if (existing.rows.length > 0) {
      // Update
      await this.pool.query(
        `UPDATE whatsapp_conversations SET
          state = $2,
          workflow_progress = $3,
          last_activity_at = $4,
          session_expires_at = $5,
          message_count = $6,
          is_opted_in = $7,
          is_escalated = $8,
          requires_human_review = $9,
          provider_metadata = $10,
          updated_at = NOW()
        WHERE id = $1`,
        [
          context.id,
          context.state,
          JSON.stringify(context.workflowProgress),
          context.lastActivityAt,
          context.sessionExpiresAt,
          context.messageCount,
          context.isOptedIn,
          context.isEscalated,
          context.requiresHumanReview,
          JSON.stringify(context.providerMetadata),
        ]
      );
    } else {
      // Insert
      await this.pool.query(
        `INSERT INTO whatsapp_conversations (
          id, tenant_id, whatsapp_thread_id,
          primary_actor_type, primary_actor_user_id, primary_actor_employee_id,
          primary_actor_contact_id, primary_actor_phone, primary_actor_name,
          state, workflow_progress, last_activity_at, session_started_at,
          session_expires_at, message_count, is_opted_in, is_escalated,
          requires_human_review, provider_metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          context.id,
          context.tenantId,
          context.whatsappThreadId,
          context.primaryActor.actorType,
          context.primaryActor.userId,
          context.primaryActor.employeeId,
          context.primaryActor.contactId,
          context.primaryActor.phoneNumber,
          context.primaryActor.displayName,
          context.state,
          JSON.stringify(context.workflowProgress),
          context.lastActivityAt,
          context.sessionStartedAt,
          context.sessionExpiresAt,
          context.messageCount,
          context.isOptedIn,
          context.isEscalated,
          context.requiresHumanReview,
          JSON.stringify(context.providerMetadata),
          context.createdAt,
          context.updatedAt,
        ]
      );
    }

    return context;
  }

  async updateState(
    id: string,
    tenantId: string,
    state: ConversationState
  ): Promise<ConversationContext> {
    await this.pool.query(
      `UPDATE whatsapp_conversations SET state = $3, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId, state]
    );
    
    const result = await this.findById(id, tenantId);
    if (!result) throw new Error('Conversation not found');
    return result;
  }

  async linkEntity(
    conversationId: string,
    tenantId: string,
    entityType: LinkedEntityType,
    entityId: string,
    isPrimary?: boolean
  ): Promise<ConversationContext> {
    // If making primary, unset other primaries first
    if (isPrimary) {
      await this.pool.query(
        `UPDATE whatsapp_conversation_entities SET is_primary = FALSE
         WHERE conversation_id = $1`,
        [conversationId]
      );
    }

    await this.pool.query(
      `INSERT INTO whatsapp_conversation_entities 
       (conversation_id, entity_type, entity_id, is_primary, linked_at, linked_by)
       VALUES ($1, $2, $3, $4, NOW(), 'SYSTEM')
       ON CONFLICT (conversation_id, entity_type, entity_id) DO UPDATE
       SET is_primary = $4`,
      [conversationId, entityType, entityId, isPrimary ?? false]
    );

    const result = await this.findById(conversationId, tenantId);
    if (!result) throw new Error('Conversation not found');
    return result;
  }

  async recordActivity(id: string, tenantId: string): Promise<void> {
    await this.pool.query(
      `UPDATE whatsapp_conversations SET 
        message_count = message_count + 1,
        last_activity_at = NOW(),
        updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
  }

  async expireStaleSessions(tenantId: string): Promise<number> {
    const result = await this.pool.query(
      `UPDATE whatsapp_conversations SET state = 'EXPIRED', updated_at = NOW()
       WHERE tenant_id = $1 
         AND session_expires_at < NOW()
         AND state NOT IN ('COMPLETED', 'EXPIRED')`,
      [tenantId]
    );
    
    return result.rowCount || 0;
  }

  async countActive(tenantId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM whatsapp_conversations
       WHERE tenant_id = $1 
         AND session_expires_at > NOW()
         AND state NOT IN ('COMPLETED', 'EXPIRED')`,
      [tenantId]
    );
    
    return parseInt(result.rows[0].count);
  }

  private mapToEntity(row: Record<string, unknown>): ConversationContext {
    const linkedEntities: LinkedEntity[] = (row.linked_entities as unknown[] || [])
      .filter(Boolean)
      .map((e: any) => ({
        type: e.entity_type,
        entityId: e.entity_id,
        linkedAt: new Date(e.linked_at),
        linkedBy: e.linked_by,
      }));

    const primaryEntity = linkedEntities.find((e: any) => 
      row.linked_entities?.find((le: any) => le.entity_id === e.entityId && le.is_primary)
    );

    return ConversationContext.fromPersistence({
      id: row.id as string,
      tenantId: row.tenant_id as string,
      whatsappThreadId: row.whatsapp_thread_id as string,
      primaryActor: {
        actorType: row.primary_actor_type as any,
        userId: row.primary_actor_user_id as string,
        employeeId: row.primary_actor_employee_id as string,
        contactId: row.primary_actor_contact_id as string,
        phoneNumber: row.primary_actor_phone as string,
        displayName: row.primary_actor_name as string,
      },
      participants: [],
      linkedEntities,
      primaryEntity,
      state: row.state as ConversationState,
      workflowProgress: row.workflow_progress as any,
      lastActivityAt: new Date(row.last_activity_at as string),
      sessionStartedAt: new Date(row.session_started_at as string),
      sessionExpiresAt: new Date(row.session_expires_at as string),
      messageCount: row.message_count as number,
      isOptedIn: row.is_opted_in as boolean,
      isEscalated: row.is_escalated as boolean,
      requiresHumanReview: row.requires_human_review as boolean,
      providerMetadata: row.provider_metadata as Record<string, unknown>,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    });
  }
}
