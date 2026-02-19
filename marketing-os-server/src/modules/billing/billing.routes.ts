import { RequestHandler, Router } from 'express';
import { BillingController } from './billing.controller.js';
import { SUPER_ADMIN_ROLES } from './billing.types.js';

const requireSuperAdmin: RequestHandler = (req, res, next) => {
    const role = String((req as any).user?.role || '').toLowerCase();
    if (!SUPER_ADMIN_ROLES.has(role)) {
        res.status(403).json({
            status: 'error',
            message: 'Super admin access required',
        });
        return;
    }

    next();
};

export const createBillingRoutes = (authMiddleware: RequestHandler, billingController: BillingController): Router => {
    const router = Router();

    // Razorpay webhooks are unauthenticated and signature-protected.
    router.post('/webhooks/razorpay', billingController.handleWebhook);

    router.use(authMiddleware);

    router.get('/subscription', billingController.getCurrentSubscription);
    router.get('/usage', billingController.getUsageStats);
    router.get('/payments', billingController.getPaymentHistory);
    router.get('/invoices/pending', billingController.getPendingInvoices);

    router.post('/coupons/validate', billingController.validateCoupon);
    router.post('/checkout/subscription', billingController.createSubscriptionCheckout);
    router.post('/checkout/lifetime', billingController.createLifetimeCheckout);
    router.post('/checkout/usage-invoice', billingController.createUsageInvoiceCheckout);

    // Internal usage metering endpoint
    router.post('/usage/track', billingController.trackUsage);

    // Platform admin endpoints
    router.get('/admin/usage-config', requireSuperAdmin, billingController.getUsageConfigs);
    router.put('/admin/usage-config/:planType', requireSuperAdmin, billingController.upsertUsageConfig);
    router.get('/admin/coupons', requireSuperAdmin, billingController.getCoupons);
    router.post('/admin/coupons', requireSuperAdmin, billingController.createCoupon);
    router.patch('/admin/coupons/:couponId', requireSuperAdmin, billingController.updateCoupon);
    router.delete('/admin/coupons/:couponId', requireSuperAdmin, billingController.deleteCoupon);
    router.patch('/admin/trial/:tenantId', requireSuperAdmin, billingController.updateTrialWindow);
    router.get('/admin/audit-logs', requireSuperAdmin, billingController.getBillingAuditLogs);
    router.post(
        '/admin/jobs/monthly-usage-billing/run',
        requireSuperAdmin,
        billingController.runMonthlyUsageBilling,
    );
    router.post(
        '/admin/jobs/reconciliation/run',
        requireSuperAdmin,
        billingController.runRazorpayReconciliation,
    );

    return router;
};
