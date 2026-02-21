import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface StoreProductAttributes {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    image_url?: string;
    category?: string;
    is_enabled: boolean;
    is_featured: boolean;
    sort_order: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface StoreProductCreationAttributes extends Optional<StoreProductAttributes, 'id' | 'currency' | 'is_enabled' | 'is_featured' | 'sort_order'> { }

export class StoreProduct extends Model<StoreProductAttributes, StoreProductCreationAttributes> implements StoreProductAttributes {
    declare id: string;
    declare tenant_id: string;
    declare name: string;
    declare description?: string;
    declare price: number;
    declare currency: string;
    declare image_url?: string;
    declare category?: string;
    declare is_enabled: boolean;
    declare is_featured: boolean;
    declare sort_order: number;
    declare created_at?: Date;
    declare updated_at?: Date;
}

StoreProduct.init(
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
        description: DataTypes.TEXT,
        price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'INR',
        },
        image_url: DataTypes.TEXT,
        category: DataTypes.STRING(100),
        is_enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        is_featured: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        sort_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'store_products',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);
