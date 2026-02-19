import { Queue } from 'bullmq';
import { sequelize } from '../../config/database.js';
import { QueryTypes } from 'sequelize';
import { getRedisClient } from '../../config/redis.js';

/**
 * Drip step shape (stored as JSON in drip_sequences.steps column):
 *   { delayMinutes: number; subject: string; body: string; channel: 'email' | 'whatsapp'; }
 */
interface DripStep {
    delayMinutes: number;
    subject: string;
    body: string;
    channel: 'email' | 'whatsapp';
}

interface DripSequence {
    id: string;
    tenant_id: string;
    name: string;
    trigger_type: string;   // 'signup' | 'purchase' | 'abandoned_cart' | 'custom'
    steps: string;          // JSON-stringified DripStep[]
    is_active: boolean;
}

/**
 * DripOrchestrator – evaluates behavioral triggers and enqueues
 * individual drip-step jobs into BullMQ with the correct delay.
 */
export class DripOrchestrator {
    private queue: Queue;

    constructor() {
        const redis = getRedisClient() as any;
        this.queue = new Queue('drip-campaign-steps', { connection: redis });
    }

    /**
     * Called by external event hooks (e.g. webhook, signup handler).
     * Finds all active drip sequences that match the trigger, then
     * enqueues every step with its cumulative delay.
     */
    async handleTrigger(tenantId: string, triggerType: string, recipientEmail: string, recipientData: Record<string, any> = {}) {
        const sequences = await sequelize.query<DripSequence>(
            `SELECT * FROM drip_sequences WHERE tenant_id = :tenantId AND trigger_type = :triggerType AND is_active = true`,
            { replacements: { tenantId, triggerType }, type: QueryTypes.SELECT }
        );

        for (const seq of sequences) {
            const steps: DripStep[] = typeof seq.steps === 'string' ? JSON.parse(seq.steps) : (seq.steps as any);

            let cumulativeDelayMs = 0;
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                cumulativeDelayMs += step.delayMinutes * 60_000;

                await this.queue.add('send-drip-step', {
                    tenantId,
                    sequenceId: seq.id,
                    stepIndex: i,
                    recipientEmail,
                    recipientData,
                    subject: step.subject,
                    body: step.body,
                    channel: step.channel || 'email',
                }, {
                    delay: cumulativeDelayMs,
                    removeOnComplete: true,
                    removeOnFail: 7 * 24 * 3600 * 1000,
                    jobId: `drip-${seq.id}-${recipientEmail}-step${i}`,
                });
            }

            // Record enrollment
            await sequelize.query(
                `INSERT INTO drip_enrollments (tenant_id, sequence_id, recipient_email, enrolled_at, status)
                 VALUES (:tenantId, :seqId, :email, NOW(), 'active')
                 ON CONFLICT DO NOTHING`,
                { replacements: { tenantId, seqId: seq.id, email: recipientEmail }, type: QueryTypes.INSERT }
            );
        }
    }

    /**
     * Cancel a recipient's remaining drip steps (e.g. on unsubscribe).
     */
    async cancelForRecipient(sequenceId: string, recipientEmail: string) {
        const jobs = await this.queue.getJobs(['delayed', 'waiting']);
        for (const job of jobs) {
            if (job.data.sequenceId === sequenceId && job.data.recipientEmail === recipientEmail) {
                await job.remove();
            }
        }
        await sequelize.query(
            `UPDATE drip_enrollments SET status = 'cancelled' WHERE sequence_id = :seqId AND recipient_email = :email`,
            { replacements: { seqId: sequenceId, email: recipientEmail }, type: QueryTypes.UPDATE }
        );
    }
}
