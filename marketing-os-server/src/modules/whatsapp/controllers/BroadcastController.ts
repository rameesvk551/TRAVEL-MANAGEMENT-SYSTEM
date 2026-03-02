// controllers/BroadcastController.ts
// Isolated controller for WhatsApp broadcast / bulk messaging.
// Extracted from ConversationController for clean feature isolation.

export function createBroadcastController(
    messageService: any,
    optInRepo?: any,
    broadcastRepo?: any
) {
    // ────────────────────────────────────────────
    // POST /broadcast — send template to multiple recipients
    // ────────────────────────────────────────────
    const send = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const userId = req.context?.userId;
            const { templateName, language, recipients, scheduledAt } = req.body;

            if (!tenantId || !userId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            if (!templateName) {
                res.status(400).json({ error: 'templateName is required' });
                return;
            }

            if (!Array.isArray(recipients) || recipients.length === 0) {
                res.status(400).json({ error: 'Recipients list is required and must not be empty' });
                return;
            }

            // ── Opt-in filtering ──
            const eligible: Array<{ phone: string; variables?: any }> = [];
            const rejected: Array<{ phone: string; reason: string }> = [];

            if (optInRepo) {
                for (const r of recipients) {
                    try {
                        const optIn = await optInRepo.findByPhone(r.phone, tenantId);
                        if (optIn && optIn.status === 'OPTED_OUT') {
                            rejected.push({ phone: r.phone, reason: 'Recipient has opted out' });
                        } else {
                            eligible.push(r);
                        }
                    } catch (err) {
                        console.warn(`[Broadcast] Opt-in check failed for ${r.phone}, allowing:`, err);
                        eligible.push(r);
                    }
                }
            } else {
                eligible.push(...recipients);
            }

            if (eligible.length === 0) {
                res.status(403).json({
                    success: false,
                    error: 'No opted-in recipients found for broadcast',
                    code: 'NO_OPT_IN_RECIPIENTS',
                    rejectedRecipients: rejected,
                });
                return;
            }

            // ── Create broadcast record ──
            const broadcastId = crypto.randomUUID();
            const isScheduled = !!scheduledAt;
            const broadcastRecord: any = {
                id: broadcastId,
                tenantId,
                templateName,
                language: language || 'en',
                status: isScheduled ? 'SCHEDULED' : 'SENDING',
                totalRecipients: eligible.length,
                sentCount: 0,
                failedCount: 0,
                blockedCount: rejected.length,
                recipients: eligible,
                blockedRecipients: rejected,
                scheduledAt: scheduledAt || null,
                startedAt: isScheduled ? null : new Date(),
                completedAt: null,
                createdBy: userId,
            };

            if (broadcastRepo) {
                try { await broadcastRepo.save(broadcastRecord); } catch (err) {
                    console.warn('[Broadcast] Failed to save record:', err);
                }
            }

            // ── Send in background ──
            let successCount = 0;
            let failureCount = 0;

            (async () => {
                for (const r of eligible) {
                    try {
                        const result = await messageService.sendTemplate({
                            tenantId,
                            recipientPhone: r.phone,
                            templateName,
                            language: language || 'en',
                            variables: r.variables || {},
                            senderUserId: userId,
                        });
                        if (result.success) successCount++;
                        else failureCount++;
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        failureCount++;
                        console.error(`[Broadcast] Error sending to ${r.phone}:`, error);
                    }
                }
                console.log(
                    `[Broadcast] Completed: ${successCount} sent, ${failureCount} failed, ${rejected.length} blocked (opt-in)`
                );

                // Update broadcast record with final counts
                if (broadcastRepo) {
                    try {
                        await broadcastRepo.updateStatus(broadcastId, tenantId, {
                            status: failureCount === eligible.length ? 'FAILED' : 'COMPLETED',
                            sentCount: successCount,
                            failedCount: failureCount,
                            completedAt: new Date(),
                        });
                    } catch (err) {
                        console.warn('[Broadcast] Failed to update record:', err);
                    }
                }
            })();

            res.json({
                success: true,
                broadcastId,
                message: `Broadcast started for ${eligible.length} recipients`,
                jobId: 'background-processing',
                eligibleCount: eligible.length,
                blockedRecipients: rejected,
            });
        } catch (error) { next(error); }
    };

    // ────────────────────────────────────────────
    // GET /broadcast — list all broadcasts for tenant
    // ────────────────────────────────────────────
    const list = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Authentication required' }); return; }

            if (!broadcastRepo) { res.json({ data: [] }); return; }

            const { status, limit = 50, offset = 0 } = req.query;
            const broadcasts = await broadcastRepo.findByTenant(tenantId, { status, limit: Number(limit), offset: Number(offset) });
            res.json({ data: broadcasts });
        } catch (error) { next(error); }
    };

    // ────────────────────────────────────────────
    // GET /broadcast/:id — get a single broadcast
    // ────────────────────────────────────────────
    const get = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Authentication required' }); return; }

            if (!broadcastRepo) { res.status(404).json({ error: 'Broadcasts not available' }); return; }

            const broadcast = await broadcastRepo.findById(req.params.id, tenantId);
            if (!broadcast) { res.status(404).json({ error: 'Broadcast not found' }); return; }
            res.json({ data: broadcast });
        } catch (error) { next(error); }
    };

    return { send, list, get };
}

export type BroadcastController = ReturnType<typeof createBroadcastController>;
