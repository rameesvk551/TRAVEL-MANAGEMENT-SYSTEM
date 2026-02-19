import { Request, Response } from 'express';
import { SourceAnalyticsService, DateRange } from '../modules/growth';
import { ConversionService } from '../modules/growth';
import { IntegrationService } from '../modules/growth';

function parseDateRange(req: Request): DateRange {
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    return {
        start: req.query.start ? new Date(req.query.start as string) : defaultStart,
        end: req.query.end ? new Date(req.query.end as string) : now,
    };
}

export class AnalyticsController {
    constructor(
        private sourceAnalyticsService: SourceAnalyticsService,
        private conversionService: ConversionService,
        private integrationService?: IntegrationService,
    ) {
        this.getOverview = this.getOverview.bind(this);
        this.getSources = this.getSources.bind(this);
        this.getUTM = this.getUTM.bind(this);
        this.getGeo = this.getGeo.bind(this);
        this.getDevices = this.getDevices.bind(this);
        this.getLandingPages = this.getLandingPages.bind(this);
        this.getCostMetrics = this.getCostMetrics.bind(this);
        this.getConversions = this.getConversions.bind(this);
        this.getConversionTrend = this.getConversionTrend.bind(this);
        this.getAttribution = this.getAttribution.bind(this);
        this.getCampaignPerformance = this.getCampaignPerformance.bind(this);
        this.getAdCreativePerformance = this.getAdCreativePerformance.bind(this);
        this.getSpendTrend = this.getSpendTrend.bind(this);
        this.recordConversion = this.recordConversion.bind(this);
    }

    async getOverview(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const overview = await this.sourceAnalyticsService.getOverview(tenantId, range);
            res.json(overview);
        } catch (error: any) {
            console.error('Error getting overview:', error);
            res.status(500).json({ error: 'Failed to get overview' });
        }
    }

    async getSources(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const sources = await this.sourceAnalyticsService.getSourceBreakdown(tenantId, range);
            res.json({ sources });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get sources' });
        }
    }

    async getUTM(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const utmData = await this.sourceAnalyticsService.getUTMDashboard(tenantId, range);
            res.json({ utmData });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get UTM data' });
        }
    }

    async getGeo(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const geoData = await this.sourceAnalyticsService.getGeoAnalytics(tenantId, range);
            res.json({ geoData });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get geo data' });
        }
    }

    async getDevices(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const deviceData = await this.sourceAnalyticsService.getDeviceAnalytics(tenantId, range);
            res.json({ deviceData });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get device data' });
        }
    }

    async getLandingPages(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const pages = await this.sourceAnalyticsService.getLandingPageStats(tenantId, range);
            res.json({ pages });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get landing page data' });
        }
    }

    async getCostMetrics(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const metrics = await this.conversionService.getCostMetrics(tenantId, range);
            res.json(metrics);
        } catch (error: any) {
            console.error('Error getting cost metrics:', error);
            res.status(500).json({ error: 'Failed to get cost metrics' });
        }
    }

    async getConversions(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const conversions = await this.conversionService.getCampaignConversions(tenantId, range);
            res.json({ conversions });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get conversions' });
        }
    }

    async getConversionTrend(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const interval = (req.query.interval as string) || 'day';
            const trend = await this.conversionService.getConversionTrend(
                tenantId, range, interval as 'day' | 'week' | 'month'
            );
            res.json({ trend });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get conversion trend' });
        }
    }

    async getAttribution(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const attribution = await this.conversionService.getAttributionReport(tenantId, range);
            res.json({ attribution });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get attribution' });
        }
    }

    async getCampaignPerformance(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const campaigns = await this.conversionService.getCampaignConversions(tenantId, range);
            res.json({ campaigns });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get campaign performance' });
        }
    }

    async getAdCreativePerformance(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const creatives = await this.conversionService.getAdCreativePerformance(tenantId, range);
            res.json({ creatives });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get ad creative performance' });
        }
    }

    async getSpendTrend(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const range = parseDateRange(req);
            const interval = (req.query.interval as string) || 'day';
            const trend = await this.conversionService.getSpendTrend(
                tenantId, range, interval as 'day' | 'week' | 'month'
            );
            res.json({ trend });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get spend trend' });
        }
    }

    async recordConversion(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const conversion = await this.conversionService.recordConversion({
                tenantId,
                ...req.body,
            });

            let integrationDispatch: Array<{ platform: string; success: boolean; eventId?: string; error?: string }> = [];
            if (this.integrationService) {
                try {
                    const rawUserData = (req.body.userData || {}) as Record<string, any>;
                    integrationDispatch = await this.integrationService.broadcastEvent(
                        {
                            eventName: req.body.eventName || conversion.conversionType,
                            eventTime: req.body.eventTime ? new Date(req.body.eventTime) : new Date(),
                            userData: {
                                email: rawUserData.email || req.body.email,
                                phone: rawUserData.phone || req.body.phone,
                                externalId: rawUserData.externalId || req.body.externalId || conversion.visitorId,
                                ipAddress: rawUserData.ipAddress || req.ip,
                                userAgent: rawUserData.userAgent || (req.headers['user-agent'] as string),
                                fbp: rawUserData.fbp,
                                fbc: rawUserData.fbc,
                                gclid: rawUserData.gclid,
                            },
                            customData: {
                                currency: req.body.currency || conversion.currency,
                                value: req.body.conversionValue ?? conversion.conversionValue,
                                contentIds: req.body.contentIds,
                                contentType: req.body.contentType,
                                orderId: req.body.orderId,
                            },
                            sourceUrl: req.body.sourceUrl || conversion.landingPage,
                            actionSource: req.body.actionSource || 'website',
                        },
                        tenantId,
                    );
                } catch (dispatchError: any) {
                    console.error('Error dispatching conversion to ad platforms:', dispatchError.message);
                }
            }

            res.status(201).json({ conversion, integrationDispatch });
        } catch (error: any) {
            console.error('Error recording conversion:', error);
            res.status(500).json({ error: 'Failed to record conversion' });
        }
    }
}
