// presentation/store/StoreController.ts
// REST API controller for WhatsApp Store Automation

import { Request, Response, NextFunction } from 'express';
import { WhatsAppStoreService } from './store.service.js';

export class StoreController {
    constructor(private storeService: WhatsAppStoreService) { }

    // ============================
    // PRODUCTS
    // ============================

    getProducts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { category, enabled, featured } = req.query;
            const products = await this.storeService.getProducts(tenantId, {
                category: category as string,
                enabled: enabled !== undefined ? enabled === 'true' : undefined,
                featured: featured !== undefined ? featured === 'true' : undefined,
            });

            res.json({ data: products });
        } catch (error) { next(error); }
    };

    getProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const product = await this.storeService.getProduct(tenantId, req.params.id);
            if (!product) { res.status(404).json({ error: 'Product not found' }); return; }

            res.json({ data: product });
        } catch (error) { next(error); }
    };

    createProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { name, description, price, currency, image_url, category, is_featured } = req.body;
            if (!name || price === undefined) {
                res.status(400).json({ error: 'Name and price are required' }); return;
            }

            const product = await this.storeService.createProduct(tenantId, {
                name, description, price: Number(price), currency, image_url, category, is_featured,
            });

            res.status(201).json({ data: product });
        } catch (error) { next(error); }
    };

    updateProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const product = await this.storeService.updateProduct(tenantId, req.params.id, req.body);
            if (!product) { res.status(404).json({ error: 'Product not found' }); return; }

            res.json({ data: product });
        } catch (error) { next(error); }
    };

    deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const deleted = await this.storeService.deleteProduct(tenantId, req.params.id);
            if (!deleted) { res.status(404).json({ error: 'Product not found' }); return; }

            res.json({ success: true });
        } catch (error) { next(error); }
    };

    // ============================
    // ORDERS
    // ============================

    getOrders = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { status, payment_status, limit, offset } = req.query;
            const result = await this.storeService.getOrders(tenantId, {
                status: status as string,
                payment_status: payment_status as string,
                limit: limit ? Number(limit) : undefined,
                offset: offset ? Number(offset) : undefined,
            });

            res.json({ data: result.rows, total: result.count });
        } catch (error) { next(error); }
    };

    getOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const order = await this.storeService.getOrder(tenantId, req.params.id);
            if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

            res.json({ data: order });
        } catch (error) { next(error); }
    };

    updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const { status } = req.body;
            if (!['pending', 'confirmed', 'shipped', 'completed', 'cancelled'].includes(status)) {
                res.status(400).json({ error: 'Invalid status' }); return;
            }

            const order = await this.storeService.updateOrderStatus(tenantId, req.params.id, status);
            if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

            res.json({ data: order });
        } catch (error) { next(error); }
    };

    confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const order = await this.storeService.confirmPayment(tenantId, req.params.id);
            if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

            res.json({ data: order });
        } catch (error) { next(error); }
    };

    // ============================
    // SETTINGS
    // ============================

    getSettings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const settings = await this.storeService.getSettings(tenantId);
            res.json({ data: settings });
        } catch (error) { next(error); }
    };

    updateSettings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const settings = await this.storeService.updateSettings(tenantId, req.body);
            res.json({ data: settings });
        } catch (error) { next(error); }
    };

    // ============================
    // ANALYTICS
    // ============================

    getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const analytics = await this.storeService.getAnalytics(tenantId);
            res.json({ data: analytics });
        } catch (error) { next(error); }
    };
}
