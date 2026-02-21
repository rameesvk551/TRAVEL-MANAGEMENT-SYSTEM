// WhatsApp Onboarding Routes
// Handles Embedded Signup OAuth flow and configuration management

import { Router, Request, Response } from 'express';
import { createEmbeddedSignupService } from '../services/WhatsAppEmbeddedSignupService.js';
import { WhatsAppBusinessConfig } from '../models/whatsapp/index.js';
import { config as envConfig } from '../../../config/env.js';
import { getPool } from '../../../config/database.js';
import { WhatsAppConfigRepository } from '../repositories/WhatsAppConfigRepository.js';

const router = Router();
const signupService = createEmbeddedSignupService();

// Graph API URL for connection testing
const GRAPH_API_BASE = 'https://graph.facebook.com';
const API_VERSION = envConfig.whatsapp.meta?.apiVersion || 'v21.0';

// Lazy initialization of repo
const getRepo = () => {
    const pool = getPool();
    return new WhatsAppConfigRepository(pool);
};

/**
 * GET /api/whatsapp/onboard/config
 * Get Embedded Signup configuration for frontend
 */
router.get('/config', async (req: Request, res: Response) => {
    try {
        if (!signupService) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp Embedded Signup not configured',
                errorCode: 'NOT_CONFIGURED',
                message: 'Please configure META_APP_ID, META_APP_SECRET, and META_EMBEDDED_SIGNUP_CONFIG_ID',
            });
        }

        const config = signupService.getEmbeddedSignupConfig();

        res.json({
            success: true,
            data: config,
        });
    } catch (error) {
        console.error('Error getting onboard config:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get onboarding configuration',
        });
    }
});

/**
 * POST /api/whatsapp/onboard/test
 * Test manual credentials before saving
 */
router.post('/test', async (req: Request, res: Response) => {
    try {
        const { accessToken, phoneNumberId, wabaId } = req.body;

        if (!accessToken || !phoneNumberId || !wabaId) {
            return res.status(400).json({
                success: false,
                error: 'All credentials are required: accessToken, phoneNumberId, wabaId',
            });
        }

        const graphUrl = `${GRAPH_API_BASE}/${API_VERSION}`;

        // Test 1: Verify access token by getting WABA info
        const wabaResponse = await fetch(`${graphUrl}/${wabaId}?access_token=${accessToken}&fields=id,name,currency`);
        const wabaData = await wabaResponse.json() as any;

        if (wabaData.error) {
            return res.status(400).json({
                success: false,
                error: `WABA verification failed: ${wabaData.error.message}`,
                errorCode: 'INVALID_WABA',
            });
        }

        // Test 2: Verify phone number
        const phoneResponse = await fetch(`${graphUrl}/${phoneNumberId}?access_token=${accessToken}&fields=id,display_phone_number,verified_name,quality_rating`);
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
            message: 'Connection test successful!',
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

/**
 * POST /api/whatsapp/onboard/manual
 * Connect using manual credentials (BYO Scenario)
 */
router.post('/manual', async (req: Request, res: Response) => {
    try {
        const { accessToken, phoneNumberId, wabaId, businessName } = req.body;
        const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(401).json({ error: 'Tenant authentication required' });
        }

        if (!accessToken || !phoneNumberId || !wabaId) {
            return res.status(400).json({ error: 'All credentials are required' });
        }

        // Verify credentials
        const graphUrl = `${GRAPH_API_BASE}/${API_VERSION}`;
        const phoneResponse = await fetch(`${graphUrl}/${phoneNumberId}?access_token=${accessToken}&fields=id,display_phone_number,verified_name,quality_rating`);
        const phoneData = await phoneResponse.json() as any;

        if (phoneData.error) {
            return res.status(400).json({
                success: false,
                error: `Invalid credentials: ${phoneData.error.message}`,
            });
        }

        // Save to DB
        const repo = getRepo();
        const saved = await repo.save({
            tenantId,
            credentialSource: 'own',
            status: 'connected',
            onboardingMethod: 'manual',
            accessToken,
            phoneNumberId,
            wabaId,
            businessName: businessName || phoneData.verified_name || 'WhatsApp Business',
            phoneDisplay: phoneData.display_phone_number,
            verifiedName: phoneData.verified_name,
            qualityRating: phoneData.quality_rating,
            features: {
                catalogEnabled: false,
                cartEnabled: true,
                paymentsEnabled: false,
                flowsEnabled: false,
            }
        });

        res.json({
            success: true,
            data: saved,
            message: 'WhatsApp Business Account connected successfully!',
        });

    } catch (error) {
        console.error('Error in manual connection:', error);
        res.status(500).json({ error: 'Failed to connect WhatsApp Business Account' });
    }
});

/**
 * POST /api/whatsapp/onboard/managed
 * Connect using Managed Key (System User Token) + Phone Number (Managed Scenario)
 */
router.post('/managed', async (req: Request, res: Response) => {
    try {
        const { phoneNumberId, businessName } = req.body;
        const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            return res.status(401).json({ error: 'Tenant authentication required' });
        }

        if (!phoneNumberId) {
            return res.status(400).json({ error: 'Phone Number ID is required' });
        }

        // Use system token from env
        const systemToken = process.env.META_SYSTEM_USER_TOKEN;
        const appWabaId = process.env.META_APP_WABA_ID;

        if (!systemToken || !appWabaId) {
            return res.status(503).json({ error: 'Managed onboarding not configured on server' });
        }

        // Verify phone number using system token
        const graphUrl = `${GRAPH_API_BASE}/${API_VERSION}`;
        const phoneResponse = await fetch(`${graphUrl}/${phoneNumberId}?access_token=${systemToken}&fields=id,display_phone_number,verified_name,quality_rating`);
        const phoneData = await phoneResponse.json() as any;

        if (phoneData.error) {
            return res.status(400).json({
                success: false,
                error: `Invalid Phone ID or permissions: ${phoneData.error.message}`,
            });
        }

        // Save to DB
        const repo = getRepo();
        const saved = await repo.save({
            tenantId,
            credentialSource: 'managed',
            status: 'connected',
            onboardingMethod: 'manual',
            accessToken: null, // Managed = no stored token
            phoneNumberId,
            wabaId: appWabaId,
            businessName: businessName || phoneData.verified_name || 'Managed Business',
            phoneDisplay: phoneData.display_phone_number,
            verifiedName: phoneData.verified_name,
            qualityRating: phoneData.quality_rating,
            features: {
                catalogEnabled: false,
                cartEnabled: true,
                paymentsEnabled: false,
                flowsEnabled: false,
            }
        });

        res.json({
            success: true,
            data: saved,
            message: 'Managed WhatsApp Business Account connected successfully!',
        });

    } catch (error) {
        console.error('Error in managed connection:', error);
        res.status(500).json({ error: 'Failed to connect Managed Account' });
    }
});

/**
 * POST /api/whatsapp/onboard/complete
 * Complete the Embedded Signup process
 * Called after user completes Facebook Login / QR scan
 */
router.post('/complete', async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] as string;

        if (!code || !tenantId) {
            return res.status(400).json({ error: 'Code and Tenant ID required' });
        }

        if (!signupService) {
            return res.status(503).json({ error: 'Embedded Signup not configured' });
        }

        // Exchange code for token and get details
        const result = await signupService.completeOnboarding(tenantId, code);

        if (!result.success || !result.config) {
            return res.status(400).json({
                success: false,
                error: result.error,
                errorCode: result.errorCode,
            });
        }

        const config = result.config;

        // Save to DB via Repository
        const repo = getRepo();
        const saved = await repo.save({
            tenantId,
            credentialSource: 'own', // Embedded signup usually results in owning the token
            status: 'connected',
            onboardingMethod: 'embedded_signup',
            accessToken: config.credentials?.accessToken,
            phoneNumberId: config.phoneNumber?.id,
            wabaId: config.credentials?.wabaId,
            businessId: config.credentials?.businessId,
            businessName: config.businessName || 'WhatsApp Business', // Setup profile logic needed
            phoneDisplay: config.phoneNumber?.displayPhoneNumber,
            verifiedName: config.phoneNumber?.verifiedName,
            qualityRating: config.phoneNumber?.qualityRating,
            webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
        });

        res.json({
            success: true,
            data: saved,
            message: 'WhatsApp Business Account connected successfully!',
        });

    } catch (error) {
        console.error('Error completing onboarding:', error);
        res.status(500).json({ error: 'Failed to complete onboarding' });
    }
});

/**
 * GET /api/whatsapp/onboard/status
 * Get current WhatsApp connection status for tenant
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] as string;
        if (!tenantId) return res.status(401).json({ error: 'Tenant required' });

        const repo = getRepo();
        const config = await repo.findByTenantId(tenantId);

        if (config) {
            res.json({
                success: true,
                data: {
                    isConnected: config.status === 'connected',
                    onboardingMethod: config.onboarding_method,
                    credentialSource: config.credential_source,
                    phoneNumber: config.phone_display || (config.phone_number_id ? '****' + config.phone_number_id.slice(-4) : null),
                    businessName: config.business_name || config.verified_name,
                    qualityRating: config.quality_rating,
                    features: config.features,
                },
            });
        } else {
            // Fallback to env check for backward compatibility / single tenant dev mode
            const envConnected = !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
            res.json({
                success: true,
                data: {
                    isConnected: envConnected,
                    onboardingMethod: envConnected ? 'manual' : null,
                    credentialSource: envConnected ? 'env' : null,
                    phoneNumber: process.env.WHATSAPP_PHONE_NUMBER_ID ? '****' + process.env.WHATSAPP_PHONE_NUMBER_ID.slice(-4) : null,
                    features: {},
                }
            });
        }
    } catch (error) {
        console.error('Error getting onboard status:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
});

/**
 * POST /api/whatsapp/onboard/disconnect
 * Disconnect WhatsApp Business Account
 */
router.post('/disconnect', async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] as string;
        if (!tenantId) return res.status(401).json({ error: 'Tenant required' });

        const repo = getRepo();
        await repo.updateStatus(tenantId, 'disconnected');
        // Optionally delete: await repo.delete(tenantId);

        res.json({
            success: true,
            message: 'WhatsApp Business Account disconnected',
        });

    } catch (error) {
        console.error('Error disconnecting:', error);
        res.status(500).json({ error: 'Failed to disconnect' });
    }
});

export default router;
