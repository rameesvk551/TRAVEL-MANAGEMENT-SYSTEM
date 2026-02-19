import { TrafficSource, SourceType } from '../entities/TrafficSource.js';

export interface SourceFilters {
    sourceType?: SourceType;
    utmCampaign?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export interface ITrafficSourceRepository {
    save(source: TrafficSource): Promise<TrafficSource>;
    findAll(tenantId: string, filters?: SourceFilters): Promise<{ sources: TrafficSource[]; total: number }>;
    countBySourceType(tenantId: string, start: Date, end: Date): Promise<Array<{ sourceType: string; count: number }>>;
    getUTMBreakdown(tenantId: string, start: Date, end: Date): Promise<Array<{
        utmSource: string;
        utmMedium: string;
        utmCampaign: string;
        count: number;
    }>>;
    getLandingPageStats(tenantId: string, start: Date, end: Date): Promise<Array<{ landingPage: string; count: number }>>;
}
