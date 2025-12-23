import { Pool, PoolClient } from 'pg';
import { GearAuditLog, GearAuditAction } from '../../../domain/entities/gear/GearAuditLog.js';
import { IGearAuditLogRepository, GearAuditFilters } from '../../../domain/interfaces/gear/IGearAuditLogRepository.js';

export class GearAuditLogRepository implements IGearAuditLogRepository {
    constructor(private pool: Pool) {}

    async findByGearItem(
        gearItemId: string,
        tenantId: string,
        page = 1,
        limit = 50
    ): Promise<{ logs: GearAuditLog[]; total: number }> {
        const countResult = await this.pool.query(
            `SELECT COUNT(*) FROM gear_audit_log WHERE gear_item_id = $1 AND tenant_id = $2`,
            [gearItemId, tenantId]
        );

        const offset = (page - 1) * limit;
        const result = await this.pool.query(
            `SELECT * FROM gear_audit_log 
             WHERE gear_item_id = $1 AND tenant_id = $2 
             ORDER BY created_at DESC 
             LIMIT $3 OFFSET $4`,
            [gearItemId, tenantId, limit, offset]
        );

        return {
            logs: result.rows.map(row => this.toDomain(row)),
            total: parseInt(countResult.rows[0].count, 10),
        };
    }

    async findByTrip(tripId: string, tenantId: string): Promise<GearAuditLog[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_audit_log 
             WHERE trip_id = $1 AND tenant_id = $2 
             ORDER BY created_at DESC`,
            [tripId, tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findByUser(
        userId: string,
        tenantId: string,
        page = 1,
        limit = 50
    ): Promise<{ logs: GearAuditLog[]; total: number }> {
        const countResult = await this.pool.query(
            `SELECT COUNT(*) FROM gear_audit_log WHERE performed_by_user_id = $1 AND tenant_id = $2`,
            [userId, tenantId]
        );

        const offset = (page - 1) * limit;
        const result = await this.pool.query(
            `SELECT * FROM gear_audit_log 
             WHERE performed_by_user_id = $1 AND tenant_id = $2 
             ORDER BY created_at DESC 
             LIMIT $3 OFFSET $4`,
            [userId, tenantId, limit, offset]
        );

        return {
            logs: result.rows.map(row => this.toDomain(row)),
            total: parseInt(countResult.rows[0].count, 10),
        };
    }

    async findAll(
        tenantId: string,
        filters?: GearAuditFilters,
        page = 1,
        limit = 50
    ): Promise<{ logs: GearAuditLog[]; total: number }> {
        let whereClause = 'WHERE tenant_id = $1';
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters?.action) {
            whereClause += ` AND action = $${paramIndex++}`;
            params.push(filters.action);
        }
        if (filters?.gearItemId) {
            whereClause += ` AND gear_item_id = $${paramIndex++}`;
            params.push(filters.gearItemId);
        }
        if (filters?.tripId) {
            whereClause += ` AND trip_id = $${paramIndex++}`;
            params.push(filters.tripId);
        }
        if (filters?.userId) {
            whereClause += ` AND performed_by_user_id = $${paramIndex++}`;
            params.push(filters.userId);
        }
        if (filters?.startDate) {
            whereClause += ` AND created_at >= $${paramIndex++}`;
            params.push(filters.startDate);
        }
        if (filters?.endDate) {
            whereClause += ` AND created_at <= $${paramIndex++}`;
            params.push(filters.endDate);
        }

        const countResult = await this.pool.query(
            `SELECT COUNT(*) FROM gear_audit_log ${whereClause}`,
            params
        );

        const offset = (page - 1) * limit;
        const result = await this.pool.query(
            `SELECT * FROM gear_audit_log ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
            [...params, limit, offset]
        );

        return {
            logs: result.rows.map(row => this.toDomain(row)),
            total: parseInt(countResult.rows[0].count, 10),
        };
    }

    async save(log: GearAuditLog, client?: PoolClient): Promise<void> {
        const conn = client || this.pool;
        const data = this.toPersistence(log);

        await conn.query(
            `INSERT INTO gear_audit_log (
                id, tenant_id, gear_item_id, action, entity_type, entity_id,
                trip_id, assignment_id, rental_id, performed_by_user_id,
                previous_state, new_state, metadata, notes, ip_address,
                user_agent, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            )`,
            [
                data.id, data.tenant_id, data.gear_item_id, data.action, data.entity_type, data.entity_id,
                data.trip_id, data.assignment_id, data.rental_id, data.performed_by_user_id,
                JSON.stringify(data.previous_state), JSON.stringify(data.new_state), JSON.stringify(data.metadata),
                data.notes, data.ip_address, data.user_agent, data.created_at
            ]
        );
    }

    async getActivitySummary(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<Record<GearAuditAction, number>> {
        const result = await this.pool.query(
            `SELECT action, COUNT(*) as count
             FROM gear_audit_log 
             WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3
             GROUP BY action`,
            [tenantId, startDate, endDate]
        );

        const summary: Partial<Record<GearAuditAction, number>> = {};
        for (const row of result.rows) {
            summary[row.action as GearAuditAction] = parseInt(row.count, 10);
        }
        return summary as Record<GearAuditAction, number>;
    }

    async deleteOlderThan(tenantId: string, beforeDate: Date): Promise<number> {
        const result = await this.pool.query(
            `DELETE FROM gear_audit_log WHERE tenant_id = $1 AND created_at < $2`,
            [tenantId, beforeDate]
        );
        return result.rowCount || 0;
    }

    private toDomain(row: Record<string, unknown>): GearAuditLog {
        return GearAuditLog.fromPersistence({
            id: row.id as string,
            tenantId: row.tenant_id as string,
            gearItemId: row.gear_item_id as string | undefined,
            action: row.action as GearAuditAction,
            entityType: row.entity_type as string,
            entityId: row.entity_id as string,
            tripId: row.trip_id as string | undefined,
            assignmentId: row.assignment_id as string | undefined,
            rentalId: row.rental_id as string | undefined,
            performedByUserId: row.performed_by_user_id as string,
            previousState: typeof row.previous_state === 'string' ? JSON.parse(row.previous_state) : row.previous_state as Record<string, unknown>,
            newState: typeof row.new_state === 'string' ? JSON.parse(row.new_state) : row.new_state as Record<string, unknown>,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata as Record<string, unknown>,
            notes: row.notes as string,
            ipAddress: row.ip_address as string | undefined,
            userAgent: row.user_agent as string | undefined,
            createdAt: row.created_at as Date,
        });
    }

    private toPersistence(log: GearAuditLog): Record<string, unknown> {
        return {
            id: log.id,
            tenant_id: log.tenantId,
            gear_item_id: log.gearItemId,
            action: log.action,
            entity_type: log.entityType,
            entity_id: log.entityId,
            trip_id: log.tripId,
            assignment_id: log.assignmentId,
            rental_id: log.rentalId,
            performed_by_user_id: log.performedByUserId,
            previous_state: log.previousState,
            new_state: log.newState,
            metadata: log.metadata,
            notes: log.notes,
            ip_address: log.ipAddress,
            user_agent: log.userAgent,
            created_at: log.createdAt,
        };
    }
}
