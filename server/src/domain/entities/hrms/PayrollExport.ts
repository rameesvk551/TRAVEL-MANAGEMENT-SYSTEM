// domain/entities/hrms/PayrollExport.ts
// Payroll Export Domain Entities

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
  transform?: string; // transformation function name
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
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  exportedAt: Date;
  metadata: Record<string, unknown>;
  // Joined data
  template?: PayrollExportTemplate;
  exporter?: { id: string; name: string };
  details?: PayrollExportDetail[];
}

export interface PayrollExportDetail {
  id: string;
  exportId: string;
  employeeId: string;
  rowData: Record<string, unknown>;
  validationStatus: ValidationStatus;
  validationMessages: Array<{ field: string; message: string; severity: ValidationStatus }>;
  createdAt: Date;
  // Joined data
  employee?: { id: string; name: string; employeeNumber: string };
}

// Common target systems
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

// Pre-defined field mappings for common export types
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
