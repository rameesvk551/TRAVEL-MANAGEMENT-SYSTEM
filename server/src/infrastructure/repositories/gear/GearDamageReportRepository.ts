import { Pool, PoolClient } from 'pg';
import { GearDamageReport, DamageSeverity, DamageResponsibility, DamageReportStatus } from '../../../domain/entities/gear/GearDamageReport.js';
import { IGearDamageReportRepository, GearDamageReportFilters } from '../../../domain/interfaces/gear/IGearDamageReportRepository.js';

export class GearDamageReportRepository implements IGearDamageReportRepository {
    constructor(private pool: Pool) {}

    async findById(id: string, tenantId: string): Promise<GearDamageReport | null> {
        const result = await this.pool.query(
            `SELECT * FROM gear_damage_reports WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
        return result.rows[0] ? this.toDomain(result.rows[0]) : null;
    }

    async findByGearItem(gearItemId: string, tenantId: string): Promise<GearDamageReport[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_damage_reports WHERE gear_item_id = $1 AND tenant_id = $2 ORDER BY reported_at DESC`,
            [gearItemId, tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findByTrip(tripId: string, tenantId: string): Promise<GearDamageReport[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_damage_reports WHERE trip_id = $1 AND tenant_id = $2 ORDER BY reported_at DESC`,
            [tripId, tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findPending(tenantId: string): Promise<GearDamageReport[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_damage_reports 
             WHERE tenant_id = $1 AND status IN ('REPORTED', 'UNDER_REVIEW', 'ASSESSED')
             ORDER BY severity DESC, reported_at ASC`,
            [tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findAll(
        tenantId: string,
        filters?: GearDamageReportFilters,
        page = 1,
        limit = 50
    ): Promise<{ reports: GearDamageReport[]; total: number }> {
        let whereClause = 'WHERE tenant_id = $1';
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters?.severity) {
            whereClause += ` AND severity = $${paramIndex++}`;
            params.push(filters.severity);
        }
        if (filters?.responsibility) {
            whereClause += ` AND responsibility = $${paramIndex++}`;
            params.push(filters.responsibility);
        }
        if (filters?.status) {
            whereClause += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }
        if (filters?.gearItemId) {
            whereClause += ` AND gear_item_id = $${paramIndex++}`;
            params.push(filters.gearItemId);
        }
        if (filters?.tripId) {
            whereClause += ` AND trip_id = $${paramIndex++}`;
            params.push(filters.tripId);
        }
        if (filters?.reportedAfter) {
            whereClause += ` AND reported_at >= $${paramIndex++}`;
            params.push(filters.reportedAfter);
        }
        if (filters?.reportedBefore) {
            whereClause += ` AND reported_at <= $${paramIndex++}`;
            params.push(filters.reportedBefore);
        }

        const countResult = await this.pool.query(
            `SELECT COUNT(*) FROM gear_damage_reports ${whereClause}`,
            params
        );

        const offset = (page - 1) * limit;
        const result = await this.pool.query(
            `SELECT * FROM gear_damage_reports ${whereClause} ORDER BY reported_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
            [...params, limit, offset]
        );

        return {
            reports: result.rows.map(row => this.toDomain(row)),
            total: parseInt(countResult.rows[0].count, 10),
        };
    }

    async save(report: GearDamageReport, client?: PoolClient): Promise<void> {
        const conn = client || this.pool;
        const data = this.toPersistence(report);

        await conn.query(
            `INSERT INTO gear_damage_reports (
                id, tenant_id, gear_item_id, trip_id, assignment_id, rental_id,
                reported_by_user_id, reported_at, incident_date, incident_location,
                severity, responsibility, status, description, damage_details,
                photos, videos, assessed_by_user_id, assessed_at, assessment_notes,
                estimated_repair_cost, actual_repair_cost, replacement_cost,
                insurance_covered, insurance_claim_id, insurance_amount,
                charged_to_customer, customer_charge_amount, repair_vendor_id,
                repair_start_date, repair_end_date, repair_notes, resolution_notes,
                resolved_by_user_id, resolved_at, currency, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, $29,
                $30, $31, $32, $33, $34, $35, $36, $37, $38
            )
            ON CONFLICT (id) DO UPDATE SET
                severity = EXCLUDED.severity,
                responsibility = EXCLUDED.responsibility,
                status = EXCLUDED.status,
                assessed_by_user_id = EXCLUDED.assessed_by_user_id,
                assessed_at = EXCLUDED.assessed_at,
                assessment_notes = EXCLUDED.assessment_notes,
                estimated_repair_cost = EXCLUDED.estimated_repair_cost,
                actual_repair_cost = EXCLUDED.actual_repair_cost,
                replacement_cost = EXCLUDED.replacement_cost,
                insurance_covered = EXCLUDED.insurance_covered,
                insurance_claim_id = EXCLUDED.insurance_claim_id,
                insurance_amount = EXCLUDED.insurance_amount,
                charged_to_customer = EXCLUDED.charged_to_customer,
                customer_charge_amount = EXCLUDED.customer_charge_amount,
                repair_vendor_id = EXCLUDED.repair_vendor_id,
                repair_start_date = EXCLUDED.repair_start_date,
                repair_end_date = EXCLUDED.repair_end_date,
                repair_notes = EXCLUDED.repair_notes,
                resolution_notes = EXCLUDED.resolution_notes,
                resolved_by_user_id = EXCLUDED.resolved_by_user_id,
                resolved_at = EXCLUDED.resolved_at,
                updated_at = CURRENT_TIMESTAMP`,
            [
                data.id, data.tenant_id, data.gear_item_id, data.trip_id, data.assignment_id, data.rental_id,
                data.reported_by_user_id, data.reported_at, data.incident_date, data.incident_location,
                data.severity, data.responsibility, data.status, data.description, JSON.stringify(data.damage_details),
                data.photos, data.videos, data.assessed_by_user_id, data.assessed_at, data.assessment_notes,
                data.estimated_repair_cost, data.actual_repair_cost, data.replacement_cost,
                data.insurance_covered, data.insurance_claim_id, data.insurance_amount,
                data.charged_to_customer, data.customer_charge_amount, data.repair_vendor_id,
                data.repair_start_date, data.repair_end_date, data.repair_notes, data.resolution_notes,
                data.resolved_by_user_id, data.resolved_at, data.currency, data.created_at, data.updated_at
            ]
        );
    }

    async getDamageStatsByPeriod(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        total: number;
        bySeverity: Record<string, number>;
        byResponsibility: Record<string, number>;
        totalCost: number;
    }> {
        const result = await this.pool.query(
            `SELECT 
                COUNT(*) as total,
                COALESCE(SUM(actual_repair_cost + replacement_cost), 0) as total_cost
             FROM gear_damage_reports 
             WHERE tenant_id = $1 AND reported_at >= $2 AND reported_at <= $3`,
            [tenantId, startDate, endDate]
        );

        const severityResult = await this.pool.query(
            `SELECT severity, COUNT(*) as count
             FROM gear_damage_reports 
             WHERE tenant_id = $1 AND reported_at >= $2 AND reported_at <= $3
             GROUP BY severity`,
            [tenantId, startDate, endDate]
        );

        const responsibilityResult = await this.pool.query(
            `SELECT responsibility, COUNT(*) as count
             FROM gear_damage_reports 
             WHERE tenant_id = $1 AND reported_at >= $2 AND reported_at <= $3
             GROUP BY responsibility`,
            [tenantId, startDate, endDate]
        );

        const bySeverity: Record<string, number> = {};
        for (const row of severityResult.rows) {
            bySeverity[row.severity] = parseInt(row.count, 10);
        }

        const byResponsibility: Record<string, number> = {};
        for (const row of responsibilityResult.rows) {
            byResponsibility[row.responsibility] = parseInt(row.count, 10);
        }

        return {
            total: parseInt(result.rows[0].total, 10),
            bySeverity,
            byResponsibility,
            totalCost: parseFloat(result.rows[0].total_cost),
        };
    }

    private toDomain(row: Record<string, unknown>): GearDamageReport {
        return GearDamageReport.fromPersistence({
            id: row.id as string,
            tenantId: row.tenant_id as string,
            gearItemId: row.gear_item_id as string,
            tripId: row.trip_id as string | undefined,
            assignmentId: row.assignment_id as string | undefined,
            rentalId: row.rental_id as string | undefined,
            reportedByUserId: row.reported_by_user_id as string,
            reportedAt: row.reported_at as Date,
            incidentDate: row.incident_date as Date | undefined,
            incidentLocation: row.incident_location as string | undefined,
            severity: row.severity as DamageSeverity,
            responsibility: row.responsibility as DamageResponsibility,
            status: row.status as DamageReportStatus,
            description: row.description as string,
            damageDetails: typeof row.damage_details === 'string' ? JSON.parse(row.damage_details) : row.damage_details as Record<string, unknown>,
            photos: row.photos as string[],
            videos: row.videos as string[],
            assessedByUserId: row.assessed_by_user_id as string | undefined,
            assessedAt: row.assessed_at as Date | undefined,
            assessmentNotes: row.assessment_notes as string,
            estimatedRepairCost: parseFloat(row.estimated_repair_cost as string),
            actualRepairCost: parseFloat(row.actual_repair_cost as string),
            replacementCost: parseFloat(row.replacement_cost as string),
            insuranceCovered: row.insurance_covered as boolean,
            insuranceClaimId: row.insurance_claim_id as string | undefined,
            insuranceAmount: parseFloat(row.insurance_amount as string),
            chargedToCustomer: row.charged_to_customer as boolean,
            customerChargeAmount: parseFloat(row.customer_charge_amount as string),
            repairVendorId: row.repair_vendor_id as string | undefined,
            repairStartDate: row.repair_start_date as Date | undefined,
            repairEndDate: row.repair_end_date as Date | undefined,
            repairNotes: row.repair_notes as string,
            resolutionNotes: row.resolution_notes as string,
            resolvedByUserId: row.resolved_by_user_id as string | undefined,
            resolvedAt: row.resolved_at as Date | undefined,
            currency: row.currency as string,
            createdAt: row.created_at as Date,
            updatedAt: row.updated_at as Date,
        });
    }

    private toPersistence(report: GearDamageReport): Record<string, unknown> {
        return {
            id: report.id,
            tenant_id: report.tenantId,
            gear_item_id: report.gearItemId,
            trip_id: report.tripId,
            assignment_id: report.assignmentId,
            rental_id: report.rentalId,
            reported_by_user_id: report.reportedByUserId,
            reported_at: report.reportedAt,
            incident_date: report.incidentDate,
            incident_location: report.incidentLocation,
            severity: report.severity,
            responsibility: report.responsibility,
            status: report.status,
            description: report.description,
            damage_details: report.damageDetails,
            photos: report.photos,
            videos: report.videos,
            assessed_by_user_id: report.assessedByUserId,
            assessed_at: report.assessedAt,
            assessment_notes: report.assessmentNotes,
            estimated_repair_cost: report.estimatedRepairCost,
            actual_repair_cost: report.actualRepairCost,
            replacement_cost: report.replacementCost,
            insurance_covered: report.insuranceCovered,
            insurance_claim_id: report.insuranceClaimId,
            insurance_amount: report.insuranceAmount,
            charged_to_customer: report.chargedToCustomer,
            customer_charge_amount: report.customerChargeAmount,
            repair_vendor_id: report.repairVendorId,
            repair_start_date: report.repairStartDate,
            repair_end_date: report.repairEndDate,
            repair_notes: report.repairNotes,
            resolution_notes: report.resolutionNotes,
            resolved_by_user_id: report.resolvedByUserId,
            resolved_at: report.resolvedAt,
            currency: report.currency,
            created_at: report.createdAt,
            updated_at: report.updatedAt,
        };
    }
}
