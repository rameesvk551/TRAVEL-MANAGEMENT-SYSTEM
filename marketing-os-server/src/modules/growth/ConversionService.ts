import { Conversion, ConversionType, AttributionModel } from '../modules/growth/models/Conversion';
import { IConversionRepository } from '../modules/growth/interfaces/IConversionRepository';
import { IAdCostRepository } from '../modules/growth/interfaces/IAdCostRepository';
import { IVisitorRepository } from '../modules/growth/interfaces/IVisitorRepository';

export interface RecordConversionDTO {
    tenantId: string;
    visitorId?: string;
    eventId?: string;
    sourceId?: string;
    campaignId?: string;
    conversionType: ConversionType;
    conversionValue?: number;
    currency?: string;
    landingPage?: string;
    attributionModel?: AttributionModel;
    attributionData?: Record<string, unknown>;
    properties?: Record<string, unknown>;
}

export interface DateRange {
    start: Date;
    end: Date;
}

export class ConversionService {
    constructor(
        private conversionRepository: IConversionRepository,
        private adCostRepository: IAdCostRepository,
        private visitorRepository: IVisitorRepository,
    ) { }

    async recordConversion(dto: RecordConversionDTO): Promise<Conversion> {
        const conversion = Conversion.create({
            tenantId: dto.tenantId,
            visitorId: dto.visitorId,
            eventId: dto.eventId,
            sourceId: dto.sourceId,
            campaignId: dto.campaignId,
            conversionType: dto.conversionType,
            conversionValue: dto.conversionValue,
            currency: dto.currency,
            landingPage: dto.landingPage,
            attributionModel: dto.attributionModel,
            attributionData: dto.attributionData,
            properties: dto.properties,
        });
        return this.conversionRepository.save(conversion);
    }

    async getCostMetrics(tenantId: string, range: DateRange) {
        const [totalSpend, totalConversions, totalConversionValue, totalVisitors, adSpendByPlatform] = await Promise.all([
            this.adCostRepository.getTotalSpend(tenantId, range.start, range.end),
            this.conversionRepository.getTotalCount(tenantId, range.start, range.end),
            this.conversionRepository.getTotalValue(tenantId, range.start, range.end),
            this.visitorRepository.countByDateRange(tenantId, range.start, range.end),
            this.adCostRepository.getSpendByPlatform(tenantId, range.start, range.end),
        ]);

        // Leads = conversions of type 'lead' or 'signup'
        const leadConversions = await this.conversionRepository.countByType(tenantId, range.start, range.end);
        const totalLeads = leadConversions
            .filter(c => c.conversionType === 'lead' || c.conversionType === 'signup')
            .reduce((sum, c) => sum + c.count, 0) || 1;

        const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
        const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
        const cac = totalVisitors > 0 ? totalSpend / totalVisitors : 0;
        const roas = totalSpend > 0 ? totalConversionValue / totalSpend : 0;

        return {
            totalSpend,
            totalConversions,
            totalConversionValue,
            totalVisitors,
            totalLeads,
            cpl: Math.round(cpl * 100) / 100,
            cpa: Math.round(cpa * 100) / 100,
            cac: Math.round(cac * 100) / 100,
            roas: Math.round(roas * 100) / 100,
            adSpendByPlatform,
        };
    }

    async getCampaignConversions(tenantId: string, range: DateRange) {
        return this.conversionRepository.countByCampaign(tenantId, range.start, range.end);
    }

    async getConversionTrend(tenantId: string, range: DateRange, interval: 'day' | 'week' | 'month' = 'day') {
        return this.conversionRepository.getConversionTrend(tenantId, range.start, range.end, interval);
    }

    async getLandingPageConversions(tenantId: string, range: DateRange) {
        const conversions = await this.conversionRepository.findAll(tenantId, {
            startDate: range.start,
            endDate: range.end,
            limit: 1000,
        });

        // Group by landing page
        const pageMap = new Map<string, { visits: number; conversions: number; value: number }>();
        for (const conv of conversions.conversions) {
            const page = conv.landingPage || 'Unknown';
            const existing = pageMap.get(page) || { visits: 0, conversions: 0, value: 0 };
            existing.conversions += 1;
            existing.value += conv.conversionValue;
            pageMap.set(page, existing);
        }

        return Array.from(pageMap.entries())
            .map(([landingPage, data]) => ({
                landingPage,
                conversions: data.conversions,
                value: data.value,
            }))
            .sort((a, b) => b.conversions - a.conversions);
    }

    async getAttributionReport(tenantId: string, range: DateRange) {
        const campaignConversions = await this.conversionRepository.countByCampaign(tenantId, range.start, range.end);
        const adCostByCampaign = await this.adCostRepository.getSpendByCampaign(tenantId, range.start, range.end);

        // Merge conversion data with ad cost data
        const campaignMap = new Map<string, any>();

        for (const ac of adCostByCampaign) {
            campaignMap.set(ac.campaignId, {
                campaignId: ac.campaignId,
                campaignName: ac.campaignName,
                spend: ac.spend,
                impressions: ac.impressions,
                clicks: ac.clicks,
                adConversions: ac.conversions,
                revenue: ac.revenue,
                trackedConversions: 0,
                trackedValue: 0,
            });
        }

        for (const cc of campaignConversions) {
            const existing = campaignMap.get(cc.campaignId);
            if (existing) {
                existing.trackedConversions = cc.count;
                existing.trackedValue = cc.totalValue;
            } else {
                campaignMap.set(cc.campaignId, {
                    campaignId: cc.campaignId,
                    campaignName: 'Unknown',
                    spend: 0,
                    impressions: 0,
                    clicks: 0,
                    adConversions: 0,
                    revenue: 0,
                    trackedConversions: cc.count,
                    trackedValue: cc.totalValue,
                });
            }
        }

        return Array.from(campaignMap.values())
            .sort((a, b) => b.trackedConversions - a.trackedConversions);
    }

    async getAdCreativePerformance(tenantId: string, range: DateRange) {
        return this.adCostRepository.getSpendByCampaign(tenantId, range.start, range.end);
    }

    async getSpendTrend(tenantId: string, range: DateRange, interval: 'day' | 'week' | 'month' = 'day') {
        return this.adCostRepository.getSpendTrend(tenantId, range.start, range.end, interval);
    }
}
