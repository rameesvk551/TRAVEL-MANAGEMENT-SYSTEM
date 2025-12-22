// presentation/validators/hrms/availabilityValidator.ts
// Availability Request Validators

import { z } from 'zod';

const availabilityStatusSchema = z.enum([
  'AVAILABLE', 'UNAVAILABLE', 'BLOCKED', 'ON_LEAVE', 'ON_TRIP', 'TENTATIVE'
]);

const blockReasonSchema = z.enum(['PERSONAL', 'TRAINING', 'MEDICAL', 'OTHER']);

export const createAvailabilitySchema = z.object({
  body: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: availabilityStatusSchema,
    blockReason: blockReasonSchema.optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const updateAvailabilitySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid availability ID'),
  }),
  body: z.object({
    status: availabilityStatusSchema.optional(),
    blockReason: blockReasonSchema.optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const bulkAvailabilitySchema = z.object({
  body: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
    dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(31),
    status: availabilityStatusSchema,
    blockReason: blockReasonSchema.optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const calendarQuerySchema = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date'),
    employeeIds: z.string().optional(), // comma-separated
    branchId: z.string().uuid().optional(),
  }),
});

export const availableStaffQuerySchema = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date'),
    branchId: z.string().uuid().optional(),
    category: z.string().optional(),
    excludeEmployeeIds: z.string().optional(), // comma-separated
  }),
});

export const employeeAvailabilityQuerySchema = z.object({
  params: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date'),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID'),
  }),
});

export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type BulkAvailabilityInput = z.infer<typeof bulkAvailabilitySchema>;
export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
export type AvailableStaffQueryInput = z.infer<typeof availableStaffQuerySchema>;
