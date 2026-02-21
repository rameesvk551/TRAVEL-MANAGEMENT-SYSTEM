// application/services/whatsapp/ConversationService.ts
// Core conversation context management

import { ConversationContext } from '../models/index.js';
import { IConversationRepository, IMessageRepository } from '../interfaces/whatsapp/index.js';

/**
 * ConversationService - Manages WhatsApp conversation contexts
 *
 * CRITICAL RULE: This service only manages context.
 * Business logic remains in existing services.
 */
export class ConversationService {
    constructor(
        private conversationRepo: IConversationRepository,
        private messageRepo: IMessageRepository,
        private leadService: any,
        private bookingService: any,
        private contactService: any
    ) { }

    /**
     * Get or create conversation context for a channel
     */
    async getOrCreateContext(
        tenantId: string,
        channel: string,
        externalId: string,
        actorType: string = 'CUSTOMER',
        displayName?: string
    ) {
        let context = await this.conversationRepo.findByExternalId(externalId, channel, tenantId);

        if (context && context.isSessionValid) {
            return context;
        }

        let identity: any = { linkedEntities: [] };
        if (channel === 'WHATSAPP') {
            identity = await this.identifyPhone(tenantId, externalId);
        }

        const newContext = ConversationContext.create({
            tenantId,
            channel,
            externalId,
            primaryActor: {
                actorType,
                contactId: identity.contactId,
                phoneNumber: channel === 'WHATSAPP' ? externalId : undefined,
                socialId: channel !== 'WHATSAPP' ? externalId : undefined,
                displayName: displayName || identity.displayName || externalId,
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

    async linkToEntity(conversationId: string, tenantId: string, entityType: string, entityId: string, makePrimary: boolean = false) {
        return this.conversationRepo.linkEntity(conversationId, tenantId, entityType, entityId, makePrimary);
    }

    async startWorkflow(conversationId: string, tenantId: string, workflow: string, totalSteps: number) {
        const context = await this.conversationRepo.findById(conversationId, tenantId);
        if (!context) throw new Error('Conversation not found');

        const workflowProgress = {
            workflow,
            currentStep: 'start',
            totalSteps,
            stepIndex: 0,
            collectedData: {},
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        };

        const updated = ConversationContext.create({
            ...context,
            state: 'COLLECTING_INFO',
            workflowProgress,
            updatedAt: new Date(),
        });

        return this.conversationRepo.save(updated);
    }

    async updateWorkflowStep(conversationId: string, tenantId: string, stepName: string, stepIndex: number, collectedData: any) {
        const context = await this.conversationRepo.findById(conversationId, tenantId);
        if (!context || !context.workflowProgress) {
            throw new Error('No active workflow');
        }

        const updatedProgress = {
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

    async completeWorkflow(conversationId: string, tenantId: string) {
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

    async escalate(conversationId: string, tenantId: string, reason: string) {
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

    async getConversations(tenantId: string, filters: any) {
        const contexts = await this.conversationRepo.findAll(tenantId, filters);

        const dtos = await Promise.all(
            contexts.map(async (ctx: any) => {
                const messages = await this.messageRepo.findByConversation(ctx.id, tenantId, 1);
                const lastMessage = messages[0];
                const unreadCount = await this.messageRepo.countUnread(ctx.id, tenantId);

                return {
                    id: ctx.id,
                    tenantId: ctx.tenantId,
                    channel: ctx.channel,
                    externalId: ctx.externalId,
                    phoneNumber: ctx.primaryActor.phoneNumber,
                    displayName: ctx.primaryActor.displayName,
                    state: ctx.state,
                    linkedEntityType: ctx.primaryEntity?.type,
                    linkedEntityId: ctx.primaryEntity?.entityId,
                    lastMessageAt: ctx.lastActivityAt,
                    lastMessagePreview: lastMessage ? lastMessage.textBody : '',
                    unreadCount: unreadCount,
                    isEscalated: ctx.isEscalated,
                    assignedToUserId: undefined,
                    assignedToName: undefined,
                };
            })
        );

        return dtos;
    }

    async recordActivity(conversationId: string, tenantId: string) {
        await this.conversationRepo.recordActivity(conversationId, tenantId);
    }

    async identifyPhone(tenantId: string, phoneNumber: string) {
        try {
            const contact = await this.contactService.findOrCreate(phoneNumber, tenantId);
            if (contact) {
                const linkedEntities: any[] = [];
                return {
                    contactId: contact.id,
                    displayName: contact.fullName,
                    linkedEntities,
                };
            }
            return { linkedEntities: [] };
        } catch {
            return { linkedEntities: [] };
        }
    }
}
