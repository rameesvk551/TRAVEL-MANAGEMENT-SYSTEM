import { GearInventory, GearInventoryStatus } from '../../entities/gear/GearInventory.js';

export interface GearInventoryFilters {
    warehouseId?: string;
    status?: GearInventoryStatus | GearInventoryStatus[];
    tripId?: string;
    rentalId?: string;
    assignedToUserId?: string;
}

export interface InventoryStatusUpdate {
    gearItemId: string;
    status: GearInventoryStatus;
    previousStatus?: GearInventoryStatus;
    statusChangedBy?: string;
    statusReason?: string;
    tripId?: string;
    rentalId?: string;
    reservedUntil?: Date;
    assignedToUserId?: string;
    assignedToGuestId?: string;
}

export interface IGearInventoryRepository {
    findByGearItemId(gearItemId: string, tenantId: string): Promise<GearInventory | null>;
    findByGearItemIds(gearItemIds: string[], tenantId: string): Promise<GearInventory[]>;
    findAll(
        tenantId: string,
        filters?: GearInventoryFilters,
        limit?: number,
        offset?: number
    ): Promise<GearInventory[]>;
    findByWarehouse(
        warehouseId: string,
        tenantId: string,
        status?: GearInventoryStatus[]
    ): Promise<GearInventory[]>;
    findByTrip(tripId: string, tenantId: string): Promise<GearInventory[]>;
    findByRental(rentalId: string, tenantId: string): Promise<GearInventory[]>;
    countByStatus(tenantId: string, warehouseId?: string): Promise<Record<GearInventoryStatus, number>>;
    save(inventory: GearInventory): Promise<GearInventory>;
    updateStatus(tenantId: string, update: InventoryStatusUpdate): Promise<GearInventory>;
    updateStatusBatch(tenantId: string, updates: InventoryStatusUpdate[]): Promise<void>;
    releaseExpiredReservations(tenantId: string): Promise<number>;
}
