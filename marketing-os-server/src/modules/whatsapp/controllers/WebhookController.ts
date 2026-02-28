// presentation/controllers/whatsapp/WebhookController.ts

export function createWebhookController(
    provider: any,
    conversationService: any,
    messageService: any,
    workflowOrchestrator: any,
    flowEngine: any,
    tenantRepository: any,
    auditRepo?: any,
) {
    const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'marketing-os-verify-token';

    async function audit(
        tenantId: string | null | undefined,
        input: {
            eventType: string;
            actorType?: 'USER' | 'SYSTEM' | 'WEBHOOK';
            actorId?: string;
            actorPhone?: string;
            entityType?: string;
            entityId?: string;
            payload?: Record<string, unknown>;
        },
    ) {
        if (!tenantId || !auditRepo) {
            return;
        }

        try {
            await auditRepo.log({
                tenantId,
                eventType: input.eventType,
                actorType: input.actorType || 'SYSTEM',
                actorId: input.actorId || undefined,
                actorPhone: input.actorPhone || undefined,
                entityType: input.entityType || undefined,
                entityId: input.entityId || undefined,
                payload: input.payload || {},
            });
        } catch (error) {
            console.warn('[WebhookController] Failed to write audit log:', error);
        }
    }

    async function handleConsentKeywords(tenantId: string, senderPhone: string, messageBody?: string) {
        if (!messageBody || !senderPhone) {
            return;
        }

        const normalized = messageBody.trim().toUpperCase();
        const stopKeywords = new Set(['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
        const startKeywords = new Set(['START', 'SUBSCRIBE', 'YES', 'UNSTOP']);

        if (!stopKeywords.has(normalized) && !startKeywords.has(normalized)) {
            return;
        }

        const isOptOut = stopKeywords.has(normalized);
        const { getPool } = await import('../../../config/database.js');
        const pool = getPool();

        await pool.query(
            `INSERT INTO whatsapp_opt_ins (
                id, tenant_id, phone_number, country_code, status, source, channel,
                permissions, legal_basis, consented_at, opted_out_at, opt_out_reason,
                recorded_by, metadata, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), $1, $2, NULL, $3, 'CUSTOMER_INITIATED', 'WHATSAPP',
                $4::jsonb, $5, $6, $7, $8,
                'system', $9::jsonb, NOW(), NOW()
            )
            ON CONFLICT (phone_number, tenant_id)
            DO UPDATE SET
                status = EXCLUDED.status,
                permissions = EXCLUDED.permissions,
                legal_basis = EXCLUDED.legal_basis,
                consented_at = COALESCE(EXCLUDED.consented_at, whatsapp_opt_ins.consented_at),
                opted_out_at = EXCLUDED.opted_out_at,
                opt_out_reason = EXCLUDED.opt_out_reason,
                updated_at = NOW(),
                metadata = COALESCE(whatsapp_opt_ins.metadata, '{}'::jsonb) || EXCLUDED.metadata`,
            [
                tenantId,
                senderPhone,
                isOptOut ? 'OPTED_OUT' : 'OPTED_IN',
                JSON.stringify({
                    utility: !isOptOut,
                    marketing: false,
                }),
                isOptOut ? 'user_opt_out' : 'user_opt_in',
                isOptOut ? null : new Date(),
                isOptOut ? new Date() : null,
                isOptOut ? 'USER_REQUEST' : null,
                JSON.stringify({
                    lastKeyword: normalized,
                    lastKeywordAt: new Date().toISOString(),
                }),
            ],
        );

        await audit(tenantId, {
            eventType: isOptOut ? 'recipient_unsubscribed' : 'recipient_resubscribed',
            actorType: 'WEBHOOK',
            actorPhone: senderPhone,
            payload: {
                keyword: normalized,
            },
        });
    }

    async function resolveTenantId(businessPhone: string) {
        try {
            // Try to match the incoming phone_number_id to a tenant's config
            const { getPool } = await import('../../../config/database.js');
            const pool = getPool();
            const result = await pool.query(
                `SELECT tenant_id FROM whatsapp_business_configs WHERE phone_number_id = $1 AND status = 'connected' LIMIT 1`,
                [businessPhone]
            );
            if (result.rows.length > 0) {
                return result.rows[0].tenant_id;
            }
            // Fallback: check if any connected config exists (single-tenant setup)
            const fallback = await pool.query(
                `SELECT tenant_id FROM whatsapp_business_configs WHERE status = 'connected' ORDER BY connected_at DESC LIMIT 1`
            );
            if (fallback.rows.length > 0) {
                return fallback.rows[0].tenant_id;
            }
        } catch (e) {
            console.warn('[Webhook] Failed to resolve tenant from config:', e);
        }
        return process.env.DEFAULT_TENANT_ID || 'default';
    }

    async function handleBusinessHours(tenantId: string, contactIdentifier: string) {
        try {
            const settings = await tenantRepository.getSettings(tenantId);
            if (settings?.business_hours?.enabled) {
                const isOpen = checkBusinessHours(settings.business_hours);
                if (!isOpen) {
                    console.log(`[Webhook] Message outside business hours for ${tenantId}. Triggering away flow.`);
                    await flowEngine.triggerSystemFlow(tenantId, 'away', contactIdentifier);
                }
            }
        } catch (error) { console.error('[Webhook] Error checking business hours:', error); }
    }

    function checkBusinessHours(config: any) {
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

    const verify = async (req: any, res: any) => {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode === 'subscribe' && token === webhookVerifyToken) {
            console.log('[Webhook] Verification successful');
            res.status(200).send(challenge);
        } else {
            console.log('[Webhook] Verification failed');
            res.status(403).send('Forbidden');
        }
    };

    const handle = async (req: any, res: any, next: any) => {
        try {
            res.status(200).send('OK');
            const payload = {
                provider: provider.providerType, eventType: 'MESSAGE_RECEIVED', timestamp: new Date(),
                rawBody: JSON.stringify(req.body), signature: req.headers['x-hub-signature-256'], headers: req.headers,
            };
            if (!provider.verifyWebhookSignature(payload)) { console.error('[Webhook] Invalid signature'); return; }

            const message = provider.parseWebhookMessage(payload);
            if (message) {
                const tenantId = await resolveTenantId(message.recipientPhone);
                if (tenantId) {
                    await audit(tenantId, {
                        eventType: 'webhook_message_received',
                        actorType: 'WEBHOOK',
                        actorPhone: message.senderPhone,
                        payload: {
                            providerMessageId: message.providerMessageId,
                            messageType: message.messageType,
                        },
                    });

                    const result = await messageService.processInbound({
                        tenantId, providerMessageId: message.providerMessageId, providerTimestamp: message.providerTimestamp,
                        senderPhone: message.senderPhone, recipientPhone: message.recipientPhone, messageType: message.messageType,
                        textBody: message.textContent?.body, mediaUrl: message.mediaContent?.downloadUrl, mediaCaption: message.mediaContent?.caption,
                        locationLat: message.locationContent?.latitude, locationLng: message.locationContent?.longitude,
                        selectedButtonId: message.selectedButtonId, selectedListItemId: message.selectedListItemId,
                        replyToMessageId: message.replyToMessageId, providerMetadata: message.providerMetadata,
                    });

                    await handleConsentKeywords(tenantId, message.senderPhone, message.textContent?.body);

                    if (!result.isNewConversation) { await handleBusinessHours(tenantId, message.senderPhone); }
                    if (result.isNewConversation) {
                        console.log(`[Webhook] New conversation detected for ${message.senderPhone}. Triggering welcome flow.`);
                        flowEngine.triggerSystemFlow(tenantId, 'welcome', message.senderPhone).catch((err: any) => {
                            console.error('[Webhook] Failed to trigger welcome flow:', err);
                        });
                    }
                }
                return;
            }

            const status = provider.parseWebhookStatus(payload);
            if (status) {
                const tenantId = await resolveTenantId(status.recipientPhone);
                if (tenantId) {
                    // Inject tenantId so handleStatusUpdate can look up the message
                    await messageService.handleStatusUpdate({ ...status, tenantId });
                    await audit(tenantId, {
                        eventType: 'webhook_status_received',
                        actorType: 'WEBHOOK',
                        actorPhone: status.recipientPhone,
                        payload: {
                            providerMessageId: status.providerMessageId,
                            status: status.status,
                            errorCode: status.errorCode,
                        },
                    });
                }
                return;
            }
            console.log('[Webhook] Unhandled event type');
        } catch (error) { console.error('[Webhook] Processing error:', error); }
    };

    const sendMessage = async (req: any, res: any, next: any) => {
        try {
            const { to, message, replyToMessageId } = req.body;
            if (!to || !message) { res.status(400).json({ error: 'Missing required fields', required: { to: 'phone number', message: 'text message' } }); return; }
            const result = await provider.sendMessage({ recipientPhone: to.replace(/\s/g, ''), messageType: 'TEXT', textContent: { body: message }, replyToMessageId });
            if (result.success) {
                await audit(req.context?.tenantId, {
                    eventType: 'outbound_text_sent',
                    actorType: 'USER',
                    actorId: req.context?.userId,
                    actorPhone: to,
                    payload: {
                        providerMessageId: result.providerMessageId,
                    },
                });
                res.json({ success: true, messageId: result.providerMessageId, timestamp: result.timestamp });
            }
            else { res.status(400).json({ success: false, error: result.errorMessage, errorCode: result.errorCode }); }
        } catch (error) { next(error); }
    };

    const sendTemplate = async (req: any, res: any, next: any) => {
        try {
            const { to, templateName, language = 'en', components = [] } = req.body;
            if (!to || !templateName) { res.status(400).json({ error: 'Missing required fields', required: { to: 'phone number', templateName: 'template name' } }); return; }
            const result = await provider.sendTemplate(to.replace(/\s/g, ''), templateName, language, components);
            if (result.success) {
                await audit(req.context?.tenantId, {
                    eventType: 'outbound_template_sent',
                    actorType: 'USER',
                    actorId: req.context?.userId,
                    actorPhone: to,
                    payload: {
                        templateName,
                        providerMessageId: result.providerMessageId,
                    },
                });
                res.json({ success: true, messageId: result.providerMessageId, timestamp: result.timestamp });
            }
            else { res.status(400).json({ success: false, error: result.errorMessage, errorCode: result.errorCode }); }
        } catch (error) { next(error); }
    };

    const sendMessageV2 = async (req: any, res: any, next: any) => {
        try {
            const { to, type = 'text', text, template, media, replyToMessageId } = req.body;
            if (!to) {
                res.status(400).json({ error: 'Missing required field: to' });
                return;
            }

            const recipientPhone = to.replace(/\s/g, '');
            const normalizedType = String(type).toLowerCase();

            if (normalizedType === 'text') {
                const messageBody = typeof text === 'string' ? text : text?.body;
                if (!messageBody) {
                    res.status(400).json({ error: 'Missing text body for text message' });
                    return;
                }
                const result = await provider.sendMessage({
                    recipientPhone,
                    messageType: 'TEXT',
                    textContent: { body: messageBody },
                    replyToMessageId,
                });

                if (!result.success) {
                    res.status(400).json({ success: false, error: result.errorMessage, errorCode: result.errorCode });
                    return;
                }

                await audit(req.context?.tenantId, {
                    eventType: 'outbound_text_sent',
                    actorType: 'USER',
                    actorId: req.context?.userId,
                    actorPhone: recipientPhone,
                    payload: {
                        providerMessageId: result.providerMessageId,
                    },
                });

                res.json({ success: true, messageId: result.providerMessageId, timestamp: result.timestamp });
                return;
            }

            if (normalizedType === 'template') {
                const templateName = template?.name || req.body.templateName;
                const language = template?.language || req.body.language || 'en';
                const components = template?.components || req.body.components || [];

                if (!templateName) {
                    res.status(400).json({ error: 'Missing template.name for template message' });
                    return;
                }

                const result = await provider.sendTemplate(recipientPhone, templateName, language, components);
                if (!result.success) {
                    res.status(400).json({ success: false, error: result.errorMessage, errorCode: result.errorCode });
                    return;
                }

                await audit(req.context?.tenantId, {
                    eventType: 'outbound_template_sent',
                    actorType: 'USER',
                    actorId: req.context?.userId,
                    actorPhone: recipientPhone,
                    payload: {
                        templateName,
                        providerMessageId: result.providerMessageId,
                    },
                });

                res.json({ success: true, messageId: result.providerMessageId, timestamp: result.timestamp });
                return;
            }

            if (['image', 'video', 'audio', 'document'].includes(normalizedType)) {
                const mediaId = media?.id;
                if (!mediaId) {
                    res.status(400).json({ error: 'Missing media.id for media message' });
                    return;
                }

                const result = await provider.sendMessage({
                    recipientPhone,
                    messageType: normalizedType.toUpperCase(),
                    mediaContent: {
                        mediaId,
                        caption: media?.caption,
                    },
                    replyToMessageId,
                });

                if (!result.success) {
                    res.status(400).json({ success: false, error: result.errorMessage, errorCode: result.errorCode });
                    return;
                }

                await audit(req.context?.tenantId, {
                    eventType: 'outbound_media_sent',
                    actorType: 'USER',
                    actorId: req.context?.userId,
                    actorPhone: recipientPhone,
                    payload: {
                        providerMessageId: result.providerMessageId,
                        mediaType: normalizedType,
                    },
                });

                res.json({ success: true, messageId: result.providerMessageId, timestamp: result.timestamp });
                return;
            }

            res.status(400).json({
                success: false,
                error: `Unsupported message type: ${type}`,
                supportedTypes: ['text', 'template', 'image', 'video', 'audio', 'document'],
            });
        } catch (error) {
            next(error);
        }
    };

    const getMessageStatus = async (req: any, res: any, next: any) => {
        try {
            const { messageId } = req.params;
            res.json({ messageId, status: 'unknown', message: 'Message status tracking requires database integration' });
        } catch (error) { next(error); }
    };

    return {
        verify,
        handle,
        handleWebhook: handle,
        handleBusinessHours,
        checkBusinessHours,
        resolveTenantId,
        sendMessage,
        sendTemplate,
        sendMessageV2,
        getMessageStatus,
    };
}
