import { Pool, PoolClient } from 'pg';
import { GearWarehouse, WarehouseType } from '../../../domain/entities/gear/GearWarehouse.js';
import { IGearWarehouseRepository, GearWarehouseFilters } from '../../../domain/interfaces/gear/IGearWarehouseRepository.js';

export class GearWarehouseRepository implements IGearWarehouseRepository {
    constructor(private pool: Pool) {}

    async findById(id: string, tenantId: string): Promise<GearWarehouse | null> {
        const result = await this.pool.query(
            `SELECT * FROM gear_warehouses WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
        return result.rows[0] ? this.toDomain(result.rows[0]) : null;
    }

    async findByCode(code: string, tenantId: string): Promise<GearWarehouse | null> {
        const result = await this.pool.query(
            `SELECT * FROM gear_warehouses WHERE code = $1 AND tenant_id = $2`,
            [code, tenantId]
        );
        return result.rows[0] ? this.toDomain(result.rows[0]) : null;
    }

    async findAll(
        tenantId: string,
        filters?: GearWarehouseFilters
    ): Promise<GearWarehouse[]> {
        let whereClause = 'WHERE tenant_id = $1';
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters?.type) {
            whereClause += ` AND type = $${paramIndex++}`;
            params.push(filters.type);
        }
        if (filters?.city) {
            whereClause += ` AND LOWER(city) = LOWER($${paramIndex++})`;
            params.push(filters.city);
        }
        if (filters?.isActive !== undefined) {
            whereClause += ` AND is_active = $${paramIndex++}`;
            params.push(filters.isActive);
        }
        if (filters?.search) {
            whereClause += ` AND (LOWER(name) LIKE $${paramIndex} OR LOWER(code) LIKE $${paramIndex})`;
            params.push(`%${filters.search.toLowerCase()}%`);
            paramIndex++;
        }

        const result = await this.pool.query(
            `SELECT * FROM gear_warehouses ${whereClause} ORDER BY name ASC`,
            params
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findActive(tenantId: string): Promise<GearWarehouse[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_warehouses WHERE tenant_id = $1 AND is_active = true ORDER BY name ASC`,
            [tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findByType(type: WarehouseType, tenantId: string): Promise<GearWarehouse[]> {
        const result = await this.pool.query(
            `SELECT * FROM gear_warehouses WHERE type = $1 AND tenant_id = $2 AND is_active = true ORDER BY name ASC`,
            [type, tenantId]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async findNearby(
        latitude: number,
        longitude: number,
        radiusKm: number,
        tenantId: string
    ): Promise<GearWarehouse[]> {
        // Haversine formula for distance calculation
        const result = await this.pool.query(
            `SELECT *,
                (6371 * acos(
                    cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(latitude))
                )) AS distance
             FROM gear_warehouses 
             WHERE tenant_id = $3 AND is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL
             HAVING (6371 * acos(
                    cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(latitude))
                )) <= $4
             ORDER BY distance ASC`,
            [latitude, longitude, tenantId, radiusKm]
        );
        return result.rows.map(row => this.toDomain(row));
    }

    async save(warehouse: GearWarehouse, client?: PoolClient): Promise<void> {
        const conn = client || this.pool;
        const data = this.toPersistence(warehouse);

        await conn.query(
            `INSERT INTO gear_warehouses (
                id, tenant_id, name, code, type, address, city, state, country, postal_code,
                latitude, longitude, altitude, contact_name, contact_phone, contact_email,
                operating_hours, capacity, zones, is_active, notes, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                type = EXCLUDED.type,
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                country = EXCLUDED.country,
                postal_code = EXCLUDED.postal_code,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                altitude = EXCLUDED.altitude,
                contact_name = EXCLUDED.contact_name,
                contact_phone = EXCLUDED.contact_phone,
                contact_email = EXCLUDED.contact_email,
                operating_hours = EXCLUDED.operating_hours,
                capacity = EXCLUDED.capacity,
                zones = EXCLUDED.zones,
                is_active = EXCLUDED.is_active,
                notes = EXCLUDED.notes,
                updated_at = CURRENT_TIMESTAMP`,
            [
                data.id, data.tenant_id, data.name, data.code, data.type, data.address, data.city,
                data.state, data.country, data.postal_code, data.latitude, data.longitude,
                data.altitude, data.contact_name, data.contact_phone, data.contact_email,
                data.operating_hours, data.capacity, data.zones, data.is_active, data.notes,
                data.created_at, data.updated_at
            ]
        );
    }

    async delete(id: string, tenantId: string): Promise<void> {
        // Soft delete by setting is_active to false
        await this.pool.query(
            `UPDATE gear_warehouses SET is_active = false, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
    }

    async getInventoryCount(warehouseId: string, tenantId: string): Promise<number> {
        const result = await this.pool.query(
            `SELECT COUNT(*) FROM gear_inventory 
             WHERE warehouse_id = $1 AND tenant_id = $2 AND status != 'RETIRED'`,
            [warehouseId, tenantId]
        );
        return parseInt(result.rows[0].count, 10);
    }

    async getCapacityUtilization(warehouseId: string, tenantId: string): Promise<number> {
        const warehouse = await this.findById(warehouseId, tenantId);
        if (!warehouse || warehouse.capacity === 0) return 0;

        const count = await this.getInventoryCount(warehouseId, tenantId);
        return Math.round((count / warehouse.capacity) * 100);
    }

    private toDomain(row: Record<string, unknown>): GearWarehouse {
        return GearWarehouse.fromPersistence({
            id: row.id as string,
            tenantId: row.tenant_id as string,
            name: row.name as string,
            code: row.code as string,
            type: row.type as WarehouseType,
            address: row.address as string,
            city: row.city as string,
            state: row.state as string,
            country: row.country as string,
            postalCode: row.postal_code as string,
            latitude: row.latitude ? parseFloat(row.latitude as string) : undefined,
            longitude: row.longitude ? parseFloat(row.longitude as string) : undefined,
            altitude: row.altitude ? parseFloat(row.altitude as string) : undefined,
            contactName: row.contact_name as string,
            contactPhone: row.contact_phone as string,
            contactEmail: row.contact_email as string,
            operatingHours: row.operating_hours as string,
            capacity: row.capacity as number,
            zones: row.zones as string[],
            isActive: row.is_active as boolean,
            notes: row.notes as string,
            createdAt: row.created_at as Date,
            updatedAt: row.updated_at as Date,
        });
    }

    private toPersistence(warehouse: GearWarehouse): Record<string, unknown> {
        return {
            id: warehouse.id,
            tenant_id: warehouse.tenantId,
            name: warehouse.name,
            code: warehouse.code,
            type: warehouse.type,
            address: warehouse.address,
            city: warehouse.city,
            state: warehouse.state,
            country: warehouse.country,
            postal_code: warehouse.postalCode,
            latitude: warehouse.latitude,
            longitude: warehouse.longitude,
            altitude: warehouse.altitude,
            contact_name: warehouse.contactName,
            contact_phone: warehouse.contactPhone,
            contact_email: warehouse.contactEmail,
            operating_hours: warehouse.operatingHours,
            capacity: warehouse.capacity,
            zones: warehouse.zones,
            is_active: warehouse.isActive,
            notes: warehouse.notes,
            created_at: warehouse.createdAt,
            updated_at: warehouse.updatedAt,
        };
    }
}
