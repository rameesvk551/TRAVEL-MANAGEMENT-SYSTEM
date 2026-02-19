import { User, Tenant } from './auth.model.js';

/**
 * Auth repository — encapsulates all database queries for the auth module.
 */
export class AuthRepository {
    async findUserByEmail(email: string) {
        return User.findOne({ where: { email } });
    }

    async findUserByEmailWithTenant(email: string) {
        return User.findOne({
            where: { email },
            include: [{ model: Tenant, as: 'tenant' }],
        });
    }

    async findUserById(id: string) {
        return User.findByPk(id);
    }

    async findTenantById(id: string) {
        return Tenant.findByPk(id);
    }

    async createTenant(data: { name: string; slug: string; is_active: boolean }) {
        return Tenant.create(data);
    }

    async createUser(data: {
        tenant_id: string;
        email: string;
        password_hash: string;
        name: string;
        role: string;
        is_active: boolean;
    }) {
        return User.create(data);
    }

    async updateUserPassword(userId: string, passwordHash: string) {
        const user = await User.findByPk(userId);
        if (!user) return null;
        await user.update({ password_hash: passwordHash });
        return user;
    }
}
