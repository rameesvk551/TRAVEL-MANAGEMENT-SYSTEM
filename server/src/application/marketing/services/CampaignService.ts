import { Campaign, CampaignProps } from '../../../domain/marketing/entities/Campaign.js';
import { ICampaignRepository, CampaignFilters } from '../../../domain/marketing/repositories/ICampaignRepository.js';
import { ISegmentRepository } from '../../../domain/marketing/repositories/ISegmentRepository.js';
import { CampaignDispatcher } from '../../../infrastructure/marketing/services/CampaignDispatcher.js';
import { CreateCampaignDTO, UpdateCampaignDTO } from '../dtos/CampaignDTO.js';

export class CampaignService {
    constructor(
        private campaignRepository: ICampaignRepository,
        private segmentRepository: ISegmentRepository,
        private campaignDispatcher: CampaignDispatcher
    ) { }

    // ... (rest of methods)

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
