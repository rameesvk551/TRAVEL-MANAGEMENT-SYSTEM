// presentation/validators/hrms/employeeValidator.ts
// Validation schemas for employee endpoints using Zod

import { z } from 'zod';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  preferredName: z.string().max(50).optional(),
  type: z.enum(['OFFICE', 'FIELD', 'SEASONAL', 'CONTRACT']),
  category: z.enum(['GUIDE', 'DRIVER', 'CREW', 'COOK', 'PORTER', 'ADMIN', 'MANAGER', 'SUPPORT']),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  reportingTo: z.string().uuid().optional(),
  joiningDate: z.string().datetime(),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().min(10).max(15),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
  })).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const employeeIdSchema = z.object({
  id: z.string().uuid(),
});

export const employeeQuerySchema = z.object({
  type: z.enum(['OFFICE', 'FIELD', 'SEASONAL', 'CONTRACT']).optional(),
  category: z.enum(['GUIDE', 'DRIVER', 'CREW', 'COOK', 'PORTER', 'ADMIN', 'MANAGER', 'SUPPORT']).optional(),
  lifecycleStage: z.enum(['PRE_HIRE', 'ONBOARDING', 'ACTIVE', 'ON_LEAVE', 'NOTICE', 'RESIGNED', 'TERMINATED', 'ARCHIVED']).optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
