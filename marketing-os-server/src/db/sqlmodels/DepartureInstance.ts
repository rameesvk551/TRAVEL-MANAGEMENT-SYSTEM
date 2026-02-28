import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class DepartureInstance extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    DepartureInstance.init(
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
        resource_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        departure_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        departure_time: DataTypes.TIME,
        end_date: DataTypes.DATEONLY,
        cutoff_datetime: DataTypes.DATE,
        total_capacity: DataTypes.INTEGER,
        blocked_seats: DataTypes.INTEGER,
        overbooking_limit: DataTypes.INTEGER,
        min_participants: DataTypes.INTEGER,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'scheduled',
        },
        is_guaranteed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        price_override: DataTypes.DECIMAL,
        currency: DataTypes.STRING,
        attributes: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        version: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
    },
    {
        sequelize,
        tableName: 'departure_instances',
        underscored: true,
        timestamps: true,
    }
);

    return DepartureInstance;
};
