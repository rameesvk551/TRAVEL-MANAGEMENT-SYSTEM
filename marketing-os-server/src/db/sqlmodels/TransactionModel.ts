import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class TransactionModel extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    TransactionModel.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenantId: { type: DataTypes.STRING(100), allowNull: false, field: 'tenant_id' },
    subscriptionId: { type: DataTypes.UUID, field: 'subscription_id' },
    customerId: { type: DataTypes.STRING(255), allowNull: false, field: 'customer_id' },
    type: { type: DataTypes.STRING(30), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
    status: { type: DataTypes.STRING(30), defaultValue: 'completed' },
    paymentMethod: { type: DataTypes.STRING(50), field: 'payment_method' },
    channel: { type: DataTypes.STRING(50) },
    description: { type: DataTypes.TEXT },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, {
    sequelize,
    tableName: 'transactions',
    timestamps: true,
    updatedAt: false,
    underscored: true,
});

    return TransactionModel;
};
