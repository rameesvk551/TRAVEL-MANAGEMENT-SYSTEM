// presentation/validators/hrms/leaveValidator.ts
// Validation schemas for leave endpoints using Zod

import { z } from 'zod';

export const applyLeaveSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(10).max(500),
  isHalfDay: z.boolean().optional(),
  halfDayType: z.enum(['FIRST_HALF', 'SECOND_HALF']).optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const leaveActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comment: z.string().max(500).optional(),
});

export const leaveIdSchema = z.object({
  id: z.string().uuid(),
});

export const leaveQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  leaveTypeId: z.string().uuid().optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  month: z.string().regex(/^\d{1,2}$/).optional(),
});

export const leaveBalanceQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
});
