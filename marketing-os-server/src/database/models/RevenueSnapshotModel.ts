import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { RevenueSnapshot, type RevenueSnapshotProps } from '../../../domain/revenue/entities/RevenueSnapshot.js';

export class RevenueSnapshotModel extends Model {
    declare id: string;
    declare tenantId: string;
    declare snapshotDate: Date;
    declare mrr: number;
    declare arr: number;
    declare totalCustomers: number;
    declare activeSubscriptions: number;
    declare newSubscriptions: number;
    declare churnedSubscriptions: number;
    declare expansionRevenue: number;
    declare contractionRevenue: number;
    declare totalRevenue: number;
    declare totalRefunds: number;
    declare netRevenue: number;
    declare metadata: Record<string, any>;
    declare createdAt: Date;

    toEntity(): RevenueSnapshot {
        return RevenueSnapshot.fromPersistence(this.get({ plain: true }) as RevenueSnapshotProps);
    }
}

RevenueSnapshotModel.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenantId: { type: DataTypes.STRING(100), allowNull: false, field: 'tenant_id' },
    snapshotDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'snapshot_date' },
    mrr: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    arr: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    totalCustomers: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_customers' },
    activeSubscriptions: { type: DataTypes.INTEGER, defaultValue: 0, field: 'active_subscriptions' },
    newSubscriptions: { type: DataTypes.INTEGER, defaultValue: 0, field: 'new_subscriptions' },
    churnedSubscriptions: { type: DataTypes.INTEGER, defaultValue: 0, field: 'churned_subscriptions' },
    expansionRevenue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'expansion_revenue' },
    contractionRevenue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'contraction_revenue' },
    totalRevenue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'total_revenue' },
    totalRefunds: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'total_refunds' },
    netRevenue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'net_revenue' },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, {
    sequelize,
    tableName: 'revenue_snapshots',
    timestamps: true,
    updatedAt: false,
    underscored: true,
});
