/**
 * Flow repository — encapsulates all database queries for the flow module.
 */

import { Op } from 'sequelize';
import { Flow, FlowSession, FlowAnalytics } from './flow.model.js';
import type { CreateFlowDTO, UpdateFlowDTO, FlowFilters, FlowNode, CartItem } from './flow.types.js';

export class FlowRepository {
    // ============================
    // FLOW CRUD
    // ============================

    async findById(tenantId: string, id: string) {
        return Flow.findOne({
            where: { id, tenant_id: tenantId },
        });
    }

    async findAll(tenantId: string, filters: FlowFilters = {}) {
        const where: any = { tenant_id: tenantId };

        if (filters.is_active !== undefined) where.is_active = filters.is_active;
        if (filters.trigger_type) where.trigger_type = filters.trigger_type;

        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${filters.search}%` } },
                { description: { [Op.iLike]: `%${filters.search}%` } },
            ];
        }

        return Flow.findAndCountAll({
            where,
            order: [['priority', 'DESC'], ['created_at', 'DESC']],
            limit: filters.limit || 50,
            offset: filters.offset || 0,
        });
    }

    async create(tenantId: string, data: CreateFlowDTO) {
        return Flow.create({
            tenant_id: tenantId,
            name: data.name,
            description: data.description,
            trigger_keywords: data.trigger_keywords || [],
            trigger_type: data.trigger_type || 'keyword',
            is_active: data.is_active ?? true,
            is_default: data.is_default ?? false,
            priority: data.priority ?? 0,
            nodes: data.nodes,
            start_node_id: data.start_node_id,
            metadata: data.metadata || {},
        });
    }

    async update(tenantId: string, id: string, data: UpdateFlowDTO) {
        const flow = await Flow.findOne({ where: { id, tenant_id: tenantId } });
        if (!flow) return null;

        await flow.update(data);
        return flow;
    }

    async delete(tenantId: string, id: string) {
        const count = await Flow.destroy({ where: { id, tenant_id: tenantId } });
        return count > 0;
    }

    // ============================
    // FLOW MATCHING
    // ============================

    async findByKeyword(tenantId: string, keyword: string) {
        const flows = await Flow.findAll({
            where: {
                tenant_id: tenantId,
                is_active: true,
                trigger_type: 'keyword',
            },
            order: [['priority', 'DESC']],
        });

        // Find flow where keyword matches any trigger_keyword
        const normalizedKeyword = keyword.toLowerCase().trim();
        return flows.find(flow => {
            const keywords = flow.trigger_keywords || [];
            return keywords.some(kw => {
                const normalizedTrigger = kw.toLowerCase().trim();
                // Exact match or contains
                return normalizedKeyword === normalizedTrigger ||
                    normalizedKeyword.includes(normalizedTrigger);
            });
        });
    }

    async findFirstMessageFlow(tenantId: string) {
        return Flow.findOne({
            where: {
                tenant_id: tenantId,
                is_active: true,
                trigger_type: 'first_message',
            },
            order: [['priority', 'DESC']],
        });
    }

    async findFallbackFlow(tenantId: string) {
        return Flow.findOne({
            where: {
                tenant_id: tenantId,
                is_active: true,
                trigger_type: 'fallback',
            },
            order: [['priority', 'DESC']],
        });
    }

    async findDefaultFlow(tenantId: string) {
        return Flow.findOne({
            where: {
                tenant_id: tenantId,
                is_active: true,
                is_default: true,
            },
        });
    }

    // ============================
    // FLOW SESSION
    // ============================

    async findActiveSession(tenantId: string, phone: string) {
        return FlowSession.findOne({
            where: {
                tenant_id: tenantId,
                phone,
                is_active: true,
            },
            include: [{ model: Flow, as: 'flow' }],
        });
    }

    async createSession(tenantId: string, phone: string, flowId: string, startNodeId: string) {
        // Deactivate any existing active sessions
        await FlowSession.update(
            { is_active: false, completed_at: new Date() },
            { where: { tenant_id: tenantId, phone, is_active: true } }
        );

        return FlowSession.create({
            tenant_id: tenantId,
            phone,
            flow_id: flowId,
            current_node_id: startNodeId,
            collected_data: {},
            cart_items: [],
            variables: {},
            is_active: true,
        });
    }

    async updateSession(
        tenantId: string,
        sessionId: string,
        data: {
            current_node_id?: string;
            collected_data?: Record<string, any>;
            cart_items?: CartItem[];
            selected_product_id?: string | null;
            variables?: Record<string, any>;
            is_active?: boolean;
            completed_at?: Date;
        }
    ) {
        const session = await FlowSession.findOne({
            where: { id: sessionId, tenant_id: tenantId },
        });
        if (!session) return null;

        // Merge collected_data and variables
        if (data.collected_data) {
            data.collected_data = { ...session.collected_data, ...data.collected_data };
        }
        if (data.variables) {
            data.variables = { ...session.variables, ...data.variables };
        }

        await session.update({
            ...data,
            last_activity_at: new Date(),
        });
        return session;
    }

    async endSession(tenantId: string, sessionId: string) {
        return this.updateSession(tenantId, sessionId, {
            is_active: false,
            completed_at: new Date(),
        });
    }

    async addToCart(tenantId: string, sessionId: string, item: CartItem) {
        const session = await FlowSession.findOne({
            where: { id: sessionId, tenant_id: tenantId },
        });
        if (!session) return null;

        const cartItems = [...(session.cart_items || [])];
        
        // Check if product already in cart
        const existingIndex = cartItems.findIndex(c => c.product_id === item.product_id);
        if (existingIndex >= 0) {
            cartItems[existingIndex].quantity += item.quantity;
        } else {
            cartItems.push(item);
        }

        await session.update({ cart_items: cartItems, last_activity_at: new Date() });
        return session;
    }

    async updateCartItem(tenantId: string, sessionId: string, productId: string, quantity: number) {
        const session = await FlowSession.findOne({
            where: { id: sessionId, tenant_id: tenantId },
        });
        if (!session) return null;

        let cartItems = [...(session.cart_items || [])];
        
        if (quantity <= 0) {
            cartItems = cartItems.filter(c => c.product_id !== productId);
        } else {
            const index = cartItems.findIndex(c => c.product_id === productId);
            if (index >= 0) {
                cartItems[index].quantity = quantity;
            }
        }

        await session.update({ cart_items: cartItems, last_activity_at: new Date() });
        return session;
    }

    async clearCart(tenantId: string, sessionId: string) {
        return this.updateSession(tenantId, sessionId, { cart_items: [] });
    }

    // ============================
    // SESSION CLEANUP
    // ============================

    async cleanupStaleSessions(maxAgeMs: number) {
        const cutoff = new Date(Date.now() - maxAgeMs);
        const [count] = await FlowSession.update(
            { is_active: false, completed_at: new Date() },
            {
                where: {
                    is_active: true,
                    last_activity_at: { [Op.lt]: cutoff },
                },
            }
        );
        return count;
    }

    async getSessionsNeedingFollowUp(tenantId: string, inactiveForMs: number) {
        const cutoff = new Date(Date.now() - inactiveForMs);
        return FlowSession.findAll({
            where: {
                tenant_id: tenantId,
                is_active: true,
                last_activity_at: { [Op.lt]: cutoff },
            },
            include: [{ model: Flow, as: 'flow' }],
        });
    }

    // ============================
    // ANALYTICS
    // ============================

    async logAnalytics(
        tenantId: string,
        flowId: string,
        nodeId: string,
        eventType: 'enter' | 'exit' | 'timeout' | 'error',
        phone?: string,
        metadata?: Record<string, any>
    ) {
        return FlowAnalytics.create({
            tenant_id: tenantId,
            flow_id: flowId,
            node_id: nodeId,
            event_type: eventType,
            phone,
            metadata,
        });
    }

    async getFlowAnalytics(tenantId: string, flowId: string, startDate?: Date, endDate?: Date) {
        const where: any = { tenant_id: tenantId, flow_id: flowId };

        if (startDate) {
            where.created_at = { ...where.created_at, [Op.gte]: startDate };
        }
        if (endDate) {
            where.created_at = { ...where.created_at, [Op.lte]: endDate };
        }

        return FlowAnalytics.findAll({
            where,
            order: [['created_at', 'DESC']],
            limit: 1000,
        });
    }

    async getNodeAnalytics(tenantId: string, flowId: string, nodeId: string) {
        const enterCount = await FlowAnalytics.count({
            where: { tenant_id: tenantId, flow_id: flowId, node_id: nodeId, event_type: 'enter' },
        });

        const exitCount = await FlowAnalytics.count({
            where: { tenant_id: tenantId, flow_id: flowId, node_id: nodeId, event_type: 'exit' },
        });

        const timeoutCount = await FlowAnalytics.count({
            where: { tenant_id: tenantId, flow_id: flowId, node_id: nodeId, event_type: 'timeout' },
        });

        const errorCount = await FlowAnalytics.count({
            where: { tenant_id: tenantId, flow_id: flowId, node_id: nodeId, event_type: 'error' },
        });

        return {
            node_id: nodeId,
            enter_count: enterCount,
            exit_count: exitCount,
            timeout_count: timeoutCount,
            error_count: errorCount,
            completion_rate: enterCount > 0 ? (exitCount / enterCount) * 100 : 0,
        };
    }
}
