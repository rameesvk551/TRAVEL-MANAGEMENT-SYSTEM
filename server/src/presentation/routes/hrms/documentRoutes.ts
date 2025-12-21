// presentation/routes/hrms/documentRoutes.ts
// Document Routes

import { Router } from 'express';
import { DocumentController } from '../../controllers/hrms/DocumentController';

export function createDocumentRoutes(controller: DocumentController): Router {
  const router = Router();

  // GET /api/hrms/documents - List all documents with filters
  router.get('/', controller.getDocuments);

  // GET /api/hrms/documents/expiring - Get documents expiring soon
  router.get('/expiring', controller.getExpiringDocuments);

  // GET /api/hrms/documents/employee/:employeeId - Get documents by employee
  router.get('/employee/:employeeId', controller.getEmployeeDocuments);

  // GET /api/hrms/documents/:id - Get single document
  router.get('/:id', controller.getDocumentById);

  // POST /api/hrms/documents - Create document
  router.post('/', controller.createDocument);

  // PUT /api/hrms/documents/:id - Update document
  router.put('/:id', controller.updateDocument);

  // DELETE /api/hrms/documents/:id - Delete document
  router.delete('/:id', controller.deleteDocument);

  // POST /api/hrms/documents/:id/verify - Verify document
  router.post('/:id/verify', controller.verifyDocument);

  // POST /api/hrms/documents/:id/reject - Reject document
  router.post('/:id/reject', controller.rejectDocument);

  return router;
}
