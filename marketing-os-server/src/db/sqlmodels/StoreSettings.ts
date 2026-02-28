import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class StoreSettings extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
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

    return StoreSettings;
};
