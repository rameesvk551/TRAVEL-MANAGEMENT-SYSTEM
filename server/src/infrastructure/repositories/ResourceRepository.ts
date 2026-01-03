import { Resource as ResourceEntity, ResourceType } from '../../domain/entities/Resource.js';
import { IResourceRepository, ResourceFilters } from '../../domain/interfaces/IResourceRepository.js';
import { Resource as ResourceModel } from '../database/sequelize/models/Resource.js';
import { Op } from 'sequelize';

function toEntity(model: ResourceModel): ResourceEntity {
    return ResourceEntity.fromPersistence({
        id: model.id,
        tenantId: model.tenant_id,
        type: model.type as ResourceType,
        name: model.name,
        description: model.description || '',
        capacity: model.capacity || 1,
        basePrice: Number(model.base_price) || 0,
        currency: model.currency || 'INR',
        attributes: (model.attributes as Record<string, unknown>) || {},
        isActive: model.is_active,
        createdAt: model.created_at,
        updatedAt: model.updated_at,
    });
}

export class ResourceRepository implements IResourceRepository {
    async findById(id: string, tenantId: string): Promise<ResourceEntity | null> {
        const resource = await ResourceModel.findOne({
            where: { id, tenant_id: tenantId }
        });
        return resource ? toEntity(resource) : null;
    }

    async findAll(
        tenantId: string,
        filters?: ResourceFilters,
        limit = 20,
        offset = 0
    ): Promise<ResourceEntity[]> {
        const where: any = { tenant_id: tenantId };

        if (filters?.type) where.type = filters.type;
        if (filters?.isActive !== undefined) where.is_active = filters.isActive;
        if (filters?.search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${filters.search}%` } },
                { description: { [Op.iLike]: `%${filters.search}%` } }
            ];
        }

        const resources = await ResourceModel.findAll({
            where,
            limit,
            offset,
            order: [['name', 'ASC']]
        });

        return resources.map(toEntity);
    }

    async count(tenantId: string, filters?: ResourceFilters): Promise<number> {
        const where: any = { tenant_id: tenantId };

        if (filters?.type) where.type = filters.type;
        if (filters?.isActive !== undefined) where.is_active = filters.isActive;
        if (filters?.search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${filters.search}%` } },
                { description: { [Op.iLike]: `%${filters.search}%` } }
            ];
        }

        return await ResourceModel.count({ where });
    }

    async save(resource: ResourceEntity): Promise<ResourceEntity> {
        const [instance, created] = await ResourceModel.findOrCreate({
            where: { id: resource.id },
            defaults: {
                id: resource.id,
                tenant_id: resource.tenantId,
                type: resource.type,
                name: resource.name,
                description: resource.description,
                capacity: resource.capacity,
                base_price: resource.basePrice,
                currency: resource.currency,
                attributes: resource.attributes,
                is_active: resource.isActive,
            }
        });

        if (!created) {
            await instance.update({
                type: resource.type,
                name: resource.name,
                description: resource.description,
                capacity: resource.capacity,
                base_price: resource.basePrice,
                currency: resource.currency,
                attributes: resource.attributes,
                is_active: resource.isActive,
            });
        }

        return toEntity(instance);
    }

    async update(resource: ResourceEntity): Promise<ResourceEntity> {
        return this.save(resource);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await ResourceModel.destroy({
            where: { id, tenant_id: tenantId }
        });
    }
}
