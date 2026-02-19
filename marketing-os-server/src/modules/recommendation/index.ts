/**
 * Recommendation Module - Smart Product Catalog & AI Recommendations
 * 
 * Features:
 * - Multiple recommendation strategies: interest-based, budget-based, popularity, etc.
 * - Product interaction tracking: views, cart adds, purchases
 * - Lead preference learning
 * - Frequently bought together analysis
 * - Trending products
 * - Upsell and cross-sell recommendations
 * - Conversion analytics
 */

export * from './recommendation.types.js';
export * from './recommendation.model.js';
export * from './recommendation.repository.js';
export * from './recommendation.engine.js';
export * from './recommendation.service.js';
export * from './recommendation.controller.js';
export { createRecommendationRoutes } from './recommendation.routes.js';
