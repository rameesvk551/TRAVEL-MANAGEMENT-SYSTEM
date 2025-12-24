-- ============================================================================
-- MULTI-BRANCH SYSTEM ENHANCEMENT
-- ============================================================================
-- This migration enhances the existing branch structure and adds branch_id
-- to core tables to support multi-branch operations

-- ============================================================================
-- 1. ENHANCE BRANCHES TABLE
-- ============================================================================

-- Add new columns to branches table if they don't exist
DO $$ 
BEGIN
    -- Add settings column for branch-specific configurations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'branches' 
                   AND column_name = 'settings') THEN
        ALTER TABLE public.branches ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
    
    -- Add manager_id for branch manager assignment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'branches' 
                   AND column_name = 'manager_id') THEN
        ALTER TABLE public.branches ADD COLUMN manager_id UUID REFERENCES public.users(id);
    END IF;
    
    -- Add currency for branch-specific currency
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'branches' 
                   AND column_name = 'currency') THEN
        ALTER TABLE public.branches ADD COLUMN currency VARCHAR(3) DEFAULT 'INR';
    END IF;
    
    -- Add operating_hours for branch timings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'branches' 
                   AND column_name = 'operating_hours') THEN
        ALTER TABLE public.branches ADD COLUMN operating_hours JSONB DEFAULT '{}';
    END IF;
    
    -- Add description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'branches' 
                   AND column_name = 'description') THEN
        ALTER TABLE public.branches ADD COLUMN description TEXT;
    END IF;
END $$;

-- ============================================================================
-- 2. ADD BRANCH_ID TO USERS TABLE
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'branch_id') THEN
        ALTER TABLE public.users ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
    
    -- Add accessible_branches for users who can access multiple branches
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'accessible_branches') THEN
        ALTER TABLE public.users ADD COLUMN accessible_branches UUID[] DEFAULT ARRAY[]::UUID[];
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_branch ON public.users(branch_id);

-- ============================================================================
-- 3. ADD BRANCH_ID TO RESOURCES TABLE
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'resources' 
                   AND column_name = 'branch_id') THEN
        ALTER TABLE public.resources ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
    
    -- Add accessible_branches for resources available across branches
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'resources' 
                   AND column_name = 'accessible_branches') THEN
        ALTER TABLE public.resources ADD COLUMN accessible_branches UUID[] DEFAULT ARRAY[]::UUID[];
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_resources_branch ON public.resources(branch_id);

-- ============================================================================
-- 4. ADD BRANCH_ID TO LEADS TABLE
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'leads' 
                   AND column_name = 'branch_id') THEN
        ALTER TABLE public.leads ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_branch ON public.leads(branch_id);

-- ============================================================================
-- 5. ADD BRANCH_ID TO BOOKINGS TABLE
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'bookings' 
                   AND column_name = 'branch_id') THEN
        ALTER TABLE public.bookings ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_branch ON public.bookings(branch_id);

-- ============================================================================
-- 6. ADD BRANCH_ID TO DEPARTURE_INSTANCES TABLE
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'departure_instances' 
                   AND column_name = 'branch_id') THEN
        ALTER TABLE public.departure_instances ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_departures_branch ON public.departure_instances(branch_id);

-- ============================================================================
-- 7. ADD BRANCH_ID TO CONTACTS TABLE (CRM)
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contacts' 
                   AND column_name = 'branch_id') THEN
        ALTER TABLE public.contacts ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contacts_branch ON public.contacts(branch_id);

-- ============================================================================
-- 8. ADD BRANCH_ID TO VENDORS TABLE
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'vendors' 
                   AND column_name = 'branch_id') THEN
        ALTER TABLE public.vendors ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
    
    -- Add accessible_branches for vendors working with multiple branches
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'vendors' 
                   AND column_name = 'accessible_branches') THEN
        ALTER TABLE public.vendors ADD COLUMN accessible_branches UUID[] DEFAULT ARRAY[]::UUID[];
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vendors_branch ON public.vendors(branch_id);

-- ============================================================================
-- 9. BRANCH PERMISSIONS TABLE
-- ============================================================================
-- Tracks which users have access to which branches with specific permissions

CREATE TABLE IF NOT EXISTS public.branch_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    
    -- Permission levels
    permission_level VARCHAR(20) NOT NULL DEFAULT 'VIEW' 
        CHECK (permission_level IN ('VIEW', 'EDIT', 'MANAGE', 'ADMIN')),
    
    -- Specific permissions (granular control)
    can_view_leads BOOLEAN DEFAULT true,
    can_edit_leads BOOLEAN DEFAULT false,
    can_view_bookings BOOLEAN DEFAULT true,
    can_edit_bookings BOOLEAN DEFAULT false,
    can_view_inventory BOOLEAN DEFAULT true,
    can_edit_inventory BOOLEAN DEFAULT false,
    can_view_staff BOOLEAN DEFAULT true,
    can_edit_staff BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT true,
    can_view_financials BOOLEAN DEFAULT false,
    
    -- Metadata
    granted_by UUID REFERENCES public.users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_branch_permissions_tenant ON public.branch_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branch_permissions_user ON public.branch_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_branch_permissions_branch ON public.branch_permissions(branch_id);

-- ============================================================================
-- 10. BRANCH TRANSFERS TABLE
-- ============================================================================
-- Track transfers of resources, staff, or inventory between branches

CREATE TABLE IF NOT EXISTS public.branch_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Transfer details
    transfer_type VARCHAR(30) NOT NULL 
        CHECK (transfer_type IN ('EMPLOYEE', 'RESOURCE', 'GEAR', 'INVENTORY', 'LEAD')),
    reference_id UUID NOT NULL, -- ID of the item being transferred
    reference_code VARCHAR(100), -- Human-readable reference
    
    -- Branches
    from_branch_id UUID NOT NULL REFERENCES public.branches(id),
    to_branch_id UUID NOT NULL REFERENCES public.branches(id),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'REJECTED')),
    
    -- Details
    reason TEXT,
    notes TEXT,
    
    -- People involved
    requested_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    completed_by UUID REFERENCES public.users(id),
    
    -- Dates
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    effective_date DATE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branch_transfers_tenant ON public.branch_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branch_transfers_from ON public.branch_transfers(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_transfers_to ON public.branch_transfers(to_branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_transfers_status ON public.branch_transfers(status);

-- ============================================================================
-- 11. BRANCH SETTINGS/CONFIGURATION TABLE
-- ============================================================================
-- For branch-specific configurations that override tenant defaults

CREATE TABLE IF NOT EXISTS public.branch_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    
    -- Settings category
    category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    
    -- Override info
    is_override BOOLEAN DEFAULT true, -- Overrides tenant default
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(branch_id, category, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_branch_settings_branch ON public.branch_settings(branch_id);

-- ============================================================================
-- 12. UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_branch_permissions_updated_at 
    BEFORE UPDATE ON public.branch_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branch_transfers_updated_at 
    BEFORE UPDATE ON public.branch_transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branch_settings_updated_at 
    BEFORE UPDATE ON public.branch_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a user has access to a specific branch
CREATE OR REPLACE FUNCTION user_has_branch_access(
    p_user_id UUID,
    p_branch_id UUID,
    p_permission_level VARCHAR DEFAULT 'VIEW'
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
    v_user_role VARCHAR;
    v_user_branch_id UUID;
BEGIN
    -- Get user's role and primary branch
    SELECT role, branch_id INTO v_user_role, v_user_branch_id
    FROM public.users WHERE id = p_user_id;
    
    -- Owner and admin have access to all branches
    IF v_user_role IN ('owner', 'admin') THEN
        RETURN TRUE;
    END IF;
    
    -- User's primary branch
    IF v_user_branch_id = p_branch_id THEN
        RETURN TRUE;
    END IF;
    
    -- Check accessible_branches array
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_user_id 
        AND p_branch_id = ANY(accessible_branches)
    ) INTO v_has_access;
    
    IF v_has_access THEN
        RETURN TRUE;
    END IF;
    
    -- Check explicit permissions
    SELECT EXISTS (
        SELECT 1 FROM public.branch_permissions
        WHERE user_id = p_user_id 
        AND branch_id = p_branch_id
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND CASE 
            WHEN p_permission_level = 'VIEW' THEN permission_level IN ('VIEW', 'EDIT', 'MANAGE', 'ADMIN')
            WHEN p_permission_level = 'EDIT' THEN permission_level IN ('EDIT', 'MANAGE', 'ADMIN')
            WHEN p_permission_level = 'MANAGE' THEN permission_level IN ('MANAGE', 'ADMIN')
            WHEN p_permission_level = 'ADMIN' THEN permission_level = 'ADMIN'
            ELSE false
        END
    ) INTO v_has_access;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql;

-- Function to get all accessible branch IDs for a user
CREATE OR REPLACE FUNCTION get_user_accessible_branches(p_user_id UUID)
RETURNS UUID[] AS $$
DECLARE
    v_branch_ids UUID[];
    v_user_role VARCHAR;
    v_tenant_id UUID;
BEGIN
    -- Get user info
    SELECT role, tenant_id INTO v_user_role, v_tenant_id
    FROM public.users WHERE id = p_user_id;
    
    -- Owner and admin have access to all branches
    IF v_user_role IN ('owner', 'admin') THEN
        SELECT ARRAY_AGG(id) INTO v_branch_ids
        FROM public.branches WHERE tenant_id = v_tenant_id AND is_active = true;
        RETURN v_branch_ids;
    END IF;
    
    -- Combine primary branch, accessible_branches, and permission-based access
    SELECT ARRAY_AGG(DISTINCT branch_id) INTO v_branch_ids
    FROM (
        -- Primary branch
        SELECT branch_id FROM public.users WHERE id = p_user_id AND branch_id IS NOT NULL
        UNION
        -- Accessible branches array
        SELECT UNNEST(accessible_branches) FROM public.users WHERE id = p_user_id
        UNION
        -- Permission-based access
        SELECT branch_id FROM public.branch_permissions 
        WHERE user_id = p_user_id AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    ) AS branches;
    
    RETURN COALESCE(v_branch_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.branch_permissions IS 'Tracks user access permissions to specific branches';
COMMENT ON TABLE public.branch_transfers IS 'Records transfers of resources, staff, and inventory between branches';
COMMENT ON TABLE public.branch_settings IS 'Branch-specific settings that override tenant defaults';
COMMENT ON FUNCTION user_has_branch_access IS 'Checks if a user has access to a specific branch with given permission level';
COMMENT ON FUNCTION get_user_accessible_branches IS 'Returns array of all branch IDs a user can access';
