// application/dtos/hrms/TripAssignmentDTO.ts
// DTOs for Trip Assignment operations

import { TripRole, AssignmentStatus, CompensationType } from '../../../domain/entities/hrms/TripAssignment';

// Create assignment
export interface CreateTripAssignmentDTO {
  tripId: string;
  employeeId: string;
  role: TripRole;
  isPrimary?: boolean;
  startDate: string;
  endDate: string;
  compensationType: CompensationType;
  tripBonus?: number;
  dailyRate?: number;
  specialInstructions?: string;
}

// Bulk assign
export interface BulkAssignDTO {
  tripId: string;
  assignments: Array<{
    employeeId: string;
    role: TripRole;
    isPrimary?: boolean;
    compensationType: CompensationType;
    tripBonus?: number;
    dailyRate?: number;
  }>;
}

// Confirm/decline
export interface AssignmentActionDTO {
  action: 'confirm' | 'decline';
  reason?: string;
}

// Complete with feedback
export interface CompleteAssignmentDTO {
  rating: number;  // 1-5
  feedback?: string;
  incidentReports?: string[];
}

// Response DTO
export interface TripAssignmentResponseDTO {
  id: string;
  
  trip: {
    id: string;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    totalGuests: number;
  };
  
  employee: {
    id: string;
    name: string;
    code: string;
    category: string;
    phone: string;
  };
  
  role: TripRole;
  roleLabel: string;
  isPrimary: boolean;
  
  startDate: string;
  endDate: string;
  totalDays: number;
  
  status: AssignmentStatus;
  statusLabel: string;
  
  compensation: {
    type: CompensationType;
    typeLabel: string;
    tripBonus?: number;
    dailyRate?: number;
    totalAmount: number;
  };
  
  performance?: {
    rating: number;
    feedback?: string;
  };
  
  specialInstructions?: string;
  
  createdAt: string;
}

// Trip crew overview
export interface TripCrewDTO {
  tripId: string;
  tripName: string;
  dates: string;
  
  crew: Array<{
    employeeId: string;
    employeeName: string;
    role: string;
    isPrimary: boolean;
    status: AssignmentStatus;
    phone: string;
  }>;
  
  // Counts by role
  byRole: Record<string, number>;
  
  // Status
  totalAssigned: number;
  confirmed: number;
  pending: number;
  declined: number;
}

// Availability check response
export interface AvailabilityCheckDTO {
  employeeId: string;
  employeeName: string;
  category: string;
  
  isAvailable: boolean;
  
  conflicts: Array<{
    tripId: string;
    tripName: string;
    dates: string;
    role: string;
  }>;
  
  leaveConflicts: Array<{
    leaveType: string;
    dates: string;
  }>;
  
  skills: string[];
  recentTrips: number;  // Last 30 days
  
  matchScore?: number;  // For skill matching
}

// Staff suggestion
export interface StaffSuggestionDTO {
  forRole: TripRole;
  suggestions: Array<{
    employee: {
      id: string;
      name: string;
      category: string;
    };
    matchScore: number;
    isAvailable: boolean;
    recentTripDays: number;
    skills: string[];
    notes?: string;
  }>;
}

// Role labels
export const TRIP_ROLE_LABELS: Record<TripRole, string> = {
  LEAD_GUIDE: 'Lead Guide',
  ASSISTANT_GUIDE: 'Assistant Guide',
  DRIVER: 'Driver',
  COOK: 'Cook',
  PORTER: 'Porter',
  HELPER: 'Helper',
  MEDIC: 'Medic',
  PHOTOGRAPHER: 'Photographer',
  SUPPORT: 'Support',
};

// Status labels
export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  PROPOSED: 'Proposed',
  CONFIRMED: 'Confirmed',
  DECLINED: 'Declined',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

// Compensation type labels
export const COMPENSATION_TYPE_LABELS: Record<CompensationType, string> = {
  SALARY_INCLUDED: 'Included in Salary',
  PER_TRIP: 'Per Trip',
  PER_DAY: 'Per Day',
  MIXED: 'Base + Daily',
};
