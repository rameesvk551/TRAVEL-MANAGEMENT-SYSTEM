-- Migration: 008_growth_phase2_tables.sql
-- Creates tables for Availability Calendar, Expense Claims, and Schedule Management

-- =======================================
-- AVAILABILITY CALENDAR TABLES
-- =======================================

CREATE TABLE IF NOT EXISTS hrms.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    employee_id UUID NOT NULL REFERENCES hrms.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'UNAVAILABLE', 'BLOCKED', 'ON_LEAVE', 'ON_TRIP', 'TENTATIVE')),
    block_reason VARCHAR(20) CHECK (block_reason IN ('PERSONAL', 'TRAINING', 'MEDICAL', 'OTHER')),
    notes TEXT,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    source_type VARCHAR(20) CHECK (source_type IN ('LEAVE', 'TRIP', 'SCHEDULE', 'MANUAL')),
    source_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_availability_tenant ON hrms.availability(tenant_id);
CREATE INDEX IF NOT EXISTS idx_availability_employee ON hrms.availability(employee_id);
CREATE INDEX IF NOT EXISTS idx_availability_date ON hrms.availability(date);
CREATE INDEX IF NOT EXISTS idx_availability_status ON hrms.availability(status);
CREATE INDEX IF NOT EXISTS idx_availability_source ON hrms.availability(source_type, source_id);

-- =======================================
-- EXPENSE CLAIMS TABLES
-- =======================================

CREATE TABLE IF NOT EXISTS hrms.expense_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    employee_id UUID NOT NULL REFERENCES hrms.employees(id) ON DELETE CASCADE,
    claim_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    trip_id UUID,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_comments TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_comments TEXT,
    rejected_by UUID REFERENCES users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(100),
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS hrms.expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES hrms.expense_claims(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('TRANSPORT', 'ACCOMMODATION', 'MEALS', 'COMMUNICATION', 'EQUIPMENT', 'FUEL', 'TOLLS', 'PARKING', 'ENTERTAINMENT', 'SUPPLIES', 'OTHER')),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    date DATE NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'COMPANY_CARD', 'PERSONAL_CARD', 'BANK_TRANSFER', 'OTHER')),
    receipt_url TEXT,
    receipt_file_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_claims_tenant ON hrms.expense_claims(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_employee ON hrms.expense_claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_status ON hrms.expense_claims(status);
CREATE INDEX IF NOT EXISTS idx_expense_claims_trip ON hrms.expense_claims(trip_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_claim ON hrms.expense_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_category ON hrms.expense_items(category);

-- =======================================
-- SCHEDULE MANAGEMENT TABLES
-- =======================================

-- Shift definitions
CREATE TABLE IF NOT EXISTS hrms.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'SPLIT', 'FLEXIBLE')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 60, -- in minutes
    work_hours DECIMAL(4, 2) NOT NULL,
    is_overnight BOOLEAN DEFAULT FALSE,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- Work patterns (weekly templates)
CREATE TABLE IF NOT EXISTS hrms.work_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    pattern JSONB NOT NULL, -- Array of WeeklyPattern objects
    is_rotating BOOLEAN DEFAULT FALSE,
    rotation_weeks INTEGER DEFAULT 1,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roster (schedule for a period)
CREATE TABLE IF NOT EXISTS hrms.rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    branch_id UUID,
    department_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL
);

-- Roster entries (individual schedule assignments)
CREATE TABLE IF NOT EXISTS hrms.roster_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    roster_id UUID REFERENCES hrms.rosters(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hrms.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_id UUID NOT NULL REFERENCES hrms.shifts(id),
    actual_start_time TIME,
    actual_end_time TIME,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'WORKED', 'ABSENT', 'PARTIAL', 'SWAPPED', 'CANCELLED')),
    swapped_with UUID REFERENCES hrms.roster_entries(id),
    swap_approved_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date, shift_id)
);

-- Shift swap requests
CREATE TABLE IF NOT EXISTS hrms.shift_swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    requester_id UUID NOT NULL REFERENCES hrms.employees(id),
    requester_roster_entry_id UUID NOT NULL REFERENCES hrms.roster_entries(id),
    target_employee_id UUID NOT NULL REFERENCES hrms.employees(id),
    target_roster_entry_id UUID NOT NULL REFERENCES hrms.roster_entries(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON hrms.shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_type ON hrms.shifts(type);
CREATE INDEX IF NOT EXISTS idx_work_patterns_tenant ON hrms.work_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rosters_tenant ON hrms.rosters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rosters_dates ON hrms.rosters(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rosters_status ON hrms.rosters(status);
CREATE INDEX IF NOT EXISTS idx_roster_entries_tenant ON hrms.roster_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roster_entries_employee ON hrms.roster_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_roster_entries_date ON hrms.roster_entries(date);
CREATE INDEX IF NOT EXISTS idx_roster_entries_roster ON hrms.roster_entries(roster_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_tenant ON hrms.shift_swap_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_status ON hrms.shift_swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requester ON hrms.shift_swap_requests(requester_id);

-- =======================================
-- Insert default shift templates
-- =======================================
INSERT INTO hrms.shifts (tenant_id, name, code, type, start_time, end_time, break_duration, work_hours, is_overnight, color)
SELECT 
    t.id,
    'Morning Shift',
    'MORNING',
    'MORNING',
    '06:00',
    '14:00',
    60,
    7,
    FALSE,
    '#22C55E'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM hrms.shifts WHERE tenant_id = t.id AND code = 'MORNING');

INSERT INTO hrms.shifts (tenant_id, name, code, type, start_time, end_time, break_duration, work_hours, is_overnight, color)
SELECT 
    t.id,
    'Afternoon Shift',
    'AFTERNOON',
    'AFTERNOON',
    '14:00',
    '22:00',
    60,
    7,
    FALSE,
    '#F59E0B'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM hrms.shifts WHERE tenant_id = t.id AND code = 'AFTERNOON');

INSERT INTO hrms.shifts (tenant_id, name, code, type, start_time, end_time, break_duration, work_hours, is_overnight, color)
SELECT 
    t.id,
    'Night Shift',
    'NIGHT',
    'NIGHT',
    '22:00',
    '06:00',
    60,
    7,
    TRUE,
    '#8B5CF6'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM hrms.shifts WHERE tenant_id = t.id AND code = 'NIGHT');

INSERT INTO hrms.shifts (tenant_id, name, code, type, start_time, end_time, break_duration, work_hours, is_overnight, color)
SELECT 
    t.id,
    'Regular Day',
    'REGULAR',
    'MORNING',
    '08:00',
    '17:00',
    60,
    8,
    FALSE,
    '#3B82F6'
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM hrms.shifts WHERE tenant_id = t.id AND code = 'REGULAR');

-- Default work pattern (5 days work, 2 days off)
INSERT INTO hrms.work_patterns (tenant_id, name, description, pattern, is_default)
SELECT 
    t.id,
    'Standard Work Week',
    '5 working days (Mon-Fri) with weekends off',
    '[
        {"dayOfWeek": "MONDAY", "isWorkingDay": true},
        {"dayOfWeek": "TUESDAY", "isWorkingDay": true},
        {"dayOfWeek": "WEDNESDAY", "isWorkingDay": true},
        {"dayOfWeek": "THURSDAY", "isWorkingDay": true},
        {"dayOfWeek": "FRIDAY", "isWorkingDay": true},
        {"dayOfWeek": "SATURDAY", "isWorkingDay": false},
        {"dayOfWeek": "SUNDAY", "isWorkingDay": false}
    ]'::jsonb,
    TRUE
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM hrms.work_patterns WHERE tenant_id = t.id AND name = 'Standard Work Week');
