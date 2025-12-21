import { DepartureInstance, DepartureStatus } from '../entities/DepartureInstance.js';

/**
 * Inventory state - computed values from database
 */
export interface InventoryState {
    departureId: string;
    totalCapacity: number;
    blockedSeats: number;
    sellableCapacity: number;
    heldSeats: number;
    confirmedSeats: number;
    availableSeats: number;
    bookableSeats: number;
    waitlistCount: number;
    websiteBookings: number;
    otaBookings: number;
    manualBookings: number;
}

/**
 * Filter options for departure queries
 */
export interface DepartureFilter {
    resourceId?: string;
    status?: DepartureStatus | DepartureStatus[];
    dateFrom?: Date;
    dateTo?: Date;
    hasAvailability?: boolean;
}

/**
 * Hold creation result
 */
export interface HoldResult {
    success: boolean;
    holdId?: string;
    errorCode?: string;
    errorMessage?: string;
}

/**
 * IDepartureRepository - Data access for departure instances
 * 
 * NOTE: All methods that modify inventory should use row-level locking
 * to prevent race conditions.
 */
export interface IDepartureRepository {
    /**
     * Find a departure by ID
     */
    findById(id: string, tenantId: string): Promise<DepartureInstance | null>;

    /**
     * Find departures for a resource
     */
    findByResource(
        resourceId: string,
        tenantId: string,
        filter?: DepartureFilter
    ): Promise<DepartureInstance[]>;

    /**
     * Find departures by date range
     */
    findByDateRange(
        tenantId: string,
        dateFrom: Date,
        dateTo: Date,
        filter?: DepartureFilter
    ): Promise<DepartureInstance[]>;

    /**
     * Get inventory state with calculated availability
     */
    getInventoryState(departureId: string): Promise<InventoryState | null>;

    /**
     * Get inventory states for multiple departures
     */
    getInventoryStates(departureIds: string[]): Promise<InventoryState[]>;

    /**
     * Save a departure instance
     */
    save(departure: DepartureInstance): Promise<DepartureInstance>;

    /**
     * Update departure status
     */
    updateStatus(
        id: string,
        status: DepartureStatus,
        tenantId: string
    ): Promise<boolean>;

    /**
     * Atomically create a hold with inventory check
     * Uses SELECT FOR UPDATE to prevent race conditions
     */
    createHold(params: {
        tenantId: string;
        departureId: string;
        seatCount: number;
        source: string;
        sourcePlatform?: string;
        holdType: string;
        ttlMinutes: number;
        createdById?: string;
        sessionId?: string;
    }): Promise<HoldResult>;

    /**
     * Release a hold
     */
    releaseHold(
        holdId: string,
        reason: string,
        actorId?: string
    ): Promise<boolean>;

    /**
     * Extend hold expiry
     */
    extendHold(holdId: string, additionalMinutes: number): Promise<boolean>;

    /**
     * Get active holds for a departure
     */
    getActiveHolds(departureId: string): Promise<{
        id: string;
        seatCount: number;
        source: string;
        holdType: string;
        expiresAt: Date;
        createdById?: string;
        sessionId?: string;
    }[]>;

    /**
     * Expire stale holds (for cron job)
     */
    expireStaleHolds(): Promise<number>;
}
