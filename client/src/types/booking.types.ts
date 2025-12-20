export type BookingSource = 'DIRECT' | 'OTA' | 'MANUAL' | 'CSV' | 'EMAIL';

export type BookingStatus =
    | 'pending'
    | 'confirmed'
    | 'checked_in'
    | 'checked_out'
    | 'cancelled'
    | 'no_show';

export interface Booking {
    id: string;
    tenantId: string;
    resourceId: string;
    leadId?: string;
    createdById?: string;
    source: BookingSource;
    sourcePlatform?: string;
    externalRef?: string;
    startDate: string; // ISO Date string from JSON
    endDate: string;   // ISO Date string from JSON
    status: BookingStatus;
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    guestCount: number;
    baseAmount: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
    notes?: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBookingInput {
    resourceId: string;
    startDate: string; // ISO
    endDate: string;   // ISO
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    guestCount: number;
    baseAmount: number;
    totalAmount: number;
    currency?: string;
    notes?: string;
    source?: BookingSource;
}

export interface BookingFilters {
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    status?: BookingStatus;
    search?: string;
}
