import { Op } from 'sequelize';
import { StoreProduct, StoreOrder, StoreOrderItem } from './store.models.js';

export const getProducts = async (tenantId: string, filters: any = {}) => {
    const where: any = { tenant_id: tenantId };

    if (filters.category) {
        where.category = filters.category;
    }
    if (filters.enabled !== undefined) {
        // Handle string booleans from query
        where.is_active = filters.enabled === 'true' || filters.enabled === true;
    }

    return await StoreProduct.findAll({
        where,
        order: [['created_at', 'DESC']],
    });
};

export const getProductById = async (id: string, tenantId: string) => {
    return await StoreProduct.findOne({
        where: { id, tenant_id: tenantId }
    });
};

export const createProduct = async (tenantId: string, data: any) => {
    return await StoreProduct.create({
        ...data,
        tenant_id: tenantId,
    });
};

export const updateProduct = async (id: string, tenantId: string, updates: any) => {
    const product = await getProductById(id, tenantId);
    if (!product) return null;
    return await product.update(updates);
};

export const deleteProduct = async (id: string, tenantId: string) => {
    const deletedCount = await StoreProduct.destroy({
        where: { id, tenant_id: tenantId }
    });
    return deletedCount > 0;
};

export const getOrders = async (tenantId: string, filters: any = {}) => {
    const where: any = { tenant_id: tenantId };

    if (filters.status) where.status = filters.status;
    if (filters.payment_status) where.payment_status = filters.payment_status;

    const limit = filters.limit ? parseInt(filters.limit) : 50;
    const offset = filters.offset ? parseInt(filters.offset) : 0;

    return await StoreOrder.findAndCountAll({
        where,
        include: [{
            model: StoreOrderItem,
            as: 'items',
            include: [{
                model: StoreProduct,
                as: 'Product',
                attributes: ['name', 'image_url']
            }]
        }],
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });
};

export const getOrderById = async (id: string, tenantId: string) => {
    return await StoreOrder.findOne({
        where: { id, tenant_id: tenantId },
        include: [{
            model: StoreOrderItem,
            as: 'items',
            include: [{
                model: StoreProduct,
                as: 'Product',
                attributes: ['name', 'image_url', 'price']
            }]
        }]
    });
};

export const createOrder = async (tenantId: string, orderData: any, items: any[], transaction?: any) => {
    const order = await StoreOrder.create({
        ...orderData,
        tenant_id: tenantId,
    }, { transaction });

    if (items && items.length > 0) {
        const orderItems = items.map(item => ({
            ...item,
            order_id: order.id,
        }));
        await StoreOrderItem.bulkCreate(orderItems, { transaction });
    }

    return getOrderById(order.id, tenantId);
};

export const updateOrderStatus = async (id: string, tenantId: string, status: string) => {
    const order = await StoreOrder.findOne({ where: { id, tenant_id: tenantId } });
    if (!order) return null;
    return await order.update({ status });
};

export const updatePaymentStatus = async (id: string, tenantId: string, payment_status: string) => {
    const order = await StoreOrder.findOne({ where: { id, tenant_id: tenantId } });
    if (!order) return null;
    return await order.update({ payment_status });
};

export const getAnalytics = async (tenantId: string) => {
    // Basic analytics implementation
    const totalRevenue = await StoreOrder.sum('total_amount', {
        where: { tenant_id: tenantId, payment_status: 'paid' }
    });

    const totalOrders = await StoreOrder.count({
        where: { tenant_id: tenantId }
    });

    const totalProducts = await StoreProduct.count({
        where: { tenant_id: tenantId, is_active: true }
    });

    return {
        revenue: totalRevenue || 0,
        orders: totalOrders,
        active_products: totalProducts,
    };
};
