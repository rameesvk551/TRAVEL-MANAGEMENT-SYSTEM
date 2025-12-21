// presentation/validators/hrms/payrollValidator.ts
// Validation schemas for payroll endpoints using Zod

import { z } from 'zod';

export const generatePayrollSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  employeeIds: z.array(z.string().uuid()).optional(),
  branchId: z.string().uuid().optional(),
});

export const payrollActionSchema = z.object({
  payslipIds: z.array(z.string().uuid()).min(1),
  action: z.enum(['approve', 'reject']),
  comment: z.string().max(500).optional(),
});

export const markPaidSchema = z.object({
  payslipIds: z.array(z.string().uuid()).min(1),
  paymentMode: z.enum(['BANK', 'CASH', 'CHEQUE']),
  paymentReference: z.string().max(100).optional(),
  paymentDate: z.string().datetime(),
});

export const payrollQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/).optional(),
  month: z.string().regex(/^\d{1,2}$/).optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED']).optional(),
  employeeId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});

export const payStructureSchema = z.object({
  employeeId: z.string().uuid(),
  effectiveFrom: z.string().datetime(),
  payModel: z.enum(['MONTHLY', 'DAILY', 'PER_TRIP', 'HOURLY', 'MIXED']),
  baseSalary: z.number().nonnegative(),
  dailyRate: z.number().nonnegative().optional(),
  tripRate: z.number().nonnegative().optional(),
  hourlyRate: z.number().nonnegative().optional(),
  components: z.array(z.object({
    code: z.string(),
    name: z.string(),
    type: z.enum(['EARNING', 'DEDUCTION']),
    amount: z.number(),
    isPercentage: z.boolean(),
    percentageOf: z.string().optional(),
    isTaxable: z.boolean(),
  })).optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  currency: z.string().default('INR'),
});
