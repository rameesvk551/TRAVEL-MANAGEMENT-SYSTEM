import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class GearInventory extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    GearInventory.init(
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
        gear_item_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        warehouse_id: DataTypes.UUID,
        status: DataTypes.STRING,
        trip_id: DataTypes.UUID,
        rental_id: DataTypes.UUID,
        assigned_to_user_id: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'gear_inventory',
        underscored: true,
        timestamps: false,
    }
);

    return GearInventory;
};
