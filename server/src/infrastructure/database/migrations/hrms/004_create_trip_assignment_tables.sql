-- migrations/hrms/004_create_trip_assignment_tables.sql
-- Trip Assignment Tables

-- ============================================
-- TRIP ASSIGNMENTS
-- ============================================
CREATE TABLE hrms.trip_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  trip_id UUID NOT NULL,  -- References inventory.trips
  employee_id UUID NOT NULL REFERENCES hrms.employees(id),
  
  -- Role on trip
  role VARCHAR(30) NOT NULL CHECK (
    role IN ('LEAD_GUIDE', 'ASSISTANT_GUIDE', 'PORTER', 'COOK', 'DRIVER', 'PHOTOGRAPHER', 'MEDIC', 'SUPPORT')
  ),
  is_primary BOOLEAN DEFAULT false,
  
  -- Duration
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  
  -- Status workflow
  status VARCHAR(20) NOT NULL DEFAULT 'PROPOSED' CHECK (
    status IN ('PROPOSED', 'CONFIRMED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  ),
  
  -- Confirmation tracking
  confirmed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  declined_reason TEXT,
  
  -- Compensation
  compensation_type VARCHAR(20) NOT NULL DEFAULT 'INCLUDED' CHECK (
    compensation_type IN ('INCLUDED', 'PER_TRIP', 'DAILY', 'CUSTOM')
  ),
  trip_bonus DECIMAL(10,2) DEFAULT 0,
  daily_rate DECIMAL(10,2) DEFAULT 0,
  total_compensation DECIMAL(10,2) DEFAULT 0,
  
  -- Post-trip
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  incident_reports JSONB DEFAULT '[]',
  
  -- Instructions
  special_instructions TEXT,
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trip_assignments_tenant ON hrms.trip_assignments(tenant_id);
CREATE INDEX idx_trip_assignments_trip ON hrms.trip_assignments(trip_id);
CREATE INDEX idx_trip_assignments_employee ON hrms.trip_assignments(employee_id);
CREATE INDEX idx_trip_assignments_dates ON hrms.trip_assignments(start_date, end_date);
CREATE INDEX idx_trip_assignments_status ON hrms.trip_assignments(status);

-- Prevent duplicate primary roles
CREATE UNIQUE INDEX idx_trip_assignments_primary ON hrms.trip_assignments(trip_id, role) 
  WHERE is_primary = true AND status NOT IN ('DECLINED', 'CANCELLED');

-- ============================================
-- TRIP ROLES CONFIGURATION
-- ============================================
CREATE TABLE hrms.trip_role_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  
  trip_type VARCHAR(50) NOT NULL,  -- e.g., 'TREKKING', 'TOUR', 'EXPEDITION'
  
  role VARCHAR(30) NOT NULL,
  min_count INTEGER DEFAULT 1,
  max_count INTEGER,
  
  -- Requirements
  required_skills JSONB DEFAULT '[]',
  min_experience_months INTEGER,
  
  -- Default compensation
  default_compensation_type VARCHAR(20) DEFAULT 'INCLUDED',
  default_bonus DECIMAL(10,2),
  default_daily_rate DECIMAL(10,2),
  
  is_mandatory BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (tenant_id, trip_type, role)
);

CREATE INDEX idx_trip_role_configs_tenant ON hrms.trip_role_configs(tenant_id);
