import { ResourceType } from '../../domain/entities/Resource.js';

export interface CreateResourceDTO {
    type: ResourceType;
    name: string;
    description?: string;
    capacity?: number;
    basePrice?: number;
    currency?: string;
    attributes?: Record<string, unknown>;
}

export interface UpdateResourceDTO {
    type?: ResourceType;
    name?: string;
    description?: string;
    capacity?: number;
    basePrice?: number;
    currency?: string;
    attributes?: Record<string, unknown>;
    isActive?: boolean;
}

export interface ResourceResponseDTO {
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
