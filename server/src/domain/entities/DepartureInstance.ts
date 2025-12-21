import { generateId } from '../../shared/utils/index.js';

/**
 * Departure status - reflects inventory availability state
 */
export type DepartureStatus =
    | 'SCHEDULED'   // Future departure, not yet open for booking
    | 'OPEN'        // Accepting bookings
    | 'FEW_LEFT'    // Less than 20% available
    | 'FULL'        // No availability (but may accept overbooking)
    | 'WAITLIST'    // Full, accepting waitlist entries
    | 'CLOSED'      // Past cutoff, no more bookings
    | 'CANCELLED'   // Departure cancelled
    | 'DEPARTED';   // Already occurred

export interface DepartureInstanceProps {
    id?: string;
    tenantId: string;
    resourceId: string;
    departureDate: Date;
    departureTime?: string;
    endDate?: Date;
    cutoffDatetime?: Date;
    totalCapacity: number;
    blockedSeats?: number;
    overbookingLimit?: number;
    minParticipants?: number;
    status?: DepartureStatus;
    isGuaranteed?: boolean;
    priceOverride?: number;
    currency?: string;
    attributes?: Record<string, unknown>;
    version?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * DepartureInstance - The heart of inventory management.
 * 
 * CORE CONCEPT: A Resource (Tour/Trek) is a TEMPLATE.
 * A DepartureInstance is REAL INVENTORY for a specific date.
 */
export class DepartureInstance {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly resourceId: string;
    public readonly departureDate: Date;
    public readonly departureTime?: string;
    public readonly endDate?: Date;
    public readonly cutoffDatetime?: Date;
    public readonly totalCapacity: number;
    public readonly blockedSeats: number;
    public readonly overbookingLimit: number;
    public readonly minParticipants: number;
    public readonly status: DepartureStatus;
    public readonly isGuaranteed: boolean;
    public readonly priceOverride?: number;
    public readonly currency: string;
    public readonly attributes: Record<string, unknown>;
    public readonly version: number;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<Omit<DepartureInstanceProps, 
        'departureTime' | 'endDate' | 'cutoffDatetime' | 'priceOverride'>> & 
        Pick<DepartureInstanceProps, 'departureTime' | 'endDate' | 'cutoffDatetime' | 'priceOverride'>
    ) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.resourceId = props.resourceId;
        this.departureDate = props.departureDate;
        this.departureTime = props.departureTime;
        this.endDate = props.endDate;
        this.cutoffDatetime = props.cutoffDatetime;
        this.totalCapacity = props.totalCapacity;
        this.blockedSeats = props.blockedSeats;
        this.overbookingLimit = props.overbookingLimit;
        this.minParticipants = props.minParticipants;
        this.status = props.status;
        this.isGuaranteed = props.isGuaranteed;
        this.priceOverride = props.priceOverride;
        this.currency = props.currency;
        this.attributes = props.attributes;
        this.version = props.version;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    /**
     * Sellable capacity = Total - Blocked
     */
    get sellableCapacity(): number {
        return this.totalCapacity - this.blockedSeats;
    }

    /**
     * Maximum bookable including overbooking allowance
     */
    get maxBookable(): number {
        return this.sellableCapacity + this.overbookingLimit;
    }

    /**
     * Check if departure is still accepting bookings
     */
    get isBookable(): boolean {
        return ['OPEN', 'FEW_LEFT', 'FULL'].includes(this.status);
    }

    /**
     * Check if past cutoff time
     */
    get isPastCutoff(): boolean {
        if (!this.cutoffDatetime) return false;
        return new Date() > this.cutoffDatetime;
    }

    static create(props: DepartureInstanceProps): DepartureInstance {
        const now = new Date();
        return new DepartureInstance({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            resourceId: props.resourceId,
            departureDate: props.departureDate,
            departureTime: props.departureTime,
            endDate: props.endDate,
            cutoffDatetime: props.cutoffDatetime,
            totalCapacity: props.totalCapacity,
            blockedSeats: props.blockedSeats ?? 0,
            overbookingLimit: props.overbookingLimit ?? 0,
            minParticipants: props.minParticipants ?? 1,
            status: props.status ?? 'SCHEDULED',
            isGuaranteed: props.isGuaranteed ?? false,
            priceOverride: props.priceOverride,
            currency: props.currency ?? 'INR',
            attributes: props.attributes ?? {},
            version: props.version ?? 1,
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    }

    static fromPersistence(data: Required<Omit<DepartureInstanceProps,
        'departureTime' | 'endDate' | 'cutoffDatetime' | 'priceOverride'>> &
        Pick<DepartureInstanceProps, 'departureTime' | 'endDate' | 'cutoffDatetime' | 'priceOverride'>
    ): DepartureInstance {
        return new DepartureInstance(data);
    }
}
