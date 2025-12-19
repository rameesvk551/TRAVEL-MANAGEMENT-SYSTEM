import { generateId } from '../../shared/utils/index.js';

export type UserRole = 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';

export interface UserProps {
    id?: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    name: string;
    role?: UserRole;
    profile?: Record<string, unknown>;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * User entity - represents a staff member within a tenant.
 */
export class User {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly email: string;
    public readonly passwordHash: string;
    public readonly name: string;
    public readonly role: UserRole;
    public readonly profile: Record<string, unknown>;
    public readonly isActive: boolean;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<UserProps>) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.email = props.email;
        this.passwordHash = props.passwordHash;
        this.name = props.name;
        this.role = props.role;
        this.profile = props.profile;
        this.isActive = props.isActive;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: UserProps): User {
        return new User({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            email: props.email.toLowerCase(),
            passwordHash: props.passwordHash,
            name: props.name,
            role: props.role ?? 'staff',
            profile: props.profile ?? {},
            isActive: props.isActive ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: Required<UserProps>): User {
        return new User(data);
    }

    hasPermission(requiredRole: UserRole): boolean {
        const roleHierarchy: Record<UserRole, number> = {
            owner: 5,
            admin: 4,
            manager: 3,
            staff: 2,
            viewer: 1,
        };
        return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
    }
}
