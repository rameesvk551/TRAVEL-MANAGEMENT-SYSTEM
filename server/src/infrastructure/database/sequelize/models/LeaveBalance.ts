import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface LeaveBalanceAttributes {
    id: string;
    tenant_id: string;
    employee_id: string;
    leave_type_id: string;
    year: number;
    opening?: number;
    accrued?: number;
    taken?: number;
    pending?: number;
}

export interface LeaveBalanceCreationAttributes extends Optional<LeaveBalanceAttributes, 'id'> {}

export class LeaveBalance extends Model<LeaveBalanceAttributes, LeaveBalanceCreationAttributes> implements LeaveBalanceAttributes {
    public id!: string;
    public tenant_id!: string;
    public employee_id!: string;
    public leave_type_id!: string;
    public year!: number;
    public opening?: number;
    public accrued?: number;
    public taken?: number;
    public pending?: number;
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
