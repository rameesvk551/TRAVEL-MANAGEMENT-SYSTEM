import { Booking, BookingSource, BookingStatus } from '../entities/Booking.js';

export interface BookingFilters {
    resourceId?: string;
    status?: BookingStatus;
    source?: BookingSource;
    startDateFrom?: Date;
    startDateTo?: Date;
    search?: string;
}

/**
 * Booking repository interface - defines data access contract.
 */
export interface IBookingRepository {
    findById(id: string, tenantId: string): Promise<Booking | null>;
    findByExternalRef(
        sourcePlatform: string,
        externalRef: string,
        tenantId: string
    ): Promise<Booking | null>;
    findAll(
        tenantId: string,
        filters?: BookingFilters,
        limit?: number,
        offset?: number
    ): Promise<Booking[]>;
    count(tenantId: string, filters?: BookingFilters): Promise<number>;
    save(booking: Booking): Promise<Booking>;
    update(booking: Booking): Promise<Booking>;
    delete(id: string, tenantId: string): Promise<void>;
}
