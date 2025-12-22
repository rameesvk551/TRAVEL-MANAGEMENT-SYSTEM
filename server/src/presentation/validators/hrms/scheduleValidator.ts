// presentation/validators/hrms/scheduleValidator.ts
// Schedule Request Validators

import { z } from 'zod';

// ===== SHIFT VALIDATORS =====
const shiftTypeSchema = z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'SPLIT', 'FLEXIBLE']);

export const createShiftSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(20),
    type: shiftTypeSchema,
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
    breakDuration: z.number().int().min(0).max(120),
    workHours: z.number().positive().max(24),
    isOvernight: z.boolean().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }),
});

export const updateShiftSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shift ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    code: z.string().min(1).max(20).optional(),
    type: shiftTypeSchema.optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    breakDuration: z.number().int().min(0).max(120).optional(),
    workHours: z.number().positive().max(24).optional(),
    isOvernight: z.boolean().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const shiftFiltersSchema = z.object({
  query: z.object({
    type: shiftTypeSchema.optional(),
    isActive: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  }),
});

// ===== WORK PATTERN VALIDATORS =====
const dayOfWeekSchema = z.enum([
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
]);

const weeklyPatternSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  isWorkingDay: z.boolean(),
  shiftId: z.string().uuid().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const createWorkPatternSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    pattern: z.array(weeklyPatternSchema).length(7, 'Pattern must have exactly 7 days'),
    isRotating: z.boolean().optional(),
    rotationWeeks: z.number().int().min(1).max(12).optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const updateWorkPatternSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid work pattern ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    pattern: z.array(weeklyPatternSchema).length(7).optional(),
    isActive: z.boolean().optional(),
  }),
});

// ===== ROSTER VALIDATORS =====
const rosterStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const createRosterSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    branchId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
  }),
});

export const updateRosterSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid roster ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    status: rosterStatusSchema.optional(),
  }),
});

export const rosterFiltersSchema = z.object({
  query: z.object({
    status: rosterStatusSchema.optional(),
    branchId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
  }),
});

// ===== ROSTER ENTRY VALIDATORS =====
const rosterEntryStatusSchema = z.enum([
  'SCHEDULED', 'WORKED', 'ABSENT', 'PARTIAL', 'SWAPPED', 'CANCELLED'
]);

export const createRosterEntrySchema = z.object({
  body: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    shiftId: z.string().uuid('Invalid shift ID'),
    notes: z.string().max(500).optional(),
  }),
});

export const bulkRosterEntrySchema = z.object({
  body: z.object({
    entries: z.array(z.object({
      employeeId: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      shiftId: z.string().uuid(),
      notes: z.string().max(500).optional(),
    })).min(1).max(100),
  }),
});

export const updateRosterEntrySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid roster entry ID'),
  }),
  body: z.object({
    shiftId: z.string().uuid().optional(),
    actualStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    actualEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    status: rosterEntryStatusSchema.optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const employeeScheduleQuerySchema = z.object({
  params: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date'),
  }),
});

export const scheduleByDateQuerySchema = z.object({
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
    branchId: z.string().uuid().optional(),
  }),
});

// ===== SHIFT SWAP VALIDATORS =====
export const createSwapRequestSchema = z.object({
  body: z.object({
    requesterRosterEntryId: z.string().uuid('Invalid roster entry ID'),
    targetEmployeeId: z.string().uuid('Invalid employee ID'),
    targetRosterEntryId: z.string().uuid('Invalid roster entry ID'),
    reason: z.string().min(1).max(500),
  }),
});

export const rejectSwapRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid swap request ID'),
  }),
  body: z.object({
    reason: z.string().min(1).max(500),
  }),
});

// ===== GENERATE ROSTER VALIDATORS =====
export const generateRosterSchema = z.object({
  body: z.object({
    patternId: z.string().uuid('Invalid work pattern ID'),
    employeeIds: z.array(z.string().uuid()).min(1).max(100),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  }),
});

// ===== COMMON VALIDATORS =====
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID'),
  }),
});

// Type exports
export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type CreateWorkPatternInput = z.infer<typeof createWorkPatternSchema>;
export type UpdateWorkPatternInput = z.infer<typeof updateWorkPatternSchema>;
export type CreateRosterInput = z.infer<typeof createRosterSchema>;
export type UpdateRosterInput = z.infer<typeof updateRosterSchema>;
export type CreateRosterEntryInput = z.infer<typeof createRosterEntrySchema>;
export type BulkRosterEntryInput = z.infer<typeof bulkRosterEntrySchema>;
export type UpdateRosterEntryInput = z.infer<typeof updateRosterEntrySchema>;
export type CreateSwapRequestInput = z.infer<typeof createSwapRequestSchema>;
export type GenerateRosterInput = z.infer<typeof generateRosterSchema>;
