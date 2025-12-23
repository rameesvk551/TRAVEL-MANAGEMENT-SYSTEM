import { query } from '../../database/index.js';
import { GearCategory, GearCategoryType } from '../../../domain/entities/gear/GearCategory.js';
import { 
    IGearCategoryRepository, 
    GearCategoryFilters 
} from '../../../domain/interfaces/gear/IGearCategoryRepository.js';

interface GearCategoryRow {
    id: string;
    tenant_id: string;
    parent_id: string | null;
    name: string;
    type: GearCategoryType;
    description: string;
    is_safety_critical: boolean;
    inspection_interval_days: number;
    maintenance_interval_days: number;
    attributes: Record<string, unknown>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: GearCategoryRow): GearCategory {
    return GearCategory.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        parentId: row.parent_id ?? undefined,
        name: row.name,
        type: row.type,
        description: row.description,
        isSafetyCritical: row.is_safety_critical,
        inspectionIntervalDays: row.inspection_interval_days,
        maintenanceIntervalDays: row.maintenance_interval_days,
        attributes: row.attributes,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

export class GearCategoryRepository implements IGearCategoryRepository {
    async findById(id: string, tenantId: string): Promise<GearCategory | null> {
        const sql = `
            SELECT * FROM gear_categories 
            WHERE id = $1 AND tenant_id = $2
        `;
        const result = await query<GearCategoryRow>(sql, [id, tenantId]);
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(tenantId: string, filters?: GearCategoryFilters): Promise<GearCategory[]> {
        let sql = `SELECT * FROM gear_categories WHERE tenant_id = $1`;
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters?.type) {
            sql += ` AND type = $${paramIndex++}`;
            params.push(filters.type);
        }
        if (filters?.parentId !== undefined) {
            if (filters.parentId === null) {
                sql += ` AND parent_id IS NULL`;
            } else {
                sql += ` AND parent_id = $${paramIndex++}`;
                params.push(filters.parentId);
            }
        }
        if (filters?.isSafetyCritical !== undefined) {
            sql += ` AND is_safety_critical = $${paramIndex++}`;
            params.push(filters.isSafetyCritical);
        }
        if (filters?.isActive !== undefined) {
            sql += ` AND is_active = $${paramIndex++}`;
            params.push(filters.isActive);
        }
        if (filters?.search) {
            sql += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        sql += ` ORDER BY name ASC`;
        const result = await query<GearCategoryRow>(sql, params);
        return result.rows.map(toEntity);
    }

    async findByType(tenantId: string, type: GearCategoryType): Promise<GearCategory[]> {
        const sql = `
            SELECT * FROM gear_categories 
            WHERE tenant_id = $1 AND type = $2 AND is_active = true
            ORDER BY name ASC
        `;
        const result = await query<GearCategoryRow>(sql, [tenantId, type]);
        return result.rows.map(toEntity);
    }

    async save(category: GearCategory): Promise<GearCategory> {
        const sql = `
            INSERT INTO gear_categories (
                id, tenant_id, parent_id, name, type, description,
                is_safety_critical, inspection_interval_days, maintenance_interval_days,
                attributes, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;
        const params = [
            category.id, category.tenantId, category.parentId ?? null, 
            category.name, category.type, category.description,
            category.isSafetyCritical, category.inspectionIntervalDays, 
            category.maintenanceIntervalDays, category.attributes, category.isActive,
        ];
        const result = await query<GearCategoryRow>(sql, params);
        return toEntity(result.rows[0]);
    }

    async update(category: GearCategory): Promise<GearCategory> {
        const sql = `
            UPDATE gear_categories SET
                parent_id = $3, name = $4, type = $5, description = $6,
                is_safety_critical = $7, inspection_interval_days = $8,
                maintenance_interval_days = $9, attributes = $10, is_active = $11
            WHERE id = $1 AND tenant_id = $2
            RETURNING *
        `;
        const params = [
            category.id, category.tenantId, category.parentId ?? null,
            category.name, category.type, category.description,
            category.isSafetyCritical, category.inspectionIntervalDays,
            category.maintenanceIntervalDays, category.attributes, category.isActive,
        ];
        const result = await query<GearCategoryRow>(sql, params);
        return toEntity(result.rows[0]);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        const sql = `DELETE FROM gear_categories WHERE id = $1 AND tenant_id = $2`;
        await query(sql, [id, tenantId]);
    }
}
