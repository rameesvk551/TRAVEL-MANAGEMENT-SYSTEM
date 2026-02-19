// WhatsApp Onboarding Routes
// Handles Embedded Signup OAuth flow and configuration management

import { Router, Request, Response } from 'express';
import { createEmbeddedSignupService } from '../services/WhatsAppEmbeddedSignupService.js';
import { WhatsAppBusinessConfig } from '../models/whatsapp/index.js';
import { config as envConfig } from '../../../config/env.js';

const router = Router();
const signupService = createEmbeddedSignupService();

// Graph API URL for testing connections
const GRAPH_API_URL = 'https://graph.facebook.com';
const API_VERSION = envConfig.whatsapp.meta?.apiVersion || 'v18.0';

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
        
        // Test 1: Verify access token by getting WABA info
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
        
        // Test 2: Verify phone number
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
 * Connect using manual credentials (for tenants with existing API access)
 */
router.post('/manual', async (req: Request, res: Response) => {
    try {
        const { accessToken, phoneNumberId, wabaId, businessName } = req.body;
        const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] as string;
        
        if (!accessToken || !phoneNumberId || !wabaId) {
            return res.status(400).json({
                success: false,
                error: 'All credentials are required: accessToken, phoneNumberId, wabaId',
            });
        }
        
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
            });
        }
        
        // Verify credentials first
        const phoneUrl = `${GRAPH_API_URL}/${API_VERSION}/${phoneNumberId}?access_token=${accessToken}&fields=id,display_phone_number,verified_name,quality_rating`;
        const phoneResponse = await fetch(phoneUrl);
        const phoneData = await phoneResponse.json() as any;
        
        if (phoneData.error) {
            return res.status(400).json({
                success: false,
                error: `Invalid credentials: ${phoneData.error.message}`,
            });
        }
        
        // Create config entity
        const waConfig = WhatsAppBusinessConfig.create({
            tenantId,
            status: 'connected',
            onboardingMethod: 'manual',
            businessName: businessName || phoneData.verified_name,
        });
        
        waConfig.connect(
            {
                accessToken,
                phoneNumberId,
                wabaId,
            },
            {
                id: phoneNumberId,
                displayPhoneNumber: phoneData.display_phone_number,
                verifiedName: phoneData.verified_name,
                qualityRating: phoneData.quality_rating,
            }
        );
        
        // TODO: Save to database via repository
        // await waConfigRepository.save(waConfig);
        
        res.json({
            success: true,
            data: waConfig.toPublicJSON(),
            message: 'WhatsApp Business Account connected successfully!',
        });
        
    } catch (error) {
        console.error('Error in manual connection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect WhatsApp Business Account',
        });
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
        
        const result = await signupService.completeOnboarding(tenantId, code);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                errorCode: result.errorCode,
            });
        }
        
        // TODO: Save config to database via repository
        // For now, return the public config
        res.json({
            success: true,
            data: result.config?.toPublicJSON(),
            message: 'WhatsApp Business Account connected successfully!',
        });
        
    } catch (error) {
        console.error('Error completing onboarding:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete onboarding',
        });
    }
});

/**
 * GET /api/whatsapp/onboard/callback
 * OAuth callback endpoint (for redirect flow)
 */
router.get('/callback', async (req: Request, res: Response) => {
    try {
        const { code, state, error, error_description } = req.query;
        
        // Handle OAuth errors
        if (error) {
            const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5173');
            redirectUrl.pathname = '/wa-store';
            redirectUrl.searchParams.set('onboard_error', error as string);
            redirectUrl.searchParams.set('error_description', error_description as string || '');
            return res.redirect(redirectUrl.toString());
        }
        
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code missing',
            });
        }
        
        // State should contain tenantId (passed during initial redirect)
        const tenantId = state as string;
        
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid state parameter',
            });
        }
        
        if (!signupService) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp Embedded Signup not configured',
            });
        }
        
        const result = await signupService.completeOnboarding(tenantId, code as string);
        
        // Redirect to frontend with result
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

/**
 * GET /api/whatsapp/onboard/status
 * Get current WhatsApp connection status for tenant
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
            });
        }
        
        // TODO: Fetch from database
        // For now, return based on env config
        const isConfigured = !!(
            process.env.WHATSAPP_ACCESS_TOKEN && 
            process.env.WHATSAPP_PHONE_NUMBER_ID
        );
        
        res.json({
            success: true,
            data: {
                isConnected: isConfigured,
                onboardingMethod: isConfigured ? 'manual' : null,
                phoneNumber: process.env.WHATSAPP_PHONE_NUMBER_ID 
                    ? '****' + process.env.WHATSAPP_PHONE_NUMBER_ID.slice(-4) 
                    : null,
                features: {
                    catalogEnabled: false,
                    cartEnabled: true,
                    paymentsEnabled: false,
                    flowsEnabled: false,
                },
            },
        });
        
    } catch (error) {
        console.error('Error getting onboard status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get status',
        });
    }
});

/**
 * POST /api/whatsapp/onboard/disconnect
 * Disconnect WhatsApp Business Account
 */
router.post('/disconnect', async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
            });
        }
        
        // TODO: Load config from database and call disconnect()
        // For now, just acknowledge
        
        res.json({
            success: true,
            message: 'WhatsApp Business Account disconnected',
        });
        
    } catch (error) {
        console.error('Error disconnecting:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to disconnect',
        });
    }
});

/**
 * POST /api/whatsapp/onboard/refresh
 * Refresh connection status and phone quality rating
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant ID is required',
            });
        }
        
        // TODO: Load config from database, call refreshStatus(), save
        
        res.json({
            success: true,
            message: 'Status refreshed',
        });
        
    } catch (error) {
        console.error('Error refreshing status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh status',
        });
    }
});

export default router;
