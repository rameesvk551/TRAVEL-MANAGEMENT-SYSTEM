// domain/entities/hrms/Employee.ts
// Core Employee entity - the foundation of HRMS

export type EmployeeType = 'OFFICE' | 'FIELD' | 'SEASONAL' | 'CONTRACT';

export type EmployeeCategory = 
  | 'GUIDE' 
  | 'DRIVER' 
  | 'CREW' 
  | 'COOK' 
  | 'PORTER' 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'SUPPORT';

export type LifecycleStage = 
  | 'PRE_HIRE' 
  | 'ONBOARDING' 
  | 'ACTIVE' 
  | 'ON_LEAVE' 
  | 'NOTICE' 
  | 'RESIGNED' 
  | 'TERMINATED' 
  | 'ARCHIVED';

export interface ContactInfo {
  email: string;
  phone: string;
  alternatePhone?: string;
  address?: Address;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
}

export interface Employee {
  id: string;
  tenantId: string;
  
  // Identity
  employeeCode: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  
  // Classification
  type: EmployeeType;
  category: EmployeeCategory;
  
  // Organization
  branchId?: string;
  departmentId?: string;
  reportingTo?: string;
  costCenterId?: string;
  
  // Work Info
  joiningDate: Date;
  probationEndDate?: Date;
  confirmationDate?: Date;
  
  // Status
  lifecycleStage: LifecycleStage;
  isActive: boolean;
  
  // Contact
  contact: ContactInfo;
  emergencyContacts: EmergencyContact[];
  
  // Metadata
  attributes: Record<string, unknown>;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Factory for creating new employees
export function createEmployee(
  params: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>
): Omit<Employee, 'id'> {
  return {
    ...params,
    isActive: params.lifecycleStage !== 'ARCHIVED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Domain logic
export function canTransitionTo(
  current: LifecycleStage, 
  target: LifecycleStage
): boolean {
  const transitions: Record<LifecycleStage, LifecycleStage[]> = {
    PRE_HIRE: ['ONBOARDING', 'ARCHIVED'],
    ONBOARDING: ['ACTIVE', 'ARCHIVED'],
    ACTIVE: ['ON_LEAVE', 'NOTICE', 'TERMINATED', 'ARCHIVED'],
    ON_LEAVE: ['ACTIVE', 'NOTICE', 'TERMINATED'],
    NOTICE: ['RESIGNED', 'ACTIVE'],
    RESIGNED: ['ARCHIVED'],
    TERMINATED: ['ARCHIVED'],
    ARCHIVED: [],
  };
  
  return transitions[current].includes(target);
}

export function getDisplayName(employee: Employee): string {
  return employee.preferredName || 
    `${employee.firstName} ${employee.lastName}`;
}
