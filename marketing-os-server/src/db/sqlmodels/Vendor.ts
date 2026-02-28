import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Vendor extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    Vendor.init(
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
        branch_id: DataTypes.UUID,
        legal_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        display_name: DataTypes.STRING,
        vendor_type: DataTypes.STRING,
        vendor_code: DataTypes.STRING,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'active',
        },
        primary_contact_name: DataTypes.STRING,
        primary_contact_phone: DataTypes.STRING,
        primary_contact_email: DataTypes.STRING,
        bank_name: DataTypes.STRING,
        bank_account_number: DataTypes.STRING,
        tax_id: DataTypes.STRING,
    },
    {
        sequelize,
        tableName: 'vendors',
        underscored: true,
        timestamps: true,
    }
);

    return Vendor;
};
