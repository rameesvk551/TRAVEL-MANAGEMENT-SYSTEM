// infrastructure/repositories/hrms/DocumentRepository.ts
// Document Repository Implementation

import { Pool } from 'pg';
import type { 
  EmployeeDocument, 
  DocumentCategory, 
  DocumentStatus 
} from '../../../domain/entities/hrms/Document';
import type { 
  IDocumentRepository, 
  DocumentFilters 
} from '../../../domain/interfaces/hrms/IDocumentRepository';

export class DocumentRepository implements IDocumentRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<EmployeeDocument | null> {
    const query = `
      SELECT * FROM hrms.documents WHERE id = $1
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
  }

  async findAll(filters: DocumentFilters): Promise<EmployeeDocument[]> {
    const conditions: string[] = ['d.tenant_id = $1'];
    const params: unknown[] = [filters.tenantId];
    let paramIndex = 2;

    if (filters.employeeId) {
      conditions.push(`d.employee_id = $${paramIndex++}`);
      params.push(filters.employeeId);
    }

    if (filters.category) {
      conditions.push(`d.category = $${paramIndex++}`);
      params.push(filters.category);
    }

    if (filters.status) {
      conditions.push(`d.status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.isConfidential !== undefined) {
      conditions.push(`d.is_confidential = $${paramIndex++}`);
      params.push(filters.isConfidential);
    }

    if (filters.expiringBefore) {
      conditions.push(`d.expiry_date <= $${paramIndex++}`);
      params.push(filters.expiringBefore);
    }

    if (filters.search) {
      conditions.push(`(d.name ILIKE $${paramIndex} OR d.document_type ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const query = `
      SELECT d.*, e.first_name, e.last_name, e.employee_code
      FROM hrms.documents d
      LEFT JOIN hrms.employees e ON d.employee_id = e.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.created_at DESC
    `;

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByEmployee(employeeId: string, tenantId: string): Promise<EmployeeDocument[]> {
    const query = `
      SELECT * FROM hrms.documents 
      WHERE employee_id = $1 AND tenant_id = $2
      ORDER BY category, created_at DESC
    `;
    const result = await this.pool.query(query, [employeeId, tenantId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(document: Omit<EmployeeDocument, 'id'>): Promise<EmployeeDocument> {
    const query = `
      INSERT INTO hrms.documents (
        tenant_id, employee_id, name, category, document_type, document_number,
        file_url, file_name, file_size, mime_type,
        issued_date, expiry_date, status, is_confidential, notes, uploaded_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      document.tenantId,
      document.employeeId,
      document.name,
      document.category,
      document.documentType,
      document.documentNumber,
      document.fileUrl,
      document.fileName,
      document.fileSize,
      document.mimeType,
      document.issuedDate,
      document.expiryDate,
      document.status || 'PENDING',
      document.isConfidential || false,
      document.notes,
      document.uploadedBy,
    ]);

    return this.mapToEntity(result.rows[0]);
  }

  async update(id: string, document: Partial<EmployeeDocument>): Promise<EmployeeDocument | null> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      name: 'name',
      category: 'category',
      documentType: 'document_type',
      documentNumber: 'document_number',
      issuedDate: 'issued_date',
      expiryDate: 'expiry_date',
      status: 'status',
      isConfidential: 'is_confidential',
      notes: 'notes',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (key in document) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push((document as Record<string, unknown>)[key]);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE hrms.documents
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM hrms.documents WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async verify(id: string, verifiedBy: string): Promise<EmployeeDocument | null> {
    const query = `
      UPDATE hrms.documents
      SET status = 'VERIFIED', verified_by = $2, verified_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, verifiedBy]);
    return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
  }

  async reject(id: string, reason: string): Promise<EmployeeDocument | null> {
    const query = `
      UPDATE hrms.documents
      SET status = 'REJECTED', rejection_reason = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, reason]);
    return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
  }

  async getExpiringDocuments(tenantId: string, daysThreshold: number): Promise<EmployeeDocument[]> {
    const query = `
      SELECT d.*, e.first_name, e.last_name, e.employee_code
      FROM hrms.documents d
      LEFT JOIN hrms.employees e ON d.employee_id = e.id
      WHERE d.tenant_id = $1 
        AND d.expiry_date IS NOT NULL
        AND d.expiry_date <= NOW() + INTERVAL '1 day' * $2
        AND d.status != 'EXPIRED'
      ORDER BY d.expiry_date ASC
    `;
    const result = await this.pool.query(query, [tenantId, daysThreshold]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async getDocumentsByType(tenantId: string, documentType: string): Promise<EmployeeDocument[]> {
    const query = `
      SELECT d.*, e.first_name, e.last_name, e.employee_code
      FROM hrms.documents d
      LEFT JOIN hrms.employees e ON d.employee_id = e.id
      WHERE d.tenant_id = $1 AND d.document_type = $2
      ORDER BY d.created_at DESC
    `;
    const result = await this.pool.query(query, [tenantId, documentType]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async countByEmployee(employeeId: string): Promise<number> {
    const query = `SELECT COUNT(*) FROM hrms.documents WHERE employee_id = $1`;
    const result = await this.pool.query(query, [employeeId]);
    return parseInt(result.rows[0].count, 10);
  }

  private mapToEntity(row: Record<string, unknown>): EmployeeDocument {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      employeeId: row.employee_id as string,
      name: row.name as string,
      category: (row.category || row.type) as DocumentCategory,
      documentType: row.document_type as string || '',
      documentNumber: row.document_number as string | undefined,
      fileUrl: row.file_url as string,
      fileName: row.file_name as string || '',
      fileSize: row.file_size as number || 0,
      mimeType: row.mime_type as string || row.file_type as string || '',
      issuedDate: row.issued_date ? new Date(row.issued_date as string) : undefined,
      expiryDate: row.expiry_date ? new Date(row.expiry_date as string) : undefined,
      status: (row.status || (row.is_verified ? 'VERIFIED' : 'PENDING')) as DocumentStatus,
      verifiedBy: row.verified_by as string | undefined,
      verifiedAt: row.verified_at ? new Date(row.verified_at as string) : undefined,
      rejectionReason: row.rejection_reason as string | undefined,
      isConfidential: row.is_confidential as boolean || false,
      notes: row.notes as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      uploadedBy: row.uploaded_by as string || '',
    };
  }
}
