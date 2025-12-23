import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorPayableApi } from '@/api/vendor';
import type {
    VendorPayableFilters,
    CreateVendorPayableInput,
    UpdateVendorPayableInput,
    VendorPayableStatus,
    PayableDeductionInput,
} from '@/types/vendor.types';

const PAYABLE_KEY = 'vendor-payables';
const ASSIGNMENT_KEY = 'vendor-assignments';

/**
 * Hook for fetching vendor payables with filters and pagination.
 */
export function useVendorPayables(filters: VendorPayableFilters = {}) {
    return useQuery({
        queryKey: [PAYABLE_KEY, filters],
        queryFn: () => vendorPayableApi.getAll(filters),
    });
}

/**
 * Hook for fetching a single payable by ID.
 */
export function useVendorPayable(id: string) {
    return useQuery({
        queryKey: [PAYABLE_KEY, id],
        queryFn: () => vendorPayableApi.getById(id),
        enabled: !!id,
    });
}

/**
 * Hook for fetching payables by vendor.
 */
export function useVendorPayablesByVendor(vendorId: string) {
    return useQuery({
        queryKey: [PAYABLE_KEY, 'by-vendor', vendorId],
        queryFn: () => vendorPayableApi.getByVendor(vendorId),
        enabled: !!vendorId,
    });
}

/**
 * Hook for fetching payables pending settlement.
 */
export function usePayablesPendingSettlement(vendorId?: string) {
    return useQuery({
        queryKey: [PAYABLE_KEY, 'pending-settlement', vendorId],
        queryFn: () => vendorPayableApi.getPendingSettlement(vendorId),
    });
}

/**
 * Hook for fetching overdue payables.
 */
export function useOverduePayables() {
    return useQuery({
        queryKey: [PAYABLE_KEY, 'overdue'],
        queryFn: () => vendorPayableApi.getOverdue(),
    });
}

/**
 * Hook for fetching aging summary.
 */
export function usePayablesAgingSummary() {
    return useQuery({
        queryKey: [PAYABLE_KEY, 'aging-summary'],
        queryFn: () => vendorPayableApi.getAgingSummary(),
    });
}

/**
 * Hook for creating a payable.
 */
export function useCreateVendorPayable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateVendorPayableInput) => vendorPayableApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY] });
            queryClient.invalidateQueries({ queryKey: [ASSIGNMENT_KEY] });
        },
    });
}

/**
 * Hook for updating a payable.
 */
export function useUpdateVendorPayable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateVendorPayableInput }) =>
            vendorPayableApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY] });
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY, id] });
        },
    });
}

/**
 * Hook for updating payable status.
 */
export function useUpdatePayableStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: VendorPayableStatus }) =>
            vendorPayableApi.updateStatus(id, status),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY] });
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY, id] });
        },
    });
}

/**
 * Hook for approving a payable.
 */
export function useApprovePayable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, approverId }: { id: string; approverId: string }) =>
            vendorPayableApi.approve(id, approverId),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY] });
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY, id] });
        },
    });
}

/**
 * Hook for adding a deduction to a payable.
 */
export function useAddPayableDeduction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, deduction }: { id: string; deduction: PayableDeductionInput }) =>
            vendorPayableApi.addDeduction(id, deduction),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY, id] });
        },
    });
}

/**
 * Hook for deleting a payable.
 */
export function useDeleteVendorPayable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => vendorPayableApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY] });
        },
    });
}
