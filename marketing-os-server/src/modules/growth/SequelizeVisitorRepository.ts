import { Op, fn, col, literal } from 'sequelize';
import { Visitor } from '../modules/growth/models/Visitor.js';
import { IVisitorRepository, VisitorFilters } from '../modules/growth/interfaces/IVisitorRepository.js';
import { VisitorModel } from '../models/VisitorModel.js';

export class SequelizeVisitorRepository implements IVisitorRepository {
    async save(visitor: Visitor): Promise<Visitor> {
        const [instance, created] = await VisitorModel.findOrCreate({
            where: { id: visitor.id },
            defaults: {
                id: visitor.id,
                tenantId: visitor.tenantId,
                fingerprint: visitor.fingerprint,
                firstSeen: visitor.firstSeen,
                lastSeen: visitor.lastSeen,
                visitCount: visitor.visitCount,
                deviceType: visitor.deviceType,
                browser: visitor.browser,
                os: visitor.os,
                country: visitor.country,
                city: visitor.city,
                region: visitor.region,
                ipAddress: visitor.ipAddress,
                userAgent: visitor.userAgent,
                metadata: visitor.metadata,
            },
        });

        if (!created) {
            await instance.update({
                lastSeen: visitor.lastSeen,
                visitCount: visitor.visitCount,
                deviceType: visitor.deviceType,
                browser: visitor.browser,
                os: visitor.os,
                country: visitor.country,
                city: visitor.city,
                region: visitor.region,
                metadata: visitor.metadata,
            });
        }

        return instance.toEntity();
    }

    async findById(id: string, tenantId: string): Promise<Visitor | null> {
        const model = await VisitorModel.findOne({ where: { id, tenantId } });
        return model ? model.toEntity() : null;
    }

    async findByFingerprint(fingerprint: string, tenantId: string): Promise<Visitor | null> {
        const model = await VisitorModel.findOne({ where: { fingerprint, tenantId } });
        return model ? model.toEntity() : null;
    }

    async findAll(tenantId: string, filters?: VisitorFilters): Promise<{ visitors: Visitor[]; total: number }> {
        const where: any = { tenantId };
        if (filters?.country) where.country = filters.country;
        if (filters?.deviceType) where.deviceType = filters.deviceType;
        if (filters?.startDate || filters?.endDate) {
            where.firstSeen = {};
            if (filters?.startDate) where.firstSeen[Op.gte] = filters.startDate;
            if (filters?.endDate) where.firstSeen[Op.lte] = filters.endDate;
        }

        const total = await VisitorModel.count({ where });
        const models = await VisitorModel.findAll({
            where,
            limit: filters?.limit || 50,
            offset: filters?.offset || 0,
            order: [['createdAt', 'DESC']],
        });

        return { visitors: models.map(m => m.toEntity()), total };
    }

    async countByDateRange(tenantId: string, start: Date, end: Date): Promise<number> {
        return VisitorModel.count({
            where: { tenantId, firstSeen: { [Op.between]: [start, end] } },
        });
    }

    async countByCountry(tenantId: string, start: Date, end: Date): Promise<Array<{ country: string; count: number }>> {
        const results = await VisitorModel.findAll({
            attributes: ['country', [fn('COUNT', col('id')), 'count']],
            where: { tenantId, firstSeen: { [Op.between]: [start, end] } },
            group: ['country'],
            order: [[literal('count'), 'DESC']],
            raw: true,
        });
        return results.map((r: any) => ({ country: r.country || 'Unknown', count: parseInt(r.count, 10) }));
    }

    async countByDevice(tenantId: string, start: Date, end: Date): Promise<Array<{ deviceType: string; count: number }>> {
        const results = await VisitorModel.findAll({
            attributes: ['deviceType', [fn('COUNT', col('id')), 'count']],
            where: { tenantId, firstSeen: { [Op.between]: [start, end] } },
            group: ['deviceType'],
            order: [[literal('count'), 'DESC']],
            raw: true,
        });
        return results.map((r: any) => ({ deviceType: r.deviceType || 'Unknown', count: parseInt(r.count, 10) }));
    }
}
