// WhatsApp Business Config Repository
// Persists per-tenant WABA credentials (BYO + Managed)

import { Pool } from 'pg';
import { decryptSecret, encryptSecret } from '../security/tokenCipher.js';

export interface WhatsAppConfigRow {
    id: string;
    tenant_id: string;
    credential_source: 'own' | 'managed';
    status: 'pending' | 'connected' | 'disconnected' | 'error';
    onboarding_method: 'manual' | 'embedded_signup';
    access_token: string | null;
    phone_number_id: string | null;
    waba_id: string | null;
    business_id: string | null;
    phone_display: string | null;
    verified_name: string | null;
    quality_rating: string | null;
    business_name: string | null;
    webhook_verify_token: string | null;
    features: Record<string, boolean>;
    rate_limits: Record<string, any>;
    connected_at: Date | null;
    last_sync_at: Date | null;
    error_message: string | null;
    created_at: Date;
    updated_at: Date;
}

function mapRow(row: any): WhatsAppConfigRow | null {
    if (!row) return null;
    const mapped = { ...row };
    if (mapped.access_token) {
        try {
            mapped.access_token = decryptSecret(mapped.access_token);
        } catch (error) {
            console.error('[WhatsAppConfigRepository] Failed to decrypt access token for tenant:', mapped.tenant_id, error);
            mapped.access_token = null;
        }
    }
    return mapped as WhatsAppConfigRow;
}

export function createWhatsAppConfigRepository(pool: Pool) {

    async function findByTenantId(tenantId: string): Promise<WhatsAppConfigRow | null> {
        const result = await pool.query(
            `SELECT * FROM whatsapp_business_configs WHERE tenant_id = $1`,
            [tenantId]
        );
        return mapRow(result.rows[0] || null);
    }

    async function findByWabaId(wabaId: string): Promise<WhatsAppConfigRow[]> {
        const result = await pool.query(
            `SELECT * FROM whatsapp_business_configs WHERE waba_id = $1`,
            [wabaId]
        );
        return result.rows.map((row) => mapRow(row) as WhatsAppConfigRow);
    }

    async function findAllConnected(): Promise<WhatsAppConfigRow[]> {
        const result = await pool.query(
            `SELECT * FROM whatsapp_business_configs WHERE status = 'connected' ORDER BY connected_at DESC`
        );
        return result.rows.map((row) => mapRow(row) as WhatsAppConfigRow);
    }

    async function save(config: {
        tenantId: string;
        credentialSource: 'own' | 'managed';
        status?: string;
        onboardingMethod?: string;
        accessToken?: string | null;
        phoneNumberId?: string | null;
        wabaId?: string | null;
        businessId?: string | null;
        phoneDisplay?: string | null;
        verifiedName?: string | null;
        qualityRating?: string | null;
        businessName?: string | null;
        webhookVerifyToken?: string | null;
        features?: Record<string, boolean>;
        rateLimits?: Record<string, any>;
    }): Promise<WhatsAppConfigRow> {
        const query = `
      INSERT INTO whatsapp_business_configs (
        tenant_id, credential_source, status, onboarding_method,
        access_token, phone_number_id, waba_id, business_id,
        phone_display, verified_name, quality_rating,
        business_name, webhook_verify_token, features, rate_limits,
        connected_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
      ON CONFLICT (tenant_id)
      DO UPDATE SET
        credential_source = EXCLUDED.credential_source, status = EXCLUDED.status,
        onboarding_method = COALESCE(EXCLUDED.onboarding_method, whatsapp_business_configs.onboarding_method),
        access_token = EXCLUDED.access_token, phone_number_id = EXCLUDED.phone_number_id,
        waba_id = EXCLUDED.waba_id, business_id = EXCLUDED.business_id,
        phone_display = EXCLUDED.phone_display, verified_name = EXCLUDED.verified_name,
        quality_rating = EXCLUDED.quality_rating, business_name = EXCLUDED.business_name,
        webhook_verify_token = COALESCE(EXCLUDED.webhook_verify_token, whatsapp_business_configs.webhook_verify_token),
        features = COALESCE(EXCLUDED.features, whatsapp_business_configs.features),
        rate_limits = COALESCE(EXCLUDED.rate_limits, whatsapp_business_configs.rate_limits),
        connected_at = EXCLUDED.connected_at, updated_at = NOW()
      RETURNING *`;
        const result = await pool.query(query, [
            config.tenantId, config.credentialSource, config.status || 'connected',
            config.onboardingMethod || 'manual', encryptSecret(config.accessToken || null),
            config.phoneNumberId || null, config.wabaId || null, config.businessId || null,
            config.phoneDisplay || null, config.verifiedName || null, config.qualityRating || null,
            config.businessName || null, config.webhookVerifyToken || null,
            JSON.stringify(config.features || {}), JSON.stringify(config.rateLimits || {}),
            config.status === 'connected' ? new Date() : null,
        ]);
        return mapRow(result.rows[0]) as WhatsAppConfigRow;
    }

    async function updateStatus(tenantId: string, status: string, errorMessage?: string): Promise<void> {
        await pool.query(
            `UPDATE whatsapp_business_configs SET status = $2, error_message = $3, updated_at = NOW() WHERE tenant_id = $1`,
            [tenantId, status, errorMessage || null]
        );
    }

    async function updateLastSync(tenantId: string): Promise<void> {
        await pool.query(
            `UPDATE whatsapp_business_configs SET last_sync_at = NOW(), updated_at = NOW() WHERE tenant_id = $1`,
            [tenantId]
        );
    }

    async function deleteConfig(tenantId: string): Promise<void> {
        await pool.query(
            `DELETE FROM whatsapp_business_configs WHERE tenant_id = $1`,
            [tenantId]
        );
    }

    return { findByTenantId, findByWabaId, findAllConnected, save, updateStatus, updateLastSync, delete: deleteConfig };
}
