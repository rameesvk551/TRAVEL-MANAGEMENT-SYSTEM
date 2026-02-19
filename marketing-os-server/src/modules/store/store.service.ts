// application/store/services/WhatsAppStoreService.ts
// Core business logic for WhatsApp Store Automation

import { StoreProduct } from '../../database/models/StoreProduct.js';
import { StoreOrder } from '../../database/models/StoreOrder.js';
import { StoreSettings } from '../../database/models/StoreSettings.js';
import type { OrderStatus, PaymentStatus } from '../../database/models/StoreOrder.js';
import { Op } from 'sequelize';

export class WhatsAppStoreService {
    // ============================
    // PRODUCTS
    // ============================

    async getProducts(tenantId: string, filters: { category?: string; enabled?: boolean; featured?: boolean } = {}) {
        const where: any = { tenant_id: tenantId };
        if (filters.category) where.category = filters.category;
        if (filters.enabled !== undefined) where.is_enabled = filters.enabled;
        if (filters.featured !== undefined) where.is_featured = filters.featured;

        return StoreProduct.findAll({ where, order: [['sort_order', 'ASC'], ['created_at', 'DESC']] });
    }

    async getProduct(tenantId: string, id: string) {
        return StoreProduct.findOne({ where: { id, tenant_id: tenantId } });
    }

    async createProduct(tenantId: string, data: {
        name: string;
        description?: string;
        price: number;
        currency?: string;
        image_url?: string;
        category?: string;
        is_featured?: boolean;
    }) {
        return StoreProduct.create({ tenant_id: tenantId, ...data });
    }

    async updateProduct(tenantId: string, id: string, data: Partial<{
        name: string;
        description: string;
        price: number;
        currency: string;
        image_url: string;
        category: string;
        is_enabled: boolean;
        is_featured: boolean;
        sort_order: number;
    }>) {
        const product = await StoreProduct.findOne({ where: { id, tenant_id: tenantId } });
        if (!product) return null;
        await product.update(data);
        return product;
    }

    async deleteProduct(tenantId: string, id: string) {
        const count = await StoreProduct.destroy({ where: { id, tenant_id: tenantId } });
        return count > 0;
    }

    async getCategories(tenantId: string) {
        const products = await StoreProduct.findAll({
            where: { tenant_id: tenantId, is_enabled: true },
            attributes: ['category'],
            group: ['category'],
        });
        return products.map((p) => p.category).filter(Boolean) as string[];
    }

    async getProductsByCategory(tenantId: string, category: string) {
        return StoreProduct.findAll({
            where: { tenant_id: tenantId, category, is_enabled: true },
            order: [['sort_order', 'ASC']],
        });
    }

    // ============================
    // ORDERS
    // ============================

    async getOrders(tenantId: string, filters: { status?: string; payment_status?: string; limit?: number; offset?: number } = {}) {
        const where: any = { tenant_id: tenantId };
        if (filters.status) where.status = filters.status;
        if (filters.payment_status) where.payment_status = filters.payment_status;

        return StoreOrder.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: filters.limit || 50,
            offset: filters.offset || 0,
        });
    }

    async getOrder(tenantId: string, id: string) {
        return StoreOrder.findOne({ where: { id, tenant_id: tenantId } });
    }

    async createOrder(tenantId: string, data: {
        customer_phone: string;
        customer_name?: string;
        delivery_address?: string;
        items: Array<{ product_id: string; name: string; price: number; quantity: number }>;
        total_amount: number;
        currency?: string;
        conversation_id?: string;
    }) {
        return StoreOrder.create({
            tenant_id: tenantId,
            ...data,
            status: 'pending',
            payment_status: 'unpaid',
        });
    }

    async updateOrderStatus(tenantId: string, id: string, status: OrderStatus) {
        const order = await StoreOrder.findOne({ where: { id, tenant_id: tenantId } });
        if (!order) return null;
        await order.update({ status });
        return order;
    }

    async confirmPayment(tenantId: string, id: string) {
        const order = await StoreOrder.findOne({ where: { id, tenant_id: tenantId } });
        if (!order) return null;
        await order.update({ payment_status: 'paid' as PaymentStatus });
        return order;
    }

    async setPaymentLink(tenantId: string, orderId: string, paymentLink: string) {
        const order = await StoreOrder.findOne({ where: { id: orderId, tenant_id: tenantId } });
        if (!order) return null;
        await order.update({ payment_link: paymentLink, payment_status: 'awaiting' as PaymentStatus });
        return order;
    }

    async getOrdersByPhone(tenantId: string, phone: string) {
        return StoreOrder.findAll({
            where: { tenant_id: tenantId, customer_phone: phone },
            order: [['created_at', 'DESC']],
            limit: 5,
        });
    }

    // ============================
    // SETTINGS
    // ============================

    async getSettings(tenantId: string) {
        let settings = await StoreSettings.findOne({ where: { tenant_id: tenantId } });
        if (!settings) {
            settings = await StoreSettings.create({ tenant_id: tenantId });
        }
        return settings;
    }

    async updateSettings(tenantId: string, data: Partial<{
        is_active: boolean;
        welcome_message: string;
        payment_link_template: string;
        checkout_reminder_minutes: number;
        payment_reminder_minutes: number;
        auto_keywords: Record<string, string[]>;
    }>) {
        let settings = await StoreSettings.findOne({ where: { tenant_id: tenantId } });
        if (!settings) {
            settings = await StoreSettings.create({ tenant_id: tenantId, ...data });
        } else {
            await settings.update(data);
        }
        return settings;
    }

    // ============================
    // ANALYTICS
    // ============================

    async getAnalytics(tenantId: string) {
        const totalProducts = await StoreProduct.count({ where: { tenant_id: tenantId, is_enabled: true } });

        const totalOrders = await StoreOrder.count({ where: { tenant_id: tenantId } });

        const pendingOrders = await StoreOrder.count({ where: { tenant_id: tenantId, status: 'pending' } });

        const completedOrders = await StoreOrder.count({ where: { tenant_id: tenantId, status: 'completed' } });

        const awaitingPayment = await StoreOrder.count({
            where: { tenant_id: tenantId, payment_status: 'awaiting' },
        });

        const paidOrders = await StoreOrder.count({
            where: { tenant_id: tenantId, payment_status: 'paid' },
        });

        // Recent orders (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentOrders = await StoreOrder.count({
            where: { tenant_id: tenantId, created_at: { [Op.gte]: sevenDaysAgo } },
        });

        return {
            totalProducts,
            totalOrders,
            pendingOrders,
            completedOrders,
            awaitingPayment,
            paidOrders,
            recentOrders,
        };
    }

    // ============================
    // PAYMENT LINK GENERATION
    // ============================

    generatePaymentMessage(settings: StoreSettings, order: StoreOrder): string {
        const template = settings.payment_link_template || '';
        if (!template) {
            return `💰 *Payment for Order #${order.id.slice(-6).toUpperCase()}*\n\nTotal: ${order.currency} ${order.total_amount}\n\nPlease complete your payment and reply "done" to confirm.`;
        }

        return template
            .replace('{{order_id}}', order.id.slice(-6).toUpperCase())
            .replace('{{amount}}', String(order.total_amount))
            .replace('{{currency}}', order.currency);
    }
}
