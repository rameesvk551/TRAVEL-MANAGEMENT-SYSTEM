import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';


export class TransactionModel extends Model {
    declare id: string;
    declare tenantId: string;
    declare subscriptionId: string;
    declare customerId: string;
    declare type: string;
    declare amount: number;
    declare currency: string;
    declare status: string;
    declare paymentMethod: string;
    declare channel: string;
    declare description: string;
    declare metadata: Record<string, any>;
    declare createdAt: Date;


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
