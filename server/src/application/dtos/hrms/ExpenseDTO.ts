// application/dtos/hrms/ExpenseDTO.ts
// Expense DTOs and Mappers

import type { ExpenseClaim, ExpenseItem, ExpenseStatus } from '../../../domain/entities/hrms/Expense';

// Request DTOs
export interface CreateExpenseItemDTO {
  description: string;
  category: 'TRANSPORT' | 'ACCOMMODATION' | 'MEALS' | 'COMMUNICATION' | 'EQUIPMENT' | 'FUEL' | 'TOLLS' | 'PARKING' | 'ENTERTAINMENT' | 'SUPPLIES' | 'OTHER';
  amount: number;
  currency: string;
  date: string;
  paymentMethod: 'CASH' | 'COMPANY_CARD' | 'PERSONAL_CARD' | 'BANK_TRANSFER' | 'OTHER';
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

export interface UpdateExpenseClaimDTO {
  title?: string;
  description?: string;
}

export interface AddExpenseItemDTO {
  claimId: string;
  item: CreateExpenseItemDTO;
}

export interface ApproveExpenseDTO {
  comments?: string;
}

export interface RejectExpenseDTO {
  reason: string;
}

export interface MarkPaidDTO {
  paymentReference: string;
}

export interface ExpenseFiltersDTO {
  employeeId?: string;
  status?: ExpenseStatus;
  tripId?: string;
  startDate?: string;
  endDate?: string;
}

// Response DTOs
export interface ExpenseItemResponseDTO {
  id: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: string;
  receiptUrl?: string;
  receiptFileName?: string;
  notes?: string;
}

export interface ExpenseClaimResponseDTO {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  claimNumber: string;
  title: string;
  description?: string;
  tripId?: string;
  tripName?: string;
  items: ExpenseItemResponseDTO[];
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

export interface ExpenseStatsResponseDTO {
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

// Mappers
export const ExpenseMapper = {
  toItemResponseDTO(item: ExpenseItem): ExpenseItemResponseDTO {
    return {
      id: item.id,
      description: item.description,
      category: item.category,
      amount: item.amount,
      currency: item.currency,
      date: item.date.toISOString().split('T')[0],
      paymentMethod: item.paymentMethod,
      receiptUrl: item.receiptUrl,
      receiptFileName: item.receiptFileName,
      notes: item.notes,
    };
  },

  toResponseDTO(entity: ExpenseClaim): ExpenseClaimResponseDTO {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      employeeId: entity.employeeId,
      employeeName: entity.employeeName,
      claimNumber: entity.claimNumber,
      title: entity.title,
      description: entity.description,
      tripId: entity.tripId,
      tripName: entity.tripName,
      items: entity.items.map(item => ExpenseMapper.toItemResponseDTO(item)),
      totalAmount: entity.totalAmount,
      currency: entity.currency,
      status: entity.status,
      submittedAt: entity.submittedAt?.toISOString(),
      reviewedBy: entity.reviewedBy,
      reviewedAt: entity.reviewedAt?.toISOString(),
      reviewerComments: entity.reviewerComments,
      approvedBy: entity.approvedBy,
      approvedAt: entity.approvedAt?.toISOString(),
      approvalComments: entity.approvalComments,
      rejectedBy: entity.rejectedBy,
      rejectedAt: entity.rejectedAt?.toISOString(),
      rejectionReason: entity.rejectionReason,
      paidAt: entity.paidAt?.toISOString(),
      paymentReference: entity.paymentReference,
      attachments: entity.attachments,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      createdBy: entity.createdBy,
    };
  },

  toStatsResponseDTO(stats: {
    totalClaims: number;
    totalAmount: number;
    pendingAmount: number;
    approvedAmount: number;
    paidAmount: number;
    byCategory: Array<{ category: string; amount: number; count: number }>;
    byMonth: Array<{ month: string; amount: number; count: number }>;
  }): ExpenseStatsResponseDTO {
    return stats;
  },
};
