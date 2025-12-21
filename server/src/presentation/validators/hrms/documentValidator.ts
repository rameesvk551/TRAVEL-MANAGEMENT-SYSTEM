// presentation/validators/hrms/documentValidator.ts
// Document Validators

import { z } from 'zod';

const documentCategorySchema = z.enum([
  'IDENTITY',
  'CONTRACT',
  'CERTIFICATION',
  'PERMIT',
  'MEDICAL',
  'EDUCATION',
  'BANK',
  'TAX',
  'OTHER',
]);

const documentStatusSchema = z.enum([
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
]);

export const createDocumentSchema = z.object({
  employeeId: z.string().uuid(),
  name: z.string().min(1).max(200),
  category: documentCategorySchema,
  documentType: z.string().min(1).max(50),
  documentNumber: z.string().max(50).optional(),
  fileUrl: z.string().url(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
  issuedDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  isConfidential: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: documentCategorySchema.optional(),
  documentType: z.string().min(1).max(50).optional(),
  documentNumber: z.string().max(50).optional(),
  issuedDate: z.string().datetime().optional().nullable(),
  expiryDate: z.string().datetime().optional().nullable(),
  isConfidential: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const documentQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  category: documentCategorySchema.optional(),
  status: documentStatusSchema.optional(),
  isConfidential: z.enum(['true', 'false']).optional(),
  expiringWithinDays: z.string().regex(/^\d+$/).optional(),
  search: z.string().max(100).optional(),
});

export const rejectDocumentSchema = z.object({
  reason: z.string().min(1).max(500),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type DocumentQueryInput = z.infer<typeof documentQuerySchema>;
export type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>;
