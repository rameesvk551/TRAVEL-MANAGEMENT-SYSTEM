import { generateId } from '../../../shared/utils/index.js';

export type EventType = 'pageview' | 'click' | 'form_submit' | 'conversion' | 'custom';

export interface TrackingEventProps {
    id?: string;
    tenantId: string;
    visitorId?: string;
    eventType: EventType;
    eventName?: string;
    pageUrl?: string;
    pageTitle?: string;
    referrerUrl?: string;
    sessionId?: string;
    properties?: Record<string, unknown>;
    createdAt?: Date;
}

export class TrackingEvent {
    public readonly id: string;
    public readonly tenantId: string;
    public visitorId?: string;
    public readonly eventType: EventType;
    public eventName?: string;
    public pageUrl?: string;
    public pageTitle?: string;
    public referrerUrl?: string;
    public sessionId?: string;
    public properties: Record<string, unknown>;
    public readonly createdAt: Date;

    constructor(props: TrackingEventProps) {
        this.id = props.id ?? generateId();
        this.tenantId = props.tenantId;
        this.visitorId = props.visitorId;
        this.eventType = props.eventType;
        this.eventName = props.eventName;
        this.pageUrl = props.pageUrl;
        this.pageTitle = props.pageTitle;
        this.referrerUrl = props.referrerUrl;
        this.sessionId = props.sessionId;
        this.properties = props.properties ?? {};
        this.createdAt = props.createdAt ?? new Date();
    }

    public static create(props: TrackingEventProps): TrackingEvent {
        return new TrackingEvent(props);
    }

    public static fromPersistence(data: TrackingEventProps): TrackingEvent {
        return new TrackingEvent(data);
    }
}
