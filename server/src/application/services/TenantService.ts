import { ITenantRepository } from '../../domain/interfaces/ITenantRepository.js';
import { Tenant } from '../../domain/entities/Tenant.js';
import { NotFoundError } from '../../shared/errors/index.js';

/**
 * Tenant service - handles tenant lookup and validation.
 */
export class TenantService {
    constructor(private tenantRepository: ITenantRepository) { }

    async getById(id: string): Promise<Tenant> {
        const tenant = await this.tenantRepository.findById(id);
        if (!tenant) {
            throw new NotFoundError('Tenant', id);
        }
        return tenant;
    }

    async getBySlug(slug: string): Promise<Tenant> {
        const tenant = await this.tenantRepository.findBySlug(slug);
        if (!tenant) {
            throw new NotFoundError('Tenant', slug);
        }
        return tenant;
    }
}
