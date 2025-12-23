import { GearRental, GearRentalStatus, GearRentalType } from '../../entities/gear/GearRental.js';

export interface GearRentalFilters {
    rentalType?: GearRentalType;
    status?: GearRentalStatus | GearRentalStatus[];
    customerId?: string;
    customerName?: string;
    partnerVendorId?: string;
    tripId?: string;
    bookingId?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    endDateFrom?: Date;
    endDateTo?: Date;
    isOverdue?: boolean;
    search?: string;
}

export interface IGearRentalRepository {
    findById(id: string, tenantId: string): Promise<GearRental | null>;
    findByRentalNumber(rentalNumber: string, tenantId: string): Promise<GearRental | null>;
    findAll(
        tenantId: string,
        filters?: GearRentalFilters,
        limit?: number,
        offset?: number
    ): Promise<GearRental[]>;
    findActive(tenantId: string): Promise<GearRental[]>;
    findOverdue(tenantId: string): Promise<GearRental[]>;
    findByCustomer(customerId: string, tenantId: string): Promise<GearRental[]>;
    findByTrip(tripId: string, tenantId: string): Promise<GearRental[]>;
    count(tenantId: string, filters?: GearRentalFilters): Promise<number>;
    save(rental: GearRental): Promise<GearRental>;
    update(rental: GearRental): Promise<GearRental>;
    updateStatus(
        id: string,
        tenantId: string,
        status: GearRentalStatus
    ): Promise<void>;
    generateRentalNumber(tenantId: string): Promise<string>;
    calculateRevenue(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        totalRevenue: number;
        rentalCount: number;
        avgRentalValue: number;
        depositCollected: number;
        damageCharges: number;
        lateCharges: number;
    }>;
}
