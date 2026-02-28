import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class GearWarehouse extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    GearWarehouse.init(
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
        code: DataTypes.STRING,
        type: DataTypes.STRING,
        city: DataTypes.STRING,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'gear_warehouses',
        underscored: true,
        timestamps: false,
    }
);

    return GearWarehouse;
};
