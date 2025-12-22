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
import { DocumentRepository } from '../../../infrastructure/repositories/hrms/DocumentRepository';
import { AvailabilityRepository } from '../../../infrastructure/repositories/hrms/AvailabilityRepository';
import { ExpenseRepository } from '../../../infrastructure/repositories/hrms/ExpenseRepository';
import { ScheduleRepository } from '../../../infrastructure/repositories/hrms/ScheduleRepository';

// Services
import { EmployeeService } from '../../../application/services/hrms/EmployeeService';
import { AttendanceService } from '../../../application/services/hrms/AttendanceService';
import { LeaveService } from '../../../application/services/hrms/LeaveService';
import { TripAssignmentService } from '../../../application/services/hrms/TripAssignmentService';
import { PayrollService } from '../../../application/services/hrms/PayrollService';
import { DocumentService } from '../../../application/services/hrms/DocumentService';
import { AvailabilityService } from '../../../application/services/hrms/AvailabilityService';
import { ExpenseService } from '../../../application/services/hrms/ExpenseService';
import { ScheduleService } from '../../../application/services/hrms/ScheduleService';

// Controllers
import { EmployeeController } from '../../controllers/hrms/EmployeeController';
import { AttendanceController } from '../../controllers/hrms/AttendanceController';
import { LeaveController } from '../../controllers/hrms/LeaveController';
import { TripAssignmentController } from '../../controllers/hrms/TripAssignmentController';
import { PayrollController } from '../../controllers/hrms/PayrollController';
import { DocumentController } from '../../controllers/hrms/DocumentController';
import { AvailabilityController } from '../../controllers/hrms/AvailabilityController';
import { ExpenseController } from '../../controllers/hrms/ExpenseController';
import { ScheduleController } from '../../controllers/hrms/ScheduleController';

// Route factories
import { createEmployeeRoutes } from './employeeRoutes';
import { createAttendanceRoutes } from './attendanceRoutes';
import { createLeaveRoutes } from './leaveRoutes';
import { createTripAssignmentRoutes } from './tripAssignmentRoutes';
import { createPayrollRoutes } from './payrollRoutes';
import { createDocumentRoutes } from './documentRoutes';
import { createAvailabilityRoutes } from './availabilityRoutes';
import { createExpenseRoutes } from './expenseRoutes';
import { createScheduleRoutes } from './scheduleRoutes';

export function createHRMSRoutes(authMiddleware: RequestHandler): Router {
  const router = Router();
  const pool = getPool();

  // Initialize repositories
  const employeeRepo = new EmployeeRepository(pool);
  const attendanceRepo = new AttendanceRepository(pool);
  const leaveRepo = new LeaveRepository(pool);
  const tripAssignmentRepo = new TripAssignmentRepository(pool);
  const payrollRepo = new PayrollRepository(pool);
  const documentRepo = new DocumentRepository(pool);
  const availabilityRepo = new AvailabilityRepository(pool);
  const expenseRepo = new ExpenseRepository(pool);
  const scheduleRepo = new ScheduleRepository(pool);

  // Initialize services
  const employeeService = new EmployeeService(employeeRepo);
  const attendanceService = new AttendanceService(attendanceRepo);
  const leaveService = new LeaveService(leaveRepo);
  const tripAssignmentService = new TripAssignmentService(tripAssignmentRepo);
  const payrollService = new PayrollService(payrollRepo);
  const documentService = new DocumentService(documentRepo);
  const availabilityService = new AvailabilityService(availabilityRepo);
  const expenseService = new ExpenseService(expenseRepo);
  const scheduleService = new ScheduleService(scheduleRepo);

  // Initialize controllers
  const employeeController = new EmployeeController(employeeService);
  const attendanceController = new AttendanceController(attendanceService);
  const leaveController = new LeaveController(leaveService);
  const tripAssignmentController = new TripAssignmentController(tripAssignmentService);
  const payrollController = new PayrollController(payrollService);
  const documentController = new DocumentController(documentService);
  const availabilityController = new AvailabilityController(availabilityService);
  const expenseController = new ExpenseController(expenseService);
  const scheduleController = new ScheduleController(scheduleService);

  // All HRMS routes require authentication
  router.use(authMiddleware);

  // Mount routes
  router.use('/employees', createEmployeeRoutes(employeeController));
  router.use('/attendance', createAttendanceRoutes(attendanceController));
  router.use('/leave', createLeaveRoutes(leaveController));
  router.use('/trip-assignments', createTripAssignmentRoutes(tripAssignmentController));
  router.use('/payroll', createPayrollRoutes(payrollController));
  router.use('/documents', createDocumentRoutes(documentController));
  router.use('/availability', createAvailabilityRoutes(availabilityController));
  router.use('/expenses', createExpenseRoutes(expenseController));
  router.use('/schedule', createScheduleRoutes(scheduleController));

  return router;
}

export * from './employeeRoutes';
export * from './attendanceRoutes';
export * from './leaveRoutes';
export * from './tripAssignmentRoutes';
export * from './payrollRoutes';
export * from './documentRoutes';
export * from './availabilityRoutes';
export * from './expenseRoutes';
export * from './scheduleRoutes';
