import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class VendorRate extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    VendorRate.init(
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
        contract_id: DataTypes.UUID,
        rate_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        rate_type: DataTypes.STRING,
        valid_from: DataTypes.DATEONLY,
        valid_until: DataTypes.DATEONLY,
        base_rate: DataTypes.DECIMAL,
        currency: DataTypes.STRING,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'vendor_rates',
        underscored: true,
        timestamps: false,
    }
);

    return VendorRate;
};
