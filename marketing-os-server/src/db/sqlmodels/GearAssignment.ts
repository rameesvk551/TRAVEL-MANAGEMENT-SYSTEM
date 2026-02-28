import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class GearAssignment extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    GearAssignment.init(
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
        trip_id: DataTypes.UUID,
        booking_id: DataTypes.UUID,
        gear_item_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: DataTypes.STRING,
        assigned_to_user_id: DataTypes.UUID,
        actual_issue_date: DataTypes.DATE,
        actual_return_date: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'gear_assignments',
        underscored: true,
        timestamps: false,
    }
);

    return GearAssignment;
};
