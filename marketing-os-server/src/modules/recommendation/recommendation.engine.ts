/**
 * Recommendation Engine - Smart product recommendation algorithms
 */

import { RecommendationRepository } from './recommendation.repository.js';
import {
    RecommendationStrategy,
    RecommendationContext,
    RecommendationResult,
    RecommendedProduct,
    ProductInteractionType,
    LeadPreferences,
} from './recommendation.types.js';

// Product interface (simplified - actual product model may differ)
interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    imageUrl?: string;
    stock?: number;
    tags?: string[];
    brand?: string;
    isActive?: boolean;
}

// Product fetcher interface for dependency injection
export interface ProductFetcher {
    getProductById(tenantId: string, productId: string): Promise<Product | null>;
    getProductsByIds(tenantId: string, productIds: string[]): Promise<Product[]>;
    getProductsByCategory(tenantId: string, category: string, limit?: number): Promise<Product[]>;
    searchProducts(tenantId: string, query: string, limit?: number): Promise<Product[]>;
    getAllProducts(tenantId: string, options?: { limit?: number; offset?: number }): Promise<Product[]>;
}

export class RecommendationEngine {
    constructor(
        private repository: RecommendationRepository,
        private productFetcher: ProductFetcher
    ) {}

    // ============================================
    // MAIN RECOMMENDATION ENTRY POINT
    // ============================================

    async getRecommendations(
        context: RecommendationContext,
        strategy?: RecommendationStrategy
    ): Promise<RecommendationResult> {
        const startTime = Date.now();
        const limit = context.limit || 5;

        // Auto-select strategy if not specified
        const selectedStrategy = strategy || this.selectBestStrategy(context);

        let recommendations: RecommendedProduct[] = [];

        switch (selectedStrategy) {
            case RecommendationStrategy.INTEREST_BASED:
                recommendations = await this.interestBasedRecommendations(context);
                break;

            case RecommendationStrategy.BUDGET_BASED:
                recommendations = await this.budgetBasedRecommendations(context);
                break;

            case RecommendationStrategy.POPULARITY:
                recommendations = await this.popularityRecommendations(context);
                break;

            case RecommendationStrategy.SIMILAR_PRODUCTS:
                recommendations = await this.similarProductRecommendations(context);
                break;

            case RecommendationStrategy.PAST_PURCHASES:
                recommendations = await this.pastPurchaseRecommendations(context);
                break;

            case RecommendationStrategy.CART_BASED:
                recommendations = await this.cartBasedRecommendations(context);
                break;

            case RecommendationStrategy.TRENDING:
                recommendations = await this.trendingRecommendations(context);
                break;

            case RecommendationStrategy.NEW_ARRIVALS:
                recommendations = await this.newArrivalsRecommendations(context);
                break;

            case RecommendationStrategy.COMPLEMENTARY:
                recommendations = await this.complementaryRecommendations(context);
                break;

            case RecommendationStrategy.UPSELL:
                recommendations = await this.upsellRecommendations(context);
                break;

            case RecommendationStrategy.CROSS_SELL:
                recommendations = await this.crossSellRecommendations(context);
                break;

            default:
                recommendations = await this.popularityRecommendations(context);
        }

        // Apply exclusions
        if (context.excludeProductIds?.length) {
            const excludeSet = new Set(context.excludeProductIds);
            recommendations = recommendations.filter(
                (r) => !excludeSet.has(r.productId)
            );
        }

        // Limit results
        recommendations = recommendations.slice(0, limit);

        // Calculate confidence based on data quality
        const confidence = this.calculateConfidence(recommendations, context);

        return {
            products: recommendations,
            strategy: selectedStrategy,
            confidence,
            metadata: {
                totalCandidates: recommendations.length,
                processingTime: Date.now() - startTime,
                factors: this.getStrategyFactors(selectedStrategy),
            },
        };
    }

    // ============================================
    // STRATEGY SELECTION
    // ============================================

    private selectBestStrategy(context: RecommendationContext): RecommendationStrategy {
        // If viewing a specific product, suggest similar
        if (context.currentProductId) {
            return RecommendationStrategy.SIMILAR_PRODUCTS;
        }

        // If cart has items, suggest complementary
        if (context.cartProductIds?.length) {
            return RecommendationStrategy.COMPLEMENTARY;
        }

        // If budget specified, filter by budget
        if (context.budget) {
            return RecommendationStrategy.BUDGET_BASED;
        }

        // If interests specified, use interest-based
        if (context.interests?.length) {
            return RecommendationStrategy.INTEREST_BASED;
        }

        // If lead has history, use past purchases
        if (context.leadId) {
            return RecommendationStrategy.PAST_PURCHASES;
        }

        // Default to popularity
        return RecommendationStrategy.POPULARITY;
    }

    // ============================================
    // INTEREST-BASED RECOMMENDATIONS
    // ============================================

    private async interestBasedRecommendations(
        context: RecommendationContext
    ): Promise<RecommendedProduct[]> {
        const { tenantId, leadId, interests } = context;
        const recommendations: RecommendedProduct[] = [];

        // Get lead preferences if available
        let leadInterests = interests || [];
        if (leadId && !interests?.length) {
            const prefs = await this.repository.getLeadPreferences(tenantId, leadId);
            if (prefs) {
                leadInterests = prefs.interests;
            }
        }

        if (!leadInterests.length) {
            // Fall back to popularity
            return this.popularityRecommendations(context);
        }

        // Search products matching interests
        for (const interest of leadInterests.slice(0, 3)) {
            const products = await this.productFetcher.searchProducts(
                tenantId,
                interest,
                5
            );

            for (const product of products) {
                recommendations.push({
                    productId: product.id,
                    product: this.formatProduct(product),
                    score: 0.8,
                    reason: `Matches your interest: ${interest}`,
                    matchFactors: ['interest', interest],
                });
            }
        }

        return this.deduplicateAndScore(recommendations);
    }

    // ============================================
    // BUDGET-BASED RECOMMENDATIONS
    // ============================================

    private async budgetBasedRecommendations(
        context: RecommendationContext
    ): Promise<RecommendedProduct[]> {
        const { tenantId, budget, category } = context;
        const recommendations: RecommendedProduct[] = [];

        if (!budget) {
            return this.popularityRecommendations(context);
        }

        // Get products within budget
        let products: Product[];
        if (category) {
            products = await this.productFetcher.getProductsByCategory(tenantId, category, 50);
        } else {
            products = await this.productFetcher.getAllProducts(tenantId, { limit: 100 });
        }

        // Filter by budget and sort by price (best value)
        const withinBudget = products
            .filter((p) => p.price <= budget && p.isActive !== false)
            .sort((a, b) => b.price - a.price); // Highest price within budget first

        for (const product of withinBudget.slice(0, 10)) {
            const valueRatio = product.price / budget;
            recommendations.push({
                productId: product.id,
                product: this.formatProduct(product),
                score: valueRatio * 0.9, // Higher score for products closer to budget
                reason: `Within your budget of ${budget}`,
                matchFactors: ['budget', 'value'],
            });
        }

        return recommendations;
    }

    // ============================================
    // POPULARITY RECOMMENDATIONS
    // ============================================

    private async popularityRecommendations(
        context: RecommendationContext
    ): Promise<RecommendedProduct[]> {
        const { tenantId, category } = context;
        const recommendations: RecommendedProduct[] = [];

        // Get popular products
        const popular = await this.repository.getProductPopularity(tenantId, {
            limit: 20,
        });

        // Fetch product details
        const productIds = popular.map((p) => p.productId);
        const products = await this.productFetcher.getProductsByIds(tenantId, productIds);
        const productMap = new Map(products.map((p) => [p.id, p]));

        for (const pop of popular) {
            const product = productMap.get(pop.productId);
            if (!product || product.isActive === false) continue;

            // Filter by category if specified
            if (category && product.category !== category) continue;

            const normalizedScore = Math.min(pop.score / 1000, 1); // Normalize score
            recommendations.push({
                productId: pop.productId,
                product: this.formatProduct(product),
                score: normalizedScore,
                reason: 'Popular choice',
                matchFactors: ['popularity', 'social_proof'],
            });
        }

        return recommendations;
    }

    // ============================================
    // SIMILAR PRODUCT RECOMMENDATIONS
    // ============================================

    private async similarProductRecommendations(
        context: RecommendationContext
    ): Promise<RecommendedProduct[]> {
        const { tenantId, currentProductId } = context;
        const recommendations: RecommendedProduct[] = [];

        if (!currentProductId) {
            return this.popularityRecommendations(context);
        }

        // Get current product
        const currentProduct = await this.productFetcher.getProductById(
            tenantId,
            currentProductId
        );

        if (!currentProduct) {
            return this.popularityRecommendations(context);
        }

        // Get "also viewed" products
        const alsoViewed = await this.repository.getAlsoViewed(
            tenantId,
            currentProductId,
            10
        );

        // Get products in same category
        const categoryProducts = currentProduct.category
            ? await this.productFetcher.getProductsByCategory(
                  tenantId,
                  currentProduct.category,
                  10
              )
            : [];

        // Combine and score
        const candidateIds = new Set([
            ...alsoViewed,
            ...categoryProducts.map((p) => p.id),
        ]);
        candidateIds.delete(currentProductId);

        const products = await this.productFetcher.getProductsByIds(
            tenantId,
            Array.from(candidateIds)
        );

        for (const product of products) {
            if (product.isActive === false) continue;

            const factors: string[] = ['similar'];
            let score = 0.5;

            // Boost if in same category
            if (product.category === currentProduct.category) {
                score += 0.2;
                factors.push('same_category');
            }

            // Boost if similar price range (within 30%)
            const priceDiff = Math.abs(product.price - currentProduct.price) / currentProduct.price;
            if (priceDiff < 0.3) {
                score += 0.15;
                factors.push('similar_price');
            }

            // Boost if in "also viewed"
            if (alsoViewed.includes(product.id)) {
                score += 0.15;
                factors.push('also_viewed');
            }

            recommendations.push({
                productId: product.id,
                product: this.formatProduct(product),
                score: Math.min(score, 1),
                reason: 'Similar to what you\'re viewing',
                matchFactors: factors,
            });
        }

        return recommendations.sort((a, b) => b.score - a.score);
    }

    // ============================================
    // PAST PURCHASE RECOMMENDATIONS
    // ============================================

    private async pastPurchaseRecommendations(
        context: RecommendationContext
    ): Promise<RecommendedProduct[]> {
        const { tenantId, leadId } = context;
        const recommendations: RecommendedProduct[] = [];

        if (!leadId) {
            return this.popularityRecommendations(context);
        }

        // Get purchased products
        const purchasedIds = await this.repository.getPurchasedProductsByLead(
            tenantId,
            leadId,
            10
        );

        if (!purchasedIds.length) {
            // No purchase history - try viewed products
            const viewedIds = await this.repository.getViewedProductsByLead(
                tenantId,
                leadId,
                10
            );

            if (!viewedIds.length) {
                return this.popularityRecommendations(context);
            }

            // Recommend products similar to viewed
            const viewedProducts = await this.productFetcher.getProductsByIds(
                tenantId,
                viewedIds
            );

            for (const product of viewedProducts) {
                if (product.isActive === false) continue;

                recommendations.push({
                    productId: product.id,
                    product: this.formatProduct(product),
                    score: 0.6,
                    reason: 'Based on your browsing history',
                    matchFactors: ['viewed', 'history'],
                });
            }

            return recommendations;
        }

        // Get frequently bought together with past purchases
        const complementaryIds = new Set<string>();
        for (const productId of purchasedIds.slice(0, 5)) {
            const related = await this.repository.getFrequentlyBoughtTogether(
                tenantId,
                productId,
                5
            );
            related.forEach((id) => complementaryIds.add(id));
        }

        // Remove already purchased
        purchasedIds.forEach((id) => complementaryIds.delete(id));

        const complementaryProducts = await this.productFetcher.getProductsByIds(
            tenantId,
            Array.from(complementaryIds)
        );

        for (const product of complementaryProducts) {
            if (product.isActive === false) continue;

            recommendations.push({
                productId: product.id,
                product: this.formatProduct(product),
                score: 0.85,
                reason: 'Based on your purchase history',
                matchFactors: ['past_purchase', 'frequently_bought_together'],
            });
        }

        return recommendations;
    }

    // ============================================
    // CART-BASED RECOMMENDATIONS
    // ============================================

    private async cartBasedRecommendations(
        context: RecommendationContext
    ): Promise<RecommendedProduct[]> {
        const { tenantId, cartProductIds, leadId } = context;

        let cartIds = cartProductIds || [];

        // Get cart from lead if not provided
        if (!cartIds.length && leadId) {
            cartIds = await this.repository.getCartProductsByLead(tenantId, leadId);
        }

        if (!cartIds.length) {
            return this.popularityRecommendations(context);
        }

        // Get complementary products for cart items
        const complementaryIds = new Set<string>();
        for (const productId of cartIds) {
            const related = await this.repository.getFrequentlyBoughtTogether(
                tenantId,
                productId,
                3
            );
            related.forEach((id) => complementaryIds.add(id));
        }

        // Remove items already in cart
        cartIds.forEach((id) => complementaryIds.delete(id));

        const products = await this.productFetcher.getProductsByIds(
            tenantId,
            Array.from(complementaryIds)
        );

        return products
            .filter((p) => p.isActive !== false)
            .map((product) => ({
                productId: product.id,
                product: this.formatProduct(product),
                score: 0.8,
                reason: 'Frequently bought with items in your cart',
                matchFactors: ['cart', 'complementary'],
            }));
    }

    // ============================================
    // TRENDING RECOMMENDATIONS
    // ============================================

    private async trendingRecommendations(
        context: RecommendationContext
    ): Promise<RecommendedProduct[]> {
        const { tenantId, category } = context;

        const trending = await this.repository.getTrendingProducts(tenantId, {
            days: 7,
            limit: 20,
        });

        const productIds = trending.map((t) => t.productId);
        const products = await this.productFetcher.getProductsByIds(tenantId, productIds);
        const productMap = new Map(products.map((p) => [p.id, p]));

        const recommendations: RecommendedProduct[] = [];

        for (const trend of trending) {
            const product = productMap.get(trend.productId);
            if (!product || product.isActive === false) continue;

            if (category && product.category !== category) continue;

            const normalizedScore = Math.min(trend.score / 500, 1);
            recommendations.push({
                productId: trend.productId,
                product: this.formatProduct(product),
                score: normalizedScore,
                reason: 'Trending this week',
                matchFactors: ['trending', 'recent_popularity'],
            });
        }

        return recommendations;
    }

    // ============================================
    // NEW ARRIVALS RECOMMENDATIONS
    // ============================================

    private async newArrivalsRecommendations(
        context: RecommendationContext
    ): Promise<RecommendedProduct[]> {
        const { tenantId, category } = context;

        // Get all products and sort by newest (assuming products have createdAt)
        const products = await this.productFetcher.getAllProducts(tenantId, { limit: 50 });

        // Filter by category if specified
        const filtered = category
            ? products.filter((p) => p.category === category && p.isActive !== false)
            : products.filter((p) => p.isActive !== false);

        return filtered.slice(0, 10).map((product, index) => ({
            productId: product.id,
            product: this.formatProduct(product),
            score: 1 - index * 0.1, // Newer = higher score
            reason: 'New arrival',
            matchFactors: ['new', 'fresh'],
        }));
    }

    // ============================================
    // COMPLEMENTARY RECOMMENDATIONS
    // ============================================

    private async complementaryRecommendations(
        context: RecommendationContext
    ): Promise<RecommendedProduct[]> {
        // Similar to cart-based but focused on current product
        const { tenantId, currentProductId, cartProductIds } = context;

        const baseProductIds = currentProductId
            ? [currentProductId]
            : cartProductIds || [];

        if (!baseProductIds.length) {
            return this.popularityRecommendations(context);
        }

        const complementaryIds = new Set<string>();
        for (const productId of baseProductIds) {
            const related = await this.repository.getFrequentlyBoughtTogether(
                tenantId,
                productId,
                5
            );
            related.forEach((id) => complementaryIds.add(id));
        }

        baseProductIds.forEach((id) => complementaryIds.delete(id));

        const products = await this.productFetcher.getProductsByIds(
            tenantId,
            Array.from(complementaryIds)
        );

        return products
            .filter((p) => p.isActive !== false)
            .map((product) => ({
                productId: product.id,
                product: this.formatProduct(product),
                score: 0.75,
                reason: 'Goes well together',
                matchFactors: ['complementary', 'bundle'],
            }));
    }

    // ============================================
    // UPSELL RECOMMENDATIONS
    // ============================================

    private async upsellRecommendations(
        context: RecommendationContext
    ): Promise<RecommendedProduct[]> {
        const { tenantId, currentProductId } = context;

        if (!currentProductId) {
            return this.popularityRecommendations(context);
        }

        const currentProduct = await this.productFetcher.getProductById(
            tenantId,
            currentProductId
        );

        if (!currentProduct) {
            return this.popularityRecommendations(context);
        }

        // Get products in same category with higher price
        const categoryProducts = currentProduct.category
            ? await this.productFetcher.getProductsByCategory(
                  tenantId,
                  currentProduct.category,
                  50
              )
            : await this.productFetcher.getAllProducts(tenantId, { limit: 50 });

        // Filter: higher price but not more than 50% more expensive
        const upsells = categoryProducts
            .filter((p) => {
                if (p.id === currentProductId || p.isActive === false) return false;
                const priceIncrease = (p.price - currentProduct.price) / currentProduct.price;
                return priceIncrease > 0.1 && priceIncrease < 0.5;
            })
            .sort((a, b) => a.price - b.price); // Lowest upsell first

        return upsells.slice(0, 5).map((product) => ({
            productId: product.id,
            product: this.formatProduct(product),
            score: 0.7,
            reason: 'Premium option with more features',
            matchFactors: ['upsell', 'premium'],
        }));
    }

    // ============================================
    // CROSS-SELL RECOMMENDATIONS
    // ============================================

    private async crossSellRecommendations(
        context: RecommendationContext
    ): Promise<RecommendedProduct[]> {
        const { tenantId, currentProductId, cartProductIds } = context;

        const baseIds = [
            ...(currentProductId ? [currentProductId] : []),
            ...(cartProductIds || []),
        ];

        if (!baseIds.length) {
            return this.popularityRecommendations(context);
        }

        // Get products from different categories
        const baseProducts = await this.productFetcher.getProductsByIds(
            tenantId,
            baseIds
        );

        const baseCategories = new Set(
            baseProducts.map((p) => p.category).filter(Boolean)
        );

        // Get popular products from OTHER categories
        const allProducts = await this.productFetcher.getAllProducts(tenantId, { limit: 100 });

        const crossSells = allProducts
            .filter((p) => {
                if (baseIds.includes(p.id) || p.isActive === false) return false;
                // Different category
                return p.category && !baseCategories.has(p.category);
            })
            .slice(0, 10);

        return crossSells.map((product) => ({
            productId: product.id,
            product: this.formatProduct(product),
            score: 0.6,
            reason: 'You might also like',
            matchFactors: ['cross_sell', 'discovery'],
        }));
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private formatProduct(product: Product): RecommendedProduct['product'] {
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            imageUrl: product.imageUrl,
            stock: product.stock,
        };
    }

    private deduplicateAndScore(
        recommendations: RecommendedProduct[]
    ): RecommendedProduct[] {
        const productMap = new Map<string, RecommendedProduct>();

        for (const rec of recommendations) {
            const existing = productMap.get(rec.productId);
            if (existing) {
                // Combine scores and factors
                existing.score = Math.min(existing.score + rec.score * 0.3, 1);
                existing.matchFactors = [
                    ...new Set([...existing.matchFactors, ...rec.matchFactors]),
                ];
            } else {
                productMap.set(rec.productId, { ...rec });
            }
        }

        return Array.from(productMap.values()).sort((a, b) => b.score - a.score);
    }

    private calculateConfidence(
        recommendations: RecommendedProduct[],
        context: RecommendationContext
    ): number {
        if (recommendations.length === 0) return 0;

        let confidence = 0.5; // Base confidence

        // More recommendations = higher confidence
        confidence += Math.min(recommendations.length / 10, 0.2);

        // Average score factor
        const avgScore =
            recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length;
        confidence += avgScore * 0.2;

        // More context = higher confidence
        if (context.leadId) confidence += 0.05;
        if (context.interests?.length) confidence += 0.05;
        if (context.budget) confidence += 0.05;
        if (context.currentProductId) confidence += 0.05;

        return Math.min(confidence, 1);
    }

    private getStrategyFactors(strategy: RecommendationStrategy): string[] {
        const factorMap: Record<RecommendationStrategy, string[]> = {
            [RecommendationStrategy.INTEREST_BASED]: ['user_interests', 'preferences'],
            [RecommendationStrategy.BUDGET_BASED]: ['price_filter', 'value'],
            [RecommendationStrategy.POPULARITY]: ['social_proof', 'sales_data'],
            [RecommendationStrategy.SIMILAR_PRODUCTS]: ['product_similarity', 'category'],
            [RecommendationStrategy.PAST_PURCHASES]: ['purchase_history', 'repeat_customer'],
            [RecommendationStrategy.CART_BASED]: ['cart_items', 'bundle_affinity'],
            [RecommendationStrategy.TRENDING]: ['recency', 'growth_rate'],
            [RecommendationStrategy.NEW_ARRIVALS]: ['freshness', 'catalog_date'],
            [RecommendationStrategy.COMPLEMENTARY]: ['product_affinity', 'co_purchase'],
            [RecommendationStrategy.UPSELL]: ['premium_tier', 'feature_upgrade'],
            [RecommendationStrategy.CROSS_SELL]: ['category_expansion', 'discovery'],
        };

        return factorMap[strategy] || [];
    }
}
