import { Lead as LeadEntity, LeadTravelPreferences } from '../../domain/entities/Lead.js';
import { ILeadRepository, LeadFilters } from '../../domain/interfaces/ILeadRepository.js';
import { Lead as LeadModel } from '../database/sequelize/models/Lead.js';
import { Op } from 'sequelize';

function toEntity(model: LeadModel): LeadEntity {
    return LeadEntity.fromPersistence({
        id: model.id,
        tenantId: model.tenant_id,
        pipelineId: model.pipeline_id,
        stageId: model.stage_id,
        contactId: model.contact_id,
        name: model.name,
        email: model.email,
        phone: model.phone,
        assignedToId: model.assigned_to_id,
        source: model.source,
        sourcePlatform: model.source_platform,
        travelPreferences: (model.travel_preferences as unknown as LeadTravelPreferences) || {},
        priority: model.priority as any,
        status: model.status,
        score: model.score || 0,
        tags: model.tags || [],
        notes: model.notes,
        lostReason: model.lost_reason,
        metadata: (model.metadata as Record<string, unknown>) || {},
        createdAt: model.created_at,
        updatedAt: model.updated_at,
    });
}

export class LeadRepository implements ILeadRepository {
    async save(lead: LeadEntity): Promise<LeadEntity> {
        const [instance, created] = await LeadModel.findOrCreate({
            where: { id: lead.id },
            defaults: {
                id: lead.id,
                tenant_id: lead.tenantId,
                pipeline_id: lead.pipelineId,
                stage_id: lead.stageId,
                contact_id: lead.contactId,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                assigned_to_id: lead.assignedToId,
                source: lead.source,
                source_platform: lead.sourcePlatform,
                travel_preferences: lead.travelPreferences as any,
                priority: lead.priority,
                status: lead.status,
                score: lead.score,
                tags: lead.tags,
                notes: lead.notes,
                lost_reason: lead.lostReason,
                metadata: lead.metadata,
            }
        });

        if (!created) {
            await instance.update({
                pipeline_id: lead.pipelineId,
                stage_id: lead.stageId,
                contact_id: lead.contactId,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                assigned_to_id: lead.assignedToId,
                travel_preferences: lead.travelPreferences as any,
                priority: lead.priority,
                status: lead.status,
                score: lead.score,
                tags: lead.tags,
                notes: lead.notes,
                lost_reason: lead.lostReason,
                metadata: lead.metadata,
            });
        }

        return toEntity(instance);
    }

    async findById(id: string, tenantId: string): Promise<LeadEntity | null> {
        const lead = await LeadModel.findOne({
            where: { id, tenant_id: tenantId }
        });
        return lead ? toEntity(lead) : null;
    }

    async findAll(tenantId: string, filters: LeadFilters): Promise<{ leads: LeadEntity[]; total: number }> {
        const where: any = { tenant_id: tenantId };

        if (filters.pipelineId) where.pipeline_id = filters.pipelineId;
        if (filters.stageId) where.stage_id = filters.stageId;
        if (filters.assignedToId) where.assigned_to_id = filters.assignedToId;
        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${filters.search}%` } },
                { email: { [Op.iLike]: `%${filters.search}%` } },
                { phone: { [Op.iLike]: `%${filters.search}%` } }
            ];
        }

        const total = await LeadModel.count({ where });
        const limit = filters.limit || 50;
        const offset = filters.offset || 0;

        const leads = await LeadModel.findAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            leads: leads.map(toEntity),
            total
        };
    }

    async findByPipeline(pipelineId: string, tenantId: string): Promise<LeadEntity[]> {
        const leads = await LeadModel.findAll({
            where: { pipeline_id: pipelineId, tenant_id: tenantId },
            order: [['created_at', 'ASC']]
        });
        return leads.map(toEntity);
    }

    async countByStage(pipelineId: string, tenantId: string): Promise<Record<string, number>> {
        const results = await LeadModel.findAll({
            attributes: ['stage_id', [LeadModel.sequelize!.fn('COUNT', LeadModel.sequelize!.col('id')), 'count']],
            where: { pipeline_id: pipelineId, tenant_id: tenantId },
            group: ['stage_id'],
            raw: true
        }) as unknown as { stage_id: string; count: string }[];

        const counts: Record<string, number> = {};
        results.forEach(row => {
            if (row.stage_id) counts[row.stage_id] = parseInt(row.count, 10);
        });
        return counts;
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await LeadModel.destroy({
            where: { id, tenant_id: tenantId }
        });
    }
}
