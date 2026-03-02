import { Router } from 'express';
import * as storeController from './store.controller.js';

export function createStoreRoutes(dependencies: {
    authMiddleware: any;
    tenantMiddleware: any;
}) {
    const router = Router();
    const { authMiddleware, tenantMiddleware } = dependencies;

    // Apply authentication and tenant context
    router.use(authMiddleware);
    router.use(tenantMiddleware);

    // --- Products ---
    router.get('/products', storeController.getProducts);
    router.get('/products/:id', storeController.getProduct);
    router.post('/products', storeController.createProduct);
    router.put('/products/:id', storeController.updateProduct);
    router.delete('/products/:id', storeController.deleteProduct);

    // --- Orders ---
    router.get('/orders', storeController.getOrders);
    router.get('/orders/:id', storeController.getOrder);
    router.put('/orders/:id/status', storeController.updateOrderStatus);
    router.post('/orders/:id/confirm-payment', storeController.confirmPayment);

    // --- Analytics ---
    router.get('/analytics', storeController.getAnalytics);

    // --- Settings ---
    router.get('/settings', storeController.getSettings);
    router.put('/settings', storeController.updateSettings);

    return router;
}
