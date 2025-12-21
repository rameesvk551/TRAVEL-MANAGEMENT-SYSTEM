-- migrations/005_hrms_prerequisites.sql
-- Prerequisites for HRMS Module (branches, cost_centers, etc.)

-- ============================================
-- BRANCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  type VARCHAR(30) DEFAULT 'OFFICE' CHECK (type IN ('HEAD_OFFICE', 'REGIONAL_OFFICE', 'OFFICE', 'WAREHOUSE', 'OPERATIONAL_BASE')),
  
  -- Address
  address_line1 VARCHAR(200),
  address_line2 VARCHAR(200),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  postal_code VARCHAR(20),
  
  -- Contact
  phone VARCHAR(30),
  email VARCHAR(100),
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  
  -- Hierarchy
  parent_branch_id UUID REFERENCES public.branches(id),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_branches_tenant ON public.branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON public.branches(tenant_id, is_active);

-- ============================================
-- COST CENTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT,
  
  -- Budget
  budget_amount DECIMAL(15, 2),
  budget_period VARCHAR(20) DEFAULT 'ANNUAL',
  
  -- Hierarchy
  parent_id UUID REFERENCES public.cost_centers(id),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_cost_centers_tenant ON public.cost_centers(tenant_id);

-- ============================================
-- DEPARTMENTS TABLE (in hrms schema)
-- ============================================
CREATE SCHEMA IF NOT EXISTS hrms;

CREATE TABLE IF NOT EXISTS hrms.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT,
  
  -- Hierarchy
  parent_id UUID REFERENCES hrms.departments(id),
  head_employee_id UUID, -- Will reference hrms.employees
  
  -- Budget
  budget_amount DECIMAL(15, 2),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_tenant ON hrms.departments(tenant_id);
