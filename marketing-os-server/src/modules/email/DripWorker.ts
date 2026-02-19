import { Worker } from 'bullmq';
import { QueryTypes } from 'sequelize';
import { getRedisClient } from '../../config/redis.js';
import { sequelize } from '../../config/database.js';
import { sendEmail } from './mailer.js';

/**
 * DripWorker – BullMQ worker that processes individual drip-step jobs.
 */
export class DripWorker {
    private worker: Worker | null = null;

    start(): void {
        if (this.worker) {
            console.log('[DripWorker] Already running.');
            return;
        }

        const redis = getRedisClient() as any;

        this.worker = new Worker('drip-campaign-steps', async (job) => {
            const { tenantId, sequenceId, stepIndex, recipientEmail, subject, body, channel } = job.data;

            console.log(`[DripWorker] Processing step ${stepIndex} of sequence ${sequenceId} for ${recipientEmail}`);

            // 1) ensure enrollment still active
            const [enrollment] = await sequelize.query(
                `SELECT status FROM drip_enrollments WHERE sequence_id = :seqId AND recipient_email = :email LIMIT 1`,
                { replacements: { seqId: sequenceId, email: recipientEmail }, type: QueryTypes.SELECT }
            ) as any[];

            if (enrollment?.status !== 'active') {
                console.log(`[DripWorker] Enrollment cancelled/completed for ${recipientEmail}, skipping.`);
                return;
            }

            // 2) send message
            if (channel === 'email') {
                await sendEmail(recipientEmail, subject || '(no subject)', body || undefined, body || undefined);
            } else {
                console.log(`[DripWorker] Would send WhatsApp to ${recipientEmail} (channel: ${channel})`);
            }

            // 3) record event
            await sequelize.query(
                `INSERT INTO email_events (tenant_id, campaign_id, recipient_id, event_type, meta_data, created_at)
                 VALUES (:tenantId, :seqId, :email, 'drip_sent', :meta, NOW())`,
                {
                    replacements: {
                        tenantId,
                        seqId: sequenceId,
                        email: recipientEmail,
                        meta: JSON.stringify({ stepIndex, subject, channel }),
                    },
                    type: QueryTypes.INSERT,
                }
            );

            console.log(`[DripWorker] Step ${stepIndex} complete.`);
        }, {
            connection: redis,
            concurrency: 5,
        });

        this.worker.on('completed', (job) => {
            console.log(`[DripWorker] Job ${job.id} completed.`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`[DripWorker] Job ${job?.id} failed: ${err.message}`);
        });

        console.log('[DripWorker] Started and listening for drip-campaign-steps jobs.');
    }

    async stop(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            this.worker = null;
            console.log('[DripWorker] Stopped.');
        }
    }
}
