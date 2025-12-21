# HRMS Architecture - People Infrastructure for Travel Businesses

> **Philosophy**: Not an HR tool. A People Operating System for travel businesses.

## 1. Module Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HRMS MODULE LAYER                            │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│   PEOPLE     │   WORK       │   MONEY      │   INSIGHTS           │
│   CORE       │   FLOW       │   FLOW       │   ENGINE             │
├──────────────┼──────────────┼──────────────┼──────────────────────┤
│ • Team       │ • Time       │ • Pay        │ • People             │
│ • Roles      │ • Leave      │ • Expenses   │   Analytics          │
│ • Documents  │ • Schedule   │ • Advances   │ • Cost               │
│ • Skills     │ • Trips      │ • Incentives │   Intelligence       │
└──────────────┴──────────────┴──────────────┴──────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  INTEGRATION HUB  │
                    │  (Existing ERP)   │
                    └───────────────────┘
```

## 2. Module Breakdown

### 2.1 PEOPLE CORE (Foundation)

| Sub-Module | Purpose | Key Entities |
|------------|---------|--------------|
| **Team** | Employee lifecycle management | Employee, EmployeeTimeline |
| **Roles** | Dynamic role & permission system | Role, RoleAssignment, Permission |
| **Documents** | Secure document vault | Document, Certificate, Permit |
| **Skills** | Competency tracking | Skill, Certification, Training |

### 2.2 WORK FLOW (Operations)

| Sub-Module | Purpose | Key Entities |
|------------|---------|--------------|
| **Time** | Multi-mode attendance | AttendanceRecord, CheckIn |
| **Leave** | Leave & availability | LeaveRequest, LeaveBalance |
| **Schedule** | Shift & roster | Shift, Roster, WorkPattern |
| **Trips** | Trip workforce assignment | TripAssignment, CrewPlan |

### 2.3 MONEY FLOW (Compensation)

| Sub-Module | Purpose | Key Entities |
|------------|---------|--------------|
| **Pay** | Payroll engine | PayStructure, Payslip |
| **Expenses** | Reimbursements | ExpenseClaim, ExpenseItem |
| **Advances** | Salary advances | Advance, AdvanceRecovery |
| **Incentives** | Trip bonuses | Incentive, IncentiveRule |

### 2.4 INSIGHTS ENGINE (Intelligence)

| Sub-Module | Purpose | Key Entities |
|------------|---------|--------------|
| **Analytics** | People metrics | MetricSnapshot, Trend |
| **CostIntel** | Labor cost analysis | CostCenter, CostAllocation |

---

## 3. Domain Entities (Conceptual Data Model)

### 3.1 Core Employee Entity

```typescript
// domain/entities/hrms/Employee.ts
interface Employee {
  id: string;
  tenantId: string;
  
  // Identity
  employeeCode: string;        // Auto-generated, company-specific format
  firstName: string;
  lastName: string;
  preferredName?: string;
  
  // Classification
  type: EmployeeType;          // OFFICE | FIELD | SEASONAL | CONTRACT
  category: EmployeeCategory;  // GUIDE | DRIVER | CREW | ADMIN | MANAGER
  
  // Organization
  branchId: string;
  departmentId: string;
  reportingTo?: string;        // Manager employee ID
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
  attributes: Record<string, unknown>;  // Flexible extension
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

type EmployeeType = 'OFFICE' | 'FIELD' | 'SEASONAL' | 'CONTRACT';
type EmployeeCategory = 'GUIDE' | 'DRIVER' | 'CREW' | 'COOK' | 'PORTER' | 'ADMIN' | 'MANAGER' | 'SUPPORT';
type LifecycleStage = 'PRE_HIRE' | 'ONBOARDING' | 'ACTIVE' | 'ON_LEAVE' | 'NOTICE' | 'RESIGNED' | 'TERMINATED' | 'ARCHIVED';
```

### 3.2 Role & Permission System

```typescript
// domain/entities/hrms/Role.ts
interface Role {
  id: string;
  tenantId: string;
  
  code: string;              // e.g., 'TREK_LEAD', 'BRANCH_HR'
  name: string;
  description: string;
  
  scope: RoleScope;          // GLOBAL | BRANCH | DEPARTMENT | PROJECT
  scopeId?: string;          // If branch/dept specific
  
  permissions: Permission[];
  
  isSystemRole: boolean;     // Cannot be deleted
  isActive: boolean;
}

interface RoleAssignment {
  id: string;
  employeeId: string;
  roleId: string;
  
  // Context
  contextType: 'PERMANENT' | 'TEMPORARY' | 'PROJECT';
  contextId?: string;        // Trip ID, Project ID, etc.
  
  // Duration
  startDate: Date;
  endDate?: Date;            // Null = permanent
  
  // Delegation
  delegatedBy?: string;
  delegationReason?: string;
  
  isActive: boolean;
}

interface Permission {
  resource: string;          // 'employee', 'attendance', 'payroll'
  actions: string[];         // ['read', 'write', 'approve', 'export']
  conditions?: Record<string, unknown>;  // { ownBranchOnly: true }
}
```

### 3.3 Attendance System

```typescript
// domain/entities/hrms/Attendance.ts
interface AttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  
  date: Date;
  
  // Check-in/out
  checkIn?: CheckInRecord;
  checkOut?: CheckInRecord;
  
  // Calculated
  workHours: number;
  overtimeHours: number;
  
  // Classification
  type: AttendanceType;
  status: AttendanceStatus;
  
  // Trip-based
  tripId?: string;
  tripDay?: number;          // Day 1, Day 2 of trek
  
  // Audit
  source: AttendanceSource;
  isManualOverride: boolean;
  overrideReason?: string;
  approvedBy?: string;
}

interface CheckInRecord {
  timestamp: Date;
  mode: CheckInMode;
  
  // GPS
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAccuracy?: number;
  
  // Sync
  offlineRecorded?: Date;    // When recorded offline
  syncedAt?: Date;           // When synced to server
  
  deviceInfo?: DeviceInfo;
}

type AttendanceType = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_TRIP' | 'REST_DAY' | 'WEEK_OFF' | 'HOLIDAY';
type AttendanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED';
type AttendanceSource = 'PUNCH' | 'MOBILE' | 'TRIP_AUTO' | 'MANUAL' | 'IMPORT';
type CheckInMode = 'OFFICE_PUNCH' | 'MOBILE_GPS' | 'QR_SCAN' | 'MANUAL';
```

### 3.4 Leave Management

```typescript
// domain/entities/hrms/Leave.ts
interface LeaveType {
  id: string;
  tenantId: string;
  
  code: string;              // 'CL', 'SL', 'PL', 'LWP'
  name: string;
  
  // Rules
  isPaid: boolean;
  maxDaysPerYear: number;
  carryForwardLimit: number;
  minDaysNotice: number;
  
  // Applicability
  applicableTo: EmployeeType[];
  requiresApproval: boolean;
  requiresDocument: boolean; // Medical certificate, etc.
  
  // Blackout
  blackoutPeriods: DateRange[];
  
  isActive: boolean;
}

interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  
  leaveTypeId: string;
  
  fromDate: Date;
  toDate: Date;
  totalDays: number;
  isHalfDay: boolean;
  halfDayType?: 'FIRST' | 'SECOND';
  
  reason: string;
  
  // Workflow
  status: LeaveStatus;
  approvalChain: ApprovalStep[];
  
  // Conflict
  hasConflict: boolean;
  conflictingTrips?: string[];
  
  // Replacement
  replacementEmployeeId?: string;
  
  attachments: string[];
}

interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  
  opening: number;
  accrued: number;
  taken: number;
  pending: number;
  carryForward: number;
  
  available: number;         // Calculated
}

type LeaveStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REVOKED';
```

### 3.5 Trip Assignment

```typescript
// domain/entities/hrms/TripAssignment.ts
interface TripAssignment {
  id: string;
  tenantId: string;
  
  tripId: string;            // Reference to existing trip/departure
  employeeId: string;
  
  role: TripRole;            // Role for THIS trip
  isPrimary: boolean;        // Primary guide vs assistant
  
  // Duration
  startDate: Date;
  endDate: Date;
  
  // Status
  status: AssignmentStatus;
  confirmedAt?: Date;
  declinedReason?: string;
  
  // Compensation
  compensationType: 'SALARY_INCLUDED' | 'PER_TRIP' | 'PER_DAY';
  tripBonus?: number;
  dailyRate?: number;
  
  // Performance
  rating?: number;
  feedback?: string;
  incidentReports?: string[];
}

type TripRole = 'LEAD_GUIDE' | 'ASSISTANT_GUIDE' | 'DRIVER' | 'COOK' | 'PORTER' | 'SUPPORT';
type AssignmentStatus = 'PROPOSED' | 'CONFIRMED' | 'DECLINED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
```

### 3.6 Payroll Structure

```typescript
// domain/entities/hrms/Payroll.ts
interface PayStructure {
  id: string;
  tenantId: string;
  employeeId: string;
  
  effectiveFrom: Date;
  effectiveTo?: Date;
  
  payModel: PayModel;
  
  // Components
  baseSalary: number;
  dailyRate?: number;
  tripRate?: number;
  hourlyRate?: number;
  
  // Allowances
  allowances: PayComponent[];
  
  // Deductions
  deductions: PayComponent[];
  
  currency: string;
  
  isActive: boolean;
}

interface Payslip {
  id: string;
  tenantId: string;
  employeeId: string;
  
  period: PayPeriod;
  
  // Earnings
  earnings: PayslipLine[];
  grossEarnings: number;
  
  // Deductions
  deductions: PayslipLine[];
  totalDeductions: number;
  
  // Net
  netPayable: number;
  
  // Reimbursements
  reimbursements: PayslipLine[];
  
  // Trip-based earnings
  tripEarnings: TripEarning[];
  
  // Status
  status: PayslipStatus;
  generatedAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
  
  paymentReference?: string;
}

type PayModel = 'MONTHLY' | 'DAILY' | 'PER_TRIP' | 'HOURLY' | 'MIXED';
type PayslipStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'CANCELLED';
```

---

## 4. Backend Directory Structure (Following Clean Architecture)

```
server/src/
├── domain/
│   └── entities/
│       └── hrms/
│           ├── Employee.ts
│           ├── EmployeeTimeline.ts
│           ├── Role.ts
│           ├── RoleAssignment.ts
│           ├── Permission.ts
│           ├── Attendance.ts
│           ├── LeaveType.ts
│           ├── LeaveRequest.ts
│           ├── LeaveBalance.ts
│           ├── TripAssignment.ts
│           ├── PayStructure.ts
│           ├── Payslip.ts
│           ├── Skill.ts
│           ├── Document.ts
│           └── index.ts
│   └── interfaces/
│       └── hrms/
│           ├── IEmployeeRepository.ts
│           ├── IRoleRepository.ts
│           ├── IAttendanceRepository.ts
│           ├── ILeaveRepository.ts
│           ├── ITripAssignmentRepository.ts
│           ├── IPayrollRepository.ts
│           └── index.ts
│
├── application/
│   └── services/
│       └── hrms/
│           ├── EmployeeService.ts
│           ├── RoleService.ts
│           ├── AttendanceService.ts
│           ├── LeaveService.ts
│           ├── TripAssignmentService.ts
│           ├── PayrollService.ts
│           ├── AvailabilityService.ts
│           └── index.ts
│   └── dtos/
│       └── hrms/
│           ├── EmployeeDTO.ts
│           ├── AttendanceDTO.ts
│           ├── LeaveDTO.ts
│           ├── PayslipDTO.ts
│           └── index.ts
│   └── mappers/
│       └── hrms/
│           ├── EmployeeMapper.ts
│           ├── AttendanceMapper.ts
│           └── index.ts
│
├── infrastructure/
│   └── repositories/
│       └── hrms/
│           ├── EmployeeRepository.ts
│           ├── RoleRepository.ts
│           ├── AttendanceRepository.ts
│           ├── LeaveRepository.ts
│           ├── TripAssignmentRepository.ts
│           ├── PayrollRepository.ts
│           └── index.ts
│   └── database/
│       └── migrations/
│           └── hrms/
│               ├── 001_create_employees.ts
│               ├── 002_create_roles.ts
│               ├── 003_create_attendance.ts
│               ├── 004_create_leaves.ts
│               ├── 005_create_payroll.ts
│               └── index.ts
│
├── presentation/
│   └── controllers/
│       └── hrms/
│           ├── EmployeeController.ts
│           ├── AttendanceController.ts
│           ├── LeaveController.ts
│           ├── PayrollController.ts
│           └── index.ts
│   └── routes/
│       └── hrms/
│           ├── employee.routes.ts
│           ├── attendance.routes.ts
│           ├── leave.routes.ts
│           ├── payroll.routes.ts
│           └── index.ts
│   └── validators/
│       └── hrms/
│           ├── employee.validator.ts
│           ├── attendance.validator.ts
│           └── index.ts
```

---

## 5. Frontend Structure (Role-Aware, Mobile-First)

```
client/src/
├── features/
│   └── hrms/
│       ├── api/
│       │   ├── employeeApi.ts
│       │   ├── attendanceApi.ts
│       │   ├── leaveApi.ts
│       │   ├── payrollApi.ts
│       │   └── index.ts
│       │
│       ├── hooks/
│       │   ├── useEmployee.ts
│       │   ├── useAttendance.ts
│       │   ├── useLeave.ts
│       │   ├── usePayroll.ts
│       │   ├── useTripAssignment.ts
│       │   └── index.ts
│       │
│       ├── components/
│       │   ├── employee/
│       │   │   ├── EmployeeCard.tsx
│       │   │   ├── EmployeeProfile.tsx
│       │   │   ├── EmployeeTimeline.tsx
│       │   │   ├── SkillBadges.tsx
│       │   │   └── index.ts
│       │   ├── attendance/
│       │   │   ├── CheckInButton.tsx
│       │   │   ├── AttendanceCalendar.tsx
│       │   │   ├── AttendanceList.tsx
│       │   │   └── index.ts
│       │   ├── leave/
│       │   │   ├── LeaveRequestForm.tsx
│       │   │   ├── LeaveBalanceCard.tsx
│       │   │   ├── LeaveCalendar.tsx
│       │   │   └── index.ts
│       │   ├── payroll/
│       │   │   ├── PayslipView.tsx
│       │   │   ├── PayrollSummary.tsx
│       │   │   └── index.ts
│       │   └── index.ts
│       │
│       ├── pages/
│       │   ├── team/
│       │   │   ├── TeamDirectory.tsx
│       │   │   ├── EmployeeDetail.tsx
│       │   │   ├── AddEmployee.tsx
│       │   │   └── index.ts
│       │   ├── time/
│       │   │   ├── MyAttendance.tsx
│       │   │   ├── TeamAttendance.tsx
│       │   │   └── index.ts
│       │   ├── leave/
│       │   │   ├── MyLeaves.tsx
│       │   │   ├── LeaveApprovals.tsx
│       │   │   └── index.ts
│       │   ├── payroll/
│       │   │   ├── MyPayslips.tsx
│       │   │   ├── PayrollRun.tsx
│       │   │   └── index.ts
│       │   └── index.ts
│       │
│       ├── store/
│       │   └── hrmsStore.ts
│       │
│       └── types/
│           └── hrms.types.ts
│
├── pages/
│   └── hrms/
│       ├── HrmsDashboard.tsx
│       ├── People.tsx
│       ├── Time.tsx
│       ├── Pay.tsx
│       └── index.ts
```

---

## 6. UX Screens by Role

### 6.1 Field Staff (Guide/Driver/Crew) - Mobile First

| Screen | Purpose | Priority |
|--------|---------|----------|
| **My Dashboard** | Today's status, upcoming trips | P0 |
| **Check-In** | GPS check-in with offline support | P0 |
| **My Trips** | Assigned trips, dates, team | P0 |
| **Leave Request** | Apply leave, check balance | P0 |
| **My Payslips** | View salary, download PDF | P1 |
| **My Profile** | Update contact, view documents | P1 |
| **Team Chat** | Trip-specific communication | P2 |

### 6.2 HR Manager - Desktop First

| Screen | Purpose | Priority |
|--------|---------|----------|
| **HR Dashboard** | KPIs, alerts, pending actions | P0 |
| **Team Directory** | All employees, filters, search | P0 |
| **Attendance Manager** | Review, approve, override | P0 |
| **Leave Approvals** | Pending requests, conflicts | P0 |
| **Payroll Run** | Generate, review, approve | P0 |
| **Employee Onboarding** | Add employee, documents | P0 |
| **Reports** | Attendance, leave, payroll | P1 |
| **Settings** | Leave types, pay structures | P1 |

### 6.3 Operations Manager - Desktop

| Screen | Purpose | Priority |
|--------|---------|----------|
| **Ops Dashboard** | Staff availability, trip coverage | P0 |
| **Trip Staffing** | Assign crew to trips | P0 |
| **Availability Calendar** | Who's free when | P0 |
| **Skill Matrix** | Who can do what | P1 |
| **Conflict Resolver** | Double-booking warnings | P1 |

### 6.4 Founder/CEO - Desktop

| Screen | Purpose | Priority |
|--------|---------|----------|
| **Executive Dashboard** | Cost, utilization, trends | P0 |
| **Labor Cost Analysis** | Per trip, per month, per dept | P0 |
| **Headcount Trends** | Growth, attrition, seasonality | P1 |
| **Payroll Overview** | Total cost, comparisons | P1 |

---

## 7. User Journey Flows

### 7.1 Field Staff Check-In (Offline-Capable)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Open   │────▶│  Tap    │────▶│  GPS    │────▶│ Confirm │
│  App    │     │ Check-In│     │ Capture │     │ + Photo │
└─────────┘     └─────────┘     └─────────┘     └────┬────┘
                                                     │
                    ┌────────────────────────────────┘
                    ▼
              ┌───────────┐     ┌───────────┐
              │  Queue    │────▶│  Sync to  │
              │  Offline  │     │  Server   │
              └───────────┘     └───────────┘
```

### 7.2 Leave Request with Conflict Detection

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Select │────▶│  Pick   │────▶│  Check  │────▶│ Submit  │
│  Type   │     │  Dates  │     │ Conflict│     │ Request │
└─────────┘     └─────────┘     └────┬────┘     └────┬────┘
                                     │               │
                              ┌──────┴──────┐        │
                              ▼             ▼        │
                         [No Trip]    [Has Trip]    │
                              │         │           │
                              │    ┌────┴────┐      │
                              │    │ Suggest │      │
                              │    │ Replace │      │
                              │    └────┬────┘      │
                              │         │           │
                              └────┬────┘           │
                                   ▼                ▼
                              ┌────────────────────────┐
                              │   Approval Workflow    │
                              └────────────────────────┘
```

### 7.3 Trip Staff Assignment

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  View   │────▶│  Check  │────▶│  Match  │────▶│ Confirm │
│  Trip   │     │Required │     │  Skills │     │  Crew   │
└─────────┘     └─────────┘     └────┬────┘     └────┬────┘
                                     │               │
                              ┌──────┴──────┐        │
                              ▼             ▼        │
                        [Available]   [Conflict]    │
                              │             │        │
                              │    ┌────────┴───┐    │
                              │    │ Show Alts  │    │
                              │    │ or Resolve │    │
                              │    └────────────┘    │
                              │                      │
                              └──────────────────────┘
                                        │
                                        ▼
                              ┌────────────────────┐
                              │  Notify Employee   │
                              │  (Accept/Decline)  │
                              └────────────────────┘
```

---

## 8. Dashboard Layouts

### 8.1 Field Staff Dashboard (Mobile)

```
┌─────────────────────────────────────┐
│  Good Morning, Rajesh! 👋           │
│  Guide · Himalayan Expeditions      │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │   [📍 CHECK-IN]             │    │
│  │   You're at: Manali Office  │    │
│  │   Last check-in: 8:30 AM    │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  📅 UPCOMING TRIPS                  │
│  ┌─────────────────────────────┐    │
│  │ Hampta Pass Trek            │    │
│  │ Dec 24-29 · Lead Guide      │    │
│  │ 8 guests · Team: 4          │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ Kasol Weekend               │    │
│  │ Jan 3-5 · Assistant         │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  📊 THIS MONTH                      │
│  ┌─────────┬─────────┬─────────┐    │
│  │ Present │ On Trip │ Leave   │    │
│  │   12    │   8     │   2     │    │
│  └─────────┴─────────┴─────────┘    │
├─────────────────────────────────────┤
│  💰 LEAVE BALANCE                   │
│  Casual: 5 │ Sick: 3 │ Paid: 12    │
└─────────────────────────────────────┘
```

### 8.2 HR Manager Dashboard (Desktop)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  HR Dashboard                                              Dec 21, 2025 │ 🔔 3 │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ Total Staff  │ │ Present      │ │ On Trip      │ │ On Leave     │          │
│  │     48       │ │     32       │ │     12       │ │      4       │          │
│  │ ↑ 3 this mo  │ │   66.7%      │ │   25.0%      │ │    8.3%      │          │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│  🔴 PENDING ACTIONS                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ ⏳ 5 Leave Requests awaiting approval                      [View All →] │  │
│  │ ⏳ 3 Attendance overrides pending                          [Review →]   │  │
│  │ ⚠️ 2 Staff without confirmed December trips                [Assign →]   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
├──────────────────────────────────┬─────────────────────────────────────────────┤
│  📅 ATTENDANCE THIS WEEK         │  📊 LEAVE OVERVIEW                          │
│  ┌────────────────────────────┐  │  ┌───────────────────────────────────────┐  │
│  │ Mon ████████████░░░ 85%   │  │  │ Leave Type      │ Taken │ Pending │  │  │
│  │ Tue █████████████░░ 90%   │  │  ├─────────────────┼───────┼─────────┤  │  │
│  │ Wed ████████████░░░ 85%   │  │  │ Casual Leave    │  42   │    5    │  │  │
│  │ Thu ██████████████░ 95%   │  │  │ Sick Leave      │  18   │    2    │  │  │
│  │ Fri █████████████░░ 88%   │  │  │ Paid Leave      │  65   │    8    │  │  │
│  └────────────────────────────┘  │  └───────────────────────────────────────┘  │
│                                   │                                             │
├──────────────────────────────────┴─────────────────────────────────────────────┤
│  👥 UPCOMING JOININGS             💼 PAYROLL STATUS                            │
│  ┌────────────────────────────┐   ┌────────────────────────────────────────┐   │
│  │ Amit Kumar · Guide         │   │ December Payroll                       │   │
│  │ Joining: Dec 26            │   │ Status: Processing                     │   │
│  │ [Complete Onboarding →]    │   │ 45/48 payslips generated               │   │
│  └────────────────────────────┘   │ [Review & Approve →]                   │   │
│                                    └────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Founder Dashboard (Desktop)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  People Insights                                          Dec 2025 │ Monthly ▼│
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ Labor Cost   │ │ Cost/Trip    │ │ Utilization  │ │ Attrition    │          │
│  │   ₹4.2L      │ │   ₹12,400    │ │    78%       │ │    2.1%      │          │
│  │ ↑8% vs Nov   │ │ ↓5% vs Nov   │ │ ↑ 12%        │ │ ↓ from 3.2%  │          │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│  📈 LABOR COST VS REVENUE                    👥 HEADCOUNT BY TYPE              │
│  ┌────────────────────────────────────┐      ┌──────────────────────────────┐  │
│  │     ₹     Revenue   Labor Cost     │      │ Guides      ████████ 18     │  │
│  │  25L │    ──────    ─ ─ ─ ─        │      │ Drivers     █████ 10        │  │
│  │  20L │   /      \                  │      │ Crew        ███████ 14      │  │
│  │  15L │  /        \    ___          │      │ Admin       ██ 4            │  │
│  │  10L │ /          ---/            │      │ Management  █ 2             │  │
│  │   5L │/                            │      └──────────────────────────────┘  │
│  │      └──┬───┬───┬───┬───┬───┬──   │                                        │
│  │        Jul Aug Sep Oct Nov Dec    │                                        │
│  └────────────────────────────────────┘                                        │
│                                                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│  🔥 TOP INSIGHTS                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ 💡 3 guides are underutilized (<50% trip days). Consider cross-training │  │
│  │ ⚠️ Kasol trips have 20% higher crew cost. Review porter allocation      │  │
│  │ ✅ December utilization is best in 6 months. Peak season performing.    │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Feature Prioritization

### MVP (Phase 1) - 6-8 weeks

| Feature | Module | Effort |
|---------|--------|--------|
| Employee CRUD + Profiles | People Core | M |
| Basic Role System | People Core | S |
| Mobile Check-In (GPS) | Work Flow | L |
| Attendance Review | Work Flow | M |
| Leave Types Setup | Work Flow | S |
| Leave Request + Approval | Work Flow | M |
| Basic Payslip View | Money Flow | M |

### Growth (Phase 2) - 8-10 weeks

| Feature | Module | Effort |
|---------|--------|--------|
| Trip Assignment | Work Flow | L |
| Availability Calendar | Work Flow | M |
| Skill Management | People Core | M |
| Document Vault | People Core | M |
| Payroll Calculation | Money Flow | L |
| Expense Claims | Money Flow | M |

### Enterprise (Phase 3) - 10-12 weeks

| Feature | Module | Effort |
|---------|--------|--------|
| Approval Chain Designer | People Core | L |
| Offline Sync | Work Flow | L |
| Performance Tracking | People Core | M |
| HR Analytics Dashboard | Insights | L |
| Payroll Export | Money Flow | M |
| Communication Layer | Work Flow | M |

---

## 10. Naming Conventions (Human-Friendly)

### Module Names (User-Facing)
- ❌ HRM, HRIS, Workforce Management
- ✅ **People**, **Team**, **Time**, **Pay**

### Screen Names
- ❌ Employee Master, Attendance Register
- ✅ **Team Directory**, **My Attendance**, **Leave Calendar**

### Action Names
- ❌ Create Employee Record, Submit Attendance
- ✅ **Add Team Member**, **Check In**, **Request Leave**

### Status Names
- ❌ Pending Approval, Approved, Rejected
- ✅ **Awaiting Review**, **Approved**, **Declined**

---

## 11. Integration Points with Existing ERP

```typescript
// HRMS ↔ Existing Modules Integration

// 1. Trip/Departure Integration
interface TripIntegration {
  // HRMS consumes
  onTripCreated: (trip: Trip) => void;       // Create staffing requirement
  onTripUpdated: (trip: Trip) => void;       // Update assignments
  onTripCancelled: (tripId: string) => void; // Release staff
  
  // HRMS provides
  getAvailableStaff: (dates: DateRange, skills?: string[]) => Employee[];
  assignStaff: (tripId: string, assignments: TripAssignment[]) => void;
}

// 2. Booking Integration
interface BookingIntegration {
  // HRMS provides
  getAssignedStaff: (bookingId: string) => Employee[];
}

// 3. Finance Integration
interface FinanceIntegration {
  // HRMS provides
  exportPayroll: (period: PayPeriod) => PayrollExport;
  getEmployeeCosts: (employeeId: string, period: DateRange) => CostBreakdown;
}

// Webhooks
const hrmsWebhooks = {
  'employee.created': '/webhooks/hrms/employee-created',
  'employee.terminated': '/webhooks/hrms/employee-terminated',
  'attendance.checked_in': '/webhooks/hrms/attendance-checkin',
  'leave.approved': '/webhooks/hrms/leave-approved',
  'trip_assignment.confirmed': '/webhooks/hrms/assignment-confirmed',
  'payroll.processed': '/webhooks/hrms/payroll-processed',
};
```

---

## 12. Governance & Audit

### Audit Trail Schema
```typescript
interface AuditLog {
  id: string;
  tenantId: string;
  
  // What
  entity: string;           // 'employee', 'attendance', 'leave'
  entityId: string;
  action: AuditAction;      // 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'
  
  // Who
  actorId: string;
  actorType: 'USER' | 'SYSTEM' | 'INTEGRATION';
  
  // When
  timestamp: Date;
  
  // Details
  changes: ChangeRecord[];
  metadata: Record<string, unknown>;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

interface ChangeRecord {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}
```

---

## 13. Technology Decisions

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **State** | React Query + Zustand | Query for server, Zustand for UI state |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Mobile Check-In** | PWA + Geolocation API | Offline-capable |
| **Offline Sync** | IndexedDB + Background Sync | Reliable field operations |
| **PDF Generation** | Server-side (Puppeteer) | Consistent payslips |
| **Real-time** | Server-Sent Events | Notifications, sync status |

---

> **Next Steps**: Begin implementation with MVP features starting from Employee entity and basic attendance.
