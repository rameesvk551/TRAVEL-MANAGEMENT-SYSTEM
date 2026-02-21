// presentation/controllers/whatsapp/WebhookController.ts

export class WebhookController {
    private webhookVerifyToken: string;

    constructor(
        private provider: any,
        private conversationService: any,
        private messageService: any,
        private workflowOrchestrator: any,
        private flowEngine: any,
        private tenantRepository: any
    ) {
        this.webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'marketing-os-verify-token';
    }

    verify = async (req: any, res: any) => {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode === 'subscribe' && token === this.webhookVerifyToken) {
            console.log('[Webhook] Verification successful');
            res.status(200).send(challenge);
        } else {
            console.log('[Webhook] Verification failed');
            res.status(403).send('Forbidden');
        }
    };

    handle = async (req: any, res: any, next: any) => {
        try {
            res.status(200).send('OK');
            const payload = {
                provider: this.provider.providerType, eventType: 'MESSAGE_RECEIVED', timestamp: new Date(),
                rawBody: JSON.stringify(req.body), signature: req.headers['x-hub-signature-256'], headers: req.headers,
            };
            if (!this.provider.verifyWebhookSignature(payload)) { console.error('[Webhook] Invalid signature'); return; }

            const message = this.provider.parseWebhookMessage(payload);
            if (message) {
                const tenantId = await this.resolveTenantId(message.recipientPhone);
                if (tenantId) {
                    const result = await this.messageService.processInbound({
                        tenantId, providerMessageId: message.providerMessageId, providerTimestamp: message.providerTimestamp,
                        senderPhone: message.senderPhone, recipientPhone: message.recipientPhone, messageType: message.messageType,
                        textBody: message.textContent?.body, mediaUrl: message.mediaContent?.downloadUrl, mediaCaption: message.mediaContent?.caption,
                        locationLat: message.locationContent?.latitude, locationLng: message.locationContent?.longitude,
                        selectedButtonId: message.selectedButtonId, selectedListItemId: message.selectedListItemId,
                        replyToMessageId: message.replyToMessageId, providerMetadata: message.providerMetadata,
                    });

                    if (!result.isNewConversation) { await this.handleBusinessHours(tenantId, message.senderPhone); }
                    if (result.isNewConversation) {
                        console.log(`[Webhook] New conversation detected for ${message.senderPhone}. Triggering welcome flow.`);
                        this.flowEngine.triggerSystemFlow(tenantId, 'welcome', message.senderPhone).catch((err: any) => {
                            console.error('[Webhook] Failed to trigger welcome flow:', err);
                        });
                    }
                }
                return;
            }

            const status = this.provider.parseWebhookStatus(payload);
            if (status) { await this.messageService.handleStatusUpdate(status); return; }
            console.log('[Webhook] Unhandled event type');
        } catch (error) { console.error('[Webhook] Processing error:', error); }
    };

    async handleBusinessHours(tenantId: string, contactIdentifier: string) {
        try {
            const settings = await this.tenantRepository.getSettings(tenantId);
            if (settings?.business_hours?.enabled) {
                const isOpen = this.checkBusinessHours(settings.business_hours);
                if (!isOpen) {
                    console.log(`[Webhook] Message outside business hours for ${tenantId}. Triggering away flow.`);
                    await this.flowEngine.triggerSystemFlow(tenantId, 'away', contactIdentifier);
                }
            }
        } catch (error) { console.error('[Webhook] Error checking business hours:', error); }
    }

    checkBusinessHours(config: any) {
        if (!config) return true;
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[now.getDay()];
        const dayConfig = config[currentDay];
        if (!dayConfig || !dayConfig.open) return false;
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const parseTime = (timeStr: string) => { const [hours, minutes] = timeStr.split(':').map(Number); return hours * 60 + minutes; };
        const startTime = parseTime(dayConfig.start);
        const endTime = parseTime(dayConfig.end);
        return currentTime >= startTime && currentTime < endTime;
    }

    async resolveTenantId(businessPhone: string) {
        return process.env.DEFAULT_TENANT_ID || 'default';
    }

    handleWebhook = this.handle;

    sendMessage = async (req: any, res: any, next: any) => {
        try {
            const { to, message, replyToMessageId } = req.body;
            if (!to || !message) { res.status(400).json({ error: 'Missing required fields', required: { to: 'phone number', message: 'text message' } }); return; }
            const result = await this.provider.sendMessage({ recipientPhone: to.replace(/\s/g, ''), messageType: 'TEXT', textContent: { body: message }, replyToMessageId });
            if (result.success) { res.json({ success: true, messageId: result.providerMessageId, timestamp: result.timestamp }); }
            else { res.status(400).json({ success: false, error: result.errorMessage, errorCode: result.errorCode }); }
        } catch (error) { next(error); }
    };

    sendTemplate = async (req: any, res: any, next: any) => {
        try {
            const { to, templateName, language = 'en', components = [] } = req.body;
            if (!to || !templateName) { res.status(400).json({ error: 'Missing required fields', required: { to: 'phone number', templateName: 'template name' } }); return; }
            const result = await this.provider.sendTemplate(to.replace(/\s/g, ''), templateName, language, components);
            if (result.success) { res.json({ success: true, messageId: result.providerMessageId, timestamp: result.timestamp }); }
            else { res.status(400).json({ success: false, error: result.errorMessage, errorCode: result.errorCode }); }
        } catch (error) { next(error); }
    };

    getMessageStatus = async (req: any, res: any, next: any) => {
        try {
            const { messageId } = req.params;
            res.json({ messageId, status: 'unknown', message: 'Message status tracking requires database integration' });
        } catch (error) { next(error); }
    };
}
