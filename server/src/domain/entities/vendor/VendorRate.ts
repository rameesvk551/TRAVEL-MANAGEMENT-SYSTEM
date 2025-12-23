import { generateId } from '../../../shared/utils/index.js';

export type RateType = 
    | 'PER_DAY'
    | 'PER_NIGHT'
    | 'PER_TRIP'
    | 'PER_KM'
    | 'PER_PERSON'
    | 'PER_UNIT'
    | 'FLAT';

export interface GroupSlab {
    minPax: number;
    maxPax: number;
    rate: number;
}

export interface DistanceSlab {
    minKm: number;
    maxKm: number;
    rate: number;
}

export interface VendorRateProps {
    id?: string;
    tenantId: string;
    vendorId: string;
    contractId?: string;
    rateName: string;
    rateType: RateType;
    validFrom: Date;
    validUntil?: Date;
    baseRate: number;
    currency?: string;
    minQuantity?: number;
    maxQuantity?: number;
    groupSlabs?: GroupSlab[];
    distanceSlabs?: DistanceSlab[];
    inclusions?: string[];
    exclusions?: string[];
    version?: number;
    previousVersionId?: string;
    isCurrent?: boolean;
    isActive?: boolean;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * VendorRate entity - versioned, date-bound pricing.
 * Supports multiple rate types: per day, km, person, etc.
 */
export class VendorRate {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly vendorId: string;
    public readonly contractId?: string;
    public readonly rateName: string;
    public readonly rateType: RateType;
    public readonly validFrom: Date;
    public readonly validUntil?: Date;
    public readonly baseRate: number;
    public readonly currency: string;
    public readonly minQuantity: number;
    public readonly maxQuantity?: number;
    public readonly groupSlabs: GroupSlab[];
    public readonly distanceSlabs: DistanceSlab[];
    public readonly inclusions: string[];
    public readonly exclusions: string[];
    public readonly version: number;
    public readonly previousVersionId?: string;
    public readonly isCurrent: boolean;
    public readonly isActive: boolean;
    public readonly createdBy?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: VendorRateProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.vendorId = props.vendorId;
        this.contractId = props.contractId;
        this.rateName = props.rateName;
        this.rateType = props.rateType;
        this.validFrom = props.validFrom;
        this.validUntil = props.validUntil;
        this.baseRate = props.baseRate;
        this.currency = props.currency ?? 'INR';
        this.minQuantity = props.minQuantity ?? 1;
        this.maxQuantity = props.maxQuantity;
        this.groupSlabs = props.groupSlabs ?? [];
        this.distanceSlabs = props.distanceSlabs ?? [];
        this.inclusions = props.inclusions ?? [];
        this.exclusions = props.exclusions ?? [];
        this.version = props.version ?? 1;
        this.previousVersionId = props.previousVersionId;
        this.isCurrent = props.isCurrent ?? true;
        this.isActive = props.isActive ?? true;
        this.createdBy = props.createdBy;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: VendorRateProps): VendorRate {
        return new VendorRate({
            ...props,
            id: props.id ?? generateId(),
        });
    }

    static fromPersistence(data: VendorRateProps & { id: string }): VendorRate {
        return new VendorRate(data);
    }

    /**
     * Calculate rate for given quantity and group size.
     */
    calculateAmount(quantity: number, groupSize?: number): number {
        let rate = this.baseRate;

        // Apply group slab if applicable
        if (groupSize && this.groupSlabs.length > 0) {
            const slab = this.groupSlabs.find(
                s => groupSize >= s.minPax && groupSize <= s.maxPax
            );
            if (slab) rate = slab.rate;
        }

        return rate * quantity;
    }
}
