// application/services/whatsapp/ConversationService.ts
// Core conversation context management

import {
  ConversationContext,
  ConversationActorType,
  LinkedEntityType,
  ConversationState,
  LinkedEntity,
  WorkflowProgress,
  ActiveWorkflow,
} from '../../../domain/entities/whatsapp/index.js';
import {
  IConversationRepository,
  ConversationFilters,
} from '../../../domain/interfaces/whatsapp/index.js';
import {
  ConversationDTO,
  ConversationDetailDTO,
} from '../../dtos/whatsapp/index.js';

// Existing system services - NO MODIFICATIONS
import { LeadService } from '../LeadService.js';
import { BookingService } from '../BookingService.js';
import { ContactService } from '../ContactService.js';

/**
 * ConversationService - Manages WhatsApp conversation contexts
 * 
 * CRITICAL RULE: This service only manages context.
 * Business logic remains in existing services.
 */
export class ConversationService {
  constructor(
    private conversationRepo: IConversationRepository,
    private leadService: LeadService,
    private bookingService: BookingService,
    private contactService: ContactService
  ) {}

  /**
   * Get or create conversation context for a phone number
   */
  async getOrCreateContext(
    tenantId: string,
    phoneNumber: string,
    actorType: ConversationActorType = 'CUSTOMER'
  ): Promise<ConversationContext> {
    // Try to find existing active conversation
    let context = await this.conversationRepo.findActiveByPhone(phoneNumber, tenantId);
    
    if (context && context.isSessionValid) {
      return context;
    }

    // Try to identify the phone number from existing contacts
    const identity = await this.identifyPhone(tenantId, phoneNumber);

    // Create new conversation context
    const newContext = ConversationContext.create({
      tenantId,
      whatsappThreadId: `wa_${Date.now()}_${phoneNumber}`,
      primaryActor: {
        actorType,
        contactId: identity.contactId,
        phoneNumber,
        displayName: identity.displayName || phoneNumber,
      },
      participants: [],
      linkedEntities: identity.linkedEntities,
      primaryEntity: identity.linkedEntities[0],
      state: 'IDLE',
      lastActivityAt: new Date(),
      sessionStartedAt: new Date(),
      sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      messageCount: 0,
      isOptedIn: true,
      isEscalated: false,
      requiresHumanReview: false,
    });

    return this.conversationRepo.save(newContext);
  }

  /**
   * Link conversation to a business entity
   */
  async linkToEntity(
    conversationId: string,
    tenantId: string,
    entityType: LinkedEntityType,
    entityId: string,
    makePrimary: boolean = false
  ): Promise<ConversationContext> {
    return this.conversationRepo.linkEntity(
      conversationId,
      tenantId,
      entityType,
      entityId,
      makePrimary
    );
  }

  /**
   * Start a multi-step workflow
   */
  async startWorkflow(
    conversationId: string,
    tenantId: string,
    workflow: ActiveWorkflow,
    totalSteps: number
  ): Promise<ConversationContext> {
    const context = await this.conversationRepo.findById(conversationId, tenantId);
    if (!context) throw new Error('Conversation not found');

    const workflowProgress: WorkflowProgress = {
      workflow,
      currentStep: 'start',
      totalSteps,
      stepIndex: 0,
      collectedData: {},
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
    };

    const updated = ConversationContext.create({
      ...context,
      state: 'COLLECTING_INFO',
      workflowProgress,
      updatedAt: new Date(),
    });

    return this.conversationRepo.save(updated);
  }

  /**
   * Update workflow step and collected data
   */
  async updateWorkflowStep(
    conversationId: string,
    tenantId: string,
    stepName: string,
    stepIndex: number,
    collectedData: Record<string, unknown>
  ): Promise<ConversationContext> {
    const context = await this.conversationRepo.findById(conversationId, tenantId);
    if (!context || !context.workflowProgress) {
      throw new Error('No active workflow');
    }

    const updatedProgress: WorkflowProgress = {
      ...context.workflowProgress,
      currentStep: stepName,
      stepIndex,
      collectedData: {
        ...context.workflowProgress.collectedData,
        ...collectedData,
      },
    };

    const updated = ConversationContext.create({
      ...context,
      workflowProgress: updatedProgress,
      updatedAt: new Date(),
    });

    return this.conversationRepo.save(updated);
  }

  /**
   * Complete workflow and transition state
   */
  async completeWorkflow(
    conversationId: string,
    tenantId: string
  ): Promise<ConversationContext> {
    const context = await this.conversationRepo.findById(conversationId, tenantId);
    if (!context) throw new Error('Conversation not found');

    const updated = ConversationContext.create({
      ...context,
      state: 'COMPLETED',
      workflowProgress: undefined,
      updatedAt: new Date(),
    });

    return this.conversationRepo.save(updated);
  }

  /**
   * Escalate conversation to human
   */
  async escalate(
    conversationId: string,
    tenantId: string,
    reason: string
  ): Promise<ConversationContext> {
    const context = await this.conversationRepo.findById(conversationId, tenantId);
    if (!context) throw new Error('Conversation not found');

    const updated = ConversationContext.create({
      ...context,
      state: 'ESCALATED',
      isEscalated: true,
      providerMetadata: {
        ...context.providerMetadata,
        escalationReason: reason,
        escalatedAt: new Date(),
      },
      updatedAt: new Date(),
    });

    return this.conversationRepo.save(updated);
  }

  /**
   * Get conversations list (for inbox view)
   */
  async getConversations(
    tenantId: string,
    filters?: ConversationFilters
  ): Promise<ConversationDTO[]> {
    const contexts = await this.conversationRepo.findAll(tenantId, filters);
    
    // Map to DTOs - actual implementation would join with messages
    return contexts.map(ctx => ({
      id: ctx.id,
      tenantId: ctx.tenantId,
      phoneNumber: ctx.primaryActor.phoneNumber,
      displayName: ctx.primaryActor.displayName,
      state: ctx.state,
      linkedEntityType: ctx.primaryEntity?.type,
      linkedEntityId: ctx.primaryEntity?.entityId,
      lastMessageAt: ctx.lastActivityAt,
      lastMessagePreview: '', // Would be populated from message repo
      unreadCount: 0, // Would be calculated
      isEscalated: ctx.isEscalated,
      assignedToUserId: undefined,
      assignedToName: undefined,
    }));
  }

  /**
   * Record message activity
   */
  async recordActivity(conversationId: string, tenantId: string): Promise<void> {
    await this.conversationRepo.recordActivity(conversationId, tenantId);
  }

  /**
   * Identify phone number from CRM data
   */
  private async identifyPhone(
    tenantId: string,
    phoneNumber: string
  ): Promise<{
    contactId?: string;
    displayName?: string;
    linkedEntities: LinkedEntity[];
  }> {
    try {
      // Check CRM contacts
      const contacts = await this.contactService.searchByPhone(tenantId, phoneNumber);
      
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        const linkedEntities: LinkedEntity[] = [];

        // Check for active leads/bookings
        // This would call existing services to find linked entities

        return {
          contactId: contact.id,
          displayName: `${contact.firstName} ${contact.lastName}`.trim(),
          linkedEntities,
        };
      }

      return { linkedEntities: [] };
    } catch {
      return { linkedEntities: [] };
    }
  }
}
