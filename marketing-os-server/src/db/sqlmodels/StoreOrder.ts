import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class StoreOrder extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
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
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        customer_name: DataTypes.STRING(255),
        delivery_address: DataTypes.TEXT,
        items: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        total_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        currency: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'INR',
        },
        status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'pending',
        },
        payment_status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'unpaid',
        },
        payment_link: DataTypes.TEXT,
        notes: DataTypes.TEXT,
        conversation_id: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'store_orders',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

    return StoreOrder;
};
