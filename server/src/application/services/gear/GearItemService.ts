import { GearItem, GearItemProps, GearCondition, GearOwnershipType, GearSize } from '../../../domain/entities/gear/GearItem.js';
import { GearInventory } from '../../../domain/entities/gear/GearInventory.js';
import { GearAuditLog } from '../../../domain/entities/gear/GearAuditLog.js';
import { GearItemRepository } from '../../../infrastructure/repositories/gear/GearItemRepository.js';
import { GearInventoryRepository } from '../../../infrastructure/repositories/gear/GearInventoryRepository.js';
import { GearCategoryRepository } from '../../../infrastructure/repositories/gear/GearCategoryRepository.js';
import { GearItemFilters } from '../../../domain/interfaces/gear/IGearItemRepository.js';
import { ValidationError, NotFoundError } from '../../../shared/errors/index.js';
import { parsePagination, PaginatedResult, Pagination } from '../../../shared/types/index.js';

export interface CreateGearItemDTO {
    categoryId: string;
    sku: string;
    name: string;
    model?: string;
    brand?: string;
    serialNumber?: string;
    barcode?: string;
    ownershipType: GearOwnershipType;
    vendorId?: string;
    size?: GearSize;
    sizeValue?: string;
    color?: string;
    condition: GearCondition;
    conditionScore: number;
    purchaseDate?: Date;
    purchasePrice?: number;
    currentValue?: number;
    currency?: string;
    warrantyExpiry?: Date;
    expectedLifespanDays?: number;
    expectedLifespanTrips?: number;
    isSafetyCritical?: boolean;
    isRentable?: boolean;
    rentalPricePerDay?: number;
    rentalPricePerTrip?: number;
    depositAmount?: number;
    specifications?: Record<string, unknown>;
    notes?: string;
    warehouseId?: string;
}

export interface UpdateGearItemDTO extends Partial<CreateGearItemDTO> {
    isActive?: boolean;
}

export interface GearItemWithInventory {
    item: GearItem;
    inventory?: GearInventory;
}

export class GearItemService {
    constructor(
        private itemRepository: GearItemRepository,
        private inventoryRepository: GearInventoryRepository,
        private categoryRepository: GearCategoryRepository
    ) {}

    async create(dto: CreateGearItemDTO, tenantId: string, userId?: string): Promise<GearItem> {
        // Validate category exists
        const category = await this.categoryRepository.findById(dto.categoryId, tenantId);
        if (!category) {
            throw new ValidationError('Category not found');
        }

        // Check SKU uniqueness
        const existingSku = await this.itemRepository.findBySku(dto.sku, tenantId);
        if (existingSku) {
            throw new ValidationError(`SKU ${dto.sku} already exists`);
        }

        // Calculate next inspection/maintenance dates based on category
        const now = new Date();
        const nextInspectionDue = new Date(now);
        nextInspectionDue.setDate(nextInspectionDue.getDate() + category.inspectionIntervalDays);
        
        const nextMaintenanceDue = new Date(now);
        nextMaintenanceDue.setDate(nextMaintenanceDue.getDate() + category.maintenanceIntervalDays);

        const item = GearItem.create({
            tenantId,
            categoryId: dto.categoryId,
            sku: dto.sku,
            name: dto.name,
            model: dto.model,
            brand: dto.brand,
            serialNumber: dto.serialNumber,
            barcode: dto.barcode,
            ownershipType: dto.ownershipType,
            vendorId: dto.vendorId,
            size: dto.size,
            sizeValue: dto.sizeValue,
            color: dto.color,
            condition: dto.condition,
            conditionScore: dto.conditionScore,
            purchaseDate: dto.purchaseDate,
            purchasePrice: dto.purchasePrice,
            currentValue: dto.currentValue ?? dto.purchasePrice,
            currency: dto.currency,
            warrantyExpiry: dto.warrantyExpiry,
            expectedLifespanDays: dto.expectedLifespanDays,
            expectedLifespanTrips: dto.expectedLifespanTrips,
            isSafetyCritical: dto.isSafetyCritical ?? category.isSafetyCritical,
            isRentable: dto.isRentable,
            rentalPricePerDay: dto.rentalPricePerDay,
            rentalPricePerTrip: dto.rentalPricePerTrip,
            depositAmount: dto.depositAmount,
            specifications: dto.specifications,
            notes: dto.notes,
            warehouseId: dto.warehouseId,
            nextInspectionDue,
            nextMaintenanceDue,
        });

        const savedItem = await this.itemRepository.save(item);

        // Create initial inventory record
        const inventory = GearInventory.create({
            tenantId,
            gearItemId: savedItem.id,
            warehouseId: dto.warehouseId,
            status: 'AVAILABLE',
            statusChangedBy: userId,
            statusReason: 'Initial creation',
        });
        await this.inventoryRepository.save(inventory);

        return savedItem;
    }

    async update(
        id: string,
        dto: UpdateGearItemDTO,
        tenantId: string,
        userId?: string
    ): Promise<GearItem> {
        const existing = await this.itemRepository.findById(id, tenantId);
        if (!existing) {
            throw new NotFoundError('Gear item not found');
        }

        // Check SKU uniqueness if changing
        if (dto.sku && dto.sku !== existing.sku) {
            const existingSku = await this.itemRepository.findBySku(dto.sku, tenantId);
            if (existingSku) {
                throw new ValidationError(`SKU ${dto.sku} already exists`);
            }
        }

        const updated = GearItem.create({
            ...existing,
            ...dto,
            id: existing.id,
            tenantId: existing.tenantId,
            createdAt: existing.createdAt,
        });

        return this.itemRepository.update(updated);
    }

    async getById(id: string, tenantId: string): Promise<GearItemWithInventory> {
        const item = await this.itemRepository.findById(id, tenantId);
        if (!item) {
            throw new NotFoundError('Gear item not found');
        }

        const inventory = await this.inventoryRepository.findByGearItemId(id, tenantId);
        return { item, inventory: inventory ?? undefined };
    }

    async getByBarcode(barcode: string, tenantId: string): Promise<GearItemWithInventory> {
        const item = await this.itemRepository.findByBarcode(barcode, tenantId);
        if (!item) {
            throw new NotFoundError('Gear item not found');
        }

        const inventory = await this.inventoryRepository.findByGearItemId(item.id, tenantId);
        return { item, inventory: inventory ?? undefined };
    }

    async getAll(
        tenantId: string,
        filters?: GearItemFilters,
        pagination?: Pagination
    ): Promise<PaginatedResult<GearItem>> {
        const limit = pagination?.limit ?? 50;
        const offset = pagination?.offset ?? 0;

        const [items, total] = await Promise.all([
            this.itemRepository.findAll(tenantId, filters, limit, offset),
            this.itemRepository.count(tenantId, filters),
        ]);

        return {
            data: items,
            total,
            page: Math.floor(offset / limit) + 1,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getAvailableForTrip(
        tenantId: string,
        categoryId: string,
        startDate: Date,
        endDate: Date,
        quantity: number
    ): Promise<GearItem[]> {
        return this.itemRepository.findAvailable({
            tenantId,
            categoryId,
            startDate,
            endDate,
            quantity,
            excludeSafetyCriticalWithOverdueInspection: true,
        });
    }

    async updateCondition(
        id: string,
        tenantId: string,
        condition: GearCondition,
        conditionScore: number,
        userId?: string
    ): Promise<void> {
        const item = await this.itemRepository.findById(id, tenantId);
        if (!item) {
            throw new NotFoundError('Gear item not found');
        }

        await this.itemRepository.updateCondition(id, tenantId, condition, conditionScore);

        // Update inventory status if unsafe
        if (condition === 'UNSAFE' || condition === 'RETIRED') {
            await this.inventoryRepository.updateStatus(tenantId, {
                gearItemId: id,
                status: condition === 'RETIRED' ? 'RETIRED' : 'DAMAGED',
                statusChangedBy: userId,
                statusReason: `Condition changed to ${condition}`,
            });
        }
    }

    async getUnsafeGear(tenantId: string): Promise<GearItem[]> {
        return this.itemRepository.findUnsafe(tenantId);
    }

    async getInspectionOverdue(tenantId: string): Promise<GearItem[]> {
        return this.itemRepository.findWithOverdueInspection(tenantId);
    }

    async getMaintenanceOverdue(tenantId: string): Promise<GearItem[]> {
        return this.itemRepository.findWithOverdueMaintenance(tenantId);
    }

    async retire(id: string, tenantId: string, userId?: string): Promise<void> {
        const item = await this.itemRepository.findById(id, tenantId);
        if (!item) {
            throw new NotFoundError('Gear item not found');
        }

        await this.itemRepository.retire(id, tenantId);
        await this.inventoryRepository.updateStatus(tenantId, {
            gearItemId: id,
            status: 'RETIRED',
            statusChangedBy: userId,
            statusReason: 'Item retired',
        });
    }
}
