/**
 * Flow Engine — Core logic for executing conversation flows.
 * This is the brain of the flow builder system.
 */

import { FlowRepository } from './flow.repository.js';
import { LeadService } from '../lead/lead.service.js';
import type {
    Flow,
    FlowNode,
    FlowNodeConfig,
    FlowSession,
    FlowResponse,
    FlowEngineResult,
    CartItem,
    MessageNodeConfig,
    QuestionNodeConfig,
    ButtonsNodeConfig,
    InputCaptureNodeConfig,
    ConditionNodeConfig,
    ProductSearchNodeConfig,
    ProductCarouselNodeConfig,
    ProductRecommendationNodeConfig,
    AddToCartNodeConfig,
    ShowCartNodeConfig,
    CheckoutNodeConfig,
    AssignAgentNodeConfig,
    AddTagNodeConfig,
    UpdateLeadNodeConfig,
    DelayNodeConfig,
    EndNodeConfig,
} from './flow.types.js';

export interface ProductService {
    getProducts(tenantId: string, filters: { category?: string; enabled?: boolean; featured?: boolean }): Promise<any[]>;
    getProduct(tenantId: string, id: string): Promise<any>;
    searchProducts(tenantId: string, query: string, limit?: number): Promise<any[]>;
    getProductsByCategory(tenantId: string, category: string): Promise<any[]>;
    getCategories(tenantId: string): Promise<string[]>;
}

export interface RecommendationService {
    getRecommendations(
        tenantId: string,
        phone: string,
        algorithm: string,
        maxProducts: number
    ): Promise<any[]>;
}

export class FlowEngine {
    constructor(
        private readonly flowRepository: FlowRepository,
        private readonly leadService: LeadService,
        private readonly productService: ProductService,
        private readonly recommendationService?: RecommendationService,
    ) {}

    /**
     * Process an incoming message and execute the appropriate flow.
     * Returns null if no flow matches or human takeover is active.
     */
    async processMessage(
        tenantId: string,
        phone: string,
        messageText: string,
        isFirstMessage: boolean = false
    ): Promise<FlowEngineResult | null> {
        const text = messageText.trim();

        // Check for active session
        let session = await this.flowRepository.findActiveSession(tenantId, phone);
        
        if (session) {
            // Continue existing flow
            return this.continueFlow(tenantId, phone, session, text);
        }

        // Find matching flow
        const flow = await this.findMatchingFlow(tenantId, text, isFirstMessage);
        if (!flow) {
            return null;
        }

        // Start new flow
        return this.startFlow(tenantId, phone, flow);
    }

    /**
     * Find the best matching flow for the given input.
     */
    private async findMatchingFlow(
        tenantId: string,
        text: string,
        isFirstMessage: boolean
    ): Promise<Flow | null> {
        // Priority order:
        // 1. Keyword match
        // 2. First message flow (if applicable)
        // 3. Fallback flow

        const keywordFlow = await this.flowRepository.findByKeyword(tenantId, text);
        if (keywordFlow) {
            return keywordFlow.toJSON() as Flow;
        }

        if (isFirstMessage) {
            const firstMessageFlow = await this.flowRepository.findFirstMessageFlow(tenantId);
            if (firstMessageFlow) {
                return firstMessageFlow.toJSON() as Flow;
            }
        }

        const fallbackFlow = await this.flowRepository.findFallbackFlow(tenantId);
        if (fallbackFlow) {
            return fallbackFlow.toJSON() as Flow;
        }

        return null;
    }

    /**
     * Start a new flow.
     */
    async startFlow(
        tenantId: string,
        phone: string,
        flow: Flow
    ): Promise<FlowEngineResult> {
        // Create session
        const session = await this.flowRepository.createSession(
            tenantId,
            phone,
            flow.id,
            flow.start_node_id
        );

        // Log analytics
        await this.flowRepository.logAnalytics(
            tenantId,
            flow.id,
            flow.start_node_id,
            'enter',
            phone
        );

        // Log lead activity
        await this.leadService.logActivity(tenantId, {
            lead_id: (await this.leadService.getLeadByPhone(tenantId, phone))?.id || '',
            type: 'flow_started',
            description: `Started flow: ${flow.name}`,
            metadata: { flow_id: flow.id, flow_name: flow.name },
        });

        // Execute start node
        const startNode = this.getNode(flow, flow.start_node_id);
        if (!startNode) {
            return {
                response: { text: 'Flow configuration error.' },
                sessionUpdated: false,
                flowCompleted: true,
            };
        }

        return this.executeNode(tenantId, phone, flow, session.toJSON() as FlowSession, startNode);
    }

    /**
     * Continue an existing flow.
     */
    private async continueFlow(
        tenantId: string,
        phone: string,
        sessionModel: any,
        userInput: string
    ): Promise<FlowEngineResult> {
        const session = sessionModel.toJSON() as FlowSession;
        const flow = (sessionModel.flow as any).toJSON() as Flow;

        const currentNode = this.getNode(flow, session.current_node_id);
        if (!currentNode) {
            await this.flowRepository.endSession(tenantId, session.id);
            return {
                response: { text: 'Session expired. Please start over.' },
                sessionUpdated: true,
                flowCompleted: true,
            };
        }

        // Process user input based on current node type
        return this.handleUserInput(tenantId, phone, flow, session, currentNode, userInput);
    }

    /**
     * Handle user input for the current node and determine next action.
     */
    private async handleUserInput(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        currentNode: FlowNode,
        userInput: string
    ): Promise<FlowEngineResult> {
        const config = currentNode.config;

        switch (config.type) {
            case 'question':
                return this.handleQuestionInput(tenantId, phone, flow, session, config, userInput);

            case 'input_capture':
                return this.handleInputCapture(tenantId, phone, flow, session, config, userInput);

            case 'buttons':
                return this.handleButtonInput(tenantId, phone, flow, session, config, userInput);

            case 'product_search':
                return this.handleProductSearch(tenantId, phone, flow, session, config, userInput);

            case 'product_carousel':
                return this.handleProductSelection(tenantId, phone, flow, session, config, userInput);

            case 'add_to_cart':
                return this.handleAddToCart(tenantId, phone, flow, session, config, userInput);

            case 'show_cart':
                return this.handleCartInteraction(tenantId, phone, flow, session, config, userInput);

            default:
                // For non-interactive nodes, move to next
                const nextNodeId = this.getNextNodeId(config);
                if (nextNodeId) {
                    const nextNode = this.getNode(flow, nextNodeId);
                    if (nextNode) {
                        return this.executeNode(tenantId, phone, flow, session, nextNode);
                    }
                }
                return this.endFlow(tenantId, phone, session, 'Thank you!');
        }
    }

    /**
     * Execute a node and return its response.
     */
    private async executeNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        node: FlowNode
    ): Promise<FlowEngineResult> {
        const config = node.config;

        // Update session with current node
        await this.flowRepository.updateSession(tenantId, session.id, {
            current_node_id: node.id,
        });

        // Log node entry
        await this.flowRepository.logAnalytics(tenantId, flow.id, node.id, 'enter', phone);

        switch (config.type) {
            case 'message':
                return this.executeMessageNode(tenantId, phone, flow, session, config);

            case 'question':
                return this.executeQuestionNode(tenantId, phone, flow, session, config);

            case 'buttons':
                return this.executeButtonsNode(tenantId, phone, flow, session, config);

            case 'input_capture':
                return this.executeInputCaptureNode(tenantId, phone, flow, session, config);

            case 'condition':
                return this.executeConditionNode(tenantId, phone, flow, session, config);

            case 'product_search':
                return this.executeProductSearchNode(tenantId, phone, flow, session, config);

            case 'product_carousel':
                return this.executeProductCarouselNode(tenantId, phone, flow, session, config);

            case 'product_recommendation':
                return this.executeProductRecommendationNode(tenantId, phone, flow, session, config);

            case 'add_to_cart':
                return this.executeAddToCartNode(tenantId, phone, flow, session, config);

            case 'show_cart':
                return this.executeShowCartNode(tenantId, phone, flow, session, config);

            case 'checkout':
                return this.executeCheckoutNode(tenantId, phone, flow, session, config);

            case 'assign_agent':
                return this.executeAssignAgentNode(tenantId, phone, flow, session, config);

            case 'add_tag':
                return this.executeAddTagNode(tenantId, phone, flow, session, config);

            case 'update_lead':
                return this.executeUpdateLeadNode(tenantId, phone, flow, session, config);

            case 'delay':
                return this.executeDelayNode(tenantId, phone, flow, session, config);

            case 'goto':
                const targetNode = this.getNode(flow, config.target_node_id);
                if (targetNode) {
                    return this.executeNode(tenantId, phone, flow, session, targetNode);
                }
                return this.endFlow(tenantId, phone, session);

            case 'end':
                return this.executeEndNode(tenantId, phone, flow, session, config);

            default:
                return this.endFlow(tenantId, phone, session, 'Flow completed.');
        }
    }

    // ============================
    // NODE EXECUTORS
    // ============================

    private async executeMessageNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: MessageNodeConfig
    ): Promise<FlowEngineResult> {
        const message = this.interpolateTemplate(config.message_template, session);

        // Auto-advance to next node if exists
        if (config.next_node_id) {
            const nextNode = this.getNode(flow, config.next_node_id);
            if (nextNode) {
                // For message nodes, we send the message and immediately execute next
                setTimeout(async () => {
                    await this.executeNode(tenantId, phone, flow, session, nextNode);
                }, 100);
            }
        }

        return {
            response: { text: message },
            sessionUpdated: true,
            flowCompleted: !config.next_node_id,
            nextNodeId: config.next_node_id,
        };
    }

    private async executeQuestionNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: QuestionNodeConfig
    ): Promise<FlowEngineResult> {
        const message = this.interpolateTemplate(config.message_template, session);
        const options = config.options.map((opt, i) => `${i + 1}. ${opt.label}`);

        return {
            response: {
                text: message + '\n\n' + options.join('\n'),
                options: config.options.map(o => o.label),
                requiresInput: true,
                inputType: 'selection',
            },
            sessionUpdated: true,
            flowCompleted: false,
        };
    }

    private async executeButtonsNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: ButtonsNodeConfig
    ): Promise<FlowEngineResult> {
        const message = this.interpolateTemplate(config.message_template, session);

        return {
            response: {
                text: message,
                buttons: config.buttons.map(b => ({
                    label: b.label,
                    action: b.action,
                    value: b.value,
                })),
                requiresInput: true,
            },
            sessionUpdated: true,
            flowCompleted: false,
        };
    }

    private async executeInputCaptureNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: InputCaptureNodeConfig
    ): Promise<FlowEngineResult> {
        const message = this.interpolateTemplate(config.message_template, session);

        return {
            response: {
                text: message,
                requiresInput: true,
                inputType: this.mapValidationType(config.validation?.type),
            },
            sessionUpdated: true,
            flowCompleted: false,
        };
    }

    private async executeConditionNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: ConditionNodeConfig
    ): Promise<FlowEngineResult> {
        const lead = await this.leadService.getLeadByPhone(tenantId, phone);
        
        // Evaluate conditions
        for (const condition of config.conditions) {
            const fieldValue = this.getFieldValue(condition.field, session, lead);
            
            if (this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
                const nextNode = this.getNode(flow, condition.next_node_id);
                if (nextNode) {
                    return this.executeNode(tenantId, phone, flow, session, nextNode);
                }
            }
        }

        // Default branch
        const defaultNode = this.getNode(flow, config.default_node_id);
        if (defaultNode) {
            return this.executeNode(tenantId, phone, flow, session, defaultNode);
        }

        return this.endFlow(tenantId, phone, session);
    }

    private async executeProductSearchNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: ProductSearchNodeConfig
    ): Promise<FlowEngineResult> {
        const message = this.interpolateTemplate(config.message_template, session);

        return {
            response: {
                text: message,
                requiresInput: true,
                inputType: 'text',
            },
            sessionUpdated: true,
            flowCompleted: false,
        };
    }

    private async executeProductCarouselNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: ProductCarouselNodeConfig
    ): Promise<FlowEngineResult> {
        let products: any[] = [];
        const maxProducts = config.max_products || 5;

        switch (config.source) {
            case 'category':
                if (config.category) {
                    products = await this.productService.getProductsByCategory(tenantId, config.category);
                }
                break;

            case 'featured':
                products = await this.productService.getProducts(tenantId, { featured: true, enabled: true });
                break;

            case 'recent':
                products = await this.productService.getProducts(tenantId, { enabled: true });
                break;

            case 'search_results':
                // Get from session variables
                products = session.variables.searchResults || [];
                break;

            case 'recommendations':
                if (this.recommendationService) {
                    products = await this.recommendationService.getRecommendations(
                        tenantId,
                        phone,
                        'popularity',
                        maxProducts
                    );
                }
                break;
        }

        products = products.slice(0, maxProducts);

        if (products.length === 0) {
            return {
                response: { text: 'No products found.' },
                sessionUpdated: true,
                flowCompleted: false,
                nextNodeId: config.next_node_id,
            };
        }

        const message = config.message_template 
            ? this.interpolateTemplate(config.message_template, session)
            : '📦 *Products*\n';

        const productLines = products.map((p, i) => 
            `${i + 1}. *${p.name}* — ₹${p.price}\n   ${p.description?.substring(0, 50) || ''}`
        );

        return {
            response: {
                text: message + '\n' + productLines.join('\n\n') + '\n\n_Reply with a number to select_',
                products: products.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: Number(p.price),
                    image_url: p.image_url,
                    description: p.description,
                })),
                requiresInput: true,
                inputType: 'selection',
            },
            sessionUpdated: true,
            flowCompleted: false,
        };
    }

    private async executeProductRecommendationNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: ProductRecommendationNodeConfig
    ): Promise<FlowEngineResult> {
        let products: any[] = [];

        if (this.recommendationService) {
            products = await this.recommendationService.getRecommendations(
                tenantId,
                phone,
                config.algorithm,
                config.max_products || 5
            );
        } else {
            // Fallback to featured products
            products = await this.productService.getProducts(tenantId, { featured: true, enabled: true });
            products = products.slice(0, config.max_products || 5);
        }

        const message = config.message_template
            ? this.interpolateTemplate(config.message_template, session)
            : '🌟 *Recommended for you:*\n';

        const productLines = products.map((p, i) =>
            `${i + 1}. *${p.name}* — ₹${p.price}`
        );

        // Store in session for selection
        await this.flowRepository.updateSession(tenantId, session.id, {
            variables: { ...session.variables, recommendedProducts: products },
        });

        return {
            response: {
                text: message + '\n' + productLines.join('\n') + '\n\n_Reply with a number to select_',
                products: products.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: Number(p.price),
                    image_url: p.image_url,
                })),
                requiresInput: true,
                inputType: 'selection',
            },
            sessionUpdated: true,
            flowCompleted: false,
        };
    }

    private async executeAddToCartNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: AddToCartNodeConfig
    ): Promise<FlowEngineResult> {
        if (config.ask_quantity) {
            const message = config.quantity_message || 'How many would you like to order?';
            return {
                response: {
                    text: message,
                    requiresInput: true,
                    inputType: 'number',
                },
                sessionUpdated: true,
                flowCompleted: false,
            };
        }

        // Add with quantity 1
        return this.addProductToCart(tenantId, phone, flow, session, config, 1);
    }

    private async executeShowCartNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: ShowCartNodeConfig
    ): Promise<FlowEngineResult> {
        const cartItems = session.cart_items || [];

        if (cartItems.length === 0) {
            const emptyMessage = config.message_template || 'Your cart is empty.';
            
            if (config.empty_cart_node_id) {
                const nextNode = this.getNode(flow, config.empty_cart_node_id);
                if (nextNode) {
                    return this.executeNode(tenantId, phone, flow, session, nextNode);
                }
            }

            return {
                response: { text: emptyMessage },
                sessionUpdated: true,
                flowCompleted: false,
            };
        }

        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const lines = ['🛒 *Your Cart*', ''];
        cartItems.forEach((item, i) => {
            lines.push(`${i + 1}. ${item.name} x${item.quantity} — ₹${(item.price * item.quantity).toFixed(2)}`);
        });
        lines.push('', `💰 *Total: ₹${total.toFixed(2)}*`, '');

        if (config.show_checkout_button) {
            lines.push('Reply *"checkout"* to place order');
            lines.push('Reply *"continue"* to keep shopping');
        }

        return {
            response: {
                text: lines.join('\n'),
                requiresInput: true,
            },
            sessionUpdated: true,
            flowCompleted: false,
        };
    }

    private async executeCheckoutNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: CheckoutNodeConfig
    ): Promise<FlowEngineResult> {
        // This will trigger the checkout flow in the main chatbot
        // We set a flag in the session and return a response

        await this.flowRepository.updateSession(tenantId, session.id, {
            variables: { ...session.variables, checkout_triggered: true },
        });

        const message = config.confirmation_message || 
            'Great! Let\'s complete your order. Please provide your details.';

        return {
            response: {
                text: message,
                requiresInput: true,
            },
            sessionUpdated: true,
            flowCompleted: false,
        };
    }

    private async executeAssignAgentNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: AssignAgentNodeConfig
    ): Promise<FlowEngineResult> {
        const message = config.message_template || 
            '👋 Connecting you with a human agent. Please wait...';

        // End the flow session
        await this.flowRepository.endSession(tenantId, session.id);

        // Log activity
        await this.leadService.logActivity(tenantId, {
            lead_id: (await this.leadService.getLeadByPhone(tenantId, phone))?.id || '',
            type: 'assigned',
            description: 'Assigned to human agent from flow',
            metadata: { flow_id: flow.id, agent_id: config.agent_id },
        });

        return {
            response: {
                text: message,
                humanTakeover: true,
            },
            sessionUpdated: true,
            flowCompleted: true,
        };
    }

    private async executeAddTagNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: AddTagNodeConfig
    ): Promise<FlowEngineResult> {
        const lead = await this.leadService.getLeadByPhone(tenantId, phone);
        if (lead) {
            for (const tag of config.tags) {
                await this.leadService.addTag(tenantId, lead.id, tag);
            }
        }

        // Move to next node
        const nextNode = this.getNode(flow, config.next_node_id);
        if (nextNode) {
            return this.executeNode(tenantId, phone, flow, session, nextNode);
        }

        return this.endFlow(tenantId, phone, session);
    }

    private async executeUpdateLeadNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: UpdateLeadNodeConfig
    ): Promise<FlowEngineResult> {
        const lead = await this.leadService.getLeadByPhone(tenantId, phone);
        if (lead) {
            const updates: Record<string, any> = {};
            
            for (const update of config.updates) {
                let value: any;
                
                switch (update.value_type) {
                    case 'static':
                        value = update.value;
                        break;
                    case 'from_session':
                        value = session.variables[update.value];
                        break;
                    case 'from_collected_data':
                        value = session.collected_data[update.value];
                        break;
                }

                if (value !== undefined) {
                    updates[update.field] = value;
                }
            }

            await this.leadService.updateLead(tenantId, lead.id, updates);
        }

        // Move to next node
        const nextNode = this.getNode(flow, config.next_node_id);
        if (nextNode) {
            return this.executeNode(tenantId, phone, flow, session, nextNode);
        }

        return this.endFlow(tenantId, phone, session);
    }

    private async executeDelayNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: DelayNodeConfig
    ): Promise<FlowEngineResult> {
        const message = config.message_template 
            ? this.interpolateTemplate(config.message_template, session)
            : '';

        // In production, this would use a job queue for the delay
        // For now, we just move to next node

        const nextNode = this.getNode(flow, config.next_node_id);
        if (nextNode) {
            return this.executeNode(tenantId, phone, flow, session, nextNode);
        }

        return {
            response: { text: message },
            sessionUpdated: true,
            flowCompleted: true,
        };
    }

    private async executeEndNode(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: EndNodeConfig
    ): Promise<FlowEngineResult> {
        const message = config.message_template
            ? this.interpolateTemplate(config.message_template, session)
            : 'Thank you!';

        return this.endFlow(tenantId, phone, session, message, config.reset_session);
    }

    // ============================
    // INPUT HANDLERS
    // ============================

    private async handleQuestionInput(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: QuestionNodeConfig,
        userInput: string
    ): Promise<FlowEngineResult> {
        const input = userInput.trim().toLowerCase();
        
        // Try to match by number
        const index = parseInt(input, 10) - 1;
        if (!isNaN(index) && index >= 0 && index < config.options.length) {
            const selected = config.options[index];
            
            // Save to collected data if field specified
            if (config.data_field) {
                await this.flowRepository.updateSession(tenantId, session.id, {
                    collected_data: { [config.data_field]: selected.value },
                });
                await this.leadService.captureData(tenantId, phone, config.data_field, selected.value);
            }

            // Move to next node
            const nextNode = this.getNode(flow, selected.next_node_id);
            if (nextNode) {
                return this.executeNode(tenantId, phone, flow, session, nextNode);
            }
        }

        // Try to match by label
        const labelMatch = config.options.find(o => o.label.toLowerCase() === input);
        if (labelMatch) {
            if (config.data_field) {
                await this.flowRepository.updateSession(tenantId, session.id, {
                    collected_data: { [config.data_field]: labelMatch.value },
                });
                await this.leadService.captureData(tenantId, phone, config.data_field, labelMatch.value);
            }

            const nextNode = this.getNode(flow, labelMatch.next_node_id);
            if (nextNode) {
                return this.executeNode(tenantId, phone, flow, session, nextNode);
            }
        }

        // Allow free text if configured
        if (config.allow_free_text && config.free_text_next_node_id) {
            if (config.data_field) {
                await this.flowRepository.updateSession(tenantId, session.id, {
                    collected_data: { [config.data_field]: userInput },
                });
                await this.leadService.captureData(tenantId, phone, config.data_field, userInput);
            }

            const nextNode = this.getNode(flow, config.free_text_next_node_id);
            if (nextNode) {
                return this.executeNode(tenantId, phone, flow, session, nextNode);
            }
        }

        // Invalid input - repeat question
        return {
            response: {
                text: `Please select a valid option (1-${config.options.length})`,
                options: config.options.map(o => o.label),
                requiresInput: true,
            },
            sessionUpdated: false,
            flowCompleted: false,
        };
    }

    private async handleInputCapture(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: InputCaptureNodeConfig,
        userInput: string
    ): Promise<FlowEngineResult> {
        // Validate input
        if (config.validation) {
            const isValid = this.validateInput(userInput, config.validation);
            if (!isValid) {
                const errorMsg = config.error_message || 'Please enter a valid value.';
                return {
                    response: { text: errorMsg, requiresInput: true },
                    sessionUpdated: false,
                    flowCompleted: false,
                };
            }
        }

        // Save to collected data
        await this.flowRepository.updateSession(tenantId, session.id, {
            collected_data: { [config.data_field]: userInput },
        });

        // Update lead
        await this.leadService.captureData(tenantId, phone, config.data_field, userInput);

        // Move to next node
        const nextNode = this.getNode(flow, config.next_node_id);
        if (nextNode) {
            return this.executeNode(tenantId, phone, flow, session, nextNode);
        }

        return this.endFlow(tenantId, phone, session);
    }

    private async handleButtonInput(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: ButtonsNodeConfig,
        userInput: string
    ): Promise<FlowEngineResult> {
        const input = userInput.trim().toLowerCase();

        // Try to match button
        const index = parseInt(input, 10) - 1;
        let matchedButton = null;

        if (!isNaN(index) && index >= 0 && index < config.buttons.length) {
            matchedButton = config.buttons[index];
        } else {
            matchedButton = config.buttons.find(b => b.label.toLowerCase() === input);
        }

        if (matchedButton && matchedButton.action === 'goto') {
            const nextNode = this.getNode(flow, matchedButton.value);
            if (nextNode) {
                return this.executeNode(tenantId, phone, flow, session, nextNode);
            }
        }

        // Invalid input
        return {
            response: {
                text: 'Please select a valid option.',
                buttons: config.buttons.map(b => ({
                    label: b.label,
                    action: b.action,
                    value: b.value,
                })),
                requiresInput: true,
            },
            sessionUpdated: false,
            flowCompleted: false,
        };
    }

    private async handleProductSearch(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: ProductSearchNodeConfig,
        userInput: string
    ): Promise<FlowEngineResult> {
        const products = await this.productService.searchProducts(
            tenantId,
            userInput,
            config.max_results || 5
        );

        if (products.length === 0) {
            const noResultsMsg = config.no_results_message || 'No products found. Try a different search.';
            
            if (config.no_results_node_id) {
                const nextNode = this.getNode(flow, config.no_results_node_id);
                if (nextNode) {
                    return this.executeNode(tenantId, phone, flow, session, nextNode);
                }
            }

            return {
                response: { text: noResultsMsg, requiresInput: true },
                sessionUpdated: false,
                flowCompleted: false,
            };
        }

        // Store search results in session
        await this.flowRepository.updateSession(tenantId, session.id, {
            variables: { ...session.variables, searchResults: products },
        });

        // Move to next node (usually a product carousel)
        const nextNode = this.getNode(flow, config.next_node_id);
        if (nextNode) {
            return this.executeNode(tenantId, phone, flow, session, nextNode);
        }

        // Fallback: show products inline
        const productLines = products.map((p, i) => 
            `${i + 1}. *${p.name}* — ₹${p.price}`
        );

        return {
            response: {
                text: '🔍 *Search Results:*\n\n' + productLines.join('\n'),
                products: products.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: Number(p.price),
                })),
                requiresInput: true,
            },
            sessionUpdated: true,
            flowCompleted: false,
        };
    }

    private async handleProductSelection(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: ProductCarouselNodeConfig,
        userInput: string
    ): Promise<FlowEngineResult> {
        const index = parseInt(userInput.trim(), 10) - 1;
        
        // Get products from session
        const products = session.variables.searchResults || 
            session.variables.recommendedProducts || [];

        if (isNaN(index) || index < 0 || index >= products.length) {
            return {
                response: {
                    text: `Please enter a valid number (1-${products.length})`,
                    requiresInput: true,
                },
                sessionUpdated: false,
                flowCompleted: false,
            };
        }

        const selectedProduct = products[index];

        // Store selected product in session
        await this.flowRepository.updateSession(tenantId, session.id, {
            selected_product_id: selectedProduct.id,
            variables: { ...session.variables, selectedProduct },
        });

        // Add interest category to lead
        if (selectedProduct.category) {
            await this.leadService.addInterestCategory(tenantId, phone, selectedProduct.category);
        }

        // Move to next node
        const nextNode = this.getNode(flow, config.next_node_id);
        if (nextNode) {
            return this.executeNode(tenantId, phone, flow, session, nextNode);
        }

        // Fallback: show product details
        return {
            response: {
                text: `*${selectedProduct.name}*\n${selectedProduct.description || ''}\n\n💰 Price: ₹${selectedProduct.price}\n\nReply *"add"* to add to cart`,
                requiresInput: true,
            },
            sessionUpdated: true,
            flowCompleted: false,
        };
    }

    private async handleAddToCart(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: AddToCartNodeConfig,
        userInput: string
    ): Promise<FlowEngineResult> {
        // Parse quantity
        const quantity = parseInt(userInput.trim(), 10);
        
        if (isNaN(quantity) || quantity < 1 || quantity > 99) {
            return {
                response: {
                    text: 'Please enter a valid quantity (1-99)',
                    requiresInput: true,
                    inputType: 'number',
                },
                sessionUpdated: false,
                flowCompleted: false,
            };
        }

        return this.addProductToCart(tenantId, phone, flow, session, config, quantity);
    }

    private async addProductToCart(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: AddToCartNodeConfig,
        quantity: number
    ): Promise<FlowEngineResult> {
        let productId = config.product_id;
        let product;

        if (config.product_source === 'selected') {
            productId = session.selected_product_id || session.variables.selectedProduct?.id;
            product = session.variables.selectedProduct;
        }

        if (!productId) {
            return {
                response: { text: 'No product selected. Please try again.' },
                sessionUpdated: false,
                flowCompleted: false,
            };
        }

        if (!product) {
            product = await this.productService.getProduct(tenantId, productId);
        }

        if (!product) {
            return {
                response: { text: 'Product not found.' },
                sessionUpdated: false,
                flowCompleted: false,
            };
        }

        // Add to cart
        const cartItem: CartItem = {
            product_id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity,
            image_url: product.image_url,
        };

        await this.flowRepository.addToCart(tenantId, session.id, cartItem);

        const successMsg = config.success_message || 
            `✅ Added ${quantity}x ${product.name} to your cart!`;

        // Move to next node
        const nextNode = this.getNode(flow, config.next_node_id);
        if (nextNode) {
            // Return message and then execute next node
            return {
                response: { text: successMsg },
                sessionUpdated: true,
                flowCompleted: false,
                nextNodeId: config.next_node_id,
            };
        }

        return {
            response: { text: successMsg },
            sessionUpdated: true,
            flowCompleted: false,
        };
    }

    private async handleCartInteraction(
        tenantId: string,
        phone: string,
        flow: Flow,
        session: FlowSession,
        config: ShowCartNodeConfig,
        userInput: string
    ): Promise<FlowEngineResult> {
        const input = userInput.trim().toLowerCase();

        if (input === 'checkout' && config.checkout_node_id) {
            const checkoutNode = this.getNode(flow, config.checkout_node_id);
            if (checkoutNode) {
                return this.executeNode(tenantId, phone, flow, session, checkoutNode);
            }
        }

        if (input === 'continue' && config.continue_shopping_node_id) {
            const continueNode = this.getNode(flow, config.continue_shopping_node_id);
            if (continueNode) {
                return this.executeNode(tenantId, phone, flow, session, continueNode);
            }
        }

        return {
            response: {
                text: 'Reply *"checkout"* to place order or *"continue"* to keep shopping.',
                requiresInput: true,
            },
            sessionUpdated: false,
            flowCompleted: false,
        };
    }

    // ============================
    // HELPERS
    // ============================

    private getNode(flow: Flow, nodeId: string): FlowNode | undefined {
        return flow.nodes.find(n => n.id === nodeId);
    }

    private getNextNodeId(config: any): string | undefined {
        return config.next_node_id;
    }

    private interpolateTemplate(template: string, session: FlowSession): string {
        let result = template;

        // Replace {{field}} with collected data or variables
        result = result.replace(/\{\{(\w+)\}\}/g, (match, field) => {
            return session.collected_data[field] || 
                   session.variables[field] || 
                   match;
        });

        return result;
    }

    private validateInput(input: string, validation: any): boolean {
        switch (validation.type) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
            
            case 'phone':
                return /^\+?[\d\s-]{10,}$/.test(input);
            
            case 'number':
                const num = parseFloat(input);
                if (isNaN(num)) return false;
                if (validation.min_value !== undefined && num < validation.min_value) return false;
                if (validation.max_value !== undefined && num > validation.max_value) return false;
                return true;
            
            case 'regex':
                if (validation.pattern) {
                    return new RegExp(validation.pattern).test(input);
                }
                return true;
            
            case 'text':
            default:
                if (validation.min_length && input.length < validation.min_length) return false;
                if (validation.max_length && input.length > validation.max_length) return false;
                return true;
        }
    }

    private mapValidationType(type?: string): 'text' | 'email' | 'phone' | 'number' | 'selection' {
        switch (type) {
            case 'email': return 'email';
            case 'phone': return 'phone';
            case 'number': return 'number';
            default: return 'text';
        }
    }

    private getFieldValue(field: string, session: FlowSession, lead: any): any {
        // Check collected_data first
        if (session.collected_data[field] !== undefined) {
            return session.collected_data[field];
        }

        // Check session variables
        if (session.variables[field] !== undefined) {
            return session.variables[field];
        }

        // Check lead fields
        if (lead && lead[field] !== undefined) {
            return lead[field];
        }

        // Check lead collected_data
        if (lead?.collected_data?.[field] !== undefined) {
            return lead.collected_data[field];
        }

        return undefined;
    }

    private evaluateCondition(fieldValue: any, operator: string, conditionValue: any): boolean {
        switch (operator) {
            case 'equals':
                return fieldValue === conditionValue;
            
            case 'not_equals':
                return fieldValue !== conditionValue;
            
            case 'contains':
                return String(fieldValue || '').toLowerCase().includes(String(conditionValue).toLowerCase());
            
            case 'not_contains':
                return !String(fieldValue || '').toLowerCase().includes(String(conditionValue).toLowerCase());
            
            case 'greater_than':
                return Number(fieldValue) > Number(conditionValue);
            
            case 'less_than':
                return Number(fieldValue) < Number(conditionValue);
            
            case 'is_empty':
                return fieldValue === undefined || fieldValue === null || fieldValue === '';
            
            case 'is_not_empty':
                return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
            
            case 'in_list':
                const list = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
                return list.includes(fieldValue);
            
            default:
                return false;
        }
    }

    private async endFlow(
        tenantId: string,
        phone: string,
        session: FlowSession,
        message?: string,
        resetSession?: boolean
    ): Promise<FlowEngineResult> {
        await this.flowRepository.endSession(tenantId, session.id);

        // Log flow completion
        await this.leadService.logActivity(tenantId, {
            lead_id: (await this.leadService.getLeadByPhone(tenantId, phone))?.id || '',
            type: 'flow_completed',
            description: 'Flow completed',
            metadata: { flow_id: session.flow_id },
        });

        return {
            response: { text: message || '' },
            sessionUpdated: true,
            flowCompleted: true,
        };
    }

    // ============================
    // PUBLIC API
    // ============================

    /**
     * Manually trigger a specific flow for a user.
     */
    async triggerFlow(
        tenantId: string,
        phone: string,
        flowId: string
    ): Promise<FlowEngineResult | null> {
        const flow = await this.flowRepository.findById(tenantId, flowId);
        if (!flow) return null;

        return this.startFlow(tenantId, phone, flow.toJSON() as Flow);
    }

    /**
     * Get active session for a user.
     */
    async getActiveSession(tenantId: string, phone: string): Promise<FlowSession | null> {
        const session = await this.flowRepository.findActiveSession(tenantId, phone);
        return session?.toJSON() as FlowSession | null;
    }

    /**
     * End active session for a user.
     */
    async endActiveSession(tenantId: string, phone: string): Promise<boolean> {
        const session = await this.flowRepository.findActiveSession(tenantId, phone);
        if (!session) return false;

        await this.flowRepository.endSession(tenantId, session.id);
        return true;
    }

    /**
     * Get cart for current session.
     */
    async getSessionCart(tenantId: string, phone: string): Promise<CartItem[]> {
        const session = await this.flowRepository.findActiveSession(tenantId, phone);
        if (!session) return [];
        return session.cart_items || [];
    }
}
