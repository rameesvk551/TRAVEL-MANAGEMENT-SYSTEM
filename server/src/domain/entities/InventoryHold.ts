import { generateId } from '../../shared/utils/index.js';

/**
 * Hold source - where the booking originated
 */
export type HoldSource = 'WEBSITE' | 'ADMIN' | 'OTA' | 'MANUAL';

/**
 * Hold type - determines TTL
 * - CART: 15 minutes (browsing)
 * - PAYMENT_PENDING: 30 minutes (entered payment flow)
 * - APPROVAL_PENDING: 24 hours (staff manual booking)
 */
export type HoldType = 'CART' | 'PAYMENT_PENDING' | 'APPROVAL_PENDING';

/**
 * Release reason - why the hold was released
 */
export type ReleaseReason = 'CONFIRMED' | 'EXPIRED' | 'CANCELLED' | 'MANUAL';

/**
 * Hold TTL configuration (in minutes)
 */
export const HOLD_TTL: Record<HoldType, number> = {
    CART: 15,
    PAYMENT_PENDING: 30,
    APPROVAL_PENDING: 1440, // 24 hours
};

export interface InventoryHoldProps {
    id?: string;
    tenantId: string;
    departureId: string;
    bookingId?: string;
    seatCount: number;
    source: HoldSource;
    sourcePlatform?: string;
    holdType: HoldType;
    expiresAt: Date;
    createdById?: string;
    sessionId?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    releasedAt?: Date;
    releaseReason?: ReleaseReason;
}

/**
 * InventoryHold - Time-bound seat reservation before payment.
 * 
 * PURPOSE: Prevents race conditions by locking inventory during the 
 * booking flow. Automatically expires to prevent inventory deadlock.
 */
export class InventoryHold {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly departureId: string;
    public readonly bookingId?: string;
    public readonly seatCount: number;
    public readonly source: HoldSource;
    public readonly sourcePlatform?: string;
    public readonly holdType: HoldType;
    public readonly expiresAt: Date;
    public readonly createdById?: string;
    public readonly sessionId?: string;
    public readonly notes?: string;
    public readonly metadata: Record<string, unknown>;
    public readonly createdAt: Date;
    public readonly releasedAt?: Date;
    public readonly releaseReason?: ReleaseReason;

    private constructor(props: Required<Omit<InventoryHoldProps,
        'bookingId' | 'sourcePlatform' | 'createdById' | 'sessionId' | 'notes' | 'releasedAt' | 'releaseReason'>> &
        Pick<InventoryHoldProps, 'bookingId' | 'sourcePlatform' | 'createdById' | 'sessionId' | 'notes' | 'releasedAt' | 'releaseReason'>
    ) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.departureId = props.departureId;
        this.bookingId = props.bookingId;
        this.seatCount = props.seatCount;
        this.source = props.source;
        this.sourcePlatform = props.sourcePlatform;
        this.holdType = props.holdType;
        this.expiresAt = props.expiresAt;
        this.createdById = props.createdById;
        this.sessionId = props.sessionId;
        this.notes = props.notes;
        this.metadata = props.metadata;
        this.createdAt = props.createdAt;
        this.releasedAt = props.releasedAt;
        this.releaseReason = props.releaseReason;
    }

    /**
     * Check if hold is still active (not released and not expired)
     */
    get isActive(): boolean {
        return !this.releasedAt && this.expiresAt > new Date();
    }

    /**
     * Check if hold has expired
     */
    get isExpired(): boolean {
        return !this.releasedAt && this.expiresAt <= new Date();
    }

    /**
     * Calculate remaining time in milliseconds
     */
    get remainingTimeMs(): number {
        if (this.releasedAt) return 0;
        return Math.max(0, this.expiresAt.getTime() - Date.now());
    }

    /**
     * Calculate remaining time in minutes
     */
    get remainingMinutes(): number {
        return Math.ceil(this.remainingTimeMs / 60000);
    }

    static create(props: Omit<InventoryHoldProps, 'expiresAt'> & { expiresAt?: Date }): InventoryHold {
        const now = new Date();
        const ttlMinutes = HOLD_TTL[props.holdType];
        const expiresAt = props.expiresAt ?? new Date(now.getTime() + ttlMinutes * 60000);

        return new InventoryHold({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            departureId: props.departureId,
            bookingId: props.bookingId,
            seatCount: props.seatCount,
            source: props.source,
            sourcePlatform: props.sourcePlatform,
            holdType: props.holdType,
            expiresAt,
            createdById: props.createdById,
            sessionId: props.sessionId,
            notes: props.notes,
            metadata: props.metadata ?? {},
            createdAt: props.createdAt ?? now,
            releasedAt: props.releasedAt,
            releaseReason: props.releaseReason,
        });
    }

    static fromPersistence(data: Required<Omit<InventoryHoldProps,
        'bookingId' | 'sourcePlatform' | 'createdById' | 'sessionId' | 'notes' | 'releasedAt' | 'releaseReason'>> &
        Pick<InventoryHoldProps, 'bookingId' | 'sourcePlatform' | 'createdById' | 'sessionId' | 'notes' | 'releasedAt' | 'releaseReason'>
    ): InventoryHold {
        return new InventoryHold(data);
    }
}
