import { Request, Response } from 'express';
import { TrackingService, IngestEventDTO } from '../modules/growth';

export class TrackingController {
    constructor(private trackingService: TrackingService) {
        this.ingestEvent = this.ingestEvent.bind(this);
        this.getRealtimeVisitors = this.getRealtimeVisitors.bind(this);
        this.getRealtimeCount = this.getRealtimeCount.bind(this);
        this.getVisitorTimeline = this.getVisitorTimeline.bind(this);
        this.servePixelScript = this.servePixelScript.bind(this);
    }

    async ingestEvent(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const dto: IngestEventDTO = {
                tenantId,
                eventType: req.body.eventType || 'pageview',
                eventName: req.body.eventName,
                pageUrl: req.body.pageUrl,
                pageTitle: req.body.pageTitle,
                referrerUrl: req.body.referrerUrl,
                sessionId: req.body.sessionId,
                fingerprint: req.body.fingerprint,
                deviceType: req.body.deviceType,
                browser: req.body.browser,
                os: req.body.os,
                country: req.body.country,
                city: req.body.city,
                region: req.body.region,
                ipAddress: req.ip || req.body.ipAddress,
                userAgent: req.headers['user-agent'] || req.body.userAgent,
                utmSource: req.body.utmSource,
                utmMedium: req.body.utmMedium,
                utmCampaign: req.body.utmCampaign,
                utmTerm: req.body.utmTerm,
                utmContent: req.body.utmContent,
                properties: req.body.properties,
            };

            const result = await this.trackingService.ingestEvent(dto);
            res.status(201).json({
                success: true,
                eventId: result.event.id,
                visitorId: result.visitor.id,
            });
        } catch (error: any) {
            console.error('Error ingesting event:', error);
            res.status(500).json({ error: 'Failed to ingest event', message: error.message });
        }
    }

    async getRealtimeVisitors(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const visitors = await this.trackingService.getRealtimeVisitors(tenantId);
            res.json({ visitors, count: visitors.length });
        } catch (error: any) {
            console.error('Error getting realtime visitors:', error);
            res.status(500).json({ error: 'Failed to get realtime visitors' });
        }
    }

    async getRealtimeCount(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const count = await this.trackingService.getRealtimeVisitorCount(tenantId);
            res.json({ count });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get realtime count' });
        }
    }

    async getVisitorTimeline(req: Request, res: Response): Promise<void> {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const { visitorId } = req.params;
            const events = await this.trackingService.getVisitorTimeline(visitorId, tenantId);
            res.json({ events });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get visitor timeline' });
        }
    }

    async servePixelScript(req: Request, res: Response): Promise<void> {
        const tenantId = req.query.tid as string || 'default-tenant-id';
        const apiUrl = req.query.apiUrl as string || `${req.protocol}://${req.get('host')}/api/v1/growth/track`;

        const script = `
(function() {
    var MOS = window.MOS || {};
    MOS.tenantId = "${tenantId}";
    MOS.apiUrl = "${apiUrl}";
    MOS.sessionId = MOS.sessionId || Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

    function getFingerprint() {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('MOS', 2, 2);
        return canvas.toDataURL().slice(-32);
    }

    function getDeviceType() {
        var ua = navigator.userAgent;
        if (/tablet|ipad/i.test(ua)) return 'tablet';
        if (/mobile|iphone|android/i.test(ua)) return 'mobile';
        return 'desktop';
    }

    function getUTMParams() {
        var params = new URLSearchParams(window.location.search);
        return {
            utmSource: params.get('utm_source') || undefined,
            utmMedium: params.get('utm_medium') || undefined,
            utmCampaign: params.get('utm_campaign') || undefined,
            utmTerm: params.get('utm_term') || undefined,
            utmContent: params.get('utm_content') || undefined,
        };
    }

    function getBrowser() {
        var ua = navigator.userAgent;
        if (/chrome/i.test(ua)) return 'Chrome';
        if (/firefox/i.test(ua)) return 'Firefox';
        if (/safari/i.test(ua)) return 'Safari';
        if (/edge/i.test(ua)) return 'Edge';
        return 'Other';
    }

    function track(eventType, eventName, properties) {
        var utm = getUTMParams();
        var data = {
            eventType: eventType || 'pageview',
            eventName: eventName,
            pageUrl: window.location.href,
            pageTitle: document.title,
            referrerUrl: document.referrer,
            sessionId: MOS.sessionId,
            fingerprint: getFingerprint(),
            deviceType: getDeviceType(),
            browser: getBrowser(),
            os: navigator.platform,
            utmSource: utm.utmSource,
            utmMedium: utm.utmMedium,
            utmCampaign: utm.utmCampaign,
            utmTerm: utm.utmTerm,
            utmContent: utm.utmContent,
            properties: properties || {},
        };
        
        if (navigator.sendBeacon) {
            navigator.sendBeacon(MOS.apiUrl, JSON.stringify(data));
        } else {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', MOS.apiUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('x-tenant-id', MOS.tenantId);
            xhr.send(JSON.stringify(data));
        }
    }

    // Auto-track pageview
    track('pageview');

    // Expose API
    MOS.track = track;
    window.MOS = MOS;
})();
`;
        res.set('Content-Type', 'application/javascript');
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(script);
    }
}
