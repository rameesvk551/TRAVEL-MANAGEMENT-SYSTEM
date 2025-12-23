import { GearItem, GearCondition, GearOwnershipType, GearSize } from '../../entities/gear/GearItem.js';

export interface GearItemFilters {
    categoryId?: string;
    categoryType?: string;
    condition?: GearCondition | GearCondition[];
    ownershipType?: GearOwnershipType;
    size?: GearSize;
    warehouseId?: string;
    isSafetyCritical?: boolean;
    isRentable?: boolean;
    isActive?: boolean;
    inspectionOverdue?: boolean;
    maintenanceOverdue?: boolean;
    search?: string;
    sku?: string;
    barcode?: string;
    serialNumber?: string;
}

export interface GearItemAvailabilityQuery {
    tenantId: string;
    categoryId?: string;
    warehouseId?: string;
    size?: GearSize;
    startDate: Date;
    endDate: Date;
    quantity?: number;
    excludeSafetyCriticalWithOverdueInspection?: boolean;
}

export interface IGearItemRepository {
    findById(id: string, tenantId: string): Promise<GearItem | null>;
    findByIds(ids: string[], tenantId: string): Promise<GearItem[]>;
    findBySku(sku: string, tenantId: string): Promise<GearItem | null>;
    findByBarcode(barcode: string, tenantId: string): Promise<GearItem | null>;
    findAll(
        tenantId: string,
        filters?: GearItemFilters,
        limit?: number,
        offset?: number
    ): Promise<GearItem[]>;
    count(tenantId: string, filters?: GearItemFilters): Promise<number>;
    findAvailable(query: GearItemAvailabilityQuery): Promise<GearItem[]>;
    findWithOverdueInspection(tenantId: string): Promise<GearItem[]>;
    findWithOverdueMaintenance(tenantId: string): Promise<GearItem[]>;
    findUnsafe(tenantId: string): Promise<GearItem[]>;
    save(item: GearItem): Promise<GearItem>;
    saveMany(items: GearItem[]): Promise<GearItem[]>;
    update(item: GearItem): Promise<GearItem>;
    updateCondition(
        id: string,
        tenantId: string,
        condition: GearCondition,
        conditionScore: number
    ): Promise<void>;
    updateUsageStats(
        id: string,
        tenantId: string,
        tripDays: number
    ): Promise<void>;
    retire(id: string, tenantId: string): Promise<void>;
}
