import { IAdPlatformAdapter, AdPlatformEvent } from '../../../infrastructure/growth/integrations/IAdPlatformAdapter.js';
import { IAdCostRepository } from '../modules/growth/interfaces/IAdCostRepository.js';
import { AdCost, type AdPlatform } from '../modules/growth/models/AdCost.js';
import { MetaAdsAdapter } from '../../../infrastructure/growth/integrations/MetaAdsAdapter.js';
import { GoogleAdsAdapter } from '../../../infrastructure/growth/integrations/GoogleAdsAdapter.js';
import {
    SequelizeIntegrationCredentialRepository,
    type IntegrationCredentialRecord,
} from '../modules/growth.js';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

/**
 * Orchestrates all ad platform integrations.
 * 
 * - Sends server-side events to all configured platforms
 * - Syncs ad cost data from platforms into the local database
 * - Reports integration status
 */
export class IntegrationService {
    constructor(
        private adCostRepository: IAdCostRepository,
        private credentialRepository: SequelizeIntegrationCredentialRepository,
    ) {
    }

    private buildAdapter(platform: string, record?: IntegrationCredentialRecord | null): IAdPlatformAdapter {
        // Tenant credentials override env credentials when present and active.
        if (platform === 'meta') {
            const credentials = record?.isActive ? (record.credentials || {}) : {};
            return new MetaAdsAdapter({
                pixelId: credentials.pixelId,
                accessToken: credentials.accessToken,
                adAccountId: credentials.adAccountId,
                apiVersion: credentials.apiVersion,
            });
        }

        const credentials = record?.isActive ? (record.credentials || {}) : {};
        return new GoogleAdsAdapter({
            customerId: credentials.customerId,
            developerToken: credentials.developerToken,
            refreshToken: credentials.refreshToken,
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            loginCustomerId: credentials.loginCustomerId,
            conversionActionId: credentials.conversionActionId,
            ga4PropertyId: credentials.ga4PropertyId,
            ga4MeasurementId: credentials.ga4MeasurementId,
            ga4ApiSecret: credentials.ga4ApiSecret,
            currency: credentials.currency,
        });
    }

    private async resolveTenantAdapters(tenantId: string): Promise<Array<{ platform: string; adapter: IAdPlatformAdapter; record: IntegrationCredentialRecord | null }>> {
        const records = await this.credentialRepository.getByTenant(tenantId);
        const map = new Map<string, IntegrationCredentialRecord>();
        records.forEach(r => map.set(r.platform, r));

        return ['meta', 'google'].map((platform) => {
            const record = map.get(platform) || null;
            const adapter = this.buildAdapter(platform, record);
            return { platform, adapter, record };
        });
    }

    /**
     * Forward a server-side event to all configured platforms.
     */
    async broadcastEvent(
        event: AdPlatformEvent,
        tenantId: string,
    ): Promise<Array<{ platform: string; success: boolean; eventId?: string; error?: string }>> {
        const tenantAdapters = await this.resolveTenantAdapters(tenantId);
        const results = await Promise.allSettled(
            tenantAdapters
                .filter(a => a.record?.isActive !== false)
                .filter(a => a.adapter.isConfigured)
                .map(async ({ adapter }) => {
                    const result = await adapter.sendEvent(event);
                    return { platform: adapter.platform, ...result };
                })
        );

        return results.map(r => {
            if (r.status === 'fulfilled') return r.value;
            return { platform: 'unknown', success: false, error: String(r.reason) };
        });
    }

    /**
     * Sync ad costs from all configured platforms into the database.
     */
    async syncAdCosts(tenantId: string, startDate: Date, endDate: Date): Promise<{
        synced: number;
        errors: Array<{ platform: string; error: string }>;
    }> {
        let synced = 0;
        const errors: Array<{ platform: string; error: string }> = [];
        const tenantAdapters = await this.resolveTenantAdapters(tenantId);

        for (const { adapter, record } of tenantAdapters.filter(a => a.record?.isActive !== false).filter(a => a.adapter.isConfigured)) {
            try {
                const costData = await adapter.fetchAdCosts(tenantId, startDate, endDate);

                for (const item of costData) {
                    const adCost = AdCost.create({
                        tenantId,
                        platform: adapter.platform as AdPlatform,
                        campaignId: item.campaignId,
                        campaignName: item.campaignName,
                        adSetId: item.adSetId,
                        adSetName: item.adSetName,
                        adId: item.adId,
                        adName: item.adName,
                        spend: item.spend,
                        impressions: item.impressions,
                        clicks: item.clicks,
                        conversions: item.conversions,
                        revenue: item.revenue,
                        currency: item.currency,
                        date: item.date,
                    });
                    await this.adCostRepository.save(adCost);
                    synced++;
                }
            } catch (error: any) {
                console.error(`[IntegrationService] Error syncing ${adapter.platform} costs:`, error.message);
                errors.push({ platform: adapter.platform, error: error.message });
            }
        }

        return { synced, errors };
    }

    /**
     * Get the status of all integration adapters.
     */
    async getIntegrationStatus(tenantId: string): Promise<Array<{ platform: string; configured: boolean; connected: boolean; message: string }>> {
        const tenantAdapters = await this.resolveTenantAdapters(tenantId);
        const results = await Promise.allSettled(
            tenantAdapters.map(async ({ platform, adapter, record }) => {
                if (record && !record.isActive) {
                    return {
                        platform,
                        configured: false,
                        connected: false,
                        message: 'Integration disabled for this tenant.',
                    };
                }

                const test = await adapter.testConnection();
                return {
                    platform: adapter.platform,
                    configured: adapter.isConfigured,
                    connected: test.connected,
                    message: test.message,
                };
            })
        );

        return results.map(r => {
            if (r.status === 'fulfilled') return r.value;
            return { platform: 'unknown', configured: false, connected: false, message: String(r.reason) };
        });
    }

    async saveTenantCredentials(
        tenantId: string,
        platform: string,
        credentials: Record<string, string>,
        isActive: boolean = true,
    ): Promise<void> {
        const normalizedPlatform = platform.toLowerCase();
        if (!['meta', 'google'].includes(normalizedPlatform)) {
            throw new Error(`Unsupported platform: ${platform}`);
        }

        const sanitized: Record<string, string> = {};
        Object.entries(credentials || {}).forEach(([key, value]) => {
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed.length > 0) sanitized[key] = trimmed;
            }
        });

        const existing = await this.credentialRepository.getByPlatform(tenantId, normalizedPlatform);
        const mergedCredentials = { ...(existing?.credentials || {}), ...sanitized };

        await this.credentialRepository.upsert(tenantId, normalizedPlatform, mergedCredentials, isActive);
    }

    async getTenantCredentials(tenantId: string): Promise<Array<{
        platform: string;
        isActive: boolean;
        hasCredentials: boolean;
        masked: Record<string, string>;
    }>> {
        const records = await this.credentialRepository.getByTenant(tenantId);
        const map = new Map(records.map(r => [r.platform, r]));

        const platforms = ['meta', 'google'];
        return platforms.map((platform) => {
            const record = map.get(platform);
            const credentials = record?.credentials || {};
            const masked: Record<string, string> = {};
            Object.entries(credentials).forEach(([k, v]) => {
                masked[k] = this.maskSecret(v);
            });
            return {
                platform,
                isActive: record?.isActive !== false,
                hasCredentials: Object.keys(credentials).length > 0,
                masked,
            };
        });
    }

    private maskSecret(value: string): string {
        if (!value) return '';
        if (value.length <= 6) return '***';
        return `${value.slice(0, 2)}***${value.slice(-2)}`;
    }

    /**
     * Get list of configured platform names.
     */
    async getConfiguredPlatforms(tenantId: string): Promise<string[]> {
        const tenantAdapters = await this.resolveTenantAdapters(tenantId);
        return tenantAdapters
            .filter(a => a.record?.isActive !== false)
            .filter(a => a.adapter.isConfigured)
            .map(a => a.adapter.platform);
    }

    async getMetaAudienceInsights(tenantId: string, startDate: Date, endDate: Date): Promise<{
        ageGender: Array<{ age: string; gender: string; impressions: number; clicks: number; spend: number; conversions: number }>;
        ageBreakdown: Array<{ age: string; users: number }>;
        genderBreakdown: Array<{ gender: string; users: number }>;
        interests: Array<{ interest: string; count: number }>;
        newVsReturning: { newUsers: number; returningUsers: number };
    }> {
        const adapter = await this.getMetaAdapter(tenantId);
        if (!adapter) {
            return {
                ageGender: [],
                ageBreakdown: [],
                genderBreakdown: [],
                interests: [],
                newVsReturning: { newUsers: 0, returningUsers: 0 },
            };
        }

        const [ageGenderRows, interests, newVsReturning] = await Promise.all([
            adapter.fetchAudienceBreakdown(startDate, endDate),
            adapter.fetchTargetingInterests(25),
            this.getNewVsReturning(tenantId, startDate, endDate),
        ]);

        const ageMap = new Map<string, number>();
        const genderMap = new Map<string, number>();
        for (const row of ageGenderRows) {
            ageMap.set(row.age, (ageMap.get(row.age) || 0) + row.impressions);
            genderMap.set(row.gender, (genderMap.get(row.gender) || 0) + row.impressions);
        }

        return {
            ageGender: ageGenderRows,
            ageBreakdown: Array.from(ageMap.entries())
                .map(([age, users]) => ({ age, users }))
                .sort((a, b) => b.users - a.users),
            genderBreakdown: Array.from(genderMap.entries())
                .map(([gender, users]) => ({ gender, users }))
                .sort((a, b) => b.users - a.users),
            interests,
            newVsReturning,
        };
    }

    async getGoogleKeywordPerformance(tenantId: string, startDate: Date, endDate: Date) {
        const adapter = await this.getGoogleAdapter(tenantId);
        if (!adapter) return [];
        return adapter.fetchKeywordPerformance(startDate, endDate);
    }

    async getGoogleSearchTerms(tenantId: string, startDate: Date, endDate: Date) {
        const adapter = await this.getGoogleAdapter(tenantId);
        if (!adapter) return [];
        return adapter.fetchSearchTerms(startDate, endDate);
    }

    async getGa4Behavior(tenantId: string, startDate: Date, endDate: Date) {
        const adapter = await this.getGoogleAdapter(tenantId);
        if (!adapter) {
            return {
                overview: { users: 0, sessions: 0, engagedSessions: 0, avgEngagementTime: 0 },
                topPages: [],
                trafficSources: [],
                devices: [],
                geo: [],
            };
        }
        return adapter.fetchGA4Behavior(startDate, endDate);
    }

    async getGa4Funnels(tenantId: string, startDate: Date, endDate: Date) {
        const adapter = await this.getGoogleAdapter(tenantId);
        if (!adapter) return { steps: [] };
        return adapter.fetchGA4Funnels(startDate, endDate);
    }

    private async getMetaAdapter(tenantId: string): Promise<MetaAdsAdapter | null> {
        const adapters = await this.resolveTenantAdapters(tenantId);
        const found = adapters.find(a => a.platform === 'meta');
        if (!found || found.record?.isActive === false) return null;
        return found.adapter instanceof MetaAdsAdapter ? found.adapter : null;
    }

    private async getGoogleAdapter(tenantId: string): Promise<GoogleAdsAdapter | null> {
        const adapters = await this.resolveTenantAdapters(tenantId);
        const found = adapters.find(a => a.platform === 'google');
        if (!found || found.record?.isActive === false) return null;
        return found.adapter instanceof GoogleAdsAdapter ? found.adapter : null;
    }

    private async getNewVsReturning(tenantId: string, startDate: Date, endDate: Date): Promise<{ newUsers: number; returningUsers: number }> {
        const [result] = await sequelize.query(
            `SELECT
                COALESCE(SUM(CASE WHEN first_seen BETWEEN :startDate AND :endDate THEN 1 ELSE 0 END), 0)::int AS new_users,
                COALESCE(SUM(CASE WHEN visit_count > 1 AND last_seen BETWEEN :startDate AND :endDate THEN 1 ELSE 0 END), 0)::int AS returning_users
             FROM tracking_visitors
             WHERE tenant_id = :tenantId`,
            {
                replacements: { tenantId, startDate, endDate },
                type: QueryTypes.SELECT,
            }
        ) as any[];

        return {
            newUsers: Number(result?.new_users || 0),
            returningUsers: Number(result?.returning_users || 0),
        };
    }
}
