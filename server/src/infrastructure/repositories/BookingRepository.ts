import { query } from '../database/index.js';
import { Booking, BookingStatus, BookingSource } from '../../domain/entities/Booking.js';
import { IBookingRepository, BookingFilters } from '../../domain/interfaces/IBookingRepository.js';

interface BookingRow {
    [key: string]: unknown;
    id: string;
    tenant_id: string;
    resource_id: string;
    lead_id?: string;
    created_by_id?: string;
    source: BookingSource;
    source_platform?: string;
    external_ref?: string;
    start_date: Date;
    end_date: Date;
    status: BookingStatus;
    guest_name: string;
    guest_email?: string;
    guest_phone?: string;
    guest_count: number;
    base_amount: string;
    tax_amount: string;
    total_amount: string;
    currency: string;
    notes?: string;
    metadata: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: BookingRow): Booking {
    return Booking.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        resourceId: row.resource_id,
        leadId: row.lead_id,
        createdById: row.created_by_id,
        source: row.source,
        sourcePlatform: row.source_platform,
        externalRef: row.external_ref,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        guestName: row.guest_name,
        guestEmail: row.guest_email,
        guestPhone: row.guest_phone,
        guestCount: row.guest_count,
        baseAmount: parseFloat(row.base_amount),
        taxAmount: parseFloat(row.tax_amount),
        totalAmount: parseFloat(row.total_amount),
        currency: row.currency,
        notes: row.notes,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

export class BookingRepository implements IBookingRepository {
    async save(booking: Booking): Promise<Booking> {
        const sql = `
      INSERT INTO bookings (
        id, tenant_id, resource_id, lead_id, created_by_id,
        source, source_platform, external_ref,
        start_date, end_date, status,
        guest_name, guest_email, guest_phone, guest_count,
        base_amount, tax_amount, total_amount, currency,
        notes, metadata
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21
      )
      ON CONFLICT (id) DO UPDATE SET
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        status = EXCLUDED.status,
        guest_name = EXCLUDED.guest_name,
        guest_email = EXCLUDED.guest_email,
        guest_phone = EXCLUDED.guest_phone,
        guest_count = EXCLUDED.guest_count,
        base_amount = EXCLUDED.base_amount,
        tax_amount = EXCLUDED.tax_amount,
        total_amount = EXCLUDED.total_amount,
        notes = EXCLUDED.notes,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING *
    `;

        const params = [
            booking.id, booking.tenantId, booking.resourceId, booking.leadId, booking.createdById,
            booking.source, booking.sourcePlatform, booking.externalRef,
            booking.startDate, booking.endDate, booking.status,
            booking.guestName, booking.guestEmail, booking.guestPhone, booking.guestCount,
            booking.baseAmount, booking.taxAmount, booking.totalAmount, booking.currency,
            booking.notes, booking.metadata,
        ];

        const result = await query<BookingRow>(sql, params);
        return toEntity(result.rows[0]);
    }

    async findById(id: string, tenantId: string): Promise<Booking | null> {
        const result = await query<BookingRow>(
            'SELECT * FROM bookings WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(tenantId: string, filters: BookingFilters): Promise<{ bookings: Booking[]; total: number }> {
        let sql = 'SELECT * FROM bookings WHERE tenant_id = $1';
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters.resourceId) {
            sql += ` AND resource_id = $${paramIndex++}`;
            params.push(filters.resourceId);
        }

        if (filters.status) {
            sql += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }

        if (filters.startDate && filters.endDate) {
            sql += ` AND (start_date, end_date) OVERLAPS ($${paramIndex++}, $${paramIndex++})`;
            params.push(filters.startDate, filters.endDate);
        }

        // Get total count first
        const countResult = await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM (${sql}) as filtered_bookings`,
            params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        // Add pagination
        const limit = filters.limit || 20;
        const offset = filters.offset || 0;

        sql += ` ORDER BY start_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await query<BookingRow>(sql, params);

        return {
            bookings: result.rows.map(toEntity),
            total,
        };
    }

    async count(tenantId: string, filters?: BookingFilters): Promise<number> {
        const { total } = await this.findAll(tenantId, { ...filters, limit: 1, offset: 0 });
        return total;
    }

    // Not part of IBookingRepository but useful method
    async countOverlapping(resourceId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<number> {
        let sql = `
      SELECT COUNT(*) as count FROM bookings 
      WHERE resource_id = $1 
      AND status NOT IN ('cancelled', 'no_show')
      AND (start_date, end_date) OVERLAPS ($2, $3)
    `;
        const params: unknown[] = [resourceId, startDate, endDate];

        if (excludeId) {
            sql += ` AND id != $4`;
            params.push(excludeId);
        }

        const { rows } = await query<{ count: string }>(sql, params);
        return parseInt(rows[0].count, 10);
    }

    async update(booking: Booking): Promise<Booking> {
        return this.save(booking);
    }

    async findByExternalRef(sourcePlatform: string, externalRef: string, tenantId: string): Promise<Booking | null> {
        const result = await query<BookingRow>(
            'SELECT * FROM bookings WHERE source_platform = $1 AND external_ref = $2 AND tenant_id = $3',
            [sourcePlatform, externalRef, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await query(
            "UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND tenant_id = $2",
            [id, tenantId]
        );
    }

    async updateStatus(id: string, status: BookingStatus, tenantId: string): Promise<Booking | null> {
        const result = await query<BookingRow>(
            `UPDATE bookings 
             SET status = $1, updated_at = NOW() 
             WHERE id = $2 AND tenant_id = $3
             RETURNING *`,
            [status, id, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }
}
