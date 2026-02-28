import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class VendorSettlement extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    VendorSettlement.init(
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
        vendor_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        settlement_number: DataTypes.STRING,
        amount: DataTypes.DECIMAL,
        payment_method: DataTypes.STRING,
        payment_reference: DataTypes.STRING,
        payment_date: DataTypes.DATEONLY,
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'vendor_settlements',
        underscored: true,
        timestamps: false,
    }
);

    return VendorSettlement;
};
