// WhatsApp Onboarding Routes
// Handles Embedded Signup OAuth flow and configuration management

import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import {
    createEmbeddedSignupService,
    REQUIRED_REVIEW_SCOPES,
    type BusinessManagerAsset,
    type OnboardingSelection,
} from '../services/WhatsAppEmbeddedSignupService.js';
import { WhatsAppBusinessConfig } from '../models/whatsapp/index.js';
import { config as envConfig } from '../../../config/env.js';
import { getPool } from '../../../config/database.js';
import { WhatsAppConfigRepository, type WhatsAppConfigRow } from '../repositories/WhatsAppConfigRepository.js';
import { WhatsAppAuditLogRepository } from '../repositories/WhatsAppAuditLogRepository.js';

const router = Router();
const signupService = createEmbeddedSignupService();
const pool = getPool();
const waConfigRepo = new WhatsAppConfigRepository(pool);
const waAuditRepo = new WhatsAppAuditLogRepository(pool);

const GRAPH_API_URL = 'https://graph.facebook.com';
const API_VERSION = envConfig.whatsapp.meta?.apiVersion || 'v18.0';
const OAUTH_SESSION_TTL_MS = 10 * 60 * 1000;

interface OAuthSession {
    id: string;
    tenantId: string;
    accessToken: string;
    expiresAt: number;
    grantedScopes: string[];
    missingScopes: string[];
    businesses: BusinessManagerAsset[];
}

const oauthSessions = new Map<string, OAuthSession>();

function getTenantId(req: Request): string | null {
    const reqAny = req as any;
    const fromContext = reqAny.context?.tenantId;
    const fromReq = reqAny.tenantId;
    const fromHeader = req.headers['x-tenant-id'] as string | undefined;
    return fromContext || fromReq || fromHeader || null;
}

function getClientIp(req: Request): string | null {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) {
        return xff.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || null;
}

function normalizeFeatures(features: any): {
    catalogEnabled: boolean;
    cartEnabled: boolean;
    paymentsEnabled: boolean;
    flowsEnabled: boolean;
} {
    return {
        catalogEnabled: Boolean(features?.catalogEnabled),
        cartEnabled: Boolean(features?.cartEnabled),
        paymentsEnabled: Boolean(features?.paymentsEnabled),
        flowsEnabled: Boolean(features?.flowsEnabled),
    };
}

function maskPhoneNumber(value?: string | null): string | null {
    if (!value) {
        return null;
    }
    if (value.length <= 4) {
        return `***${value}`;
    }
    return `****${value.slice(-4)}`;
}

function mapStatusData(row: WhatsAppConfigRow | null) {
    if (!row) {
        return {
            isConnected: false,
            onboardingMethod: null,
            phoneNumber: null,
            businessName: null,
            qualityRating: null,
            businessId: null,
            wabaId: null,
            requiredPermissions: REQUIRED_REVIEW_SCOPES,
            features: {
                catalogEnabled: false,
                cartEnabled: false,
                paymentsEnabled: false,
                flowsEnabled: false,
            },
        };
    }

    return {
        isConnected: row.status === 'connected',
        status: row.status,
        onboardingMethod: row.onboarding_method,
        phoneNumber: row.phone_display || maskPhoneNumber(row.phone_number_id),
        businessName: row.business_name,
        qualityRating: row.quality_rating,
        businessId: row.business_id,
        wabaId: row.waba_id,
        requiredPermissions: REQUIRED_REVIEW_SCOPES,
        connectedAt: row.connected_at,
        lastSyncAt: row.last_sync_at,
        features: normalizeFeatures(row.features),
    };
}

function buildScopeSummary(scopes: string[], granularScopes: Array<{ scope: string }>): {
    grantedScopes: string[];
    missingScopes: string[];
} {
    const grantedSet = new Set<string>([
        ...(scopes || []),
        ...(granularScopes || []).map((scope) => scope.scope),
    ]);
    const grantedScopes = Array.from(grantedSet.values());
    const missingScopes = REQUIRED_REVIEW_SCOPES.filter((scope) => !grantedSet.has(scope));
    return { grantedScopes, missingScopes };
}

function purgeExpiredSessions() {
    const now = Date.now();
    for (const [key, session] of oauthSessions.entries()) {
        if (session.expiresAt <= now) {
            oauthSessions.delete(key);
        }
    }
}

async function auditLog(
    req: Request,
    input: {
        tenantId: string;
        eventType: string;
        actorType?: 'USER' | 'SYSTEM' | 'WEBHOOK';
        actorId?: string;
        actorPhone?: string;
        entityType?: string;
        entityId?: string;
        payload?: Record<string, unknown>;
    },
) {
    try {
        await waAuditRepo.log({
            ...input,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent'] || null,
        });
    } catch (error) {
        console.warn('[WhatsAppOnboarding] Failed to persist audit log:', error);
    }
}

router.get('/config', async (_req: Request, res: Response) => {
    try {
        if (!signupService) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp Embedded Signup not configured',
                errorCode: 'NOT_CONFIGURED',
                message: 'Please configure META_APP_ID, META_APP_SECRET, and META_EMBEDDED_SIGNUP_CONFIG_ID',
            });
        }

        const embeddedConfig = signupService.getEmbeddedSignupConfig();
        res.json({
            success: true,
            data: {
                ...embeddedConfig,
                requiredPermissions: REQUIRED_REVIEW_SCOPES,
            },
        });
    } catch (error) {
        console.error('Error getting onboard config:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get onboarding configuration',
        });
    }
});

router.post('/oauth/assets', async (req: Request, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        const { code } = req.body as { code?: string };

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
                errorCode: 'MISSING_TENANT',
            });
        }

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code is required',
                errorCode: 'MISSING_CODE',
            });
        }

        if (!signupService) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp Embedded Signup not configured',
                errorCode: 'NOT_CONFIGURED',
            });
        }

        purgeExpiredSessions();

        const tokenResult = await signupService.exchangeCodeForToken(code);
        const debugResult = await signupService.debugToken(tokenResult.accessToken);
        const scopeSummary = buildScopeSummary(debugResult.scopes, debugResult.granularScopes);
        const businesses = await signupService.fetchBusinessAssetGraph(tokenResult.accessToken);

        const sessionId = crypto.randomUUID();
        const expiresAt = Date.now() + OAUTH_SESSION_TTL_MS;
        oauthSessions.set(sessionId, {
            id: sessionId,
            tenantId,
            accessToken: tokenResult.accessToken,
            expiresAt,
            grantedScopes: scopeSummary.grantedScopes,
            missingScopes: scopeSummary.missingScopes,
            businesses,
        });

        await auditLog(req, {
            tenantId,
            eventType: 'oauth_assets_loaded',
            actorType: 'USER',
            actorId: (req as any).context?.userId,
            payload: {
                businessCount: businesses.length,
                grantedScopes: scopeSummary.grantedScopes,
                missingScopes: scopeSummary.missingScopes,
            },
        });

        res.json({
            success: true,
            data: {
                sessionId,
                expiresAt: new Date(expiresAt).toISOString(),
                grantedScopes: scopeSummary.grantedScopes,
                missingScopes: scopeSummary.missingScopes,
                businesses,
            },
        });
    } catch (error) {
        console.error('Error loading OAuth assets:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to load business assets',
            errorCode: 'ASSET_FETCH_FAILED',
        });
    }
});

router.post('/oauth/connect', async (req: Request, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        const { sessionId, businessId, wabaId, phoneNumberId } = req.body as {
            sessionId?: string;
            businessId?: string;
            wabaId?: string;
            phoneNumberId?: string;
        };

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
                errorCode: 'MISSING_TENANT',
            });
        }

        if (!sessionId || !wabaId || !phoneNumberId) {
            return res.status(400).json({
                success: false,
                error: 'sessionId, wabaId and phoneNumberId are required',
                errorCode: 'MISSING_SELECTION',
            });
        }

        if (!signupService) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp Embedded Signup not configured',
                errorCode: 'NOT_CONFIGURED',
            });
        }

        purgeExpiredSessions();
        const session = oauthSessions.get(sessionId);
        if (!session || session.expiresAt < Date.now()) {
            return res.status(400).json({
                success: false,
                error: 'OAuth session expired. Please reconnect with Facebook.',
                errorCode: 'SESSION_EXPIRED',
            });
        }

        if (session.tenantId !== tenantId) {
            return res.status(403).json({
                success: false,
                error: 'OAuth session does not belong to this tenant',
                errorCode: 'SESSION_TENANT_MISMATCH',
            });
        }

        const selection: OnboardingSelection = { businessId, wabaId, phoneNumberId };
        const result = await signupService.completeOnboardingWithAccessToken(
            tenantId,
            session.accessToken,
            selection,
        );

        if (!result.success || !result.config) {
            return res.status(400).json({
                success: false,
                error: result.error,
                errorCode: result.errorCode,
                missingScopes: result.missingScopes,
                grantedScopes: result.grantedScopes,
            });
        }

        const configData = result.config.toJSON();
        const savedConfig = await waConfigRepo.save({
            tenantId,
            credentialSource: 'own',
            status: configData.status,
            onboardingMethod: 'embedded_signup',
            accessToken: configData.credentials?.accessToken || null,
            phoneNumberId: configData.credentials?.phoneNumberId || null,
            wabaId: configData.credentials?.wabaId || null,
            businessId: configData.credentials?.businessId || businessId || null,
            phoneDisplay: configData.phoneNumber?.displayPhoneNumber || null,
            verifiedName: configData.phoneNumber?.verifiedName || null,
            qualityRating: configData.phoneNumber?.qualityRating || null,
            businessName: configData.businessName || null,
            webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || null,
            features: configData.features,
            rateLimits: configData.rateLimits || {},
        });

        oauthSessions.delete(sessionId);

        await auditLog(req, {
            tenantId,
            eventType: 'oauth_connected',
            actorType: 'USER',
            actorId: (req as any).context?.userId,
            entityType: 'WHATSAPP_CONFIG',
            entityId: savedConfig.id,
            payload: {
                businessId: savedConfig.business_id,
                wabaId: savedConfig.waba_id,
                phoneNumberId: savedConfig.phone_number_id,
                grantedScopes: result.grantedScopes,
            },
        });

        res.json({
            success: true,
            data: {
                ...result.config.toPublicJSON(),
                persisted: mapStatusData(savedConfig),
            },
            message: 'WhatsApp Business Account connected successfully!',
        });
    } catch (error) {
        console.error('Error connecting selected assets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect selected assets',
            errorCode: 'CONNECT_FAILED',
        });
    }
});

router.post('/test', async (req: Request, res: Response) => {
    try {
        const { accessToken, phoneNumberId, wabaId } = req.body;
        if (!accessToken || !phoneNumberId || !wabaId) {
            return res.status(400).json({
                success: false,
                error: 'All credentials are required: accessToken, phoneNumberId, wabaId',
            });
        }

        const wabaUrl = `${GRAPH_API_URL}/${API_VERSION}/${wabaId}?access_token=${accessToken}&fields=id,name,currency`;
        const wabaResponse = await fetch(wabaUrl);
        const wabaData = await wabaResponse.json() as any;
        if (wabaData.error) {
            return res.status(400).json({
                success: false,
                error: `WABA verification failed: ${wabaData.error.message}`,
                errorCode: 'INVALID_WABA',
            });
        }

        const phoneUrl = `${GRAPH_API_URL}/${API_VERSION}/${phoneNumberId}?access_token=${accessToken}&fields=id,display_phone_number,verified_name,quality_rating`;
        const phoneResponse = await fetch(phoneUrl);
        const phoneData = await phoneResponse.json() as any;
        if (phoneData.error) {
            return res.status(400).json({
                success: false,
                error: `Phone number verification failed: ${phoneData.error.message}`,
                errorCode: 'INVALID_PHONE',
            });
        }

        res.json({
            success: true,
            message: 'Connection test successful',
            data: {
                businessName: wabaData.name,
                phoneNumber: phoneData.display_phone_number,
                verifiedName: phoneData.verified_name,
                qualityRating: phoneData.quality_rating,
            },
        });
    } catch (error) {
        console.error('Error testing connection:', error);
        res.status(500).json({
            success: false,
            error: 'Connection test failed. Please check your credentials.',
        });
    }
});

router.post('/manual', async (req: Request, res: Response) => {
    try {
        const { accessToken, phoneNumberId, wabaId, businessName } = req.body;
        const tenantId = getTenantId(req);

        if (!accessToken || !phoneNumberId || !wabaId) {
            return res.status(400).json({
                success: false,
                error: 'All credentials are required: accessToken, phoneNumberId, wabaId',
                errorCode: 'MISSING_CREDENTIALS',
            });
        }

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
                errorCode: 'MISSING_TENANT',
            });
        }

        const phoneUrl = `${GRAPH_API_URL}/${API_VERSION}/${phoneNumberId}?access_token=${accessToken}&fields=id,display_phone_number,verified_name,quality_rating`;
        const phoneResponse = await fetch(phoneUrl);
        const phoneData = await phoneResponse.json() as any;
        if (phoneData.error) {
            return res.status(400).json({
                success: false,
                error: `Invalid credentials: ${phoneData.error.message}`,
                errorCode: 'INVALID_CREDENTIALS',
            });
        }

        const waConfig = WhatsAppBusinessConfig.create({
            tenantId,
            status: 'connected',
            onboardingMethod: 'manual',
            businessName: businessName || phoneData.verified_name,
        });

        waConfig.connect(
            { accessToken, phoneNumberId, wabaId },
            {
                id: phoneNumberId,
                displayPhoneNumber: phoneData.display_phone_number,
                verifiedName: phoneData.verified_name,
                qualityRating: phoneData.quality_rating,
            },
        );

        const configData = waConfig.toJSON();
        const persisted = await waConfigRepo.save({
            tenantId,
            credentialSource: 'own',
            status: 'connected',
            onboardingMethod: 'manual',
            accessToken,
            phoneNumberId,
            wabaId,
            phoneDisplay: phoneData.display_phone_number,
            verifiedName: phoneData.verified_name,
            qualityRating: phoneData.quality_rating,
            businessName: configData.businessName || businessName || null,
            webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || null,
            features: configData.features,
            rateLimits: configData.rateLimits || {},
        });

        await auditLog(req, {
            tenantId,
            eventType: 'manual_connected',
            actorType: 'USER',
            actorId: (req as any).context?.userId,
            entityType: 'WHATSAPP_CONFIG',
            entityId: persisted.id,
            payload: {
                wabaId,
                phoneNumberId,
                onboardingMethod: 'manual',
            },
        });

        res.json({
            success: true,
            data: {
                ...waConfig.toPublicJSON(),
                persisted: mapStatusData(persisted),
            },
            message: 'WhatsApp Business Account connected successfully',
        });
    } catch (error) {
        console.error('Error in manual connection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect WhatsApp Business Account',
            errorCode: 'MANUAL_CONNECT_FAILED',
        });
    }
});

router.post('/complete', async (req: Request, res: Response) => {
    try {
        const { code, businessId, wabaId, phoneNumberId } = req.body as {
            code?: string;
            businessId?: string;
            wabaId?: string;
            phoneNumberId?: string;
        };
        const tenantId = getTenantId(req);

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code is required',
                errorCode: 'MISSING_CODE',
            });
        }

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
                errorCode: 'MISSING_TENANT',
            });
        }

        if (!signupService) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp Embedded Signup not configured',
                errorCode: 'NOT_CONFIGURED',
            });
        }

        const selection: OnboardingSelection = { businessId, wabaId, phoneNumberId };
        const result = await signupService.completeOnboarding(tenantId, code, selection);
        if (!result.success || !result.config) {
            return res.status(400).json({
                success: false,
                error: result.error,
                errorCode: result.errorCode,
                missingScopes: result.missingScopes,
                grantedScopes: result.grantedScopes,
            });
        }

        const configData = result.config.toJSON();
        const persisted = await waConfigRepo.save({
            tenantId,
            credentialSource: 'own',
            status: 'connected',
            onboardingMethod: 'embedded_signup',
            accessToken: configData.credentials?.accessToken || null,
            phoneNumberId: configData.credentials?.phoneNumberId || null,
            wabaId: configData.credentials?.wabaId || null,
            businessId: configData.credentials?.businessId || businessId || null,
            phoneDisplay: configData.phoneNumber?.displayPhoneNumber || null,
            verifiedName: configData.phoneNumber?.verifiedName || null,
            qualityRating: configData.phoneNumber?.qualityRating || null,
            businessName: configData.businessName || null,
            webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || null,
            features: configData.features,
            rateLimits: configData.rateLimits || {},
        });

        await auditLog(req, {
            tenantId,
            eventType: 'embedded_signup_completed',
            actorType: 'USER',
            actorId: (req as any).context?.userId,
            entityType: 'WHATSAPP_CONFIG',
            entityId: persisted.id,
            payload: {
                wabaId: configData.credentials?.wabaId,
                phoneNumberId: configData.credentials?.phoneNumberId,
                businessId: configData.credentials?.businessId || businessId || null,
                grantedScopes: result.grantedScopes || [],
            },
        });

        res.json({
            success: true,
            data: {
                ...result.config.toPublicJSON(),
                persisted: mapStatusData(persisted),
            },
            message: 'WhatsApp Business Account connected successfully',
        });
    } catch (error) {
        console.error('Error completing onboarding:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete onboarding',
            errorCode: 'ONBOARDING_COMPLETE_FAILED',
        });
    }
});

router.get('/callback', async (req: Request, res: Response) => {
    try {
        const { code, state, error, error_description } = req.query;
        if (error) {
            const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5173');
            redirectUrl.pathname = '/wa-store';
            redirectUrl.searchParams.set('onboard_error', error as string);
            redirectUrl.searchParams.set('error_description', (error_description as string) || '');
            return res.redirect(redirectUrl.toString());
        }

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code missing',
                errorCode: 'MISSING_CODE',
            });
        }

        const tenantId = state as string;
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid state parameter',
                errorCode: 'INVALID_STATE',
            });
        }

        if (!signupService) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp Embedded Signup not configured',
                errorCode: 'NOT_CONFIGURED',
            });
        }

        const result = await signupService.completeOnboarding(tenantId, code as string);
        if (result.success && result.config) {
            const configData = result.config.toJSON();
            await waConfigRepo.save({
                tenantId,
                credentialSource: 'own',
                status: 'connected',
                onboardingMethod: 'embedded_signup',
                accessToken: configData.credentials?.accessToken || null,
                phoneNumberId: configData.credentials?.phoneNumberId || null,
                wabaId: configData.credentials?.wabaId || null,
                businessId: configData.credentials?.businessId || null,
                phoneDisplay: configData.phoneNumber?.displayPhoneNumber || null,
                verifiedName: configData.phoneNumber?.verifiedName || null,
                qualityRating: configData.phoneNumber?.qualityRating || null,
                businessName: configData.businessName || null,
                webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || null,
                features: configData.features,
                rateLimits: configData.rateLimits || {},
            });
        }

        const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5173');
        redirectUrl.pathname = '/wa-store';
        if (result.success) {
            redirectUrl.searchParams.set('onboard_success', 'true');
            redirectUrl.searchParams.set('phone', result.config?.phoneNumber?.displayPhoneNumber || '');
        } else {
            redirectUrl.searchParams.set('onboard_error', result.errorCode || 'UNKNOWN');
            redirectUrl.searchParams.set('error_message', result.error || '');
        }
        res.redirect(redirectUrl.toString());
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5173');
        redirectUrl.pathname = '/wa-store';
        redirectUrl.searchParams.set('onboard_error', 'CALLBACK_ERROR');
        res.redirect(redirectUrl.toString());
    }
});

router.get('/status', async (req: Request, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
                errorCode: 'MISSING_TENANT',
            });
        }

        const configRow = await waConfigRepo.findByTenantId(tenantId);
        res.json({
            success: true,
            data: mapStatusData(configRow),
        });
    } catch (error) {
        console.error('Error getting onboard status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get status',
            errorCode: 'STATUS_FETCH_FAILED',
        });
    }
});

router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
                errorCode: 'MISSING_TENANT',
            });
        }

        const configRow = await waConfigRepo.findByTenantId(tenantId);
        if (!configRow) {
            return res.json({
                success: true,
                data: {
                    connected: false,
                    status: mapStatusData(null),
                    businesses: [],
                    analytics: {
                        inbound7d: 0,
                        outbound7d: 0,
                        inbound30d: 0,
                        outbound30d: 0,
                        templatesApproved: 0,
                        templatesTotal: 0,
                    },
                },
            });
        }

        const [messageStatsResult, templateStatsResult] = await Promise.all([
            pool.query(
                `SELECT
                    COUNT(*) FILTER (WHERE direction = 'INBOUND' AND created_at >= NOW() - INTERVAL '7 days')  AS inbound_7d,
                    COUNT(*) FILTER (WHERE direction = 'OUTBOUND' AND created_at >= NOW() - INTERVAL '7 days') AS outbound_7d,
                    COUNT(*) FILTER (WHERE direction = 'INBOUND' AND created_at >= NOW() - INTERVAL '30 days') AS inbound_30d,
                    COUNT(*) FILTER (WHERE direction = 'OUTBOUND' AND created_at >= NOW() - INTERVAL '30 days') AS outbound_30d
                 FROM whatsapp_messages
                 WHERE tenant_id = $1`,
                [tenantId],
            ),
            pool.query(
                `SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved
                 FROM whatsapp_templates
                 WHERE tenant_id = $1`,
                [tenantId],
            ),
        ]);

        const messageStats = messageStatsResult.rows[0] || {};
        const templateStats = templateStatsResult.rows[0] || {};

        let businesses: BusinessManagerAsset[] = [];
        if (signupService && configRow.status === 'connected' && configRow.access_token && configRow.business_id) {
            try {
                const ownedWabas = await signupService.getOwnedWABAs(configRow.business_id, configRow.access_token);
                const mappedWabas = await Promise.all(
                    ownedWabas.map(async (waba) => ({
                        ...waba,
                        phoneNumbers: await signupService.getPhoneNumbers(waba.id, configRow.access_token as string),
                    })),
                );
                businesses = [{
                    id: configRow.business_id,
                    name: configRow.business_name || 'Connected Business',
                    whatsappBusinessAccounts: mappedWabas,
                }];
            } catch (error) {
                console.warn('[WhatsAppOnboarding] Failed to refresh business asset graph:', error);
            }
        }

        res.json({
            success: true,
            data: {
                connected: configRow.status === 'connected',
                status: mapStatusData(configRow),
                businesses,
                analytics: {
                    inbound7d: Number(messageStats.inbound_7d || 0),
                    outbound7d: Number(messageStats.outbound_7d || 0),
                    inbound30d: Number(messageStats.inbound_30d || 0),
                    outbound30d: Number(messageStats.outbound_30d || 0),
                    templatesApproved: Number(templateStats.approved || 0),
                    templatesTotal: Number(templateStats.total || 0),
                },
            },
        });
    } catch (error) {
        console.error('Error loading onboard dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load asset dashboard',
            errorCode: 'DASHBOARD_FETCH_FAILED',
        });
    }
});

router.post('/disconnect', async (req: Request, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
                errorCode: 'MISSING_TENANT',
            });
        }

        const existing = await waConfigRepo.findByTenantId(tenantId);
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: 'No WhatsApp connection found',
                errorCode: 'NOT_CONNECTED',
            });
        }

        await waConfigRepo.save({
            tenantId,
            credentialSource: existing.credential_source || 'own',
            status: 'disconnected',
            onboardingMethod: existing.onboarding_method || 'manual',
            accessToken: null,
            phoneNumberId: existing.phone_number_id,
            wabaId: existing.waba_id,
            businessId: existing.business_id,
            phoneDisplay: existing.phone_display,
            verifiedName: existing.verified_name,
            qualityRating: existing.quality_rating,
            businessName: existing.business_name,
            webhookVerifyToken: existing.webhook_verify_token,
            features: normalizeFeatures(existing.features),
            rateLimits: existing.rate_limits || {},
        });

        await auditLog(req, {
            tenantId,
            eventType: 'manual_disconnect',
            actorType: 'USER',
            actorId: (req as any).context?.userId,
            entityType: 'WHATSAPP_CONFIG',
            entityId: existing.id,
            payload: { previousStatus: existing.status },
        });

        res.json({
            success: true,
            message: 'WhatsApp Business Account disconnected',
        });
    } catch (error) {
        console.error('Error disconnecting:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to disconnect',
            errorCode: 'DISCONNECT_FAILED',
        });
    }
});

router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
                errorCode: 'MISSING_TENANT',
            });
        }

        const configRow = await waConfigRepo.findByTenantId(tenantId);
        if (!configRow) {
            return res.status(404).json({
                success: false,
                error: 'No WhatsApp connection found',
                errorCode: 'NOT_CONNECTED',
            });
        }

        if (!signupService) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp Embedded Signup not configured',
                errorCode: 'NOT_CONFIGURED',
            });
        }

        const waConfig = WhatsAppBusinessConfig.fromPersistence({
            id: configRow.id,
            tenantId: configRow.tenant_id,
            status: (configRow.status as any) || 'disconnected',
            onboardingMethod: (configRow.onboarding_method as any) || 'manual',
            credentials: configRow.access_token && configRow.phone_number_id && configRow.waba_id
                ? {
                    accessToken: configRow.access_token,
                    phoneNumberId: configRow.phone_number_id,
                    wabaId: configRow.waba_id,
                    businessId: configRow.business_id || undefined,
                }
                : undefined,
            phoneNumber: configRow.phone_number_id
                ? {
                    id: configRow.phone_number_id,
                    displayPhoneNumber: configRow.phone_display || '',
                    verifiedName: configRow.verified_name || '',
                    qualityRating: (configRow.quality_rating as any) || undefined,
                }
                : undefined,
            businessName: configRow.business_name || undefined,
            webhookVerifyToken: configRow.webhook_verify_token || undefined,
            features: normalizeFeatures(configRow.features),
            rateLimits: (configRow.rate_limits as any) || undefined,
            connectedAt: configRow.connected_at || undefined,
            lastSyncAt: configRow.last_sync_at || undefined,
            errorMessage: configRow.error_message || undefined,
            createdAt: configRow.created_at,
            updatedAt: configRow.updated_at,
        });

        await signupService.refreshStatus(waConfig);
        const refreshed = waConfig.toJSON();

        const persisted = await waConfigRepo.save({
            tenantId,
            credentialSource: configRow.credential_source || 'own',
            status: refreshed.status,
            onboardingMethod: refreshed.onboardingMethod || configRow.onboarding_method,
            accessToken: refreshed.credentials?.accessToken || null,
            phoneNumberId: refreshed.credentials?.phoneNumberId || configRow.phone_number_id,
            wabaId: refreshed.credentials?.wabaId || configRow.waba_id,
            businessId: refreshed.credentials?.businessId || configRow.business_id,
            phoneDisplay: refreshed.phoneNumber?.displayPhoneNumber || configRow.phone_display,
            verifiedName: refreshed.phoneNumber?.verifiedName || configRow.verified_name,
            qualityRating: refreshed.phoneNumber?.qualityRating || configRow.quality_rating,
            businessName: refreshed.businessName || configRow.business_name,
            webhookVerifyToken: configRow.webhook_verify_token,
            features: refreshed.features || normalizeFeatures(configRow.features),
            rateLimits: refreshed.rateLimits || configRow.rate_limits || {},
        });

        await waConfigRepo.updateLastSync(tenantId);
        await auditLog(req, {
            tenantId,
            eventType: 'connection_refreshed',
            actorType: 'USER',
            actorId: (req as any).context?.userId,
            entityType: 'WHATSAPP_CONFIG',
            entityId: persisted.id,
            payload: {
                status: persisted.status,
                qualityRating: persisted.quality_rating,
            },
        });

        res.json({
            success: true,
            data: mapStatusData(persisted),
            message: 'Status refreshed',
        });
    } catch (error) {
        console.error('Error refreshing status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh status',
            errorCode: 'REFRESH_FAILED',
        });
    }
});

export default router;
