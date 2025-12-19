import { Resource, ResourceType } from '../../domain/entities/Resource.js';
import { IResourceRepository, ResourceFilters } from '../../domain/interfaces/IResourceRepository.js';
import { CreateResourceDTO, UpdateResourceDTO, ResourceResponseDTO } from '../dtos/ResourceDTO.js';
import { ResourceMapper } from '../mappers/ResourceMapper.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { PaginatedResponse, buildPaginatedResponse, PaginationParams } from '../../shared/types/index.js';

/**
 * Resource service - contains all business logic for resource management.
 * Controllers call this service, never the repository directly.
 */
export class ResourceService {
    constructor(private resourceRepository: IResourceRepository) { }

    async getById(id: string, tenantId: string): Promise<ResourceResponseDTO> {
        const resource = await this.resourceRepository.findById(id, tenantId);
        if (!resource) {
            throw new NotFoundError('Resource', id);
        }
        return ResourceMapper.toDTO(resource);
    }

    async getAll(
        tenantId: string,
        filters: ResourceFilters,
        pagination: PaginationParams
    ): Promise<PaginatedResponse<ResourceResponseDTO>> {
        const [resources, total] = await Promise.all([
            this.resourceRepository.findAll(tenantId, filters, pagination.limit, pagination.offset),
            this.resourceRepository.count(tenantId, filters),
        ]);

        return buildPaginatedResponse(ResourceMapper.toDTOList(resources), total, pagination);
    }

    async create(dto: CreateResourceDTO, tenantId: string): Promise<ResourceResponseDTO> {
        const resource = Resource.create({
            tenantId,
            type: dto.type,
            name: dto.name,
            description: dto.description,
            capacity: dto.capacity,
            basePrice: dto.basePrice,
            currency: dto.currency,
            attributes: dto.attributes,
        });

        const saved = await this.resourceRepository.save(resource);
        return ResourceMapper.toDTO(saved);
    }

    async update(
        id: string,
        dto: UpdateResourceDTO,
        tenantId: string
    ): Promise<ResourceResponseDTO> {
        const existing = await this.resourceRepository.findById(id, tenantId);
        if (!existing) {
            throw new NotFoundError('Resource', id);
        }

        const updated = Resource.create({
            id: existing.id,
            tenantId: existing.tenantId,
            type: dto.type ?? existing.type,
            name: dto.name ?? existing.name,
            description: dto.description ?? existing.description,
            capacity: dto.capacity ?? existing.capacity,
            basePrice: dto.basePrice ?? existing.basePrice,
            currency: dto.currency ?? existing.currency,
            attributes: dto.attributes ?? existing.attributes,
            isActive: dto.isActive ?? existing.isActive,
            createdAt: existing.createdAt,
        });

        const saved = await this.resourceRepository.update(updated);
        return ResourceMapper.toDTO(saved);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        const existing = await this.resourceRepository.findById(id, tenantId);
        if (!existing) {
            throw new NotFoundError('Resource', id);
        }
        await this.resourceRepository.delete(id, tenantId);
    }
}
