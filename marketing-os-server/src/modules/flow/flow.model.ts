/**
 * Flow module Sequelize models.
 */

import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import type { FlowTriggerType, FlowNode, CartItem } from './flow.types.js';

// ============================
// FLOW MODEL
// ============================

interface FlowAttributes {
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

interface FlowCreationAttributes extends Optional<FlowAttributes,
    'id' | 'description' | 'trigger_keywords' | 'trigger_type' | 'is_active' |
    'is_default' | 'priority' | 'metadata' | 'created_at' | 'updated_at'
> {}

export class Flow extends Model<FlowAttributes, FlowCreationAttributes> implements FlowAttributes {
    declare id: string;
    declare tenant_id: string;
    declare name: string;
    declare description?: string;
    declare trigger_keywords: string[];
    declare trigger_type: FlowTriggerType;
    declare is_active: boolean;
    declare is_default: boolean;
    declare priority: number;
    declare nodes: FlowNode[];
    declare start_node_id: string;
    declare metadata: Record<string, any>;
    declare created_at: Date;
    declare updated_at: Date;
}

// ============================
// FLOW SESSION MODEL
// ============================

interface FlowSessionAttributes {
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

interface FlowSessionCreationAttributes extends Optional<FlowSessionAttributes,
    'id' | 'collected_data' | 'cart_items' | 'selected_product_id' | 'variables' |
    'started_at' | 'last_activity_at' | 'completed_at' | 'is_active'
> {}

export class FlowSession extends Model<FlowSessionAttributes, FlowSessionCreationAttributes> implements FlowSessionAttributes {
    declare id: string;
    declare tenant_id: string;
    declare phone: string;
    declare flow_id: string;
    declare current_node_id: string;
    declare collected_data: Record<string, any>;
    declare cart_items: CartItem[];
    declare selected_product_id?: string;
    declare variables: Record<string, any>;
    declare started_at: Date;
    declare last_activity_at: Date;
    declare completed_at?: Date;
    declare is_active: boolean;
}

// ============================
// FLOW ANALYTICS MODEL
// ============================

interface FlowAnalyticsAttributes {
    id: string;
    tenant_id: string;
    flow_id: string;
    node_id: string;
    event_type: 'enter' | 'exit' | 'timeout' | 'error';
    phone?: string;
    metadata?: Record<string, any>;
    created_at: Date;
}

interface FlowAnalyticsCreationAttributes extends Optional<FlowAnalyticsAttributes,
    'id' | 'phone' | 'metadata' | 'created_at'
> {}

export class FlowAnalytics extends Model<FlowAnalyticsAttributes, FlowAnalyticsCreationAttributes> implements FlowAnalyticsAttributes {
    declare id: string;
    declare tenant_id: string;
    declare flow_id: string;
    declare node_id: string;
    declare event_type: 'enter' | 'exit' | 'timeout' | 'error';
    declare phone?: string;
    declare metadata?: Record<string, any>;
    declare created_at: Date;
}

// ============================
// INIT FUNCTION
// ============================

export function initFlowModels(sequelize: Sequelize) {
    Flow.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            trigger_keywords: {
                type: DataTypes.JSONB,
                defaultValue: [],
            },
            trigger_type: {
                type: DataTypes.ENUM('keyword', 'first_message', 'fallback', 'manual', 'event'),
                defaultValue: 'keyword',
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            is_default: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            priority: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            nodes: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: [],
            },
            start_node_id: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            tableName: 'flows',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['is_active'] },
                { fields: ['trigger_type'] },
                { fields: ['is_default'] },
                { fields: ['priority'] },
            ],
        }
    );

    FlowSession.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            flow_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            current_node_id: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            collected_data: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            cart_items: {
                type: DataTypes.JSONB,
                defaultValue: [],
            },
            selected_product_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            variables: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            started_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            last_activity_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            completed_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            sequelize,
            tableName: 'flow_sessions',
            timestamps: false,
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['phone'] },
                { fields: ['tenant_id', 'phone'], unique: false },
                { fields: ['flow_id'] },
                { fields: ['is_active'] },
                { fields: ['last_activity_at'] },
            ],
        }
    );

    FlowAnalytics.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            flow_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            node_id: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            event_type: {
                type: DataTypes.ENUM('enter', 'exit', 'timeout', 'error'),
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            tableName: 'flow_analytics',
            timestamps: false,
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['flow_id'] },
                { fields: ['node_id'] },
                { fields: ['created_at'] },
            ],
        }
    );

    // Associations
    Flow.hasMany(FlowSession, { foreignKey: 'flow_id', as: 'sessions' });
    FlowSession.belongsTo(Flow, { foreignKey: 'flow_id', as: 'flow' });

    Flow.hasMany(FlowAnalytics, { foreignKey: 'flow_id', as: 'analytics' });
    FlowAnalytics.belongsTo(Flow, { foreignKey: 'flow_id', as: 'flow' });
}
