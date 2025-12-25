import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface LeaveTypeAttributes {
    id: string;
    tenant_id: string;
    code: string;
    name: string;
    is_paid: boolean;
    max_days_per_year?: number;
}

export interface LeaveTypeCreationAttributes extends Optional<LeaveTypeAttributes, 'id' | 'is_paid'> {}

export class LeaveType extends Model<LeaveTypeAttributes, LeaveTypeCreationAttributes> implements LeaveTypeAttributes {
    public id!: string;
    public tenant_id!: string;
    public code!: string;
    public name!: string;
    public is_paid!: boolean;
    public max_days_per_year?: number;
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
