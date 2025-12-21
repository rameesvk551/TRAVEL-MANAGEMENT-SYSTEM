-- migrations/hrms/002_create_attendance_tables.sql
-- Attendance Module Tables

-- ============================================
-- ATTENDANCE RECORDS
-- ============================================
CREATE TABLE hrms.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES hrms.employees(id),
  date DATE NOT NULL,
  
  -- Check-in/out records (JSONB for flexibility)
  check_in JSONB,  -- {timestamp, mode, latitude, longitude, locationName, deviceInfo, photoUrl}
  check_out JSONB,
  
  -- Calculated fields
  work_hours DECIMAL(5,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  
  -- Classification
  type VARCHAR(20) NOT NULL CHECK (
    type IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_TRIP', 'REST_DAY', 'WEEKLY_OFF', 'HOLIDAY', 'ON_LEAVE')
  ),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'AUTO_APPROVED', 'APPROVED', 'REJECTED')
  ),
  source VARCHAR(20) NOT NULL DEFAULT 'MOBILE' CHECK (
    source IN ('MOBILE', 'WEB', 'BIOMETRIC', 'MANUAL', 'SYSTEM')
  ),
  
  -- Trip linkage
  trip_id UUID,
  trip_day INTEGER,
  
  -- Override tracking
  is_manual_override BOOLEAN DEFAULT false,
  override_reason TEXT,
  
  -- Approval
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One record per employee per day
  UNIQUE (tenant_id, employee_id, date)
);

-- Indexes
CREATE INDEX idx_attendance_tenant ON hrms.attendance(tenant_id);
CREATE INDEX idx_attendance_employee ON hrms.attendance(employee_id);
CREATE INDEX idx_attendance_date ON hrms.attendance(date DESC);
CREATE INDEX idx_attendance_trip ON hrms.attendance(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_attendance_pending ON hrms.attendance(tenant_id, status) WHERE status = 'PENDING';

-- ============================================
-- ATTENDANCE POLICIES (per tenant/branch)
-- ============================================
CREATE TABLE hrms.attendance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  branch_id UUID REFERENCES public.branches(id),
  
  name VARCHAR(100) NOT NULL,
  
  -- Work timings
  work_start_time TIME NOT NULL DEFAULT '09:00',
  work_end_time TIME NOT NULL DEFAULT '18:00',
  grace_period_minutes INTEGER DEFAULT 15,
  
  -- Half day rules
  half_day_hours DECIMAL(4,2) DEFAULT 4,
  min_hours_for_full_day DECIMAL(4,2) DEFAULT 8,
  
  -- Overtime rules
  overtime_after_hours DECIMAL(4,2) DEFAULT 8,
  max_overtime_hours DECIMAL(4,2) DEFAULT 4,
  
  -- Geo-fencing
  require_location BOOLEAN DEFAULT true,
  allowed_locations JSONB DEFAULT '[]',  -- [{lat, lng, radius, name}]
  
  -- Photo verification
  require_photo BOOLEAN DEFAULT false,
  
  -- Weekly offs
  weekly_offs INTEGER[] DEFAULT ARRAY[0, 6],  -- Sunday, Saturday
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_policies_tenant ON hrms.attendance_policies(tenant_id);

-- ============================================
-- HOLIDAYS
-- ============================================
CREATE TABLE hrms.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  branch_id UUID REFERENCES public.branches(id),  -- NULL = all branches
  
  name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(20) DEFAULT 'NATIONAL' CHECK (
    type IN ('NATIONAL', 'REGIONAL', 'COMPANY', 'OPTIONAL')
  ),
  
  is_optional BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_holidays_tenant ON hrms.holidays(tenant_id);
CREATE INDEX idx_holidays_date ON hrms.holidays(date);
CREATE UNIQUE INDEX idx_holidays_unique ON hrms.holidays(tenant_id, date, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid));
