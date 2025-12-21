// application/dtos/hrms/DocumentDTO.ts
// Document Data Transfer Objects

import type { DocumentCategory, DocumentStatus } from '../../../domain/entities/hrms/Document';

export interface CreateDocumentDTO {
  employeeId: string;
  name: string;
  category: DocumentCategory;
  documentType: string;
  documentNumber?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  issuedDate?: string;
  expiryDate?: string;
  isConfidential?: boolean;
  notes?: string;
}

export interface UpdateDocumentDTO {
  name?: string;
  category?: DocumentCategory;
  documentType?: string;
  documentNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
  isConfidential?: boolean;
  notes?: string;
}

export interface DocumentResponseDTO {
  id: string;
  employeeId: string;
  name: string;
  category: DocumentCategory;
  documentType: string;
  documentNumber?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  issuedDate?: string;
  expiryDate?: string;
  status: DocumentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  isConfidential: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: string;
  // Joined employee info
  employeeName?: string;
  employeeCode?: string;
}

export interface DocumentQueryDTO {
  employeeId?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  isConfidential?: boolean;
  expiringWithinDays?: number;
  search?: string;
}

export interface VerifyDocumentDTO {
  // No additional fields needed, verifiedBy comes from auth context
}

export interface RejectDocumentDTO {
  reason: string;
}
