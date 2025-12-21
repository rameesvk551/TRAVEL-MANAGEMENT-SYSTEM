import { generateId } from '../../shared/utils/index.js';

/**
 * Payment types
 */
export type PaymentType = 'FULL' | 'DEPOSIT' | 'PARTIAL' | 'BALANCE';

/**
 * Payment methods
 */
export type PaymentMethod = 
    | 'CARD' 
    | 'UPI' 
    | 'BANK_TRANSFER' 
    | 'CASH' 
    | 'CHEQUE' 
    | 'OTA_COLLECT';

/**
 * Payment status
 */
export type PaymentStatus = 
    | 'PENDING' 
    | 'PROCESSING' 
    | 'COMPLETED' 
    | 'FAILED' 
    | 'REFUNDED' 
    | 'PARTIALLY_REFUNDED';

/**
 * Payment gateway providers
 */
export type PaymentGateway = 'razorpay' | 'stripe' | 'paypal' | 'manual';

export interface PaymentProps {
    id?: string;
    tenantId: string;
    bookingId: string;
    paymentType: PaymentType;
    method: PaymentMethod;
    amount: number;
    currency?: string;
    status?: PaymentStatus;
    gateway?: PaymentGateway;
    gatewayPaymentId?: string;
    gatewayOrderId?: string;
    gatewayResponse?: Record<string, unknown>;
    paymentLinkId?: string;
    paymentLinkUrl?: string;
    linkExpiresAt?: Date;
    linkSentAt?: Date;
    receivedById?: string;
    receiptNumber?: string;
    refundAmount?: number;
    refundReason?: string;
    refundedAt?: Date;
    notes?: string;
    createdAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
}

/**
 * Payment - Flexible payment tracking with support for partial payments.
 * 
 * Supports:
 * - Full payments, deposits, partial payments, balance payments
 * - Multiple payment methods (card, UPI, bank transfer, cash)
 * - Payment gateway integration (Razorpay, Stripe)
 * - Payment links for async payments (WhatsApp/Email)
 * - Manual payment recording for offline payments
 * - Refund tracking
 */
export class Payment {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly bookingId: string;
    public readonly paymentType: PaymentType;
    public readonly method: PaymentMethod;
    public readonly amount: number;
    public readonly currency: string;
    public readonly status: PaymentStatus;
    public readonly gateway?: PaymentGateway;
    public readonly gatewayPaymentId?: string;
    public readonly gatewayOrderId?: string;
    public readonly gatewayResponse: Record<string, unknown>;
    public readonly paymentLinkId?: string;
    public readonly paymentLinkUrl?: string;
    public readonly linkExpiresAt?: Date;
    public readonly linkSentAt?: Date;
    public readonly receivedById?: string;
    public readonly receiptNumber?: string;
    public readonly refundAmount: number;
    public readonly refundReason?: string;
    public readonly refundedAt?: Date;
    public readonly notes?: string;
    public readonly createdAt: Date;
    public readonly completedAt?: Date;
    public readonly failedAt?: Date;

    private constructor(props: Required<Omit<PaymentProps,
        'gateway' | 'gatewayPaymentId' | 'gatewayOrderId' | 'paymentLinkId' | 'paymentLinkUrl' | 
        'linkExpiresAt' | 'linkSentAt' | 'receivedById' | 'receiptNumber' | 'refundReason' | 
        'refundedAt' | 'notes' | 'completedAt' | 'failedAt'>> &
        Pick<PaymentProps, 'gateway' | 'gatewayPaymentId' | 'gatewayOrderId' | 'paymentLinkId' | 
        'paymentLinkUrl' | 'linkExpiresAt' | 'linkSentAt' | 'receivedById' | 'receiptNumber' | 
        'refundReason' | 'refundedAt' | 'notes' | 'completedAt' | 'failedAt'>
    ) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.bookingId = props.bookingId;
        this.paymentType = props.paymentType;
        this.method = props.method;
        this.amount = props.amount;
        this.currency = props.currency;
        this.status = props.status;
        this.gateway = props.gateway;
        this.gatewayPaymentId = props.gatewayPaymentId;
        this.gatewayOrderId = props.gatewayOrderId;
        this.gatewayResponse = props.gatewayResponse;
        this.paymentLinkId = props.paymentLinkId;
        this.paymentLinkUrl = props.paymentLinkUrl;
        this.linkExpiresAt = props.linkExpiresAt;
        this.linkSentAt = props.linkSentAt;
        this.receivedById = props.receivedById;
        this.receiptNumber = props.receiptNumber;
        this.refundAmount = props.refundAmount;
        this.refundReason = props.refundReason;
        this.refundedAt = props.refundedAt;
        this.notes = props.notes;
        this.createdAt = props.createdAt;
        this.completedAt = props.completedAt;
        this.failedAt = props.failedAt;
    }

    /**
     * Check if payment is successful
     */
    get isSuccessful(): boolean {
        return this.status === 'COMPLETED';
    }

    /**
     * Check if payment is pending
     */
    get isPending(): boolean {
        return ['PENDING', 'PROCESSING'].includes(this.status);
    }

    /**
     * Check if payment link is still valid
     */
    get isLinkValid(): boolean {
        if (!this.paymentLinkUrl || !this.linkExpiresAt) return false;
        return this.linkExpiresAt > new Date();
    }

    /**
     * Calculate net amount after refunds
     */
    get netAmount(): number {
        return this.amount - this.refundAmount;
    }

    static create(props: PaymentProps): Payment {
        const now = new Date();
        return new Payment({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            bookingId: props.bookingId,
            paymentType: props.paymentType,
            method: props.method,
            amount: props.amount,
            currency: props.currency ?? 'INR',
            status: props.status ?? 'PENDING',
            gateway: props.gateway,
            gatewayPaymentId: props.gatewayPaymentId,
            gatewayOrderId: props.gatewayOrderId,
            gatewayResponse: props.gatewayResponse ?? {},
            paymentLinkId: props.paymentLinkId,
            paymentLinkUrl: props.paymentLinkUrl,
            linkExpiresAt: props.linkExpiresAt,
            linkSentAt: props.linkSentAt,
            receivedById: props.receivedById,
            receiptNumber: props.receiptNumber,
            refundAmount: props.refundAmount ?? 0,
            refundReason: props.refundReason,
            refundedAt: props.refundedAt,
            notes: props.notes,
            createdAt: props.createdAt ?? now,
            completedAt: props.completedAt,
            failedAt: props.failedAt,
        });
    }

    static fromPersistence(data: Required<Omit<PaymentProps,
        'gateway' | 'gatewayPaymentId' | 'gatewayOrderId' | 'paymentLinkId' | 'paymentLinkUrl' |
        'linkExpiresAt' | 'linkSentAt' | 'receivedById' | 'receiptNumber' | 'refundReason' |
        'refundedAt' | 'notes' | 'completedAt' | 'failedAt'>> &
        Pick<PaymentProps, 'gateway' | 'gatewayPaymentId' | 'gatewayOrderId' | 'paymentLinkId' |
        'paymentLinkUrl' | 'linkExpiresAt' | 'linkSentAt' | 'receivedById' | 'receiptNumber' |
        'refundReason' | 'refundedAt' | 'notes' | 'completedAt' | 'failedAt'>
    ): Payment {
        return new Payment(data);
    }
}
