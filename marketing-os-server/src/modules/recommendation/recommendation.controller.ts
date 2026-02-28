/**
 * Recommendation Controller - HTTP handlers for product recommendations
 */

import { Request, Response, NextFunction } from 'express';
import { RecommendationService } from './recommendation.service.js';
import { RecommendationStrategy, ProductInteractionType } from './recommendation.types.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AppError } from '../../utils/appError.js';

export class RecommendationController {
    constructor(private service: RecommendationService) { }

    // ============================================
    // RECOMMENDATIONS
    // ============================================

    /**
     * GET /recommendations
     * Get product recommendations based on various strategies
     */
    getRecommendations = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const {
            strategy,
            leadId,
            phone,
            productId,
            category,
            budget,
            interests,
            limit,
        } = req.query;

        const result = await this.service.getRecommendations(tenantId, {
            strategy: strategy as RecommendationStrategy,
            leadId: leadId as string,
            phone: phone as string,
            productId: productId as string,
            category: category as string,
            budget: budget ? Number(budget) : undefined,
            interests: interests ? (interests as string).split(',') : undefined,
            limit: limit ? Number(limit) : undefined,
        });

        return ApiResponse.success(res, result);
    });

    /**
     * GET /recommendations/personalized/:leadId
     * Get personalized recommendations for a specific lead
     */
    getPersonalizedRecommendations = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { leadId } = req.params;
        const { limit, exclude } = req.query;

        const result = await this.service.getPersonalizedRecommendations(
            tenantId,
            leadId,
            {
                limit: limit ? Number(limit) : undefined,
                excludeProductIds: exclude ? (exclude as string).split(',') : undefined,
            }
        );

        return ApiResponse.success(res, result);
    });

    /**
     * GET /recommendations/similar/:productId
     * Get similar products
     */
    getSimilarProducts = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { productId } = req.params;
        const { limit } = req.query;

        const result = await this.service.getSimilarProducts(
            tenantId,
            productId,
            limit ? Number(limit) : undefined
        );

        return ApiResponse.success(res, result);
    });

    /**
     * POST /recommendations/cart
     * Get recommendations based on cart items
     */
    getCartRecommendations = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { productIds, limit } = req.body;

        if (!productIds || !Array.isArray(productIds)) {
            throw new AppError('productIds array required', 400);
        }

        const result = await this.service.getCartRecommendations(
            tenantId,
            productIds,
            limit
        );

        return ApiResponse.success(res, result);
    });

    /**
     * GET /recommendations/upsell/:productId
     * Get upsell products
     */
    getUpsellProducts = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { productId } = req.params;
        const { limit } = req.query;

        const result = await this.service.getUpsellProducts(
            tenantId,
            productId,
            limit ? Number(limit) : undefined
        );

        return ApiResponse.success(res, result);
    });

    /**
     * GET /recommendations/trending
     * Get trending products
     */
    getTrendingProducts = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { category, limit } = req.query;

        const result = await this.service.getTrendingProducts(tenantId, {
            category: category as string,
            limit: limit ? Number(limit) : undefined,
        });

        return ApiResponse.success(res, result);
    });

    // ============================================
    // INTERACTION TRACKING
    // ============================================

    /**
     * POST /recommendations/track
     * Track a product interaction
     */
    trackInteraction = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { productId, interactionType, leadId, phone, sessionId, metadata } = req.body;

        if (!productId) {
            throw new AppError('productId required', 400);
        }

        if (!interactionType || !Object.values(ProductInteractionType).includes(interactionType)) {
            throw new AppError('Valid interactionType required', 400);
        }

        await this.service.trackInteraction(tenantId, {
            productId,
            interactionType,
            leadId,
            phone,
            sessionId,
            metadata,
        });

        return ApiResponse.success(res, { tracked: true });
    });

    /**
     * POST /recommendations/track/view
     * Track product view
     */
    trackView = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { productId, leadId, phone, sessionId } = req.body;

        if (!productId) {
            throw new AppError('productId required', 400);
        }

        await this.service.trackView(tenantId, productId, { leadId, phone, sessionId });

        return ApiResponse.success(res, { tracked: true });
    });

    /**
     * POST /recommendations/track/cart
     * Track add to cart
     */
    trackAddToCart = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { productId, leadId, phone, quantity } = req.body;

        if (!productId) {
            throw new AppError('productId required', 400);
        }

        await this.service.trackAddToCart(tenantId, productId, { leadId, phone, quantity });

        return ApiResponse.success(res, { tracked: true });
    });

    /**
     * POST /recommendations/track/purchase
     * Track purchase
     */
    trackPurchase = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { productId, leadId, phone, quantity, price } = req.body;

        if (!productId) {
            throw new AppError('productId required', 400);
        }

        await this.service.trackPurchase(tenantId, productId, {
            leadId,
            phone,
            quantity,
            price,
        });

        return ApiResponse.success(res, { tracked: true });
    });

    // ============================================
    // ANALYTICS
    // ============================================

    /**
     * GET /recommendations/analytics/popular
     * Get popular products
     */
    getPopularProducts = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { since, limit } = req.query;

        const products = await this.service.getPopularProducts(tenantId, {
            since: since ? new Date(since as string) : undefined,
            limit: limit ? Number(limit) : undefined,
        });

        return ApiResponse.success(res, products);
    });

    /**
     * GET /recommendations/analytics/conversion/:productId
     * Get conversion stats for a product
     */
    getConversionStats = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { productId } = req.params;

        const stats = await this.service.getProductConversionStats(tenantId, productId);

        return ApiResponse.success(res, stats);
    });

    /**
     * GET /recommendations/analytics/bought-together/:productId
     * Get frequently bought together products
     */
    getFrequentlyBoughtTogether = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { productId } = req.params;
        const { limit } = req.query;

        const productIds = await this.service.getFrequentlyBoughtTogether(
            tenantId,
            productId,
            limit ? Number(limit) : undefined
        );

        return ApiResponse.success(res, { productIds });
    });

    // ============================================
    // LEAD PREFERENCES
    // ============================================

    /**
     * GET /recommendations/preferences/:leadId
     * Get lead preferences
     */
    getLeadPreferences = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { leadId } = req.params;

        const preferences = await this.service.getLeadPreferences(tenantId, leadId);

        return ApiResponse.success(res, preferences);
    });

    /**
     * PUT /recommendations/preferences/:leadId/interests
     * Update lead interests
     */
    updateLeadInterests = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { leadId } = req.params;
        const { interests } = req.body;

        if (!interests || !Array.isArray(interests)) {
            throw new AppError('interests array required', 400);
        }

        await this.service.updateLeadInterests(tenantId, leadId, interests);

        return ApiResponse.success(res, { updated: true });
    });

    /**
     * PUT /recommendations/preferences/:leadId/budget
     * Update lead budget
     */
    updateLeadBudget = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            throw new AppError('Tenant ID required', 400);
        }

        const { leadId } = req.params;
        const { min, max } = req.body;

        if (typeof min !== 'number' || typeof max !== 'number') {
            throw new AppError('min and max required as numbers', 400);
        }

        await this.service.updateLeadBudget(tenantId, leadId, min, max);

        return ApiResponse.success(res, { updated: true });
    });
}
