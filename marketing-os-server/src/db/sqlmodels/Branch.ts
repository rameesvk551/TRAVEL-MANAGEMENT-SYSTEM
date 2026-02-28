import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Branch extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    Branch.init(
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address_line1: DataTypes.STRING,
        address_line2: DataTypes.STRING,
        city: DataTypes.STRING,
        state: DataTypes.STRING,
        country: DataTypes.STRING,
        postal_code: DataTypes.STRING,
        phone: DataTypes.STRING,
        email: DataTypes.STRING,
        latitude: DataTypes.DECIMAL,
        longitude: DataTypes.DECIMAL,
        timezone: DataTypes.STRING,
        parent_branch_id: DataTypes.UUID,
        manager_id: DataTypes.UUID,
        currency: DataTypes.STRING,
        description: DataTypes.TEXT,
        operating_hours: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        settings: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'branches',
        underscored: true,
        timestamps: true,
    }
);

    return Branch;
};
