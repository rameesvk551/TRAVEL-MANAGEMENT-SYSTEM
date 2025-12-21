-- migrations/hrms/005_create_payroll_tables.sql
-- Payroll Module Tables

-- ============================================
-- PAY STRUCTURES
-- ============================================
CREATE TABLE hrms.pay_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES hrms.employees(id),
  
  -- Pay model
  pay_model VARCHAR(20) NOT NULL CHECK (
    pay_model IN ('MONTHLY', 'DAILY', 'PER_TRIP', 'MIXED')
  ),
  currency VARCHAR(3) NOT NULL DEFAULT 'NPR',
  
  -- Base amounts
  basic_salary DECIMAL(12,2) DEFAULT 0,
  daily_rate DECIMAL(10,2) DEFAULT 0,
  per_trip_rate DECIMAL(10,2) DEFAULT 0,
  
  -- Allowances (JSONB array)
  allowances JSONB DEFAULT '[]',  -- [{id, name, amount, isProrated}]
  
  -- Deductions (JSONB array)
  deductions JSONB DEFAULT '[]',  -- [{id, name, amount, isStatutory}]
  
  -- Validity
  effective_from DATE NOT NULL,
  effective_to DATE,
  
  -- Bank details
  bank_details JSONB,  -- {bankName, accountNumber, ifscCode, accountName}
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (tenant_id, employee_id, effective_from)
);

CREATE INDEX idx_pay_structures_employee ON hrms.pay_structures(employee_id);
CREATE INDEX idx_pay_structures_effective ON hrms.pay_structures(effective_from DESC);

-- ============================================
-- PAYROLL (Monthly payslips)
-- ============================================
CREATE TABLE hrms.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES hrms.employees(id),
  
  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Earnings (JSONB arrays)
  earnings JSONB NOT NULL DEFAULT '[]',     -- [{id, name, amount, isFixed}]
  deductions JSONB NOT NULL DEFAULT '[]',   -- [{id, name, amount, isStatutory}]
  trip_bonuses JSONB NOT NULL DEFAULT '[]', -- [{tripId, tripName, amount}]
  reimbursements JSONB NOT NULL DEFAULT '[]', -- [{description, amount}]
  
  -- Totals
  gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'NPR',
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (
    status IN ('DRAFT', 'PENDING', 'APPROVED', 'PAID', 'VOID')
  ),
  
  -- Payment
  payment_method VARCHAR(20),
  payment_reference VARCHAR(100),
  payment_date DATE,
  
  -- Processing
  processed_by UUID,
  paid_by UUID,
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (tenant_id, employee_id, year, month)
);

CREATE INDEX idx_payroll_employee ON hrms.payroll(employee_id);
CREATE INDEX idx_payroll_period ON hrms.payroll(year DESC, month DESC);
CREATE INDEX idx_payroll_status ON hrms.payroll(status);

-- ============================================
-- SALARY ADVANCES
-- ============================================
CREATE TABLE hrms.salary_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES hrms.employees(id),
  
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NPR',
  reason TEXT,
  
  -- Repayment
  repayment_months INTEGER DEFAULT 1,
  monthly_deduction DECIMAL(10,2),
  total_repaid DECIMAL(10,2) DEFAULT 0,
  
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'REPAYING', 'COMPLETED')
  ),
  
  -- Approval
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  disbursed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_salary_advances_employee ON hrms.salary_advances(employee_id);

-- ============================================
-- TAX SLABS (for income tax calculation)
-- ============================================
CREATE TABLE hrms.tax_slabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  
  fiscal_year VARCHAR(10) NOT NULL,  -- e.g., '2080/81'
  
  from_amount DECIMAL(12,2) NOT NULL,
  to_amount DECIMAL(12,2),
  rate_percentage DECIMAL(5,2) NOT NULL,
  
  -- Applicability
  marital_status VARCHAR(20),  -- SINGLE, MARRIED, etc.
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tax_slabs_tenant ON hrms.tax_slabs(tenant_id, fiscal_year);
