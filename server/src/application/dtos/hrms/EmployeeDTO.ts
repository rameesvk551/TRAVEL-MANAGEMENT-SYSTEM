// application/dtos/hrms/EmployeeDTO.ts
// DTOs for Employee operations

import { 
  EmployeeType, 
  EmployeeCategory, 
  LifecycleStage,
  ContactInfo,
  EmergencyContact 
} from '../../../domain/entities/hrms/Employee';

// Create Employee
export interface CreateEmployeeDTO {
  employeeCode?: string;  // Auto-generate if not provided
  firstName: string;
  lastName: string;
  preferredName?: string;
  
  type: EmployeeType;
  category: EmployeeCategory;
  
  branchId?: string;
  departmentId?: string;
  reportingTo?: string;
  costCenterId?: string;
  
  joiningDate: string;  // ISO date string
  probationEndDate?: string;
  
  contact: ContactInfo;
  emergencyContacts?: EmergencyContact[];
  
  attributes?: Record<string, unknown>;
}

// Update Employee
export interface UpdateEmployeeDTO {
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  
  type?: EmployeeType;
  category?: EmployeeCategory;
  
  branchId?: string;
  departmentId?: string;
  reportingTo?: string;
  costCenterId?: string;
  
  probationEndDate?: string;
  confirmationDate?: string;
  
  contact?: Partial<ContactInfo>;
  emergencyContacts?: EmergencyContact[];
  
  attributes?: Record<string, unknown>;
}

// Lifecycle transition
export interface TransitionLifecycleDTO {
  targetStage: LifecycleStage;
  reason?: string;
  effectiveDate?: string;
}

// Response DTO
export interface EmployeeResponseDTO {
  id: string;
  employeeCode: string;
  
  // Name
  firstName: string;
  lastName: string;
  preferredName?: string;
  displayName: string;
  
  // Classification
  type: EmployeeType;
  typeLabel: string;
  category: EmployeeCategory;
  categoryLabel: string;
  
  // Organization
  branchId?: string;
  branchName?: string;
  departmentId?: string;
  departmentName?: string;
  reportingTo?: string;
  reportingToName?: string;
  
  // Status
  lifecycleStage: LifecycleStage;
  lifecycleStageLabel: string;
  isActive: boolean;
  
  // Dates
  joiningDate: string;
  probationEndDate?: string;
  confirmationDate?: string;
  tenure: string;  // "2 years, 3 months"
  
  // Contact
  contact: ContactInfo;
  emergencyContacts: EmergencyContact[];
  
  // Computed
  hasActiveTrips: boolean;
  upcomingTripsCount: number;
  
  createdAt: string;
  updatedAt: string;
}

// List item DTO (lighter)
export interface EmployeeListItemDTO {
  id: string;
  employeeCode: string;
  displayName: string;
  type: EmployeeType;
  category: EmployeeCategory;
  categoryLabel: string;
  branchName?: string;
  departmentName?: string;
  lifecycleStage: LifecycleStage;
  isActive: boolean;
  phone: string;
  email: string;
}

// Labels
export const EMPLOYEE_TYPE_LABELS: Record<EmployeeType, string> = {
  OFFICE: 'Office Staff',
  FIELD: 'Field Staff',
  SEASONAL: 'Seasonal',
  CONTRACT: 'Contract',
};

export const EMPLOYEE_CATEGORY_LABELS: Record<EmployeeCategory, string> = {
  GUIDE: 'Guide',
  DRIVER: 'Driver',
  CREW: 'Crew',
  COOK: 'Cook',
  PORTER: 'Porter',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SUPPORT: 'Support',
};

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, string> = {
  PRE_HIRE: 'Pre-hire',
  ONBOARDING: 'Onboarding',
  ACTIVE: 'Active',
  ON_LEAVE: 'On Leave',
  NOTICE: 'Notice Period',
  RESIGNED: 'Resigned',
  TERMINATED: 'Terminated',
  ARCHIVED: 'Archived',
};
