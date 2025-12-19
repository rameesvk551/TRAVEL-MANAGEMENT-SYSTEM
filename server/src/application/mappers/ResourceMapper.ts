import { Resource } from '../../domain/entities/Resource.js';
import { ResourceResponseDTO } from '../dtos/ResourceDTO.js';

/**
 * Maps Resource domain entities to/from DTOs.
 * All transformations happen here, not in controllers or UI.
 */
export class ResourceMapper {
    static toDTO(resource: Resource): ResourceResponseDTO {
        return {
            id: resource.id,
            type: resource.type,
            name: resource.name,
            description: resource.description,
            capacity: resource.capacity,
            basePrice: resource.basePrice,
            currency: resource.currency,
            attributes: resource.attributes,
            isActive: resource.isActive,
            createdAt: resource.createdAt.toISOString(),
            updatedAt: resource.updatedAt.toISOString(),
        };
    }

    static toDTOList(resources: Resource[]): ResourceResponseDTO[] {
        return resources.map(ResourceMapper.toDTO);
    }
}
