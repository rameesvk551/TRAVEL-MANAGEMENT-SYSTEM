// domain/entities/hrms/Payroll.ts
// Flexible payroll for travel industry

export type PayModel = 
  | 'MONTHLY' 
  | 'DAILY' 
  | 'PER_TRIP' 
  | 'HOURLY' 
  | 'MIXED';

export type PayComponentType = 
  | 'EARNING' 
  | 'DEDUCTION' 
  | 'REIMBURSEMENT';

export interface PayComponent {
  code: string;
  name: string;
  type: PayComponentType;
  amount: number;
  isPercentage: boolean;
  percentageOf?: string;  // 'basic', 'gross'
  isTaxable: boolean;
}

export interface PayStructure {
  id: string;
  tenantId: string;
  employeeId: string;
  
  effectiveFrom: Date;
  effectiveTo?: Date;
  
  payModel: PayModel;
  
  // Base compensation
  baseSalary: number;
  dailyRate?: number;
  tripRate?: number;
  hourlyRate?: number;
  
  // Components
  components: PayComponent[];
  
  // Bank details
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  
  currency: string;
  
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PayPeriod {
  year: number;
  month: number;  // 1-12
  startDate: Date;
  endDate: Date;
}

export type PayslipStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'PAID' 
  | 'CANCELLED';

export interface PayslipLine {
  code: string;
  name: string;
  type: PayComponentType;
  amount: number;
  days?: number;
  rate?: number;
}

export interface TripEarning {
  tripId: string;
  tripName: string;
  role: string;
  days: number;
  amount: number;
}

export interface Payslip {
  id: string;
  tenantId: string;
  employeeId: string;
  
  payStructureId: string;
  period: PayPeriod;
  
  // Attendance summary
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  tripDays: number;
  overtimeHours: number;
  
  // Earnings
  earnings: PayslipLine[];
  grossEarnings: number;
  
  // Deductions
  deductions: PayslipLine[];
  totalDeductions: number;
  
  // Trip-based
  tripEarnings: TripEarning[];
  totalTripEarnings: number;
  
  // Reimbursements
  reimbursements: PayslipLine[];
  totalReimbursements: number;
  
  // Net
  netPayable: number;
  
  // Status
  status: PayslipStatus;
  
  // Workflow
  generatedAt: Date;
  generatedBy: string;
  approvedAt?: Date;
  approvedBy?: string;
  paidAt?: Date;
  
  // Payment
  paymentMode?: 'BANK' | 'CASH' | 'CHEQUE';
  paymentReference?: string;
  
  // Export
  exportedToAccounting: boolean;
  exportReference?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export function createPayStructure(
  params: Omit<PayStructure, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>
): Omit<PayStructure, 'id'> {
  return {
    ...params,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function calculateGrossEarnings(earnings: PayslipLine[]): number {
  return earnings.reduce((sum, e) => sum + e.amount, 0);
}

export function calculateTotalDeductions(deductions: PayslipLine[]): number {
  return deductions.reduce((sum, d) => sum + d.amount, 0);
}

export function calculateNetPayable(payslip: Payslip): number {
  return payslip.grossEarnings + 
         payslip.totalTripEarnings + 
         payslip.totalReimbursements - 
         payslip.totalDeductions;
}

export function generatePayPeriod(year: number, month: number): PayPeriod {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);  // Last day of month
  
  return { year, month, startDate, endDate };
}

export function getPayModelLabel(model: PayModel): string {
  const labels: Record<PayModel, string> = {
    MONTHLY: 'Monthly Salary',
    DAILY: 'Daily Wage',
    PER_TRIP: 'Per Trip',
    HOURLY: 'Hourly',
    MIXED: 'Base + Trip Bonus',
  };
  return labels[model];
}
