import { generateId } from '../../shared/utils/index.js';

export interface TenantProps {
    id?: string;
    name: string;
    slug: string;
    location?: string | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Tenant entity - represents a company/organization in the multi-tenant system.
 * All data is scoped to a tenant.
 */
export class Tenant {
    public readonly id: string;
    public readonly name: string;
    public readonly slug: string;
    public readonly location: string | null;
    public readonly isActive: boolean;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<TenantProps>) {
        this.id = props.id;
        this.name = props.name;
        this.slug = props.slug;
        this.location = props.location;
        this.isActive = props.isActive;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: TenantProps): Tenant {
        return new Tenant({
            id: props.id ?? generateId(),
            name: props.name,
            slug: props.slug,
            location: props.location ?? null,
            isActive: props.isActive ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: Required<TenantProps>): Tenant {
        return new Tenant(data);
    }
}
