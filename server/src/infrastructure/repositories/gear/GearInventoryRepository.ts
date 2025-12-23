import { query } from '../../database/index.js';
import { GearInventory, GearInventoryStatus } from '../../../domain/entities/gear/GearInventory.js';
import { 
    IGearInventoryRepository, 
    GearInventoryFilters,
    InventoryStatusUpdate 
} from '../../../domain/interfaces/gear/IGearInventoryRepository.js';

function toEntity(row: Record<string, unknown>): GearInventory {
    return GearInventory.fromPersistence({
        id: row.id as string,
        tenantId: row.tenant_id as string,
        gearItemId: row.gear_item_id as string,
        warehouseId: row.warehouse_id as string | undefined,
        locationId: row.location_id as string | undefined,
        zoneCode: row.zone_code as string | undefined,
        binCode: row.bin_code as string | undefined,
        shelfCode: row.shelf_code as string | undefined,
        status: row.status as GearInventoryStatus,
        previousStatus: row.previous_status as GearInventoryStatus | undefined,
        statusChangedAt: row.status_changed_at as Date,
        statusChangedBy: row.status_changed_by as string | undefined,
        statusReason: row.status_reason as string | undefined,
        tripId: row.trip_id as string | undefined,
        rentalId: row.rental_id as string | undefined,
        reservedUntil: row.reserved_until as Date | undefined,
        assignedToUserId: row.assigned_to_user_id as string | undefined,
        assignedToGuestId: row.assigned_to_guest_id as string | undefined,
        notes: row.notes as string,
        createdAt: row.created_at as Date,
        updatedAt: row.updated_at as Date,
    });
}

export class GearInventoryRepository implements IGearInventoryRepository {
    async findByGearItemId(gearItemId: string, tenantId: string): Promise<GearInventory | null> {
        const sql = `SELECT * FROM gear_inventory WHERE gear_item_id = $1 AND tenant_id = $2`;
        const result = await query(sql, [gearItemId, tenantId]);
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByGearItemIds(gearItemIds: string[], tenantId: string): Promise<GearInventory[]> {
        if (gearItemIds.length === 0) return [];
        const sql = `SELECT * FROM gear_inventory WHERE gear_item_id = ANY($1) AND tenant_id = $2`;
        const result = await query(sql, [gearItemIds, tenantId]);
        return result.rows.map(toEntity);
    }

    async findAll(
        tenantId: string,
        filters?: GearInventoryFilters,
        limit = 50,
        offset = 0
    ): Promise<GearInventory[]> {
        let sql = `SELECT * FROM gear_inventory WHERE tenant_id = $1`;
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters?.warehouseId) {
            sql += ` AND warehouse_id = $${paramIndex++}`;
            params.push(filters.warehouseId);
        }
        if (filters?.status) {
            if (Array.isArray(filters.status)) {
                sql += ` AND status = ANY($${paramIndex++})`;
                params.push(filters.status);
            } else {
                sql += ` AND status = $${paramIndex++}`;
                params.push(filters.status);
            }
        }
        if (filters?.tripId) {
            sql += ` AND trip_id = $${paramIndex++}`;
            params.push(filters.tripId);
        }
        if (filters?.rentalId) {
            sql += ` AND rental_id = $${paramIndex++}`;
            params.push(filters.rentalId);
        }

        sql += ` ORDER BY status_changed_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        return result.rows.map(toEntity);
    }

    async findByWarehouse(
        warehouseId: string,
        tenantId: string,
        status?: GearInventoryStatus[]
    ): Promise<GearInventory[]> {
        let sql = `SELECT * FROM gear_inventory WHERE warehouse_id = $1 AND tenant_id = $2`;
        const params: unknown[] = [warehouseId, tenantId];
        
        if (status && status.length > 0) {
            sql += ` AND status = ANY($3)`;
            params.push(status);
        }
        
        const result = await query(sql, params);
        return result.rows.map(toEntity);
    }

    async findByTrip(tripId: string, tenantId: string): Promise<GearInventory[]> {
        const sql = `SELECT * FROM gear_inventory WHERE trip_id = $1 AND tenant_id = $2`;
        const result = await query(sql, [tripId, tenantId]);
        return result.rows.map(toEntity);
    }

    async findByRental(rentalId: string, tenantId: string): Promise<GearInventory[]> {
        const sql = `SELECT * FROM gear_inventory WHERE rental_id = $1 AND tenant_id = $2`;
        const result = await query(sql, [rentalId, tenantId]);
        return result.rows.map(toEntity);
    }

    async countByStatus(
        tenantId: string,
        warehouseId?: string
    ): Promise<Record<GearInventoryStatus, number>> {
        let sql = `
            SELECT status, COUNT(*) as count 
            FROM gear_inventory 
            WHERE tenant_id = $1
        `;
        const params: unknown[] = [tenantId];
        
        if (warehouseId) {
            sql += ` AND warehouse_id = $2`;
            params.push(warehouseId);
        }
        
        sql += ` GROUP BY status`;
        const result = await query(sql, params);
        
        const counts = {} as Record<GearInventoryStatus, number>;
        for (const row of result.rows) {
            counts[row.status as GearInventoryStatus] = parseInt(row.count, 10);
        }
        return counts;
    }

    async save(inventory: GearInventory): Promise<GearInventory> {
        const sql = `
            INSERT INTO gear_inventory (
                id, tenant_id, gear_item_id, warehouse_id, location_id,
                zone_code, shelf_code, bin_code, status, previous_status,
                status_changed_at, status_changed_by, status_reason,
                trip_id, rental_id, reserved_until,
                assigned_to_user_id, assigned_to_guest_id, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (gear_item_id) DO UPDATE SET
                warehouse_id = EXCLUDED.warehouse_id,
                location_id = EXCLUDED.location_id,
                zone_code = EXCLUDED.zone_code,
                shelf_code = EXCLUDED.shelf_code,
                bin_code = EXCLUDED.bin_code,
                status = EXCLUDED.status,
                previous_status = gear_inventory.status,
                status_changed_at = EXCLUDED.status_changed_at,
                status_changed_by = EXCLUDED.status_changed_by,
                status_reason = EXCLUDED.status_reason,
                trip_id = EXCLUDED.trip_id,
                rental_id = EXCLUDED.rental_id,
                reserved_until = EXCLUDED.reserved_until,
                assigned_to_user_id = EXCLUDED.assigned_to_user_id,
                assigned_to_guest_id = EXCLUDED.assigned_to_guest_id,
                notes = EXCLUDED.notes
            RETURNING *
        `;
        const params = [
            inventory.id, inventory.tenantId, inventory.gearItemId,
            inventory.warehouseId, inventory.locationId, inventory.zoneCode,
            inventory.shelfCode, inventory.binCode, inventory.status,
            inventory.previousStatus, inventory.statusChangedAt,
            inventory.statusChangedBy, inventory.statusReason,
            inventory.tripId, inventory.rentalId, inventory.reservedUntil,
            inventory.assignedToUserId, inventory.assignedToGuestId, inventory.notes,
        ];
        const result = await query(sql, params);
        return toEntity(result.rows[0]);
    }

    async updateStatus(tenantId: string, update: InventoryStatusUpdate): Promise<GearInventory> {
        const sql = `
            UPDATE gear_inventory SET
                previous_status = status,
                status = $3,
                status_changed_at = NOW(),
                status_changed_by = $4,
                status_reason = $5,
                trip_id = COALESCE($6, trip_id),
                rental_id = COALESCE($7, rental_id),
                reserved_until = $8,
                assigned_to_user_id = $9,
                assigned_to_guest_id = $10
            WHERE gear_item_id = $1 AND tenant_id = $2
            RETURNING *
        `;
        const params = [
            update.gearItemId, tenantId, update.status,
            update.statusChangedBy, update.statusReason,
            update.tripId, update.rentalId, update.reservedUntil,
            update.assignedToUserId, update.assignedToGuestId,
        ];
        const result = await query(sql, params);
        return toEntity(result.rows[0]);
    }

    async updateStatusBatch(tenantId: string, updates: InventoryStatusUpdate[]): Promise<void> {
        for (const update of updates) {
            await this.updateStatus(tenantId, update);
        }
    }

    async releaseExpiredReservations(tenantId: string): Promise<number> {
        const sql = `
            UPDATE gear_inventory SET
                previous_status = status,
                status = 'AVAILABLE',
                status_changed_at = NOW(),
                status_reason = 'Reservation expired',
                reserved_until = NULL,
                trip_id = NULL,
                assigned_to_user_id = NULL,
                assigned_to_guest_id = NULL
            WHERE tenant_id = $1
            AND status = 'RESERVED'
            AND reserved_until < NOW()
        `;
        const result = await query(sql, [tenantId]);
        return result.rowCount ?? 0;
    }
}
