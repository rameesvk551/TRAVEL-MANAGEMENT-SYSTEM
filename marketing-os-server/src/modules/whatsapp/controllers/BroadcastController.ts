// controllers/BroadcastController.ts
// Isolated controller for WhatsApp broadcast / bulk messaging.
// Extracted from ConversationController for clean feature isolation.

export function createBroadcastController(
    messageService: any,
    optInRepo?: any
) {
    // ────────────────────────────────────────────
    // POST /broadcast — send template to multiple recipients
    // ────────────────────────────────────────────
    const send = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const userId = req.context?.userId;
            const { templateName, language, recipients } = req.body;

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
                    const optIn = await optInRepo.findByPhone(r.phone, tenantId);
                    if (!optIn || optIn.status !== 'OPTED_IN') {
                        rejected.push({ phone: r.phone, reason: 'Recipient is not opted in' });
                    } else {
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

            // ── Send in background ──
            let successCount = 0;
            let failureCount = 0;

            // Fire-and-forget background processing
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
                        // Respect rate limits — 100 ms between sends
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        failureCount++;
                        console.error(`[Broadcast] Error sending to ${r.phone}:`, error);
                    }
                }
                console.log(
                    `[Broadcast] Completed: ${successCount} sent, ${failureCount} failed, ${rejected.length} blocked (opt-in)`
                );
            })();

            res.json({
                success: true,
                message: `Broadcast started for ${eligible.length} recipients`,
                jobId: 'background-processing',
                eligibleCount: eligible.length,
                blockedRecipients: rejected,
            });
        } catch (error) { next(error); }
    };

    return { send };
}

export type BroadcastController = ReturnType<typeof createBroadcastController>;
