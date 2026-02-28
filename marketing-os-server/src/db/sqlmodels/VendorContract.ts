import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class VendorContract extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    VendorContract.init(
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
        contract_number: DataTypes.STRING,
        version: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        start_date: DataTypes.DATEONLY,
        end_date: DataTypes.DATEONLY,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'draft',
        },
    },
    {
        sequelize,
        tableName: 'vendor_contracts',
        underscored: true,
        timestamps: true,
    }
);

    return VendorContract;
};
