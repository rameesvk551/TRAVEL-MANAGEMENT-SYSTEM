import { GearWarehouse, WarehouseType } from '../../entities/gear/GearWarehouse.js';

export interface GearWarehouseFilters {
    type?: WarehouseType;
    isActive?: boolean;
    city?: string;
    country?: string;
    search?: string;
}

export interface IGearWarehouseRepository {
    findById(id: string, tenantId: string): Promise<GearWarehouse | null>;
    findByCode(code: string, tenantId: string): Promise<GearWarehouse | null>;
    findAll(tenantId: string, filters?: GearWarehouseFilters): Promise<GearWarehouse[]>;
    findActive(tenantId: string): Promise<GearWarehouse[]>;
    save(warehouse: GearWarehouse): Promise<GearWarehouse>;
    update(warehouse: GearWarehouse): Promise<GearWarehouse>;
    delete(id: string, tenantId: string): Promise<void>;
    getInventorySummary(
        warehouseId: string,
        tenantId: string
    ): Promise<{
        totalItems: number;
        availableItems: number;
        assignedItems: number;
        maintenanceItems: number;
        damagedItems: number;
    }>;
}
