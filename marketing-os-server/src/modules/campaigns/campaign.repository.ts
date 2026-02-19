import { Op } from 'sequelize';
import { Campaign } from './models/entities/Campaign.js';
import { ICampaignRepository, CampaignFilters } from './interfaces/repositories/ICampaignRepository.js';
import { CampaignModel } from './models/CampaignModel.js';
import { CampaignStepModel } from './models/CampaignStepModel.js';

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
                updatedAt: new Date(),
            });
        }

        // Handle Steps
        if (campaign.steps && campaign.steps.length > 0) {
            // Simple approach: Delete existing steps and recreate
            // Transaction would be better here but keeping it simple for now
            await CampaignStepModel.destroy({ where: { campaignId: campaign.id } });

            await CampaignStepModel.bulkCreate(campaign.steps.map(step => ({
                id: step.id,
                tenantId: campaign.tenantId,
                campaignId: campaign.id,
                stepOrder: step.stepOrder,
                delay: step.delay,
                templateId: step.templateId,
                templateParams: step.templateParams,
                content: step.content,
                metadata: step.metadata,
                createdAt: step.createdAt,
                updatedAt: step.updatedAt,
            })));
        } else if (campaign.steps && campaign.steps.length === 0) {
            // If steps is explicitly empty array, clear them (e.g. switching from Drip to Broadcast)
            await CampaignStepModel.destroy({ where: { campaignId: campaign.id } });
        }

        // Re-fetch with steps to return complete entity
        return this.findById(campaign.id, campaign.tenantId) as Promise<Campaign>;
    }

    async findById(id: string, tenantId: string): Promise<Campaign | null> {
        const model = await CampaignModel.findOne({
            where: { id, tenantId },
            include: [{
                model: CampaignStepModel,
                as: 'steps'
            }],
            order: [
                [{ model: CampaignStepModel, as: 'steps' }, 'stepOrder', 'ASC'] // Order steps by stepOrder
            ]
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
            order: [['createdAt', 'DESC']],
            // Not including steps in list view for performance, 
            // unless we specifically need to show "X steps" count.
        });

        return {
            campaigns: models.map(toEntity),
            total
        };
    }

    async findByStatus(status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED'): Promise<Campaign[]> {
        const models = await CampaignModel.findAll({
            where: { status },
            include: [{
                model: CampaignStepModel,
                as: 'steps'
            }],
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
