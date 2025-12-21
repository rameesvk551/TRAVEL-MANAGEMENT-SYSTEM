import { query, getClient } from '../database/index.js';
import { Payment, PaymentStatus } from '../../domain/entities/Payment.js';
import {
    IPaymentRepository,
    BookingPaymentSummary,
} from '../../domain/interfaces/IPaymentRepository.js';

/**
 * PostgreSQL implementation of IPaymentRepository
 */
export class PaymentRepository implements IPaymentRepository {
    /**
     * Find payment by ID
     */
    async findById(id: string, tenantId: string): Promise<Payment | null> {
        const result = await query(
            `SELECT * FROM payments WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }

    /**
     * Find payments for a booking
     */
    async findByBooking(bookingId: string, tenantId: string): Promise<Payment[]> {
        const result = await query(
            `SELECT * FROM payments 
             WHERE booking_id = $1 AND tenant_id = $2 
             ORDER BY created_at DESC`,
            [bookingId, tenantId]
        );
        return result.rows.map((row: Record<string, unknown>) => this.mapToEntity(row));
    }

    /**
     * Find payment by gateway reference
     */
    async findByGatewayRef(
        gateway: string,
        gatewayPaymentId: string
    ): Promise<Payment | null> {
        const result = await query(
            `SELECT * FROM payments 
             WHERE gateway = $1 AND gateway_payment_id = $2`,
            [gateway, gatewayPaymentId]
        );
        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }

    /**
     * Get payment summary for a booking
     */
    async getBookingPaymentSummary(bookingId: string): Promise<BookingPaymentSummary | null> {
        const result = await query(
            `SELECT 
                booking_id,
                COUNT(*) as payment_count,
                SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as amount_paid,
                MAX(CASE WHEN status = 'COMPLETED' THEN completed_at END) as last_payment_date,
                bool_or(status = 'FAILED') as has_failed_payments
             FROM payments 
             WHERE booking_id = $1
             GROUP BY booking_id`,
            [bookingId]
        );

        if (!result.rows[0]) return null;

        // Get booking total for calculation
        const bookingResult = await query(
            `SELECT total_amount FROM bookings WHERE id = $1`,
            [bookingId]
        );
        const totalAmount = bookingResult.rows[0]?.total_amount || 0;
        const amountPaid = parseFloat(result.rows[0].amount_paid) || 0;

        return {
            bookingId,
            totalAmount,
            amountPaid,
            amountDue: totalAmount - amountPaid,
            paymentCount: parseInt(result.rows[0].payment_count),
            lastPaymentDate: result.rows[0].last_payment_date,
            hasFailedPayments: result.rows[0].has_failed_payments,
        };
    }

    /**
     * Save a payment
     */
    async save(payment: Payment): Promise<Payment> {
        const result = await query(
            `INSERT INTO payments (
                id, tenant_id, booking_id, payment_type, method, amount,
                currency, status, gateway, gateway_payment_id, gateway_order_id,
                gateway_response, payment_link_id, payment_link_url, link_expires_at,
                link_sent_at, received_by_id, receipt_number, refund_amount,
                refund_reason, refunded_at, notes, created_at, completed_at, failed_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
            )
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                gateway_response = EXCLUDED.gateway_response,
                completed_at = EXCLUDED.completed_at,
                failed_at = EXCLUDED.failed_at,
                refund_amount = EXCLUDED.refund_amount,
                refund_reason = EXCLUDED.refund_reason,
                refunded_at = EXCLUDED.refunded_at
            RETURNING *`,
            [
                payment.id, payment.tenantId, payment.bookingId, payment.paymentType,
                payment.method, payment.amount, payment.currency, payment.status,
                payment.gateway, payment.gatewayPaymentId, payment.gatewayOrderId,
                JSON.stringify(payment.gatewayResponse), payment.paymentLinkId,
                payment.paymentLinkUrl, payment.linkExpiresAt, payment.linkSentAt,
                payment.receivedById, payment.receiptNumber, payment.refundAmount,
                payment.refundReason, payment.refundedAt, payment.notes,
                payment.createdAt, payment.completedAt, payment.failedAt
            ]
        );
        return this.mapToEntity(result.rows[0]);
    }

    /**
     * Update payment status
     */
    async updateStatus(
        id: string,
        status: PaymentStatus,
        tenantId: string,
        gatewayResponse?: Record<string, unknown>
    ): Promise<boolean> {
        const result = await query(
            `UPDATE payments SET 
                status = $1,
                gateway_response = COALESCE($4, gateway_response)
             WHERE id = $2 AND tenant_id = $3`,
            [status, id, tenantId, gatewayResponse ? JSON.stringify(gatewayResponse) : null]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Mark payment as completed
     */
    async markCompleted(
        id: string,
        tenantId: string,
        gatewayResponse?: Record<string, unknown>
    ): Promise<boolean> {
        const result = await query(
            `UPDATE payments SET 
                status = 'COMPLETED',
                completed_at = NOW(),
                gateway_response = COALESCE($3, gateway_response)
             WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId, gatewayResponse ? JSON.stringify(gatewayResponse) : null]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Mark payment as failed
     */
    async markFailed(
        id: string,
        tenantId: string,
        errorResponse?: Record<string, unknown>
    ): Promise<boolean> {
        const result = await query(
            `UPDATE payments SET 
                status = 'FAILED',
                failed_at = NOW(),
                gateway_response = COALESCE($3, gateway_response)
             WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId, errorResponse ? JSON.stringify(errorResponse) : null]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Record refund
     */
    async recordRefund(
        id: string,
        tenantId: string,
        refundAmount: number,
        reason: string
    ): Promise<boolean> {
        const result = await query(
            `UPDATE payments SET 
                status = CASE 
                    WHEN $3 >= amount THEN 'REFUNDED' 
                    ELSE 'PARTIALLY_REFUNDED' 
                END,
                refund_amount = $3,
                refund_reason = $4,
                refunded_at = NOW()
             WHERE id = $1 AND tenant_id = $2 AND status = 'COMPLETED'`,
            [id, tenantId, refundAmount, reason]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Find expired payment links
     */
    async findExpiredPaymentLinks(): Promise<Payment[]> {
        const result = await query(
            `SELECT * FROM payments 
             WHERE status = 'PENDING' 
             AND payment_link_url IS NOT NULL 
             AND link_expires_at < NOW()`,
            []
        );
        return result.rows.map(row => this.mapToEntity(row));
    }

    /**
     * Map database row to Payment entity
     */
    private mapToEntity(row: Record<string, unknown>): Payment {
        return Payment.fromPersistence({
            id: row.id as string,
            tenantId: row.tenant_id as string,
            bookingId: row.booking_id as string,
            paymentType: row.payment_type as 'FULL' | 'DEPOSIT' | 'PARTIAL' | 'BALANCE',
            method: row.method as Payment['method'],
            amount: parseFloat(row.amount as string),
            currency: row.currency as string,
            status: row.status as PaymentStatus,
            gateway: row.gateway as Payment['gateway'],
            gatewayPaymentId: row.gateway_payment_id as string | undefined,
            gatewayOrderId: row.gateway_order_id as string | undefined,
            gatewayResponse: (row.gateway_response as Record<string, unknown>) || {},
            paymentLinkId: row.payment_link_id as string | undefined,
            paymentLinkUrl: row.payment_link_url as string | undefined,
            linkExpiresAt: row.link_expires_at ? new Date(row.link_expires_at as string) : undefined,
            linkSentAt: row.link_sent_at ? new Date(row.link_sent_at as string) : undefined,
            receivedById: row.received_by_id as string | undefined,
            receiptNumber: row.receipt_number as string | undefined,
            refundAmount: parseFloat(row.refund_amount as string) || 0,
            refundReason: row.refund_reason as string | undefined,
            refundedAt: row.refunded_at ? new Date(row.refunded_at as string) : undefined,
            notes: row.notes as string | undefined,
            createdAt: new Date(row.created_at as string),
            completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
            failedAt: row.failed_at ? new Date(row.failed_at as string) : undefined,
        });
    }
}
