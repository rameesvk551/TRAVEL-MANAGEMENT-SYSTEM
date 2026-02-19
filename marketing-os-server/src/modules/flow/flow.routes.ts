/**
 * Flow module routes.
 */

import { Router } from 'express';
import { FlowController } from './flow.controller.js';

export function createFlowRoutes(dependencies: {
    flowController: FlowController;
    authMiddleware: (req: any, res: any, next: any) => void;
    tenantMiddleware: (req: any, res: any, next: any) => void;
}): Router {
    const router = Router();
    const { flowController, authMiddleware, tenantMiddleware } = dependencies;

    // All flow routes require authentication
    router.use(authMiddleware);
    router.use(tenantMiddleware);

    // ============================================
    // FLOW CRUD
    // ============================================

    router.get('/', flowController.getFlows);
    router.get('/:id', flowController.getFlow);
    router.post('/', flowController.createFlow);
    router.put('/:id', flowController.updateFlow);
    router.delete('/:id', flowController.deleteFlow);

    // ============================================
    // FLOW ACTIONS
    // ============================================

    router.post('/:id/duplicate', flowController.duplicateFlow);
    router.post('/:id/activate', flowController.activateFlow);
    router.post('/:id/deactivate', flowController.deactivateFlow);
    router.post('/:id/trigger', flowController.triggerFlow);

    // ============================================
    // ANALYTICS
    // ============================================

    router.get('/:id/analytics', flowController.getFlowAnalytics);

    // ============================================
    // SESSION MANAGEMENT
    // ============================================

    router.get('/sessions/follow-up', flowController.getSessionsNeedingFollowUp);
    router.get('/sessions/:phone', flowController.getActiveSession);
    router.delete('/sessions/:phone', flowController.endSession);

    // ============================================
    // TEMPLATES
    // ============================================

    router.post('/templates/default-qualification', flowController.createDefaultFlow);

    return router;
}
