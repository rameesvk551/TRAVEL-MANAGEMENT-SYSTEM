// domain/interfaces/hrms/IDocumentRepository.ts
// Document Repository Interface

import type { EmployeeDocument, DocumentCategory, DocumentStatus } from '../../entities/hrms/Document';

export interface DocumentFilters {
  tenantId: string;
  employeeId?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  isConfidential?: boolean;
  expiringBefore?: Date;
  search?: string;
}

export interface IDocumentRepository {
  // CRUD
  findById(id: string): Promise<EmployeeDocument | null>;
  findAll(filters: DocumentFilters): Promise<EmployeeDocument[]>;
  findByEmployee(employeeId: string, tenantId: string): Promise<EmployeeDocument[]>;
  create(document: Omit<EmployeeDocument, 'id'>): Promise<EmployeeDocument>;
  update(id: string, document: Partial<EmployeeDocument>): Promise<EmployeeDocument | null>;
  delete(id: string): Promise<boolean>;
  
  // Verification
  verify(id: string, verifiedBy: string): Promise<EmployeeDocument | null>;
  reject(id: string, reason: string): Promise<EmployeeDocument | null>;
  
  // Queries
  getExpiringDocuments(tenantId: string, daysThreshold: number): Promise<EmployeeDocument[]>;
  getDocumentsByType(tenantId: string, documentType: string): Promise<EmployeeDocument[]>;
  countByEmployee(employeeId: string): Promise<number>;
}
