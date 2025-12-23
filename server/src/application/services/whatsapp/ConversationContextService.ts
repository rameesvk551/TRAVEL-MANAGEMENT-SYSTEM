// application/services/whatsapp/ConversationContextService.ts
// Manages conversation state and context

import { IWhatsAppConversationRepository } from '../../../domain/interfaces/whatsapp/IWhatsAppConversationRepository.js';
import { WhatsAppConversation, ConversationState, BoundObjectType } from '../../../domain/entities/whatsapp/WhatsAppConversation.js';

export class ConversationContextService {
  constructor(
    private conversationRepo: IWhatsAppConversationRepository
  ) {}

  /**
   * Get or create conversation for a phone number
   */
  async getOrCreateConversation(
    phoneNumber: string,
    tenantId: string,
    userId?: string
  ): Promise<WhatsAppConversation> {
    // Check for active conversation
    const existing = await this.conversationRepo.findActiveByPhoneNumber(
      phoneNumber,
      tenantId
    );

    if (existing && existing.canAcceptMessages) {
      return existing;
    }

    // Create new conversation
    const conversation = WhatsAppConversation.create({
      tenantId,
      phoneNumber,
      userId,
      currentState: 'IDLE',
      stateData: {},
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    return await this.conversationRepo.save(conversation);
  }

  /**
   * Bind conversation to a business object
   */
  async bindToObject(
    conversationId: string,
    objectType: BoundObjectType,
    objectId: string,
    tenantId: string
  ): Promise<void> {
    const conversation = await this.conversationRepo.findById(conversationId, tenantId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const updated = WhatsAppConversation.create({
      ...conversation,
      boundObjectType: objectType,
      boundObjectId: objectId,
    });

    await this.conversationRepo.save(updated);
  }

  /**
   * Update conversation state
   */
  async updateState(
    conversationId: string,
    newState: ConversationState,
    stateData: Record<string, unknown>,
    tenantId: string
  ): Promise<void> {
    await this.conversationRepo.updateState(
      conversationId,
      newState,
      stateData,
      tenantId
    );
  }

  /**
   * Complete and close conversation
   */
  async completeConversation(
    conversationId: string,
    tenantId: string
  ): Promise<void> {
    await this.conversationRepo.updateState(
      conversationId,
      'COMPLETED',
      {},
      tenantId
    );
    await this.conversationRepo.markAsInactive(conversationId, tenantId);
  }

  /**
   * Expire old conversations
   */
  async expireOldConversations(tenantId: string): Promise<number> {
    return await this.conversationRepo.expireOldConversations(tenantId);
  }

  /**
   * Get conversation by ID
   */
  async getConversation(
    conversationId: string,
    tenantId: string
  ): Promise<WhatsAppConversation | null> {
    return await this.conversationRepo.findById(conversationId, tenantId);
  }

  /**
   * Get conversations for a business object
   */
  async getConversationsForObject(
    objectType: string,
    objectId: string,
    tenantId: string
  ): Promise<WhatsAppConversation[]> {
    return await this.conversationRepo.findByBoundObject(
      objectType,
      objectId,
      tenantId
    );
  }
}
