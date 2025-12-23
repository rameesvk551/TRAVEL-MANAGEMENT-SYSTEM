// api/hrms/costCenterApi.ts
// Cost Center & Labor Cost API

import { apiClient as client } from '../client';

// Types
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
  createdAt: string;
  updatedAt: string;
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
  effectiveFrom: string;
  effectiveTo?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
  costCenter?: CostCenter;
}

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

export interface BudgetVsActualReport {
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

// Request types
export interface CreateCostCenterRequest {
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

export interface UpdateCostCenterRequest {
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

export interface CreateAllocationRequest {
  employeeId: string;
  costCenterId: string;
  allocationPercentage: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isPrimary?: boolean;
}

export interface UpdateAllocationRequest {
  allocationPercentage?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  isPrimary?: boolean;
}

export interface CreateLaborCostRequest {
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

export interface CreateBudgetRequest {
  costCenterId: string;
  fiscalYear: number;
  periodType: BudgetPeriodType;
  periodNumber?: number;
  budgetAmount: number;
  currency?: string;
  notes?: string;
}

export interface UpdateBudgetRequest {
  budgetAmount?: number;
  actualAmount?: number;
  status?: BudgetStatus;
  notes?: string;
}

// Filter types
export interface CostCenterFilters {
  costCenterType?: CostCenterType;
  parentId?: string;
  managerId?: string;
  isActive?: boolean;
  fiscalYear?: number;
  search?: string;
}

export interface AllocationFilters {
  employeeId?: string;
  costCenterId?: string;
  effectiveDate?: string;
  isPrimary?: boolean;
}

export interface LaborCostFilters {
  employeeId?: string;
  costCenterId?: string;
  periodYear?: number;
  periodMonth?: number;
  costType?: CostType;
}

export interface BudgetFilters {
  costCenterId?: string;
  fiscalYear?: number;
  periodType?: BudgetPeriodType;
  status?: BudgetStatus;
}

// API Functions
export const costCenterApi = {
  // Cost Centers
  getCostCenters: async (filters?: CostCenterFilters): Promise<CostCenter[]> => {
    const params = new URLSearchParams();
    if (filters?.costCenterType) params.append('costCenterType', filters.costCenterType);
    if (filters?.parentId) params.append('parentId', filters.parentId);
    if (filters?.managerId) params.append('managerId', filters.managerId);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.fiscalYear) params.append('fiscalYear', String(filters.fiscalYear));
    if (filters?.search) params.append('search', filters.search);
    
    const response = await client.get(`/api/hrms/cost-centers?${params}`);
    return response.data.data;
  },

  getCostCenterById: async (id: string): Promise<CostCenter> => {
    const response = await client.get(`/api/hrms/cost-centers/${id}`);
    return response.data.data;
  },

  getCostCenterByCode: async (code: string): Promise<CostCenter> => {
    const response = await client.get(`/api/hrms/cost-centers/code/${code}`);
    return response.data.data;
  },

  getCostCenterTree: async (): Promise<CostCenter[]> => {
    const response = await client.get('/api/hrms/cost-centers/tree');
    return response.data.data;
  },

  createCostCenter: async (data: CreateCostCenterRequest): Promise<CostCenter> => {
    const response = await client.post('/api/hrms/cost-centers', data);
    return response.data.data;
  },

  updateCostCenter: async (id: string, data: UpdateCostCenterRequest): Promise<CostCenter> => {
    const response = await client.patch(`/api/hrms/cost-centers/${id}`, data);
    return response.data.data;
  },

  deleteCostCenter: async (id: string): Promise<void> => {
    await client.delete(`/api/hrms/cost-centers/${id}`);
  },

  getCostCenterSummary: async (id: string, fiscalYear?: number): Promise<CostCenterSummary> => {
    const params = fiscalYear ? `?fiscalYear=${fiscalYear}` : '';
    const response = await client.get(`/api/hrms/cost-centers/${id}/summary${params}`);
    return response.data.data;
  },

  // Allocations
  getAllocations: async (filters?: AllocationFilters): Promise<EmployeeCostAllocation[]> => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.costCenterId) params.append('costCenterId', filters.costCenterId);
    if (filters?.effectiveDate) params.append('effectiveDate', filters.effectiveDate);
    if (filters?.isPrimary !== undefined) params.append('isPrimary', String(filters.isPrimary));
    
    const response = await client.get(`/api/hrms/cost-allocations?${params}`);
    return response.data.data;
  },

  getAllocationById: async (id: string): Promise<EmployeeCostAllocation> => {
    const response = await client.get(`/api/hrms/cost-allocations/${id}`);
    return response.data.data;
  },

  getEmployeeAllocations: async (employeeId: string): Promise<EmployeeCostAllocation[]> => {
    const response = await client.get(`/api/hrms/cost-allocations/employee/${employeeId}`);
    return response.data.data;
  },

  createAllocation: async (data: CreateAllocationRequest): Promise<EmployeeCostAllocation> => {
    const response = await client.post('/api/hrms/cost-allocations', data);
    return response.data.data;
  },

  updateAllocation: async (id: string, data: UpdateAllocationRequest): Promise<EmployeeCostAllocation> => {
    const response = await client.patch(`/api/hrms/cost-allocations/${id}`, data);
    return response.data.data;
  },

  deleteAllocation: async (id: string): Promise<void> => {
    await client.delete(`/api/hrms/cost-allocations/${id}`);
  },

  // Labor Costs
  getLaborCosts: async (filters?: LaborCostFilters): Promise<LaborCost[]> => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.costCenterId) params.append('costCenterId', filters.costCenterId);
    if (filters?.periodYear) params.append('periodYear', String(filters.periodYear));
    if (filters?.periodMonth) params.append('periodMonth', String(filters.periodMonth));
    if (filters?.costType) params.append('costType', filters.costType);
    
    const response = await client.get(`/api/hrms/labor-costs?${params}`);
    return response.data.data;
  },

  createLaborCost: async (data: CreateLaborCostRequest): Promise<LaborCost> => {
    const response = await client.post('/api/hrms/labor-costs', data);
    return response.data.data;
  },

  createBulkLaborCosts: async (data: CreateLaborCostRequest[]): Promise<LaborCost[]> => {
    const response = await client.post('/api/hrms/labor-costs/bulk', { items: data });
    return response.data.data;
  },

  getLaborCostReport: async (periodYear: number, periodMonth?: number): Promise<LaborCostReport> => {
    const params = periodMonth ? `?periodMonth=${periodMonth}` : '';
    const response = await client.get(`/api/hrms/labor-costs/report/${periodYear}${params}`);
    return response.data.data;
  },

  // Budgets
  getBudgets: async (filters?: BudgetFilters): Promise<CostCenterBudget[]> => {
    const params = new URLSearchParams();
    if (filters?.costCenterId) params.append('costCenterId', filters.costCenterId);
    if (filters?.fiscalYear) params.append('fiscalYear', String(filters.fiscalYear));
    if (filters?.periodType) params.append('periodType', filters.periodType);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await client.get(`/api/hrms/budgets?${params}`);
    return response.data.data;
  },

  getBudgetById: async (id: string): Promise<CostCenterBudget> => {
    const response = await client.get(`/api/hrms/budgets/${id}`);
    return response.data.data;
  },

  createBudget: async (data: CreateBudgetRequest): Promise<CostCenterBudget> => {
    const response = await client.post('/api/hrms/budgets', data);
    return response.data.data;
  },

  updateBudget: async (id: string, data: UpdateBudgetRequest): Promise<CostCenterBudget> => {
    const response = await client.patch(`/api/hrms/budgets/${id}`, data);
    return response.data.data;
  },

  deleteBudget: async (id: string): Promise<void> => {
    await client.delete(`/api/hrms/budgets/${id}`);
  },

  getBudgetVsActualReport: async (fiscalYear: number): Promise<BudgetVsActualReport> => {
    const response = await client.get(`/api/hrms/budgets/report/${fiscalYear}`);
    return response.data.data;
  },

  // Sync from payroll
  syncFromPayroll: async (periodYear: number, periodMonth: number): Promise<{ synced: number; errors: number }> => {
    const response = await client.post('/api/hrms/labor-costs/sync-payroll', { periodYear, periodMonth });
    return response.data.data;
  },
};
