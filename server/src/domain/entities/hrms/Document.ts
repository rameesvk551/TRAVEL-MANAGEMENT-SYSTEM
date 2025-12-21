// domain/entities/hrms/Document.ts
// Secure document vault for employee records

export type DocumentCategory = 
  | 'IDENTITY' 
  | 'CONTRACT' 
  | 'CERTIFICATION' 
  | 'PERMIT' 
  | 'MEDICAL'
  | 'EDUCATION'
  | 'BANK'
  | 'TAX'
  | 'OTHER';

export type DocumentStatus = 
  | 'PENDING' 
  | 'VERIFIED' 
  | 'REJECTED' 
  | 'EXPIRED';

export interface EmployeeDocument {
  id: string;
  tenantId: string;
  employeeId: string;
  
  // Document info
  name: string;
  category: DocumentCategory;
  documentType: string;  // 'Aadhaar', 'PAN', 'Passport', etc.
  documentNumber?: string;
  
  // File
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  
  // Validity
  issuedDate?: Date;
  expiryDate?: Date;
  
  // Verification
  status: DocumentStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  
  // Access control
  isConfidential: boolean;  // HR-only access
  
  // Notes
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
  uploadedBy: string;
}

// Standard document types
export const DOCUMENT_TYPES = {
  // Identity
  AADHAAR: { name: 'Aadhaar Card', category: 'IDENTITY' as DocumentCategory },
  PAN: { name: 'PAN Card', category: 'IDENTITY' as DocumentCategory },
  PASSPORT: { name: 'Passport', category: 'IDENTITY' as DocumentCategory },
  DRIVING_LICENSE: { name: 'Driving License', category: 'IDENTITY' as DocumentCategory },
  VOTER_ID: { name: 'Voter ID', category: 'IDENTITY' as DocumentCategory },
  
  // Employment
  OFFER_LETTER: { name: 'Offer Letter', category: 'CONTRACT' as DocumentCategory },
  APPOINTMENT_LETTER: { name: 'Appointment Letter', category: 'CONTRACT' as DocumentCategory },
  NDA: { name: 'NDA', category: 'CONTRACT' as DocumentCategory },
  
  // Certifications
  DEGREE: { name: 'Degree Certificate', category: 'EDUCATION' as DocumentCategory },
  FIRST_AID_CERT: { name: 'First Aid Certificate', category: 'CERTIFICATION' as DocumentCategory },
  
  // Medical
  FITNESS_CERT: { name: 'Medical Fitness Certificate', category: 'MEDICAL' as DocumentCategory },
  
  // Tax
  FORM_16: { name: 'Form 16', category: 'TAX' as DocumentCategory },
} as const;

export function createEmployeeDocument(
  params: Omit<EmployeeDocument, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Omit<EmployeeDocument, 'id'> {
  return {
    ...params,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function isDocumentExpiring(doc: EmployeeDocument, daysThreshold = 30): boolean {
  if (!doc.expiryDate) return false;
  
  const now = new Date();
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);
  
  return doc.expiryDate <= threshold && doc.expiryDate > now;
}

export function isDocumentExpired(doc: EmployeeDocument): boolean {
  if (!doc.expiryDate) return false;
  return doc.expiryDate < new Date();
}

export function getRequiredDocuments(employeeType: string): string[] {
  const required: Record<string, string[]> = {
    OFFICE: ['AADHAAR', 'PAN', 'OFFER_LETTER'],
    FIELD: ['AADHAAR', 'PAN', 'FITNESS_CERT', 'FIRST_AID_CERT'],
    CONTRACT: ['AADHAAR', 'PAN', 'NDA'],
    SEASONAL: ['AADHAAR'],
  };
  return required[employeeType] || ['AADHAAR'];
}
