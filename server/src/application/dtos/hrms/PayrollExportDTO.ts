// application/dtos/hrms/PayrollExportDTO.ts
// Payroll Export DTOs and Mappers

import type {
  PayrollExportTemplate,
  PayrollExport,
  PayrollExportDetail,
  FieldMapping,
  ExportFormat,
  ExportType,
  ExportStatus,
  ValidationStatus,
} from '../../../domain/entities/hrms/PayrollExport';

// Request DTOs
export interface CreatePayrollExportTemplateDTO {
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

export interface UpdatePayrollExportTemplateDTO {
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

export interface CreatePayrollExportDTO {
  templateId?: string;
  payrollRunId?: string;
  exportType: ExportType;
  periodYear: number;
  periodMonth: number;
  employeeIds?: string[]; // specific employees to export, or all if empty
  metadata?: Record<string, unknown>;
}

export interface GenerateExportDTO {
  exportId: string;
}

// Filter DTOs
export interface PayrollExportTemplateFiltersDTO {
  exportFormat?: ExportFormat;
  targetSystem?: string;
  isActive?: boolean;
  search?: string;
}

export interface PayrollExportFiltersDTO {
  exportType?: ExportType;
  periodYear?: number;
  periodMonth?: number;
  status?: ExportStatus;
  templateId?: string;
  startDate?: string;
  endDate?: string;
}

// Response DTOs
export interface PayrollExportTemplateResponseDTO {
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

export interface PayrollExportResponseDTO {
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
  template?: PayrollExportTemplateResponseDTO;
  exporter?: { id: string; name: string };
  details?: PayrollExportDetailResponseDTO[];
}

export interface PayrollExportDetailResponseDTO {
  id: string;
  exportId: string;
  employeeId: string;
  rowData: Record<string, unknown>;
  validationStatus: ValidationStatus;
  validationMessages: Array<{ field: string; message: string; severity: ValidationStatus }>;
  createdAt: string;
  employee?: { id: string; name: string; employeeNumber: string };
}

// Preview/Validation DTOs
export interface ExportPreviewDTO {
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

export interface ExportValidationResultDTO {
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

// Stats DTOs
export interface ExportStatsDTO {
  totalExports: number;
  byType: Array<{ type: ExportType; count: number }>;
  byStatus: Array<{ status: ExportStatus; count: number }>;
  byFormat: Array<{ format: ExportFormat; count: number }>;
  recentExports: PayrollExportResponseDTO[];
  totalAmountExported: number;
  totalRecordsExported: number;
}

// Mappers
export const PayrollExportMapper = {
  toTemplateResponseDTO(template: PayrollExportTemplate): PayrollExportTemplateResponseDTO {
    return {
      id: template.id,
      tenantId: template.tenantId,
      name: template.name,
      description: template.description,
      exportFormat: template.exportFormat,
      targetSystem: template.targetSystem,
      fieldMappings: template.fieldMappings,
      headerConfig: template.headerConfig,
      footerConfig: template.footerConfig,
      formattingRules: template.formattingRules,
      validationRules: template.validationRules,
      isActive: template.isActive,
      lastUsedAt: template.lastUsedAt?.toISOString(),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  },

  toExportResponseDTO(exportRecord: PayrollExport): PayrollExportResponseDTO {
    return {
      id: exportRecord.id,
      tenantId: exportRecord.tenantId,
      templateId: exportRecord.templateId,
      payrollRunId: exportRecord.payrollRunId,
      exportType: exportRecord.exportType,
      periodYear: exportRecord.periodYear,
      periodMonth: exportRecord.periodMonth,
      fileName: exportRecord.fileName,
      fileUrl: exportRecord.fileUrl,
      fileSize: exportRecord.fileSize,
      recordCount: exportRecord.recordCount,
      totalAmount: exportRecord.totalAmount,
      status: exportRecord.status,
      errorMessage: exportRecord.errorMessage,
      exportedBy: exportRecord.exportedBy,
      exportedAt: exportRecord.exportedAt.toISOString(),
      metadata: exportRecord.metadata,
      template: exportRecord.template ? PayrollExportMapper.toTemplateResponseDTO(exportRecord.template) : undefined,
      exporter: exportRecord.exporter,
      details: exportRecord.details?.map(PayrollExportMapper.toDetailResponseDTO),
    };
  },

  toDetailResponseDTO(detail: PayrollExportDetail): PayrollExportDetailResponseDTO {
    return {
      id: detail.id,
      exportId: detail.exportId,
      employeeId: detail.employeeId,
      rowData: detail.rowData,
      validationStatus: detail.validationStatus,
      validationMessages: detail.validationMessages,
      createdAt: detail.createdAt.toISOString(),
      employee: detail.employee,
    };
  },
};
