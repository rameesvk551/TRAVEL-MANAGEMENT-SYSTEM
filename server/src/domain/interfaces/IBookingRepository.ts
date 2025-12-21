import { Booking, BookingSource, BookingStatus } from '../entities/Booking.js';

export interface BookingFilters {
    resourceId?: string;
    status?: BookingStatus;
    source?: BookingSource;
    startDate?: Date; // For overlap check
    endDate?: Date;   // For overlap check
    search?: string;
    limit?: number;
    offset?: number;
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
        filters: BookingFilters & { limit: number; offset: number }
    ): Promise<{ bookings: Booking[]; total: number }>;
    count(tenantId: string, filters?: BookingFilters): Promise<number>;
    save(booking: Booking): Promise<Booking>;
    update(booking: Booking): Promise<Booking>;
    delete(id: string, tenantId: string): Promise<void>;
    updateStatus(id: string, status: BookingStatus, tenantId: string): Promise<Booking | null>;
}
