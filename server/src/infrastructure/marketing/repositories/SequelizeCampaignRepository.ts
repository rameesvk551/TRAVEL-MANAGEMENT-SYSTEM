import { Op } from 'sequelize';
import { Campaign } from '../../../domain/marketing/entities/Campaign.js';
import { ICampaignRepository, CampaignFilters } from '../../../domain/marketing/repositories/ICampaignRepository.js';
import { CampaignModel } from '../models/CampaignModel.js';

function toEntity(model: CampaignModel): Campaign {
    return model.toEntity();
}

export class SequelizeCampaignRepository implements ICampaignRepository {
    async save(campaign: Campaign): Promise<Campaign> {
        const [instance, created] = await CampaignModel.findOrCreate({
            where: { id: campaign.id },
            defaults: {
                id: campaign.id,
                tenantId: campaign.tenantId,
                name: campaign.name,
                type: campaign.type,
                channel: campaign.channel,
                status: campaign.status,
                segmentId: campaign.segmentId,
                tagIds: campaign.tagIds,
                excludedTagIds: campaign.excludedTagIds,
                templateId: campaign.templateId,
                templateParams: campaign.templateParams,
                content: campaign.content,
                scheduledAt: campaign.scheduledAt,
                totalLeads: campaign.totalLeads,
                sentCount: campaign.sentCount,
                deliveredCount: campaign.deliveredCount,
                readCount: campaign.readCount,
                repliedCount: campaign.repliedCount,
                failedCount: campaign.failedCount,
                metadata: campaign.metadata,
                createdAt: campaign.createdAt,
                updatedAt: campaign.updatedAt,
            }
        });

        if (!created) {
            await instance.update({
                name: campaign.name,
                type: campaign.type,
                channel: campaign.channel,
                status: campaign.status,
                segmentId: campaign.segmentId,
                tagIds: campaign.tagIds,
                excludedTagIds: campaign.excludedTagIds,
                templateId: campaign.templateId,
                templateParams: campaign.templateParams,
                content: campaign.content,
                scheduledAt: campaign.scheduledAt,
                totalLeads: campaign.totalLeads,
                sentCount: campaign.sentCount,
                deliveredCount: campaign.deliveredCount,
                readCount: campaign.readCount,
                repliedCount: campaign.repliedCount,
                failedCount: campaign.failedCount,
                metadata: campaign.metadata,
                updatedAt: new Date(), // Force update time
            });
        }

        return toEntity(instance);
    }

    async findById(id: string, tenantId: string): Promise<Campaign | null> {
        const model = await CampaignModel.findOne({
            where: { id, tenantId }
        });
        return model ? toEntity(model) : null;
    }

    async findAll(tenantId: string, filters?: CampaignFilters): Promise<{ campaigns: Campaign[]; total: number }> {
        const where: any = { tenantId };

        if (filters?.status) where.status = filters.status;
        if (filters?.type) where.type = filters.type;
        if (filters?.channel) where.channel = filters.channel;

        const total = await CampaignModel.count({ where });
        const limit = filters?.limit || 50;
        const offset = filters?.offset || 0;

        const models = await CampaignModel.findAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return {
            campaigns: models.map(toEntity),
            total
        };
    }

    async findByStatus(status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED'): Promise<Campaign[]> {
        const models = await CampaignModel.findAll({
            where: { status },
            order: [['scheduledAt', 'ASC']]
        });
        return models.map(toEntity);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await CampaignModel.destroy({
            where: { id, tenantId }
        });
    }
}
