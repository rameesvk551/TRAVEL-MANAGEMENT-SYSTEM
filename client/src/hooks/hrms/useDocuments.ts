/**
 * HRMS Hooks - Document Management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@/api/hrms';
import type { 
    CreateDocumentDTO, 
    UpdateDocumentDTO, 
    DocumentQuery 
} from '@/types/hrms.types';

const QUERY_KEYS = {
    documents: ['hrms', 'documents'] as const,
    document: (id: string) => ['hrms', 'documents', id] as const,
    employeeDocuments: (employeeId: string) => ['hrms', 'documents', 'employee', employeeId] as const,
    expiringDocuments: ['hrms', 'documents', 'expiring'] as const,
};

export function useDocuments(params?: DocumentQuery) {
    return useQuery({
        queryKey: [...QUERY_KEYS.documents, params],
        queryFn: () => documentApi.getAll(params),
    });
}

export function useDocument(id: string) {
    return useQuery({
        queryKey: QUERY_KEYS.document(id),
        queryFn: () => documentApi.getById(id),
        enabled: !!id,
    });
}

export function useEmployeeDocuments(employeeId: string) {
    return useQuery({
        queryKey: QUERY_KEYS.employeeDocuments(employeeId),
        queryFn: () => documentApi.getByEmployee(employeeId),
        enabled: !!employeeId,
    });
}

export function useExpiringDocuments(days?: number) {
    return useQuery({
        queryKey: [...QUERY_KEYS.expiringDocuments, days],
        queryFn: () => documentApi.getExpiring(days),
    });
}

export function useCreateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateDocumentDTO) => documentApi.create(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
            queryClient.invalidateQueries({ 
                queryKey: QUERY_KEYS.employeeDocuments(variables.employeeId) 
            });
        },
    });
}

export function useUpdateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateDocumentDTO }) =>
            documentApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.document(id) });
        },
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => documentApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
        },
    });
}

export function useVerifyDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => documentApi.verify(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.document(id) });
        },
    });
}

export function useRejectDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            documentApi.reject(id, reason),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.document(id) });
        },
    });
}

export function useUploadFile() {
    return useMutation({
        mutationFn: (file: File) => documentApi.uploadFile(file),
    });
}
