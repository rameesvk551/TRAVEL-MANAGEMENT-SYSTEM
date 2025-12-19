import { apiClient } from './client';
import type {
    Resource,
    ResourceType,
    CreateResourceInput,
    UpdateResourceInput,
    ApiResponse,
    PaginatedResponse,
} from '@/types';

export interface ResourceFilters {
    type?: ResourceType;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}

/**
 * Resource API client - handles HTTP requests to resource endpoints.
 * This layer ONLY makes HTTP calls, no business logic.
 */
export const resourceApi = {
    async getAll(filters: ResourceFilters = {}): Promise<PaginatedResponse<Resource>> {
        const params = new URLSearchParams();
        if (filters.type) params.set('type', filters.type);
        if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
        if (filters.search) params.set('search', filters.search);
        if (filters.page) params.set('page', String(filters.page));
        if (filters.limit) params.set('limit', String(filters.limit));

        const response = await apiClient.get<PaginatedResponse<Resource>>(
            `/resources?${params.toString()}`
        );
        return response.data;
    },

    async getById(id: string): Promise<ApiResponse<Resource>> {
        const response = await apiClient.get<ApiResponse<Resource>>(`/resources/${id}`);
        return response.data;
    },

    async create(data: CreateResourceInput): Promise<ApiResponse<Resource>> {
        const response = await apiClient.post<ApiResponse<Resource>>('/resources', data);
        return response.data;
    },

    async update(id: string, data: UpdateResourceInput): Promise<ApiResponse<Resource>> {
        const response = await apiClient.put<ApiResponse<Resource>>(`/resources/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/resources/${id}`);
    },
};
