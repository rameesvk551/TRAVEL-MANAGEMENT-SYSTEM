// presentation/store/store.routes.ts
// Routes for WhatsApp Store Automation module

import { Router } from 'express';
import { StoreController } from './store.controller.js';

export function createStoreRoutes(dependencies: {
    storeController: StoreController;
    authMiddleware: (req: any, res: any, next: any) => void;
    tenantMiddleware: (req: any, res: any, next: any) => void;
}): Router {
    const router = Router();
    const { storeController, authMiddleware, tenantMiddleware } = dependencies;

    // All store routes require authentication
    router.use(authMiddleware);
    router.use(tenantMiddleware);

    // ============================================
    // PRODUCT ROUTES
    // ============================================

    router.get('/products', storeController.getProducts);
    router.get('/products/:id', storeController.getProduct);
    router.post('/products', storeController.createProduct);
    router.put('/products/:id', storeController.updateProduct);
    router.delete('/products/:id', storeController.deleteProduct);

    // ============================================
    // ORDER ROUTES
    // ============================================

    router.get('/orders', storeController.getOrders);
    router.get('/orders/:id', storeController.getOrder);
    router.put('/orders/:id/status', storeController.updateOrderStatus);
    router.post('/orders/:id/confirm-payment', storeController.confirmPayment);

    // ============================================
    // SETTINGS ROUTES
    // ============================================

    router.get('/settings', storeController.getSettings);
    router.put('/settings', storeController.updateSettings);

    // ============================================
    // ANALYTICS ROUTES
    // ============================================

    router.get('/analytics', storeController.getAnalytics);

    return router;
}
