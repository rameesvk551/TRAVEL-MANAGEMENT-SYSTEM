import { Pool, PoolClient } from 'pg';
import { GearRental, GearRentalStatus, GearRentalType, RentalPricingModel } from '../../../domain/entities/gear/GearRental.js';
import { IGearRentalRepository, GearRentalFilters } from '../../../domain/interfaces/gear/IGearRentalRepository.js';

export class GearRentalRepository implements IGearRentalRepository {
    constructor(private pool: Pool) {}

    async findById(id: string, tenantId: string): Promise<GearRental | null> {
        const result = await this.pool.query(
            `SELECT * FROM gear_rentals WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
        return result.rows[0] ? this.toDomain(result.rows[0]) : null;
    }

    async findByRentalNumber(rentalNumber: string, tenantId: string): Promise<GearRental | null> {
        const result = await this.pool.query(
            `SELECT * FROM gear_rentals WHERE rental_number = $1 AND tenant_id = $2`,
            [rentalNumber, tenantId]
        );
        return result.rows[0] ? this.toDomain(result.rows[0]) : null;
    }

    async findByCustomer(customerId: string, tenantId: string): Promise<GearRental[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_rentals WHERE customer_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
            [customerId, tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findByTrip(tripId: string, tenantId: string): Promise<GearRental[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_rentals WHERE trip_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
            [tripId, tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findActive(tenantId: string): Promise<GearRental[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_rentals WHERE tenant_id = $1 AND status IN ('ACTIVE', 'OVERDUE') ORDER BY start_date ASC`,
            [tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findOverdue(tenantId: string): Promise<GearRental[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_rentals 
             WHERE tenant_id = $1 AND status = 'ACTIVE' AND end_date < CURRENT_DATE 
             ORDER BY end_date ASC`,
            [tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findAll(
        tenantId: string,
        filters?: GearRentalFilters,
        page = 1,
        limit = 50
    ): Promise<{ rentals: GearRental[]; total: number }> {
        let whereClause = 'WHERE tenant_id = $1';
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters?.status) {
            whereClause += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }
        if (filters?.rentalType) {
            whereClause += ` AND rental_type = $${paramIndex++}`;
            params.push(filters.rentalType);
        }
        if (filters?.customerId) {
            whereClause += ` AND customer_id = $${paramIndex++}`;
            params.push(filters.customerId);
        }
        if (filters?.tripId) {
            whereClause += ` AND trip_id = $${paramIndex++}`;
            params.push(filters.tripId);
        }
        if (filters?.startDate) {
            whereClause += ` AND start_date >= $${paramIndex++}`;
            params.push(filters.startDate);
        }
        if (filters?.endDate) {
            whereClause += ` AND end_date <= $${paramIndex++}`;
            params.push(filters.endDate);
        }

        const countResult = await this.pool.query(
            `SELECT COUNT(*) FROM gear_rentals ${whereClause}`,
            params
        );

        const offset = (page - 1) * limit;
        const result = await this.pool.query(
            `SELECT * FROM gear_rentals ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
            [...params, limit, offset]
        );

        return {
            rentals: result.rows.map(row => this.toDomain(row)),
            total: parseInt(countResult.rows[0].count, 10),
        };
    }

    async save(rental: GearRental, client?: PoolClient): Promise<void> {
        const conn = client || this.pool;
        const data = this.toPersistence(rental);

        await conn.query(
            `INSERT INTO gear_rentals (
                id, tenant_id, rental_number, rental_type, pricing_model, status,
                customer_id, customer_name, customer_email, customer_phone,
                customer_id_type, customer_id_number, partner_vendor_id, trip_id, booking_id,
                items, start_date, end_date, actual_return_date, total_days,
                subtotal, discount_amount, discount_reason, tax_amount, total_amount,
                deposit_amount, deposit_paid, deposit_refunded, deposit_forfeited,
                damage_charges, late_return_charges, late_return_days, late_fee_per_day,
                currency, payment_status, payment_method, payment_reference,
                issued_by_user_id, issued_at, received_by_user_id, received_at,
                terms, signature_data, notes, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, $29,
                $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41,
                $42, $43, $44, $45, $46
            )
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                actual_return_date = EXCLUDED.actual_return_date,
                deposit_refunded = EXCLUDED.deposit_refunded,
                deposit_forfeited = EXCLUDED.deposit_forfeited,
                damage_charges = EXCLUDED.damage_charges,
                late_return_charges = EXCLUDED.late_return_charges,
                late_return_days = EXCLUDED.late_return_days,
                payment_status = EXCLUDED.payment_status,
                received_by_user_id = EXCLUDED.received_by_user_id,
                received_at = EXCLUDED.received_at,
                notes = EXCLUDED.notes,
                updated_at = CURRENT_TIMESTAMP`,
            [
                data.id, data.tenant_id, data.rental_number, data.rental_type, data.pricing_model, data.status,
                data.customer_id, data.customer_name, data.customer_email, data.customer_phone,
                data.customer_id_type, data.customer_id_number, data.partner_vendor_id, data.trip_id, data.booking_id,
                JSON.stringify(data.items), data.start_date, data.end_date, data.actual_return_date, data.total_days,
                data.subtotal, data.discount_amount, data.discount_reason, data.tax_amount, data.total_amount,
                data.deposit_amount, data.deposit_paid, data.deposit_refunded, data.deposit_forfeited,
                data.damage_charges, data.late_return_charges, data.late_return_days, data.late_fee_per_day,
                data.currency, data.payment_status, data.payment_method, data.payment_reference,
                data.issued_by_user_id, data.issued_at, data.received_by_user_id, data.received_at,
                data.terms, data.signature_data, data.notes, data.created_at, data.updated_at
            ]
        );
    }

    async generateRentalNumber(tenantId: string): Promise<string> {
        const year = new Date().getFullYear().toString().slice(-2);
        const result = await this.pool.query(
            `SELECT COUNT(*) + 1 as next FROM gear_rentals 
             WHERE tenant_id = $1 AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`,
            [tenantId]
        );
        const seq = String(result.rows[0].next).padStart(5, '0');
        return `GR-${year}-${seq}`;
    }

    async getRevenueByPeriod(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{ total: number; count: number }> {
        const result = await this.pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
             FROM gear_rentals 
             WHERE tenant_id = $1 AND status IN ('RETURNED', 'RETURNED_DAMAGED')
             AND start_date >= $2 AND start_date <= $3`,
            [tenantId, startDate, endDate]
        );
        return {
            total: parseFloat(result.rows[0].total),
            count: parseInt(result.rows[0].count, 10),
        };
    }

    private toDomain(row: Record<string, unknown>): GearRental {
        return GearRental.fromPersistence({
            id: row.id as string,
            tenantId: row.tenant_id as string,
            rentalNumber: row.rental_number as string,
            rentalType: row.rental_type as GearRentalType,
            pricingModel: row.pricing_model as RentalPricingModel,
            status: row.status as GearRentalStatus,
            customerId: row.customer_id as string | undefined,
            customerName: row.customer_name as string,
            customerEmail: row.customer_email as string | undefined,
            customerPhone: row.customer_phone as string | undefined,
            customerIdType: row.customer_id_type as string | undefined,
            customerIdNumber: row.customer_id_number as string | undefined,
            partnerVendorId: row.partner_vendor_id as string | undefined,
            tripId: row.trip_id as string | undefined,
            bookingId: row.booking_id as string | undefined,
            items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items as Record<string, unknown>[],
            startDate: row.start_date as Date,
            endDate: row.end_date as Date,
            actualReturnDate: row.actual_return_date as Date | undefined,
            totalDays: row.total_days as number,
            subtotal: parseFloat(row.subtotal as string),
            discountAmount: parseFloat(row.discount_amount as string),
            discountReason: row.discount_reason as string,
            taxAmount: parseFloat(row.tax_amount as string),
            totalAmount: parseFloat(row.total_amount as string),
            depositAmount: parseFloat(row.deposit_amount as string),
            depositPaid: parseFloat(row.deposit_paid as string),
            depositRefunded: parseFloat(row.deposit_refunded as string),
            depositForfeited: parseFloat(row.deposit_forfeited as string),
            damageCharges: parseFloat(row.damage_charges as string),
            lateReturnCharges: parseFloat(row.late_return_charges as string),
            lateReturnDays: row.late_return_days as number,
            lateFeePerDay: parseFloat(row.late_fee_per_day as string),
            currency: row.currency as string,
            paymentStatus: row.payment_status as string,
            paymentMethod: row.payment_method as string,
            paymentReference: row.payment_reference as string,
            issuedByUserId: row.issued_by_user_id as string | undefined,
            issuedAt: row.issued_at as Date | undefined,
            receivedByUserId: row.received_by_user_id as string | undefined,
            receivedAt: row.received_at as Date | undefined,
            terms: row.terms as string,
            signatureData: row.signature_data as string | undefined,
            notes: row.notes as string,
            createdAt: row.created_at as Date,
            updatedAt: row.updated_at as Date,
        });
    }

    private toPersistence(rental: GearRental): Record<string, unknown> {
        return {
            id: rental.id,
            tenant_id: rental.tenantId,
            rental_number: rental.rentalNumber,
            rental_type: rental.rentalType,
            pricing_model: rental.pricingModel,
            status: rental.status,
            customer_id: rental.customerId,
            customer_name: rental.customerName,
            customer_email: rental.customerEmail,
            customer_phone: rental.customerPhone,
            customer_id_type: rental.customerIdType,
            customer_id_number: rental.customerIdNumber,
            partner_vendor_id: rental.partnerVendorId,
            trip_id: rental.tripId,
            booking_id: rental.bookingId,
            items: rental.items,
            start_date: rental.startDate,
            end_date: rental.endDate,
            actual_return_date: rental.actualReturnDate,
            total_days: rental.totalDays,
            subtotal: rental.subtotal,
            discount_amount: rental.discountAmount,
            discount_reason: rental.discountReason,
            tax_amount: rental.taxAmount,
            total_amount: rental.totalAmount,
            deposit_amount: rental.depositAmount,
            deposit_paid: rental.depositPaid,
            deposit_refunded: rental.depositRefunded,
            deposit_forfeited: rental.depositForfeited,
            damage_charges: rental.damageCharges,
            late_return_charges: rental.lateReturnCharges,
            late_return_days: rental.lateReturnDays,
            late_fee_per_day: rental.lateFeePerDay,
            currency: rental.currency,
            payment_status: rental.paymentStatus,
            payment_method: rental.paymentMethod,
            payment_reference: rental.paymentReference,
            issued_by_user_id: rental.issuedByUserId,
            issued_at: rental.issuedAt,
            received_by_user_id: rental.receivedByUserId,
            received_at: rental.receivedAt,
            terms: rental.terms,
            signature_data: rental.signatureData,
            notes: rental.notes,
            created_at: rental.createdAt,
            updated_at: rental.updatedAt,
        };
    }
}
