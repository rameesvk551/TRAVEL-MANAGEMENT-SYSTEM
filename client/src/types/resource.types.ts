/**
 * Resource types supported by the platform.
 */
export type ResourceType = 'ROOM' | 'TOUR' | 'TREK' | 'ACTIVITY' | 'VEHICLE' | 'EQUIPMENT';

export interface Resource {
    id: string;
    type: ResourceType;
    name: string;
    description: string;
    capacity: number;
    basePrice: number;
    currency: string;
    attributes: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateResourceInput {
    type: ResourceType;
    name: string;
    description?: string;
    capacity?: number;
    basePrice?: number;
    currency?: string;
    attributes?: Record<string, unknown>;
}

export interface UpdateResourceInput {
    type?: ResourceType;
    name?: string;
    description?: string;
    capacity?: number;
    basePrice?: number;
    currency?: string;
    attributes?: Record<string, unknown>;
    isActive?: boolean;
}
