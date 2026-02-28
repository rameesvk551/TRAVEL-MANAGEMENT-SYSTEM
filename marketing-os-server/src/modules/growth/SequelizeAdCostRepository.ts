import { Op, fn, col, literal } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { AdCost } from '../modules/growth/models/AdCost.js';
import { IAdCostRepository, AdCostFilters } from '../modules/growth/interfaces/IAdCostRepository.js';
import { AdCostModel } from '../models/AdCostModel.js';

export class SequelizeAdCostRepository implements IAdCostRepository {
    async save(adCost: AdCost): Promise<AdCost> {
        const [instance, created] = await AdCostModel.findOrCreate({
            where: { id: adCost.id },
            defaults: {
                id: adCost.id,
                tenantId: adCost.tenantId,
                platform: adCost.platform,
                campaignId: adCost.campaignId,
                campaignName: adCost.campaignName,
                adSetId: adCost.adSetId,
                adSetName: adCost.adSetName,
                adId: adCost.adId,
                adName: adCost.adName,
                date: adCost.date,
                spend: adCost.spend,
                impressions: adCost.impressions,
                clicks: adCost.clicks,
                conversions: adCost.conversions,
                revenue: adCost.revenue,
                currency: adCost.currency,
                metadata: adCost.metadata,
            },
        });

        if (!created) {
            await instance.update({
                spend: adCost.spend,
                impressions: adCost.impressions,
                clicks: adCost.clicks,
                conversions: adCost.conversions,
                revenue: adCost.revenue,
                metadata: adCost.metadata,
            });
        }

        return instance.toEntity();
    }

    async saveBatch(adCosts: AdCost[]): Promise<void> {
        await AdCostModel.bulkCreate(
            adCosts.map(a => ({
                id: a.id,
                tenantId: a.tenantId,
                platform: a.platform,
                campaignId: a.campaignId,
                campaignName: a.campaignName,
                adSetId: a.adSetId,
                adSetName: a.adSetName,
                adId: a.adId,
                adName: a.adName,
                date: a.date,
                spend: a.spend,
                impressions: a.impressions,
                clicks: a.clicks,
                conversions: a.conversions,
                revenue: a.revenue,
                currency: a.currency,
                metadata: a.metadata,
            })),
            { updateOnDuplicate: ['spend', 'impressions', 'clicks', 'conversions', 'revenue', 'metadata', 'updatedAt'] }
        );
    }

    async findAll(tenantId: string, filters?: AdCostFilters): Promise<{ adCosts: AdCost[]; total: number }> {
        const where: any = { tenantId };
        if (filters?.platform) where.platform = filters.platform;
        if (filters?.campaignId) where.campaignId = filters.campaignId;
        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters?.startDate) where.date[Op.gte] = filters.startDate;
            if (filters?.endDate) where.date[Op.lte] = filters.endDate;
        }

        const total = await AdCostModel.count({ where });
        const models = await AdCostModel.findAll({
            where,
            limit: filters?.limit || 50,
            offset: filters?.offset || 0,
            order: [['date', 'DESC']],
        });

        return { adCosts: models.map(m => m.toEntity()), total };
    }

    async getTotalSpend(tenantId: string, start: Date, end: Date): Promise<number> {
        const result = await AdCostModel.findOne({
            attributes: [[fn('SUM', col('spend')), 'totalSpend']],
            where: { tenantId, date: { [Op.between]: [start, end] } },
            raw: true,
        });
        return parseFloat((result as any)?.totalSpend) || 0;
    }

    async getSpendByPlatform(tenantId: string, start: Date, end: Date): Promise<Array<{ platform: string; spend: number; impressions: number; clicks: number; conversions: number }>> {
        const results = await AdCostModel.findAll({
            attributes: [
                'platform',
                [fn('SUM', col('spend')), 'spend'],
                [fn('SUM', col('impressions')), 'impressions'],
                [fn('SUM', col('clicks')), 'clicks'],
                [fn('SUM', col('conversions')), 'conversions'],
            ],
            where: { tenantId, date: { [Op.between]: [start, end] } },
            group: ['platform'],
            order: [[literal('spend'), 'DESC']],
            raw: true,
        });
        return results.map((r: any) => ({
            platform: r.platform,
            spend: parseFloat(r.spend) || 0,
            impressions: parseInt(r.impressions, 10) || 0,
            clicks: parseInt(r.clicks, 10) || 0,
            conversions: parseInt(r.conversions, 10) || 0,
        }));
    }

    async getSpendByCampaign(tenantId: string, start: Date, end: Date): Promise<Array<{ campaignId: string; campaignName: string; spend: number; impressions: number; clicks: number; conversions: number; revenue: number }>> {
        const results = await AdCostModel.findAll({
            attributes: [
                'campaignId', 'campaignName',
                [fn('SUM', col('spend')), 'spend'],
                [fn('SUM', col('impressions')), 'impressions'],
                [fn('SUM', col('clicks')), 'clicks'],
                [fn('SUM', col('conversions')), 'conversions'],
                [fn('SUM', col('revenue')), 'revenue'],
            ],
            where: { tenantId, date: { [Op.between]: [start, end] } },
            group: ['campaignId', 'campaignName'],
            order: [[literal('spend'), 'DESC']],
            raw: true,
        });
        return results.map((r: any) => ({
            campaignId: r.campaignId || '',
            campaignName: r.campaignName || '',
            spend: parseFloat(r.spend) || 0,
            impressions: parseInt(r.impressions, 10) || 0,
            clicks: parseInt(r.clicks, 10) || 0,
            conversions: parseInt(r.conversions, 10) || 0,
            revenue: parseFloat(r.revenue) || 0,
        }));
    }

    async getSpendTrend(tenantId: string, start: Date, end: Date, interval: 'day' | 'week' | 'month'): Promise<Array<{ date: string; spend: number; revenue: number }>> {
        const truncFn = interval === 'day' ? 'day' : interval === 'week' ? 'week' : 'month';
        const results = await sequelize.query(
            `SELECT date_trunc(:interval, date) as date,
                    COALESCE(SUM(spend), 0)::float as spend,
                    COALESCE(SUM(revenue), 0)::float as revenue
             FROM tracking_ad_costs
             WHERE tenant_id = :tenantId AND date BETWEEN :start AND :end
             GROUP BY date_trunc(:interval, date)
             ORDER BY date ASC`,
            {
                replacements: { tenantId, start, end, interval: truncFn },
                type: 'SELECT' as any,
            }
        );
        return (results as any[]).map(r => ({
            date: r.date,
            spend: parseFloat(r.spend) || 0,
            revenue: parseFloat(r.revenue) || 0,
        }));
    }
}
