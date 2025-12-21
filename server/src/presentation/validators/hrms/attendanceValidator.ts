// presentation/validators/hrms/attendanceValidator.ts
// Validation schemas for attendance endpoints using Zod

import { z } from 'zod';

export const checkInSchema = z.object({
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  }).optional(),
  tripId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const checkOutSchema = z.object({
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  }).optional(),
  notes: z.string().max(500).optional(),
});

export const markAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().datetime(),
  type: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY', 'REST_DAY', 'TRIP']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  notes: z.string().max(500).optional(),
});

export const attendanceQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  type: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY', 'REST_DAY', 'TRIP']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});
