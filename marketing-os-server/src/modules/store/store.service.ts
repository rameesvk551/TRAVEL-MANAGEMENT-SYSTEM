import * as storeRepo from './store.repository.js';

export const getProducts = async (tenantId: string, filters: any) => {
    return await storeRepo.getProducts(tenantId, filters);
};

export const getProductById = async (id: string, tenantId: string) => {
    return await storeRepo.getProductById(id, tenantId);
};

export const createProduct = async (tenantId: string, data: any) => {
    return await storeRepo.createProduct(tenantId, data);
};

export const updateProduct = async (id: string, tenantId: string, updates: any) => {
    return await storeRepo.updateProduct(id, tenantId, updates);
};

export const deleteProduct = async (id: string, tenantId: string) => {
    return await storeRepo.deleteProduct(id, tenantId);
};

export const getOrders = async (tenantId: string, filters: any) => {
    return await storeRepo.getOrders(tenantId, filters);
};

export const getOrderById = async (id: string, tenantId: string) => {
    return await storeRepo.getOrderById(id, tenantId);
};

export const updateOrderStatus = async (id: string, tenantId: string, status: string) => {
    return await storeRepo.updateOrderStatus(id, tenantId, status);
};

export const confirmPayment = async (id: string, tenantId: string) => {
    return await storeRepo.updatePaymentStatus(id, tenantId, 'paid');
};

export const getSettings = async (tenantId: string) => {
    // Return mock settings for now since settings module handles real settings
    return {
        currency: 'USD',
        taxRate: 0,
        shippingFee: 0,
    };
};

export const updateSettings = async (tenantId: string, settings: any) => {
    return settings;
};

export const getAnalytics = async (tenantId: string) => {
    return await storeRepo.getAnalytics(tenantId);
};
