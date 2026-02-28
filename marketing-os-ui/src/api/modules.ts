import client from './client';

// Revenue API
export interface RevenueOverview {
    mrr: number;
    arr: number;
    arpu: number;
    ltv: number;
    ltvCacRatio: number;
    churnRate: number;
    activeSubscriptions: number;
    totalCustomers: number;
    trialConversion: { converted: number; total: number; rate: number };
    revenueByChannel: Array<{ channel: string; total: number; count: number }>;
    refunds: { totalRefunds: number; refundCount: number; refundRate: number };
    paymentFailures: { failedCount: number; failedAmount: number; failureRate: number };
}

export interface RevenueTrend {
    date: string;
    revenue: number;
    refunds: number;
    net: number;
}

export const revenueApi = {
    getDashboard: async (start?: string, end?: string) => {
        const params: any = {};
        if (start) params.start = start;
        if (end) params.end = end;
        const { data } = await client.get<RevenueOverview>('/revenue/dashboard', { params });
        return data;
    },
    getTrend: async (start?: string, end?: string) => {
        const { data } = await client.get<RevenueTrend[]>('/revenue/trend', { params: { start, end } });
        return data;
    },
    getMRR: async () => {
        const { data } = await client.get<{ mrr: number }>('/revenue/mrr');
        return data;
    },
    getChurn: async (start?: string, end?: string) => {
        const { data } = await client.get('/revenue/churn', { params: { start, end } });
        return data;
    },
};

// CRM API
export const crmApi = {
    getDashboard: async () => {
        const { data } = await client.get('/crm/dashboard');
        return data;
    },
    getLeads: async (filters?: { status?: string; source?: string; search?: string; limit?: number; offset?: number }) => {
        const { data } = await client.get('/crm/leads', { params: filters });
        return data;
    },
    createLead: async (lead: any) => {
        const { data } = await client.post('/crm/leads', lead);
        return data;
    },
    updateLead: async (id: string, updates: any) => {
        const { data } = await client.put(`/crm/leads/${id}`, updates);
        return data;
    },
    getStages: async () => {
        const { data } = await client.get('/crm/pipeline/stages');
        return data;
    },
    getDeals: async (stageId?: string) => {
        const { data } = await client.get('/crm/deals', { params: { stageId } });
        return data;
    },
    createDeal: async (deal: any) => {
        const { data } = await client.post('/crm/deals', deal);
        return data;
    },
    getTasks: async (filters?: { status?: string }) => {
        const { data } = await client.get('/crm/tasks', { params: filters });
        return data;
    },
    getActivities: async (leadId: string) => {
        const { data } = await client.get(`/crm/activities/${leadId}`);
        return data;
    },
};

// WhatsApp API — now lives in features/whatsapp module.
// Re-exported here for backward compatibility.
export { whatsappApi } from '../features/whatsapp';

// Automation API
export const automationApi = {
    getFlows: async () => {
        const { data } = await client.get('/automation/flows');
        return data;
    },
    getFlow: async (id: string) => {
        const { data } = await client.get(`/automation/flows/${id}`);
        return data;
    },
    createFlow: async (flow: any) => {
        const { data } = await client.post('/automation/flows', flow);
        return data;
    },
    updateFlow: async (id: string, flow: any) => {
        const { data } = await client.put(`/automation/flows/${id}`, flow);
        return data;
    },
    deleteFlow: async (id: string) => {
        const { data } = await client.delete(`/automation/flows/${id}`);
        return data;
    },
};

// Email API
export const emailApi = {
    getDashboard: async (start?: string, end?: string) => {
        const { data } = await client.get('/email/dashboard', { params: { start, end } });
        return data;
    },
    getCampaigns: async () => {
        const { data } = await client.get('/email/campaigns');
        return data;
    },
    createCampaign: async (campaign: any) => {
        const { data } = await client.post('/email/campaigns', campaign);
        return data;
    },
    sendCampaign: async (id: string) => {
        const { data } = await client.post(`/email/campaigns/${id}/send`);
        return data;
    },
    getTemplates: async () => {
        const { data } = await client.get('/email/templates');
        return data;
    },
    createTemplate: async (template: any) => {
        const { data } = await client.post('/email/templates', template);
        return data;
    },
    updateTemplate: async (id: string, updates: any) => {
        const { data } = await client.put(`/email/templates/${id}`, updates);
        return data;
    },
    deleteTemplate: async (id: string) => {
        const { data } = await client.delete(`/email/templates/${id}`);
        return data;
    },
    getDripSequences: async () => {
        const { data } = await client.get('/email/drip-sequences');
        return data;
    },
    getSettings: async () => {
        const { data } = await client.get('/email/settings');
        return data;
    },
    updateSettings: async (settings: any) => {
        const { data } = await client.put('/email/settings', settings);
        return data;
    },
    testConnection: async () => {
        const { data } = await client.post('/email/settings/test');
        return data;
    },
};

// Product Analytics API
export const productApi = {
    getDashboard: async (start?: string, end?: string) => {
        const { data } = await client.get('/product/dashboard', { params: { start, end } });
        return data;
    },
    getFeatures: async (start?: string, end?: string) => {
        const { data } = await client.get('/product/features', { params: { start, end } });
        return data;
    },
    getCohorts: async () => {
        const { data } = await client.get('/product/cohorts');
        return data;
    },
};

// AI Intelligence API
export const aiApi = {
    getDashboard: async () => {
        const { data } = await client.get('/ai/dashboard');
        return data;
    },
    getAnomalies: async () => {
        const { data } = await client.get('/ai/anomalies');
        return data;
    },
    getPredictions: async () => {
        const { data } = await client.get('/ai/predictions');
        return data;
    },
    getRecommendations: async () => {
        const { data } = await client.get('/ai/recommendations');
        return data;
    },
    getChurnRisk: async () => {
        const { data } = await client.get('/ai/churn-risk');
        return data;
    },
};

// Ads API
export const adsApi = {
    getDashboard: async () => {
        const { data } = await client.get('/ads/dashboard');
        return data;
    },
    getCampaigns: async (platform?: string) => {
        const { data } = await client.get('/ads/campaigns', { params: { platform } });
        return data;
    },
    getABTests: async () => {
        const { data } = await client.get('/ads/ab-tests');
        return data;
    },
    createABTest: async (test: any) => {
        const { data } = await client.post('/ads/ab-tests', test);
        return data;
    },
};

// Monitoring & Alerts API
export const monitoringApi = {
    getRules: async () => {
        const { data } = await client.get('/monitoring/rules');
        return data;
    },
    createRule: async (rule: any) => {
        const { data } = await client.post('/monitoring/rules', rule);
        return data;
    },
    getHistory: async () => {
        const { data } = await client.get('/monitoring/history');
        return data;
    },
    getReports: async () => {
        const { data } = await client.get('/monitoring/reports');
        return data;
    },
    getDashboards: async () => {
        const { data } = await client.get('/monitoring/dashboards');
        return data;
    },
    createReport: async (report: any) => {
        const { data } = await client.post('/monitoring/reports', report);
        return data;
    },
};

// ============================================
// LEAD MODULE API (CRM Layer)
// ============================================

export interface Lead {
    id: string;
    tenantId: string;
    phone: string;
    name?: string;
    email?: string;
    status: 'new' | 'contacted' | 'qualified' | 'interested' | 'negotiating' | 'converted' | 'lost' | 'inactive';
    source: 'whatsapp' | 'website' | 'referral' | 'social_media' | 'advertisement' | 'manual' | 'api' | 'other';
    sourceDetail?: string;
    score: number;
    collectedData?: Record<string, any>;
    tags: string[];
    assignedTo?: string;
    lastContactedAt?: string;
    totalOrders: number;
    totalSpent: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LeadFilters {
    status?: string;
    source?: string;
    minScore?: number;
    maxScore?: number;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
}

export const leadApi = {
    // CRUD
    getLeads: async (filters?: LeadFilters) => {
        const { data } = await client.get('/leads', { params: filters });
        return data;
    },
    getLead: async (id: string) => {
        const { data } = await client.get(`/leads/${id}`);
        return data;
    },
    createLead: async (lead: Partial<Lead>) => {
        const { data } = await client.post('/leads', lead);
        return data;
    },
    updateLead: async (id: string, updates: Partial<Lead>) => {
        const { data } = await client.put(`/leads/${id}`, updates);
        return data;
    },
    deleteLead: async (id: string) => {
        const { data } = await client.delete(`/leads/${id}`);
        return data;
    },

    // Status & Tags
    updateStatus: async (id: string, status: Lead['status']) => {
        const { data } = await client.put(`/leads/${id}/status`, { status });
        return data;
    },
    addTags: async (id: string, tags: string[]) => {
        const { data } = await client.post(`/leads/${id}/tags`, { tags });
        return data;
    },
    removeTags: async (id: string, tags: string[]) => {
        const { data } = await client.delete(`/leads/${id}/tags`, { data: { tags } });
        return data;
    },
    bulkAddTags: async (leadIds: string[], tags: string[]) => {
        const { data } = await client.post('/leads/bulk/tags', { leadIds, tags, action: 'add' });
        return data;
    },
    bulkRemoveTags: async (leadIds: string[], tags: string[]) => {
        const { data } = await client.post('/leads/bulk/tags', { leadIds, tags, action: 'remove' });
        return data;
    },

    // Activities
    getActivities: async (id: string) => {
        const { data } = await client.get(`/leads/${id}/activities`);
        return data;
    },

    // Statistics
    getStats: async () => {
        const { data } = await client.get('/leads/stats');
        return data;
    },
};

// ============================================
// FLOW MODULE API (Visual Flow Builder)
// ============================================

export type FlowTrigger = 'keyword' | 'first_message' | 'manual' | 'webhook' | 'schedule' | 'event';
export type FlowNodeType =
    | 'message' | 'question' | 'buttons' | 'list' | 'input_capture'
    | 'condition' | 'delay' | 'product_catalog' | 'product_list'
    | 'product_detail' | 'add_to_cart' | 'show_cart' | 'checkout'
    | 'assign_agent' | 'update_lead' | 'trigger_automation' | 'api_call' | 'end';

export interface FlowNode {
    id: string;
    type: FlowNodeType;
    data: Record<string, any>;
    nextNodeId?: string;
    position?: { x: number; y: number };
}

export interface Flow {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    trigger: FlowTrigger;
    triggerValue?: string;
    nodes: FlowNode[];
    startNodeId?: string;
    isActive: boolean;
    version: number;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface FlowSession {
    id: string;
    flowId: string;
    phone: string;
    leadId?: string;
    currentNodeId?: string;
    status: 'active' | 'completed' | 'abandoned' | 'error';
    context: Record<string, any>;
    cart: Array<{ productId: string; quantity: number; price: number }>;
    startedAt: string;
    completedAt?: string;
}

export const flowApi = {
    // Flow CRUD
    getFlows: async (filters?: { isActive?: boolean; trigger?: FlowTrigger }) => {
        const { data } = await client.get('/flows', { params: filters });
        return data;
    },
    getFlow: async (id: string) => {
        const { data } = await client.get(`/flows/${id}`);
        return data;
    },
    createFlow: async (flow: Partial<Flow>) => {
        const { data } = await client.post('/flows', flow);
        return data;
    },
    updateFlow: async (id: string, updates: Partial<Flow>) => {
        const { data } = await client.put(`/flows/${id}`, updates);
        return data;
    },
    deleteFlow: async (id: string) => {
        const { data } = await client.delete(`/flows/${id}`);
        return data;
    },

    // Flow Actions
    activateFlow: async (id: string) => {
        const { data } = await client.post(`/flows/${id}/activate`);
        return data;
    },
    deactivateFlow: async (id: string) => {
        const { data } = await client.post(`/flows/${id}/deactivate`);
        return data;
    },
    duplicateFlow: async (id: string, newName: string) => {
        const { data } = await client.post(`/flows/${id}/duplicate`, { newName });
        return data;
    },

    // Flow Execution
    triggerFlow: async (flowId: string, phone: string, context?: Record<string, any>) => {
        const { data } = await client.post('/flows/trigger', { flowId, phone, context });
        return data;
    },
    getSession: async (sessionId: string) => {
        const { data } = await client.get(`/flows/sessions/${sessionId}`);
        return data;
    },
    sendInput: async (sessionId: string, input: string) => {
        const { data } = await client.post(`/flows/sessions/${sessionId}/input`, { input });
        return data;
    },

    // Analytics
    getFlowAnalytics: async (flowId: string, startDate?: string, endDate?: string) => {
        const { data } = await client.get(`/flows/${flowId}/analytics`, { params: { startDate, endDate } });
        return data;
    },

    // Templates
    createDefaultQualificationFlow: async () => {
        const { data } = await client.post('/flows/templates/qualification');
        return data;
    },
};

// ============================================
// AUTOMATION MODULE API (Smart Rules)
// ============================================

export type AutomationTriggerType =
    | 'no_reply' | 'cart_abandoned' | 'payment_pending' | 'order_completed'
    | 'scheduled' | 'lead_score_changed' | 'status_changed' | 'tag_added'
    | 'flow_completed' | 'custom';

export type AutomationActionType =
    | 'send_message' | 'send_template' | 'trigger_flow' | 'assign_agent'
    | 'update_lead_status' | 'update_lead_score' | 'add_tag' | 'remove_tag'
    | 'webhook' | 'create_task';

export interface AutomationCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists';
    value: any;
}

export interface AutomationAction {
    type: AutomationActionType;
    config: Record<string, any>;
    delayMinutes?: number;
}

export interface AutomationRule {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    triggerType: AutomationTriggerType;
    triggerConfig: Record<string, any>;
    conditions?: AutomationCondition[];
    actions: AutomationAction[];
    isActive: boolean;
    priority: number;
    cooldownMinutes: number;
    maxExecutionsPerLead?: number;
    totalExecutions: number;
    lastExecutedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AutomationExecution {
    id: string;
    ruleId: string;
    leadId?: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    triggerData?: Record<string, any>;
    actionsExecuted?: Array<{ action: AutomationAction; result: any; executedAt: string }>;
    error?: string;
    scheduledFor?: string;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
}

export const smartAutomationApi = {
    // Rule CRUD
    getRules: async (filters?: { isActive?: boolean; triggerType?: AutomationTriggerType }) => {
        const { data } = await client.get('/automation/rules', { params: filters });
        return data;
    },
    getRule: async (id: string) => {
        const { data } = await client.get(`/automation/rules/${id}`);
        return data;
    },
    createRule: async (rule: Partial<AutomationRule>) => {
        const { data } = await client.post('/automation/rules', rule);
        return data;
    },
    updateRule: async (id: string, updates: Partial<AutomationRule>) => {
        const { data } = await client.put(`/automation/rules/${id}`, updates);
        return data;
    },
    deleteRule: async (id: string) => {
        const { data } = await client.delete(`/automation/rules/${id}`);
        return data;
    },

    // Rule Actions
    activateRule: async (id: string) => {
        const { data } = await client.post(`/automation/rules/${id}/activate`);
        return data;
    },
    deactivateRule: async (id: string) => {
        const { data } = await client.post(`/automation/rules/${id}/deactivate`);
        return data;
    },

    // Executions
    getExecution: async (id: string) => {
        const { data } = await client.get(`/automation/executions/${id}`);
        return data;
    },

    // Statistics
    getStats: async () => {
        const { data } = await client.get('/automation/stats');
        return data;
    },

    // Templates
    createDefaultRules: async () => {
        const { data } = await client.post('/automation/templates/defaults');
        return data;
    },
};

// ============================================
// RECOMMENDATION MODULE API
// ============================================

export type RecommendationStrategy =
    | 'interest_based' | 'budget_based' | 'popularity' | 'similar_products'
    | 'past_purchases' | 'cart_based' | 'trending' | 'new_arrivals'
    | 'complementary' | 'upsell' | 'cross_sell';

export type ProductInteractionType = 'view' | 'add_to_cart' | 'remove_from_cart' | 'purchase' | 'wishlist' | 'share' | 'inquiry';

export interface RecommendedProduct {
    productId: string;
    product?: {
        id: string;
        name: string;
        description?: string;
        price: number;
        category?: string;
        imageUrl?: string;
        stock?: number;
    };
    score: number;
    reason: string;
    matchFactors: string[];
}

export interface RecommendationResult {
    products: RecommendedProduct[];
    strategy: RecommendationStrategy;
    confidence: number;
    metadata?: {
        totalCandidates: number;
        processingTime: number;
        factors: string[];
    };
}

export interface LeadPreferences {
    interests: string[];
    categories: string[];
    priceRange: { min: number; max: number };
    preferredBrands?: string[];
    viewedProducts: string[];
    purchasedProducts: string[];
}

export const recommendationApi = {
    // Recommendations
    getRecommendations: async (params: {
        strategy?: RecommendationStrategy;
        leadId?: string;
        phone?: string;
        productId?: string;
        category?: string;
        budget?: number;
        interests?: string[];
        limit?: number;
    }) => {
        const { data } = await client.get('/recommendations', { params });
        return data;
    },
    getPersonalized: async (leadId: string, options?: { limit?: number; exclude?: string[] }) => {
        const params = options?.exclude ? { ...options, exclude: options.exclude.join(',') } : options;
        const { data } = await client.get(`/recommendations/personalized/${leadId}`, { params });
        return data;
    },
    getSimilar: async (productId: string, limit?: number) => {
        const { data } = await client.get(`/recommendations/similar/${productId}`, { params: { limit } });
        return data;
    },
    getCartBased: async (productIds: string[], limit?: number) => {
        const { data } = await client.post('/recommendations/cart', { productIds, limit });
        return data;
    },
    getUpsell: async (productId: string, limit?: number) => {
        const { data } = await client.get(`/recommendations/upsell/${productId}`, { params: { limit } });
        return data;
    },
    getTrending: async (options?: { category?: string; limit?: number }) => {
        const { data } = await client.get('/recommendations/trending', { params: options });
        return data;
    },

    // Interaction Tracking
    trackInteraction: async (interaction: {
        productId: string;
        interactionType: ProductInteractionType;
        leadId?: string;
        phone?: string;
        sessionId?: string;
        metadata?: Record<string, any>;
    }) => {
        const { data } = await client.post('/recommendations/track', interaction);
        return data;
    },
    trackView: async (productId: string, options?: { leadId?: string; phone?: string }) => {
        const { data } = await client.post('/recommendations/track/view', { productId, ...options });
        return data;
    },
    trackAddToCart: async (productId: string, options?: { leadId?: string; phone?: string; quantity?: number }) => {
        const { data } = await client.post('/recommendations/track/cart', { productId, ...options });
        return data;
    },
    trackPurchase: async (productId: string, options?: { leadId?: string; phone?: string; quantity?: number; price?: number }) => {
        const { data } = await client.post('/recommendations/track/purchase', { productId, ...options });
        return data;
    },

    // Analytics
    getPopular: async (options?: { since?: string; limit?: number }) => {
        const { data } = await client.get('/recommendations/analytics/popular', { params: options });
        return data;
    },
    getConversionStats: async (productId: string) => {
        const { data } = await client.get(`/recommendations/analytics/conversion/${productId}`);
        return data;
    },
    getFrequentlyBoughtTogether: async (productId: string, limit?: number) => {
        const { data } = await client.get(`/recommendations/analytics/bought-together/${productId}`, { params: { limit } });
        return data;
    },

    // Lead Preferences
    getLeadPreferences: async (leadId: string) => {
        const { data } = await client.get(`/recommendations/preferences/${leadId}`);
        return data;
    },
    updateLeadInterests: async (leadId: string, interests: string[]) => {
        const { data } = await client.put(`/recommendations/preferences/${leadId}/interests`, { interests });
        return data;
    },
    updateLeadBudget: async (leadId: string, min: number, max: number) => {
        const { data } = await client.put(`/recommendations/preferences/${leadId}/budget`, { min, max });
        return data;
    },
};

// ============================================
// WhatsApp Store Automation API
// ============================================

export const storeApi = {
    // Products
    getProducts: async (filters?: { category?: string; enabled?: string; featured?: string }) => {
        const { data } = await client.get('/store/products', { params: filters });
        return data;
    },
    getProduct: async (id: string) => {
        const { data } = await client.get(`/store/products/${id}`);
        return data;
    },
    createProduct: async (product: any) => {
        const { data } = await client.post('/store/products', product);
        return data;
    },
    updateProduct: async (id: string, product: any) => {
        const { data } = await client.put(`/store/products/${id}`, product);
        return data;
    },
    deleteProduct: async (id: string) => {
        const { data } = await client.delete(`/store/products/${id}`);
        return data;
    },

    // Orders
    getOrders: async (filters?: { status?: string; payment_status?: string; limit?: number; offset?: number }) => {
        const { data } = await client.get('/store/orders', { params: filters });
        return data;
    },
    getOrder: async (id: string) => {
        const { data } = await client.get(`/store/orders/${id}`);
        return data;
    },
    updateOrderStatus: async (id: string, status: string) => {
        const { data } = await client.put(`/store/orders/${id}/status`, { status });
        return data;
    },
    confirmPayment: async (id: string) => {
        const { data } = await client.post(`/store/orders/${id}/confirm-payment`);
        return data;
    },

    // Settings
    getSettings: async () => {
        const { data } = await client.get('/store/settings');
        return data;
    },
    updateSettings: async (settings: any) => {
        const { data } = await client.put('/store/settings', settings);
        return data;
    },

    // Analytics
    getAnalytics: async () => {
        const { data } = await client.get('/store/analytics');
        return data;
    },
};
