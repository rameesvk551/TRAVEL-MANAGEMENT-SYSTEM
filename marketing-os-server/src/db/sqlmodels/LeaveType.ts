import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class LeaveType extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    LeaveType.init(
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
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        is_paid: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        max_days_per_year: DataTypes.DECIMAL,
    },
    {
        sequelize,
        tableName: 'leave_types',
        underscored: true,
        timestamps: false,
    }
);

    return LeaveType;
};
