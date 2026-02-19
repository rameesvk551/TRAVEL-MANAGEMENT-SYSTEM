import { generateId } from '../../../shared/utils/index.js';

export type SourceType = 'organic' | 'paid' | 'direct' | 'referral' | 'social' | 'email';

export interface TrafficSourceProps {
    id?: string;
    tenantId: string;
    visitorId?: string;
    sessionId?: string;
    sourceType: SourceType;
    source?: string;
    medium?: string;
    campaign?: string;
    referrerUrl?: string;
    landingPage?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    createdAt?: Date;
}

export class TrafficSource {
    public readonly id: string;
    public readonly tenantId: string;
    public visitorId?: string;
    public sessionId?: string;
    public readonly sourceType: SourceType;
    public source?: string;
    public medium?: string;
    public campaign?: string;
    public referrerUrl?: string;
    public landingPage?: string;
    public utmSource?: string;
    public utmMedium?: string;
    public utmCampaign?: string;
    public utmTerm?: string;
    public utmContent?: string;
    public readonly createdAt: Date;

    constructor(props: TrafficSourceProps) {
        this.id = props.id ?? generateId();
        this.tenantId = props.tenantId;
        this.visitorId = props.visitorId;
        this.sessionId = props.sessionId;
        this.sourceType = props.sourceType;
        this.source = props.source;
        this.medium = props.medium;
        this.campaign = props.campaign;
        this.referrerUrl = props.referrerUrl;
        this.landingPage = props.landingPage;
        this.utmSource = props.utmSource;
        this.utmMedium = props.utmMedium;
        this.utmCampaign = props.utmCampaign;
        this.utmTerm = props.utmTerm;
        this.utmContent = props.utmContent;
        this.createdAt = props.createdAt ?? new Date();
    }

    public static create(props: TrafficSourceProps): TrafficSource {
        return new TrafficSource(props);
    }

    public static fromPersistence(data: TrafficSourceProps): TrafficSource {
        return new TrafficSource(data);
    }

    public static classifySource(referrer?: string, utmSource?: string, utmMedium?: string): SourceType {
        if (utmMedium === 'cpc' || utmMedium === 'ppc' || utmMedium === 'paid') return 'paid';
        if (utmMedium === 'email') return 'email';
        if (utmMedium === 'social') return 'social';
        if (utmSource) return 'organic';
        if (!referrer || referrer === '') return 'direct';

        const socialDomains = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'tiktok.com', 'pinterest.com'];
        const searchEngines = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'baidu.com'];

        try {
            const url = new URL(referrer);
            const hostname = url.hostname.replace('www.', '');
            if (socialDomains.some(d => hostname.includes(d))) return 'social';
            if (searchEngines.some(d => hostname.includes(d))) return 'organic';
            return 'referral';
        } catch {
            return 'direct';
        }
    }
}
