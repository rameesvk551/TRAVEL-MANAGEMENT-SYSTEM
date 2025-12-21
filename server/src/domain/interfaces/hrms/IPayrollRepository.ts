// domain/interfaces/hrms/IPayrollRepository.ts
import { 
  PayStructure, 
  Payslip, 
  PayPeriod, 
  PayslipStatus 
} from '../../entities/hrms/Payroll';

export interface PayslipFilters {
  employeeId?: string;
  employeeIds?: string[];
  year?: number;
  month?: number;
  status?: PayslipStatus;
  branchId?: string;
}

export interface PayrollSummary {
  period: PayPeriod;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  byStatus: Record<PayslipStatus, number>;
}

export interface IPayrollRepository {
  // Pay Structures
  findStructureById(id: string, tenantId: string): Promise<PayStructure | null>;
  
  findActiveStructure(
    employeeId: string, 
    tenantId: string
  ): Promise<PayStructure | null>;
  
  findStructureHistory(
    employeeId: string, 
    tenantId: string
  ): Promise<PayStructure[]>;
  
  createStructure(structure: Omit<PayStructure, 'id'>): Promise<PayStructure>;
  updateStructure(id: string, structure: Partial<PayStructure>): Promise<PayStructure>;
  
  // Payslips
  findPayslipById(id: string, tenantId: string): Promise<Payslip | null>;
  
  findPayslip(
    employeeId: string, 
    year: number, 
    month: number, 
    tenantId: string
  ): Promise<Payslip | null>;
  
  findAllPayslips(
    tenantId: string, 
    filters: PayslipFilters
  ): Promise<Payslip[]>;
  
  createPayslip(payslip: Omit<Payslip, 'id'>): Promise<Payslip>;
  updatePayslip(id: string, payslip: Partial<Payslip>): Promise<Payslip>;
  
  // Bulk generation
  generatePayslipsForPeriod(
    tenantId: string, 
    period: PayPeriod
  ): Promise<Payslip[]>;
  
  // Status updates
  approvePayslips(
    payslipIds: string[], 
    approvedBy: string, 
    tenantId: string
  ): Promise<void>;
  
  markAsPaid(
    payslipIds: string[], 
    paymentMode: string, 
    paymentReference: string, 
    tenantId: string
  ): Promise<void>;
  
  // Summary
  getPayrollSummary(
    tenantId: string, 
    period: PayPeriod
  ): Promise<PayrollSummary>;
  
  // Export
  getPayslipsForExport(
    tenantId: string, 
    period: PayPeriod
  ): Promise<Payslip[]>;
  
  markAsExported(
    payslipIds: string[], 
    exportReference: string
  ): Promise<void>;
}
