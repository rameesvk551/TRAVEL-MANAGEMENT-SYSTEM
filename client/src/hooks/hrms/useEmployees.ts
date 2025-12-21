/**
 * HRMS Hooks - Employee Management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '@/api/hrms';
import type { CreateEmployeeDTO, UpdateEmployeeDTO } from '@/types/hrms.types';

const QUERY_KEYS = {
    employees: ['hrms', 'employees'] as const,
    employee: (id: string) => ['hrms', 'employees', id] as const,
    employeeSkills: (id: string) => ['hrms', 'employees', id, 'skills'] as const,
};

export function useEmployees(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.employees, params],
        queryFn: () => employeeApi.getAll(params),
    });
}

export function useEmployee(id: string) {
    return useQuery({
        queryKey: QUERY_KEYS.employee(id),
        queryFn: () => employeeApi.getById(id),
        enabled: !!id,
    });
}

export function useEmployeeSkills(id: string) {
    return useQuery({
        queryKey: QUERY_KEYS.employeeSkills(id),
        queryFn: () => employeeApi.getSkills(id),
        enabled: !!id,
    });
}

export function useCreateEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateEmployeeDTO) => employeeApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees });
        },
    });
}

export function useUpdateEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDTO }) =>
            employeeApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employee(id) });
        },
    });
}

export function useDeleteEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => employeeApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees });
        },
    });
}
