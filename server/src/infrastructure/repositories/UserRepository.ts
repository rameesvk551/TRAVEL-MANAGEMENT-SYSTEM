import { User as UserEntity, UserRole } from '../../domain/entities/User.js';
import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import { User as UserModel } from '../database/sequelize/models/User.js';

function toEntity(model: UserModel): UserEntity {
    return UserEntity.fromPersistence({
        id: model.id,
        tenantId: model.tenant_id,
        email: model.email,
        passwordHash: model.password_hash,
        name: model.name,
        role: model.role as UserRole,
        profile: (model.profile as Record<string, unknown>) || {},
        isActive: model.is_active,
        createdAt: model.created_at,
        updatedAt: model.updated_at,
    });
}

export class UserRepository implements IUserRepository {
    async findById(id: string, tenantId: string): Promise<UserEntity | null> {
        const user = await UserModel.findOne({
            where: { id, tenant_id: tenantId, is_active: true },
        });
        return user ? toEntity(user) : null;
    }

    async findByEmail(email: string, tenantId?: string): Promise<UserEntity | null> {
        const where: any = {
            email: email.toLowerCase(),
            is_active: true,
        };

        if (tenantId) {
            where.tenant_id = tenantId;
        }

        const user = await UserModel.findOne({ where });
        return user ? toEntity(user) : null;
    }

    async findAll(tenantId: string, limit = 20, offset = 0): Promise<UserEntity[]> {
        const users = await UserModel.findAll({
            where: { tenant_id: tenantId, is_active: true },
            order: [['name', 'ASC']],
            limit,
            offset,
        });
        return users.map(toEntity);
    }

    async count(tenantId: string): Promise<number> {
        return await UserModel.count({
            where: { tenant_id: tenantId, is_active: true },
        });
    }

    async save(user: UserEntity): Promise<UserEntity> {
        const created = await UserModel.create({
            id: user.id,
            tenant_id: user.tenantId,
            email: user.email,
            password_hash: user.passwordHash,
            name: user.name,
            role: user.role,
            profile: user.profile,
            is_active: user.isActive,
        });
        return toEntity(created);
    }

    async update(user: UserEntity): Promise<UserEntity> {
        const [affectedCount] = await UserModel.update(
            {
                email: user.email,
                name: user.name,
                role: user.role,
                profile: user.profile,
                is_active: user.isActive,
            },
            {
                where: { id: user.id, tenant_id: user.tenantId },
            }
        );

        if (affectedCount === 0) {
            throw new Error('User not found or no changes made');
        }

        const updated = await UserModel.findOne({
            where: { id: user.id, tenant_id: user.tenantId },
        });

        if (!updated) {
            throw new Error('User not found after update');
        }

        return toEntity(updated);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await UserModel.update(
            { is_active: false },
            {
                where: { id, tenant_id: tenantId },
            }
        );
    }
}
