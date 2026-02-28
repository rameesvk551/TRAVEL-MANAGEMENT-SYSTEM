import { Op, fn, col, literal } from 'sequelize';
import { TrafficSource } from '../modules/growth/models/TrafficSource.js';
import { ITrafficSourceRepository, SourceFilters } from '../modules/growth/interfaces/ITrafficSourceRepository.js';
import { TrafficSourceModel } from '../models/TrafficSourceModel.js';

export class SequelizeTrafficSourceRepository implements ITrafficSourceRepository {
    async save(source: TrafficSource): Promise<TrafficSource> {
        const instance = await TrafficSourceModel.create({
            id: source.id,
            tenantId: source.tenantId,
            visitorId: source.visitorId,
            sessionId: source.sessionId,
            sourceType: source.sourceType,
            source: source.source,
            medium: source.medium,
            campaign: source.campaign,
            referrerUrl: source.referrerUrl,
            landingPage: source.landingPage,
            utmSource: source.utmSource,
            utmMedium: source.utmMedium,
            utmCampaign: source.utmCampaign,
            utmTerm: source.utmTerm,
            utmContent: source.utmContent,
        });
        return instance.toEntity();
    }

    async findAll(tenantId: string, filters?: SourceFilters): Promise<{ sources: TrafficSource[]; total: number }> {
        const where: any = { tenantId };
        if (filters?.sourceType) where.sourceType = filters.sourceType;
        if (filters?.utmCampaign) where.utmCampaign = filters.utmCampaign;
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters?.startDate) where.createdAt[Op.gte] = filters.startDate;
            if (filters?.endDate) where.createdAt[Op.lte] = filters.endDate;
        }

        const total = await TrafficSourceModel.count({ where });
        const models = await TrafficSourceModel.findAll({
            where,
            limit: filters?.limit || 50,
            offset: filters?.offset || 0,
            order: [['createdAt', 'DESC']],
        });

        return { sources: models.map(m => m.toEntity()), total };
    }

    async countBySourceType(tenantId: string, start: Date, end: Date): Promise<Array<{ sourceType: string; count: number }>> {
        const results = await TrafficSourceModel.findAll({
            attributes: ['sourceType', [fn('COUNT', col('id')), 'count']],
            where: { tenantId, createdAt: { [Op.between]: [start, end] } },
            group: ['sourceType'],
            order: [[literal('count'), 'DESC']],
            raw: true,
        });
        return results.map((r: any) => ({ sourceType: r.sourceType, count: parseInt(r.count, 10) }));
    }

    async getUTMBreakdown(tenantId: string, start: Date, end: Date): Promise<Array<{
        utmSource: string;
        utmMedium: string;
        utmCampaign: string;
        count: number;
    }>> {
        const results = await TrafficSourceModel.findAll({
            attributes: [
                'utmSource', 'utmMedium', 'utmCampaign',
                [fn('COUNT', col('id')), 'count'],
            ],
            where: {
                tenantId,
                createdAt: { [Op.between]: [start, end] },
                utmSource: { [Op.ne]: null },
            } as any,
            group: ['utmSource', 'utmMedium', 'utmCampaign'],
            order: [[literal('count'), 'DESC']],
            raw: true,
        });
        return results.map((r: any) => ({
            utmSource: r.utmSource || '',
            utmMedium: r.utmMedium || '',
            utmCampaign: r.utmCampaign || '',
            count: parseInt(r.count, 10),
        }));
    }

    async getLandingPageStats(tenantId: string, start: Date, end: Date): Promise<Array<{ landingPage: string; count: number }>> {
        const results = await TrafficSourceModel.findAll({
            attributes: ['landingPage', [fn('COUNT', col('id')), 'count']],
            where: {
                tenantId,
                createdAt: { [Op.between]: [start, end] },
                landingPage: { [Op.ne]: null },
            } as any,
            group: ['landingPage'],
            order: [[literal('count'), 'DESC']],
            limit: 50,
            raw: true,
        });
        return results.map((r: any) => ({ landingPage: r.landingPage || '', count: parseInt(r.count, 10) }));
    }
}
