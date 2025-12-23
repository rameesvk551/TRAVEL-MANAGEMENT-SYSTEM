// presentation/routes/hrms/availabilityRoutes.ts
// Availability API Routes

import { Router } from 'express';
import { AvailabilityController } from '../../controllers/hrms/AvailabilityController';
import { validate } from '../../middleware/index.js';
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
  bulkAvailabilitySchema,
  calendarQuerySchema,
  availableStaffQuerySchema,
  employeeAvailabilityQuerySchema,
  idParamSchema,
} from '../../validators/hrms/availabilityValidator';

export function createAvailabilityRoutes(controller: AvailabilityController): Router {
  const router = Router();

  // Calendar endpoints
  router.get(
    '/calendar',
    validate(calendarQuerySchema),
    controller.getCalendarEntries
  );

  router.get(
    '/team-summary',
    validate(calendarQuerySchema),
    controller.getTeamSummary
  );

  router.get(
    '/available-staff',
    validate(availableStaffQuerySchema),
    controller.getAvailableStaff
  );

  // Employee-specific endpoints
  router.get(
    '/employee/:employeeId',
    validate(employeeAvailabilityQuerySchema),
    controller.getByEmployee
  );

  router.get(
    '/employee/:employeeId/conflicts',
    controller.checkConflicts
  );

  // Bulk operations
  router.post(
    '/bulk',
    validate(bulkAvailabilitySchema),
    controller.createBulk
  );

  // CRUD endpoints
  router.get(
    '/:id',
    validate(idParamSchema),
    controller.getById
  );

  router.post(
    '/',
    validate(createAvailabilitySchema),
    controller.create
  );

  router.put(
    '/:id',
    validate(updateAvailabilitySchema),
    controller.update
  );

  router.delete(
    '/:id',
    validate(idParamSchema),
    controller.delete
  );

  return router;
}
