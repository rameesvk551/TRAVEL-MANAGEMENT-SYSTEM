import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorAssignmentApi } from '@/api/vendor';
import type {
    VendorAssignmentFilters,
    CreateVendorAssignmentInput,
    UpdateVendorAssignmentInput,
    VendorAssignmentStatus,
} from '@/types/vendor.types';

const ASSIGNMENT_KEY = 'vendor-assignments';
const VENDOR_KEY = 'vendors';

/**
 * Hook for fetching vendor assignments with filters and pagination.
 */
export function useVendorAssignments(filters: VendorAssignmentFilters = {}) {
    return useQuery({
        queryKey: [ASSIGNMENT_KEY, filters],
        queryFn: () => vendorAssignmentApi.getAll(filters),
    });
}

/**
 * Hook for fetching a single assignment by ID.
 */
export function useVendorAssignment(id: string) {
    return useQuery({
        queryKey: [ASSIGNMENT_KEY, id],
        queryFn: () => vendorAssignmentApi.getById(id),
        enabled: !!id,
    });
}

/**
 * Hook for fetching assignments by vendor.
 */
export function useVendorAssignmentsByVendor(vendorId: string) {
    return useQuery({
        queryKey: [ASSIGNMENT_KEY, 'by-vendor', vendorId],
        queryFn: () => vendorAssignmentApi.getByVendor(vendorId),
        enabled: !!vendorId,
    });
}

/**
 * Hook for fetching assignments by booking.
 */
export function useVendorAssignmentsByBooking(bookingId: string) {
    return useQuery({
        queryKey: [ASSIGNMENT_KEY, 'by-booking', bookingId],
        queryFn: () => vendorAssignmentApi.getByBooking(bookingId),
        enabled: !!bookingId,
    });
}

/**
 * Hook for creating an assignment.
 */
export function useCreateVendorAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateVendorAssignmentInput) => vendorAssignmentApi.create(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_KEY] });
            if (variables.vendorId) {
                queryClient.invalidateQueries({ queryKey: [VENDOR_KEY, variables.vendorId] });
            }
        },
    });
}

/**
 * Hook for updating an assignment.
 */
export function useUpdateVendorAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateVendorAssignmentInput }) =>
            vendorAssignmentApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_KEY] });
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_KEY, id] });
        },
    });
}

/**
 * Hook for updating assignment status.
 */
export function useUpdateAssignmentStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: VendorAssignmentStatus }) =>
            vendorAssignmentApi.updateStatus(id, status),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_KEY] });
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_KEY, id] });
        },
    });
}

/**
 * Hook for confirming an assignment.
 */
export function useConfirmAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => vendorAssignmentApi.confirm(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_KEY] });
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_KEY, id] });
        },
    });
}

/**
 * Hook for completing an assignment.
 */
export function useCompleteAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { actualCost?: number; notes?: string } }) =>
            vendorAssignmentApi.complete(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_KEY] });
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_KEY, id] });
        },
    });
}

/**
 * Hook for deleting an assignment.
 */
export function useDeleteVendorAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => vendorAssignmentApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_KEY] });
        },
    });
}
