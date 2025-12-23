import { query } from '../../database/index.js';
import { GearAssignment, GearAssignmentStatus, GearAssignmentType } from '../../../domain/entities/gear/GearAssignment.js';
import { 
    IGearAssignmentRepository, 
    GearAssignmentFilters 
} from '../../../domain/interfaces/gear/IGearAssignmentRepository.js';

function toEntity(row: Record<string, unknown>): GearAssignment {
    return GearAssignment.fromPersistence({
        id: row.id as string,
        tenantId: row.tenant_id as string,
        tripId: row.trip_id as string,
        bookingId: row.booking_id as string | undefined,
        gearItemId: row.gear_item_id as string,
        assignmentType: row.assignment_type as GearAssignmentType,
        status: row.status as GearAssignmentStatus,
        assignedToUserId: row.assigned_to_user_id as string | undefined,
        assignedToGuestId: row.assigned_to_guest_id as string | undefined,
        assignedToName: row.assigned_to_name as string | undefined,
        assignedByUserId: row.assigned_by_user_id as string | undefined,
        plannedIssueDate: row.planned_issue_date as Date | undefined,
        actualIssueDate: row.actual_issue_date as Date | undefined,
        issuedByUserId: row.issued_by_user_id as string | undefined,
        issueNotes: row.issue_notes as string,
        issueCondition: row.issue_condition as string,
        plannedReturnDate: row.planned_return_date as Date | undefined,
        actualReturnDate: row.actual_return_date as Date | undefined,
        receivedByUserId: row.received_by_user_id as string | undefined,
        returnNotes: row.return_notes as string,
        returnCondition: row.return_condition as string,
        returnConditionScore: row.return_condition_score as number,
        replacedByItemId: row.replaced_by_item_id as string | undefined,
        replacementReason: row.replacement_reason as string,
        damageReportId: row.damage_report_id as string | undefined,
        checklistCompleted: row.checklist_completed as boolean,
        checklistData: row.checklist_data as Record<string, unknown>,
        gpsCoordinates: row.gps_coordinates as string | undefined,
        signatureData: row.signature_data as string | undefined,
        photos: row.photos as string[],
        notes: row.notes as string,
        createdAt: row.created_at as Date,
        updatedAt: row.updated_at as Date,
    });
}

export class GearAssignmentRepository implements IGearAssignmentRepository {
    async findById(id: string, tenantId: string): Promise<GearAssignment | null> {
        const sql = `SELECT * FROM gear_assignments WHERE id = $1 AND tenant_id = $2`;
        const result = await query(sql, [id, tenantId]);
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(
        tenantId: string,
        filters?: GearAssignmentFilters,
        limit = 50,
        offset = 0
    ): Promise<GearAssignment[]> {
        let sql = `SELECT * FROM gear_assignments WHERE tenant_id = $1`;
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters?.tripId) {
            sql += ` AND trip_id = $${paramIndex++}`;
            params.push(filters.tripId);
        }
        if (filters?.bookingId) {
            sql += ` AND booking_id = $${paramIndex++}`;
            params.push(filters.bookingId);
        }
        if (filters?.gearItemId) {
            sql += ` AND gear_item_id = $${paramIndex++}`;
            params.push(filters.gearItemId);
        }
        if (filters?.status) {
            if (Array.isArray(filters.status)) {
                sql += ` AND status = ANY($${paramIndex++})`;
                params.push(filters.status);
            } else {
                sql += ` AND status = $${paramIndex++}`;
                params.push(filters.status);
            }
        }
        if (filters?.pendingReturn) {
            sql += ` AND status IN ('ISSUED', 'IN_USE')`;
        }
        if (filters?.overdue) {
            sql += ` AND status IN ('ISSUED', 'IN_USE') AND planned_return_date < NOW()`;
        }

        sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        return result.rows.map(toEntity);
    }

    async findByTrip(tripId: string, tenantId: string): Promise<GearAssignment[]> {
        const sql = `
            SELECT * FROM gear_assignments 
            WHERE trip_id = $1 AND tenant_id = $2
            ORDER BY assignment_type, assigned_to_name
        `;
        const result = await query(sql, [tripId, tenantId]);
        return result.rows.map(toEntity);
    }

    async findByBooking(bookingId: string, tenantId: string): Promise<GearAssignment[]> {
        const sql = `SELECT * FROM gear_assignments WHERE booking_id = $1 AND tenant_id = $2`;
        const result = await query(sql, [bookingId, tenantId]);
        return result.rows.map(toEntity);
    }

    async findByGearItem(gearItemId: string, tenantId: string): Promise<GearAssignment[]> {
        const sql = `
            SELECT * FROM gear_assignments 
            WHERE gear_item_id = $1 AND tenant_id = $2
            ORDER BY created_at DESC
        `;
        const result = await query(sql, [gearItemId, tenantId]);
        return result.rows.map(toEntity);
    }

    async findActiveByGearItem(gearItemId: string, tenantId: string): Promise<GearAssignment | null> {
        const sql = `
            SELECT * FROM gear_assignments 
            WHERE gear_item_id = $1 AND tenant_id = $2 
            AND status IN ('ISSUED', 'IN_USE')
            LIMIT 1
        `;
        const result = await query(sql, [gearItemId, tenantId]);
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findPendingReturns(tenantId: string): Promise<GearAssignment[]> {
        const sql = `
            SELECT * FROM gear_assignments 
            WHERE tenant_id = $1 AND status IN ('ISSUED', 'IN_USE')
            ORDER BY planned_return_date ASC
        `;
        const result = await query(sql, [tenantId]);
        return result.rows.map(toEntity);
    }

    async findOverdue(tenantId: string): Promise<GearAssignment[]> {
        const sql = `
            SELECT * FROM gear_assignments 
            WHERE tenant_id = $1 
            AND status IN ('ISSUED', 'IN_USE')
            AND planned_return_date < NOW()
            ORDER BY planned_return_date ASC
        `;
        const result = await query(sql, [tenantId]);
        return result.rows.map(toEntity);
    }

    async count(tenantId: string, filters?: GearAssignmentFilters): Promise<number> {
        let sql = `SELECT COUNT(*) FROM gear_assignments WHERE tenant_id = $1`;
        const params: unknown[] = [tenantId];
        
        if (filters?.tripId) {
            sql += ` AND trip_id = $2`;
            params.push(filters.tripId);
        }

        const result = await query(sql, params);
        return parseInt(result.rows[0].count, 10);
    }

    async save(assignment: GearAssignment): Promise<GearAssignment> {
        const sql = `
            INSERT INTO gear_assignments (
                id, tenant_id, trip_id, booking_id, gear_item_id,
                assignment_type, status, assigned_to_user_id, assigned_to_guest_id,
                assigned_to_name, assigned_by_user_id, planned_issue_date,
                actual_issue_date, issued_by_user_id, issue_notes, issue_condition,
                planned_return_date, actual_return_date, received_by_user_id,
                return_notes, return_condition, return_condition_score,
                replaced_by_item_id, replacement_reason, damage_report_id,
                checklist_completed, checklist_data, gps_coordinates,
                signature_data, photos, notes
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
                $27, $28, $29, $30, $31
            )
            RETURNING *
        `;
        const params = [
            assignment.id, assignment.tenantId, assignment.tripId, assignment.bookingId,
            assignment.gearItemId, assignment.assignmentType, assignment.status,
            assignment.assignedToUserId, assignment.assignedToGuestId,
            assignment.assignedToName, assignment.assignedByUserId,
            assignment.plannedIssueDate, assignment.actualIssueDate,
            assignment.issuedByUserId, assignment.issueNotes, assignment.issueCondition,
            assignment.plannedReturnDate, assignment.actualReturnDate,
            assignment.receivedByUserId, assignment.returnNotes, assignment.returnCondition,
            assignment.returnConditionScore, assignment.replacedByItemId,
            assignment.replacementReason, assignment.damageReportId,
            assignment.checklistCompleted, assignment.checklistData,
            assignment.gpsCoordinates, assignment.signatureData,
            assignment.photos, assignment.notes,
        ];
        const result = await query(sql, params);
        return toEntity(result.rows[0]);
    }

    async saveMany(assignments: GearAssignment[]): Promise<GearAssignment[]> {
        const results: GearAssignment[] = [];
        for (const assignment of assignments) {
            results.push(await this.save(assignment));
        }
        return results;
    }

    async update(assignment: GearAssignment): Promise<GearAssignment> {
        const sql = `
            UPDATE gear_assignments SET
                trip_id = $3, booking_id = $4, gear_item_id = $5,
                assignment_type = $6, status = $7, assigned_to_user_id = $8,
                assigned_to_guest_id = $9, assigned_to_name = $10,
                assigned_by_user_id = $11, planned_issue_date = $12,
                actual_issue_date = $13, issued_by_user_id = $14,
                issue_notes = $15, issue_condition = $16, planned_return_date = $17,
                actual_return_date = $18, received_by_user_id = $19,
                return_notes = $20, return_condition = $21, return_condition_score = $22,
                replaced_by_item_id = $23, replacement_reason = $24,
                damage_report_id = $25, checklist_completed = $26,
                checklist_data = $27, gps_coordinates = $28,
                signature_data = $29, photos = $30, notes = $31
            WHERE id = $1 AND tenant_id = $2
            RETURNING *
        `;
        const params = [
            assignment.id, assignment.tenantId, assignment.tripId, assignment.bookingId,
            assignment.gearItemId, assignment.assignmentType, assignment.status,
            assignment.assignedToUserId, assignment.assignedToGuestId,
            assignment.assignedToName, assignment.assignedByUserId,
            assignment.plannedIssueDate, assignment.actualIssueDate,
            assignment.issuedByUserId, assignment.issueNotes, assignment.issueCondition,
            assignment.plannedReturnDate, assignment.actualReturnDate,
            assignment.receivedByUserId, assignment.returnNotes, assignment.returnCondition,
            assignment.returnConditionScore, assignment.replacedByItemId,
            assignment.replacementReason, assignment.damageReportId,
            assignment.checklistCompleted, assignment.checklistData,
            assignment.gpsCoordinates, assignment.signatureData,
            assignment.photos, assignment.notes,
        ];
        const result = await query(sql, params);
        return toEntity(result.rows[0]);
    }

    async updateStatus(id: string, tenantId: string, status: GearAssignmentStatus): Promise<void> {
        const sql = `UPDATE gear_assignments SET status = $3 WHERE id = $1 AND tenant_id = $2`;
        await query(sql, [id, tenantId, status]);
    }

    async issueGear(
        id: string,
        tenantId: string,
        issuedByUserId: string,
        issueNotes?: string,
        issueCondition?: string
    ): Promise<GearAssignment> {
        const sql = `
            UPDATE gear_assignments SET
                status = 'ISSUED',
                actual_issue_date = NOW(),
                issued_by_user_id = $3,
                issue_notes = COALESCE($4, issue_notes),
                issue_condition = COALESCE($5, issue_condition)
            WHERE id = $1 AND tenant_id = $2
            RETURNING *
        `;
        const result = await query(sql, [id, tenantId, issuedByUserId, issueNotes, issueCondition]);
        return toEntity(result.rows[0]);
    }

    async returnGear(
        id: string,
        tenantId: string,
        receivedByUserId: string,
        returnNotes?: string,
        returnCondition?: string,
        returnConditionScore?: number,
        damageReportId?: string
    ): Promise<GearAssignment> {
        const status = damageReportId ? 'DAMAGED' : 'RETURNED';
        const sql = `
            UPDATE gear_assignments SET
                status = $3,
                actual_return_date = NOW(),
                received_by_user_id = $4,
                return_notes = COALESCE($5, return_notes),
                return_condition = COALESCE($6, return_condition),
                return_condition_score = COALESCE($7, return_condition_score),
                damage_report_id = $8
            WHERE id = $1 AND tenant_id = $2
            RETURNING *
        `;
        const result = await query(sql, [
            id, tenantId, status, receivedByUserId,
            returnNotes, returnCondition, returnConditionScore, damageReportId,
        ]);
        return toEntity(result.rows[0]);
    }
}
