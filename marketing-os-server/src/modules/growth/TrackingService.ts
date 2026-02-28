import { TrackingEvent } from '../modules/growth/models/TrackingEvent.js';
import { Visitor } from '../modules/growth/models/Visitor.js';
import { TrafficSource } from '../modules/growth/models/TrafficSource.js';
import { IVisitorRepository } from '../modules/growth/interfaces/IVisitorRepository.js';
import { ITrackingEventRepository } from '../modules/growth/interfaces/ITrackingEventRepository.js';
import { ITrafficSourceRepository } from '../modules/growth/interfaces/ITrafficSourceRepository.js';
import { Redis } from 'ioredis';

export interface IngestEventDTO {
    tenantId: string;
    eventType: 'pageview' | 'click' | 'form_submit' | 'conversion' | 'custom';
    eventName?: string;
    pageUrl?: string;
    pageTitle?: string;
    referrerUrl?: string;
    sessionId?: string;
    fingerprint?: string;
    // Visitor info
    deviceType?: string;
    browser?: string;
    os?: string;
    country?: string;
    city?: string;
    region?: string;
    ipAddress?: string;
    userAgent?: string;
    // UTM params
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    // Custom properties
    properties?: Record<string, unknown>;
}

export class TrackingService {
    constructor(
        private visitorRepository: IVisitorRepository,
        private eventRepository: ITrackingEventRepository,
        private sourceRepository: ITrafficSourceRepository,
        private redisClient: Redis,
    ) { }

    async ingestEvent(dto: IngestEventDTO): Promise<{ event: TrackingEvent; visitor: Visitor }> {
        // 1. Resolve or create visitor
        let visitor: Visitor | null = null;
        if (dto.fingerprint) {
            visitor = await this.visitorRepository.findByFingerprint(dto.fingerprint, dto.tenantId);
        }

        if (visitor) {
            visitor.recordVisit();
            if (dto.deviceType) visitor.deviceType = dto.deviceType;
            if (dto.browser) visitor.browser = dto.browser;
            if (dto.os) visitor.os = dto.os;
            if (dto.country) visitor.country = dto.country;
            if (dto.city) visitor.city = dto.city;
            visitor = await this.visitorRepository.save(visitor);
        } else {
            visitor = Visitor.create({
                tenantId: dto.tenantId,
                fingerprint: dto.fingerprint,
                deviceType: dto.deviceType,
                browser: dto.browser,
                os: dto.os,
                country: dto.country,
                city: dto.city,
                region: dto.region,
                ipAddress: dto.ipAddress,
                userAgent: dto.userAgent,
            });
            visitor = await this.visitorRepository.save(visitor);
        }

        // 2. Create tracking event
        const event = TrackingEvent.create({
            tenantId: dto.tenantId,
            visitorId: visitor.id,
            eventType: dto.eventType,
            eventName: dto.eventName,
            pageUrl: dto.pageUrl,
            pageTitle: dto.pageTitle,
            referrerUrl: dto.referrerUrl,
            sessionId: dto.sessionId,
            properties: dto.properties,
        });
        const savedEvent = await this.eventRepository.save(event);

        // 3. Classify and save traffic source
        if (dto.sessionId) {
            const sourceType = TrafficSource.classifySource(
                dto.referrerUrl,
                dto.utmSource,
                dto.utmMedium,
            );

            const source = TrafficSource.create({
                tenantId: dto.tenantId,
                visitorId: visitor.id,
                sessionId: dto.sessionId,
                sourceType,
                source: dto.utmSource,
                medium: dto.utmMedium,
                campaign: dto.utmCampaign,
                referrerUrl: dto.referrerUrl,
                landingPage: dto.pageUrl,
                utmSource: dto.utmSource,
                utmMedium: dto.utmMedium,
                utmCampaign: dto.utmCampaign,
                utmTerm: dto.utmTerm,
                utmContent: dto.utmContent,
            });
            await this.sourceRepository.save(source);
        }

        // 4. Track real-time visitor in Redis (expires in 5 minutes)
        const realtimeKey = `realtime:${dto.tenantId}:${visitor.id}`;
        await this.redisClient.setex(realtimeKey, 300, JSON.stringify({
            visitorId: visitor.id,
            pageUrl: dto.pageUrl,
            lastSeen: new Date().toISOString(),
        }));

        return { event: savedEvent, visitor };
    }

    async getVisitorTimeline(visitorId: string, tenantId: string): Promise<TrackingEvent[]> {
        return this.eventRepository.getVisitorTimeline(visitorId, tenantId);
    }

    async getRealtimeVisitorCount(tenantId: string): Promise<number> {
        const keys = await this.redisClient.keys(`realtime:${tenantId}:*`);
        return keys.length;
    }

    async getRealtimeVisitors(tenantId: string): Promise<Array<{ visitorId: string; pageUrl: string; lastSeen: string }>> {
        const keys = await this.redisClient.keys(`realtime:${tenantId}:*`);
        if (keys.length === 0) return [];

        const pipeline = this.redisClient.pipeline();
        keys.forEach(key => pipeline.get(key));
        const results = await pipeline.exec();

        return (results || [])
            .filter(([err, val]) => !err && val)
            .map(([, val]) => JSON.parse(val as string));
    }
}
