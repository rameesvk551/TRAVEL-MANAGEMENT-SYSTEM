-- migrations/hrms/001_create_hrms_schema.sql
-- HRMS Module Database Schema

-- Create HRMS schema
CREATE SCHEMA IF NOT EXISTS hrms;

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE hrms.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_code VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  preferred_name VARCHAR(100),
  
  -- Classification
  type VARCHAR(20) NOT NULL CHECK (type IN ('FULL_TIME', 'PART_TIME', 'SEASONAL', 'CONTRACT', 'INTERN')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('OFFICE_STAFF', 'FIELD_STAFF', 'MANAGEMENT', 'SEASONAL', 'CONTRACT')),
  
  -- Organization
  branch_id UUID REFERENCES public.branches(id),
  department_id UUID,
  reporting_to UUID REFERENCES hrms.employees(id),
  cost_center_id UUID,
  
  -- Dates
  joining_date DATE NOT NULL,
  probation_end_date DATE,
  confirmation_date DATE,
  
  -- Status
  lifecycle_stage VARCHAR(20) NOT NULL DEFAULT 'PRE_HIRE' CHECK (
    lifecycle_stage IN ('PRE_HIRE', 'ONBOARDING', 'ACTIVE', 'ON_LEAVE', 'NOTICE_PERIOD', 'RESIGNED', 'TERMINATED', 'ARCHIVED')
  ),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Contact (JSONB)
  contact JSONB NOT NULL DEFAULT '{}',
  emergency_contacts JSONB NOT NULL DEFAULT '[]',
  
  -- Flexible attributes
  attributes JSONB NOT NULL DEFAULT '{}',
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE (tenant_id, employee_code)
);

-- Indexes
CREATE INDEX idx_employees_tenant ON hrms.employees(tenant_id);
CREATE INDEX idx_employees_branch ON hrms.employees(branch_id);
CREATE INDEX idx_employees_reporting_to ON hrms.employees(reporting_to);
CREATE INDEX idx_employees_lifecycle ON hrms.employees(lifecycle_stage);
CREATE INDEX idx_employees_category ON hrms.employees(category);
CREATE INDEX idx_employees_active ON hrms.employees(tenant_id, is_active) WHERE deleted_at IS NULL;

-- ============================================
-- EMPLOYEE TIMELINE (Audit Trail)
-- ============================================
CREATE TABLE hrms.employee_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES hrms.employees(id),
  
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(30) NOT NULL CHECK (
    event_category IN ('LIFECYCLE', 'PROFILE', 'ASSIGNMENT', 'COMPENSATION', 'DOCUMENT', 'PERFORMANCE', 'SYSTEM')
  ),
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Change tracking
  previous_value JSONB,
  new_value JSONB,
  
  -- Context
  triggered_by UUID,
  triggered_by_name VARCHAR(100),
  source VARCHAR(20) DEFAULT 'MANUAL',
  
  -- Visibility
  is_private BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_employee ON hrms.employee_timeline(employee_id);
CREATE INDEX idx_timeline_tenant ON hrms.employee_timeline(tenant_id);
CREATE INDEX idx_timeline_date ON hrms.employee_timeline(created_at DESC);

-- ============================================
-- SKILLS
-- ============================================
CREATE TABLE hrms.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE hrms.employee_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES hrms.employees(id),
  skill_id UUID NOT NULL REFERENCES hrms.skills(id),
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
  certified_at DATE,
  expires_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, skill_id)
);

CREATE INDEX idx_employee_skills_employee ON hrms.employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill ON hrms.employee_skills(skill_id);

-- ============================================
-- DOCUMENTS
-- ============================================
CREATE TABLE hrms.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES hrms.employees(id),
  
  type VARCHAR(30) NOT NULL CHECK (
    type IN ('ID_PROOF', 'ADDRESS_PROOF', 'EDUCATION', 'EXPERIENCE', 'CERTIFICATE', 'LICENSE', 'CONTRACT', 'OTHER')
  ),
  
  name VARCHAR(200) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  
  -- Validity
  issued_date DATE,
  expiry_date DATE,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  
  -- Visibility
  is_confidential BOOLEAN DEFAULT false,
  
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_employee ON hrms.documents(employee_id);
CREATE INDEX idx_documents_expiry ON hrms.documents(expiry_date) WHERE expiry_date IS NOT NULL;
