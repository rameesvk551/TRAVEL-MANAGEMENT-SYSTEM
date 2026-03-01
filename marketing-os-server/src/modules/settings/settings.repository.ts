import db from '../../db/sqlmodels/index.js';

// ── Tenant queries ──

export const findTenantById = async (tenantId: string) => {
    return db.Tenant.findByPk(tenantId);
};

export const updateTenant = async (tenantId: string, data: Record<string, any>) => {
    const tenant = await db.Tenant.findByPk(tenantId);
    if (!tenant) return null;
    await tenant.update(data);
    return tenant;
};

// ── User queries ──

export const findUserById = async (userId: string) => {
    return db.User.findByPk(userId);
};

export const updateUser = async (userId: string, data: Record<string, any>) => {
    const user = await db.User.findByPk(userId);
    if (!user) return null;
    await user.update(data);
    return user;
};
