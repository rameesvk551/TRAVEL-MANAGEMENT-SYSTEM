import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '@/api/vendor';
import type {
    VendorFilters,
    CreateVendorInput,
    UpdateVendorInput,
    VendorStatus,
} from '@/types/vendor.types';

const VENDOR_KEY = 'vendors';

/**
 * Hook for fetching vendors with filters and pagination.
 */
export function useVendors(filters: VendorFilters = {}) {
    return useQuery({
        queryKey: [VENDOR_KEY, filters],
        queryFn: () => vendorApi.getAll(filters),
    });
}

/**
 * Hook for fetching a single vendor by ID.
 */
export function useVendor(id: string) {
    return useQuery({
        queryKey: [VENDOR_KEY, id],
        queryFn: () => vendorApi.getById(id),
        enabled: !!id,
    });
}

/**
 * Hook for fetching vendor with full details (contracts, rates, performance).
 */
export function useVendorDetails(id: string) {
    return useQuery({
        queryKey: [VENDOR_KEY, id, 'details'],
        queryFn: () => vendorApi.getDetails(id),
        enabled: !!id,
    });
}

/**
 * Hook for fetching vendor performance metrics.
 */
export function useVendorPerformance(id: string, period?: { startDate: string; endDate: string }) {
    return useQuery({
        queryKey: [VENDOR_KEY, id, 'performance', period],
        queryFn: () => vendorApi.getPerformance(id, period),
        enabled: !!id,
    });
}

/**
 * Hook for fetching vendor dashboard summary.
 */
export function useVendorDashboard() {
    return useQuery({
        queryKey: [VENDOR_KEY, 'dashboard'],
        queryFn: () => vendorApi.getDashboard(),
    });
}

/**
 * Hook for fetching vendors with expiring compliance docs.
 */
export function useVendorComplianceAlerts(daysAhead: number = 30) {
    return useQuery({
        queryKey: [VENDOR_KEY, 'compliance-alerts', daysAhead],
        queryFn: () => vendorApi.getComplianceAlerts(daysAhead),
    });
}

/**
 * Hook for creating a vendor.
 */
export function useCreateVendor() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateVendorInput) => vendorApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [VENDOR_KEY] });
        },
    });
}

/**
 * Hook for updating a vendor.
 */
export function useUpdateVendor() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateVendorInput }) =>
            vendorApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [VENDOR_KEY] });
            queryClient.invalidateQueries({ queryKey: [VENDOR_KEY, id] });
        },
    });
}

/**
 * Hook for updating vendor status.
 */
export function useUpdateVendorStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: VendorStatus }) =>
            vendorApi.updateStatus(id, status),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [VENDOR_KEY] });
            queryClient.invalidateQueries({ queryKey: [VENDOR_KEY, id] });
        },
    });
}

/**
 * Hook for deleting a vendor.
 */
export function useDeleteVendor() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => vendorApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [VENDOR_KEY] });
        },
    });
}

/**
 * Hook for recording vendor performance.
 */
export function useRecordVendorPerformance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { 
            id: string; 
            data: { 
                assignmentId: string; 
                qualityRating: number; 
                timelinessRating: number; 
                communicationRating: number; 
                notes?: string 
            } 
        }) => vendorApi.recordPerformance(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [VENDOR_KEY, id, 'performance'] });
        },
    });
}
