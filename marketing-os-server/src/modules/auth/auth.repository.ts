import db from '../../db/sqlmodels/index.js';

export const findUserByEmail = async (email: string) => {
    return db.User.findOne({ where: { email } });
};

export const findUserByEmailWithTenant = async (email: string) => {
    return db.User.findOne({
        where: { email },
        include: [{ model: db.Tenant, as: 'tenant' }],
    });
};

export const findUserById = async (id: string) => {
    return db.User.findByPk(id);
};

export const findTenantById = async (id: string) => {
    return db.Tenant.findByPk(id);
};

export const findTenantBySlug = async (slug: string) => {
    return db.Tenant.findOne({ where: { slug } });
};

export const createTenant = async (data: { name: string; slug: string; is_active: boolean }) => {
    return db.Tenant.create(data);
};

export const createUser = async (data: {
    tenant_id: string;
    email: string;
    password_hash: string;
    name: string;
    role: string;
    is_active: boolean;
}) => {
    return db.User.create(data);
};

export const updateUserPassword = async (userId: string, passwordHash: string) => {
    const user = await db.User.findByPk(userId);
    if (!user) return null;
    await user.update({ password_hash: passwordHash });
    return user;
};
