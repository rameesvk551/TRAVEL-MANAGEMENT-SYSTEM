import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class VendorPayable extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    VendorPayable.init(
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
        assignment_id: DataTypes.UUID,
        payable_number: DataTypes.STRING,
        net_payable: DataTypes.DECIMAL,
        due_date: DataTypes.DATEONLY,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
        amount_settled: DataTypes.DECIMAL,
    },
    {
        sequelize,
        tableName: 'vendor_payables',
        underscored: true,
        timestamps: false,
    }
);

    return VendorPayable;
};
