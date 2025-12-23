import { GearCategory, GearCategoryType } from '../../entities/gear/GearCategory.js';

export interface GearCategoryFilters {
    type?: GearCategoryType;
    parentId?: string;
    isSafetyCritical?: boolean;
    isActive?: boolean;
    search?: string;
}

export interface IGearCategoryRepository {
    findById(id: string, tenantId: string): Promise<GearCategory | null>;
    findAll(tenantId: string, filters?: GearCategoryFilters): Promise<GearCategory[]>;
    findByType(tenantId: string, type: GearCategoryType): Promise<GearCategory[]>;
    save(category: GearCategory): Promise<GearCategory>;
    update(category: GearCategory): Promise<GearCategory>;
    delete(id: string, tenantId: string): Promise<void>;
}
