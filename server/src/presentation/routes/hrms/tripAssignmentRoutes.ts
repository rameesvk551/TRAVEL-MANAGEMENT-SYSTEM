// presentation/routes/hrms/tripAssignmentRoutes.ts
// Trip assignment API routes

import { Router } from 'express';
import { TripAssignmentController } from '../../controllers/hrms/TripAssignmentController';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export function createTripAssignmentRoutes(
  controller: TripAssignmentController
): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticate);

  // ===== Employee Self-Service Routes =====
  // My upcoming assignments
  router.get('/my/upcoming', controller.getMyUpcoming);
  
  // Confirm/Decline assignment
  router.post('/:id/confirm', controller.confirmAssignment);
  router.post('/:id/decline', controller.declineAssignment);

  // ===== Operations/Admin Routes =====
  // Staff suggestions for trip
  router.get('/suggestions', authorize('trip:assign'), controller.getSuggestions);
  
  // Check employee availability
  router.get(
    '/availability/:employeeId', 
    authorize('trip:assign'), 
    controller.checkAvailability
  );
  
  // Trip crew
  router.get('/trip/:tripId', authorize('trip:read'), controller.getTripCrew);
  
  // Assign staff
  router.post('/', authorize('trip:assign'), controller.assign);
  router.post('/bulk', authorize('trip:assign'), controller.bulkAssign);
  
  // Complete assignment (with rating/feedback)
  router.post('/:id/complete', authorize('trip:assign'), controller.complete);
  
  // Cancel assignment
  router.post('/:id/cancel', authorize('trip:assign'), controller.cancel);

  return router;
}
