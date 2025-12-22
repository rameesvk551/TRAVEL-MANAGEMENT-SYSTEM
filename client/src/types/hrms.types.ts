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

// Document Types
export type DocumentCategory = 
    | 'IDENTITY' | 'CONTRACT' | 'CERTIFICATION' 
    | 'PERMIT' | 'MEDICAL' | 'EDUCATION' 
    | 'BANK' | 'TAX' | 'OTHER';

export type DocumentStatus = 
    | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface EmployeeDocument {
    id: string;
    employeeId: string;
    name: string;
    category: DocumentCategory;
    documentType: string;
    documentNumber?: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    issuedDate?: string;
    expiryDate?: string;
    status: DocumentStatus;
    verifiedBy?: string;
    verifiedAt?: string;
    rejectionReason?: string;
    isConfidential: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    uploadedBy: string;
    // Joined employee info
    employeeName?: string;
    employeeCode?: string;
}

export interface CreateDocumentDTO {
    employeeId: string;
    name: string;
    category: DocumentCategory;
    documentType: string;
    documentNumber?: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    issuedDate?: string;
    expiryDate?: string;
    isConfidential?: boolean;
    notes?: string;
}

export interface UpdateDocumentDTO {
    name?: string;
    category?: DocumentCategory;
    documentType?: string;
    documentNumber?: string;
    issuedDate?: string;
    expiryDate?: string;
    isConfidential?: boolean;
    notes?: string;
}

export interface DocumentQuery {
    employeeId?: string;
    category?: DocumentCategory;
    status?: DocumentStatus;
    isConfidential?: boolean;
    expiringWithinDays?: number;
    search?: string;
}

// ==========================================
// Growth Phase 2 Types
// ==========================================

// Availability Types
export type AvailabilityStatus = 
    | 'available' | 'unavailable' | 'tentative' 
    | 'on_leave' | 'on_trip' | 'blocked';

export interface Availability {
    id: string;
    employee_id: string;
    date: string;
    status: AvailabilityStatus;
    start_time?: string;
    end_time?: string;
    reason?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
    // Joined data
    employee_name?: string;
    employee_code?: string;
}

export interface CreateAvailabilityDTO {
    employee_id: string;
    date: string;
    status: AvailabilityStatus;
    start_time?: string;
    end_time?: string;
    reason?: string;
}

export interface AvailabilityQuery {
    employee_id?: string;
    start_date?: string;
    end_date?: string;
    status?: AvailabilityStatus;
}

// Expense Claim Types
export type ExpenseClaimStatus = 
    | 'draft' | 'submitted' | 'approved' 
    | 'rejected' | 'paid';

export type ExpenseCategory = 
    | 'transportation' | 'accommodation' | 'meals' 
    | 'fuel' | 'parking' | 'tolls' 
    | 'communication' | 'supplies' | 'entertainment' | 'other';

export interface ExpenseItem {
    id: string;
    expense_claim_id: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    receipt_url?: string;
    expense_date: string;
    created_at: string;
}

export interface ExpenseClaim {
    id: string;
    employee_id: string;
    claim_number?: string;
    title: string;
    description?: string;
    expense_date_from: string;
    expense_date_to: string;
    total_amount: number;
    approved_amount?: number;
    status: ExpenseClaimStatus;
    trip_id?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    reviewer_comments?: string;
    paid_at?: string;
    created_at: string;
    updated_at: string;
    // Joined data
    items?: ExpenseItem[];
    employee_name?: string;
    employee_code?: string;
}

export interface CreateExpenseClaimDTO {
    title: string;
    description?: string;
    expense_date_from: string;
    expense_date_to: string;
    trip_id?: string;
    items: Omit<ExpenseItem, 'id' | 'expense_claim_id' | 'created_at'>[];
}

export interface ExpenseClaimQuery {
    employee_id?: string;
    status?: ExpenseClaimStatus;
    start_date?: string;
    end_date?: string;
    trip_id?: string;
}

// Schedule Management Types
export interface Shift {
    id: string;
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    color?: string;
    is_active: boolean;
    tenant_id: string;
    created_at: string;
    updated_at: string;
}

export interface CreateShiftDTO {
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    break_minutes?: number;
    color?: string;
    is_active?: boolean;
}

export interface WorkPattern {
    id: string;
    name: string;
    code: string;
    description?: string;
    pattern: Record<string, string>; // day -> shift_id mapping
    is_default: boolean;
    tenant_id: string;
    created_at: string;
}

export interface Roster {
    id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'published' | 'archived';
    department_id?: string;
    branch_id?: string;
    tenant_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface RosterEntry {
    id: string;
    roster_id: string;
    employee_id: string;
    shift_id: string;
    date: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'absent' | 'swapped';
    notes?: string;
    created_at: string;
    updated_at: string;
    // Joined data
    employee_name?: string;
    shift_name?: string;
    shift_color?: string;
}

export interface CreateRosterEntryDTO {
    roster_id: string;
    employee_id: string;
    shift_id: string;
    date: string;
    notes?: string;
}

export type SwapRequestStatus = 
    | 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ShiftSwapRequest {
    id: string;
    original_entry_id: string;
    requested_entry_id?: string;
    requesting_employee_id: string;
    target_employee_id: string;
    status: SwapRequestStatus;
    reason: string;
    response_notes?: string;
    responded_by?: string;
    responded_at?: string;
    created_at: string;
    // Joined data
    requesting_employee_name?: string;
    target_employee_name?: string;
    original_shift_date?: string;
    original_shift_name?: string;
}

export interface CreateSwapRequestDTO {
    original_entry_id: string;
    requested_entry_id?: string;
    target_employee_id: string;
    reason: string;
}
