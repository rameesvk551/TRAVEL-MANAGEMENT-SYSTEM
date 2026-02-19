/**
 * Lead module routes.
 */

import { Router } from 'express';
import { LeadController } from './lead.controller.js';

export function createLeadRoutes(dependencies: {
    leadController: LeadController;
    authMiddleware: (req: any, res: any, next: any) => void;
    tenantMiddleware: (req: any, res: any, next: any) => void;
}): Router {
    const router = Router();
    const { leadController, authMiddleware, tenantMiddleware } = dependencies;

    // All lead routes require authentication
    router.use(authMiddleware);
    router.use(tenantMiddleware);

    // ============================================
    // LEAD CRUD
    // ============================================

    router.get('/', leadController.getLeads);
    router.get('/stats', leadController.getStats);
    router.get('/phone/:phone', leadController.getLeadByPhone);
    router.get('/:id', leadController.getLead);
    router.post('/', leadController.createLead);
    router.put('/:id', leadController.updateLead);
    router.delete('/:id', leadController.deleteLead);

    // ============================================
    // STATUS & ASSIGNMENT
    // ============================================

    router.put('/:id/status', leadController.updateStatus);
    router.put('/:id/assign', leadController.assignLead);

    // ============================================
    // TAGS
    // ============================================

    router.post('/:id/tags', leadController.addTag);
    router.delete('/:id/tags', leadController.removeTag);

    // ============================================
    // ACTIVITIES
    // ============================================

    router.get('/:id/activities', leadController.getActivities);

    // ============================================
    // BULK OPERATIONS
    // ============================================

    router.post('/bulk/status', leadController.bulkUpdateStatus);
    router.post('/bulk/assign', leadController.bulkAssign);
    router.post('/bulk/tags', leadController.bulkAddTag);

    return router;
}
