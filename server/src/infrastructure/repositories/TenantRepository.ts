import { Tenant as TenantEntity } from '../../domain/entities/Tenant.js';
import { ITenantRepository } from '../../domain/interfaces/ITenantRepository.js';
import { Tenant as TenantModel } from '../database/sequelize/models/Tenant.js';

function toEntity(model: TenantModel): TenantEntity {
    return TenantEntity.fromPersistence({
        id: model.id,
        name: model.name,
        slug: model.slug,
        location: model.location || null,
        isActive: model.is_active,
        createdAt: model.created_at,
        updatedAt: model.updated_at,
    });
}

export class TenantRepository implements ITenantRepository {
    async findById(id: string): Promise<TenantEntity | null> {
        const tenant = await TenantModel.findOne({
            where: { id, is_active: true },
        });
        return tenant ? toEntity(tenant) : null;
    }

    async findBySlug(slug: string): Promise<TenantEntity | null> {
        const tenant = await TenantModel.findOne({
            where: { slug, is_active: true },
        });
        return tenant ? toEntity(tenant) : null;
    }

    async findAll(): Promise<TenantEntity[]> {
        const tenants = await TenantModel.findAll({
            where: { is_active: true },
            order: [['name', 'ASC']],
        });
        return tenants.map(toEntity);
    }

    async save(tenant: TenantEntity): Promise<TenantEntity> {
        const created = await TenantModel.create({
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            location: tenant.location || undefined,
            is_active: tenant.isActive,
        });
        return toEntity(created);
    }

    async update(tenant: TenantEntity): Promise<TenantEntity> {
        const [affectedCount] = await TenantModel.update(
            {
                name: tenant.name,
                slug: tenant.slug,
                location: tenant.location || undefined,
                is_active: tenant.isActive,
            },
            {
                where: { id: tenant.id },
            }
        );

        if (affectedCount === 0) {
            throw new Error('Tenant not found or no changes made');
        }

        const updated = await TenantModel.findByPk(tenant.id);
        if (!updated) {
            throw new Error('Tenant not found after update');
        }
        return toEntity(updated);
    }
}
