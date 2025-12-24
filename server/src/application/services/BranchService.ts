import { BranchRepository, BranchListParams, BranchWithStats } from '../../infrastructure/repositories/BranchRepository.js';
import { 
    Branch, 
    BranchProps, 
    BranchPermission, 
    BranchPermissionProps,
    BranchTransfer,
    BranchTransferProps,
    TransferStatus,
    TransferType 
} from '../../domain/entities/Branch.js';

// ============================================================================
// DTOs
// ============================================================================

export interface CreateBranchDTO {
    name: string;
    code: string;
    type?: 'HEAD_OFFICE' | 'REGIONAL_OFFICE' | 'OFFICE' | 'WAREHOUSE' | 'OPERATIONAL_BASE';
    description?: string;
    address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
    };
    phone?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    parentBranchId?: string;
    managerId?: string;
    currency?: string;
    operatingHours?: Record<string, { open: string; close: string }>;
    settings?: Record<string, unknown>;
}

export interface UpdateBranchDTO extends Partial<CreateBranchDTO> {
    isActive?: boolean;
}

export interface GrantPermissionDTO {
    userId: string;
    branchId: string;
    permissionLevel: 'VIEW' | 'EDIT' | 'MANAGE' | 'ADMIN';
    canViewLeads?: boolean;
    canEditLeads?: boolean;
    canViewBookings?: boolean;
    canEditBookings?: boolean;
    canViewInventory?: boolean;
    canEditInventory?: boolean;
    canViewStaff?: boolean;
    canEditStaff?: boolean;
    canViewReports?: boolean;
    canViewFinancials?: boolean;
    expiresAt?: Date;
}

export interface CreateTransferDTO {
    transferType: TransferType;
    referenceId: string;
    referenceCode?: string;
    fromBranchId: string;
    toBranchId: string;
    reason?: string;
    notes?: string;
    effectiveDate?: Date;
    metadata?: Record<string, unknown>;
}

export interface BranchListResult {
    branches: Branch[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================================================
// Branch Service
// ============================================================================

export class BranchService {
    private branchRepository: BranchRepository;

    constructor() {
        this.branchRepository = new BranchRepository();
    }

    // ========================================================================
    // Branch CRUD
    // ========================================================================

    async createBranch(tenantId: string, dto: CreateBranchDTO): Promise<Branch> {
        // Check if code already exists
        const existing = await this.branchRepository.findByCode(dto.code, tenantId);
        if (existing) {
            throw new Error(`Branch with code '${dto.code}' already exists`);
        }

        // Validate parent branch if provided
        if (dto.parentBranchId) {
            const parent = await this.branchRepository.findById(dto.parentBranchId, tenantId);
            if (!parent) {
                throw new Error('Parent branch not found');
            }
        }

        // Validate manager if provided
        if (dto.managerId) {
            // TODO: Verify manager exists via UserRepository
        }

        const branch = Branch.create({
            tenantId,
            name: dto.name,
            code: dto.code,
            type: dto.type,
            description: dto.description,
            address: dto.address,
            phone: dto.phone,
            email: dto.email,
            latitude: dto.latitude,
            longitude: dto.longitude,
            timezone: dto.timezone,
            parentBranchId: dto.parentBranchId,
            managerId: dto.managerId,
            currency: dto.currency,
            operatingHours: dto.operatingHours,
            settings: dto.settings,
        });

        return this.branchRepository.create(branch);
    }

    async getBranch(id: string, tenantId: string): Promise<Branch | null> {
        return this.branchRepository.findById(id, tenantId);
    }

    async getBranchByCode(code: string, tenantId: string): Promise<Branch | null> {
        return this.branchRepository.findByCode(code, tenantId);
    }

    async getBranchWithStats(id: string, tenantId: string): Promise<BranchWithStats | null> {
        return this.branchRepository.getBranchWithStats(id, tenantId);
    }

    async listBranches(
        tenantId: string,
        options: {
            type?: string;
            isActive?: boolean;
            parentBranchId?: string;
            search?: string;
            page?: number;
            pageSize?: number;
        } = {}
    ): Promise<BranchListResult> {
        const page = options.page ?? 1;
        const pageSize = options.pageSize ?? 50;
        const offset = (page - 1) * pageSize;

        const { branches, total } = await this.branchRepository.findAll({
            tenantId,
            type: options.type as any,
            isActive: options.isActive,
            parentBranchId: options.parentBranchId,
            search: options.search,
            limit: pageSize,
            offset,
        });

        return {
            branches,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async getAllBranchesWithStats(tenantId: string): Promise<BranchWithStats[]> {
        return this.branchRepository.getAllBranchesWithStats(tenantId);
    }

    async updateBranch(id: string, tenantId: string, dto: UpdateBranchDTO): Promise<Branch | null> {
        const branch = await this.branchRepository.findById(id, tenantId);
        if (!branch) {
            throw new Error('Branch not found');
        }

        // Check if code is being changed and if new code already exists
        if (dto.code && dto.code !== branch.code) {
            const existing = await this.branchRepository.findByCode(dto.code, tenantId);
            if (existing) {
                throw new Error(`Branch with code '${dto.code}' already exists`);
            }
        }

        // Prevent setting self as parent
        if (dto.parentBranchId === id) {
            throw new Error('Branch cannot be its own parent');
        }

        // Validate parent branch if provided
        if (dto.parentBranchId) {
            const parent = await this.branchRepository.findById(dto.parentBranchId, tenantId);
            if (!parent) {
                throw new Error('Parent branch not found');
            }
            
            // Prevent circular reference
            const isCircular = await this.checkCircularReference(id, dto.parentBranchId, tenantId);
            if (isCircular) {
                throw new Error('Cannot set parent branch - would create circular reference');
            }
        }

        return this.branchRepository.update(id, tenantId, dto);
    }

    async deleteBranch(id: string, tenantId: string, hardDelete: boolean = false): Promise<boolean> {
        const branch = await this.branchRepository.findById(id, tenantId);
        if (!branch) {
            throw new Error('Branch not found');
        }

        // Check for child branches
        const children = await this.branchRepository.getChildBranches(id, tenantId);
        if (children.length > 0) {
            throw new Error('Cannot delete branch with child branches. Reassign or delete children first.');
        }

        // TODO: Check for associated employees, resources, bookings, etc.

        if (hardDelete) {
            return this.branchRepository.delete(id, tenantId);
        }
        return this.branchRepository.softDelete(id, tenantId);
    }

    // ========================================================================
    // Branch Hierarchy
    // ========================================================================

    async getBranchHierarchy(tenantId: string): Promise<Array<Branch & { children?: Branch[] }>> {
        return this.branchRepository.getBranchHierarchy(tenantId);
    }

    async getChildBranches(parentId: string, tenantId: string): Promise<Branch[]> {
        return this.branchRepository.getChildBranches(parentId, tenantId);
    }

    private async checkCircularReference(
        branchId: string, 
        potentialParentId: string, 
        tenantId: string
    ): Promise<boolean> {
        let currentId = potentialParentId;
        const visited = new Set<string>();

        while (currentId) {
            if (currentId === branchId) return true;
            if (visited.has(currentId)) return true;
            visited.add(currentId);

            const branch = await this.branchRepository.findById(currentId, tenantId);
            if (!branch || !branch.parentBranchId) break;
            currentId = branch.parentBranchId;
        }

        return false;
    }

    // ========================================================================
    // Branch Permissions
    // ========================================================================

    async grantBranchPermission(
        tenantId: string, 
        grantedById: string, 
        dto: GrantPermissionDTO
    ): Promise<BranchPermission> {
        // Verify branch exists
        const branch = await this.branchRepository.findById(dto.branchId, tenantId);
        if (!branch) {
            throw new Error('Branch not found');
        }

        const permission = BranchPermission.create({
            tenantId,
            userId: dto.userId,
            branchId: dto.branchId,
            permissionLevel: dto.permissionLevel,
            canViewLeads: dto.canViewLeads,
            canEditLeads: dto.canEditLeads,
            canViewBookings: dto.canViewBookings,
            canEditBookings: dto.canEditBookings,
            canViewInventory: dto.canViewInventory,
            canEditInventory: dto.canEditInventory,
            canViewStaff: dto.canViewStaff,
            canEditStaff: dto.canEditStaff,
            canViewReports: dto.canViewReports,
            canViewFinancials: dto.canViewFinancials,
            grantedBy: grantedById,
            expiresAt: dto.expiresAt,
        });

        return this.branchRepository.grantBranchPermission(permission);
    }

    async revokeBranchPermission(
        userId: string, 
        branchId: string, 
        tenantId: string
    ): Promise<boolean> {
        return this.branchRepository.revokeBranchPermission(userId, branchId, tenantId);
    }

    async getUserBranchPermissions(userId: string, tenantId: string): Promise<BranchPermission[]> {
        return this.branchRepository.getUserBranchPermissions(userId, tenantId);
    }

    async getBranchPermissions(branchId: string, tenantId: string): Promise<BranchPermission[]> {
        return this.branchRepository.getBranchPermissionsForBranch(branchId, tenantId);
    }

    async getUserAccessibleBranches(userId: string, tenantId: string): Promise<string[]> {
        return this.branchRepository.getUserAccessibleBranches(userId, tenantId);
    }

    async checkUserBranchAccess(
        userId: string, 
        branchId: string, 
        permissionLevel: string = 'VIEW'
    ): Promise<boolean> {
        return this.branchRepository.userHasBranchAccess(userId, branchId, permissionLevel);
    }

    // ========================================================================
    // Branch Transfers
    // ========================================================================

    async createTransfer(
        tenantId: string, 
        requestedById: string, 
        dto: CreateTransferDTO
    ): Promise<BranchTransfer> {
        // Verify branches exist
        const fromBranch = await this.branchRepository.findById(dto.fromBranchId, tenantId);
        if (!fromBranch) {
            throw new Error('Source branch not found');
        }

        const toBranch = await this.branchRepository.findById(dto.toBranchId, tenantId);
        if (!toBranch) {
            throw new Error('Destination branch not found');
        }

        if (dto.fromBranchId === dto.toBranchId) {
            throw new Error('Source and destination branches must be different');
        }

        const transfer = BranchTransfer.create({
            tenantId,
            transferType: dto.transferType,
            referenceId: dto.referenceId,
            referenceCode: dto.referenceCode,
            fromBranchId: dto.fromBranchId,
            toBranchId: dto.toBranchId,
            reason: dto.reason,
            notes: dto.notes,
            effectiveDate: dto.effectiveDate,
            metadata: dto.metadata,
            requestedBy: requestedById,
        });

        return this.branchRepository.createTransfer(transfer);
    }

    async getTransfer(id: string, tenantId: string): Promise<BranchTransfer | null> {
        return this.branchRepository.getTransfer(id, tenantId);
    }

    async approveTransfer(id: string, tenantId: string, approvedById: string): Promise<BranchTransfer | null> {
        const transfer = await this.branchRepository.getTransfer(id, tenantId);
        if (!transfer) {
            throw new Error('Transfer not found');
        }

        if (!transfer.canApprove()) {
            throw new Error(`Cannot approve transfer with status '${transfer.status}'`);
        }

        return this.branchRepository.updateTransferStatus(id, tenantId, 'APPROVED', approvedById);
    }

    async completeTransfer(id: string, tenantId: string, completedById: string): Promise<BranchTransfer | null> {
        const transfer = await this.branchRepository.getTransfer(id, tenantId);
        if (!transfer) {
            throw new Error('Transfer not found');
        }

        if (!transfer.canComplete()) {
            throw new Error(`Cannot complete transfer with status '${transfer.status}'`);
        }

        // TODO: Actually perform the transfer based on transfer type
        // - EMPLOYEE: Update employee's branch_id
        // - RESOURCE: Update resource's branch_id
        // - GEAR: Update gear item's warehouse/branch
        // - INVENTORY: Update departure's branch
        // - LEAD: Update lead's branch_id

        return this.branchRepository.updateTransferStatus(id, tenantId, 'COMPLETED', completedById);
    }

    async cancelTransfer(id: string, tenantId: string, cancelledById: string): Promise<BranchTransfer | null> {
        const transfer = await this.branchRepository.getTransfer(id, tenantId);
        if (!transfer) {
            throw new Error('Transfer not found');
        }

        if (!transfer.canCancel()) {
            throw new Error(`Cannot cancel transfer with status '${transfer.status}'`);
        }

        return this.branchRepository.updateTransferStatus(id, tenantId, 'CANCELLED', cancelledById);
    }

    async rejectTransfer(id: string, tenantId: string, rejectedById: string): Promise<BranchTransfer | null> {
        const transfer = await this.branchRepository.getTransfer(id, tenantId);
        if (!transfer) {
            throw new Error('Transfer not found');
        }

        if (transfer.status !== 'PENDING') {
            throw new Error(`Cannot reject transfer with status '${transfer.status}'`);
        }

        return this.branchRepository.updateTransferStatus(id, tenantId, 'REJECTED', rejectedById);
    }

    async getPendingTransfers(
        branchId: string, 
        tenantId: string, 
        direction: 'from' | 'to' | 'both' = 'both'
    ): Promise<BranchTransfer[]> {
        return this.branchRepository.getPendingTransfers(branchId, tenantId, direction);
    }
}
