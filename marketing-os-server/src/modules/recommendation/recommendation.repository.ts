/**
 * Recommendation Repository - Data access for product interactions and analytics
 */

import { Op, Sequelize, literal, fn, col } from 'sequelize';
import {
    ProductInteractionModel,
    ProductAnalyticsModel,
    LeadPreferencesModel,
} from './recommendation.model.js';
import {
    ProductInteraction,
    ProductInteractionType,
    TrackInteractionDTO,
    ProductPopularityDTO,
    LeadPreferences,
} from './recommendation.types.js';

export class RecommendationRepository {
    // ============================================
    // INTERACTION TRACKING
    // ============================================

    async trackInteraction(
        tenantId: string,
        data: TrackInteractionDTO
    ): Promise<ProductInteraction> {
        return ProductInteractionModel.create({
            tenantId,
            productId: data.productId,
            interactionType: data.interactionType,
            leadId: data.leadId,
            phone: data.phone,
            sessionId: data.sessionId,
            metadata: data.metadata,
        } as ProductInteraction);
    }

    async getInteractionsByLead(
        tenantId: string,
        leadId: string,
        options?: {
            types?: ProductInteractionType[];
            limit?: number;
            since?: Date;
        }
    ): Promise<ProductInteraction[]> {
        const where: any = { tenantId, leadId };

        if (options?.types?.length) {
            where.interactionType = { [Op.in]: options.types };
        }

        if (options?.since) {
            where.createdAt = { [Op.gte]: options.since };
        }

        return ProductInteractionModel.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: options?.limit || 100,
        });
    }

    async getInteractionsByPhone(
        tenantId: string,
        phone: string,
        options?: {
            types?: ProductInteractionType[];
            limit?: number;
            since?: Date;
        }
    ): Promise<ProductInteraction[]> {
        const where: any = { tenantId, phone };

        if (options?.types?.length) {
            where.interactionType = { [Op.in]: options.types };
        }

        if (options?.since) {
            where.createdAt = { [Op.gte]: options.since };
        }

        return ProductInteractionModel.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: options?.limit || 100,
        });
    }

    async getInteractionsByProduct(
        tenantId: string,
        productId: string,
        options?: {
            types?: ProductInteractionType[];
            limit?: number;
            since?: Date;
        }
    ): Promise<ProductInteraction[]> {
        const where: any = { tenantId, productId };

        if (options?.types?.length) {
            where.interactionType = { [Op.in]: options.types };
        }

        if (options?.since) {
            where.createdAt = { [Op.gte]: options.since };
        }

        return ProductInteractionModel.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: options?.limit || 100,
        });
    }

    // ============================================
    // POPULARITY METRICS
    // ============================================

    async getProductPopularity(
        tenantId: string,
        options?: {
            since?: Date;
            limit?: number;
            category?: string;
        }
    ): Promise<ProductPopularityDTO[]> {
        const where: any = { tenantId };

        if (options?.since) {
            where.createdAt = { [Op.gte]: options.since };
        }

        const results = await ProductInteractionModel.findAll({
            where,
            attributes: [
                'productId',
                [fn('COUNT', literal(`CASE WHEN interaction_type = 'view' THEN 1 END`)), 'views'],
                [fn('COUNT', literal(`CASE WHEN interaction_type = 'purchase' THEN 1 END`)), 'purchases'],
                [fn('COUNT', literal(`CASE WHEN interaction_type = 'add_to_cart' THEN 1 END`)), 'cartAdds'],
            ],
            group: ['productId'],
            order: [[literal('views'), 'DESC']],
            limit: options?.limit || 50,
            raw: true,
        }) as any[];

        return results.map((r) => ({
            productId: r.productId,
            views: parseInt(r.views) || 0,
            purchases: parseInt(r.purchases) || 0,
            cartAdds: parseInt(r.cartAdds) || 0,
            score: this.calculatePopularityScore(
                parseInt(r.views) || 0,
                parseInt(r.purchases) || 0,
                parseInt(r.cartAdds) || 0
            ),
        }));
    }

    private calculatePopularityScore(views: number, purchases: number, cartAdds: number): number {
        // Weighted scoring: purchases have highest weight
        return views * 1 + cartAdds * 3 + purchases * 10;
    }

    async getTrendingProducts(
        tenantId: string,
        options?: {
            days?: number;
            limit?: number;
        }
    ): Promise<ProductPopularityDTO[]> {
        const since = new Date();
        since.setDate(since.getDate() - (options?.days || 7));

        return this.getProductPopularity(tenantId, {
            since,
            limit: options?.limit || 20,
        });
    }

    // ============================================
    // LEAD PREFERENCES
    // ============================================

    async getLeadPreferences(
        tenantId: string,
        leadId: string
    ): Promise<LeadPreferences | null> {
        const prefs = await LeadPreferencesModel.findOne({
            where: { tenantId, leadId },
        });

        if (!prefs) return null;

        return {
            interests: prefs.interests,
            categories: prefs.categories,
            priceRange: {
                min: prefs.priceRangeMin ? Number(prefs.priceRangeMin) : 0,
                max: prefs.priceRangeMax ? Number(prefs.priceRangeMax) : Infinity,
            },
            preferredBrands: prefs.preferredBrands,
            viewedProducts: prefs.viewHistory,
            purchasedProducts: prefs.purchaseHistory,
            cartProducts: [],
        };
    }

    async updateLeadPreferences(
        tenantId: string,
        leadId: string,
        updates: Partial<{
            interests: string[];
            categories: string[];
            priceRangeMin: number;
            priceRangeMax: number;
            preferredBrands: string[];
        }>
    ): Promise<void> {
        await LeadPreferencesModel.upsert({
            tenantId,
            leadId,
            ...updates,
            updatedAt: new Date(),
        } as any);
    }

    async addToViewHistory(
        tenantId: string,
        leadId: string,
        productId: string
    ): Promise<void> {
        const prefs = await LeadPreferencesModel.findOne({
            where: { tenantId, leadId },
        });

        if (prefs) {
            const viewHistory = prefs.viewHistory.filter((id) => id !== productId);
            viewHistory.unshift(productId); // Add to front
            if (viewHistory.length > 50) viewHistory.pop(); // Keep last 50

            await prefs.update({ viewHistory, updatedAt: new Date() });
        } else {
            await LeadPreferencesModel.create({
                tenantId,
                leadId,
                interests: [],
                categories: [],
                viewHistory: [productId],
                purchaseHistory: [],
            } as any);
        }
    }

    async addToPurchaseHistory(
        tenantId: string,
        leadId: string,
        productId: string
    ): Promise<void> {
        const prefs = await LeadPreferencesModel.findOne({
            where: { tenantId, leadId },
        });

        if (prefs) {
            const purchaseHistory = prefs.purchaseHistory.filter((id) => id !== productId);
            purchaseHistory.unshift(productId);
            await prefs.update({ purchaseHistory, updatedAt: new Date() });
        } else {
            await LeadPreferencesModel.create({
                tenantId,
                leadId,
                interests: [],
                categories: [],
                viewHistory: [],
                purchaseHistory: [productId],
            } as any);
        }
    }

    // ============================================
    // ANALYTICS HELPERS
    // ============================================

    async getViewedProductsByLead(
        tenantId: string,
        leadId: string,
        limit: number = 20
    ): Promise<string[]> {
        const interactions = await ProductInteractionModel.findAll({
            where: {
                tenantId,
                leadId,
                interactionType: ProductInteractionType.VIEW,
            },
            attributes: ['productId'],
            group: ['productId'],
            order: [[fn('MAX', col('created_at')), 'DESC']],
            limit,
            raw: true,
        }) as any[];

        return interactions.map((i) => i.productId);
    }

    async getPurchasedProductsByLead(
        tenantId: string,
        leadId: string,
        limit: number = 20
    ): Promise<string[]> {
        const interactions = await ProductInteractionModel.findAll({
            where: {
                tenantId,
                leadId,
                interactionType: ProductInteractionType.PURCHASE,
            },
            attributes: ['productId'],
            group: ['productId'],
            order: [[fn('MAX', col('created_at')), 'DESC']],
            limit,
            raw: true,
        }) as any[];

        return interactions.map((i) => i.productId);
    }

    async getCartProductsByLead(
        tenantId: string,
        leadId: string
    ): Promise<string[]> {
        // Get products added to cart but not purchased
        const cartInteractions = await ProductInteractionModel.findAll({
            where: {
                tenantId,
                leadId,
                interactionType: ProductInteractionType.ADD_TO_CART,
            },
            attributes: ['productId'],
            order: [['createdAt', 'DESC']],
            raw: true,
        }) as any[];

        const purchasedProducts = await this.getPurchasedProductsByLead(tenantId, leadId, 100);
        const purchasedSet = new Set(purchasedProducts);

        return cartInteractions
            .filter((i) => !purchasedSet.has(i.productId))
            .map((i) => i.productId);
    }

    // ============================================
    // CO-OCCURRENCE ANALYSIS
    // ============================================

    async getFrequentlyBoughtTogether(
        tenantId: string,
        productId: string,
        limit: number = 5
    ): Promise<string[]> {
        // Find leads who purchased this product
        const purchasers = await ProductInteractionModel.findAll({
            where: {
                tenantId,
                productId,
                interactionType: ProductInteractionType.PURCHASE,
            },
            attributes: ['leadId'],
            raw: true,
        }) as any[];

        const leadIds = purchasers.map((p) => p.leadId).filter(Boolean);

        if (leadIds.length === 0) return [];

        // Find other products those leads purchased
        const otherPurchases = await ProductInteractionModel.findAll({
            where: {
                tenantId,
                leadId: { [Op.in]: leadIds },
                productId: { [Op.ne]: productId },
                interactionType: ProductInteractionType.PURCHASE,
            },
            attributes: [
                'productId',
                [fn('COUNT', col('id')), 'count'],
            ],
            group: ['productId'],
            order: [[literal('count'), 'DESC']],
            limit,
            raw: true,
        }) as any[];

        return otherPurchases.map((p) => p.productId);
    }

    async getAlsoViewed(
        tenantId: string,
        productId: string,
        limit: number = 5
    ): Promise<string[]> {
        // Find leads/sessions who viewed this product
        const viewers = await ProductInteractionModel.findAll({
            where: {
                tenantId,
                productId,
                interactionType: ProductInteractionType.VIEW,
            },
            attributes: ['leadId', 'sessionId'],
            raw: true,
        }) as any[];

        const leadIds = viewers.map((v) => v.leadId).filter(Boolean);
        const sessionIds = viewers.map((v) => v.sessionId).filter(Boolean);

        if (leadIds.length === 0 && sessionIds.length === 0) return [];

        const orConditions: any[] = [];
        if (leadIds.length > 0) orConditions.push({ leadId: { [Op.in]: leadIds } });
        if (sessionIds.length > 0) orConditions.push({ sessionId: { [Op.in]: sessionIds } });

        // Find other products those users viewed
        const otherViews = await ProductInteractionModel.findAll({
            where: {
                tenantId,
                [Op.or]: orConditions,
                productId: { [Op.ne]: productId },
                interactionType: ProductInteractionType.VIEW,
            },
            attributes: [
                'productId',
                [fn('COUNT', col('id')), 'count'],
            ],
            group: ['productId'],
            order: [[literal('count'), 'DESC']],
            limit,
            raw: true,
        }) as any[];

        return otherViews.map((p) => p.productId);
    }

    // ============================================
    // CONVERSION ANALYTICS
    // ============================================

    async getConversionStats(
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
        const stats = await ProductInteractionModel.findAll({
            where: { tenantId, productId },
            attributes: [
                [fn('COUNT', literal(`CASE WHEN interaction_type = 'view' THEN 1 END`)), 'views'],
                [fn('COUNT', literal(`CASE WHEN interaction_type = 'add_to_cart' THEN 1 END`)), 'cartAdds'],
                [fn('COUNT', literal(`CASE WHEN interaction_type = 'purchase' THEN 1 END`)), 'purchases'],
            ],
            raw: true,
        }) as any[];

        const views = parseInt(stats[0]?.views) || 0;
        const cartAdds = parseInt(stats[0]?.cartAdds) || 0;
        const purchases = parseInt(stats[0]?.purchases) || 0;

        return {
            views,
            cartAdds,
            purchases,
            viewToCartRate: views > 0 ? cartAdds / views : 0,
            cartToPurchaseRate: cartAdds > 0 ? purchases / cartAdds : 0,
            overallConversionRate: views > 0 ? purchases / views : 0,
        };
    }
}
