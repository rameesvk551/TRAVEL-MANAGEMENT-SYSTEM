// controllers/SettingsController.ts
// Isolated controller for WhatsApp connection settings (manual credentials).
// Handles: get connection, save manual config, update, test, disconnect, regenerate token.

import type { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export function createSettingsController(
    waConfigRepo: {
        findByTenantId: (tenantId: string) => Promise<any>;
        save: (config: any) => Promise<any>;
        updateStatus: (tenantId: string, status: string, error?: string) => Promise<void>;
        delete: (tenantId: string) => Promise<void>;
    },
    tenantProviderFactory: {
        getProviderForTenant: (tenantId: string) => Promise<any>;
    },
    pool: Pool
) {
    // ────────────────────────────────────────────
    // GET  /settings — current connection state
    // ────────────────────────────────────────────
    const getConnection = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const config = await waConfigRepo.findByTenantId(tenantId);
            if (!config) {
                res.json({ data: null });
                return;
            }

            // Never return full access_token — only last 4 chars
            res.json({
                data: mapToConnection(config),
            });
        } catch (error) { next(error); }
    };

    // ────────────────────────────────────────────
    // POST /settings/manual — save new manual config
    // ────────────────────────────────────────────
    const saveManualConfig = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const {
                whatsappBusinessAccountId,
                phoneNumberId,
                accessToken,
                verifyToken,
                webhookUrl,
                displayPhoneNumber,
                businessName,
            } = req.body;

            if (!phoneNumberId || !accessToken) {
                res.status(400).json({ error: 'phoneNumberId and accessToken are required' });
                return;
            }

            const saved = await waConfigRepo.save({
                tenantId,
                credentialSource: 'own',
                status: 'connected',
                onboardingMethod: 'manual',
                accessToken,
                phoneNumberId,
                wabaId: whatsappBusinessAccountId || null,
                phoneDisplay: displayPhoneNumber || null,
                businessName: businessName || null,
                webhookVerifyToken: verifyToken || uuidv4(),
            });

            res.status(201).json({ data: mapToConnection(saved) });
        } catch (error) { next(error); }
    };

    // ────────────────────────────────────────────
    // PUT  /settings/manual/:connectionId — update existing
    // ────────────────────────────────────────────
    const updateManualConfig = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const existing = await waConfigRepo.findByTenantId(tenantId);
            if (!existing) { res.status(404).json({ error: 'No connection found for this tenant' }); return; }

            const updates = req.body;
            const saved = await waConfigRepo.save({
                tenantId,
                credentialSource: existing.credential_source || 'own',
                status: existing.status || 'connected',
                onboardingMethod: 'manual',
                accessToken: updates.accessToken ?? existing.access_token,
                phoneNumberId: updates.phoneNumberId ?? existing.phone_number_id,
                wabaId: updates.whatsappBusinessAccountId ?? existing.waba_id,
                phoneDisplay: updates.displayPhoneNumber ?? existing.phone_display,
                businessName: updates.businessName ?? existing.business_name,
                webhookVerifyToken: updates.verifyToken ?? existing.webhook_verify_token,
            });

            res.json({ data: mapToConnection(saved) });
        } catch (error) { next(error); }
    };

    // ────────────────────────────────────────────
    // POST /settings/test — test live connection
    // ────────────────────────────────────────────
    const testConnection = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const config = await waConfigRepo.findByTenantId(tenantId);
            if (!config || !config.access_token) {
                res.json({ data: { success: false, error: 'No connection configured' } });
                return;
            }

            // Use the tenant-specific provider to verify credentials
            try {
                const provider = await tenantProviderFactory.getProviderForTenant(tenantId);
                // Attempt a lightweight API call to Meta — e.g., get phone number info
                const phoneInfo = await provider.getPhoneInfo?.();
                res.json({
                    data: {
                        success: true,
                        phoneNumber: phoneInfo?.display_phone_number || config.phone_display || config.phone_number_id,
                        businessName: phoneInfo?.verified_name || config.business_name || config.verified_name,
                        qualityRating: phoneInfo?.quality_rating || config.quality_rating,
                    },
                });
            } catch (apiError: any) {
                await waConfigRepo.updateStatus(tenantId, 'error', apiError.message);
                res.json({
                    data: {
                        success: false,
                        error: apiError.message || 'Connection test failed — check your credentials',
                    },
                });
            }
        } catch (error) { next(error); }
    };

    // ────────────────────────────────────────────
    // DELETE /settings — disconnect
    // ────────────────────────────────────────────
    const disconnect = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            await waConfigRepo.delete(tenantId);
            res.json({ success: true, message: 'WhatsApp disconnected' });
        } catch (error) { next(error); }
    };

    // ────────────────────────────────────────────
    // POST /settings/regenerate-verify-token
    // ────────────────────────────────────────────
    const regenerateVerifyToken = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const existing = await waConfigRepo.findByTenantId(tenantId);
            if (!existing) { res.status(404).json({ error: 'No connection found' }); return; }

            const newToken = uuidv4();
            await pool.query(
                `UPDATE whatsapp_business_configs SET webhook_verify_token = $2, updated_at = NOW() WHERE tenant_id = $1`,
                [tenantId, newToken]
            );

            res.json({ data: { verifyToken: newToken } });
        } catch (error) { next(error); }
    };

    return {
        getConnection,
        saveManualConfig,
        updateManualConfig,
        testConnection,
        disconnect,
        regenerateVerifyToken,
    };
}

// ── Map DB row → UI-friendly shape ──
function mapToConnection(row: any) {
    if (!row) return null;
    return {
        id: row.id,
        tenantId: row.tenant_id,
        connectionMethod: row.onboarding_method === 'embedded_signup' ? 'embedded' : 'manual',
        status: row.status === 'connected' ? 'connected' : row.status === 'error' ? 'error' : 'not_connected',
        whatsappBusinessAccountId: row.waba_id,
        phoneNumberId: row.phone_number_id,
        displayPhoneNumber: row.phone_display,
        businessName: row.business_name || row.verified_name,
        accessTokenLast4: row.access_token ? row.access_token.slice(-4) : null,
        webhookUrl: buildWebhookUrl(row.tenant_id),
        verifyToken: row.webhook_verify_token,
        connectedAt: row.connected_at,
        lastVerifiedAt: row.last_sync_at,
        errorMessage: row.error_message,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function buildWebhookUrl(tenantId: string) {
    const base = process.env.API_BASE_URL || process.env.VITE_API_URL || 'https://your-domain.com/api/v1';
    return `${base}/whatsapp/webhook`;
}

export type SettingsController = ReturnType<typeof createSettingsController>;
