-- migrations/hrms/003_create_leave_tables.sql
-- Leave Management Tables

-- ============================================
-- LEAVE TYPES
-- ============================================
CREATE TABLE hrms.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Leave rules
  is_paid BOOLEAN DEFAULT true,
  max_days_per_year DECIMAL(5,2),
  max_consecutive_days DECIMAL(5,2),
  min_notice_days INTEGER DEFAULT 1,
  
  -- Carry forward
  allow_carry_forward BOOLEAN DEFAULT false,
  max_carry_forward DECIMAL(5,2) DEFAULT 0,
  
  -- Attachments
  requires_attachment BOOLEAN DEFAULT false,
  attachment_after_days INTEGER DEFAULT 3,
  
  -- Applicability
  applicable_to JSONB DEFAULT '[]',  -- Employee categories
  
  -- Blackout periods
  blackout_periods JSONB DEFAULT '[]',  -- [{startDate, endDate, reason}]
  
  -- Accrual rules
  accrual_type VARCHAR(20) DEFAULT 'ANNUAL' CHECK (
    accrual_type IN ('ANNUAL', 'MONTHLY', 'NONE')
  ),
  accrual_rate DECIMAL(5,2),
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_leave_types_tenant ON hrms.leave_types(tenant_id);

-- ============================================
-- LEAVE BALANCES
-- ============================================
CREATE TABLE hrms.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES hrms.employees(id),
  leave_type_id UUID NOT NULL REFERENCES hrms.leave_types(id),
  year INTEGER NOT NULL,
  
  -- Balance components
  opening DECIMAL(5,2) DEFAULT 0,
  accrued DECIMAL(5,2) DEFAULT 0,
  taken DECIMAL(5,2) DEFAULT 0,
  pending DECIMAL(5,2) DEFAULT 0,  -- Approved but not yet taken
  adjusted DECIMAL(5,2) DEFAULT 0,  -- Manual adjustments
  carry_forward DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (tenant_id, employee_id, leave_type_id, year)
);

CREATE INDEX idx_leave_balances_employee ON hrms.leave_balances(employee_id);

-- ============================================
-- LEAVE REQUESTS
-- ============================================
CREATE TABLE hrms.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES hrms.employees(id),
  leave_type_id UUID NOT NULL REFERENCES hrms.leave_types(id),
  
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  total_days DECIMAL(5,2) NOT NULL,
  
  -- Half day
  is_half_day BOOLEAN DEFAULT false,
  half_day_type VARCHAR(10) CHECK (half_day_type IN ('FIRST_HALF', 'SECOND_HALF')),
  
  reason TEXT,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (
    status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REVOKED')
  ),
  
  -- Approval workflow (JSONB array)
  approval_chain JSONB DEFAULT '[]',
  current_approver_index INTEGER DEFAULT 0,
  
  -- Conflicts
  has_conflict BOOLEAN DEFAULT false,
  conflicting_trips JSONB DEFAULT '[]',
  
  -- Replacement
  replacement_employee_id UUID REFERENCES hrms.employees(id),
  replacement_confirmed BOOLEAN DEFAULT false,
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_employee ON hrms.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_dates ON hrms.leave_requests(from_date, to_date);
CREATE INDEX idx_leave_requests_status ON hrms.leave_requests(status);
CREATE INDEX idx_leave_requests_pending ON hrms.leave_requests(tenant_id) WHERE status = 'PENDING';
