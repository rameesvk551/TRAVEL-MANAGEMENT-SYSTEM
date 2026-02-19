import { generateId } from '../../../shared/utils/index.js';

export interface VisitorProps {
    id?: string;
    tenantId: string;
    fingerprint?: string;
    firstSeen?: Date;
    lastSeen?: Date;
    visitCount?: number;
    deviceType?: string;
    browser?: string;
    os?: string;
    country?: string;
    city?: string;
    region?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Visitor {
    public readonly id: string;
    public readonly tenantId: string;
    public fingerprint?: string;
    public firstSeen: Date;
    public lastSeen: Date;
    public visitCount: number;
    public deviceType?: string;
    public browser?: string;
    public os?: string;
    public country?: string;
    public city?: string;
    public region?: string;
    public ipAddress?: string;
    public userAgent?: string;
    public metadata: Record<string, unknown>;
    public readonly createdAt: Date;
    public updatedAt: Date;

    constructor(props: VisitorProps) {
        const now = new Date();
        this.id = props.id ?? generateId();
        this.tenantId = props.tenantId;
        this.fingerprint = props.fingerprint;
        this.firstSeen = props.firstSeen ?? now;
        this.lastSeen = props.lastSeen ?? now;
        this.visitCount = props.visitCount ?? 1;
        this.deviceType = props.deviceType;
        this.browser = props.browser;
        this.os = props.os;
        this.country = props.country;
        this.city = props.city;
        this.region = props.region;
        this.ipAddress = props.ipAddress;
        this.userAgent = props.userAgent;
        this.metadata = props.metadata ?? {};
        this.createdAt = props.createdAt ?? now;
        this.updatedAt = props.updatedAt ?? now;
    }

    public static create(props: VisitorProps): Visitor {
        return new Visitor(props);
    }

    public static fromPersistence(data: VisitorProps): Visitor {
        return new Visitor(data);
    }

    public recordVisit(): void {
        this.visitCount += 1;
        this.lastSeen = new Date();
        this.updatedAt = new Date();
    }
}
