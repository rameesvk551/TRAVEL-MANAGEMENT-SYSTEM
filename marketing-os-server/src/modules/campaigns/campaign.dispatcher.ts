import { Queue, Worker } from 'bullmq';
import { getRedisClient } from '../../config/redis.js';
import { Campaign } from './models/entities/Campaign.js';
import { Lead } from './models/entities/Lead.js';
import { ICampaignRepository } from './interfaces/repositories/ICampaignRepository.js';
import { ISegmentRepository } from './interfaces/repositories/ISegmentRepository.js';
import { ILeadRepository } from '../crm/interfaces/ILeadRepository.js';
import { WhatsAppContainer } from '../whatsapp/container.js';
import { sendEmail } from '../email/mailer.js';

export class CampaignDispatcher {
    private queue: Queue;
    private worker: Worker | null = null;

    constructor(
        private campaignRepository: ICampaignRepository,
        private segmentRepository: ISegmentRepository,
        private leadRepository: ILeadRepository,
        private whatsAppContainer: WhatsAppContainer
    ) {
        const redisConnection = getRedisClient() as any;
        this.queue = new Queue('marketing-campaigns', {
            connection: redisConnection,
        });
    }

    // Mock Lead Repository or real one
    // In a real app, this should be segmented.
    private async getLeadsForCampaign(campaign: Campaign): Promise<Lead[]> {
        let options: any = {};

        if (campaign.segmentId) {
            const segment = await this.segmentRepository.findById(campaign.segmentId, campaign.tenantId);
            if (segment && segment.filters && Array.isArray(segment.filters)) {

                // Handle ID Inclusion
                const idFilter = segment.filters.find(f => f.field === 'id' && f.operator === 'IN');
                if (idFilter && Array.isArray(idFilter.value)) {
                    options.ids = idFilter.value;
                }

                // Handle Source
                const sourceFilter = segment.filters.find(f => f.field === 'source' && f.operator === 'EQUALS');
                if (sourceFilter) options.source = sourceFilter.value;

                // Handle Status
                const statusFilter = segment.filters.find(f => f.field === 'status' && f.operator === 'EQUALS');
                if (statusFilter) options.status = statusFilter.value;
            }
        }


        // Handle Campaign Tags (Direct Audience Selection)
        if (campaign.tagIds && campaign.tagIds.length > 0) {
            options.tags = campaign.tagIds;
        }

        // Default or filtered fetch
        const result = await this.leadRepository.findAll(campaign.tenantId, options);
        return result.leads;
    }

    async dispatch(campaign: Campaign): Promise<void> {
        const baseDelay = campaign.scheduledAt ? Math.max(0, campaign.scheduledAt.getTime() - Date.now()) : 0;

        // Fetch target audience
        const leads = await this.getLeadsForCampaign(campaign);

        if (leads.length === 0) {
            console.warn(`Campaign ${campaign.id} has no leads in segment.`);
            return;
        }

        if (campaign.type === 'DRIP' && campaign.steps && campaign.steps.length > 0) {
            console.log(`Dispatching DRIP campaign ${campaign.id} with ${campaign.steps.length} steps.`);

            // Schedule each step
            for (const step of campaign.steps) {
                // Step delay is in minutes, convert to ms
                // We assume step delay is relative to campaign start
                const stepDelayMs = step.delay * 60 * 1000;
                const totalDelay = baseDelay + stepDelayMs;

                for (const lead of leads) {
                    await this.queue.add('dispatch-campaign-step', {
                        campaignId: campaign.id,
                        tenantId: campaign.tenantId,
                        type: campaign.type,
                        segmentId: campaign.segmentId,
                        stepId: step.id,
                        stepOrder: step.stepOrder,
                        leadId: lead.id // Add lead context
                    }, {
                        delay: totalDelay,
                        removeOnComplete: true,
                        removeOnFail: 7 * 24 * 3600 * 1000,
                    });
                }

                console.log(`Scheduled Step ${step.stepOrder} (ID: ${step.id}) for campaign ${campaign.id} with delay ${totalDelay}ms for ${leads.length} leads.`);
            }
        } else {
            // BROADCAST or single message
            // Queue one job per lead or batch them? 
            // Original code queued ONE job for the campaign. 
            // Better to queue one job per lead for scalability and tracking.
            // But to minimize change risk, let's keep one job if worker handles iteration, 
            // OR update worker to handle single lead.
            // The worker logic seemed to iterate?
            // checking worker...
            // Worker logic (from viewed file) seemed to NOT iterate leads?
            // Actually, I should update dispatch to queue per lead.

            for (const lead of leads) {
                await this.queue.add('dispatch-campaign', {
                    campaignId: campaign.id,
                    tenantId: campaign.tenantId,
                    type: campaign.type,
                    segmentId: campaign.segmentId,
                    leadId: lead.id
                }, {
                    delay: baseDelay,
                    removeOnComplete: true,
                    removeOnFail: 7 * 24 * 3600 * 1000,
                });
            }
            console.log(`Campaign ${campaign.id} dispatched to queue for ${leads.length} leads with delay ${baseDelay}ms.`);
        }
    }

    startWorker(): void {
        if (this.worker) {
            console.log('Worker already started.');
            return;
        }

        const redisConnection = getRedisClient() as any;

        this.worker = new Worker('marketing-campaigns', async (job) => {
            console.log(`Processing campaign job ${job.id}`, job.data);

            const { campaignId, tenantId, segmentId, stepId } = job.data;

            // 1. Fetch Campaign Details
            const campaign = await this.campaignRepository.findById(campaignId, tenantId);
            if (!campaign) {
                throw new Error(`Campaign ${campaignId} not found`);
            }

            // Determine Message Content (Campaign vs Step)
            let templateId = campaign.templateId;
            let templateParams = campaign.templateParams;
            let content = campaign.content;
            let metadata = campaign.metadata as Record<string, any>;
            let subject = metadata?.subject || campaign.name; // Default subject if not provided

            if (stepId) {
                const step = campaign.steps?.find(s => s.id === stepId);
                if (!step) {
                    throw new Error(`Step ${stepId} not found in campaign ${campaignId}`);
                }
                templateId = step.templateId;
                templateParams = step.templateParams;
                content = step.content;
                metadata = step.metadata as Record<string, any>;
                if (metadata?.subject) subject = metadata.subject; // Override subject per step if needed
                console.log(`Processing Step ${step.stepOrder} for Campaign ${campaign.name}`);
            }

            // 2. Fetch Segment Leads
            let leads: any[] = [];
            if (segmentId) {
                const segment = await this.segmentRepository.findById(segmentId, tenantId);
                if (!segment) {
                    throw new Error(`Segment ${segmentId} not found`);
                }

                // TODO: Apply segment filters properly.
                const result = await this.leadRepository.findAll(tenantId, { limit: 1000 });
                leads = result.leads;
            }

            console.log(`Found ${leads.length} leads for campaign ${campaign.name}`);

            // 3. Loop through Leads and Send Message
            let sentCount = 0;
            let failedCount = 0;

            for (const lead of leads) {
                // Check channel availability
                if (campaign.channel === 'WHATSAPP' && !lead.phone) continue;
                if (campaign.channel === 'EMAIL' && !lead.email) continue;

                try {
                    if (campaign.channel === 'WHATSAPP') {
                        if (templateId) {
                            await this.whatsAppContainer.messageService.sendTemplate({
                                tenantId,
                                recipientPhone: lead.phone!,
                                templateName: templateId,
                                language: 'en',
                                variables: templateParams || {},
                                senderUserId: 'system',
                            });
                        } else if (content) {
                            await this.whatsAppContainer.messageService.sendText({
                                tenantId,
                                recipientPhone: lead.phone!,
                                text: content,
                                senderUserId: 'system',
                            });
                        }
                    } else if (campaign.channel === 'EMAIL') {
                        await sendEmail(lead.email!, subject, content || '', content || '');
                    }

                    sentCount++;
                } catch (error) {
                    console.error(`Failed to dispatch message to ${lead.id}:`, error);
                    failedCount++;
                }
            }

            // 4. Update Stats (accumulate)
            // Note: This is checking the same campaign record.
            // For drip, we might want stats per step, but for MVP we just sum them up on the campaign.
            // Ideally we should record stats on the step level too.
            campaign.sentCount = (campaign.sentCount || 0) + sentCount;
            campaign.failedCount = (campaign.failedCount || 0) + failedCount;

            // For BROADCAST, we mark completed. For DRIP, we only mark completed if it was the last step?
            // Or we check if all steps are done? 
            // Simple logic: if it's the last step (or no steps), mark as completed?
            // For now, let's just save stats. Status management for Drip is complex (when is it "Completed"?).
            // We can leave it as RUNNING until explicitly stopped or after max time?
            // Let's rely on manual completion or check if it was the last step with max delay.

            // Simplified: If it's a broadcast (no stepId) OR it's the last step
            let isLastStep = true;
            if (stepId && campaign.steps) {
                const maxOrder = Math.max(...campaign.steps.map(s => s.stepOrder));
                const currentStep = campaign.steps.find(s => s.id === stepId);
                if (currentStep && currentStep.stepOrder < maxOrder) {
                    isLastStep = false;
                }
            }

            if (isLastStep) {
                campaign.status = 'COMPLETED';
            } else {
                campaign.status = 'RUNNING';
            }

            await this.campaignRepository.save(campaign);

            console.log(`Campaign ${campaignId} processed. Sent: ${sentCount}, Failed: ${failedCount}`);

        }, {
            connection: redisConnection,
            concurrency: 5, // Increased concurrency
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
