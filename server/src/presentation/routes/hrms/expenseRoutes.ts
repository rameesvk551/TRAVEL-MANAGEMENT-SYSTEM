// presentation/routes/hrms/expenseRoutes.ts
// Expense API Routes

import { Router } from 'express';
import { ExpenseController } from '../../controllers/hrms/ExpenseController';
import { validate } from '../../middleware/index.js';
import {
  createExpenseClaimSchema,
  updateExpenseClaimSchema,
  approveExpenseSchema,
  rejectExpenseSchema,
  markPaidSchema,
  expenseFiltersSchema,
  expenseStatsQuerySchema,
  idParamSchema,
  employeeParamSchema,
} from '../../validators/hrms/expenseValidator';

export function createExpenseRoutes(controller: ExpenseController): Router {
  const router = Router();

  // Self-service endpoints
  router.get('/my-expenses', controller.getMyExpenses);

  // Stats & analytics
  router.get(
    '/stats',
    validate(expenseStatsQuerySchema),
    controller.getStats
  );

  // Pending approval (for managers)
  router.get('/pending-approval', controller.getPendingApproval);

  // Get by claim number
  router.get('/claim/:claimNumber', controller.getByClaimNumber);

  // Employee-specific
  router.get(
    '/employee/:employeeId',
    validate(employeeParamSchema),
    controller.getByEmployee
  );

  // CRUD endpoints
  router.get(
    '/',
    validate(expenseFiltersSchema),
    controller.getAll
  );

  router.get(
    '/:id',
    validate(idParamSchema),
    controller.getById
  );

  router.post(
    '/',
    validate(createExpenseClaimSchema),
    controller.create
  );

  router.put(
    '/:id',
    validate(updateExpenseClaimSchema),
    controller.update
  );

  router.delete(
    '/:id',
    validate(idParamSchema),
    controller.delete
  );

  // Workflow actions
  router.post(
    '/:id/submit',
    validate(idParamSchema),
    controller.submit
  );

  router.post(
    '/:id/approve',
    validate(approveExpenseSchema),
    controller.approve
  );

  router.post(
    '/:id/reject',
    validate(rejectExpenseSchema),
    controller.reject
  );

  router.post(
    '/:id/mark-paid',
    validate(markPaidSchema),
    controller.markAsPaid
  );

  return router;
}
