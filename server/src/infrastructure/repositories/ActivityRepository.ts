import { Activity as ActivityEntity, ActivityType, ActivityStatus, ActivityOutcome } from '../../domain/entities/Activity.js';
import { IActivityRepository, ActivityFilters } from '../../domain/interfaces/IActivityRepository.js';
import { Activity as ActivityModel } from '../database/sequelize/models/Activity.js';
import { Op } from 'sequelize';

export class ActivityRepository implements IActivityRepository {
    private toEntity(model: ActivityModel): ActivityEntity {
        return ActivityEntity.fromPersistence({
            id: model.id,
            tenantId: model.tenant_id,
            leadId: model.lead_id,
            contactId: model.contact_id,
            bookingId: model.booking_id,
            assignedToId: model.assigned_to_id,
            createdById: model.created_by_id || '',
            type: model.type as ActivityType,
            status: model.status as ActivityStatus,
            outcome: model.outcome as ActivityOutcome,
            subject: model.subject || '',
            description: model.description,
            scheduledAt: model.scheduled_at,
            completedAt: model.completed_at,
            metadata: model.metadata || {},
            createdAt: model.created_at,
            updatedAt: model.updated_at,
        });
    }

    async save(activity: ActivityEntity): Promise<ActivityEntity> {
        const [model, created] = await ActivityModel.upsert({
            id: activity.id,
            tenant_id: activity.tenantId,
            lead_id: activity.leadId,
            contact_id: activity.contactId,
            booking_id: activity.bookingId,
            assigned_to_id: activity.assignedToId,
            created_by_id: activity.createdById,
            type: activity.type,
            status: activity.status,
            outcome: activity.outcome,
            subject: activity.subject,
            description: activity.description,
            scheduled_at: activity.scheduledAt,
            completed_at: activity.completedAt,
            metadata: activity.metadata,
        });

        return this.toEntity(model);
    }

    async findById(id: string, tenantId: string): Promise<ActivityEntity | null> {
        const model = await ActivityModel.findOne({
            where: { id, tenant_id: tenantId }
        });
        return model ? this.toEntity(model) : null;
    }

    async findAll(tenantId: string, filters: ActivityFilters): Promise<{ activities: ActivityEntity[]; total: number }> {
        const where: any = { tenant_id: tenantId };

        if (filters.leadId) where.lead_id = filters.leadId;
        if (filters.contactId) where.contact_id = filters.contactId;
        if (filters.assignedToId) where.assigned_to_id = filters.assignedToId;
        if (filters.status) where.status = filters.status;

        const limit = filters.limit || 50;
        const offset = filters.offset || 0;

        const { count, rows } = await ActivityModel.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            activities: rows.map(r => this.toEntity(r)),
            total: count
        };
    }

    async findOverdue(tenantId: string, assignedToId?: string): Promise<ActivityEntity[]> {
        const where: any = {
            tenant_id: tenantId,
            status: 'PENDING',
            scheduled_at: { [Op.lt]: new Date() }
        };

        if (assignedToId) where.assigned_to_id = assignedToId;

        const rows = await ActivityModel.findAll({ where });
        return rows.map(r => this.toEntity(r));
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await ActivityModel.destroy({
            where: { id, tenant_id: tenantId }
        });
    }
}
