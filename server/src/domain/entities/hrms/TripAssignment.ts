// domain/entities/hrms/TripAssignment.ts
// Staff assignment to trips/tours/treks

export type TripRole = 
  | 'LEAD_GUIDE' 
  | 'ASSISTANT_GUIDE' 
  | 'DRIVER' 
  | 'COOK' 
  | 'PORTER' 
  | 'HELPER'
  | 'MEDIC'
  | 'PHOTOGRAPHER'
  | 'SUPPORT';

export type AssignmentStatus = 
  | 'PROPOSED' 
  | 'CONFIRMED' 
  | 'DECLINED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED'
  | 'NO_SHOW';

export type CompensationType = 
  | 'SALARY_INCLUDED' 
  | 'PER_TRIP' 
  | 'PER_DAY' 
  | 'MIXED';

export interface TripAssignment {
  id: string;
  tenantId: string;
  
  // References
  tripId: string;
  tripName?: string;  // Denormalized for display
  employeeId: string;
  employeeName?: string;  // Denormalized for display
  
  role: TripRole;
  isPrimary: boolean;
  
  // Duration
  startDate: Date;
  endDate: Date;
  totalDays: number;
  
  // Status tracking
  status: AssignmentStatus;
  confirmedAt?: Date;
  declinedAt?: Date;
  declinedReason?: string;
  
  // Compensation
  compensationType: CompensationType;
  tripBonus?: number;
  dailyRate?: number;
  totalCompensation?: number;
  
  // Performance (post-trip)
  rating?: number;  // 1-5
  feedback?: string;
  incidentReports: string[];
  
  // Notes
  specialInstructions?: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export function createTripAssignment(
  params: Omit<TripAssignment, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'incidentReports'>
): Omit<TripAssignment, 'id'> {
  return {
    ...params,
    status: 'PROPOSED',
    incidentReports: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function calculateTotalCompensation(
  assignment: TripAssignment
): number {
  switch (assignment.compensationType) {
    case 'SALARY_INCLUDED':
      return 0;
    case 'PER_TRIP':
      return assignment.tripBonus || 0;
    case 'PER_DAY':
      return (assignment.dailyRate || 0) * assignment.totalDays;
    case 'MIXED':
      return (assignment.tripBonus || 0) + 
             ((assignment.dailyRate || 0) * assignment.totalDays);
    default:
      return 0;
  }
}

export function canTransitionStatus(
  current: AssignmentStatus, 
  target: AssignmentStatus
): boolean {
  const transitions: Record<AssignmentStatus, AssignmentStatus[]> = {
    PROPOSED: ['CONFIRMED', 'DECLINED', 'CANCELLED'],
    CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
    DECLINED: [],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
  };
  
  return transitions[current].includes(target);
}

export function isActiveAssignment(assignment: TripAssignment): boolean {
  return ['PROPOSED', 'CONFIRMED', 'IN_PROGRESS'].includes(assignment.status);
}

export function hasConflict(
  assignment: TripAssignment, 
  otherStart: Date, 
  otherEnd: Date
): boolean {
  return assignment.startDate <= otherEnd && assignment.endDate >= otherStart;
}
