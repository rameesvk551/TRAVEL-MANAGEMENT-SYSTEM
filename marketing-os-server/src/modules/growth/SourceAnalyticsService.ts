import { ITrafficSourceRepository } from '../modules/growth/interfaces/ITrafficSourceRepository';
import { IVisitorRepository } from '../modules/growth/interfaces/IVisitorRepository';
import { ITrackingEventRepository } from '../modules/growth/interfaces/ITrackingEventRepository';

export interface DateRange {
    start: Date;
    end: Date;
}

export class SourceAnalyticsService {
    constructor(
        private sourceRepository: ITrafficSourceRepository,
        private visitorRepository: IVisitorRepository,
        private eventRepository: ITrackingEventRepository,
    ) { }

    async getSourceBreakdown(tenantId: string, range: DateRange) {
        return this.sourceRepository.countBySourceType(tenantId, range.start, range.end);
    }

    async getUTMDashboard(tenantId: string, range: DateRange) {
        return this.sourceRepository.getUTMBreakdown(tenantId, range.start, range.end);
    }

    async getGeoAnalytics(tenantId: string, range: DateRange) {
        return this.visitorRepository.countByCountry(tenantId, range.start, range.end);
    }

    async getDeviceAnalytics(tenantId: string, range: DateRange) {
        return this.visitorRepository.countByDevice(tenantId, range.start, range.end);
    }

    async getLandingPageStats(tenantId: string, range: DateRange) {
        return this.sourceRepository.getLandingPageStats(tenantId, range.start, range.end);
    }

    async getTopPages(tenantId: string, range: DateRange) {
        return this.eventRepository.countByPage(tenantId, range.start, range.end);
    }

    async getEventBreakdown(tenantId: string, range: DateRange) {
        return this.eventRepository.countByType(tenantId, range.start, range.end);
    }

    async getOverview(tenantId: string, range: DateRange) {
        const [sources, visitors, events, geo, devices, landingPages] = await Promise.all([
            this.sourceRepository.countBySourceType(tenantId, range.start, range.end),
            this.visitorRepository.countByDateRange(tenantId, range.start, range.end),
            this.eventRepository.countByType(tenantId, range.start, range.end),
            this.visitorRepository.countByCountry(tenantId, range.start, range.end),
            this.visitorRepository.countByDevice(tenantId, range.start, range.end),
            this.sourceRepository.getLandingPageStats(tenantId, range.start, range.end),
        ]);

        const totalEvents = events.reduce((sum, e) => sum + e.count, 0);
        const pageviews = events.find(e => e.eventType === 'pageview')?.count || 0;

        return {
            totalVisitors: visitors,
            totalEvents,
            pageviews,
            sourceBreakdown: sources,
            geoBreakdown: geo.slice(0, 10),
            deviceBreakdown: devices,
            topLandingPages: landingPages.slice(0, 10),
        };
    }
}
