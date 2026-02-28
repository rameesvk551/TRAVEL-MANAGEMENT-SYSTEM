// application/store/services/StoreChatBot.ts
// Conversational state machine for WhatsApp Store automation
// Handles: catalog browsing, checkout flow, order status, payment follow-up

import { WhatsAppStoreService } from './store.service.js';
import { StoreSettingsModel as StoreSettings } from '../../database/models/StoreSettings.js';

export type ChatState =
    | 'idle'
    | 'browsing_categories'
    | 'browsing_products'
    | 'viewing_product'
    | 'collecting_quantity'
    | 'collecting_name'
    | 'collecting_address'
    | 'confirming_order'
    | 'awaiting_payment'
    | 'completed';

export interface SessionData {
    state: ChatState;
    selectedCategory?: string;
    selectedProductId?: string;
    selectedProductName?: string;
    selectedProductPrice?: number;
    quantity?: number;
    customerName?: string;
    deliveryAddress?: string;
    cartItems?: Array<{ product_id: string; name: string; price: number; quantity: number }>;
    orderId?: string;
    isHumanTakeover?: boolean;
    lastActivityAt: number;
}

export interface BotReply {
    text: string;
    options?: string[];
}

export class StoreChatBot {
    private sessions: Map<string, SessionData> = new Map();

    constructor(
        private storeService: WhatsAppStoreService,
    ) { }

    // Build a session key from tenant + phone
    private sessionKey(tenantId: string, phone: string): string {
        return `${tenantId}:${phone}`;
    }

    getSession(tenantId: string, phone: string): SessionData | undefined {
        return this.sessions.get(this.sessionKey(tenantId, phone));
    }

    resetSession(tenantId: string, phone: string): void {
        this.sessions.delete(this.sessionKey(tenantId, phone));
    }

    setHumanTakeover(tenantId: string, phone: string, active: boolean): void {
        const key = this.sessionKey(tenantId, phone);
        const session = this.sessions.get(key);
        if (session) {
            session.isHumanTakeover = active;
        }
    }

    /**
     * Process an incoming message and return the bot's reply.
     * Returns null if human takeover is active.
     */
    async processMessage(
        tenantId: string,
        phone: string,
        messageText: string,
        settings: StoreSettings,
    ): Promise<BotReply | null> {
        const key = this.sessionKey(tenantId, phone);
        let session = this.sessions.get(key);

        // Create new session if none exists
        if (!session) {
            session = { state: 'idle', lastActivityAt: Date.now(), cartItems: [] };
            this.sessions.set(key, session);
        }

        // If human agent has taken over, don't respond
        if (session.isHumanTakeover) {
            return null;
        }

        session.lastActivityAt = Date.now();
        const text = messageText.trim().toLowerCase();

        // Check for keyword triggers
        const catalogKeywords = settings.auto_keywords?.catalog || ['hi', 'hello', 'catalog', 'menu'];
        const statusKeywords = settings.auto_keywords?.status || ['status', 'my order'];

        if (catalogKeywords.some((kw: string) => text === kw || text.includes(kw))) {
            return this.showCategories(tenantId, session, settings);
        }

        if (statusKeywords.some((kw: string) => text === kw || text.includes(kw))) {
            return this.showOrderStatus(tenantId, phone);
        }

        // Route by current state
        switch (session.state) {
            case 'idle':
                return this.handleIdle(settings);

            case 'browsing_categories':
                return this.handleCategorySelection(tenantId, session, text);

            case 'browsing_products':
                return this.handleProductSelection(tenantId, session, text);

            case 'viewing_product':
            case 'collecting_quantity':
                return this.handleQuantity(session, text);

            case 'collecting_name':
                return this.handleName(session, text);

            case 'collecting_address':
                return this.handleAddress(session, text);

            case 'confirming_order':
                return this.handleOrderConfirmation(tenantId, phone, session, text, settings);

            case 'awaiting_payment':
                return this.handlePaymentResponse(tenantId, session, text);

            default:
                return this.handleIdle(settings);
        }
    }

    private handleIdle(settings: StoreSettings): BotReply {
        return {
            text: settings.welcome_message || 'Welcome! Type "catalog" to browse our products.',
        };
    }

    private async showCategories(tenantId: string, session: SessionData, settings: StoreSettings): Promise<BotReply> {
        const categories = await this.storeService.getCategories(tenantId);

        if (categories.length === 0) {
            return { text: 'Our store is being set up. Please check back later! 🏗️' };
        }

        session.state = 'browsing_categories';

        const lines = ['🛍️ *Welcome to our store!*', '', 'Choose a category:'];
        categories.forEach((cat, i) => {
            lines.push(`${i + 1}. ${cat}`);
        });
        lines.push('', '_Reply with a number to browse_');

        return { text: lines.join('\n'), options: categories };
    }

    private async handleCategorySelection(tenantId: string, session: SessionData, text: string): Promise<BotReply> {
        const categories = await this.storeService.getCategories(tenantId);
        const index = parseInt(text, 10) - 1;

        if (isNaN(index) || index < 0 || index >= categories.length) {
            // Try matching category name
            const match = categories.find(c => c.toLowerCase() === text);
            if (!match) {
                return { text: `Please enter a valid number (1-${categories.length}) to select a category.` };
            }
            session.selectedCategory = match;
        } else {
            session.selectedCategory = categories[index];
        }

        return this.showProductsInCategory(tenantId, session);
    }

    private async showProductsInCategory(tenantId: string, session: SessionData): Promise<BotReply> {
        const products = await this.storeService.getProductsByCategory(tenantId, session.selectedCategory!);

        if (products.length === 0) {
            session.state = 'browsing_categories';
            return { text: 'No products in this category yet. Try another category!' };
        }

        session.state = 'browsing_products';

        const lines = [`📦 *${session.selectedCategory}*`, ''];
        products.forEach((p, i) => {
            const featured = p.is_featured ? ' ⭐' : '';
            lines.push(`${i + 1}. ${p.name} — ₹${p.price}${featured}`);
            if (p.description) lines.push(`   _${p.description.substring(0, 60)}_`);
        });
        lines.push('', '_Reply with a number to view details_');
        lines.push('_Type "back" for categories_');

        return { text: lines.join('\n') };
    }

    private async handleProductSelection(tenantId: string, session: SessionData, text: string): Promise<BotReply> {
        if (text === 'back') {
            const settings = await this.storeService.getSettings(tenantId);
            return this.showCategories(tenantId, session, settings);
        }

        const products = await this.storeService.getProductsByCategory(tenantId, session.selectedCategory!);
        const index = parseInt(text, 10) - 1;

        if (isNaN(index) || index < 0 || index >= products.length) {
            return { text: `Please enter a valid number (1-${products.length}).` };
        }

        const product = products[index];
        session.selectedProductId = product.id;
        session.selectedProductName = product.name;
        session.selectedProductPrice = Number(product.price);
        session.state = 'collecting_quantity';

        const lines = [
            `🔍 *${product.name}*`,
            '',
            product.description || '',
            '',
            `💰 Price: ₹${product.price}`,
            product.is_featured ? '⭐ Featured Product' : '',
            '',
            '📝 *How many would you like to order?*',
            '_Reply with a number or type "back" for product list_',
        ].filter(Boolean);

        return { text: lines.join('\n') };
    }

    private handleQuantity(session: SessionData, text: string): BotReply {
        if (text === 'back') {
            session.state = 'browsing_products';
            return { text: 'Enter a product number to view details.' };
        }

        const qty = parseInt(text, 10);
        if (isNaN(qty) || qty < 1 || qty > 99) {
            return { text: 'Please enter a valid quantity (1-99).' };
        }

        session.quantity = qty;

        // Add to cart
        if (!session.cartItems) session.cartItems = [];
        session.cartItems.push({
            product_id: session.selectedProductId!,
            name: session.selectedProductName!,
            price: session.selectedProductPrice!,
            quantity: qty,
        });

        session.state = 'collecting_name';

        return {
            text: `✅ Added ${qty}x ${session.selectedProductName} to your order.\n\n👤 *What is your name?*`,
        };
    }

    private handleName(session: SessionData, text: string): BotReply {
        if (text.length < 2) {
            return { text: 'Please enter your full name.' };
        }

        session.customerName = messageText(text);
        session.state = 'collecting_address';

        return {
            text: `Thanks ${session.customerName}! 🏠\n\n*Where should we deliver your order?*\n_Please enter your full delivery address._`,
        };
    }

    private handleAddress(session: SessionData, text: string): BotReply {
        if (text.length < 5) {
            return { text: 'Please enter a complete delivery address.' };
        }

        session.deliveryAddress = text;
        session.state = 'confirming_order';

        // Build order summary
        const total = (session.cartItems || []).reduce(
            (sum, item) => sum + item.price * item.quantity, 0
        );

        const lines = [
            '📋 *Order Summary*',
            '',
        ];

        (session.cartItems || []).forEach(item => {
            lines.push(`• ${item.name} x${item.quantity} — ₹${(item.price * item.quantity).toFixed(2)}`);
        });

        lines.push(
            '',
            `💰 *Total: ₹${total.toFixed(2)}*`,
            '',
            `👤 Name: ${session.customerName}`,
            `🏠 Address: ${session.deliveryAddress}`,
            '',
            'Reply *"confirm"* to place your order',
            'Reply *"cancel"* to cancel',
        );

        return { text: lines.join('\n') };
    }

    private async handleOrderConfirmation(
        tenantId: string,
        phone: string,
        session: SessionData,
        text: string,
        settings: StoreSettings,
    ): Promise<BotReply> {
        if (text === 'cancel') {
            this.resetSession(tenantId, phone);
            return { text: '❌ Order cancelled. Type "catalog" to browse again.' };
        }

        if (text !== 'confirm' && text !== 'yes') {
            return { text: 'Reply *"confirm"* to place your order or *"cancel"* to cancel.' };
        }

        const total = (session.cartItems || []).reduce(
            (sum, item) => sum + item.price * item.quantity, 0
        );

        // Create the order
        const order = await this.storeService.createOrder(tenantId, {
            customer_phone: phone,
            customer_name: session.customerName,
            delivery_address: session.deliveryAddress,
            items: session.cartItems || [],
            total_amount: total,
        });

        session.orderId = order.id;
        session.state = 'awaiting_payment';

        // Generate payment message
        const paymentMsg = this.storeService.generatePaymentMessage(settings, order);

        const lines = [
            '✅ *Order Placed Successfully!*',
            '',
            `Order ID: #${order.id.slice(-6).toUpperCase()}`,
            '',
            paymentMsg,
        ];

        // If there's a payment link template, set payment status to awaiting
        if (settings.payment_link_template) {
            const link = settings.payment_link_template
                .replace('{{amount}}', String(total))
                .replace('{{order_id}}', order.id);
            await this.storeService.setPaymentLink(tenantId, order.id, link);
        }

        return { text: lines.join('\n') };
    }

    private async handlePaymentResponse(tenantId: string, session: SessionData, text: string): Promise<BotReply> {
        if (text === 'done' || text === 'paid' || text === 'completed') {
            // Admin will confirm manually, but acknowledge the customer
            return {
                text: '🙏 Thank you! We\'ve noted your payment confirmation.\nOur team will verify and update your order shortly.\n\nType "status" anytime to check your order.',
            };
        }

        return {
            text: 'Complete your payment and reply "done" when finished.\nOr type "status" to check your order.',
        };
    }

    private async showOrderStatus(tenantId: string, phone: string): Promise<BotReply> {
        const orders = await this.storeService.getOrdersByPhone(tenantId, phone);

        if (orders.length === 0) {
            return { text: 'You don\'t have any orders yet. Type "catalog" to start shopping! 🛍️' };
        }

        const statusEmoji: Record<string, string> = {
            pending: '⏳',
            confirmed: '✅',
            shipped: '🚚',
            completed: '🎉',
            cancelled: '❌',
        };

        const paymentEmoji: Record<string, string> = {
            unpaid: '💳 Unpaid',
            awaiting: '⏳ Awaiting',
            paid: '✅ Paid',
            refunded: '↩️ Refunded',
        };

        const lines = ['📦 *Your Recent Orders*', ''];

        orders.forEach(order => {
            const emoji = statusEmoji[order.status] || '❓';
            lines.push(
                `${emoji} *#${order.id.slice(-6).toUpperCase()}*`,
                `   Status: ${order.status.toUpperCase()}`,
                `   Payment: ${paymentEmoji[order.payment_status] || order.payment_status}`,
                `   Total: ₹${order.total_amount}`,
                ''
            );
        });

        return { text: lines.join('\n') };
    }

    /**
     * Clean up stale sessions (called periodically)
     */
    cleanupStaleSessions(maxAgeMs: number = 60 * 60 * 1000): void {
        const now = Date.now();
        for (const [key, session] of this.sessions.entries()) {
            if (now - session.lastActivityAt > maxAgeMs) {
                this.sessions.delete(key);
            }
        }
    }

    /**
     * Get sessions that need follow-up reminders
     */
    getSessionsNeedingReminder(reminderAfterMs: number): Array<{ key: string; session: SessionData }> {
        const now = Date.now();
        const results: Array<{ key: string; session: SessionData }> = [];

        for (const [key, session] of this.sessions.entries()) {
            if (
                !session.isHumanTakeover &&
                now - session.lastActivityAt > reminderAfterMs &&
                ['collecting_quantity', 'collecting_name', 'collecting_address', 'confirming_order'].includes(session.state)
            ) {
                results.push({ key, session });
            }
        }

        return results;
    }
}

// Helper to capitalize first letter of each word
function messageText(text: string): string {
    return text.replace(/\b\w/g, c => c.toUpperCase());
}
