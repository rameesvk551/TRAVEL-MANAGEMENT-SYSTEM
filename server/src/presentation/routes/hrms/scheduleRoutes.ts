// presentation/routes/hrms/scheduleRoutes.ts
// Schedule API Routes

import { Router } from 'express';
import { ScheduleController } from '../../controllers/hrms/ScheduleController';
import { validate } from '../../middleware/index.js';
import {
  createShiftSchema,
  updateShiftSchema,
  shiftFiltersSchema,
  createWorkPatternSchema,
  updateWorkPatternSchema,
  createRosterSchema,
  updateRosterSchema,
  rosterFiltersSchema,
  createRosterEntrySchema,
  bulkRosterEntrySchema,
  updateRosterEntrySchema,
  employeeScheduleQuerySchema,
  scheduleByDateQuerySchema,
  createSwapRequestSchema,
  rejectSwapRequestSchema,
  generateRosterSchema,
  idParamSchema,
} from '../../validators/hrms/scheduleValidator';

export function createScheduleRoutes(controller: ScheduleController): Router {
  const router = Router();

  // ===== SHIFTS =====
  router.get(
    '/shifts',
    validate(shiftFiltersSchema),
    controller.getAllShifts
  );

  router.get(
    '/shifts/:id',
    validate(idParamSchema),
    controller.getShiftById
  );

  router.post(
    '/shifts',
    validate(createShiftSchema),
    controller.createShift
  );

  router.put(
    '/shifts/:id',
    validate(updateShiftSchema),
    controller.updateShift
  );

  router.delete(
    '/shifts/:id',
    validate(idParamSchema),
    controller.deleteShift
  );

  // ===== WORK PATTERNS =====
  router.get('/patterns', controller.getAllWorkPatterns);

  router.get(
    '/patterns/:id',
    validate(idParamSchema),
    controller.getWorkPatternById
  );

  router.post(
    '/patterns',
    validate(createWorkPatternSchema),
    controller.createWorkPattern
  );

  router.put(
    '/patterns/:id',
    validate(updateWorkPatternSchema),
    controller.updateWorkPattern
  );

  router.delete(
    '/patterns/:id',
    validate(idParamSchema),
    controller.deleteWorkPattern
  );

  // ===== ROSTERS =====
  router.get('/rosters/current', controller.getCurrentRoster);

  router.get(
    '/rosters',
    validate(rosterFiltersSchema),
    controller.getAllRosters
  );

  router.get(
    '/rosters/:id',
    validate(idParamSchema),
    controller.getRosterById
  );

  router.post(
    '/rosters',
    validate(createRosterSchema),
    controller.createRoster
  );

  router.put(
    '/rosters/:id',
    validate(updateRosterSchema),
    controller.updateRoster
  );

  router.post(
    '/rosters/:id/publish',
    validate(idParamSchema),
    controller.publishRoster
  );

  router.delete(
    '/rosters/:id',
    validate(idParamSchema),
    controller.deleteRoster
  );

  // ===== ROSTER ENTRIES =====
  router.get('/my-schedule', controller.getMySchedule);

  router.get(
    '/by-date',
    validate(scheduleByDateQuerySchema),
    controller.getScheduleByDate
  );

  router.get(
    '/employee/:employeeId',
    validate(employeeScheduleQuerySchema),
    controller.getEmployeeSchedule
  );

  router.get(
    '/entries/:id',
    validate(idParamSchema),
    controller.getRosterEntryById
  );

  router.post(
    '/entries',
    validate(createRosterEntrySchema),
    controller.createRosterEntry
  );

  router.post(
    '/entries/bulk',
    validate(bulkRosterEntrySchema),
    controller.createBulkRosterEntries
  );

  router.put(
    '/entries/:id',
    validate(updateRosterEntrySchema),
    controller.updateRosterEntry
  );

  router.delete(
    '/entries/:id',
    validate(idParamSchema),
    controller.deleteRosterEntry
  );

  // ===== SHIFT SWAP =====
  router.get('/swap-requests', controller.getPendingSwapRequests);

  router.get('/my-swap-requests', controller.getMySwapRequests);

  router.get(
    '/swap-requests/:id',
    validate(idParamSchema),
    controller.getSwapRequestById
  );

  router.post(
    '/swap-requests',
    validate(createSwapRequestSchema),
    controller.createSwapRequest
  );

  router.post(
    '/swap-requests/:id/approve',
    validate(idParamSchema),
    controller.approveSwapRequest
  );

  router.post(
    '/swap-requests/:id/reject',
    validate(rejectSwapRequestSchema),
    controller.rejectSwapRequest
  );

  // ===== GENERATE ROSTER =====
  router.post(
    '/generate-from-pattern',
    validate(generateRosterSchema),
    controller.generateRosterFromPattern
  );

  return router;
}
