import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class SubscriptionModel extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    SubscriptionModel.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenantId: { type: DataTypes.STRING(100), allowNull: false, field: 'tenant_id' },
    customerId: { type: DataTypes.STRING(255), allowNull: false, field: 'customer_id' },
    customerEmail: { type: DataTypes.STRING(255), field: 'customer_email' },
    planName: { type: DataTypes.STRING(100), allowNull: false, field: 'plan_name' },
    planTier: { type: DataTypes.STRING(50), defaultValue: 'basic', field: 'plan_tier' },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'active' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
    billingInterval: { type: DataTypes.STRING(20), defaultValue: 'monthly', field: 'billing_interval' },
    trialStart: { type: DataTypes.DATE, field: 'trial_start' },
    trialEnd: { type: DataTypes.DATE, field: 'trial_end' },
    currentPeriodStart: { type: DataTypes.DATE, field: 'current_period_start' },
    currentPeriodEnd: { type: DataTypes.DATE, field: 'current_period_end' },
    cancelledAt: { type: DataTypes.DATE, field: 'cancelled_at' },
    cancelReason: { type: DataTypes.TEXT, field: 'cancel_reason' },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, {
    sequelize,
    tableName: 'subscriptions',
    timestamps: true,
    underscored: true,
});

    return SubscriptionModel;
};
