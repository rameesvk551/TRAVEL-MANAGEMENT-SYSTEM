/**
 * Enhanced Store ChatBot - Integrated with Flow Engine, Lead Module, and Recommendations
 * 
 * This extends the base StoreChatBot with:
 * - Auto lead creation from WhatsApp conversations
 * - Visual flow execution for automated conversations
 * - Smart product recommendations
 * - Automation rule triggers
 */

import { StoreChatBot, SessionData, BotReply, ChatState } from './store.chatbot.js';
import { WhatsAppStoreService } from './WhatsAppStoreService.js';
import { StoreSettings } from '../database/models/StoreSettings.js';

// Module imports
import { LeadService } from '../lead/lead.service.js';
import { FlowEngine } from '../flow/flow.engine.js';
import { FlowRepository } from '../flow/flow.repository.js';
import { AutomationEngine } from '../automation/automation.engine.js';
import { RecommendationService } from '../recommendation/recommendation.service.js';
import { LeadStatus, LeadSource } from '../lead/lead.types.js';
import { FlowTrigger } from '../flow/flow.types.js';

// ============================================
// ENHANCED SESSION DATA
// ============================================

export interface EnhancedSessionData extends SessionData {
    leadId?: string;
    flowSessionId?: string;
    isInFlow?: boolean;
    collectedData?: Record<string, any>;
    interests?: string[];
    budget?: number;
    lastRecommendations?: string[];
}

// ============================================
// ENHANCED BOT REPLY
// ============================================

export interface EnhancedBotReply extends BotReply {
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'document';
    buttons?: Array<{ id: string; title: string }>;
    listSections?: Array<{
        title: string;
        rows: Array<{ id: string; title: string; description?: string }>;
    }>;
    followUp?: {
        delay: number;
        message: string;
    };
}

// ============================================
// ENHANCED STORE CHATBOT
// ============================================

export class EnhancedStoreChatBot extends StoreChatBot {
    private enhancedSessions: Map<string, EnhancedSessionData> = new Map();

    constructor(
        storeService: WhatsAppStoreService,
        private leadService: LeadService,
        private flowEngine: FlowEngine,
        private flowRepository: FlowRepository,
        private automationEngine: AutomationEngine,
        private recommendationService: RecommendationService
    ) {
        super(storeService);
    }

    // ============================================
    // ENHANCED MESSAGE PROCESSING
    // ============================================

    async processMessageEnhanced(
        tenantId: string,
        phone: string,
        messageText: string,
        settings: StoreSettings,
        messageMetadata?: {
            name?: string;
            profilePicUrl?: string;
            messageId?: string;
        }
    ): Promise<EnhancedBotReply | null> {
        // Step 1: Find or create lead
        const lead = await this.findOrCreateLead(tenantId, phone, messageMetadata);
        
        // Get or create enhanced session
        const session = this.getOrCreateEnhancedSession(tenantId, phone, lead.id);

        // If human takeover is active, skip bot
        if (session.isHumanTakeover) {
            return null;
        }

        // Update last activity
        session.lastActivityAt = Date.now();
        const text = messageText.trim().toLowerCase();

        // Step 2: Check if currently in a flow
        if (session.isInFlow && session.flowSessionId) {
            const flowReply = await this.processFlowInput(
                tenantId,
                phone,
                messageText,
                session
            );
            if (flowReply) return flowReply;
        }

        // Step 3: Check for flow keyword triggers
        const flowReply = await this.checkFlowKeywords(tenantId, text, phone, session);
        if (flowReply) return flowReply;

        // Step 4: Check enhanced keywords
        const enhancedReply = await this.checkEnhancedKeywords(
            tenantId,
            phone,
            text,
            session,
            settings
        );
        if (enhancedReply) return enhancedReply;

        // Step 5: Fall back to base chatbot processing
        const baseReply = await super.processMessage(tenantId, phone, messageText, settings);
        
        // Step 6: Trigger automations based on conversation
        await this.triggerConversationAutomations(tenantId, lead.id, session, text);

        return baseReply as EnhancedBotReply | null;
    }

    // ============================================
    // LEAD MANAGEMENT
    // ============================================

    private async findOrCreateLead(
        tenantId: string,
        phone: string,
        metadata?: {
            name?: string;
            profilePicUrl?: string;
        }
    ): Promise<{ id: string }> {
        const lead = await this.leadService.findOrCreateFromWhatsApp(tenantId, phone, {
            name: metadata?.name,
            source: LeadSource.WHATSAPP,
            sourceDetail: 'store_chatbot',
        });

        return { id: lead.id };
    }

    private getOrCreateEnhancedSession(
        tenantId: string,
        phone: string,
        leadId: string
    ): EnhancedSessionData {
        const key = `${tenantId}:${phone}`;
        let session = this.enhancedSessions.get(key);

        if (!session) {
            session = {
                state: 'idle' as ChatState,
                lastActivityAt: Date.now(),
                cartItems: [],
                leadId,
                collectedData: {},
            };
            this.enhancedSessions.set(key, session);
        } else {
            session.leadId = leadId;
        }

        return session;
    }

    // ============================================
    // FLOW ENGINE INTEGRATION
    // ============================================

    private async checkFlowKeywords(
        tenantId: string,
        text: string,
        phone: string,
        session: EnhancedSessionData
    ): Promise<EnhancedBotReply | null> {
        // Find flows that trigger on this keyword
        const flow = await this.flowRepository.findByKeyword(tenantId, text);

        if (flow) {
            return this.startFlow(tenantId, phone, flow.id, session);
        }

        return null;
    }

    private async startFlow(
        tenantId: string,
        phone: string,
        flowId: string,
        session: EnhancedSessionData
    ): Promise<EnhancedBotReply | null> {
        try {
            const result = await this.flowEngine.startFlow(tenantId, flowId, phone, {
                leadId: session.leadId,
            });

            if (result.sessionId) {
                session.flowSessionId = result.sessionId;
                session.isInFlow = true;
            }

            return this.convertFlowResult(result);
        } catch (error) {
            console.error('Error starting flow:', error);
            return null;
        }
    }

    private async processFlowInput(
        tenantId: string,
        phone: string,
        input: string,
        session: EnhancedSessionData
    ): Promise<EnhancedBotReply | null> {
        if (!session.flowSessionId) return null;

        try {
            const result = await this.flowEngine.processInput(
                tenantId,
                session.flowSessionId,
                input
            );

            // Check if flow completed
            if (result.completed) {
                session.isInFlow = false;
                session.flowSessionId = undefined;

                // Process collected data
                if (result.context) {
                    await this.processCollectedData(tenantId, session, result.context);
                }
            }

            return this.convertFlowResult(result);
        } catch (error) {
            console.error('Error processing flow input:', error);
            session.isInFlow = false;
            return null;
        }
    }

    private convertFlowResult(result: any): EnhancedBotReply | null {
        if (!result.messages?.length) return null;

        // Convert flow messages to bot reply
        const firstMessage = result.messages[0];
        const reply: EnhancedBotReply = {
            text: firstMessage.content || '',
        };

        // Handle media
        if (firstMessage.mediaUrl) {
            reply.mediaUrl = firstMessage.mediaUrl;
            reply.mediaType = firstMessage.mediaType;
        }

        // Handle buttons
        if (firstMessage.buttons?.length) {
            reply.buttons = firstMessage.buttons;
            reply.options = firstMessage.buttons.map((b: any) => b.title);
        }

        // Handle list sections
        if (firstMessage.listSections?.length) {
            reply.listSections = firstMessage.listSections;
        }

        return reply;
    }

    private async processCollectedData(
        tenantId: string,
        session: EnhancedSessionData,
        context: Record<string, any>
    ): Promise<void> {
        if (!session.leadId) return;

        // Extract and save lead data
        const dataToCapture: Record<string, any> = {};

        if (context.name) dataToCapture.name = context.name;
        if (context.email) dataToCapture.email = context.email;
        if (context.budget) {
            dataToCapture.budget = context.budget;
            session.budget = context.budget;
        }
        if (context.interests) {
            dataToCapture.interests = context.interests;
            session.interests = context.interests;
        }

        if (Object.keys(dataToCapture).length > 0) {
            await this.leadService.captureData(tenantId, session.leadId, dataToCapture);
        }
    }

    // ============================================
    // ENHANCED KEYWORDS
    // ============================================

    private async checkEnhancedKeywords(
        tenantId: string,
        phone: string,
        text: string,
        session: EnhancedSessionData,
        settings: StoreSettings
    ): Promise<EnhancedBotReply | null> {
        // Recommendations keyword
        if (['recommend', 'suggest', 'what should i buy', 'suggestions'].some(kw => text.includes(kw))) {
            return this.showRecommendations(tenantId, session);
        }

        // Similar products
        if (text.includes('similar') && session.selectedProductId) {
            return this.showSimilarProducts(tenantId, session.selectedProductId);
        }

        // Trending products
        if (['trending', 'popular', 'best seller', 'bestseller'].some(kw => text.includes(kw))) {
            return this.showTrendingProducts(tenantId);
        }

        // Budget-based
        const budgetMatch = text.match(/under\s*₹?(\d+)|budget\s*₹?(\d+)|below\s*₹?(\d+)/);
        if (budgetMatch) {
            const budget = parseInt(budgetMatch[1] || budgetMatch[2] || budgetMatch[3], 10);
            session.budget = budget;
            return this.showBudgetProducts(tenantId, budget, session);
        }

        return null;
    }

    // ============================================
    // RECOMMENDATION INTEGRATION
    // ============================================

    private async showRecommendations(
        tenantId: string,
        session: EnhancedSessionData
    ): Promise<EnhancedBotReply> {
        const result = await this.recommendationService.getPersonalizedRecommendations(
            tenantId,
            session.leadId!,
            {
                limit: 5,
                excludeProductIds: session.lastRecommendations,
            }
        );

        if (!result.products.length) {
            return {
                text: '🤔 I don\'t have enough information to make personalized recommendations yet.\n\nTry browsing our *catalog* or tell me what you\'re interested in!',
            };
        }

        const lines = [
            '✨ *Recommended for You*',
            '',
        ];

        result.products.forEach((rec, i) => {
            lines.push(
                `${i + 1}. *${rec.product?.name}* — ₹${rec.product?.price}`,
                `   _${rec.reason}_`,
                ''
            );
        });

        lines.push('_Reply with a number to view details_');

        session.lastRecommendations = result.products.map(r => r.productId);

        return {
            text: lines.join('\n'),
            options: result.products.map(r => r.product?.name || ''),
        };
    }

    private async showSimilarProducts(
        tenantId: string,
        productId: string
    ): Promise<EnhancedBotReply> {
        const result = await this.recommendationService.getSimilarProducts(
            tenantId,
            productId,
            5
        );

        if (!result.products.length) {
            return { text: 'No similar products found. Try browsing our *catalog*!' };
        }

        const lines = [
            '🔍 *Similar Products*',
            '',
        ];

        result.products.forEach((rec, i) => {
            lines.push(
                `${i + 1}. *${rec.product?.name}* — ₹${rec.product?.price}`
            );
        });

        lines.push('', '_Reply with a number to view details_');

        return { text: lines.join('\n') };
    }

    private async showTrendingProducts(tenantId: string): Promise<EnhancedBotReply> {
        const result = await this.recommendationService.getTrendingProducts(tenantId, {
            limit: 5,
        });

        if (!result.products.length) {
            return { text: '📈 No trending products yet. Try browsing our *catalog*!' };
        }

        const lines = [
            '🔥 *Trending This Week*',
            '',
        ];

        result.products.forEach((rec, i) => {
            lines.push(
                `${i + 1}. *${rec.product?.name}* — ₹${rec.product?.price}`
            );
        });

        lines.push('', '_Reply with a number to view details_');

        return { text: lines.join('\n') };
    }

    private async showBudgetProducts(
        tenantId: string,
        budget: number,
        session: EnhancedSessionData
    ): Promise<EnhancedBotReply> {
        const result = await this.recommendationService.getRecommendations(tenantId, {
            strategy: 'budget_based' as any,
            leadId: session.leadId,
            budget,
            limit: 5,
        });

        if (!result.products.length) {
            return {
                text: `😔 No products found under ₹${budget}. Try a higher budget or browse our *catalog*!`,
            };
        }

        const lines = [
            `💰 *Products Under ₹${budget}*`,
            '',
        ];

        result.products.forEach((rec, i) => {
            lines.push(
                `${i + 1}. *${rec.product?.name}* — ₹${rec.product?.price}`
            );
        });

        lines.push('', '_Reply with a number to view details_');

        // Update lead budget preference
        if (session.leadId) {
            await this.recommendationService.updateLeadBudget(
                tenantId,
                session.leadId,
                0,
                budget
            );
        }

        return { text: lines.join('\n') };
    }

    // ============================================
    // CART RECOMMENDATIONS
    // ============================================

    async getCartRecommendations(
        tenantId: string,
        session: EnhancedSessionData
    ): Promise<EnhancedBotReply | null> {
        if (!session.cartItems?.length) return null;

        const cartProductIds = session.cartItems.map(item => item.product_id);
        const result = await this.recommendationService.getCartRecommendations(
            tenantId,
            cartProductIds,
            3
        );

        if (!result.products.length) return null;

        const lines = [
            '💡 *You might also like:*',
            '',
        ];

        result.products.forEach((rec, i) => {
            lines.push(`• ${rec.product?.name} — ₹${rec.product?.price}`);
        });

        return { text: lines.join('\n') };
    }

    // ============================================
    // AUTOMATION TRIGGERS
    // ============================================

    private async triggerConversationAutomations(
        tenantId: string,
        leadId: string,
        session: EnhancedSessionData,
        message: string
    ): Promise<void> {
        try {
            // Check for message received triggers
            await this.automationEngine.checkTriggersForLead(tenantId, leadId, {
                triggerType: 'message_received',
                context: {
                    message,
                    state: session.state,
                    cartItems: session.cartItems?.length || 0,
                },
            });
        } catch (error) {
            console.error('Error triggering automations:', error);
        }
    }

    // ============================================
    // PRODUCT INTERACTION TRACKING
    // ============================================

    async trackProductView(
        tenantId: string,
        productId: string,
        session: EnhancedSessionData
    ): Promise<void> {
        if (session.leadId) {
            await this.recommendationService.trackView(tenantId, productId, {
                leadId: session.leadId,
            });
        }
    }

    async trackAddToCart(
        tenantId: string,
        productId: string,
        quantity: number,
        session: EnhancedSessionData
    ): Promise<void> {
        if (session.leadId) {
            await this.recommendationService.trackAddToCart(tenantId, productId, {
                leadId: session.leadId,
                quantity,
            });
        }
    }

    // ============================================
    // QUALIFICATION FLOW TRIGGER
    // ============================================

    async startQualificationFlow(
        tenantId: string,
        phone: string
    ): Promise<EnhancedBotReply | null> {
        const session = this.enhancedSessions.get(`${tenantId}:${phone}`);
        if (!session) return null;

        // Find qualification flow
        const flow = await this.flowRepository.findByTrigger(
            tenantId,
            FlowTrigger.FIRST_MESSAGE
        );

        if (!flow) return null;

        return this.startFlow(tenantId, phone, flow.id, session);
    }

    // ============================================
    // ABANDONED CART HANDLING
    // ============================================

    getAbandonedCartSessions(
        abandonedAfterMs: number = 30 * 60 * 1000
    ): Array<{
        tenantId: string;
        phone: string;
        session: EnhancedSessionData;
    }> {
        const now = Date.now();
        const results: Array<{
            tenantId: string;
            phone: string;
            session: EnhancedSessionData;
        }> = [];

        for (const [key, session] of this.enhancedSessions.entries()) {
            const [tenantId, phone] = key.split(':');

            if (
                !session.isHumanTakeover &&
                session.cartItems?.length &&
                session.state !== 'completed' &&
                now - session.lastActivityAt > abandonedAfterMs
            ) {
                results.push({ tenantId, phone, session });
            }
        }

        return results;
    }

    // ============================================
    // SESSION CLEANUP WITH LEAD UPDATE
    // ============================================

    async resetSessionEnhanced(
        tenantId: string,
        phone: string,
        updateLeadStatus?: LeadStatus
    ): Promise<void> {
        const session = this.enhancedSessions.get(`${tenantId}:${phone}`);

        if (session?.leadId && updateLeadStatus) {
            await this.leadService.updateLeadStatus(tenantId, session.leadId, updateLeadStatus);
        }

        this.enhancedSessions.delete(`${tenantId}:${phone}`);
        this.resetSession(tenantId, phone);
    }
}
