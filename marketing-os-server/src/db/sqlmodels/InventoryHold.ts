import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class InventoryHold extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    InventoryHold.init(
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
        departure_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        booking_id: DataTypes.UUID,
        seat_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        source: DataTypes.STRING,
        source_platform: DataTypes.STRING,
        hold_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        created_by_id: DataTypes.UUID,
        session_id: DataTypes.STRING,
        notes: DataTypes.TEXT,
        released_at: DataTypes.DATE,
        release_reason: DataTypes.STRING,
    },
    {
        sequelize,
        tableName: 'inventory_holds',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

    return InventoryHold;
};
