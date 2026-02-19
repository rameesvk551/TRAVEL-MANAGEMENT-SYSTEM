import client from './client';

export interface SourceBreakdown {
    sourceType: string;
    count: number;
}

export interface UTMData {
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    count: number;
}

export interface GeoData {
    country: string;
    count: number;
}

export interface DeviceData {
    deviceType: string;
    count: number;
}

export interface CostMetrics {
    totalSpend: number;
    totalConversions: number;
    totalConversionValue: number;
    totalVisitors: number;
    totalLeads: number;
    cpl: number;
    cpa: number;
    cac: number;
    roas: number;
    adSpendByPlatform: Array<{
        platform: string;
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
    }>;
}

export interface ConversionTrend {
    date: string;
    count: number;
    value: number;
}

export interface GrowthOverview {
    totalVisitors: number;
    totalEvents: number;
    pageviews: number;
    sourceBreakdown: SourceBreakdown[];
    geoBreakdown: GeoData[];
    deviceBreakdown: DeviceData[];
    topLandingPages: Array<{ landingPage: string; count: number }>;
}

export interface IntegrationStatus {
    platform: string;
    configured: boolean;
    connected: boolean;
    message: string;
}

export interface SyncCostsResponse {
    synced: number;
    errors: Array<{ platform: string; error: string }>;
    dateRange: {
        start: string;
        end: string;
    };
}

export interface IntegrationCredentialStatus {
    platform: string;
    isActive: boolean;
    hasCredentials: boolean;
    masked: Record<string, string>;
}

export interface MetaAudienceInsights {
    ageGender: Array<{
        age: string;
        gender: string;
        impressions: number;
        clicks: number;
        spend: number;
        conversions: number;
    }>;
    ageBreakdown: Array<{ age: string; users: number }>;
    genderBreakdown: Array<{ gender: string; users: number }>;
    interests: Array<{ interest: string; count: number }>;
    newVsReturning: { newUsers: number; returningUsers: number };
}

export interface GoogleKeywordPerformance {
    campaignName: string;
    adGroupName: string;
    keyword: string;
    matchType: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
    cpc: number;
}

export interface GoogleSearchTermPerformance {
    campaignName: string;
    adGroupName: string;
    searchTerm: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
}

export interface GA4BehaviorData {
    overview: {
        users: number;
        sessions: number;
        engagedSessions: number;
        avgEngagementTime: number;
    };
    topPages: Array<{ pagePath: string; views: number; users: number; avgSessionDuration: number }>;
    trafficSources: Array<{ sourceMedium: string; sessions: number; users: number }>;
    devices: Array<{ deviceCategory: string; users: number; sessions: number }>;
    geo: Array<{ country: string; city: string; users: number }>;
}

export interface GA4FunnelData {
    steps: Array<{ step: string; users: number; dropOffRate: number }>;
}

type QueryParams = Record<string, string | undefined>;
type AttributionData = Record<string, unknown>;

function withQuery(path: string, params?: QueryParams): string {
    if (!params) return path;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            searchParams.append(key, value);
        }
    });

    const query = searchParams.toString();
    return query ? `${path}?${query}` : path;
}

export const growthApi = {
    getOverview: async (start?: string, end?: string) => {
        const response = await client.get<GrowthOverview>(
            withQuery('/growth/analytics/overview', { start, end })
        );
        return response.data;
    },

    getSources: async (start?: string, end?: string) => {
        const response = await client.get<{ sources: SourceBreakdown[] }>(
            withQuery('/growth/analytics/sources', { start, end })
        );
        return response.data;
    },

    getUTM: async (start?: string, end?: string) => {
        const response = await client.get<{ utmData: UTMData[] }>(
            withQuery('/growth/analytics/utm', { start, end })
        );
        return response.data;
    },

    getGeo: async (start?: string, end?: string) => {
        const response = await client.get<{ geoData: GeoData[] }>(
            withQuery('/growth/analytics/geo', { start, end })
        );
        return response.data;
    },

    getDevices: async (start?: string, end?: string) => {
        const response = await client.get<{ deviceData: DeviceData[] }>(
            withQuery('/growth/analytics/devices', { start, end })
        );
        return response.data;
    },

    getCostMetrics: async (start?: string, end?: string) => {
        const response = await client.get<CostMetrics>(
            withQuery('/growth/analytics/cost-metrics', { start, end })
        );
        return response.data;
    },

    getConversionTrend: async (start?: string, end?: string, interval?: string) => {
        const response = await client.get<{ trend: ConversionTrend[] }>(
            withQuery('/growth/analytics/conversions/trend', { start, end, interval })
        );
        return response.data;
    },

    getAttribution: async (start?: string, end?: string) => {
        const response = await client.get<{ attribution: AttributionData[] }>(
            withQuery('/growth/analytics/attribution', { start, end })
        );
        return response.data;
    },

    getLandingPages: async (start?: string, end?: string) => {
        const response = await client.get<{ pages: Array<{ landingPage: string; count: number }> }>(
            withQuery('/growth/analytics/landing-pages', { start, end })
        );
        return response.data;
    },

    getRealtimeCount: async () => {
        const response = await client.get<{ count: number }>('/growth/realtime');
        return response.data;
    },

    getSpendTrend: async (start?: string, end?: string, interval?: string) => {
        const response = await client.get<{ trend: Array<{ date: string; spend: number; revenue: number }> }>(
            withQuery('/growth/analytics/spend-trend', { start, end, interval })
        );
        return response.data;
    },

    getIntegrationStatus: async () => {
        const response = await client.get<{ success: boolean; data: IntegrationStatus[] }>('/growth/integrations/status');
        return response.data.data;
    },

    testIntegration: async (platform?: string) => {
        const response = await client.post<{ success: boolean; data: IntegrationStatus | IntegrationStatus[] }>(
            '/growth/integrations/test',
            platform ? { platform } : {}
        );
        return response.data.data;
    },

    syncAdCosts: async (startDate?: string, endDate?: string) => {
        const response = await client.post<{ success: boolean; data: SyncCostsResponse }>(
            '/growth/integrations/sync-costs',
            { startDate, endDate }
        );
        return response.data.data;
    },

    getIntegrationCredentials: async () => {
        const response = await client.get<{ success: boolean; data: IntegrationCredentialStatus[] }>(
            '/growth/integrations/credentials'
        );
        return response.data.data;
    },

    saveIntegrationCredentials: async (
        platform: string,
        credentials: Record<string, string>,
        isActive: boolean = true,
    ) => {
        const response = await client.put<{ success: boolean; data: IntegrationStatus }>(
            `/growth/integrations/credentials/${platform}`,
            { credentials, isActive },
        );
        return response.data.data;
    },

    getMetaAudienceInsights: async (startDate?: string, endDate?: string) => {
        const response = await client.get<{ success: boolean; data: MetaAudienceInsights }>(
            withQuery('/growth/integrations/meta/audience', { startDate, endDate })
        );
        return response.data.data;
    },

    getGoogleKeywordPerformance: async (startDate?: string, endDate?: string) => {
        const response = await client.get<{ success: boolean; data: GoogleKeywordPerformance[] }>(
            withQuery('/growth/integrations/google/keywords', { startDate, endDate })
        );
        return response.data.data;
    },

    getGoogleSearchTerms: async (startDate?: string, endDate?: string) => {
        const response = await client.get<{ success: boolean; data: GoogleSearchTermPerformance[] }>(
            withQuery('/growth/integrations/google/search-terms', { startDate, endDate })
        );
        return response.data.data;
    },

    getGA4Behavior: async (startDate?: string, endDate?: string) => {
        const response = await client.get<{ success: boolean; data: GA4BehaviorData }>(
            withQuery('/growth/integrations/google/ga4/behavior', { startDate, endDate })
        );
        return response.data.data;
    },

    getGA4Funnels: async (startDate?: string, endDate?: string) => {
        const response = await client.get<{ success: boolean; data: GA4FunnelData }>(
            withQuery('/growth/integrations/google/ga4/funnels', { startDate, endDate })
        );
        return response.data.data;
    },
};
