import { GearCategory, GearCategoryProps, GearCategoryType } from '../../../domain/entities/gear/GearCategory.js';
import { GearCategoryRepository } from '../../../infrastructure/repositories/gear/GearCategoryRepository.js';
import { GearCategoryFilters } from '../../../domain/interfaces/gear/IGearCategoryRepository.js';
import { ValidationError, NotFoundError } from '../../../shared/errors/index.js';

export interface CreateGearCategoryDTO {
    name: string;
    type: GearCategoryType;
    parentId?: string;
    description?: string;
    isSafetyCritical: boolean;
    inspectionIntervalDays?: number;
    maintenanceIntervalDays?: number;
    attributes?: Record<string, unknown>;
}

export interface UpdateGearCategoryDTO extends Partial<CreateGearCategoryDTO> {
    isActive?: boolean;
}

export class GearCategoryService {
    constructor(private categoryRepository: GearCategoryRepository) {}

    async create(dto: CreateGearCategoryDTO, tenantId: string): Promise<GearCategory> {
        // Validate parent exists if provided
        if (dto.parentId) {
            const parent = await this.categoryRepository.findById(dto.parentId, tenantId);
            if (!parent) {
                throw new ValidationError('Parent category not found');
            }
        }

        const category = GearCategory.create({
            tenantId,
            name: dto.name,
            type: dto.type,
            parentId: dto.parentId,
            description: dto.description,
            isSafetyCritical: dto.isSafetyCritical,
            inspectionIntervalDays: dto.inspectionIntervalDays,
            maintenanceIntervalDays: dto.maintenanceIntervalDays,
            attributes: dto.attributes,
        });

        return this.categoryRepository.save(category);
    }

    async update(
        id: string,
        dto: UpdateGearCategoryDTO,
        tenantId: string
    ): Promise<GearCategory> {
        const existing = await this.categoryRepository.findById(id, tenantId);
        if (!existing) {
            throw new NotFoundError('Category not found');
        }

        const updated = GearCategory.create({
            id: existing.id,
            tenantId: existing.tenantId,
            name: dto.name ?? existing.name,
            type: dto.type ?? existing.type,
            parentId: dto.parentId ?? existing.parentId,
            description: dto.description ?? existing.description,
            isSafetyCritical: dto.isSafetyCritical ?? existing.isSafetyCritical,
            inspectionIntervalDays: dto.inspectionIntervalDays ?? existing.inspectionIntervalDays,
            maintenanceIntervalDays: dto.maintenanceIntervalDays ?? existing.maintenanceIntervalDays,
            attributes: dto.attributes ?? existing.attributes,
            isActive: dto.isActive ?? existing.isActive,
            createdAt: existing.createdAt,
        });

        return this.categoryRepository.update(updated);
    }

    async getById(id: string, tenantId: string): Promise<GearCategory> {
        const category = await this.categoryRepository.findById(id, tenantId);
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        return category;
    }

    async getAll(tenantId: string, filters?: GearCategoryFilters): Promise<GearCategory[]> {
        return this.categoryRepository.findAll(tenantId, filters);
    }

    async getByType(tenantId: string, type: GearCategoryType): Promise<GearCategory[]> {
        return this.categoryRepository.findByType(tenantId, type);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        const category = await this.categoryRepository.findById(id, tenantId);
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        
        // Check for children
        const children = await this.categoryRepository.findAll(tenantId, { parentId: id });
        if (children.length > 0) {
            throw new ValidationError('Cannot delete category with sub-categories');
        }

        await this.categoryRepository.delete(id, tenantId);
    }
}
