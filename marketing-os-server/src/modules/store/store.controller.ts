import type { Request, Response, NextFunction } from 'express';
import * as storeService from './store.service.js';

// --- Products ---

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const data = await storeService.getProducts(tenantId, req.query);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const { id } = req.params;
        const data = await storeService.getProductById(id, tenantId);
        if (!data) return res.status(404).json({ error: 'Product not found' });
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const data = await storeService.createProduct(tenantId, req.body);
        res.status(201).json({ data });
    } catch (error) {
        next(error);
    }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const { id } = req.params;
        const data = await storeService.updateProduct(id, tenantId, req.body);
        if (!data) return res.status(404).json({ error: 'Product not found' });
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const { id } = req.params;
        const success = await storeService.deleteProduct(id, tenantId);
        if (!success) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// --- Orders ---

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const data = await storeService.getOrders(tenantId, req.query);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const { id } = req.params;
        const data = await storeService.getOrderById(id, tenantId);
        if (!data) return res.status(404).json({ error: 'Order not found' });
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const { id } = req.params;
        const { status } = req.body;
        const data = await storeService.updateOrderStatus(id, tenantId, status);
        if (!data) return res.status(404).json({ error: 'Order not found' });
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

export const confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const { id } = req.params;
        const data = await storeService.confirmPayment(id, tenantId);
        if (!data) return res.status(404).json({ error: 'Order not found' });
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

// --- Analytics ---

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const data = await storeService.getAnalytics(tenantId);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

// --- Settings ---

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const data = await storeService.getSettings(tenantId);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const data = await storeService.updateSettings(tenantId, req.body);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};
