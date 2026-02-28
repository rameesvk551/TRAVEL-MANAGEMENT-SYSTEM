import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class GearItem extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    GearItem.init(
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
        category_id: DataTypes.UUID,
        sku: DataTypes.STRING,
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        brand: DataTypes.STRING,
        serial_number: DataTypes.STRING,
        ownership_type: DataTypes.STRING,
        vendor_id: DataTypes.UUID,
        condition: DataTypes.STRING,
        warehouse_id: DataTypes.UUID,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'gear_items',
        underscored: true,
        timestamps: false,
    }
);

    return GearItem;
};
