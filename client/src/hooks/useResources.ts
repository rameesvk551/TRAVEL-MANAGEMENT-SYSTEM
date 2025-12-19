import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourceApi, type ResourceFilters } from '@/api';
import type { CreateResourceInput, UpdateResourceInput } from '@/types';

const RESOURCE_KEY = 'resources';

/**
 * Hook for fetching resources with filters and pagination.
 * All data fetching logic lives here, not in components.
 */
export function useResources(filters: ResourceFilters = {}) {
    return useQuery({
        queryKey: [RESOURCE_KEY, filters],
        queryFn: () => resourceApi.getAll(filters),
    });
}

/**
 * Hook for fetching a single resource by ID.
 */
export function useResource(id: string) {
    return useQuery({
        queryKey: [RESOURCE_KEY, id],
        queryFn: () => resourceApi.getById(id),
        enabled: !!id,
    });
}

/**
 * Hook for creating a resource.
 */
export function useCreateResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateResourceInput) => resourceApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [RESOURCE_KEY] });
        },
    });
}

/**
 * Hook for updating a resource.
 */
export function useUpdateResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateResourceInput }) =>
            resourceApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [RESOURCE_KEY] });
        },
    });
}

/**
 * Hook for deleting a resource.
 */
export function useDeleteResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => resourceApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [RESOURCE_KEY] });
        },
    });
}
