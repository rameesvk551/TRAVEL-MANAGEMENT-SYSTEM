import { query } from '../database/index.js';
import { Tenant } from '../../domain/entities/Tenant.js';
import { ITenantRepository } from '../../domain/interfaces/ITenantRepository.js';

interface TenantRow {
    [key: string]: unknown;
    id: string;
    name: string;
    slug: string;
    settings: Record<string, unknown>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: TenantRow): Tenant {
    return Tenant.fromPersistence({
        id: row.id,
        name: row.name,
        slug: row.slug,
        settings: row.settings,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

export class TenantRepository implements ITenantRepository {
    async findById(id: string): Promise<Tenant | null> {
        const result = await query<TenantRow>(
            'SELECT * FROM tenants WHERE id = $1 AND is_active = true',
            [id]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findBySlug(slug: string): Promise<Tenant | null> {
        const result = await query<TenantRow>(
            'SELECT * FROM tenants WHERE slug = $1 AND is_active = true',
            [slug]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(): Promise<Tenant[]> {
        const result = await query<TenantRow>(
            'SELECT * FROM tenants WHERE is_active = true ORDER BY name'
        );
        return result.rows.map(toEntity);
    }

    async save(tenant: Tenant): Promise<Tenant> {
        const result = await query<TenantRow>(
            `INSERT INTO tenants (id, name, slug, settings, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [tenant.id, tenant.name, tenant.slug, tenant.settings, tenant.isActive]
        );
        return toEntity(result.rows[0]);
    }

    async update(tenant: Tenant): Promise<Tenant> {
        const result = await query<TenantRow>(
            `UPDATE tenants SET name = $1, slug = $2, settings = $3, is_active = $4
       WHERE id = $5 RETURNING *`,
            [tenant.name, tenant.slug, tenant.settings, tenant.isActive, tenant.id]
        );
        return toEntity(result.rows[0]);
    }
}
