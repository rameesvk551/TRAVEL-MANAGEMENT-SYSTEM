import { generateId } from '../../../shared/utils/index.js';

export type ConversionType = 'signup' | 'purchase' | 'lead' | 'subscription' | 'custom';
export type AttributionModel = 'last_touch' | 'first_touch' | 'linear' | 'time_decay';

export interface ConversionProps {
    id?: string;
    tenantId: string;
    visitorId?: string;
    eventId?: string;
    sourceId?: string;
    campaignId?: string;
    conversionType: ConversionType;
    conversionValue?: number;
    currency?: string;
    landingPage?: string;
    attributionModel?: AttributionModel;
    attributionData?: Record<string, unknown>;
    properties?: Record<string, unknown>;
    createdAt?: Date;
}

export class Conversion {
    public readonly id: string;
    public readonly tenantId: string;
    public visitorId?: string;
    public eventId?: string;
    public sourceId?: string;
    public campaignId?: string;
    public readonly conversionType: ConversionType;
    public conversionValue: number;
    public currency: string;
    public landingPage?: string;
    public attributionModel: AttributionModel;
    public attributionData: Record<string, unknown>;
    public properties: Record<string, unknown>;
    public readonly createdAt: Date;

    constructor(props: ConversionProps) {
        this.id = props.id ?? generateId();
        this.tenantId = props.tenantId;
        this.visitorId = props.visitorId;
        this.eventId = props.eventId;
        this.sourceId = props.sourceId;
        this.campaignId = props.campaignId;
        this.conversionType = props.conversionType;
        this.conversionValue = props.conversionValue ?? 0;
        this.currency = props.currency ?? 'USD';
        this.landingPage = props.landingPage;
        this.attributionModel = props.attributionModel ?? 'last_touch';
        this.attributionData = props.attributionData ?? {};
        this.properties = props.properties ?? {};
        this.createdAt = props.createdAt ?? new Date();
    }

    public static create(props: ConversionProps): Conversion {
        return new Conversion(props);
    }

    public static fromPersistence(data: ConversionProps): Conversion {
        return new Conversion(data);
    }
}
