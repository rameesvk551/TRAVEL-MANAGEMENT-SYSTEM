import { User } from '../entities/User.js';

/**
 * User repository interface - defines data access contract.
 */
export interface IUserRepository {
    findById(id: string, tenantId: string): Promise<User | null>;
    findByEmail(email: string, tenantId: string): Promise<User | null>;
    findAll(tenantId: string, limit?: number, offset?: number): Promise<User[]>;
    count(tenantId: string): Promise<number>;
    save(user: User): Promise<User>;
    update(user: User): Promise<User>;
    delete(id: string, tenantId: string): Promise<void>;
}
