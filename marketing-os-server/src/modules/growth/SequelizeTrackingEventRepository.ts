import { Op, fn, col, literal } from 'sequelize';
import { TrackingEvent } from '../modules/growth/models/TrackingEvent.js';
import { ITrackingEventRepository, EventFilters } from '../modules/growth/interfaces/ITrackingEventRepository.js';
import { TrackingEventModel } from '../models/TrackingEventModel.js';

export class SequelizeTrackingEventRepository implements ITrackingEventRepository {
    async save(event: TrackingEvent): Promise<TrackingEvent> {
        const instance = await TrackingEventModel.create({
            id: event.id,
            tenantId: event.tenantId,
            visitorId: event.visitorId,
            eventType: event.eventType,
            eventName: event.eventName,
            pageUrl: event.pageUrl,
            pageTitle: event.pageTitle,
            referrerUrl: event.referrerUrl,
            sessionId: event.sessionId,
            properties: event.properties,
        });
        return instance.toEntity();
    }

    async saveBatch(events: TrackingEvent[]): Promise<void> {
        await TrackingEventModel.bulkCreate(
            events.map(e => ({
                id: e.id,
                tenantId: e.tenantId,
                visitorId: e.visitorId,
                eventType: e.eventType,
                eventName: e.eventName,
                pageUrl: e.pageUrl,
                pageTitle: e.pageTitle,
                referrerUrl: e.referrerUrl,
                sessionId: e.sessionId,
                properties: e.properties,
            }))
        );
    }

    async findById(id: string, tenantId: string): Promise<TrackingEvent | null> {
        const model = await TrackingEventModel.findOne({ where: { id, tenantId } });
        return model ? model.toEntity() : null;
    }

    async findAll(tenantId: string, filters?: EventFilters): Promise<{ events: TrackingEvent[]; total: number }> {
        const where: any = { tenantId };
        if (filters?.eventType) where.eventType = filters.eventType;
        if (filters?.visitorId) where.visitorId = filters.visitorId;
        if (filters?.sessionId) where.sessionId = filters.sessionId;
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters?.startDate) where.createdAt[Op.gte] = filters.startDate;
            if (filters?.endDate) where.createdAt[Op.lte] = filters.endDate;
        }

        const total = await TrackingEventModel.count({ where });
        const models = await TrackingEventModel.findAll({
            where,
            limit: filters?.limit || 50,
            offset: filters?.offset || 0,
            order: [['createdAt', 'DESC']],
        });

        return { events: models.map(m => m.toEntity()), total };
    }

    async countByType(tenantId: string, start: Date, end: Date): Promise<Array<{ eventType: string; count: number }>> {
        const results = await TrackingEventModel.findAll({
            attributes: ['eventType', [fn('COUNT', col('id')), 'count']],
            where: { tenantId, createdAt: { [Op.between]: [start, end] } },
            group: ['eventType'],
            order: [[literal('count'), 'DESC']],
            raw: true,
        });
        return results.map((r: any) => ({ eventType: r.eventType, count: parseInt(r.count, 10) }));
    }

    async countByPage(tenantId: string, start: Date, end: Date): Promise<Array<{ pageUrl: string; count: number }>> {
        const results = await TrackingEventModel.findAll({
            attributes: ['pageUrl', [fn('COUNT', col('id')), 'count']],
            where: { tenantId, eventType: 'pageview', createdAt: { [Op.between]: [start, end] } },
            group: ['pageUrl'],
            order: [[literal('count'), 'DESC']],
            limit: 50,
            raw: true,
        });
        return results.map((r: any) => ({ pageUrl: r.pageUrl || 'Unknown', count: parseInt(r.count, 10) }));
    }

    async getVisitorTimeline(visitorId: string, tenantId: string): Promise<TrackingEvent[]> {
        const models = await TrackingEventModel.findAll({
            where: { visitorId, tenantId },
            order: [['createdAt', 'ASC']],
        });
        return models.map(m => m.toEntity());
    }
}
