import { generateId } from '../../../shared/utils/index.js';

export type AdPlatform = 'meta' | 'google' | 'tiktok' | 'linkedin';

export interface AdCostProps {
    id?: string;
    tenantId: string;
    platform: AdPlatform;
    campaignId?: string;
    campaignName?: string;
    adSetId?: string;
    adSetName?: string;
    adId?: string;
    adName?: string;
    date: Date;
    spend?: number;
    impressions?: number;
    clicks?: number;
    conversions?: number;
    revenue?: number;
    currency?: string;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

export class AdCost {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly platform: AdPlatform;
    public campaignId?: string;
    public campaignName?: string;
    public adSetId?: string;
    public adSetName?: string;
    public adId?: string;
    public adName?: string;
    public date: Date;
    public spend: number;
    public impressions: number;
    public clicks: number;
    public conversions: number;
    public revenue: number;
    public currency: string;
    public metadata: Record<string, unknown>;
    public readonly createdAt: Date;
    public updatedAt: Date;

    constructor(props: AdCostProps) {
        const now = new Date();
        this.id = props.id ?? generateId();
        this.tenantId = props.tenantId;
        this.platform = props.platform;
        this.campaignId = props.campaignId;
        this.campaignName = props.campaignName;
        this.adSetId = props.adSetId;
        this.adSetName = props.adSetName;
        this.adId = props.adId;
        this.adName = props.adName;
        this.date = props.date;
        this.spend = props.spend ?? 0;
        this.impressions = props.impressions ?? 0;
        this.clicks = props.clicks ?? 0;
        this.conversions = props.conversions ?? 0;
        this.revenue = props.revenue ?? 0;
        this.currency = props.currency ?? 'USD';
        this.metadata = props.metadata ?? {};
        this.createdAt = props.createdAt ?? now;
        this.updatedAt = props.updatedAt ?? now;
    }

    public static create(props: AdCostProps): AdCost {
        return new AdCost(props);
    }

    public static fromPersistence(data: AdCostProps): AdCost {
        return new AdCost(data);
    }

    public get ctr(): number {
        return this.impressions > 0 ? (this.clicks / this.impressions) * 100 : 0;
    }

    public get cpc(): number {
        return this.clicks > 0 ? this.spend / this.clicks : 0;
    }

    public get roas(): number {
        return this.spend > 0 ? this.revenue / this.spend : 0;
    }

    public get costPerConversion(): number {
        return this.conversions > 0 ? this.spend / this.conversions : 0;
    }
}
