import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface LeaveRequestAttributes {
    id: string;
    tenant_id: string;
    employee_id: string;
    leave_type_id: string;
    from_date: Date;
    to_date: Date;
    total_days?: number;
    status: string;
    reason?: string;
    replacement_employee_id?: string;
}

export interface LeaveRequestCreationAttributes extends Optional<LeaveRequestAttributes, 'id' | 'status'> {}

export class LeaveRequest extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes> implements LeaveRequestAttributes {
    public id!: string;
    public tenant_id!: string;
    public employee_id!: string;
    public leave_type_id!: string;
    public from_date!: Date;
    public to_date!: Date;
    public total_days?: number;
    public status!: string;
    public reason?: string;
    public replacement_employee_id?: string;
}

LeaveRequest.init(
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
        from_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        to_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        total_days: DataTypes.DECIMAL,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
        reason: DataTypes.TEXT,
        replacement_employee_id: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'leave_requests',
        underscored: true,
        timestamps: false,
    }
);
