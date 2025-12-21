// presentation/routes/hrms/employeeRoutes.ts
// Employee API routes

import { Router } from 'express';
import { EmployeeController } from '../../controllers/hrms/EmployeeController';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export function createEmployeeRoutes(controller: EmployeeController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticate);

  // Employee list and search
  router.get('/', authorize('employee:read'), controller.list);
  
  // Available staff for trip assignment
  router.get('/available', authorize('employee:read'), controller.getAvailable);
  
  // My team (for managers)
  router.get('/my-team', controller.getMyTeam);
  
  // Team by manager ID (admin)
  router.get('/team/:managerId', authorize('employee:read'), controller.getTeam);
  
  // Single employee by code
  router.get('/code/:code', authorize('employee:read'), controller.getByCode);
  
  // Single employee by ID
  router.get('/:id', authorize('employee:read'), controller.getById);
  
  // Create employee
  router.post('/', authorize('employee:create'), controller.create);
  
  // Update employee
  router.put('/:id', authorize('employee:update'), controller.update);
  router.patch('/:id', authorize('employee:update'), controller.update);
  
  // Lifecycle transitions
  router.post(
    '/:id/transition', 
    authorize('employee:update'), 
    controller.transitionLifecycle
  );

  return router;
}
