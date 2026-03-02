// presentation/controllers/whatsapp/ConversationController.ts

import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

export function createConversationController(
    conversationService: any, messageService: any, timelineService: any,
    conversationRepo: any, optInRepo?: any, pool?: Pool
) {
    const list = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const filters = { state: req.query.state, isEscalated: req.query.escalated === 'true' ? true : undefined, phoneNumber: req.query.phone, limit: req.query.limit ? parseInt(req.query.limit) : 50, offset: req.query.offset ? parseInt(req.query.offset) : 0 };
            const conversations = await conversationService.getConversations(tenantId, filters);
            res.json({ data: conversations, pagination: { limit: filters.limit, offset: filters.offset } });
        } catch (error) { next(error); }
    };

    const getById = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const { id } = req.params;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const conversation = await conversationRepo.findById(id, tenantId);
            if (!conversation) { res.status(404).json({ error: 'Conversation not found' }); return; }
            const [messages, timeline] = await Promise.all([
                messageService.getMessagesByConversation(id, tenantId),
                timelineService.getTimelineByConversation(id, tenantId),
            ]);
            res.json({ data: { conversation, messages, timeline } });
        } catch (error) { next(error); }
    };

    const sendMessage = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const userId = req.context?.userId;
            const { id } = req.params;
            const { text, recipientPhone } = req.body;
            if (!tenantId) { res.status(401).json({ error: 'Authentication required' }); return; }
            let phone = recipientPhone;
            if (!phone && id) { const conv = await conversationRepo.findById(id, tenantId); if (conv) phone = conv.primaryActor?.phoneNumber || conv.externalId; }
            if (!phone) { res.status(400).json({ error: 'Could not resolve recipient phone' }); return; }
            if (optInRepo) { const optIn = await optInRepo.findByPhone(phone, tenantId); if (!optIn || optIn.status !== 'OPTED_IN') { res.status(403).json({ error: 'Recipient has not opted in to receive WhatsApp messages', code: 'NO_OPT_IN' }); return; } }
            const result = await messageService.sendText({ tenantId, recipientPhone: phone, text, senderUserId: userId || 'system', linkTo: id ? { type: 'LEAD', entityId: id } : undefined });
            if (!result.success) { res.status(400).json({ error: result.error }); return; }
            res.json({ data: result });
        } catch (error) { next(error); }
    };

    const sendTemplate = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId; const userId = req.context?.userId;
            const { recipientPhone, templateName, language, variables } = req.body;
            if (!tenantId || !userId) { res.status(401).json({ error: 'Authentication required' }); return; }
            const result = await messageService.sendTemplate({ tenantId, recipientPhone, templateName, language, variables, senderUserId: userId });
            if (!result.success) { res.status(400).json({ error: result.error }); return; }
            res.json({ data: result });
        } catch (error) { next(error); }
    };

    const linkEntity = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId; const { id } = req.params; const { entityType, entityId, makePrimary } = req.body; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } const updated = await conversationService.linkToEntity(id, tenantId, entityType, entityId, makePrimary); res.json({ data: updated }); } catch (error) { next(error); }
    };

    const escalate = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId; const { id } = req.params; const { reason } = req.body; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } const updated = await conversationService.escalate(id, tenantId, reason); res.json({ data: updated }); } catch (error) { next(error); }
    };

    const getEscalated = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } const conversations = await conversationRepo.findPendingReview(tenantId); res.json({ data: conversations }); } catch (error) { next(error); }
    };

    const assignOperator = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } res.json({ success: true, message: 'Operator assignment would be implemented with full conversation management' }); } catch (error) { next(error); }
    };

    const close = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const { id } = req.params;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const conversation = await conversationRepo.findById(id, tenantId);
            if (!conversation) { res.status(404).json({ error: 'Conversation not found' }); return; }
            const updated = await conversationRepo.updateState(id, tenantId, 'COMPLETED');
            res.json({ data: updated });
        } catch (error) { next(error); }
    };

    const startNew = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const { phoneNumber, displayName } = req.body;
            if (!phoneNumber) { res.status(400).json({ error: 'phoneNumber is required' }); return; }
            const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');

            // Auto opt-in the phone number
            if (pool) {
                try {
                    await pool.query(
                        `INSERT INTO whatsapp_opt_ins (id, tenant_id, phone_number, status, opt_in_date)
                         VALUES ($1, $2, $3, 'OPTED_IN', NOW())
                         ON CONFLICT DO NOTHING`,
                        [uuidv4(), tenantId, cleanPhone]
                    );
                } catch (optInError) {
                    console.warn('Auto opt-in failed (non-blocking):', optInError);
                }
            }

            const context = await conversationService.getOrCreateContext(tenantId, 'WHATSAPP', cleanPhone, 'CUSTOMER', displayName || cleanPhone);
            res.json({ data: { id: context.id, phoneNumber: cleanPhone, displayName: displayName || cleanPhone, state: context.state } });
        } catch (error) { next(error); }
    };

    const getMessages = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId; const { id } = req.params; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } const messages = await messageService.getMessagesByConversation(id, tenantId); res.json({ data: messages }); } catch (error) { next(error); }
    };

    const broadcast = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId; const userId = req.context?.userId;
            const { templateName, language, recipients } = req.body;
            if (!tenantId || !userId) { res.status(401).json({ error: 'Authentication required' }); return; }
            if (!Array.isArray(recipients) || recipients.length === 0) { res.status(400).json({ error: 'Recipients list is required' }); return; }
            const eligibleRecipients: Array<{ phone: string; variables?: any }> = [];
            const rejectedRecipients: Array<{ phone: string; reason: string }> = [];
            if (optInRepo) {
                for (const recipient of recipients) { const optIn = await optInRepo.findByPhone(recipient.phone, tenantId); if (!optIn || optIn.status !== 'OPTED_IN') { rejectedRecipients.push({ phone: recipient.phone, reason: 'Recipient is not opted in' }); continue; } eligibleRecipients.push(recipient); }
            } else { eligibleRecipients.push(...recipients); }
            if (eligibleRecipients.length === 0) { res.status(403).json({ success: false, error: 'No opted-in recipients found for broadcast', code: 'NO_OPT_IN_RECIPIENTS', rejectedRecipients }); return; }
            let successCount = 0; let failureCount = 0;
            (async () => {
                for (const recipient of eligibleRecipients) {
                    try { const result = await messageService.sendTemplate({ tenantId, recipientPhone: recipient.phone, templateName, language: language || 'en', variables: recipient.variables || {}, senderUserId: userId }); if (result.success) successCount++; else failureCount++; await new Promise(resolve => setTimeout(resolve, 100)); } catch (error) { failureCount++; console.error(`Broadcast error for ${recipient.phone}:`, error); }
                }
                console.log(`Broadcast completed: ${successCount} sent, ${failureCount} failed, ${rejectedRecipients.length} blocked (opt-in)`);
            })();
            res.json({ success: true, message: `Broadcast started for ${eligibleRecipients.length} recipients`, jobId: 'background-processing', blockedRecipients: rejectedRecipients });
        } catch (error) { next(error); }
    };

    const sendConversationTemplate = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const userId = req.context?.userId;
            const { id } = req.params;
            const { templateName, language, variables } = req.body;
            if (!tenantId || !userId) { res.status(401).json({ error: 'Authentication required' }); return; }
            if (!templateName) { res.status(400).json({ error: 'templateName is required' }); return; }

            // Resolve phone from conversation
            let phone: string | undefined;
            if (id) {
                const conv = await conversationRepo.findById(id, tenantId);
                if (conv) phone = conv.primaryActor?.phoneNumber || conv.externalId;
            }
            if (!phone) { res.status(400).json({ error: 'Could not resolve recipient phone from conversation' }); return; }

            const result = await messageService.sendTemplate({
                tenantId, recipientPhone: phone, templateName,
                language: language || 'en', variables: variables || {},
                senderUserId: userId,
            });
            if (!result.success) { res.status(400).json({ error: result.error }); return; }
            res.json({ data: result });
        } catch (error) { next(error); }
    };

    return {
        list, getById, sendMessage, sendTemplate, linkEntity, escalate, getEscalated,
        getConversations: list, getConversation: getById,
        assignOperator, close, getMessages, broadcast, startNew, sendConversationTemplate,
    };
}
