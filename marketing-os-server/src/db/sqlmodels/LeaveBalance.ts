import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class LeaveBalance extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    LeaveBalance.init(
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
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        leave_type_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        opening: DataTypes.DECIMAL,
        accrued: DataTypes.DECIMAL,
        taken: DataTypes.DECIMAL,
        pending: DataTypes.DECIMAL,
    },
    {
        sequelize,
        tableName: 'leave_balances',
        underscored: true,
        timestamps: false,
    }
);

    return LeaveBalance;
};
