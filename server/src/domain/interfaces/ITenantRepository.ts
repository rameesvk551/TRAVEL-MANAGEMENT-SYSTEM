import { Tenant } from '../entities/Tenant.js';

/**
 * Tenant repository interface - defines data access contract.
 */
export interface ITenantRepository {
    findById(id: string): Promise<Tenant | null>;
    findBySlug(slug: string): Promise<Tenant | null>;
    findAll(): Promise<Tenant[]>;
    save(tenant: Tenant): Promise<Tenant>;
    update(tenant: Tenant): Promise<Tenant>;
}
