import { Booking, BookingSource } from '../../domain/entities/Booking.js';
import { HoldSource, HoldType } from '../../domain/entities/InventoryHold.js';
import { IBookingRepository } from '../../domain/interfaces/IBookingRepository.js';
import { IDepartureRepository } from '../../domain/interfaces/IDepartureRepository.js';
import { IPaymentRepository } from '../../domain/interfaces/IPaymentRepository.js';
import { ValidationError, ConflictError } from '../../shared/errors/index.js';
import { HoldService } from './HoldService.js';
import { InventoryService } from './InventoryService.js';

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
 * Guest details for booking
 */
export interface GuestDetails {
    name: string;
    email?: string;
    phone?: string;
    nationality?: string;
}

/**
 * DTO for initiating a booking
 */
export interface InitiateBookingDTO {
    tenantId: string;
    departureId: string;
    resourceId: string;
    participantCount: number;
    primaryGuest: GuestDetails;
    additionalGuests?: GuestDetails[];
    source: BookingSource;
    sourcePlatform?: string;
    externalRef?: string;
    createdById?: string;
    sessionId?: string;
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
    holdExpiresAt?: Date;
    totalAmount?: number;
    errorCode?: string;
    errorMessage?: string;
}

/**
 * BookingOrchestrator - Single entry point for ALL booking channels.
 * 
 * CRITICAL DESIGN PRINCIPLE:
 * - Source is METADATA, not logic
 * - Same flow for website, admin, OTA, manual
 * - Inventory service is authoritative
 * - Payment service is asynchronous
 * 
 * Booking Flow:
 * 1. initiate() - Create hold, create draft booking
 * 2. confirmPayment() - Payment received, confirm booking
 * 3. cancel() - Cancel booking, release inventory
 */
export class BookingOrchestrator {
    constructor(
        private bookingRepository: IBookingRepository,
        private departureRepository: IDepartureRepository,
        private paymentRepository: IPaymentRepository,
        private inventoryService: InventoryService,
        private holdService: HoldService
    ) {}

    /**
     * Initiate a booking - Step 1 of booking flow
     * 
     * This creates a HOLD on inventory and a DRAFT booking.
     * The booking is NOT confirmed until payment is received.
     */
    async initiateBooking(dto: InitiateBookingDTO): Promise<BookingInitResult> {
        // 1. Validate guest details
        if (!dto.primaryGuest.name) {
            return this.errorResult('INVALID_GUEST', 'Primary guest name is required');
        }

        if (dto.participantCount < 1) {
            return this.errorResult('INVALID_COUNT', 'Participant count must be at least 1');
        }

        // 2. Check availability
        const availability = await this.inventoryService.checkAvailability(
            dto.departureId,
            dto.participantCount
        );

        if (!availability.available) {
            return this.errorResult(
                'NO_AVAILABILITY',
                `Only ${availability.availableSeats} seats available`
            );
        }

        // 3. Map booking source to hold source
        const holdSource = this.mapToHoldSource(dto.source);

        // 4. Determine hold type based on source
        const holdType: HoldType = dto.source === 'MANUAL' || dto.source === 'CSV'
            ? 'APPROVAL_PENDING'  // Staff bookings get 24h hold
            : 'CART';             // Website/OTA get 15min hold

        // 5. Create inventory hold (atomic operation)
        const holdResult = await this.holdService.createHold({
            tenantId: dto.tenantId,
            departureId: dto.departureId,
            seatCount: dto.participantCount,
            source: holdSource,
            sourcePlatform: dto.sourcePlatform,
            holdType,
            createdById: dto.createdById,
            sessionId: dto.sessionId,
        });

        if (!holdResult.success) {
            return {
                success: false,
                errorCode: holdResult.errorCode,
                errorMessage: holdResult.errorMessage,
            };
        }

        // 6. Get departure for pricing
        const { departure } = await this.inventoryService.getDepartureWithInventory(
            dto.departureId,
            dto.tenantId
        );

        // 7. Calculate pricing (simplified - would normally use PricingService)
        const unitPrice = departure.priceOverride ?? 0; // Would get from resource
        const totalAmount = unitPrice * dto.participantCount;

        // 8. Create draft booking
        const booking = Booking.create({
            tenantId: dto.tenantId,
            resourceId: dto.resourceId,
            source: dto.source,
            sourcePlatform: dto.sourcePlatform,
            externalRef: dto.externalRef,
            startDate: departure.departureDate,
            endDate: departure.endDate ?? departure.departureDate,
            guestName: dto.primaryGuest.name,
            guestEmail: dto.primaryGuest.email,
            guestPhone: dto.primaryGuest.phone,
            guestCount: dto.participantCount,
            baseAmount: totalAmount,
            totalAmount,
            notes: dto.notes,
            status: 'pending',
            createdById: dto.createdById,
        });

        const savedBooking = await this.bookingRepository.save(booking);

        // 9. Calculate hold expiry for response
        const holdExpiresAt = new Date(
            Date.now() + (holdType === 'APPROVAL_PENDING' ? 24 * 60 : 15) * 60000
        );

        return {
            success: true,
            bookingId: savedBooking.id,
            holdId: holdResult.holdId,
            holdExpiresAt,
            totalAmount,
        };
    }

    /**
     * Confirm booking after payment - Step 2 of booking flow
     */
    async confirmBooking(
        bookingId: string,
        holdId: string,
        tenantId: string,
        actorId?: string
    ): Promise<{ success: boolean; errorMessage?: string }> {
        // 1. Release the hold
        const holdReleased = await this.holdService.releaseHold(
            holdId,
            'CONFIRMED',
            actorId
        );

        if (!holdReleased) {
            // Hold may have expired - check if we can still book
            // This is a recovery path for edge cases
            console.warn(`Hold ${holdId} already released, attempting direct confirm`);
        }

        // 2. Update booking status
        // Note: In production, this would use the stored procedure for atomicity
        // For now, we do a simple update
        const updated = await this.bookingRepository.updateStatus(
            bookingId,
            'confirmed',
            tenantId
        );

        if (!updated) {
            return {
                success: false,
                errorMessage: 'Failed to confirm booking',
            };
        }

        return { success: true };
    }

    /**
     * Cancel a booking
     */
    async cancelBooking(
        bookingId: string,
        tenantId: string,
        reason: string,
        actorId?: string
    ): Promise<{ success: boolean; errorMessage?: string }> {
        const booking = await this.bookingRepository.findById(bookingId, tenantId);
        if (!booking) {
            return { success: false, errorMessage: 'Booking not found' };
        }

        // Can't cancel already cancelled or completed bookings
        if (['cancelled', 'checked_out'].includes(booking.status)) {
            return { success: false, errorMessage: `Cannot cancel ${booking.status} booking` };
        }

        // Update booking status
        await this.bookingRepository.updateStatus(bookingId, 'cancelled', tenantId);

        // Note: In production, would also:
        // - Release any active holds
        // - Notify waitlist if applicable
        // - Initiate refund if paid
        // - Send cancellation notification

        return { success: true };
    }

    /**
     * Map BookingSource to HoldSource
     */
    private mapToHoldSource(source: BookingSource): HoldSource {
        switch (source) {
            case 'DIRECT':
                return 'WEBSITE';
            case 'OTA':
                return 'OTA';
            case 'MANUAL':
            case 'CSV':
            case 'EMAIL':
                return 'ADMIN';
            default:
                return 'MANUAL';
        }
    }

    /**
     * Create error result helper
     */
    private errorResult(code: string, message: string): BookingInitResult {
        return {
            success: false,
            errorCode: code,
            errorMessage: message,
        };
    }
}
