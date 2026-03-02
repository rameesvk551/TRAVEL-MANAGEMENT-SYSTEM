// Tenant-Aware Provider Factory
// Resolves the correct MetaCloudProvider per tenant from DB credentials

import { Pool } from 'pg';
import { createMetaCloudProvider } from './MetaCloudProvider.js';

import { IWhatsAppProvider } from '../interfaces/whatsapp/index.js';
import { createWhatsAppConfigRepository, WhatsAppConfigRow } from '../repositories/WhatsAppConfigRepository.js';
import { getConfig } from '../../../config/index.js';

export function createTenantProviderFactory(configRepo: ReturnType<typeof createWhatsAppConfigRepository>, pool: Pool) {
    const providerCache = new Map<string, { provider: IWhatsAppProvider; expiresAt: number }>();
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    function createProviderFromConfig(config: WhatsAppConfigRow): IWhatsAppProvider {
        const appConfig = getConfig();
        const apiVersion = appConfig.whatsapp.meta?.apiVersion || 'v21.0';

        if (config.credential_source === 'own') {
            // BYO tenant — use their own credentials
            if (!config.access_token || !config.phone_number_id || !config.waba_id) {
                throw new Error(`Tenant ${config.tenant_id} has incomplete WhatsApp credentials. Please configure access_token, phone_number_id, and waba_id in WhatsApp Settings.`);
            }

            return createMetaCloudProvider({
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
                throw new Error(`Managed tenant ${config.tenant_id} missing META_SYSTEM_USER_TOKEN or phone_number_id. Configure these in environment or WhatsApp Settings.`);
            }

            return createMetaCloudProvider({
                accessToken: systemToken,
                phoneNumberId: config.phone_number_id,
                businessAccountId: appWabaId || config.waba_id || '',
                webhookVerifyToken: config.webhook_verify_token || appConfig.whatsapp.verifyToken || '',
                apiVersion,
            });
        }
    }

    function createFallbackProvider(): IWhatsAppProvider {
        const config = getConfig();
        const meta = config.whatsapp.meta;

        if (!meta?.accessToken) {
            console.warn('[TenantProviderFactory] No global WhatsApp credentials set. API calls will fail until tenant-level credentials are configured via Settings.');
        }

        return createMetaCloudProvider({
            accessToken: meta?.accessToken || '',
            phoneNumberId: meta?.phoneNumberId || '',
            businessAccountId: meta?.businessAccountId || '',
            webhookVerifyToken: config.whatsapp.verifyToken || '',
            apiVersion: meta?.apiVersion || 'v21.0',
        });
    }

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
    async function getProviderForTenant(tenantId: string): Promise<IWhatsAppProvider> {
        // 1. Check cache
        const cached = providerCache.get(tenantId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.provider;
        }

        // 2. Look up tenant config from DB
        const tenantConfig = await configRepo.findByTenantId(tenantId);

        let provider: IWhatsAppProvider;

        if (tenantConfig && tenantConfig.status === 'connected') {
            provider = createProviderFromConfig(tenantConfig);
        } else {
            // 3. Fallback to global env config
            provider = createFallbackProvider();
        }

        // Cache the provider
        providerCache.set(tenantId, {
            provider,
            expiresAt: Date.now() + CACHE_TTL_MS,
        });

        return provider;
    }

    /**
     * Get the resolved credentials for a tenant (for direct API calls like template sync).
     * Returns { accessToken, wabaId, phoneNumberId } or null.
     */
    async function getCredentialsForTenant(tenantId: string): Promise<{
        accessToken: string;
        wabaId: string;
        phoneNumberId: string;
        credentialSource: 'own' | 'managed';
    } | null> {
        const tenantConfig = await configRepo.findByTenantId(tenantId);

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
    function invalidateCache(tenantId: string): void {
        providerCache.delete(tenantId);
    }

    /**
     * Clear the entire provider cache
     */
    function clearCache(): void {
        providerCache.clear();
    }

    return { getProviderForTenant, getCredentialsForTenant, invalidateCache, clearCache };
}
