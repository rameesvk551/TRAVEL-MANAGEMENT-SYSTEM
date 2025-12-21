// presentation/validators/hrms/tripAssignmentValidator.ts
// Validation schemas for trip assignment endpoints using Zod

import { z } from 'zod';

export const createTripAssignmentSchema = z.object({
  employeeId: z.string().uuid(),
  tripId: z.string().uuid(),
  role: z.enum(['GUIDE', 'DRIVER', 'COORDINATOR', 'SUPPORT', 'COOK', 'PORTER']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  dailyRate: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateTripAssignmentSchema = z.object({
  role: z.enum(['GUIDE', 'DRIVER', 'COORDINATOR', 'SUPPORT', 'COOK', 'PORTER']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  dailyRate: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const tripAssignmentIdSchema = z.object({
  id: z.string().uuid(),
});

export const tripAssignmentQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  status: z.enum(['ASSIGNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const availableStaffQuerySchema = z.object({
  tripId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  role: z.enum(['GUIDE', 'DRIVER', 'COORDINATOR', 'SUPPORT', 'COOK', 'PORTER']).optional(),
  skillIds: z.array(z.string().uuid()).optional(),
});
