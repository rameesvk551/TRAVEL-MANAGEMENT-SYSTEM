/**
 * Recommendation module routes.
 */

import { Router } from 'express';
import { RecommendationController } from './recommendation.controller.js';

export function createRecommendationRoutes(dependencies: {
    recommendationController: RecommendationController;
    authMiddleware: (req: any, res: any, next: any) => void;
    tenantMiddleware: (req: any, res: any, next: any) => void;
}): Router {
    const router = Router();
    const { recommendationController, authMiddleware, tenantMiddleware } = dependencies;

    // All routes require authentication
    router.use(authMiddleware);
    router.use(tenantMiddleware);

    // ============================================
    // RECOMMENDATIONS
    // ============================================

    router.get('/', recommendationController.getRecommendations);
    router.get('/personalized/:leadId', recommendationController.getPersonalizedRecommendations);
    router.get('/similar/:productId', recommendationController.getSimilarProducts);
    router.post('/cart', recommendationController.getCartRecommendations);
    router.get('/upsell/:productId', recommendationController.getUpsellProducts);
    router.get('/trending', recommendationController.getTrendingProducts);

    // ============================================
    // INTERACTION TRACKING
    // ============================================

    router.post('/track', recommendationController.trackInteraction);
    router.post('/track/view', recommendationController.trackView);
    router.post('/track/cart', recommendationController.trackAddToCart);
    router.post('/track/purchase', recommendationController.trackPurchase);

    // ============================================
    // ANALYTICS
    // ============================================

    router.get('/analytics/popular', recommendationController.getPopularProducts);
    router.get('/analytics/conversion/:productId', recommendationController.getConversionStats);
    router.get('/analytics/bought-together/:productId', recommendationController.getFrequentlyBoughtTogether);

    // ============================================
    // LEAD PREFERENCES
    // ============================================

    router.get('/preferences/:leadId', recommendationController.getLeadPreferences);
    router.put('/preferences/:leadId/interests', recommendationController.updateLeadInterests);
    router.put('/preferences/:leadId/budget', recommendationController.updateLeadBudget);

    return router;
}
