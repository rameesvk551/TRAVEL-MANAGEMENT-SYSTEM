import { query } from '../../database/index.js';
import { VendorAssignment, AssignmentStatus } from '../../../domain/entities/vendor/index.js';
import { IVendorAssignmentRepository, AssignmentFilters } from '../../../domain/interfaces/vendor/index.js';

interface AssignmentRow {
    id: string;
    tenant_id: string;
    vendor_id: string;
    booking_id: string | null;
    resource_id: string | null;
    departure_id: string | null;
    assignment_type: string | null;
    service_description: string | null;
    service_start_date: Date;
    service_end_date: Date;
    rate_id: string | null;
    rate_snapshot: Record<string, unknown>;
    quantity: number;
    unit_type: string | null;
    gross_amount: string;
    discount_amount: string;
    net_amount: string;
    currency: string;
    status: AssignmentStatus;
    accepted_at: Date | null;
    completed_at: Date | null;
    cancelled_at: Date | null;
    cancellation_reason: string | null;
    replaced_by_id: string | null;
    replaces_id: string | null;
    fulfilment_percentage: string;
    fulfilment_notes: string | null;
    customer_rating: string | null;
    customer_feedback: string | null;
    internal_notes: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: AssignmentRow): VendorAssignment {
    return VendorAssignment.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        vendorId: row.vendor_id,
        bookingId: row.booking_id ?? undefined,
        resourceId: row.resource_id ?? undefined,
        departureId: row.departure_id ?? undefined,
        assignmentType: row.assignment_type ?? undefined,
        serviceDescription: row.service_description ?? undefined,
        serviceStartDate: row.service_start_date,
        serviceEndDate: row.service_end_date,
        rateId: row.rate_id ?? undefined,
        rateSnapshot: row.rate_snapshot as VendorAssignment['rateSnapshot'],
        quantity: row.quantity,
        unitType: row.unit_type ?? undefined,
        grossAmount: parseFloat(row.gross_amount),
        discountAmount: parseFloat(row.discount_amount),
        netAmount: parseFloat(row.net_amount),
        currency: row.currency,
        status: row.status,
        acceptedAt: row.accepted_at ?? undefined,
        completedAt: row.completed_at ?? undefined,
        cancelledAt: row.cancelled_at ?? undefined,
        cancellationReason: row.cancellation_reason ?? undefined,
        replacedById: row.replaced_by_id ?? undefined,
        replacesId: row.replaces_id ?? undefined,
        fulfilmentPercentage: parseFloat(row.fulfilment_percentage),
        fulfilmentNotes: row.fulfilment_notes ?? undefined,
        customerRating: row.customer_rating ? parseFloat(row.customer_rating) : undefined,
        customerFeedback: row.customer_feedback ?? undefined,
        internalNotes: row.internal_notes ?? undefined,
        createdBy: row.created_by ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

function buildWhereClause(tenantId: string, filters?: AssignmentFilters): { clause: string; params: unknown[] } {
    const conditions = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let idx = 2;

    if (filters?.vendorId) { conditions.push(`vendor_id = $${idx++}`); params.push(filters.vendorId); }
    if (filters?.bookingId) { conditions.push(`booking_id = $${idx++}`); params.push(filters.bookingId); }
    if (filters?.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
    if (filters?.serviceDateFrom) { conditions.push(`service_start_date >= $${idx++}`); params.push(filters.serviceDateFrom); }
    if (filters?.serviceDateTo) { conditions.push(`service_end_date <= $${idx++}`); params.push(filters.serviceDateTo); }

    return { clause: conditions.join(' AND '), params };
}

export class VendorAssignmentRepository implements IVendorAssignmentRepository {
    async findById(id: string, tenantId: string): Promise<VendorAssignment | null> {
        const result = await query<AssignmentRow>('SELECT * FROM vendor_assignments WHERE id=$1 AND tenant_id=$2', [id, tenantId]);
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByVendor(vendorId: string, tenantId: string): Promise<VendorAssignment[]> {
        const result = await query<AssignmentRow>(
            'SELECT * FROM vendor_assignments WHERE vendor_id=$1 AND tenant_id=$2 ORDER BY service_start_date DESC',
            [vendorId, tenantId]
        );
        return result.rows.map(toEntity);
    }

    async findByBooking(bookingId: string, tenantId: string): Promise<VendorAssignment[]> {
        const result = await query<AssignmentRow>(
            'SELECT * FROM vendor_assignments WHERE booking_id=$1 AND tenant_id=$2',
            [bookingId, tenantId]
        );
        return result.rows.map(toEntity);
    }

    async findByDeparture(departureId: string, tenantId: string): Promise<VendorAssignment[]> {
        const result = await query<AssignmentRow>(
            'SELECT * FROM vendor_assignments WHERE departure_id=$1 AND tenant_id=$2',
            [departureId, tenantId]
        );
        return result.rows.map(toEntity);
    }

    async findAll(tenantId: string, filters?: AssignmentFilters, limit = 20, offset = 0): Promise<VendorAssignment[]> {
        const { clause, params } = buildWhereClause(tenantId, filters);
        const sql = `SELECT * FROM vendor_assignments WHERE ${clause} ORDER BY service_start_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const result = await query<AssignmentRow>(sql, [...params, limit, offset]);
        return result.rows.map(toEntity);
    }

    async count(tenantId: string, filters?: AssignmentFilters): Promise<number> {
        const { clause, params } = buildWhereClause(tenantId, filters);
        const result = await query<{ count: string }>(`SELECT COUNT(*) as count FROM vendor_assignments WHERE ${clause}`, params);
        return parseInt(result.rows[0].count, 10);
    }

    async save(assignment: VendorAssignment): Promise<VendorAssignment> {
        const sql = `INSERT INTO vendor_assignments (
            id, tenant_id, vendor_id, booking_id, resource_id, departure_id, assignment_type,
            service_description, service_start_date, service_end_date, rate_id, rate_snapshot,
            quantity, unit_type, gross_amount, discount_amount, net_amount, currency, status,
            replaces_id, internal_notes, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`;
        const result = await query<AssignmentRow>(sql, [
            assignment.id, assignment.tenantId, assignment.vendorId, assignment.bookingId, assignment.resourceId,
            assignment.departureId, assignment.assignmentType, assignment.serviceDescription,
            assignment.serviceStartDate, assignment.serviceEndDate, assignment.rateId,
            JSON.stringify(assignment.rateSnapshot), assignment.quantity, assignment.unitType,
            assignment.grossAmount, assignment.discountAmount, assignment.netAmount, assignment.currency,
            assignment.status, assignment.replacesId, assignment.internalNotes, assignment.createdBy
        ]);
        return toEntity(result.rows[0]);
    }

    async update(assignment: VendorAssignment): Promise<VendorAssignment> {
        const sql = `UPDATE vendor_assignments SET
            service_description=$2, service_start_date=$3, service_end_date=$4,
            quantity=$5, gross_amount=$6, discount_amount=$7, net_amount=$8,
            fulfilment_percentage=$9, fulfilment_notes=$10, customer_rating=$11,
            customer_feedback=$12, internal_notes=$13
        WHERE id=$1 AND tenant_id=$14 RETURNING *`;
        const result = await query<AssignmentRow>(sql, [
            assignment.id, assignment.serviceDescription, assignment.serviceStartDate, assignment.serviceEndDate,
            assignment.quantity, assignment.grossAmount, assignment.discountAmount, assignment.netAmount,
            assignment.fulfilmentPercentage, assignment.fulfilmentNotes, assignment.customerRating,
            assignment.customerFeedback, assignment.internalNotes, assignment.tenantId
        ]);
        return toEntity(result.rows[0]);
    }

    async updateStatus(id: string, tenantId: string, status: AssignmentStatus): Promise<void> {
        const updates: Record<string, unknown> = { status };
        if (status === 'ACCEPTED') updates.accepted_at = new Date();
        if (status === 'COMPLETED') updates.completed_at = new Date();
        if (status === 'CANCELLED') updates.cancelled_at = new Date();

        await query(
            `UPDATE vendor_assignments SET status=$1, accepted_at=COALESCE($2, accepted_at), 
             completed_at=COALESCE($3, completed_at), cancelled_at=COALESCE($4, cancelled_at) 
             WHERE id=$5 AND tenant_id=$6`,
            [status, updates.accepted_at, updates.completed_at, updates.cancelled_at, id, tenantId]
        );
    }

    async findUpcoming(tenantId: string, daysAhead: number): Promise<VendorAssignment[]> {
        const result = await query<AssignmentRow>(
            `SELECT * FROM vendor_assignments WHERE tenant_id=$1 
             AND service_start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2 
             AND status NOT IN ('COMPLETED','CANCELLED') ORDER BY service_start_date`,
            [tenantId, daysAhead]
        );
        return result.rows.map(toEntity);
    }

    async findPendingByVendor(vendorId: string, tenantId: string): Promise<VendorAssignment[]> {
        const result = await query<AssignmentRow>(
            `SELECT * FROM vendor_assignments WHERE vendor_id=$1 AND tenant_id=$2 
             AND status IN ('REQUESTED','ASSIGNED','ACCEPTED','IN_PROGRESS') ORDER BY service_start_date`,
            [vendorId, tenantId]
        );
        return result.rows.map(toEntity);
    }
}
