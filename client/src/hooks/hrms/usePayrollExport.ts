// hooks/hrms/usePayrollExport.ts
// Payroll Export React Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  payrollExportApi,
  type TemplateFilters,
  type ExportFilters,
  type CreateTemplateRequest,
  type UpdateTemplateRequest,
  type CreateExportRequest,
} from '../../api/hrms/payrollExportApi';

// Query Keys
export const payrollExportKeys = {
  all: ['payrollExport'] as const,
  templates: () => [...payrollExportKeys.all, 'templates'] as const,
  templatesList: (filters?: TemplateFilters) => [...payrollExportKeys.templates(), 'list', filters] as const,
  templateDetail: (id: string) => [...payrollExportKeys.templates(), 'detail', id] as const,
  exports: () => [...payrollExportKeys.all, 'exports'] as const,
  exportsList: (filters?: ExportFilters) => [...payrollExportKeys.exports(), 'list', filters] as const,
  exportDetail: (id: string) => [...payrollExportKeys.exports(), 'detail', id] as const,
  exportDetails: (id: string) => [...payrollExportKeys.exports(), 'details', id] as const,
  stats: () => [...payrollExportKeys.all, 'stats'] as const,
  availableFields: () => [...payrollExportKeys.all, 'availableFields'] as const,
};

// Template Hooks
export function usePayrollExportTemplates(filters?: TemplateFilters) {
  return useQuery({
    queryKey: payrollExportKeys.templatesList(filters),
    queryFn: () => payrollExportApi.getTemplates(filters),
  });
}

export function usePayrollExportTemplate(id: string) {
  return useQuery({
    queryKey: payrollExportKeys.templateDetail(id),
    queryFn: () => payrollExportApi.getTemplateById(id),
    enabled: !!id,
  });
}

export function useCreatePayrollExportTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTemplateRequest) => payrollExportApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.templates() });
    },
  });
}

export function useUpdatePayrollExportTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateRequest }) =>
      payrollExportApi.updateTemplate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.templates() });
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.templateDetail(variables.id) });
    },
  });
}

export function useDeletePayrollExportTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => payrollExportApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.templates() });
    },
  });
}

export function useDuplicatePayrollExportTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      payrollExportApi.duplicateTemplate(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.templates() });
    },
  });
}

// Export Hooks
export function usePayrollExports(filters?: ExportFilters) {
  return useQuery({
    queryKey: payrollExportKeys.exportsList(filters),
    queryFn: () => payrollExportApi.getExports(filters),
  });
}

export function usePayrollExport(id: string) {
  return useQuery({
    queryKey: payrollExportKeys.exportDetail(id),
    queryFn: () => payrollExportApi.getExportById(id),
    enabled: !!id,
  });
}

export function usePayrollExportDetails(id: string) {
  return useQuery({
    queryKey: payrollExportKeys.exportDetails(id),
    queryFn: () => payrollExportApi.getExportDetails(id),
    enabled: !!id,
  });
}

export function useCreatePayrollExport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateExportRequest) => payrollExportApi.createExport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.exports() });
    },
  });
}

export function useGeneratePayrollExport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => payrollExportApi.generateExport(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.exports() });
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.exportDetail(id) });
    },
  });
}

export function useCancelPayrollExport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => payrollExportApi.cancelExport(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.exports() });
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.exportDetail(id) });
    },
  });
}

export function useRetryPayrollExport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => payrollExportApi.retryExport(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.exports() });
      queryClient.invalidateQueries({ queryKey: payrollExportKeys.exportDetail(id) });
    },
  });
}

export function useDownloadPayrollExport() {
  return useMutation({
    mutationFn: async (id: string) => {
      const blob = await payrollExportApi.downloadExport(id);
      return blob;
    },
  });
}

// Preview & Validation Hooks
export function usePreviewPayrollExport() {
  return useMutation({
    mutationFn: (data: CreateExportRequest) => payrollExportApi.previewExport(data),
  });
}

export function useValidatePayrollExport() {
  return useMutation({
    mutationFn: (data: CreateExportRequest) => payrollExportApi.validateExport(data),
  });
}

// Stats Hook
export function usePayrollExportStats() {
  return useQuery({
    queryKey: payrollExportKeys.stats(),
    queryFn: () => payrollExportApi.getStats(),
  });
}

// Available Fields Hook
export function useAvailableExportFields() {
  return useQuery({
    queryKey: payrollExportKeys.availableFields(),
    queryFn: () => payrollExportApi.getAvailableFields(),
  });
}

// Helper hook for downloading exports
export function useDownloadExport() {
  const downloadMutation = useDownloadPayrollExport();
  
  const download = async (id: string, fileName: string) => {
    try {
      const blob = await downloadMutation.mutateAsync(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };
  
  return {
    download,
    isDownloading: downloadMutation.isPending,
    error: downloadMutation.error,
  };
}
