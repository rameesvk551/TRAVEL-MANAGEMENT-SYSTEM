import { Pool, PoolClient } from 'pg';
import { GearMaintenance, MaintenanceType, MaintenancePriority, MaintenanceStatus } from '../../../domain/entities/gear/GearMaintenance.js';
import { IGearMaintenanceRepository, GearMaintenanceFilters } from '../../../domain/interfaces/gear/IGearMaintenanceRepository.js';

export class GearMaintenanceRepository implements IGearMaintenanceRepository {
    constructor(private pool: Pool) {}

    async findById(id: string, tenantId: string): Promise<GearMaintenance | null> {
        const result = await this.pool.query(
            `SELECT * FROM gear_maintenance WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
        return result.rows[0] ? this.toDomain(result.rows[0]) : null;
    }

    async findByGearItem(gearItemId: string, tenantId: string): Promise<GearMaintenance[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_maintenance WHERE gear_item_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
            [gearItemId, tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findPending(tenantId: string): Promise<GearMaintenance[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_maintenance 
             WHERE tenant_id = $1 AND status IN ('SCHEDULED', 'PENDING_PARTS')
             ORDER BY priority DESC, scheduled_date ASC`,
            [tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findInProgress(tenantId: string): Promise<GearMaintenance[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_maintenance 
             WHERE tenant_id = $1 AND status = 'IN_PROGRESS'
             ORDER BY started_at ASC`,
            [tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findOverdue(tenantId: string): Promise<GearMaintenance[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_maintenance 
             WHERE tenant_id = $1 AND status = 'SCHEDULED' AND scheduled_date < CURRENT_DATE
             ORDER BY scheduled_date ASC`,
            [tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findAll(
        tenantId: string,
        filters?: GearMaintenanceFilters,
        page = 1,
        limit = 50
    ): Promise<{ records: GearMaintenance[]; total: number }> {
        let whereClause = 'WHERE tenant_id = $1';
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters?.type) {
            whereClause += ` AND maintenance_type = $${paramIndex++}`;
            params.push(filters.type);
        }
        if (filters?.priority) {
            whereClause += ` AND priority = $${paramIndex++}`;
            params.push(filters.priority);
        }
        if (filters?.status) {
            whereClause += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }
        if (filters?.gearItemId) {
            whereClause += ` AND gear_item_id = $${paramIndex++}`;
            params.push(filters.gearItemId);
        }
        if (filters?.vendorId) {
            whereClause += ` AND vendor_id = $${paramIndex++}`;
            params.push(filters.vendorId);
        }
        if (filters?.scheduledAfter) {
            whereClause += ` AND scheduled_date >= $${paramIndex++}`;
            params.push(filters.scheduledAfter);
        }
        if (filters?.scheduledBefore) {
            whereClause += ` AND scheduled_date <= $${paramIndex++}`;
            params.push(filters.scheduledBefore);
        }

        const countResult = await this.pool.query(
            `SELECT COUNT(*) FROM gear_maintenance ${whereClause}`,
            params
        );

        const offset = (page - 1) * limit;
        const result = await this.pool.query(
            `SELECT * FROM gear_maintenance ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
            [...params, limit, offset]
        );

        return {
            records: result.rows.map(row => this.toDomain(row)),
            total: parseInt(countResult.rows[0].count, 10),
        };
    }

    async save(maintenance: GearMaintenance, client?: PoolClient): Promise<void> {
        const conn = client || this.pool;
        const data = this.toPersistence(maintenance);

        await conn.query(
            `INSERT INTO gear_maintenance (
                id, tenant_id, gear_item_id, maintenance_type, priority, status,
                damage_report_id, scheduled_date, started_at, completed_at,
                assigned_to_user_id, vendor_id, description, work_performed,
                parts_used, estimated_cost, actual_cost, currency, warranty_claim,
                warranty_approved, notes, created_by_user_id, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24
            )
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                started_at = EXCLUDED.started_at,
                completed_at = EXCLUDED.completed_at,
                assigned_to_user_id = EXCLUDED.assigned_to_user_id,
                vendor_id = EXCLUDED.vendor_id,
                work_performed = EXCLUDED.work_performed,
                parts_used = EXCLUDED.parts_used,
                actual_cost = EXCLUDED.actual_cost,
                warranty_approved = EXCLUDED.warranty_approved,
                notes = EXCLUDED.notes,
                updated_at = CURRENT_TIMESTAMP`,
            [
                data.id, data.tenant_id, data.gear_item_id, data.maintenance_type, data.priority, data.status,
                data.damage_report_id, data.scheduled_date, data.started_at, data.completed_at,
                data.assigned_to_user_id, data.vendor_id, data.description, data.work_performed,
                JSON.stringify(data.parts_used), data.estimated_cost, data.actual_cost, data.currency,
                data.warranty_claim, data.warranty_approved, data.notes, data.created_by_user_id,
                data.created_at, data.updated_at
            ]
        );
    }

    async getMaintenanceCostsByPeriod(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{ total: number; count: number }> {
        const result = await this.pool.query(
            `SELECT COALESCE(SUM(actual_cost), 0) as total, COUNT(*) as count
             FROM gear_maintenance 
             WHERE tenant_id = $1 AND status = 'COMPLETED'
             AND completed_at >= $2 AND completed_at <= $3`,
            [tenantId, startDate, endDate]
        );
        return {
            total: parseFloat(result.rows[0].total),
            count: parseInt(result.rows[0].count, 10),
        };
    }

    async getItemMaintenanceHistory(
        gearItemId: string,
        tenantId: string
    ): Promise<GearMaintenance[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_maintenance 
             WHERE gear_item_id = $1 AND tenant_id = $2 AND status = 'COMPLETED'
             ORDER BY completed_at DESC`,
            [gearItemId, tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    private toDomain(row: Record<string, unknown>): GearMaintenance {
        return GearMaintenance.fromPersistence({
            id: row.id as string,
            tenantId: row.tenant_id as string,
            gearItemId: row.gear_item_id as string,
            type: row.maintenance_type as MaintenanceType,
            priority: row.priority as MaintenancePriority,
            status: row.status as MaintenanceStatus,
            damageReportId: row.damage_report_id as string | undefined,
            scheduledDate: row.scheduled_date as Date | undefined,
            startedAt: row.started_at as Date | undefined,
            completedAt: row.completed_at as Date | undefined,
            assignedToUserId: row.assigned_to_user_id as string | undefined,
            vendorId: row.vendor_id as string | undefined,
            description: row.description as string,
            workPerformed: row.work_performed as string,
            partsUsed: typeof row.parts_used === 'string' ? JSON.parse(row.parts_used) : row.parts_used as Record<string, unknown>[],
            estimatedCost: parseFloat(row.estimated_cost as string),
            actualCost: parseFloat(row.actual_cost as string),
            currency: row.currency as string,
            warrantyClaimId: row.warranty_claim as string | undefined,
            warrantyApproved: row.warranty_approved as boolean,
            notes: row.notes as string,
            createdByUserId: row.created_by_user_id as string,
            createdAt: row.created_at as Date,
            updatedAt: row.updated_at as Date,
        });
    }

    private toPersistence(maintenance: GearMaintenance): Record<string, unknown> {
        return {
            id: maintenance.id,
            tenant_id: maintenance.tenantId,
            gear_item_id: maintenance.gearItemId,
            maintenance_type: maintenance.type,
            priority: maintenance.priority,
            status: maintenance.status,
            damage_report_id: maintenance.damageReportId,
            scheduled_date: maintenance.scheduledDate,
            started_at: maintenance.startedAt,
            completed_at: maintenance.completedAt,
            assigned_to_user_id: maintenance.assignedToUserId,
            vendor_id: maintenance.vendorId,
            description: maintenance.description,
            work_performed: maintenance.workPerformed,
            parts_used: maintenance.partsUsed,
            estimated_cost: maintenance.estimatedCost,
            actual_cost: maintenance.actualCost,
            currency: maintenance.currency,
            warranty_claim: maintenance.warrantyClaimId,
            warranty_approved: maintenance.warrantyApproved,
            notes: maintenance.notes,
            created_by_user_id: maintenance.createdByUserId,
            created_at: maintenance.createdAt,
            updated_at: maintenance.updatedAt,
        };
    }
}
