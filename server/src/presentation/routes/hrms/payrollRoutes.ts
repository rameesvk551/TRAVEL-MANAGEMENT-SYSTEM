// presentation/routes/hrms/payrollRoutes.ts
// Payroll API routes - simplified version

import { Router } from 'express';
import { PayrollController } from '../../controllers/hrms/PayrollController.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export function createPayrollRoutes(controller: PayrollController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticate);

  // ===== Employee Self-Service Routes =====
  router.get('/me', controller.getMyPayslips);

  // ===== Admin Routes =====
  // List all payslips (with filters)
  router.get('/', authorize('payroll:read'), controller.listPayslips);
  
  // Monthly summary
  router.get('/summary', authorize('payroll:read'), controller.getSummary);
  
  // Generate payslips for a period
  router.post('/generate', authorize('payroll:create'), controller.generatePayslips);
  
  // Approve payslips (bulk)
  router.post('/approve', authorize('payroll:approve'), controller.approvePayslips);
  
  // Mark as paid (bulk)
  router.post('/mark-paid', authorize('payroll:process'), controller.markAsPaid);
  
  // Get specific payslip
  router.get('/:id', authorize('payroll:read'), controller.getPayslip);

  return router;
}
