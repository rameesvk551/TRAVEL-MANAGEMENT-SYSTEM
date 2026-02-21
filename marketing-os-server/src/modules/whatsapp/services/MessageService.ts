// application/services/whatsapp/MessageService.ts
// Core message handling - inbound/outbound

import { WhatsAppMessage } from '../models/index.js';

/**
 * MessageService - Handles all WhatsApp message operations
 */
export class MessageService {
    constructor(
        private messageRepo: any,
        private channelFactory: any,
        private conversationService: any,
        private timelineService: any
    ) { }

    async processInbound(dto: any) {
        const existing = await this.messageRepo.findByProviderMessageId(dto.providerMessageId, dto.tenantId);
        if (existing) {
            return {
                messageId: existing.id,
                conversationId: existing.conversationId,
                isNewConversation: false,
                suggestedActions: [],
                requiresHumanReview: false,
            };
        }

        const context = await this.conversationService.getOrCreateContext(
            dto.tenantId, dto.channel ?? 'WHATSAPP', dto.senderPhone, 'CUSTOMER'
        );
        const isNewConversation = context.messageCount === 0;

        const message = WhatsAppMessage.create({
            tenantId: dto.tenantId,
            conversationId: context.id,
            providerMessageId: dto.providerMessageId,
            providerTimestamp: dto.providerTimestamp,
            direction: 'INBOUND',
            senderPhone: dto.senderPhone,
            recipientPhone: dto.recipientPhone,
            messageType: dto.messageType,
            textContent: dto.textBody ? { body: dto.textBody } : undefined,
            mediaContent: dto.mediaUrl ? {
                mediaId: dto.providerMessageId,
                mimeType: 'unknown',
                downloadUrl: dto.mediaUrl,
                caption: dto.mediaCaption,
            } : undefined,
            locationContent: dto.locationLat ? {
                latitude: dto.locationLat,
                longitude: dto.locationLng,
            } : undefined,
            selectedButtonId: dto.selectedButtonId,
            selectedListItemId: dto.selectedListItemId,
            replyToMessageId: dto.replyToMessageId,
            status: 'DELIVERED',
            statusTimestamps: { delivered: new Date() },
            isProcessed: false,
            requiresResponse: true,
            idempotencyKey: `${dto.providerMessageId}-${dto.tenantId}`,
        });

        const saved = await this.messageRepo.save(message);
        await this.conversationService.recordActivity(context.id, dto.tenantId);
        await this.timelineService.recordWhatsAppMessage(saved, context, 'INBOUND');

        try {
            const adapter = this.channelFactory.getAdapter(context.channel);
            await adapter.markAsRead(context, dto.providerMessageId);
        } catch (e) {
            console.warn('Failed to mark as read:', e);
        }

        const suggestedActions = this.getSuggestedActions(context, message);
        const requiresHumanReview = this.requiresHuman(message);

        return {
            messageId: saved.id,
            conversationId: context.id,
            isNewConversation,
            linkedTo: context.primaryEntity ? {
                type: context.primaryEntity.type,
                entityId: context.primaryEntity.entityId,
            } : undefined,
            suggestedActions,
            requiresHumanReview,
        };
    }

    async getMessagesByConversation(conversationId: string, tenantId: string, params?: any) {
        return this.messageRepo.findByConversation(conversationId, tenantId, params);
    }

    async sendText(dto: any) {
        const context = await this.conversationService.getOrCreateContext(
            dto.tenantId, dto.channel ?? 'WHATSAPP', dto.recipientPhone, 'SALES_AGENT'
        );

        const adapter = this.channelFactory.getAdapter(context.channel);
        const providerMessageId = await adapter.sendMessage(context, dto.text, { replyToMessageId: dto.replyToMessageId });

        const message = WhatsAppMessage.create({
            tenantId: dto.tenantId,
            conversationId: context.id,
            providerMessageId,
            providerTimestamp: new Date(),
            direction: 'OUTBOUND',
            senderPhone: dto.recipientPhone,
            recipientPhone: dto.recipientPhone,
            messageType: 'TEXT',
            textContent: { body: dto.text },
            status: 'SENT',
            statusTimestamps: { sent: new Date() },
            handledByUserId: dto.senderUserId,
            isProcessed: true,
            requiresResponse: false,
            idempotencyKey: `${providerMessageId}-${dto.tenantId}`,
        });

        const saved = await this.messageRepo.save(message);

        if (dto.linkTo) {
            await this.conversationService.linkToEntity(context.id, dto.tenantId, dto.linkTo.type, dto.linkTo.entityId);
        }

        await this.timelineService.recordWhatsAppMessage(saved, context, 'OUTBOUND');

        return {
            success: true,
            messageId: saved.id,
            providerMessageId,
        };
    }

    async sendTemplate(dto: any) {
        const context = await this.conversationService.getOrCreateContext(
            dto.tenantId, dto.channel ?? 'WHATSAPP', dto.recipientPhone, 'SALES_AGENT'
        );

        const adapter = this.channelFactory.getAdapter(context.channel);
        const providerMessageId = await adapter.sendTemplate(context, dto.templateName, dto.language || 'en', dto.variables);

        const message = WhatsAppMessage.create({
            tenantId: dto.tenantId,
            conversationId: context.id,
            providerMessageId,
            providerTimestamp: new Date(),
            direction: 'OUTBOUND',
            senderPhone: dto.recipientPhone,
            recipientPhone: dto.recipientPhone,
            messageType: 'TEMPLATE',
            templateContent: {
                templateName: dto.templateName,
                language: dto.language || 'en',
                components: [],
            },
            status: 'SENT',
            statusTimestamps: { sent: new Date() },
            handledByUserId: dto.senderUserId,
            isProcessed: true,
            requiresResponse: false,
            idempotencyKey: `${providerMessageId}-${dto.tenantId}`,
        });

        const saved = await this.messageRepo.save(message);
        return {
            success: true,
            messageId: saved.id,
            providerMessageId,
        };
    }

    async sendInteractive(dto: any) {
        throw new Error("Interactive messages refactoring pending.");
    }

    async handleStatusUpdate(update: any) {
        const status = update.status === 'sent' ? 'SENT' :
            update.status === 'delivered' ? 'DELIVERED' :
                update.status === 'read' ? 'READ' : 'FAILED';
    }

    getSuggestedActions(context: any, message: any) {
        const actions: string[] = [];
        if (!context.hasLinkedEntity) {
            actions.push('CREATE_LEAD');
        }
        if (context.primaryEntity?.type === 'LEAD') {
            actions.push('VIEW_LEAD', 'SEND_QUOTE', 'CREATE_BOOKING');
        }
        if (context.primaryEntity?.type === 'BOOKING') {
            actions.push('VIEW_BOOKING', 'SEND_PAYMENT_LINK', 'SEND_REMINDER');
        }
        return actions;
    }

    requiresHuman(message: any) {
        const text = message.textBody.toLowerCase();
        const urgentKeywords = ['urgent', 'emergency', 'refund', 'cancel', 'complaint', 'help'];
        return urgentKeywords.some((kw: string) => text.includes(kw));
    }
}
