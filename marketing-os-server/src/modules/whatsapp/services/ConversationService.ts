// application/services/whatsapp/ConversationService.ts
// Core conversation context management

import {
    ActiveWorkflow,
    CommunicationChannel,
    ConversationActorType,
    ConversationContext,
    LinkedEntityType,
} from '../models/index.js';
import { IConversationRepository, IMessageRepository } from '../interfaces/whatsapp/index.js';

export function createConversationService(
    conversationRepo: IConversationRepository,
    messageRepo: IMessageRepository,
    leadService: any,
    bookingService: any,
    contactService: any
) {

    async function identifyPhone(tenantId: string, phoneNumber: string) {
        try {
            const contact = await contactService.findOrCreate(phoneNumber, tenantId);
            if (contact) {
                const linkedEntities: any[] = [];
                return { contactId: contact.id, displayName: contact.fullName, linkedEntities };
            }
            return { linkedEntities: [] };
        } catch {
            return { linkedEntities: [] };
        }
    }

    async function getOrCreateContext(
        tenantId: string,
        channel: CommunicationChannel,
        externalId: string,
        actorType: ConversationActorType = 'CUSTOMER',
        displayName?: string
    ) {
        let context = await conversationRepo.findByExternalId(externalId, channel, tenantId);
        if (context && context.isSessionValid) return context;

        let identity: any = { linkedEntities: [] };
        if (channel === 'WHATSAPP') identity = await identifyPhone(tenantId, externalId);

        const newContext = ConversationContext.create({
            tenantId, channel, externalId,
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
            messageCount: 0, isOptedIn: true, isEscalated: false, requiresHumanReview: false,
        });
        return conversationRepo.save(newContext);
    }

    async function linkToEntity(conversationId: string, tenantId: string, entityType: LinkedEntityType, entityId: string, makePrimary: boolean = false) {
        return conversationRepo.linkEntity(conversationId, tenantId, entityType, entityId, makePrimary);
    }

    async function startWorkflow(conversationId: string, tenantId: string, workflow: ActiveWorkflow, totalSteps: number) {
        const context = await conversationRepo.findById(conversationId, tenantId);
        if (!context) throw new Error('Conversation not found');
        const workflowProgress = {
            workflow, currentStep: 'start', totalSteps, stepIndex: 0, collectedData: {},
            startedAt: new Date(), expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        };
        const updated = ConversationContext.create({ ...context, state: 'COLLECTING_INFO', workflowProgress, updatedAt: new Date() });
        return conversationRepo.save(updated);
    }

    async function updateWorkflowStep(conversationId: string, tenantId: string, stepName: string, stepIndex: number, collectedData: any) {
        const context = await conversationRepo.findById(conversationId, tenantId);
        if (!context || !context.workflowProgress) throw new Error('No active workflow');
        const updatedProgress = {
            ...context.workflowProgress, currentStep: stepName, stepIndex,
            collectedData: { ...context.workflowProgress.collectedData, ...collectedData },
        };
        const updated = ConversationContext.create({ ...context, workflowProgress: updatedProgress, updatedAt: new Date() });
        return conversationRepo.save(updated);
    }

    async function completeWorkflow(conversationId: string, tenantId: string) {
        const context = await conversationRepo.findById(conversationId, tenantId);
        if (!context) throw new Error('Conversation not found');
        const updated = ConversationContext.create({ ...context, state: 'COMPLETED', workflowProgress: undefined, updatedAt: new Date() });
        return conversationRepo.save(updated);
    }

    async function escalate(conversationId: string, tenantId: string, reason: string) {
        const context = await conversationRepo.findById(conversationId, tenantId);
        if (!context) throw new Error('Conversation not found');
        const updated = ConversationContext.create({
            ...context, state: 'ESCALATED', isEscalated: true,
            providerMetadata: { ...context.providerMetadata, escalationReason: reason, escalatedAt: new Date() },
            updatedAt: new Date(),
        });
        return conversationRepo.save(updated);
    }

    async function getConversations(tenantId: string, filters: any) {
        const contexts = await conversationRepo.findAll(tenantId, filters);
        const dtos = await Promise.all(
            contexts.map(async (ctx: any) => {
                const messages = await messageRepo.findByConversation(ctx.id, tenantId, 1);
                const lastMessage = messages[0];
                const unreadCount = await messageRepo.countUnread(ctx.id, tenantId);
                return {
                    id: ctx.id, tenantId: ctx.tenantId, channel: ctx.channel, externalId: ctx.externalId,
                    phoneNumber: ctx.primaryActor.phoneNumber, displayName: ctx.primaryActor.displayName,
                    state: ctx.state, linkedEntityType: ctx.primaryEntity?.type,
                    linkedEntityId: ctx.primaryEntity?.entityId, lastMessageAt: ctx.lastActivityAt,
                    lastMessagePreview: lastMessage ? lastMessage.textBody : '', unreadCount,
                    isEscalated: ctx.isEscalated, assignedToUserId: undefined, assignedToName: undefined,
                };
            })
        );
        return dtos;
    }

    async function recordActivity(conversationId: string, tenantId: string) {
        await conversationRepo.recordActivity(conversationId, tenantId);
    }

    return {
        getOrCreateContext, linkToEntity, startWorkflow, updateWorkflowStep,
        completeWorkflow, escalate, getConversations, recordActivity, identifyPhone,
    };
}
