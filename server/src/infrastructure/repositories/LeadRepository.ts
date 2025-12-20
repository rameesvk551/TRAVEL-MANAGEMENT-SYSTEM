import { query } from '../database/index.js';
import { Lead, LeadTravelPreferences } from '../../domain/entities/Lead.js';
import { ILeadRepository, LeadFilters } from '../../domain/interfaces/ILeadRepository.js';

interface LeadRow {
    id: string;
    tenant_id: string;
    pipeline_id?: string;
    stage_id?: string;
    contact_id?: string;
    name: string;
    email?: string;
    phone?: string;
    assigned_to_id?: string;
    source?: string;
    source_platform?: string;
    travel_preferences: LeadTravelPreferences;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status?: string;
    score: number;
    tags: string[];
    notes?: string;
    lost_reason?: string;
    metadata: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: LeadRow): Lead {
    return Lead.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        pipelineId: row.pipeline_id,
        stageId: row.stage_id,
        contactId: row.contact_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        assignedToId: row.assigned_to_id,
        source: row.source,
        sourcePlatform: row.source_platform,
        travelPreferences: row.travel_preferences,
        priority: row.priority,
        status: row.status,
        score: row.score,
        tags: row.tags,
        notes: row.notes,
        lostReason: row.lost_reason,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

export class LeadRepository implements ILeadRepository {
    async save(lead: Lead): Promise<Lead> {
        const sql = `
            INSERT INTO leads (
                id, tenant_id, pipeline_id, stage_id, contact_id, name, email, phone,
                assigned_to_id, source, source_platform, travel_preferences,
                priority, status, score, tags, notes, lost_reason, metadata,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12,
                $13, $14, $15, $16, $17, $18, $19,
                $20, $21
            )
            ON CONFLICT (id) DO UPDATE SET
                pipeline_id = EXCLUDED.pipeline_id,
                stage_id = EXCLUDED.stage_id,
                contact_id = EXCLUDED.contact_id,
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                assigned_to_id = EXCLUDED.assigned_to_id,
                travel_preferences = EXCLUDED.travel_preferences,
                priority = EXCLUDED.priority,
                status = EXCLUDED.status,
                score = EXCLUDED.score,
                tags = EXCLUDED.tags,
                notes = EXCLUDED.notes,
                lost_reason = EXCLUDED.lost_reason,
                metadata = EXCLUDED.metadata,
                updated_at = NOW()
            RETURNING *
        `;

        const params = [
            lead.id, lead.tenantId, lead.pipelineId, lead.stageId, lead.contactId, lead.name, lead.email, lead.phone,
            lead.assignedToId, lead.source, lead.sourcePlatform, lead.travelPreferences,
            lead.priority, lead.status, lead.score, lead.tags, lead.notes, lead.lostReason, lead.metadata,
            lead.createdAt, new Date()
        ];

        const result = await query<LeadRow>(sql, params);
        return toEntity(result.rows[0]);
    }

    async findById(id: string, tenantId: string): Promise<Lead | null> {
        const result = await query<LeadRow>(
            'SELECT * FROM leads WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(tenantId: string, filters: LeadFilters): Promise<{ leads: Lead[]; total: number }> {
        let sql = 'SELECT * FROM leads WHERE tenant_id = $1';
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters.pipelineId) {
            sql += ` AND pipeline_id = $${paramIndex++}`;
            params.push(filters.pipelineId);
        }
        if (filters.stageId) {
            sql += ` AND stage_id = $${paramIndex++}`;
            params.push(filters.stageId);
        }
        if (filters.assignedToId) {
            sql += ` AND assigned_to_id = $${paramIndex++}`;
            params.push(filters.assignedToId);
        }
        if (filters.search) {
            sql += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        const countResult = await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM (${sql}) as filtered_leads`,
            params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const limit = filters.limit || 50;
        const offset = filters.offset || 0;
        sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await query<LeadRow>(sql, params);
        return {
            leads: result.rows.map(toEntity),
            total
        };
    }

    async findByPipeline(pipelineId: string, tenantId: string): Promise<Lead[]> {
        const result = await query<LeadRow>(
            'SELECT * FROM leads WHERE pipeline_id = $1 AND tenant_id = $2 ORDER BY created_at ASC',
            [pipelineId, tenantId]
        );
        return result.rows.map(toEntity);
    }

    async countByStage(pipelineId: string, tenantId: string): Promise<Record<string, number>> {
        const result = await query<{ stage_id: string; count: string }>(
            'SELECT stage_id, COUNT(*) as count FROM leads WHERE pipeline_id = $1 AND tenant_id = $2 GROUP BY stage_id',
            [pipelineId, tenantId]
        );
        const counts: Record<string, number> = {};
        result.rows.forEach(row => {
            if (row.stage_id) counts[row.stage_id] = parseInt(row.count, 10);
        });
        return counts;
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await query(
            'DELETE FROM leads WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
    }
}
