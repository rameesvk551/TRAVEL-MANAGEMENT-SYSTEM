// presentation/routes/hrms/attendanceRoutes.ts
// Attendance API routes

import { Router } from 'express';
import { AttendanceController } from '../../controllers/hrms/AttendanceController';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export function createAttendanceRoutes(controller: AttendanceController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticate);

  // ===== Employee Self-Service Routes =====
  // Mobile check-in/out
  router.post('/check-in', controller.checkIn);
  router.post('/check-out', controller.checkOut);
  
  // My attendance
  router.get('/my/today', controller.getMyToday);
  router.get('/my/summary', controller.getMySummary);
  router.get('/my/calendar', controller.getMyCalendar);

  // ===== Admin/Manager Routes =====
  // List all attendance (with filters)
  router.get('/', authorize('attendance:read'), controller.listAll);
  
  // Manual attendance entry
  router.post('/manual', authorize('attendance:create'), controller.createManual);
  
  // Approve/Reject attendance
  router.post('/approve', authorize('attendance:approve'), controller.approve);
  
  // Employee-specific attendance
  router.get(
    '/employee/:employeeId', 
    authorize('attendance:read'), 
    controller.getEmployeeAttendance
  );
  router.get(
    '/employee/:employeeId/summary', 
    authorize('attendance:read'), 
    controller.getEmployeeSummary
  );

  return router;
}
