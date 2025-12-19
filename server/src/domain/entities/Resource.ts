import { generateId } from '../../shared/utils/index.js';

/**
 * Unified resource types supporting all travel business models.
 */
export type ResourceType =
    | 'ROOM'
    | 'TOUR'
    | 'TREK'
    | 'ACTIVITY'
    | 'VEHICLE'
    | 'EQUIPMENT';

export interface ResourceProps {
    id?: string;
    tenantId: string;
    type: ResourceType;
    name: string;
    description?: string;
    capacity?: number;
    basePrice?: number;
    currency?: string;
    attributes?: Record<string, unknown>;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Resource entity - unified abstraction for all bookable entities.
 * Rooms, tours, treks, activities, vehicles, and equipment are all Resources.
 */
export class Resource {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly type: ResourceType;
    public readonly name: string;
    public readonly description: string;
    public readonly capacity: number;
    public readonly basePrice: number;
    public readonly currency: string;
    public readonly attributes: Record<string, unknown>;
    public readonly isActive: boolean;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: Required<ResourceProps>) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.type = props.type;
        this.name = props.name;
        this.description = props.description;
        this.capacity = props.capacity;
        this.basePrice = props.basePrice;
        this.currency = props.currency;
        this.attributes = props.attributes;
        this.isActive = props.isActive;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: ResourceProps): Resource {
        return new Resource({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            type: props.type,
            name: props.name,
            description: props.description ?? '',
            capacity: props.capacity ?? 1,
            basePrice: props.basePrice ?? 0,
            currency: props.currency ?? 'INR',
            attributes: props.attributes ?? {},
            isActive: props.isActive ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: Required<ResourceProps>): Resource {
        return new Resource(data);
    }
}
