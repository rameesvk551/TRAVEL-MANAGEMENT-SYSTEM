// presentation/routes/hrms/index.ts
// HRMS Routes aggregator

import { Router, RequestHandler } from 'express';
import { getPool } from '../../../infrastructure/database/index';

// Repositories
import { EmployeeRepository } from '../../../infrastructure/repositories/hrms/EmployeeRepository';
import { AttendanceRepository } from '../../../infrastructure/repositories/hrms/AttendanceRepository';
import { LeaveRepository } from '../../../infrastructure/repositories/hrms/LeaveRepository';
import { TripAssignmentRepository } from '../../../infrastructure/repositories/hrms/TripAssignmentRepository';
import { PayrollRepository } from '../../../infrastructure/repositories/hrms/PayrollRepository';

// Services
import { EmployeeService } from '../../../application/services/hrms/EmployeeService';
import { AttendanceService } from '../../../application/services/hrms/AttendanceService';
import { LeaveService } from '../../../application/services/hrms/LeaveService';
import { TripAssignmentService } from '../../../application/services/hrms/TripAssignmentService';
import { PayrollService } from '../../../application/services/hrms/PayrollService';

// Controllers
import { EmployeeController } from '../../controllers/hrms/EmployeeController';
import { AttendanceController } from '../../controllers/hrms/AttendanceController';
import { LeaveController } from '../../controllers/hrms/LeaveController';
import { TripAssignmentController } from '../../controllers/hrms/TripAssignmentController';
import { PayrollController } from '../../controllers/hrms/PayrollController';

// Route factories
import { createEmployeeRoutes } from './employeeRoutes';
import { createAttendanceRoutes } from './attendanceRoutes';
import { createLeaveRoutes } from './leaveRoutes';
import { createTripAssignmentRoutes } from './tripAssignmentRoutes';
import { createPayrollRoutes } from './payrollRoutes';

export function createHRMSRoutes(authMiddleware: RequestHandler): Router {
  const router = Router();
  const pool = getPool();

  // Initialize repositories
  const employeeRepo = new EmployeeRepository(pool);
  const attendanceRepo = new AttendanceRepository(pool);
  const leaveRepo = new LeaveRepository(pool);
  const tripAssignmentRepo = new TripAssignmentRepository(pool);
  const payrollRepo = new PayrollRepository(pool);

  // Initialize services
  const employeeService = new EmployeeService(employeeRepo);
  const attendanceService = new AttendanceService(attendanceRepo);
  const leaveService = new LeaveService(leaveRepo);
  const tripAssignmentService = new TripAssignmentService(tripAssignmentRepo);
  const payrollService = new PayrollService(payrollRepo);

  // Initialize controllers
  const employeeController = new EmployeeController(employeeService);
  const attendanceController = new AttendanceController(attendanceService);
  const leaveController = new LeaveController(leaveService);
  const tripAssignmentController = new TripAssignmentController(tripAssignmentService);
  const payrollController = new PayrollController(payrollService);

  // All HRMS routes require authentication
  router.use(authMiddleware);

  // Mount routes
  router.use('/employees', createEmployeeRoutes(employeeController));
  router.use('/attendance', createAttendanceRoutes(attendanceController));
  router.use('/leave', createLeaveRoutes(leaveController));
  router.use('/trip-assignments', createTripAssignmentRoutes(tripAssignmentController));
  router.use('/payroll', createPayrollRoutes(payrollController));

  return router;
}

export * from './employeeRoutes';
export * from './attendanceRoutes';
export * from './leaveRoutes';
export * from './tripAssignmentRoutes';
export * from './payrollRoutes';
