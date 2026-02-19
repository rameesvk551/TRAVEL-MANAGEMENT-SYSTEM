/**
 * Recommendation Service - Business logic for product recommendations
 */

import { RecommendationRepository } from './recommendation.repository.js';
import { RecommendationEngine, ProductFetcher } from './recommendation.engine.js';
import {
    RecommendationStrategy,
    RecommendationContext,
    RecommendationResult,
    ProductInteractionType,
    TrackInteractionDTO,
    GetRecommendationsDTO,
    ProductPopularityDTO,
    LeadPreferences,
} from './recommendation.types.js';

export class RecommendationService {
    private engine: RecommendationEngine;

    constructor(
        private repository: RecommendationRepository,
        productFetcher: ProductFetcher
    ) {
        this.engine = new RecommendationEngine(repository, productFetcher);
    }

    // ============================================
    // RECOMMENDATIONS
    // ============================================

    async getRecommendations(
        tenantId: string,
        dto: GetRecommendationsDTO
    ): Promise<RecommendationResult> {
        const context: RecommendationContext = {
            tenantId,
            leadId: dto.leadId,
            phone: dto.phone,
            currentProductId: dto.productId,
            category: dto.category,
            budget: dto.budget,
            interests: dto.interests,
            limit: dto.limit || 5,
        };

        return this.engine.getRecommendations(context, dto.strategy);
    }

    async getPersonalizedRecommendations(
        tenantId: string,
        leadId: string,
        options?: {
            limit?: number;
            excludeProductIds?: string[];
        }
    ): Promise<RecommendationResult> {
        const context: RecommendationContext = {
            tenantId,
            leadId,
            limit: options?.limit || 5,
            excludeProductIds: options?.excludeProductIds,
        };

        // Try past purchases first, then interest, then popularity
        const result = await this.engine.getRecommendations(
            context,
            RecommendationStrategy.PAST_PURCHASES
        );

        if (result.products.length < (options?.limit || 5)) {
            // Supplement with popularity
            const popularResult = await this.engine.getRecommendations(
                {
                    ...context,
                    excludeProductIds: [
                        ...(options?.excludeProductIds || []),
                        ...result.products.map((p) => p.productId),
                    ],
                },
                RecommendationStrategy.POPULARITY
            );

            result.products.push(...popularResult.products);
            result.products = result.products.slice(0, options?.limit || 5);
        }

        return result;
    }

    async getSimilarProducts(
        tenantId: string,
        productId: string,
        limit: number = 5
    ): Promise<RecommendationResult> {
        return this.engine.getRecommendations(
            {
                tenantId,
                currentProductId: productId,
                limit,
            },
            RecommendationStrategy.SIMILAR_PRODUCTS
        );
    }

    async getCartRecommendations(
        tenantId: string,
        cartProductIds: string[],
        limit: number = 3
    ): Promise<RecommendationResult> {
        return this.engine.getRecommendations(
            {
                tenantId,
                cartProductIds,
                excludeProductIds: cartProductIds,
                limit,
            },
            RecommendationStrategy.COMPLEMENTARY
        );
    }

    async getUpsellProducts(
        tenantId: string,
        productId: string,
        limit: number = 3
    ): Promise<RecommendationResult> {
        return this.engine.getRecommendations(
            {
                tenantId,
                currentProductId: productId,
                excludeProductIds: [productId],
                limit,
            },
            RecommendationStrategy.UPSELL
        );
    }

    async getTrendingProducts(
        tenantId: string,
        options?: {
            category?: string;
            limit?: number;
        }
    ): Promise<RecommendationResult> {
        return this.engine.getRecommendations(
            {
                tenantId,
                category: options?.category,
                limit: options?.limit || 10,
            },
            RecommendationStrategy.TRENDING
        );
    }

    // ============================================
    // INTERACTION TRACKING
    // ============================================

    async trackInteraction(
        tenantId: string,
        dto: TrackInteractionDTO
    ): Promise<void> {
        await this.repository.trackInteraction(tenantId, dto);

        // Update lead preferences if lead is identified
        if (dto.leadId) {
            await this.updateLeadPreferencesFromInteraction(
                tenantId,
                dto.leadId,
                dto.productId,
                dto.interactionType
            );
        }
    }

    async trackView(
        tenantId: string,
        productId: string,
        options?: { leadId?: string; phone?: string; sessionId?: string }
    ): Promise<void> {
        await this.trackInteraction(tenantId, {
            productId,
            interactionType: ProductInteractionType.VIEW,
            ...options,
        });
    }

    async trackAddToCart(
        tenantId: string,
        productId: string,
        options?: { leadId?: string; phone?: string; quantity?: number }
    ): Promise<void> {
        await this.trackInteraction(tenantId, {
            productId,
            interactionType: ProductInteractionType.ADD_TO_CART,
            leadId: options?.leadId,
            phone: options?.phone,
            metadata: { quantity: options?.quantity },
        });
    }

    async trackPurchase(
        tenantId: string,
        productId: string,
        options?: { leadId?: string; phone?: string; quantity?: number; price?: number }
    ): Promise<void> {
        await this.trackInteraction(tenantId, {
            productId,
            interactionType: ProductInteractionType.PURCHASE,
            leadId: options?.leadId,
            phone: options?.phone,
            metadata: {
                quantity: options?.quantity,
                priceAtTime: options?.price,
            },
        });
    }

    private async updateLeadPreferencesFromInteraction(
        tenantId: string,
        leadId: string,
        productId: string,
        interactionType: ProductInteractionType
    ): Promise<void> {
        if (interactionType === ProductInteractionType.VIEW) {
            await this.repository.addToViewHistory(tenantId, leadId, productId);
        } else if (interactionType === ProductInteractionType.PURCHASE) {
            await this.repository.addToPurchaseHistory(tenantId, leadId, productId);
        }
    }

    // ============================================
    // ANALYTICS
    // ============================================

    async getPopularProducts(
        tenantId: string,
        options?: {
            since?: Date;
            limit?: number;
        }
    ): Promise<ProductPopularityDTO[]> {
        return this.repository.getProductPopularity(tenantId, options);
    }

    async getProductConversionStats(
        tenantId: string,
        productId: string
    ): Promise<{
        views: number;
        cartAdds: number;
        purchases: number;
        viewToCartRate: number;
        cartToPurchaseRate: number;
        overallConversionRate: number;
    }> {
        return this.repository.getConversionStats(tenantId, productId);
    }

    async getLeadPreferences(
        tenantId: string,
        leadId: string
    ): Promise<LeadPreferences | null> {
        return this.repository.getLeadPreferences(tenantId, leadId);
    }

    async updateLeadInterests(
        tenantId: string,
        leadId: string,
        interests: string[]
    ): Promise<void> {
        await this.repository.updateLeadPreferences(tenantId, leadId, { interests });
    }

    async updateLeadBudget(
        tenantId: string,
        leadId: string,
        min: number,
        max: number
    ): Promise<void> {
        await this.repository.updateLeadPreferences(tenantId, leadId, {
            priceRangeMin: min,
            priceRangeMax: max,
        });
    }

    // ============================================
    // FREQUENTLY BOUGHT TOGETHER
    // ============================================

    async getFrequentlyBoughtTogether(
        tenantId: string,
        productId: string,
        limit: number = 5
    ): Promise<string[]> {
        return this.repository.getFrequentlyBoughtTogether(tenantId, productId, limit);
    }

    async getAlsoViewedProducts(
        tenantId: string,
        productId: string,
        limit: number = 5
    ): Promise<string[]> {
        return this.repository.getAlsoViewed(tenantId, productId, limit);
    }
}
