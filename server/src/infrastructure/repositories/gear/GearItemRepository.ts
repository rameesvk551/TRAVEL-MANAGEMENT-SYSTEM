import { query } from '../../database/index.js';
import { GearItem, GearCondition, GearOwnershipType, GearSize } from '../../../domain/entities/gear/GearItem.js';
import { 
    IGearItemRepository, 
    GearItemFilters,
    GearItemAvailabilityQuery 
} from '../../../domain/interfaces/gear/IGearItemRepository.js';

function toEntity(row: Record<string, unknown>): GearItem {
    return GearItem.fromPersistence({
        id: row.id as string,
        tenantId: row.tenant_id as string,
        categoryId: row.category_id as string,
        sku: row.sku as string,
        name: row.name as string,
        model: row.model as string,
        brand: row.brand as string,
        serialNumber: row.serial_number as string | undefined,
        barcode: row.barcode as string | undefined,
        qrCode: row.qr_code as string | undefined,
        rfidTag: row.rfid_tag as string | undefined,
        ownershipType: row.ownership_type as GearOwnershipType,
        vendorId: row.vendor_id as string | undefined,
        size: row.size as GearSize | undefined,
        sizeValue: row.size_value as string | undefined,
        color: row.color as string | undefined,
        condition: row.condition as GearCondition,
        conditionScore: row.condition_score as number,
        purchaseDate: row.purchase_date as Date | undefined,
        purchasePrice: parseFloat(row.purchase_price as string) || 0,
        currentValue: parseFloat(row.current_value as string) || 0,
        currency: row.currency as string,
        warrantyExpiry: row.warranty_expiry as Date | undefined,
        expectedLifespanDays: row.expected_lifespan_days as number,
        expectedLifespanTrips: row.expected_lifespan_trips as number,
        totalTripsUsed: row.total_trips_used as number,
        totalDaysUsed: row.total_days_used as number,
        lastInspectionDate: row.last_inspection_date as Date | undefined,
        nextInspectionDue: row.next_inspection_due as Date | undefined,
        lastMaintenanceDate: row.last_maintenance_date as Date | undefined,
        nextMaintenanceDue: row.next_maintenance_due as Date | undefined,
        isSafetyCritical: row.is_safety_critical as boolean,
        isRentable: row.is_rentable as boolean,
        rentalPricePerDay: parseFloat(row.rental_price_per_day as string) || 0,
        rentalPricePerTrip: parseFloat(row.rental_price_per_trip as string) || 0,
        depositAmount: parseFloat(row.deposit_amount as string) || 0,
        specifications: row.specifications as Record<string, unknown>,
        notes: row.notes as string,
        images: row.images as string[],
        documents: row.documents as string[],
        warehouseId: row.warehouse_id as string | undefined,
        locationId: row.location_id as string | undefined,
        isActive: row.is_active as boolean,
        createdAt: row.created_at as Date,
        updatedAt: row.updated_at as Date,
    });
}

export class GearItemRepository implements IGearItemRepository {
    async findById(id: string, tenantId: string): Promise<GearItem | null> {
        const sql = `SELECT * FROM gear_items WHERE id = $1 AND tenant_id = $2`;
        const result = await query(sql, [id, tenantId]);
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByIds(ids: string[], tenantId: string): Promise<GearItem[]> {
        if (ids.length === 0) return [];
        const sql = `SELECT * FROM gear_items WHERE id = ANY($1) AND tenant_id = $2`;
        const result = await query(sql, [ids, tenantId]);
        return result.rows.map(toEntity);
    }

    async findBySku(sku: string, tenantId: string): Promise<GearItem | null> {
        const sql = `SELECT * FROM gear_items WHERE sku = $1 AND tenant_id = $2`;
        const result = await query(sql, [sku, tenantId]);
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByBarcode(barcode: string, tenantId: string): Promise<GearItem | null> {
        const sql = `SELECT * FROM gear_items WHERE barcode = $1 AND tenant_id = $2`;
        const result = await query(sql, [barcode, tenantId]);
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(
        tenantId: string,
        filters?: GearItemFilters,
        limit = 50,
        offset = 0
    ): Promise<GearItem[]> {
        let sql = `SELECT * FROM gear_items WHERE tenant_id = $1`;
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters?.categoryId) {
            sql += ` AND category_id = $${paramIndex++}`;
            params.push(filters.categoryId);
        }
        if (filters?.condition) {
            if (Array.isArray(filters.condition)) {
                sql += ` AND condition = ANY($${paramIndex++})`;
                params.push(filters.condition);
            } else {
                sql += ` AND condition = $${paramIndex++}`;
                params.push(filters.condition);
            }
        }
        if (filters?.ownershipType) {
            sql += ` AND ownership_type = $${paramIndex++}`;
            params.push(filters.ownershipType);
        }
        if (filters?.warehouseId) {
            sql += ` AND warehouse_id = $${paramIndex++}`;
            params.push(filters.warehouseId);
        }
        if (filters?.isSafetyCritical !== undefined) {
            sql += ` AND is_safety_critical = $${paramIndex++}`;
            params.push(filters.isSafetyCritical);
        }
        if (filters?.isRentable !== undefined) {
            sql += ` AND is_rentable = $${paramIndex++}`;
            params.push(filters.isRentable);
        }
        if (filters?.isActive !== undefined) {
            sql += ` AND is_active = $${paramIndex++}`;
            params.push(filters.isActive);
        }
        if (filters?.inspectionOverdue) {
            sql += ` AND next_inspection_due < NOW()`;
        }
        if (filters?.maintenanceOverdue) {
            sql += ` AND next_maintenance_due < NOW()`;
        }
        if (filters?.search) {
            sql += ` AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} OR brand ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        sql += ` ORDER BY name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        return result.rows.map(toEntity);
    }

    async count(tenantId: string, filters?: GearItemFilters): Promise<number> {
        let sql = `SELECT COUNT(*) FROM gear_items WHERE tenant_id = $1`;
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters?.categoryId) {
            sql += ` AND category_id = $${paramIndex++}`;
            params.push(filters.categoryId);
        }
        if (filters?.isActive !== undefined) {
            sql += ` AND is_active = $${paramIndex++}`;
            params.push(filters.isActive);
        }

        const result = await query(sql, params);
        return parseInt(result.rows[0].count, 10);
    }

    async findAvailable(q: GearItemAvailabilityQuery): Promise<GearItem[]> {
        const sql = `
            SELECT gi.* FROM gear_items gi
            JOIN gear_inventory inv ON gi.id = inv.gear_item_id
            WHERE gi.tenant_id = $1
            AND inv.status = 'AVAILABLE'
            AND gi.condition NOT IN ('UNSAFE', 'RETIRED')
            AND gi.is_active = true
            ${q.categoryId ? 'AND gi.category_id = $2' : ''}
            ${q.warehouseId ? `AND inv.warehouse_id = $${q.categoryId ? 3 : 2}` : ''}
            ${q.excludeSafetyCriticalWithOverdueInspection ? 
                `AND NOT (gi.is_safety_critical = true AND gi.next_inspection_due < NOW())` : ''}
            ORDER BY gi.condition_score DESC
        `;
        const params: unknown[] = [q.tenantId];
        if (q.categoryId) params.push(q.categoryId);
        if (q.warehouseId) params.push(q.warehouseId);

        const result = await query(sql, params);
        return result.rows.map(toEntity);
    }

    async findWithOverdueInspection(tenantId: string): Promise<GearItem[]> {
        const sql = `
            SELECT * FROM gear_items 
            WHERE tenant_id = $1 
            AND next_inspection_due < NOW() 
            AND is_active = true
            ORDER BY next_inspection_due ASC
        `;
        const result = await query(sql, [tenantId]);
        return result.rows.map(toEntity);
    }

    async findWithOverdueMaintenance(tenantId: string): Promise<GearItem[]> {
        const sql = `
            SELECT * FROM gear_items 
            WHERE tenant_id = $1 
            AND next_maintenance_due < NOW() 
            AND is_active = true
            ORDER BY next_maintenance_due ASC
        `;
        const result = await query(sql, [tenantId]);
        return result.rows.map(toEntity);
    }

    async findUnsafe(tenantId: string): Promise<GearItem[]> {
        const sql = `
            SELECT * FROM gear_items 
            WHERE tenant_id = $1 
            AND (condition = 'UNSAFE' OR (is_safety_critical = true AND next_inspection_due < NOW()))
            AND is_active = true
        `;
        const result = await query(sql, [tenantId]);
        return result.rows.map(toEntity);
    }

    async save(item: GearItem): Promise<GearItem> {
        const sql = `
            INSERT INTO gear_items (
                id, tenant_id, category_id, sku, name, model, brand,
                serial_number, barcode, qr_code, rfid_tag,
                ownership_type, vendor_id, size, size_value, color,
                condition, condition_score, purchase_date, purchase_price,
                current_value, currency, warranty_expiry,
                expected_lifespan_days, expected_lifespan_trips,
                total_trips_used, total_days_used,
                last_inspection_date, next_inspection_due,
                last_maintenance_date, next_maintenance_due,
                is_safety_critical, is_rentable,
                rental_price_per_day, rental_price_per_trip, deposit_amount,
                specifications, notes, images, documents,
                warehouse_id, location_id, is_active
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
                $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35,
                $36, $37, $38, $39, $40, $41, $42, $43
            )
            RETURNING *
        `;
        const params = [
            item.id, item.tenantId, item.categoryId, item.sku, item.name,
            item.model, item.brand, item.serialNumber, item.barcode,
            item.qrCode, item.rfidTag, item.ownershipType, item.vendorId,
            item.size, item.sizeValue, item.color, item.condition,
            item.conditionScore, item.purchaseDate, item.purchasePrice,
            item.currentValue, item.currency, item.warrantyExpiry,
            item.expectedLifespanDays, item.expectedLifespanTrips,
            item.totalTripsUsed, item.totalDaysUsed, item.lastInspectionDate,
            item.nextInspectionDue, item.lastMaintenanceDate, item.nextMaintenanceDue,
            item.isSafetyCritical, item.isRentable, item.rentalPricePerDay,
            item.rentalPricePerTrip, item.depositAmount, item.specifications,
            item.notes, item.images, item.documents, item.warehouseId,
            item.locationId, item.isActive,
        ];
        const result = await query(sql, params);
        return toEntity(result.rows[0]);
    }

    async saveMany(items: GearItem[]): Promise<GearItem[]> {
        const results: GearItem[] = [];
        for (const item of items) {
            results.push(await this.save(item));
        }
        return results;
    }

    async update(item: GearItem): Promise<GearItem> {
        const sql = `
            UPDATE gear_items SET
                category_id = $3, sku = $4, name = $5, model = $6, brand = $7,
                serial_number = $8, barcode = $9, qr_code = $10, rfid_tag = $11,
                ownership_type = $12, vendor_id = $13, size = $14, size_value = $15,
                color = $16, condition = $17, condition_score = $18,
                purchase_date = $19, purchase_price = $20, current_value = $21,
                currency = $22, warranty_expiry = $23, expected_lifespan_days = $24,
                expected_lifespan_trips = $25, total_trips_used = $26, total_days_used = $27,
                last_inspection_date = $28, next_inspection_due = $29,
                last_maintenance_date = $30, next_maintenance_due = $31,
                is_safety_critical = $32, is_rentable = $33,
                rental_price_per_day = $34, rental_price_per_trip = $35,
                deposit_amount = $36, specifications = $37, notes = $38,
                images = $39, documents = $40, warehouse_id = $41,
                location_id = $42, is_active = $43
            WHERE id = $1 AND tenant_id = $2
            RETURNING *
        `;
        const params = [
            item.id, item.tenantId, item.categoryId, item.sku, item.name,
            item.model, item.brand, item.serialNumber, item.barcode,
            item.qrCode, item.rfidTag, item.ownershipType, item.vendorId,
            item.size, item.sizeValue, item.color, item.condition,
            item.conditionScore, item.purchaseDate, item.purchasePrice,
            item.currentValue, item.currency, item.warrantyExpiry,
            item.expectedLifespanDays, item.expectedLifespanTrips,
            item.totalTripsUsed, item.totalDaysUsed, item.lastInspectionDate,
            item.nextInspectionDue, item.lastMaintenanceDate, item.nextMaintenanceDue,
            item.isSafetyCritical, item.isRentable, item.rentalPricePerDay,
            item.rentalPricePerTrip, item.depositAmount, item.specifications,
            item.notes, item.images, item.documents, item.warehouseId,
            item.locationId, item.isActive,
        ];
        const result = await query(sql, params);
        return toEntity(result.rows[0]);
    }

    async updateCondition(
        id: string,
        tenantId: string,
        condition: GearCondition,
        conditionScore: number
    ): Promise<void> {
        const sql = `
            UPDATE gear_items 
            SET condition = $3, condition_score = $4
            WHERE id = $1 AND tenant_id = $2
        `;
        await query(sql, [id, tenantId, condition, conditionScore]);
    }

    async updateUsageStats(id: string, tenantId: string, tripDays: number): Promise<void> {
        const sql = `
            UPDATE gear_items 
            SET total_trips_used = total_trips_used + 1,
                total_days_used = total_days_used + $3
            WHERE id = $1 AND tenant_id = $2
        `;
        await query(sql, [id, tenantId, tripDays]);
    }

    async retire(id: string, tenantId: string): Promise<void> {
        const sql = `
            UPDATE gear_items 
            SET condition = 'RETIRED', is_active = false
            WHERE id = $1 AND tenant_id = $2
        `;
        await query(sql, [id, tenantId]);
    }
}
