/**
 * Recommendation Models - Sequelize models for product interaction tracking
 */

import { DataTypes, Model, Sequelize } from 'sequelize';
import {
    ProductInteraction,
    ProductInteractionType,
    ProductAnalytics,
} from './recommendation.types.js';

// ============================================
// PRODUCT INTERACTION MODEL
// ============================================

export class ProductInteractionModel extends Model<ProductInteraction> implements ProductInteraction {
    public id!: string;
    public tenantId!: string;
    public leadId?: string;
    public sessionId?: string;
    public phone?: string;
    public productId!: string;
    public interactionType!: ProductInteractionType;
    public metadata?: {
        source?: 'whatsapp' | 'web' | 'api';
        flowId?: string;
        quantity?: number;
        priceAtTime?: number;
    };
    public readonly createdAt!: Date;
}

export function initProductInteractionModel(sequelize: Sequelize): typeof ProductInteractionModel {
    ProductInteractionModel.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tenantId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'tenant_id',
            },
            leadId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'lead_id',
            },
            sessionId: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: 'session_id',
            },
            phone: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            productId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'product_id',
            },
            interactionType: {
                type: DataTypes.ENUM(...Object.values(ProductInteractionType)),
                allowNull: false,
                field: 'interaction_type',
            },
            metadata: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: {},
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'created_at',
            },
        },
        {
            sequelize,
            tableName: 'product_interactions',
            timestamps: false,
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['lead_id'] },
                { fields: ['phone'] },
                { fields: ['product_id'] },
                { fields: ['interaction_type'] },
                { fields: ['created_at'] },
                { fields: ['tenant_id', 'product_id', 'created_at'] },
                { fields: ['tenant_id', 'lead_id', 'created_at'] },
            ],
        }
    );

    return ProductInteractionModel;
}

// ============================================
// PRODUCT ANALYTICS MODEL (Aggregated)
// ============================================

export class ProductAnalyticsModel extends Model<ProductAnalytics> implements ProductAnalytics {
    public productId!: string;
    public tenantId!: string;
    public period!: 'day' | 'week' | 'month';
    public date!: Date;
    public views!: number;
    public addToCarts!: number;
    public purchases!: number;
    public revenue!: number;
    public conversionRate!: number;
}

export function initProductAnalyticsModel(sequelize: Sequelize): typeof ProductAnalyticsModel {
    ProductAnalyticsModel.init(
        {
            productId: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
                field: 'product_id',
            },
            tenantId: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
                field: 'tenant_id',
            },
            period: {
                type: DataTypes.ENUM('day', 'week', 'month'),
                allowNull: false,
                primaryKey: true,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                primaryKey: true,
            },
            views: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            addToCarts: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'add_to_carts',
            },
            purchases: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            revenue: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0,
            },
            conversionRate: {
                type: DataTypes.DECIMAL(5, 4),
                allowNull: false,
                defaultValue: 0,
                field: 'conversion_rate',
            },
        },
        {
            sequelize,
            tableName: 'product_analytics',
            timestamps: false,
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['product_id'] },
                { fields: ['period', 'date'] },
                { fields: ['tenant_id', 'period', 'date'] },
            ],
        }
    );

    return ProductAnalyticsModel;
}

// ============================================
// LEAD PREFERENCES MODEL (Cached preferences)
// ============================================

export interface LeadPreferencesAttributes {
    id: string;
    tenantId: string;
    leadId: string;
    interests: string[];
    categories: string[];
    priceRangeMin?: number;
    priceRangeMax?: number;
    preferredBrands?: string[];
    viewHistory: string[];
    purchaseHistory: string[];
    updatedAt: Date;
}

export class LeadPreferencesModel extends Model<LeadPreferencesAttributes> implements LeadPreferencesAttributes {
    public id!: string;
    public tenantId!: string;
    public leadId!: string;
    public interests!: string[];
    public categories!: string[];
    public priceRangeMin?: number;
    public priceRangeMax?: number;
    public preferredBrands?: string[];
    public viewHistory!: string[];
    public purchaseHistory!: string[];
    public readonly updatedAt!: Date;
}

export function initLeadPreferencesModel(sequelize: Sequelize): typeof LeadPreferencesModel {
    LeadPreferencesModel.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tenantId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'tenant_id',
            },
            leadId: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true,
                field: 'lead_id',
            },
            interests: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                allowNull: false,
                defaultValue: [],
            },
            categories: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                allowNull: false,
                defaultValue: [],
            },
            priceRangeMin: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
                field: 'price_range_min',
            },
            priceRangeMax: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
                field: 'price_range_max',
            },
            preferredBrands: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                allowNull: true,
                defaultValue: [],
                field: 'preferred_brands',
            },
            viewHistory: {
                type: DataTypes.ARRAY(DataTypes.UUID),
                allowNull: false,
                defaultValue: [],
                field: 'view_history',
            },
            purchaseHistory: {
                type: DataTypes.ARRAY(DataTypes.UUID),
                allowNull: false,
                defaultValue: [],
                field: 'purchase_history',
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'updated_at',
            },
        },
        {
            sequelize,
            tableName: 'lead_preferences',
            timestamps: false,
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['lead_id'], unique: true },
            ],
        }
    );

    return LeadPreferencesModel;
}

// ============================================
// INITIALIZE ALL MODELS
// ============================================

export function initRecommendationModels(sequelize: Sequelize): void {
    initProductInteractionModel(sequelize);
    initProductAnalyticsModel(sequelize);
    initLeadPreferencesModel(sequelize);
}
