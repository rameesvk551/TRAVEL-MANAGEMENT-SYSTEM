import { 
    Branch as BranchEntity, 
    BranchProps, 
    BranchType,
    BranchPermission as BranchPermissionEntity,
    BranchPermissionProps,
    BranchTransfer as BranchTransferEntity,
    BranchTransferProps,
    TransferStatus
} from '../../domain/entities/Branch.js';
import { Branch as BranchModel } from '../database/sequelize/models/Branch.js';
import { BranchPermission as BranchPermissionModel } from '../database/sequelize/models/BranchPermission.js';
import { BranchTransfer as BranchTransferModel } from '../database/sequelize/models/BranchTransfer.js';
import { Op, Sequelize } from 'sequelize';

export interface BranchListParams {
    tenantId: string;
    type?: BranchType;
    isActive?: boolean;
    parentBranchId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface BranchWithStats extends BranchEntity {
    employeeCount?: number;
    resourceCount?: number;
    activeBookingsCount?: number;
    monthlyRevenue?: number;
}

export class BranchRepository {
    private toBranchEntity(model: BranchModel): BranchEntity {
        return BranchEntity.fromPersistence({
            id: model.id,
            tenantId: model.tenant_id,
            name: model.name,
            code: model.code,
            type: model.type as BranchType,
            description: model.description,
            address: {
                line1: model.address_line1,
                line2: model.address_line2,
                city: model.city,
                state: model.state,
                country: model.country,
                postalCode: model.postal_code,
            },
            phone: model.phone,
            email: model.email,
            latitude: model.latitude ? Number(model.latitude) : undefined,
            longitude: model.longitude ? Number(model.longitude) : undefined,
            timezone: model.timezone || 'UTC',
            parentBranchId: model.parent_branch_id,
            managerId: model.manager_id,
            currency: model.currency || 'USD',
            operatingHours: model.operating_hours as any,
            settings: model.settings as any,
            isActive: model.is_active,
            createdAt: model.created_at,
            updatedAt: model.updated_at,
        });
    }

    private toBranchPermissionEntity(model: BranchPermissionModel): BranchPermissionEntity {
        return BranchPermissionEntity.create({
            id: model.id,
            tenantId: model.tenant_id,
            userId: model.user_id,
            branchId: model.branch_id,
            permissionLevel: model.permission_level as any,
            canViewLeads: model.can_view_leads,
            canEditLeads: model.can_edit_leads,
            canViewBookings: model.can_view_bookings,
            canEditBookings: model.can_edit_bookings,
            canViewInventory: model.can_view_inventory,
            canEditInventory: model.can_edit_inventory,
            canViewStaff: model.can_view_staff,
            canEditStaff: model.can_edit_staff,
            canViewReports: model.can_view_reports,
            canViewFinancials: model.can_view_financials,
            grantedBy: model.granted_by,
            grantedAt: model.granted_at,
            expiresAt: model.expires_at,
            isActive: model.is_active,
            createdAt: model.created_at,
            updatedAt: model.updated_at,
        });
    }

    private toBranchTransferEntity(model: BranchTransferModel): BranchTransferEntity {
        return BranchTransferEntity.create({
            id: model.id,
            tenantId: model.tenant_id,
            transfer_type: model.transfer_type as any,
            referenceId: model.reference_id,
            referenceCode: model.reference_code,
            fromBranchId: model.from_branch_id,
            toBranchId: model.to_branch_id,
            status: model.status as TransferStatus,
            reason: model.reason,
            notes: model.notes,
            requestedBy: model.requested_by,
            approvedBy: model.approved_by,
            completedBy: model.completed_by,
            requestedAt: model.requested_at,
            approvedAt: model.approved_at,
            completedAt: model.completed_at,
            effectiveDate: model.effective_date,
            metadata: model.metadata || {},
            createdAt: model.created_at,
            updatedAt: model.updated_at,
        });
    }

    async findById(id: string, tenantId: string): Promise<BranchEntity | null> {
        const model = await BranchModel.findOne({
            where: { id, tenant_id: tenantId }
        });
        return model ? this.toBranchEntity(model) : null;
    }

    async findByCode(code: string, tenantId: string): Promise<BranchEntity | null> {
        const model = await BranchModel.findOne({
            where: { code: code.toUpperCase(), tenant_id: tenantId }
        });
        return model ? this.toBranchEntity(model) : null;
    }

    async findAll(params: BranchListParams): Promise<{ branches: BranchEntity[]; total: number }> {
        const where: any = { tenant_id: params.tenantId };

        if (params.type) where.type = params.type;
        if (params.isActive !== undefined) where.is_active = params.isActive;
        if (params.parentBranchId) where.parent_branch_id = params.parentBranchId;
        if (params.search) {
            where[Op.or] = [
                { name: { [Op.iLike]: '%'+params.search+'%' } },
                { code: { [Op.iLike]: '%'+params.search+'%' } },
                { city: { [Op.iLike]: '%'+params.search+'%' } }
            ];
        }

        const { count, rows } = await BranchModel.findAndCountAll({
            where,
            limit: params.limit,
            offset: params.offset,
            order: [
                [Sequelize.literal("CASE WHEN type = 'HEAD_OFFICE' THEN 0 WHEN type = 'REGIONAL_OFFICE' THEN 1 ELSE 2 END"), 'ASC'],
                ['name', 'ASC']
            ]
        });

        return {
            branches: rows.map(r => this.toBranchEntity(r)),
            total: count,
        };
    }

    async create(branch: BranchEntity): Promise<BranchEntity> {
        const model = await BranchModel.create({
            id: branch.id,
            tenant_id: branch.tenantId,
            name: branch.name,
            code: branch.code,
            type: branch.type,
            description: branch.description,
            address_line1: branch.address.line1,
            address_line2: branch.address.line2,
            city: branch.address.city,
            state: branch.address.state,
            country: branch.address.country,
            postal_code: branch.address.postalCode,
            phone: branch.phone,
            email: branch.email,
            latitude: branch.latitude,
            longitude: branch.longitude,
            timezone: branch.timezone,
            parent_branch_id: branch.parentBranchId,
            manager_id: branch.managerId,
            currency: branch.currency,
            operating_hours: branch.operatingHours as any,
            settings: branch.settings as any,
            is_active: branch.isActive,
        });
        return this.toBranchEntity(model);
    }

    async update(id: string, tenantId: string, updates: Partial<BranchProps>): Promise<BranchEntity | null> {
        const updateData: any = {};

        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.code !== undefined) updateData.code = updates.code;
        if (updates.type !== undefined) updateData.type = updates.type;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.phone !== undefined) updateData.phone = updates.phone;
        if (updates.email !== undefined) updateData.email = updates.email;
        if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
        if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
        if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
        if (updates.parentBranchId !== undefined) updateData.parent_branch_id = updates.parentBranchId;
        if (updates.managerId !== undefined) updateData.manager_id = updates.managerId;
        if (updates.currency !== undefined) updateData.currency = updates.currency;
        if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

        if (updates.address) {
            if (updates.address.line1 !== undefined) updateData.address_line1 = updates.address.line1;
            if (updates.address.line2 !== undefined) updateData.address_line2 = updates.address.line2;
            if (updates.address.city !== undefined) updateData.city = updates.address.city;
            if (updates.address.state !== undefined) updateData.state = updates.address.state;
            if (updates.address.country !== undefined) updateData.country = updates.address.country;
            if (updates.address.postalCode !== undefined) updateData.postal_code = updates.address.postalCode;
        }

        if (updates.operatingHours !== undefined) updateData.operating_hours = updates.operatingHours;
        if (updates.settings !== undefined) updateData.settings = updates.settings;

        const [affectedCount] = await BranchModel.update(updateData, {
            where: { id, tenant_id: tenantId }
        });

        if (affectedCount === 0) return null;
        return this.findById(id, tenantId);
    }

    async delete(id: string, tenantId: string): Promise<boolean> {
        const affectedCount = await BranchModel.destroy({
            where: { id, tenant_id: tenantId }
        });
        return affectedCount > 0;
    }

    async softDelete(id: string, tenantId: string): Promise<boolean> {
        const [affectedCount] = await BranchModel.update(
            { is_active: false },
            { where: { id, tenant_id: tenantId } }
        );
        return affectedCount > 0;
    }

    async getBranchWithStats(id: string, tenantId: string): Promise<BranchWithStats | null> {
        const branch = await this.findById(id, tenantId);
        if (!branch) return null;

        const stats: any = await BranchModel.sequelize!.query(
            "SELECT (SELECT COUNT(*) FROM hrms.employees WHERE branch_id = :id AND is_active = true) as employee_count, (SELECT COUNT(*) FROM public.resources WHERE branch_id = :id AND is_active = true) as resource_count, (SELECT COUNT(*) FROM public.bookings WHERE branch_id = :id AND status IN ('confirmed', 'pending')) as active_bookings, (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE branch_id = :id AND status = 'confirmed' AND created_at >= date_trunc('month', CURRENT_DATE)) as monthly_revenue",
            {
                replacements: { id },
                type: 'SELECT'
            }
        );

        return {
            ...branch,
            employeeCount: parseInt(stats[0]?.employee_count ?? '0', 10),
            resourceCount: parseInt(stats[0]?.resource_count ?? '0', 10),
            activeBookingsCount: parseInt(stats[0]?.active_bookings ?? '0', 10),
            monthlyRevenue: parseFloat(stats[0]?.monthly_revenue ?? '0'),
        } as BranchWithStats;
    }

    async getAllBranchesWithStats(tenantId: string): Promise<BranchWithStats[]> {
        const branches = await BranchModel.findAll({
            where: { tenant_id: tenantId, is_active: true },
            order: [['type', 'ASC'], ['name', 'ASC']]
        });

        const results: BranchWithStats[] = [];
        for (const branch of branches) {
            const stats = await this.getBranchWithStats(branch.id, tenantId);
            if (stats) results.push(stats);
        }
        return results;
    }

    async getChildBranches(parentId: string, tenantId: string): Promise<BranchEntity[]> {
        const models = await BranchModel.findAll({
            where: { parent_branch_id: parentId, tenant_id: tenantId, is_active: true },
            order: [['name', 'ASC']]
        });
        return models.map(m => this.toBranchEntity(m));
    }

    async getBranchHierarchy(tenantId: string): Promise<Array<BranchEntity & { children?: BranchEntity[] }>> {
        const models = await BranchModel.findAll({
            where: { tenant_id: tenantId, is_active: true },
            order: [
                [Sequelize.literal("CASE WHEN parent_branch_id IS NULL THEN 0 ELSE 1 END"), 'ASC'],
                ['name', 'ASC']
            ]
        });

        const branches = models.map(m => this.toBranchEntity(m));
        const branchMap = new Map<string, BranchEntity & { children: BranchEntity[] }>();
        const rootBranches: Array<BranchEntity & { children: BranchEntity[] }> = [];

        for (const branch of branches) {
            branchMap.set(branch.id, { ...branch, children: [] });
        }

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

    async getUserBranchPermissions(userId: string, tenantId: string): Promise<BranchPermissionEntity[]> {
        const models = await BranchPermissionModel.findAll({
            where: {
                user_id: userId,
                tenant_id: tenantId,
                is_active: true,
                [Op.or]: [
                    { expires_at: null },
                    { expires_at: { [Op.gt]: new Date() } }
                ]
            }
        });
        return models.map(m => this.toBranchPermissionEntity(m));
    }

    async getBranchPermissionsForBranch(branchId: string, tenantId: string): Promise<BranchPermissionEntity[]> {
        const models = await BranchPermissionModel.findAll({
            where: { branch_id: branchId, tenant_id: tenantId, is_active: true }
        });
        return models.map(m => this.toBranchPermissionEntity(m));
    }

    async grantBranchPermission(permission: BranchPermissionEntity): Promise<BranchPermissionEntity> {
        const [model, created] = await BranchPermissionModel.upsert({
            id: permission.id,
            tenant_id: permission.tenantId,
            user_id: permission.userId,
            branch_id: permission.branchId,
            permission_level: permission.permissionLevel,
            can_view_leads: permission.canViewLeads,
            can_edit_leads: permission.canEditLeads,
            can_view_bookings: permission.canViewBookings,
            can_edit_bookings: permission.canEditBookings,
            can_view_inventory: permission.canViewInventory,
            can_edit_inventory: permission.canEditInventory,
            can_view_staff: permission.canViewStaff,
            can_edit_staff: permission.canEditStaff,
            can_view_reports: permission.canViewReports,
            can_view_financials: permission.canViewFinancials,
            granted_by: permission.grantedBy,
            granted_at: permission.grantedAt,
            expires_at: permission.expiresAt,
            is_active: permission.isActive,
        });
        return this.toBranchPermissionEntity(model);
    }

    async revokeBranchPermission(userId: string, branchId: string, tenantId: string): Promise<boolean> {
        const [affectedCount] = await BranchPermissionModel.update(
            { is_active: false },
            { where: { user_id: userId, branch_id: branchId, tenant_id: tenantId } }
        );
        return affectedCount > 0;
    }

    async getUserAccessibleBranches(userId: string, tenantId: string): Promise<string[]> {
        const result: any = await BranchModel.sequelize!.query(
            "SELECT get_user_accessible_branches(:userId) as branch_ids",
            {
                replacements: { userId },
                type: 'SELECT'
            }
        );
        return result[0]?.branch_ids ?? [];
    }

    async userHasBranchAccess(userId: string, branchId: string, permissionLevel: string = 'VIEW'): Promise<boolean> {
        const result: any = await BranchModel.sequelize!.query(
            "SELECT user_has_branch_access(:userId, :branchId, :permissionLevel) as has_access",
            {
                replacements: { userId, branchId, permissionLevel },
                type: 'SELECT'
            }
        );
        return result[0]?.has_access ?? false;
    }

    async createTransfer(transfer: BranchTransferEntity): Promise<BranchTransferEntity> {
        const model = await BranchTransferModel.create({
            id: transfer.id,
            tenant_id: transfer.tenantId,
            transfer_type: transfer.transferType,
            reference_id: transfer.referenceId,
            reference_code: transfer.referenceCode,
            from_branch_id: transfer.fromBranchId,
            to_branch_id: transfer.toBranchId,
            status: transfer.status,
            reason: transfer.reason,
            notes: transfer.notes,
            requested_by: transfer.requestedBy,
            requested_at: transfer.requestedAt,
            effective_date: transfer.effectiveDate,
            metadata: transfer.metadata,
        });
        return this.toBranchTransferEntity(model);
    }

    async getTransfer(id: string, tenantId: string): Promise<BranchTransferEntity | null> {
        const model = await BranchTransferModel.findOne({
            where: { id, tenant_id: tenantId }
        });
        return model ? this.toBranchTransferEntity(model) : null;
    }

    async updateTransferStatus(
        id: string, 
        tenantId: string, 
        status: TransferStatus, 
        userId: string
    ): Promise<BranchTransferEntity | null> {
        const updateData: any = { status };

        if (status === 'APPROVED') {
            updateData.approved_by = userId;
            updateData.approved_at = new Date();
        } else if (status === 'COMPLETED') {
            updateData.completed_by = userId;
            updateData.completed_at = new Date();
        }

        const [affectedCount] = await BranchTransferModel.update(updateData, {
            where: { id, tenant_id: tenantId }
        });

        if (affectedCount === 0) return null;
        return this.getTransfer(id, tenantId);
    }

    async getPendingTransfers(branchId: string, tenantId: string, direction: 'from' | 'to' | 'both' = 'both'): Promise<BranchTransferEntity[]> {
        const where: any = {
            tenant_id: tenantId,
            status: { [Op.in]: ['PENDING', 'APPROVED'] }
        };

        if (direction === 'from') {
            where.from_branch_id = branchId;
        } else if (direction === 'to') {
            where.to_branch_id = branchId;
        } else {
            where[Op.or] = [
                { from_branch_id: branchId },
                { to_branch_id: branchId }
            ];
        }

        const models = await BranchTransferModel.findAll({
            where,
            order: [['requested_at', 'DESC']]
        });
        return models.map(m => this.toBranchTransferEntity(m));
    }
}
