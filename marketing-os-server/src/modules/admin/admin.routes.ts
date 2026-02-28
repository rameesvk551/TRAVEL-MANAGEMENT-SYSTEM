import { Router, RequestHandler } from 'express';
import { AdminController } from './admin.controller.js';

const SUPER_ADMIN_ROLES = new Set(['super_admin', 'platform_admin', 'owner']);

const requireSuperAdmin: RequestHandler = (req, res, next) => {
    const role = String((req as any).user?.role || '').toLowerCase();

    if (!SUPER_ADMIN_ROLES.has(role)) {
        res.status(403).json({ error: 'Super admin access required' });
        return;
    }

    next();
};

export const createAdminRoutes = (authMiddleware: RequestHandler, adminController: AdminController): Router => {
    const router = Router();

    router.use(authMiddleware);
    router.use(requireSuperAdmin);

    router.get('/overview', adminController.getOverview);
    router.get('/tenants', adminController.getTenants);
    router.get('/tenants/:tenantId', adminController.getTenantById);
    router.patch('/tenants/:tenantId/status', adminController.updateTenantStatus);
    router.patch('/tenants/:tenantId/plan', adminController.updateTenantPlan);
    router.post('/tenants/:tenantId/impersonate', adminController.impersonateTenant);

    router.get('/users', adminController.getUsers);
    router.get('/users/:userId/activity', adminController.getUserActivity);

    router.get('/billing', adminController.getBilling);
    router.get('/integrations', adminController.getIntegrations);
    router.get('/automation-logs', adminController.getAutomationLogs);
    router.get('/audit-logs', adminController.getAuditLogs);
    router.get('/system-health', adminController.getSystemHealth);

    router.get('/feature-management', adminController.getFeatureManagement);
    router.patch('/feature-management/plans/:planId/features', adminController.updatePlanFeature);
    router.patch('/feature-management/plans/:planId/limits', adminController.updatePlanLimit);
    router.patch('/feature-management/flags/:flagId', adminController.updateFeatureFlag);

    router.get('/settings', adminController.getSettings);
    router.put('/settings', adminController.updateSettings);

    router.get('/notifications', adminController.getNotifications);
    router.post('/notifications/:id/read', adminController.markNotificationRead);

    return router;
};
