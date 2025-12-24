import { Router, RequestHandler } from 'express';
import { BranchController } from '../controllers/BranchController.js';
import { BranchService } from '../../application/services/BranchService.js';

/**
 * Create branch management routes
 */
export function createBranchRoutes(authMiddleware: RequestHandler): Router {
    const router = Router();
    const branchService = new BranchService();
    const branchController = new BranchController(branchService);

    // All routes require authentication
    router.use(authMiddleware);

    // ========================================================================
    // Branch CRUD
    // ========================================================================
    
    // List all branches
    router.get('/', branchController.list);
    
    // Get branch hierarchy (tree structure)
    router.get('/hierarchy', branchController.getHierarchy);
    
    // Get branch by code
    router.get('/code/:code', branchController.getByCode);
    
    // Create a new branch
    router.post('/', branchController.create);
    
    // Get a single branch by ID
    router.get('/:id', branchController.getById);
    
    // Update a branch
    router.patch('/:id', branchController.update);
    
    // Delete a branch
    router.delete('/:id', branchController.delete);
    
    // Get child branches
    router.get('/:id/children', branchController.getChildren);

    // ========================================================================
    // Branch Permissions
    // ========================================================================
    
    // Get all permissions for a branch
    router.get('/:id/permissions', branchController.getBranchPermissions);
    
    // Grant permission to a user for a branch
    router.post('/:id/permissions', branchController.grantPermission);
    
    // Revoke permission from a user for a branch
    router.delete('/:id/permissions/:userId', branchController.revokePermission);
    
    // Check if current user has access to a branch
    router.get('/:id/access', branchController.checkAccess);

    // ========================================================================
    // User Branch Access
    // ========================================================================
    
    // Get user's branch permissions
    router.get('/user/:userId/permissions', branchController.getUserPermissions);
    
    // Get branches accessible by a user
    router.get('/user/:userId/accessible', branchController.getUserAccessibleBranches);

    // ========================================================================
    // Branch Transfers
    // ========================================================================
    
    // Create a transfer request
    router.post('/transfers', branchController.createTransfer);
    
    // Get a transfer by ID
    router.get('/transfers/:id', branchController.getTransfer);
    
    // Approve a transfer
    router.post('/transfers/:id/approve', branchController.approveTransfer);
    
    // Complete a transfer
    router.post('/transfers/:id/complete', branchController.completeTransfer);
    
    // Cancel a transfer
    router.post('/transfers/:id/cancel', branchController.cancelTransfer);
    
    // Reject a transfer
    router.post('/transfers/:id/reject', branchController.rejectTransfer);
    
    // Get pending transfers for a branch
    router.get('/:id/transfers/pending', branchController.getPendingTransfers);

    return router;
}
