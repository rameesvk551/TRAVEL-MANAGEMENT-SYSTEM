import { Campaign, CampaignProps } from './models/entities/Campaign.js';
import { Segment } from './models/entities/Segment.js';
import { CampaignStep } from './models/entities/CampaignStep.js';
import { generateId } from '../../shared/utils/index.js';
import { ICampaignRepository, CampaignFilters } from './interfaces/repositories/ICampaignRepository.js';
import { ISegmentRepository } from './interfaces/repositories/ISegmentRepository.js';
import { CampaignDispatcher } from './campaign.dispatcher.js';
import { CreateCampaignDTO, UpdateCampaignDTO } from './campaign.dto.js';

export class CampaignService {
    constructor(
        private campaignRepository: ICampaignRepository,
        private segmentRepository: ISegmentRepository,
        private campaignDispatcher: CampaignDispatcher
    ) { }

    async createCampaign(data: CreateCampaignDTO & { tenantId: string; leadIds?: string[] }): Promise<Campaign> {
        // Generate ID first so we can link steps
        const campaignId = generateId();

        // Handle leadIds -> Create custom Segment
        let segmentId = data.segmentId;
        if (data.leadIds && data.leadIds.length > 0) {
            const segmentName = `Audience for ${data.name.substring(0, 20)}...`;
            const newSegment = Segment.create({
                tenantId: data.tenantId,
                name: segmentName,
                isDynamic: false,
                filters: [{
                    field: 'id',
                    operator: 'IN',
                    value: data.leadIds
                }]
            });
            await this.segmentRepository.save(newSegment);
            segmentId = newSegment.id;
        }

        const steps = data.steps ? data.steps.map(step => CampaignStep.create({
            tenantId: data.tenantId,
            campaignId: campaignId,
            stepOrder: step.stepOrder,
            delay: step.delay,
            templateId: step.templateId,
            templateParams: step.templateParams,
            content: step.content,
            metadata: step.metadata
        })) : [];

        const campaign = Campaign.create({
            id: campaignId,
            tenantId: data.tenantId,
            name: data.name,
            type: data.type,
            channel: data.channel,
            status: 'DRAFT',
            content: data.content,
            templateId: data.templateId,
            templateParams: data.templateParams,
            segmentId: segmentId,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
            tagIds: data.tagIds,
            steps: steps
        });

        return this.campaignRepository.save(campaign);
    }

    async updateCampaign(id: string, tenantId: string, data: UpdateCampaignDTO): Promise<Campaign> {
        const campaign = await this.campaignRepository.findById(id, tenantId);
        if (!campaign) throw new Error('Campaign not found');

        if (campaign.status === 'RUNNING' || campaign.status === 'COMPLETED') {
            throw new Error('Cannot update a running or completed campaign');
        }

        if (data.name) campaign.name = data.name;
        if (data.content !== undefined) campaign.content = data.content;
        if (data.templateId !== undefined) campaign.templateId = data.templateId;
        if (data.templateParams !== undefined) campaign.templateParams = data.templateParams;
        if (data.segmentId !== undefined) campaign.segmentId = data.segmentId;
        if (data.scheduledAt !== undefined) campaign.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : undefined;
        if (data.status) campaign.status = data.status;
        if (data.tagIds) campaign.tagIds = data.tagIds;
        if (data.steps) {
            campaign.steps = data.steps.map(step => CampaignStep.create({
                tenantId: campaign.tenantId,
                campaignId: campaign.id,
                stepOrder: step.stepOrder,
                delay: step.delay,
                templateId: step.templateId,
                templateParams: step.templateParams,
                content: step.content,
                metadata: step.metadata
            }));
        }

        return this.campaignRepository.save(campaign);
    }

    async getCampaigns(tenantId: string, filters: CampaignFilters & { limit?: number; offset?: number }): Promise<{ campaigns: Campaign[]; total: number }> {
        return this.campaignRepository.findAll(tenantId, filters);
    }

    async getCampaignById(id: string, tenantId: string): Promise<Campaign | null> {
        return this.campaignRepository.findById(id, tenantId);
    }

    async launchCampaign(id: string, tenantId: string): Promise<void> {
        const campaign = await this.campaignRepository.findById(id, tenantId);
        if (!campaign) throw new Error('Campaign not found');

        if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
            throw new Error('Campaign is not in a launchable state');
        }

        await this.campaignDispatcher.dispatch(campaign);

        campaign.status = 'RUNNING';
        // If scheduled for future, status might remain SCHEDULED or be handled by dispatcher logic. 
        // For now, let's assume dispatcher handles delay and we mark as RUNNING or SCHEDULED.
        if (campaign.scheduledAt && campaign.scheduledAt > new Date()) {
            campaign.status = 'SCHEDULED';
        } else {
            campaign.status = 'RUNNING';
        }

        await this.campaignRepository.save(campaign);
    }

    async deleteCampaign(id: string, tenantId: string): Promise<void> {
        const campaign = await this.campaignRepository.findById(id, tenantId);
        if (!campaign) return;

        if (campaign.status === 'RUNNING') {
            throw new Error('Cannot delete a running campaign');
        }

        await this.campaignRepository.delete(id, tenantId);
    }
}
