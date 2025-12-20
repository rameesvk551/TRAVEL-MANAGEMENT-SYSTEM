import { query } from '../database/index.js';
import { Pipeline, PipelineStage } from '../../domain/entities/Pipeline.js';
import { IPipelineRepository } from '../../domain/interfaces/IPipelineRepository.js';

interface PipelineRow {
    id: string;
    tenant_id: string;
    name: string;
    is_default: boolean;
    stages: PipelineStage[];
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: PipelineRow): Pipeline {
    return Pipeline.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        isDefault: row.is_default,
        stages: row.stages,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

export class PipelineRepository implements IPipelineRepository {
    async save(pipeline: Pipeline): Promise<Pipeline> {
        const sql = `
            INSERT INTO pipelines (
                id, tenant_id, name, is_default, stages, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                is_default = EXCLUDED.is_default,
                stages = EXCLUDED.stages,
                updated_at = NOW()
            RETURNING *
        `;

        const params = [
            pipeline.id, pipeline.tenantId, pipeline.name, pipeline.isDefault,
            JSON.stringify(pipeline.stages),
            pipeline.createdAt, new Date()
        ];

        const result = await query<PipelineRow>(sql, params);
        return toEntity(result.rows[0]);
    }

    async findById(id: string, tenantId: string): Promise<Pipeline | null> {
        const result = await query<PipelineRow>(
            'SELECT * FROM pipelines WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(tenantId: string): Promise<Pipeline[]> {
        const result = await query<PipelineRow>(
            'SELECT * FROM pipelines WHERE tenant_id = $1 ORDER BY name ASC',
            [tenantId]
        );
        return result.rows.map(toEntity);
    }

    async getDefault(tenantId: string): Promise<Pipeline | null> {
        const result = await query<PipelineRow>(
            'SELECT * FROM pipelines WHERE tenant_id = $1 AND is_default = true LIMIT 1',
            [tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await query(
            'DELETE FROM pipelines WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
    }
}
