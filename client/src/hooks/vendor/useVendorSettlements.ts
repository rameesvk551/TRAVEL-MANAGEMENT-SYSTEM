import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorSettlementApi } from '@/api/vendor';
import type {
    VendorSettlementFilters,
    CreateVendorSettlementInput,
    VendorSettlementStatus,
} from '@/types/vendor.types';

const SETTLEMENT_KEY = 'vendor-settlements';
const PAYABLE_KEY = 'vendor-payables';
const VENDOR_KEY = 'vendors';

/**
 * Hook for fetching vendor settlements with filters and pagination.
 */
export function useVendorSettlements(filters: VendorSettlementFilters = {}) {
    return useQuery({
        queryKey: [SETTLEMENT_KEY, filters],
        queryFn: () => vendorSettlementApi.getAll(filters),
    });
}

/**
 * Hook for fetching a single settlement by ID.
 */
export function useVendorSettlement(id: string) {
    return useQuery({
        queryKey: [SETTLEMENT_KEY, id],
        queryFn: () => vendorSettlementApi.getById(id),
        enabled: !!id,
    });
}

/**
 * Hook for fetching settlements by vendor.
 */
export function useVendorSettlementsByVendor(vendorId: string) {
    return useQuery({
        queryKey: [SETTLEMENT_KEY, 'by-vendor', vendorId],
        queryFn: () => vendorSettlementApi.getByVendor(vendorId),
        enabled: !!vendorId,
    });
}

/**
 * Hook for creating a settlement.
 */
export function useCreateVendorSettlement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateVendorSettlementInput) => vendorSettlementApi.create(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [SETTLEMENT_KEY] });
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY] });
            if (variables.vendorId) {
                queryClient.invalidateQueries({ queryKey: [VENDOR_KEY, variables.vendorId] });
            }
        },
    });
}

/**
 * Hook for updating settlement status.
 */
export function useUpdateSettlementStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: VendorSettlementStatus }) =>
            vendorSettlementApi.updateStatus(id, status),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [SETTLEMENT_KEY] });
            queryClient.invalidateQueries({ queryKey: [SETTLEMENT_KEY, id] });
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY] });
        },
    });
}

/**
 * Hook for processing a settlement (mark as paid).
 */
export function useProcessSettlement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { 
            id: string; 
            data: { 
                paymentReference: string; 
                paymentMethod: string;
                paidAt?: string;
            } 
        }) => vendorSettlementApi.process(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [SETTLEMENT_KEY] });
            queryClient.invalidateQueries({ queryKey: [SETTLEMENT_KEY, id] });
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY] });
        },
    });
}

/**
 * Hook for approving a settlement.
 */
export function useApproveSettlement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, approverId }: { id: string; approverId: string }) =>
            vendorSettlementApi.approve(id, approverId),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [SETTLEMENT_KEY] });
            queryClient.invalidateQueries({ queryKey: [SETTLEMENT_KEY, id] });
        },
    });
}

/**
 * Hook for voiding a settlement.
 */
export function useVoidSettlement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            vendorSettlementApi.void(id, reason),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [SETTLEMENT_KEY] });
            queryClient.invalidateQueries({ queryKey: [SETTLEMENT_KEY, id] });
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY] });
        },
    });
}

/**
 * Hook for deleting a settlement (only draft settlements).
 */
export function useDeleteVendorSettlement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => vendorSettlementApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [SETTLEMENT_KEY] });
            queryClient.invalidateQueries({ queryKey: [PAYABLE_KEY] });
        },
    });
}
