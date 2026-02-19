/**
 * Flow service — contains all flow management business logic.
 * DB queries are delegated to FlowRepository.
 */

import { FlowRepository } from './flow.repository.js';
import { AppError } from '../../utils/apiError.js';
import type {
    Flow,
    FlowSession,
    CreateFlowDTO,
    UpdateFlowDTO,
    FlowFilters,
    CartItem,
} from './flow.types.js';

export class FlowService {
    constructor(private readonly flowRepository: FlowRepository) {}

    // ============================
    // FLOW CRUD
    // ============================

    async getFlow(tenantId: string, id: string): Promise<Flow | null> {
        const flow = await this.flowRepository.findById(tenantId, id);
        return flow?.toJSON() as Flow | null;
    }

    async getFlows(tenantId: string, filters: FlowFilters = {}) {
        const result = await this.flowRepository.findAll(tenantId, filters);
        return {
            data: result.rows.map(r => r.toJSON() as Flow),
            total: result.count,
        };
    }

    async createFlow(tenantId: string, data: CreateFlowDTO): Promise<Flow> {
        // Validate nodes
        this.validateFlowNodes(data.nodes, data.start_node_id);

        // If setting as default, unset other defaults
        if (data.is_default) {
            await this.unsetDefaultFlow(tenantId);
        }

        const flow = await this.flowRepository.create(tenantId, data);
        return flow.toJSON() as Flow;
    }

    async updateFlow(tenantId: string, id: string, data: UpdateFlowDTO): Promise<Flow | null> {
        // Validate nodes if provided
        if (data.nodes && data.start_node_id) {
            this.validateFlowNodes(data.nodes, data.start_node_id);
        }

        // If setting as default, unset other defaults
        if (data.is_default) {
            await this.unsetDefaultFlow(tenantId, id);
        }

        const flow = await this.flowRepository.update(tenantId, id, data);
        if (!flow) return null;

        return flow.toJSON() as Flow;
    }

    async deleteFlow(tenantId: string, id: string): Promise<boolean> {
        return this.flowRepository.delete(tenantId, id);
    }

    async duplicateFlow(tenantId: string, id: string, newName: string): Promise<Flow | null> {
        const original = await this.flowRepository.findById(tenantId, id);
        if (!original) return null;

        const flow = original.toJSON() as Flow;

        const newFlow = await this.flowRepository.create(tenantId, {
            name: newName,
            description: flow.description,
            trigger_keywords: [],
            trigger_type: 'manual',
            is_active: false,
            is_default: false,
            priority: flow.priority,
            nodes: flow.nodes,
            start_node_id: flow.start_node_id,
            metadata: flow.metadata,
        });

        return newFlow.toJSON() as Flow;
    }

    private async unsetDefaultFlow(tenantId: string, exceptId?: string): Promise<void> {
        // This would need a method in repository to unset all defaults
        // For now, we'll update the existing default if found
        const existingDefault = await this.flowRepository.findDefaultFlow(tenantId);
        if (existingDefault && existingDefault.id !== exceptId) {
            await this.flowRepository.update(tenantId, existingDefault.id, { is_default: false });
        }
    }

    private validateFlowNodes(nodes: any[], startNodeId: string): void {
        if (!nodes || nodes.length === 0) {
            throw new AppError('Flow must have at least one node', 400);
        }

        const nodeIds = new Set(nodes.map(n => n.id));
        
        if (!nodeIds.has(startNodeId)) {
            throw new AppError('Start node not found in nodes', 400);
        }

        // Validate all node references
        for (const node of nodes) {
            const config = node.config;
            if (!config) continue;

            // Check next_node_id references
            const referencedIds = this.extractNodeReferences(config);
            for (const refId of referencedIds) {
                if (refId && !nodeIds.has(refId)) {
                    throw new AppError(`Node "${node.id}" references non-existent node "${refId}"`, 400);
                }
            }
        }
    }

    private extractNodeReferences(config: any): string[] {
        const refs: string[] = [];

        if (config.next_node_id) refs.push(config.next_node_id);
        if (config.default_node_id) refs.push(config.default_node_id);
        if (config.free_text_next_node_id) refs.push(config.free_text_next_node_id);
        if (config.timeout_node_id) refs.push(config.timeout_node_id);
        if (config.success_node_id) refs.push(config.success_node_id);
        if (config.error_node_id) refs.push(config.error_node_id);
        if (config.no_results_node_id) refs.push(config.no_results_node_id);
        if (config.checkout_node_id) refs.push(config.checkout_node_id);
        if (config.continue_shopping_node_id) refs.push(config.continue_shopping_node_id);
        if (config.empty_cart_node_id) refs.push(config.empty_cart_node_id);
        if (config.target_node_id) refs.push(config.target_node_id);

        if (config.options) {
            for (const opt of config.options) {
                if (opt.next_node_id) refs.push(opt.next_node_id);
            }
        }

        if (config.buttons) {
            for (const btn of config.buttons) {
                if (btn.action === 'goto' && btn.value) refs.push(btn.value);
            }
        }

        if (config.conditions) {
            for (const cond of config.conditions) {
                if (cond.next_node_id) refs.push(cond.next_node_id);
            }
        }

        return refs;
    }

    // ============================
    // FLOW ACTIVATION
    // ============================

    async activateFlow(tenantId: string, id: string): Promise<Flow | null> {
        return this.updateFlow(tenantId, id, { is_active: true });
    }

    async deactivateFlow(tenantId: string, id: string): Promise<Flow | null> {
        return this.updateFlow(tenantId, id, { is_active: false });
    }

    // ============================
    // SESSION MANAGEMENT
    // ============================

    async getActiveSession(tenantId: string, phone: string): Promise<FlowSession | null> {
        const session = await this.flowRepository.findActiveSession(tenantId, phone);
        return session?.toJSON() as FlowSession | null;
    }

    async endSession(tenantId: string, sessionId: string): Promise<boolean> {
        const session = await this.flowRepository.endSession(tenantId, sessionId);
        return session !== null;
    }

    async getSessionsNeedingFollowUp(tenantId: string, inactiveForMinutes: number = 30) {
        const inactiveForMs = inactiveForMinutes * 60 * 1000;
        const sessions = await this.flowRepository.getSessionsNeedingFollowUp(tenantId, inactiveForMs);
        return sessions.map(s => s.toJSON() as FlowSession);
    }

    async cleanupStaleSessions(maxAgeHours: number = 24): Promise<number> {
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        return this.flowRepository.cleanupStaleSessions(maxAgeMs);
    }

    // ============================
    // ANALYTICS
    // ============================

    async getFlowAnalytics(tenantId: string, flowId: string, startDate?: Date, endDate?: Date) {
        const flow = await this.flowRepository.findById(tenantId, flowId);
        if (!flow) return null;

        const analytics = await this.flowRepository.getFlowAnalytics(tenantId, flowId, startDate, endDate);
        
        // Calculate node-level stats
        const nodeStats: Record<string, any> = {};
        for (const node of flow.nodes) {
            const stats = await this.flowRepository.getNodeAnalytics(tenantId, flowId, node.id);
            nodeStats[node.id] = stats;
        }

        return {
            flow_id: flowId,
            flow_name: flow.name,
            node_stats: nodeStats,
            total_events: analytics.length,
        };
    }

    // ============================
    // TEMPLATE FLOWS
    // ============================

    async createDefaultQualificationFlow(tenantId: string): Promise<Flow> {
        const defaultFlow: CreateFlowDTO = {
            name: 'Lead Qualification Flow',
            description: 'Default flow for qualifying new leads',
            trigger_keywords: ['hi', 'hello', 'start', 'hey'],
            trigger_type: 'first_message',
            is_active: true,
            is_default: true,
            priority: 10,
            start_node_id: 'welcome',
            nodes: [
                {
                    id: 'welcome',
                    type: 'message',
                    name: 'Welcome Message',
                    config: {
                        type: 'message',
                        message_template: '👋 Hello! Welcome to our store.\n\nI\'m here to help you find exactly what you need.',
                        next_node_id: 'ask_need',
                    },
                },
                {
                    id: 'ask_need',
                    type: 'question',
                    name: 'Ask Need',
                    config: {
                        type: 'question',
                        message_template: 'What brings you here today?',
                        data_field: 'need_type',
                        options: [
                            { label: '🛍️ Browse Products', value: 'products', next_node_id: 'ask_category' },
                            { label: '💰 Get Pricing', value: 'pricing', next_node_id: 'ask_budget' },
                            { label: '❓ Support', value: 'support', next_node_id: 'assign_support' },
                            { label: '📦 Track Order', value: 'track', next_node_id: 'ask_order_id' },
                        ],
                    },
                },
                {
                    id: 'ask_category',
                    type: 'question',
                    name: 'Ask Category',
                    config: {
                        type: 'question',
                        message_template: 'What category are you interested in?',
                        data_field: 'interest_category',
                        options: [
                            { label: '📱 Electronics', value: 'electronics', next_node_id: 'show_products' },
                            { label: '👕 Fashion', value: 'fashion', next_node_id: 'show_products' },
                            { label: '🏠 Home & Living', value: 'home', next_node_id: 'show_products' },
                            { label: '🔍 Search', value: 'search', next_node_id: 'product_search' },
                        ],
                    },
                },
                {
                    id: 'product_search',
                    type: 'product_search',
                    name: 'Product Search',
                    config: {
                        type: 'product_search',
                        message_template: '🔍 What are you looking for? Type a keyword:',
                        max_results: 5,
                        next_node_id: 'show_products',
                        no_results_message: 'No products found. Try a different search term.',
                        no_results_node_id: 'product_search',
                    },
                },
                {
                    id: 'show_products',
                    type: 'product_carousel',
                    name: 'Show Products',
                    config: {
                        type: 'product_carousel',
                        source: 'search_results',
                        max_products: 5,
                        next_node_id: 'ask_quantity',
                    },
                },
                {
                    id: 'ask_quantity',
                    type: 'add_to_cart',
                    name: 'Add to Cart',
                    config: {
                        type: 'add_to_cart',
                        product_source: 'selected',
                        ask_quantity: true,
                        quantity_message: 'How many would you like?',
                        success_message: '✅ Added to cart!',
                        next_node_id: 'show_cart',
                    },
                },
                {
                    id: 'show_cart',
                    type: 'show_cart',
                    name: 'Show Cart',
                    config: {
                        type: 'show_cart',
                        show_checkout_button: true,
                        checkout_node_id: 'checkout',
                        continue_shopping_node_id: 'ask_category',
                        empty_cart_node_id: 'ask_category',
                    },
                },
                {
                    id: 'checkout',
                    type: 'checkout',
                    name: 'Checkout',
                    config: {
                        type: 'checkout',
                        collect_name: true,
                        collect_address: true,
                        confirmation_message: 'Let\'s complete your order!',
                        next_node_id: 'end_success',
                    },
                },
                {
                    id: 'ask_budget',
                    type: 'input_capture',
                    name: 'Ask Budget',
                    config: {
                        type: 'input_capture',
                        message_template: '💰 What\'s your budget range?\n\nExample: 5000-10000',
                        data_field: 'budget',
                        next_node_id: 'ask_name',
                    },
                },
                {
                    id: 'ask_name',
                    type: 'input_capture',
                    name: 'Ask Name',
                    config: {
                        type: 'input_capture',
                        message_template: '👤 Great! What\'s your name?',
                        data_field: 'name',
                        validation: { type: 'text', min_length: 2 },
                        next_node_id: 'recommendations',
                    },
                },
                {
                    id: 'recommendations',
                    type: 'product_recommendation',
                    name: 'Show Recommendations',
                    config: {
                        type: 'product_recommendation',
                        message_template: '🌟 Based on your preferences, here are my top picks:',
                        algorithm: 'budget_based',
                        max_products: 5,
                        next_node_id: 'ask_quantity',
                    },
                },
                {
                    id: 'assign_support',
                    type: 'assign_agent',
                    name: 'Assign Support',
                    config: {
                        type: 'assign_agent',
                        message_template: '👋 Connecting you with our support team. Please wait...',
                        department: 'support',
                    },
                },
                {
                    id: 'ask_order_id',
                    type: 'input_capture',
                    name: 'Ask Order ID',
                    config: {
                        type: 'input_capture',
                        message_template: '📦 Please enter your order ID:',
                        data_field: 'order_id',
                        next_node_id: 'end_tracking',
                    },
                },
                {
                    id: 'end_tracking',
                    type: 'end',
                    name: 'End Tracking',
                    config: {
                        type: 'end',
                        message_template: '📦 Checking your order status...\n\nI\'ll connect you with our team for the latest update.',
                    },
                },
                {
                    id: 'end_success',
                    type: 'end',
                    name: 'End Success',
                    config: {
                        type: 'end',
                        message_template: '🎉 Thank you for your order!\n\nWe\'ll send you updates on WhatsApp.',
                        reset_session: true,
                    },
                },
            ],
        };

        return this.createFlow(tenantId, defaultFlow);
    }
}
