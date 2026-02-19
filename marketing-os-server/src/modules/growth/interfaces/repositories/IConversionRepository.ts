import { Conversion, ConversionType } from '../entities/Conversion.js';

export interface ConversionFilters {
    conversionType?: ConversionType;
    campaignId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export interface IConversionRepository {
    save(conversion: Conversion): Promise<Conversion>;
    findAll(tenantId: string, filters?: ConversionFilters): Promise<{ conversions: Conversion[]; total: number }>;
    countByType(tenantId: string, start: Date, end: Date): Promise<Array<{ conversionType: string; count: number; totalValue: number }>>;
    countByCampaign(tenantId: string, start: Date, end: Date): Promise<Array<{ campaignId: string; count: number; totalValue: number }>>;
    getConversionTrend(tenantId: string, start: Date, end: Date, interval: 'day' | 'week' | 'month'): Promise<Array<{ date: string; count: number; value: number }>>;
    getTotalValue(tenantId: string, start: Date, end: Date): Promise<number>;
    getTotalCount(tenantId: string, start: Date, end: Date): Promise<number>;
}
