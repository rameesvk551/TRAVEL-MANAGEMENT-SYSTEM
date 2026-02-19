import { Queue, Worker } from 'bullmq';
import { getRedisClient } from '../../redis/index.js';
import { Campaign } from '../../../domain/marketing/entities/Campaign.js';
import { ICampaignRepository } from '../../../domain/marketing/repositories/ICampaignRepository.js';
import { ISegmentRepository } from '../../../domain/marketing/repositories/ISegmentRepository.js';
import { ILeadRepository } from '../../../domain/interfaces/ILeadRepository.js';
import { WhatsAppContainer } from '../../whatsapp/container.js';

export class CampaignDispatcher {
    private queue: Queue;
    private worker: Worker | null = null;

    constructor(
        private campaignRepository: ICampaignRepository,
        private segmentRepository: ISegmentRepository,
        private leadRepository: ILeadRepository,
        private whatsAppContainer: WhatsAppContainer
    ) {
        const redisConnection = getRedisClient();
        this.queue = new Queue('marketing-campaigns', {
            connection: redisConnection,
        });
    }

    async dispatch(campaign: Campaign): Promise<void> {
        // If scheduled for the future, BullMQ handles the delay.
        const delay = campaign.scheduledAt ? Math.max(0, campaign.scheduledAt.getTime() - Date.now()) : 0;

        await this.queue.add('dispatch-campaign', {
            campaignId: campaign.id,
            tenantId: campaign.tenantId,
            type: campaign.type,
            segmentId: campaign.segmentId,
        }, {
            delay,
            removeOnComplete: true,
            removeOnFail: 7 * 24 * 3600 * 1000, // Keep failed jobs for a week
        });

        console.log(`Campaign ${campaign.id} dispatched to queue with delay ${delay}ms.`);
    }

    startWorker(): void {
        if (this.worker) {
            console.log('Worker already started.');
            return;
        }

        const redisConnection = getRedisClient();

        this.worker = new Worker('marketing-campaigns', async (job) => {
            console.log(`Processing campaign job ${job.id}`, job.data);

            const { campaignId, tenantId, segmentId } = job.data;

            // 1. Fetch Campaign Details
            const campaign = await this.campaignRepository.findById(campaignId, tenantId);
            if (!campaign) {
                throw new Error(`Campaign ${campaignId} not found`);
            }

            // 2. Fetch Segment Leads
            let leads = [];
            if (segmentId) {
                const segment = await this.segmentRepository.findById(segmentId, tenantId);
                if (!segment) {
                    throw new Error(`Segment ${segmentId} not found`);
                }

                // TODO: Apply segment filters properly. For now, fetching ALL leads for tenant or dummy implementation.
                // In real implementation, we would parse segment.filters and query leadRepository with those filters.
                // For MVP, if it's dynamic, we might fetch all.
                const result = await this.leadRepository.findAll(tenantId, { limit: 1000 }); // Limit for safety
                leads = result.leads;
            }

            console.log(`Found ${leads.length} leads for campaign ${campaign.name}`);

            // 3. Loop through Leads and Send Message
            let sentCount = 0;
            let failedCount = 0;

            for (const lead of leads) {
                if (!lead.phone) continue;

                try {
                    // Send Message using WhatsApp Service
                    // Assuming template message for now as implementation example
                    if (campaign.templateId) {
                        await this.whatsAppContainer.messageService.sendTemplate({
                            tenantId,
                            recipientPhone: lead.phone,
                            templateName: campaign.templateId,
                            language: 'en', // Default language
                            variables: campaign.templateParams || {},
                            senderUserId: 'system', // System triggered
                        });
                    } else if (campaign.content) {
                        // Text message
                        await this.whatsAppContainer.messageService.sendText({
                            tenantId,
                            recipientPhone: lead.phone,
                            text: campaign.content,
                            senderUserId: 'system', // System triggered
                        });
                    }
                    sentCount++;
                } catch (error) {
                    console.error(`Failed to send message to ${lead.phone}:`, error);
                    failedCount++;
                }
            }

            // 4. Update Stats
            campaign.sentCount = (campaign.sentCount || 0) + sentCount;
            campaign.failedCount = (campaign.failedCount || 0) + failedCount;
            campaign.status = 'COMPLETED'; // Or 'PARTIAL' if failures

            await this.campaignRepository.save(campaign);

            console.log(`Campaign ${campaignId} processed. Sent: ${sentCount}, Failed: ${failedCount}`);

        }, {
            connection: redisConnection,
            concurrency: 2, // Process 2 campaigns concurrently
        });

        this.worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed!`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`Job ${job?.id} failed with ${err.message}`);
        });

        console.log('Campaign Worker started.');
    }
}
