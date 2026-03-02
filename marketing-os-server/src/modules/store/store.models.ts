import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export class StoreProduct extends Model {
    declare public id: string;
    declare public tenant_id: string;
    declare public name: string;
    declare public description?: string;
    declare public price: number;
    declare public currency: string;
    declare public category?: string;
    declare public image_url?: string;
    declare public stock_quantity: number;
    declare public is_active: boolean;
    declare public metadata?: any;
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
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING(3),
            defaultValue: 'USD',
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        image_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        stock_quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'StoreProduct',
        tableName: 'store_products',
        underscored: true,
        timestamps: true,
    }
);

export class StoreOrder extends Model {
    declare public id: string;
    declare public tenant_id: string;
    declare public customer_phone: string;
    declare public customer_name?: string;
    declare public customer_address?: string;
    declare public total_amount: number;
    declare public currency: string;
    declare public status: string;
    declare public payment_status: string;
    declare public payment_reference?: string;
    declare public whatsapp_conversation_id?: string;
}

StoreOrder.init(
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
        customer_phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        customer_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        customer_address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING(3),
            defaultValue: 'USD',
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
            allowNull: false,
        },
        payment_status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
            allowNull: false,
        },
        payment_reference: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        whatsapp_conversation_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'StoreOrder',
        tableName: 'store_orders',
        underscored: true,
        timestamps: true,
    }
);

export class StoreOrderItem extends Model {
    declare public id: string;
    declare public order_id: string;
    declare public product_id: string;
    declare public quantity: number;
    declare public unit_price: number;
    declare public subtotal: number;
    declare public Product?: StoreProduct; // For association include
}

StoreOrderItem.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        order_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        unit_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        subtotal: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'StoreOrderItem',
        tableName: 'store_order_items',
        underscored: true,
        timestamps: true,
    }
);

// Define Associations
StoreOrder.hasMany(StoreOrderItem, {
    sourceKey: 'id',
    foreignKey: 'order_id',
    as: 'items',
});
StoreOrderItem.belongsTo(StoreOrder, {
    targetKey: 'id',
    foreignKey: 'order_id',
});

StoreProduct.hasMany(StoreOrderItem, {
    sourceKey: 'id',
    foreignKey: 'product_id',
});
StoreOrderItem.belongsTo(StoreProduct, {
    targetKey: 'id',
    foreignKey: 'product_id',
    as: 'Product', // Use pascal case for standard Sequelize include parsing
});
