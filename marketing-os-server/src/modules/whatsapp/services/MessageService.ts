// application/services/whatsapp/MessageService.ts
// Core message handling - inbound/outbound with real-time socket events

import { WhatsAppMessage } from '../models/index.js';

/** Callback signature for pushing real-time events via sockets */
export type EmitEventFn = (tenantId: string, conversationId: string, event: string, data: any) => void;

/** No-op emitter used when sockets are not wired yet */
const noopEmit: EmitEventFn = () => {};

export function createMessageService(
    messageRepo: any, channelFactory: any, conversationService: any, timelineService: any,
    emitEvent: EmitEventFn = noopEmit,
) {

    function getSuggestedActions(context: any, message: any) {
        const actions: string[] = [];
        if (!context.hasLinkedEntity) actions.push('CREATE_LEAD');
        if (context.primaryEntity?.type === 'LEAD') actions.push('VIEW_LEAD', 'SEND_QUOTE', 'CREATE_BOOKING');
        if (context.primaryEntity?.type === 'BOOKING') actions.push('VIEW_BOOKING', 'SEND_PAYMENT_LINK', 'SEND_REMINDER');
        return actions;
    }

    function requiresHuman(message: any) {
        const text = message.textBody.toLowerCase();
        const urgentKeywords = ['urgent', 'emergency', 'refund', 'cancel', 'complaint', 'help'];
        return urgentKeywords.some((kw: string) => text.includes(kw));
    }

    async function processInbound(dto: any) {
        const existing = await messageRepo.findByProviderMessageId(dto.providerMessageId, dto.tenantId);
        if (existing) {
            return { messageId: existing.id, conversationId: existing.conversationId, isNewConversation: false, suggestedActions: [], requiresHumanReview: false };
        }
        const context = await conversationService.getOrCreateContext(dto.tenantId, dto.channel ?? 'WHATSAPP', dto.senderPhone, 'CUSTOMER');
        const isNewConversation = context.messageCount === 0;
        const message = WhatsAppMessage.create({
            tenantId: dto.tenantId, conversationId: context.id, providerMessageId: dto.providerMessageId,
            providerTimestamp: dto.providerTimestamp, direction: 'INBOUND', senderPhone: dto.senderPhone,
            recipientPhone: dto.recipientPhone, messageType: dto.messageType,
            textContent: dto.textBody ? { body: dto.textBody } : undefined,
            mediaContent: dto.mediaUrl ? { mediaId: dto.providerMessageId, mimeType: 'unknown', downloadUrl: dto.mediaUrl, caption: dto.mediaCaption } : undefined,
            locationContent: dto.locationLat ? { latitude: dto.locationLat, longitude: dto.locationLng } : undefined,
            selectedButtonId: dto.selectedButtonId, selectedListItemId: dto.selectedListItemId,
            replyToMessageId: dto.replyToMessageId, status: 'DELIVERED',
            statusTimestamps: { delivered: new Date() }, isProcessed: false, requiresResponse: true,
            idempotencyKey: `${dto.providerMessageId}-${dto.tenantId}`,
        });
        const saved = await messageRepo.save(message);
        await conversationService.recordActivity(context.id, dto.tenantId);
        await timelineService.recordWhatsAppMessage(saved, context, 'INBOUND');
        try { const adapter = channelFactory.getAdapter(context.channel); await adapter.markAsRead(context, dto.providerMessageId); } catch (e) { console.warn('Failed to mark as read:', e); }
        const suggestedActions = getSuggestedActions(context, message);
        const requiresHumanReview = requiresHuman(message);

        // ── Real-time: push inbound message to connected clients ──
        emitEvent(dto.tenantId, context.id, 'whatsapp:message', {
            id: saved.id,
            conversationId: context.id,
            direction: 'INBOUND',
            type: dto.messageType,
            content: { body: dto.textBody },
            senderPhone: dto.senderPhone,
            timestamp: new Date().toISOString(),
            status: 'DELIVERED',
        });

        // ── Real-time: notify conversation list update ──
        emitEvent(dto.tenantId, context.id, 'whatsapp:conversation_updated', {
            conversationId: context.id,
            lastMessagePreview: dto.textBody?.slice(0, 80),
            lastMessageAt: new Date().toISOString(),
            isNewConversation,
        });

        return {
            messageId: saved.id, conversationId: context.id, isNewConversation,
            linkedTo: context.primaryEntity ? { type: context.primaryEntity.type, entityId: context.primaryEntity.entityId } : undefined,
            suggestedActions, requiresHumanReview,
        };
    }

    async function getMessagesByConversation(conversationId: string, tenantId: string, params?: any) {
        return messageRepo.findByConversation(conversationId, tenantId, params);
    }

    async function sendText(dto: any) {
        const context = await conversationService.getOrCreateContext(dto.tenantId, dto.channel ?? 'WHATSAPP', dto.recipientPhone, 'SALES_AGENT');
        const adapter = channelFactory.getAdapter(context.channel);
        const providerMessageId = await adapter.sendMessage(context, dto.text, { replyToMessageId: dto.replyToMessageId });
        const message = WhatsAppMessage.create({
            tenantId: dto.tenantId, conversationId: context.id, providerMessageId, providerTimestamp: new Date(),
            direction: 'OUTBOUND', senderPhone: dto.recipientPhone, recipientPhone: dto.recipientPhone,
            messageType: 'TEXT', textContent: { body: dto.text }, status: 'SENT',
            statusTimestamps: { sent: new Date() }, handledByUserId: dto.senderUserId,
            isProcessed: true, requiresResponse: false, idempotencyKey: `${providerMessageId}-${dto.tenantId}`,
        });
        const saved = await messageRepo.save(message);
        if (dto.linkTo) await conversationService.linkToEntity(context.id, dto.tenantId, dto.linkTo.type, dto.linkTo.entityId);
        await timelineService.recordWhatsAppMessage(saved, context, 'OUTBOUND');

        // ── Real-time: push outbound message to all connected agents ──
        emitEvent(dto.tenantId, context.id, 'whatsapp:message', {
            id: saved.id,
            conversationId: context.id,
            direction: 'OUTBOUND',
            type: 'TEXT',
            content: { body: dto.text },
            recipientPhone: dto.recipientPhone,
            timestamp: new Date().toISOString(),
            status: 'SENT',
        });

        emitEvent(dto.tenantId, context.id, 'whatsapp:conversation_updated', {
            conversationId: context.id,
            lastMessagePreview: dto.text?.slice(0, 80),
            lastMessageAt: new Date().toISOString(),
        });

        return { success: true, messageId: saved.id, providerMessageId };
    }

    async function sendTemplate(dto: any) {
        const context = await conversationService.getOrCreateContext(dto.tenantId, dto.channel ?? 'WHATSAPP', dto.recipientPhone, 'SALES_AGENT');
        const adapter = channelFactory.getAdapter(context.channel);
        const providerMessageId = await adapter.sendTemplate(context, dto.templateName, dto.language || 'en', dto.variables);
        const message = WhatsAppMessage.create({
            tenantId: dto.tenantId, conversationId: context.id, providerMessageId, providerTimestamp: new Date(),
            direction: 'OUTBOUND', senderPhone: dto.recipientPhone, recipientPhone: dto.recipientPhone,
            messageType: 'TEMPLATE', templateContent: { templateName: dto.templateName, language: dto.language || 'en', components: [] },
            status: 'SENT', statusTimestamps: { sent: new Date() }, handledByUserId: dto.senderUserId,
            isProcessed: true, requiresResponse: false, idempotencyKey: `${providerMessageId}-${dto.tenantId}`,
        });
        const saved = await messageRepo.save(message);

        // ── Real-time: push template message to all connected agents ──
        emitEvent(dto.tenantId, context.id, 'whatsapp:message', {
            id: saved.id,
            conversationId: context.id,
            direction: 'OUTBOUND',
            type: 'TEMPLATE',
            content: { body: `📋 Template: ${dto.templateName}` },
            metadata: { templateName: dto.templateName },
            recipientPhone: dto.recipientPhone,
            timestamp: new Date().toISOString(),
            status: 'SENT',
        });

        emitEvent(dto.tenantId, context.id, 'whatsapp:conversation_updated', {
            conversationId: context.id,
            lastMessagePreview: `📋 Template: ${dto.templateName}`,
            lastMessageAt: new Date().toISOString(),
        });

        return { success: true, messageId: saved.id, providerMessageId };
    }

    async function sendInteractive(dto: any) { throw new Error("Interactive messages refactoring pending."); }

    /**
     * Handle delivery-status webhooks from Meta (sent → delivered → read → failed).
     * Persists the new status and pushes a real-time 'whatsapp:status' event so the
     * UI can update tick marks instantly without polling.
     */
    async function handleStatusUpdate(update: any) {
        const status = update.status === 'sent' ? 'SENT'
            : update.status === 'delivered' ? 'DELIVERED'
            : update.status === 'read' ? 'READ'
            : 'FAILED';

        // Find the message by its provider-side ID
        const existing = await messageRepo.findByProviderMessageId(
            update.providerMessageId,
            update.tenantId
        );
        if (!existing) return;

        // Persist to DB
        await messageRepo.updateStatus(
            existing.id,
            existing.tenantId,
            status,
            update.timestamp ? new Date(update.timestamp) : new Date(),
            update.errorCode
        );

        // ── Real-time: push status change so UI updates tick marks instantly ──
        emitEvent(existing.tenantId, existing.conversationId, 'whatsapp:status', {
            messageId: existing.id,
            conversationId: existing.conversationId,
            providerMessageId: update.providerMessageId,
            status,
            timestamp: new Date().toISOString(),
        });
    }

    return { processInbound, getMessagesByConversation, sendText, sendTemplate, sendInteractive, handleStatusUpdate, getSuggestedActions, requiresHuman };
}
