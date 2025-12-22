// presentation/validators/hrms/expenseValidator.ts
// Expense Request Validators

import { z } from 'zod';

const expenseStatusSchema = z.enum([
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED'
]);

const expenseCategorySchema = z.enum([
  'TRANSPORT', 'ACCOMMODATION', 'MEALS', 'COMMUNICATION', 'EQUIPMENT',
  'FUEL', 'TOLLS', 'PARKING', 'ENTERTAINMENT', 'SUPPLIES', 'OTHER'
]);

const paymentMethodSchema = z.enum([
  'CASH', 'COMPANY_CARD', 'PERSONAL_CARD', 'BANK_TRANSFER', 'OTHER'
]);

const expenseItemSchema = z.object({
  description: z.string().min(1).max(255),
  category: expenseCategorySchema,
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  paymentMethod: paymentMethodSchema,
  receiptUrl: z.string().url().optional(),
  receiptFileName: z.string().optional(),
  notes: z.string().max(500).optional(),
});

const attachmentSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number(),
});

export const createExpenseClaimSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    tripId: z.string().uuid().optional(),
    items: z.array(expenseItemSchema).min(1, 'At least one expense item is required'),
    currency: z.string().length(3, 'Currency must be 3 characters'),
    attachments: z.array(attachmentSchema).optional(),
  }),
});

export const updateExpenseClaimSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid expense claim ID'),
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
  }),
});

export const approveExpenseSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid expense claim ID'),
  }),
  body: z.object({
    comments: z.string().max(500).optional(),
  }),
});

export const rejectExpenseSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid expense claim ID'),
  }),
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required').max(500),
  }),
});

export const markPaidSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid expense claim ID'),
  }),
  body: z.object({
    paymentReference: z.string().min(1, 'Payment reference is required'),
  }),
});

export const expenseFiltersSchema = z.object({
  query: z.object({
    employeeId: z.string().uuid().optional(),
    status: expenseStatusSchema.optional(),
    tripId: z.string().uuid().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export const expenseStatsQuerySchema = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID'),
  }),
});

export const employeeParamSchema = z.object({
  params: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
});

export type CreateExpenseClaimInput = z.infer<typeof createExpenseClaimSchema>;
export type UpdateExpenseClaimInput = z.infer<typeof updateExpenseClaimSchema>;
export type ApproveExpenseInput = z.infer<typeof approveExpenseSchema>;
export type RejectExpenseInput = z.infer<typeof rejectExpenseSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
export type ExpenseFiltersInput = z.infer<typeof expenseFiltersSchema>;
