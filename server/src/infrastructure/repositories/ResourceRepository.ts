import { query } from '../database/index.js';
import { Resource, ResourceType } from '../../domain/entities/Resource.js';
import { IResourceRepository, ResourceFilters } from '../../domain/interfaces/IResourceRepository.js';

interface ResourceRow {
    [key: string]: unknown;
    id: string;
    tenant_id: string;
    type: ResourceType;
    name: string;
    description: string;
    capacity: number;
    base_price: string;
    currency: string;
    attributes: Record<string, unknown>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: ResourceRow): Resource {
    return Resource.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        type: row.type,
        name: row.name,
        description: row.description,
        capacity: row.capacity,
        basePrice: parseFloat(row.base_price),
        currency: row.currency,
        attributes: row.attributes,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

function buildWhereClause(
    tenantId: string,
    filters?: ResourceFilters
): { clause: string; params: unknown[] } {
    const conditions = ['tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters?.type) {
        conditions.push(`type = $${paramIndex++}`);
        params.push(filters.type);
    }
    if (filters?.isActive !== undefined) {
        conditions.push(`is_active = $${paramIndex++}`);
        params.push(filters.isActive);
    }
    if (filters?.search) {
        conditions.push(
            `(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
        );
        params.push(`%${filters.search}%`);
        paramIndex++;
    }

    return { clause: conditions.join(' AND '), params };
}

export class ResourceRepository implements IResourceRepository {
    async findById(id: string, tenantId: string): Promise<Resource | null> {
        const result = await query<ResourceRow>(
            'SELECT * FROM resources WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(
        tenantId: string,
        filters?: ResourceFilters,
        limit = 20,
        offset = 0
    ): Promise<Resource[]> {
        const { clause, params } = buildWhereClause(tenantId, filters);
        const sql = `SELECT * FROM resources WHERE ${clause} ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const result = await query<ResourceRow>(sql, [...params, limit, offset]);
        return result.rows.map(toEntity);
    }

    async count(tenantId: string, filters?: ResourceFilters): Promise<number> {
        const { clause, params } = buildWhereClause(tenantId, filters);
        const result = await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM resources WHERE ${clause}`,
            params
        );
        return parseInt(result.rows[0].count, 10);
    }

    async save(resource: Resource): Promise<Resource> {
        const sql = `INSERT INTO resources (id, tenant_id, type, name, description, capacity, base_price, currency, attributes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`;
        const result = await query<ResourceRow>(sql, [
            resource.id,
            resource.tenantId,
            resource.type,
            resource.name,
            resource.description,
            resource.capacity,
            resource.basePrice,
            resource.currency,
            resource.attributes,
            resource.isActive,
        ]);
        return toEntity(result.rows[0]);
    }

    async update(resource: Resource): Promise<Resource> {
        const sql = `UPDATE resources SET type = $1, name = $2, description = $3, capacity = $4,
       base_price = $5, currency = $6, attributes = $7, is_active = $8
       WHERE id = $9 AND tenant_id = $10 RETURNING *`;
        const result = await query<ResourceRow>(sql, [
            resource.type,
            resource.name,
            resource.description,
            resource.capacity,
            resource.basePrice,
            resource.currency,
            resource.attributes,
            resource.isActive,
            resource.id,
            resource.tenantId,
        ]);
        return toEntity(result.rows[0]);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await query(
            'DELETE FROM resources WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
    }
}
