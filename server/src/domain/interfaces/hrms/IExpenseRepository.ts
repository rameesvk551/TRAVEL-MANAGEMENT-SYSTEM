// domain/interfaces/hrms/IExpenseRepository.ts
// Expense Repository Interface

import type { ExpenseClaim, ExpenseStatus, ExpenseCategory } from '../../entities/hrms/Expense';

export interface ExpenseFilters {
  tenantId: string;
  employeeId?: string;
  status?: ExpenseStatus;
  tripId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  category?: ExpenseCategory;
}

export interface ExpenseStats {
  totalClaims: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  byCategory: { category: ExpenseCategory; amount: number; count: number }[];
  byMonth: { month: string; amount: number; count: number }[];
}

export interface IExpenseRepository {
  // CRUD
  findById(id: string): Promise<ExpenseClaim | null>;
  findByClaimNumber(claimNumber: string): Promise<ExpenseClaim | null>;
  findAll(filters: ExpenseFilters): Promise<ExpenseClaim[]>;
  findByEmployee(employeeId: string, tenantId: string): Promise<ExpenseClaim[]>;
  findPendingApproval(tenantId: string, approverId?: string): Promise<ExpenseClaim[]>;
  create(expense: Omit<ExpenseClaim, 'id'>): Promise<ExpenseClaim>;
  update(id: string, expense: Partial<ExpenseClaim>): Promise<ExpenseClaim | null>;
  delete(id: string): Promise<boolean>;
  
  // Workflow
  submit(id: string): Promise<ExpenseClaim | null>;
  approve(id: string, approverId: string, comments?: string): Promise<ExpenseClaim | null>;
  reject(id: string, rejectorId: string, reason: string): Promise<ExpenseClaim | null>;
  markAsPaid(id: string, paymentReference: string): Promise<ExpenseClaim | null>;
  
  // Stats
  getStats(tenantId: string, startDate?: Date, endDate?: Date): Promise<ExpenseStats>;
  getEmployeeExpenseTotal(employeeId: string, startDate: Date, endDate: Date): Promise<number>;
}
