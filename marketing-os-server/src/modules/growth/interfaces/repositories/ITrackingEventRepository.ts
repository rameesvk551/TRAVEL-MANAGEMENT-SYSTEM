import { TrackingEvent, EventType } from '../entities/TrackingEvent.js';

export interface EventFilters {
    eventType?: EventType;
    visitorId?: string;
    sessionId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export interface ITrackingEventRepository {
    save(event: TrackingEvent): Promise<TrackingEvent>;
    saveBatch(events: TrackingEvent[]): Promise<void>;
    findById(id: string, tenantId: string): Promise<TrackingEvent | null>;
    findAll(tenantId: string, filters?: EventFilters): Promise<{ events: TrackingEvent[]; total: number }>;
    countByType(tenantId: string, start: Date, end: Date): Promise<Array<{ eventType: string; count: number }>>;
    countByPage(tenantId: string, start: Date, end: Date): Promise<Array<{ pageUrl: string; count: number }>>;
    getVisitorTimeline(visitorId: string, tenantId: string): Promise<TrackingEvent[]>;
}
