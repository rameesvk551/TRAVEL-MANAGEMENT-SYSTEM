/**
 * Flow module type definitions.
 * Visual Flow Builder Engine for WhatsApp automation.
 */

// ============================
// FLOW DEFINITION
// ============================

export interface Flow {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    trigger_keywords: string[];
    trigger_type: FlowTriggerType;
    is_active: boolean;
    is_default: boolean;
    priority: number;
    nodes: FlowNode[];
    start_node_id: string;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

export type FlowTriggerType = 
    | 'keyword'      // Triggered by specific keywords
    | 'first_message' // Triggered on first message from new leads
    | 'fallback'     // Fallback when no other flow matches
    | 'manual'       // Manually triggered by agent
    | 'event';       // Triggered by system events

// ============================
// NODE TYPES
// ============================

export type FlowNodeType =
    | 'message'              // Send a text message
    | 'question'             // Ask a question with options
    | 'buttons'              // Interactive buttons
    | 'input_capture'        // Capture free text input
    | 'condition'            // Branch based on condition
    | 'product_search'       // Search and display products
    | 'product_carousel'     // Display multiple products
    | 'product_recommendation' // AI-based product recommendations
    | 'add_to_cart'          // Add selected product to cart
    | 'show_cart'            // Display current cart
    | 'checkout'             // Initiate checkout flow
    | 'assign_agent'         // Hand off to human agent
    | 'add_tag'              // Add tag to lead
    | 'update_lead'          // Update lead field
    | 'delay'                // Wait before continuing
    | 'api_call'             // Call external API
    | 'goto'                 // Jump to another node
    | 'end';                 // End the flow

export interface FlowNode {
    id: string;
    type: FlowNodeType;
    name?: string;
    config: FlowNodeConfig;
    position?: { x: number; y: number }; // For visual builder
}

// ============================
// NODE CONFIGURATIONS
// ============================

export type FlowNodeConfig = 
    | MessageNodeConfig
    | QuestionNodeConfig
    | ButtonsNodeConfig
    | InputCaptureNodeConfig
    | ConditionNodeConfig
    | ProductSearchNodeConfig
    | ProductCarouselNodeConfig
    | ProductRecommendationNodeConfig
    | AddToCartNodeConfig
    | ShowCartNodeConfig
    | CheckoutNodeConfig
    | AssignAgentNodeConfig
    | AddTagNodeConfig
    | UpdateLeadNodeConfig
    | DelayNodeConfig
    | ApiCallNodeConfig
    | GotoNodeConfig
    | EndNodeConfig;

export interface MessageNodeConfig {
    type: 'message';
    message_template: string;
    next_node_id?: string;
}

export interface QuestionNodeConfig {
    type: 'question';
    message_template: string;
    options: QuestionOption[];
    allow_free_text?: boolean;
    free_text_next_node_id?: string;
    data_field?: string; // Field to save selected option
    timeout_seconds?: number;
    timeout_node_id?: string;
}

export interface QuestionOption {
    label: string;
    value: string;
    next_node_id: string;
    icon?: string;
}

export interface ButtonsNodeConfig {
    type: 'buttons';
    message_template: string;
    buttons: ButtonConfig[];
    timeout_seconds?: number;
    timeout_node_id?: string;
}

export interface ButtonConfig {
    id: string;
    label: string;
    action: 'goto' | 'url' | 'phone';
    value: string; // node_id for goto, URL for url, phone number for phone
}

export interface InputCaptureNodeConfig {
    type: 'input_capture';
    message_template: string;
    data_field: string; // Field to save the input (e.g., 'name', 'email', 'budget')
    validation?: InputValidation;
    next_node_id: string;
    error_message?: string;
    retry_count?: number;
}

export interface InputValidation {
    type: 'text' | 'email' | 'phone' | 'number' | 'regex';
    pattern?: string; // For regex validation
    min_length?: number;
    max_length?: number;
    min_value?: number;
    max_value?: number;
}

export interface ConditionNodeConfig {
    type: 'condition';
    conditions: ConditionBranch[];
    default_node_id: string;
}

export interface ConditionBranch {
    field: string; // Lead field or collected_data field
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'in_list';
    value?: any;
    next_node_id: string;
}

export interface ProductSearchNodeConfig {
    type: 'product_search';
    message_template: string;
    category_filter?: string;
    max_results?: number;
    next_node_id: string;
    no_results_message?: string;
    no_results_node_id?: string;
}

export interface ProductCarouselNodeConfig {
    type: 'product_carousel';
    message_template?: string;
    source: 'category' | 'featured' | 'recent' | 'search_results' | 'recommendations';
    category?: string;
    max_products?: number;
    next_node_id: string;
}

export interface ProductRecommendationNodeConfig {
    type: 'product_recommendation';
    message_template?: string;
    algorithm: 'interest_based' | 'budget_based' | 'popularity' | 'similar_products' | 'past_purchases';
    max_products?: number;
    next_node_id: string;
}

export interface AddToCartNodeConfig {
    type: 'add_to_cart';
    product_source: 'selected' | 'specific';
    product_id?: string; // For specific product
    ask_quantity?: boolean;
    quantity_message?: string;
    success_message?: string;
    next_node_id: string;
}

export interface ShowCartNodeConfig {
    type: 'show_cart';
    message_template?: string;
    show_checkout_button?: boolean;
    checkout_node_id?: string;
    continue_shopping_node_id?: string;
    empty_cart_node_id?: string;
}

export interface CheckoutNodeConfig {
    type: 'checkout';
    collect_name?: boolean;
    collect_address?: boolean;
    collect_phone?: boolean;
    confirmation_message?: string;
    next_node_id?: string;
}

export interface AssignAgentNodeConfig {
    type: 'assign_agent';
    message_template?: string;
    agent_id?: string; // Specific agent, or null for round-robin
    department?: string;
    priority?: 'low' | 'medium' | 'high';
}

export interface AddTagNodeConfig {
    type: 'add_tag';
    tags: string[];
    next_node_id: string;
}

export interface UpdateLeadNodeConfig {
    type: 'update_lead';
    updates: LeadFieldUpdate[];
    next_node_id: string;
}

export interface LeadFieldUpdate {
    field: string;
    value_type: 'static' | 'from_session' | 'from_collected_data';
    value: string;
}

export interface DelayNodeConfig {
    type: 'delay';
    seconds: number;
    message_template?: string; // Message to show while waiting
    next_node_id: string;
}

export interface ApiCallNodeConfig {
    type: 'api_call';
    url: string;
    method: 'GET' | 'POST' | 'PUT';
    headers?: Record<string, string>;
    body_template?: string;
    response_field?: string; // Field to store response
    success_node_id: string;
    error_node_id: string;
}

export interface GotoNodeConfig {
    type: 'goto';
    target_node_id: string;
}

export interface EndNodeConfig {
    type: 'end';
    message_template?: string;
    reset_session?: boolean;
}

// ============================
// FLOW SESSION (User State)
// ============================

export interface FlowSession {
    id: string;
    tenant_id: string;
    phone: string;
    flow_id: string;
    current_node_id: string;
    collected_data: Record<string, any>;
    cart_items: CartItem[];
    selected_product_id?: string;
    variables: Record<string, any>;
    started_at: Date;
    last_activity_at: Date;
    completed_at?: Date;
    is_active: boolean;
}

export interface CartItem {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
}

// ============================
// DTOs
// ============================

export interface CreateFlowDTO {
    name: string;
    description?: string;
    trigger_keywords?: string[];
    trigger_type?: FlowTriggerType;
    is_active?: boolean;
    is_default?: boolean;
    priority?: number;
    nodes: FlowNode[];
    start_node_id: string;
    metadata?: Record<string, any>;
}

export interface UpdateFlowDTO {
    name?: string;
    description?: string;
    trigger_keywords?: string[];
    trigger_type?: FlowTriggerType;
    is_active?: boolean;
    is_default?: boolean;
    priority?: number;
    nodes?: FlowNode[];
    start_node_id?: string;
    metadata?: Record<string, any>;
}

export interface FlowFilters {
    is_active?: boolean;
    trigger_type?: FlowTriggerType;
    search?: string;
    limit?: number;
    offset?: number;
}

// ============================
// FLOW ENGINE RESULT
// ============================

export interface FlowEngineResult {
    response: FlowResponse;
    sessionUpdated: boolean;
    flowCompleted: boolean;
    nextNodeId?: string;
}

export interface FlowResponse {
    text: string;
    options?: string[];
    buttons?: Array<{ label: string; action: string; value: string }>;
    products?: Array<{
        id: string;
        name: string;
        price: number;
        image_url?: string;
        description?: string;
    }>;
    media?: {
        type: 'image' | 'document' | 'audio' | 'video';
        url: string;
        caption?: string;
    };
    requiresInput?: boolean;
    inputType?: 'text' | 'email' | 'phone' | 'number' | 'selection';
    humanTakeover?: boolean;
}
