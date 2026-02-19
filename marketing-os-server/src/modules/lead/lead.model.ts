/**
 * Lead module Sequelize models.
 */

import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import type { LeadStatus, LeadSource, LeadCollectedData, BudgetRange, LeadActivityType } from './lead.types.js';

interface LeadAttributes {
    id: string;
    tenant_id: string;
    phone: string;
    name?: string;
    email?: string;
    status: LeadStatus;
    source: LeadSource;
    assigned_to?: string;
    tags: string[];
    collected_data: LeadCollectedData;
    interest_categories: string[];
    budget_range?: BudgetRange;
    location?: string;
    score: number;
    last_message_at?: Date;
    last_order_at?: Date;
    total_orders: number;
    total_spent: number;
    first_contact_at: Date;
    converted_at?: Date;
    notes?: string;
    custom_fields: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

interface LeadCreationAttributes extends Optional<LeadAttributes, 
    'id' | 'name' | 'email' | 'assigned_to' | 'tags' | 'collected_data' | 
    'interest_categories' | 'budget_range' | 'location' | 'score' | 
    'last_message_at' | 'last_order_at' | 'total_orders' | 'total_spent' |
    'converted_at' | 'notes' | 'custom_fields' | 'created_at' | 'updated_at'
> {}

export class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
    declare id: string;
    declare tenant_id: string;
    declare phone: string;
    declare name?: string;
    declare email?: string;
    declare status: LeadStatus;
    declare source: LeadSource;
    declare assigned_to?: string;
    declare tags: string[];
    declare collected_data: LeadCollectedData;
    declare interest_categories: string[];
    declare budget_range?: BudgetRange;
    declare location?: string;
    declare score: number;
    declare last_message_at?: Date;
    declare last_order_at?: Date;
    declare total_orders: number;
    declare total_spent: number;
    declare first_contact_at: Date;
    declare converted_at?: Date;
    declare notes?: string;
    declare custom_fields: Record<string, any>;
    declare created_at: Date;
    declare updated_at: Date;
}

interface LeadActivityAttributes {
    id: string;
    lead_id: string;
    tenant_id: string;
    type: LeadActivityType;
    description: string;
    metadata?: Record<string, any>;
    performed_by?: string;
    created_at: Date;
}

interface LeadActivityCreationAttributes extends Optional<LeadActivityAttributes, 
    'id' | 'metadata' | 'performed_by' | 'created_at'
> {}

export class LeadActivity extends Model<LeadActivityAttributes, LeadActivityCreationAttributes> implements LeadActivityAttributes {
    declare id: string;
    declare lead_id: string;
    declare tenant_id: string;
    declare type: LeadActivityType;
    declare description: string;
    declare metadata?: Record<string, any>;
    declare performed_by?: string;
    declare created_at: Date;
}

export function initLeadModels(sequelize: Sequelize) {
    Lead.init(
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
            name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM('new', 'contacted', 'qualified', 'interested', 'negotiating', 'converted', 'lost'),
                defaultValue: 'new',
            },
            source: {
                type: DataTypes.ENUM('whatsapp', 'website', 'referral', 'import', 'manual'),
                defaultValue: 'whatsapp',
            },
            assigned_to: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            tags: {
                type: DataTypes.JSONB,
                defaultValue: [],
            },
            collected_data: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            interest_categories: {
                type: DataTypes.JSONB,
                defaultValue: [],
            },
            budget_range: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            location: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            score: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            last_message_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            last_order_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            total_orders: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            total_spent: {
                type: DataTypes.DECIMAL(12, 2),
                defaultValue: 0,
            },
            first_contact_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            converted_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            custom_fields: {
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
            tableName: 'leads',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                { fields: ['tenant_id'] },
                { fields: ['phone'] },
                { fields: ['tenant_id', 'phone'], unique: true },
                { fields: ['status'] },
                { fields: ['source'] },
                { fields: ['assigned_to'] },
                { fields: ['score'] },
                { fields: ['created_at'] },
            ],
        }
    );

    LeadActivity.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            lead_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            performed_by: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            tableName: 'lead_activities',
            timestamps: false,
            indexes: [
                { fields: ['lead_id'] },
                { fields: ['tenant_id'] },
                { fields: ['type'] },
                { fields: ['created_at'] },
            ],
        }
    );

    // Associations
    Lead.hasMany(LeadActivity, { foreignKey: 'lead_id', as: 'activities' });
    LeadActivity.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
}
