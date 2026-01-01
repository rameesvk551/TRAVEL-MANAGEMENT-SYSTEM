# Product User Flow Documentation

## Purpose

This document provides a complete operational reference for the Travel Management System (TMS). It describes how users interact with the platform from initial registration through daily operations, detailing the step-by-step flows, system behaviors, and outcomes for each action.

## Target Audience

- End Users (Sales, Operations, Field Staff)
- Administrators
- Operations Team
- Product and Engineering Teams
- Investors and Partners

## Document Scope

This documentation covers the complete user journey across all system modules: Authentication, CRM, Booking Engine, Inventory Management, HRMS, Vendor Management, Gear Management, and Accounting.

---

# User Roles and Access Levels

## Role Hierarchy

The system implements a hierarchical role-based access control model. Each role inherits permissions from lower-level roles while gaining additional capabilities.

| Role | Access Level | Description |
|------|-------------|-------------|
| Owner | 5 (Highest) | Full system control, tenant configuration, billing management |
| Admin | 4 | User management, system settings, all operational features |
| Manager | 3 | Department/branch oversight, reporting, approval workflows |
| Staff | 2 | Day-to-day operations within assigned scope |
| Viewer | 1 (Lowest) | Read-only access to permitted data |

## Role Permissions Matrix

### Owner

- Full system administration
- Tenant configuration and branding
- Billing and subscription management
- Create and manage all user accounts
- Access all branches and data
- Configure system-wide settings
- Delete or archive critical data

### Admin

- User account management (except Owner)
- Branch and department configuration
- System settings within tenant scope
- Full access to all operational modules
- Generate all reports
- Manage integrations (WhatsApp, Payment Gateways)

### Manager

- View and manage assigned branch/department data
- Approve leave requests and expense claims
- Assign staff to trips
- View subordinate performance metrics
- Create and manage bookings
- Access CRM and lead management
- Run operational reports

### Staff

- Access assigned modules based on department
- Create and update records within scope
- View personal data and assignments
- Submit leave requests and expense claims
- Log CRM activities
- Process bookings (if Operations staff)

### Viewer

- Read-only access to dashboards
- View reports (no export)
- View booking and lead information
- No create, update, or delete permissions

---

# Authentication Flows

## User Registration Flow

### Entry Points

- Application landing page via "Register" button
- Login page via "Create Account" link
- Direct URL: `/register`

### Step-by-Step Flow

1. User navigates to registration page
2. System displays multi-step registration form

**Step 1: Admin Information**
1. User enters first name
2. User enters last name
3. User enters email address
4. User enters phone number (optional)
5. User clicks "Next"
6. System validates input format

**Step 2: Security**
1. User enters password (minimum 8 characters)
2. User confirms password
3. User accepts terms of service
4. User clicks "Next"
5. System validates password strength and match

**Step 3: Company Information**
1. User enters company name
2. System auto-generates company slug from name
3. User selects industry type (optional)
4. User enters company description (optional)
5. User clicks "Complete Registration"

### System Actions (Behind the Scenes)

1. Validate all input fields against schema
2. Check if email already exists in system
3. Check if tenant slug is unique
4. Create new tenant record with provided company information
5. Hash password using bcrypt
6. Create user record with role = 'owner' (first user of tenant)
7. Associate user with new tenant
8. Generate authentication token
9. Create audit log entry for registration
10. Initialize default pipeline stages for CRM
11. Create default chart of accounts for accounting module

### Success State

- Registration confirmation displayed
- User redirected to login page with success message
- User can immediately log in
- New tenant appears in system administration (if applicable)
- Default data structures initialized for new tenant

### Failure States and Edge Cases

| Condition | System Response |
|-----------|-----------------|
| Email already exists | Display error: "An account with this email already exists" |
| Weak password | Display validation: password requirements not met |
| Password mismatch | Display error: "Passwords do not match" |
| Tenant slug exists | Auto-modify slug with numeric suffix or prompt user |
| Server error | Display generic error, log details for debugging |
| Network timeout | Display retry option, preserve form data |

---

## User Login Flow

### Entry Points

- Application root URL redirects to login if unauthenticated
- Direct URL: `/login`
- Session expiry redirects to login

### Step-by-Step Flow

1. User navigates to login page
2. User enters tenant slug (organization identifier)
3. User enters email address
4. User enters password
5. User clicks "Sign In"
6. System displays loading state

### System Actions (Behind the Scenes)

1. Validate input format
2. Query user by email within specified tenant
3. Compare provided password with stored hash
4. If valid:
   - Generate JWT token with user claims
   - Set token expiry (typically 24 hours)
   - Create session record
   - Log successful authentication
5. If invalid:
   - Increment failed login counter
   - Log failed attempt
   - Check for account lockout threshold

### Success State

- JWT token stored in client (localStorage/cookie)
- User redirected to Dashboard
- Navigation menu populated based on role permissions
- Recent session activity logged

### Failure States and Edge Cases

| Condition | System Response |
|-----------|-----------------|
| Invalid credentials | Display: "Invalid email or password" |
| Inactive account | Display: "Your account has been deactivated" |
| Wrong tenant | Display: "User not found in this organization" |
| Account locked | Display: "Account locked. Contact administrator" |
| Token generation failure | Log error, display generic message |

---

## Session Management Flow

### Authenticated Session Verification

1. Client includes JWT token in Authorization header
2. Server middleware intercepts request
3. Token signature verified
4. Token expiry checked
5. User record retrieved and attached to request context
6. If valid, request proceeds
7. If invalid, 401 response returned

### Session Expiry Handling

1. Client receives 401 response
2. Client clears stored token
3. User redirected to login page
4. Previous URL stored for post-login redirect
5. User completes login
6. User redirected to original destination

---

# CRM Module Flows

## Lead Creation Flow

### Who Can Perform

- Staff (with CRM access)
- Manager
- Admin
- Owner

### Entry Points

- CRM menu via "Leads"
- Dashboard quick action via "New Lead"
- Pipeline board via "Add Lead" button

### Step-by-Step Flow

1. User navigates to CRM Leads section
2. User clicks "New Lead" button
3. System displays lead creation form
4. User enters required information:
   - Lead name
   - Email address
   - Phone number
5. User enters optional information:
   - Source (Website, Referral, Social Media, Walk-in, Phone, Email)
   - Source platform (specific platform name)
   - Priority (Low, Medium, High)
   - Interested in (tour/service reference)
   - Budget range
   - Travel dates
   - Notes
6. User selects pipeline (if multiple exist)
7. User selects assignee (defaults to self)
8. User clicks "Create Lead"

### System Actions (Behind the Scenes)

1. Validate required fields
2. Check for duplicate leads (same email/phone within tenant)
3. If contact exists, link to existing contact record
4. If new contact, create contact record
5. Assign lead to selected pipeline
6. Set initial stage to first stage of pipeline
7. Set status to "New"
8. Assign lead to selected user
9. Generate lead ID
10. Create audit log entry
11. Trigger notification to assignee (if different from creator)

### Success State

- Lead appears in lead list
- Lead card appears in pipeline board under first stage
- Assignee receives notification (if applicable)
- Lead available for follow-up activities

### Failure States and Edge Cases

| Condition | System Response |
|-----------|-----------------|
| Missing required fields | Highlight fields, display validation errors |
| Duplicate lead detected | Prompt to view existing or create anyway |
| Pipeline not selected | Default to primary pipeline |
| Invalid email format | Display format validation error |

---

## Lead Pipeline Management Flow

### Pipeline Board Navigation

1. User navigates to CRM via "Pipeline" menu
2. System loads default pipeline
3. System displays Kanban board with stage columns
4. Each column contains lead cards sorted by priority/date

### Moving Leads Between Stages

1. User identifies lead card to move
2. User drags lead card to target stage column
3. System displays visual feedback during drag
4. User drops card in new column
5. System updates lead stage

### System Actions (Behind the Scenes)

1. Capture source stage and target stage
2. Update lead record with new stage_id
3. Update lead updated_at timestamp
4. Create activity log entry for stage change
5. If moving to "Won" stage, prompt for conversion
6. If moving to "Lost" stage, prompt for lost reason

### Success State

- Lead card appears in new stage column
- Lead detail reflects updated stage
- Activity history shows stage transition
- Stage metrics updated in real-time

---

## Lead to Booking Conversion Flow

### Who Can Perform

- Staff (with Booking access)
- Manager
- Admin
- Owner

### Entry Points

- Lead detail view via "Convert to Booking" button
- Pipeline board via lead card action menu

### Step-by-Step Flow

1. User opens lead detail view
2. User clicks "Convert to Booking"
3. System displays conversion dialog
4. System pre-populates available information from lead:
   - Guest name (from lead name)
   - Guest email (from lead email)
   - Guest phone (from lead phone)
   - Related resource (if specified in lead)
5. User selects or confirms:
   - Resource (tour/service)
   - Departure date (from available departures)
   - Number of guests
   - Pricing (auto-calculated or manual)
6. User clicks "Create Booking"

### System Actions (Behind the Scenes)

1. Validate booking details
2. Check inventory availability for selected departure
3. Create temporary hold on seats (if inventory managed)
4. Create booking record with status "Pending"
5. Link booking to lead record
6. Update lead status to "Converted" or "Won"
7. Move lead to final pipeline stage
8. Create activity log entry
9. Generate booking number
10. Create payment record with amount due
11. If contact exists, link booking to contact

### Success State

- Booking created and visible in Bookings list
- Lead status updated to "Won/Converted"
- Lead card moves to final pipeline stage
- Seats reserved in departure inventory
- User can proceed with payment processing

### Failure States and Edge Cases

| Condition | System Response |
|-----------|-----------------|
| No inventory available | Display: "Selected departure is fully booked" |
| Resource inactive | Display: "Selected service is not available" |
| Invalid pricing | Require manual price entry |
| Lead already converted | Display: "This lead has already been converted" |

---

## CRM Activity Logging Flow

### Activity Types

- Call
- Email
- Meeting
- Task
- Note
- WhatsApp message

### Step-by-Step Flow

1. User opens lead or contact detail view
2. User navigates to Activity section
3. User clicks "Log Activity"
4. User selects activity type
5. User enters activity details:
   - Subject
   - Description
   - Outcome (if applicable)
   - Scheduled date/time (for future activities)
6. User clicks "Save"

### System Actions (Behind the Scenes)

1. Create activity record
2. Link to lead/contact/booking as applicable
3. Set creator and assignee
4. If scheduled activity, add to task queue
5. Update lead/contact last_activity_at timestamp
6. Create audit log entry

### Success State

- Activity appears in activity timeline
- Scheduled activities appear in task list
- Lead/contact shows updated last activity date

---

# Booking Engine Flows

## Direct Booking Creation Flow

### Who Can Perform

- Staff (with Booking access)
- Manager
- Admin
- Owner

### Entry Points

- Bookings menu via "Create Booking"
- Resource detail via "Book Now"
- Inventory calendar via departure date click

### Step-by-Step Flow

1. User navigates to booking creation
2. User selects resource type (Tour, Activity, Hotel, Transportation)
3. System displays available resources
4. User selects specific resource
5. System displays available departures/dates
6. User selects departure date
7. System displays:
   - Available capacity
   - Pricing information
   - Booking cutoff status
8. User enters guest information:
   - Primary guest name
   - Email address
   - Phone number
   - Number of participants
   - Special requirements (optional)
9. User reviews pricing:
   - Base price per person
   - Number of guests
   - Applicable taxes
   - Discounts (if any)
   - Total amount
10. User selects booking source (Direct, OTA, Manual, etc.)
11. User clicks "Create Booking"

### System Actions (Behind the Scenes)

1. Validate all input fields
2. Re-verify availability (prevent race conditions)
3. Calculate final pricing with taxes
4. Create inventory hold with type "confirmed"
5. Create booking record with status "Pending"
6. Generate unique booking number (format: TRK-YYYY-NNNNN)
7. Set amount_due = total_amount
8. Set amount_paid = 0
9. Link to departure instance
10. Create audit log entry
11. Decrement available inventory count

### Success State

- Booking appears in Bookings list with "Pending" status
- Booking number generated and displayed
- Departure inventory updated
- User prompted for payment processing
- Guest manifest updated for departure

### Failure States and Edge Cases

| Condition | System Response |
|-----------|-----------------|
| Capacity exceeded | Display: "Insufficient availability" |
| Cutoff passed | Display: "Booking deadline has passed" |
| Invalid guest count | Display: "Guest count must be positive" |
| Pricing mismatch | Recalculate and display updated total |

---

## Booking Status Transitions

### Status Flow Diagram

```
DRAFT --> HELD --> PENDING_PAYMENT --> CONFIRMED --> COMPLETED
                         |                 |
                         v                 v
                      EXPIRED          CANCELLED
```

### Status Definitions

| Status | Description | Triggers |
|--------|-------------|----------|
| DRAFT | Initial creation, not yet submitted | Manual creation started |
| HELD | Temporary reservation, awaiting confirmation | Cart addition, admin hold |
| PENDING_PAYMENT | Booking confirmed, payment awaited | Booking submitted |
| CONFIRMED | Payment received, booking active | Payment recorded |
| COMPLETED | Trip/service completed | Departure date passed |
| CANCELLED | Booking cancelled | User or system cancellation |
| EXPIRED | Hold expired without payment | Timeout threshold exceeded |

### Status Transition Rules

| From | To | Condition |
|------|-----|-----------|
| DRAFT | HELD | User proceeds to checkout |
| DRAFT | PENDING_PAYMENT | Direct booking creation |
| HELD | PENDING_PAYMENT | Hold confirmed |
| HELD | EXPIRED | Hold timeout exceeded |
| PENDING_PAYMENT | CONFIRMED | Full payment received |
| PENDING_PAYMENT | CANCELLED | User cancels |
| PENDING_PAYMENT | EXPIRED | Payment deadline exceeded |
| CONFIRMED | COMPLETED | Departure date passed |
| CONFIRMED | CANCELLED | Cancellation processed |

---

## Payment Recording Flow

### Who Can Perform

- Staff (with Finance access)
- Manager
- Admin
- Owner

### Entry Points

- Booking detail via "Record Payment"
- Payment list via "New Payment"
- Booking list via action menu

### Step-by-Step Flow

1. User opens booking detail
2. User clicks "Record Payment"
3. System displays payment form with:
   - Booking reference
   - Total amount due
   - Amount already paid
   - Remaining balance
4. User enters payment details:
   - Payment type (Deposit, Partial, Full, Refund)
   - Payment method (Cash, Card, UPI, Bank Transfer, Gateway)
   - Amount received
   - Receipt number (optional)
   - Notes (optional)
5. If payment gateway:
   - User selects gateway (Razorpay, Stripe)
   - System generates payment link or initiates gateway
6. User clicks "Record Payment"

### System Actions (Behind the Scenes)

1. Validate payment amount
2. Create payment record
3. Update booking amount_paid
4. Calculate new amount_due
5. If amount_due = 0:
   - Update booking status to CONFIRMED
   - Convert temporary hold to permanent
6. If gateway payment:
   - Create gateway order
   - Store gateway reference IDs
   - Generate payment link if applicable
7. Create audit log entry
8. Generate receipt number if not provided

### Success State

- Payment record created
- Booking amounts updated
- If fully paid, booking status = CONFIRMED
- Payment receipt available for download
- Accounting entries created (if integrated)

---

# Inventory Management Flows

## Departure Creation Flow

### Who Can Perform

- Manager
- Admin
- Owner

### Entry Points

- Inventory menu via "Create Departure"
- Resource detail via "Add Departure"
- Calendar view via date click

### Step-by-Step Flow

1. User navigates to Inventory management
2. User clicks "Create Departure"
3. User selects resource (tour/activity)
4. User enters departure details:
   - Departure date
   - Departure time (optional)
   - End date (for multi-day resources)
   - Total capacity
   - Blocked seats (for staff/VIPs)
   - Price override (if different from base)
   - Booking cutoff date/time
   - Minimum participants (for guaranteed departure)
   - Overbooking limit (optional)
5. User clicks "Create"

### System Actions (Behind the Scenes)

1. Validate date is in future
2. Check for conflicting departures (same resource, same date)
3. Calculate sellable capacity (total - blocked)
4. Create departure_instance record
5. Set status to SCHEDULED
6. Set is_guaranteed to false
7. Create audit log entry

### Success State

- Departure appears in inventory calendar
- Departure available for booking
- Capacity displayed correctly
- Status indicators set

---

## Inventory Hold Management

### Hold Types and Durations

| Hold Type | Duration | Use Case |
|-----------|----------|----------|
| Cart Hold | 15 minutes | Customer added to shopping cart |
| Payment Hold | 30 minutes | Customer on payment page |
| Admin Hold | 24 hours | Staff negotiating with customer |
| Group Hold | 7 days | Large group provisional booking |

### Creating an Admin Hold

1. User navigates to departure detail
2. User clicks "Create Hold"
3. User enters:
   - Number of seats
   - Hold duration
   - Customer reference (optional)
   - Notes
4. User clicks "Create Hold"

### System Actions (Behind the Scenes)

1. Verify seats available
2. Create inventory_hold record
3. Set expires_at based on duration
4. Reduce available count
5. Create audit log entry

### Hold Expiry Handling

1. Background job runs every minute
2. Query for holds where expires_at < current_time
3. For each expired hold:
   - Set released_at = current_time
   - Set release_reason = "Expired"
   - Restore seats to available pool
   - Notify hold creator (if configured)

---

# Resource Management Flows

## Resource Creation Flow

### Who Can Perform

- Admin
- Owner

### Entry Points

- Resources menu via "Create Resource"
- Quick action from Dashboard

### Step-by-Step Flow

1. User navigates to Resources
2. User clicks "Create Resource"
3. User enters resource details:
   - Resource type (Tour, Activity, Hotel, Transportation)
   - Name
   - Description
   - Duration (for tours/activities)
   - Base price
   - Currency
   - Default capacity
   - Branch association (optional)
4. User uploads images (optional)
5. User clicks "Create"

### System Actions (Behind the Scenes)

1. Validate required fields
2. Generate resource ID
3. Create resource record
4. Process and store uploaded images
5. Set is_active = true
6. Create audit log entry

### Success State

- Resource appears in resources list
- Resource available for departure creation
- Resource selectable in booking flow

---

## Resource to Departure Relationship

```
Resource (Template)          Departure Instances
+------------------+         +------------------+
| EBC Trek         |-------->| Dec 15, 2024     |
| 14 days          |  1:N    | Dec 22, 2024     |
| Base: 2,400 USD  |         | Jan 5, 2025      |
| Capacity: 40     |         | Jan 12, 2025     |
+------------------+         +------------------+
                                    |
                                    | 1:N
                                    v
                            +------------------+
                            | Booking A        |
                            | Booking B        |
                            | Booking C        |
                            +------------------+
```

---

# HRMS Module Flows

## Employee Onboarding Flow

### Who Can Perform

- HR Staff
- Manager
- Admin
- Owner

### Entry Points

- HRMS menu via "Employees"
- Team view via "Add Employee"

### Step-by-Step Flow

1. User navigates to HRMS Employees
2. User clicks "New Employee"
3. User enters personal information:
   - First name
   - Last name
   - Preferred name (optional)
   - Personal email
   - Phone number
   - Emergency contact
4. User enters employment details:
   - Employee code (auto-generated or custom)
   - Employee type (Full-time, Part-time, Contract, Seasonal)
   - Category (Guide, Driver, Admin, etc.)
   - Department
   - Branch
   - Reporting manager
   - Joining date
   - Probation end date
5. User enters compensation:
   - Pay model (Monthly, Daily, Per-trip)
   - Base salary
   - Allowances
6. User uploads documents:
   - ID proof
   - Certifications
   - Contracts
7. User optionally creates system account
8. User clicks "Save Employee"

### System Actions (Behind the Scenes)

1. Validate required fields
2. Check employee code uniqueness within tenant
3. Create employee record
4. Set lifecycle_stage = "Onboarding"
5. Create employee timeline entry (type: "Hire")
6. If system account requested:
   - Create user record
   - Link user to employee
   - Assign default role (staff)
   - Send welcome email with credentials
7. Initialize leave balances for current year
8. Create audit log entry

### Success State

- Employee appears in team directory
- Employee profile complete
- System account created (if requested)
- Leave balances initialized
- Employee available for trip assignments

---

## Leave Request Flow

### Who Can Perform

- All employees with system access

### Entry Points

- HRMS menu via "Leaves"
- Personal dashboard via "Request Leave"

### Step-by-Step Flow (Employee)

1. User navigates to Leave management
2. User clicks "Request Leave"
3. System displays leave request form
4. User selects leave type:
   - Casual Leave
   - Sick Leave
   - Paid Leave
   - Unpaid Leave
5. User selects date range (from date, to date)
6. System calculates total days
7. System displays current balance for selected type
8. System checks for conflicts:
   - Trip assignments during leave period
   - Other pending leave requests
9. If conflicts exist, user acknowledges or modifies dates
10. User enters reason
11. User uploads supporting documents (if required)
12. User clicks "Submit Request"

### System Actions (Behind the Scenes)

1. Validate dates
2. Calculate working days (excluding weekends/holidays based on policy)
3. Verify sufficient leave balance
4. Create leave_request record with status "Pending"
5. Identify approving manager
6. Send notification to approver
7. Update leave_balance pending count
8. If trip conflict:
   - Flag leave request
   - Notify operations team

### Step-by-Step Flow (Manager Approval)

1. Manager receives notification
2. Manager navigates to Leave Approvals
3. Manager reviews request:
   - Leave type and dates
   - Reason provided
   - Impact on operations
   - Team coverage
4. Manager selects action:
   - Approve
   - Decline (with reason)
   - Request modification
5. Manager clicks confirmation

### System Actions (Approval Behind the Scenes)

1. Update leave_request status
2. If approved:
   - Move days from "pending" to "taken" in balance
   - Create availability blocks for leave dates
   - Send approval notification to employee
   - Update operations calendar
3. If declined:
   - Return days to available balance
   - Send decline notification with reason

### Success State (Approved)

- Leave request shows "Approved" status
- Leave balance updated
- Calendar shows leave dates
- Team calendar reflects absence
- Operations scheduling updated

### Failure States and Edge Cases

| Condition | System Response |
|-----------|-----------------|
| Insufficient balance | Display: "Insufficient leave balance" |
| Past dates selected | Display: "Cannot request leave for past dates" |
| Blackout period | Display: "Leave not permitted during this period" |
| Trip conflict | Warning displayed, requires acknowledgment |

---

## Trip Assignment Flow

### Who Can Perform

- Operations Manager
- Admin
- Owner

### Entry Points

- Departure detail via "Assign Staff"
- HRMS via "Trip Assignments"

### Step-by-Step Flow

1. User opens departure detail
2. User clicks "Assign Staff"
3. System displays required roles based on resource type:
   - Lead Guide
   - Assistant Guide
   - Driver
   - Cook
   - Porter
4. For each role:
   - System shows available employees with required skills
   - System highlights availability status
   - System shows conflict warnings
5. User selects employee for each role
6. User confirms assignments
7. System sends notifications to assigned employees

### System Actions (Behind the Scenes)

1. Verify staff availability for trip dates
2. Check skill requirements match
3. Create trip_assignment records
4. Update employee availability to "Assigned"
5. Calculate estimated compensation based on role rates
6. Send notification to each assigned employee
7. Employee can Accept or Decline

### Assignment Status Flow

```
PROPOSED --> CONFIRMED --> IN_PROGRESS --> COMPLETED
               |
               v
            DECLINED
```

### Success State

- Staff listed on departure manifest
- Employee calendars updated
- Availability blocked for trip dates
- Compensation estimates generated

---

## Attendance Recording Flow

### For Field Staff (Mobile)

1. Staff opens mobile app
2. Staff taps "Check In"
3. GPS captures current location
4. Staff optionally adds photo
5. Staff confirms check-in
6. At end of shift, staff taps "Check Out"
7. System calculates work hours

### System Actions (Behind the Scenes)

1. Record check-in timestamp and location
2. Validate location against assigned work site (if configured)
3. At check-out, calculate total hours
4. Flag if overtime threshold exceeded
5. Create attendance record
6. If on trip, link to trip_id

### For Office Staff (Dashboard)

1. Manager views daily attendance
2. System shows team attendance status
3. Manager can mark absent staff
4. Manager can approve corrections

---

# Vendor Management Flows

## Vendor Onboarding Flow

### Who Can Perform

- Operations Staff
- Finance Staff
- Manager
- Admin
- Owner

### Entry Points

- Vendors menu via "Add Vendor"

### Step-by-Step Flow

1. User navigates to Vendor management
2. User clicks "Add Vendor"
3. User enters vendor information:
   - Legal name
   - Display name
   - Vendor type (Hotel, Transport, Activity, Equipment, etc.)
   - Primary contact (name, phone, email)
   - Address
4. User enters banking details:
   - Bank name
   - Account number
   - Tax ID
5. User uploads documents
6. User clicks "Create Vendor"

### System Actions (Behind the Scenes)

1. Validate required fields
2. Generate vendor code
3. Create vendor record with status "Active"
4. Create audit log entry

### Success State

- Vendor appears in vendor list
- Vendor available for assignments and contracts
- Vendor can be linked to trips and bookings

---

## Vendor Assignment to Trip/Booking

### Step-by-Step Flow

1. User opens departure or booking detail
2. User clicks "Assign Vendor"
3. User selects vendor from list
4. User selects applicable rate (from vendor rates)
5. User enters:
   - Service dates
   - Net amount
   - Notes
6. User clicks "Assign"

### System Actions (Behind the Scenes)

1. Create vendor_assignment record
2. Link to booking or departure
3. Set status = "Pending"
4. Create vendor_payable record
5. Set amount and due date based on terms

### Success State

- Vendor linked to trip/booking
- Payable created in vendor ledger
- Assignment visible in vendor profile

---

## Vendor Payment/Settlement Flow

### Step-by-Step Flow

1. User navigates to Vendor Payables
2. User filters by vendor or date range
3. User selects payables to settle
4. User clicks "Create Settlement"
5. User enters payment details:
   - Payment method
   - Payment reference
   - Payment date
   - Amount
6. User clicks "Record Settlement"

### System Actions (Behind the Scenes)

1. Create vendor_settlement record
2. Update vendor_payable records:
   - Add to amount_settled
   - If fully paid, set status = "Settled"
3. Create accounting journal entries (if integrated)
4. Create audit log entry

### Success State

- Settlement recorded
- Payable statuses updated
- Vendor ledger balanced
- Accounting entries created

---

# Gear Management Flows

## Gear Item Registration Flow

### Who Can Perform

- Operations Staff
- Manager
- Admin
- Owner

### Entry Points

- Gear menu via "Items"
- Inventory via "Add Gear"

### Step-by-Step Flow

1. User navigates to Gear Items
2. User clicks "Add New Gear"
3. User enters item details:
   - Name
   - SKU (auto-generated or custom)
   - Category (Tent, Sleeping Bag, Climbing Gear, etc.)
   - Brand
   - Serial number (if applicable)
   - Ownership type (Owned, Rented, Vendor)
   - Condition (Excellent, Good, Fair, Poor)
   - Warehouse location
   - Purchase date (optional)
   - Purchase cost (optional)
4. User uploads photos
5. User clicks "Save"

### System Actions (Behind the Scenes)

1. Validate required fields
2. Generate SKU if not provided
3. Create gear_item record
4. Create gear_inventory record with status "Available"
5. Link to warehouse
6. Create audit log entry

### Success State

- Gear item appears in inventory
- Item available for assignments
- Inventory counts updated
- Item trackable in system

---

## Gear Assignment to Trip Flow

### Step-by-Step Flow

1. User opens departure detail
2. User navigates to Gear section
3. User clicks "Assign Gear"
4. System displays gear categories and items
5. User selects required items
6. For each item, user specifies:
   - Assignment type (Shared, Guide, Guest)
   - Quantity (if consumable)
7. User clicks "Confirm Assignment"

### System Actions (Behind the Scenes)

1. Verify items available (status = "Available")
2. Create gear_assignment records
3. Update gear_inventory status to "In Use"
4. Link to trip_id
5. If items from different warehouses, flag for transfer

### Success State

- Gear listed on trip manifest
- Item status updated
- Warehouse inventory adjusted
- Items trackable throughout trip

---

## Gear Return and Inspection Flow

### Step-by-Step Flow

1. Trip completes
2. Operations staff reviews gear checklist
3. For each item, staff records:
   - Return status (Returned, Lost, Damaged)
   - Condition after use
   - Notes
4. Staff clicks "Complete Return"

### System Actions (Behind the Scenes)

1. Update gear_assignment records with actual_return_date
2. For returned items:
   - Update gear_inventory status to "Available"
   - Update condition rating
3. For damaged items:
   - Create maintenance request
   - Update status to "Under Maintenance"
4. For lost items:
   - Create incident record
   - Update status to "Lost"
   - Flag for financial impact assessment
5. Return items to warehouse inventory

### Success State

- Gear back in available inventory
- Damaged items in maintenance queue
- Lost items flagged and recorded
- Trip gear manifest closed

---

# Dashboard and Analytics Flows

## Dashboard Access Flow

### Step-by-Step Flow

1. User logs into system
2. System loads role-appropriate dashboard
3. Dashboard displays:
   - KPI widgets based on role
   - Quick action buttons
   - Recent activity feed
   - Upcoming items (departures, tasks)

### Widget Types Available

| Widget Type | Data Source | Refreshes |
|-------------|-------------|-----------|
| Revenue KPI | Booking payments | Real-time |
| Booking Counter | Booking records | Real-time |
| Lead Pipeline | CRM leads | Real-time |
| Departure Calendar | Inventory | Hourly |
| Team Status | HRMS attendance | Real-time |
| Alerts | System events | Real-time |

---

## Custom Dashboard Builder Flow

### Who Can Perform

- Manager
- Admin
- Owner

### Step-by-Step Flow

1. User navigates to Dashboard Builder
2. User clicks "Create New Dashboard"
3. User enters dashboard name
4. User drags widgets from library to canvas
5. User configures each widget:
   - Data source
   - Date range
   - Filters
   - Display options
6. User arranges layout
7. User clicks "Save Dashboard"

### Widget Configuration Options

- KPI Cards: Metric selection, comparison period
- Charts: Chart type, data series, time range
- Tables: Columns, sorting, filters
- Text: Custom content

### Success State

- Dashboard saved and accessible
- Dashboard visible in dashboards list
- Dashboard shareable with team (based on permissions)

---

# Flow Relationships

## End-to-End Customer Journey

```
Lead Capture --> Lead Qualification --> Booking Creation --> Payment Processing --> Trip Execution --> Post-Trip
     |                   |                    |                    |                    |              |
     v                   v                    v                    v                    v              v
  Contact            Pipeline             Resource +           Accounting           Staff +        Feedback
  Created            Movement             Inventory            Entries              Gear           Collection
                                          Update                                    Assignment
```

## Interdependent Flows

| Primary Flow | Triggers | Dependent Flows |
|--------------|----------|-----------------|
| Lead Conversion | Booking Created | Inventory Hold, Payment Initiation |
| Booking Confirmed | Payment Complete | Departure Manifest Update, Staff Assignment Trigger |
| Trip Started | Departure Date | Attendance Tracking, Gear Checkout |
| Trip Completed | End Date | Gear Return, Vendor Settlement, Staff Payroll |
| Employee Leave Approved | Manager Action | Availability Update, Trip Reassignment Check |

## Data Flow Between Modules

```
CRM (Leads)
    |
    v
Booking Engine <---> Inventory Management
    |                        |
    v                        v
Payments             Departure Instances
    |                        |
    v                        v
Accounting <------> HRMS (Trip Assignments)
    ^                        |
    |                        v
    +------- Vendors <----- Gear Management
```

---

# UI State Transitions

## Navigation State Changes

| User Action | Source State | Target State |
|-------------|--------------|--------------|
| Login Success | Login Page | Dashboard |
| Logout | Any Authenticated Page | Login Page |
| Register Complete | Registration | Login Page |
| Create Lead | Lead List | Lead Form |
| Save Lead | Lead Form | Lead Detail |
| Convert Lead | Lead Detail | Booking Form |
| Create Booking | Booking Form | Booking Detail |
| Record Payment | Booking Detail | Payment Confirmation |

## Entity State Transitions

| Entity | Action | Before State | After State |
|--------|--------|--------------|-------------|
| User | Register | N/A | Active |
| User | Deactivate | Active | Inactive |
| Lead | Create | N/A | New |
| Lead | Contact | New | Contacted |
| Lead | Qualify | Contacted | Qualified |
| Lead | Convert | Qualified | Won |
| Booking | Create | N/A | Pending |
| Booking | Pay | Pending | Confirmed |
| Booking | Complete | Confirmed | Completed |
| Booking | Cancel | Any Active | Cancelled |
| Departure | Create | N/A | Scheduled |
| Departure | Open | Scheduled | Open |
| Departure | Sold Out | Open | Full |
| Departure | Start | Any | Departed |
| Gear | Assign | Available | In Use |
| Gear | Return | In Use | Available |
| Gear | Damage | In Use | Maintenance |
| Leave Request | Submit | N/A | Pending |
| Leave Request | Approve | Pending | Approved |
| Leave Request | Decline | Pending | Declined |

---

# Error Handling Strategy

## User-Facing Errors

All errors displayed to users follow these principles:

1. Messages are written in clear, non-technical language
2. Error messages explain what went wrong
3. Where possible, messages suggest corrective action
4. Form validation errors appear inline next to affected fields
5. Critical errors display as prominent alerts

## Error Categories

| Category | Example | User Message Format |
|----------|---------|---------------------|
| Validation | Missing required field | "Please enter [field name]" |
| Business Rule | Insufficient inventory | "Only [X] seats available for this departure" |
| Permission | Unauthorized action | "You do not have permission to [action]" |
| Conflict | Duplicate record | "[Entity] with this [field] already exists" |
| System | Database error | "Something went wrong. Please try again." |

## System Error Handling

1. All exceptions caught and logged with stack trace
2. Error logs include request context (user, tenant, action)
3. Critical failures trigger admin notifications
4. System errors never expose technical details to users
5. Retry logic implemented for transient failures

## Edge Case Strategies

| Scenario | Handling |
|----------|----------|
| Concurrent booking attempts | Optimistic locking with version check |
| Payment timeout | Hold seats with timer, auto-release on expiry |
| Session expiry during form | Save draft, restore after re-authentication |
| Network disconnection | Queue requests, sync when reconnected |
| Browser back button | Warn before losing unsaved changes |

---

# Non-Functional Behaviors

## Security

- All API endpoints require authentication (except login/register)
- Role-based access control enforced at API level
- Passwords hashed using bcrypt with salt
- JWT tokens expire after 24 hours
- Sensitive data encrypted at rest
- All actions logged with user context

## Multi-Tenancy

- All data scoped to tenant_id
- Tenant isolation enforced at query level
- Cross-tenant data access prevented by design
- Tenant-specific configurations supported

## Audit Trail

- All create, update, delete operations logged
- Audit logs include: timestamp, user, action, entity, before/after values
- Audit logs immutable (append-only)
- Logs retained per compliance requirements

## Performance

- API response time target: under 200ms for standard operations
- Pagination implemented for list endpoints
- Database queries optimized with indexes
- Caching implemented for frequently accessed data

## Scalability

- Stateless API design enables horizontal scaling
- Database supports read replicas
- Background jobs processed asynchronously
- File storage offloaded to object storage

---

# Appendix: Glossary

| Term | Definition |
|------|------------|
| Tenant | An organization using the platform; data isolation boundary |
| Branch | Physical or virtual location within a tenant |
| Resource | A bookable product or service (tour, activity, hotel, vehicle) |
| Departure | A specific instance of a resource on a particular date |
| Lead | A potential customer in the sales pipeline |
| Contact | Customer information record |
| Pipeline | A series of stages for tracking lead progression |
| Hold | Temporary reservation of inventory capacity |
| Booking | A confirmed or pending reservation |
| Manifest | List of guests and staff for a departure |
| Payable | Amount owed to a vendor |
| Settlement | Payment made to a vendor |
| SKU | Stock Keeping Unit - unique identifier for gear items |

---

*Document Version: 1.0*  
*Last Updated: December 31, 2024*  
*System: Travel Management System*
