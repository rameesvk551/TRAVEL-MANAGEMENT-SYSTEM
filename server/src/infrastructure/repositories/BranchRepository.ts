import { query } from '../database/index.js';
import { 
    Branch, 
    BranchProps, 
    BranchType,
    BranchPermission,
    BranchPermissionProps,
    BranchTransfer,
    BranchTransferProps,
    TransferStatus
} from '../../domain/entities/Branch.js';

// ============================================================================
// Type Definitions
// ============================================================================

interface BranchRow {
    id: string;
    tenant_id: string;
    name: string;
    code: string;
    type: BranchType;
    description: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    phone: string | null;
    email: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string;
    parent_branch_id: string | null;
    manager_id: string | null;
    currency: string;
    operating_hours: Record<string, unknown>;
    settings: Record<string, unknown>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

interface BranchPermissionRow {
    id: string;
    tenant_id: string;
    user_id: string;
    branch_id: string;
    permission_level: string;
    can_view_leads: boolean;
    can_edit_leads: boolean;
    can_view_bookings: boolean;
    can_edit_bookings: boolean;
    can_view_inventory: boolean;
    can_edit_inventory: boolean;
    can_view_staff: boolean;
    can_edit_staff: boolean;
    can_view_reports: boolean;
    can_view_financials: boolean;
    granted_by: string | null;
    granted_at: Date;
    expires_at: Date | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

interface BranchTransferRow {
    id: string;
    tenant_id: string;
    transfer_type: string;
    reference_id: string;
    reference_code: string | null;
    from_branch_id: string;
    to_branch_id: string;
    status: TransferStatus;
    reason: string | null;
    notes: string | null;
    requested_by: string | null;
    approved_by: string | null;
    completed_by: string | null;
    requested_at: Date;
    approved_at: Date | null;
    completed_at: Date | null;
    effective_date: Date | null;
    metadata: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

export interface BranchListParams {
    tenantId: string;
    type?: BranchType;
    isActive?: boolean;
    parentBranchId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface BranchWithStats extends Branch {
    employeeCount?: number;
    resourceCount?: number;
    activeBookingsCount?: number;
    monthlyRevenue?: number;
}

// ============================================================================
// Mapper Functions
// ============================================================================

function toBranchEntity(row: BranchRow): Branch {
    return Branch.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        code: row.code,
        type: row.type,
        description: row.description ?? undefined,
        address: {
            line1: row.address_line1 ?? undefined,
            line2: row.address_line2 ?? undefined,
            city: row.city ?? undefined,
            state: row.state ?? undefined,
            country: row.country ?? undefined,
            postalCode: row.postal_code ?? undefined,
        },
        phone: row.phone ?? undefined,
        email: row.email ?? undefined,
        latitude: row.latitude ?? undefined,
        longitude: row.longitude ?? undefined,
        timezone: row.timezone,
        parentBranchId: row.parent_branch_id ?? undefined,
        managerId: row.manager_id ?? undefined,
        currency: row.currency,
        operatingHours: row.operating_hours as any,
        settings: row.settings as any,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

function toBranchPermissionEntity(row: BranchPermissionRow): BranchPermission {
    return BranchPermission.create({
        id: row.id,
        tenantId: row.tenant_id,
        userId: row.user_id,
        branchId: row.branch_id,
        permissionLevel: row.permission_level as any,
        canViewLeads: row.can_view_leads,
        canEditLeads: row.can_edit_leads,
        canViewBookings: row.can_view_bookings,
        canEditBookings: row.can_edit_bookings,
        canViewInventory: row.can_view_inventory,
        canEditInventory: row.can_edit_inventory,
        canViewStaff: row.can_view_staff,
        canEditStaff: row.can_edit_staff,
        canViewReports: row.can_view_reports,
        canViewFinancials: row.can_view_financials,
        grantedBy: row.granted_by ?? undefined,
        grantedAt: row.granted_at,
        expiresAt: row.expires_at ?? undefined,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

function toBranchTransferEntity(row: BranchTransferRow): BranchTransfer {
    return BranchTransfer.create({
        id: row.id,
        tenantId: row.tenant_id,
        transferType: row.transfer_type as any,
        referenceId: row.reference_id,
        referenceCode: row.reference_code ?? undefined,
        fromBranchId: row.from_branch_id,
        toBranchId: row.to_branch_id,
        status: row.status,
        reason: row.reason ?? undefined,
        notes: row.notes ?? undefined,
        requestedBy: row.requested_by ?? undefined,
        approvedBy: row.approved_by ?? undefined,
        completedBy: row.completed_by ?? undefined,
        requestedAt: row.requested_at,
        approvedAt: row.approved_at ?? undefined,
        completedAt: row.completed_at ?? undefined,
        effectiveDate: row.effective_date ?? undefined,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

// ============================================================================
// Branch Repository
// ============================================================================

export class BranchRepository {
    
    // ========================================================================
    // Branch CRUD Operations
    // ========================================================================
    
    async findById(id: string, tenantId: string): Promise<Branch | null> {
        const result = await query<BranchRow>(
            `SELECT * FROM public.branches WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
        return result.rows[0] ? toBranchEntity(result.rows[0]) : null;
    }

    async findByCode(code: string, tenantId: string): Promise<Branch | null> {
        const result = await query<BranchRow>(
            `SELECT * FROM public.branches WHERE code = $1 AND tenant_id = $2`,
            [code.toUpperCase(), tenantId]
        );
        return result.rows[0] ? toBranchEntity(result.rows[0]) : null;
    }

    async findAll(params: BranchListParams): Promise<{ branches: Branch[]; total: number }> {
        const conditions: string[] = ['tenant_id = $1'];
        const values: unknown[] = [params.tenantId];
        let paramIndex = 2;

        if (params.type) {
            conditions.push(`type = $${paramIndex++}`);
            values.push(params.type);
        }

        if (params.isActive !== undefined) {
            conditions.push(`is_active = $${paramIndex++}`);
            values.push(params.isActive);
        }

        if (params.parentBranchId) {
            conditions.push(`parent_branch_id = $${paramIndex++}`);
            values.push(params.parentBranchId);
        }

        if (params.search) {
            conditions.push(`(name ILIKE $${paramIndex} OR code ILIKE $${paramIndex} OR city ILIKE $${paramIndex})`);
            values.push(`%${params.search}%`);
            paramIndex++;
        }

        const whereClause = conditions.join(' AND ');
        
        // Get total count
        const countResult = await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM public.branches WHERE ${whereClause}`,
            values
        );
        const total = parseInt(countResult.rows[0].count, 10);

        // Get paginated results
        let queryStr = `SELECT * FROM public.branches WHERE ${whereClause} ORDER BY 
            CASE WHEN type = 'HEAD_OFFICE' THEN 0 
                 WHEN type = 'REGIONAL_OFFICE' THEN 1 
                 ELSE 2 
            END, name ASC`;

        if (params.limit) {
            queryStr += ` LIMIT $${paramIndex++}`;
            values.push(params.limit);
        }
        if (params.offset) {
            queryStr += ` OFFSET $${paramIndex++}`;
            values.push(params.offset);
        }

        const result = await query<BranchRow>(queryStr, values);
        return {
            branches: result.rows.map(toBranchEntity),
            total,
        };
    }

    async create(branch: Branch): Promise<Branch> {
        const result = await query<BranchRow>(
            `INSERT INTO public.branches (
                id, tenant_id, name, code, type, description,
                address_line1, address_line2, city, state, country, postal_code,
                phone, email, latitude, longitude, timezone,
                parent_branch_id, manager_id, currency, operating_hours, settings,
                is_active, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22,
                $23, $24, $25
            ) RETURNING *`,
            [
                branch.id,
                branch.tenantId,
                branch.name,
                branch.code,
                branch.type,
                branch.description,
                branch.address.line1,
                branch.address.line2,
                branch.address.city,
                branch.address.state,
                branch.address.country,
                branch.address.postalCode,
                branch.phone,
                branch.email,
                branch.latitude,
                branch.longitude,
                branch.timezone,
                branch.parentBranchId,
                branch.managerId,
                branch.currency,
                JSON.stringify(branch.operatingHours),
                JSON.stringify(branch.settings),
                branch.isActive,
                branch.createdAt,
                branch.updatedAt,
            ]
        );
        return toBranchEntity(result.rows[0]);
    }

    async update(id: string, tenantId: string, updates: Partial<BranchProps>): Promise<Branch | null> {
        const setClauses: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        const fieldMap: Record<string, string> = {
            name: 'name',
            code: 'code',
            type: 'type',
            description: 'description',
            phone: 'phone',
            email: 'email',
            latitude: 'latitude',
            longitude: 'longitude',
            timezone: 'timezone',
            parentBranchId: 'parent_branch_id',
            managerId: 'manager_id',
            currency: 'currency',
            isActive: 'is_active',
        };

        for (const [key, column] of Object.entries(fieldMap)) {
            if (key in updates && updates[key as keyof BranchProps] !== undefined) {
                setClauses.push(`${column} = $${paramIndex++}`);
                values.push(updates[key as keyof BranchProps]);
            }
        }

        // Handle address fields
        if (updates.address) {
            if (updates.address.line1 !== undefined) {
                setClauses.push(`address_line1 = $${paramIndex++}`);
                values.push(updates.address.line1);
            }
            if (updates.address.line2 !== undefined) {
                setClauses.push(`address_line2 = $${paramIndex++}`);
                values.push(updates.address.line2);
            }
            if (updates.address.city !== undefined) {
                setClauses.push(`city = $${paramIndex++}`);
                values.push(updates.address.city);
            }
            if (updates.address.state !== undefined) {
                setClauses.push(`state = $${paramIndex++}`);
                values.push(updates.address.state);
            }
            if (updates.address.country !== undefined) {
                setClauses.push(`country = $${paramIndex++}`);
                values.push(updates.address.country);
            }
            if (updates.address.postalCode !== undefined) {
                setClauses.push(`postal_code = $${paramIndex++}`);
                values.push(updates.address.postalCode);
            }
        }

        // Handle JSON fields
        if (updates.operatingHours !== undefined) {
            setClauses.push(`operating_hours = $${paramIndex++}`);
            values.push(JSON.stringify(updates.operatingHours));
        }
        if (updates.settings !== undefined) {
            setClauses.push(`settings = $${paramIndex++}`);
            values.push(JSON.stringify(updates.settings));
        }

        if (setClauses.length === 0) {
            return this.findById(id, tenantId);
        }

        setClauses.push('updated_at = NOW()');
        values.push(id, tenantId);

        const result = await query<BranchRow>(
            `UPDATE public.branches SET ${setClauses.join(', ')} 
             WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex} 
             RETURNING *`,
            values
        );

        return result.rows[0] ? toBranchEntity(result.rows[0]) : null;
    }

    async delete(id: string, tenantId: string): Promise<boolean> {
        const result = await query(
            `DELETE FROM public.branches WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async softDelete(id: string, tenantId: string): Promise<boolean> {
        const result = await query(
            `UPDATE public.branches SET is_active = false, updated_at = NOW() 
             WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    // ========================================================================
    // Branch Statistics
    // ========================================================================

    async getBranchWithStats(id: string, tenantId: string): Promise<BranchWithStats | null> {
        const branch = await this.findById(id, tenantId);
        if (!branch) return null;

        const stats = await query<{
            employee_count: string;
            resource_count: string;
            active_bookings: string;
            monthly_revenue: string;
        }>(
            `SELECT 
                (SELECT COUNT(*) FROM hrms.employees WHERE branch_id = $1 AND is_active = true) as employee_count,
                (SELECT COUNT(*) FROM public.resources WHERE branch_id = $1 AND is_active = true) as resource_count,
                (SELECT COUNT(*) FROM public.bookings WHERE branch_id = $1 AND status IN ('confirmed', 'pending')) as active_bookings,
                (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings 
                 WHERE branch_id = $1 AND status = 'confirmed' 
                 AND created_at >= date_trunc('month', CURRENT_DATE)) as monthly_revenue`,
            [id]
        );

        return {
            ...branch,
            employeeCount: parseInt(stats.rows[0]?.employee_count ?? '0', 10),
            resourceCount: parseInt(stats.rows[0]?.resource_count ?? '0', 10),
            activeBookingsCount: parseInt(stats.rows[0]?.active_bookings ?? '0', 10),
            monthlyRevenue: parseFloat(stats.rows[0]?.monthly_revenue ?? '0'),
        } as BranchWithStats;
    }

    async getAllBranchesWithStats(tenantId: string): Promise<BranchWithStats[]> {
        const result = await query<BranchRow & {
            employee_count: string;
            resource_count: string;
            active_bookings: string;
        }>(
            `SELECT b.*,
                (SELECT COUNT(*) FROM hrms.employees e WHERE e.branch_id = b.id AND e.is_active = true) as employee_count,
                (SELECT COUNT(*) FROM public.resources r WHERE r.branch_id = b.id AND r.is_active = true) as resource_count,
                (SELECT COUNT(*) FROM public.bookings bk WHERE bk.branch_id = b.id AND bk.status IN ('confirmed', 'pending')) as active_bookings
             FROM public.branches b
             WHERE b.tenant_id = $1 AND b.is_active = true
             ORDER BY b.type, b.name`,
            [tenantId]
        );

        return result.rows.map(row => ({
            ...toBranchEntity(row),
            employeeCount: parseInt(row.employee_count, 10),
            resourceCount: parseInt(row.resource_count, 10),
            activeBookingsCount: parseInt(row.active_bookings, 10),
        })) as BranchWithStats[];
    }

    // ========================================================================
    // Branch Hierarchy
    // ========================================================================

    async getChildBranches(parentId: string, tenantId: string): Promise<Branch[]> {
        const result = await query<BranchRow>(
            `SELECT * FROM public.branches 
             WHERE parent_branch_id = $1 AND tenant_id = $2 AND is_active = true
             ORDER BY name`,
            [parentId, tenantId]
        );
        return result.rows.map(toBranchEntity);
    }

    async getBranchHierarchy(tenantId: string): Promise<Array<Branch & { children?: Branch[] }>> {
        const result = await query<BranchRow>(
            `SELECT * FROM public.branches 
             WHERE tenant_id = $1 AND is_active = true
             ORDER BY CASE WHEN parent_branch_id IS NULL THEN 0 ELSE 1 END, name`,
            [tenantId]
        );

        const branches = result.rows.map(toBranchEntity);
        const branchMap = new Map<string, Branch & { children: Branch[] }>();
        const rootBranches: Array<Branch & { children: Branch[] }> = [];

        // Create map and initialize children arrays
        for (const branch of branches) {
            branchMap.set(branch.id, { ...branch, children: [] });
        }

        // Build hierarchy
        for (const branch of branches) {
            const branchWithChildren = branchMap.get(branch.id)!;
            if (branch.parentBranchId && branchMap.has(branch.parentBranchId)) {
                branchMap.get(branch.parentBranchId)!.children.push(branchWithChildren);
            } else {
                rootBranches.push(branchWithChildren);
            }
        }

        return rootBranches;
    }

    // ========================================================================
    // Branch Permissions
    // ========================================================================

    async getUserBranchPermissions(userId: string, tenantId: string): Promise<BranchPermission[]> {
        const result = await query<BranchPermissionRow>(
            `SELECT * FROM public.branch_permissions 
             WHERE user_id = $1 AND tenant_id = $2 AND is_active = true
             AND (expires_at IS NULL OR expires_at > NOW())`,
            [userId, tenantId]
        );
        return result.rows.map(toBranchPermissionEntity);
    }

    async getBranchPermissionsForBranch(branchId: string, tenantId: string): Promise<BranchPermission[]> {
        const result = await query<BranchPermissionRow>(
            `SELECT * FROM public.branch_permissions 
             WHERE branch_id = $1 AND tenant_id = $2 AND is_active = true`,
            [branchId, tenantId]
        );
        return result.rows.map(toBranchPermissionEntity);
    }

    async grantBranchPermission(permission: BranchPermission): Promise<BranchPermission> {
        const result = await query<BranchPermissionRow>(
            `INSERT INTO public.branch_permissions (
                id, tenant_id, user_id, branch_id, permission_level,
                can_view_leads, can_edit_leads, can_view_bookings, can_edit_bookings,
                can_view_inventory, can_edit_inventory, can_view_staff, can_edit_staff,
                can_view_reports, can_view_financials,
                granted_by, granted_at, expires_at, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (user_id, branch_id) DO UPDATE SET
                permission_level = EXCLUDED.permission_level,
                can_view_leads = EXCLUDED.can_view_leads,
                can_edit_leads = EXCLUDED.can_edit_leads,
                can_view_bookings = EXCLUDED.can_view_bookings,
                can_edit_bookings = EXCLUDED.can_edit_bookings,
                can_view_inventory = EXCLUDED.can_view_inventory,
                can_edit_inventory = EXCLUDED.can_edit_inventory,
                can_view_staff = EXCLUDED.can_view_staff,
                can_edit_staff = EXCLUDED.can_edit_staff,
                can_view_reports = EXCLUDED.can_view_reports,
                can_view_financials = EXCLUDED.can_view_financials,
                granted_by = EXCLUDED.granted_by,
                expires_at = EXCLUDED.expires_at,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
            RETURNING *`,
            [
                permission.id,
                permission.tenantId,
                permission.userId,
                permission.branchId,
                permission.permissionLevel,
                permission.canViewLeads,
                permission.canEditLeads,
                permission.canViewBookings,
                permission.canEditBookings,
                permission.canViewInventory,
                permission.canEditInventory,
                permission.canViewStaff,
                permission.canEditStaff,
                permission.canViewReports,
                permission.canViewFinancials,
                permission.grantedBy,
                permission.grantedAt,
                permission.expiresAt,
                permission.isActive,
            ]
        );
        return toBranchPermissionEntity(result.rows[0]);
    }

    async revokeBranchPermission(userId: string, branchId: string, tenantId: string): Promise<boolean> {
        const result = await query(
            `UPDATE public.branch_permissions SET is_active = false, updated_at = NOW()
             WHERE user_id = $1 AND branch_id = $2 AND tenant_id = $3`,
            [userId, branchId, tenantId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async getUserAccessibleBranches(userId: string, tenantId: string): Promise<string[]> {
        const result = await query<{ branch_ids: string[] }>(
            `SELECT get_user_accessible_branches($1) as branch_ids`,
            [userId]
        );
        return result.rows[0]?.branch_ids ?? [];
    }

    async userHasBranchAccess(userId: string, branchId: string, permissionLevel: string = 'VIEW'): Promise<boolean> {
        const result = await query<{ has_access: boolean }>(
            `SELECT user_has_branch_access($1, $2, $3) as has_access`,
            [userId, branchId, permissionLevel]
        );
        return result.rows[0]?.has_access ?? false;
    }

    // ========================================================================
    // Branch Transfers
    // ========================================================================

    async createTransfer(transfer: BranchTransfer): Promise<BranchTransfer> {
        const result = await query<BranchTransferRow>(
            `INSERT INTO public.branch_transfers (
                id, tenant_id, transfer_type, reference_id, reference_code,
                from_branch_id, to_branch_id, status, reason, notes,
                requested_by, requested_at, effective_date, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`,
            [
                transfer.id,
                transfer.tenantId,
                transfer.transferType,
                transfer.referenceId,
                transfer.referenceCode,
                transfer.fromBranchId,
                transfer.toBranchId,
                transfer.status,
                transfer.reason,
                transfer.notes,
                transfer.requestedBy,
                transfer.requestedAt,
                transfer.effectiveDate,
                JSON.stringify(transfer.metadata),
            ]
        );
        return toBranchTransferEntity(result.rows[0]);
    }

    async getTransfer(id: string, tenantId: string): Promise<BranchTransfer | null> {
        const result = await query<BranchTransferRow>(
            `SELECT * FROM public.branch_transfers WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );
        return result.rows[0] ? toBranchTransferEntity(result.rows[0]) : null;
    }

    async updateTransferStatus(
        id: string, 
        tenantId: string, 
        status: TransferStatus, 
        userId: string
    ): Promise<BranchTransfer | null> {
        const updates: string[] = [`status = $1`];
        const values: unknown[] = [status];
        let paramIndex = 2;

        if (status === 'APPROVED') {
            updates.push(`approved_by = $${paramIndex++}`, `approved_at = NOW()`);
            values.push(userId);
        } else if (status === 'COMPLETED') {
            updates.push(`completed_by = $${paramIndex++}`, `completed_at = NOW()`);
            values.push(userId);
        }

        updates.push('updated_at = NOW()');
        values.push(id, tenantId);

        const result = await query<BranchTransferRow>(
            `UPDATE public.branch_transfers SET ${updates.join(', ')} 
             WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
             RETURNING *`,
            values
        );

        return result.rows[0] ? toBranchTransferEntity(result.rows[0]) : null;
    }

    async getPendingTransfers(branchId: string, tenantId: string, direction: 'from' | 'to' | 'both' = 'both'): Promise<BranchTransfer[]> {
        let whereClause = 'tenant_id = $1 AND status IN ($2, $3)';
        const values: unknown[] = [tenantId, 'PENDING', 'APPROVED'];
        
        if (direction === 'from') {
            whereClause += ' AND from_branch_id = $4';
            values.push(branchId);
        } else if (direction === 'to') {
            whereClause += ' AND to_branch_id = $4';
            values.push(branchId);
        } else {
            whereClause += ' AND (from_branch_id = $4 OR to_branch_id = $4)';
            values.push(branchId);
        }

        const result = await query<BranchTransferRow>(
            `SELECT * FROM public.branch_transfers WHERE ${whereClause} ORDER BY requested_at DESC`,
            values
        );
        return result.rows.map(toBranchTransferEntity);
    }
}
