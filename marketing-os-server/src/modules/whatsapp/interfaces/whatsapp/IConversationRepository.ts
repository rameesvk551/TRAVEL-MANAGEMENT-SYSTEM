// domain/interfaces/whatsapp/IConversationRepository.ts
// Repository interface for conversation context

import {
  ConversationContext,
  ConversationContextProps,
  ConversationState,
  LinkedEntityType,
  CommunicationChannel,
} from '../../models/whatsapp/ConversationContext.js';

export interface ConversationFilters {
  channel?: CommunicationChannel;
  state?: ConversationState;
  linkedEntityType?: LinkedEntityType;
  linkedEntityId?: string;
  phoneNumber?: string;
  externalId?: string;
  isEscalated?: boolean;
  requiresHumanReview?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface IConversationRepository {
  /**
   * Find conversation by ID
   */
  findById(id: string, tenantId: string): Promise<ConversationContext | null>;

  /**
   * Find conversation by External Thread ID (Provider ID)
   */
  findByExternalId(
    externalId: string,
    channel: CommunicationChannel,
    tenantId: string
  ): Promise<ConversationContext | null>;

  /**
   * DEPRECATED: Use findByExternalId with channel='WHATSAPP'
   */
  findByThreadId(threadId: string, tenantId: string): Promise<ConversationContext | null>;

  /**
   * Find active conversation for a phone number (mostly for WhatsApp)
   */
  findActiveByPhone(phoneNumber: string, tenantId: string): Promise<ConversationContext | null>;

  /**
   * Find conversations linked to a business entity
   */
  findByLinkedEntity(
    entityType: LinkedEntityType,
    entityId: string,
    tenantId: string
  ): Promise<ConversationContext[]>;

  /**
   * Find conversations by filters
   */
  findAll(tenantId: string, filters?: ConversationFilters): Promise<ConversationContext[]>;

  /**
   * Find conversations requiring human review
   */
  findPendingReview(tenantId: string): Promise<ConversationContext[]>;

  /**
   * Save conversation (create or update)
   */
  save(context: ConversationContext): Promise<ConversationContext>;

  /**
   * Update conversation state
   */
  updateState(
    id: string,
    tenantId: string,
    state: ConversationState
  ): Promise<ConversationContext>;

  /**
   * Link conversation to business entity
   */
  linkEntity(
    conversationId: string,
    tenantId: string,
    entityType: LinkedEntityType,
    entityId: string,
    isPrimary?: boolean
  ): Promise<ConversationContext>;

  /**
   * Increment message count and update last activity
   */
  recordActivity(id: string, tenantId: string): Promise<void>;

  /**
   * Expire stale sessions
   */
  expireStaleSessions(tenantId: string): Promise<number>;

  /**
   * Count active conversations
   */
  countActive(tenantId: string): Promise<number>;
}
