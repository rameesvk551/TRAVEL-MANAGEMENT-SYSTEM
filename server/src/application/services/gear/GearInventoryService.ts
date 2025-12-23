import { GearInventory, GearInventoryStatus } from '../../../domain/entities/gear/GearInventory.js';
import { GearItem } from '../../../domain/entities/gear/GearItem.js';
import { GearInventoryRepository } from '../../../infrastructure/repositories/gear/GearInventoryRepository.js';
import { GearItemRepository } from '../../../infrastructure/repositories/gear/GearItemRepository.js';
import { GearCategoryRepository } from '../../../infrastructure/repositories/gear/GearCategoryRepository.js';
import { GearInventoryFilters } from '../../../domain/interfaces/gear/IGearInventoryRepository.js';
import { ValidationError } from '../../../shared/errors/index.js';

export interface InventorySummary {
    totalItems: number;
    byStatus: Record<GearInventoryStatus, number>;
    available: number;
    inUse: number;
    underMaintenance: number;
    damaged: number;
    rentedOut: number;
}

export interface AvailabilityQuery {
    categoryId?: string;
    warehouseId?: string;
    size?: string;
    startDate: Date;
    endDate: Date;
    quantity: number;
}

export interface AvailabilityResult {
    isAvailable: boolean;
    availableCount: number;
    requestedCount: number;
    availableItems: GearItem[];
    shortfall: number;
}

export interface WarehouseInventory {
    warehouseId: string;
    warehouseName: string;
    summary: InventorySummary;
    categories: {
        categoryId: string;
        categoryName: string;
        available: number;
        total: number;
    }[];
}

export class GearInventoryService {
    constructor(
        private inventoryRepository: GearInventoryRepository,
        private itemRepository: GearItemRepository,
        private categoryRepository: GearCategoryRepository
    ) {}

    async getSummary(tenantId: string, warehouseId?: string): Promise<InventorySummary> {
        const statusCounts = await this.inventoryRepository.countByStatus(tenantId, warehouseId);
        
        const totalItems = Object.values(statusCounts).reduce((a, b) => a + b, 0);
        
        return {
            totalItems,
            byStatus: statusCounts,
            available: statusCounts['AVAILABLE'] || 0,
            inUse: (statusCounts['IN_USE'] || 0) + (statusCounts['ASSIGNED'] || 0),
            underMaintenance: (statusCounts['UNDER_MAINTENANCE'] || 0) + (statusCounts['UNDER_INSPECTION'] || 0),
            damaged: statusCounts['DAMAGED'] || 0,
            rentedOut: statusCounts['RENTED_OUT'] || 0,
        };
    }

    async checkAvailability(
        tenantId: string,
        query: AvailabilityQuery
    ): Promise<AvailabilityResult> {
        const availableItems = await this.itemRepository.findAvailable({
            tenantId,
            categoryId: query.categoryId,
            warehouseId: query.warehouseId,
            startDate: query.startDate,
            endDate: query.endDate,
            excludeSafetyCriticalWithOverdueInspection: true,
        });

        const filteredItems = query.size 
            ? availableItems.filter(item => item.size === query.size)
            : availableItems;

        const availableCount = filteredItems.length;
        const shortfall = Math.max(0, query.quantity - availableCount);

        return {
            isAvailable: availableCount >= query.quantity,
            availableCount,
            requestedCount: query.quantity,
            availableItems: filteredItems.slice(0, query.quantity),
            shortfall,
        };
    }

    async getInventoryHeatmap(
        tenantId: string,
        warehouseId?: string
    ): Promise<{
        byCategory: Record<string, { available: number; total: number; utilizationPercent: number }>;
        byCondition: Record<string, number>;
        alerts: { type: string; count: number; message: string }[];
    }> {
        const items = await this.itemRepository.findAll(tenantId, { 
            warehouseId,
            isActive: true,
        }, 1000, 0);

        const inventories = await this.inventoryRepository.findByGearItemIds(
            items.map(i => i.id),
            tenantId
        );

        const inventoryMap = new Map(inventories.map(inv => [inv.gearItemId, inv]));
        const categories = await this.categoryRepository.findAll(tenantId);
        const categoryMap = new Map(categories.map(c => [c.id, c.name]));

        const byCategory: Record<string, { available: number; total: number; utilizationPercent: number }> = {};
        const byCondition: Record<string, number> = {};

        for (const item of items) {
            const categoryName = categoryMap.get(item.categoryId) || 'Unknown';
            const inventory = inventoryMap.get(item.id);
            const isAvailable = inventory?.status === 'AVAILABLE';

            if (!byCategory[categoryName]) {
                byCategory[categoryName] = { available: 0, total: 0, utilizationPercent: 0 };
            }
            byCategory[categoryName].total++;
            if (isAvailable) {
                byCategory[categoryName].available++;
            }

            byCondition[item.condition] = (byCondition[item.condition] || 0) + 1;
        }

        // Calculate utilization percentages
        for (const cat of Object.keys(byCategory)) {
            const { available, total } = byCategory[cat];
            byCategory[cat].utilizationPercent = total > 0 
                ? Math.round(((total - available) / total) * 100) 
                : 0;
        }

        // Generate alerts
        const alerts: { type: string; count: number; message: string }[] = [];

        const unsafeCount = byCondition['UNSAFE'] || 0;
        if (unsafeCount > 0) {
            alerts.push({
                type: 'danger',
                count: unsafeCount,
                message: `${unsafeCount} items marked as UNSAFE`,
            });
        }

        const overdueInspection = await this.itemRepository.findWithOverdueInspection(tenantId);
        if (overdueInspection.length > 0) {
            alerts.push({
                type: 'warning',
                count: overdueInspection.length,
                message: `${overdueInspection.length} items have overdue inspections`,
            });
        }

        const overdueMaintenance = await this.itemRepository.findWithOverdueMaintenance(tenantId);
        if (overdueMaintenance.length > 0) {
            alerts.push({
                type: 'warning',
                count: overdueMaintenance.length,
                message: `${overdueMaintenance.length} items need maintenance`,
            });
        }

        return { byCategory, byCondition, alerts };
    }

    async transferGear(
        gearItemId: string,
        toWarehouseId: string,
        tenantId: string,
        userId: string,
        reason?: string
    ): Promise<void> {
        const inventory = await this.inventoryRepository.findByGearItemId(gearItemId, tenantId);
        if (!inventory) {
            throw new ValidationError('Inventory record not found');
        }

        if (inventory.status !== 'AVAILABLE') {
            throw new ValidationError('Can only transfer available gear');
        }

        await this.inventoryRepository.updateStatus(tenantId, {
            gearItemId,
            status: 'IN_TRANSIT',
            statusChangedBy: userId,
            statusReason: `Transfer to warehouse ${toWarehouseId}. ${reason || ''}`,
        });

        // In a real system, this would create a transfer record
        // For now, we'll just update the warehouse directly
        // TODO: Implement proper transfer workflow
    }

    async releaseFromQuarantine(
        gearItemId: string,
        tenantId: string,
        userId: string,
        inspectionPassed: boolean,
        notes?: string
    ): Promise<void> {
        const inventory = await this.inventoryRepository.findByGearItemId(gearItemId, tenantId);
        if (!inventory) {
            throw new ValidationError('Inventory record not found');
        }

        if (inventory.status !== 'QUARANTINE') {
            throw new ValidationError('Item is not in quarantine');
        }

        const newStatus: GearInventoryStatus = inspectionPassed ? 'AVAILABLE' : 'UNDER_MAINTENANCE';

        await this.inventoryRepository.updateStatus(tenantId, {
            gearItemId,
            status: newStatus,
            statusChangedBy: userId,
            statusReason: notes || (inspectionPassed ? 'Inspection passed' : 'Requires maintenance'),
        });
    }

    async releaseExpiredReservations(tenantId: string): Promise<number> {
        return this.inventoryRepository.releaseExpiredReservations(tenantId);
    }
}
