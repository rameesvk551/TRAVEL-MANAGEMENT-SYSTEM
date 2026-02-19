/**
 * Automation module routes.
 */

import { Router } from 'express';
import { AutomationController } from './automation.controller.js';

export function createAutomationRoutes(dependencies: {
    automationController: AutomationController;
    authMiddleware: (req: any, res: any, next: any) => void;
    tenantMiddleware: (req: any, res: any, next: any) => void;
}): Router {
    const router = Router();
    const { automationController, authMiddleware, tenantMiddleware } = dependencies;

    // All routes require authentication
    router.use(authMiddleware);
    router.use(tenantMiddleware);

    // ============================================
    // RULE CRUD
    // ============================================

    router.get('/rules', automationController.getRules);
    router.get('/rules/:id', automationController.getRule);
    router.post('/rules', automationController.createRule);
    router.put('/rules/:id', automationController.updateRule);
    router.delete('/rules/:id', automationController.deleteRule);

    // ============================================
    // RULE ACTIONS
    // ============================================

    router.post('/rules/:id/activate', automationController.activateRule);
    router.post('/rules/:id/deactivate', automationController.deactivateRule);

    // ============================================
    // EXECUTIONS
    // ============================================

    router.get('/executions/:id', automationController.getExecution);

    // ============================================
    // STATISTICS
    // ============================================

    router.get('/stats', automationController.getStats);

    // ============================================
    // TEMPLATES
    // ============================================

    router.post('/templates/defaults', automationController.createDefaultRules);

    return router;
}
