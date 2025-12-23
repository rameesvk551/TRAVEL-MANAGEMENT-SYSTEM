// domain/entities/hrms/CostCenter.ts
// Cost Center & Labor Cost Domain Entities

export type CostCenterType = 'DEPARTMENT' | 'PROJECT' | 'LOCATION' | 'PRODUCT_LINE' | 'BUSINESS_UNIT' | 'CUSTOM';
export type CostType = 'SALARY' | 'OVERTIME' | 'BONUS' | 'ALLOWANCE' | 'INSURANCE' | 'TAX' | 'PENSION' | 'TRAINING' | 'RECRUITMENT' | 'OTHER';
export type BudgetPeriodType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type BudgetStatus = 'ON_TRACK' | 'AT_RISK' | 'OVER_BUDGET' | 'UNDER_BUDGET';

export interface CostCenter {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  costCenterType: CostCenterType;
  managerId?: string;
  budgetAmount?: number;
  budgetCurrency: string;
  fiscalYear?: number;
  isActive: boolean;
  glAccountCode?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  parent?: CostCenter;
  children?: CostCenter[];
  manager?: { id: string; name: string };
}

export interface EmployeeCostAllocation {
  id: string;
  tenantId: string;
  employeeId: string;
  costCenterId: string;
  allocationPercentage: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  employee?: { id: string; name: string };
  costCenter?: CostCenter;
}

export interface LaborCost {
  id: string;
  tenantId: string;
  employeeId: string;
  costCenterId: string;
  periodYear: number;
  periodMonth: number;
  costType: CostType;
  amount: number;
  currency: string;
  allocationPercentage: number;
  notes?: string;
  sourceReference?: string;
  createdAt: Date;
  // Joined data
  employee?: { id: string; name: string };
  costCenter?: CostCenter;
}

export interface CostCenterBudget {
  id: string;
  tenantId: string;
  costCenterId: string;
  fiscalYear: number;
  periodType: BudgetPeriodType;
  periodNumber?: number;
  budgetAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercentage?: number;
  currency: string;
  status: BudgetStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  costCenter?: CostCenter;
}

// Aggregated types for reporting
export interface CostCenterSummary {
  costCenter: CostCenter;
  totalBudget: number;
  totalActual: number;
  variance: number;
  variancePercentage: number;
  headcount: number;
  avgCostPerEmployee: number;
  costsByType: Array<{ type: CostType; amount: number }>;
}

export interface LaborCostReport {
  periodYear: number;
  periodMonth: number;
  totalCost: number;
  byDepartment: Array<{ departmentId: string; departmentName: string; amount: number }>;
  byCostType: Array<{ type: CostType; amount: number }>;
  byEmployee: Array<{ employeeId: string; employeeName: string; amount: number }>;
  trend: Array<{ month: string; amount: number }>;
}
