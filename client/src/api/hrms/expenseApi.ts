// api/hrms/expenseApi.ts
// Expense Claims API

import { apiClient as client } from '../client';

// Types
export type ExpenseStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
export type ExpenseCategory = 'TRANSPORT' | 'ACCOMMODATION' | 'MEALS' | 'COMMUNICATION' | 'EQUIPMENT' | 'FUEL' | 'TOLLS' | 'PARKING' | 'ENTERTAINMENT' | 'SUPPLIES' | 'OTHER';
export type PaymentMethod = 'CASH' | 'COMPANY_CARD' | 'PERSONAL_CARD' | 'BANK_TRANSFER' | 'OTHER';

export interface ExpenseItem {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  receiptFileName?: string;
  notes?: string;
}

export interface ExpenseClaim {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  claimNumber: string;
  title: string;
  description?: string;
  tripId?: string;
  tripName?: string;
  items: ExpenseItem[];
  totalAmount: number;
  currency: string;
  status: ExpenseStatus;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerComments?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalComments?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  paidAt?: string;
  paymentReference?: string;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ExpenseStats {
  totalClaims: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  byCategory: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  byMonth: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

export interface CreateExpenseItemDTO {
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  receiptFileName?: string;
  notes?: string;
}

export interface CreateExpenseClaimDTO {
  title: string;
  description?: string;
  tripId?: string;
  items: CreateExpenseItemDTO[];
  currency: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
}

export interface ExpenseFilters {
  employeeId?: string;
  status?: ExpenseStatus;
  tripId?: string;
  startDate?: string;
  endDate?: string;
}

// API Functions
export const expenseApi = {
  // Get all expense claims
  getAll: async (filters?: ExpenseFilters): Promise<ExpenseClaim[]> => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.set('employeeId', filters.employeeId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.tripId) params.set('tripId', filters.tripId);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);

    const response = await client.get(`/hrms/expenses?${params}`);
    return response.data.data;
  },

  // Get my expenses
  getMyExpenses: async (): Promise<ExpenseClaim[]> => {
    const response = await client.get('/hrms/expenses/my-expenses');
    return response.data.data;
  },

  // Get pending approval
  getPendingApproval: async (): Promise<ExpenseClaim[]> => {
    const response = await client.get('/hrms/expenses/pending-approval');
    return response.data.data;
  },

  // Get by ID
  getById: async (id: string): Promise<ExpenseClaim> => {
    const response = await client.get(`/hrms/expenses/${id}`);
    return response.data.data;
  },

  // Get by claim number
  getByClaimNumber: async (claimNumber: string): Promise<ExpenseClaim> => {
    const response = await client.get(`/hrms/expenses/claim/${claimNumber}`);
    return response.data.data;
  },

  // Get by employee
  getByEmployee: async (employeeId: string): Promise<ExpenseClaim[]> => {
    const response = await client.get(`/hrms/expenses/employee/${employeeId}`);
    return response.data.data;
  },

  // Get stats
  getStats: async (startDate?: string, endDate?: string): Promise<ExpenseStats> => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const response = await client.get(`/hrms/expenses/stats?${params}`);
    return response.data.data;
  },

  // Create expense claim
  create: async (data: CreateExpenseClaimDTO): Promise<ExpenseClaim> => {
    const response = await client.post('/hrms/expenses', data);
    return response.data.data;
  },

  // Update expense claim
  update: async (id: string, data: Partial<CreateExpenseClaimDTO>): Promise<ExpenseClaim> => {
    const response = await client.put(`/hrms/expenses/${id}`, data);
    return response.data.data;
  },

  // Delete expense claim
  delete: async (id: string): Promise<void> => {
    await client.delete(`/hrms/expenses/${id}`);
  },

  // Submit expense claim
  submit: async (id: string): Promise<ExpenseClaim> => {
    const response = await client.post(`/hrms/expenses/${id}/submit`);
    return response.data.data;
  },

  // Approve expense claim
  approve: async (id: string, comments?: string): Promise<ExpenseClaim> => {
    const response = await client.post(`/hrms/expenses/${id}/approve`, { comments });
    return response.data.data;
  },

  // Reject expense claim
  reject: async (id: string, reason: string): Promise<ExpenseClaim> => {
    const response = await client.post(`/hrms/expenses/${id}/reject`, { reason });
    return response.data.data;
  },

  // Mark as paid
  markAsPaid: async (id: string, paymentReference: string): Promise<ExpenseClaim> => {
    const response = await client.post(`/hrms/expenses/${id}/mark-paid`, { paymentReference });
    return response.data.data;
  },
};
