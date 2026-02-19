import { Router } from 'express';
import { RevenueController } from './controllers/RevenueController.js';

export function createRevenueRoutes(revenueController: RevenueController): Router {
    const router = Router();

    router.get('/dashboard', revenueController.getDashboard);
    router.get('/mrr', revenueController.getMRR);
    router.get('/churn', revenueController.getChurn);
    router.get('/trial-conversion', revenueController.getTrialConversion);
    router.get('/trend', revenueController.getRevenueTrend);
    router.get('/by-channel', revenueController.getRevenueByChannel);
    router.get('/refunds', revenueController.getRefunds);
    router.get('/payment-failures', revenueController.getPaymentFailures);
    router.get('/forecast', revenueController.getRevenueForecast);
    router.get('/profit-margin', revenueController.getProfitMargin);

    return router;
}
