// presentation/routes/hrms/leaveRoutes.ts
// Leave management API routes

import { Router } from 'express';
import { LeaveController } from '../../controllers/hrms/LeaveController';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export function createLeaveRoutes(controller: LeaveController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticate);

  // ===== Employee Self-Service Routes =====
  // Submit leave request
  router.post('/request', controller.createRequest);
  
  // Cancel own request
  router.post('/request/:id/cancel', controller.cancelRequest);
  
  // My leave data
  router.get('/my/requests', controller.getMyRequests);
  router.get('/my/balances', controller.getMyBalances);
  router.get('/my/summary', controller.getMySummary);

  // ===== Manager/Admin Routes =====
  // Pending approvals for current user
  router.get('/pending', controller.getPendingApprovals);
  
  // Approve/Reject leave
  router.post(
    '/request/:id/action', 
    authorize('leave:approve'), 
    controller.processAction
  );
  
  // Employee-specific leave data
  router.get(
    '/employee/:employeeId/requests', 
    authorize('leave:read'), 
    controller.getEmployeeRequests
  );
  router.get(
    '/employee/:employeeId/balances', 
    authorize('leave:read'), 
    controller.getEmployeeBalances
  );

  return router;
}
