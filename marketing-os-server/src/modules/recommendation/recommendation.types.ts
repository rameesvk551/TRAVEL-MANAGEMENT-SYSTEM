/**
 * Product Recommendation Types
 * Smart product catalog with AI-powered recommendations
 */

// ============================================
// ENUMS
// ============================================

export enum RecommendationStrategy {
    INTEREST_BASED = 'interest_based',
    BUDGET_BASED = 'budget_based',
    POPULARITY = 'popularity',
    SIMILAR_PRODUCTS = 'similar_products',
    PAST_PURCHASES = 'past_purchases',
    CART_BASED = 'cart_based',
    TRENDING = 'trending',
    NEW_ARRIVALS = 'new_arrivals',
    COMPLEMENTARY = 'complementary',
    UPSELL = 'upsell',
    CROSS_SELL = 'cross_sell',
}

export enum ProductInteractionType {
    VIEW = 'view',
    ADD_TO_CART = 'add_to_cart',
    REMOVE_FROM_CART = 'remove_from_cart',
    PURCHASE = 'purchase',
    WISHLIST = 'wishlist',
    SHARE = 'share',
    INQUIRY = 'inquiry',
}

// ============================================
// PRODUCT INTERACTION TRACKING
// ============================================

export interface ProductInteraction {
    id: string;
    tenantId: string;
    leadId?: string;
    sessionId?: string;
    phone?: string;
    productId: string;
    interactionType: ProductInteractionType;
    metadata?: {
        source?: 'whatsapp' | 'web' | 'api';
        flowId?: string;
        quantity?: number;
        priceAtTime?: number;
    };
    createdAt: Date;
}

// ============================================
// PRODUCT SCORING
// ============================================

export interface ProductScore {
    productId: string;
    score: number;
    factors: {
        popularity: number;
        recency: number;
        relevance: number;
        conversion: number;
    };
}

export interface LeadPreferences {
    interests: string[];
    categories: string[];
    priceRange: {
        min: number;
        max: number;
    };
    preferredBrands?: string[];
    viewedProducts: string[];
    purchasedProducts: string[];
    cartProducts: string[];
}

// ============================================
// RECOMMENDATION CONTEXT
// ============================================

export interface RecommendationContext {
    tenantId: string;
    leadId?: string;
    phone?: string;
    sessionId?: string;
    currentProductId?: string;
    cartProductIds?: string[];
    budget?: number;
    interests?: string[];
    category?: string;
    limit?: number;
    excludeProductIds?: string[];
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

// ============================================
// PRODUCT ANALYTICS
// ============================================

export interface ProductAnalytics {
    productId: string;
    tenantId: string;
    period: 'day' | 'week' | 'month';
    date: Date;
    views: number;
    addToCarts: number;
    purchases: number;
    revenue: number;
    conversionRate: number;
}

export interface CategoryAnalytics {
    category: string;
    tenantId: string;
    totalProducts: number;
    totalViews: number;
    totalPurchases: number;
    averagePrice: number;
    topProducts: string[];
}

// ============================================
// DTOs
// ============================================

export interface GetRecommendationsDTO {
    strategy?: RecommendationStrategy;
    leadId?: string;
    phone?: string;
    productId?: string;
    category?: string;
    budget?: number;
    interests?: string[];
    limit?: number;
}

export interface TrackInteractionDTO {
    productId: string;
    interactionType: ProductInteractionType;
    leadId?: string;
    phone?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
}

export interface ProductPopularityDTO {
    productId: string;
    views: number;
    purchases: number;
    cartAdds: number;
    score: number;
}
