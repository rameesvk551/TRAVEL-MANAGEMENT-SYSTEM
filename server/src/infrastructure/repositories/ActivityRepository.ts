import { query } from '../database/index.js';
import { Activity, ActivityType, ActivityStatus, ActivityOutcome } from '../../domain/entities/Activity.js';
import { IActivityRepository, ActivityFilters } from '../../domain/interfaces/IActivityRepository.js';

interface ActivityRow {
    id: string;
    tenant_id: string;
    lead_id?: string;
    contact_id?: string;
    booking_id?: string;
    assigned_to_id?: string;
    created_by_id: string;
    type: ActivityType;
    status: ActivityStatus;
    outcome?: ActivityOutcome;
    subject: string;
    description?: string;
    scheduled_at?: Date;
    completed_at?: Date;
    metadata: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: ActivityRow): Activity {
    return Activity.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        leadId: row.lead_id,
        contactId: row.contact_id,
        bookingId: row.booking_id,
        assignedToId: row.assigned_to_id,
        createdById: row.created_by_id,
        type: row.type,
        status: row.status,
        outcome: row.outcome,
        subject: row.subject,
        description: row.description,
        scheduledAt: row.scheduled_at,
        completedAt: row.completed_at,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

export class ActivityRepository implements IActivityRepository {
    async save(activity: Activity): Promise<Activity> {
        const sql = `
            INSERT INTO activities (
                id, tenant_id, lead_id, contact_id, booking_id, assigned_to_id, created_by_id,
                type, status, outcome, subject, description, scheduled_at, completed_at,
                metadata, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17
            )
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                outcome = EXCLUDED.outcome,
                description = EXCLUDED.description,
                scheduled_at = EXCLUDED.scheduled_at,
                completed_at = EXCLUDED.completed_at,
                updated_at = NOW()
            RETURNING *
        `;

        const params = [
            activity.id, activity.tenantId, activity.leadId, activity.contactId, activity.bookingId,
            activity.assignedToId, activity.createdById,
            activity.type, activity.status, activity.outcome, activity.subject, activity.description,
            activity.scheduledAt, activity.completedAt,
            activity.metadata, activity.createdAt, new Date()
        ];

        const result = await query<ActivityRow>(sql, params);
        return toEntity(result.rows[0]);
    }

    async findById(id: string, tenantId: string): Promise<Activity | null> {
        const result = await query<ActivityRow>(
            'SELECT * FROM activities WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(tenantId: string, filters: ActivityFilters): Promise<{ activities: Activity[]; total: number }> {
        let sql = 'SELECT * FROM activities WHERE tenant_id = $1';
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters.leadId) {
            sql += ` AND lead_id = $${paramIndex++}`;
            params.push(filters.leadId);
        }
        if (filters.contactId) {
            sql += ` AND contact_id = $${paramIndex++}`;
            params.push(filters.contactId);
        }
        if (filters.assignedToId) {
            sql += ` AND assigned_to_id = $${paramIndex++}`;
            params.push(filters.assignedToId);
        }
        if (filters.status) {
            sql += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }

        const countResult = await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM (${sql}) as filtered_activities`,
            params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const limit = filters.limit || 50;
        const offset = filters.offset || 0;
        sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await query<ActivityRow>(sql, params);
        return {
            activities: result.rows.map(toEntity),
            total
        };
    }

    async findOverdue(tenantId: string, assignedToId?: string): Promise<Activity[]> {
        let sql = `
            SELECT * FROM activities 
            WHERE tenant_id = $1 
            AND status = 'PENDING' 
            AND scheduled_at < NOW()
        `;
        const params: unknown[] = [tenantId];

        if (assignedToId) {
            sql += ` AND assigned_to_id = $2`;
            params.push(assignedToId);
        }

        const result = await query<ActivityRow>(sql, params);
        return result.rows.map(toEntity);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await query(
            'DELETE FROM activities WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
    }
}
