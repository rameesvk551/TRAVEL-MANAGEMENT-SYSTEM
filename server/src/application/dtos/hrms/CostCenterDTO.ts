// application/dtos/hrms/CostCenterDTO.ts
// Cost Center & Labor Cost DTOs and Mappers

import type {
  CostCenter,
  EmployeeCostAllocation,
  LaborCost,
  CostCenterBudget,
  CostCenterType,
  CostType,
  BudgetPeriodType,
  BudgetStatus,
} from '../../../domain/entities/hrms/CostCenter';

// Request DTOs
export interface CreateCostCenterDTO {
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  costCenterType: CostCenterType;
  managerId?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  fiscalYear?: number;
  glAccountCode?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCostCenterDTO {
  code?: string;
  name?: string;
  description?: string;
  parentId?: string;
  costCenterType?: CostCenterType;
  managerId?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  fiscalYear?: number;
  isActive?: boolean;
  glAccountCode?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateEmployeeCostAllocationDTO {
  employeeId: string;
  costCenterId: string;
  allocationPercentage: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isPrimary?: boolean;
}

export interface UpdateEmployeeCostAllocationDTO {
  allocationPercentage?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  isPrimary?: boolean;
}

export interface CreateLaborCostDTO {
  employeeId: string;
  costCenterId: string;
  periodYear: number;
  periodMonth: number;
  costType: CostType;
  amount: number;
  currency?: string;
  allocationPercentage?: number;
  notes?: string;
  sourceReference?: string;
}

export interface CreateCostCenterBudgetDTO {
  costCenterId: string;
  fiscalYear: number;
  periodType: BudgetPeriodType;
  periodNumber?: number;
  budgetAmount: number;
  currency?: string;
  notes?: string;
}

export interface UpdateCostCenterBudgetDTO {
  budgetAmount?: number;
  actualAmount?: number;
  status?: BudgetStatus;
  notes?: string;
}

// Filter DTOs
export interface CostCenterFiltersDTO {
  costCenterType?: CostCenterType;
  parentId?: string;
  managerId?: string;
  isActive?: boolean;
  fiscalYear?: number;
  search?: string;
}

export interface CostAllocationFiltersDTO {
  employeeId?: string;
  costCenterId?: string;
  effectiveDate?: string;
  isPrimary?: boolean;
}

export interface LaborCostFiltersDTO {
  employeeId?: string;
  costCenterId?: string;
  periodYear?: number;
  periodMonth?: number;
  costType?: CostType;
}

export interface BudgetFiltersDTO {
  costCenterId?: string;
  fiscalYear?: number;
  periodType?: BudgetPeriodType;
  status?: BudgetStatus;
}

// Response DTOs
export interface CostCenterResponseDTO {
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
  createdAt: string;
  updatedAt: string;
  parent?: CostCenterResponseDTO;
  children?: CostCenterResponseDTO[];
  manager?: { id: string; name: string };
}

export interface EmployeeCostAllocationResponseDTO {
  id: string;
  tenantId: string;
  employeeId: string;
  costCenterId: string;
  allocationPercentage: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  employee?: { id: string; name: string };
  costCenter?: CostCenterResponseDTO;
}

export interface LaborCostResponseDTO {
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
  createdAt: string;
  employee?: { id: string; name: string };
  costCenter?: CostCenterResponseDTO;
}

export interface CostCenterBudgetResponseDTO {
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
  createdAt: string;
  updatedAt: string;
  costCenter?: CostCenterResponseDTO;
}

// Report/Summary DTOs
export interface CostCenterSummaryResponseDTO {
  costCenter: CostCenterResponseDTO;
  totalBudget: number;
  totalActual: number;
  variance: number;
  variancePercentage: number;
  headcount: number;
  avgCostPerEmployee: number;
  costsByType: Array<{ type: CostType; amount: number }>;
}

export interface LaborCostReportResponseDTO {
  periodYear: number;
  periodMonth: number;
  totalCost: number;
  byDepartment: Array<{ departmentId: string; departmentName: string; amount: number }>;
  byCostType: Array<{ type: CostType; amount: number }>;
  byEmployee: Array<{ employeeId: string; employeeName: string; amount: number }>;
  trend: Array<{ month: string; amount: number }>;
}

export interface BudgetVsActualReportDTO {
  fiscalYear: number;
  costCenters: Array<{
    costCenterId: string;
    costCenterName: string;
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
    status: BudgetStatus;
    monthlyBreakdown: Array<{
      month: number;
      budget: number;
      actual: number;
      variance: number;
    }>;
  }>;
  totals: {
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
  };
}

// Mappers
export const CostCenterMapper = {
  toCostCenterResponseDTO(costCenter: CostCenter): CostCenterResponseDTO {
    return {
      id: costCenter.id,
      tenantId: costCenter.tenantId,
      code: costCenter.code,
      name: costCenter.name,
      description: costCenter.description,
      parentId: costCenter.parentId,
      costCenterType: costCenter.costCenterType,
      managerId: costCenter.managerId,
      budgetAmount: costCenter.budgetAmount,
      budgetCurrency: costCenter.budgetCurrency,
      fiscalYear: costCenter.fiscalYear,
      isActive: costCenter.isActive,
      glAccountCode: costCenter.glAccountCode,
      metadata: costCenter.metadata,
      createdAt: costCenter.createdAt.toISOString(),
      updatedAt: costCenter.updatedAt.toISOString(),
      parent: costCenter.parent ? CostCenterMapper.toCostCenterResponseDTO(costCenter.parent) : undefined,
      children: costCenter.children?.map(CostCenterMapper.toCostCenterResponseDTO),
      manager: costCenter.manager,
    };
  },

  toAllocationResponseDTO(allocation: EmployeeCostAllocation): EmployeeCostAllocationResponseDTO {
    return {
      id: allocation.id,
      tenantId: allocation.tenantId,
      employeeId: allocation.employeeId,
      costCenterId: allocation.costCenterId,
      allocationPercentage: allocation.allocationPercentage,
      effectiveFrom: allocation.effectiveFrom.toISOString().split('T')[0],
      effectiveTo: allocation.effectiveTo?.toISOString().split('T')[0],
      isPrimary: allocation.isPrimary,
      createdAt: allocation.createdAt.toISOString(),
      updatedAt: allocation.updatedAt.toISOString(),
      employee: allocation.employee,
      costCenter: allocation.costCenter ? CostCenterMapper.toCostCenterResponseDTO(allocation.costCenter) : undefined,
    };
  },

  toLaborCostResponseDTO(laborCost: LaborCost): LaborCostResponseDTO {
    return {
      id: laborCost.id,
      tenantId: laborCost.tenantId,
      employeeId: laborCost.employeeId,
      costCenterId: laborCost.costCenterId,
      periodYear: laborCost.periodYear,
      periodMonth: laborCost.periodMonth,
      costType: laborCost.costType,
      amount: laborCost.amount,
      currency: laborCost.currency,
      allocationPercentage: laborCost.allocationPercentage,
      notes: laborCost.notes,
      sourceReference: laborCost.sourceReference,
      createdAt: laborCost.createdAt.toISOString(),
      employee: laborCost.employee,
      costCenter: laborCost.costCenter ? CostCenterMapper.toCostCenterResponseDTO(laborCost.costCenter) : undefined,
    };
  },

  toBudgetResponseDTO(budget: CostCenterBudget): CostCenterBudgetResponseDTO {
    return {
      id: budget.id,
      tenantId: budget.tenantId,
      costCenterId: budget.costCenterId,
      fiscalYear: budget.fiscalYear,
      periodType: budget.periodType,
      periodNumber: budget.periodNumber,
      budgetAmount: budget.budgetAmount,
      actualAmount: budget.actualAmount,
      varianceAmount: budget.varianceAmount,
      variancePercentage: budget.variancePercentage,
      currency: budget.currency,
      status: budget.status,
      notes: budget.notes,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
      costCenter: budget.costCenter ? CostCenterMapper.toCostCenterResponseDTO(budget.costCenter) : undefined,
    };
  },
};
