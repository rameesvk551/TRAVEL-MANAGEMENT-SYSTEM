import { query } from '../database/index.js';
import { User, UserRole } from '../../domain/entities/User.js';
import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';

interface UserRow {
    [key: string]: unknown;
    id: string;
    tenant_id: string;
    email: string;
    password_hash: string;
    name: string;
    role: UserRole;
    profile: Record<string, unknown>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: UserRow): User {
    return User.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        email: row.email,
        passwordHash: row.password_hash,
        name: row.name,
        role: row.role,
        profile: row.profile,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

export class UserRepository implements IUserRepository {
    async findById(id: string, tenantId: string): Promise<User | null> {
        const result = await query<UserRow>(
            'SELECT * FROM users WHERE id = $1 AND tenant_id = $2 AND is_active = true',
            [id, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByEmail(email: string, tenantId: string): Promise<User | null> {
        const result = await query<UserRow>(
            'SELECT * FROM users WHERE email = $1 AND tenant_id = $2 AND is_active = true',
            [email.toLowerCase(), tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(tenantId: string, limit = 20, offset = 0): Promise<User[]> {
        const result = await query<UserRow>(
            'SELECT * FROM users WHERE tenant_id = $1 AND is_active = true ORDER BY name LIMIT $2 OFFSET $3',
            [tenantId, limit, offset]
        );
        return result.rows.map(toEntity);
    }

    async count(tenantId: string): Promise<number> {
        const result = await query<{ count: string }>(
            'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND is_active = true',
            [tenantId]
        );
        return parseInt(result.rows[0].count, 10);
    }

    async save(user: User): Promise<User> {
        const sql = `INSERT INTO users (id, tenant_id, email, password_hash, name, role, profile, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`;
        const result = await query<UserRow>(sql, [
            user.id,
            user.tenantId,
            user.email,
            user.passwordHash,
            user.name,
            user.role,
            user.profile,
            user.isActive,
        ]);
        return toEntity(result.rows[0]);
    }

    async update(user: User): Promise<User> {
        const sql = `UPDATE users SET email = $1, name = $2, role = $3, profile = $4, is_active = $5
       WHERE id = $6 AND tenant_id = $7 RETURNING *`;
        const result = await query<UserRow>(sql, [
            user.email,
            user.name,
            user.role,
            user.profile,
            user.isActive,
            user.id,
            user.tenantId,
        ]);
        return toEntity(result.rows[0]);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await query(
            'UPDATE users SET is_active = false WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
    }
}
