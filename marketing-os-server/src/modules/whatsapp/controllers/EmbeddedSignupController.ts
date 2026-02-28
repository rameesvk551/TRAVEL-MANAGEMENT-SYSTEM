// controllers/EmbeddedSignupController.ts
// Isolated controller for Facebook Embedded Signup flow.
// Handles: get signup config, complete signup callback.

import type { Pool } from 'pg';

export function createEmbeddedSignupController(
    waConfigRepo: {
        findByTenantId: (tenantId: string) => Promise<any>;
        save: (config: any) => Promise<any>;
        updateStatus: (tenantId: string, status: string, error?: string) => Promise<void>;
    },
    pool: Pool
) {
    // ────────────────────────────────────────────
    // GET /settings/embedded/config — info to launch FB signup widget
    // ────────────────────────────────────────────
    const getConfig = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const appId = process.env.FACEBOOK_APP_ID || '';
            const configId = process.env.FACEBOOK_CONFIG_ID || '';
            const redirectUri = process.env.FACEBOOK_REDIRECT_URI ||
                `${process.env.API_BASE_URL || 'http://localhost:5000/api/v1'}/whatsapp/settings/embedded/callback`;

            if (!appId) {
                res.status(501).json({
                    error: 'Facebook Embedded Signup is not configured. Set FACEBOOK_APP_ID in environment.',
                });
                return;
            }

            res.json({
                data: { appId, configId, redirectUri },
            });
        } catch (error) { next(error); }
    };

    // ────────────────────────────────────────────
    // POST /settings/embedded/complete — exchange code for token & save config
    // ────────────────────────────────────────────
    const complete = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { code, state } = req.body;
            if (!code) {
                res.status(400).json({ error: 'Authorization code is required' });
                return;
            }

            // Exchange the short-lived code for a System User Access Token
            const appId = process.env.FACEBOOK_APP_ID || '';
            const appSecret = process.env.FACEBOOK_APP_SECRET || '';
            const redirectUri = process.env.FACEBOOK_REDIRECT_URI || '';

            if (!appId || !appSecret) {
                res.status(501).json({ error: 'Facebook app credentials are not configured' });
                return;
            }

            // Step 1: Exchange code → access token via Meta Graph API
            const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`;

            const tokenResp = await fetch(tokenUrl);
            const tokenData = await tokenResp.json() as any;

            if (tokenData.error) {
                res.status(400).json({
                    error: `Facebook token exchange failed: ${tokenData.error.message}`,
                });
                return;
            }

            const accessToken = tokenData.access_token;

            // Step 2: Fetch shared WABA info
            const debugResp = await fetch(
                `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
            );
            const debugData = await debugResp.json() as any;

            const wabaId = debugData?.data?.granular_scopes?.find(
                (s: any) => s.scope === 'whatsapp_business_management'
            )?.target_ids?.[0] || null;

            // Step 3: Fetch phone numbers from the WABA
            let phoneNumberId: string | null = null;
            let phoneDisplay: string | null = null;
            let verifiedName: string | null = null;

            if (wabaId) {
                const phonesResp = await fetch(
                    `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${accessToken}`
                );
                const phonesData = await phonesResp.json() as any;
                const firstPhone = phonesData?.data?.[0];
                if (firstPhone) {
                    phoneNumberId = firstPhone.id;
                    phoneDisplay = firstPhone.display_phone_number;
                    verifiedName = firstPhone.verified_name;
                }
            }

            // Step 4: Persist to DB
            const { v4: uuidv4 } = await import('uuid');
            const saved = await waConfigRepo.save({
                tenantId,
                credentialSource: 'own',
                status: 'connected',
                onboardingMethod: 'embedded_signup',
                accessToken,
                phoneNumberId,
                wabaId,
                phoneDisplay,
                verifiedName,
                webhookVerifyToken: uuidv4(),
            });

            res.json({
                data: {
                    success: true,
                    connection: mapToConnection(saved),
                },
            });
        } catch (error) { next(error); }
    };

    return { getConfig, complete };
}

// ── Map DB row → UI-friendly shape (same as SettingsController) ──
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
        webhookUrl: `${process.env.API_BASE_URL || 'http://localhost:5000/api/v1'}/whatsapp/webhook`,
        verifyToken: row.webhook_verify_token,
        connectedAt: row.connected_at,
        lastVerifiedAt: row.last_sync_at,
        errorMessage: row.error_message,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export type EmbeddedSignupController = ReturnType<typeof createEmbeddedSignupController>;
