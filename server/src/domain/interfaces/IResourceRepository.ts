import { Resource, ResourceType } from '../entities/Resource.js';

export interface ResourceFilters {
    type?: ResourceType;
    isActive?: boolean;
    search?: string;
}

/**
 * Resource repository interface - defines data access contract.
 * Implementations live in infrastructure layer.
 */
export interface IResourceRepository {
    findById(id: string, tenantId: string): Promise<Resource | null>;
    findAll(
        tenantId: string,
        filters?: ResourceFilters,
        limit?: number,
        offset?: number
    ): Promise<Resource[]>;
    count(tenantId: string, filters?: ResourceFilters): Promise<number>;
    save(resource: Resource): Promise<Resource>;
    update(resource: Resource): Promise<Resource>;
    delete(id: string, tenantId: string): Promise<void>;
}
