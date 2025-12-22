// domain/entities/hrms/Expense.ts
// Expense claims and reimbursements

export type ExpenseCategory = 
  | 'TRAVEL'
  | 'ACCOMMODATION'
  | 'MEALS'
  | 'TRANSPORT'
  | 'EQUIPMENT'
  | 'COMMUNICATION'
  | 'MEDICAL'
  | 'MISCELLANEOUS';

export type ExpenseStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CANCELLED';

export type PaymentMethod = 
  | 'CASH'
  | 'CARD'
  | 'UPI'
  | 'BANK_TRANSFER'
  | 'COMPANY_CARD'
  | 'PETTY_CASH';

export interface ExpenseItem {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: Date;
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
  
  // Claim info
  claimNumber: string;
  title: string;
  description?: string;
  
  // Trip association (optional)
  tripId?: string;
  tripName?: string;
  
  // Items
  items: ExpenseItem[];
  
  // Totals
  totalAmount: number;
  currency: string;
  
  // Status
  status: ExpenseStatus;
  
  // Approval workflow
  submittedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewerComments?: string;
  approvedBy?: string;
  approvedAt?: Date;
  approvalComments?: string;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  
  // Payment
  paidAt?: Date;
  paymentReference?: string;
  
  // Attachments
  attachments: string[];
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export function createExpenseClaim(
  params: Omit<ExpenseClaim, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'claimNumber' | 'totalAmount'>
): Omit<ExpenseClaim, 'id'> {
  const totalAmount = params.items.reduce((sum, item) => sum + item.amount, 0);
  
  return {
    ...params,
    claimNumber: generateClaimNumber(),
    totalAmount,
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function calculateClaimTotal(items: ExpenseItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function generateClaimNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EXP-${year}${month}-${random}`;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  TRAVEL: 'Travel',
  ACCOMMODATION: 'Accommodation',
  MEALS: 'Meals & Food',
  TRANSPORT: 'Local Transport',
  EQUIPMENT: 'Equipment & Gear',
  COMMUNICATION: 'Communication',
  MEDICAL: 'Medical',
  MISCELLANEOUS: 'Miscellaneous',
};

export const EXPENSE_LIMITS: Partial<Record<ExpenseCategory, number>> = {
  MEALS: 1500,      // Per day
  TRANSPORT: 2000,  // Per trip
  ACCOMMODATION: 5000, // Per night
};
