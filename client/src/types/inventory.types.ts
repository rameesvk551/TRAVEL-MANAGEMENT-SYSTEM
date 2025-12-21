/**
 * Departure status - reflects inventory availability state
 */
export type DepartureStatus =
    | 'SCHEDULED'
    | 'OPEN'
    | 'FEW_LEFT'
    | 'FULL'
    | 'WAITLIST'
    | 'CLOSED'
    | 'CANCELLED'
    | 'DEPARTED';

/**
 * Hold source - where the booking originated
 */
export type HoldSource = 'WEBSITE' | 'ADMIN' | 'OTA' | 'MANUAL';

/**
 * Hold type - determines TTL
 */
export type HoldType = 'CART' | 'PAYMENT_PENDING' | 'APPROVAL_PENDING';

// BookingSource is exported from booking.types.ts
import type { BookingSource } from './booking.types';

/**
 * Booking lifecycle status
 */
export type BookingLifecycleStatus =
    | 'DRAFT'
    | 'HELD'
    | 'PENDING_PAYMENT'
    | 'PAYMENT_UNCERTAIN'
    | 'CONFIRMED'
    | 'PENDING_APPROVAL'
    | 'CANCELLED'
    | 'REFUNDED'
    | 'NO_SHOW'
    | 'COMPLETED';

/**
 * Departure instance - inventory for a specific date
 */
export interface DepartureInstance {
    id: string;
    tenantId: string;
    resourceId: string;
    departureDate: string;
    departureTime?: string;
    endDate?: string;
    cutoffDatetime?: string;
    totalCapacity: number;
    blockedSeats: number;
    overbookingLimit: number;
    minParticipants: number;
    status: DepartureStatus;
    isGuaranteed: boolean;
    priceOverride?: number;
    currency: string;
    attributes: Record<string, unknown>;
    version: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * Inventory state - computed availability values
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
 * Departure with inventory - combined view for UI
 */
export interface DepartureWithInventory {
    departure: DepartureInstance;
    inventory: InventoryState;
}

/**
 * Active hold information
 */
export interface ActiveHold {
    id: string;
    seatCount: number;
    source: string;
    holdType: string;
    expiresAt: string;
    remainingMinutes: number;
    createdById?: string;
    sessionId?: string;
    guestName?: string;
}

/**
 * Guest details for booking
 */
export interface GuestDetails {
    name: string;
    email?: string;
    phone?: string;
    nationality?: string;
}

/**
 * Initiate booking request
 */
export interface InitiateBookingRequest {
    departureId: string;
    resourceId: string;
    participantCount: number;
    primaryGuest: GuestDetails;
    additionalGuests?: GuestDetails[];
    source: BookingSource;
    sourcePlatform?: string;
    externalRef?: string;
    specialRequirements?: string;
    notes?: string;
}

/**
 * Booking initiation result
 */
export interface BookingInitResult {
    success: boolean;
    bookingId?: string;
    holdId?: string;
    holdExpiresAt?: string;
    totalAmount?: number;
    errorCode?: string;
    errorMessage?: string;
}

/**
 * Calendar view data structure
 */
export interface CalendarDeparture {
    id: string;
    resourceId: string;
    resourceName: string;
    date: string;
    status: DepartureStatus;
    totalCapacity: number;
    availableSeats: number;
    confirmedSeats: number;
    heldSeats: number;
    percentFilled: number;
}

/**
 * Calendar view grouped by resource
 */
export interface CalendarData {
    resources: {
        id: string;
        name: string;
        type: string;
    }[];
    departures: CalendarDeparture[];
    dateRange: {
        start: string;
        end: string;
    };
}

/**
 * Create departure request
 */
export interface CreateDepartureRequest {
    resourceId: string;
    departureDate: string;
    departureTime?: string;
    endDate?: string;
    cutoffDatetime?: string;
    totalCapacity: number;
    blockedSeats?: number;
    overbookingLimit?: number;
    minParticipants?: number;
    priceOverride?: number;
    currency?: string;
    attributes?: Record<string, unknown>;
}

/**
 * Availability check result
 */
export interface AvailabilityResult {
    available: boolean;
    availableSeats: number;
    bookableSeats: number;
    requiresOverbooking: boolean;
}

/**
 * Payment types
 */
export type PaymentType = 'FULL' | 'DEPOSIT' | 'PARTIAL' | 'BALANCE';
export type PaymentMethod = 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'OTA_COLLECT';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

/**
 * Payment record
 */
export interface Payment {
    id: string;
    bookingId: string;
    paymentType: PaymentType;
    method: PaymentMethod;
    amount: number;
    currency: string;
    status: PaymentStatus;
    gateway?: string;
    gatewayPaymentId?: string;
    paymentLinkUrl?: string;
    linkExpiresAt?: string;
    createdAt: string;
    completedAt?: string;
}

/**
 * Booking payment summary
 */
export interface BookingPaymentSummary {
    bookingId: string;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
    paymentCount: number;
    lastPaymentDate?: string;
    hasFailedPayments: boolean;
}
