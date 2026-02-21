// Tenant-Aware Provider Factory
// Resolves the correct MetaCloudProvider per tenant from DB credentials

import { Pool } from 'pg';
import { MetaCloudProvider } from './MetaCloudProvider.js';
import { MockProvider } from './MockProvider.js';
import { IWhatsAppProvider } from '../interfaces/whatsapp/index.js';
import { WhatsAppConfigRepository, WhatsAppConfigRow } from '../repositories/WhatsAppConfigRepository.js';
import { getConfig } from '../../../config/index.js';

export class TenantProviderFactory {
    private providerCache = new Map<string, { provider: IWhatsAppProvider; expiresAt: number }>();
    private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    constructor(
        private configRepo: WhatsAppConfigRepository,
        private pool: Pool
    ) { }

    /**
     * Get the WhatsApp provider for a specific tenant.
     * 
     * Resolution order:
     * 1. Check cache → return if valid
     * 2. Lookup DB → create provider from tenant config
     *    - BYO:     uses tenant's own accessToken
     *    - Managed: uses META_SYSTEM_USER_TOKEN from env + tenant's phoneNumberId
     * 3. Fallback → global env vars (existing behavior)
     */
    async getProviderForTenant(tenantId: string): Promise<IWhatsAppProvider> {
        // 1. Check cache
        const cached = this.providerCache.get(tenantId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.provider;
        }

        // 2. Look up tenant config from DB
        const tenantConfig = await this.configRepo.findByTenantId(tenantId);

        let provider: IWhatsAppProvider;

        if (tenantConfig && tenantConfig.status === 'connected') {
            provider = this.createProviderFromConfig(tenantConfig);
        } else {
            // 3. Fallback to global env config
            provider = this.createFallbackProvider();
        }

        // Cache the provider
        this.providerCache.set(tenantId, {
            provider,
            expiresAt: Date.now() + this.CACHE_TTL_MS,
        });

        return provider;
    }

    /**
     * Get the resolved credentials for a tenant (for direct API calls like template sync).
     * Returns { accessToken, wabaId, phoneNumberId } or null.
     */
    async getCredentialsForTenant(tenantId: string): Promise<{
        accessToken: string;
        wabaId: string;
        phoneNumberId: string;
        credentialSource: 'own' | 'managed';
    } | null> {
        const tenantConfig = await this.configRepo.findByTenantId(tenantId);

        if (!tenantConfig || tenantConfig.status !== 'connected') {
            return null;
        }

        // Handle both explicit 'own' source and legacy manual connections which might not explicitly say 'own' but have the tokens
        if (tenantConfig.credential_source === 'own' || (tenantConfig.access_token && tenantConfig.waba_id)) {
            // BYO: Use tenant's own token
            if (!tenantConfig.access_token || !tenantConfig.waba_id || !tenantConfig.phone_number_id) {
                return null;
            }
            return {
                accessToken: tenantConfig.access_token,
                wabaId: tenantConfig.waba_id,
                phoneNumberId: tenantConfig.phone_number_id,
                credentialSource: 'own',
            };
        } else {
            // Managed: Use system user token from env
            const systemToken = process.env.META_SYSTEM_USER_TOKEN;
            const appWabaId = process.env.META_APP_WABA_ID;

            if (!systemToken || !appWabaId || !tenantConfig.phone_number_id) {
                console.warn(`[TenantProviderFactory] Managed tenant ${tenantId} missing system token or WABA ID`);
                return null;
            }

            return {
                accessToken: systemToken,
                wabaId: appWabaId,
                phoneNumberId: tenantConfig.phone_number_id,
                credentialSource: 'managed',
            };
        }
    }

    /**
     * Invalidate cached provider for a tenant (after credential update)
     */
    invalidateCache(tenantId: string): void {
        this.providerCache.delete(tenantId);
    }

    /**
     * Clear the entire provider cache
     */
    clearCache(): void {
        this.providerCache.clear();
    }

    // ── Private ──

    private createProviderFromConfig(config: WhatsAppConfigRow): IWhatsAppProvider {
        const appConfig = getConfig();
        const apiVersion = appConfig.whatsapp.meta?.apiVersion || 'v21.0';

        if (config.credential_source === 'own') {
            // BYO tenant — use their own credentials
            if (!config.access_token || !config.phone_number_id || !config.waba_id) {
                console.warn(`[TenantProviderFactory] BYO tenant ${config.tenant_id} has incomplete credentials, using mock`);
                return new MockProvider();
            }

            return new MetaCloudProvider({
                accessToken: config.access_token,
                phoneNumberId: config.phone_number_id,
                businessAccountId: config.waba_id,
                webhookVerifyToken: config.webhook_verify_token || appConfig.whatsapp.verifyToken || '',
                apiVersion,
            });
        } else {
            // Managed tenant — use system user token from env
            const systemToken = process.env.META_SYSTEM_USER_TOKEN;
            const appWabaId = process.env.META_APP_WABA_ID;

            if (!systemToken || !config.phone_number_id) {
                console.warn(`[TenantProviderFactory] Managed tenant ${config.tenant_id} missing system token, using mock`);
                return new MockProvider();
            }

            return new MetaCloudProvider({
                accessToken: systemToken,
                phoneNumberId: config.phone_number_id,
                businessAccountId: appWabaId || config.waba_id || '',
                webhookVerifyToken: config.webhook_verify_token || appConfig.whatsapp.verifyToken || '',
                apiVersion,
            });
        }
    }

    private createFallbackProvider(): IWhatsAppProvider {
        const config = getConfig();
        const providerType = config.whatsapp?.provider || 'mock';

        if (providerType === 'meta' && config.whatsapp.meta?.accessToken) {
            return new MetaCloudProvider({
                accessToken: config.whatsapp.meta.accessToken,
                phoneNumberId: config.whatsapp.meta.phoneNumberId || '',
                businessAccountId: config.whatsapp.meta.businessAccountId || '',
                webhookVerifyToken: config.whatsapp.verifyToken || '',
                apiVersion: config.whatsapp.meta.apiVersion || 'v21.0',
            });
        }

        return new MockProvider();
    }
}
