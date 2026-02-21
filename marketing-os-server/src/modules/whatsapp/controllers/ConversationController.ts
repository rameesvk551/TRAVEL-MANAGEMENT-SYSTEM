// presentation/controllers/whatsapp/ConversationController.ts

export class ConversationController {
    constructor(
        private conversationService: any,
        private messageService: any,
        private timelineService: any,
        private conversationRepo: any
    ) { }

    list = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const filters = { state: req.query.state, isEscalated: req.query.escalated === 'true' ? true : undefined, phoneNumber: req.query.phone, limit: req.query.limit ? parseInt(req.query.limit) : 50, offset: req.query.offset ? parseInt(req.query.offset) : 0 };
            const conversations = await this.conversationService.getConversations(tenantId, filters);
            res.json({ data: conversations, pagination: { limit: filters.limit, offset: filters.offset } });
        } catch (error) { next(error); }
    };

    getById = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const { id } = req.params;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const conversation = await this.conversationRepo.findById(id, tenantId);
            if (!conversation) { res.status(404).json({ error: 'Conversation not found' }); return; }
            const [messages, timeline] = await Promise.all([
                this.messageService.getMessagesByConversation(id, tenantId),
                this.timelineService.getTimelineByConversation(id, tenantId),
            ]);
            res.json({ data: { conversation, messages, timeline } });
        } catch (error) { next(error); }
    };

    sendMessage = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const userId = req.context?.userId;
            const { id } = req.params;
            const { text, recipientPhone } = req.body;
            if (!tenantId || !userId) { res.status(401).json({ error: 'Authentication required' }); return; }
            const result = await this.messageService.sendText({ tenantId, recipientPhone, text, senderUserId: userId, linkTo: id ? { type: 'LEAD', entityId: id } : undefined });
            if (!result.success) { res.status(400).json({ error: result.error }); return; }
            res.json({ data: result });
        } catch (error) { next(error); }
    };

    sendTemplate = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const userId = req.context?.userId;
            const { recipientPhone, templateName, language, variables } = req.body;
            if (!tenantId || !userId) { res.status(401).json({ error: 'Authentication required' }); return; }
            const result = await this.messageService.sendTemplate({ tenantId, recipientPhone, templateName, language, variables, senderUserId: userId });
            if (!result.success) { res.status(400).json({ error: result.error }); return; }
            res.json({ data: result });
        } catch (error) { next(error); }
    };

    linkEntity = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const { id } = req.params;
            const { entityType, entityId, makePrimary } = req.body;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const updated = await this.conversationService.linkToEntity(id, tenantId, entityType, entityId, makePrimary);
            res.json({ data: updated });
        } catch (error) { next(error); }
    };

    escalate = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const { id } = req.params;
            const { reason } = req.body;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const updated = await this.conversationService.escalate(id, tenantId, reason);
            res.json({ data: updated });
        } catch (error) { next(error); }
    };

    getEscalated = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const conversations = await this.conversationRepo.findPendingReview(tenantId);
            res.json({ data: conversations });
        } catch (error) { next(error); }
    };

    getConversations = this.list;
    getConversation = this.getById;

    assignOperator = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            res.json({ success: true, message: 'Operator assignment would be implemented with full conversation management' });
        } catch (error) { next(error); }
    };

    close = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            res.json({ success: true, message: 'Conversation close would be implemented with full conversation management' });
        } catch (error) { next(error); }
    };

    getMessages = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const { id } = req.params;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const messages = await this.messageService.getMessagesByConversation(id, tenantId);
            res.json({ data: messages });
        } catch (error) { next(error); }
    };

    broadcast = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const userId = req.context?.userId;
            const { templateName, language, recipients } = req.body;
            if (!tenantId || !userId) { res.status(401).json({ error: 'Authentication required' }); return; }
            if (!Array.isArray(recipients) || recipients.length === 0) { res.status(400).json({ error: 'Recipients list is required' }); return; }

            let successCount = 0; let failureCount = 0;
            (async () => {
                for (const recipient of recipients) {
                    try {
                        const result = await this.messageService.sendTemplate({ tenantId, recipientPhone: recipient.phone, templateName, language: language || 'en', variables: recipient.variables || {}, senderUserId: userId });
                        if (result.success) successCount++; else failureCount++;
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) { failureCount++; console.error(`Broadcast error for ${recipient.phone}:`, error); }
                }
                console.log(`Broadcast completed: ${successCount} sent, ${failureCount} failed`);
            })();

            res.json({ success: true, message: `Broadcast started for ${recipients.length} recipients`, jobId: 'background-processing' });
        } catch (error) { next(error); }
    };
}
