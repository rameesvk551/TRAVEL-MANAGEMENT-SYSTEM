// presentation/controllers/hrms/DocumentController.ts
// Document Controller

import { Request, Response } from 'express';
import { DocumentService } from '../../../application/services/hrms/DocumentService';
import type { 
  CreateDocumentDTO, 
  UpdateDocumentDTO, 
  DocumentQueryDTO 
} from '../../../application/dtos/hrms/DocumentDTO';

export class DocumentController {
  constructor(private documentService: DocumentService) {}

  getDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const query: DocumentQueryDTO = {
        employeeId: req.query.employeeId as string,
        category: req.query.category as DocumentQueryDTO['category'],
        status: req.query.status as DocumentQueryDTO['status'],
        isConfidential: req.query.isConfidential === 'true' ? true : 
                        req.query.isConfidential === 'false' ? false : undefined,
        expiringWithinDays: req.query.expiringWithinDays 
          ? parseInt(req.query.expiringWithinDays as string, 10) : undefined,
        search: req.query.search as string,
      };

      const documents = await this.documentService.getDocuments(tenantId, query);
      res.json({ success: true, data: documents });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch documents' });
    }
  };

  getDocumentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const document = await this.documentService.getDocumentById(id);

      if (!document) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      res.json({ success: true, data: document });
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch document' });
    }
  };

  getEmployeeDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId;
      const { employeeId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const documents = await this.documentService.getEmployeeDocuments(employeeId, tenantId);
      res.json({ success: true, data: documents });
    } catch (error) {
      console.error('Error fetching employee documents:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch documents' });
    }
  };

  createDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const dto: CreateDocumentDTO = req.body;
      const document = await this.documentService.createDocument(tenantId, dto, userId);
      res.status(201).json({ success: true, data: document });
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ success: false, error: 'Failed to create document' });
    }
  };

  updateDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateDocumentDTO = req.body;

      const document = await this.documentService.updateDocument(id, dto);

      if (!document) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      res.json({ success: true, data: document });
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({ success: false, error: 'Failed to update document' });
    }
  };

  deleteDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.documentService.deleteDocument(id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ success: false, error: 'Failed to delete document' });
    }
  };

  verifyDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const document = await this.documentService.verifyDocument(id, userId);

      if (!document) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      res.json({ success: true, data: document });
    } catch (error) {
      console.error('Error verifying document:', error);
      res.status(500).json({ success: false, error: 'Failed to verify document' });
    }
  };

  rejectDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({ success: false, error: 'Rejection reason is required' });
        return;
      }

      const document = await this.documentService.rejectDocument(id, reason);

      if (!document) {
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      res.json({ success: true, data: document });
    } catch (error) {
      console.error('Error rejecting document:', error);
      res.status(500).json({ success: false, error: 'Failed to reject document' });
    }
  };

  getExpiringDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const days = parseInt(req.query.days as string, 10) || 30;
      const documents = await this.documentService.getExpiringDocuments(tenantId, days);
      res.json({ success: true, data: documents });
    } catch (error) {
      console.error('Error fetching expiring documents:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch expiring documents' });
    }
  };
}
