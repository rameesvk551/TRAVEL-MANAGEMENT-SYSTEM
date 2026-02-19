import { AdCost, AdPlatform } from '../entities/AdCost.js';

export interface AdCostFilters {
    platform?: AdPlatform;
    campaignId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export interface IAdCostRepository {
    save(adCost: AdCost): Promise<AdCost>;
    saveBatch(adCosts: AdCost[]): Promise<void>;
    findAll(tenantId: string, filters?: AdCostFilters): Promise<{ adCosts: AdCost[]; total: number }>;
    getTotalSpend(tenantId: string, start: Date, end: Date): Promise<number>;
    getSpendByPlatform(tenantId: string, start: Date, end: Date): Promise<Array<{ platform: string; spend: number; impressions: number; clicks: number; conversions: number }>>;
    getSpendByCampaign(tenantId: string, start: Date, end: Date): Promise<Array<{ campaignId: string; campaignName: string; spend: number; impressions: number; clicks: number; conversions: number; revenue: number }>>;
    getSpendTrend(tenantId: string, start: Date, end: Date, interval: 'day' | 'week' | 'month'): Promise<Array<{ date: string; spend: number; revenue: number }>>;
}
