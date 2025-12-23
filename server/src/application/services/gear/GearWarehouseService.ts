import { GearWarehouse, WarehouseType } from '../../../domain/entities/gear/GearWarehouse.js';
import { IGearWarehouseRepository, GearWarehouseFilters } from '../../../domain/interfaces/gear/IGearWarehouseRepository.js';
import { IGearInventoryRepository } from '../../../domain/interfaces/gear/IGearInventoryRepository.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/index.js';

interface CreateWarehouseDTO {
    name: string;
    code: string;
    type: WarehouseType;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    operatingHours?: string;
    capacity: number;
    zones?: string[];
    notes?: string;
}

interface UpdateWarehouseDTO {
    name?: string;
    type?: WarehouseType;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    operatingHours?: string;
    capacity?: number;
    zones?: string[];
    notes?: string;
}

export class GearWarehouseService {
    constructor(
        private warehouseRepository: IGearWarehouseRepository,
        private inventoryRepository: IGearInventoryRepository
    ) {}

    async createWarehouse(tenantId: string, dto: CreateWarehouseDTO): Promise<GearWarehouse> {
        // Check code uniqueness
        const existing = await this.warehouseRepository.findByCode(dto.code, tenantId);
        if (existing) {
            throw new ValidationError(`Warehouse with code ${dto.code} already exists`);
        }

        const warehouse = GearWarehouse.create({
            tenantId,
            name: dto.name,
            code: dto.code.toUpperCase(),
            type: dto.type,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            country: dto.country,
            postalCode: dto.postalCode || '',
            latitude: dto.latitude,
            longitude: dto.longitude,
            altitude: dto.altitude,
            contactName: dto.contactName,
            contactPhone: dto.contactPhone,
            contactEmail: dto.contactEmail || '',
            operatingHours: dto.operatingHours || '',
            capacity: dto.capacity,
            zones: dto.zones || [],
            notes: dto.notes || '',
        });

        await this.warehouseRepository.save(warehouse);
        return warehouse;
    }

    async updateWarehouse(
        warehouseId: string,
        tenantId: string,
        dto: UpdateWarehouseDTO
    ): Promise<GearWarehouse> {
        const warehouse = await this.warehouseRepository.findById(warehouseId, tenantId);
        if (!warehouse) {
            throw new NotFoundError('Warehouse', warehouseId);
        }

        warehouse.update(dto);
        await this.warehouseRepository.save(warehouse);
        return warehouse;
    }

    async deactivateWarehouse(warehouseId: string, tenantId: string): Promise<void> {
        const warehouse = await this.warehouseRepository.findById(warehouseId, tenantId);
        if (!warehouse) {
            throw new NotFoundError('Warehouse', warehouseId);
        }

        // Check if warehouse has active inventory
        const inventoryCount = await this.warehouseRepository.getInventoryCount(warehouseId, tenantId);
        if (inventoryCount > 0) {
            throw new ValidationError(
                `Cannot deactivate warehouse with ${inventoryCount} items. Transfer items first.`
            );
        }

        warehouse.deactivate();
        await this.warehouseRepository.save(warehouse);
    }

    async reactivateWarehouse(warehouseId: string, tenantId: string): Promise<GearWarehouse> {
        const warehouse = await this.warehouseRepository.findById(warehouseId, tenantId);
        if (!warehouse) {
            throw new NotFoundError('Warehouse', warehouseId);
        }

        warehouse.activate();
        await this.warehouseRepository.save(warehouse);
        return warehouse;
    }

    async getWarehouse(warehouseId: string, tenantId: string): Promise<GearWarehouse> {
        const warehouse = await this.warehouseRepository.findById(warehouseId, tenantId);
        if (!warehouse) {
            throw new NotFoundError('Warehouse', warehouseId);
        }
        return warehouse;
    }

    async getWarehouses(tenantId: string, filters?: GearWarehouseFilters): Promise<GearWarehouse[]> {
        return this.warehouseRepository.findAll(tenantId, filters);
    }

    async getActiveWarehouses(tenantId: string): Promise<GearWarehouse[]> {
        return this.warehouseRepository.findActive(tenantId);
    }

    async getWarehousesByType(type: WarehouseType, tenantId: string): Promise<GearWarehouse[]> {
        return this.warehouseRepository.findByType(type, tenantId);
    }

    async findNearbyWarehouses(
        latitude: number,
        longitude: number,
        radiusKm: number,
        tenantId: string
    ): Promise<GearWarehouse[]> {
        return this.warehouseRepository.findNearby(latitude, longitude, radiusKm, tenantId);
    }

    async getWarehouseStats(warehouseId: string, tenantId: string): Promise<{
        warehouse: GearWarehouse;
        inventoryCount: number;
        capacityUtilization: number;
        statusBreakdown: Record<string, number>;
    }> {
        const warehouse = await this.warehouseRepository.findById(warehouseId, tenantId);
        if (!warehouse) {
            throw new NotFoundError('Warehouse', warehouseId);
        }

        const inventoryCount = await this.warehouseRepository.getInventoryCount(warehouseId, tenantId);
        const capacityUtilization = await this.warehouseRepository.getCapacityUtilization(warehouseId, tenantId);
        
        const summary = await this.inventoryRepository.getSummary(tenantId, warehouseId);

        return {
            warehouse,
            inventoryCount,
            capacityUtilization,
            statusBreakdown: summary.byStatus as Record<string, number>,
        };
    }

    async transferGear(
        gearItemId: string,
        fromWarehouseId: string,
        toWarehouseId: string,
        tenantId: string,
        reason?: string
    ): Promise<void> {
        // Validate both warehouses exist
        const fromWarehouse = await this.warehouseRepository.findById(fromWarehouseId, tenantId);
        if (!fromWarehouse) {
            throw new NotFoundError('Source warehouse', fromWarehouseId);
        }

        const toWarehouse = await this.warehouseRepository.findById(toWarehouseId, tenantId);
        if (!toWarehouse) {
            throw new NotFoundError('Destination warehouse', toWarehouseId);
        }

        if (!toWarehouse.isActive) {
            throw new ValidationError('Destination warehouse is not active');
        }

        // Check capacity
        const toInventoryCount = await this.warehouseRepository.getInventoryCount(toWarehouseId, tenantId);
        if (toInventoryCount >= toWarehouse.capacity) {
            throw new ValidationError('Destination warehouse is at capacity');
        }

        // Update inventory
        await this.inventoryRepository.transfer(gearItemId, toWarehouseId, tenantId, reason);
    }
}
