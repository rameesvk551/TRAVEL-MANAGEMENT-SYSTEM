/**
 * HRMS Hooks - Payroll Management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi } from '@/api/hrms';

const QUERY_KEYS = {
    myPayslips: ['hrms', 'payroll', 'me'] as const,
    pending: ['hrms', 'payroll', 'pending'] as const,
    summary: ['hrms', 'payroll', 'summary'] as const,
    payslip: (id: string) => ['hrms', 'payroll', id] as const,
};

export function useMyPayslips(params?: { year?: number }) {
    return useQuery({
        queryKey: [...QUERY_KEYS.myPayslips, params],
        queryFn: () => payrollApi.getMyPayslips(params),
    });
}

export function usePayslip(id: string) {
    return useQuery({
        queryKey: QUERY_KEYS.payslip(id),
        queryFn: () => payrollApi.getPayslip(id),
        enabled: !!id,
    });
}

export function usePendingPayrolls() {
    return useQuery({
        queryKey: QUERY_KEYS.pending,
        queryFn: () => payrollApi.getPendingPayrolls(),
    });
}

export function usePayrollSummary(params: {
    periodStart: string;
    periodEnd: string;
}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.summary, params],
        queryFn: () => payrollApi.getPayrollSummary(params),
        enabled: !!params.periodStart && !!params.periodEnd,
    });
}

export function useGeneratePayroll() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: {
            periodStart: string;
            periodEnd: string;
            employeeIds?: string[];
        }) => payrollApi.generatePayroll(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pending });
        },
    });
}

export function useApprovePayroll() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => payrollApi.approve(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pending });
        },
    });
}

export function useBulkApprovePayroll() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => payrollApi.bulkApprove(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pending });
        },
    });
}

export function useMarkPayrollPaid() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, paymentRef }: { id: string; paymentRef?: string }) =>
            payrollApi.markPaid(id, paymentRef),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pending });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myPayslips });
        },
    });
}

export function useDownloadPayslip() {
    return useMutation({
        mutationFn: async (id: string) => {
            const blob = await payrollApi.downloadPayslip(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payslip-${id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
        },
    });
}
