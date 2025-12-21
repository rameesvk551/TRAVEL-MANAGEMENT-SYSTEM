/**
 * HRMS Types - Frontend Type Definitions
 * Mirrors backend DTOs for type-safe API integration
 */

// Employee Types
export interface Employee {
    id: string;
    tenantId: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    employeeType: EmployeeType;
    status: EmployeeStatus;
    departmentId?: string;
    branchId?: string;
    dateOfJoining: string;
    dateOfBirth?: string;
    address?: string;
    emergencyContact?: string;
    profilePhoto?: string;
    createdAt: string;
    updatedAt: string;
}

export type EmployeeType = 'office' | 'field' | 'seasonal' | 'contract';
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface CreateEmployeeDTO {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    employeeType: EmployeeType;
    departmentId?: string;
    branchId?: string;
    dateOfJoining: string;
    dateOfBirth?: string;
    address?: string;
    emergencyContact?: string;
}

export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {
    status?: EmployeeStatus;
}

// Attendance Types
export interface Attendance {
    id: string;
    employeeId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: AttendanceStatus;
    workHours?: number;
    checkInLocation?: GeoLocation;
    checkOutLocation?: GeoLocation;
    tripId?: string;
    notes?: string;
    createdAt: string;
}

export type AttendanceStatus = 
    | 'present' | 'absent' | 'half_day' 
    | 'on_trip' | 'remote' | 'holiday';

export interface GeoLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

export interface CheckInDTO {
    location?: GeoLocation;
    tripId?: string;
    notes?: string;
}

export interface CheckOutDTO {
    location?: GeoLocation;
    notes?: string;
}

// Leave Types
export interface Leave {
    id: string;
    employeeId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: LeaveStatus;
    reason: string;
    approverId?: string;
    approverRemarks?: string;
    createdAt: string;
    updatedAt: string;
}

export type LeaveType = 
    | 'casual' | 'sick' | 'earned' 
    | 'unpaid' | 'maternity' | 'paternity';

export type LeaveStatus = 
    | 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface CreateLeaveDTO {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
}

export interface LeaveBalance {
    leaveType: LeaveType;
    total: number;
    used: number;
    remaining: number;
}

// Trip Assignment Types
export interface TripAssignment {
    id: string;
    employeeId: string;
    tripId: string;
    role: TripRole;
    status: TripAssignmentStatus;
    startDate: string;
    endDate: string;
    dailyRate?: number;
    totalAmount?: number;
    notes?: string;
    createdAt: string;
}

export type TripRole = 
    | 'guide' | 'driver' | 'coordinator' 
    | 'photographer' | 'support';

export type TripAssignmentStatus = 
    | 'assigned' | 'confirmed' | 'in_progress' 
    | 'completed' | 'cancelled';

// Payroll Types
export interface Payroll {
    id: string;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    baseSalary: number;
    tripEarnings: number;
    overtime: number;
    deductions: number;
    netSalary: number;
    status: PayrollStatus;
    paidAt?: string;
    createdAt: string;
}

export type PayrollStatus = 
    | 'draft' | 'pending' | 'approved' 
    | 'paid' | 'cancelled';

// Skill Types
export interface Skill {
    id: string;
    name: string;
    category: string;
}

export interface EmployeeSkill {
    skillId: string;
    skillName: string;
    proficiency: 'beginner' | 'intermediate' | 'expert';
    certifiedAt?: string;
}
