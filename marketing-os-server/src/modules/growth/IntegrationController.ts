import { Request, Response } from 'express';
import { IntegrationService } from '../modules/growth.js';

/**
 * Controller for managing third-party ad platform integrations.
 */
export class IntegrationController {
    constructor(private integrationService: IntegrationService) { }

    private resolveTenantId(req: Request): string {
        return req.user?.tenantId || (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
    }

    private parseDateRange(req: Request): { startDate: Date; endDate: Date } {
        const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : new Date();
        const startDate = req.query.startDate
            ? new Date(String(req.query.startDate))
            : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { startDate, endDate };
    }

    /**
     * GET /integrations/status
     * Returns the configuration and connection status of all integrations.
     */
    getStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = this.resolveTenantId(req);
            const status = await this.integrationService.getIntegrationStatus(tenantId);
            res.json({ success: true, data: status });
        } catch (error: any) {
            console.error('[IntegrationController] Error getting status:', error.message);
            res.status(500).json({ success: false, error: 'Failed to get integration status' });
        }
    };

    /**
     * POST /integrations/sync-costs
     * Trigger ad cost sync from all configured platforms.
     * Body: { startDate?: string, endDate?: string }
     */
    syncCosts = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = this.resolveTenantId(req);
            const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date();
            const startDate = req.body.startDate
                ? new Date(req.body.startDate)
                : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // default last 30 days

            const result = await this.integrationService.syncAdCosts(tenantId, startDate, endDate);
            res.json({
                success: true,
                data: {
                    synced: result.synced,
                    errors: result.errors,
                    dateRange: {
                        start: startDate.toISOString(),
                        end: endDate.toISOString(),
                    },
                },
            });
        } catch (error: any) {
            console.error('[IntegrationController] Error syncing costs:', error.message);
            res.status(500).json({ success: false, error: 'Failed to sync ad costs' });
        }
    };

    /**
     * POST /integrations/test
     * Test connection for a specific platform.
     * Body: { platform: string }
     */
    testConnection = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = this.resolveTenantId(req);
            const allStatus = await this.integrationService.getIntegrationStatus(tenantId);
            const platform = typeof req.body.platform === 'string' ? req.body.platform.toLowerCase() : undefined;

            if (platform) {
                const match = allStatus.find(s => s.platform === platform);
                if (!match) {
                    res.status(404).json({ success: false, error: `Platform "${platform}" not found` });
                    return;
                }
                res.json({ success: true, data: match });
                return;
            }

            res.json({ success: true, data: allStatus });
        } catch (error: any) {
            console.error('[IntegrationController] Error testing connection:', error.message);
            res.status(500).json({ success: false, error: 'Failed to test connection' });
        }
    };

    /**
     * GET /integrations/credentials
     * Return masked tenant credentials for supported platforms.
     */
    getCredentials = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = this.resolveTenantId(req);
            const data = await this.integrationService.getTenantCredentials(tenantId);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[IntegrationController] Error getting credentials:', error.message);
            res.status(500).json({ success: false, error: 'Failed to get credentials' });
        }
    };

    /**
     * PUT /integrations/credentials/:platform
     * Upsert tenant-specific credentials.
     */
    upsertCredentials = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = this.resolveTenantId(req);
            const platform = req.params.platform;
            const credentials = req.body.credentials || {};
            const isActive = req.body.isActive !== false;

            await this.integrationService.saveTenantCredentials(tenantId, platform, credentials, isActive);
            const status = await this.integrationService.getIntegrationStatus(tenantId);
            const match = status.find(s => s.platform === platform.toLowerCase()) || null;
            res.json({ success: true, data: match });
        } catch (error: any) {
            console.error('[IntegrationController] Error saving credentials:', error.message);
            res.status(500).json({ success: false, error: error.message || 'Failed to save credentials' });
        }
    };

    getMetaAudience = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = this.resolveTenantId(req);
            const { startDate, endDate } = this.parseDateRange(req);
            const data = await this.integrationService.getMetaAudienceInsights(tenantId, startDate, endDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[IntegrationController] Error getting Meta audience:', error.message);
            res.status(500).json({ success: false, error: 'Failed to fetch Meta audience insights' });
        }
    };

    getGoogleKeywords = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = this.resolveTenantId(req);
            const { startDate, endDate } = this.parseDateRange(req);
            const data = await this.integrationService.getGoogleKeywordPerformance(tenantId, startDate, endDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[IntegrationController] Error getting Google keywords:', error.message);
            res.status(500).json({ success: false, error: 'Failed to fetch Google keyword performance' });
        }
    };

    getGoogleSearchTerms = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = this.resolveTenantId(req);
            const { startDate, endDate } = this.parseDateRange(req);
            const data = await this.integrationService.getGoogleSearchTerms(tenantId, startDate, endDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[IntegrationController] Error getting Google search terms:', error.message);
            res.status(500).json({ success: false, error: 'Failed to fetch Google search terms' });
        }
    };

    getGa4Behavior = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = this.resolveTenantId(req);
            const { startDate, endDate } = this.parseDateRange(req);
            const data = await this.integrationService.getGa4Behavior(tenantId, startDate, endDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[IntegrationController] Error getting GA4 behavior:', error.message);
            res.status(500).json({ success: false, error: 'Failed to fetch GA4 behavior' });
        }
    };

    getGa4Funnels = async (req: Request, res: Response): Promise<void> => {
        try {
            const tenantId = this.resolveTenantId(req);
            const { startDate, endDate } = this.parseDateRange(req);
            const data = await this.integrationService.getGa4Funnels(tenantId, startDate, endDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[IntegrationController] Error getting GA4 funnels:', error.message);
            res.status(500).json({ success: false, error: 'Failed to fetch GA4 funnel insights' });
        }
    };
}
