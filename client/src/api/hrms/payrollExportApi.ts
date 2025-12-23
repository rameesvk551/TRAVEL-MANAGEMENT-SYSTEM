// api/hrms/payrollExportApi.ts
// Payroll Export API

import { apiClient as client } from '../client';

// Types
export type ExportFormat = 'CSV' | 'XLSX' | 'PDF' | 'XML' | 'JSON' | 'BANK_FILE' | 'TAX_FILE';
export type ExportType = 'PAYSLIP' | 'BANK_TRANSFER' | 'TAX_REPORT' | 'SUMMARY' | 'JOURNAL_ENTRY' | 'AUDIT' | 'CUSTOM';
export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ValidationStatus = 'VALID' | 'WARNING' | 'ERROR';

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  targetColumn?: string;
  dataType: 'STRING' | 'NUMBER' | 'DATE' | 'CURRENCY' | 'BOOLEAN';
  format?: string;
  defaultValue?: string | number;
  transform?: string;
  required: boolean;
}

export interface PayrollExportTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  exportFormat: ExportFormat;
  targetSystem?: string;
  fieldMappings: FieldMapping[];
  headerConfig?: {
    includeHeader: boolean;
    headerRow?: string[];
    staticFields?: Record<string, string>;
  };
  footerConfig?: {
    includeFooter: boolean;
    includeSummary: boolean;
    summaryFields?: string[];
  };
  formattingRules?: {
    dateFormat?: string;
    numberFormat?: string;
    currencyFormat?: string;
    delimiter?: string;
    encoding?: string;
  };
  validationRules?: Array<{
    field: string;
    rule: string;
    message: string;
  }>;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollExportDetail {
  id: string;
  exportId: string;
  employeeId: string;
  rowData: Record<string, unknown>;
  validationStatus: ValidationStatus;
  validationMessages: Array<{ field: string; message: string; severity: ValidationStatus }>;
  createdAt: string;
  employee?: { id: string; name: string; employeeNumber: string };
}

export interface PayrollExport {
  id: string;
  tenantId: string;
  templateId?: string;
  payrollRunId?: string;
  exportType: ExportType;
  periodYear: number;
  periodMonth: number;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  recordCount: number;
  totalAmount?: number;
  status: ExportStatus;
  errorMessage?: string;
  exportedBy: string;
  exportedAt: string;
  metadata: Record<string, unknown>;
  template?: PayrollExportTemplate;
  exporter?: { id: string; name: string };
  details?: PayrollExportDetail[];
}

export interface ExportPreview {
  headers: string[];
  rows: Array<Record<string, unknown>>;
  totalRows: number;
  validationSummary: {
    totalValid: number;
    totalWarnings: number;
    totalErrors: number;
    issues: Array<{
      employeeId: string;
      employeeName: string;
      field: string;
      message: string;
      severity: ValidationStatus;
    }>;
  };
}

export interface ExportValidationResult {
  isValid: boolean;
  errors: Array<{
    employeeId: string;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    employeeId: string;
    field: string;
    message: string;
  }>;
}

export interface ExportStats {
  totalExports: number;
  byType: Array<{ type: ExportType; count: number }>;
  byStatus: Array<{ status: ExportStatus; count: number }>;
  byFormat: Array<{ format: ExportFormat; count: number }>;
  recentExports: PayrollExport[];
  totalAmountExported: number;
  totalRecordsExported: number;
}

// Request types
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  exportFormat: ExportFormat;
  targetSystem?: string;
  fieldMappings: FieldMapping[];
  headerConfig?: {
    includeHeader: boolean;
    headerRow?: string[];
    staticFields?: Record<string, string>;
  };
  footerConfig?: {
    includeFooter: boolean;
    includeSummary: boolean;
    summaryFields?: string[];
  };
  formattingRules?: {
    dateFormat?: string;
    numberFormat?: string;
    currencyFormat?: string;
    delimiter?: string;
    encoding?: string;
  };
  validationRules?: Array<{
    field: string;
    rule: string;
    message: string;
  }>;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  exportFormat?: ExportFormat;
  targetSystem?: string;
  fieldMappings?: FieldMapping[];
  headerConfig?: {
    includeHeader: boolean;
    headerRow?: string[];
    staticFields?: Record<string, string>;
  };
  footerConfig?: {
    includeFooter: boolean;
    includeSummary: boolean;
    summaryFields?: string[];
  };
  formattingRules?: {
    dateFormat?: string;
    numberFormat?: string;
    currencyFormat?: string;
    delimiter?: string;
    encoding?: string;
  };
  validationRules?: Array<{
    field: string;
    rule: string;
    message: string;
  }>;
  isActive?: boolean;
}

export interface CreateExportRequest {
  templateId?: string;
  payrollRunId?: string;
  exportType: ExportType;
  periodYear: number;
  periodMonth: number;
  employeeIds?: string[];
  metadata?: Record<string, unknown>;
}

// Filter types
export interface TemplateFilters {
  exportFormat?: ExportFormat;
  targetSystem?: string;
  isActive?: boolean;
  search?: string;
}

export interface ExportFilters {
  exportType?: ExportType;
  periodYear?: number;
  periodMonth?: number;
  status?: ExportStatus;
  templateId?: string;
  startDate?: string;
  endDate?: string;
}

// Standard field mappings
export const StandardFieldMappings: Record<string, FieldMapping[]> = {
  BANK_TRANSFER: [
    { sourceField: 'bankAccountNumber', targetField: 'account_no', dataType: 'STRING', required: true },
    { sourceField: 'bankAccountName', targetField: 'account_name', dataType: 'STRING', required: true },
    { sourceField: 'bankCode', targetField: 'bank_code', dataType: 'STRING', required: true },
    { sourceField: 'netPay', targetField: 'amount', dataType: 'CURRENCY', required: true },
    { sourceField: 'employeeNumber', targetField: 'ref_no', dataType: 'STRING', required: true },
  ],
  TAX_REPORT: [
    { sourceField: 'employeeNumber', targetField: 'employee_id', dataType: 'STRING', required: true },
    { sourceField: 'taxId', targetField: 'npwp', dataType: 'STRING', required: true },
    { sourceField: 'grossSalary', targetField: 'gross', dataType: 'CURRENCY', required: true },
    { sourceField: 'taxDeducted', targetField: 'pph21', dataType: 'CURRENCY', required: true },
    { sourceField: 'netPay', targetField: 'net', dataType: 'CURRENCY', required: true },
  ],
};

// Target systems
export const TargetSystems = {
  BANK_BCA: 'BANK_BCA',
  BANK_MANDIRI: 'BANK_MANDIRI',
  BANK_BNI: 'BANK_BNI',
  BANK_BRI: 'BANK_BRI',
  TAX_EFILING: 'TAX_EFILING',
  TAX_BPJS: 'TAX_BPJS',
  ACCOUNTING_SAP: 'ACCOUNTING_SAP',
  ACCOUNTING_ACCURATE: 'ACCOUNTING_ACCURATE',
  ACCOUNTING_JURNAL: 'ACCOUNTING_JURNAL',
  GENERIC_CSV: 'GENERIC_CSV',
} as const;

// API Functions
export const payrollExportApi = {
  // Templates
  getTemplates: async (filters?: TemplateFilters): Promise<PayrollExportTemplate[]> => {
    const params = new URLSearchParams();
    if (filters?.exportFormat) params.append('exportFormat', filters.exportFormat);
    if (filters?.targetSystem) params.append('targetSystem', filters.targetSystem);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);
    
    const response = await client.get(`/api/hrms/payroll-exports/templates?${params}`);
    return response.data.data;
  },

  getTemplateById: async (id: string): Promise<PayrollExportTemplate> => {
    const response = await client.get(`/api/hrms/payroll-exports/templates/${id}`);
    return response.data.data;
  },

  createTemplate: async (data: CreateTemplateRequest): Promise<PayrollExportTemplate> => {
    const response = await client.post('/api/hrms/payroll-exports/templates', data);
    return response.data.data;
  },

  updateTemplate: async (id: string, data: UpdateTemplateRequest): Promise<PayrollExportTemplate> => {
    const response = await client.patch(`/api/hrms/payroll-exports/templates/${id}`, data);
    return response.data.data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await client.delete(`/api/hrms/payroll-exports/templates/${id}`);
  },

  duplicateTemplate: async (id: string, newName: string): Promise<PayrollExportTemplate> => {
    const response = await client.post(`/api/hrms/payroll-exports/templates/${id}/duplicate`, { name: newName });
    return response.data.data;
  },

  // Exports
  getExports: async (filters?: ExportFilters): Promise<PayrollExport[]> => {
    const params = new URLSearchParams();
    if (filters?.exportType) params.append('exportType', filters.exportType);
    if (filters?.periodYear) params.append('periodYear', String(filters.periodYear));
    if (filters?.periodMonth) params.append('periodMonth', String(filters.periodMonth));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.templateId) params.append('templateId', filters.templateId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await client.get(`/api/hrms/payroll-exports?${params}`);
    return response.data.data;
  },

  getExportById: async (id: string): Promise<PayrollExport> => {
    const response = await client.get(`/api/hrms/payroll-exports/${id}`);
    return response.data.data;
  },

  getExportDetails: async (id: string): Promise<PayrollExportDetail[]> => {
    const response = await client.get(`/api/hrms/payroll-exports/${id}/details`);
    return response.data.data;
  },

  createExport: async (data: CreateExportRequest): Promise<PayrollExport> => {
    const response = await client.post('/api/hrms/payroll-exports', data);
    return response.data.data;
  },

  generateExport: async (id: string): Promise<PayrollExport> => {
    const response = await client.post(`/api/hrms/payroll-exports/${id}/generate`);
    return response.data.data;
  },

  cancelExport: async (id: string): Promise<PayrollExport> => {
    const response = await client.post(`/api/hrms/payroll-exports/${id}/cancel`);
    return response.data.data;
  },

  retryExport: async (id: string): Promise<PayrollExport> => {
    const response = await client.post(`/api/hrms/payroll-exports/${id}/retry`);
    return response.data.data;
  },

  downloadExport: async (id: string): Promise<Blob> => {
    const response = await client.get(`/api/hrms/payroll-exports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Preview & Validation
  previewExport: async (data: CreateExportRequest): Promise<ExportPreview> => {
    const response = await client.post('/api/hrms/payroll-exports/preview', data);
    return response.data.data;
  },

  validateExport: async (data: CreateExportRequest): Promise<ExportValidationResult> => {
    const response = await client.post('/api/hrms/payroll-exports/validate', data);
    return response.data.data;
  },

  // Stats
  getStats: async (): Promise<ExportStats> => {
    const response = await client.get('/api/hrms/payroll-exports/stats');
    return response.data.data;
  },

  // Available fields for mapping
  getAvailableFields: async (): Promise<Array<{ field: string; label: string; dataType: string }>> => {
    const response = await client.get('/api/hrms/payroll-exports/available-fields');
    return response.data.data;
  },
};
