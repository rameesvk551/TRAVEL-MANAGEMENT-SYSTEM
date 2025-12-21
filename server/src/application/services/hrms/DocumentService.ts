// application/services/hrms/DocumentService.ts
// Document Service Implementation

import type { IDocumentRepository, DocumentFilters } from '../../../domain/interfaces/hrms/IDocumentRepository';
import type { EmployeeDocument } from '../../../domain/entities/hrms/Document';
import type {
  CreateDocumentDTO,
  UpdateDocumentDTO,
  DocumentResponseDTO,
  DocumentQueryDTO,
} from '../../dtos/hrms/DocumentDTO';

export class DocumentService {
  constructor(private documentRepo: IDocumentRepository) {}

  async getDocuments(tenantId: string, query: DocumentQueryDTO): Promise<DocumentResponseDTO[]> {
    const filters: DocumentFilters = {
      tenantId,
      employeeId: query.employeeId,
      category: query.category,
      status: query.status,
      isConfidential: query.isConfidential,
      search: query.search,
    };

    if (query.expiringWithinDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + query.expiringWithinDays);
      filters.expiringBefore = expiryDate;
    }

    const documents = await this.documentRepo.findAll(filters);
    return documents.map(doc => this.toResponseDTO(doc));
  }

  async getDocumentById(id: string): Promise<DocumentResponseDTO | null> {
    const document = await this.documentRepo.findById(id);
    return document ? this.toResponseDTO(document) : null;
  }

  async getEmployeeDocuments(employeeId: string, tenantId: string): Promise<DocumentResponseDTO[]> {
    const documents = await this.documentRepo.findByEmployee(employeeId, tenantId);
    return documents.map(doc => this.toResponseDTO(doc));
  }

  async createDocument(tenantId: string, dto: CreateDocumentDTO, uploadedBy: string): Promise<DocumentResponseDTO> {
    const document: Omit<EmployeeDocument, 'id'> = {
      tenantId,
      employeeId: dto.employeeId,
      name: dto.name,
      category: dto.category,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      status: 'PENDING',
      isConfidential: dto.isConfidential || false,
      notes: dto.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      uploadedBy,
    };

    const created = await this.documentRepo.create(document);
    return this.toResponseDTO(created);
  }

  async updateDocument(id: string, dto: UpdateDocumentDTO): Promise<DocumentResponseDTO | null> {
    const updated = await this.documentRepo.update(id, {
      name: dto.name,
      category: dto.category,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      isConfidential: dto.isConfidential,
      notes: dto.notes,
    });
    return updated ? this.toResponseDTO(updated) : null;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documentRepo.delete(id);
  }

  async verifyDocument(id: string, verifiedBy: string): Promise<DocumentResponseDTO | null> {
    const verified = await this.documentRepo.verify(id, verifiedBy);
    return verified ? this.toResponseDTO(verified) : null;
  }

  async rejectDocument(id: string, reason: string): Promise<DocumentResponseDTO | null> {
    const rejected = await this.documentRepo.reject(id, reason);
    return rejected ? this.toResponseDTO(rejected) : null;
  }

  async getExpiringDocuments(tenantId: string, daysThreshold = 30): Promise<DocumentResponseDTO[]> {
    const documents = await this.documentRepo.getExpiringDocuments(tenantId, daysThreshold);
    return documents.map(doc => this.toResponseDTO(doc));
  }

  async getDocumentCount(employeeId: string): Promise<number> {
    return this.documentRepo.countByEmployee(employeeId);
  }

  private toResponseDTO(doc: EmployeeDocument): DocumentResponseDTO {
    return {
      id: doc.id,
      employeeId: doc.employeeId,
      name: doc.name,
      category: doc.category,
      documentType: doc.documentType,
      documentNumber: doc.documentNumber,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      issuedDate: doc.issuedDate?.toISOString(),
      expiryDate: doc.expiryDate?.toISOString(),
      status: doc.status,
      verifiedBy: doc.verifiedBy,
      verifiedAt: doc.verifiedAt?.toISOString(),
      rejectionReason: doc.rejectionReason,
      isConfidential: doc.isConfidential,
      notes: doc.notes,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      uploadedBy: doc.uploadedBy,
    };
  }
}
