// application/dtos/hrms/PayrollDTO.ts
// DTOs for Payroll operations

import { PayModel, PayslipStatus } from '../../../domain/entities/hrms/Payroll';

// Create pay structure
export interface CreatePayStructureDTO {
  employeeId: string;
  effectiveFrom: string;
  payModel: PayModel;
  baseSalary: number;
  dailyRate?: number;
  tripRate?: number;
  hourlyRate?: number;
  components?: Array<{
    code: string;
    name: string;
    type: 'EARNING' | 'DEDUCTION';
    amount: number;
    isPercentage: boolean;
    percentageOf?: string;
    isTaxable: boolean;
  }>;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  currency?: string;
}

// Update pay structure
export interface UpdatePayStructureDTO {
  effectiveTo?: string;
  baseSalary?: number;
  dailyRate?: number;
  tripRate?: number;
  hourlyRate?: number;
  components?: Array<{
    code: string;
    name: string;
    type: 'EARNING' | 'DEDUCTION';
    amount: number;
    isPercentage: boolean;
    percentageOf?: string;
    isTaxable: boolean;
  }>;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

// Generate payroll
export interface GeneratePayrollDTO {
  year: number;
  month: number;
  employeeIds?: string[];  // If empty, all employees
  branchId?: string;
}

// Payroll approval
export interface PayrollActionDTO {
  payslipIds: string[];
  action: 'approve' | 'reject';
  comment?: string;
}

// Mark as paid
export interface MarkPaidDTO {
  payslipIds: string[];
  paymentMode: 'BANK' | 'CASH' | 'CHEQUE';
  paymentReference?: string;
  paymentDate: string;
}

// Pay structure response
export interface PayStructureResponseDTO {
  id: string;
  employeeId: string;
  employeeName: string;
  
  effectiveFrom: string;
  effectiveTo?: string;
  
  payModel: PayModel;
  payModelLabel: string;
  
  baseSalary: number;
  dailyRate?: number;
  tripRate?: number;
  hourlyRate?: number;
  
  components: Array<{
    code: string;
    name: string;
    type: 'EARNING' | 'DEDUCTION';
    amount: number;
    isPercentage: boolean;
  }>;
  
  grossSalary: number;  // Calculated
  netSalary: number;    // Calculated
  
  bankName?: string;
  accountNumber?: string;  // Masked
  
  currency: string;
  isActive: boolean;
}

// Payslip response
export interface PayslipResponseDTO {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  
  period: {
    year: number;
    month: number;
    label: string;  // "December 2025"
  };
  
  // Attendance
  attendance: {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    tripDays: number;
    overtimeHours: number;
  };
  
  // Earnings
  earnings: Array<{
    code: string;
    name: string;
    amount: number;
  }>;
  grossEarnings: number;
  
  // Trip earnings
  tripEarnings: Array<{
    tripName: string;
    role: string;
    days: number;
    amount: number;
  }>;
  totalTripEarnings: number;
  
  // Deductions
  deductions: Array<{
    code: string;
    name: string;
    amount: number;
  }>;
  totalDeductions: number;
  
  // Reimbursements
  reimbursements: Array<{
    code: string;
    name: string;
    amount: number;
  }>;
  totalReimbursements: number;
  
  // Net
  netPayable: number;
  netPayableInWords: string;
  
  // Status
  status: PayslipStatus;
  statusLabel: string;
  
  // Payment
  paymentMode?: string;
  paymentReference?: string;
  paidAt?: string;
  
  generatedAt: string;
  approvedAt?: string;
}

// Payroll summary
export interface PayrollSummaryDTO {
  period: {
    year: number;
    month: number;
    label: string;
  };
  
  // Counts
  totalEmployees: number;
  generated: number;
  pending: number;
  approved: number;
  paid: number;
  
  // Amounts
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  
  // By category
  byCategory: Array<{
    category: string;
    count: number;
    total: number;
  }>;
  
  // Progress
  progressPercentage: number;
}

// Pay model labels
export const PAY_MODEL_LABELS: Record<PayModel, string> = {
  MONTHLY: 'Monthly Salary',
  DAILY: 'Daily Wage',
  PER_TRIP: 'Per Trip',
  HOURLY: 'Hourly',
  MIXED: 'Base + Trip Bonus',
};

// Payslip status labels
export const PAYSLIP_STATUS_LABELS: Record<PayslipStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};
