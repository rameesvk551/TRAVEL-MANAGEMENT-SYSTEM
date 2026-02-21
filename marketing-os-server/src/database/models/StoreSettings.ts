import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface StoreSettingsAttributes {
    id: string;
    tenant_id: string;
    is_active: boolean;
    welcome_message: string;
    payment_link_template: string;
    checkout_reminder_minutes: number;
    payment_reminder_minutes: number;
    auto_keywords: Record<string, string[]>;
    created_at?: Date;
    updated_at?: Date;
}

export interface StoreSettingsCreationAttributes extends Optional<StoreSettingsAttributes, 'id' | 'is_active' | 'welcome_message' | 'payment_link_template' | 'checkout_reminder_minutes' | 'payment_reminder_minutes' | 'auto_keywords'> { }

export class StoreSettings extends Model<StoreSettingsAttributes, StoreSettingsCreationAttributes> implements StoreSettingsAttributes {
    declare id: string;
    declare tenant_id: string;
    declare is_active: boolean;
    declare welcome_message: string;
    declare payment_link_template: string;
    declare checkout_reminder_minutes: number;
    declare payment_reminder_minutes: number;
    declare auto_keywords: Record<string, string[]>;
    declare created_at?: Date;
    declare updated_at?: Date;
}

StoreSettings.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenant_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        welcome_message: {
            type: DataTypes.TEXT,
            defaultValue: 'Welcome to our store! 🛍️ Type "catalog" to browse our products or "status" to check your order.',
        },
        payment_link_template: {
            type: DataTypes.TEXT,
            defaultValue: '',
        },
        checkout_reminder_minutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 15,
        },
        payment_reminder_minutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 30,
        },
        auto_keywords: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {
                catalog: ['hi', 'hello', 'catalog', 'menu', 'products', 'shop'],
                status: ['status', 'my order', 'order status', 'track'],
            },
        },
    },
    {
        sequelize,
        tableName: 'store_settings',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);
