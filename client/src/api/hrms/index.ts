/**
 * HRMS API - Barrel Export
 */
export { employeeApi } from './employeeApi';
export { attendanceApi } from './attendanceApi';
export { leaveApi } from './leaveApi';
export { tripAssignmentApi } from './tripAssignmentApi';
export { payrollApi } from './payrollApi';
export { documentApi } from './documentApi';

// Growth Phase 2
export { availabilityApi } from './availabilityApi';
export { expenseApi } from './expenseApi';
export { scheduleApi } from './scheduleApi';

// Enterprise Phase 3
export { approvalApi } from './approvalApi';
export { performanceApi } from './performanceApi';
export { analyticsApi } from './analyticsApi';
export { costCenterApi } from './costCenterApi';
export { payrollExportApi } from './payrollExportApi';

// Re-export types
export type * from './approvalApi';
export type * from './performanceApi';
export type * from './analyticsApi';
export type * from './costCenterApi';
export type * from './payrollExportApi';
