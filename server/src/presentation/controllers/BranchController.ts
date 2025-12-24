import { Request, Response, NextFunction } from 'express';
import { 
    BranchService, 
    CreateBranchDTO, 
    UpdateBranchDTO, 
    GrantPermissionDTO,
    CreateTransferDTO 
} from '../../application/services/BranchService.js';

/**
 * Branch controller - handles branch management HTTP requests.
 * Supports multi-branch operations including CRUD, permissions, and transfers.
 */
export class BranchController {
    constructor(private branchService: BranchService) {}

    // ========================================================================
    // Branch CRUD
    // ========================================================================

    /**
     * Create a new branch
     * POST /api/branches
     */
    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tenantId = req.context.tenantId;
            const dto = req.body as CreateBranchDTO;
            
            const branch = await this.branchService.createBranch(tenantId, dto);
            
            res.status(201).json({
                success: true,
                data: branch.toJSON(),
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get a single branch by ID
     * GET /api/branches/:id
     */
    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const tenantId = req.context.tenantId;
            const includeStats = req.query.includeStats === 'true';

            let branch;
            if (includeStats) {
                branch = await this.branchService.getBranchWithStats(id, tenantId);
            } else {
                branch = await this.branchService.getBranch(id, tenantId);
            }

            if (!branch) {
                res.status(404).json({
                    success: false,
                    error: 'Branch not found',
                });
                return;
            }

            res.json({
                success: true,
                data: 'toJSON' in branch ? branch.toJSON() : branch,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get branch by code
     * GET /api/branches/code/:code
     */
    getByCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { code } = req.params;
            const tenantId = req.context.tenantId;

            const branch = await this.branchService.getBranchByCode(code, tenantId);

            if (!branch) {
                res.status(404).json({
                    success: false,
                    error: 'Branch not found',
                });
                return;
            }

            res.json({
                success: true,
                data: branch.toJSON(),
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * List all branches with optional filtering
     * GET /api/branches
     */
    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tenantId = req.context.tenantId;
            const {
                type,
                isActive,
                parentBranchId,
                search,
                page,
                pageSize,
                includeStats,
            } = req.query;

            if (includeStats === 'true') {
                const branches = await this.branchService.getAllBranchesWithStats(tenantId);
                res.json({
                    success: true,
                    data: branches,
                    total: branches.length,
                });
                return;
            }

            const result = await this.branchService.listBranches(tenantId, {
                type: type as string,
                isActive: isActive === undefined ? undefined : isActive === 'true',
                parentBranchId: parentBranchId as string,
                search: search as string,
                page: page ? parseInt(page as string, 10) : undefined,
                pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
            });

            res.json({
                success: true,
                data: result.branches.map(b => b.toJSON()),
                pagination: {
                    total: result.total,
                    page: result.page,
                    pageSize: result.pageSize,
                    totalPages: result.totalPages,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update a branch
     * PATCH /api/branches/:id
     */
    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const tenantId = req.context.tenantId;
            const dto = req.body as UpdateBranchDTO;

            const branch = await this.branchService.updateBranch(id, tenantId, dto);

            if (!branch) {
                res.status(404).json({
                    success: false,
                    error: 'Branch not found',
                });
                return;
            }

            res.json({
                success: true,
                data: branch.toJSON(),
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Delete a branch (soft delete by default)
     * DELETE /api/branches/:id
     */
    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const tenantId = req.context.tenantId;
            const hardDelete = req.query.hard === 'true';

            const deleted = await this.branchService.deleteBranch(id, tenantId, hardDelete);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Branch not found',
                });
                return;
            }

            res.json({
                success: true,
                message: 'Branch deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    // ========================================================================
    // Branch Hierarchy
    // ========================================================================

    /**
     * Get branch hierarchy (tree structure)
     * GET /api/branches/hierarchy
     */
    getHierarchy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tenantId = req.context.tenantId;
            const hierarchy = await this.branchService.getBranchHierarchy(tenantId);

            res.json({
                success: true,
                data: hierarchy,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get child branches of a parent branch
     * GET /api/branches/:id/children
     */
    getChildren = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const tenantId = req.context.tenantId;

            const children = await this.branchService.getChildBranches(id, tenantId);

            res.json({
                success: true,
                data: children.map(b => b.toJSON()),
            });
        } catch (error) {
            next(error);
        }
    };

    // ========================================================================
    // Branch Permissions
    // ========================================================================

    /**
     * Grant branch permission to a user
     * POST /api/branches/:id/permissions
     */
    grantPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id: branchId } = req.params;
            const tenantId = req.context.tenantId;
            const grantedById = req.context.userId;
            const dto = { ...req.body, branchId } as GrantPermissionDTO;

            const permission = await this.branchService.grantBranchPermission(
                tenantId,
                grantedById,
                dto
            );

            res.status(201).json({
                success: true,
                data: permission,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Revoke branch permission from a user
     * DELETE /api/branches/:id/permissions/:userId
     */
    revokePermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id: branchId, userId } = req.params;
            const tenantId = req.context.tenantId;

            const revoked = await this.branchService.revokeBranchPermission(
                userId,
                branchId,
                tenantId
            );

            if (!revoked) {
                res.status(404).json({
                    success: false,
                    error: 'Permission not found',
                });
                return;
            }

            res.json({
                success: true,
                message: 'Permission revoked successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all permissions for a branch
     * GET /api/branches/:id/permissions
     */
    getBranchPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id: branchId } = req.params;
            const tenantId = req.context.tenantId;

            const permissions = await this.branchService.getBranchPermissions(branchId, tenantId);

            res.json({
                success: true,
                data: permissions,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get user's branch permissions
     * GET /api/branches/user/:userId/permissions
     */
    getUserPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            const tenantId = req.context.tenantId;

            const permissions = await this.branchService.getUserBranchPermissions(userId, tenantId);

            res.json({
                success: true,
                data: permissions,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get branches accessible by a user
     * GET /api/branches/user/:userId/accessible
     */
    getUserAccessibleBranches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            const tenantId = req.context.tenantId;

            const branchIds = await this.branchService.getUserAccessibleBranches(userId, tenantId);

            res.json({
                success: true,
                data: branchIds,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Check if current user has access to a branch
     * GET /api/branches/:id/access
     */
    checkAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id: branchId } = req.params;
            const userId = req.context.userId;
            const permissionLevel = (req.query.level as string) || 'VIEW';

            const hasAccess = await this.branchService.checkUserBranchAccess(
                userId,
                branchId,
                permissionLevel
            );

            res.json({
                success: true,
                data: { hasAccess },
            });
        } catch (error) {
            next(error);
        }
    };

    // ========================================================================
    // Branch Transfers
    // ========================================================================

    /**
     * Create a transfer request
     * POST /api/branches/transfers
     */
    createTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tenantId = req.context.tenantId;
            const requestedById = req.context.userId;
            const dto = req.body as CreateTransferDTO;

            const transfer = await this.branchService.createTransfer(
                tenantId,
                requestedById,
                dto
            );

            res.status(201).json({
                success: true,
                data: transfer,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get a transfer by ID
     * GET /api/branches/transfers/:id
     */
    getTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const tenantId = req.context.tenantId;

            const transfer = await this.branchService.getTransfer(id, tenantId);

            if (!transfer) {
                res.status(404).json({
                    success: false,
                    error: 'Transfer not found',
                });
                return;
            }

            res.json({
                success: true,
                data: transfer,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Approve a transfer
     * POST /api/branches/transfers/:id/approve
     */
    approveTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const tenantId = req.context.tenantId;
            const approvedById = req.context.userId;

            const transfer = await this.branchService.approveTransfer(id, tenantId, approvedById);

            res.json({
                success: true,
                data: transfer,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Complete a transfer
     * POST /api/branches/transfers/:id/complete
     */
    completeTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const tenantId = req.context.tenantId;
            const completedById = req.context.userId;

            const transfer = await this.branchService.completeTransfer(id, tenantId, completedById);

            res.json({
                success: true,
                data: transfer,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Cancel a transfer
     * POST /api/branches/transfers/:id/cancel
     */
    cancelTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const tenantId = req.context.tenantId;
            const cancelledById = req.context.userId;

            const transfer = await this.branchService.cancelTransfer(id, tenantId, cancelledById);

            res.json({
                success: true,
                data: transfer,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Reject a transfer
     * POST /api/branches/transfers/:id/reject
     */
    rejectTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const tenantId = req.context.tenantId;
            const rejectedById = req.context.userId;

            const transfer = await this.branchService.rejectTransfer(id, tenantId, rejectedById);

            res.json({
                success: true,
                data: transfer,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get pending transfers for a branch
     * GET /api/branches/:id/transfers/pending
     */
    getPendingTransfers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id: branchId } = req.params;
            const tenantId = req.context.tenantId;
            const direction = (req.query.direction as 'from' | 'to' | 'both') || 'both';

            const transfers = await this.branchService.getPendingTransfers(
                branchId,
                tenantId,
                direction
            );

            res.json({
                success: true,
                data: transfers,
            });
        } catch (error) {
            next(error);
        }
    };
}
