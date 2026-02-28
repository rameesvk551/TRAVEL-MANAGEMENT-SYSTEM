import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Payment extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    Payment.init(
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
        booking_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        payment_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        method: DataTypes.STRING,
        amount: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        currency: DataTypes.STRING,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
        gateway: DataTypes.STRING,
        gateway_payment_id: DataTypes.STRING,
        gateway_order_id: DataTypes.STRING,
        payment_link_id: DataTypes.STRING,
        payment_link_url: DataTypes.TEXT,
        link_expires_at: DataTypes.DATE,
        link_sent_at: DataTypes.DATE,
        received_by_id: DataTypes.UUID,
        receipt_number: DataTypes.STRING,
        refund_amount: DataTypes.DECIMAL,
        refund_reason: DataTypes.TEXT,
        refunded_at: DataTypes.DATE,
        notes: DataTypes.TEXT,
        completed_at: DataTypes.DATE,
        failed_at: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'payments',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

    return Payment;
};
