import { Payment, PaymentStatus } from '../entities/Payment.js';

/**
 * Payment summary for a booking
 */
export interface BookingPaymentSummary {
    bookingId: string;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
    paymentCount: number;
    lastPaymentDate?: Date;
    hasFailedPayments: boolean;
}

/**
 * Payment link creation params
 */
export interface CreatePaymentLinkParams {
    tenantId: string;
    bookingId: string;
    amount: number;
    currency: string;
    expiryHours: number;
    description?: string;
    customerEmail?: string;
    customerPhone?: string;
}

/**
 * Payment link result
 */
export interface PaymentLinkResult {
    success: boolean;
    paymentId?: string;
    linkUrl?: string;
    linkId?: string;
    expiresAt?: Date;
    errorCode?: string;
    errorMessage?: string;
}

/**
 * IPaymentRepository - Data access for payments
 */
export interface IPaymentRepository {
    /**
     * Find payment by ID
     */
    findById(id: string, tenantId: string): Promise<Payment | null>;

    /**
     * Find payments for a booking
     */
    findByBooking(bookingId: string, tenantId: string): Promise<Payment[]>;

    /**
     * Find payment by gateway reference
     */
    findByGatewayRef(
        gateway: string,
        gatewayPaymentId: string
    ): Promise<Payment | null>;

    /**
     * Get payment summary for a booking
     */
    getBookingPaymentSummary(bookingId: string): Promise<BookingPaymentSummary | null>;

    /**
     * Save a payment
     */
    save(payment: Payment): Promise<Payment>;

    /**
     * Update payment status
     */
    updateStatus(
        id: string,
        status: PaymentStatus,
        tenantId: string,
        gatewayResponse?: Record<string, unknown>
    ): Promise<boolean>;

    /**
     * Mark payment as completed
     */
    markCompleted(
        id: string,
        tenantId: string,
        gatewayResponse?: Record<string, unknown>
    ): Promise<boolean>;

    /**
     * Mark payment as failed
     */
    markFailed(
        id: string,
        tenantId: string,
        errorResponse?: Record<string, unknown>
    ): Promise<boolean>;

    /**
     * Record refund
     */
    recordRefund(
        id: string,
        tenantId: string,
        refundAmount: number,
        reason: string
    ): Promise<boolean>;

    /**
     * Find pending payment links that need expiry processing
     */
    findExpiredPaymentLinks(): Promise<Payment[]>;
}
